/**
 * 🧠 KARR AI - COGNITIVE LEARNING ORCHESTRATOR
 * 
 * THE REVOLUTIONARY BRAIN OF THE DIGITAL TWIN SYSTEM
 * 
 * What makes this UNIQUE (no other AI does this):
 * 1. Real-Time Background Processing - Extract intelligence AFTER response (non-blocking)
 * 2. Incremental Learning - Every 3 messages, progressively update user profile
 * 3. Entity Graph Building - Automatically map relationships between entities
 * 4. Memory Facts Persistence - Store facts for long-term recall
 * 5. Proactive Insights - Generate insights for future use
 * 
 * This orchestrator connects:
 * - Intelligence Extractor (analysis)
 * - Profile Builder (user model)
 * - Session Manager (persistence)
 * - Entity Graph (relationships)
 * - Memory Facts (knowledge)
 * 
 * @author Karr AI Architecture Team
 * @version 2.0 - REVOLUTIONARY EDITION
 */

import { createClient } from '@supabase/supabase-js';
import {
    extractFullIntelligence,
    extractEntities,
    extractUserInsights,
    extractMemoryFacts,
    analyzeSentiment,
    generateSessionTitle,
    type ConversationIntelligence,
    type ExtractedEntity,
    type MemoryFact,
} from './intelligence-extractor';
import { ProfileBuilder, createProfileBuilder } from './profile-builder';
import { createSessionManager, type ChatMessage } from './session-manager';
import { generateProactiveInsightsForUser } from './proactive-insights-engine';
import { NeuralRelationalMemory, processEntitiesFromChat } from './neural-relational-memory';

// Initialize Supabase client for direct DB operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types
export interface LearningConfig {
    // Thresholds
    minMessagesForTitleGeneration: number;      // Generate title after N messages
    minMessagesForFullExtraction: number;       // Full intelligence extraction after N messages
    minMessagesForProfileUpdate: number;        // Update profile after N messages

    // Feature flags
    enableEntityGraphBuilding: boolean;
    enableMemoryFactsPersistence: boolean;
    enableProactiveInsights: boolean;
    enableEmotionalAdaptation: boolean;

    // Performance
    runInBackground: boolean;                   // Non-blocking extraction
    batchExtractions: boolean;                  // Batch multiple extractions

    // Neural Relational Memory (NRM)
    enableNeuralRelationalMemory: boolean;      // Advanced entity graph with multi-hop reasoning
}

export interface LearningResult {
    success: boolean;
    titleGenerated: boolean;
    entitiesExtracted: number;
    factsStored: number;
    profileUpdated: boolean;
    insightsGenerated: number;
    relationshipsInferred: number;              // NEW: NRM relationships
    processingTimeMs: number;
    errors?: string[];
}

// Default configuration
const DEFAULT_CONFIG: LearningConfig = {
    minMessagesForTitleGeneration: 2,  // Generate title after first exchange
    minMessagesForFullExtraction: 4,
    minMessagesForProfileUpdate: 4,
    enableEntityGraphBuilding: true,
    enableMemoryFactsPersistence: true,
    enableProactiveInsights: true,
    enableEmotionalAdaptation: true,
    runInBackground: true,
    batchExtractions: true,
    enableNeuralRelationalMemory: true,         // NEW: Revolutionary NRM
};

/**
 * 🧠 THE COGNITIVE LEARNING ORCHESTRATOR
 * 
 * The brain that makes the AI truly "learn" about each user.
 */
export class CognitiveLearningOrchestrator {
    private config: LearningConfig;
    private profileBuilder: ProfileBuilder;

    constructor(config: Partial<LearningConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.profileBuilder = createProfileBuilder();
    }

