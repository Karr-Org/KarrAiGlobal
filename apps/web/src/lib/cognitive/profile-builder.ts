/**
 * KARR AI - Profile Builder
 * 
 * Builds and maintains the User Cognitive Profile - the digital DNA
 * of each user. Updates based on extracted insights from conversations.
 * 
 * This is what makes the AI truly "know" the user over time.
 */

import { createClient } from '@supabase/supabase-js';
import type {
    ExpertiseSignal,
    CommunicationSignal,
    DetectedGoal,
    DetectedChallenge
} from './intelligence-extractor';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types
export interface CognitiveProfile {
    id: string;
    productUserId: string;
    productId: string;

    // Identity
    personaSummary: string | null;
    personaKeywords: string[];
    profession: string | null;
    industry: string | null;
    organizationType: string | null;

    // Expertise
    domains: string[];
    expertiseLevels: Record<string, { level: string; confidence: number }>;
    expertiseEvolution: any[];
    knowledgeGaps: string[];
    learningVelocity: Record<string, number>;

    // Goals & Challenges
    activeGoals: Goal[];
    completedGoals: Goal[];
    recurringChallenges: Challenge[];
    currentProjects: string[];

    // Communication Style
    communicationStyle: string | null;
    preferredResponseLength: string | null;
    preferredFormatting: Record<string, boolean>;
    vocabularyLevel: string | null;
    preferredExamplesType: string | null;
    asksFollowupQuestions: boolean;
    prefersStepByStep: boolean;

    // Behavioral Patterns
    commonQuestionPatterns: string[];
    queryComplexityAvg: number | null;
    typicalSessionLength: number | null;
    typicalSessionDuration: number | null;
    peakUsageTime: string | null;

    // Emotional Profile
    defaultSentiment: string | null;
    frustrationTriggers: string[];
    satisfactionSignals: string[];
    patienceLevel: string | null;
    handlesComplexity: string | null;

    // Stats
    totalSessions: number;
    totalMessages: number;
    firstInteractionAt: string | null;
    lastInteractionAt: string | null;
    daysActive: number;

    // Meta
    profileConfidence: number;
    lastProfileUpdate: string | null;
}

export interface Goal {
    goal: string;
    type: 'immediate' | 'ongoing' | 'learning';
    status: 'active' | 'completed' | 'blocked';
    startedAt?: string;
    completedAt?: string;
    progress?: number;
}

export interface Challenge {
    challenge: string;
    frequency: 'one_time' | 'recurring';
    firstSeen?: string;
    lastSeen?: string;
    occurrences?: number;
}

/**
 * Profile Builder Class
 */
export class ProfileBuilder {

