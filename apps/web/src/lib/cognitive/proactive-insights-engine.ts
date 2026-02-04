/**
 * 🚀 REVOLUTIONARY PROACTIVE INSIGHTS ENGINE
 * 
 * THE WORLD'S FIRST "AI THAT CARES WHEN YOU'RE NOT THERE"
 * 
 * Unlike any other AI:
 * - ChatGPT: Waits for you to ask
 * - Claude: Responds only when prompted
 * - Karr AI: THINKS ABOUT YOU and anticipates your needs!
 * 
 * Insight Categories:
 * 1. 💡 CURIOSITY GAPS      - Topics you asked about but never explored deeply
 * 2. ⏰ DEADLINE AWARENESS   - Time-sensitive goals you mentioned
 * 3. 🎓 LEARNING JOURNEY    - Your progress and growth tracking
 * 4. 🔄 FOLLOW-UPS          - People and projects that need updates
 * 5. 🌱 GROWTH CELEBRATION  - Celebrating your milestones
 * 6. 😊 EMOTIONAL CARE      - Detecting struggles and offering support
 * 7. 🔮 PREDICTIVE          - Pattern-based anticipation
 * 8. 🤝 RELATIONSHIP        - Building connection over time
 * 
 * @author Karr AI - Revolutionary AI Team
 * @version 1.0 - World's First Proactive AI Engine
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Insight Types - Each represents a unique type of proactive care
export type InsightType =
    | 'curiosity_gap'      // Topics mentioned but not explored
    | 'deadline_reminder'  // Time-sensitive goals
    | 'learning_milestone' // Progress celebration  
    | 'follow_up'          // People/projects to check on
    | 'growth_celebration' // Achievement recognition
    | 'emotional_support'  // Offer help when struggling
    | 'pattern_prediction' // Anticipate based on patterns
    | 'relationship_build' // Strengthen connection
    | 'knowledge_suggestion' // Proactive learning
    | 'gentle_nudge';      // Friendly reminders

export interface ProactiveInsight {
    type: InsightType;
    title: string;
    message: string;            // The caring, personal message
    priority: 'high' | 'normal' | 'low';
    relatedEntity?: string;
    relatedGoal?: string;
    suggestedAction?: string;
    emotionalTone: 'encouraging' | 'caring' | 'celebratory' | 'supportive' | 'curious';
    showAt?: Date;              // When to show this insight
    expiresAt?: Date;           // When it becomes irrelevant
}

/**
 * 🧠 PROACTIVE INSIGHTS ENGINE
 * 
 * The brain that thinks about users when they're not there.
 */
export class ProactiveInsightsEngine {

