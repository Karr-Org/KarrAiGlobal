/**
 * 🔗 LinkedIn API Client
 * Uses the new Posts API (replaces deprecated ugcPosts as of version 202501)
 * Handles OAuth 2.0, posting, and analytics
 */



// ============================================
// TYPES
// ============================================

export interface LinkedInProfile {
    id: string; // Member URN like "urn:li:person:abc123"
    firstName: string;
    lastName: string;
    profilePicture?: string;
    headline?: string;
    vanityName?: string; // LinkedIn URL slug
}

export interface LinkedInTokens {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number; // seconds
    expiresAt: Date;
    scope: string;
}

export interface LinkedInPostResult {
    postUrn: string;
    postUrl: string;
}

export interface LinkedInAnalytics {
    impressions: number;
    uniqueImpressions: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    engagementRate: number;
}

// ============================================
// OAUTH FLOW
// ============================================

/**
 * Generate the LinkedIn OAuth authorization URL
 */
export function getLinkedInAuthUrl(state?: string): string {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/social/callback/linkedin';

    if (!clientId) {
        throw new Error('LinkedIn not configured: Set LINKEDIN_CLIENT_ID in your environment variables. Get credentials at https://www.linkedin.com/developers/apps');
    }

    const scopes = [
        'openid',              // Required by LinkedIn OIDC
        'profile',             // Read basic profile
        'email',               // Read email
        'w_member_social',     // Post on behalf of user
        'r_basicprofile',      // Access basic profile info
        'r_1st_connections_size', // Network size
    ].join(' ');

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopes,
        state: state || crypto.randomUUID(),
    });

    return `${LINKEDIN_OAUTH_BASE}/authorization?${params.toString()}`;
}

/**
 * Exchange authorization code for access tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<LinkedInTokens> {
    const clientId = process.env.LINKEDIN_CLIENT_ID || '';
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/social/callback/linkedin';

    console.log('[LinkedIn] Token exchange attempt:', {
        clientId: clientId ? `${clientId.substring(0, 4)}...` : 'MISSING',
        clientSecretLength: clientSecret?.length || 0,
        redirectUri,
        codeLength: code?.length || 0,
    });

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
    });

    const response = await fetch(`${LINKEDIN_OAUTH_BASE}/accessToken`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[LinkedIn] Token exchange FAILED:', {
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText,
        });
        throw new Error(`LinkedIn token exchange failed: ${response.status} — ${errorText}`);
    }

    const data = await response.json();

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        scope: data.scope,
    };
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<LinkedInTokens> {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    const response = await fetch(`${LINKEDIN_OAUTH_BASE}/accessToken`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId || '',
            client_secret: clientSecret || '',
        }).toString(),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('[LinkedIn] Token refresh failed:', error);
        throw new Error(`LinkedIn token refresh failed: ${response.status}`);
    }

    const data = await response.json();

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresIn: data.expires_in,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        scope: data.scope,
    };
}

// ============================================
// PROFILE
// ============================================

/**
 * Get the authenticated user's LinkedIn profile
 */
export async function getLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
    // Try OpenID Connect userinfo endpoint first (works with openid+profile scopes)
    try {
        const response = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log('[LinkedIn] userinfo raw response:', JSON.stringify(data));
            // OIDC sub is a plain ID — LinkedIn Posts API needs urn:li:person:XXX
            const rawId = data.sub || '';
            const memberId = rawId.startsWith('urn:li:person:') ? rawId : `urn:li:person:${rawId}`;
            console.log('[LinkedIn] Resolved member URN:', memberId);
            return {
                id: memberId,
                firstName: data.given_name || '',
                lastName: data.family_name || '',
                profilePicture: data.picture,
                vanityName: data.name,
            };
        }
    } catch {
        console.warn('[LinkedIn] userinfo endpoint failed, trying /me fallback');
    }

    // Fallback: /v2/me endpoint
    const meResponse = await fetch(`${LINKEDIN_API_BASE}/me`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'LinkedIn-Version': LINKEDIN_VERSION,
        },
    });

    if (!meResponse.ok) {
        throw new Error(`Failed to fetch LinkedIn profile: ${meResponse.status}`);
    }

    const data = await meResponse.json();
    return {
        id: `urn:li:person:${data.id}`,
        firstName: data.localizedFirstName || '',
        lastName: data.localizedLastName || '',
        profilePicture: undefined,
        vanityName: data.vanityName,
    };
}

// ============================================
// CONSTANTS
// ============================================
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_API_REST = 'https://api.linkedin.com/rest';
const LINKEDIN_OAUTH_BASE = 'https://www.linkedin.com/oauth/v2';
const LINKEDIN_VERSION = '202601';

