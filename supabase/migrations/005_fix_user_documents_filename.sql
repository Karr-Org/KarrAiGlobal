-- Fix missing columns in user_documents table and function references
-- Migration 005: Fix user_documents schema mismatches

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_documents') THEN
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_documents' AND column_name = 'file_size_bytes') THEN
            ALTER TABLE user_documents ADD COLUMN file_size_bytes BIGINT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_documents' AND column_name = 'file_type') THEN
            ALTER TABLE user_documents ADD COLUMN file_type TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_documents' AND column_name = 'metadata') THEN
            ALTER TABLE user_documents ADD COLUMN metadata JSONB DEFAULT '{}';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_documents' AND column_name = 'chunk_count') THEN
            ALTER TABLE user_documents ADD COLUMN chunk_count INTEGER DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_documents' AND column_name = 'processed_at') THEN
            ALTER TABLE user_documents ADD COLUMN processed_at TIMESTAMPTZ;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_documents' AND column_name = 'error_message') THEN
            ALTER TABLE user_documents ADD COLUMN error_message TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_documents' AND column_name = 'user_knowledge_base_id') THEN
            ALTER TABLE user_documents ADD COLUMN user_knowledge_base_id UUID REFERENCES user_knowledge_bases(id) ON DELETE CASCADE;
        END IF;

    END IF;
END $$;

-- Fix the match_user_knowledge_chunks function to use 'title' instead of 'filename'
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
        ud.title as document_name  -- Changed from 'filename' to 'title'
    FROM user_knowledge_chunks ukc
    JOIN user_documents ud ON ukc.user_document_id = ud.id
    WHERE ukc.product_user_id = p_product_user_id
    ORDER BY ukc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