    /**
     * 🚀 MAIN: Generate all types of proactive insights for a user
     */
    async generateInsightsForUser(
        productUserId: string,
        productId: string
    ): Promise<number> {
        console.log(`[ProactiveEngine] 🚀 Generating insights for user: ${productUserId}`);

        // Gather all context about the user
        const [profile, entities, facts, sessions, existingInsights] = await Promise.all([
            this.getUserProfile(productUserId),
            this.getUserEntities(productUserId),
            this.getUserFacts(productUserId),
            this.getRecentSessions(productUserId),
            this.getActiveInsights(productUserId),
        ]);

        console.log(`[ProactiveEngine] 📊 User data: profile=${!!profile}, entities=${entities.length}, facts=${facts.length}, sessions=${sessions.length}, existing=${existingInsights.length}`);

        const insightsToCreate: ProactiveInsight[] = [];

        // 1. 💡 CURIOSITY GAP INSIGHTS
        const curiosityInsights = await this.generateCuriosityGapInsights(entities, facts, sessions);
        console.log(`[ProactiveEngine] 💡 Curiosity: ${curiosityInsights.length} insights`);
        insightsToCreate.push(...curiosityInsights);

        // 2. ⏰ DEADLINE AWARENESS INSIGHTS
        const deadlineInsights = await this.generateDeadlineInsights(facts, profile);
        console.log(`[ProactiveEngine] ⏰ Deadline: ${deadlineInsights.length} insights`);
        insightsToCreate.push(...deadlineInsights);

        // 3. 🎓 LEARNING JOURNEY INSIGHTS  
        const learningInsights = await this.generateLearningMilestoneInsights(profile, sessions);
        console.log(`[ProactiveEngine] 🎓 Learning: ${learningInsights.length} insights`);
        insightsToCreate.push(...learningInsights);

        // 4. 🔄 FOLLOW-UP INSIGHTS
        const followUpInsights = await this.generateFollowUpInsights(entities);
        console.log(`[ProactiveEngine] 🔄 Follow-up: ${followUpInsights.length} insights`);
        insightsToCreate.push(...followUpInsights);

        // 5. 🌱 GROWTH CELEBRATION INSIGHTS
        const growthInsights = await this.generateGrowthCelebrationInsights(profile, sessions);
        console.log(`[ProactiveEngine] 🌱 Growth: ${growthInsights.length} insights`);
        insightsToCreate.push(...growthInsights);

        // 6. 😊 EMOTIONAL CARE INSIGHTS
        const emotionalInsights = await this.generateEmotionalSupportInsights(sessions, profile);
        console.log(`[ProactiveEngine] 😊 Emotional: ${emotionalInsights.length} insights`);
        insightsToCreate.push(...emotionalInsights);

        // 7. 🔮 PREDICTIVE INSIGHTS
        const predictiveInsights = await this.generatePredictiveInsights(sessions, profile);
        console.log(`[ProactiveEngine] 🔮 Predictive: ${predictiveInsights.length} insights`);
        insightsToCreate.push(...predictiveInsights);

        // 8. 🤝 RELATIONSHIP BUILDING INSIGHTS
        const relationshipInsights = await this.generateRelationshipInsights(profile, sessions);
        console.log(`[ProactiveEngine] 🤝 Relationship: ${relationshipInsights.length} insights`);
        insightsToCreate.push(...relationshipInsights);

        // 9. 📚 KNOWLEDGE SUGGESTION INSIGHTS
        const knowledgeInsights = await this.generateKnowledgeSuggestionInsights(profile, entities, facts);
        console.log(`[ProactiveEngine] 📚 Knowledge: ${knowledgeInsights.length} insights`);
        insightsToCreate.push(...knowledgeInsights);

        // 10. 🎯 GUARANTEED INSIGHT - If user has any activity, always give them something
        if (insightsToCreate.length === 0 && (sessions.length > 0 || entities.length > 0)) {
            console.log(`[ProactiveEngine] 🎯 Adding guaranteed welcome insight`);

            // Generate based on what we know about the user - ROTATE ENTITIES
            if (entities.length > 0) {
                // Pick a random entity from top 5 to keep it fresh
                const candidates = entities.slice(0, 5);
                const randomEntity = candidates[Math.floor(Math.random() * candidates.length)];

                // Varied templates
                const templates = [
                    {
                        title: `What's new with ${randomEntity.entity_name}?`,
                        message: `I'd love to hear about any updates with ${randomEntity.entity_name}! Is there anything I can help you with today? 🌟`
                    },
                    {
                        title: `Thinking about ${randomEntity.entity_name}`,
                        message: `Last time we discussed ${randomEntity.entity_name}. Do you want to continue that thought or explore something else? 💭`
                    },
                    {
                        title: `Focus on ${randomEntity.entity_name}?`,
                        message: `Should we dive deeper into ${randomEntity.entity_name} today? I'm ready when you are! 🚀`
                    }
                ];
                const template = templates[Math.floor(Math.random() * templates.length)];

                insightsToCreate.push({
                    type: 'gentle_nudge' as const,
                    title: template.title,
                    message: template.message,
                    priority: 'normal',
                    relatedEntity: randomEntity.entity_name,
                    emotionalTone: 'caring',
                    suggestedAction: `Let's talk about ${randomEntity.entity_name}`,
                });
            } else if (profile?.active_goals?.length > 0) {
                const goal = profile.active_goals[0];
                insightsToCreate.push({
                    type: 'gentle_nudge' as const,
                    title: `Ready to continue?`,
                    message: `You've been working on "${goal.goal}". Would you like to pick up where we left off? I'm here to help! 💪`,
                    priority: 'normal',
                    relatedGoal: goal.goal,
                    emotionalTone: 'encouraging',
                    suggestedAction: `Continue with ${goal.goal}`,
                });
            } else {
                // Time-based generic greeting
                const hour = new Date().getHours();
                let greeting = "Great to see you!";
                if (hour < 12) greeting = "Good morning!";
                else if (hour < 18) greeting = "Good afternoon!";
                else greeting = "Good evening!";

                insightsToCreate.push({
                    type: 'gentle_nudge' as const,
                    title: greeting,
                    message: `I'm here whenever you need me. What would you like to explore or learn about today? 🚀`,
                    priority: 'low',
                    emotionalTone: 'curious',
                    suggestedAction: `What can you help with?`,
                });
            }
        }

        console.log(`[ProactiveEngine] 📝 Total insights before filtering: ${insightsToCreate.length}`);

        // Filter out insights similar to existing ones
        // BUT keep at least one if we have nothing else
        let newInsights = this.filterExistingInsights(insightsToCreate, existingInsights);

        // If we filtered everything out but had candidates, force one through with a variation
        if (newInsights.length === 0 && insightsToCreate.length > 0) {
            const fallback = insightsToCreate[0];
            fallback.title += " (New)"; // Slight mod to bypass strict check or just rely on ID
            newInsights.push(fallback);
        }

        console.log(`[ProactiveEngine] 🔍 After filtering duplicates: ${newInsights.length}`);

        // Store in database
        const stored = await this.storeInsights(productUserId, newInsights);

        console.log(`[ProactiveEngine] ✨ Successfully stored ${stored} new caring insights!`);
        return stored;
    }

