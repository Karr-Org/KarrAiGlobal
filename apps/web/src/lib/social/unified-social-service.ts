/**
 * 🚀 Unified Social Service
 * 
 * Single service layer for ALL social media operations at both user and product levels.
 * Replaces the split between social-engine.ts (user) and marketing APIs (product).
 * 
 * Architecture:
 *   SocialOwner (user|product) 
 *     → UnifiedSocialService (this file)
 *       → Platform Adapters (linkedin, twitter, etc.)
 *       → Content Intelligence (AI generation)
 *       → Analytics Collection
 * 
 * Any improvement here benefits both user-level and product-level social automatically.
 */

import { SocialOwner, getOwnerFilters, getOwnerInsertFields, getContentSourceDescription } from './owner-context';

// ============================================
// TYPES (shared across both levels)
// ============================================

export type SocialPlatform = 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'medium' | 'hashnode' | 'devto';

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

export interface UnifiedSocialAccount {
    id: string;
    userId: string;
    productId?: string | null;
    platform: SocialPlatform;
    platformUserId: string;
    platformUsername: string;
    platformDisplayName: string;
    platformAvatarUrl?: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt?: string;
    isActive: boolean;
    scopes?: string[];
    lastSyncedAt?: string;
    metadata?: Record<string, unknown>;
}

export interface UnifiedSocialPost {
    id: string;
    userId: string;
    productId?: string | null;
    socialAccountId?: string;
    content: string;
    contentHtml?: string;
    mediaUrls?: string[];
    hashtags?: string[];
    mentions?: string[];
    platform: SocialPlatform;
    platformPostId?: string;
    platformPostUrl?: string;
    status: PostStatus;
    scheduledAt?: string;
    publishedAt?: string;
    failedReason?: string;
    // AI metadata
    sourceType?: string;
    sourceSessionId?: string;
    sourceInsightId?: string;
    aiDraftVariant?: string;
    aiConfidenceScore?: number;
    userEdited: boolean;
    editCount: number;
    // Calendar metadata
    calendarSlot?: string;
    calendarWeek?: number;
    calendarDayOfWeek?: number;
    calendarHour?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CalendarEntry {
    id: string;
    date: string;
    dayOfWeek: number;
    hour: number;
    post?: UnifiedSocialPost;
    suggestedTopic?: string;
    suggestedPlatform?: SocialPlatform;
    isOptimalTime: boolean;
}

export interface CalendarWeek {
    weekNumber: number;
    startDate: string;
    endDate: string;
    entries: CalendarEntry[];
    totalPosts: number;
    totalScheduled: number;
    totalPublished: number;
}

export interface ContentCalendar {
    owner: SocialOwner;
    weeks: CalendarWeek[];
    totalPosts: number;
    publishingFrequency: number; // posts per week
    nextSuggestedSlot: CalendarEntry | null;
    platformDistribution: Record<SocialPlatform, number>;
}

export interface AnalyticsSummary {
    totalPosts: number;
    totalImpressions: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalClicks: number;
    avgEngagementRate: number;
    bestPerformingPlatform?: SocialPlatform;
    bestPerformingDay?: string;
    bestPerformingHour?: number;
    growthRate: number; // % change from last period
    platformBreakdown: Record<string, {
        posts: number;
        impressions: number;
        engagements: number;
        clicks: number;
    }>;
}

// ============================================
// UNIFIED SOCIAL SERVICE
// ============================================

/**
 * All methods accept a SocialOwner to scope operations
 * to either a user or a product. The owner determines:
 * - Which accounts to query/use
 * - Which posts to fetch/create
 * - What content strategy to use for AI generation
 * - How analytics are aggregated
 */

// ─── ACCOUNTS ────────────────────────────────

/**
 * Fetch all connected social accounts for the given owner.
 */
export async function getAccounts(owner: SocialOwner): Promise<UnifiedSocialAccount[]> {
    const params = new URLSearchParams({
        ownerType: owner.type,
        ownerId: owner.ownerId,
    });

    const res = await fetch(`/api/social/accounts?${params}`, {
        headers: { 'x-user-id': owner.actingUserId },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.accounts || [];
}

/**
 * Connect a new social account for the given owner.
 * Redirects to the OAuth flow.
 */
export function getConnectUrl(owner: SocialOwner, platform: SocialPlatform): string {
    const params = new URLSearchParams({
        ownerType: owner.type,
        ownerId: owner.ownerId,
    });
    return `/api/social/callback/${platform}?${params}`;
}

/**
 * Disconnect a social account.
 */
export async function disconnectAccount(owner: SocialOwner, accountId: string): Promise<boolean> {
    const res = await fetch('/api/social/accounts', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': owner.actingUserId,
        },
        body: JSON.stringify({ accountId }),
    });
    return res.ok;
}

// ─── POSTS ───────────────────────────────────

/**
 * Fetch posts for the given owner with optional filters.
 */
export async function getPosts(
    owner: SocialOwner,
    filters?: {
        status?: PostStatus;
        platform?: SocialPlatform;
        limit?: number;
        offset?: number;
        fromDate?: string;
        toDate?: string;
    }
): Promise<{ posts: UnifiedSocialPost[]; total: number }> {
    const params = new URLSearchParams({
        ownerType: owner.type,
        ownerId: owner.ownerId,
    });

    if (filters?.status) params.set('status', filters.status);
    if (filters?.platform) params.set('platform', filters.platform);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.offset) params.set('offset', String(filters.offset));
    if (filters?.fromDate) params.set('from', filters.fromDate);
    if (filters?.toDate) params.set('to', filters.toDate);

