import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { federatedSearch, buildContextFromResults, RichCitation } from '@/lib/knowledge/federated-search';
import { evaluateWithCRAG, generateIDontKnow, CRAGResult } from '@/lib/knowledge/crag-evaluator';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY!;

export async function POST(request: NextRequest) {
    try {
        const { query, productId, conversationId, userId } = await request.json();

        if (!query || !productId) {
            return NextResponse.json({ error: 'Query and productId are required' }, { status: 400 });
        }

        console.log(`[Chat] Processing query for product ${productId}: ${query.substring(0, 100)}...`);

        // 1. Generate embedding for the query using Gemini
        const queryEmbedding = await generateGeminiEmbedding(query);

        // 2. FEDERATED SEARCH: Search across ALL knowledge sources
        //    This includes: Internal Documents, External APIs, Trusted Web
        let searchResults;
        let citations: RichCitation[] = [];
        let context = '';
        let usedFederatedSearch = false;

        try {
            const federated = await federatedSearch(productId, query, queryEmbedding, userId);
            searchResults = federated.results;
            citations = federated.citations;
            context = buildContextFromResults(searchResults);
            usedFederatedSearch = true;
            console.log(`[Chat] Federated search returned ${searchResults.length} results from ${citations.length} sources`);
        } catch (federatedError) {
            console.log('[Chat] Federated search failed, falling back to direct search:', federatedError);
            // Fallback to existing logic
            const fallbackResult = await fallbackSearch(productId, queryEmbedding, query, userId);
            searchResults = fallbackResult.results;
            context = fallbackResult.context;
        }

        // 3. CRAG EVALUATION: Score and correct results
        let cragResult: CRAGResult | null = null;
        let usedCRAG = false;

        try {
            cragResult = await evaluateWithCRAG(
                searchResults,
                query,
                productId,
                {
                    enableWebFallback: true,
                    maxSupplementalResults: 3,
                }
            );
            usedCRAG = true;

            // Use evaluated results if CRAG succeeded
            if (cragResult.evaluatedResults.length > 0) {
                const usableResults = cragResult.evaluatedResults.filter(r => r.isUsable);
                if (usableResults.length > 0) {
                    searchResults = usableResults;
                    context = buildContextFromResults(usableResults);
                }
            }

            console.log(`[Chat] CRAG verdict: ${cragResult.verdict}, confidence: ${(cragResult.confidence * 100).toFixed(1)}%`);
        } catch (cragError) {
            console.log('[Chat] CRAG evaluation failed, using raw results:', cragError);
        }

        // 4. Build sources for backward compatibility
        const sources = searchResults.slice(0, 5).map((r: any) => ({
            title: r.title || 'Document',
            excerpt: r.excerpt || r.content?.substring(0, 200) + '...',
            type: r.sourceType || 'internal_documents',
            icon: r.sourceIcon || '📚',
            url: r.url,
            trustLevel: r.trustLevel || 100,
            cragScore: r.cragScore?.finalScore,
        }));

        // 5. Generate response with CRAG-informed confidence
        let answer: string;
        let confidence: number;

        if (cragResult?.verdict === 'IRRELEVANT' || cragResult?.verdict === 'NO_RESULTS') {
            // Graceful "I don't know" response
            const idk = generateIDontKnow(query, cragResult);
            answer = await generateGeminiResponse(
                query,
                context,
                usedFederatedSearch,
                `IMPORTANT: The knowledge base doesn't have high-confidence information for this query. 
                 ${idk.message} Suggest: ${idk.suggestions.join(', ')}.
                 If you have ANY relevant partial information, share it with appropriate caveats.`
            );
            confidence = cragResult.confidence;
        } else {
            answer = await generateGeminiResponse(query, context, usedFederatedSearch);
            // Use CRAG confidence if available, otherwise calculate
            confidence = cragResult?.confidence || 0.3;
            if (!cragResult && searchResults && searchResults.length > 0) {
                const avgTrust = searchResults.reduce((sum: number, r: any) => sum + (r.trustLevel || 80), 0) / searchResults.length;
                confidence = Math.min(0.95, 0.4 + (searchResults.length * 0.03) + (avgTrust / 200));
            }
        }

        // 6. Log the interaction with CRAG data
        await supabase.from('audit_logs').insert({
            user_id: userId,
            product_id: productId,
            event_type: 'query',
            event_category: 'chat',
            event_data: {
                query: query.substring(0, 500),
                sources_used: searchResults?.length || 0,
                source_types: [...new Set(searchResults?.map((r: any) => r.sourceType) || [])],
                federated_search: usedFederatedSearch,
                crag_verdict: cragResult?.verdict,
                crag_confidence: cragResult?.confidence,
                crag_correction: cragResult?.correctionApplied,
                confidence,
            },
        });

        return NextResponse.json({
            answer,
            sources,
            citations, // Rich citations with icons and trust badges
            confidence,
            sourcesUsed: searchResults?.length || 0,
            federatedSearch: usedFederatedSearch,
            // OmniForge Phase 3: Reasoning metadata for Thinking UI
            reasoning: {
                verdict: cragResult?.verdict || 'RELEVANT',
                confidence: cragResult?.confidence || confidence,
                correctionApplied: cragResult?.correctionApplied || null,
                webSupplementUsed: cragResult?.supplementalResults && cragResult.supplementalResults.length > 0,
                evaluatedSources: cragResult?.evaluatedResults?.length || searchResults?.length || 0,
                sourceTypes: [...new Set(searchResults?.map((r: any) => r.sourceType) || [])],
            },
        });

    } catch (error: any) {
        console.error('[Chat] Error:', error);
        return NextResponse.json({ error: error.message || 'Chat failed' }, { status: 500 });
    }
}