    // ============================================================================
    // 💡 CURIOSITY GAP INSIGHTS
    // "You asked about GST but never explored ITC - want me to explain?"
    // ============================================================================
    private async generateCuriosityGapInsights(
        entities: any[],
        facts: any[],
        sessions: any[]
    ): Promise<ProactiveInsight[]> {
        const insights: ProactiveInsight[] = [];

        console.log(`[CuriosityGap] Processing ${entities.length} entities`);

        // Find entities mentioned only once or twice (curiosity gaps)
        let matchCount = 0;
        for (const entity of entities) {
            const count = entity.mention_count;
            if (count <= 2 && count > 0) {
                matchCount++;
                console.log(`[CuriosityGap] Found curiosity gap: ${entity.entity_name} (mentions: ${count})`);
                insights.push({
                    type: 'curiosity_gap',
                    title: `Curious about ${entity.entity_name}?`,
                    message: `You mentioned ${entity.entity_name} briefly. Would you like to explore this more? I can help you dive deeper! 🔍`,
                    priority: 'normal',
                    relatedEntity: entity.entity_name,
                    emotionalTone: 'curious',
                    suggestedAction: `Tell me more about ${entity.entity_name}`,
                });
            }
        }
        console.log(`[CuriosityGap] Found ${matchCount} entities with mention_count <= 2`);

        // Find related concepts the user might not know about
        const knownConcepts = entities.map(e => (e.entity_name || '').toLowerCase());
        console.log(`[CuriosityGap] Known concepts:`, knownConcepts.slice(0, 5));

        // Example: If they know GST, suggest ITC
        const conceptPairs: { [key: string]: { related: string; suggestion: string } } = {
            'gst': { related: 'itc', suggestion: 'Input Tax Credit (ITC)' },
            'income tax': { related: 'tax planning', suggestion: 'Tax Planning Strategies' },
            'sales': { related: 'crm', suggestion: 'Customer Relationship Management' },
            'invoice': { related: 'gst billing', suggestion: 'GST-compliant invoicing' },
        };

        for (const [concept, { related, suggestion }] of Object.entries(conceptPairs)) {
            if (knownConcepts.includes(concept) && !knownConcepts.includes(related)) {
                console.log(`[CuriosityGap] Knowledge suggestion: knows ${concept}, suggest ${suggestion}`);
                insights.push({
                    type: 'knowledge_suggestion',
                    title: `Ready for the next step?`,
                    message: `Since you understand ${concept.toUpperCase()}, you might find ${suggestion} really useful next! Should I explain? 📚`,
                    priority: 'normal',
                    emotionalTone: 'encouraging',
                    suggestedAction: `Teach me about ${suggestion}`,
                });
            }
        }

        console.log(`[CuriosityGap] Returning ${insights.length} insights (max 2)`);
        return insights.slice(0, 2); // Max 2 curiosity insights
    }

