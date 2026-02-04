// Follow Deno Edge Function format for Supabase
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// LLM Imports would go here in production
// For now, we'll use fetch to OpenAI API

interface QueryRequest {
    query: string;
    conversationId?: string;
    productId: string;
    userId?: string;
}

interface QueryResponse {
    answer: string;
    sources: Source[];
    confidence: number;
    conversationId: string;
    messageId: string;
    model: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
    };
}

interface Source {
    documentId: string;
    documentTitle: string;
    documentType: string;
    authorityLevel: number;
    preview: string;
    relevanceScore: number;
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');

        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: { headers: { Authorization: authHeader ?? '' } }
            }
        );

        // Parse request
        const { query, conversationId, productId, userId }: QueryRequest = await req.json();

        if (!query || !productId) {
            return new Response(
                JSON.stringify({ error: 'Query and productId are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 1. Generate query embedding
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: query,
            }),
        });

        const embeddingData = await embeddingResponse.json();
        const queryEmbedding = embeddingData.data[0].embedding;

        // 2. Retrieve relevant chunks using hybrid search
        const { data: searchResults, error: searchError } = await supabaseClient.rpc(
            'hybrid_search',
            {
                query_embedding: queryEmbedding,
                query_text: query,
                p_product_id: productId,
                p_user_id: userId ?? null,
                match_count: 10,
                similarity_threshold: 0.5,
            }
        );

        if (searchError) {
            console.error('Search error:', searchError);
        }

        // 3. Assemble context
        const context = (searchResults ?? [])
            .map((r: any) => `[${r.document_title}]\n${r.content}`)
            .join('\n\n---\n\n');

        const sources: Source[] = (searchResults ?? []).map((r: any) => ({
            documentId: r.document_id,
            documentTitle: r.document_title,
            documentType: r.document_type ?? 'Document',
            authorityLevel: r.authority_level,
            preview: r.content.substring(0, 200) + '...',
            relevanceScore: r.combined_score,
        }));

        // 4. Generate response using LLM
        const systemPrompt = `You are a GST expert AI assistant. Use ONLY the provided context to answer questions.
    
Rules:
1. If the context contains the answer, provide it with citations
2. If context is insufficient, say "I don't have enough information to answer this question accurately"
3. Always cite sources using [Source Name] format
4. Be concise but comprehensive
5. For legal/tax advice, recommend consulting a professional for specific situations`;

        const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: `Context:\n${context || 'No relevant context found.'}\n\nQuestion: ${query}`
                    },
                ],
                temperature: 0.3,
                max_tokens: 1024,
            }),
        });

        const llmData = await llmResponse.json();
        const answer = llmData.choices[0]?.message?.content ?? 'Unable to generate response';
        const usage = llmData.usage ?? { prompt_tokens: 0, completion_tokens: 0 };

        // 5. Calculate confidence score
        const confidence = calculateConfidence(searchResults ?? [], answer);

        // 6. Create or get conversation
        let activeConversationId = conversationId;

        if (!activeConversationId) {
            const { data: newConversation } = await supabaseClient
                .from('conversations')
                .insert({
                    user_id: userId,
                    product_id: productId,
                    title: query.substring(0, 100),
                })
                .select()
                .single();

            activeConversationId = newConversation?.id;
        }

        // 7. Save messages
        const { data: userMessage } = await supabaseClient
            .from('messages')
            .insert({
                conversation_id: activeConversationId,
                user_id: userId,
                role: 'user',
                content: query,
            })
            .select()
            .single();

        const { data: assistantMessage } = await supabaseClient
            .from('messages')
            .insert({
                conversation_id: activeConversationId,
                user_id: userId,
                role: 'assistant',
                content: answer,
                model_used: 'gpt-4o-mini',
                tokens_prompt: usage.prompt_tokens,
                tokens_completion: usage.completion_tokens,
                confidence_score: confidence,
                sources: JSON.stringify(sources),
            })
            .select()
            .single();

        // 8. Log usage
        await supabaseClient.from('usage_records').insert({
            user_id: userId,
            product_id: productId,
            metric_type: 'query',
            quantity: 1,
            metadata: {
                model: 'gpt-4o-mini',
                tokens: usage.prompt_tokens + usage.completion_tokens,
            },
        });

        // 9. Audit log
        await supabaseClient.from('audit_logs').insert({
            user_id: userId,
            product_id: productId,
            event_type: 'query_processed',
            event_category: 'query',
            event_data: {
                query_length: query.length,
                sources_count: sources.length,
                confidence,
                model: 'gpt-4o-mini',
            },
        });

        // 10. Return response
        const response: QueryResponse = {
            answer,
            sources,
            confidence,
            conversationId: activeConversationId,
            messageId: assistantMessage?.id,
            model: 'gpt-4o-mini',
            usage: {
                promptTokens: usage.prompt_tokens,
                completionTokens: usage.completion_tokens,
            },
        };

        return new Response(
            JSON.stringify(response),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Query handler error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

function calculateConfidence(searchResults: any[], answer: string): number {
    if (!searchResults || searchResults.length === 0) {
        return 0.3; // Low confidence without sources
    }

    // Factor 1: Average relevance of sources
    const avgRelevance = searchResults.reduce((sum, r) => sum + (r.combined_score ?? 0), 0) / searchResults.length;

    // Factor 2: Source count
    const sourceCountFactor = Math.min(searchResults.length / 5, 1);

    // Factor 3: Authority level
    const avgAuthority = searchResults.reduce((sum, r) => sum + (r.authority_level ?? 5), 0) / searchResults.length / 10;

    // Factor 4: Answer includes "don't have enough" = lower confidence
    const hasDisclaimer = answer.toLowerCase().includes("don't have enough") ||
        answer.toLowerCase().includes("not enough information");
    const disclaimerPenalty = hasDisclaimer ? 0.3 : 0;

    const confidence = (avgRelevance * 0.4 + sourceCountFactor * 0.2 + avgAuthority * 0.4) - disclaimerPenalty;

    return Math.max(0.1, Math.min(1, confidence));
}