    /**
     * Get or create a cognitive profile for a user
     */
    async getOrCreateProfile(
        productUserId: string,
        productId: string
    ): Promise<CognitiveProfile | null> {
        // Try to get existing profile
        const { data: existing } = await supabase
            .from('user_cognitive_profile')
            .select('*')
            .eq('product_user_id', productUserId)
            .single();

        if (existing) {
            return this.mapDbToProfile(existing);
        }

        // Create new profile
        const { data: newProfile, error } = await supabase
            .from('user_cognitive_profile')
            .insert({
                product_user_id: productUserId,
                product_id: productId,
                first_interaction_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('[ProfileBuilder] Error creating profile:', error);
            return null;
        }

        return this.mapDbToProfile(newProfile);
    }

    /**
     * Update profile with new expertise signals
     */
    async updateExpertise(
        productUserId: string,
        signals: ExpertiseSignal[]
    ): Promise<boolean> {
        const profile = await this.getProfile(productUserId);
        if (!profile) return false;

        const currentLevels = profile.expertise_levels || {};
        const currentDomains = new Set(profile.domains || []);
        const learningVelocity = profile.learning_velocity || {};
        const expertiseEvolution = profile.expertise_evolution || [];
        const now = new Date().toISOString();

        signals.forEach(signal => {
            // Add domain if new
            currentDomains.add(signal.topic);

            // Update expertise level (weighted average with new signal)
            const existing = currentLevels[signal.topic];
            const levelHierarchy = ['beginner', 'intermediate', 'advanced', 'expert'];

            if (existing) {
                // Average the confidence levels
                const existingIdx = levelHierarchy.indexOf(existing.level);
                const newIdx = levelHierarchy.indexOf(signal.level);

                // Track level change for velocity calculation
                if (newIdx > existingIdx && signal.confidence > 0.7) {
                    // User leveled up! 🎉 Track this for learning velocity
                    const topicVelocity = learningVelocity[signal.topic] || {
                        levelChanges: [],
                        averageTimePerLevel: null,
                        currentStreak: 0,
                    };

                    topicVelocity.levelChanges.push({
                        from: existing.level,
                        to: signal.level,
                        timestamp: now,
                        sessionsToLevel: profile.total_sessions || 1,
                    });

                    // Calculate average time per level
                    if (topicVelocity.levelChanges.length >= 2) {
                        const changes = topicVelocity.levelChanges;
                        const firstChange = new Date(changes[0].timestamp);
                        const lastChange = new Date(changes[changes.length - 1].timestamp);
                        const daysDiff = (lastChange.getTime() - firstChange.getTime()) / (1000 * 60 * 60 * 24);
                        topicVelocity.averageTimePerLevel = Math.round(daysDiff / changes.length);
                    }

                    topicVelocity.currentStreak++;
                    learningVelocity[signal.topic] = topicVelocity;

                    // Track expertise evolution history
                    expertiseEvolution.push({
                        topic: signal.topic,
                        fromLevel: existing.level,
                        toLevel: signal.level,
                        timestamp: now,
                        confidence: signal.confidence,
                    });

                    currentLevels[signal.topic] = {
                        level: signal.level,
                        confidence: (existing.confidence + signal.confidence) / 2,
                        lastUpdated: now,
                    };
                } else {
                    currentLevels[signal.topic].confidence =
                        Math.min(1, existing.confidence + 0.1); // Reinforce
                    currentLevels[signal.topic].lastUpdated = now;
                }
            } else {
                // New topic - start tracking
                currentLevels[signal.topic] = {
                    level: signal.level,
                    confidence: signal.confidence,
                    firstSeen: now,
                    lastUpdated: now,
                };

                // Initialize velocity tracking for new topic
                learningVelocity[signal.topic] = {
                    levelChanges: [{
                        from: 'none',
                        to: signal.level,
                        timestamp: now,
                        sessionsToLevel: 1,
                    }],
                    averageTimePerLevel: null,
                    currentStreak: 1,
                    startedAt: now,
                };
            }
        });

        return this.updateProfile(productUserId, {
            domains: Array.from(currentDomains),
            expertise_levels: currentLevels,
            learning_velocity: learningVelocity,
            expertise_evolution: expertiseEvolution.slice(-50), // Keep last 50 changes
        });
    }

    /**
     * Update profile with communication preferences
     */
    async updateCommunicationStyle(
        productUserId: string,
        signals: CommunicationSignal[]
    ): Promise<boolean> {
        const profile = await this.getProfile(productUserId);
        if (!profile) return false;

        const updates: Record<string, any> = {};

        signals.forEach(signal => {
            if (signal.confidence < 0.6) return; // Skip low confidence

            switch (signal.preference) {
                case 'prefers_examples':
                    updates.preferred_examples_type = 'practical';
                    break;
                case 'prefers_detailed':
                    updates.preferred_response_length = 'comprehensive';
                    break;
                case 'prefers_concise':
                    updates.preferred_response_length = 'brief';
                    break;
                case 'prefers_step_by_step':
                    updates.prefers_step_by_step = true;
                    break;
                case 'prefers_technical':
                    updates.vocabulary_level = 'advanced';
                    break;
                case 'prefers_simple':
                    updates.vocabulary_level = 'basic';
                    break;
                case 'asks_followups':
                    updates.asks_followup_questions = true;
                    break;
            }
        });

        if (Object.keys(updates).length === 0) return true;

        return this.updateProfile(productUserId, updates);
    }

    /**
     * Update profile with detected goals
     */
    async updateGoals(
        productUserId: string,
        detectedGoals: DetectedGoal[]
    ): Promise<boolean> {
        const profile = await this.getProfile(productUserId);
        if (!profile) return false;

        const activeGoals = profile.active_goals || [];
        const completedGoals = profile.completed_goals || [];
        const now = new Date().toISOString();

        detectedGoals.forEach(detected => {
            const existingIdx = activeGoals.findIndex(
                (g: Goal) => g.goal.toLowerCase().includes(detected.goal.toLowerCase().slice(0, 20))
            );

            if (existingIdx >= 0) {
                // Update existing goal
                activeGoals[existingIdx].status = detected.status;
                if (detected.status === 'completed') {
                    const completed = activeGoals.splice(existingIdx, 1)[0];
                    completed.completedAt = now;
                    completedGoals.push(completed);
                }
            } else {
                // Add new goal
                activeGoals.push({
                    goal: detected.goal,
                    type: detected.type,
                    status: detected.status,
                    startedAt: now,
                });
            }
        });

        return this.updateProfile(productUserId, {
            active_goals: activeGoals,
            completed_goals: completedGoals,
        });
    }

    /**
     * Update profile with detected challenges
     */
    async updateChallenges(
        productUserId: string,
        detectedChallenges: DetectedChallenge[]
    ): Promise<boolean> {
        const profile = await this.getProfile(productUserId);
        if (!profile) return false;

        const challenges = profile.recurring_challenges || [];
        const now = new Date().toISOString();

        detectedChallenges.forEach(detected => {
            const existingIdx = challenges.findIndex(
                (c: Challenge) => c.challenge.toLowerCase().includes(detected.challenge.toLowerCase().slice(0, 20))
            );

            if (existingIdx >= 0) {
                // Update existing challenge
                challenges[existingIdx].lastSeen = now;
                challenges[existingIdx].occurrences =
                    (challenges[existingIdx].occurrences || 1) + 1;
                if (detected.frequency === 'recurring') {
                    challenges[existingIdx].frequency = 'recurring';
                }
            } else {
                // Add new challenge
                challenges.push({
                    challenge: detected.challenge,
                    frequency: detected.frequency,
                    firstSeen: now,
                    lastSeen: now,
                    occurrences: 1,
                });
            }
        });

        return this.updateProfile(productUserId, {
            recurring_challenges: challenges,
        });
    }

    /**
     * Update session statistics
     */
    async updateSessionStats(
        productUserId: string,
        sessionDuration: number,
        messageCount: number
    ): Promise<boolean> {
        const profile = await this.getProfile(productUserId);
        if (!profile) return false;

        const totalSessions = (profile.total_sessions || 0) + 1;
        const totalMessages = (profile.total_messages || 0) + messageCount;

        // Calculate running averages
        const currentAvgLength = profile.typical_session_length || messageCount;
        const currentAvgDuration = profile.typical_session_duration || sessionDuration;

        const newAvgLength = Math.round(
            (currentAvgLength * (totalSessions - 1) + messageCount) / totalSessions
        );
        const newAvgDuration = Math.round(
            (currentAvgDuration * (totalSessions - 1) + sessionDuration) / totalSessions
        );

        // Update active days
        const today = new Date().toDateString();
        const lastActive = profile.last_interaction_at
            ? new Date(profile.last_interaction_at).toDateString()
            : null;
        const daysActive = lastActive !== today
            ? (profile.days_active || 0) + 1
            : (profile.days_active || 0);

        return this.updateProfile(productUserId, {
            total_sessions: totalSessions,
            total_messages: totalMessages,
            typical_session_length: newAvgLength,
            typical_session_duration: newAvgDuration,
            days_active: daysActive,
            last_interaction_at: new Date().toISOString(),
        });
    }

    /**
     * Update emotional profile
     */
    async updateEmotionalProfile(
        productUserId: string,
        data: {
            sentiment?: string;
            frustrationPoints?: string[];
            satisfactionPoints?: string[];
        }
    ): Promise<boolean> {
        const profile = await this.getProfile(productUserId);
        if (!profile) return false;

        const updates: Record<string, any> = {};

        if (data.sentiment) {
            // Update default sentiment (weighted towards recent)
            updates.default_sentiment = data.sentiment;
        }

        if (data.frustrationPoints?.length) {
            const existing = profile.frustration_triggers || [];
            const combined = [...new Set([...existing, ...data.frustrationPoints])];
            updates.frustration_triggers = combined.slice(-10); // Keep last 10
        }

        if (data.satisfactionPoints?.length) {
            const existing = profile.satisfaction_signals || [];
            const combined = [...new Set([...existing, ...data.satisfactionPoints])];
            updates.satisfaction_signals = combined.slice(-10);
        }

        if (Object.keys(updates).length === 0) return true;

        return this.updateProfile(productUserId, updates);
    }

    /**
     * Generate persona summary from accumulated data
     */
    async generatePersonaSummary(productUserId: string): Promise<string | null> {
        const profile = await this.getProfile(productUserId);
        if (!profile) return null;

        const parts: string[] = [];

        if (profile.profession) {
            parts.push(profile.profession);
        }

        if (profile.industry) {
            parts.push(`in the ${profile.industry} industry`);
        }

        const domains = profile.domains || [];
        if (domains.length > 0) {
            parts.push(`specializing in ${domains.slice(0, 3).join(', ')}`);
        }

        const expertiseLevels = profile.expertise_levels || {};
        const expertAreas = Object.entries(expertiseLevels)
            .filter(([_, data]: [string, any]) => data.level === 'expert')
            .map(([topic]) => topic);

        if (expertAreas.length > 0) {
            parts.push(`with expert knowledge in ${expertAreas.join(', ')}`);
        }

        if (profile.communication_style) {
            parts.push(`who prefers ${profile.communication_style} communication`);
        }

        const summary = parts.length > 0
            ? parts.join(' ') + '.'
            : null;

        if (summary) {
            await this.updateProfile(productUserId, {
                persona_summary: summary,
                last_profile_update: new Date().toISOString(),
            });
        }

        return summary;
    }

    // Private helpers
    private async getProfile(productUserId: string): Promise<any | null> {
        const { data } = await supabase
            .from('user_cognitive_profile')
            .select('*')
            .eq('product_user_id', productUserId)
            .single();
        return data;
    }

    private async updateProfile(
        productUserId: string,
        updates: Record<string, any>
    ): Promise<boolean> {
        const { error } = await supabase
            .from('user_cognitive_profile')
            .update(updates)
            .eq('product_user_id', productUserId);

        if (error) {
            console.error('[ProfileBuilder] Error updating profile:', error);
            return false;
        }
        return true;
    }

    private mapDbToProfile(data: any): CognitiveProfile {
        return {
            id: data.id,
            productUserId: data.product_user_id,
            productId: data.product_id,
            personaSummary: data.persona_summary,
            personaKeywords: data.persona_keywords || [],
            profession: data.profession,
            industry: data.industry,
            organizationType: data.organization_type,
            domains: data.domains || [],
            expertiseLevels: data.expertise_levels || {},
            expertiseEvolution: data.expertise_evolution || [],
            knowledgeGaps: data.knowledge_gaps || [],
            learningVelocity: data.learning_velocity || {},
            activeGoals: data.active_goals || [],
            completedGoals: data.completed_goals || [],
            recurringChallenges: data.recurring_challenges || [],
            currentProjects: data.current_projects || [],
            communicationStyle: data.communication_style,
            preferredResponseLength: data.preferred_response_length,
            preferredFormatting: data.preferred_formatting || {},
            vocabularyLevel: data.vocabulary_level,
            preferredExamplesType: data.preferred_examples_type,
            asksFollowupQuestions: data.asks_followup_questions || false,
            prefersStepByStep: data.prefers_step_by_step || false,
            commonQuestionPatterns: data.common_question_patterns || [],
            queryComplexityAvg: data.query_complexity_avg,
            typicalSessionLength: data.typical_session_length,
            typicalSessionDuration: data.typical_session_duration,
            peakUsageTime: data.peak_usage_time,
            defaultSentiment: data.default_sentiment,
            frustrationTriggers: data.frustration_triggers || [],
            satisfactionSignals: data.satisfaction_signals || [],
            patienceLevel: data.patience_level,
            handlesComplexity: data.handles_complexity,
            totalSessions: data.total_sessions || 0,
            totalMessages: data.total_messages || 0,
            firstInteractionAt: data.first_interaction_at,
            lastInteractionAt: data.last_interaction_at,
            daysActive: data.days_active || 0,
            profileConfidence: data.profile_confidence || 0,
            lastProfileUpdate: data.last_profile_update,
        };
    }
}

/**
 * Create profile builder instance
 */
export function createProfileBuilder(): ProfileBuilder {
    return new ProfileBuilder();
}

export default ProfileBuilder;