    const res = await fetch(`/api/social/posts?${params}`, {
        headers: { 'x-user-id': owner.actingUserId },
    });

    if (!res.ok) return { posts: [], total: 0 };
    return await res.json();
}

/**
 * Create a new post draft for the given owner.
 */
export async function createDraft(
    owner: SocialOwner,
    platform: SocialPlatform,
    content: string,
    options?: {
        socialAccountId?: string;
        hashtags?: string[];
        mediaUrls?: string[];
        scheduledAt?: string;
        sourceType?: string;
        sourceSessionId?: string;
        sourceInsightId?: string;
        aiDraftVariant?: string;
        aiConfidenceScore?: number;
        calendarSlot?: string;
    }
): Promise<UnifiedSocialPost | null> {
    const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': owner.actingUserId,
        },
        body: JSON.stringify({
            ownerType: owner.type,
            ownerId: owner.ownerId,
            platform,
            content,
            ...options,
        }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.post || null;
}

/**
 * Update an existing post.
 */
export async function updatePost(
    owner: SocialOwner,
    postId: string,
    updates: Partial<{
        content: string;
        hashtags: string[];
        mediaUrls: string[];
        status: PostStatus;
        scheduledAt: string;
        socialAccountId: string;
        platform: SocialPlatform;
    }>
): Promise<UnifiedSocialPost | null> {
    const res = await fetch('/api/social/posts', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': owner.actingUserId,
        },
        body: JSON.stringify({
            postId,
            ownerType: owner.type,
            ownerId: owner.ownerId,
            ...updates,
        }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.post || null;
}

/**
 * Delete a post.
 */
export async function deletePost(owner: SocialOwner, postId: string): Promise<boolean> {
    const res = await fetch('/api/social/posts', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': owner.actingUserId,
        },
        body: JSON.stringify({ postId }),
    });
    return res.ok;
}

// ─── PUBLISHING ──────────────────────────────

/**
 * Publish a post immediately.
 */
export async function publishNow(owner: SocialOwner, postId: string): Promise<UnifiedSocialPost | null> {
    const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': owner.actingUserId,
        },
        body: JSON.stringify({
            postId,
            ownerType: owner.type,
            ownerId: owner.ownerId,
        }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.post || null;
}

// ─── CALENDAR ────────────────────────────────

/**
 * Get the content calendar for the given owner.
 * Works identically for users and products.
 */
export async function getCalendar(
    owner: SocialOwner,
    options?: {
        weeks?: number;      // How many weeks to show (default: 4)
        startDate?: string;  // Calendar start date (default: current week)
    }
): Promise<ContentCalendar | null> {
    const params = new URLSearchParams({
        ownerType: owner.type,
        ownerId: owner.ownerId,
    });
    if (options?.weeks) params.set('weeks', String(options.weeks));
    if (options?.startDate) params.set('startDate', options.startDate);

    const res = await fetch(`/api/social/calendar?${params}`, {
        headers: { 'x-user-id': owner.actingUserId },
    });

    if (!res.ok) return null;
    return await res.json();
}

