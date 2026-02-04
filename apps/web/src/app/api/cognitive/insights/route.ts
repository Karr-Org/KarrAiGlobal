/**
 * 💡 PROACTIVE INSIGHTS API
 * 
 * Fetches and manages proactive insights for users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateWelcomeMessage, buildProactiveElements } from '@/lib/cognitive/adaptive-intelligence';
import { createContextFusion } from '@/lib/cognitive/context-fusion';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productUserId = searchParams.get('productUserId');
        const productId = searchParams.get('productId');
        const includeWelcome = searchParams.get('includeWelcome') === 'true';

        if (!productUserId) {
            return NextResponse.json({ error: 'productUserId required' }, { status: 400 });
        }

        // Fetch pending insights from database
        const { data: dbInsights, error } = await supabase
            .from('proactive_insights')
            .select('*')
            .eq('product_user_id', productUserId)
            .eq('is_active', true)
            .eq('was_shown', false)
            .or(`should_show_at.is.null,should_show_at.lte.${new Date().toISOString()}`)
            .order('priority', { ascending: false })
            .limit(5);

        if (error) {
            console.error('[InsightsAPI] Error fetching insights:', error);
            return NextResponse.json({ insights: [] });
        }

        // Transform to client format
        const insights = (dbInsights || []).map(i => ({
            id: i.id,
            type: i.insight_type,
            title: i.title,
            content: i.description,
            relevance: i.priority === 'high' ? 'high' : i.priority === 'normal' ? 'medium' : 'low',
            actionable: true,
            relatedTo: i.related_entities?.[0]?.name,
        }));

        // Optionally include welcome message
        let welcomeMessage = null;
        if (includeWelcome && productId) {
            try {
                console.log('[InsightsAPI] Generating welcome message for:', productUserId, productId);
                const welcomeData = await generateWelcomeMessage(productUserId, productId);
                console.log('[InsightsAPI] Welcome data received:', JSON.stringify(welcomeData).substring(0, 200));

                // Transform to dashboard-expected format - keep it clean
                welcomeMessage = {
                    greeting: welcomeData.greeting,
                    message: '', // No longer used
                    suggestions: welcomeData.quickActions.map(action => ({
                        label: action.length > 25 ? action.substring(0, 22) + '...' : action,
                        action: action,
                    })),
                };
            } catch (welcomeError: any) {
                console.error('[InsightsAPI] Welcome message generation failed:', welcomeError);
                // Provide fallback welcome message
                const hour = new Date().getHours();
                const timeGreeting = hour < 12 ? 'Good morning! ☀️' : hour < 17 ? 'Good afternoon! 👋' : 'Good evening! 🌙';
                welcomeMessage = {
                    greeting: timeGreeting,
                    message: 'How can I help you today?',
                    suggestions: [
                        { label: 'Ask a question', action: 'What can you help me with?' },
                        { label: 'Explore topics', action: 'What topics do you know about?' },
                    ],
                };
            }
        }

        return NextResponse.json({
            insights,
            welcomeMessage,
            count: insights.length,
        });

    } catch (error: any) {
        console.error('[InsightsAPI] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}
