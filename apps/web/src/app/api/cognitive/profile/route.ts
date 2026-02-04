/**
 * 🧬 USER COGNITIVE PROFILE API
 * 
 * Fetches and displays the complete cognitive profile for a user.
 * This shows all the intelligence the system has learned about them.
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

        // Fetch the complete cognitive profile
        const { data: profile, error: profileError } = await supabase
            .from('user_cognitive_profile')
            .select('*')
            .eq('product_user_id', productUserId)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.error('[ProfileAPI] Error:', profileError);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        // Fetch entity graph
        const { data: entities } = await supabase
            .from('user_entity_graph')
            .select('id, entity_name, entity_type, relationship_to_user, mention_count, key_facts, last_mentioned_at')
            .eq('product_user_id', productUserId)
            .order('mention_count', { ascending: false })
            .limit(20);

        // Fetch memory facts
        const { data: facts } = await supabase
            .from('memory_facts')
            .select('id, fact_category, fact_subject, fact_predicate, fact_object, confidence, created_at')
            .eq('product_user_id', productUserId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(30);

        // Fetch recent sessions summary
        const { data: sessions } = await supabase
            .from('chat_sessions')
            .select('id, title, title_emoji, primary_topic, dominant_sentiment, user_message_count, created_at')
            .eq('product_user_id', productUserId)
            .order('created_at', { ascending: false })
            .limit(10);

        // Fetch proactive insights
        const { data: insights } = await supabase
            .from('proactive_insights')
            .select('insight_type, title, description, priority, created_at, was_shown')
            .eq('product_user_id', productUserId)
            .order('created_at', { ascending: false })
            .limit(10);

        // Build a beautiful summary
        const cognitiveSnapshot = {
            profile: profile ? {
                // Identity
                profession: profile.profession,
                industry: profile.industry,
                personaSummary: profile.persona_summary,
                personaKeywords: profile.persona_keywords,

                // Expertise
                domains: profile.domains,
                expertiseLevels: profile.expertise_levels,
                learningVelocity: profile.learning_velocity,
                knowledgeGaps: profile.knowledge_gaps,

                // Communication
                communicationStyle: profile.communication_style,
                preferredResponseLength: profile.preferred_response_length,
                vocabularyLevel: profile.vocabulary_level,
                prefersStepByStep: profile.prefers_step_by_step,

                // Behavioral
                activeHours: profile.active_hours,
                peakUsageTime: profile.peak_usage_time,
                typicalSessionLength: profile.typical_session_length,

                // Emotional
                defaultSentiment: profile.default_sentiment,
                frustrationTriggers: profile.frustration_triggers,
                patienceLevel: profile.patience_level,

                // Goals & Challenges
                activeGoals: profile.active_goals,
                completedGoals: profile.completed_goals,
                recurringChallenges: profile.recurring_challenges,

                // Stats
                totalSessions: profile.total_sessions,
                totalMessages: profile.total_messages,
                daysActive: profile.days_active,
                firstInteraction: profile.first_interaction_at,
                lastInteraction: profile.last_interaction_at,
                profileConfidence: profile.profile_confidence,
            } : null,

            entities: entities?.map(e => ({
                id: e.id,
                name: e.entity_name,
                type: e.entity_type,
                relationship: e.relationship_to_user,
                mentions: e.mention_count,
                facts: e.key_facts?.slice(0, 3),
                lastMentioned: e.last_mentioned_at,
            })) || [],

            facts: facts?.map(f => ({
                id: f.id,
                category: f.fact_category,
                statement: `${f.fact_subject} ${f.fact_predicate} ${f.fact_object}`,
                confidence: f.confidence,
                learned: f.created_at,
            })) || [],

            recentSessions: sessions?.map(s => ({
                id: s.id,
                title: `${s.title_emoji || ''} ${s.title}`.trim(),
                topic: s.primary_topic,
                sentiment: s.dominant_sentiment,
                messages: s.user_message_count,
                date: s.created_at,
            })) || [],

            insights: insights?.map(i => ({
                type: i.insight_type,
                title: i.title,
                description: i.description,
                priority: i.priority,
                shown: i.was_shown,
                created: i.created_at,
            })) || [],

            summary: {
                entitiesKnown: entities?.length || 0,
                factsStored: facts?.length || 0,
                sessionsAnalyzed: sessions?.length || 0,
                insightsGenerated: insights?.length || 0,
            },
        };

        return NextResponse.json(cognitiveSnapshot);

    } catch (error: any) {
        console.error('[ProfileAPI] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}