// ============================================
// POSTING — Uses new Posts API (not ugcPosts)
// ============================================

/**
 * Create a text-only post on LinkedIn
 */
export async function createTextPost(
    accessToken: string,
    authorUrn: string,
    text: string
): Promise<LinkedInPostResult> {
    const response = await fetch(`${LINKEDIN_API_REST}/posts`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': LINKEDIN_VERSION,
            'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
            author: authorUrn,
            commentary: text,
            visibility: 'PUBLIC',
            distribution: {
                feedDistribution: 'MAIN_FEED',
                targetEntities: [],
                thirdPartyDistributionChannels: [],
            },
            lifecycleState: 'PUBLISHED',
            isReshareDisabledByAuthor: false,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('[LinkedIn] Post creation failed:', error);
        throw new Error(`LinkedIn post failed: ${response.status} - ${error}`);
    }

    // The post URN is in the x-restli-id header
    const postUrn = response.headers.get('x-restli-id') || '';
    const postUrl = `https://www.linkedin.com/feed/update/${postUrn}`;

    return { postUrn, postUrl };
}

/**
 * Create a post with an article/link share
 */
export async function createArticlePost(
    accessToken: string,
    authorUrn: string,
    text: string,
    articleUrl: string,
    title?: string,
    description?: string
): Promise<LinkedInPostResult> {
    const response = await fetch(`${LINKEDIN_API_REST}/posts`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': LINKEDIN_VERSION,
            'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
            author: authorUrn,
            commentary: text,
            visibility: 'PUBLIC',
            distribution: {
                feedDistribution: 'MAIN_FEED',
                targetEntities: [],
                thirdPartyDistributionChannels: [],
            },
            content: {
                article: {
                    source: articleUrl,
                    title: title || '',
                    description: description || '',
                },
            },
            lifecycleState: 'PUBLISHED',
            isReshareDisabledByAuthor: false,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('[LinkedIn] Article post failed:', error);
        throw new Error(`LinkedIn article post failed: ${response.status} - ${error}`);
    }

    const postUrn = response.headers.get('x-restli-id') || '';
    const postUrl = `https://www.linkedin.com/feed/update/${postUrn}`;

    return { postUrn, postUrl };
}

/**
 * Upload an image to LinkedIn and create a post with it
 * Uses the LinkedIn Images API (v2)
 */
