/**
 * 💡 INSIGHT DISMISS API
 * 
 * Marks an insight as dismissed/shown.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { insightId, wasHelpful, wasActedUpon } = body;

        if (!insightId) {
            return NextResponse.json({ error: 'insightId required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('proactive_insights')
            .update({
                was_shown: true,
                shown_at: new Date().toISOString(),
                was_dismissed: true,
                was_helpful: wasHelpful,
                was_acted_upon: wasActedUpon,
            })
            .eq('id', insightId);

        if (error) {
            console.error('[InsightDismissAPI] Error:', error);
            return NextResponse.json({ error: 'Failed to dismiss' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[InsightDismissAPI] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}
