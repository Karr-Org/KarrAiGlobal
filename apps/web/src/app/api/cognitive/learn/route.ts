/**
 * 🧠 KARR AI - Cognitive Learning API
 * 
 * Endpoint to trigger background intelligence extraction and learning.
 * This is called after chat messages to process the session.
 * 
 * Features:
 * - Background processing (non-blocking)
 * - Full intelligence extraction
 * - Entity graph building
 * - Memory facts storage
 * - User profile learning
 * - Proactive insights generation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    createLearningOrchestrator,
    type LearningResult,
} from '@/lib/cognitive/learning-orchestrator';
import type { ChatMessage } from '@/lib/cognitive/session-manager';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            sessionId,
            productUserId,
            productId,
            messages,
            mode = 'full', // 'full' or 'quick'
        } = body;

        // Validate required fields
        if (!sessionId || !productUserId || !productId || !messages) {
            return NextResponse.json(
                { error: 'Missing required fields: sessionId, productUserId, productId, messages' },
                { status: 400 }
            );
        }

        console.log(`[CognitiveLearningAPI] Processing ${mode} learning for session ${sessionId}`);

        const orchestrator = createLearningOrchestrator();

        if (mode === 'quick') {
            // Quick learning - lightweight, fast
            await orchestrator.quickLearn(sessionId, productUserId, messages as ChatMessage[]);
            return NextResponse.json({
                success: true,
                mode: 'quick',
                message: 'Quick learning completed',
            });
        }

        // Full learning - comprehensive extraction
        const result: LearningResult = await orchestrator.processSessionLearning(
            sessionId,
            productUserId,
            productId,
            messages as ChatMessage[]
        );

        return NextResponse.json({
            success: result.success,
            mode: 'full',
            result: {
                titleGenerated: result.titleGenerated,
                entitiesExtracted: result.entitiesExtracted,
                factsStored: result.factsStored,
                profileUpdated: result.profileUpdated,
                insightsGenerated: result.insightsGenerated,
                processingTimeMs: result.processingTimeMs,
            },
            errors: result.errors,
        });

    } catch (error: any) {
        console.error('[CognitiveLearningAPI] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET endpoint to check learning status for a session
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
        return NextResponse.json(
            { error: 'Missing sessionId parameter' },
            { status: 400 }
        );
    }

    // Could implement status tracking here if needed
    return NextResponse.json({
        status: 'ready',
        message: 'Learning API is available',
    });
}
