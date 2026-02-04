/**
 * KARR AI - Single Session API
 * 
 * Endpoints for managing a specific session:
 * GET    - Get session with messages
 * PATCH  - Update session (star, pin, archive)
 * DELETE - Delete session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSessionManager } from '@/lib/cognitive/session-manager';
import { extractFullIntelligence } from '@/lib/cognitive/intelligence-extractor';

/**
 * GET /api/cognitive/sessions/[id]
 * Get a session with all its messages
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

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Session API] Error fetching session:', error);
        return NextResponse.json(
            { error: 'Failed to fetch session' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/cognitive/sessions/[id]
 * Update session properties
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const sessionId = params.id;
        const body = await request.json();
        const { action, ...metadata } = body;

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        const sessionManager = createSessionManager();
        let success = false;

        switch (action) {
            case 'star':
                success = await sessionManager.toggleSessionStar(sessionId);
                break;
            case 'pin':
                success = await sessionManager.toggleSessionPin(sessionId);
                break;
            case 'archive':
                success = await sessionManager.archiveSession(sessionId, metadata.reason);
                break;
            case 'extract':
                // Extract intelligence from session
                const result = await sessionManager.getSessionWithMessages(sessionId);
                if (result && result.messages.length >= 2) {
                    const intelligence = await extractFullIntelligence(result.messages);
                    success = await sessionManager.updateSessionMetadata(sessionId, {
                        title: intelligence.session.title,
                        title_emoji: intelligence.session.titleEmoji,
                        summary: intelligence.session.summary,
                        topics: intelligence.session.topics,
                        primary_topic: intelligence.session.primaryTopic,
                        entities_mentioned: intelligence.entities,
                        dominant_sentiment: intelligence.emotional.dominantSentiment,
                        resolution_status: intelligence.emotional.resolutionStatus,
                        user_insights: intelligence.userInsights,
                    });
                    return NextResponse.json({ success, intelligence });
                }
                break;
            case 'update':
                // General metadata update
                success = await sessionManager.updateSessionMetadata(sessionId, metadata);
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }

        return NextResponse.json({ success });
    } catch (error) {
        console.error('[Session API] Error updating session:', error);
        return NextResponse.json(
            { error: 'Failed to update session' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/cognitive/sessions/[id]
 * Delete a session and all its messages
 */
export async function DELETE(
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
        const success = await sessionManager.deleteSession(sessionId);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to delete session' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Session API] Error deleting session:', error);
        return NextResponse.json(
            { error: 'Failed to delete session' },
            { status: 500 }
        );
    }
}
