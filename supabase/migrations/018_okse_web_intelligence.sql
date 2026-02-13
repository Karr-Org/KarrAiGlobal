-- ============================================================================
-- OKSE: Omniscient Knowledge Synthesis Engine - Web Intelligence Schema
-- ============================================================================
-- This migration creates the database tables for the OKSE system:
-- 1. trusted_web_sources - Admin-configured trusted domains per product
-- 2. web_knowledge_cache - Crawled web pages with TTL
-- 3. web_knowledge_chunks - Chunked + embedded web content with citations
-- 4. semantic_cache - Multi-level query response caching
-- ============================================================================
-- ============================================================================
-- TABLE 1: TRUSTED WEB SOURCES
-- Admin-configured domains that can be crawled for each product
-- ============================================================================
CREATE TABLE IF NOT EXISTS trusted_web_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    -- Domain configuration
    domain TEXT NOT NULL,
    -- e.g., "cbic.gov.in"
    display_name TEXT,
    -- e.g., "CBIC Official"
    url_patterns TEXT [] DEFAULT '{}',
    -- e.g., ["/circulars/*"]
    exclude_patterns TEXT [] DEFAULT '{}',
    -- URLs to skip
    -- Authority & trust
    authority_score INTEGER DEFAULT 5 CHECK (
        authority_score BETWEEN 1 AND 10
    ),
    source_type TEXT DEFAULT 'official',
    -- official, professional, commentary, blog
    -- Crawling configuration
    crawl_frequency TEXT DEFAULT 'daily',
    -- realtime, 15min, hourly, daily, weekly
    css_selectors JSONB DEFAULT '{}',
    -- {"content": ".main-content", "title": "h1"}
    use_javascript BOOLEAN DEFAULT FALSE,
    -- Use headless browser
    respect_robots_txt BOOLEAN DEFAULT TRUE,
    rate_limit_ms INTEGER DEFAULT 1000,
    -- Delay between requests
    -- Status tracking
    is_active BOOLEAN DEFAULT TRUE,
    last_crawled_at TIMESTAMPTZ,
    last_crawl_status TEXT,
    -- success, error, rate_limited
    total_pages_crawled INTEGER DEFAULT 0,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(product_id, domain)
);
-- Index for efficient lookup
CREATE INDEX IF NOT EXISTS idx_trusted_web_sources_product ON trusted_web_sources(product_id, is_active);
CREATE INDEX IF NOT EXISTS idx_trusted_web_sources_crawl_due ON trusted_web_sources(is_active, crawl_frequency, last_crawled_at);
-- ============================================================================
-- TABLE 2: WEB KNOWLEDGE CACHE
-- Cached crawled pages with TTL for freshness
-- ============================================================================
CREATE TABLE IF NOT EXISTS web_knowledge_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES trusted_web_sources(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    -- Page information
    url TEXT NOT NULL,
    canonical_url TEXT,
    -- Normalized URL
    title TEXT,
    -- Content tracking
    content_hash TEXT,
    -- MD5 for delta detection
    raw_content TEXT,
    -- Original extracted text
    -- Metadata
    page_type TEXT,
    -- circular, notification, article, etc.
    extracted_date DATE,
    -- Date mentioned in content
    extracted_entities JSONB DEFAULT '{}',
    -- Extracted entities (sections, forms, etc.)
    -- TTL & Status
    expires_at TIMESTAMPTZ NOT NULL,
    is_expired BOOLEAN DEFAULT FALSE,
    crawled_at TIMESTAMPTZ DEFAULT NOW(),
    -- Tracking
    times_used INTEGER DEFAULT 0,
    -- How often cited in responses
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_id, url)
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_web_knowledge_cache_product ON web_knowledge_cache(product_id, is_expired);
CREATE INDEX IF NOT EXISTS idx_web_knowledge_cache_expires ON web_knowledge_cache(expires_at)
WHERE NOT is_expired;
CREATE INDEX IF NOT EXISTS idx_web_knowledge_cache_url ON web_knowledge_cache(url);
-- ============================================================================
-- TABLE 3: WEB KNOWLEDGE CHUNKS
-- Chunked and embedded web content for vector search
-- ============================================================================
CREATE TABLE IF NOT EXISTS web_knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_id UUID NOT NULL REFERENCES web_knowledge_cache(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    -- Source citation info (for display)
    source_domain TEXT NOT NULL,
    -- "cbic.gov.in" for citations
    source_display_name TEXT,
    -- "CBIC Official"
    source_url TEXT NOT NULL,
    -- Full URL for linking
    source_title TEXT,
    -- Page title
    -- Content
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    -- Embeddings (Gemini text-embedding-004 uses 768 dimensions)
    embedding vector(768),
    -- Enhanced context (from OmniForge Phase 1)
    contextual_summary TEXT,
    structured_metadata JSONB DEFAULT '{}',
    -- Authority (inherited from source)
    authority_score INTEGER NOT NULL,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
-- Vector search index
CREATE INDEX IF NOT EXISTS idx_web_knowledge_chunks_embedding ON web_knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- Product + expiry index
CREATE INDEX IF NOT EXISTS idx_web_knowledge_chunks_product ON web_knowledge_chunks(product_id, expires_at);
-- ============================================================================
-- TABLE 4: SEMANTIC CACHE
-- Cache query responses based on semantic similarity
-- ============================================================================
CREATE TABLE IF NOT EXISTS semantic_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    -- Optional: user-specific caching
    -- Query
    query_text TEXT NOT NULL,
    query_normalized TEXT NOT NULL,
    -- Lowercase, trimmed, etc.
    query_embedding vector(768),
    -- Response
    response TEXT NOT NULL,
    sources JSONB DEFAULT '[]',
    -- Sources used in response
    reasoning_metadata JSONB DEFAULT '{}',
    -- CRAG verdict, confidence, etc.
    -- Quality metrics
    confidence FLOAT,
    complexity_level TEXT,
    -- SIMPLE, MODERATE, COMPLEX, MULTI_HOP
    -- TTL & tracking
    expires_at TIMESTAMPTZ NOT NULL,
    hit_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMPTZ,
    -- Feedback
    user_feedback TEXT,
    -- positive, negative, null
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Vector search for semantic similarity
CREATE INDEX IF NOT EXISTS idx_semantic_cache_embedding ON semantic_cache USING ivfflat (query_embedding vector_cosine_ops) WITH (lists = 100);
-- Product + expiry index
CREATE INDEX IF NOT EXISTS idx_semantic_cache_product ON semantic_cache(product_id, expires_at);
-- Exact match lookup (normalized query hash)
CREATE INDEX IF NOT EXISTS idx_semantic_cache_exact ON semantic_cache(product_id, query_normalized);
-- ============================================================================
-- RPC FUNCTION: Web Knowledge Hybrid Search
-- Search web knowledge chunks with authority weighting
-- ============================================================================
CREATE OR REPLACE FUNCTION okse_web_search(
        p_query_embedding vector(768),
        p_product_id UUID,
        p_match_count INTEGER DEFAULT 5,
        p_min_authority INTEGER DEFAULT 1
    ) RETURNS TABLE (
        chunk_id UUID,
        content TEXT,
        source_domain TEXT,
        source_display_name TEXT,
        source_url TEXT,
        source_title TEXT,
        authority_score INTEGER,
        contextual_summary TEXT,
        similarity FLOAT
    ) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
SELECT wkc.id AS chunk_id,
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
-- ============================================================================
-- RPC FUNCTION: Semantic Cache Lookup
-- Find semantically similar cached responses
-- ============================================================================
CREATE OR REPLACE FUNCTION okse_cache_lookup(
        p_query_embedding vector(768),
        p_product_id UUID,
        p_similarity_threshold FLOAT DEFAULT 0.85,
        p_user_id UUID DEFAULT NULL
    ) RETURNS TABLE (
        cache_id UUID,
        query_text TEXT,
        response TEXT,
        sources JSONB,
        confidence FLOAT,
        similarity FLOAT
    ) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
SELECT sc.id AS cache_id,
    sc.query_text,
    sc.response,
    sc.sources,
    sc.confidence,
    1 - (sc.query_embedding <=> p_query_embedding) AS similarity
FROM semantic_cache sc
WHERE sc.product_id = p_product_id
    AND sc.expires_at > NOW()
    AND (
        p_user_id IS NULL
        OR sc.user_id IS NULL
        OR sc.user_id = p_user_id
    )
    AND 1 - (sc.query_embedding <=> p_query_embedding) >= p_similarity_threshold
ORDER BY sc.query_embedding <=> p_query_embedding
LIMIT 1;
END;
$$;
-- ============================================================================
-- RPC FUNCTION: RRF Fusion Search
-- Combines KB search and Web search with Reciprocal Rank Fusion
-- ============================================================================
CREATE OR REPLACE FUNCTION okse_fused_search(
        p_query_embedding vector(768),
        p_query_text TEXT,
        p_product_id UUID,
        p_knowledge_base_id UUID,
        p_match_count INTEGER DEFAULT 10,
        p_kb_weight FLOAT DEFAULT 0.6,
        p_web_weight FLOAT DEFAULT 0.4
    ) RETURNS TABLE (
        chunk_id UUID,
        content TEXT,
        source_type TEXT,
        -- 'kb' or 'web'
        source_domain TEXT,
        -- null for KB, domain for web
        source_title TEXT,
        source_url TEXT,
        authority_score INTEGER,
        contextual_summary TEXT,
        rrf_score FLOAT
    ) LANGUAGE plpgsql AS $$
DECLARE k CONSTANT INTEGER := 60;
-- RRF constant
BEGIN RETURN QUERY WITH -- KB Results with rank
kb_results AS (
    SELECT kc.id AS chunk_id,
        kc.content,
        'kb'::TEXT AS source_type,
        NULL::TEXT AS source_domain,
        kd.title AS source_title,
        NULL::TEXT AS source_url,
        COALESCE(kd.authority_level, 10)::INTEGER AS authority_score,
        kc.contextual_summary,
        ROW_NUMBER() OVER (
            ORDER BY kc.embedding <=> p_query_embedding
        ) AS rank
    FROM knowledge_chunks kc
        JOIN knowledge_documents kd ON kc.document_id = kd.id
    WHERE kc.knowledge_base_id = p_knowledge_base_id
    ORDER BY kc.embedding <=> p_query_embedding
    LIMIT p_match_count * 2
), -- Web Results with rank
web_results AS (
    SELECT wkc.id AS chunk_id,
        wkc.content,
        'web'::TEXT AS source_type,
        wkc.source_domain,
        wkc.source_title,
        wkc.source_url,
        wkc.authority_score,
        wkc.contextual_summary,
        ROW_NUMBER() OVER (
            ORDER BY wkc.embedding <=> p_query_embedding
        ) AS rank
    FROM web_knowledge_chunks wkc
    WHERE wkc.product_id = p_product_id
        AND wkc.expires_at > NOW()
    ORDER BY wkc.embedding <=> p_query_embedding
    LIMIT p_match_count * 2
), -- Combined with RRF scoring
combined AS (
    SELECT kb.chunk_id,
        kb.content,
        kb.source_type,
        kb.source_domain,
        kb.source_title,
        kb.source_url,
        kb.authority_score,
        kb.contextual_summary,
        (p_kb_weight / (k + kb.rank)) * (kb.authority_score::FLOAT / 10) AS rrf_score
    FROM kb_results kb
    UNION ALL
    SELECT web.chunk_id,
        web.content,
        web.source_type,
        web.source_domain,
        web.source_title,
        web.source_url,
        web.authority_score,
        web.contextual_summary,
        (p_web_weight / (k + web.rank)) * (web.authority_score::FLOAT / 10) AS rrf_score
    FROM web_results web
)
SELECT *
FROM combined
ORDER BY rrf_score DESC
LIMIT p_match_count;
END;
$$;
-- ============================================================================
-- TRIGGER: Update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_trusted_web_sources_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_trusted_web_sources_updated_at ON trusted_web_sources;
CREATE TRIGGER trigger_trusted_web_sources_updated_at BEFORE
UPDATE ON trusted_web_sources FOR EACH ROW EXECUTE FUNCTION update_trusted_web_sources_updated_at();
-- ============================================================================
-- TRIGGER: Increment cache hit count (Legacy/Broken - Commented Out)
-- ============================================================================
/*
 CREATE OR REPLACE FUNCTION increment_cache_hit()
 RETURNS TRIGGER AS $$
 BEGIN
 -- This is called via RPC after a cache hit
 UPDATE semantic_cache 
 SET hit_count = hit_count + 1, 
 last_hit_at = NOW()
 WHERE id = NEW.id;
 RETURN NEW;
 END;
 $$ LANGUAGE plpgsql;
 */
-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE trusted_web_sources IS 'Admin-configured trusted domains for web crawling per product';
COMMENT ON TABLE web_knowledge_cache IS 'Cached crawled web pages with TTL management';
COMMENT ON TABLE web_knowledge_chunks IS 'Chunked and embedded web content for vector search';
COMMENT ON TABLE semantic_cache IS 'Semantic query response cache for fast repeated queries';
COMMENT ON FUNCTION okse_web_search IS 'Search web knowledge chunks with authority weighting';
COMMENT ON FUNCTION okse_cache_lookup IS 'Find semantically similar cached responses';
COMMENT ON FUNCTION okse_fused_search IS 'RRF fusion of KB and Web search results with authority';