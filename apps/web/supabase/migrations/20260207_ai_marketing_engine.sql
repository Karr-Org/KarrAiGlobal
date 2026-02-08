-- ============================================
-- AI MARKETING ENGINE - DATABASE SCHEMA
-- ============================================
-- Product Marketing Profiles
CREATE TABLE IF NOT EXISTS product_marketing_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    -- Brand Identity
    brand_voice TEXT DEFAULT 'Professional yet approachable, technical but clear',
    tone_keywords TEXT [] DEFAULT ARRAY ['authoritative', 'helpful', 'innovative'],
    language_style TEXT DEFAULT 'Use active voice, avoid jargon unless explained',
    tagline TEXT,
    unique_value_proposition TEXT,
    -- Target Audience
    primary_persona JSONB DEFAULT '{"name": "Decision Maker", "pain_points": [], "goals": [], "demographics": {}}',
    secondary_personas JSONB [] DEFAULT ARRAY []::JSONB [],
    -- Content Pillars
    content_pillars TEXT [] DEFAULT ARRAY ['Education', 'Product Features', 'Success Stories', 'Industry News'],
    pillar_weights JSONB DEFAULT '{"Education": 40, "Features": 30, "Stories": 20, "News": 10}',
    -- Competitors
    competitors JSONB [] DEFAULT ARRAY []::JSONB [],
    -- SEO/AEO Keywords
    primary_keywords TEXT [] DEFAULT ARRAY []::TEXT [],
    secondary_keywords TEXT [] DEFAULT ARRAY []::TEXT [],
    long_tail_keywords TEXT [] DEFAULT ARRAY []::TEXT [],
    -- Publishing Rules
    blog_frequency TEXT DEFAULT '3 per week',
    twitter_frequency TEXT DEFAULT '5 per day',
    linkedin_frequency TEXT DEFAULT '1 per day',
    instagram_frequency TEXT DEFAULT '1 per day',
    posting_timezone TEXT DEFAULT 'Asia/Kolkata',
    optimal_hours JSONB DEFAULT '{"twitter": [9, 13, 18], "linkedin": [8, 12, 17], "instagram": [12, 19]}',
    -- Auto-Publish Settings
    auto_publish_blogs BOOLEAN DEFAULT false,
    auto_publish_social BOOLEAN DEFAULT false,
    require_human_approval BOOLEAN DEFAULT true,
    -- AI Settings
    ai_model_preference TEXT DEFAULT 'gemini-2.0-flash',
    content_generation_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id)
);
-- Content Ideas (AI-generated pipeline)
CREATE TABLE IF NOT EXISTS content_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    -- Idea Details
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL CHECK (
        content_type IN (
            'blog',
            'twitter_thread',
            'twitter_post',
            'linkedin_post',
            'linkedin_article',
            'instagram_post',
            'instagram_carousel',
            'video_script',
            'email',
            'reddit_post',
            'quora_answer'
        )
    ),
    content_pillar TEXT,
    target_keywords TEXT [] DEFAULT ARRAY []::TEXT [],
    -- Outline/Structure (for blogs)
    outline JSONB,
    -- Scoring
    trend_score FLOAT DEFAULT 0,
    gap_score FLOAT DEFAULT 0,
    viral_potential FLOAT DEFAULT 0,
    seo_potential FLOAT DEFAULT 0,
    aeo_potential FLOAT DEFAULT 0,
    overall_score FLOAT DEFAULT 0,
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
    priority INTEGER DEFAULT 50 CHECK (
        priority BETWEEN 1 AND 100
    ),
    -- Metadata
    source TEXT DEFAULT 'ai_generated' CHECK (
        source IN (
            'ai_generated',
            'trend_detection',
            'competitor_gap',
            'user_question',
            'manual'
        )
    ),
    source_url TEXT,
    source_data JSONB,
    -- Assignment
    assigned_to UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_for DATE
);
-- Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES content_ideas(id) ON DELETE
    SET NULL,
        author_id UUID,
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
        -- AEO (AI Engine Optimization)
        faqs JSONB [] DEFAULT ARRAY []::JSONB [],
        definitions JSONB [] DEFAULT ARRAY []::JSONB [],
        key_takeaways TEXT [] DEFAULT ARRAY []::TEXT [],
        structured_data JSONB,
        -- Classification
        category TEXT,
        tags TEXT [] DEFAULT ARRAY []::TEXT [],
        keywords TEXT [] DEFAULT ARRAY []::TEXT [],
        -- Scoring
        seo_score FLOAT,
        aeo_score FLOAT,
        readability_score FLOAT,
        word_count INTEGER,
        read_time_minutes INTEGER,
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
        -- Analytics (updated periodically)
        views INTEGER DEFAULT 0,
        unique_visitors INTEGER DEFAULT 0,
        avg_time_on_page INTEGER DEFAULT 0,
        bounce_rate FLOAT,
        scroll_depth FLOAT,
        shares INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        -- AI Learning
        keywords_ranked JSONB DEFAULT '{}',
        llm_citations INTEGER DEFAULT 0,
        -- Version Control
        version INTEGER DEFAULT 1,
        previous_versions JSONB [] DEFAULT ARRAY []::JSONB [],
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(product_id, slug)
);
-- AI Social Posts
CREATE TABLE IF NOT EXISTS ai_social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES content_ideas(id) ON DELETE
    SET NULL,
        blog_id UUID REFERENCES blog_posts(id) ON DELETE
    SET NULL,
        -- Content
        platform TEXT NOT NULL CHECK (
            platform IN (
                'twitter',
                'linkedin',
                'instagram',
                'facebook',
                'reddit',
                'quora',
                'medium',
                'hashnode',
                'devto'
            )
        ),
        content_type TEXT NOT NULL CHECK (
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
        content TEXT NOT NULL,
        content_variations TEXT [] DEFAULT ARRAY []::TEXT [],
        thread_parts TEXT [] DEFAULT ARRAY []::TEXT [],
        carousel_slides JSONB [] DEFAULT ARRAY []::JSONB [],
        media_urls TEXT [] DEFAULT ARRAY []::TEXT [],
        hashtags TEXT [] DEFAULT ARRAY []::TEXT [],
        mentions TEXT [] DEFAULT ARRAY []::TEXT [],
        link_url TEXT,
        call_to_action TEXT,
        -- AI Generation
        ai_model TEXT,
        generation_prompt TEXT,
        generation_temperature FLOAT,
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
        -- External Platform Data
        external_post_id TEXT,
        external_url TEXT,
        -- Analytics (updated via webhooks/polling)
        impressions INTEGER DEFAULT 0,
        reach INTEGER DEFAULT 0,
        engagements INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        saves INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        profile_visits INTEGER DEFAULT 0,
        engagement_rate FLOAT,
        click_through_rate FLOAT,
        -- AI Learning
        performance_score FLOAT,
        viral_success BOOLEAN DEFAULT false,
        learnings TEXT [] DEFAULT ARRAY []::TEXT [],
        -- A/B Testing
        ab_test_id UUID,
        ab_variant TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Daily Marketing Reports
CREATE TABLE IF NOT EXISTS marketing_daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    -- Performance Summary
    total_impressions INTEGER DEFAULT 0,
    total_engagements INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_new_followers INTEGER DEFAULT 0,
    blog_views INTEGER DEFAULT 0,
    blog_unique_visitors INTEGER DEFAULT 0,
    -- Platform Breakdown
    platform_metrics JSONB DEFAULT '{}',
    -- Top Performers
    top_posts JSONB [] DEFAULT ARRAY []::JSONB [],
    worst_posts JSONB [] DEFAULT ARRAY []::JSONB [],
    -- Insights
    ai_insights TEXT [] DEFAULT ARRAY []::TEXT [],
    pattern_changes JSONB DEFAULT '{}',
    anomalies JSONB [] DEFAULT ARRAY []::JSONB [],
    -- Recommendations
    strategy_recommendations TEXT [] DEFAULT ARRAY []::TEXT [],
    content_suggestions JSONB [] DEFAULT ARRAY []::JSONB [],
    timing_adjustments JSONB DEFAULT '{}',
    -- Comparison
    vs_yesterday JSONB DEFAULT '{}',
    vs_last_week JSONB DEFAULT '{}',
    vs_last_month JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, report_date)
);
-- LLM Citation Tracking
CREATE TABLE IF NOT EXISTS llm_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    -- Citation Details
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
    citation_type TEXT CHECK (
        citation_type IN (
            'direct_mention',
            'recommendation',
            'comparison',
            'definition',
            'link'
        )
    ),
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    confidence FLOAT,
    -- Context
    source_url TEXT,
    screenshot_url TEXT,
    -- Verification
    verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    discovered_by TEXT DEFAULT 'automated'
);
-- Content Learnings (Pattern Detection)
CREATE TABLE IF NOT EXISTS content_learnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    -- Learning Details
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
    finding TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    -- Confidence
    confidence FLOAT DEFAULT 0.5 CHECK (
        confidence BETWEEN 0 AND 1
    ),
    sample_size INTEGER DEFAULT 0,
    statistical_significance FLOAT,
    -- Impact
    metric_name TEXT,
    before_value FLOAT,
    after_value FLOAT,
    improvement_percent FLOAT,
    -- Application
    applied_to_strategy BOOLEAN DEFAULT false,
    applied_at TIMESTAMPTZ,
    strategy_change_description TEXT,
    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    superseded_by UUID REFERENCES content_learnings(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- A/B Tests
CREATE TABLE IF NOT EXISTS content_ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    -- Test Details
    name TEXT NOT NULL,
    description TEXT,
    test_type TEXT CHECK (
        test_type IN (
            'headline',
            'content',
            'image',
            'cta',
            'timing',
            'format'
        )
    ),
    platform TEXT,
    -- Variants
    control_variant JSONB NOT NULL,
    test_variants JSONB [] NOT NULL,
    -- Status
    status TEXT DEFAULT 'draft' CHECK (
        status IN (
            'draft',
            'running',
            'paused',
            'completed',
            'cancelled'
        )
    ),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    -- Results
    winner_variant TEXT,
    results JSONB DEFAULT '{}',
    statistical_significance FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Content Calendar
CREATE TABLE IF NOT EXISTS content_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    -- Calendar Entry
    entry_date DATE NOT NULL,
    entry_type TEXT CHECK (
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
    -- References
    idea_id UUID REFERENCES content_ideas(id),
    blog_id UUID REFERENCES blog_posts(id),
    social_post_id UUID REFERENCES ai_social_posts(id),
    -- Assignment
    assigned_to UUID,
    -- Status
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
    -- Metadata
    platforms TEXT [] DEFAULT ARRAY []::TEXT [],
    tags TEXT [] DEFAULT ARRAY []::TEXT [],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Trend Tracking
CREATE TABLE IF NOT EXISTS marketing_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    -- Trend Info
    trend_name TEXT NOT NULL,
    trend_type TEXT CHECK (
        trend_type IN (
            'keyword',
            'topic',
            'hashtag',
            'format',
            'platform',
            'competitor'
        )
    ),
    source TEXT CHECK (
        source IN (
            'google_trends',
            'twitter',
            'reddit',
            'hackernews',
            'linkedin',
            'manual'
        )
    ),
    -- Metrics
    current_volume INTEGER,
    growth_rate FLOAT,
    relevance_score FLOAT,
    -- Timing
    first_detected TIMESTAMPTZ DEFAULT NOW(),
    peak_detected TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    -- Action
    content_created BOOLEAN DEFAULT false,
    content_ids UUID [] DEFAULT ARRAY []::UUID [],
    -- Raw Data
    raw_data JSONB DEFAULT '{}'
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_ideas_product_status ON content_ideas(product_id, status);
CREATE INDEX IF NOT EXISTS idx_content_ideas_scheduled ON content_ideas(scheduled_for)
WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_product_status ON blog_posts(product_id, status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC)
WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_ai_social_posts_product_platform ON ai_social_posts(product_id, platform);
CREATE INDEX IF NOT EXISTS idx_ai_social_posts_scheduled ON ai_social_posts(scheduled_for)
WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_ai_social_posts_published ON ai_social_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_daily_reports_date ON marketing_daily_reports(product_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_llm_citations_product ON llm_citations(product_id, discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_learnings_product ON content_learnings(product_id, learning_type);
CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(product_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_marketing_trends_product ON marketing_trends(product_id, first_detected DESC);
-- Updated at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- Apply triggers
DROP TRIGGER IF EXISTS update_product_marketing_profiles_updated_at ON product_marketing_profiles;
CREATE TRIGGER update_product_marketing_profiles_updated_at BEFORE
UPDATE ON product_marketing_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_content_ideas_updated_at ON content_ideas;
CREATE TRIGGER update_content_ideas_updated_at BEFORE
UPDATE ON content_ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at BEFORE
UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_ai_social_posts_updated_at ON ai_social_posts;
CREATE TRIGGER update_ai_social_posts_updated_at BEFORE
UPDATE ON ai_social_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_content_calendar_updated_at ON content_calendar;
CREATE TRIGGER update_content_calendar_updated_at BEFORE
UPDATE ON content_calendar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Enable RLS
ALTER TABLE product_marketing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_trends ENABLE ROW LEVEL SECURITY;
-- RLS Policies (broad access for authenticated users - tighten as needed)
CREATE POLICY "Users can view marketing profiles" ON product_marketing_profiles FOR
SELECT USING (true);
CREATE POLICY "Users can manage marketing profiles" ON product_marketing_profiles FOR ALL USING (true);
CREATE POLICY "Users can view content ideas" ON content_ideas FOR
SELECT USING (true);
CREATE POLICY "Users can manage content ideas" ON content_ideas FOR ALL USING (true);
CREATE POLICY "Users can view blog posts" ON blog_posts FOR
SELECT USING (true);
CREATE POLICY "Users can manage blog posts" ON blog_posts FOR ALL USING (true);
CREATE POLICY "Users can view social posts" ON ai_social_posts FOR
SELECT USING (true);
CREATE POLICY "Users can manage social posts" ON ai_social_posts FOR ALL USING (true);
CREATE POLICY "Users can view daily reports" ON marketing_daily_reports FOR
SELECT USING (true);
CREATE POLICY "Users can manage daily reports" ON marketing_daily_reports FOR ALL USING (true);
CREATE POLICY "Users can view llm citations" ON llm_citations FOR
SELECT USING (true);
CREATE POLICY "Users can manage llm citations" ON llm_citations FOR ALL USING (true);
CREATE POLICY "Users can view content learnings" ON content_learnings FOR
SELECT USING (true);
CREATE POLICY "Users can manage content learnings" ON content_learnings FOR ALL USING (true);
CREATE POLICY "Users can view ab tests" ON content_ab_tests FOR
SELECT USING (true);
CREATE POLICY "Users can manage ab tests" ON content_ab_tests FOR ALL USING (true);
CREATE POLICY "Users can view content calendar" ON content_calendar FOR
SELECT USING (true);
CREATE POLICY "Users can manage content calendar" ON content_calendar FOR ALL USING (true);
CREATE POLICY "Users can view marketing trends" ON marketing_trends FOR
SELECT USING (true);
CREATE POLICY "Users can manage marketing trends" ON marketing_trends FOR ALL USING (true);
-- Grant permissions
GRANT ALL ON product_marketing_profiles TO authenticated;
GRANT ALL ON content_ideas TO authenticated;
GRANT ALL ON blog_posts TO authenticated;
GRANT ALL ON ai_social_posts TO authenticated;
GRANT ALL ON marketing_daily_reports TO authenticated;
GRANT ALL ON llm_citations TO authenticated;
GRANT ALL ON content_learnings TO authenticated;
GRANT ALL ON content_ab_tests TO authenticated;
GRANT ALL ON content_calendar TO authenticated;
GRANT ALL ON marketing_trends TO authenticated;