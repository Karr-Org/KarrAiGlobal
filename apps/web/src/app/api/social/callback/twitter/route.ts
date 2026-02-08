/**
 * X (Twitter) OAuth Callback
 * Handles the redirect from Twitter after user authorizes the app
 * Twitter uses OAuth 2.0 with PKCE
 * Supports both user-level and product-level accounts via state parameter
 */

import { NextResponse } from 'next/server';
import { getAdapter } from '@/lib/social/platform-adapter';
import { saveAccount } from '@/lib/social/social-engine';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Parse state: userId:timestamp or userId:timestamp:productId
    const stateParts = state?.split(':') || [];
    const userId = stateParts[0];
    const productId = stateParts.length >= 3 ? stateParts[2] : undefined;

    const redirectBase = productId
        ? `/marketing?productId=${productId}&tab=accounts`
        : '/social';

    if (error) {
        console.error('[Twitter Callback] Auth error:', error);
        return NextResponse.redirect(
            new URL(`${redirectBase}${redirectBase.includes('?') ? '&' : '?'}error=${encodeURIComponent(error)}`, request.url)
        );
    }

    if (!code || !state) {
        return NextResponse.redirect(
            new URL(`${redirectBase}${redirectBase.includes('?') ? '&' : '?'}error=No authorization code received`, request.url)
        );
    }

    if (!userId) {
        return NextResponse.redirect(
            new URL(`${redirectBase}${redirectBase.includes('?') ? '&' : '?'}error=Invalid state parameter`, request.url)
        );
    }

    try {
        const adapter = getAdapter('twitter');

        // Exchange code for tokens (Twitter PKCE needs state for verifier lookup)
        const tokens = await adapter.exchangeCode(code, state);

        // Get user profile from Twitter
        const profile = await adapter.getProfile(tokens.accessToken);

        // Save to database (with optional productId)
        await saveAccount(userId, 'twitter', {
            platformUserId: profile.platformUserId,
            platformUsername: profile.username,
            platformDisplayName: profile.displayName,
            platformAvatarUrl: profile.avatarUrl,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiresAt: tokens.expiresAt,
            scopes: tokens.scope?.split(' '),
        }, productId);

        console.log('[Twitter Callback] Account connected successfully for user:', userId, productId ? `(product: ${productId})` : '(user-level)');

        const separator = redirectBase.includes('?') ? '&' : '?';
        return NextResponse.redirect(
            new URL(`${redirectBase}${separator}connected=twitter`, request.url)
        );
    } catch (err) {
        console.error('[Twitter Callback] Failed:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        const separator = redirectBase.includes('?') ? '&' : '?';
        return NextResponse.redirect(
            new URL(`${redirectBase}${separator}error=${encodeURIComponent(message)}`, request.url)
        );
    }
}
