/**
 * 🔌 Platform Adapter
 * Unified interface for multi-platform social posting
 * Supports: LinkedIn, X (Twitter), Facebook, Instagram
 */

import * as linkedin from './linkedin-client';
import * as twitter from './twitter-client';
import * as facebook from './facebook-client';
import * as instagram from './instagram-client';

// ============================================
// TYPES
// ============================================

export interface PostContent {
    text: string;
    mediaUrls?: string[];
    articleUrl?: string;
    articleTitle?: string;
    articleDescription?: string;
}

export interface PostResult {
    platformPostId: string;
    platformPostUrl: string;
    platform: SocialPlatform;
}

export interface PlatformAnalytics {
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    engagementRate: number;
    followerChange: number;
    profileVisits: number;
}

export interface PlatformProfile {
    platformUserId: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
}

export type SocialPlatform = 'linkedin' | 'twitter' | 'facebook' | 'instagram';

export interface PlatformAdapter {
    platform: SocialPlatform;
    post(accessToken: string, authorId: string, content: PostContent): Promise<PostResult>;
    getAnalytics(accessToken: string, postId: string): Promise<PlatformAnalytics>;
    getProfile(accessToken: string): Promise<PlatformProfile>;
    refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }>;
    getAuthUrl(state?: string): string;
    exchangeCode(code: string, state?: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date; scope: string }>;
}

// ============================================
// LINKEDIN ADAPTER
// ============================================

export class LinkedInAdapter implements PlatformAdapter {
    platform: SocialPlatform = 'linkedin';

    async post(accessToken: string, authorId: string, content: PostContent): Promise<PostResult> {
        const authorUrn = authorId.startsWith('urn:li:person:') ? authorId : `urn:li:person:${authorId}`;
        console.log('[LinkedIn Adapter] Publishing with author URN:', authorUrn);

        let result: linkedin.LinkedInPostResult;

        if (content.articleUrl) {
            result = await linkedin.createArticlePost(
                accessToken, authorUrn, content.text,
                content.articleUrl, content.articleTitle, content.articleDescription
            );
        } else if (content.mediaUrls && content.mediaUrls.length > 0) {
            console.log('[LinkedIn Adapter] Posting with image:', content.mediaUrls[0].slice(0, 80));
            result = await linkedin.createImagePost(accessToken, authorUrn, content.text, content.mediaUrls[0]);
        } else {
            result = await linkedin.createTextPost(accessToken, authorUrn, content.text);
        }

        return { platformPostId: result.postUrn, platformPostUrl: result.postUrl, platform: 'linkedin' };
    }

    async getAnalytics(accessToken: string, postId: string): Promise<PlatformAnalytics> {
        const analytics = await linkedin.getPostAnalytics(accessToken, postId);
        return {
            impressions: analytics.impressions, reach: analytics.uniqueImpressions,
            likes: analytics.likes, comments: analytics.comments, shares: analytics.shares,
            saves: 0, clicks: analytics.clicks, engagementRate: analytics.engagementRate,
            followerChange: 0, profileVisits: 0,
        };
    }

    async getProfile(accessToken: string): Promise<PlatformProfile> {
        const profile = await linkedin.getLinkedInProfile(accessToken);
        return {
            platformUserId: profile.id, username: profile.vanityName || '',
            displayName: `${profile.firstName} ${profile.lastName}`, avatarUrl: profile.profilePicture,
        };
    }

    async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
        const tokens = await linkedin.refreshAccessToken(refreshToken);
        return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresAt: tokens.expiresAt };
    }

    getAuthUrl(state?: string): string {
        return linkedin.getLinkedInAuthUrl(state);
    }

    async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date; scope: string }> {
        const tokens = await linkedin.exchangeCodeForTokens(code);
        return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresAt: tokens.expiresAt, scope: tokens.scope };
    }
}

// ============================================
// TWITTER (X) ADAPTER
// ============================================

export class TwitterAdapter implements PlatformAdapter {
    platform: SocialPlatform = 'twitter';

