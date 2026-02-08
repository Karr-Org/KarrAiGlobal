// ============================================
// MARKETING ANALYTICS & LEARNING API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch analytics
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');
        const type = searchParams.get('type') || 'overview';
        const days = parseInt(searchParams.get('days') || '30');

        if (!productId) {
            return NextResponse.json({ error: 'product_id required' }, { status: 400 });
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        switch (type) {
            case 'overview': {
                // Get aggregate metrics
                const [socialMetrics, blogMetrics, recentReports] = await Promise.all([
                    // Social posts performance
                    supabase
                        .from('ai_social_posts')
                        .select('platform, impressions, engagements, likes, comments, shares, clicks')
                        .eq('product_id', productId)
                        .eq('status', 'published')
                        .gte('published_at', startDate.toISOString()),

                    // Blog performance
                    supabase
                        .from('blog_posts')
                        .select('views, unique_visitors, shares, comments_count')
                        .eq('product_id', productId)
                        .eq('status', 'published'),

                    // Recent daily reports
                    supabase
                        .from('marketing_daily_reports')
                        .select('*')
                        .eq('product_id', productId)
                        .order('report_date', { ascending: false })
                        .limit(7)
                ]);

                // Aggregate social metrics
                const socialData = socialMetrics.data || [];
                const totalImpressions = socialData.reduce((sum, p) => sum + (p.impressions || 0), 0);
                const totalEngagements = socialData.reduce((sum, p) => sum + (p.engagements || 0), 0);
                const totalClicks = socialData.reduce((sum, p) => sum + (p.clicks || 0), 0);

                // Aggregate blog metrics
                const blogData = blogMetrics.data || [];
                const totalViews = blogData.reduce((sum, p) => sum + (p.views || 0), 0);
                const totalUniqueVisitors = blogData.reduce((sum, p) => sum + (p.unique_visitors || 0), 0);

                // Platform breakdown
                const platformBreakdown: Record<string, any> = {};
                for (const post of socialData) {
                    if (!platformBreakdown[post.platform]) {
                        platformBreakdown[post.platform] = {
                            posts: 0,
                            impressions: 0,
                            engagements: 0,
                            clicks: 0
                        };
                    }
                    platformBreakdown[post.platform].posts++;
                    platformBreakdown[post.platform].impressions += post.impressions || 0;
                    platformBreakdown[post.platform].engagements += post.engagements || 0;
                    platformBreakdown[post.platform].clicks += post.clicks || 0;
                }

                return NextResponse.json({
                    overview: {
                        social: {
                            total_posts: socialData.length,
                            total_impressions: totalImpressions,
                            total_engagements: totalEngagements,
                            total_clicks: totalClicks,
                            avg_engagement_rate: totalImpressions > 0 ? (totalEngagements / totalImpressions * 100).toFixed(2) : 0
                        },
                        blog: {
                            total_posts: blogData.length,
                            total_views: totalViews,
                            total_unique_visitors: totalUniqueVisitors
                        },
                        platform_breakdown: platformBreakdown
                    },
                    recent_reports: recentReports.data
                });
            }

            case 'top_content': {
                const [topSocial, topBlogs] = await Promise.all([
                    supabase
                        .from('ai_social_posts')
                        .select('id, platform, content, impressions, engagements, published_at')
                        .eq('product_id', productId)
                        .eq('status', 'published')
                        .order('engagements', { ascending: false })
                        .limit(10),

                    supabase
                        .from('blog_posts')
                        .select('id, title, slug, views, shares, published_at')
                        .eq('product_id', productId)
                        .eq('status', 'published')
                        .order('views', { ascending: false })
                        .limit(10)
                ]);

                return NextResponse.json({
                    top_social_posts: topSocial.data,
                    top_blog_posts: topBlogs.data
                });
            }

            case 'learnings': {
                const { data: learnings } = await supabase
                    .from('content_learnings')
                    .select('*')
                    .eq('product_id', productId)
                    .order('confidence', { ascending: false })
                    .limit(20);

                return NextResponse.json({ learnings: learnings || [] });
            }

            case 'llm_citations': {
                const { data: citations } = await supabase
                    .from('llm_citations')
                    .select('*')
                    .eq('product_id', productId)
                    .order('discovered_at', { ascending: false })
                    .limit(50);

                return NextResponse.json({ citations: citations || [] });
            }

            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}

// POST - Record analytics or generate report
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { action, product_id, ...data } = body;

        if (!product_id) {
            return NextResponse.json({ error: 'product_id required' }, { status: 400 });
        }

        // Generate daily report
        if (action === 'generate_report') {
            const today = new Date().toISOString().split('T')[0];

            // Fetch today's data
            const [socialStats, blogStats] = await Promise.all([
                supabase
                    .from('ai_social_posts')
                    .select('*')
                    .eq('product_id', product_id)
                    .eq('status', 'published')
                    .gte('published_at', today),

                supabase
                    .from('blog_posts')
                    .select('*')
                    .eq('product_id', product_id)
                    .eq('status', 'published')
            ]);

            const socialData = socialStats.data || [];
            const blogData = blogStats.data || [];

            // Calculate metrics
            const totalImpressions = socialData.reduce((sum, p) => sum + (p.impressions || 0), 0);
            const totalEngagements = socialData.reduce((sum, p) => sum + (p.engagements || 0), 0);
            const totalClicks = socialData.reduce((sum, p) => sum + (p.clicks || 0), 0);
            const blogViews = blogData.reduce((sum, p) => sum + (p.views || 0), 0);

            // Find top posts
            const topPosts = [...socialData]
                .sort((a, b) => (b.engagements || 0) - (a.engagements || 0))
                .slice(0, 3)
                .map(p => ({
                    id: p.id,
                    platform: p.platform,
                    content_preview: p.content?.substring(0, 100),
                    metric_name: 'engagements',
                    metric_value: p.engagements || 0,
                    published_at: p.published_at
                }));

            // Generate AI insights (simplified - would use Gemini in production)
            const insights = [];
            if (totalEngagements > 0) {
                const avgEngagement = totalEngagements / (socialData.length || 1);
                insights.push(`Average engagement per post: ${avgEngagement.toFixed(1)}`);
            }
            if (topPosts.length > 0) {
                insights.push(`Top performing platform: ${topPosts[0]?.platform}`);
            }

            // Save report
            const { data: report, error } = await supabase
                .from('marketing_daily_reports')
                .upsert({
                    product_id,
                    report_date: today,
                    total_impressions: totalImpressions,
                    total_engagements: totalEngagements,
                    total_clicks: totalClicks,
                    blog_views: blogViews,
                    top_posts: topPosts,
                    ai_insights: insights,
                    strategy_recommendations: [
                        'Continue posting at peak engagement times',
                        'Experiment with more thread-based content',
                        'Create content around trending topics'
                    ]
                }, {
                    onConflict: 'product_id,report_date'
                })
                .select()
                .single();

            if (error) throw error;

            return NextResponse.json({ report });
        }

        // Record LLM citation
        if (action === 'record_citation') {
            const { data: citation, error } = await supabase
                .from('llm_citations')
                .insert({
                    product_id,
                    ...data
                })
                .select()
                .single();

            if (error) throw error;

            return NextResponse.json({ citation });
        }

        // Record learning
        if (action === 'record_learning') {
            const { data: learning, error } = await supabase
                .from('content_learnings')
                .insert({
                    product_id,
                    ...data
                })
                .select()
                .single();

            if (error) throw error;

            return NextResponse.json({ learning });
        }

        // Update social post analytics
        if (action === 'update_post_analytics') {
            const { post_id, ...metrics } = data;

            const { data: post, error } = await supabase
                .from('ai_social_posts')
                .update(metrics)
                .eq('id', post_id)
                .select()
                .single();

            if (error) throw error;

            return NextResponse.json({ post });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error recording analytics:', error);
        return NextResponse.json({ error: 'Failed to record analytics' }, { status: 500 });
    }
}
