/**
 * 📘 Facebook API Client
 * Uses Facebook Graph API v21.0 with OAuth 2.0
 * Handles OAuth, page posting, profile, and token management
 * 
 * NOTE: Facebook requires posting to PAGES (not personal profiles).
 * The user authenticates, we fetch their managed Pages, and posts go to the selected Page.
 */

// ============================================
// TYPES
// ============================================

export interface FacebookProfile {
    id: string;
    name: string;
    email?: string;
    picture?: string;
}

export interface FacebookPage {
    id: string;
    name: string;
    accessToken: string; // Page-specific access token
    category?: string;
}

export interface FacebookTokens {
    accessToken: string;
    expiresIn: number;
    expiresAt: Date;
    scope: string;
}

export interface FacebookPostResult {
    postId: string;
    postUrl: string;
}

// ============================================
// CONSTANTS
// ============================================

const FB_GRAPH_BASE = 'https://graph.facebook.com/v21.0';
const FB_OAUTH_BASE = 'https://www.facebook.com/v21.0/dialog';

// ============================================
// OAUTH FLOW
// ============================================

/**
 * Generate the Facebook OAuth authorization URL
 */
export function getFacebookAuthUrl(state?: string): string {
    const appId = process.env.FACEBOOK_APP_ID;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/api/social/callback/facebook';

    if (!appId) {
        throw new Error('Facebook not configured: Set FACEBOOK_APP_ID in your environment variables. Get credentials at https://developers.facebook.com/apps');
    }

    const scopes = [
        'public_profile',
        'email',
        'pages_show_list',        // List user's pages
        'pages_read_engagement',   // Read page post insights
        // NOTE: 'pages_manage_posts' removed — requires App Review for Advanced Access.
        // Add it back after passing App Review to enable posting to Pages.
    ].join(',');

    const params = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        scope: scopes,
        state: state || '',
        response_type: 'code',
    });

    return `${FB_OAUTH_BASE}/oauth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForTokens(code: string): Promise<FacebookTokens> {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/api/social/callback/facebook';

    if (!appId || !appSecret) {
        throw new Error('FACEBOOK_APP_ID and FACEBOOK_APP_SECRET must be configured');
    }

    const params = new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
    });

    const response = await fetch(`${FB_GRAPH_BASE}/oauth/access_token?${params.toString()}`);

    if (!response.ok) {
        const errText = await response.text();
        console.error('[Facebook] Token exchange failed:', response.status, errText);
        throw new Error(`Facebook token exchange failed: ${response.status}`);
    }

    const data = await response.json();

    // Exchange for long-lived token (60 days instead of ~2 hours)
    const longLived = await getLongLivedToken(data.access_token);

    return longLived;
}

/**
 * Exchange short-lived token for long-lived token (~60 days)
 */
async function getLongLivedToken(shortLivedToken: string): Promise<FacebookTokens> {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    const params = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: appId!,
        client_secret: appSecret!,
        fb_exchange_token: shortLivedToken,
    });

    const response = await fetch(`${FB_GRAPH_BASE}/oauth/access_token?${params.toString()}`);

    if (!response.ok) {
        // If long-lived exchange fails, use the short-lived token
        console.warn('[Facebook] Long-lived token exchange failed, using short-lived token');
        return {
            accessToken: shortLivedToken,
            expiresIn: 3600,
            expiresAt: new Date(Date.now() + 3600 * 1000),
            scope: '',
        };
    }

    const data = await response.json();
    const expiresIn = data.expires_in || 5184000; // Default 60 days

    return {
        accessToken: data.access_token,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
        scope: data.token_type || '',
    };
}

// ============================================
// PROFILE & PAGES
// ============================================

/**
 * Get the authenticated user's profile
 */
export async function getFacebookProfile(accessToken: string): Promise<FacebookProfile> {
    const response = await fetch(
        `${FB_GRAPH_BASE}/me?fields=id,name,email,picture.type(large)`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Facebook profile fetch failed: ${response.status} — ${errText}`);
    }

    const data = await response.json();
    return {
        id: data.id,
        name: data.name,
        email: data.email,
        picture: data.picture?.data?.url,
    };
}