    // ============================================================================
    // ⏰ DEADLINE AWARENESS INSIGHTS
    // "You mentioned filing GST by end of day - only 4 hours left!"
    // ============================================================================
    private async generateDeadlineInsights(
        facts: any[],
        profile: any
    ): Promise<ProactiveInsight[]> {
        const insights: ProactiveInsight[] = [];

        // Look for time-sensitive facts
        for (const fact of facts) {
            if (fact.is_temporal && fact.temporal_context) {
                const context = fact.temporal_context.toLowerCase();
                const now = new Date();

                // Check for common deadline patterns
                const urgentKeywords = ['today', 'end of day', 'tonight', 'asap', 'urgent', 'deadline'];
                const isUrgent = urgentKeywords.some(kw => context.includes(kw));

                if (isUrgent) {
                    insights.push({
                        type: 'deadline_reminder',
                        title: `⏰ Don't forget!`,
                        message: `You mentioned needing to "${fact.fact_object}" ${fact.temporal_context}. How's the progress? Need any help wrapping this up?`,
                        priority: 'high',
                        relatedGoal: fact.fact_object,
                        emotionalTone: 'supportive',
                        suggestedAction: `Help me with ${fact.fact_subject}`,
                    });
                }
            }
        }

        // Check active goals for deadlines
        const activeGoals = profile?.active_goals || [];
        for (const goal of activeGoals) {
            if (goal.deadline) {
                const deadline = new Date(goal.deadline);
                const hoursLeft = (deadline.getTime() - Date.now()) / (1000 * 60 * 60);

                if (hoursLeft > 0 && hoursLeft < 24) {
                    insights.push({
                        type: 'deadline_reminder',
                        title: `Deadline approaching!`,
                        message: `Your goal "${goal.goal}" has a deadline in ${Math.round(hoursLeft)} hours. You've got this! Need help finishing up? 💪`,
                        priority: 'high',
                        relatedGoal: goal.goal,
                        emotionalTone: 'encouraging',
                    });
                }
            }
        }

        return insights.slice(0, 2);
    }

    // ============================================================================
    // 🎓 LEARNING MILESTONE INSIGHTS
    // "Your understanding of GST has grown 40% this month!"
    // ============================================================================
    private async generateLearningMilestoneInsights(
        profile: any,
        sessions: any[]
    ): Promise<ProactiveInsight[]> {
        const insights: ProactiveInsight[] = [];

        if (!profile) return insights;

        // Track total sessions
        const totalSessions = profile.total_sessions || 0;

        // Session milestones
        const milestones = [5, 10, 25, 50, 100];
        for (const milestone of milestones) {
            if (totalSessions === milestone) {
                insights.push({
                    type: 'learning_milestone',
                    title: `🌟 ${milestone} Sessions!`,
                    message: `Wow! We've had ${milestone} learning sessions together! Your dedication to learning is inspiring. Keep up the amazing work! 🎉`,
                    priority: 'normal',
                    emotionalTone: 'celebratory',
                });
                break;
            }
        }

        // Expertise growth detection
        const expertiseLevels = profile.expertise_levels || {};
        for (const [topic, level] of Object.entries(expertiseLevels)) {
            const levelNum = level as number;
            if (levelNum >= 0.7) {
                insights.push({
                    type: 'growth_celebration',
                    title: `📈 Expert Status Unlocked!`,
                    message: `You've reached expert level in ${topic}! That's incredible progress. Ready to help others or explore advanced topics? 🏆`,
                    priority: 'normal',
                    emotionalTone: 'celebratory',
                });
            }
        }

        // Weekly learning summary
        const weekSessions = sessions.filter(s => {
            const sessionDate = new Date(s.created_at);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return sessionDate > weekAgo;
        });

        if (weekSessions.length >= 5) {
            insights.push({
                type: 'learning_milestone',
                title: `🔥 You're on fire this week!`,
                message: `${weekSessions.length} learning sessions in just 7 days! Your consistency is building something great. Proud of you! 💪`,
                priority: 'normal',
                emotionalTone: 'celebratory',
            });
        }

        return insights.slice(0, 2);
    }