    /**
     * 🚀 MAIN ENTRY POINT: Process a session for cognitive learning
     * 
     * Called after each chat interaction to extract and store intelligence.
     * Runs in background (non-blocking) for best UX.
     */
    async processSessionLearning(
        sessionId: string,
        productUserId: string,
        productId: string,
        messages: ChatMessage[]
    ): Promise<LearningResult> {
        const startTime = Date.now();
        const result: LearningResult = {
            success: false,
            titleGenerated: false,
            entitiesExtracted: 0,
            factsStored: 0,
            profileUpdated: false,
            insightsGenerated: 0,
            relationshipsInferred: 0,
            processingTimeMs: 0,
            errors: [],
        };

        try {
            console.log(`[CognitiveOrchestrator] Processing session ${sessionId} with ${messages.length} messages`);

            // Phase 1: Title Generation (after 3 messages)
            if (messages.length >= this.config.minMessagesForTitleGeneration) {
                result.titleGenerated = await this.generateAndSaveTitle(sessionId, messages);
            }

            // Phase 2: Full Intelligence Extraction (after 4 messages)
            if (messages.length >= this.config.minMessagesForFullExtraction) {
                const intelligence = await this.extractIntelligence(messages);

                // Phase 3: Update session with extracted metadata
                await this.updateSessionWithIntelligence(sessionId, intelligence);

                // Phase 4: Entity Graph Building (Legacy + NRM)
                if (this.config.enableEntityGraphBuilding && intelligence.entities.length > 0) {
                    result.entitiesExtracted = await this.buildEntityGraph(
                        productUserId,
                        sessionId,
                        intelligence.entities
                    );
                }

                // Phase 4.5: Neural Relational Memory (REVOLUTIONARY!)
                if (this.config.enableNeuralRelationalMemory) {
                    const nrmResult = await this.processNeuralRelationalMemory(
                        productUserId,
                        productId,
                        sessionId,
                        messages
                    );
                    result.entitiesExtracted += nrmResult.entitiesProcessed;
                    result.relationshipsInferred = nrmResult.relationshipsProcessed;
                }

                // Phase 5: Memory Facts Persistence
                if (this.config.enableMemoryFactsPersistence && intelligence.memoryFacts.length > 0) {
                    result.factsStored = await this.storeMemoryFacts(
                        productUserId,
                        sessionId,
                        intelligence.memoryFacts
                    );
                }

                // Phase 6: Profile Learning
                if (messages.length >= this.config.minMessagesForProfileUpdate) {
                    result.profileUpdated = await this.updateUserProfile(
                        productUserId,
                        productId,
                        intelligence,
                        messages.length
                    );
                }

                // Phase 7: Proactive Insights Generation - REVOLUTIONARY ENGINE!
                if (this.config.enableProactiveInsights) {
                    result.insightsGenerated = await this.generateProactiveInsights(
                        productUserId,
                        intelligence,
                        productId  // Pass productId for the revolutionary engine
                    );
                }
            }

            result.success = true;
            result.processingTimeMs = Date.now() - startTime;

            console.log(`[CognitiveOrchestrator] Session ${sessionId} processed in ${result.processingTimeMs}ms:`, {
                titleGenerated: result.titleGenerated,
                entitiesExtracted: result.entitiesExtracted,
                relationshipsInferred: result.relationshipsInferred,
                factsStored: result.factsStored,
                profileUpdated: result.profileUpdated,
            });

        } catch (error: any) {
            console.error('[CognitiveOrchestrator] Error processing session:', error);
            result.errors?.push(error.message);
            result.processingTimeMs = Date.now() - startTime;
        }

        return result;
    }

    /**
     * 📝 Generate and save session title
     */
    private async generateAndSaveTitle(
        sessionId: string,
        messages: ChatMessage[]
    ): Promise<boolean> {
        try {
            // Check if title already exists
            const { data: session } = await supabase
                .from('chat_sessions')
                .select('title')
                .eq('id', sessionId)
                .single();

            if (session?.title && session.title !== 'New Conversation') {
                return false; // Already has title
            }

            const { title, emoji } = await generateSessionTitle(messages);

            const { error } = await supabase
                .from('chat_sessions')
                .update({
                    title,
                    title_emoji: emoji,
                })
                .eq('id', sessionId);

            if (error) {
                console.error('[CognitiveOrchestrator] Error saving title:', error);
                return false;
            }

            console.log(`[CognitiveOrchestrator] Title generated: ${emoji} ${title}`);
            return true;
        } catch (error) {
            console.error('[CognitiveOrchestrator] Error generating title:', error);
            return false;
        }
    }

    /**
     * 🔍 Extract full conversation intelligence
     */
    private async extractIntelligence(
        messages: ChatMessage[]
    ): Promise<ConversationIntelligence> {
        return extractFullIntelligence(messages);
    }

