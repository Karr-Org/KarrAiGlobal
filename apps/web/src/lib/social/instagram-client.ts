/**
 * 📸 Instagram API Client
 * Uses Instagram Graph API (via Facebook/Meta) for Business/Creator accounts
 * 
 * IMPORTANT: Instagram posting via API requires:
 * 1. A Facebook Page connected to an Instagram Business/Creator account
 * 2. The Facebook app must have instagram_basic, instagram_content_publish permissions
 * 3. Instagram only supports MEDIA posts (image/video/carousel) — no text-only posts
 */

// ============================================
// TYPES
// ============================================

export interface InstagramProfile {
    id: string;
    username: string;
    name: string;
    profilePictureUrl?: string;
    followersCount?: number;
    mediaCount?: number;
    biography?: string;
}

export interface InstagramTokens {
    accessToken: string;
    expiresIn: number;
    expiresAt: Date;
    scope: string;
}

export interface InstagramPostResult {
    mediaId: string;
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
 * Generate Instagram OAuth authorization URL
 * Instagram auth goes through Facebook OAuth
 */
export function getInstagramAuthUrl(state?: string): string {
    const appId = process.env.FACEBOOK_APP_ID; // Same app as Facebook
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/social/callback/instagram';

    if (!appId) {
        throw new Error('Instagram not configured: Set FACEBOOK_APP_ID in your environment variables (Instagram uses Facebook/Meta apps). Get credentials at https://developers.facebook.com/apps');
    }

    const scopes = [
        'public_profile',
        'instagram_basic',             // Read Instagram profile + media
        'instagram_content_publish',   // Publish to Instagram
        'pages_show_list',             // List pages (needed to find IG account)
        'pages_read_engagement',       // Read engagement data
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
export async function exchangeCodeForTokens(code: string): Promise<InstagramTokens> {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/social/callback/instagram';

    if (!appId || !appSecret) {
        throw new Error('FACEBOOK_APP_ID and FACEBOOK_APP_SECRET must be configured for Instagram');
    }

    // Step 1: Exchange code for short-lived token
    const params = new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
    });

    const response = await fetch(`${FB_GRAPH_BASE}/oauth/access_token?${params.toString()}`);

    if (!response.ok) {
        const errText = await response.text();
        console.error('[Instagram] Token exchange failed:', response.status, errText);
        throw new Error(`Instagram token exchange failed: ${response.status}`);
    }

    const data = await response.json();

    // Step 2: Exchange for long-lived token
    const llParams = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: data.access_token,
    });

    const llResponse = await fetch(`${FB_GRAPH_BASE}/oauth/access_token?${llParams.toString()}`);

    if (llResponse.ok) {
        const llData = await llResponse.json();
        const expiresIn = llData.expires_in || 5184000;
        return {
            accessToken: llData.access_token,
            expiresIn,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            scope: 'instagram_basic,instagram_content_publish',
        };
    }

    // Fallback to short-lived token
    return {
        accessToken: data.access_token,
        expiresIn: data.expires_in || 3600,
        expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
        scope: 'instagram_basic,instagram_content_publish',
    };
}

// ============================================
// PROFILE
// ============================================

/**
 * Get the Instagram Business/Creator account connected to user's Facebook Pages
 */
export async function getInstagramAccount(accessToken: string): Promise<InstagramProfile | null> {
    // Step 1: Get user's Facebook Pages
    const pagesRes = await fetch(
        `${FB_GRAPH_BASE}/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`
    );

    if (!pagesRes.ok) {
        const errText = await pagesRes.text();
        console.error('[Instagram] Failed to fetch pages:', pagesRes.status, errText);
        throw new Error(`Failed to fetch Facebook pages: ${pagesRes.status}`);
    }

    const pagesData = await pagesRes.json();
    const pages = pagesData.data || [];

    // Step 2: Find a page with an Instagram Business account
    for (const page of pages) {
        const igAccountId = page.instagram_business_account?.id;
        if (!igAccountId) continue;

        // Step 3: Get Instagram profile details
        const igRes = await fetch(
            `${FB_GRAPH_BASE}/${igAccountId}?fields=id,username,name,profile_picture_url,followers_count,media_count,biography&access_token=${accessToken}`
        );

        if (igRes.ok) {
            const igData = await igRes.json();
            return {
                id: igData.id,
                username: igData.username || '',
                name: igData.name || '',
                profilePictureUrl: igData.profile_picture_url,
                followersCount: igData.followers_count,
                mediaCount: igData.media_count,
                biography: igData.biography,
            };
        }
    }

    return null;
}

// ============================================
// POSTING
// ============================================

/**
 * Create an Instagram image post (2-step process)
 * Step 1: Create a media container
 * Step 2: Publish the container
 *
 * NOTE: Instagram API does NOT support text-only posts.
 * All posts must include an image or video.
 */
