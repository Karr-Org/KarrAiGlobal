-- ============================================
-- 024: UNIFIED SOCIAL SYSTEM
-- Extends social_posts, social_insights, content_patterns
-- to support both user-level AND product-level operations.
-- ============================================
-- Step 1: Add product_id to social_posts (nullable = user-level post)
ALTER TABLE social_posts
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
-- Step 2: Add product_id to social_insights
ALTER TABLE social_insights
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
-- Step 3: Add product_id to content_patterns
ALTER TABLE content_patterns
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
-- Step 4: Add calendar-related columns to social_posts
ALTER TABLE social_posts
ADD COLUMN IF NOT EXISTS calendar_slot TEXT,
    ADD COLUMN IF NOT EXISTS calendar_week INTEGER,
    ADD COLUMN IF NOT EXISTS calendar_day_of_week INTEGER,
    ADD COLUMN IF NOT EXISTS calendar_hour INTEGER;
-- Step 5: Create indexes for product-level queries
CREATE INDEX IF NOT EXISTS idx_social_posts_product ON social_posts(product_id)
WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_social_posts_product_status ON social_posts(product_id, status)
WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_social_posts_calendar ON social_posts(calendar_week, calendar_day_of_week)
WHERE status IN ('scheduled', 'published');
CREATE INDEX IF NOT EXISTS idx_social_insights_product ON social_insights(product_id)
WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_patterns_product ON content_patterns(product_id)
WHERE product_id IS NOT NULL;
-- Step 6: Update unique constraint on content_patterns to support product scope
-- Old: UNIQUE(user_id, pattern_type, pattern_key)
-- New: separate indexes for user-level and product-level patterns
ALTER TABLE content_patterns DROP CONSTRAINT IF EXISTS content_patterns_user_id_pattern_type_pattern_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_patterns_user_unique ON content_patterns(user_id, pattern_type, pattern_key)
WHERE product_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_patterns_product_unique ON content_patterns(product_id, pattern_type, pattern_key)
WHERE product_id IS NOT NULL;
-- Step 7: Update RLS policies for social_posts to handle product-level access
DROP POLICY IF EXISTS "Users manage own social posts" ON social_posts;
CREATE POLICY "Users manage own social posts" ON social_posts FOR ALL USING (
    -- User can manage their own posts
    user_id = auth.uid() -- OR they own the product this post belongs to
    OR product_id IN (
        SELECT id
        FROM products
        WHERE created_by = auth.uid()
    )
);
-- Step 8: Update RLS for social_insights
DROP POLICY IF EXISTS "Users manage own insights" ON social_insights;
CREATE POLICY "Users manage own insights" ON social_insights FOR ALL USING (
    user_id = auth.uid()
    OR product_id IN (
        SELECT id
        FROM products
        WHERE created_by = auth.uid()
    )
);
-- Step 9: Update RLS for content_patterns
DROP POLICY IF EXISTS "Users view own content patterns" ON content_patterns;
CREATE POLICY "Users view own content patterns" ON content_patterns FOR ALL USING (
    user_id = auth.uid()
    OR product_id IN (
        SELECT id
        FROM products
        WHERE created_by = auth.uid()
    )
);
-- Step 10: Update RLS for social_analytics (already correct, joins through posts)
-- No change needed — it already uses post ownership check
-- Step 11: Create a view for easy calendar querying
CREATE OR REPLACE VIEW social_calendar AS
SELECT sp.id,
    sp.user_id,
    sp.product_id,
    sp.platform,
    sp.content,
    sp.status,
    sp.scheduled_at,
    sp.published_at,
    sp.calendar_week,
    sp.calendar_day_of_week,
    sp.calendar_hour,
    sp.hashtags,
    sp.media_urls,
    sp.ai_draft_variant,
    sp.created_at,
    CASE
        WHEN sp.product_id IS NOT NULL THEN 'product'
        ELSE 'user'
    END as owner_type,
    COALESCE(sp.product_id::text, sp.user_id::text) as owner_id,
    COALESCE(
        p.name,
        u.raw_user_meta_data->>'display_name',
        'Unknown'
    ) as owner_name
FROM social_posts sp
    LEFT JOIN products p ON sp.product_id = p.id
    LEFT JOIN auth.users u ON sp.user_id = u.id;
-- Grant access to the view
GRANT SELECT ON social_calendar TO authenticated;
-- Done!
SELECT 'Unified social system migration complete! Both user and product social fully unified.' as status;