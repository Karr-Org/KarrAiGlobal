/**
 * Social Accounts API (Unified)
 * GET — List connected accounts (scoped by ownerType/ownerId)
 * POST — Initiate OAuth flow (returns auth URL)
 * DELETE — Disconnect an account
 * 
 * Supports both user-level and product-level accounts via ownerType/ownerId params.
 * Auth: Tries server-side cookie auth first, falls back to x-user-id header.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAccounts, disconnectAccount } from '@/lib/social/social-engine';
import { getAdapter, type SocialPlatform } from '@/lib/social/platform-adapter';
import { createSignedState } from '@/lib/utils/oauth-state';
import { validateConnectSocial } from '@/lib/validations';

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

/**
 * Resolve productId from unified owner params or legacy productId param.
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
        const productId = resolveProductId(url);

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

        const body = await request.json();
        const url = new URL(request.url);
        const productId = resolveProductId(url, body);

        // Validate platform name
        const validation = validateConnectSocial({ ...body, productId });
        if (!validation.success) return validation.response;

        const { platform } = validation.data;

        const adapter = getAdapter(platform as SocialPlatform);
        // Use HMAC-signed state to prevent CSRF
        const state = createSignedState(userId, productId);
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
