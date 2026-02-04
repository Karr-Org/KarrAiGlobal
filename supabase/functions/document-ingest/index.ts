// Follow Deno Edge Function format for Supabase
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface IngestRequest {
    productId: string;
    title: string;
    content: string;
    documentType?: string;
    authorityLevel?: number;
    metadata?: Record<string, unknown>;
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_CHUNK_TOKENS = 500;
const OVERLAP_TOKENS = 50;

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Create admin Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        );

        // Parse request
        const data: IngestRequest = await req.json();

        if (!data.productId || !data.title || !data.content) {
            return new Response(
                JSON.stringify({ error: 'productId, title, and content are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`Ingesting document: ${data.title} for product: ${data.productId}`);

        // 1. Insert document record
        const { data: document, error: docError } = await supabaseClient
            .from('knowledge_documents')
            .insert({
                product_id: data.productId,
                title: data.title,
                source_type: 'upload',
                document_type: data.documentType ?? 'other',
                authority_level: data.authorityLevel ?? 5,
                metadata: data.metadata ?? {},
                status: 'processing',
            })
            .select()
            .single();

        if (docError) {
            console.error('Failed to create document:', docError);
            throw new Error(`Failed to create document: ${docError.message}`);
        }

        console.log(`Document created with ID: ${document.id}`);

        // 2. Chunk the content
        const chunks = chunkText(data.content, MAX_CHUNK_TOKENS, OVERLAP_TOKENS);
        console.log(`Created ${chunks.length} chunks`);

        // 3. Generate embeddings for all chunks
        const openaiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiKey) {
            throw new Error('OPENAI_API_KEY not configured');
        }

        const embeddings = await generateEmbeddings(chunks, openaiKey);
        console.log(`Generated ${embeddings.length} embeddings`);

        // 4. Insert chunks with embeddings
        const chunkInserts = chunks.map((chunk, i) => ({
            document_id: document.id,
            product_id: data.productId,
            content: chunk.content,
            chunk_index: i,
            embedding: embeddings[i],
            section_hierarchy: chunk.hierarchy,
        }));

        const { error: chunkError } = await supabaseClient
            .from('knowledge_chunks')
            .insert(chunkInserts);

        if (chunkError) {
            console.error('Failed to insert chunks:', chunkError);
            // Rollback document
            await supabaseClient.from('knowledge_documents').delete().eq('id', document.id);
            throw new Error(`Failed to insert chunks: ${chunkError.message}`);
        }

        // 5. Update document status
        await supabaseClient
            .from('knowledge_documents')
            .update({
                status: 'completed',
                chunk_count: chunks.length,
            })
            .eq('id', document.id);

        // 6. Audit log
        await supabaseClient.from('audit_logs').insert({
            product_id: data.productId,
            event_type: 'document_ingested',
            event_category: 'knowledge',
            event_data: {
                document_id: document.id,
                title: data.title,
                chunks_count: chunks.length,
                document_type: data.documentType,
            },
        });

        console.log(`Successfully ingested document: ${document.id}`);

        return new Response(
            JSON.stringify({
                success: true,
                documentId: document.id,
                chunkCount: chunks.length,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Document ingest error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to ingest document', details: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

interface Chunk {
    content: string;
    tokenCount: number;
    hierarchy: string[];
}

function chunkText(text: string, maxTokens: number, overlapTokens: number): Chunk[] {
    const chunks: Chunk[] = [];

    // Split by paragraphs
    const paragraphs = text.split(/\n\n+/);

    let currentChunk = '';
    let currentHierarchy: string[] = [];

    for (const para of paragraphs) {
        if (!para.trim()) continue;

        // Check for headers
        const headerMatch = para.match(/^(#+)\s+(.+)/);
        if (headerMatch) {
            const level = headerMatch[1].length;
            currentHierarchy = [...currentHierarchy.slice(0, level - 1), headerMatch[2]];
        }

        const paraTokens = countTokens(para);
        const currentTokens = countTokens(currentChunk);

        if (currentTokens + paraTokens > maxTokens && currentChunk) {
            chunks.push({
                content: currentChunk.trim(),
                tokenCount: currentTokens,
                hierarchy: [...currentHierarchy],
            });

            // Overlap: keep last sentence
            const sentences = currentChunk.split(/[.!?]+\s+/);
            const overlapSentences = sentences.slice(-2);
            currentChunk = overlapSentences.join('. ') + ' ' + para;
        } else {
            currentChunk += '\n\n' + para;
        }
    }

    // Final chunk
    if (currentChunk.trim()) {
        chunks.push({
            content: currentChunk.trim(),
            tokenCount: countTokens(currentChunk),
            hierarchy: currentHierarchy,
        });
    }

    // If no chunks, create one from entire text
    if (chunks.length === 0) {
        chunks.push({
            content: text.substring(0, 8000), // Limit to ~2000 tokens
            tokenCount: countTokens(text),
            hierarchy: [],
        });
    }

    return chunks;
}

function countTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

async function generateEmbeddings(chunks: Chunk[], apiKey: string): Promise<number[][]> {
    const texts = chunks.map(c => c.content);
    const batchSize = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);

        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: batch,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI error:', errorText);
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.data || !Array.isArray(data.data)) {
            throw new Error('Invalid response from OpenAI');
        }

        const embeddings = data.data.map((d: { embedding: number[] }) => d.embedding);
        allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
}
