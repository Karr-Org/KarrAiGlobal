-- =====================================================
-- KNOWLEDGE CONTRIBUTOR INTELLIGENCE SYSTEM
-- Date: 2026-02-03
-- 
-- Adds comprehensive tracking for document sources
-- and contributor attribution for analytics.
-- =====================================================

-- 1. Add contributor tracking columns to knowledge_documents
ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS contributed_by_product_user_id UUID REFERENCES product_users(id) ON DELETE SET NULL;

ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS contributor_name TEXT;

ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS contributor_email TEXT;

ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS approved_by_name TEXT;

ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS original_user_document_id UUID REFERENCES user_documents(id) ON DELETE SET NULL;

-- For quick display without JOINs on frequently accessed pages
ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS source_label TEXT DEFAULT 'upload';

-- 2. Create index for contributor queries
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_contributor 
ON knowledge_documents(contributed_by_product_user_id) 
WHERE contributed_by_product_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_docs_source_type 
ON knowledge_documents(source_type);

-- 3. Create a view for contributor statistics
CREATE OR REPLACE VIEW knowledge_contributor_stats AS
SELECT 
    pu.id AS product_user_id,
    MAX(kd.contributor_email) AS contributor_email,
    COALESCE(pu.display_name, MAX(kd.contributor_name)) AS contributor_name,
    pu.product_id,
    p.name AS product_name,
    COUNT(DISTINCT kd.id) AS documents_contributed,
    SUM(kd.chunk_count) AS total_chunks_contributed,
    MIN(kd.created_at) AS first_contribution,
    MAX(kd.created_at) AS last_contribution
FROM product_users pu
JOIN knowledge_documents kd ON kd.contributed_by_product_user_id = pu.id
JOIN products p ON pu.product_id = p.id
WHERE kd.source_type = 'user_suggestion'
GROUP BY pu.id, pu.display_name, pu.product_id, p.name
ORDER BY documents_contributed DESC;


-- 4. Update the approve function to include contributor info
CREATE OR REPLACE FUNCTION approve_to_knowledge_bases_v2(
    p_suggestion_id UUID,
    p_knowledge_base_ids UUID[],
    p_admin_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_suggestion RECORD;
    v_source_doc RECORD;
    v_contributor RECORD;
    v_admin_name TEXT;
    v_kb_id UUID;
    v_new_doc_id UUID;
    v_first_doc_id UUID;
    v_total_chunks INTEGER := 0;
    v_loop_chunk_count INTEGER;
    v_docs_created INTEGER := 0;
BEGIN
    -- Get suggestion details
    SELECT * INTO v_suggestion FROM knowledge_suggestions 
    WHERE id = p_suggestion_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Suggestion not found or already processed');
    END IF;

    -- Get contributor info from product_users
    IF v_suggestion.source_user_id IS NOT NULL THEN
        SELECT pu.id, au.email, COALESCE(pu.display_name, au.email) 
        INTO v_contributor 
        FROM product_users pu
        LEFT JOIN auth.users au ON pu.user_id = au.id
        WHERE pu.id = v_suggestion.source_user_id;
    END IF;


    -- Get admin name if available
    IF p_admin_id IS NOT NULL THEN
        SELECT email INTO v_admin_name FROM auth.users WHERE id = p_admin_id;
    END IF;

    -- Get source document info
    IF v_suggestion.source_document_id IS NOT NULL THEN
        SELECT * INTO v_source_doc FROM user_documents WHERE id = v_suggestion.source_document_id;
    END IF;

    -- Loop through each target Knowledge Base
    FOREACH v_kb_id IN ARRAY p_knowledge_base_ids
    LOOP
        -- Create knowledge document with contributor info
        INSERT INTO knowledge_documents (
            knowledge_base_id,
            title,
            source_type,
            source_label,
            document_type,
            status,
            created_by,
            contributed_by_product_user_id,
            contributor_name,
            contributor_email,
            approved_by_name,
            original_user_document_id
        ) VALUES (
            v_kb_id,
            COALESCE(v_source_doc.title, v_suggestion.topic || ' (From User Suggestion)'),
            'user_suggestion',
            'User Contribution',
            'text',
            'processing', 
            p_admin_id,
            v_contributor.id,
            v_contributor.full_name,
            v_contributor.email,
            v_admin_name,
            v_suggestion.source_document_id
        )
        RETURNING id INTO v_new_doc_id;

        -- Store the first one for linking
        IF v_first_doc_id IS NULL THEN
            v_first_doc_id := v_new_doc_id;
        END IF;

        -- Copy Chunks
        v_loop_chunk_count := 0;
        IF v_suggestion.source_document_id IS NOT NULL THEN
            INSERT INTO knowledge_chunks (
                document_id,
                content,
                chunk_index,
                embedding
            )
            SELECT 
                v_new_doc_id,
                content,
                COALESCE(chunk_index, 0),
                embedding
            FROM user_knowledge_chunks
            WHERE document_id = v_suggestion.source_document_id;

            GET DIAGNOSTICS v_loop_chunk_count = ROW_COUNT;
        END IF;

        -- Update doc with chunk count
        UPDATE knowledge_documents 
        SET chunk_count = v_loop_chunk_count, status = 'ready'
        WHERE id = v_new_doc_id;

        v_total_chunks := v_total_chunks + v_loop_chunk_count;
        v_docs_created := v_docs_created + 1;
    END LOOP;

    -- Update suggestion status
    UPDATE knowledge_suggestions
    SET status = 'approved',
        reviewed_by = p_admin_id,
        reviewed_at = NOW(),
        created_document_id = v_first_doc_id
    WHERE id = p_suggestion_id;

    RETURN json_build_object(
        'success', true,
        'document_ids', ARRAY[v_first_doc_id],
        'chunks_copied', v_total_chunks,
        'docs_created', v_docs_created,
        'contributor', v_contributor.full_name
    );
END;
$$;

-- 5. Update existing documents with source_label based on source_type
UPDATE knowledge_documents
SET source_label = CASE 
    WHEN source_type = 'user_suggestion' THEN 'User Contribution'
    WHEN source_type = 'upload' THEN 'Admin Upload'
    WHEN source_type = 'import' THEN 'Imported'
    ELSE 'Unknown'
END
WHERE source_label IS NULL OR source_label = 'upload';

-- 6. Grant permissions
GRANT SELECT ON knowledge_contributor_stats TO authenticated;
GRANT SELECT ON knowledge_contributor_stats TO service_role;

GRANT EXECUTE ON FUNCTION approve_to_knowledge_bases_v2 TO service_role;
GRANT EXECUTE ON FUNCTION approve_to_knowledge_bases_v2 TO authenticated;
