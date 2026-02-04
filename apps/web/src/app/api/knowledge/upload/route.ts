import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY!;
const MAX_CHUNK_TOKENS = 150; // Optimal for Gemini embeddings per best practices

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';

        let title: string;
        let content: string;
        let documentType: string;
        let authorityLevel: number;
        let knowledgeBaseId: string;

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file') as File;
            knowledgeBaseId = formData.get('knowledgeBaseId') as string;
            // distinct from KB, we might want to tag it? No, keep simple.

            documentType = formData.get('documentType') as string || 'other';
            authorityLevel = parseInt(formData.get('authorityLevel') as string) || 5;

            if (!file) {
                return NextResponse.json({ error: 'No file provided' }, { status: 400 });
            }

            if (!knowledgeBaseId) {
                return NextResponse.json({ error: 'Knowledge Base ID is required' }, { status: 400 });
            }

            title = file.name.replace(/\.[^/.]+$/, '');

            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                content = await extractPDFContent(file);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
                content = await extractDOCXContent(file);
            } else {
                content = await file.text();
            }

            if (!content || content.trim().length < 50) {
                return NextResponse.json({
                    error: 'Could not extract text from file. Please try a different file or paste the content manually.'
                }, { status: 400 });
            }

        } else {
            const body = await request.json();
            title = body.title;
            content = body.content;
            knowledgeBaseId = body.knowledgeBaseId;
            documentType = body.documentType || 'other';
            authorityLevel = body.authorityLevel || 5;

            if (!title || !content) {
                return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
            }

            if (!knowledgeBaseId) {
                return NextResponse.json({ error: 'Knowledge Base ID is required' }, { status: 400 });
            }
        }

        // Verify KB exists
        const { data: kb, error: kbError } = await supabase
            .from('knowledge_bases')
            .select('id')
            .eq('id', knowledgeBaseId)
            .single();

        if (kbError || !kb) {
            return NextResponse.json({ error: 'Knowledge Base not found' }, { status: 404 });
        }

        // ===== DIRECT INGESTION (No Edge Function) =====

        // 1. Create document record
        const { data: document, error: docError } = await supabase
            .from('knowledge_documents')
            .insert({
                knowledge_base_id: knowledgeBaseId,
                title: title,
                source_type: 'upload',
                document_type: documentType,
                authority_level: authorityLevel,
                status: 'processing',
            })
            .select()
            .single();

        if (docError) {
            console.error('Failed to create document:', docError);
            return NextResponse.json({ error: 'Failed to create document: ' + docError.message }, { status: 500 });
        }

        // 2. Chunk the content
        const chunks = chunkText(content, MAX_CHUNK_TOKENS);
        console.log(`Created ${chunks.length} chunks for document ${document.id}`);

        // 3. Generate embeddings
        let embeddings: number[][];
        try {
            embeddings = await generateEmbeddings(chunks.map(c => c.content));
        } catch (embeddingError: any) {
            // Rollback document creation
            await supabase.from('knowledge_documents').delete().eq('id', document.id);
            return NextResponse.json({ error: 'Failed to generate embeddings: ' + embeddingError.message }, { status: 500 });
        }

        // 4. Insert chunks with embeddings
        const chunkInserts = chunks.map((chunk, i) => ({
            document_id: document.id,
            // product_id removed as it's linked via document -> KB -> Product (or Product -> KB)
            content: chunk.content,
            chunk_index: i,
            embedding: JSON.stringify(embeddings[i]), // Format as string for Supabase
            section_hierarchy: chunk.hierarchy,
        }));

        const { error: chunkError } = await supabase
            .from('knowledge_chunks')
            .insert(chunkInserts);

        if (chunkError) {
            console.error('Failed to insert chunks:', chunkError);
            await supabase.from('knowledge_documents').delete().eq('id', document.id);
            return NextResponse.json({ error: 'Failed to insert chunks: ' + chunkError.message }, { status: 500 });
        }

        // 5. Update document status
        await supabase
            .from('knowledge_documents')
            .update({ status: 'completed', chunk_count: chunks.length })
            .eq('id', document.id);

        // 6. Audit log
        await supabase.from('audit_logs').insert({
            // product_id: null, // No specific product for this KB upload
            event_type: 'document_ingested',
            event_category: 'knowledge',
            event_data: {
                knowledge_base_id: knowledgeBaseId,
                document_id: document.id,
                title: title,
                chunks_count: chunks.length,
            },
        });

        return NextResponse.json({
            success: true,
            documentId: document.id,
            chunkCount: chunks.length,
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}

// ===== PDF EXTRACTION =====

async function extractPDFContent(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    let extractedText = '';
    try {
        const { extractText } = await import('unpdf');
        const result = await extractText(buffer);
        extractedText = Array.isArray(result.text)
            ? result.text.join('\n\n')
            : String(result.text || '');
    } catch (e) {
        console.log('Direct extraction failed');
    }

    const cleanText = extractedText.replace(/\s+/g, ' ').trim();
    if (cleanText.length > 100) {
        return extractedText;
    }

    // Only enhance if text is very short (likely scanned image or bad extraction)
    if (cleanText.length > 20 && cleanText.length < 500) {
        try {
            return await enhanceWithAI(cleanText, file.name);
        } catch (e) {
            return extractedText;
        }
    }

    // For longer text, return as is (faster)
    return extractedText;
}

async function extractDOCXContent(file: File): Promise<string> {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

async function enhanceWithAI(rawText: string, filename: string): Promise<string> {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: `Clean up and structure this extracted PDF text from "${filename}". Preserve all information:\n\n${rawText.substring(0, 30000)}` }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 8000,
                },
            }),
        }
    );

    if (!response.ok) throw new Error('AI enhancement failed');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || rawText;
}