// Fallback search when federated search fails
async function fallbackSearch(productId: string, queryEmbedding: number[], query: string, userId?: string) {
    // Try existing RPC first
    const { data: chunks, error: searchError } = await supabase.rpc('hybrid_search', {
        query_embedding: queryEmbedding,
        query_text: query,
        p_product_id: productId,
        p_user_id: userId || null,
        match_count: 10
    });

    let relevantChunks = chunks || [];

    if (searchError) {
        console.log('[Chat] RPC failed, using direct query fallback...', searchError);

        const { data: product } = await supabase
            .from('products')
            .select('knowledge_base_id')
            .eq('id', productId)
            .single();

        if (product?.knowledge_base_id) {
            const { data: directChunks } = await supabase
                .from('knowledge_chunks')
                .select(`
                    id,
                    content,
                    chunk_index,
                    document_id,
                    knowledge_documents!inner (
                        title,
                        knowledge_base_id
                    )
                `)
                .eq('knowledge_documents.knowledge_base_id', product.knowledge_base_id)
                .limit(10);

            if (directChunks) relevantChunks = directChunks;
        }
    }

    // Build context from chunks
    let context = '';
    const results = relevantChunks.map((chunk: any) => {
        const title = chunk.knowledge_documents?.title || chunk.document_title || 'Document';
        context += `\n\n--- From "${title}" [📚 Internal Documents] (Verified) ---\n${chunk.content}`;

        return {
            title,
            content: chunk.content,
            excerpt: chunk.content.substring(0, 200) + '...',
            sourceType: 'internal_documents',
            sourceIcon: '📚',
            trustLevel: 100,
        };
    });

    return { results, context };
}

// Generate embedding using Gemini
async function generateGeminiEmbedding(text: string): Promise<number[]> {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'models/text-embedding-004',
                        content: { parts: [{ text }] },
                    }),
                }
            );

            if (response.status === 429) {
                console.log('Rate limited, waiting...');
                await new Promise(r => setTimeout(r, 5000));
                continue;
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini Embedding API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data.embedding.values;
        } catch (error) {
            if (attempt === maxRetries - 1) throw error;
        }
    }

    throw new Error('Failed to generate embedding after retries');
}

// Generate chat response using Gemini
async function generateGeminiResponse(
    query: string,
    context: string,
    isMultiSource: boolean = false,
    systemOverride?: string  // CRAG: Optional override for low-confidence responses
): Promise<string> {
    const sourceNote = isMultiSource
        ? 'The context may include information from multiple sources: Internal Documents (verified), External APIs (authoritative databases), and Trusted Websites (domain-restricted web search). Each source is labeled with its type and trust level.'
        : 'All context comes from verified internal documents.';

    // CRAG: Use system override if provided
    const additionalInstructions = systemOverride ? `\n\n${systemOverride}` : '';

    const systemPrompt = `You are an expert AI assistant. You provide accurate, well-researched answers based on the provided knowledge base.

IMPORTANT RULES:
1. Base your answers ONLY on the provided context
2. If the context doesn't contain relevant information, say "I don't have specific information about this in my knowledge base"
3. Always cite the source when available - mention the document title or source type
4. Be precise and practical - users need actionable advice
5. If there's ambiguity, mention it and suggest consulting an expert
6. When citing sources, use the source labels provided (e.g., "According to [Document Title]...")

${sourceNote}${additionalInstructions}

Context from Knowledge Base:
${context || 'No relevant context found.'}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${query}` }] }
                ],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 2000,
                },
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate response';
}
