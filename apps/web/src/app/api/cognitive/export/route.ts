/**
 * 📦 COGNITIVE DATA EXPORT API
 * 
 * Exports all cognitive data for a user as JSON.
 * Compliant with data portability requirements.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productUserId = searchParams.get('productUserId');

        if (!productUserId) {
            return NextResponse.json({ error: 'productUserId required' }, { status: 400 });
        }

        // Fetch all cognitive data in parallel
        const [
            profileResult,
            entitiesResult,
            factsResult,
            sessionsResult,
            insightsResult,
        ] = await Promise.all([
            supabase
                .from('user_cognitive_profile')
                .select('*')
                .eq('product_user_id', productUserId)
                .single(),
            supabase
                .from('user_entity_graph')
                .select('*')
                .eq('product_user_id', productUserId)
                .order('mention_count', { ascending: false }),
            supabase
                .from('memory_facts')
                .select('*')
                .eq('product_user_id', productUserId)
                .eq('is_active', true)
                .order('created_at', { ascending: false }),
            supabase
                .from('chat_sessions')
                .select('id, title, title_emoji, summary, primary_topic, key_entities, dominant_sentiment, created_at, last_message_at')
                .eq('product_user_id', productUserId)
                .order('created_at', { ascending: false }),
            supabase
                .from('proactive_insights')
                .select('*')
                .eq('product_user_id', productUserId)
                .order('created_at', { ascending: false })
                .limit(50),
        ]);

        // Build export object
        const exportData = {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            productUserId,

            profile: profileResult.data ? {
                profession: profileResult.data.profession,
                industry: profileResult.data.industry,
                personaSummary: profileResult.data.persona_summary,
                personaKeywords: profileResult.data.persona_keywords,
                domains: profileResult.data.domains,
                expertiseLevels: profileResult.data.expertise_levels,
                communicationStyle: profileResult.data.communication_style,
                preferredResponseLength: profileResult.data.preferred_response_length,
                vocabularyLevel: profileResult.data.vocabulary_level,
                activeGoals: profileResult.data.active_goals,
                completedGoals: profileResult.data.completed_goals,
                recurringChallenges: profileResult.data.recurring_challenges,
                totalSessions: profileResult.data.total_sessions,
                totalMessages: profileResult.data.total_messages,
                daysActive: profileResult.data.days_active,
                firstInteraction: profileResult.data.first_interaction_at,
                lastInteraction: profileResult.data.last_interaction_at,
            } : null,

            entities: entitiesResult.data?.map(e => ({
                name: e.entity_name,
                type: e.entity_type,
                relationship: e.relationship_to_user,
                mentions: e.mention_count,
                facts: e.key_facts,
                firstMentioned: e.first_mentioned_at,
                lastMentioned: e.last_mentioned_at,
            })) || [],

            facts: factsResult.data?.map(f => ({
                category: f.fact_category,
                subject: f.fact_subject,
                predicate: f.fact_predicate,
                object: f.fact_object,
                confidence: f.confidence,
                source: f.source,
                createdAt: f.created_at,
            })) || [],

            sessions: sessionsResult.data?.map(s => ({
                title: `${s.title_emoji || ''} ${s.title}`.trim(),
                summary: s.summary,
                topic: s.primary_topic,
                entities: s.key_entities,
                sentiment: s.dominant_sentiment,
                createdAt: s.created_at,
                lastMessageAt: s.last_message_at,
            })) || [],

            insights: insightsResult.data?.map(i => ({
                type: i.insight_type,
                title: i.title,
                description: i.description,
                priority: i.priority,
                wasShown: i.was_shown,
                createdAt: i.created_at,
            })) || [],

            summary: {
                totalEntities: entitiesResult.data?.length || 0,
                totalFacts: factsResult.data?.length || 0,
                totalSessions: sessionsResult.data?.length || 0,
                totalInsights: insightsResult.data?.length || 0,
            }
        };

        // Return as downloadable JSON
        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="cognitive-profile-export-${new Date().toISOString().split('T')[0]}.json"`,
            },
        });

    } catch (error: any) {
        console.error('[ExportAPI] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}
