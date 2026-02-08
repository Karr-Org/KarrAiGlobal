/**
 * Social Posts API
 * GET — List posts with filters
 * POST — Create a new draft
 * PATCH — Update a post (edit content, schedule, etc.)
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

        const result = await getPosts(userId, { status, platform, limit, offset });

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

        if (!content || !platform) {
            return NextResponse.json({ error: 'Content and platform required' }, { status: 400 });
        }

        const post = await createDraft(userId, platform as SocialPlatform, content, {
            hashtags,
            mediaUrls,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
            socialAccountId,
            sourceType: 'manual',
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
        const { postId, ...updates } = body;

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
