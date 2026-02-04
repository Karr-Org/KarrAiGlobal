-- Fix user_knowledge_chunks schema to match code expectation (document_id)
-- and ensure the table exists correctly.

DROP TABLE IF EXISTS user_knowledge_chunks CASCADE;

CREATE TABLE user_knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES user_documents(id) ON DELETE CASCADE,
    product_user_id UUID REFERENCES product_users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768),
    metadata JSONB DEFAULT '{}',
    chunk_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_chunks_doc ON user_knowledge_chunks(document_id);
CREATE INDEX idx_user_chunks_user ON user_knowledge_chunks(product_user_id);
CREATE INDEX idx_user_chunks_embedding ON user_knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable RLS
ALTER TABLE user_knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Users can view own chunks" ON user_knowledge_chunks FOR ALL USING (
    product_user_id IN (SELECT id FROM product_users WHERE user_id = auth.uid())
);

-- Grant permissions
GRANT ALL ON user_knowledge_chunks TO authenticated;
GRANT ALL ON user_knowledge_chunks TO service_role;

-- Fix the match function if it uses the old column name
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
        ud.title as document_name
    FROM user_knowledge_chunks ukc
    JOIN user_documents ud ON ukc.document_id = ud.id
    WHERE ukc.product_user_id = p_product_user_id
    ORDER BY ukc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
