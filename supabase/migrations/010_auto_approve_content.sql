-- Enhance approve_knowledge_suggestion to automatically copy content chunks
-- from the user document to the product knowledge base.

DROP FUNCTION IF EXISTS approve_knowledge_suggestion(UUID, UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION approve_knowledge_suggestion(
    p_suggestion_id UUID,
    p_admin_id UUID,
    p_knowledge_base_id UUID,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_suggestion RECORD;
    v_source_doc RECORD;
    v_new_doc_id UUID;
    v_chunk_count INTEGER := 0;
BEGIN
    -- Get suggestion
    SELECT * INTO v_suggestion
    FROM knowledge_suggestions
    WHERE id = p_suggestion_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Suggestion not found or already processed');
    END IF;

    -- Get source document info if available (to get better title)
    IF v_suggestion.source_document_id IS NOT NULL THEN
        SELECT * INTO v_source_doc FROM user_documents WHERE id = v_suggestion.source_document_id;
    END IF;

    -- Create knowledge document 
    INSERT INTO knowledge_documents (
        knowledge_base_id,
        title,
        source_type,
        document_type,
        status,
        created_by
    ) VALUES (
        p_knowledge_base_id,
        COALESCE(v_source_doc.title, v_suggestion.topic || ' (From User Suggestion)'),
        'user_suggestion',
        'text',
        'processing', -- Start as processing, update to ready after chunks
        p_admin_id
    )
    RETURNING id INTO v_new_doc_id;

    -- Copy Chunks if source document exists
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
            COALESCE(chunk_index, 0), -- Ensure not null
            embedding
        FROM user_knowledge_chunks
        WHERE document_id = v_suggestion.source_document_id;
        
        GET DIAGNOSTICS v_chunk_count = ROW_COUNT;
    END IF;

    -- Update document status
    UPDATE knowledge_documents
    SET status = CASE WHEN v_chunk_count > 0 THEN 'ready' ELSE 'pending' END,
        chunk_count = v_chunk_count,
        updated_at = NOW()
    WHERE id = v_new_doc_id;

    -- Update suggestion
    UPDATE knowledge_suggestions
    SET status = 'approved',
        reviewed_by = p_admin_id,
        reviewed_at = NOW(),
        admin_notes = p_admin_notes,
        created_document_id = v_new_doc_id,
        updated_at = NOW()
    WHERE id = p_suggestion_id;

    -- Update KB stats
    PERFORM increment_document_count(p_knowledge_base_id);
    IF v_chunk_count > 0 THEN
        PERFORM increment_chunk_count(p_knowledge_base_id, v_chunk_count);
    END IF;

    RETURN json_build_object(
        'success', true,
        'document_id', v_new_doc_id,
        'chunks_copied', v_chunk_count,
        'message', 'Suggestion approved. Document created with ' || v_chunk_count || ' chunks.'
    );
END;
$$;