    // ============================================================================
    // 🔄 FOLLOW-UP INSIGHTS
    // "It's been a week since we discussed Rahul's Bakery. Any updates?"
    // ============================================================================
    private async generateFollowUpInsights(
        entities: any[]
    ): Promise<ProactiveInsight[]> {
        const insights: ProactiveInsight[] = [];
        const now = new Date();

        for (const entity of entities) {
            if (!entity.last_mentioned_at) continue;

            const lastMentioned = new Date(entity.last_mentioned_at);
            const daysSince = (now.getTime() - lastMentioned.getTime()) / (1000 * 60 * 60 * 24);

            // People/clients: follow up after 3-7 days
            if (['person', 'client', 'customer'].includes(entity.entity_type) && daysSince >= 3 && daysSince <= 14) {
                insights.push({
                    type: 'follow_up',
                    title: `💭 Thinking of ${entity.entity_name}...`,
                    message: `It's been ${Math.round(daysSince)} days since we talked about ${entity.entity_name}. Any updates or new developments? I'm here if you need anything! 🤗`,
                    priority: daysSince > 7 ? 'normal' : 'low',
                    relatedEntity: entity.entity_name,
                    emotionalTone: 'caring',
                    suggestedAction: `Update me on ${entity.entity_name}`,
                });
            }

            // Projects/companies: follow up after 5-14 days
            if (['company', 'project', 'business'].includes(entity.entity_type) && daysSince >= 5 && daysSince <= 21) {
                insights.push({
                    type: 'follow_up',
                    title: `📋 ${entity.entity_name} update?`,
                    message: `We haven't discussed ${entity.entity_name} in ${Math.round(daysSince)} days. How's everything going with it? Need any help? 🚀`,
                    priority: 'low',
                    relatedEntity: entity.entity_name,
                    emotionalTone: 'curious',
                });
            }
        }

        return insights.slice(0, 2);
    }

    // ============================================================================
    // 🌱 GROWTH CELEBRATION INSIGHTS
    // "Congrats! You've completed your first month of learning!"
    // ============================================================================
    private async generateGrowthCelebrationInsights(
        profile: any,
        sessions: any[]
    ): Promise<ProactiveInsight[]> {
        const insights: ProactiveInsight[] = [];

        if (!profile) return insights;

        // First session celebration
        const totalSessions = profile.total_sessions || 0;
        if (totalSessions === 1) {
            insights.push({
                type: 'growth_celebration',
                title: `🎉 Welcome to the journey!`,
                message: `Congrats on your first learning session! This is the start of something amazing. I'm here whenever you need me! 🌟`,
                priority: 'high',
                emotionalTone: 'celebratory',
            });
        }

        // Streak celebrations (if they have been consistent)
        const consecutiveDays = profile.current_streak || 0;
        if (consecutiveDays >= 3) {
            insights.push({
                type: 'growth_celebration',
                title: `🔥 ${consecutiveDays}-Day Streak!`,
                message: `${consecutiveDays} days of consistent learning! You're building great habits. Keep the momentum going! 💪`,
                priority: 'normal',
                emotionalTone: 'celebratory',
            });
        }

        return insights.slice(0, 1);
    }

    // ============================================================================
    // 😊 EMOTIONAL SUPPORT INSIGHTS
    // "Yesterday was tough. Let's try a different approach today."
    // ============================================================================
    private async generateEmotionalSupportInsights(
        sessions: any[],
        profile: any
    ): Promise<ProactiveInsight[]> {
        const insights: ProactiveInsight[] = [];

        // Check recent session sentiments
        const recentSessions = sessions.slice(0, 3);
        const frustrationCount = recentSessions.filter(
            s => s.dominant_sentiment === 'frustrated' || s.dominant_sentiment === 'confused'
        ).length;

        if (frustrationCount >= 2) {
            insights.push({
                type: 'emotional_support',
                title: `I noticed something...`,
                message: `The last few sessions seemed a bit challenging. That's completely okay - learning can be tough sometimes. Want to try a different approach today? I'm here to help in whatever way works best for you 💙`,
                priority: 'high',
                emotionalTone: 'supportive',
                suggestedAction: 'Let\'s try a different approach',
            });
        }

        // Check for confusion patterns
        const confusedCount = recentSessions.filter(
            s => s.dominant_sentiment === 'confused'
        ).length;

        if (confusedCount >= 2) {
            insights.push({
                type: 'emotional_support',
                title: `Let's simplify things`,
                message: `Complex topics can be overwhelming. Would you like me to break things down step by step? Sometimes a fresh perspective helps! 🌱`,
                priority: 'normal',
                emotionalTone: 'caring',
                suggestedAction: 'Explain step by step',
            });
        }

        return insights.slice(0, 1);
    }

