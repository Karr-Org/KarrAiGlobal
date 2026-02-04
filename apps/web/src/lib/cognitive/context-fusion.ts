/**
 * KARR AI - Context Fusion Engine
 * 
 * Combines all cognitive memory layers to create rich, personalized
 * context for each AI interaction. This is the heart of the Digital Twin.
 * 
 * Layers fused:
 * 1. Working Memory (current session)
 * 2. Episodic Memory (relevant past sessions)
 * 3. User Cognitive Profile (persona, expertise, style)
 * 4. Entity Graph (people, companies they work with)
 * 5. Memory Facts (stored knowledge)
 * 6. Proactive Insights (pending reminders/suggestions)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types
export interface FusedContext {
    // User understanding
    userProfile: UserProfileContext | null;

    // Entity context
    relevantEntities: EntityContext[];

    // Memory facts
    relevantFacts: FactContext[];

    // Recent conversations
    recentSessions: SessionContext[];

    // Pending insights
    pendingInsights: InsightContext[];

    // Formatted prompt additions
    systemPromptAdditions: string;
    contextSummary: string;
}

export interface UserProfileContext {
    personaSummary: string;
    profession: string | null;
    expertiseLevels: Record<string, { level: string; confidence: number }>;
    learningVelocity: Record<string, any>;
    communicationStyle: string | null;
    preferredResponseLength: string | null;
    activeGoals: any[];
    recurringChallenges: any[];
}

export interface EntityContext {
    name: string;
    type: string;
    relationship: string | null;
    context: string | null;
    lastMentioned: string;
    mentionCount: number;
}

export interface FactContext {
    subject: string;
    predicate: string;
    object: string;
    fullText: string;
    category: string;
    confidence: number;
}

export interface SessionContext {
    id: string;
    title: string | null;
    summary: string | null;
    primaryTopic: string | null;
    lastMessageAt: string;
}

export interface InsightContext {
    id: string;
    type: string;
    title: string;
    description: string;
    priority: string;
}

/**
 * Context Fusion Engine
 */
export class ContextFusionEngine {

    /**
     * Build complete context for a user interaction
     */
    async buildContext(
        productUserId: string,
        productId: string,
        currentQuery: string,
        options: {
            includeProfile?: boolean;
            includeEntities?: boolean;
            includeFacts?: boolean;
            includeRecentSessions?: boolean;
            includeInsights?: boolean;
            maxEntities?: number;
            maxFacts?: number;
            maxSessions?: number;
        } = {}
    ): Promise<FusedContext> {
        const {
            includeProfile = true,
            includeEntities = true,
            includeFacts = true,
            includeRecentSessions = true,
            includeInsights = true,
            maxEntities = 5,
            maxFacts = 10,
            maxSessions = 3,
        } = options;

        // Parallel fetch all context layers
        const [
            userProfile,
            relevantEntities,
            relevantFacts,
            recentSessions,
            pendingInsights,
        ] = await Promise.all([
            includeProfile ? this.getUserProfile(productUserId) : null,
            includeEntities ? this.getRelevantEntities(productUserId, currentQuery, maxEntities) : [],
            includeFacts ? this.getRelevantFacts(productUserId, currentQuery, maxFacts) : [],
            includeRecentSessions ? this.getRecentSessions(productUserId, productId, maxSessions) : [],
            includeInsights ? this.getPendingInsights(productUserId) : [],
        ]);

        // Build formatted prompts
        const systemPromptAdditions = this.buildSystemPromptAdditions(
            userProfile,
            relevantEntities,
            relevantFacts
        );

        const contextSummary = this.buildContextSummary(
            userProfile,
            recentSessions,
            relevantEntities
        );

        return {
            userProfile,
            relevantEntities,
            relevantFacts,
            recentSessions,
            pendingInsights,
            systemPromptAdditions,
            contextSummary,
        };
    }

    /**
     * Get user's cognitive profile
     */
    private async getUserProfile(productUserId: string): Promise<UserProfileContext | null> {
        const { data, error } = await supabase
            .from('user_cognitive_profile')
            .select('*')
            .eq('product_user_id', productUserId)
            .single();

        if (error || !data) return null;

        return {
            personaSummary: data.persona_summary || '',
            profession: data.profession,
            expertiseLevels: data.expertise_levels || {},
            learningVelocity: data.learning_velocity || {},
            communicationStyle: data.communication_style,
            preferredResponseLength: data.preferred_response_length,
            activeGoals: data.active_goals || [],
            recurringChallenges: data.recurring_challenges || [],
        };
    }

