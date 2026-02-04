-- =====================================================
-- CONSOLIDATED MIGRATION: ATTRIBUTION & GAMIFICATION
-- Covers both 012 and 013 features safely.
-- =====================================================

-- 1. ATTRIBUTION SYSTEM (Ensure columns exist on knowledge_documents)
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS contributed_by_product_user_id UUID REFERENCES product_users(id) ON DELETE SET NULL;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS contributor_name TEXT;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS contributor_email TEXT;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS approved_by_name TEXT;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS original_user_document_id UUID REFERENCES user_documents(id) ON DELETE SET NULL;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS source_label TEXT DEFAULT 'upload';

CREATE INDEX IF NOT EXISTS idx_knowledge_docs_contributor ON knowledge_documents(contributed_by_product_user_id) WHERE contributed_by_product_user_id IS NOT NULL;

-- Update existing records labels
UPDATE knowledge_documents 
SET source_label = CASE 
    WHEN source_type = 'user_suggestion' THEN 'User Contribution' 
    ELSE 'Admin Upload' 
END 
WHERE source_label IS NULL or source_label = 'upload';

-- 2. GAMIFICATION SYSTEM (Product Users enhancements)
ALTER TABLE product_users ADD COLUMN IF NOT EXISTS contributor_score INTEGER DEFAULT 0;
ALTER TABLE product_users ADD COLUMN IF NOT EXISTS contributor_rank TEXT DEFAULT 'newcomer';
ALTER TABLE product_users ADD COLUMN IF NOT EXISTS total_docs_contributed INTEGER DEFAULT 0;
ALTER TABLE product_users ADD COLUMN IF NOT EXISTS total_chunks_contributed INTEGER DEFAULT 0;
ALTER TABLE product_users ADD COLUMN IF NOT EXISTS contribution_streak INTEGER DEFAULT 0;
ALTER TABLE product_users ADD COLUMN IF NOT EXISTS last_contribution_date DATE;
ALTER TABLE product_users ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_product_users_score ON product_users(contributor_score DESC) WHERE contributor_score > 0;

-- 3. VIEWS & FUNCTIONS

-- Leaderboard View
CREATE OR REPLACE VIEW knowledge_leaderboard AS
SELECT 
    pu.id AS product_user_id,
    pu.display_name,
    pu.product_id,
    p.name AS product_name,
    p.slug AS product_slug,
    pu.contributor_score,
    pu.contributor_rank,
    pu.total_docs_contributed,
    pu.total_chunks_contributed,
    pu.contribution_streak,
    pu.last_contribution_date,
    RANK() OVER (PARTITION BY pu.product_id ORDER BY pu.contributor_score DESC) as product_rank
FROM product_users pu
JOIN products p ON pu.product_id = p.id
WHERE pu.contributor_score > 0
ORDER BY pu.contributor_score DESC;