    // ============================================================================
    // 🔮 PREDICTIVE INSIGHTS
    // "You usually ask about taxes on Mondays. Here's something for today!"
    // ============================================================================
    private async generatePredictiveInsights(
        sessions: any[],
        profile: any
    ): Promise<ProactiveInsight[]> {
        const insights: ProactiveInsight[] = [];

        // Analyze patterns in session timing
        const dayPatterns = new Map<number, string[]>(); // day -> topics

        for (const session of sessions) {
            const date = new Date(session.created_at);
            const dayOfWeek = date.getDay();
            const topics = session.topics || [];

            const existing = dayPatterns.get(dayOfWeek) || [];
            dayPatterns.set(dayOfWeek, [...existing, ...topics]);
        }

        const today = new Date().getDay();
        const todayTopics = dayPatterns.get(today) || [];

        // Find most common topic for today
        const topicCounts = new Map<string, number>();
        for (const topic of todayTopics) {
            topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        }

        let mostCommonTopic = '';
        let maxCount = 0;
        for (const [topic, count] of topicCounts.entries()) {
            if (count > maxCount && count >= 2) {
                maxCount = count;
                mostCommonTopic = topic;
            }
        }

        if (mostCommonTopic) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            insights.push({
                type: 'pattern_prediction',
                title: `It's ${dayNames[today]}!`,
                message: `You often explore ${mostCommonTopic} topics on ${dayNames[today]}s. Ready to dive in, or shall we try something different today? 🌟`,
                priority: 'low',
                emotionalTone: 'curious',
                suggestedAction: `Learn about ${mostCommonTopic}`,
            });
        }

