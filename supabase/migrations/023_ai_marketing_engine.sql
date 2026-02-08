-- ============================================
-- AI MARKETING ENGINE - DATABASE SCHEMA
-- Created: 2026-02-07
-- ============================================
-- Product Marketing Profile
CREATE TABLE IF NOT EXISTS product_marketing_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    -- Brand Identity
    brand_voice TEXT DEFAULT 'Professional',
    tone_keywords TEXT [] DEFAULT ARRAY ['innovative', 'trustworthy', 'helpful'],
    language_style TEXT DEFAULT 'conversational',
    tagline TEXT,
    unique_value_proposition TEXT,
    -- Target Audience (JSON for flexibility)
    primary_persona JSONB DEFAULT '{"name": "Target User", "pain_points": [], "goals": [], "demographics": {}}',
    secondary_personas JSONB DEFAULT '[]',
    -- Content Pillars
    content_pillars TEXT [] DEFAULT ARRAY ['Education', 'Thought Leadership', 'Product Updates'],
    pillar_weights JSONB DEFAULT '{}',
    -- Competitors
    competitors JSONB DEFAULT '[]',
    -- Keywords
    primary_keywords TEXT [] DEFAULT ARRAY []::TEXT [],
    secondary_keywords TEXT [] DEFAULT ARRAY []::TEXT [],
    long_tail_keywords TEXT [] DEFAULT ARRAY []::TEXT [],
    -- Publishing Rules
    blog_frequency TEXT DEFAULT 'weekly',
    twitter_frequency TEXT DEFAULT 'daily',
    linkedin_frequency TEXT DEFAULT '3x/week',
    instagram_frequency TEXT DEFAULT 'daily',
    posting_timezone TEXT DEFAULT 'UTC',
    optimal_hours JSONB DEFAULT '{}',
    -- Settings
    auto_publish_blogs BOOLEAN DEFAULT false,
    auto_publish_social BOOLEAN DEFAULT false,
    require_human_approval BOOLEAN DEFAULT true,
    ai_model_preference TEXT DEFAULT 'gemini-2.0-flash',
    content_generation_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id)
);
-- Content Ideas
CREATE TABLE IF NOT EXISTS content_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL DEFAULT 'blog',
    content_pillar TEXT,
    target_keywords TEXT [] DEFAULT ARRAY []::TEXT [],
    outline JSONB,
    -- Scoring
    trend_score NUMERIC(3, 2) DEFAULT 0,
    gap_score NUMERIC(3, 2) DEFAULT 0,
    viral_potential NUMERIC(3, 2) DEFAULT 0,
    seo_potential NUMERIC(3, 2) DEFAULT 0,
    aeo_potential NUMERIC(3, 2) DEFAULT 0,
    overall_score NUMERIC(3, 2) DEFAULT 0,
    -- Status
    status TEXT DEFAULT 'idea' CHECK (
        status IN (
            'idea',
            'approved',
            'in_progress',
            'review',
            'published',
            'rejected',
            'archived'
        )
    ),
    priority INTEGER DEFAULT 50,
    -- Metadata
    source TEXT DEFAULT 'manual',
    source_url TEXT,
    source_data JSONB,
    assigned_to UUID REFERENCES auth.users(id),
    scheduled_for TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Blog Posts
