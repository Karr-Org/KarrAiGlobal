-- =====================================================
-- HYBRID KNOWLEDGE ENGINE - DATABASE MIGRATION
-- Version: 014
-- Purpose: Enable multi-source knowledge for all products
-- =====================================================

-- 1. KNOWLEDGE SOURCES TABLE
-- Defines what external sources a product can use
CREATE TABLE IF NOT EXISTS knowledge_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Source Type
    source_type TEXT NOT NULL CHECK (source_type IN ('internal_documents', 'external_api', 'trusted_web')),
    
    -- Display
    name TEXT NOT NULL,
    description TEXT,
    icon_emoji TEXT DEFAULT '📚',
    
    -- Configuration (Type-specific JSON)
    config JSONB NOT NULL DEFAULT '{}',
    
    -- Trust & Priority
    trust_level INTEGER DEFAULT 80 CHECK (trust_level BETWEEN 0 AND 100),
    priority INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_product ON knowledge_sources(product_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_type ON knowledge_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_active ON knowledge_sources(product_id, is_active) WHERE is_active = true;

-- 2. KNOWLEDGE SOURCE CACHE
-- Stores cached API/Web responses to minimize redundant fetches
CREATE TABLE IF NOT EXISTS knowledge_source_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
    
    -- Cache Key (hash of query + params)
    cache_key TEXT NOT NULL,
    
    -- Cached Response
    query_text TEXT,
    response_data JSONB NOT NULL,
    content_text TEXT,                      -- Extracted text for search
    embedding vector(768),                  -- Pre-computed for vector search
    
    -- Metadata
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,                 -- NULL = never expires (stagnant)
    hit_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMPTZ,
    
    UNIQUE(source_id, cache_key)
);