export async function createImagePost(
    accessToken: string,
    authorUrn: string,
    text: string,
    imageUrl: string
): Promise<LinkedInPostResult> {
    console.log('[LinkedIn] Creating image post, image URL:', imageUrl.slice(0, 80));

    // Step 1: Initialize the image upload
    const initResponse = await fetch(`${LINKEDIN_API_BASE}/images?action=initializeUpload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': LINKEDIN_VERSION,
            'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
            initializeUploadRequest: {
                owner: authorUrn,
            },
        }),
    });

    if (!initResponse.ok) {
        const error = await initResponse.text();
        console.error('[LinkedIn] Image upload init failed:', error);
        // Fall back to text-only post
        console.log('[LinkedIn] Falling back to text-only post');
        return createTextPost(accessToken, authorUrn, text);
    }

    const initData = await initResponse.json();
    const uploadUrl = initData.value?.uploadUrl;
    const imageUrn = initData.value?.image;

    if (!uploadUrl || !imageUrn) {
        console.error('[LinkedIn] Missing upload URL or image URN');
        return createTextPost(accessToken, authorUrn, text);
    }

    console.log('[LinkedIn] Got upload URL, uploading image...');

    // Step 2: Fetch the image binary
    let imageBuffer: ArrayBuffer;
    let contentType = 'image/jpeg';

    if (imageUrl.startsWith('data:')) {
        // Handle data URL (base64)
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
            contentType = matches[1];
            const binaryStr = atob(matches[2]);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }
            imageBuffer = bytes.buffer;
        } else {
            console.error('[LinkedIn] Invalid data URL format');
            return createTextPost(accessToken, authorUrn, text);
        }
    } else {
        // Fetch external image (picsum, etc.)
        const imgResponse = await fetch(imageUrl);
        if (!imgResponse.ok) {
            console.error('[LinkedIn] Failed to fetch image:', imgResponse.status);
            return createTextPost(accessToken, authorUrn, text);
        }
        contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
        imageBuffer = await imgResponse.arrayBuffer();
    }

    // Step 3: Upload the image binary to LinkedIn
    const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': contentType,
        },
        body: imageBuffer,
    });

    if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        console.error('[LinkedIn] Image upload failed:', error);
        return createTextPost(accessToken, authorUrn, text);
    }

    console.log('[LinkedIn] Image uploaded, creating post with image asset:', imageUrn);

    // Step 4: Create the post with the image
    const postResponse = await fetch(`${LINKEDIN_API_REST}/posts`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': LINKEDIN_VERSION,
            'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
            author: authorUrn,
            commentary: text,
            visibility: 'PUBLIC',
            distribution: {
                feedDistribution: 'MAIN_FEED',
                targetEntities: [],
                thirdPartyDistributionChannels: [],
            },
            content: {
                media: {
                    title: 'Image',
                    id: imageUrn,
                },
            },
            lifecycleState: 'PUBLISHED',
            isReshareDisabledByAuthor: false,
        }),
    });

    if (!postResponse.ok) {
        const error = await postResponse.text();
        console.error('[LinkedIn] Image post creation failed:', error);
        // Try falling back to text-only
        return createTextPost(accessToken, authorUrn, text);
    }

    const postUrn = postResponse.headers.get('x-restli-id') || '';
    const postUrl = `https://www.linkedin.com/feed/update/${postUrn}`;

    console.log('[LinkedIn] ✓ Image post created successfully:', postUrn);
    return { postUrn, postUrl };
}

// ============================================
// ANALYTICS
// ============================================
/**
 * Get basic analytics for a post via Social Actions API
 * Uses the socialActions summary endpoint (single call) for likes, comments, shares.
 * Note: Full analytics (impressions, reach) requires Community Management API approval.
 */
export async function getPostAnalytics(
    accessToken: string,
    postUrnObj: string
): Promise<LinkedInAnalytics> {
    // Ensure we have a clean URN string
    let postUrn = decodeURIComponent(postUrnObj).trim();

    // If it's just a number, try adding the common prefixes
    // 1. Try as is first (if it's already a full URN)
    // 2. If it fails and it's numeric, try urn:li:share
    // 3. Try urn:li:ugcPost

    // Heuristic: if it doesn't start with urn:, assume it's an ID
    if (!postUrn.startsWith('urn:')) {
        console.warn(`[LinkedIn Analytics] Post ID '${postUrn}' missing URN prefix. Assuming urn:li:share`);
        postUrn = `urn:li:share:${postUrn}`;
    }

    const url = `${LINKEDIN_API_REST}/socialActions/${encodeURIComponent(postUrn)}`;
    console.log('[LinkedIn Analytics] Fetching social actions for:', postUrn);

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'LinkedIn-Version': LINKEDIN_VERSION,
            'X-Restli-Protocol-Version': '2.0.0',
        },
    });

    let likes = 0, comments = 0, shares = 0;

    if (response.ok) {
        const data = await response.json();
        console.log('[LinkedIn Analytics] Response data:', JSON.stringify(data).slice(0, 500));
        likes = data.likesSummary?.totalLikes || data.likesSummary?.aggregatedTotalLikes || 0;
        comments = data.commentsSummary?.totalFirstLevelComments || data.commentsSummary?.aggregatedTotalComments || 0;
        console.log('[LinkedIn Analytics] Parsed — likes:', likes, 'comments:', comments);
    } else if (response.status === 403) {
        const errText = await response.text().catch(() => '');
        console.error('[LinkedIn Analytics] ACCESS DENIED (403) — Missing r_member_social scope. User must reconnect LinkedIn.', errText.slice(0, 200));
        throw new Error('LinkedIn analytics requires r_member_social permission. Please disconnect and reconnect your LinkedIn account.');
    } else {
        const errText = await response.text().catch(() => '');
        console.error('[LinkedIn Analytics] socialActions FAILED:', response.status, errText.slice(0, 300));
    }

    const totalEngagement = likes + comments + shares;
    const engagementRate = totalEngagement > 0 ? totalEngagement / Math.max(likes * 10, 100) : 0;

    return {
        impressions: 0, // Requires Community Management API
        uniqueImpressions: 0,
        likes,
        comments,
        shares,
        clicks: 0, // Requires Community Management API
        engagementRate,
    };
}

/**
 * Delete a post from LinkedIn
 */
export async function deletePost(
    accessToken: string,
    postUrn: string
): Promise<void> {
    const response = await fetch(
        `${LINKEDIN_API_REST}/posts/${encodeURIComponent(postUrn)}`,
        {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'LinkedIn-Version': LINKEDIN_VERSION,
                'X-Restli-Protocol-Version': '2.0.0',
            },
        }
    );

    if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete LinkedIn post: ${response.status}`);
    }
}
