/**
 * 🚀 Social Engine Orchestrator
 * The central nervous system that connects chat intelligence → drafting → scheduling → publishing → learning
 */

import { createClient } from '@supabase/supabase-js';
import { getAdapter, type SocialPlatform, type PostContent } from './platform-adapter';
import { extractInsightFromChat, generateDrafts, analyzeContentPatterns, suggestOptimalPostTime } from './content-intelligence';

// ============================================
// TYPES
// ============================================

export interface SocialAccount {
    id: string;
    userId: string;
    productId?: string;
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
}

export interface SocialPost {
    id: string;
    userId: string;
    socialAccountId?: string;
    content: string;
    contentHtml?: string;
    mediaUrls?: string[];
    hashtags?: string[];
    mentions?: string[];
    platform: SocialPlatform;
    platformPostId?: string;
    platformPostUrl?: string;
    status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
    scheduledAt?: string;
    publishedAt?: string;
    failedReason?: string;
    sourceType?: string;
    sourceSessionId?: string;
    sourceInsightId?: string;
    aiDraftVariant?: string;
    aiConfidenceScore?: number;
    userEdited: boolean;
    editCount: number;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// HELPER: Supabase client
// ============================================

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase credentials not configured');
    return createClient(url, key);
}

// ============================================
// ACCOUNT MANAGEMENT
// ============================================

/**
 * Save or update a connected social account
 */
