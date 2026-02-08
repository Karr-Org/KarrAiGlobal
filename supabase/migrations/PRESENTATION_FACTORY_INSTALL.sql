-- =====================================================
-- AI PRESENTATION FACTORY - Database Schema
-- Copy this ENTIRE file and paste into Supabase SQL Editor
-- =====================================================
-- 1. Design Tokens per Product (Brand Identity)
CREATE TABLE IF NOT EXISTS product_design_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    primary_color VARCHAR(7) DEFAULT '#1a1a2e',
    secondary_color VARCHAR(7) DEFAULT '#16213e',
    accent_color VARCHAR(7) DEFAULT '#e94560',
    background_color VARCHAR(7) DEFAULT '#ffffff',
    text_color VARCHAR(7) DEFAULT '#1a1a1a',
    font_heading VARCHAR(100) DEFAULT 'Inter',
    font_body VARCHAR(100) DEFAULT 'IBM Plex Sans',
    font_size_base INTEGER DEFAULT 16,
    preferred_layouts JSONB DEFAULT '["title-centered", "split-image-right", "bullet-list", "comparison"]'::jsonb,
    image_style VARCHAR(255) DEFAULT 'modern, professional, 3D isometric, clean',
    learned_preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id)
);
-- 2. Presentation Templates
CREATE TABLE IF NOT EXISTS presentation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    structure JSONB NOT NULL,
    slide_count INTEGER DEFAULT 0,
    times_used INTEGER DEFAULT 0,
    avg_rating DECIMAL(3, 2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    source_presentation_id UUID,
    is_system_template BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- 3. Generated Presentations
CREATE TABLE IF NOT EXISTS presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    chat_session_id UUID,
    title VARCHAR(500) NOT NULL,
    topic VARCHAR(500),
    audience VARCHAR(255),
    goal VARCHAR(500),
    slide_json JSONB NOT NULL,
    markdown_content TEXT,
    slide_count INTEGER DEFAULT 0,
    design_tokens JSONB,
    template_id UUID REFERENCES presentation_templates(id),
    quality_score_overall DECIMAL(5, 2),
    quality_score_content DECIMAL(5, 2),
    quality_score_design DECIMAL(5, 2),
    quality_score_narrative DECIMAL(5, 2),
    quality_score_accessibility DECIMAL(5, 2),
    user_rating INTEGER CHECK (
        user_rating BETWEEN 1 AND 5
    ),
    user_feedback TEXT,
    view_count INTEGER DEFAULT 0,
    view_duration_seconds INTEGER DEFAULT 0,
    downloaded_pptx BOOLEAN DEFAULT false,
    downloaded_pdf BOOLEAN DEFAULT false,
    was_edited BOOLEAN DEFAULT false,
    was_discarded BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'generated',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    viewed_at TIMESTAMPTZ,
    exported_at TIMESTAMPTZ
);
-- 4. Presentation Edit History
CREATE TABLE IF NOT EXISTS presentation_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    edit_type VARCHAR(50) NOT NULL,
    slide_index INTEGER,
    before_value JSONB,
    after_value JSONB,
    edit_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- 5. Layout Performance Tracking
CREATE TABLE IF NOT EXISTS layout_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    layout_type VARCHAR(100) NOT NULL,
    topic_category VARCHAR(100),
    times_used INTEGER DEFAULT 0,
    avg_rating DECIMAL(3, 2) DEFAULT 0,
    edit_rate DECIMAL(5, 4) DEFAULT 0,
    last_used_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, layout_type, topic_category)
);
-- 6. Image Prompt Performance
CREATE TABLE IF NOT EXISTS image_prompt_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    original_prompt TEXT NOT NULL,
    topic_keywords TEXT [],
    times_used INTEGER DEFAULT 0,
    times_kept INTEGER DEFAULT 0,
    times_replaced INTEGER DEFAULT 0,
    replacement_prompts TEXT [],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- 7. Prompt Optimization Rules
CREATE TABLE IF NOT EXISTS prompt_optimization_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    rule_type VARCHAR(100) NOT NULL,
    condition JSONB NOT NULL,
    action JSONB NOT NULL,
    times_applied INTEGER DEFAULT 0,
    success_rate DECIMAL(5, 4) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    confidence_score DECIMAL(5, 4) DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_presentations_product_id ON presentations(product_id);
