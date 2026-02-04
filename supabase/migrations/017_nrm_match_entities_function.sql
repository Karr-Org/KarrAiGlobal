-- ============================================================================
-- KARR AI - NEURAL RELATIONAL MEMORY
-- Match Entities Function (pgvector similarity search)
-- ============================================================================

-- Function to find similar entities using vector embeddings
CREATE OR REPLACE FUNCTION match_entities(
    query_embedding vector(768),
    match_count int DEFAULT 5,
    p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    entity_name text,
    entity_type text,
    entity_subtype text,
    description text,
    importance_score float,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ueg.id,
        ueg.entity_name::text,
        ueg.entity_type::text,
        ueg.entity_subtype::text,
        ueg.description::text,
        ueg.importance_score::float,
        (1 - (ueg.embedding <=> query_embedding))::float AS similarity
    FROM user_entity_graph ueg
    WHERE 
        ueg.is_active = true
        AND ueg.embedding IS NOT NULL
        AND (p_user_id IS NULL OR ueg.product_user_id = p_user_id)
    ORDER BY ueg.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION match_entities TO authenticated;
GRANT EXECUTE ON FUNCTION match_entities TO service_role;

-- ============================================================================
-- Additional useful functions for NRM
-- ============================================================================

-- Function to get entity network (entities + relationships) for a user
CREATE OR REPLACE FUNCTION get_entity_network(
    p_user_id uuid,
    p_limit int DEFAULT 50
)
RETURNS TABLE (
    entity_id uuid,
    entity_name text,
    entity_type text,
    importance_score float,
    mention_count int,
    relationships jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ueg.id AS entity_id,
        ueg.entity_name::text,
        ueg.entity_type::text,
        ueg.importance_score::float,
        ueg.mention_count::int,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'target_entity_id', er.target_entity_id,
                        'target_entity_name', target.entity_name,
                        'relationship_type', er.relationship_type,
                        'strength', er.strength,
                        'category', er.relationship_category
                    )
                )
                FROM entity_relationships er
                LEFT JOIN user_entity_graph target ON target.id = er.target_entity_id
                WHERE er.source_entity_id = ueg.id
                AND er.valid_until IS NULL
            ),
            '[]'::jsonb
        ) AS relationships
    FROM user_entity_graph ueg
    WHERE 
        ueg.product_user_id = p_user_id
        AND ueg.is_active = true
    ORDER BY ueg.importance_score DESC, ueg.last_mentioned_at DESC
    LIMIT p_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_entity_network TO authenticated;
GRANT EXECUTE ON FUNCTION get_entity_network TO service_role;

-- Function to get active predictions for a user
CREATE OR REPLACE FUNCTION get_active_predictions(
    p_user_id uuid
)
RETURNS TABLE (
    id uuid,
    prediction_type text,
    entity_name text,
    target_entity_name text,
    prediction_value jsonb,
    confidence float,
    reasoning text,
    created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ep.id,
        ep.prediction_type::text,
        source.entity_name::text,
        target.entity_name::text,
        ep.prediction_value,
        ep.confidence::float,
        ep.reasoning::text,
        ep.created_at
    FROM entity_predictions ep
    LEFT JOIN user_entity_graph source ON source.id = ep.entity_id
    LEFT JOIN user_entity_graph target ON target.id = ep.target_entity_id
    WHERE 
        ep.product_user_id = p_user_id
        AND ep.is_active = true
        AND (ep.expires_at IS NULL OR ep.expires_at > NOW())
    ORDER BY ep.confidence DESC, ep.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_active_predictions TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_predictions TO service_role;

-- ============================================================================
-- DONE!
-- ============================================================================
