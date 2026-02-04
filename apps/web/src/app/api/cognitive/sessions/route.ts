/**
 * KARR AI - Sessions API
 * 
 * Endpoints for managing chat sessions:
 * GET  - List user sessions
 * POST - Create new session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSessionManager } from '@/lib/cognitive/session-manager';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/cognitive/sessions
 * List sessions for a user
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productUserId = searchParams.get('productUserId');
        const productId = searchParams.get('productId');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const search = searchParams.get('search');
        const includeArchived = searchParams.get('includeArchived') === 'true';

        if (!productUserId || !productId) {
            return NextResponse.json(
                { error: 'productUserId and productId are required' },
                { status: 400 }
            );
        }

        const sessionManager = createSessionManager();

        if (search) {
            // Search sessions
            const sessions = await sessionManager.searchSessions(
                productUserId,
                productId,
                search
            );
            return NextResponse.json({ sessions, total: sessions.length });
        }

        // List sessions with pagination
        const sessions = await sessionManager.getUserSessions(
            productUserId,
            productId,
            { limit, offset, includeArchived }
        );

        // Get total count
        const { count } = await supabase
            .from('chat_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('product_user_id', productUserId)
            .eq('product_id', productId)
            .eq('is_active', !includeArchived);

        // Group sessions by date for UI
        const groupedSessions = groupSessionsByDate(sessions);

        return NextResponse.json({
            sessions,
            groupedSessions,
            total: count || 0,
            limit,
            offset,
        });
    } catch (error) {
        console.error('[Sessions API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sessions' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/cognitive/sessions
 * Create a new session or get active one
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { productUserId, productId, forceNew } = body;

        if (!productUserId || !productId) {
            return NextResponse.json(
                { error: 'productUserId and productId are required' },
                { status: 400 }
            );
        }

        const sessionManager = createSessionManager();

        let session;
        if (forceNew) {
            // Always create a new session
            session = await sessionManager.createSession({
                product_user_id: productUserId,
                product_id: productId,
            });
        } else {
            // Get existing active session or create new
            session = await sessionManager.getOrCreateActiveSession(
                productUserId,
                productId,
                30 // 30 minutes idle threshold
            );
        }

        if (!session) {
            return NextResponse.json(
                { error: 'Failed to create session' },
                { status: 500 }
            );
        }

        return NextResponse.json({ session });
    } catch (error) {
        console.error('[Sessions API] Error creating session:', error);
        return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
        );
    }
}

/**
 * Group sessions by date for UI display
 */
function groupSessionsByDate(sessions: any[]): Record<string, any[]> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups: Record<string, any[]> = {
        pinned: [],
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
        older: [],
    };

    sessions.forEach(session => {
        const sessionDate = new Date(session.last_message_at);

        if (session.is_pinned) {
            groups.pinned.push(session);
        } else if (sessionDate >= today) {
            groups.today.push(session);
        } else if (sessionDate >= yesterday) {
            groups.yesterday.push(session);
        } else if (sessionDate >= lastWeek) {
            groups.lastWeek.push(session);
        } else if (sessionDate >= lastMonth) {
            groups.lastMonth.push(session);
        } else {
            groups.older.push(session);
        }
    });

    // Remove empty groups
    return Object.fromEntries(
        Object.entries(groups).filter(([_, sessions]) => sessions.length > 0)
    );
}
