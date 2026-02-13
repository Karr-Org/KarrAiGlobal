import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getAdmin, withAuth } from '@/lib/auth';

// GET: List documents in a knowledge base (authenticated)
export async function GET(request: NextRequest) {
    return withAuth(async () => {
        await requireAuth();
        const supabase = getAdmin();
        const { searchParams } = new URL(request.url);
        const knowledgeBaseId = searchParams.get('knowledgeBaseId');

        if (!knowledgeBaseId) {
            return NextResponse.json(
                { error: 'knowledgeBaseId is required' },
                { status: 400 }
            );
        }

        const { data: documents, error } = await supabase
            .from('knowledge_documents')
            .select('*')
            .eq('knowledge_base_id', knowledgeBaseId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching documents:', error);
            return NextResponse.json(
                { error: 'Failed to fetch documents' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            documents: documents || [],
        });
    });
}

// DELETE: Delete a document from knowledge base (authenticated)
export async function DELETE(request: NextRequest) {
    return withAuth(async () => {
        await requireAuth();
        const supabase = getAdmin();
        const { searchParams } = new URL(request.url);
        const documentId = searchParams.get('documentId');

        if (!documentId) {
            return NextResponse.json(
                { error: 'documentId is required' },
                { status: 400 }
            );
        }

        // Fetch the document first
        const { data: document, error: fetchError } = await supabase
            .from('knowledge_documents')
            .select('id, title, knowledge_base_id')
            .eq('id', documentId)
            .single();

        if (fetchError || !document) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        // Get chunk count before deletion for logging
        const { count: chunkCount } = await supabase
            .from('knowledge_chunks')
            .select('id', { count: 'exact', head: true })
            .eq('document_id', documentId);

        // Delete the document (chunks will cascade automatically)
        const { error: deleteError } = await supabase
            .from('knowledge_documents')
            .delete()
            .eq('id', documentId);

        if (deleteError) {
            console.error('Error deleting document:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete document: ' + deleteError.message },
                { status: 500 }
            );
        }

        // Log the deletion
        await supabase.from('audit_logs').insert({
            event_type: 'document_deleted',
            event_category: 'knowledge',
            event_data: {
                document_id: documentId,
                document_title: document.title,
                knowledge_base_id: document.knowledge_base_id,
                chunks_deleted: chunkCount || 0,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Document deleted successfully',
            chunksDeleted: chunkCount || 0,
        });
    });
}
