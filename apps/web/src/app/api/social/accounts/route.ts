/**
 * Social Accounts API
 * GET — List connected accounts
 * POST — Initiate OAuth flow (returns auth URL)
 * DELETE — Disconnect an account
 * 
 * Auth: Tries server-side cookie auth first, falls back to x-user-id header
 * (client sends userId from its browser-side Supabase session)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAccounts, disconnectAccount } from '@/lib/social/social-engine';
import { getAdapter, type SocialPlatform } from '@/lib/social/platform-adapter';

async function getCurrentUserId(request: Request): Promise<string | null> {
    // 1. Try server-side cookie auth
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) return user.id;
    } catch {
        // Cookie auth failed — try fallback
    }

    // 2. Fallback: client sends userId from browser session
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
        const productId = url.searchParams.get('productId') || undefined;

        const accounts = await getAccounts(userId, productId);

        // Strip sensitive data
        const safeAccounts = accounts.map(a => ({
            id: a.id,
            platform: a.platform,
            platformUsername: a.platformUsername,
            platformDisplayName: a.platformDisplayName,
            platformAvatarUrl: a.platformAvatarUrl,
            isActive: a.isActive,
            tokenExpiresAt: a.tokenExpiresAt,
            productId: a.productId,
        }));

        return NextResponse.json({ accounts: safeAccounts });
    } catch (error) {
        console.error('[Social API] Get accounts error:', error);
        return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { platform, productId } = await request.json();
        if (!platform) {
            return NextResponse.json({ error: 'Platform required' }, { status: 400 });
        }

        const adapter = getAdapter(platform as SocialPlatform);
        // Encode productId in state: userId:timestamp or userId:timestamp:productId
        const state = productId
            ? `${userId}:${Date.now()}:${productId}`
            : `${userId}:${Date.now()}`;
        const authUrl = adapter.getAuthUrl(state);

        return NextResponse.json({ authUrl, state });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Social API] Auth URL error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { accountId } = await request.json();
        if (!accountId) {
            return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
        }

        await disconnectAccount(userId, accountId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Social API] Disconnect error:', error);
        return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }
}
