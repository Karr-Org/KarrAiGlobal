-- Update approve_knowledge_suggestion to support adding content to MULTIPLE knowledge bases at once.

-- Drop old function signature (single UUID)
DROP FUNCTION IF EXISTS approve_knowledge_suggestion(UUID, UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION approve_knowledge_suggestion(
    p_suggestion_id UUID,
    p_admin_id UUID,
    p_knowledge_base_ids UUID[], -- Now accepts an array of KB IDs
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_suggestion RECORD;
    v_source_doc RECORD;
    v_new_doc_id UUID;
    v_first_doc_id UUID := NULL;
    v_chunk_count INTEGER := 0;
    v_kb_id UUID;
    v_loop_chunk_count INTEGER;
    v_total_chunks_copied INTEGER := 0;
BEGIN
    -- Get suggestion
    SELECT * INTO v_suggestion
    FROM knowledge_suggestions
    WHERE id = p_suggestion_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Suggestion not found or already processed');
    END IF;

    -- Get source document info
    IF v_suggestion.source_document_id IS NOT NULL THEN
        SELECT * INTO v_source_doc FROM user_documents WHERE id = v_suggestion.source_document_id;
    END IF;

    -- Loop through each target Knowledge Base
    FOREACH v_kb_id IN ARRAY p_knowledge_base_ids
    LOOP
        -- Create knowledge document 
        INSERT INTO knowledge_documents (
            knowledge_base_id,
            title,
            source_type,
            document_type,
            status,
            created_by
        ) VALUES (
            v_kb_id,
            COALESCE(v_source_doc.title, v_suggestion.topic || ' (From User Suggestion)'),
            'user_suggestion',
            'text',
            'processing', 
            p_admin_id
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
            v_total_chunks_copied := v_total_chunks_copied + v_loop_chunk_count;
        END IF;

        -- Update document status
        UPDATE knowledge_documents
        SET status = CASE WHEN v_loop_chunk_count > 0 THEN 'ready' ELSE 'pending' END,
            chunk_count = v_loop_chunk_count,
            updated_at = NOW()
        WHERE id = v_new_doc_id;

        -- Update KB stats
        PERFORM increment_document_count(v_kb_id);
        IF v_loop_chunk_count > 0 THEN
            PERFORM increment_chunk_count(v_kb_id, v_loop_chunk_count);
        END IF;
    END LOOP;

    -- Update suggestion (Link to the first document created)
    UPDATE knowledge_suggestions
    SET status = 'approved',
        reviewed_by = p_admin_id,
        reviewed_at = NOW(),
        admin_notes = p_admin_notes,
        created_document_id = v_first_doc_id,
        updated_at = NOW()
    WHERE id = p_suggestion_id;

    RETURN json_build_object(
        'success', true,
        'first_document_id', v_first_doc_id,
        'kbs_updated', array_length(p_knowledge_base_ids, 1),
        'total_chunks_copied', v_total_chunks_copied,
        'message', 'Suggestion approved and added to selected knowledge bases.'
    );
END;
$$;