CREATE INDEX IF NOT EXISTS idx_source_cache_key ON knowledge_source_cache(source_id, cache_key);
CREATE INDEX IF NOT EXISTS idx_source_cache_expiry ON knowledge_source_cache(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_source_cache_embedding ON knowledge_source_cache USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- 3. API INTEGRATIONS MARKETPLACE
-- Pre-built integration templates users can add
CREATE TABLE IF NOT EXISTS api_integrations (
    id TEXT PRIMARY KEY,
    
    -- Display
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    icon_emoji TEXT DEFAULT '🔌',
    logo_url TEXT,
    
    -- Integration Details
    base_url TEXT NOT NULL,
    auth_type TEXT DEFAULT 'api_key' CHECK (auth_type IN ('none', 'api_key', 'oauth2', 'bearer')),
    documentation_url TEXT,
    
    -- Configuration Schema
    config_schema JSONB,
    default_config JSONB DEFAULT '{}',
    
    -- Availability
    is_free BOOLEAN DEFAULT false,
    requires_user_key BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SEED: DEFAULT INTERNAL DOCUMENTS SOURCE
-- Every product automatically gets "Internal Documents" source
INSERT INTO knowledge_sources (product_id, source_type, name, description, icon_emoji, trust_level, priority, config)
SELECT 
    id AS product_id,
    'internal_documents' AS source_type,
    'Internal Documents' AS name,
    'Admin-uploaded and user-contributed knowledge base documents' AS description,
    '📚' AS icon_emoji,
    100 AS trust_level,
    100 AS priority,
    '{}'::JSONB AS config
FROM products
WHERE NOT EXISTS (
    SELECT 1 FROM knowledge_sources ks 
    WHERE ks.product_id = products.id 
    AND ks.source_type = 'internal_documents'
);

-- 5. SEED: PRE-BUILT API INTEGRATIONS
INSERT INTO api_integrations (id, name, description, category, icon_emoji, base_url, auth_type, requires_user_key, config_schema, default_config) VALUES

('indian_kanoon', 'Indian Kanoon', 'Search Indian court judgments, laws, and legal documents', 'legal', '⚖️', 
 'https://api.indiankanoon.org', 'api_key', true,
 '{"type":"object","properties":{"api_key":{"type":"string","title":"API Key"},"max_results":{"type":"integer","default":10}}}',
 '{"refresh_strategy":"stagnant","cache_ttl_seconds":null}'),

('pubmed', 'PubMed', 'Search biomedical literature from MEDLINE and life science journals', 'medical', '🔬',
 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils', 'none', false,
 '{"type":"object","properties":{"max_results":{"type":"integer","default":10}}}',
 '{"refresh_strategy":"dynamic","cache_ttl_seconds":86400}'),

('google_scholar', 'Google Scholar', 'Search scholarly articles, theses, books, and conference papers', 'academic', '🎓',
 'https://serpapi.com/search', 'api_key', true,
 '{"type":"object","properties":{"api_key":{"type":"string","title":"SerpAPI Key"},"max_results":{"type":"integer","default":10}}}',
 '{"refresh_strategy":"dynamic","cache_ttl_seconds":3600}'),

('cbic_circulars', 'CBIC Circulars', 'Latest GST circulars and notifications from CBIC', 'tax', '📋',
 'https://cbic-gst.gov.in/api', 'none', false,
 '{"type":"object","properties":{"include_archives":{"type":"boolean","default":true}}}',
 '{"refresh_strategy":"dynamic","cache_ttl_seconds":3600}')

ON CONFLICT (id) DO NOTHING;

-- 6. FUNCTION: Search External Sources
CREATE OR REPLACE FUNCTION search_external_sources(
    p_product_id UUID,
    p_query_text TEXT,
    p_query_embedding vector(768),
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    source_id UUID,
    source_name TEXT,
    source_type TEXT,
    source_icon TEXT,
    trust_level INTEGER,
    cache_id UUID,
    content TEXT,
    response_data JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ks.id AS source_id,
        ks.name AS source_name,
        ks.source_type,
        ks.icon_emoji AS source_icon,
        ks.trust_level,
        ksc.id AS cache_id,
        ksc.content_text AS content,
        ksc.response_data,
        1 - (ksc.embedding <=> p_query_embedding) AS similarity
    FROM knowledge_sources ks
    JOIN knowledge_source_cache ksc ON ksc.source_id = ks.id
    WHERE ks.product_id = p_product_id
      AND ks.is_active = true
      AND ks.source_type != 'internal_documents'  -- Internal handled separately
      AND (ksc.expires_at IS NULL OR ksc.expires_at > NOW())
      AND ksc.embedding IS NOT NULL
    ORDER BY 
        (1 - (ksc.embedding <=> p_query_embedding)) * (ks.trust_level::FLOAT / 100) DESC
    LIMIT p_limit;
END;
$$;

-- 7. FUNCTION: Record Cache Hit
CREATE OR REPLACE FUNCTION record_cache_hit(p_cache_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE knowledge_source_cache
    SET hit_count = hit_count + 1,
        last_hit_at = NOW()
    WHERE id = p_cache_id;
END;
$$;

-- 8. VIEW: Source Analytics
CREATE OR REPLACE VIEW knowledge_source_stats AS
SELECT 
    ks.id AS source_id,
    ks.product_id,
    ks.name,
    ks.source_type,
    ks.trust_level,
    ks.is_active,
    COUNT(ksc.id) AS cached_entries,
    COALESCE(SUM(ksc.hit_count), 0) AS total_hits,
    MAX(ksc.fetched_at) AS last_fetch,
    MAX(ksc.last_hit_at) AS last_used
FROM knowledge_sources ks
LEFT JOIN knowledge_source_cache ksc ON ksc.source_id = ks.id
GROUP BY ks.id;

-- 9. GRANTS
GRANT SELECT ON knowledge_sources TO authenticated, service_role;
GRANT SELECT ON knowledge_source_cache TO authenticated, service_role;
GRANT SELECT ON api_integrations TO authenticated, service_role;
GRANT SELECT ON knowledge_source_stats TO authenticated, service_role;

GRANT INSERT, UPDATE, DELETE ON knowledge_sources TO service_role;
GRANT INSERT, UPDATE, DELETE ON knowledge_source_cache TO service_role;

GRANT EXECUTE ON FUNCTION search_external_sources TO service_role;
GRANT EXECUTE ON FUNCTION record_cache_hit TO service_role;
