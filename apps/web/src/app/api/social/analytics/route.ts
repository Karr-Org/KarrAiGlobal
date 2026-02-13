/**
 * Social Analytics API (Unified)
 * GET — Fetch post performance data, patterns, and AI recommendations
 * POST — Trigger analytics collection for all published posts
 * 
 * Supports both user-level and product-level analytics via ownerType/ownerId params.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { collectAnalytics } from '@/lib/social/social-engine';
import { analyzeContentPatterns } from '@/lib/social/content-intelligence';

function getServiceSupabase() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

async function getCurrentUserId(request: Request): Promise<string | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) return user.id;
    } catch { /* cookie auth failed */ }
    const headerUserId = request.headers.get('x-user-id');
    if (headerUserId) return headerUserId;
    return null;
}

/**
 * Resolve productId from unified owner params or legacy productId param.
 */
function resolveProductId(url: URL): string | undefined {
    const ownerType = url.searchParams.get('ownerType');
    const ownerId = url.searchParams.get('ownerId');
    if (ownerType === 'product' && ownerId) return ownerId;
    return url.searchParams.get('productId') || undefined;
}

export async function GET(request: Request) {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const postId = url.searchParams.get('postId');
        const view = url.searchParams.get('view') || 'overview';
        const productId = resolveProductId(url);

        const supabase = getServiceSupabase();

        if (postId) {
            const { data: analytics } = await supabase
                .from('social_analytics')
                .select('*')
                .eq('post_id', postId)
                .order('snapshot_at', { ascending: true });

            return NextResponse.json({ analytics: analytics || [] });
        }

        if (view === 'patterns') {
            let query = supabase
                .from('content_patterns')
                .select('*')
                .eq('user_id', userId)
                .order('recommendation_score', { ascending: false });

            if (productId) {
                query = query.eq('product_id', productId);
            } else {
                query = query.is('product_id', null);
            }

            const { data: patterns } = await query;
            return NextResponse.json({ patterns: patterns || [] });
        }

        // Overview: aggregate stats — scoped by owner
        let postsQuery = supabase
            .from('social_posts')
            .select(`
                id, content, platform, published_at, status,
                social_analytics(impressions, likes, comments, shares, engagement_rate)
            `)
            .eq('user_id', userId)
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .limit(50);

        if (productId) {
            postsQuery = postsQuery.eq('product_id', productId);
        } else {
            postsQuery = postsQuery.is('product_id', null);
        }

        const { data: posts } = await postsQuery;

        const allAnalytics = (posts || []).flatMap((p: Record<string, unknown>) => {
            const analytics = p.social_analytics;
            return Array.isArray(analytics) ? analytics : [];
        });

        const totalImpressions = allAnalytics.reduce((sum: number, a: Record<string, unknown>) => sum + ((a.impressions as number) || 0), 0);
        const totalLikes = allAnalytics.reduce((sum: number, a: Record<string, unknown>) => sum + ((a.likes as number) || 0), 0);
        const totalComments = allAnalytics.reduce((sum: number, a: Record<string, unknown>) => sum + ((a.comments as number) || 0), 0);
        const totalShares = allAnalytics.reduce((sum: number, a: Record<string, unknown>) => sum + ((a.shares as number) || 0), 0);

        let aiInsights = null;
        const postsForAnalysis = (posts || [])
            .filter((p: Record<string, unknown>) => p.published_at)
            .map((p: Record<string, unknown>) => {
                const analytics = Array.isArray(p.social_analytics) ? p.social_analytics : [];
                const latest = analytics[analytics.length - 1] || {};
                return {
                    content: p.content as string,
                    publishedAt: p.published_at as string,
                    likes: (latest as Record<string, number>).likes || 0,
                    comments: (latest as Record<string, number>).comments || 0,
                    shares: (latest as Record<string, number>).shares || 0,
                    impressions: (latest as Record<string, number>).impressions || 0,
                };
            });

        if (postsForAnalysis.length >= 3) {
            aiInsights = await analyzeContentPatterns(postsForAnalysis);
        }

        return NextResponse.json({
            overview: {
                totalPosts: posts?.length || 0,
                totalImpressions,
                totalLikes,
                totalComments,
                totalShares,
                avgEngagementRate: allAnalytics.length > 0
                    ? allAnalytics.reduce((sum: number, a: Record<string, unknown>) => sum + ((a.engagement_rate as number) || 0), 0) / allAnalytics.length
                    : 0,
            },
            posts: posts || [],
            aiInsights,
        });
    } catch (error) {
        console.error('[Analytics API] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const collected = await collectAnalytics(userId);
        return NextResponse.json({
            success: true,
            collected,
            message: `Collected analytics for ${collected} posts`,
        });
    } catch (error) {
        console.error('[Analytics API] Collection error:', error);
        return NextResponse.json({ error: 'Failed to collect analytics' }, { status: 500 });
    }
}
