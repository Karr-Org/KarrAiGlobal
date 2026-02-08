/**
 * 🐦 X (Twitter) API Client
 * Uses Twitter API v2 with OAuth 2.0 + PKCE
 * Handles OAuth, posting, profile, and token refresh
 */

import crypto from 'crypto';

// ============================================
// TYPES
// ============================================

export interface TwitterProfile {
    id: string;
    name: string;
    username: string;
    profileImageUrl?: string;
    description?: string;
    publicMetrics?: {
        followersCount: number;
        followingCount: number;
        tweetCount: number;
    };
}

export interface TwitterTokens {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
    expiresAt: Date;
    scope: string;
}

export interface TwitterPostResult {
    tweetId: string;
    tweetUrl: string;
}

// ============================================
// CONSTANTS
// ============================================

const TWITTER_API_BASE = 'https://api.twitter.com/2';
const TWITTER_OAUTH_BASE = 'https://twitter.com/i/oauth2';
const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';

// PKCE helper — stored in-memory (for dev; use DB/Redis in prod)
const pkceStore = new Map<string, { codeVerifier: string; state: string }>();

// ============================================
// PKCE HELPERS
// ============================================

function generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// ============================================
// OAUTH FLOW
// ============================================

/**
 * Generate the X (Twitter) OAuth 2.0 authorization URL with PKCE
 */
export function getTwitterAuthUrl(state?: string): string {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = process.env.TWITTER_REDIRECT_URI || 'http://localhost:3000/api/social/callback/twitter';

    if (!clientId) {
        throw new Error('X (Twitter) not configured: Set TWITTER_CLIENT_ID in your environment variables. Get credentials at https://developer.twitter.com/en/portal/dashboard');
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const oauthState = state || crypto.randomBytes(16).toString('hex');

    // Store PKCE verifier for callback
    pkceStore.set(oauthState, { codeVerifier, state: oauthState });

    const scopes = [
        'tweet.read',
        'tweet.write',
        'users.read',
        'offline.access',     // For refresh tokens
        'upload.media',       // Upload images/videos
    ].join(' ');

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopes,
        state: oauthState,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });

    return `${TWITTER_OAUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string, state: string): Promise<TwitterTokens> {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const redirectUri = process.env.TWITTER_REDIRECT_URI || 'http://localhost:3000/api/social/callback/twitter';

    if (!clientId) {
        throw new Error('TWITTER_CLIENT_ID not configured');
    }

    // Retrieve PKCE verifier
    const pkceData = pkceStore.get(state);
    if (!pkceData) {
        throw new Error('Invalid state parameter — PKCE verifier not found. Try connecting again.');
    }
    const { codeVerifier } = pkceData;
    pkceStore.delete(state);

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier,
    });

    // Use Basic auth header for Confidential Clients (client_id:client_secret)
    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (clientSecret) {
        headers['Authorization'] = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    }

    const response = await fetch(TWITTER_TOKEN_URL, {
        method: 'POST',
        headers,
        body: body.toString(),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('[Twitter] Token exchange failed:', response.status, errText);
        throw new Error(`Twitter token exchange failed: ${response.status}`);
    }

    const data = await response.json();
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in || 7200,
        expiresAt: new Date(Date.now() + (data.expires_in || 7200) * 1000),
        scope: data.scope || '',
    };
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TwitterTokens> {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    if (!clientId) throw new Error('TWITTER_CLIENT_ID not configured');

    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
    });

    // Use Basic auth header for Confidential Clients
    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (clientSecret) {
        headers['Authorization'] = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    }

    const response = await fetch(TWITTER_TOKEN_URL, {
        method: 'POST',
        headers,
        body: body.toString(),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Twitter token refresh failed: ${response.status} — ${errText}`);
    }

    const data = await response.json();
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresIn: data.expires_in || 7200,
        expiresAt: new Date(Date.now() + (data.expires_in || 7200) * 1000),
        scope: data.scope || '',
    };
}

// ============================================
// PROFILE
// ============================================

/**
 * Get the authenticated user's profile
 */
export async function getTwitterProfile(accessToken: string): Promise<TwitterProfile> {
    const response = await fetch(`${TWITTER_API_BASE}/users/me?user.fields=name,username,profile_image_url,description,public_metrics`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Twitter profile fetch failed: ${response.status} — ${errText}`);
    }

    const { data } = await response.json();
    return {
        id: data.id,
        name: data.name,
        username: data.username,
        profileImageUrl: data.profile_image_url,
        description: data.description,
        publicMetrics: data.public_metrics ? {
            followersCount: data.public_metrics.followers_count,
            followingCount: data.public_metrics.following_count,
            tweetCount: data.public_metrics.tweet_count,
        } : undefined,
    };
}

// ============================================
// POSTING
// ============================================

/**
 * Create a text tweet
 */
export async function createTweet(accessToken: string, text: string): Promise<TwitterPostResult> {
    const response = await fetch(`${TWITTER_API_BASE}/tweets`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('[Twitter] Create tweet failed:', response.status, errText);
        throw new Error(`Twitter post failed: ${response.status} — ${errText}`);
    }

    const { data } = await response.json();
    return {
        tweetId: data.id,
        tweetUrl: `https://x.com/i/status/${data.id}`,
    };
}

/**
 * Create a tweet with media (image)
 * Note: Media upload uses v1.1 API which requires OAuth 1.0a
 * For simplicity, we'll post text-only for now and add media upload later
 */
export async function createTweetWithMedia(
    accessToken: string,
    text: string,
    _mediaUrl: string
): Promise<TwitterPostResult> {
    // TODO: Implement media upload via Twitter v1.1 media/upload endpoint
    // This requires OAuth 1.0a which is more complex
    // For now, post as text-only
    console.warn('[Twitter] Media upload not yet implemented — posting text-only');
    return createTweet(accessToken, text);
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Get tweet metrics
 * Note: Tweet metrics require at least Basic tier ($100/mo)
 * Free tier only allows posting
 */
export async function getTweetAnalytics(
    accessToken: string,
    tweetId: string
): Promise<{ likes: number; retweets: number; replies: number; impressions: number; quotes: number }> {
    const response = await fetch(
        `${TWITTER_API_BASE}/tweets/${tweetId}?tweet.fields=public_metrics,non_public_metrics,organic_metrics`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
        const errText = await response.text();
        console.error('[Twitter Analytics] Failed:', response.status, errText);
        // Return zeros if we can't access metrics (likely free tier)
        return { likes: 0, retweets: 0, replies: 0, impressions: 0, quotes: 0 };
    }

    const { data } = await response.json();
    const pm = data.public_metrics || {};
    const npm = data.non_public_metrics || {};

    return {
        likes: pm.like_count || 0,
        retweets: pm.retweet_count || 0,
        replies: pm.reply_count || 0,
        impressions: npm.impression_count || pm.impression_count || 0,
        quotes: pm.quote_count || 0,
    };
}

/**
 * Delete a tweet
 */
export async function deleteTweet(accessToken: string, tweetId: string): Promise<void> {
    const response = await fetch(`${TWITTER_API_BASE}/tweets/${tweetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Twitter delete failed: ${response.status} — ${errText}`);
    }
}