    async post(accessToken: string, _authorId: string, content: PostContent): Promise<PostResult> {
        console.log('[Twitter Adapter] Publishing tweet...');

        let result: twitter.TwitterPostResult;

        if (content.mediaUrls && content.mediaUrls.length > 0) {
            result = await twitter.createTweetWithMedia(accessToken, content.text, content.mediaUrls[0]);
        } else {
            // For tweets with article links, append the URL to the text
            const text = content.articleUrl ? `${content.text}\n\n${content.articleUrl}` : content.text;
            result = await twitter.createTweet(accessToken, text);
        }

        return { platformPostId: result.tweetId, platformPostUrl: result.tweetUrl, platform: 'twitter' };
    }

    async getAnalytics(accessToken: string, postId: string): Promise<PlatformAnalytics> {
        const metrics = await twitter.getTweetAnalytics(accessToken, postId);
        const totalEngagement = metrics.likes + metrics.retweets + metrics.replies;
        return {
            impressions: metrics.impressions, reach: 0,
            likes: metrics.likes, comments: metrics.replies, shares: metrics.retweets,
            saves: 0, clicks: 0,
            engagementRate: metrics.impressions > 0 ? totalEngagement / metrics.impressions : 0,
            followerChange: 0, profileVisits: 0,
        };
    }

    async getProfile(accessToken: string): Promise<PlatformProfile> {
        const profile = await twitter.getTwitterProfile(accessToken);
        return {
            platformUserId: profile.id, username: profile.username,
            displayName: profile.name, avatarUrl: profile.profileImageUrl,
        };
    }

    async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
        const tokens = await twitter.refreshAccessToken(refreshToken);
        return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresAt: tokens.expiresAt };
    }

    getAuthUrl(state?: string): string {
        return twitter.getTwitterAuthUrl(state);
    }

    async exchangeCode(code: string, state?: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date; scope: string }> {
        const tokens = await twitter.exchangeCodeForTokens(code, state || '');
        return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresAt: tokens.expiresAt, scope: tokens.scope };
    }
}

// ============================================
// FACEBOOK ADAPTER
// ============================================

export class FacebookAdapter implements PlatformAdapter {
    platform: SocialPlatform = 'facebook';

    async post(accessToken: string, authorId: string, content: PostContent): Promise<PostResult> {
        console.log('[Facebook Adapter] Publishing to page:', authorId);

        // For Facebook, authorId is the Page ID, and accessToken should be the Page access token
        // The Page access token is stored in the social_accounts.metadata field
        let result: facebook.FacebookPostResult;

        if (content.mediaUrls && content.mediaUrls.length > 0) {
            result = await facebook.createPhotoPost(accessToken, authorId, content.text, content.mediaUrls[0]);
        } else if (content.articleUrl) {
            result = await facebook.createLinkPost(accessToken, authorId, content.text, content.articleUrl);
        } else {
            result = await facebook.createPagePost(accessToken, authorId, content.text);
        }

        return { platformPostId: result.postId, platformPostUrl: result.postUrl, platform: 'facebook' };
    }

    async getAnalytics(accessToken: string, postId: string): Promise<PlatformAnalytics> {
        const metrics = await facebook.getPostInsights(accessToken, postId);
        const totalEngagement = metrics.likes + metrics.comments + metrics.shares;
        return {
            impressions: metrics.impressions, reach: 0,
            likes: metrics.likes, comments: metrics.comments, shares: metrics.shares,
            saves: 0, clicks: 0,
            engagementRate: metrics.impressions > 0 ? totalEngagement / metrics.impressions : 0,
            followerChange: 0, profileVisits: 0,
        };
    }

    async getProfile(accessToken: string): Promise<PlatformProfile> {
        const profile = await facebook.getFacebookProfile(accessToken);
        return {
            platformUserId: profile.id, username: profile.name,
            displayName: profile.name, avatarUrl: profile.picture,
        };
    }