        return insights.slice(0, 1);
    }

    // ============================================================================
    // 🤝 RELATIONSHIP BUILDING INSIGHTS
    // "We've been learning together for 2 weeks now!"
    // ============================================================================
    private async generateRelationshipInsights(
        profile: any,
        sessions: any[]
    ): Promise<ProactiveInsight[]> {
        const insights: ProactiveInsight[] = [];

        if (!profile || sessions.length === 0) return insights;

        // Calculate time since first session
        const firstSession = sessions[sessions.length - 1];
        if (firstSession) {
            const firstDate = new Date(firstSession.created_at);
            const daysTogether = Math.floor((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

            // Celebrate relationship milestones
            const relationshipMilestones = [7, 14, 30, 60, 90, 180, 365];
            for (const milestone of relationshipMilestones) {
                if (daysTogether >= milestone && daysTogether < milestone + 3) {
                    const timeStr = milestone === 7 ? 'a week' :
                        milestone === 14 ? '2 weeks' :
                            milestone === 30 ? 'a month' :
                                milestone === 60 ? '2 months' :
                                    milestone === 90 ? '3 months' :
                                        milestone === 180 ? '6 months' :
                                            'a year';

                    insights.push({
                        type: 'relationship_build',
                        title: `🎂 ${timeStr} together!`,
                        message: `We've been learning together for ${timeStr} now! It's been a pleasure helping you grow. Here's to many more learning adventures! 🌟`,
                        priority: 'normal',
                        emotionalTone: 'celebratory',
                    });
                    break;
                }
            }
        }

        return insights;
    }

    // ============================================================================
    // 📚 KNOWLEDGE SUGGESTION INSIGHTS
    // "Based on your interests, you might enjoy learning about..."
    // ============================================================================
    private async generateKnowledgeSuggestionInsights(
        profile: any,
        entities: any[],
        facts: any[]
    ): Promise<ProactiveInsight[]> {
        const insights: ProactiveInsight[] = [];

        // Get user's main topics of interest from entities
        const topicCounts = new Map<string, number>();
        for (const entity of entities) {
            const type = entity.entity_type;
            topicCounts.set(type, (topicCounts.get(type) || 0) + entity.mention_count);
        }

        // Find dominant interest area
        let dominantArea = '';
        let maxMentions = 0;
        for (const [type, count] of topicCounts.entries()) {
            if (count > maxMentions) {
                maxMentions = count;
                dominantArea = type;
            }
        }

        // Suggest related advanced topics
        const advancedSuggestions: { [key: string]: string } = {
            'tax': 'tax optimization strategies',
            'finance': 'financial planning frameworks',
            'business': 'business growth strategies',
            'legal': 'compliance best practices',
            'marketing': 'digital marketing trends',
        };

        if (dominantArea && advancedSuggestions[dominantArea]) {
            insights.push({
                type: 'knowledge_suggestion',
                title: `📈 Level up your knowledge!`,
                message: `You're doing great with ${dominantArea} topics! Ready to explore ${advancedSuggestions[dominantArea]}? It could be a game-changer! 🚀`,
                priority: 'low',
                emotionalTone: 'encouraging',
                suggestedAction: `Teach me about ${advancedSuggestions[dominantArea]}`,
            });
        }

        return insights;
    }

    // ============================================================================
    // 🔧 HELPER FUNCTIONS
    // ============================================================================

    private async getUserProfile(productUserId: string): Promise<any> {
        const { data } = await supabase
            .from('user_cognitive_profile')
            .select('*')
            .eq('product_user_id', productUserId)
            .single();
        return data;
    }

    private async getUserEntities(productUserId: string): Promise<any[]> {
        const { data } = await supabase
            .from('user_entity_graph')
            .select('*')
            .eq('product_user_id', productUserId)
            .order('last_mentioned_at', { ascending: false })
            .limit(20);
        return data || [];
    }

    private async getUserFacts(productUserId: string): Promise<any[]> {
        const { data } = await supabase
            .from('memory_facts')
            .select('*')
            .eq('product_user_id', productUserId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(50);
        return data || [];
    }

    private async getRecentSessions(productUserId: string): Promise<any[]> {
        const { data } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('product_user_id', productUserId)
            .order('created_at', { ascending: false })
            .limit(20);
        return data || [];
    }

    private async getActiveInsights(productUserId: string): Promise<any[]> {
        const { data } = await supabase
            .from('proactive_insights')
            .select('title, insight_type')
            .eq('product_user_id', productUserId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(20);
        return data || [];
    }

    private filterExistingInsights(
        newInsights: ProactiveInsight[],
        existing: any[]
    ): ProactiveInsight[] {
        const existingTitles = new Set(existing.map(i => i.title.toLowerCase()));
        return newInsights.filter(i => !existingTitles.has(i.title.toLowerCase()));
    }

    private async storeInsights(
        productUserId: string,
        insights: ProactiveInsight[]
    ): Promise<number> {
        let stored = 0;
        console.log(`[ProactiveEngine] 💾 Storing ${insights.length} insights...`);

        for (const insight of insights) {
            try {
                console.log(`[ProactiveEngine] Inserting: ${insight.title}`);

                // Build insert data matching actual table schema
                const insertData: any = {
                    product_user_id: productUserId,
                    insight_type: insight.type,
                    insight_category: insight.emotionalTone,
                    title: insight.title,
                    description: insight.message,
                    trigger_type: 'proactive_engine',
                    priority: insight.priority,
                    show_context: 'session_start',
                    expires_at: insight.expiresAt?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                };

                // Add optional fields if present
                if (insight.relatedEntity) {
                    insertData.related_entities = [{ name: insight.relatedEntity }];
                }
                if (insight.relatedGoal) {
                    insertData.related_topics = [insight.relatedGoal];
                }
                if (insight.showAt) {
                    insertData.should_show_at = insight.showAt.toISOString();
                }
                // Store suggested action in relevance_explanation since we don't have action_* columns
                if (insight.suggestedAction) {
                    insertData.relevance_explanation = `Suggested action: ${insight.suggestedAction}`;
                }

                const { error } = await supabase
                    .from('proactive_insights')
                    .insert(insertData);

                if (error) {
                    console.error(`[ProactiveEngine] ❌ Insert error for "${insight.title}":`, error.message);
                } else {
                    stored++;
                    console.log(`[ProactiveEngine] ✅ Stored: ${insight.title}`);
                }
            } catch (err: any) {
                console.error('[ProactiveEngine] ❌ Exception storing insight:', err.message);
            }
        }

        return stored;
    }
}

/**
 * Factory function to create engine instance
 */
export function createProactiveInsightsEngine(): ProactiveInsightsEngine {
    return new ProactiveInsightsEngine();
}

/**
 * 🚀 TRIGGER PROACTIVE INSIGHTS GENERATION
 * 
 * Call this after chat sessions or on scheduled basis
 */
export async function generateProactiveInsightsForUser(
    productUserId: string,
    productId: string
): Promise<number> {
    const engine = createProactiveInsightsEngine();
    return engine.generateInsightsForUser(productUserId, productId);
}

export default ProactiveInsightsEngine;
