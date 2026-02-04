-- =====================================================
-- KNOWLEDGE GAP INTELLIGENCE SYSTEM
-- Detects knowledge gaps and suggests content for product KB
-- =====================================================

-- 1. KNOWLEDGE SUGGESTIONS TABLE
-- Stores detected gaps and admin decisions
CREATE TABLE IF NOT EXISTS knowledge_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Source information
    source_document_id UUID REFERENCES user_documents(id) ON DELETE SET NULL,
    source_user_id UUID REFERENCES product_users(id) ON DELETE SET NULL,
    
    -- Content analysis
    topic TEXT NOT NULL,
    topic_embedding vector(768),
    sample_content TEXT,  -- Excerpt showing the content type
    detected_category TEXT,  -- Auto-detected category (e.g., "GST", "Tax", "Legal")
    
    -- Gap metrics
    similarity_to_kb FLOAT DEFAULT 0,  -- How similar to existing KB content
    uniqueness_score FLOAT DEFAULT 1,  -- 1 = completely new, 0 = duplicate
    
    -- Demand tracking
    occurrence_count INTEGER DEFAULT 1,  -- How many users uploaded similar content
    user_ids UUID[] DEFAULT '{}',  -- Track which users contributed
    
    -- Priority scoring (calculated)
    priority_score FLOAT DEFAULT 0,  -- Higher = more important to add
    
    -- Admin workflow
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'merged')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    
    -- If approved, link to created document
    created_document_id UUID REFERENCES knowledge_documents(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding similar suggestions
CREATE INDEX IF NOT EXISTS idx_suggestions_embedding 
ON knowledge_suggestions USING ivfflat (topic_embedding vector_cosine_ops) WITH (lists = 50);

CREATE INDEX IF NOT EXISTS idx_suggestions_product ON knowledge_suggestions(product_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON knowledge_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_priority ON knowledge_suggestions(priority_score DESC);

-- 2. FUNCTION: Detect and create knowledge gap suggestion
CREATE OR REPLACE FUNCTION detect_knowledge_gap(
    p_product_id UUID,
    p_document_title TEXT,
    p_content_sample TEXT,
    p_content_embedding vector(768),
    p_source_document_id UUID,
    p_source_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_max_similarity FLOAT := 0;
    v_existing_suggestion_id UUID;
    v_suggestion_id UUID;
    v_is_new_gap BOOLEAN := false;
    v_priority FLOAT;
BEGIN
    -- 1. Check similarity to existing product knowledge
    SELECT COALESCE(MAX(1 - (kc.embedding <=> p_content_embedding)), 0)
    INTO v_max_similarity
    FROM knowledge_chunks kc
    JOIN knowledge_documents kd ON kc.document_id = kd.id
    JOIN knowledge_bases kb ON kd.knowledge_base_id = kb.id
    WHERE kb.product_id = p_product_id;

    -- If similarity is high enough (>70%), no gap detected
    IF v_max_similarity > 0.7 THEN
        RETURN json_build_object(
            'gap_detected', false,
            'similarity', v_max_similarity,
            'message', 'Similar content already exists in product knowledge base'
        );
    END IF;

    -- 2. Check if similar suggestion already exists
    SELECT id INTO v_existing_suggestion_id
    FROM knowledge_suggestions
    WHERE product_id = p_product_id
      AND status IN ('pending', 'reviewed')
      AND (1 - (topic_embedding <=> p_content_embedding)) > 0.75
    ORDER BY (1 - (topic_embedding <=> p_content_embedding)) DESC
    LIMIT 1;

    IF v_existing_suggestion_id IS NOT NULL THEN
        -- Update existing suggestion (increment occurrence)
        UPDATE knowledge_suggestions
        SET occurrence_count = occurrence_count + 1,
            user_ids = array_append(
                CASE WHEN p_source_user_id = ANY(user_ids) THEN user_ids 
                     ELSE user_ids END,
                p_source_user_id
            ),
            priority_score = (1 - COALESCE(similarity_to_kb, 0)) * (occurrence_count + 1) * 10,
            updated_at = NOW()
        WHERE id = v_existing_suggestion_id
          AND NOT (p_source_user_id = ANY(user_ids));

        RETURN json_build_object(
            'gap_detected', true,
            'is_new', false,
            'suggestion_id', v_existing_suggestion_id,
            'similarity', v_max_similarity,
            'message', 'Added to existing knowledge gap suggestion'
        );
    END IF;

    -- 3. Create new suggestion
    v_is_new_gap := true;
    
    -- Calculate priority: uniqueness * demand potential
    v_priority := (1 - v_max_similarity) * 10;

    INSERT INTO knowledge_suggestions (
        product_id,
        source_document_id,
        source_user_id,
        topic,
        topic_embedding,
        sample_content,
        similarity_to_kb,
        uniqueness_score,
        occurrence_count,
        user_ids,
        priority_score,
        status
    ) VALUES (
        p_product_id,
        p_source_document_id,
        p_source_user_id,
        p_document_title,
        p_content_embedding,
        LEFT(p_content_sample, 1000),
        v_max_similarity,
        1 - v_max_similarity,
        1,
        ARRAY[p_source_user_id],
        v_priority,
        'pending'
    )
    RETURNING id INTO v_suggestion_id;

    RETURN json_build_object(
        'gap_detected', true,
        'is_new', true,
        'suggestion_id', v_suggestion_id,
        'similarity', v_max_similarity,
        'priority', v_priority,
        'message', 'New knowledge gap detected and logged'
    );
END;
$$;

-- 3. FUNCTION: Get prioritized suggestions for admin
CREATE OR REPLACE FUNCTION get_knowledge_suggestions(
    p_product_id UUID,
    p_status TEXT DEFAULT 'pending',
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    topic TEXT,
    sample_content TEXT,
    detected_category TEXT,
    similarity_to_kb FLOAT,
    uniqueness_score FLOAT,
    occurrence_count INTEGER,
    user_count INTEGER,
    priority_score FLOAT,
    status TEXT,
    created_at TIMESTAMPTZ,
    source_user_name TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ks.id,
        ks.topic,
        ks.sample_content,
        ks.detected_category,
        ks.similarity_to_kb,
        ks.uniqueness_score,
        ks.occurrence_count,
        COALESCE(array_length(ks.user_ids, 1), 0) as user_count,
        ks.priority_score,
        ks.status,
        ks.created_at,
        pu.display_name as source_user_name
    FROM knowledge_suggestions ks
    LEFT JOIN product_users pu ON ks.source_user_id = pu.id
    WHERE ks.product_id = p_product_id
      AND (p_status IS NULL OR ks.status = p_status)
    ORDER BY ks.priority_score DESC, ks.occurrence_count DESC
    LIMIT p_limit;
END;
$$;

-- 4. FUNCTION: Approve suggestion and create product document
CREATE OR REPLACE FUNCTION approve_knowledge_suggestion(
    p_suggestion_id UUID,
    p_admin_id UUID,
    p_knowledge_base_id UUID,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_suggestion RECORD;
    v_new_doc_id UUID;
BEGIN
    -- Get suggestion
    SELECT * INTO v_suggestion
    FROM knowledge_suggestions
    WHERE id = p_suggestion_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Suggestion not found or already processed');
    END IF;

    -- Create knowledge document placeholder (admin will upload actual content)
    INSERT INTO knowledge_documents (
        knowledge_base_id,
        title,
        source_type,
        document_type,
        status,
        created_by
    ) VALUES (
        p_knowledge_base_id,
        v_suggestion.topic || ' (From User Suggestion)',
        'user_suggestion',
        'text',
        'pending',
        p_admin_id
    )
    RETURNING id INTO v_new_doc_id;

    -- Update suggestion
    UPDATE knowledge_suggestions
    SET status = 'approved',
        reviewed_by = p_admin_id,
        reviewed_at = NOW(),
        admin_notes = p_admin_notes,
        created_document_id = v_new_doc_id,
        updated_at = NOW()
    WHERE id = p_suggestion_id;

    RETURN json_build_object(
        'success', true,
        'document_id', v_new_doc_id,
        'message', 'Suggestion approved. Document placeholder created.'
    );
END;
$$;

-- 5. FUNCTION: Reject suggestion
CREATE OR REPLACE FUNCTION reject_knowledge_suggestion(
    p_suggestion_id UUID,
    p_admin_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE knowledge_suggestions
    SET status = 'rejected',
        reviewed_by = p_admin_id,
        reviewed_at = NOW(),
        admin_notes = p_reason,
        updated_at = NOW()
    WHERE id = p_suggestion_id AND status IN ('pending', 'reviewed');

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Suggestion not found or already processed');
    END IF;

    RETURN json_build_object('success', true, 'message', 'Suggestion rejected');
END;
$$;

-- 6. VIEW: Admin dashboard summary
CREATE OR REPLACE VIEW knowledge_gap_summary AS
SELECT 
    product_id,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
    SUM(occurrence_count) FILTER (WHERE status = 'pending') as total_user_uploads,
    AVG(uniqueness_score) FILTER (WHERE status = 'pending') as avg_uniqueness,
    MAX(priority_score) FILTER (WHERE status = 'pending') as max_priority
FROM knowledge_suggestions
GROUP BY product_id;
