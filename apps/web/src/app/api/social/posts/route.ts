/**
 * Social Posts API (Unified)
 * GET — List posts with filters (scoped by ownerType/ownerId)
 * POST — Create a new draft (with optional product scoping)
 * PATCH — Update a post (edit content, schedule, etc.)
 * DELETE — Delete a post
 * 
 * Supports both user-level and product-level posts via ownerType/ownerId params.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDraft, getPosts, updatePost } from '@/lib/social/social-engine';
import type { SocialPlatform } from '@/lib/social/platform-adapter';

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
 * Resolve productId from unified owner params.
 * If ownerType=product, ownerId is the productId.
 * Falls back to legacy productId param for backward compatibility.
 */
function resolveProductId(url: URL, body?: Record<string, unknown>): string | undefined {
    const ownerType = (body?.ownerType as string) || url.searchParams.get('ownerType');
    const ownerId = (body?.ownerId as string) || url.searchParams.get('ownerId');

    if (ownerType === 'product' && ownerId) return ownerId;

    // Legacy fallback
    const legacyProductId = (body?.productId as string) || url.searchParams.get('productId');
    return legacyProductId || undefined;
}

export async function GET(request: Request) {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const status = url.searchParams.get('status') || undefined;
        const platform = url.searchParams.get('platform') || undefined;
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const productId = resolveProductId(url);

        const result = await getPosts(userId, { status, platform, limit, offset, productId });

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Posts API] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { content, platform, hashtags, scheduledAt, socialAccountId, mediaUrls } = body;
        const url = new URL(request.url);
        const productId = resolveProductId(url, body);

        if (!content || !platform) {
            return NextResponse.json({ error: 'Content and platform required' }, { status: 400 });
        }

        const post = await createDraft(userId, platform as SocialPlatform, content, {
            hashtags,
            mediaUrls,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
            socialAccountId,
            sourceType: 'manual',
            productId,
        });

        return NextResponse.json({ post }, { status: 201 });
    } catch (error) {
        console.error('[Posts API] Create error:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { postId, ownerType, ownerId, ...updates } = body;

        if (!postId) {
            return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
        }

        const post = await updatePost(userId, postId, updates);
        return NextResponse.json({ post });
    } catch (error) {
        console.error('[Posts API] Update error:', error);
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { postId } = await request.json();
        if (!postId) {
            return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
        }

        const { createClient: createServiceClient } = await import('@supabase/supabase-js');
        const supabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error } = await supabase
            .from('social_posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', userId);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Posts API] Delete error:', error);
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }
}