CREATE TABLE IF NOT EXISTS ai_blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES content_ideas(id) ON DELETE
    SET NULL,
        author_id UUID REFERENCES auth.users(id),
        -- Content
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        excerpt TEXT,
        content TEXT,
        content_html TEXT,
        featured_image TEXT,
        -- SEO
        meta_title TEXT,
        meta_description TEXT,
        og_image TEXT,
        og_title TEXT,
        og_description TEXT,
        canonical_url TEXT,
        -- AEO (Answer Engine Optimization)
        faqs JSONB DEFAULT '[]',
        definitions JSONB DEFAULT '[]',
        key_takeaways TEXT [] DEFAULT ARRAY []::TEXT [],
        structured_data JSONB,
        -- Classification
        category TEXT,
        tags TEXT [] DEFAULT ARRAY []::TEXT [],
        keywords TEXT [] DEFAULT ARRAY []::TEXT [],
        -- Scoring
        seo_score INTEGER DEFAULT 0,
        aeo_score INTEGER DEFAULT 0,
        readability_score INTEGER DEFAULT 0,
        word_count INTEGER DEFAULT 0,
        read_time_minutes INTEGER DEFAULT 0,
        -- Publishing
        status TEXT DEFAULT 'draft' CHECK (
            status IN (
                'draft',
                'review',
                'scheduled',
                'published',
                'archived'
            )
        ),
        published_at TIMESTAMPTZ,
        scheduled_for TIMESTAMPTZ,
        publish_to TEXT [] DEFAULT ARRAY ['website'],
        external_urls JSONB DEFAULT '{}',
        -- Internal Linking
        related_posts UUID [] DEFAULT ARRAY []::UUID [],
        -- Analytics
        views INTEGER DEFAULT 0,
        unique_visitors INTEGER DEFAULT 0,
        avg_time_on_page NUMERIC DEFAULT 0,
        bounce_rate NUMERIC,
        scroll_depth NUMERIC,
        shares INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        -- AI Learning
        keywords_ranked JSONB DEFAULT '{}',
        llm_citations INTEGER DEFAULT 0,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(product_id, slug)
);
-- AI Social Posts
CREATE TABLE IF NOT EXISTS ai_social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES content_ideas(id) ON DELETE
    SET NULL,
        blog_id UUID REFERENCES ai_blog_posts(id) ON DELETE
    SET NULL,
        -- Content
        platform TEXT NOT NULL CHECK (
            platform IN (
                'twitter',
                'linkedin',
                'instagram',
                'facebook',
                'youtube',
                'reddit',
                'quora',
                'medium',
                'hashnode',
                'devto'
            )
        ),
        content_type TEXT NOT NULL DEFAULT 'post' CHECK (
            content_type IN (
                'post',
                'thread',
                'carousel',
                'story',
                'reel',
                'article',
                'answer',
                'comment'
            )
        ),
        content TEXT,
        content_variations TEXT [] DEFAULT ARRAY []::TEXT [],
        thread_parts TEXT [] DEFAULT ARRAY []::TEXT [],
        carousel_slides JSONB DEFAULT '[]',
        media_urls TEXT [] DEFAULT ARRAY []::TEXT [],
        hashtags TEXT [] DEFAULT ARRAY []::TEXT [],
        mentions TEXT [] DEFAULT ARRAY []::TEXT [],
        link_url TEXT,
        call_to_action TEXT,
        -- AI Generation
        ai_model TEXT,
        generation_prompt TEXT,
        generation_temperature NUMERIC,
        -- Scheduling
        status TEXT DEFAULT 'draft' CHECK (
            status IN (
                'draft',
                'review',
                'approved',
                'scheduled',
                'publishing',
                'published',
                'failed',
                'archived'
            )
        ),
        scheduled_for TIMESTAMPTZ,
        published_at TIMESTAMPTZ,
        optimal_time_calculated BOOLEAN DEFAULT false,
        -- External
        external_post_id TEXT,
        external_url TEXT,
        -- Analytics
        impressions INTEGER DEFAULT 0,
        reach INTEGER DEFAULT 0,
        engagements INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        saves INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        profile_visits INTEGER DEFAULT 0,
        engagement_rate NUMERIC,
        click_through_rate NUMERIC,
        -- Learning
        performance_score NUMERIC,
        viral_success BOOLEAN DEFAULT false,
        learnings TEXT [] DEFAULT ARRAY []::TEXT [],
        -- A/B Testing
        ab_test_id UUID,
        ab_variant TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Marketing Daily Reports
