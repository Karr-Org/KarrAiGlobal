-- ============================================================================
-- OKSE FIX + INSTALL SCRIPT
-- Run this in Supabase SQL Editor to fix view conflicts and create OKSE tables
-- ============================================================================

-- STEP 1: Drop the conflicting view (will be recreated by migrations later)
DROP VIEW IF EXISTS knowledge_contributor_stats CASCADE;

-- ============================================================================
-- OKSE: Omniscient Knowledge Synthesis Engine - Web Intelligence Schema
-- ============================================================================

-- TABLE 1: TRUSTED WEB SOURCES
CREATE TABLE IF NOT EXISTS trusted_web_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    display_name TEXT,
    url_patterns TEXT[] DEFAULT '{}',
    exclude_patterns TEXT[] DEFAULT '{}',
    authority_score INTEGER DEFAULT 5 CHECK (authority_score BETWEEN 1 AND 10),
    source_type TEXT DEFAULT 'official',
    crawl_frequency TEXT DEFAULT 'daily',
    css_selectors JSONB DEFAULT '{}',
    use_javascript BOOLEAN DEFAULT FALSE,
    respect_robots_txt BOOLEAN DEFAULT TRUE,
    rate_limit_ms INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    last_crawled_at TIMESTAMPTZ,
    last_crawl_status TEXT,
    total_pages_crawled INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(product_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_trusted_web_sources_product 
    ON trusted_web_sources(product_id, is_active);

CREATE INDEX IF NOT EXISTS idx_trusted_web_sources_crawl_due 
    ON trusted_web_sources(is_active, crawl_frequency, last_crawled_at);

-- TABLE 2: WEB KNOWLEDGE CACHE
CREATE TABLE IF NOT EXISTS web_knowledge_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES trusted_web_sources(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    canonical_url TEXT,
    title TEXT,
    content_hash TEXT,
    raw_content TEXT,
    page_type TEXT,
    extracted_date DATE,
    extracted_entities JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ NOT NULL,
    is_expired BOOLEAN DEFAULT FALSE,
    crawled_at TIMESTAMPTZ DEFAULT NOW(),
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_id, url)
);

CREATE INDEX IF NOT EXISTS idx_web_knowledge_cache_product 
    ON web_knowledge_cache(product_id, is_expired);

CREATE INDEX IF NOT EXISTS idx_web_knowledge_cache_expires 
    ON web_knowledge_cache(expires_at) WHERE NOT is_expired;

CREATE INDEX IF NOT EXISTS idx_web_knowledge_cache_url 
    ON web_knowledge_cache(url);