/**
 * Get user's managed Facebook Pages
 * These are the pages the user can post to
 */
export async function getUserPages(accessToken: string): Promise<FacebookPage[]> {
    const response = await fetch(
        `${FB_GRAPH_BASE}/me/accounts?fields=id,name,access_token,category`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
        const errText = await response.text();
        console.error('[Facebook] Get pages failed:', response.status, errText);
        return [];
    }

    const data = await response.json();
    return (data.data || []).map((page: { id: string; name: string; access_token: string; category?: string }) => ({
        id: page.id,
        name: page.name,
        accessToken: page.access_token,
        category: page.category,
    }));
}

// ============================================
// POSTING
// ============================================

/**
 * Create a text post on a Facebook Page
 */
export async function createPagePost(
    pageAccessToken: string,
    pageId: string,
    message: string
): Promise<FacebookPostResult> {
    const response = await fetch(`${FB_GRAPH_BASE}/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            access_token: pageAccessToken,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('[Facebook] Create post failed:', response.status, errText);
        throw new Error(`Facebook post failed: ${response.status} — ${errText}`);
    }

    const data = await response.json();
    return {
        postId: data.id, // Format: "pageId_postId"
        postUrl: `https://www.facebook.com/${data.id.replace('_', '/posts/')}`,
    };
}

/**
 * Create a link post on a Facebook Page
 */
export async function createLinkPost(
    pageAccessToken: string,
    pageId: string,
    message: string,
    link: string
): Promise<FacebookPostResult> {
    const response = await fetch(`${FB_GRAPH_BASE}/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            link,
            access_token: pageAccessToken,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Facebook link post failed: ${response.status} — ${errText}`);
    }

    const data = await response.json();
    return {
        postId: data.id,
        postUrl: `https://www.facebook.com/${data.id.replace('_', '/posts/')}`,
    };
}

/**
 * Create a photo post on a Facebook Page
 */
export async function createPhotoPost(
    pageAccessToken: string,
    pageId: string,
    message: string,
    imageUrl: string
): Promise<FacebookPostResult> {
    const response = await fetch(`${FB_GRAPH_BASE}/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            url: imageUrl,
            access_token: pageAccessToken,
            published: true,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Facebook photo post failed: ${response.status} — ${errText}`);
    }

    const data = await response.json();
    return {
        postId: data.post_id || data.id,
        postUrl: `https://www.facebook.com/${pageId}/photos/${data.id}`,
    };
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Get post insights from a Facebook Page post
 */
export async function getPostInsights(
    pageAccessToken: string,
    postId: string
): Promise<{ likes: number; comments: number; shares: number; impressions: number }> {
    // Get basic metrics first
    const response = await fetch(
        `${FB_GRAPH_BASE}/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${pageAccessToken}`
    );

    if (!response.ok) {
        console.error('[Facebook Analytics] Failed:', response.status);
        return { likes: 0, comments: 0, shares: 0, impressions: 0 };
    }

    const data = await response.json();

    // Try to get impressions from insights
    let impressions = 0;
    try {
        const insightsRes = await fetch(
            `${FB_GRAPH_BASE}/${postId}/insights?metric=post_impressions&access_token=${pageAccessToken}`
        );
        if (insightsRes.ok) {
            const insightsData = await insightsRes.json();
            impressions = insightsData.data?.[0]?.values?.[0]?.value || 0;
        }
    } catch {
        // Insights may not be available for all post types
    }

    return {
        likes: data.likes?.summary?.total_count || 0,
        comments: data.comments?.summary?.total_count || 0,
        shares: data.shares?.count || 0,
        impressions,
    };
}

/**
 * Delete a Facebook Page post
 */
export async function deletePost(pageAccessToken: string, postId: string): Promise<void> {
    const response = await fetch(`${FB_GRAPH_BASE}/${postId}?access_token=${pageAccessToken}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Facebook delete failed: ${response.status} — ${errText}`);
    }
}
