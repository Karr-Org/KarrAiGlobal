-- ============================================
-- 022: Social Engine — Autonomous Growth System
-- Tables for social accounts, posts, analytics, insights, and AI learning
-- ============================================
-- 1. Social Accounts (OAuth tokens per platform per user)
CREATE TABLE IF NOT EXISTS social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL,
    -- 'linkedin', 'twitter', 'facebook', 'instagram'
    platform_user_id VARCHAR(255),
    -- Platform-specific user ID (e.g., LinkedIn member URN)
    platform_username VARCHAR(255),
    platform_display_name VARCHAR(255),
    platform_avatar_url TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT [],
    -- OAuth scopes granted
    is_active BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, platform)
);
-- 2. Social Posts (Full lifecycle: draft → scheduled → published)
CREATE TABLE IF NOT EXISTS social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    social_account_id UUID REFERENCES social_accounts(id) ON DELETE
    SET NULL,
        -- Content
        content TEXT NOT NULL,
        content_html TEXT,
        -- Rich formatted version
        media_urls TEXT [] DEFAULT '{}',
        hashtags TEXT [] DEFAULT '{}',
        mentions TEXT [] DEFAULT '{}',
        -- Platform info
        platform VARCHAR(20) NOT NULL,
        platform_post_id VARCHAR(255),
        -- ID returned after publishing
        platform_post_url TEXT,
        -- Direct URL to the published post
        -- Lifecycle
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        -- draft, scheduled, publishing, published, failed
        scheduled_at TIMESTAMPTZ,
        published_at TIMESTAMPTZ,
        failed_reason TEXT,
        -- AI metadata
        source_type VARCHAR(30),
        -- 'chat_insight', 'manual', 'ai_suggestion'
        source_session_id UUID,
        -- Link to chat session that inspired this post
        source_insight_id UUID,
        -- Link to the AI insight
        ai_draft_variant VARCHAR(30),
        -- 'hook_first', 'story', 'data_driven', 'contrarian'
        ai_confidence_score FLOAT,
        -- How confident AI was in this draft
        -- User interaction
        user_edited BOOLEAN DEFAULT false,
        edit_count INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 3. Social Analytics (Engagement snapshots per post)
CREATE TABLE IF NOT EXISTS social_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    -- Core metrics
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    -- Engagement
    engagement_rate FLOAT DEFAULT 0,
    -- (likes + comments + shares) / impressions
    -- Growth impact
    follower_change INTEGER DEFAULT 0,
    -- Net followers gained from this post
    profile_visits INTEGER DEFAULT 0,
    -- Snapshot time (we poll periodically)
    snapshot_at TIMESTAMPTZ DEFAULT NOW(),
    hours_since_publish INTEGER,
    -- How many hours after publishing was this snapshot
    raw_data JSONB DEFAULT '{}',
    -- Full API response for debugging
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 4. Social Insights (AI-extracted insights from chats)
CREATE TABLE IF NOT EXISTS social_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID,
    -- Chat session this insight came from
    -- Insight content
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    key_takeaways TEXT [] DEFAULT '{}',
    content_worthiness_score FLOAT DEFAULT 0,
    -- 0-100
    -- AI analysis
    suggested_platforms TEXT [] DEFAULT '{"linkedin"}',
    suggested_tone VARCHAR(30),
    -- 'thought_leader', 'casual', 'educational', 'controversial'
    suggested_hooks TEXT [] DEFAULT '{}',
    -- Opening line suggestions
    topic_tags TEXT [] DEFAULT '{}',
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    -- pending, drafted, dismissed, posted
    dismissed_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 5. Content Patterns (AI learning: what wins and why)
CREATE TABLE IF NOT EXISTS content_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Pattern type
    pattern_type VARCHAR(30) NOT NULL,
    -- 'topic', 'time', 'format', 'tone', 'length', 'hashtag'
    pattern_key VARCHAR(255) NOT NULL,
    -- e.g., 'api_scalability', 'tuesday_10am', 'hook_first'
    -- Performance data
    total_posts INTEGER DEFAULT 0,
    avg_engagement_rate FLOAT DEFAULT 0,
    avg_impressions INTEGER DEFAULT 0,
    avg_likes FLOAT DEFAULT 0,
    avg_comments FLOAT DEFAULT 0,
    avg_shares FLOAT DEFAULT 0,
    best_post_id UUID REFERENCES social_posts(id) ON DELETE
    SET NULL,
        worst_post_id UUID REFERENCES social_posts(id) ON DELETE
    SET NULL,
        -- AI recommendation
        recommendation_score FLOAT DEFAULT 0,
        -- -1 (avoid) to 1 (strong recommend)
        ai_notes TEXT,
        -- Natural language insight about this pattern
        last_analyzed_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, pattern_type, pattern_key)
);
-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(status, scheduled_at)
WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_analytics_post ON social_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_social_analytics_time ON social_analytics(post_id, snapshot_at);
CREATE INDEX IF NOT EXISTS idx_social_insights_user ON social_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_social_insights_status ON social_insights(user_id, status);
CREATE INDEX IF NOT EXISTS idx_content_patterns_user ON content_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_content_patterns_type ON content_patterns(user_id, pattern_type);
-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_patterns ENABLE ROW LEVEL SECURITY;
-- Social accounts: users can only see/manage their own
DROP POLICY IF EXISTS "Users manage own social accounts" ON social_accounts;
CREATE POLICY "Users manage own social accounts" ON social_accounts FOR ALL USING (auth.uid() = user_id);
-- Social posts: users can only see/manage their own
DROP POLICY IF EXISTS "Users manage own social posts" ON social_posts;
CREATE POLICY "Users manage own social posts" ON social_posts FOR ALL USING (auth.uid() = user_id);
-- Social analytics: users can see analytics for their posts
DROP POLICY IF EXISTS "Users view own post analytics" ON social_analytics;
CREATE POLICY "Users view own post analytics" ON social_analytics FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM social_posts
            WHERE social_posts.id = social_analytics.post_id
                AND social_posts.user_id = auth.uid()
        )
    );
-- Social insights: users can only see their own
DROP POLICY IF EXISTS "Users manage own insights" ON social_insights;
CREATE POLICY "Users manage own insights" ON social_insights FOR ALL USING (auth.uid() = user_id);
-- Content patterns: users can only see their own
DROP POLICY IF EXISTS "Users view own content patterns" ON content_patterns;
CREATE POLICY "Users view own content patterns" ON content_patterns FOR ALL USING (auth.uid() = user_id);
-- ============================================
-- TRIGGER: auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_social_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_social_accounts_updated ON social_accounts;
CREATE TRIGGER trg_social_accounts_updated BEFORE
UPDATE ON social_accounts FOR EACH ROW EXECUTE FUNCTION update_social_updated_at();
DROP TRIGGER IF EXISTS trg_social_posts_updated ON social_posts;
CREATE TRIGGER trg_social_posts_updated BEFORE
UPDATE ON social_posts FOR EACH ROW EXECUTE FUNCTION update_social_updated_at();
DROP TRIGGER IF EXISTS trg_social_insights_updated ON social_insights;
CREATE TRIGGER trg_social_insights_updated BEFORE
UPDATE ON social_insights FOR EACH ROW EXECUTE FUNCTION update_social_updated_at();
DROP TRIGGER IF EXISTS trg_content_patterns_updated ON content_patterns;
CREATE TRIGGER trg_content_patterns_updated BEFORE
UPDATE ON content_patterns FOR EACH ROW EXECUTE FUNCTION update_social_updated_at();