-- Migration: Product-Level User Authentication & Private Knowledge Bases
-- Handles existing tables gracefully by dropping/altering if needed

-- ============================================
-- 1. PRODUCT USERS
-- ============================================
CREATE TABLE IF NOT EXISTS product_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'owner')),
    display_name TEXT,
    avatar_url TEXT,
    storage_used_bytes BIGINT DEFAULT 0,
    storage_limit_bytes BIGINT DEFAULT 104857600,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_users_user_id ON product_users(user_id);
CREATE INDEX IF NOT EXISTS idx_product_users_product_id ON product_users(product_id);

-- ============================================
-- 2. USER KNOWLEDGE BASES
-- ============================================
CREATE TABLE IF NOT EXISTS user_knowledge_bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_user_id UUID NOT NULL REFERENCES product_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    document_count INTEGER DEFAULT 0,
    chunk_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_kb_product_user ON user_knowledge_bases(product_user_id);

-- ============================================
-- 3. USER DOCUMENTS (Handle existing table)
-- ============================================
DO $$ 
BEGIN
    -- If user_documents exists but doesn't have user_knowledge_base_id, add it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_documents') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_documents' AND column_name = 'user_knowledge_base_id') THEN
            ALTER TABLE user_documents ADD COLUMN user_knowledge_base_id UUID REFERENCES user_knowledge_bases(id) ON DELETE CASCADE;
        END IF;
        
        -- Add other potentially missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_documents' AND column_name = 'status') THEN
            ALTER TABLE user_documents ADD COLUMN status TEXT DEFAULT 'processing';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_documents' AND column_name = 'file_size_bytes') THEN
            ALTER TABLE user_documents ADD COLUMN file_size_bytes BIGINT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_documents' AND column_name = 'file_type') THEN
            ALTER TABLE user_documents ADD COLUMN file_type TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_documents' AND column_name = 'filename') THEN
            ALTER TABLE user_documents ADD COLUMN filename TEXT;
        END IF;
    ELSE
        -- Create table if it doesn't exist
        CREATE TABLE user_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_knowledge_base_id UUID NOT NULL REFERENCES user_knowledge_bases(id) ON DELETE CASCADE,
            filename TEXT NOT NULL,
            file_type TEXT,
            file_size_bytes INTEGER,
            status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
            error_message TEXT,
            chunk_count INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            processed_at TIMESTAMPTZ
        );
    END IF;
END $$;

-- Safe index creation
DROP INDEX IF EXISTS idx_user_docs_kb;
CREATE INDEX idx_user_docs_kb ON user_documents(user_knowledge_base_id);

-- ============================================
-- 4. USER KNOWLEDGE CHUNKS
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_knowledge_chunks') THEN
        -- Add/Update columns if needed
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_knowledge_chunks' AND column_name = 'product_user_id') THEN
             ALTER TABLE user_knowledge_chunks ADD COLUMN product_user_id UUID REFERENCES product_users(id) ON DELETE CASCADE;
        END IF;
    ELSE
        CREATE TABLE user_knowledge_chunks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_document_id UUID NOT NULL REFERENCES user_documents(id) ON DELETE CASCADE,
            product_user_id UUID NOT NULL REFERENCES product_users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            embedding vector(768),
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- Indexes
DROP INDEX IF EXISTS idx_user_chunks_doc;
CREATE INDEX idx_user_chunks_doc ON user_knowledge_chunks(user_document_id);

DROP INDEX IF EXISTS idx_user_chunks_user;
CREATE INDEX idx_user_chunks_user ON user_knowledge_chunks(product_user_id);

DROP INDEX IF EXISTS idx_user_chunks_embedding;
CREATE INDEX idx_user_chunks_embedding ON user_knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- 5. CHAT SESSIONS & MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_user_id UUID NOT NULL REFERENCES product_users(id) ON DELETE CASCADE,
    title TEXT,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(product_user_id);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB,
    confidence_score FLOAT,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(chat_session_id);

-- ============================================
-- 6. RLS Policies (Safe handling)
-- ============================================

ALTER TABLE product_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Drop existing policies to prevent conflicts
    DROP POLICY IF EXISTS "Users can view own product_users" ON product_users;
    DROP POLICY IF EXISTS "Users can update own product_users" ON product_users;
    
    -- Recreate policies
    CREATE POLICY "Users can view own product_users" ON product_users FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can update own product_users" ON product_users FOR UPDATE USING (auth.uid() = user_id);
END $$;

-- Create policies for other tables (using DO block to avoid errors if they exist)
DO $$ 
BEGIN
   DROP POLICY IF EXISTS "Users can view own knowledge bases" ON user_knowledge_bases;
   CREATE POLICY "Users can view own knowledge bases" ON user_knowledge_bases FOR ALL USING (
        product_user_id IN (SELECT id FROM product_users WHERE user_id = auth.uid())
    );
END $$;

DO $$ 
BEGIN
   DROP POLICY IF EXISTS "Users can view own documents" ON user_documents;
   CREATE POLICY "Users can view own documents" ON user_documents FOR ALL USING (
        user_knowledge_base_id IN (
            SELECT ukb.id FROM user_knowledge_bases ukb
            JOIN product_users pu ON ukb.product_user_id = pu.id
            WHERE pu.user_id = auth.uid()
        )
    );
END $$;

DO $$ 
BEGIN
   DROP POLICY IF EXISTS "Users can view own chunks" ON user_knowledge_chunks;
   CREATE POLICY "Users can view own chunks" ON user_knowledge_chunks FOR ALL USING (
        product_user_id IN (SELECT id FROM product_users WHERE user_id = auth.uid())
    );
END $$;

DO $$ 
BEGIN
   DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
   CREATE POLICY "Users can view own chat sessions" ON chat_sessions FOR ALL USING (
        product_user_id IN (SELECT id FROM product_users WHERE user_id = auth.uid())
    );
END $$;

DO $$ 
BEGIN
   DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
   CREATE POLICY "Users can view own chat messages" ON chat_messages FOR ALL USING (
        chat_session_id IN (
            SELECT cs.id FROM chat_sessions cs
            JOIN product_users pu ON cs.product_user_id = pu.id
            WHERE pu.user_id = auth.uid()
        )
    );
END $$;

-- ============================================
-- 7. FUNCTIONS
-- ============================================

-- Function to search user's private knowledge
CREATE OR REPLACE FUNCTION match_user_knowledge_chunks(
    query_embedding vector(768),
    p_product_user_id UUID,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity FLOAT,
    document_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ukc.id,
        ukc.content,
        1 - (ukc.embedding <=> query_embedding) as similarity,
        ud.filename as document_name
    FROM user_knowledge_chunks ukc
    JOIN user_documents ud ON ukc.user_document_id = ud.id
    WHERE ukc.product_user_id = p_product_user_id
    ORDER BY ukc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Helper functions for counters
CREATE OR REPLACE FUNCTION increment_document_count(kb_id UUID)
RETURNS INT AS $$
    UPDATE user_knowledge_bases 
    SET document_count = document_count + 1 
    WHERE id = kb_id 
    RETURNING document_count;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION increment_chunk_count(kb_id UUID, count INT)
RETURNS INT AS $$
    UPDATE user_knowledge_bases 
    SET chunk_count = chunk_count + count 
    WHERE id = kb_id 
    RETURNING chunk_count;
$$ LANGUAGE sql;