    async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
        // Facebook uses long-lived tokens (~60 days), no traditional refresh
        throw new Error('Facebook tokens cannot be refreshed — re-authenticate to get a new token');
    }

    getAuthUrl(state?: string): string {
        return facebook.getFacebookAuthUrl(state);
    }

    async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date; scope: string }> {
        const tokens = await facebook.exchangeCodeForTokens(code);
        return { accessToken: tokens.accessToken, expiresAt: tokens.expiresAt, scope: tokens.scope };
    }
}

// ============================================
// INSTAGRAM ADAPTER
// ============================================

export class InstagramAdapter implements PlatformAdapter {
    platform: SocialPlatform = 'instagram';

    async post(accessToken: string, authorId: string, content: PostContent): Promise<PostResult> {
        console.log('[Instagram Adapter] Publishing to IG account:', authorId);

        // Instagram requires an image — no text-only posts
        if (!content.mediaUrls || content.mediaUrls.length === 0) {
            throw new Error('Instagram requires at least one image. Text-only posts are not supported.');
        }

        let result: instagram.InstagramPostResult;

        if (content.mediaUrls.length > 1) {
            result = await instagram.createCarouselPost(accessToken, authorId, content.mediaUrls, content.text);
        } else {
            result = await instagram.createImagePost(accessToken, authorId, content.mediaUrls[0], content.text);
        }

        return { platformPostId: result.mediaId, platformPostUrl: result.postUrl, platform: 'instagram' };
    }

    async getAnalytics(accessToken: string, postId: string): Promise<PlatformAnalytics> {
        const metrics = await instagram.getMediaInsights(accessToken, postId);
        const totalEngagement = metrics.likes + metrics.comments + metrics.saves;
        return {
            impressions: metrics.impressions, reach: metrics.reach,
            likes: metrics.likes, comments: metrics.comments, shares: 0,
            saves: metrics.saves, clicks: 0,
            engagementRate: metrics.impressions > 0 ? totalEngagement / metrics.impressions : 0,
            followerChange: 0, profileVisits: 0,
        };
    }

    async getProfile(accessToken: string): Promise<PlatformProfile> {
        const ig = await instagram.getInstagramAccount(accessToken);
        if (!ig) {
            throw new Error('No Instagram Business/Creator account found. Make sure your Facebook Page is connected to an Instagram account.');
        }
        return {
            platformUserId: ig.id, username: ig.username,
            displayName: ig.name || ig.username, avatarUrl: ig.profilePictureUrl,
        };
    }

    async refreshToken(_refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
        // Instagram (via Facebook) uses long-lived tokens
        throw new Error('Instagram tokens cannot be refreshed — re-authenticate to get a new token');
    }

    getAuthUrl(state?: string): string {
        return instagram.getInstagramAuthUrl(state);
    }

    async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date; scope: string }> {
        const tokens = await instagram.exchangeCodeForTokens(code);
        return { accessToken: tokens.accessToken, expiresAt: tokens.expiresAt, scope: tokens.scope };
    }
}

// ============================================
// ADAPTER REGISTRY
// ============================================

const adapters: Record<SocialPlatform, PlatformAdapter> = {
    linkedin: new LinkedInAdapter(),
    twitter: new TwitterAdapter(),
    facebook: new FacebookAdapter(),
    instagram: new InstagramAdapter(),
};

/**
 * Get the platform adapter for a given platform
 */
export function getAdapter(platform: SocialPlatform): PlatformAdapter {
    const adapter = adapters[platform];
    if (!adapter) {
        throw new Error(`Platform "${platform}" is not yet supported`);
    }
    return adapter;
}

/**
 * Get all supported platforms
 */
export function getSupportedPlatforms(): SocialPlatform[] {
    return Object.keys(adapters) as SocialPlatform[];
}

/**
 * Check if a platform is properly configured (has env vars)
 */
export function isPlatformConfigured(platform: SocialPlatform): boolean {
    switch (platform) {
        case 'linkedin': return !!process.env.LINKEDIN_CLIENT_ID;
        case 'twitter': return !!process.env.TWITTER_CLIENT_ID;
        case 'facebook': return !!process.env.FACEBOOK_APP_ID;
        case 'instagram': return !!process.env.FACEBOOK_APP_ID; // Instagram uses Facebook app
        default: return false;
    }
}
