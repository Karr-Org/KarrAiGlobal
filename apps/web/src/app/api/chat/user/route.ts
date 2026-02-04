import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { triggerBackgroundLearning } from '@/lib/cognitive/learning-orchestrator';
import { buildAdaptiveConfig, detectEmotionalState } from '@/lib/cognitive/adaptive-intelligence';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Import world-class conversation intelligence
import {
    rewriteQuery,
    buildMultiTurnMessages,
    summarizeConversation,
    WORLD_CLASS_SYSTEM_PROMPT,
    ConversationMessage
} from '@/lib/conversation-intelligence';

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY!;
const GEMINI_EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';

async function getEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`${GEMINI_EMBED_URL}?key=${GOOGLE_AI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text }] },
        }),
    });

    const data = await response.json();
    return data.embedding?.values || [];
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
    type: 'global' | 'user' | 'context' | 'entity';
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
        const { data: globalChunks, error: globalError } = await supabase.rpc('hybrid_search', {
            query_embedding: queryEmbedding,
            query_text: query,
            p_product_id: productId,
            p_user_id: productUser.user_id,
            match_count: 5,
        });

        if (globalError) {
            console.error('hybrid_search error:', globalError);
        }

        if (globalChunks?.length > 0) {
            globalChunks.forEach((chunk: any) => {
                allChunks.push({
                    content: chunk.content,
                    similarity: chunk.similarity || 0.5,
                    title: chunk.document_title || 'Knowledge Base',
                    type: 'global',
                });
            });
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

        // Step 3: Use the world-class system prompt with adaptive additions
        let systemPrompt = taskSystemPrompt || WORLD_CLASS_SYSTEM_PROMPT;

        // Inject adaptive personalization into the system prompt
        if (adaptivePrompt) {
            systemPrompt += '\n\n' + adaptivePrompt;
        }

        // Step 4: Build multi-turn messages for native Gemini format
        const multiTurnMessages = buildMultiTurnMessages(
            conversationHistory as ConversationMessage[],
            effectiveQuery,
            systemPrompt,
            context || 'Answer based on your general knowledge.'
        );

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
                webSupplementUsed: false,
                evaluatedSources: topChunks.length,
                sourceTypes: [...new Set(topChunks.map(c => c.type))],
            },
            sources: topChunks.slice(0, 5).map(c => ({
                title: c.title,
                excerpt: c.content.substring(0, 150) + '...',
                type: c.type === 'user' ? 'private' : 'global',
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
