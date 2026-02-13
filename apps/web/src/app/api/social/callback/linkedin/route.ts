/**
 * LinkedIn OAuth Callback
 * Handles the redirect from LinkedIn after user authorizes the app
 * Exchanges code for tokens and saves the account
 * Supports both user-level and product-level accounts via state parameter
 */

import { NextResponse } from 'next/server';
import { getAdapter } from '@/lib/social/platform-adapter';
import { saveAccount } from '@/lib/social/social-engine';
import { verifySignedState } from '@/lib/utils/oauth-state';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Verify and parse HMAC-signed state
    const parsedState = state ? verifySignedState(state) : null;
    const userId = parsedState?.userId;
    const productId = parsedState?.productId;

    // Determine redirect base (product-level → marketing page, user-level → social page)
    const redirectBase = productId
        ? `/marketing?productId=${productId}&tab=accounts`
        : '/social';

    // Handle errors from LinkedIn
    if (error) {
        console.error('[LinkedIn Callback] Auth error:', error, errorDescription);
        return NextResponse.redirect(
            new URL(`${redirectBase}&error=${encodeURIComponent(errorDescription || error)}`, request.url)
        );
    }

    if (!code) {
        return NextResponse.redirect(
            new URL(`${redirectBase}&error=No authorization code received`, request.url)
        );
    }

    if (!parsedState || !userId) {
        const separator = redirectBase.includes('?') ? '&' : '?';
        return NextResponse.redirect(
            new URL(`${redirectBase}${separator}error=Invalid or tampered state parameter`, request.url)
        );
    }

    try {
        const adapter = getAdapter('linkedin');

        // Exchange code for tokens
        const tokens = await adapter.exchangeCode(code);

        // Get user profile from LinkedIn
        const profile = await adapter.getProfile(tokens.accessToken);

        // Save to database (with optional productId for product-level accounts)
        await saveAccount(userId, 'linkedin', {
            platformUserId: profile.platformUserId,
            platformUsername: profile.username,
            platformDisplayName: profile.displayName,
            platformAvatarUrl: profile.avatarUrl,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiresAt: tokens.expiresAt,
            scopes: tokens.scope?.split(' '),
        }, productId);

        console.log('[LinkedIn Callback] Account connected successfully for user:', userId, productId ? `(product: ${productId})` : '(user-level)');

        // Redirect with success
        const separator = redirectBase.includes('?') ? '&' : '?';
        return NextResponse.redirect(
            new URL(`${redirectBase}${separator}connected=linkedin`, request.url)
        );
    } catch (err) {
        console.error('[LinkedIn Callback] Failed to exchange token:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        const separator = redirectBase.includes('?') ? '&' : '?';
        return NextResponse.redirect(
            new URL(`${redirectBase}${separator}error=${encodeURIComponent(message)}`, request.url)
        );
    }
}