    /**
     * 📊 Update session with extracted intelligence
     */
    private async updateSessionWithIntelligence(
        sessionId: string,
        intelligence: ConversationIntelligence
    ): Promise<void> {
        const updates: Record<string, any> = {
            summary: intelligence.session.summary,
            summary_updated_at: new Date().toISOString(),
            topics: intelligence.session.topics,
            primary_topic: intelligence.session.primaryTopic,
            topic_categories: intelligence.session.categories,
            entities_mentioned: intelligence.entities.map(e => ({
                name: e.name,
                type: e.type,
                subtype: e.subtype,
                context: e.context,
            })),
            primary_entities: intelligence.entities.slice(0, 3).map(e => ({
                name: e.name,
                type: e.type,
            })),
            dominant_sentiment: intelligence.emotional.dominantSentiment,
            sentiment_journey: intelligence.emotional.sentimentJourney,
            resolution_status: intelligence.emotional.resolutionStatus,
            user_insights: intelligence.userInsights,
        };

        const { error } = await supabase
            .from('chat_sessions')
            .update(updates)
            .eq('id', sessionId);

        if (error) {
            console.error('[CognitiveOrchestrator] Error updating session intelligence:', error);
        }
    }

    /**
     * 🕸️ BUILD ENTITY KNOWLEDGE GRAPH
     * 
     * This is the REVOLUTIONARY feature - building a relationship graph
     * of everyone and everything the user interacts with.
     */
    private async buildEntityGraph(
        productUserId: string,
        sessionId: string,
        entities: ExtractedEntity[]
    ): Promise<number> {
        let entitiesUpserted = 0;

        for (const entity of entities) {
            try {
                // Normalize entity name for matching
                const normalizedName = entity.name.toLowerCase().trim();

                // Check if entity already exists
                const { data: existing } = await supabase
                    .from('user_entity_graph')
                    .select('id, mention_count, mentions_by_session, key_facts, context_history')
                    .eq('product_user_id', productUserId)
                    .eq('entity_name_normalized', normalizedName)
                    .eq('entity_type', entity.type)
                    .single();

                if (existing) {
                    // Update existing entity
                    const mentionsBySession = existing.mentions_by_session || [];
                    const existingSessionIdx = mentionsBySession.findIndex(
                        (m: any) => m.session_id === sessionId
                    );

                    if (existingSessionIdx >= 0) {
                        mentionsBySession[existingSessionIdx].count++;
                        mentionsBySession[existingSessionIdx].context = entity.context;
                    } else {
                        mentionsBySession.push({
                            session_id: sessionId,
                            count: 1,
                            context: entity.context,
                            timestamp: new Date().toISOString(),
                        });
                    }

                    // Merge facts (ensure facts is always an array)
                    const existingFacts = existing.key_facts || [];
                    const entityFacts = Array.isArray(entity.facts) ? entity.facts : [];
                    const newFacts = [...new Set([...existingFacts, ...entityFacts])];

                    // Update context history
                    const contextHistory = existing.context_history || [];
                    contextHistory.push({
                        context: entity.context,
                        session_id: sessionId,
                        timestamp: new Date().toISOString(),
                    });

                    await supabase
                        .from('user_entity_graph')
                        .update({
                            mention_count: (existing.mention_count || 1) + 1,
                            last_mentioned_at: new Date().toISOString(),
                            mentions_by_session: mentionsBySession,
                            key_facts: newFacts.slice(-20), // Keep last 20 facts
                            context_history: contextHistory.slice(-10), // Keep last 10 contexts
                            description: entity.context, // Update description with latest context
                        })
                        .eq('id', existing.id);

                } else {
                    // Insert new entity
                    await supabase
                        .from('user_entity_graph')
                        .insert({
                            product_user_id: productUserId,
                            entity_name: entity.name,
                            entity_name_normalized: normalizedName,
                            entity_type: entity.type,
                            entity_subtype: entity.subtype,
                            relationship_to_user: entity.relationship,
                            description: entity.context,
                            key_facts: Array.isArray(entity.facts) ? entity.facts : [],
                            associated_topics: [], // Will be populated over time
                            first_mentioned_at: new Date().toISOString(),
                            last_mentioned_at: new Date().toISOString(),
                            mention_count: 1,
                            mentions_by_session: [{
                                session_id: sessionId,
                                count: 1,
                                context: entity.context,
                                timestamp: new Date().toISOString(),
                            }],
                            context_history: [{
                                context: entity.context,
                                session_id: sessionId,
                                timestamp: new Date().toISOString(),
                            }],
                        });
                }

                entitiesUpserted++;
            } catch (error) {
                console.error(`[CognitiveOrchestrator] Error upserting entity ${entity.name}:`, error);
            }
        }

        console.log(`[CognitiveOrchestrator] Entity graph updated: ${entitiesUpserted} entities`);
        return entitiesUpserted;
    }

