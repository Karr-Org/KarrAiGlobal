-- =====================================================
-- OMNIFORGE PHASE 1: CONTEXTUAL FOUNDATION
-- Version: 015
-- Purpose: Add contextual embeddings and structured metadata
-- Research: Anthropic's Contextual Retrieval (49-67% fewer failures)
-- =====================================================

-- 1. ADD CONTEXTUAL COLUMNS TO KNOWLEDGE_CHUNKS
-- These enable Anthropic-style contextual retrieval
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS 
    contextual_summary TEXT;          -- LLM-generated context (e.g., "In the 2024 GST Notification...")

ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS 
    structured_metadata JSONB DEFAULT '{}';  -- Domain-flexible metadata

-- 2. ADD SAME COLUMNS TO USER_KNOWLEDGE_CHUNKS
ALTER TABLE user_knowledge_chunks ADD COLUMN IF NOT EXISTS 
    contextual_summary TEXT;

ALTER TABLE user_knowledge_chunks ADD COLUMN IF NOT EXISTS 
    structured_metadata JSONB DEFAULT '{}';

-- 3. ADD REFRESH STRATEGY TO KNOWLEDGE_SOURCES
-- For cost-optimized scraping (static vs dynamic content)
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS
    refresh_strategy TEXT DEFAULT 'dynamic' CHECK (refresh_strategy IN ('static', 'daily', 'weekly', 'monthly', 'dynamic'));

ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS
    last_refreshed_at TIMESTAMPTZ;

ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS
    cache_duration_hours INTEGER DEFAULT 24;

-- 4. CREATE INDEX FOR BM25 FULL-TEXT SEARCH ON CONTEXTUAL SUMMARY
-- This enables hybrid search on the enriched content
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_contextual_fts 
ON knowledge_chunks USING gin (to_tsvector('english', COALESCE(contextual_summary, '') || ' ' || content));

CREATE INDEX IF NOT EXISTS idx_user_chunks_contextual_fts 
ON user_knowledge_chunks USING gin (to_tsvector('english', COALESCE(contextual_summary, '') || ' ' || content));

