/**
 * Social Publish API (Unified)
 * POST — Publish a post now to the connected platform
 * 
 * Works for both user-level and product-level posts. The post itself already
 * has user_id and product_id, so no additional owner params needed here.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishPost } from '@/lib/social/social-engine';

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

export async function POST(request: Request) {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { postId } = await request.json();
        if (!postId) {
            return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
        }

        const post = await publishPost(postId);

        return NextResponse.json({
            success: true,
            post: {
                id: post.id,
                status: post.status,
                platformPostId: post.platformPostId,
                platformPostUrl: post.platformPostUrl,
                publishedAt: post.publishedAt,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Publishing failed';
        console.error('[Publish API] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
