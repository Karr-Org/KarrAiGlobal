-- =====================================================
-- FIX: KNOWLEDGE GAP INTELLIGENCE - CRITICAL BUG FIX
-- Date: 2026-02-02
-- 
-- BUG: detect_knowledge_gap() was joining on kb.product_id
--      which DOES NOT EXIST in knowledge_bases table.
--      Products are linked to KBs via product_knowledge_bases junction table.
-- 
-- IMPACT: Gap detection always failed silently, returning 0 similarity.
-- FIX: Use correct join path through product_knowledge_bases.
-- =====================================================

-- 1. Drop and recreate the fixed function
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
    v_kb_chunk_count INTEGER := 0;
BEGIN
    -- DEBUG: First, check if product has any knowledge chunks at all
    SELECT COUNT(*) INTO v_kb_chunk_count
    FROM knowledge_chunks kc
    JOIN knowledge_documents kd ON kc.document_id = kd.id
    JOIN product_knowledge_bases pkb ON kd.knowledge_base_id = pkb.knowledge_base_id
    WHERE pkb.product_id = p_product_id;

    -- If no chunks exist in product KB, this is definitely a gap!
    IF v_kb_chunk_count = 0 THEN
        -- No product knowledge exists yet, create suggestion
        v_is_new_gap := true;
        v_max_similarity := 0;
        v_priority := 10; -- Maximum priority when KB is empty
        
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
            0,
            1.0,
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
            'similarity', 0,
            'priority', v_priority,
            'kb_chunks', v_kb_chunk_count,
            'message', 'New knowledge gap detected (Product KB is empty)'
        );
    END IF;

    -- 1. Check similarity to existing product knowledge
    -- FIXED: Using product_knowledge_bases junction table instead of non-existent kb.product_id
    SELECT COALESCE(MAX(1 - (kc.embedding <=> p_content_embedding)), 0)
    INTO v_max_similarity
    FROM knowledge_chunks kc
    JOIN knowledge_documents kd ON kc.document_id = kd.id
    JOIN product_knowledge_bases pkb ON kd.knowledge_base_id = pkb.knowledge_base_id
    WHERE pkb.product_id = p_product_id
      AND kc.embedding IS NOT NULL;

    -- If similarity is high enough (>70%), no gap detected
    IF v_max_similarity > 0.7 THEN
        RETURN json_build_object(
            'gap_detected', false,
            'similarity', v_max_similarity,
            'kb_chunks', v_kb_chunk_count,
            'message', 'Similar content already exists in product knowledge base'
        );
    END IF;

    -- 2. Check if similar suggestion already exists (clustering)
    SELECT id INTO v_existing_suggestion_id
    FROM knowledge_suggestions
    WHERE product_id = p_product_id
      AND status IN ('pending', 'reviewed')
      AND topic_embedding IS NOT NULL
      AND (1 - (topic_embedding <=> p_content_embedding)) > 0.75
    ORDER BY (1 - (topic_embedding <=> p_content_embedding)) DESC
    LIMIT 1;

    IF v_existing_suggestion_id IS NOT NULL THEN
        -- Update existing suggestion (increment occurrence) if user hasn't already contributed
        UPDATE knowledge_suggestions
        SET occurrence_count = occurrence_count + 1,
            user_ids = CASE 
                WHEN p_source_user_id = ANY(user_ids) THEN user_ids 
                ELSE array_append(user_ids, p_source_user_id) 
            END,
            priority_score = (1 - COALESCE(similarity_to_kb, 0)) * (occurrence_count + 1) * 10,
            updated_at = NOW()
        WHERE id = v_existing_suggestion_id
          AND NOT (p_source_user_id = ANY(user_ids));

        RETURN json_build_object(
            'gap_detected', true,
            'is_new', false,
            'suggestion_id', v_existing_suggestion_id,
            'similarity', v_max_similarity,
            'kb_chunks', v_kb_chunk_count,
            'message', 'Added to existing knowledge gap suggestion (clustered)'
        );
    END IF;

    -- 3. Create new suggestion (completely unique content)
    v_is_new_gap := true;
    
    -- Calculate priority: uniqueness * base score
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
        'kb_chunks', v_kb_chunk_count,
        'message', 'New knowledge gap detected and logged'
    );
END;
$$;

-- 2. Add index to speed up similarity lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding_lookup
ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 3. Grant execute permission for service role
GRANT EXECUTE ON FUNCTION detect_knowledge_gap TO service_role;
GRANT EXECUTE ON FUNCTION detect_knowledge_gap TO authenticated;

-- 4. Add comment for documentation
COMMENT ON FUNCTION detect_knowledge_gap IS 
'Detects knowledge gaps by comparing user-uploaded document embeddings against the Product KB.
Uses product_knowledge_bases junction table to find all KBs linked to the product.
Returns JSON with gap_detected, similarity score, and suggestion ID if gap is created.
Fixed 2026-02-02: Corrected join path to use junction table.';