CREATE TABLE IF NOT EXISTS marketing_daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    total_impressions INTEGER DEFAULT 0,
    total_engagements INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_new_followers INTEGER DEFAULT 0,
    blog_views INTEGER DEFAULT 0,
    blog_unique_visitors INTEGER DEFAULT 0,
    platform_metrics JSONB DEFAULT '{}',
    top_posts JSONB DEFAULT '[]',
    worst_posts JSONB DEFAULT '[]',
    ai_insights TEXT [] DEFAULT ARRAY []::TEXT [],
    pattern_changes JSONB DEFAULT '{}',
    anomalies JSONB DEFAULT '[]',
    strategy_recommendations TEXT [] DEFAULT ARRAY []::TEXT [],
    content_suggestions JSONB DEFAULT '[]',
    timing_adjustments JSONB DEFAULT '{}',
    vs_yesterday JSONB DEFAULT '{}',
    vs_last_week JSONB DEFAULT '{}',
    vs_last_month JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, report_date)
);
-- LLM Citations
CREATE TABLE IF NOT EXISTS llm_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    llm_name TEXT NOT NULL CHECK (
        llm_name IN (
            'chatgpt',
            'claude',
            'perplexity',
            'gemini',
            'copilot',
            'other'
        )
    ),
    llm_model TEXT,
    query TEXT,
    response_snippet TEXT,
    full_response TEXT,
    citation_type TEXT DEFAULT 'direct_mention' CHECK (
        citation_type IN (
            'direct_mention',
            'recommendation',
            'comparison',
            'definition',
            'link'
        )
    ),
    citation_text TEXT,
    sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    confidence NUMERIC,
    content_type TEXT,
    content_id UUID,
    source_url TEXT,
    screenshot_url TEXT,
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    discovered_by TEXT DEFAULT 'system'
);
-- Content Learnings
CREATE TABLE IF NOT EXISTS content_learnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    learning_type TEXT NOT NULL CHECK (
        learning_type IN (
            'format',
            'topic',
            'timing',
            'hashtag',
            'length',
            'tone',
            'visual',
            'cta',
            'platform'
        )
    ),
    platform TEXT,
    insight TEXT NOT NULL,
    evidence JSONB DEFAULT '{}',
    confidence NUMERIC DEFAULT 0.5,
    sample_size INTEGER DEFAULT 0,
    statistical_significance NUMERIC,
    metric_name TEXT,
    before_value NUMERIC,
    after_value NUMERIC,
    improvement_percent NUMERIC,
    applied BOOLEAN DEFAULT false,
    applied_at TIMESTAMPTZ,
    strategy_change_description TEXT,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    superseded_by UUID REFERENCES content_learnings(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Content Calendar
CREATE TABLE IF NOT EXISTS content_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    entry_type TEXT NOT NULL CHECK (
        entry_type IN (
            'blog',
            'social',
            'email',
            'video',
            'event',
            'milestone'
        )
    ),
    title TEXT NOT NULL,
    description TEXT,
    idea_id UUID REFERENCES content_ideas(id) ON DELETE
    SET NULL,
        blog_id UUID REFERENCES ai_blog_posts(id) ON DELETE
    SET NULL,
        social_post_id UUID REFERENCES ai_social_posts(id) ON DELETE
    SET NULL,
        assigned_to UUID REFERENCES auth.users(id),
        status TEXT DEFAULT 'planned' CHECK (
            status IN (
                'planned',
                'in_progress',
                'review',
                'ready',
                'published',
                'cancelled'
            )
        ),
        platforms TEXT [] DEFAULT ARRAY []::TEXT [],
        tags TEXT [] DEFAULT ARRAY []::TEXT [],
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Product Social Accounts (OAuth tokens per platform per PRODUCT for auto-publishing)
CREATE TABLE IF NOT EXISTS product_social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (
        platform IN (
            'twitter',
            'linkedin',
            'facebook',
            'instagram',
            'youtube',
            'medium',
            'hashnode',
            'devto'
        )
    ),
    -- Platform identifiers
    platform_user_id VARCHAR(255),
    platform_username VARCHAR(255),
    platform_display_name VARCHAR(255),
    platform_avatar_url TEXT,
    platform_page_id VARCHAR(255),
    -- For FB/LinkedIn pages
    platform_page_name VARCHAR(255),
    -- OAuth tokens
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT [],
    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    -- Primary account for this platform
    auto_publish_enabled BOOLEAN DEFAULT true,
    -- Metadata
    last_synced_at TIMESTAMPTZ,
    last_post_at TIMESTAMPTZ,
    follower_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, platform, platform_user_id)
);
-- Automation Rules (Scheduled content generation and publishing)
CREATE TABLE IF NOT EXISTS marketing_automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    -- Trigger
    trigger_type TEXT NOT NULL CHECK (
        trigger_type IN (
            'schedule',
            -- Cron-based schedule
            'event',
            -- On specific event (new blog, etc.)
            'manual' -- Manual trigger only
        )
    ),
    schedule_cron TEXT,
    -- e.g., '0 9 * * 1-5' for weekdays at 9am
    schedule_timezone TEXT DEFAULT 'UTC',
    -- Action
    action_type TEXT NOT NULL CHECK (
        action_type IN (
            'generate_ideas',
            'generate_blog',
            'generate_social',
            'publish_blog',
            'publish_social',
            'repurpose_content'
        )
    ),
    action_config JSONB DEFAULT '{}',
    -- Platform, content type, etc.
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    last_run_status TEXT,
    next_run_at TIMESTAMPTZ,
    run_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_ideas_product ON content_ideas(product_id);
