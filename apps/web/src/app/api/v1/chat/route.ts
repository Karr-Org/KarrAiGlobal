import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sanitizeUserInput, IDENTITY_PROTECTION_BLOCK } from '@/lib/conversation-intelligence';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY!;
const GEMINI_EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent';

// ============================================
// CORS headers for cross-origin widget access
// ============================================
function corsHeaders(origin?: string, allowedOrigins?: string[]) {
    const headers: Record<string, string> = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };

    // If no allowed origins specified, allow all (widget may be on any domain)
    if (!allowedOrigins || allowedOrigins.length === 0) {
        headers['Access-Control-Allow-Origin'] = '*';
    } else if (origin && allowedOrigins.includes(origin)) {
        // Origin matches — reflect it
        headers['Access-Control-Allow-Origin'] = origin;
        headers['Vary'] = 'Origin';
    }
    // If allowed origins are configured but origin doesn't match,
    // intentionally omit Access-Control-Allow-Origin so the browser blocks it.

    return headers;
}

// CORS preflight
export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get('origin') || undefined;
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(origin),
    });
}

// ============================================
// Helper functions
// ============================================
function hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
}

async function getEmbedding(text: string): Promise<number[]> {
    try {
        const response = await fetch(`${GEMINI_EMBED_URL}?key=${GOOGLE_AI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/gemini-embedding-001',
                content: { parts: [{ text }] },
                outputDimensionality: 768,
            }),
        });

        if (!response.ok) return [];

        const data = await response.json();
        const values = data.embedding?.values || [];
        if (values.length !== 768) return [];
        return values;
    } catch {
        return [];
    }
}

async function generateContent(
    messages: { role: string; parts: { text: string }[] }[]
): Promise<string> {
    try {
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
        if (!response.ok) return 'I apologize, but I encountered an error. Please try again.';

        const data = JSON.parse(responseText);
        if (data.candidates?.[0]?.finishReason === 'SAFETY') {
            return 'I cannot respond to this query due to safety guidelines.';
        }

        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not generate a response.';
    } catch (error: any) {
        console.error('[WidgetChat] Generation error:', error.message);
        return 'I encountered an error. Please try again.';
    }
}

// ============================================
// POST /api/v1/chat — Public Chat API
// ============================================
export async function POST(request: NextRequest) {
    const origin = request.headers.get('origin') || undefined;

    try {
        // 1. Authenticate via API key
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing API key. Use Authorization: Bearer pk_live_xxx' },
                { status: 401, headers: corsHeaders(origin) }
            );
        }

        const apiKey = authHeader.replace('Bearer ', '').trim();
        const keyHash = hashKey(apiKey);

        // Look up the key
        const { data: keyRecord, error: keyError } = await supabase
            .from('product_api_keys')
            .select('id, product_id, is_active, rate_limit_per_minute, allowed_origins, permissions, request_count')
            .eq('key_hash', keyHash)
            .single();

        if (keyError || !keyRecord) {
            return NextResponse.json(
                { error: 'Invalid API key' },
                { status: 401, headers: corsHeaders(origin) }
            );
        }

        if (!keyRecord.is_active) {
            return NextResponse.json(
                { error: 'API key has been revoked' },
                { status: 403, headers: corsHeaders(origin) }
            );
        }

        // Rate limiting enforcement
        const rateLimit = keyRecord.rate_limit_per_minute || 30; // Default 30 req/min
        const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
        const { count: recentRequests } = await supabase
            .from('widget_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('api_key_id', keyRecord.id)
            .gte('last_message_at', oneMinuteAgo);

        if ((recentRequests ?? 0) > rateLimit) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please slow down.', code: 'RATE_LIMITED' },
                { status: 429, headers: corsHeaders(origin) }
            );
        }

        // Check origin restriction
        if (keyRecord.allowed_origins?.length > 0 && origin) {
            if (!keyRecord.allowed_origins.includes(origin)) {
                return NextResponse.json(
                    { error: 'Origin not allowed for this API key' },
                    { status: 403, headers: corsHeaders(origin, keyRecord.allowed_origins) }
                );
            }
        }

        const headers = corsHeaders(origin, keyRecord.allowed_origins);
        const productId = keyRecord.product_id;

        // 2. Parse request body
        const body = await request.json();
        const { message, session_id, visitor_id, visitor_name, visitor_email } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'message is required' },
                { status: 400, headers }
            );
        }

        if (message.length > 4000) {
            return NextResponse.json(
                { error: 'Message too long (max 4000 characters)' },
                { status: 400, headers }
            );
        }

        // Sanitize input against prompt injection
        const sanitizedMessage = sanitizeUserInput(message);

        // 3. Update API key usage (fire-and-forget, non-blocking)
        supabase
            .from('product_api_keys')
            .update({
                last_used_at: new Date().toISOString(),
                // Note: This is a simple update; for high-traffic scenarios consider using an atomic SQL increment
                request_count: (keyRecord.request_count as number ?? 0) + 1,
            })
            .eq('id', keyRecord.id)
            .then(() => { }, () => { });

        // 4. Get or create widget session
        let sessionId = session_id;
        let conversationHistory: { role: string; content: string }[] = [];

        if (sessionId) {
            // Load existing session
            const { data: session } = await supabase
                .from('widget_sessions')
                .select('messages')
                .eq('id', sessionId)
                .eq('product_id', productId)
                .single();

            if (session?.messages) {
                conversationHistory = session.messages as any[];
            }
        } else {
            // Create new session
            const { data: newSession } = await supabase
                .from('widget_sessions')
                .insert({
                    product_id: productId,
                    api_key_id: keyRecord.id,
                    visitor_id: visitor_id || null,
                    visitor_name: visitor_name || null,
                    visitor_email: visitor_email || null,
                    origin_url: request.headers.get('referer') || null,
                    user_agent: request.headers.get('user-agent') || null,
                })
                .select('id')
                .single();

            sessionId = newSession?.id;
        }

        // 5. Fetch agent persona
        let persona: any = null;
        const { data: personaData } = await supabase
            .from('agent_persona')
            .select('*')
            .eq('product_id', productId)
            .single();
        persona = personaData;

        // 6. Get product info for context
        const { data: product } = await supabase
            .from('products')
            .select('name, description')
            .eq('id', productId)
            .single();

        // 7. Search knowledge base
        const queryEmbedding = await getEmbedding(message);
        let context = '';

        if (queryEmbedding.length > 0) {
            // Search global KB - use a simpler search since we don't have a user_id
            const { data: chunks } = await supabase.rpc('hybrid_search', {
                query_embedding: queryEmbedding,
                query_text: message,
                p_product_id: productId,
                p_user_id: '00000000-0000-0000-0000-000000000000', // Dummy user for global search
                match_count: 5,
            });

            if (chunks?.length > 0) {
                context = chunks
                    .map((c: any, i: number) => `[Source ${i + 1}: ${c.document_title || 'KB'}]:\n${c.content}`)
                    .join('\n\n---\n\n');
            }
        }

        // 8. Build system prompt with persona + identity protection
        let systemPrompt = `You are a helpful AI assistant for ${product?.name || 'this product'}.\n${IDENTITY_PROTECTION_BLOCK}`;

        if (persona) {
            systemPrompt = '';

            if (persona.agent_name || persona.agent_role || persona.organization_name) {
                systemPrompt += `You are ${persona.agent_name || 'an AI assistant'}`;
                if (persona.agent_role) systemPrompt += `, ${persona.agent_role}`;
                if (persona.organization_name) systemPrompt += ` at ${persona.organization_name}`;
                systemPrompt += '.\n\n';
            }

            // Inject identity protection
            systemPrompt += IDENTITY_PROTECTION_BLOCK + '\n\n';

            if (persona.tone) {
                const toneMap: Record<string, string> = {
                    professional: 'Communicate in a clear, authoritative, business-appropriate manner.',
                    friendly: 'Be warm, approachable, and conversational.',
                    casual: 'Keep it relaxed, informal, and relatable.',
                    academic: 'Be scholarly, detailed, and cite-heavy.',
                    witty: 'Be clever, engaging, with light humor where appropriate.',
                };
                systemPrompt += (toneMap[persona.tone] || '') + '\n\n';
            }

            if (persona.system_instructions) {
                systemPrompt += `## Instructions\n${persona.system_instructions}\n\n`;
            }

            if (persona.blocked_topics?.length > 0) {
                systemPrompt += `## ⛔ BLOCKED TOPICS (STRICT):\nYou MUST NEVER discuss these topics under ANY circumstances: ${persona.blocked_topics.join(', ')}.\nIf a user asks about any of these, respond ONLY with: "I'm not able to discuss that topic. Is there something else I can help you with?"\nDo NOT provide partial answers, hints, or workarounds for blocked topics.\n\n`;
            }

            if (persona.fallback_message) {
                systemPrompt += `When you cannot answer, say: "${persona.fallback_message}"\n\n`;
            }
        }

        // Add KB context rules
        if (context) {
            systemPrompt += `\n## KNOWLEDGE BASE CONTEXT (AUTHORITATIVE SOURCE):\n${context}\n\n`;
            systemPrompt += 'Prioritize answers from the Knowledge Base Context above. Cite sources as [Source N].\n';
        } else {
            systemPrompt += '\nNo specific knowledge base content was found for this query. ';
            systemPrompt += 'Answer to the best of your ability based on your instructions.\n';
        }

        systemPrompt += '\nKeep responses concise and helpful. Format with markdown when appropriate.';

        // 9. Build multi-turn messages
        const messages: { role: string; parts: { text: string }[] }[] = [];

        // Add conversation history
        let isFirst = true;
        const recentHistory = conversationHistory.slice(-8);
        for (const msg of recentHistory) {
            const role = msg.role === 'user' ? 'user' : 'model';
            const text = isFirst && role === 'user'
                ? `${systemPrompt}\n\nUser: ${msg.content}`
                : msg.content;
            messages.push({ role, parts: [{ text }] });
            isFirst = false;
        }

        // Add current message (sanitized)
        const currentText = isFirst
            ? `${systemPrompt}\n\nUser: ${sanitizedMessage}`
            : sanitizedMessage;
        messages.push({ role: 'user', parts: [{ text: currentText }] });

        // 10. Generate response
        console.log(`[WidgetChat] Product: ${product?.name} | Session: ${sessionId} | KB chunks: ${context ? 'YES' : 'NO'} | Persona: ${persona?.agent_name || 'default'}`);
        const response = await generateContent(messages);

        // 11. Save to session
        if (sessionId) {
            const updatedMessages = [
                ...conversationHistory,
                { role: 'user', content: message },
                { role: 'assistant', content: response },
            ];

            await supabase
                .from('widget_sessions')
                .update({
                    messages: updatedMessages,
                    message_count: updatedMessages.length,
                    last_message_at: new Date().toISOString(),
                })
                .eq('id', sessionId);
        }

        // 12. Return response
        return NextResponse.json(
            {
                response,
                session_id: sessionId,
                metadata: {
                    agent_name: persona?.agent_name || product?.name || 'AI Assistant',
                    has_knowledge_base: !!context,
                    sources_used: context ? context.split('---').length : 0,
                },
            },
            { headers }
        );

    } catch (error: any) {
        console.error('[WidgetChat] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders(origin) }
        );
    }
}
