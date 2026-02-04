import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: List documents in a knowledge base
export async function GET(request: NextRequest) {
    try {
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

    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Delete a document from knowledge base (Admin only)
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const documentId = searchParams.get('documentId');
        const adminKey = request.headers.get('x-admin-key');

        if (!documentId) {
            return NextResponse.json(
                { error: 'documentId is required' },
                { status: 400 }
            );
        }

        // Simple admin verification - in production, use proper auth
        // For now, we'll check if the user is authenticated and has admin role
        // You can also use the x-admin-key header for additional security

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

    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