CREATE INDEX IF NOT EXISTS idx_presentations_user_id ON presentations(user_id);
CREATE INDEX IF NOT EXISTS idx_presentations_created_at ON presentations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presentations_quality_score ON presentations(quality_score_overall DESC);
CREATE INDEX IF NOT EXISTS idx_presentations_user_rating ON presentations(user_rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_presentation_templates_product_id ON presentation_templates(product_id);
CREATE INDEX IF NOT EXISTS idx_presentation_templates_category ON presentation_templates(category);
CREATE INDEX IF NOT EXISTS idx_presentation_templates_avg_rating ON presentation_templates(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_presentation_edits_presentation_id ON presentation_edits(presentation_id);
CREATE INDEX IF NOT EXISTS idx_layout_performance_product_topic ON layout_performance(product_id, topic_category);
-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE product_design_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_prompt_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_optimization_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Design tokens are viewable by product users" ON product_design_tokens FOR
SELECT USING (true);
CREATE POLICY "Design tokens are manageable by admins" ON product_design_tokens FOR ALL USING (true);
CREATE POLICY "Templates are viewable by all" ON presentation_templates FOR
SELECT USING (true);
CREATE POLICY "Users can view own presentations" ON presentations FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create presentations" ON presentations FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own presentations" ON presentations FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own edits" ON presentation_edits FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create edits" ON presentation_edits FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Layout performance readable by all" ON layout_performance FOR
SELECT USING (true);
CREATE POLICY "Image prompt performance readable by all" ON image_prompt_performance FOR
SELECT USING (true);
CREATE POLICY "Prompt rules readable by all" ON prompt_optimization_rules FOR
SELECT USING (true);
-- =====================================================
-- FUNCTIONS
-- =====================================================
-- Function to get or create design tokens for a product
CREATE OR REPLACE FUNCTION get_or_create_design_tokens(p_product_id UUID) RETURNS JSONB AS $$
DECLARE tokens JSONB;
BEGIN
SELECT jsonb_build_object(
        'primary_color',
        primary_color,
        'secondary_color',
        secondary_color,
        'accent_color',
        accent_color,
        'background_color',
        background_color,
        'text_color',
        text_color,
        'font_heading',
        font_heading,
        'font_body',
        font_body,
        'font_size_base',
        font_size_base,
        'preferred_layouts',
        preferred_layouts,
        'image_style',
        image_style,
        'learned_preferences',
        learned_preferences
    ) INTO tokens
FROM product_design_tokens
WHERE product_id = p_product_id;
IF tokens IS NULL THEN
INSERT INTO product_design_tokens (product_id)
VALUES (p_product_id)
RETURNING jsonb_build_object(
        'primary_color',
        primary_color,
        'secondary_color',
        secondary_color,
        'accent_color',
        accent_color,
        'background_color',
        background_color,
        'text_color',
        text_color,
        'font_heading',
        font_heading,
        'font_body',
        font_body,
        'font_size_base',
        font_size_base,
        'preferred_layouts',
        preferred_layouts,
        'image_style',
        image_style,
        'learned_preferences',
        learned_preferences
    ) INTO tokens;
END IF;
RETURN tokens;
END;
$$ LANGUAGE plpgsql;
-- Function to update layout performance
CREATE OR REPLACE FUNCTION update_layout_performance(
        p_product_id UUID,
        p_layout_type VARCHAR,
        p_topic_category VARCHAR,
        p_rating DECIMAL DEFAULT NULL,
        p_was_edited BOOLEAN DEFAULT false
    ) RETURNS VOID AS $$ BEGIN
INSERT INTO layout_performance (
        product_id,
        layout_type,
        topic_category,
        times_used,
        avg_rating,
        edit_rate
    )
VALUES (
        p_product_id,
        p_layout_type,
        p_topic_category,
        1,
        COALESCE(p_rating, 0),
        CASE
            WHEN p_was_edited THEN 1.0
            ELSE 0.0
        END
    ) ON CONFLICT (product_id, layout_type, topic_category) DO
UPDATE
SET times_used = layout_performance.times_used + 1,
    avg_rating = CASE
        WHEN p_rating IS NOT NULL THEN (
            layout_performance.avg_rating * layout_performance.times_used + p_rating
        ) / (layout_performance.times_used + 1)
        ELSE layout_performance.avg_rating
    END,
    edit_rate = (
        layout_performance.edit_rate * layout_performance.times_used + CASE
            WHEN p_was_edited THEN 1.0
            ELSE 0.0
        END
    ) / (layout_performance.times_used + 1),
    last_used_at = now();
END;
$$ LANGUAGE plpgsql;
-- Function to get best layouts for a topic
CREATE OR REPLACE FUNCTION get_best_layouts_for_topic(
        p_product_id UUID,
        p_topic_category VARCHAR,
        p_limit INTEGER DEFAULT 5
    ) RETURNS TABLE (layout_type VARCHAR, score DECIMAL) AS $$ BEGIN RETURN QUERY
SELECT lp.layout_type,
    (
        lp.avg_rating * 0.6 + (1 - lp.edit_rate) * 40 * 0.4
    )::DECIMAL as score
FROM layout_performance lp
WHERE lp.product_id = p_product_id
    AND (
        lp.topic_category = p_topic_category
        OR lp.topic_category IS NULL
    )
    AND lp.times_used >= 3
ORDER BY score DESC
LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
-- Function to promote high-rated presentation to template
CREATE OR REPLACE FUNCTION promote_to_template(p_presentation_id UUID) RETURNS UUID AS $$
DECLARE pres RECORD;
template_id UUID;
BEGIN
SELECT * INTO pres
FROM presentations
WHERE id = p_presentation_id;
IF pres IS NULL
OR pres.user_rating < 4 THEN RETURN NULL;
END IF;
INSERT INTO presentation_templates (
        product_id,
        name,
        description,
        category,
        structure,
        slide_count,
        source_presentation_id,
        avg_rating,
        total_ratings
    )
VALUES (
        pres.product_id,
        pres.title || ' Template',
        'Auto-generated from high-rated presentation',
        pres.topic,
        pres.slide_json,
        pres.slide_count,
        pres.id,
        pres.user_rating,
        1
    )
RETURNING id INTO template_id;
RETURN template_id;
END;
$$ LANGUAGE plpgsql;
-- Grant permissions
GRANT ALL ON product_design_tokens TO authenticated;
GRANT ALL ON presentation_templates TO authenticated;
GRANT ALL ON presentations TO authenticated;
GRANT ALL ON presentation_edits TO authenticated;
GRANT ALL ON layout_performance TO authenticated;
GRANT ALL ON image_prompt_performance TO authenticated;
GRANT ALL ON prompt_optimization_rules TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_design_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION update_layout_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_best_layouts_for_topic TO authenticated;
GRANT EXECUTE ON FUNCTION promote_to_template TO authenticated;