-- 5. ENHANCED HYBRID SEARCH FUNCTION (RRF FUSION)
-- Combines BM25 + Vector with Reciprocal Rank Fusion
-- Weights by authority_level (trust weight)
CREATE OR REPLACE FUNCTION omniforge_hybrid_search(
    p_query_embedding VECTOR(768),
    p_query_text TEXT,
    p_product_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_match_count INT DEFAULT 10
)
RETURNS TABLE (
    chunk_id UUID,
    content TEXT,
    contextual_summary TEXT,
    document_title TEXT,
    authority_level INT,
    source_tier TEXT,
    vector_score FLOAT,
    bm25_score FLOAT,
    combined_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    k CONSTANT INT := 60;  -- RRF constant
BEGIN
    RETURN QUERY
    WITH 
    -- Vector search results with rank
    vector_results AS (
        SELECT 
            kc.id,
            kc.content,
            kc.contextual_summary,
            kd.title,
            kd.authority_level,
            'product'::TEXT AS tier,
            (1 - (kc.embedding <=> p_query_embedding)) AS v_score,
            ROW_NUMBER() OVER (ORDER BY kc.embedding <=> p_query_embedding) AS v_rank
        FROM knowledge_chunks kc
        JOIN knowledge_documents kd ON kc.document_id = kd.id
        JOIN product_knowledge_bases pkb ON kd.knowledge_base_id = pkb.knowledge_base_id
        WHERE pkb.product_id = p_product_id
          AND kc.embedding IS NOT NULL
        ORDER BY kc.embedding <=> p_query_embedding
        LIMIT p_match_count * 2
    ),
    -- BM25/Full-text search results with rank
    bm25_results AS (
        SELECT 
            kc.id,
            kc.content,
            kc.contextual_summary,
            kd.title,
            kd.authority_level,
            'product'::TEXT AS tier,
            ts_rank_cd(
                to_tsvector('english', COALESCE(kc.contextual_summary, '') || ' ' || kc.content),
                plainto_tsquery('english', p_query_text)
            ) AS b_score,
            ROW_NUMBER() OVER (
                ORDER BY ts_rank_cd(
                    to_tsvector('english', COALESCE(kc.contextual_summary, '') || ' ' || kc.content),
                    plainto_tsquery('english', p_query_text)
                ) DESC
            ) AS b_rank
        FROM knowledge_chunks kc
        JOIN knowledge_documents kd ON kc.document_id = kd.id
        JOIN product_knowledge_bases pkb ON kd.knowledge_base_id = pkb.knowledge_base_id
        WHERE pkb.product_id = p_product_id
          AND (
              to_tsvector('english', kc.content) @@ plainto_tsquery('english', p_query_text)
              OR to_tsvector('english', COALESCE(kc.contextual_summary, '')) @@ plainto_tsquery('english', p_query_text)
          )
        ORDER BY b_score DESC
        LIMIT p_match_count * 2
    ),
    -- Reciprocal Rank Fusion
    fused AS (
        SELECT 
            COALESCE(v.id, b.id) AS id,
            COALESCE(v.content, b.content) AS content,
            COALESCE(v.contextual_summary, b.contextual_summary) AS contextual_summary,
            COALESCE(v.title, b.title) AS title,
            COALESCE(v.authority_level, b.authority_level) AS authority_level,
            COALESCE(v.tier, b.tier) AS tier,
            COALESCE(v.v_score, 0) AS v_score,
            COALESCE(b.b_score, 0) AS b_score,
            -- RRF Formula: 1/(k + rank_vector) + 1/(k + rank_bm25)
            -- Then multiply by trust weight (authority_level / 10)
            (
                (1.0 / (k + COALESCE(v.v_rank, p_match_count * 2))) +
                (1.0 / (k + COALESCE(b.b_rank, p_match_count * 2)))
            ) * (COALESCE(v.authority_level, b.authority_level, 5)::FLOAT / 10) AS rrf_score
        FROM vector_results v
        FULL OUTER JOIN bm25_results b ON v.id = b.id
    )
    SELECT 
        f.id,
        f.content,
        f.contextual_summary,
        f.title,
        f.authority_level,
        f.tier,
        f.v_score,
        f.b_score,
        f.rrf_score
    FROM fused f
    ORDER BY f.rrf_score DESC
    LIMIT p_match_count;
END;
$$;

-- 6. USER DOCUMENTS HYBRID SEARCH
CREATE OR REPLACE FUNCTION omniforge_user_hybrid_search(
    p_query_embedding VECTOR(768),
    p_query_text TEXT,
    p_product_user_id UUID,
    p_match_count INT DEFAULT 10
)
RETURNS TABLE (
    chunk_id UUID,
    content TEXT,
    contextual_summary TEXT,
    document_title TEXT,
    vector_score FLOAT,
    bm25_score FLOAT,
    combined_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    k CONSTANT INT := 60;
BEGIN
    RETURN QUERY
    WITH 
    vector_results AS (
        SELECT 
            ukc.id,
            ukc.content,
            ukc.contextual_summary,
            ud.title,
            (1 - (ukc.embedding <=> p_query_embedding)) AS v_score,
            ROW_NUMBER() OVER (ORDER BY ukc.embedding <=> p_query_embedding) AS v_rank
        FROM user_knowledge_chunks ukc
        JOIN user_documents ud ON ukc.document_id = ud.id
        WHERE ukc.product_user_id = p_product_user_id
          AND ukc.embedding IS NOT NULL
        ORDER BY ukc.embedding <=> p_query_embedding
        LIMIT p_match_count * 2
    ),
    bm25_results AS (
        SELECT 
            ukc.id,
            ukc.content,
            ukc.contextual_summary,
            ud.title,
            ts_rank_cd(
                to_tsvector('english', COALESCE(ukc.contextual_summary, '') || ' ' || ukc.content),
                plainto_tsquery('english', p_query_text)
            ) AS b_score,
            ROW_NUMBER() OVER (
                ORDER BY ts_rank_cd(
                    to_tsvector('english', COALESCE(ukc.contextual_summary, '') || ' ' || ukc.content),
                    plainto_tsquery('english', p_query_text)
                ) DESC
            ) AS b_rank
        FROM user_knowledge_chunks ukc
        JOIN user_documents ud ON ukc.document_id = ud.id
        WHERE ukc.product_user_id = p_product_user_id
          AND (
              to_tsvector('english', ukc.content) @@ plainto_tsquery('english', p_query_text)
              OR to_tsvector('english', COALESCE(ukc.contextual_summary, '')) @@ plainto_tsquery('english', p_query_text)
          )
        ORDER BY b_score DESC
        LIMIT p_match_count * 2
    ),
    fused AS (
        SELECT 
            COALESCE(v.id, b.id) AS id,
            COALESCE(v.content, b.content) AS content,
            COALESCE(v.contextual_summary, b.contextual_summary) AS contextual_summary,
            COALESCE(v.title, b.title) AS title,
            COALESCE(v.v_score, 0) AS v_score,
            COALESCE(b.b_score, 0) AS b_score,
            (
                (1.0 / (k + COALESCE(v.v_rank, p_match_count * 2))) +
                (1.0 / (k + COALESCE(b.b_rank, p_match_count * 2)))
            ) AS rrf_score
        FROM vector_results v
        FULL OUTER JOIN bm25_results b ON v.id = b.id
    )
    SELECT 
        f.id,
        f.content,
        f.contextual_summary,
        f.title,
        f.v_score,
        f.b_score,
        f.rrf_score
    FROM fused f
    ORDER BY f.rrf_score DESC
    LIMIT p_match_count;
END;
$$;

-- 7. GRANTS
GRANT EXECUTE ON FUNCTION omniforge_hybrid_search TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION omniforge_user_hybrid_search TO authenticated, service_role;

-- 8. COMMENT FOR DOCUMENTATION
COMMENT ON FUNCTION omniforge_hybrid_search IS 
'OmniForge Phase 1: Hybrid search using Reciprocal Rank Fusion (RRF) of vector and BM25 results. 
Weights by authority_level for trust-aware retrieval. Uses contextual_summary for enhanced matching.';

COMMENT ON COLUMN knowledge_chunks.contextual_summary IS 
'LLM-generated context summary (Anthropic style). Example: "In the 2024 GST Notification, this section states..."';

COMMENT ON COLUMN knowledge_chunks.structured_metadata IS 
'Domain-flexible JSON metadata. Examples: {year: 2024, jurisdiction: "IN"} or {condition: "diabetes", stage: "type-2"}';
