-- =====================================================
-- KARR AI Database Schema (Clean Reset)
-- Version: 2.1.0
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop tables if they exist to force clean slate
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS actions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS user_document_chunks CASCADE;
DROP TABLE IF EXISTS user_documents CASCADE;
DROP TABLE IF EXISTS usage_records CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS knowledge_chunks CASCADE;
DROP TABLE IF EXISTS knowledge_documents CASCADE;
DROP TABLE IF EXISTS product_tiers CASCADE;
DROP TABLE IF EXISTS product_knowledge_bases CASCADE; -- New junction table
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS knowledge_bases CASCADE;

-- =====================================================
-- KNOWLEDGE BASES (Shared Infrastructure)
-- =====================================================

CREATE TABLE knowledge_bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS
-- =====================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    domain TEXT UNIQUE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    
    jurisdiction TEXT[] DEFAULT '{}',
    
    -- Branding
    logo_url TEXT,
    favicon_url TEXT,
    primary_color TEXT DEFAULT '#1a365d',
    secondary_color TEXT DEFAULT '#0d9488',
    
    -- Configs
    config JSONB DEFAULT '{}'::jsonb,
    ai_config JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE product_knowledge_bases (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    knowledge_base_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_id, knowledge_base_id)
);

CREATE TABLE product_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price_monthly INTEGER,
    price_annual INTEGER,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, slug)
);

-- =====================================================
-- KNOWLEDGE DOCUMENTS
-- =====================================================

CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_base_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    source_type TEXT NOT NULL,
    document_type TEXT,
    authority_level INTEGER DEFAULT 5,
    status TEXT DEFAULT 'pending',
    chunk_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding VECTOR(768),
    section_hierarchy TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_chunks_embedding 
ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_knowledge_chunks_content 
ON knowledge_chunks USING gin (to_tsvector('english', content));

-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    tier_id UUID REFERENCES product_tiers(id),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- =====================================================
-- USER DOCUMENTS
-- =====================================================

CREATE TABLE user_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES user_documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    product_id UUID REFERENCES products(id),
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding VECTOR(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_chunks_embedding 
ON user_document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =====================================================
-- CHAT & LOGS
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    product_id UUID REFERENCES products(id),
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL,
    event_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- HYBRID SEARCH FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION hybrid_search(
    query_embedding VECTOR(768),
    query_text TEXT,
    p_product_id UUID,
    p_user_id UUID DEFAULT NULL,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    chunk_id UUID,
    content TEXT,
    document_title TEXT,
    authority_level INT,
    source_tier TEXT,
    score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Product Knowledge (via ALL connected KBs)
    SELECT 
        kc.id,
        kc.content,
        kd.title,
        kd.authority_level,
        'product'::TEXT,
        (1 - (kc.embedding <=> query_embedding)) * (kd.authority_level::float / 10) as score
    FROM knowledge_chunks kc
    JOIN knowledge_documents kd ON kc.document_id = kd.id
    JOIN product_knowledge_bases pkb ON kd.knowledge_base_id = pkb.knowledge_base_id
    WHERE pkb.product_id = p_product_id
    
    UNION ALL
    
    -- User Knowledge
    SELECT 
        udc.id,
        udc.content,
        ud.title,
        5, 
        'user'::TEXT,
        (1 - (udc.embedding <=> query_embedding)) * 0.8 as score
    FROM user_document_chunks udc
    JOIN user_documents ud ON udc.document_id = ud.id
    WHERE udc.user_id = p_user_id 
        AND udc.product_id = p_product_id
        AND p_user_id IS NOT NULL
    
    ORDER BY score DESC
    LIMIT match_count;
END;
$$;
