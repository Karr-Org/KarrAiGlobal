import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { triggerBackgroundLearning } from '@/lib/cognitive/learning-orchestrator';
import { buildAdaptiveConfig, detectEmotionalState } from '@/lib/cognitive/adaptive-intelligence';
import { generateWithCitationTool, extractCitationsFallback } from '@/lib/okse/citation-tool';
import type { CitationSource, InlineCitation } from '@/lib/okse/types';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Import world-class conversation intelligence
import {
    rewriteQuery,
    buildMultiTurnMessages,
    summarizeConversation,
    sanitizeUserInput,
    isConversationalQuery,
    buildIdentityProtectionBlock,
    buildStrictModePrompt,
    buildExtendedModePrompt,
    buildWebModePrompt,
    STRICT_MODE_PROMPT,
    EXTENDED_MODE_PROMPT,
    IDENTITY_PROTECTION_BLOCK,
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
    messages: { role: string; parts: { text: string }[] }[],
    systemInstruction?: string
): Promise<string> {
    try {
        console.log('[Multi-Turn] Calling Gemini with', messages.length, 'turns', systemInstruction ? '+ system_instruction' : '(no system_instruction)');

        const requestBody: Record<string, unknown> = {
            contents: messages,
            generationConfig: {
                temperature: 0.7,
                topP: 0.9,
                topK: 40,
                maxOutputTokens: 2048,
            },
        };

        // Use Gemini's native system_instruction field when provided
        if (systemInstruction) {
            requestBody.system_instruction = {
                parts: [{ text: systemInstruction }],
            };
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            }
        );

        const responseText = await response.text();

        if (!response.ok) {
            console.error('[Multi-Turn] Gemini error:', response.status);
            return generateContent(messages[messages.length - 1]?.parts[0]?.text || '');
        }

        const data = JSON.parse(responseText);

        // Handle Gemini safety blocks — match widget route behavior
        if (data.candidates?.[0]?.finishReason === 'SAFETY') {
            console.warn('[Multi-Turn] Response blocked by Gemini safety filters');
            return 'I cannot respond to this query due to safety guidelines. Please rephrase your question.';
        }

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
        const isWebOnly = enableWebSearch && !enableExtendedKnowledge;

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

        // Sanitize input against prompt injection
        const sanitizedQuery = sanitizeUserInput(query);
        const isConversational = isConversationalQuery(sanitizedQuery);

        // Step 0: Rewrite query to resolve pronouns and references BEFORE retrieval
        // This is critical — "tell me more", "what about it?" etc. need to be
        // resolved to actual topics before we embed and search the KB.
        const rewrittenQueryResult = rewriteQuery(sanitizedQuery, conversationHistory as ConversationMessage[]);
        const effectiveQuery = rewrittenQueryResult.rewritten;

        if (rewrittenQueryResult.isFollowUp) {
            console.log(`[Query Rewrite] "${sanitizedQuery}" → "${effectiveQuery}" (${rewrittenQueryResult.referenceType})`);
        }

        // Skip embedding for conversational queries and web-only mode (saves API call)
        let queryEmbedding: number[] = [];
        if (!isConversational && !isWebOnly) {
            queryEmbedding = await getEmbedding(effectiveQuery);
            if (queryEmbedding.length === 0) {
                return NextResponse.json(
                    { error: 'Failed to process query' },
                    { status: 500 }
                );
            }
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

        // ============================================
        // FETCH AGENT PERSONA
        // ============================================
        let persona: any = null;
        try {
            const { data: personaData } = await supabase
                .from('agent_persona')
                .select('*')
                .eq('product_id', productId)
                .single();
            persona = personaData;
            if (persona) {
                console.log('[UserChat] Agent persona loaded:', persona.agent_name || '(unnamed)');
            }
        } catch (e) {
            console.warn('[UserChat] No persona found, using defaults');
        }

        // ============================================
        // FETCH CUSTOM API TOOLS
        // ============================================
        let customTools: any[] = [];
        try {
            const { data: toolsData } = await supabase
                .from('product_api_tools')
                .select('*')
                .eq('product_id', productId)
                .eq('is_active', true);
            customTools = toolsData || [];
            if (customTools.length > 0) {
                console.log('[UserChat] Custom API tools loaded:', customTools.map((t: any) => t.tool_name).join(', '));
            }
        } catch (e) {
            console.warn('[UserChat] Failed to fetch custom tools:', e);
        }

        // ============================================
        // FETCH KB DOCUMENT TITLES + TOPIC SUMMARY
        // Gives the system prompt and query router awareness of what's in the KB
        // ============================================
        let kbTitles: string[] = [];
        let kbTopicSummary: string | undefined;

        try {
            // 1. Get all KB IDs linked to this product
            const { data: kbLinks } = await supabase
                .from('product_knowledge_bases')
                .select('knowledge_base_id')
                .eq('product_id', productId);

            const kbIds = (kbLinks || []).map(l => l.knowledge_base_id);

            if (kbIds.length > 0) {
                // 2. Fetch document titles from linked KBs
                const { data: kbDocs } = await supabase
                    .from('knowledge_documents')
                    .select('title')
                    .in('knowledge_base_id', kbIds)
                    .eq('status', 'active');

                kbTitles = (kbDocs || []).map(d => d.title);
                console.log('[UserChat] KB document titles:', kbTitles.length, 'docs:', kbTitles.slice(0, 5).join(', '));

                // 3. Check for cached topic summary in product ai_config
                const { data: product } = await supabase
                    .from('products')
                    .select('ai_config')
                    .eq('id', productId)
                    .single();

                const cachedSummary = product?.ai_config?.kb_topic_summary;
                const cachedDocCount = product?.ai_config?.kb_topic_doc_count;

                if (cachedSummary && cachedDocCount === kbTitles.length) {
                    // Cache is still valid (same doc count)
                    kbTopicSummary = cachedSummary;
                    console.log('[UserChat] Using cached KB topic summary:', kbTopicSummary?.substring(0, 80));
                } else if (kbTitles.length > 0) {
                    // Generate a new topic summary from titles
                    try {
                        const summaryPrompt = `Given these document titles from a knowledge base, write a ONE-LINE summary (max 150 chars) of what topics and domains this knowledge base covers. Be specific about the subject matter.\n\nDocument titles:\n${kbTitles.join('\n')}\n\nOne-line summary:`;

                        const summaryResponse = await fetch(
                            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    contents: [{ parts: [{ text: summaryPrompt }] }],
                                    generationConfig: { temperature: 0.1, maxOutputTokens: 100 },
                                }),
                            }
                        );

                        if (summaryResponse.ok) {
                            const summaryData = await summaryResponse.json();
                            kbTopicSummary = summaryData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

                            // Cache the summary in product ai_config
                            if (kbTopicSummary) {
                                const updatedConfig = {
                                    ...(product?.ai_config || {}),
                                    kb_topic_summary: kbTopicSummary,
                                    kb_topic_doc_count: kbTitles.length,
                                    kb_topic_updated_at: new Date().toISOString(),
                                };
                                await supabase
                                    .from('products')
                                    .update({ ai_config: updatedConfig })
                                    .eq('id', productId);
                                console.log('[UserChat] Generated and cached KB topic summary:', kbTopicSummary);
                            }
                        }
                    } catch (summaryError) {
                        console.warn('[UserChat] Failed to generate KB topic summary:', summaryError);
                        // Non-critical — continue without topic summary
                    }
                }
            }
        } catch (kbError) {
            console.warn('[UserChat] Failed to fetch KB titles:', kbError);
            // Non-critical — continue without KB awareness
        }

        const allChunks: ContextChunk[] = [];

        // Skip KB searches entirely for conversational queries (embedding is empty anyway)
        // Also skip KB searches in web-only mode — the user explicitly chose web search,
        // so we should not retrieve or cite KB documents at all.
        if (!isConversational && !isWebOnly) {
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
                query_text: effectiveQuery,
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
            // 2.1. CRAWLED WEBSITE KNOWLEDGE (Website Learning)
            // Searches web_knowledge_chunks — data crawled from
            // trusted web sources configured on the Persona page.
            // ============================================
            if (queryEmbedding.length > 0) {
                try {
                    const { data: webChunks, error: webError } = await supabase.rpc('okse_web_search', {
                        p_query_embedding: queryEmbedding,
                        p_product_id: productId,
                        p_match_count: 3,
                        p_min_authority: 3,
                    });

                    if (webError) {
                        console.warn('[UserChat] okse_web_search error:', webError);
                    }

                    if (webChunks?.length > 0) {
                        console.log(`[UserChat] Found ${webChunks.length} crawled website chunks`);
                        webChunks.forEach((chunk: any) => {
                            allChunks.push({
                                content: chunk.content,
                                similarity: chunk.similarity || 0.6,
                                title: chunk.source_title || chunk.source_display_name || `${chunk.source_domain} (Website)`,
                                type: 'web',
                            });
                        });
                    }
                } catch (webSearchErr) {
                    console.warn('[UserChat] Crawled web search failed (non-critical):', webSearchErr);
                }
            }
        } // end: skip KB searches for conversational queries

        // ============================================
        // 2.5. KB EMPTY CHECK
        // Web search is now handled by the LLM via function calling in the
        // citation tool — no pre-search needed.
        // ============================================
        let webSearchUsed = false;
        // In web-only mode, kbWasEmpty is irrelevant — the user chose web search,
        // so we should NOT show the "couldn't find in KB" banner.
        let kbWasEmpty = isWebOnly ? false : allChunks.length === 0;

        // ============================================
        // 2.6. STRICT MODE — let the LLM decide refusals
        // Previously this block had a hardcoded early-exit refusal when
        // kbWasEmpty was true. That bypassed the LLM and prevented it
        // from using conversation history, partial context, or its own
        // reasoning. The STRICT_MODE_PROMPT already instructs the LLM
        // to answer only from context and explain naturally when context
        // is insufficient — so we let it handle all cases.
        // ============================================
        const isStrictMode = !enableExtendedKnowledge && !enableWebSearch;
        if (isStrictMode && kbWasEmpty) {
            console.log('[UserChat] STRICT MODE: KB empty — LLM will handle (no hardcoded refusal)');
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

        // Step 3: Select system prompt based on mode
        // Each mode gets a tailored prompt:
        // - Strict: KB only, refuse off-topic
        // - Extended: KB first, general knowledge allowed
        // - Web: Pure web search, no KB mention at all
        // - Full Power: KB + web + general knowledge
        const agentName = persona?.agent_name || null;
        const orgName = persona?.organization_name || null;
        const useExtendedPrompt = enableExtendedKnowledge || enableWebSearch;
        const basePrompt = isWebOnly
            ? buildWebModePrompt(agentName, orgName)
            : useExtendedPrompt
                ? buildExtendedModePrompt(agentName, orgName)
                : buildStrictModePrompt(agentName, orgName);
        // Start with the user-selected mode prompt (strict/extended/web).
        // If a task system prompt is detected, APPEND it — never replace the
        // base mode prompt, which contains critical web search / KB instructions.
        let systemPrompt = basePrompt;
        if (taskSystemPrompt) {
            systemPrompt += '\n\n## TASK-SPECIFIC INSTRUCTIONS\n' + taskSystemPrompt;
        }

        const modeLabel = enableExtendedKnowledge && enableWebSearch ? 'FULL POWER'
            : enableWebSearch ? 'WEB SEARCH'
                : enableExtendedKnowledge ? 'EXTENDED'
                    : 'STRICT';
        console.log('[Mode]', modeLabel, `(extended prompt: ${useExtendedPrompt}, web search: ${enableWebSearch})`);

        // ============================================
        // INJECT AGENT PERSONA BEHAVIOR INTO SYSTEM PROMPT
        // Identity (name, org) is already inside the identity protection block.
        // This section adds tone, instructions, guardrails, and fallback.
        // ============================================
        if (persona) {
            let personaBlock = '';

            // Add role context if specified (not identity — that's in the identity block)
            if (persona.agent_role) {
                personaBlock += `\n\n## YOUR ROLE\nYour role is: ${persona.agent_role}.\n`;
            }

            if (persona.tone) {
                const toneMap: Record<string, string> = {
                    professional: 'Communicate in a clear, authoritative, business-appropriate manner.',
                    friendly: 'Be warm, approachable, and conversational.',
                    casual: 'Keep it relaxed, informal, and relatable.',
                    academic: 'Be scholarly, detailed, and cite-heavy.',
                    witty: 'Be clever, engaging, with light humor where appropriate.',
                };
                personaBlock += `\n## TONE\n${toneMap[persona.tone] || ''}\n`;
            }

            if (persona.system_instructions) {
                personaBlock += `\n## CREATOR'S INSTRUCTIONS\n${persona.system_instructions}\n`;
            }

            if (persona.blocked_topics && persona.blocked_topics.length > 0) {
                personaBlock += `\n## ⛔ BLOCKED TOPICS (STRICT):\nYou MUST NEVER discuss these topics under ANY circumstances: ${persona.blocked_topics.join(', ')}.\nIf a user asks about any of these, respond ONLY with: "I'm not able to discuss that topic. Is there something else I can help you with?"\nDo NOT provide partial answers, hints, or workarounds for blocked topics.\n`;
            }

            if (persona.fallback_message) {
                // Only inject the custom fallback in strict mode.
                // In web/extended modes, telling the LLM to "respond with [fallback]
                // when you can't answer from provided context" overrides the web search
                // instructions and causes the LLM to refuse instead of searching.
                if (isStrictMode) {
                    personaBlock += `\n## CUSTOM FALLBACK\nWhen you cannot answer a question from the provided context, respond with: "${persona.fallback_message}"\nThis overrides any other refusal instructions — ALWAYS use this fallback message instead of making up your own.\n`;
                }
            }

            if (personaBlock) {
                systemPrompt += personaBlock;
                console.log('[Persona] Injected persona behavior block (' + personaBlock.length + ' chars) | Identity: ' + (agentName || 'default') + ' @ ' + (orgName || 'Karr AI Global'));
            }
        }

        // Inject adaptive personalization into the system prompt
        if (adaptivePrompt) {
            systemPrompt += '\n\n' + adaptivePrompt;
        }

        // ============================================
        // WEB MODE FINAL OVERRIDE
        // Injected LAST so it takes highest priority.
        // Persona/identity blocks may include KB-only language or
        // instruct the LLM to "ask the user" — this override ensures
        // the LLM searches the web immediately without asking.
        // ============================================
        if (isWebOnly) {
            systemPrompt += `\n\n## ⚡ WEB SEARCH MODE — CRITICAL OVERRIDE (HIGHEST PRIORITY AFTER IDENTITY)
- You are in WEB SEARCH MODE. The user has explicitly enabled web search.
- DO NOT introduce yourself. DO NOT say "How can I help you?" — the user has already asked a question.
- DO NOT ask for confirmation or say "Would you like me to proceed?" — just search immediately.
- DO NOT mention a knowledge base. You do not have a knowledge base in this mode.
- DO NOT refuse to search. If the user asks a question, use the web_search tool IMMEDIATELY.
- Answer the question directly using web search results. Cite your sources.
- This overrides any other instruction that conflicts with searching the web.`;
        }

        // ============================================
        // INJECT KB DOMAIN AWARENESS INTO SYSTEM PROMPT
        // Tells the LLM what topics the KB covers so it doesn't
        // default to "Based on general knowledge" for in-domain queries
        // ============================================
        // Skip KB domain awareness in web-only mode — the web prompt
        // explicitly says "no knowledge base", so injecting KB references
        // would contradict it and confuse the LLM.
        if (kbTitles.length > 0 && !isWebOnly) {
            let kbAwarenessBlock = '\n\n## KB DOMAIN AWARENESS\n';
            if (kbTopicSummary) {
                kbAwarenessBlock += `Your knowledge base covers: ${kbTopicSummary}\n`;
            }
            kbAwarenessBlock += `Document titles in your KB: ${kbTitles.slice(0, 20).join(', ')}${kbTitles.length > 20 ? ` (and ${kbTitles.length - 20} more)` : ''}\n`;
            kbAwarenessBlock += `If the user asks about ANY of these topics, ALWAYS search and cite the knowledge base first.\n`;
            kbAwarenessBlock += `Do NOT prefix with "Based on general knowledge" if the topic matches your KB domain — treat it as a KB query.\n`;
            systemPrompt += kbAwarenessBlock;
            console.log('[UserChat] Injected KB domain awareness block (' + kbTitles.length + ' doc titles)');
        }

        // Step 4: Build multi-turn messages for native Gemini format
        // buildMultiTurnMessages returns { messages, systemInstruction } so the
        // system prompt can be passed via Gemini's native system_instruction field
        // instead of being injected into the first user message.
        const { messages: multiTurnMessages, systemInstruction } = buildMultiTurnMessages(
            conversationHistory as ConversationMessage[],
            effectiveQuery,
            systemPrompt,
            context || '',  // Empty context triggers mode-specific behavior
            // Pass the active mode so buildMultiTurnMessages uses the right
            // context section (strict refuses, web searches, extended allows)
            isWebOnly ? 'web'
                : enableExtendedKnowledge && enableWebSearch ? 'full_power'
                    : enableExtendedKnowledge ? 'extended'
                        : 'strict'
        );

        // CRITICAL DEBUG: Log what's being sent to AI
        console.log('[CRITICAL] Context being sent to AI:');
        console.log('  - Context length:', context.length, 'chars');
        console.log('  - Context preview:', context.substring(0, 500));
        console.log('  - Top chunks count:', topChunks.length);
        console.log('  - Mode:', enableExtendedKnowledge ? 'EXTENDED' : 'STRICT');

        // Step 5: Generate response — use citation tool when sources exist OR web search is on
        let response: string;
        let inlineCitations: InlineCitation[] = [];
        let citedSources: CitationSource[] = [];

        if (topChunks.length > 0 || enableWebSearch) {
            // Convert ContextChunks to CitationSource format for the citation tool
            const sourcesForTool: CitationSource[] = topChunks.map((c, i) => ({
                id: `chunk-${i}`,
                type: c.type === 'web' ? 'web' as const : 'kb' as const,
                domain: c.type === 'web' ? c.title.match(/\[(.+?)\]/)?.[1] || null : null,
                display_name: c.type === 'web' ? c.title : 'Your Knowledge Base',
                title: c.title,
                url: null,
                authority_score: Math.round(c.similarity * 10),
                trust_stars: Math.round(c.similarity * 5),
                contextual_summary: null,
                chunk_content: c.content,
                relevance_score: c.similarity,
            }));

            try {
                const citationResult = await generateWithCitationTool(
                    multiTurnMessages,
                    sourcesForTool,
                    {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                        enableWebSearch, // Enables web_search tool in Web/Full Power modes
                        systemInstruction, // Native Gemini system_instruction field
                        customTools: customTools.length > 0 ? customTools : undefined, // Creator-defined API tools
                    }
                );
                response = citationResult.answer;
                inlineCitations = citationResult.inlineCitations;
                citedSources = citationResult.citedSources;

                // Track if web sources were used (for metadata)
                webSearchUsed = citedSources.some(s => s.type === 'web');

                console.log('[UserChat] Citation tool: ', inlineCitations.length, 'inline citations,', citedSources.length, 'cited sources, web:', webSearchUsed);
            } catch (citationError) {
                // Fallback: use standard generation if citation tool fails
                console.error('[UserChat] Citation tool failed, falling back:', citationError);
                response = await generateContentMultiTurn(multiTurnMessages, systemInstruction);

                // Robust fallback: parse [N] markers from the fallback text
                // This ensures citation icons appear even when function calling errors out
                if (response && sourcesForTool.length > 0) {
                    try {
                        const fallbackResult = extractCitationsFallback(response, sourcesForTool);
                        if (fallbackResult.inlineCitations.length > 0) {
                            inlineCitations = fallbackResult.inlineCitations;
                            citedSources = fallbackResult.citedSources;
                            console.log('[UserChat] Fallback parsed', inlineCitations.length, 'citations from [N] markers');
                        }
                    } catch (fallbackErr) {
                        console.error('[UserChat] Fallback citation parsing failed:', fallbackErr);
                    }
                }
            }
        } else {
            // No sources and no web search — conversational query, use standard generation
            response = await generateContentMultiTurn(multiTurnMessages, systemInstruction);
        }

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
                citedSourcesCount: citedSources.length,
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
            // Inline citations: granular text-to-source mappings (new system)
            inline_citations: inlineCitations.map(c => ({
                cited_text: c.cited_text,
                source_index: c.source_index,
                source: c.source ? {
                    title: c.source.title,
                    type: c.source.type,
                    domain: c.source.domain,
                    authority_score: c.source.authority_score,
                    url: c.source.url || null,
                    excerpt: c.source.chunk_content ? c.source.chunk_content.substring(0, 120) : null,
                } : null,
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