    /**
     * Get relevant entities based on query
     */
    private async getRelevantEntities(
        productUserId: string,
        query: string,
        limit: number
    ): Promise<EntityContext[]> {
        // First, get entities by relationship strength
        const { data: topEntities } = await supabase
            .from('user_entity_graph')
            .select('*')
            .eq('product_user_id', productUserId)
            .eq('is_active', true)
            .order('relationship_strength', { ascending: false })
            .order('last_mentioned_at', { ascending: false })
            .limit(limit);

        if (!topEntities) return [];

        // Check if any entity names appear in the query
        const queryLower = query.toLowerCase();
        const mentionedInQuery = topEntities.filter(e =>
            queryLower.includes(e.entity_name_normalized)
        );

        // Prioritize entities mentioned in query
        const orderedEntities = [
            ...mentionedInQuery,
            ...topEntities.filter(e => !mentionedInQuery.includes(e)),
        ].slice(0, limit);

        return orderedEntities.map(e => ({
            name: e.entity_name,
            type: e.entity_type,
            relationship: e.relationship_to_user,
            context: e.description,
            lastMentioned: e.last_mentioned_at,
            mentionCount: e.mention_count,
        }));
    }

    /**
     * Get relevant memory facts
     */
    private async getRelevantFacts(
        productUserId: string,
        query: string,
        limit: number
    ): Promise<FactContext[]> {
        // Get high-importance active facts
        const { data: facts } = await supabase
            .from('memory_facts')
            .select('*')
            .eq('product_user_id', productUserId)
            .eq('is_active', true)
            .order('importance_score', { ascending: false })
            .order('last_reinforced_at', { ascending: false })
            .limit(limit * 2);

        if (!facts) return [];

        // Filter to most relevant based on query keywords
        const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

        const scoredFacts = facts.map(f => {
            let relevanceScore = f.importance_score;
            const factText = (f.fact_full_text || '').toLowerCase();

            queryWords.forEach(word => {
                if (factText.includes(word)) {
                    relevanceScore += 0.2;
                }
            });

            return { ...f, relevanceScore };
        });

        return scoredFacts
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit)
            .map(f => ({
                subject: f.fact_subject,
                predicate: f.fact_predicate,
                object: f.fact_object,
                fullText: f.fact_full_text,
                category: f.fact_category,
                confidence: f.confidence,
            }));
    }

    /**
     * Get recent sessions for context
     */
    private async getRecentSessions(
        productUserId: string,
        productId: string,
        limit: number
    ): Promise<SessionContext[]> {
        const { data: sessions } = await supabase
            .from('chat_sessions')
            .select('id, title, summary, primary_topic, last_message_at')
            .eq('product_user_id', productUserId)
            .eq('product_id', productId)
            .eq('is_active', true)
            .order('last_message_at', { ascending: false })
            .limit(limit + 1); // +1 to exclude current if needed

        if (!sessions) return [];

        return sessions.map(s => ({
            id: s.id,
            title: s.title,
            summary: s.summary,
            primaryTopic: s.primary_topic,
            lastMessageAt: s.last_message_at,
        }));
    }

    /**
     * Get pending proactive insights
     */
    private async getPendingInsights(productUserId: string): Promise<InsightContext[]> {
        const now = new Date().toISOString();

        const { data: insights } = await supabase
            .from('proactive_insights')
            .select('*')
            .eq('product_user_id', productUserId)
            .eq('is_active', true)
            .eq('was_shown', false)
            .or(`should_show_at.is.null,should_show_at.lte.${now}`)
            .order('priority', { ascending: false })
            .limit(3);

        if (!insights) return [];

        return insights.map(i => ({
            id: i.id,
            type: i.insight_type,
            title: i.title,
            description: i.description,
            priority: i.priority,
        }));
    }

    /**
     * Build additions to the system prompt based on user profile
     */
    private buildSystemPromptAdditions(
        profile: UserProfileContext | null,
        entities: EntityContext[],
        facts: FactContext[]
    ): string {
        const sections: string[] = [];

        // User understanding
        if (profile) {
            sections.push(`## About This User`);

            if (profile.personaSummary) {
                sections.push(profile.personaSummary);
            }

            if (profile.profession) {
                sections.push(`- Profession: ${profile.profession}`);
            }

            // Expertise levels
            const expertiseEntries = Object.entries(profile.expertiseLevels);
            if (expertiseEntries.length > 0) {
                sections.push(`- Expertise: ${expertiseEntries.map(([topic, data]) =>
                    `${topic} (${data.level})`
                ).join(', ')}`);
            }

            // Communication preferences
            if (profile.communicationStyle) {
                sections.push(`- Communication style: ${profile.communicationStyle}`);
            }
            if (profile.preferredResponseLength) {
                sections.push(`- Prefers ${profile.preferredResponseLength} responses`);
            }

            // Active goals
            if (profile.activeGoals.length > 0) {
                sections.push(`- Active goals: ${profile.activeGoals.map(g => g.goal).join('; ')}`);
            }

            // Recurring challenges
            if (profile.recurringChallenges.length > 0) {
                sections.push(`- Known challenges: ${profile.recurringChallenges.map(c => c.challenge).join('; ')}`);
            }
        }

        // Known entities
        if (entities.length > 0) {
            sections.push('');
            sections.push(`## People/Entities This User Works With`);
            entities.forEach(e => {
                sections.push(`- **${e.name}** (${e.type}${e.relationship ? `, ${e.relationship}` : ''}): ${e.context || 'No additional context'}`);
            });
        }

        // Relevant facts
        if (facts.length > 0) {
            sections.push('');
            sections.push(`## Known Facts About User's Context`);
            facts.forEach(f => {
                sections.push(`- ${f.fullText}`);
            });
        }

        return sections.join('\n');
    }

    /**
     * Build a brief context summary for the AI
     */
    private buildContextSummary(
        profile: UserProfileContext | null,
        recentSessions: SessionContext[],
        entities: EntityContext[]
    ): string {
        const parts: string[] = [];

        if (profile?.profession) {
            parts.push(`User is a ${profile.profession}`);
        }

        if (recentSessions.length > 0 && recentSessions[0].primaryTopic) {
            parts.push(`recently discussed ${recentSessions[0].primaryTopic}`);
        }

        if (entities.length > 0) {
            const topEntity = entities[0];
            parts.push(`frequently mentions ${topEntity.name} (${topEntity.relationship || topEntity.type})`);
        }

        return parts.length > 0
            ? `Context: ${parts.join(', ')}.`
            : '';
    }

    /**
     * Get personalized greeting for session start
     */
    async getPersonalizedGreeting(
        productUserId: string,
        productId: string
    ): Promise<string> {
        const context = await this.buildContext(productUserId, productId, '', {
            includeProfile: true,
            includeEntities: true,
            includeFacts: false,
            includeRecentSessions: true,
            includeInsights: true,
            maxEntities: 3,
            maxSessions: 1,
        });

        const hour = new Date().getHours();
        const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

        const parts: string[] = [timeGreeting + '!'];

        // Mention recent session if exists
        if (context.recentSessions.length > 0) {
            const lastSession = context.recentSessions[0];
            if (lastSession.primaryTopic) {
                parts.push(`Last time we discussed ${lastSession.primaryTopic}.`);
            }
        }

        // Mention pending insights
        if (context.pendingInsights.length > 0) {
            const insight = context.pendingInsights[0];
            parts.push(`I have a ${insight.type} for you: ${insight.title}`);
        }

        // Close
        parts.push('How can I help you today?');

        return parts.join(' ');
    }
}

/**
 * Create context fusion engine instance
 */
export function createContextFusion(): ContextFusionEngine {
    return new ContextFusionEngine();
}

/**
 * Quick context build for chat API
 */
export async function getQuickContext(
    productUserId: string,
    productId: string,
    query: string
): Promise<string> {
    const engine = createContextFusion();
    const context = await engine.buildContext(productUserId, productId, query, {
        maxEntities: 3,
        maxFacts: 5,
        maxSessions: 1,
    });

    return context.systemPromptAdditions;
}

export default ContextFusionEngine;