-- TABLE 3: WEB KNOWLEDGE CHUNKS
CREATE TABLE IF NOT EXISTS web_knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_id UUID NOT NULL REFERENCES web_knowledge_cache(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    source_domain TEXT NOT NULL,
    source_display_name TEXT,
    source_url TEXT NOT NULL,
    source_title TEXT,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding vector(768),
    contextual_summary TEXT,
    structured_metadata JSONB DEFAULT '{}',
    authority_score INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_web_knowledge_chunks_embedding 
    ON web_knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_web_knowledge_chunks_product 
    ON web_knowledge_chunks(product_id, expires_at);

-- TABLE 4: SEMANTIC CACHE
CREATE TABLE IF NOT EXISTS semantic_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    query_text TEXT NOT NULL,
    query_normalized TEXT NOT NULL,
    query_embedding vector(768),
    response TEXT NOT NULL,
    sources JSONB DEFAULT '[]',
    reasoning_metadata JSONB DEFAULT '{}',
    confidence FLOAT,
    complexity_level TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    hit_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMPTZ,
    user_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_semantic_cache_embedding 
    ON semantic_cache USING ivfflat (query_embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_semantic_cache_product 
    ON semantic_cache(product_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_semantic_cache_exact 
    ON semantic_cache(product_id, query_normalized);

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Web Knowledge Search
CREATE OR REPLACE FUNCTION okse_web_search(
    p_query_embedding vector(768),
    p_product_id UUID,
    p_match_count INTEGER DEFAULT 5,
    p_min_authority INTEGER DEFAULT 1
)
RETURNS TABLE (
    chunk_id UUID,
    content TEXT,
    source_domain TEXT,
    source_display_name TEXT,
    source_url TEXT,
    source_title TEXT,
    authority_score INTEGER,
    contextual_summary TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wkc.id AS chunk_id,
        wkc.content,
        wkc.source_domain,
        wkc.source_display_name,
        wkc.source_url,
        wkc.source_title,
        wkc.authority_score,
        wkc.contextual_summary,
        1 - (wkc.embedding <=> p_query_embedding) AS similarity
    FROM web_knowledge_chunks wkc
    WHERE wkc.product_id = p_product_id
        AND wkc.expires_at > NOW()
        AND wkc.authority_score >= p_min_authority
    ORDER BY wkc.embedding <=> p_query_embedding
    LIMIT p_match_count;
END;
$$;

-- Semantic Cache Lookup
CREATE OR REPLACE FUNCTION okse_cache_lookup(
    p_query_embedding vector(768),
    p_product_id UUID,
    p_similarity_threshold FLOAT DEFAULT 0.85,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    cache_id UUID,
    query_text TEXT,
    response TEXT,
    sources JSONB,
    confidence FLOAT,
    similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id AS cache_id,
        sc.query_text,
        sc.response,
        sc.sources,
        sc.confidence,
        1 - (sc.query_embedding <=> p_query_embedding) AS similarity
    FROM semantic_cache sc
    WHERE sc.product_id = p_product_id
        AND sc.expires_at > NOW()
        AND (p_user_id IS NULL OR sc.user_id IS NULL OR sc.user_id = p_user_id)
        AND 1 - (sc.query_embedding <=> p_query_embedding) >= p_similarity_threshold
    ORDER BY sc.query_embedding <=> p_query_embedding
    LIMIT 1;
END;
$$;

-- RRF Fusion Search
CREATE OR REPLACE FUNCTION okse_fused_search(
    p_query_embedding vector(768),
    p_query_text TEXT,
    p_product_id UUID,
    p_knowledge_base_id UUID,
    p_match_count INTEGER DEFAULT 10,
    p_kb_weight FLOAT DEFAULT 0.6,
    p_web_weight FLOAT DEFAULT 0.4
)
RETURNS TABLE (
    chunk_id UUID,
    content TEXT,
    source_type TEXT,
    source_domain TEXT,
    source_title TEXT,
    source_url TEXT,
    authority_score INTEGER,
    contextual_summary TEXT,
    rrf_score FLOAT
)
LANGUAGE plpgsql AS $$
DECLARE
    k CONSTANT INTEGER := 60;
BEGIN
    RETURN QUERY
    WITH 
    kb_results AS (
        SELECT 
            kc.id AS chunk_id,
            kc.content,
            'kb'::TEXT AS source_type,
            NULL::TEXT AS source_domain,
            kd.title AS source_title,
            NULL::TEXT AS source_url,
            COALESCE(kd.authority_level, 10)::INTEGER AS authority_score,
            kc.contextual_summary,
            ROW_NUMBER() OVER (ORDER BY kc.embedding <=> p_query_embedding) AS rank
        FROM knowledge_chunks kc
        JOIN knowledge_documents kd ON kc.document_id = kd.id
        WHERE kc.knowledge_base_id = p_knowledge_base_id
        ORDER BY kc.embedding <=> p_query_embedding
        LIMIT p_match_count * 2
    ),
    web_results AS (
        SELECT 
            wkc.id AS chunk_id,
            wkc.content,
            'web'::TEXT AS source_type,
            wkc.source_domain,
            wkc.source_title,
            wkc.source_url,
            wkc.authority_score,
            wkc.contextual_summary,
            ROW_NUMBER() OVER (ORDER BY wkc.embedding <=> p_query_embedding) AS rank
        FROM web_knowledge_chunks wkc
        WHERE wkc.product_id = p_product_id
            AND wkc.expires_at > NOW()
        ORDER BY wkc.embedding <=> p_query_embedding
        LIMIT p_match_count * 2
    ),
    combined AS (
        SELECT 
            kb.chunk_id, kb.content, kb.source_type, kb.source_domain,
            kb.source_title, kb.source_url, kb.authority_score, kb.contextual_summary,
            (p_kb_weight / (k + kb.rank)) * (kb.authority_score::FLOAT / 10) AS rrf_score
        FROM kb_results kb
        
        UNION ALL
        
        SELECT 
            web.chunk_id, web.content, web.source_type, web.source_domain,
            web.source_title, web.source_url, web.authority_score, web.contextual_summary,
            (p_web_weight / (k + web.rank)) * (web.authority_score::FLOAT / 10) AS rrf_score
        FROM web_results web
    )
    SELECT * FROM combined
    ORDER BY rrf_score DESC
    LIMIT p_match_count;
END;
$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_trusted_web_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_trusted_web_sources_updated_at ON trusted_web_sources;
CREATE TRIGGER trigger_trusted_web_sources_updated_at
    BEFORE UPDATE ON trusted_web_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_trusted_web_sources_updated_at();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'OKSE tables created successfully!' AS status;