// ===== CHUNKING =====

interface Chunk {
    content: string;
    hierarchy: string[];
}

function chunkText(text: string, maxTokens: number): Chunk[] {
    const chunks: Chunk[] = [];
    const paragraphs = text.split(/\n\n+/);

    let currentChunk = '';
    let currentHierarchy: string[] = [];

    for (const para of paragraphs) {
        if (!para.trim()) continue;

        const headerMatch = para.match(/^(#+)\s+(.+)/);
        if (headerMatch) {
            currentHierarchy = [headerMatch[2]];
        }

        const paraTokens = Math.ceil(para.length / 4);
        const currentTokens = Math.ceil(currentChunk.length / 4);

        if (currentTokens + paraTokens > maxTokens && currentChunk) {
            chunks.push({ content: currentChunk.trim(), hierarchy: [...currentHierarchy] });
            currentChunk = para;
        } else {
            currentChunk += '\n\n' + para;
        }
    }

    if (currentChunk.trim()) {
        chunks.push({ content: currentChunk.trim(), hierarchy: currentHierarchy });
    }

    if (chunks.length === 0) {
        chunks.push({ content: text.substring(0, 8000), hierarchy: [] });
    }

    return chunks;
}

// ===== GEMINI EMBEDDINGS (BATCHED) =====

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const BATCH_SIZE = 100; // Gemini limit is typically 100 for batchEmbedContents
    const allEmbeddings: number[][] = new Array(texts.length); // Pre-allocate
    const maxRetries = 3;

    // Split into batches
    const batches = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        batches.push({
            indices: Array.from({ length: Math.min(BATCH_SIZE, texts.length - i) }, (_, k) => i + k),
            texts: texts.slice(i, i + BATCH_SIZE)
        });
    }

    console.log(`Generating embeddings for ${texts.length} chunks in ${batches.length} batches...`);

    for (let b = 0; b < batches.length; b++) {
        const batch = batches[b];

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
                }

                // Construct requests array for batch API with best practices
                const requests = batch.texts.map(text => ({
                    model: 'models/text-embedding-004',
                    content: { parts: [{ text }] },
                    taskType: 'RETRIEVAL_DOCUMENT', // Optimized for document storage/retrieval
                    outputDimensionality: 768      // Match our DB schema (VECTOR(768))
                }));

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${GEMINI_API_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ requests }),
                    }
                );

                if (response.status === 429) {
                    console.log('Rate limited, waiting 5s...');
                    await new Promise(r => setTimeout(r, 5000));
                    continue;
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Gemini Batch API error: ${response.status} - ${errorText}`);
                }

                const data = await response.json();

                // data.embeddings is array of { values: number[] }
                if (data.embeddings && Array.isArray(data.embeddings)) {
                    data.embeddings.forEach((emb: any, idx: number) => {
                        const globalIndex = batch.indices[idx];
                        allEmbeddings[globalIndex] = emb.values;
                    });
                } else {
                    throw new Error('Invalid response format from Gemini Batch API');
                }

                break; // Success of this batch

            } catch (err: any) {
                console.error(`Batch ${b + 1} attempt ${attempt + 1} failed:`, err.message);
                if (attempt === maxRetries - 1) throw err;
            }
        }
    }

    return allEmbeddings;
}