    /**
     * 🧠 PROCESS NEURAL RELATIONAL MEMORY (NRM)
     * 
     * The REVOLUTIONARY feature that makes Karr AI unique:
     * - Automatic entity extraction with rich context
     * - Relationship inference (not just storage)
     * - Multi-hop reasoning paths
     * - Predictive intelligence
     */
    private async processNeuralRelationalMemory(
        productUserId: string,
        productId: string,
        sessionId: string,
        messages: ChatMessage[]
    ): Promise<{
        entitiesProcessed: number;
        relationshipsProcessed: number;
    }> {
        try {
            console.log(`[CognitiveOrchestrator] 🧠 Processing Neural Relational Memory...`);

            const result = await processEntitiesFromChat(
                productUserId,
                productId,
                messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                sessionId
            );

            console.log(`[CognitiveOrchestrator] ✨ NRM processed: ${result.entitiesProcessed} entities, ${result.relationshipsProcessed} relationships`);

            // Optionally trigger predictions for significant sessions
            if (result.entitiesProcessed >= 3) {
                const nrm = new NeuralRelationalMemory(productUserId, productId);
                // Fire and forget - don't block on predictions
                nrm.generatePredictions().catch(err =>
                    console.error('[CognitiveOrchestrator] Prediction generation failed:', err)
                );
            }

            return {
                entitiesProcessed: result.entitiesProcessed,
                relationshipsProcessed: result.relationshipsProcessed,
            };

        } catch (error) {
            console.error('[CognitiveOrchestrator] NRM processing error:', error);
            return {
                entitiesProcessed: 0,
                relationshipsProcessed: 0,
            };
        }
    }

    /**
     * 💾 STORE MEMORY FACTS
     * 
     * Persist extracted knowledge for long-term recall.
     */
    private async storeMemoryFacts(
        productUserId: string,
        sessionId: string,
        facts: MemoryFact[]
    ): Promise<number> {
        let factsStored = 0;

        for (const fact of facts) {
            try {
                // Check for duplicate or contradicting facts
                const { data: existing } = await supabase
                    .from('memory_facts')
                    .select('id, reinforcement_count')
                    .eq('product_user_id', productUserId)
                    .eq('fact_subject', fact.subject)
                    .eq('fact_predicate', fact.predicate)
                    .eq('is_active', true)
                    .single();

                if (existing) {
                    // Reinforce existing fact
                    await supabase
                        .from('memory_facts')
                        .update({
                            reinforcement_count: (existing.reinforcement_count || 1) + 1,
                            last_reinforced_at: new Date().toISOString(),
                            confidence: Math.min(1, fact.confidence + 0.05), // Increase confidence
                        })
                        .eq('id', existing.id);
                } else {
                    // Insert new fact
                    await supabase
                        .from('memory_facts')
                        .insert({
                            product_user_id: productUserId,
                            source_session_id: sessionId,
                            extraction_method: 'conversation',
                            fact_category: fact.category,
                            fact_key: `${fact.subject}.${fact.predicate}`.toLowerCase(),
                            fact_subject: fact.subject,
                            fact_predicate: fact.predicate,
                            fact_object: fact.object,
                            fact_full_text: fact.fullText,
                            confidence: fact.confidence,
                            is_temporal: fact.isTemporal,
                            temporal_context: fact.temporalContext,
                            importance_score: 0.5, // Default importance
                            valid_from: new Date().toISOString(),
                        });
                    factsStored++;
                }
            } catch (error) {
                console.error(`[CognitiveOrchestrator] Error storing fact:`, error);
            }
        }

        console.log(`[CognitiveOrchestrator] Memory facts stored: ${factsStored} new facts`);
        return factsStored;
    }