-- Award Points Function
CREATE OR REPLACE FUNCTION award_contributor_points(
    p_product_user_id UUID,
    p_chunk_count INTEGER,
    p_uniqueness_score FLOAT DEFAULT 0.5
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_current RECORD;
    v_base_points INTEGER := 100;
    v_uniqueness_bonus INTEGER;
    v_chunk_bonus INTEGER;
    v_streak_bonus INTEGER := 0;
    v_total_points INTEGER;
    v_new_score INTEGER;
    v_new_rank TEXT;
    v_is_consecutive BOOLEAN;
BEGIN
    -- Get current stats
    SELECT * INTO v_current FROM product_users WHERE id = p_product_user_id;
    IF NOT FOUND THEN RETURN json_build_object('success', false); END IF;

    -- Calc bonuses
    v_uniqueness_bonus := FLOOR(p_uniqueness_score * 200)::INTEGER;
    v_chunk_bonus := p_chunk_count * 10;
    v_is_consecutive := v_current.last_contribution_date = CURRENT_DATE - INTERVAL '1 day';
    
    IF v_is_consecutive THEN
        v_streak_bonus := LEAST((COALESCE(v_current.contribution_streak, 0) + 1) * 15, 150);
    END IF;

    v_total_points := v_base_points + v_uniqueness_bonus + v_chunk_bonus + v_streak_bonus;
    v_new_score := COALESCE(v_current.contributor_score, 0) + v_total_points;
    
    -- Determine Rank
    v_new_rank := CASE
        WHEN v_new_score >= 10000 THEN 'diamond'
        WHEN v_new_score >= 5000 THEN 'platinum'
        WHEN v_new_score >= 2000 THEN 'gold'
        WHEN v_new_score >= 500 THEN 'silver'
        WHEN v_new_score >= 100 THEN 'bronze'
        ELSE 'newcomer'
    END;

    -- Update
    UPDATE product_users
    SET 
        contributor_score = v_new_score,
        contributor_rank = v_new_rank,
        total_docs_contributed = COALESCE(total_docs_contributed, 0) + 1,
        total_chunks_contributed = COALESCE(total_chunks_contributed, 0) + p_chunk_count,
        contribution_streak = CASE 
            WHEN v_is_consecutive THEN COALESCE(contribution_streak, 0) + 1
            WHEN last_contribution_date = CURRENT_DATE THEN COALESCE(contribution_streak, 1)
            ELSE 1
        END,
        last_contribution_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE id = p_product_user_id;

    RETURN json_build_object('success', true, 'points', v_total_points, 'rank', v_new_rank);
END;
$$;

-- IMPORTANT: Update Approval Function to capture contributor ID
CREATE OR REPLACE FUNCTION approve_to_knowledge_bases_v2(
    p_suggestion_id UUID,
    p_knowledge_base_ids UUID[],
    p_admin_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_suggestion RECORD;
    v_doc_ids UUID[] := '{}';
    v_kb_id UUID;
    v_new_doc_id UUID;
    v_chunk_count INTEGER;
    v_contributor RECORD;
    v_admin_name TEXT;
BEGIN
    -- Get suggestion details
    SELECT * INTO v_suggestion FROM knowledge_suggestions WHERE id = p_suggestion_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Suggestion not found'; END IF;

    -- Get contributor info if exists
    IF v_suggestion.source_user_id IS NOT NULL THEN
        SELECT id, display_name AS name, NULL as email INTO v_contributor 
        FROM product_users WHERE id = v_suggestion.source_user_id;
    END IF;

    -- Get admin name
    IF p_admin_id IS NOT NULL THEN
        SELECT email INTO v_admin_name FROM auth.users WHERE id = p_admin_id;
    END IF;

    -- Loop through target KBs
    FOREACH v_kb_id IN ARRAY p_knowledge_base_ids LOOP
        -- Create Knowledge Document
        INSERT INTO knowledge_documents (
            knowledge_base_id,
            title,
            source_type,
            status,
            chunk_count,
            created_by,
            -- NEW FIELDS
            contributed_by_product_user_id,
            contributor_name,
            approved_by_name,
            original_user_document_id,
            source_label
        ) VALUES (
            v_kb_id,
            v_suggestion.title,
            'user_suggestion', -- Explicitly mark as suggestion
            'ready',
            0, -- Will update later
            p_admin_id,
            -- NEW VALUES
            v_suggestion.source_user_id,
            v_contributor.name,
            v_admin_name,
            v_suggestion.source_document_id,
            'User Contribution'
        ) RETURNING id INTO v_new_doc_id;

        v_doc_ids := array_append(v_doc_ids, v_new_doc_id);
    
        -- Copy Chunks
        WITH inserted_chunks AS (
            INSERT INTO knowledge_chunks (
                knowledge_document_id,
                content,
                embedding,
                metadata
            )
            SELECT 
                v_new_doc_id,
                content,
                embedding,
                metadata
            FROM user_knowledge_chunks
            WHERE user_document_id = v_suggestion.source_document_id
            RETURNING 1
        )
        SELECT COUNT(*) INTO v_chunk_count FROM inserted_chunks;

        -- Update counts
        UPDATE knowledge_documents SET chunk_count = v_chunk_count WHERE id = v_new_doc_id;
        PERFORM increment_document_count(v_kb_id);
        PERFORM increment_chunk_count(v_kb_id, v_chunk_count);
    END LOOP;

    -- Update Suggestion Status
    UPDATE knowledge_suggestions 
    SET 
        status = 'approved',
        reviewed_by = p_admin_id,
        reviewed_at = NOW()
    WHERE id = p_suggestion_id;

    RETURN json_build_object(
        'success', true, 
        'document_ids', v_doc_ids,
        'chunks_copied', v_chunk_count
    );
END;
$$;


-- Grant permissions
GRANT SELECT ON knowledge_leaderboard TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION award_contributor_points TO service_role;