export async function createImagePost(
    accessToken: string,
    igUserId: string,
    imageUrl: string,
    caption: string
): Promise<InstagramPostResult> {
    // Step 1: Create media container
    const containerRes = await fetch(`${FB_GRAPH_BASE}/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            image_url: imageUrl,
            caption,
            access_token: accessToken,
        }),
    });

    if (!containerRes.ok) {
        const errText = await containerRes.text();
        console.error('[Instagram] Create container failed:', containerRes.status, errText);
        throw new Error(`Instagram container creation failed: ${containerRes.status} — ${errText}`);
    }

    const containerData = await containerRes.json();
    const containerId = containerData.id;

    // Step 2: Wait for media processing (poll status)
    let ready = false;
    let attempts = 0;
    while (!ready && attempts < 30) {
        await new Promise(r => setTimeout(r, 2000)); // Wait 2s between checks
        const statusRes = await fetch(
            `${FB_GRAPH_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`
        );
        if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.status_code === 'FINISHED') {
                ready = true;
            } else if (statusData.status_code === 'ERROR') {
                throw new Error('Instagram media processing failed');
            }
        }
        attempts++;
    }

    if (!ready) {
        throw new Error('Instagram media processing timed out');
    }

    // Step 3: Publish the container
    const publishRes = await fetch(`${FB_GRAPH_BASE}/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            creation_id: containerId,
            access_token: accessToken,
        }),
    });

    if (!publishRes.ok) {
        const errText = await publishRes.text();
        throw new Error(`Instagram publish failed: ${publishRes.status} — ${errText}`);
    }

    const publishData = await publishRes.json();
    return {
        mediaId: publishData.id,
        postUrl: `https://www.instagram.com/p/${publishData.id}/`, // Approximate URL
    };
}

/**
 * Create an Instagram carousel post (multiple images)
 */
export async function createCarouselPost(
    accessToken: string,
    igUserId: string,
    imageUrls: string[],
    caption: string
): Promise<InstagramPostResult> {
    // Step 1: Create individual media containers for each image
    const childContainerIds: string[] = [];

    for (const imageUrl of imageUrls.slice(0, 10)) { // Max 10 items
        const res = await fetch(`${FB_GRAPH_BASE}/${igUserId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image_url: imageUrl,
                is_carousel_item: true,
                access_token: accessToken,
            }),
        });

        if (res.ok) {
            const data = await res.json();
            childContainerIds.push(data.id);
        }
    }

    if (childContainerIds.length === 0) {
        throw new Error('No carousel items could be created');
    }

    // Step 2: Create carousel container
    const carouselRes = await fetch(`${FB_GRAPH_BASE}/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            media_type: 'CAROUSEL',
            caption,
            children: childContainerIds,
            access_token: accessToken,
        }),
    });

    if (!carouselRes.ok) {
        const errText = await carouselRes.text();
        throw new Error(`Instagram carousel creation failed: ${carouselRes.status} — ${errText}`);
    }

    const carouselData = await carouselRes.json();

    // Step 3: Wait and publish (same as single image)
    await new Promise(r => setTimeout(r, 5000));

    const publishRes = await fetch(`${FB_GRAPH_BASE}/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            creation_id: carouselData.id,
            access_token: accessToken,
        }),
    });

    if (!publishRes.ok) {
        const errText = await publishRes.text();
        throw new Error(`Instagram carousel publish failed: ${publishRes.status} — ${errText}`);
    }

    const publishData = await publishRes.json();
    return {
        mediaId: publishData.id,
        postUrl: `https://www.instagram.com/p/${publishData.id}/`,
    };
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Get Instagram media insights
 */
export async function getMediaInsights(
    accessToken: string,
    mediaId: string
): Promise<{ likes: number; comments: number; saves: number; impressions: number; reach: number }> {
    const response = await fetch(
        `${FB_GRAPH_BASE}/${mediaId}/insights?metric=impressions,reach,saved,likes,comments&access_token=${accessToken}`
    );

    if (!response.ok) {
        // Try basic fields as fallback
        const basicRes = await fetch(
            `${FB_GRAPH_BASE}/${mediaId}?fields=like_count,comments_count&access_token=${accessToken}`
        );
        if (basicRes.ok) {
            const basicData = await basicRes.json();
            return {
                likes: basicData.like_count || 0,
                comments: basicData.comments_count || 0,
                saves: 0,
                impressions: 0,
                reach: 0,
            };
        }
        return { likes: 0, comments: 0, saves: 0, impressions: 0, reach: 0 };
    }

    const data = await response.json();
    const metrics: Record<string, number> = {};
    for (const item of (data.data || [])) {
        metrics[item.name] = item.values?.[0]?.value || 0;
    }

    return {
        likes: metrics.likes || 0,
        comments: metrics.comments || 0,
        saves: metrics.saved || 0,
        impressions: metrics.impressions || 0,
        reach: metrics.reach || 0,
    };
}
