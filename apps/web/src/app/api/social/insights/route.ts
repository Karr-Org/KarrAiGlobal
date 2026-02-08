/**
 * Social Insights API
 * GET — Get AI-extracted insights from chat sessions
 * POST — Process a chat session to extract insights and generate drafts
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { processSessionForInsights } from '@/lib/social/social-engine';

function getServiceSupabase() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

async function getCurrentUserId(request: Request): Promise<string | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) return user.id;
    } catch { /* cookie auth failed */ }
    const headerUserId = request.headers.get('x-user-id');
    if (headerUserId) return headerUserId;
    return null;
}

export async function GET(request: Request) {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const status = url.searchParams.get('status') || undefined;
        const limit = parseInt(url.searchParams.get('limit') || '10');

        const supabase = getServiceSupabase();
        let query = supabase
            .from('social_insights')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status) query = query.eq('status', status);

        const { data: insights, error } = await query;
        if (error) throw error;

        return NextResponse.json({ insights: insights || [] });
    } catch (error) {
        console.error('[Insights API] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sessionId } = await request.json();
        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        // Fetch chat messages for this session
        const supabase = getServiceSupabase();
        const { data: messages, error: msgError } = await supabase
            .from('chat_messages')
            .select('role, content')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .limit(50);

        if (msgError || !messages || messages.length === 0) {
            return NextResponse.json({ error: 'No messages found for this session' }, { status: 404 });
        }

        // Process through the insight pipeline
        const result = await processSessionForInsights(userId, sessionId, messages);

        if (!result) {
            return NextResponse.json({
                insight: null,
                message: 'This conversation was not content-worthy enough for a social post.',
            });
        }

        return NextResponse.json({
            insight: result.insight,
            drafts: result.drafts,
            message: `Found a great insight! Generated ${result.drafts.length} draft variants.`,
        });
    } catch (error) {
        console.error('[Insights API] Process error:', error);
        return NextResponse.json({ error: 'Failed to process session' }, { status: 500 });
    }
}
