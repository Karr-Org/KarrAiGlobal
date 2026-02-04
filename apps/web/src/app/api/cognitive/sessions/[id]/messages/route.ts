/**
 * KARR AI - Session Messages API
 * 
 * Endpoints for managing messages within a session:
 * GET  - Get all messages in a session
 * POST - Add a new message to a session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSessionManager } from '@/lib/cognitive/session-manager';
import { quickGenerateTitle } from '@/lib/cognitive/intelligence-extractor';

/**
 * GET /api/cognitive/sessions/[id]/messages
 * Get all messages in a session
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const sessionId = params.id;

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        const sessionManager = createSessionManager();
        const result = await sessionManager.getSessionWithMessages(sessionId);

        if (!result) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ messages: result.messages });
    } catch (error) {
        console.error('[Messages API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/cognitive/sessions/[id]/messages
 * Add a new message to a session
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const sessionId = params.id;
        const body = await request.json();

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        const {
            role,
            content,
            originalQuery,
            rewrittenQuery,
            queryRewriteReason,
            sources,
            confidence,
            reasoningData,
            reasoningDurationMs,
            cragVerdict,
            cragConfidence,
            entitiesMentioned,
            sentiment,
            sentimentScore,
        } = body;

        if (!role || !content) {
            return NextResponse.json(
                { error: 'role and content are required' },
                { status: 400 }
            );
        }

        const sessionManager = createSessionManager();

        // Add the message
        const message = await sessionManager.addMessage({
            session_id: sessionId,
            role,
            content,
            original_query: originalQuery,
            rewritten_query: rewrittenQuery,
            query_rewrite_reason: queryRewriteReason,
            sources,
            confidence,
            reasoning_data: reasoningData,
            reasoning_duration_ms: reasoningDurationMs,
            crag_verdict: cragVerdict,
            crag_confidence: cragConfidence,
            entities_mentioned: entitiesMentioned,
            sentiment,
            sentiment_score: sentimentScore,
        });

        if (!message) {
            return NextResponse.json(
                { error: 'Failed to add message' },
                { status: 500 }
            );
        }

        // Check if we should generate a title
        // (After 3 messages and no title yet)
        const result = await sessionManager.getSessionWithMessages(sessionId);

        if (result && result.messages.length >= 3 && !result.session.title) {
            // Generate quick title in background
            generateTitleAsync(sessionId, result.messages, sessionManager);
        }

        return NextResponse.json({ message });
    } catch (error) {
        console.error('[Messages API] Error adding message:', error);
        return NextResponse.json(
            { error: 'Failed to add message' },
            { status: 500 }
        );
    }
}

/**
 * Generate title asynchronously (don't block the response)
 */
async function generateTitleAsync(
    sessionId: string,
    messages: any[],
    sessionManager: any
) {
    try {
        // Get first user message and first assistant response
        const userMsg = messages.find(m => m.role === 'user');
        const assistantMsg = messages.find(m => m.role === 'assistant');

        if (userMsg && assistantMsg) {
            const { title, emoji } = await quickGenerateTitle(
                userMsg.content,
                assistantMsg.content
            );

            await sessionManager.updateSessionMetadata(sessionId, {
                title,
                title_emoji: emoji,
            });

            console.log(`[Messages API] Generated title for session ${sessionId}: ${emoji} ${title}`);
        }
    } catch (error) {
        console.error('[Messages API] Error generating title:', error);
    }
}