    /**
     * 👤 UPDATE USER COGNITIVE PROFILE
     * 
     * This is where the AI truly "learns" about the user.
     */
    private async updateUserProfile(
        productUserId: string,
        productId: string,
        intelligence: ConversationIntelligence,
        messageCount: number
    ): Promise<boolean> {
        try {
            // Ensure profile exists
            await this.profileBuilder.getOrCreateProfile(productUserId, productId);

            // Update expertise levels
            if (intelligence.userInsights.expertiseSignals.length > 0) {
                await this.profileBuilder.updateExpertise(
                    productUserId,
                    intelligence.userInsights.expertiseSignals
                );
            }

            // Update communication preferences
            if (intelligence.userInsights.communicationSignals.length > 0) {
                await this.profileBuilder.updateCommunicationStyle(
                    productUserId,
                    intelligence.userInsights.communicationSignals
                );
            }

            // Update goals
            if (intelligence.userInsights.goalsDetected.length > 0) {
                await this.profileBuilder.updateGoals(
                    productUserId,
                    intelligence.userInsights.goalsDetected
                );
            }

            // Update challenges
            if (intelligence.userInsights.challengesDetected.length > 0) {
                await this.profileBuilder.updateChallenges(
                    productUserId,
                    intelligence.userInsights.challengesDetected
                );
            }

            // Update emotional profile
            if (this.config.enableEmotionalAdaptation) {
                await this.profileBuilder.updateEmotionalProfile(productUserId, {
                    sentiment: intelligence.emotional.dominantSentiment,
                    frustrationPoints: intelligence.emotional.frustrationPoints,
                    satisfactionPoints: intelligence.emotional.satisfactionPoints,
                });
            }

            // Update session stats
            // Note: Using estimated duration based on message count
            const estimatedDuration = messageCount * 30; // ~30 seconds per message
            await this.profileBuilder.updateSessionStats(
                productUserId,
                estimatedDuration,
                messageCount
            );

            console.log(`[CognitiveOrchestrator] User profile updated for ${productUserId}`);
            return true;
        } catch (error) {
            console.error('[CognitiveOrchestrator] Error updating profile:', error);
            return false;
        }
    }

    /**
     * 💡 GENERATE PROACTIVE INSIGHTS - REVOLUTIONARY ENGINE!
     * 
     * Uses the world's first "AI That Cares When You're Not There" engine
     * to generate 9 types of personalized, caring insights.
     */
    private async generateProactiveInsights(
        productUserId: string,
        intelligence: ConversationIntelligence,
        productId?: string
    ): Promise<number> {
        try {
            console.log(`[CognitiveOrchestrator] 🚀 Triggering Revolutionary Insights Engine...`);

            // Use the new revolutionary engine for comprehensive insights
            // This generates: Curiosity gaps, Deadlines, Learning milestones,
            // Follow-ups, Growth celebrations, Emotional support, Predictions,
            // Relationship building, and Knowledge suggestions
            const insightsGenerated = await generateProactiveInsightsForUser(
                productUserId,
                productId || ''
            );

            console.log(`[CognitiveOrchestrator] ✨ Revolutionary engine generated ${insightsGenerated} caring insights!`);
            return insightsGenerated;

        } catch (error) {
            console.error('[CognitiveOrchestrator] Error generating insights:', error);
            return 0;
        }
    }

    /**
     * 🎯 QUICK LEARNING (For real-time updates)
     * 
     * Lightweight version that runs after each message for immediate updates.
     * Does not block the chat response.
     */
    async quickLearn(
        sessionId: string,
        productUserId: string,
        messages: ChatMessage[]
    ): Promise<void> {
        // Only do quick entity detection for now
        if (messages.length >= 2) {
            try {
                const latestMessages = messages.slice(-3);
                const entities = await extractEntities(latestMessages);

                if (entities.length > 0) {
                    await this.buildEntityGraph(productUserId, sessionId, entities.slice(0, 2));
                }
            } catch (error) {
                console.error('[CognitiveOrchestrator] Quick learn error:', error);
            }
        }
    }
}

/**
 * Factory function to create orchestrator instance
 */
export function createLearningOrchestrator(
    config?: Partial<LearningConfig>
): CognitiveLearningOrchestrator {
    return new CognitiveLearningOrchestrator(config);
}

/**
 * 🚀 FIRE-AND-FORGET BACKGROUND LEARNING
 * 
 * This is what makes it REVOLUTIONARY - process learning in background
 * without blocking the user's chat experience.
 */
export async function triggerBackgroundLearning(
    sessionId: string,
    productUserId: string,
    productId: string,
    messages: ChatMessage[]
): Promise<void> {
    // Don't await - let it run in background
    const orchestrator = createLearningOrchestrator();

    // Fire and forget
    orchestrator.processSessionLearning(sessionId, productUserId, productId, messages)
        .then(result => {
            console.log(`[BackgroundLearning] Completed for session ${sessionId}:`, result);
        })
        .catch(error => {
            console.error(`[BackgroundLearning] Failed for session ${sessionId}:`, error);
        });
}

export default CognitiveLearningOrchestrator;
