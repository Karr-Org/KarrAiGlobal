/**
 * 🚀 PROACTIVE INSIGHTS GENERATION API
 * 
 * Manual trigger for the Revolutionary Proactive Insights Engine.
 * Can be called:
 * - Manually for testing
 * - By scheduled jobs (e.g., daily cron)
 * - After significant user activity
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateProactiveInsightsForUser } from '@/lib/cognitive/proactive-insights-engine';

export async function POST(request: NextRequest) {
    try {
        const { productUserId, productId } = await request.json();

        if (!productUserId) {
            return NextResponse.json(
                { error: 'productUserId is required' },
                { status: 400 }
            );
        }

        console.log(`[InsightsGenerator] 🚀 Generating insights for user: ${productUserId}`);

        const insightsGenerated = await generateProactiveInsightsForUser(
            productUserId,
            productId || ''
        );

        console.log(`[InsightsGenerator] ✨ Generated ${insightsGenerated} caring insights!`);

        return NextResponse.json({
            success: true,
            insightsGenerated,
            message: `Generated ${insightsGenerated} proactive insights for user`,
        });

    } catch (error: any) {
        console.error('[InsightsGenerator] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate insights' },
            { status: 500 }
        );
    }
}

// GET to check status / health
export async function GET(request: NextRequest) {
    return NextResponse.json({
        status: 'ready',
        engine: 'Revolutionary Proactive Insights Engine',
        version: '1.0',
        capabilities: [
            'curiosity_gap',
            'deadline_reminder',
            'learning_milestone',
            'follow_up',
            'growth_celebration',
            'emotional_support',
            'pattern_prediction',
            'relationship_build',
            'knowledge_suggestion',
        ],
        description: "The world's first AI that thinks about you when you're not there",
    });
}
