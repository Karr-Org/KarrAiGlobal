-- Migration: Add source_document_id to get_knowledge_suggestions function
-- This allows the admin UI to fetch the full document content

-- Drop and recreate the function with source_document_id included
DROP FUNCTION IF EXISTS get_knowledge_suggestions(UUID, TEXT, INTEGER);

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
    source_user_name TEXT,
    source_document_id UUID  -- Added for full document viewing
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
        pu.display_name as source_user_name,
        ks.source_document_id  -- Added for full document viewing
    FROM knowledge_suggestions ks
    LEFT JOIN product_users pu ON ks.source_user_id = pu.id
    WHERE ks.product_id = p_product_id
      AND (p_status IS NULL OR ks.status = p_status)
    ORDER BY ks.priority_score DESC, ks.occurrence_count DESC
    LIMIT p_limit;
END;
$$;

-- Grant execute to authenticated users  
GRANT EXECUTE ON FUNCTION get_knowledge_suggestions(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_knowledge_suggestions(UUID, TEXT, INTEGER) TO service_role;

-- Add comment
COMMENT ON FUNCTION get_knowledge_suggestions IS 'Returns prioritized knowledge gap suggestions for admin review, including source_document_id for full document viewing';