export async function saveAccount(
    userId: string,
    platform: SocialPlatform,
    data: {
        platformUserId: string;
        platformUsername: string;
        platformDisplayName: string;
        platformAvatarUrl?: string;
        accessToken: string;
        refreshToken?: string;
        tokenExpiresAt?: Date;
        scopes?: string[];
    },
    productId?: string
): Promise<SocialAccount> {
    const supabase = getSupabase();

    const accountRecord = {
        user_id: userId,
        platform,
        product_id: productId || null,
        platform_user_id: data.platformUserId,
        platform_username: data.platformUsername,
        platform_display_name: data.platformDisplayName,
        platform_avatar_url: data.platformAvatarUrl,
        access_token: data.accessToken,
        refresh_token: data.refreshToken,
        token_expires_at: data.tokenExpiresAt?.toISOString(),
        scopes: data.scopes,
        is_active: true,
        last_synced_at: new Date().toISOString(),
    };

    // Check for existing account (handles NULL product_id via partial unique indexes)
    let existingQuery = supabase
        .from('social_accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('platform', platform);

    if (productId) {
        existingQuery = existingQuery.eq('product_id', productId);
    } else {
        existingQuery = existingQuery.is('product_id', null);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    let account;
    if (existing) {
        // Update existing account
        const { data: updated, error } = await supabase
            .from('social_accounts')
            .update(accountRecord)
            .eq('id', existing.id)
            .select()
            .single();
        if (error) throw new Error(`Failed to update account: ${error.message}`);
        account = updated;
    } else {
        // Insert new account
        const { data: inserted, error } = await supabase
            .from('social_accounts')
            .insert(accountRecord)
            .select()
            .single();
        if (error) throw new Error(`Failed to save account: ${error.message}`);
        account = inserted;
    }

    return mapAccountRow(account);
}

/**
 * Get all connected accounts for a user
 */
export async function getAccounts(userId: string, productId?: string): Promise<SocialAccount[]> {
    const supabase = getSupabase();
    let query = supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

    if (productId) {
        query = query.eq('product_id', productId);
    } else {
        query = query.is('product_id', null);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to get accounts: ${error.message}`);
    return (data || []).map(mapAccountRow);
}

/**
 * Get a specific account (with fresh token)
 */
export async function getAccountWithFreshToken(
    accountId: string
): Promise<SocialAccount> {
    const supabase = getSupabase();
    const { data: account, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

    if (error || !account) throw new Error('Account not found');

    // Check if token is expired
    if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
        if (account.refresh_token) {
            const adapter = getAdapter(account.platform);
            const newTokens = await adapter.refreshToken(account.refresh_token);

            await supabase
                .from('social_accounts')
                .update({
                    access_token: newTokens.accessToken,
                    refresh_token: newTokens.refreshToken || account.refresh_token,
                    token_expires_at: newTokens.expiresAt.toISOString(),
                })
                .eq('id', accountId);

            account.access_token = newTokens.accessToken;
        } else {
            throw new Error('Token expired and no refresh token available');
        }
    }

    return mapAccountRow(account);
}

/**
 * Disconnect a social account
 */
export async function disconnectAccount(userId: string, accountId: string): Promise<void> {
    const supabase = getSupabase();
    await supabase
        .from('social_accounts')
        .update({ is_active: false })
        .eq('id', accountId)
        .eq('user_id', userId);
}

// ============================================
// POST MANAGEMENT
// ============================================

/**
 * Create a draft post
 */
export async function createDraft(
    userId: string,
    platform: SocialPlatform,
    content: string,
    options?: {
        socialAccountId?: string;
        hashtags?: string[];
        mediaUrls?: string[];
        sourceType?: string;
        sourceSessionId?: string;
        sourceInsightId?: string;
        aiDraftVariant?: string;
        aiConfidenceScore?: number;
        scheduledAt?: Date;
    }
): Promise<SocialPost> {
    const supabase = getSupabase();

    const { data: post, error } = await supabase
        .from('social_posts')
        .insert({
            user_id: userId,
            social_account_id: options?.socialAccountId,
            content,
            hashtags: options?.hashtags || [],
            media_urls: options?.mediaUrls || [],
            platform,
            status: options?.scheduledAt ? 'scheduled' : 'draft',
            scheduled_at: options?.scheduledAt?.toISOString(),
            source_type: options?.sourceType || 'manual',
            source_session_id: options?.sourceSessionId,
            source_insight_id: options?.sourceInsightId,
            ai_draft_variant: options?.aiDraftVariant,
            ai_confidence_score: options?.aiConfidenceScore,
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create draft: ${error.message}`);
    return mapPostRow(post);
}

/**
 * Get posts for a user with optional filters
 */
export async function getPosts(
    userId: string,
    filters?: {
        status?: string;
        platform?: string;
        limit?: number;
        offset?: number;
    }
): Promise<{ posts: SocialPost[]; total: number }> {
    const supabase = getSupabase();
    let query = supabase
        .from('social_posts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.platform) query = query.eq('platform', filters.platform);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(`Failed to get posts: ${error.message}`);

    return {
        posts: (data || []).map(mapPostRow),
        total: count || 0,
    };
}

/**
 * Update a post (edit content, change schedule, etc.)
 */
export async function updatePost(
    userId: string,
    postId: string,
    updates: Partial<{
        content: string;
        hashtags: string[];
        mediaUrls: string[];
        status: string;
        scheduledAt: string;
        socialAccountId: string;
    }>
): Promise<SocialPost> {
    const supabase = getSupabase();

    const dbUpdates: Record<string, unknown> = {};
    if (updates.content !== undefined) {
        dbUpdates.content = updates.content;
        dbUpdates.user_edited = true;
        // Increment edit count
        const { data: current } = await supabase
            .from('social_posts')
            .select('edit_count')
            .eq('id', postId)
            .single();
        dbUpdates.edit_count = (current?.edit_count || 0) + 1;
    }
    if (updates.hashtags) dbUpdates.hashtags = updates.hashtags;
    if (updates.mediaUrls) dbUpdates.media_urls = updates.mediaUrls;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.scheduledAt) dbUpdates.scheduled_at = updates.scheduledAt;
    if (updates.socialAccountId) dbUpdates.social_account_id = updates.socialAccountId;

    const { data, error } = await supabase
        .from('social_posts')
        .update(dbUpdates)
        .eq('id', postId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new Error(`Failed to update post: ${error.message}`);
    return mapPostRow(data);
}

// ============================================
// PUBLISHING
// ============================================

/**
 * Publish a post to the connected platform
 */
export async function publishPost(postId: string): Promise<SocialPost> {
    const supabase = getSupabase();

    // Get the post
    const { data: post, error: postError } = await supabase
        .from('social_posts')
        .select('*')
        .eq('id', postId)
        .single();

    if (postError || !post) throw new Error('Post not found');

    // Get the account with fresh token
    let account: SocialAccount;
    if (post.social_account_id) {
        account = await getAccountWithFreshToken(post.social_account_id);
    } else {
        // Find the default account for this platform
        const { data: accounts } = await supabase
            .from('social_accounts')
            .select('*')
            .eq('user_id', post.user_id)
            .eq('platform', post.platform)
            .eq('is_active', true)
            .limit(1);

        if (!accounts || accounts.length === 0) {
            await supabase
                .from('social_posts')
                .update({ status: 'failed', failed_reason: 'No connected account found' })
                .eq('id', postId);
            throw new Error('No connected account found for this platform');
        }
        account = await getAccountWithFreshToken(accounts[0].id);
    }

    // Mark as publishing
    await supabase
        .from('social_posts')
        .update({ status: 'publishing', social_account_id: account.id })
        .eq('id', postId);

    try {
        const adapter = getAdapter(post.platform as SocialPlatform);

        // Build the full post text with hashtags appended
        let fullText = post.content;
        const hashtags = post.hashtags as string[] | null;
        if (hashtags && hashtags.length > 0) {
            const hashtagLine = hashtags.map((tag: string) => `#${tag.replace(/^#/, '')}`).join(' ');
            fullText = `${fullText}\n\n${hashtagLine}`;
        }

        const postContent: PostContent = {
            text: fullText,
            mediaUrls: post.media_urls,
        };

        const result = await adapter.post(account.accessToken, account.platformUserId, postContent);

        // Update post with success
        const { data: updated, error: updateError } = await supabase
            .from('social_posts')
            .update({
                status: 'published',
                platform_post_id: result.platformPostId,
                platform_post_url: result.platformPostUrl,
                published_at: new Date().toISOString(),
            })
            .eq('id', postId)
            .select()
            .single();

        if (updateError) throw updateError;
        return mapPostRow(updated);
    } catch (error) {
        // Mark as failed
        const reason = error instanceof Error ? error.message : 'Unknown publishing error';
        await supabase
            .from('social_posts')
            .update({ status: 'failed', failed_reason: reason })
            .eq('id', postId);

        throw new Error(`Publishing failed: ${reason}`);
    }
}

// ============================================
// ANALYTICS COLLECTION
// ============================================

/**
 * Collect analytics for all published posts
 */
export async function collectAnalytics(userId: string): Promise<number> {
    const supabase = getSupabase();

    // Get all published posts
    const { data: posts } = await supabase
        .from('social_posts')
        .select('*, social_accounts!inner(*)')
        .eq('user_id', userId)
        .eq('status', 'published')
        .not('platform_post_id', 'is', null);

    if (!posts || posts.length === 0) return 0;

    let collected = 0;
    for (const post of posts) {
        try {
            const adapter = getAdapter(post.platform as SocialPlatform);
            const account = await getAccountWithFreshToken(post.social_account_id);

            console.log(`[SocialEngine] Collecting analytics for Post ${post.id} (Platform ID: ${post.platform_post_id})`);
            const analytics = await adapter.getAnalytics(account.accessToken, post.platform_post_id);
            console.log(`[SocialEngine] Analytics result for ${post.id}:`, analytics);

            const hoursSincePublish = Math.floor(
                (Date.now() - new Date(post.published_at).getTime()) / (1000 * 60 * 60)
            );

            await supabase.from('social_analytics').insert({
                post_id: post.id,
                impressions: analytics.impressions,
                reach: analytics.reach,
                likes: analytics.likes,
                comments: analytics.comments,
                shares: analytics.shares,
                saves: analytics.saves,
                clicks: analytics.clicks,
                engagement_rate: analytics.engagementRate,
                follower_change: analytics.followerChange,
                profile_visits: analytics.profileVisits,
                hours_since_publish: hoursSincePublish,
                raw_data: analytics,
            });

            collected++;
        } catch (error) {
            console.error(`[SocialEngine] Analytics collection failed for post ${post.id}:`, error);
        }
    }

    return collected;
}

// ============================================
// INSIGHT PIPELINE
// ============================================

/**
 * Process a chat session through the full insight pipeline
 * Chat → Insight → Drafts → Save to DB
 */
export async function processSessionForInsights(
    userId: string,
    sessionId: string,
    messages: Array<{ role: string; content: string }>
): Promise<{
    insight: ReturnType<typeof extractInsightFromChat> extends Promise<infer T> ? T : never;
    drafts: Array<{ id: string; variant: string; content: string }>;
} | null> {
    // Step 1: Extract insight
    const insight = await extractInsightFromChat(messages);
    if (!insight) return null;

    const supabase = getSupabase();

    // Step 2: Save insight to DB
    const { data: savedInsight, error: insightError } = await supabase
        .from('social_insights')
        .insert({
            user_id: userId,
            session_id: sessionId,
            title: insight.title,
            summary: insight.summary,
            key_takeaways: insight.keyTakeaways,
            content_worthiness_score: insight.contentWorthinessScore,
            suggested_platforms: insight.suggestedPlatforms,
            suggested_tone: insight.suggestedTone,
            suggested_hooks: insight.suggestedHooks,
            topic_tags: insight.topicTags,
            status: 'pending',
        })
        .select()
        .single();

    if (insightError) {
        console.error('[SocialEngine] Failed to save insight:', insightError);
        return null;
    }

    // Step 3: Generate drafts
    const draftVariants = await generateDrafts(insight, 'linkedin');
    const savedDrafts: Array<{ id: string; variant: string; content: string }> = [];

    for (const draft of draftVariants) {
        try {
            const { data: savedDraft } = await supabase
                .from('social_posts')
                .insert({
                    user_id: userId,
                    content: draft.content,
                    hashtags: draft.hashtags,
                    platform: 'linkedin',
                    status: 'draft',
                    source_type: 'chat_insight',
                    source_session_id: sessionId,
                    source_insight_id: savedInsight.id,
                    ai_draft_variant: draft.variant,
                    ai_confidence_score: draft.estimatedEngagement === 'high' ? 0.9 : draft.estimatedEngagement === 'medium' ? 0.6 : 0.3,
                })
                .select()
                .single();

            if (savedDraft) {
                savedDrafts.push({
                    id: savedDraft.id,
                    variant: draft.variant,
                    content: draft.content,
                });
            }
        } catch (error) {
            console.error('[SocialEngine] Failed to save draft:', error);
        }
    }

    // Update insight status
    if (savedDrafts.length > 0) {
        await supabase
            .from('social_insights')
            .update({ status: 'drafted' })
            .eq('id', savedInsight.id);
    }

    return { insight, drafts: savedDrafts };
}

// ============================================
// HELPERS
// ============================================

function mapAccountRow(row: Record<string, unknown>): SocialAccount {
    return {
        id: row.id as string,
        userId: row.user_id as string,
        productId: row.product_id as string | undefined,
        platform: row.platform as SocialPlatform,
        platformUserId: row.platform_user_id as string,
        platformUsername: row.platform_username as string,
        platformDisplayName: row.platform_display_name as string,
        platformAvatarUrl: row.platform_avatar_url as string | undefined,
        accessToken: row.access_token as string,
        refreshToken: row.refresh_token as string | undefined,
        tokenExpiresAt: row.token_expires_at as string | undefined,
        isActive: row.is_active as boolean,
        scopes: row.scopes as string[] | undefined,
    };
}

function mapPostRow(row: Record<string, unknown>): SocialPost {
    return {
        id: row.id as string,
        userId: row.user_id as string,
        socialAccountId: row.social_account_id as string | undefined,
        content: row.content as string,
        contentHtml: row.content_html as string | undefined,
        mediaUrls: row.media_urls as string[] | undefined,
        hashtags: row.hashtags as string[] | undefined,
        mentions: row.mentions as string[] | undefined,
        platform: row.platform as SocialPlatform,
        platformPostId: row.platform_post_id as string | undefined,
        platformPostUrl: row.platform_post_url as string | undefined,
        status: row.status as SocialPost['status'],
        scheduledAt: row.scheduled_at as string | undefined,
        publishedAt: row.published_at as string | undefined,
        failedReason: row.failed_reason as string | undefined,
        sourceType: row.source_type as string | undefined,
        sourceSessionId: row.source_session_id as string | undefined,
        sourceInsightId: row.source_insight_id as string | undefined,
        aiDraftVariant: row.ai_draft_variant as string | undefined,
        aiConfidenceScore: row.ai_confidence_score as number | undefined,
        userEdited: row.user_edited as boolean,
        editCount: row.edit_count as number,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}