CREATE INDEX IF NOT EXISTS idx_content_ideas_status ON content_ideas(status);
CREATE INDEX IF NOT EXISTS idx_ai_blog_posts_product ON ai_blog_posts(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_blog_posts_status ON ai_blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_ai_social_posts_product ON ai_social_posts(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_social_posts_platform ON ai_social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_ai_social_posts_status ON ai_social_posts(status);
CREATE INDEX IF NOT EXISTS idx_llm_citations_product ON llm_citations(product_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_product_date ON content_calendar(product_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_marketing_reports_product_date ON marketing_daily_reports(product_id, report_date);
CREATE INDEX IF NOT EXISTS idx_product_social_accounts_product ON product_social_accounts(product_id);
CREATE INDEX IF NOT EXISTS idx_product_social_accounts_platform ON product_social_accounts(product_id, platform);
CREATE INDEX IF NOT EXISTS idx_automation_rules_product ON marketing_automation_rules(product_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_next_run ON marketing_automation_rules(next_run_at)
WHERE is_active = true;
-- Enable RLS
ALTER TABLE product_marketing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
-- RLS Policies (using product ownership)
CREATE POLICY "Users can manage their product marketing profiles" ON product_marketing_profiles FOR ALL USING (
    product_id IN (
        SELECT id
        FROM products
        WHERE created_by = auth.uid()
    )
);
CREATE POLICY "Users can manage their content ideas" ON content_ideas FOR ALL USING (
    product_id IN (
        SELECT id
        FROM products
        WHERE created_by = auth.uid()
    )
);
CREATE POLICY "Users can manage their blog posts" ON ai_blog_posts FOR ALL USING (
    product_id IN (
        SELECT id
        FROM products
        WHERE created_by = auth.uid()
    )
);
CREATE POLICY "Users can manage their social posts" ON ai_social_posts FOR ALL USING (
    product_id IN (
        SELECT id
        FROM products
        WHERE created_by = auth.uid()
    )
);
CREATE POLICY "Users can view their marketing reports" ON marketing_daily_reports FOR ALL USING (
    product_id IN (
        SELECT id
        FROM products
        WHERE created_by = auth.uid()
    )
);
CREATE POLICY "Users can view their LLM citations" ON llm_citations FOR ALL USING (
    product_id IN (
        SELECT id
        FROM products
        WHERE created_by = auth.uid()
    )
);
CREATE POLICY "Users can manage their content learnings" ON content_learnings FOR ALL USING (
    product_id IN (
        SELECT id
        FROM products
        WHERE created_by = auth.uid()
    )
);
CREATE POLICY "Users can manage their content calendar" ON content_calendar FOR ALL USING (
    product_id IN (
        SELECT id
        FROM products
        WHERE created_by = auth.uid()
    )
);
-- Enable RLS for new tables
ALTER TABLE product_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_automation_rules ENABLE ROW LEVEL SECURITY;
-- RLS Policies for new tables
CREATE POLICY "Users can manage their product social accounts" ON product_social_accounts FOR ALL USING (
    product_id IN (
        SELECT id
        FROM products
        WHERE created_by = auth.uid()
    )
);
CREATE POLICY "Users can manage their automation rules" ON marketing_automation_rules FOR ALL USING (
    product_id IN (
        SELECT id
        FROM products
        WHERE created_by = auth.uid()
    )
);
-- Updated at triggers
CREATE OR REPLACE FUNCTION update_marketing_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_product_marketing_profiles_updated_at BEFORE
UPDATE ON product_marketing_profiles FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();
CREATE TRIGGER update_content_ideas_updated_at BEFORE
UPDATE ON content_ideas FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();
CREATE TRIGGER update_ai_blog_posts_updated_at BEFORE
UPDATE ON ai_blog_posts FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();
CREATE TRIGGER update_ai_social_posts_updated_at BEFORE
UPDATE ON ai_social_posts FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();
CREATE TRIGGER update_content_calendar_updated_at BEFORE
UPDATE ON content_calendar FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();
CREATE TRIGGER update_product_social_accounts_updated_at BEFORE
UPDATE ON product_social_accounts FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();
CREATE TRIGGER update_marketing_automation_rules_updated_at BEFORE
UPDATE ON marketing_automation_rules FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();
-- Grant permissions
GRANT ALL ON product_marketing_profiles TO authenticated;
GRANT ALL ON content_ideas TO authenticated;
GRANT ALL ON ai_blog_posts TO authenticated;
GRANT ALL ON ai_social_posts TO authenticated;
GRANT ALL ON marketing_daily_reports TO authenticated;
GRANT ALL ON llm_citations TO authenticated;
GRANT ALL ON content_learnings TO authenticated;
GRANT ALL ON content_calendar TO authenticated;
GRANT ALL ON product_social_accounts TO authenticated;
GRANT ALL ON marketing_automation_rules TO authenticated;