import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processAndUploadDocument } from '@/lib/knowledge/document-processor';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const productUserId = formData.get('productUserId') as string;

        if (!file || !productUserId) {
            return NextResponse.json(
                { error: 'file and productUserId are required' },
                { status: 400 }
            );
        }

        // Get user's knowledge base
        let { data: userKb, error: kbError } = await supabase
            .from('user_knowledge_bases')
            .select('id')
            .eq('product_user_id', productUserId)
            .single();

        // If KB doesn't exist, create it (fallback)
        if (!userKb || kbError) {
            console.log('Creating missing user knowledge base for:', productUserId);
            const { data: newKb, error: createError } = await supabase
                .from('user_knowledge_bases')
                .insert({
                    product_user_id: productUserId,
                    name: 'My Documents',
                    description: 'Your personal knowledge base',
                })
                .select()
                .single();

            if (createError) {
                console.error('Failed to create KB:', createError);
                return NextResponse.json(
                    { error: `Knowledge base error: ${createError.message}` },
                    { status: 500 }
                );
            }
            userKb = newKb;
        }

        if (!userKb) {
            return NextResponse.json(
                { error: 'Could not access or create knowledge base' },
                { status: 500 }
            );
        }

        // Use unified processor
        const result = await processAndUploadDocument({
            file,
            targetType: 'user',
            targetId: userKb.id,
            metadata: { productUserId }
        });

        // Update KB stats manually
        try {
            await supabase.rpc('increment_document_count', { kb_id: userKb.id });
            await supabase.rpc('increment_chunk_count', { kb_id: userKb.id, count: result.chunksCreated });
        } catch {
            // RPCs may not exist yet
        }

        // ============================================
        // KNOWLEDGE GAP INTELLIGENCE v2.0
        // 1. Intelligent Rejection (Is this relevant?)
        // 2. Gap Detection (Is this new?)
        // ============================================
        let gapDetected = false;
        let gapReason = '';
        let gapDebug: Record<string, any> = {};

        console.log('=== GAP DETECTION STARTING ===');
        console.log('[Gap Detection] Document processed:', {
            docId: result.docId,
            chunks: result.chunksCreated,
            hasFirstEmbedding: !!result.firstChunkEmbedding,
            embeddingLength: result.firstChunkEmbedding?.length,
            contentSampleLength: result.contentSample?.length
        });

        try {
            // Get product info for relevance check
            const { data: productUserData, error: puError } = await supabase
                .from('product_users')
                .select('product_id, products(name, description)')
                .eq('id', productUserId)
                .single();

            console.log('[Gap Detection] Product user query result:', {
                success: !puError,
                productId: productUserData?.product_id,
                productName: (productUserData?.products as any)?.name,
                error: puError?.message
            });

            if (puError) {
                console.error('Failed to fetch product user:', puError);
                gapReason = 'Error: Could not fetch product info';
            }

            const product = productUserData?.products as any;
            const productId = productUserData?.product_id;

            gapDebug = {
                productId,
                productName: product?.name,
                hasEmbedding: !!result.firstChunkEmbedding,
                embeddingLength: result.firstChunkEmbedding?.length || 0,
                contentSampleLength: result.contentSample?.length || 0,
            };

            console.log('[Gap Detection] Debug info:', gapDebug);

            if (!productId) {
                gapReason = 'Skipped: No product_id found for user';
            } else if (!product?.name) {
                gapReason = 'Skipped: Product has no name';
            } else if (!result.firstChunkEmbedding || result.firstChunkEmbedding.length === 0) {
                gapReason = 'Skipped: No embedding generated for document';
            } else if (!result.contentSample || result.contentSample.length < 50) {
                gapReason = 'Skipped: Content sample too short';
            } else {
                // A. INTELLIGENT RELEVANCE CHECK
                let isRelevant = true; // Default to true, AI can reject
                let aiJson: any = { relevant: true };

                try {
                    const relevancePrompt = `Analyze if this document is relevant for a product knowledge base.
                    
                    PRODUCT: ${product.name}
                    DESCRIPTION: ${product.description || 'No description'}
                    
                    DOCUMENT SAMPLE:
                    ${result.contentSample.slice(0, 1000)}
                    
                    Task: Return JSON indicating if this content is relevant to the product's domain and widely useful.
                    Reject specific personal records (medical reports, bank statements, personal emails) unless they contain general knowledge.
                    Accept educational content, guides, regulations, or domain-specific documents.
                    
                    Format: { "relevant": true/false, "reason": "brief explanation" }`;

                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ contents: [{ parts: [{ text: relevancePrompt }] }] })
                        }
                    );

                    const aiData = await response.json();
                    const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (aiText) {
                        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            aiJson = JSON.parse(jsonMatch[0]);
                        }
                    }

                    isRelevant = aiJson.relevant !== false; // Only reject if explicitly false

                    if (!isRelevant) {
                        gapReason = `Rejected by AI: ${aiJson.reason || 'Content not relevant to ' + product.name}`;
                        console.log('[Gap Detection] AI rejected:', gapReason);
                    } else {
                        console.log('[Gap Detection] AI approved document as relevant');
                    }
                } catch (relevanceError) {
                    console.error('[Gap Detection] Relevance check failed, proceeding with gap detection:', relevanceError);
                    isRelevant = true; // Fail open - if AI check fails, still do gap detection
                }

                // B. GAP DETECTION (Only if relevant)
                if (isRelevant) {
                    console.log('[Gap Detection] Calling detect_knowledge_gap RPC...');

                    // Format embedding as string for Supabase RPC (pgvector expects specific format)
                    const embeddingString = `[${result.firstChunkEmbedding.join(',')}]`;

                    const { data: gapResult, error: gapError } = await supabase.rpc('detect_knowledge_gap', {
                        p_product_id: productId,
                        p_document_title: file.name,
                        p_content_sample: result.contentSample || '',
                        p_content_embedding: embeddingString,
                        p_source_document_id: result.docId,
                        p_source_user_id: productUserId,
                    });

                    console.log('[Gap Detection] RPC result:', gapResult, 'Error:', gapError);

                    if (gapError) {
                        console.error('[Gap Detection] RPC error:', gapError);
                        gapReason = `Error in gap detection: ${gapError.message}`;
                    } else if (gapResult?.gap_detected) {
                        gapDetected = true;
                        const kbChunks = gapResult.kb_chunks || 'unknown';
                        const similarity = gapResult.similarity ? (gapResult.similarity * 100).toFixed(1) : '0';
                        gapReason = `✨ Unique content! (Similarity: ${similarity}%, KB has ${kbChunks} chunks)`;
                        console.log('[Gap Detection] SUCCESS - Gap detected:', gapResult);
                    } else {
                        const sim = gapResult?.similarity ? (gapResult.similarity * 100).toFixed(1) : 'N/A';
                        const kbChunks = gapResult?.kb_chunks || 'unknown';
                        gapReason = `Similar content exists (Similarity: ${sim}%, KB has ${kbChunks} chunks)`;
                        console.log('[Gap Detection] No gap - content similar:', gapResult);
                    }
                }
            }
        } catch (gapError: any) {
            console.error('[Gap Detection] Unexpected error:', gapError);
            gapReason = `Error: ${gapError.message}`;
        }

        const successMessage = gapDetected
            ? '✨ Knowledge Gap Detected! Suggestion sent to Admin.'
            : `Document processed. (${gapReason || 'No gap detected'})`;

        return NextResponse.json({
            success: true,
            id: result.docId,
            chunksCreated: result.chunksCreated,
            gapDetected,
            gapReason,
            message: successMessage,
            // Include debug info in development
            ...(process.env.NODE_ENV === 'development' && { debug: gapDebug }),
        });

    } catch (error: any) {
        console.error('User document upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET: List user's documents
export async function GET(request: NextRequest) {
    try {
        const productUserId = request.nextUrl.searchParams.get('productUserId');

        if (!productUserId) {
            return NextResponse.json(
                { error: 'productUserId is required' },
                { status: 400 }
            );
        }

        const { data: userKb } = await supabase
            .from('user_knowledge_bases')
            .select('id')
            .eq('product_user_id', productUserId)
            .single();

        if (!userKb) {
            return NextResponse.json({ documents: [] });
        }

        const { data: documents, error } = await supabase
            .from('user_documents')
            .select('*')
            .eq('user_knowledge_base_id', userKb.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching documents:', error);
            return NextResponse.json(
                { error: 'Failed to fetch documents' },
                { status: 500 }
            );
        }

        return NextResponse.json({ documents: documents || [] });

    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Remove a user document
export async function DELETE(request: NextRequest) {
    try {
        const documentId = request.nextUrl.searchParams.get('documentId');
        const productUserId = request.nextUrl.searchParams.get('productUserId');

        if (!documentId || !productUserId) {
            return NextResponse.json(
                { error: 'documentId and productUserId are required' },
                { status: 400 }
            );
        }

        // Fetch document details first (for storage cleanup and logging)
        const { data: document } = await supabase
            .from('user_documents')
            .select('id, title, file_path, user_knowledge_base_id')
            .eq('id', documentId)
            .single();

        if (!document) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        // Verify ownership through product_user chunks
        const { data: chunks, count: chunkCount } = await supabase
            .from('user_knowledge_chunks')
            .select('id', { count: 'exact' })
            .eq('document_id', documentId)  // Fixed: was 'user_document_id'
            .eq('product_user_id', productUserId);

        if (!chunks || chunks.length === 0) {
            return NextResponse.json(
                { error: 'Access denied - document does not belong to this user' },
                { status: 403 }
            );
        }

        // Try to delete file from Supabase Storage if it exists
        if (document.file_path) {
            try {
                const storagePath = `${productUserId}/${document.file_path}`;
                await supabase.storage
                    .from('user-documents')
                    .remove([storagePath]);
                console.log(`Storage file deleted: ${storagePath}`);
            } catch (storageError) {
                console.log('Storage cleanup skipped:', storageError);
            }
        }

        // Delete the document (chunks will cascade automatically)
        const { error: deleteError } = await supabase
            .from('user_documents')
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
        try {
            await supabase.from('audit_logs').insert({
                event_type: 'user_document_deleted',
                event_category: 'user_knowledge',
                event_data: {
                    document_id: documentId,
                    document_title: document.title,
                    product_user_id: productUserId,
                    chunks_deleted: chunkCount || 0,
                },
            });
        } catch {
            console.log('Audit log skipped');
        }

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
