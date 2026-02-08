import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { triggerBackgroundLearning } from '@/lib/cognitive/learning-orchestrator';
import { buildAdaptiveConfig, detectEmotionalState } from '@/lib/cognitive/adaptive-intelligence';
import { liveWebSearch } from '@/lib/okse/live-web-search';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Import world-class conversation intelligence
import {
    rewriteQuery,
    buildMultiTurnMessages,
    summarizeConversation,
    STRICT_MODE_PROMPT,
    EXTENDED_MODE_PROMPT,
    ConversationMessage
} from '@/lib/conversation-intelligence';

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY!;
// Using gemini-embedding-001 with outputDimensionality=768 to match stored embeddings
const GEMINI_EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent';

async function getEmbedding(text: string): Promise<number[]> {
    try {
        console.log('[Embedding] Calling Gemini embedding API (768d)...');
        const response = await fetch(`${GEMINI_EMBED_URL}?key=${GOOGLE_AI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/gemini-embedding-001',
                content: { parts: [{ text }] },
                outputDimensionality: 768  // Match stored embedding dimensions
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Embedding] API error:', response.status, errorText);
            return [];
        }

        const data = await response.json();
        const values = data.embedding?.values || [];

        // 🛡️ SECURITY CHECK: strictly enforce 768 dimensions
        if (values.length !== 768) {
            console.error(`[CRITICAL] Query embedding dimension mismatch! Expected 768, got ${values.length}`);
            throw new Error(`Query embedding failed: Returned ${values.length} dimensions, expected 768.`);
        }

        console.log('[Embedding] Success, got', values.length, 'dimensions');
        return values;
    } catch (error) {
        console.error('[Embedding] Failed:', error);
        return [];
    }
}


async function generateContent(prompt: string): Promise<string> {
    try {
        console.log('Calling Gemini API...');
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            }
        );

        const responseText = await response.text();
        console.log('Gemini response status:', response.status);

        if (!response.ok) {
            console.error('Gemini API error:', response.status, responseText);
            try {
                const errorData = JSON.parse(responseText);
                const errorMessage = errorData?.error?.message || 'API error';
                return `I apologize, but I encountered an error: ${errorMessage}`;
            } catch {
                return `I apologize, but I encountered an API error (${response.status}). Please try again.`;
            }
        }

        const data = JSON.parse(responseText);

        if (data.candidates?.[0]?.finishReason === 'SAFETY') {
            return 'I apologize, but I cannot respond to this query due to content safety guidelines.';
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            console.error('Empty response from Gemini:', responseText.substring(0, 500));
            return 'I apologize, but I could not generate a response. Please try rephrasing your question.';
        }

        console.log('Gemini response received, length:', text.length);
        return text;
    } catch (error: any) {
        console.error('generateContent error:', error);
        return `I apologize, but I encountered a technical error: ${error.message || 'Unknown error'}. Please try again.`;
    }
}

/**
 * World-Class Multi-Turn Generation using Gemini's native conversation format
 * This is what makes us match ChatGPT/Claude quality
 */
async function generateContentMultiTurn(
    messages: { role: string; parts: { text: string }[] }[]
): Promise<string> {
    try {
        console.log('[Multi-Turn] Calling Gemini with', messages.length, 'turns');
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: messages,
                    generationConfig: {
                        temperature: 0.7,
                        topP: 0.9,
                        topK: 40,
                        maxOutputTokens: 2048,
                    },
                }),
            }
        );

        const responseText = await response.text();

        if (!response.ok) {
            console.error('[Multi-Turn] Gemini error:', response.status);
            return generateContent(messages[messages.length - 1]?.parts[0]?.text || '');
        }

        const data = JSON.parse(responseText);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return generateContent(messages[messages.length - 1]?.parts[0]?.text || '');
        }

        console.log('[Multi-Turn] Response received, length:', text.length);
        return text;
    } catch (error: any) {
        console.error('[Multi-Turn] Error, falling back:', error.message);
        return generateContent(messages[messages.length - 1]?.parts[0]?.text || '');
    }
}

interface ContextChunk {
    content: string;
    similarity: number;
    title: string;
    type: 'global' | 'user' | 'context' | 'entity' | 'web';
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const query = formData.get('query') as string;
        const productId = formData.get('productId') as string;
        const productUserId = formData.get('productUserId') as string;
        const sessionId = formData.get('sessionId') as string;
        const contextFile = formData.get('contextFile') as File | null;
        const conversationHistoryRaw = formData.get('conversationHistory') as string;
        const enableWebSearch = formData.get('enableWebSearch') === 'true';
        const enableExtendedKnowledge = formData.get('enableExtendedKnowledge') === 'true';

        // Parse conversation history for context-aware responses
        let conversationHistory: { role: string; content: string }[] = [];
        try {
            if (conversationHistoryRaw) {
                conversationHistory = JSON.parse(conversationHistoryRaw);
            }
        } catch (e) {
            console.warn('Failed to parse conversation history:', e);
        }

        if (!query || !productId || !productUserId) {
            return NextResponse.json(
                { error: 'query, productId, and productUserId are required' },
                { status: 400 }
            );
        }

        // Get query embedding
        const queryEmbedding = await getEmbedding(query);
        if (queryEmbedding.length === 0) {
            return NextResponse.json(
                { error: 'Failed to process query' },
                { status: 500 }
            );
        }

        // Get product user info
        const { data: productUser } = await supabase
            .from('product_users')
            .select('user_id, product_id')
            .eq('id', productUserId)
            .single();

        if (!productUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const allChunks: ContextChunk[] = [];

        // ============================================
        // 1. GLOBAL PRODUCT KNOWLEDGE
        // ============================================
        console.log('[UserChat] Calling hybrid_search with:', {
            embedding_length: queryEmbedding.length,
            query: query.substring(0, 50),
            p_product_id: productId,
            p_user_id: productUser.user_id,
        });

        const { data: globalChunks, error: globalError } = await supabase.rpc('hybrid_search', {
            query_embedding: queryEmbedding,
            query_text: query,
            p_product_id: productId,
            p_user_id: productUser.user_id,
            match_count: 5,
        });

        console.log('[UserChat] hybrid_search result:', {
            chunks_found: globalChunks?.length || 0,
            error: globalError,
            first_chunk_preview: globalChunks?.[0]?.content?.substring(0, 100),
        });

        if (globalError) {
            console.error('[UserChat] hybrid_search error:', globalError);
        }

        if (globalChunks?.length > 0) {
            console.log(`[UserChat] Found ${globalChunks.length} internal KB chunks`);
            globalChunks.forEach((chunk: any) => {
                allChunks.push({
                    content: chunk.content,
                    similarity: chunk.score || 0.5,  // hybrid_search returns 'score', not 'similarity'
                    title: chunk.document_title || 'Knowledge Base',
                    type: 'global',
                });
            });
        } else {
            console.log('[UserChat] No internal KB chunks found - KB may be empty or query not matching');
        }

        // ============================================
        // 2. USER'S PRIVATE KNOWLEDGE BASE
        // ============================================
        const { data: userChunks } = await supabase.rpc('match_user_knowledge_chunks', {
            query_embedding: queryEmbedding,
            p_product_user_id: productUserId,
            match_count: 3,
        });

        if (userChunks?.length > 0) {
            userChunks.forEach((chunk: any) => {
                allChunks.push({
                    content: chunk.content,
                    similarity: chunk.similarity || 0.5,
                    title: chunk.document_name || 'Your Document',
                    type: 'user',
                });
            });
        }

        // ============================================
        // 2.5. LIVE WEB SEARCH (OKSE Integration)
        // Search trusted domains for relevant content
        // Triggers when: user explicitly enables it OR when internal KB has NO results
        // ============================================
        let webSearchUsed = false;
        let kbWasEmpty = allChunks.length === 0; // Track if KB had no results

        try {
            // Only auto-trigger if KB is truly empty (0 results) - not just sparse
            const shouldSearchWeb = enableWebSearch || allChunks.length === 0;

            if (shouldSearchWeb) {
                console.log(`[UserChat] Triggering live web search... (explicit: ${enableWebSearch}, KB empty: ${allChunks.length === 0})`);
                const webResults = await liveWebSearch(query, productId, {
                    fetchContent: true,
                    maxResults: enableWebSearch ? 5 : 3 // More results if explicitly requested
                });

                if (webResults.results.length > 0) {
                    webSearchUsed = true;
                    console.log(`[UserChat] Web search found ${webResults.results.length} results from trusted domains`);

                    webResults.results.forEach((result) => {
                        allChunks.push({
                            content: result.content || result.snippet,
                            similarity: 0.75, // Good relevance from search engine
                            title: `${result.title} [${result.domain}]`,
                            type: 'web',
                        });
                    });
                }
            }
        } catch (webError) {
            console.error('[UserChat] Live web search failed:', webError);
            // Continue without web results
        }

        // ============================================
        // 3. ENTITY MEMORY (Client/Case facts)
        // ============================================
        const { data: detectedEntity } = await supabase.rpc('detect_entity_from_message', {
            p_product_user_id: productUserId,
            p_message: query,
        });

        let entityContext = '';
        let detectedEntityId: string | null = null;

        if (detectedEntity) {
            detectedEntityId = detectedEntity;

            // Get entity details
            const { data: entity } = await supabase
                .from('user_entities')
                .select('name, notes')
                .eq('id', detectedEntity)
                .single();

            // Get entity facts
            const { data: facts } = await supabase
                .from('entity_facts')
                .select('fact_type, summary, details, created_at')
                .eq('entity_id', detectedEntity)
                .order('created_at', { ascending: false })
                .limit(10);

            if (entity && facts && facts.length > 0) {
                entityContext = `\n\n--- REMEMBERED FACTS ABOUT ${entity.name.toUpperCase()} ---\n`;
                facts.forEach((fact: any) => {
                    entityContext += `• [${fact.fact_type}] ${fact.summary}\n`;
                });
                if (entity.notes) {
                    entityContext += `\nNotes: ${entity.notes}\n`;
                }
            }
        }

        // ============================================
        // 4. CONTEXT FILE (Temporary, session-only)
        // ============================================
        let contextFileText = '';
        if (contextFile) {
            const buffer = await contextFile.arrayBuffer();

            if (contextFile.type === 'text/plain' || contextFile.name.endsWith('.txt')) {
                contextFileText = new TextDecoder().decode(buffer);
            } else if (contextFile.type === 'application/pdf' || contextFile.name.endsWith('.pdf')) {
                // Basic PDF text extraction
                try {
                    const decoder = new TextDecoder('utf-8', { fatal: false });
                    contextFileText = decoder.decode(buffer);
                    const matches = contextFileText.match(/\((.*?)\)/g);
                    if (matches) {
                        contextFileText = matches.map(m => m.slice(1, -1)).join(' ');
                    }
                } catch {
                    contextFileText = '';
                }
            } else {
                contextFileText = new TextDecoder().decode(buffer);
            }

            if (contextFileText.trim().length > 50) {
                allChunks.push({
                    content: contextFileText.slice(0, 5000), // Limit context file size
                    similarity: 1.0, // Highest priority
                    title: contextFile.name,
                    type: 'context',
                });

                // Save to session context_files (for memory extraction later)
                if (sessionId) {
                    const { data: session } = await supabase
                        .from('chat_sessions')
                        .select('context_files')
                        .eq('id', sessionId)
                        .single();

                    const existingFiles = session?.context_files || [];
                    existingFiles.push({
                        filename: contextFile.name,
                        file_type: contextFile.type,
                        extracted_text: contextFileText.slice(0, 2000),
                        uploaded_at: new Date().toISOString(),
                    });

                    await supabase
                        .from('chat_sessions')
                        .update({ context_files: existingFiles })
                        .eq('id', sessionId);
                }
            }
        }

        // ============================================
        // 5. DETECT TASK TYPE
        // ============================================
        const { data: detectedTaskId } = await supabase.rpc('detect_task_from_message', {
            p_product_id: productId,
            p_message: query,
        });

        let taskSystemPrompt = '';
        let taskName = 'General Query';

        if (detectedTaskId) {
            const { data: task } = await supabase
                .from('product_tasks')
                .select('name, system_prompt, output_format')
                .eq('id', detectedTaskId)
                .single();

            if (task) {
                taskName = task.name;
                if (task.system_prompt) {
                    taskSystemPrompt = task.system_prompt;
                }
            }
        }

        // ============================================
        // BUILD CONTEXT
        // ============================================
        allChunks.sort((a, b) => b.similarity - a.similarity);
        const topChunks = allChunks.slice(0, 8);

        let context = '';
        if (topChunks.length > 0) {
            context = topChunks
                .map((c, i) => `[Source ${i + 1}: ${c.title} (${c.type})]:\n${c.content}`)
                .join('\n\n---\n\n');
        }

        // Add entity memory
        context += entityContext;

        // ============================================
        // GENERATE RESPONSE - WORLD-CLASS INTELLIGENCE
        // ============================================

        // Step 1: Rewrite query to resolve pronouns and references
        const rewrittenQueryResult = rewriteQuery(query, conversationHistory as ConversationMessage[]);
        const effectiveQuery = rewrittenQueryResult.rewritten;

        if (rewrittenQueryResult.isFollowUp) {
            console.log(`[Query Rewrite] "${query}" → "${effectiveQuery}" (${rewrittenQueryResult.referenceType})`);
        }

        // Step 2: Build adaptive intelligence context
        // This is THE REVOLUTIONARY FEATURE - personalized AI based on user's profile
        let adaptivePrompt = '';
        try {
            const adaptiveConfig = await buildAdaptiveConfig(productUserId, productId, query);
            adaptivePrompt = adaptiveConfig.adaptiveSystemPrompt;

            // Log the personalization happening
            console.log(`[AdaptiveIntelligence] Personalizing for session:`, {
                expertise: adaptiveConfig.expertiseLevel,
                mood: adaptiveConfig.detectedMood,
                timeOfDay: adaptiveConfig.timeOfDay,
                hasEntityContext: adaptiveConfig.shouldReferenceEntity,
                hasGoalContext: adaptiveConfig.shouldMentionGoal,
            });
        } catch (error) {
            console.warn('[AdaptiveIntelligence] Failed to build adaptive config:', error);
            // Continue without personalization
        }

        // Step 3: Select system prompt based on Extended Knowledge mode
        // STRICT_MODE_PROMPT: Only answers from KB (default)
        // EXTENDED_MODE_PROMPT: Allows Gemini general knowledge
        const basePrompt = enableExtendedKnowledge ? EXTENDED_MODE_PROMPT : STRICT_MODE_PROMPT;
        let systemPrompt = taskSystemPrompt || basePrompt;

        console.log('[Mode]', enableExtendedKnowledge ? 'EXTENDED (KB + General)' : 'STRICT (KB Only)');

        // Inject adaptive personalization into the system prompt
        if (adaptivePrompt) {
            systemPrompt += '\n\n' + adaptivePrompt;
        }

        // Step 4: Build multi-turn messages for native Gemini format
        const multiTurnMessages = buildMultiTurnMessages(
            conversationHistory as ConversationMessage[],
            effectiveQuery,
            systemPrompt,
            context || ''  // Empty context triggers "no information found" in strict mode
        );

        // CRITICAL DEBUG: Log what's being sent to AI
        console.log('[CRITICAL] Context being sent to AI:');
        console.log('  - Context length:', context.length, 'chars');
        console.log('  - Context preview:', context.substring(0, 500));
        console.log('  - Top chunks count:', topChunks.length);
        console.log('  - Mode:', enableExtendedKnowledge ? 'EXTENDED' : 'STRICT');

        // Step 5: Generate response using multi-turn format
        const response = await generateContentMultiTurn(multiTurnMessages);

        // ============================================
        // EXTRACT MEMORY SUGGESTIONS (Post-chat)
        // ============================================
        let memorySuggestions: any = null;

        // Only extract if there's substantial content
        if ((contextFileText.length > 100 || entityContext.length > 0) && response.length > 100) {
            try {
                const extractionPrompt = `Analyze this conversation and extract structured information that should be remembered.

USER QUERY: ${query}

AI RESPONSE: ${response}

CONTEXT FILE: ${contextFileText.slice(0, 1000) || 'None'}

Extract and return ONLY valid JSON with this structure:
{
    "entities": [{"name": "entity name", "type": "client/case/patient"}],
    "facts": [{"entity_name": "ABC Trading", "fact_type": "notice/case/interaction", "summary": "short summary"}],
    "should_remember": true/false
}

If nothing worth remembering, return: {"should_remember": false}`;

                const extractText = await generateContent(extractionPrompt);

                // Parse JSON from response
                const jsonMatch = extractText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    memorySuggestions = JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.error('Memory extraction failed:', e);
            }
        }

        // ============================================
        // 🧠 COGNITIVE LEARNING - REVOLUTIONARY FEATURE!
        // Trigger background intelligence extraction
        // This makes the AI progressively smarter about the user
        // ============================================
        if (sessionId) {
            // Convert conversation history to ChatMessage format
            const messagesForLearning = [
                ...conversationHistory.map((msg: any, idx: number) => ({
                    id: `msg-${idx}`,
                    session_id: sessionId,
                    message_index: idx,
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content,
                    created_at: new Date().toISOString(),
                })),
                // Add current exchange
                {
                    id: `msg-${conversationHistory.length}`,
                    session_id: sessionId,
                    message_index: conversationHistory.length,
                    role: 'user' as const,
                    content: query,
                    created_at: new Date().toISOString(),
                },
                {
                    id: `msg-${conversationHistory.length + 1}`,
                    session_id: sessionId,
                    message_index: conversationHistory.length + 1,
                    role: 'assistant' as const,
                    content: response,
                    sources: topChunks.slice(0, 5),
                    created_at: new Date().toISOString(),
                }
            ];

            // Fire and forget - doesn't block the response
            // Trigger on every exchange to ensure titles are generated early
            triggerBackgroundLearning(
                sessionId,
                productUserId,
                productId,
                messagesForLearning
            );
            console.log('[ChatAPI] Background learning triggered for session:', sessionId, 'with', messagesForLearning.length, 'messages');
        }

        return NextResponse.json({
            success: true,
            response,
            metadata: {
                taskDetected: taskName,
                entityDetected: detectedEntityId,
                sourcesUsed: topChunks.length,
                hasContextFile: !!contextFile,
            },
            // OmniForge Phase 3: Reasoning metadata for Thinking UI
            reasoning: {
                verdict: topChunks.length >= 2 ? 'RELEVANT' : topChunks.length > 0 ? 'AMBIGUOUS' : 'IRRELEVANT',
                confidence: topChunks.length > 0
                    ? Math.min(0.95, 0.5 + (topChunks.length * 0.08) + (topChunks[0]?.similarity || 0) * 0.3)
                    : 0.2,
                kbWasEmpty,  // True if KB had 0 results and web search was used as fallback
                webSupplementUsed: webSearchUsed,
                evaluatedSources: topChunks.length,
                sourceTypes: [...new Set(topChunks.map(c => c.type))],
            },
            sources: topChunks.slice(0, 5).map(c => ({
                title: c.title,
                excerpt: c.content.substring(0, 150) + '...',
                type: c.type === 'user' ? 'private' : c.type === 'web' ? 'web' : 'global',
                icon: c.type === 'web' ? '🌐' : c.type === 'user' ? '📁' : '📚',
            })),
            memorySuggestions,
        });

    } catch (error: any) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