/**
 * Generate AI content suggestions for empty calendar slots.
 */
export async function fillCalendarSlots(
    owner: SocialOwner,
    slotCount: number = 5,
    platforms?: SocialPlatform[]
): Promise<UnifiedSocialPost[]> {
    const res = await fetch('/api/social/calendar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': owner.actingUserId,
        },
        body: JSON.stringify({
            ownerType: owner.type,
            ownerId: owner.ownerId,
            action: 'fill_slots',
            slotCount,
            platforms: platforms || ['linkedin', 'twitter'],
            contentStrategy: getContentSourceDescription(owner),
        }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.posts || [];
}

// ─── ANALYTICS ───────────────────────────────

/**
 * Get analytics summary for the given owner.
 */
export async function getAnalytics(
    owner: SocialOwner,
    period?: 'week' | 'month' | 'quarter' | 'year'
): Promise<AnalyticsSummary | null> {
    const params = new URLSearchParams({
        ownerType: owner.type,
        ownerId: owner.ownerId,
    });
    if (period) params.set('period', period);

    const res = await fetch(`/api/social/analytics?${params}`, {
        headers: { 'x-user-id': owner.actingUserId },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.overview || null;
}

// ─── AI CONTENT GENERATION ───────────────────

/**
 * Generate AI-powered social media content for the given owner.
 * 
 * For USERS: Content is derived from their best chat insights
 * For PRODUCTS: Content is derived from the product's description, features, and niche
 */
export async function generateContent(
    owner: SocialOwner,
    options: {
        platform: SocialPlatform;
        topic?: string;
        tone?: 'professional' | 'casual' | 'educational' | 'controversial' | 'storytelling';
        sourceSessionId?: string;
        variants?: number;
    }
): Promise<Array<{
    variant: string;
    content: string;
    hashtags: string[];
    estimatedEngagement: 'low' | 'medium' | 'high';
}>> {
    const res = await fetch('/api/social/ai-assist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': owner.actingUserId,
        },
        body: JSON.stringify({
            ownerType: owner.type,
            ownerId: owner.ownerId,
            contentStrategy: getContentSourceDescription(owner),
            ...options,
        }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.drafts || [];
}

// ─── INSIGHTS (Chat → Social Pipeline) ──────

/**
 * Get pending social insights for the given owner.
 * For users: insights from their chats
 * For products: insights from product usage patterns, FAQs, etc.
 */
export async function getInsights(
    owner: SocialOwner,
    filters?: {
        status?: 'pending' | 'drafted' | 'dismissed' | 'posted';
        limit?: number;
    }
): Promise<Array<{
    id: string;
    title: string;
    summary: string;
    keyTakeaways: string[];
    contentWorthinessScore: number;
    suggestedTone: string;
    status: string;
    createdAt: string;
}>> {
    const params = new URLSearchParams({
        ownerType: owner.type,
        ownerId: owner.ownerId,
    });
    if (filters?.status) params.set('status', filters.status);
    if (filters?.limit) params.set('limit', String(filters.limit));

    const res = await fetch(`/api/social/insights?${params}`, {
        headers: { 'x-user-id': owner.actingUserId },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.insights || [];
}

// ─── AUTOMATION ──────────────────────────────

/**
 * Get automation rules for the given owner.
 * Only meaningful for product-level owners (products can have scheduled rules).
 * Users can also set personal automation rules.
 */
export async function getAutomationRules(
    owner: SocialOwner
): Promise<Array<{
    id: string;
    name: string;
    description: string;
    triggerType: string;
    scheduleCron: string;
    actionType: string;
    isActive: boolean;
    lastRunAt: string;
    nextRunAt: string;
}>> {
    const params = new URLSearchParams({
        ownerType: owner.type,
        ownerId: owner.ownerId,
    });

    const res = await fetch(`/api/social/automation?${params}`, {
        headers: { 'x-user-id': owner.actingUserId },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.rules || [];
}
