import { NextRequest, NextResponse } from 'next/server';
import { requireCreator, getAdmin } from '@/lib/auth';

/**
 * GET /api/admin/document-content
 * Fetches the full content of a document by combining all its chunks.
 * Supports both user documents and knowledge base documents.
 * 
 * Query params:
 * - documentId: UUID of the document
 * - type: 'user' (default) or 'knowledge'
 */
export async function GET(request: NextRequest) {
    try {
        await requireCreator();
        const supabase = getAdmin();

        const { searchParams } = new URL(request.url);
        const documentId = searchParams.get('documentId');
        const type = searchParams.get('type') || 'user';

        if (!documentId) {
            return NextResponse.json({ success: false, error: 'documentId is required' }, { status: 400 });
        }
        if (type === 'knowledge') {
            // Handle Knowledge Base documents
            const { data: doc, error: docError } = await supabase
                .from('knowledge_documents')
                .select('id, title, status')
                .eq('id', documentId)
                .single();

            if (docError || !doc) {
                return NextResponse.json({
                    success: false,
                    error: 'Knowledge document not found',
                    details: docError?.message
                }, { status: 404 });
            }

            // Get all chunks for this knowledge document
            const { data: chunks, error: chunksError } = await supabase
                .from('knowledge_chunks')
                .select('content, chunk_index')
                .eq('document_id', documentId)
                .order('chunk_index', { ascending: true });

            if (chunksError) {
                console.error('Error fetching knowledge chunks:', chunksError);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to fetch document chunks',
                    details: chunksError.message
                }, { status: 500 });
            }

            if (!chunks || chunks.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'No content chunks found for this knowledge document'
                }, { status: 404 });
            }

            // Combine all chunks into full document content
            const fullContent = chunks
                .sort((a, b) => (a.chunk_index || 0) - (b.chunk_index || 0))
                .map(c => c.content)
                .join('\n\n');

            return NextResponse.json({
                success: true,
                documentId,
                title: doc.title,
                chunkCount: chunks.length,
                content: fullContent,
                contentLength: fullContent.length
            });

        } else {
            // Handle User documents (default)
            const { data: doc, error: docError } = await supabase
                .from('user_documents')
                .select('id, title, status')
                .eq('id', documentId)
                .single();

            if (docError || !doc) {
                return NextResponse.json({
                    success: false,
                    error: 'Document not found',
                    details: docError?.message
                }, { status: 404 });
            }

            // Get all chunks for this document, ordered by chunk_index
            const { data: chunks, error: chunksError } = await supabase
                .from('user_knowledge_chunks')
                .select('content, chunk_index')
                .eq('document_id', documentId)
                .order('chunk_index', { ascending: true });

            if (chunksError) {
                console.error('Error fetching user chunks:', chunksError);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to fetch document chunks',
                    details: chunksError.message
                }, { status: 500 });
            }

            if (!chunks || chunks.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'No content chunks found for this document'
                }, { status: 404 });
            }

            // Combine all chunks into full document content
            const fullContent = chunks
                .sort((a, b) => (a.chunk_index || 0) - (b.chunk_index || 0))
                .map(c => c.content)
                .join('\n\n');

            return NextResponse.json({
                success: true,
                documentId,
                title: doc.title,
                chunkCount: chunks.length,
                content: fullContent,
                contentLength: fullContent.length
            });
        }

    } catch (error: any) {
        console.error('Document content fetch error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
