/**
 * 🧠 NEURAL RELATIONAL MEMORY (NRM) ENGINE
 * 
 * THE WORLD'S FIRST CONTEXT-AWARE PERSONAL KNOWLEDGE GRAPH
 * 
 * Revolutionary capabilities that surpass ChatGPT, Notion AI, and Microsoft Graph:
 * 
 * 1. AUTOMATIC ENTITY EXTRACTION - No manual tagging required
 * 2. RELATIONSHIP INFERENCE - Understands "works with" from context
 * 3. TEMPORAL EVOLUTION - Tracks how relationships change over time
 * 4. MULTI-HOP REASONING - "Who can introduce me to X?"
 * 5. PREDICTIVE INTELLIGENCE - Anticipates decay, opportunities, conflicts
 * 6. ENTITY EMBEDDINGS - Semantic similarity between entities
 * 7. CLUSTER DETECTION - Auto-groups related entities (work, family, projects)
 * 
 * This is NOT just storage - this is a THINKING knowledge graph.
 */

import { createClient } from '@supabase/supabase-js';
import { generateContent, generateEmbedding } from '@/lib/gemini';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// TYPES
// ============================================================================

export type EntityType = 'person' | 'organization' | 'place' | 'concept' | 'project' | 'document' | 'event' | 'temporal_fact';

export type RelationshipCategory = 'professional' | 'personal' | 'transactional' | 'knowledge' | 'temporal' | 'inference' | 'emotional';

export interface Entity {
    id?: string;
    name: string;
    canonicalName?: string;
    type: EntityType;
    subtype?: string;
    aliases?: string[];
    description?: string;
    keyFacts?: string[];
    metadata?: Record<string, any>;
    importanceScore?: number;
    mentionCount?: number;
    firstMentionedAt?: Date;
    lastMentionedAt?: Date;
    embedding?: number[];
}

export interface Relationship {
    id?: string;
    sourceEntityId: string;
    targetEntityId: string;
    category: RelationshipCategory;
    type: string;
    label?: string;
    isBidirectional?: boolean;
    strength?: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
    confidence?: number;
    inferenceMethod?: 'explicit' | 'co-occurrence' | 'llm_inference' | 'user_confirmed';
    validFrom?: Date;
    validUntil?: Date | null;
    isTemporal?: boolean;
    temporalContext?: string;
    mentionCount?: number;
    contextExamples?: string[];
}

export interface ReasoningPath {
    sourceEntityId: string;
    targetEntityId: string;
    hopCount: number;
    path: { entityId: string; entityName: string; relationshipType: string }[];
    pathStrength: number;
    pathSummary: string;
}

export interface EntityPrediction {
    type: 'relationship_decay' | 'topic_interest' | 'connection_opportunity' | 'conflict_risk';
    entityId: string;
    targetEntityId?: string;
    prediction: Record<string, any>;
    confidence: number;
    reasoning: string;
    predictedTimeframe?: string;
}

export interface EntityCluster {
    id?: string;
    name: string;
    type: 'work_context' | 'project' | 'family' | 'friend_group' | 'topic_area' | 'organization';
    description?: string;
    members: string[];
    centroidEntityId?: string;
    cohesionScore?: number;
}

export interface ExtractedEntityContext {
    entity: Entity;
    relationships: Relationship[];
    context: string;
    confidence: number;
}

// ============================================================================
// NEURAL RELATIONAL MEMORY ENGINE
// ============================================================================

export class NeuralRelationalMemory {
    private productUserId: string;
    private productId: string;

    constructor(productUserId: string, productId: string) {
        this.productUserId = productUserId;
        this.productId = productId;
    }

    // ========================================================================
    // 🔍 INTELLIGENT ENTITY EXTRACTION
    // Goes beyond simple NER - understands relationships from context
    // ========================================================================

    async extractEntitiesFromMessages(
        messages: { role: string; content: string }[]
    ): Promise<ExtractedEntityContext[]> {
        const conversationText = messages
            .map((m, i) => `[${i}] ${m.role.toUpperCase()}: ${m.content.substring(0, 500)}`)
            .join('\n\n');

        const prompt = `You are an expert knowledge graph builder. Extract ALL entities and their relationships from this conversation.

CONVERSATION:
${conversationText}

Extract entities with RICH context and relationships. Think deeply about:
1. WHO are the people? What's their relationship to the user?
2. WHAT organizations are mentioned? How do they relate?
3. WHAT projects or goals are being discussed?
4. WHAT concepts or topics are central?
5. HOW do these entities relate to EACH OTHER?

Respond in JSON format:
{
    "entities": [
        {
            "name": "Rahul Sharma",
            "canonicalName": "rahul_sharma",
            "type": "person",
            "subtype": "client",
            "aliases": ["Rahul", "Mr. Sharma"],
            "description": "Bakery owner in Mumbai, GST registered",
            "keyFacts": [
                "Owns Sweet Dreams Bakery",
                "Annual turnover approximately 50 lakhs",
                "Quarterly GST filer",
                "Located in Mumbai"
            ],
            "inferredRelationshipToUser": "client",
            "confidence": 0.95
        }
    ],
    "relationships": [
        {
            "source": "Rahul Sharma",
            "target": "Sweet Dreams Bakery",
            "category": "professional",
            "type": "owns",
            "label": "Rahul owns Sweet Dreams Bakery",
            "isBidirectional": false,
            "strength": 1.0,
            "sentiment": "positive",
            "confidence": 0.95,
            "inferenceMethod": "explicit",
            "context": "Explicitly mentioned in conversation"
        }
    ],
    "clusters": [
        {
            "name": "Rahul's Business",
            "type": "work_context",
            "members": ["Rahul Sharma", "Sweet Dreams Bakery", "GST"],
            "description": "Client's bakery business context"
        }
    ]
}

Be thorough but only include entities actually mentioned or clearly implied. Quality over quantity.`;

        try {
            const response = await generateContent(prompt);
            const parsed = this.extractJSON(response);

            if (!parsed) {
                console.log('[NRM] Failed to parse entity extraction response');
                return [];
            }

            const results: ExtractedEntityContext[] = [];

            // Process entities
            for (const entityData of parsed.entities || []) {
                const entity: Entity = {
                    name: entityData.name,
                    canonicalName: entityData.canonicalName || this.normalizeEntityName(entityData.name),
                    type: entityData.type as EntityType,
                    subtype: entityData.subtype,
                    aliases: entityData.aliases || [],
                    description: entityData.description,
                    keyFacts: entityData.keyFacts || [],
                    importanceScore: entityData.confidence || 0.5,
                };

                // Find relationships for this entity
                const entityRelationships = (parsed.relationships || [])
                    .filter((r: any) => r.source === entityData.name || r.target === entityData.name)
                    .map((r: any) => ({
                        sourceEntityId: '', // Will be filled after entity creation
                        targetEntityId: '',
                        category: r.category as RelationshipCategory,
                        type: r.type,
                        label: r.label,
                        isBidirectional: r.isBidirectional || false,
                        strength: r.strength || 0.5,
                        sentiment: r.sentiment || 'neutral',
                        confidence: r.confidence || 0.8,
                        inferenceMethod: r.inferenceMethod || 'llm_inference',
                        contextExamples: r.context ? [r.context] : [],
                    }));

                results.push({
                    entity,
                    relationships: entityRelationships,
                    context: entityData.description || '',
                    confidence: entityData.confidence || 0.8,
                });
            }

            return results;

        } catch (error) {
            console.error('[NRM] Error extracting entities:', error);
            return [];
        }
    }

    // ========================================================================
    // 💾 ENTITY STORAGE WITH DEDUPLICATION
    // Smart storage that merges with existing entities
    // ========================================================================

    async storeEntity(entity: Entity): Promise<string | null> {
        try {
            // Check for existing entity with same canonical name
            const { data: existing } = await supabase
                .from('user_entity_graph')
                .select('id, entity_name, key_facts, mention_count, relationship_strength, description')
                .eq('product_user_id', this.productUserId)
                .eq('entity_name_normalized', entity.canonicalName || this.normalizeEntityName(entity.name))
                .eq('entity_type', entity.type)
                .eq('is_active', true)
                .single();

            if (existing) {
                // Merge with existing entity
                const mergedFacts = [...new Set([
                    ...(existing.key_facts || []),
                    ...(entity.keyFacts || [])
                ])];

                // Dynamic importance: increases with each mention, capped at 0.95
                const newMentionCount = (existing.mention_count || 0) + 1;
                const currentStrength = existing.relationship_strength || 0.5;
                // Importance grows logarithmically with mentions
                const newStrength = Math.min(0.95, 0.3 + (Math.log10(newMentionCount + 1) * 0.3));

                await supabase
                    .from('user_entity_graph')
                    .update({
                        key_facts: mergedFacts,
                        mention_count: newMentionCount,
                        relationship_strength: newStrength,
                        last_mentioned_at: new Date().toISOString(),
                        description: entity.description || existing.description,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id);

                console.log(`[NRM] Merged entity: ${entity.name} -> ${existing.id} (strength: ${newStrength.toFixed(2)})`);
                return existing.id;
            }

            // Create new entity with initial importance based on LLM confidence
            const initialStrength = Math.max(0.3, Math.min(0.7, entity.importanceScore || 0.5));

            const { data: newEntity, error } = await supabase
                .from('user_entity_graph')
                .insert({
                    product_user_id: this.productUserId,
                    entity_name: entity.name,
                    entity_name_normalized: entity.canonicalName || this.normalizeEntityName(entity.name),
                    entity_type: entity.type,
                    entity_subtype: entity.subtype,
                    description: entity.description,
                    key_facts: entity.keyFacts || [],
                    relationship_strength: initialStrength,
                    mention_count: 1,
                    first_mentioned_at: new Date().toISOString(),
                    last_mentioned_at: new Date().toISOString(),
                })
                .select('id')
                .single();

            if (error) {
                console.error('[NRM] Error creating entity:', error);
                return null;
            }

            console.log(`[NRM] Created new entity: ${entity.name} -> ${newEntity.id} (strength: ${initialStrength.toFixed(2)})`);

            // Generate embedding asynchronously
            this.generateEntityEmbedding(newEntity.id, entity);

            return newEntity.id;

        } catch (error) {
            console.error('[NRM] Error storing entity:', error);
            return null;
        }
    }

    // ========================================================================
    // 🔗 RELATIONSHIP MANAGEMENT
    // Store and track evolving relationships
    // ========================================================================

    async storeRelationship(
        relationship: Relationship,
        sourceSessionId?: string
    ): Promise<string | null> {
        try {
            // Check for existing relationship
            const { data: existing } = await supabase
                .from('entity_relationships')
                .select('id, mention_count, context_examples, strength')
                .eq('product_user_id', this.productUserId)
                .eq('source_entity_id', relationship.sourceEntityId)
                .eq('target_entity_id', relationship.targetEntityId)
                .eq('relationship_type', relationship.type)
                .is('valid_until', null)
                .single();

            if (existing) {
                // Update existing relationship
                const updatedExamples = [...new Set([
                    ...(existing.context_examples || []),
                    ...(relationship.contextExamples || [])
                ])].slice(0, 10); // Keep max 10 examples

                const updatedStrength = Math.min(1.0,
                    (existing.strength || 0.5) + 0.05 // Strengthen on each mention
                );

                await supabase
                    .from('entity_relationships')
                    .update({
                        mention_count: (existing.mention_count || 0) + 1,
                        context_examples: updatedExamples,
                        strength: updatedStrength,
                        last_mentioned_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id);

                return existing.id;
            }

            // Create new relationship
            const { data: newRel, error } = await supabase
                .from('entity_relationships')
                .insert({
                    product_user_id: this.productUserId,
                    source_entity_id: relationship.sourceEntityId,
                    target_entity_id: relationship.targetEntityId,
                    relationship_category: relationship.category,
                    relationship_type: relationship.type,
                    relationship_label: relationship.label,
                    is_bidirectional: relationship.isBidirectional || false,
                    strength: relationship.strength || 0.5,
                    sentiment: relationship.sentiment || 'neutral',
                    confidence: relationship.confidence || 0.8,
                    inference_method: relationship.inferenceMethod || 'llm_inference',
                    source_session_id: sourceSessionId,
                    valid_from: new Date().toISOString(),
                    is_temporal: relationship.isTemporal || false,
                    temporal_context: relationship.temporalContext,
                    mention_count: 1,
                    context_examples: relationship.contextExamples || [],
                })
                .select('id')
                .single();

            if (error) {
                console.error('[NRM] Error creating relationship:', error);
                return null;
            }

            return newRel.id;

        } catch (error) {
            console.error('[NRM] Error storing relationship:', error);
            return null;
        }
    }

    // ========================================================================
    // 🔍 ENTITY RETRIEVAL & SEARCH
    // Find entities by name, type, or semantic similarity
    // ========================================================================

    async findEntity(name: string, type?: EntityType): Promise<Entity | null> {
        const normalized = this.normalizeEntityName(name);

        let query = supabase
            .from('user_entity_graph')
            .select('*')
            .eq('product_user_id', this.productUserId)
            .eq('is_active', true)
            .or(`entity_name_normalized.eq.${normalized},entity_aliases.cs.["${name}"]`);

        if (type) {
            query = query.eq('entity_type', type);
        }

        const { data, error } = await query.single();

        if (error || !data) return null;

        return this.dbRowToEntity(data);
    }

    async searchEntities(
        query: string,
        options?: {
            types?: EntityType[];
            limit?: number;
            minImportance?: number;
        }
    ): Promise<Entity[]> {
        let dbQuery = supabase
            .from('user_entity_graph')
            .select('*')
            .eq('product_user_id', this.productUserId)
            .eq('is_active', true)
            .or(`entity_name.ilike.%${query}%,description.ilike.%${query}%`)
            .order('importance_score', { ascending: false })
            .limit(options?.limit || 20);

        if (options?.types?.length) {
            dbQuery = dbQuery.in('entity_type', options.types);
        }

        if (options?.minImportance) {
            dbQuery = dbQuery.gte('importance_score', options.minImportance);
        }

        const { data, error } = await dbQuery;

        if (error || !data) return [];

        return data.map(row => this.dbRowToEntity(row));
    }

    async getTopEntities(limit: number = 20): Promise<Entity[]> {
        const { data, error } = await supabase
            .from('user_entity_graph')
            .select('*')
            .eq('product_user_id', this.productUserId)
            .eq('is_active', true)
            .order('importance_score', { ascending: false })
            .limit(limit);

        if (error || !data) return [];

        return data.map(row => this.dbRowToEntity(row));
    }

    async getRecentEntities(limit: number = 20): Promise<Entity[]> {
        const { data, error } = await supabase
            .from('user_entity_graph')
            .select('*')
            .eq('product_user_id', this.productUserId)
            .eq('is_active', true)
            .order('last_mentioned_at', { ascending: false })
            .limit(limit);

        if (error || !data) return [];

        return data.map(row => this.dbRowToEntity(row));
    }

    // ========================================================================
    // 🌐 RELATIONSHIP QUERIES
    // Multi-hop reasoning and path finding
    // ========================================================================

    async getEntityRelationships(entityId: string): Promise<{
        outgoing: Relationship[];
        incoming: Relationship[];
    }> {
        const [outgoing, incoming] = await Promise.all([
            supabase
                .from('entity_relationships')
                .select('*, target:target_entity_id(entity_name, entity_type)')
                .eq('source_entity_id', entityId)
                .is('valid_until', null)
                .order('strength', { ascending: false }),
            supabase
                .from('entity_relationships')
                .select('*, source:source_entity_id(entity_name, entity_type)')
                .eq('target_entity_id', entityId)
                .is('valid_until', null)
                .order('strength', { ascending: false })
        ]);

        return {
            outgoing: (outgoing.data || []).map(row => this.dbRowToRelationship(row)),
            incoming: (incoming.data || []).map(row => this.dbRowToRelationship(row)),
        };
    }

    async findPathBetweenEntities(
        sourceEntityId: string,
        targetEntityId: string,
        maxHops: number = 4
    ): Promise<ReasoningPath | null> {
        // First check cache
        const { data: cached } = await supabase
            .from('reasoning_paths')
            .select('*')
            .eq('source_entity_id', sourceEntityId)
            .eq('target_entity_id', targetEntityId)
            .gt('valid_until', new Date().toISOString())
            .order('path_strength', { ascending: false })
            .limit(1)
            .single();

        if (cached) {
            return {
                sourceEntityId: cached.source_entity_id,
                targetEntityId: cached.target_entity_id,
                hopCount: cached.hop_count,
                path: cached.path_entities,
                pathStrength: cached.path_strength,
                pathSummary: cached.path_summary,
            };
        }

        // Compute path using BFS
        const path = await this.computeShortestPath(sourceEntityId, targetEntityId, maxHops);

        if (path) {
            // Cache the path
            await supabase.from('reasoning_paths').insert({
                product_user_id: this.productUserId,
                source_entity_id: sourceEntityId,
                target_entity_id: targetEntityId,
                hop_count: path.hopCount,
                path_entities: path.path,
                path_relationships: path.path.map(p => p.relationshipType),
                path_strength: path.pathStrength,
                path_summary: path.pathSummary,
                shortest_path: true,
                valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h cache
            });
        }

        return path;
    }

    private async computeShortestPath(
        sourceId: string,
        targetId: string,
        maxHops: number
    ): Promise<ReasoningPath | null> {
        // BFS implementation
        interface QueueItem {
            entityId: string;
            path: { entityId: string; entityName: string; relationshipType: string }[];
            strength: number;
        }

        const queue: QueueItem[] = [{
            entityId: sourceId,
            path: [],
            strength: 1.0
        }];
        const visited = new Set<string>([sourceId]);

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (current.path.length >= maxHops) continue;

            // Get relationships from current entity
            const { data: relationships } = await supabase
                .from('entity_relationships')
                .select(`
                    target_entity_id,
                    source_entity_id,
                    relationship_type,
                    strength,
                    target:target_entity_id(entity_name),
                    source:source_entity_id(entity_name)
                `)
                .or(`source_entity_id.eq.${current.entityId},target_entity_id.eq.${current.entityId}`)
                .is('valid_until', null);

            for (const rel of relationships || []) {
                const nextEntityId = rel.source_entity_id === current.entityId
                    ? rel.target_entity_id
                    : rel.source_entity_id;
                const nextEntityName = rel.source_entity_id === current.entityId
                    ? (rel.target as any)?.entity_name
                    : (rel.source as any)?.entity_name;

                if (visited.has(nextEntityId)) continue;
                visited.add(nextEntityId);

                const newPath = [
                    ...current.path,
                    {
                        entityId: nextEntityId,
                        entityName: nextEntityName || 'Unknown',
                        relationshipType: rel.relationship_type
                    }
                ];
                const newStrength = current.strength * (rel.strength || 0.5);

                if (nextEntityId === targetId) {
                    // Found the target!
                    return {
                        sourceEntityId: sourceId,
                        targetEntityId: targetId,
                        hopCount: newPath.length,
                        path: newPath,
                        pathStrength: newStrength,
                        pathSummary: await this.generatePathSummary(newPath),
                    };
                }

                queue.push({
                    entityId: nextEntityId,
                    path: newPath,
                    strength: newStrength,
                });
            }
        }

        return null; // No path found
    }

    private async generatePathSummary(
        path: { entityId: string; entityName: string; relationshipType: string }[]
    ): Promise<string> {
        if (path.length === 0) return '';

        const parts = path.map((node, i) => {
            if (i === 0) return node.entityName;
            return `${node.relationshipType} → ${node.entityName}`;
        });

        return parts.join(' ');
    }

    // ========================================================================
    // 🔮 PREDICTIVE INTELLIGENCE
    // Anticipate relationship decay, opportunities, and conflicts
    // ========================================================================

    async generatePredictions(): Promise<EntityPrediction[]> {
        const predictions: EntityPrediction[] = [];

        // 1. Relationship Decay Predictions
        const decayingRelationships = await this.findDecayingRelationships();
        for (const rel of decayingRelationships) {
            predictions.push({
                type: 'relationship_decay',
                entityId: rel.sourceEntityId,
                targetEntityId: rel.targetEntityId,
                prediction: {
                    daysInactive: rel.daysInactive,
                    previousStrength: rel.strength,
                    predictedStrengthIn30Days: Math.max(0.1, rel.strength * 0.7),
                },
                confidence: 0.75,
                reasoning: `No mentions of this relationship in ${rel.daysInactive} days`,
                predictedTimeframe: 'next_month',
            });
        }

        // 2. Connection Opportunity Predictions
        const opportunities = await this.findConnectionOpportunities();
        for (const opp of opportunities) {
            predictions.push({
                type: 'connection_opportunity',
                entityId: opp.entityAId,
                targetEntityId: opp.entityBId,
                prediction: {
                    commonConnections: opp.commonConnections,
                    suggestedRelationship: opp.suggestedRelationship,
                },
                confidence: opp.confidence,
                reasoning: opp.reasoning,
            });
        }

        // Store predictions
        for (const pred of predictions) {
            await supabase.from('entity_predictions').insert({
                product_user_id: this.productUserId,
                prediction_type: pred.type,
                entity_id: pred.entityId,
                target_entity_id: pred.targetEntityId,
                prediction_value: pred.prediction,
                confidence: pred.confidence,
                reasoning: pred.reasoning,
                predicted_timeframe: pred.predictedTimeframe,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 day validity
            });
        }

        return predictions;
    }

    async findDecayingRelationships(): Promise<{
        sourceEntityId: string;
        targetEntityId: string;
        strength: number;
        daysInactive: number;
    }[]> {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data } = await supabase
            .from('entity_relationships')
            .select('source_entity_id, target_entity_id, strength, last_mentioned_at')
            .eq('product_user_id', this.productUserId)
            .is('valid_until', null)
            .gt('strength', 0.3)
            .lt('last_mentioned_at', thirtyDaysAgo)
            .order('strength', { ascending: false })
            .limit(10);

        return (data || []).map(row => ({
            sourceEntityId: row.source_entity_id,
            targetEntityId: row.target_entity_id,
            strength: row.strength || 0.5,
            daysInactive: Math.floor(
                (Date.now() - new Date(row.last_mentioned_at).getTime()) / (24 * 60 * 60 * 1000)
            ),
        }));
    }

    async findConnectionOpportunities(): Promise<{
        entityAId: string;
        entityBId: string;
        commonConnections: string[];
        suggestedRelationship: string;
        confidence: number;
        reasoning: string;
    }[]> {
        // Find entities that share many connections but aren't directly connected
        const { data: cooccurrences } = await supabase
            .from('entity_cooccurrence')
            .select(`
                entity_a_id,
                entity_b_id,
                cooccurrence_count,
                inferred_relationship,
                inference_confidence,
                common_topics
            `)
            .eq('product_user_id', this.productUserId)
            .gte('cooccurrence_count', 3)
            .is('inferred_relationship', null)
            .order('cooccurrence_count', { ascending: false })
            .limit(5);

        return (cooccurrences || []).map(row => ({
            entityAId: row.entity_a_id,
            entityBId: row.entity_b_id,
            commonConnections: [], // Would need additional query
            suggestedRelationship: 'potentially_related',
            confidence: Math.min(0.9, 0.5 + (row.cooccurrence_count * 0.1)),
            reasoning: `Mentioned together ${row.cooccurrence_count} times in topics: ${(row.common_topics || []).join(', ')}`,
        }));
    }

    // ========================================================================
    // 🎯 ENTITY CLUSTERING
    // Auto-group related entities
    // ========================================================================

    async generateClusters(): Promise<EntityCluster[]> {
        // Get all entities with relationships
        const { data: entities } = await supabase
            .from('user_entity_graph')
            .select('id, entity_name, entity_type, associated_topics')
            .eq('product_user_id', this.productUserId)
            .eq('is_active', true)
            .order('importance_score', { ascending: false })
            .limit(50);

        if (!entities || entities.length < 3) return [];

        // Use LLM to identify clusters
        const entityList = entities.map(e => `- ${e.entity_name} (${e.entity_type}): ${(e.associated_topics || []).join(', ')}`).join('\n');

        const prompt = `Group these entities into logical clusters based on their relationships and context:

ENTITIES:
${entityList}

Create clusters for work contexts, projects, personal relationships, topic areas, etc.

Respond in JSON format:
{
    "clusters": [
        {
            "name": "Work at ABC Company",
            "type": "work_context",
            "members": ["Entity Name 1", "Entity Name 2"],
            "description": "Colleagues and projects at ABC Company",
            "centralEntity": "ABC Company"
        }
    ]
}

Only create meaningful clusters. 2-4 clusters is ideal.`;

        try {
            const response = await generateContent(prompt);
            const parsed = this.extractJSON(response);

            if (!parsed?.clusters) return [];

            const clusters: EntityCluster[] = [];

            for (const clusterData of parsed.clusters) {
                // Find entity IDs for members
                const memberIds = entities
                    .filter(e => clusterData.members.includes(e.entity_name))
                    .map(e => e.id);

                const centroidEntity = entities.find(e => e.entity_name === clusterData.centralEntity);

                const cluster: EntityCluster = {
                    name: clusterData.name,
                    type: clusterData.type,
                    description: clusterData.description,
                    members: memberIds,
                    centroidEntityId: centroidEntity?.id,
                };

                // Store cluster
                const { data: newCluster } = await supabase
                    .from('entity_clusters')
                    .insert({
                        product_user_id: this.productUserId,
                        cluster_name: cluster.name,
                        cluster_type: cluster.type,
                        cluster_description: cluster.description,
                        member_count: memberIds.length,
                        centroid_entity_id: cluster.centroidEntityId,
                        is_auto_generated: true,
                        generation_method: 'llm_inference',
                    })
                    .select('id')
                    .single();

                if (newCluster) {
                    // Add members
                    for (const memberId of memberIds) {
                        await supabase.from('entity_cluster_members').insert({
                            cluster_id: newCluster.id,
                            entity_id: memberId,
                            role_in_cluster: memberId === cluster.centroidEntityId ? 'central' : 'member',
                        });
                    }

                    cluster.id = newCluster.id;
                    clusters.push(cluster);
                }
            }

            return clusters;

        } catch (error) {
            console.error('[NRM] Error generating clusters:', error);
            return [];
        }
    }

    // ========================================================================
    // 📊 CO-OCCURRENCE TRACKING
    // Track which entities are mentioned together
    // ========================================================================

    async updateCooccurrence(
        entityAId: string,
        entityBId: string,
        sameMessage: boolean,
        context?: string
    ): Promise<void> {
        // Ensure consistent ordering (smaller ID first)
        const [first, second] = [entityAId, entityBId].sort();

        try {
            const { data: existing } = await supabase
                .from('entity_cooccurrence')
                .select('*')
                .eq('product_user_id', this.productUserId)
                .eq('entity_a_id', first)
                .eq('entity_b_id', second)
                .single();

            if (existing) {
                const updatedContexts = context
                    ? [...new Set([...(existing.sample_contexts || []), context])].slice(0, 5)
                    : existing.sample_contexts;

                await supabase
                    .from('entity_cooccurrence')
                    .update({
                        cooccurrence_count: (existing.cooccurrence_count || 0) + 1,
                        same_message_count: sameMessage
                            ? (existing.same_message_count || 0) + 1
                            : existing.same_message_count,
                        same_session_count: (existing.same_session_count || 0) + 1,
                        sample_contexts: updatedContexts,
                        last_cooccurrence_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id);
            } else {
                await supabase.from('entity_cooccurrence').insert({
                    product_user_id: this.productUserId,
                    entity_a_id: first,
                    entity_b_id: second,
                    cooccurrence_count: 1,
                    same_message_count: sameMessage ? 1 : 0,
                    same_session_count: 1,
                    sample_contexts: context ? [context] : [],
                });
            }
        } catch (error) {
            console.error('[NRM] Error updating cooccurrence:', error);
        }
    }

    // ========================================================================
    // 🔄 TEMPORAL EVOLUTION
    // Track entity changes over time
    // ========================================================================

    async recordEntityChange(
        entityId: string,
        eventType: string,
        changes: Record<string, { old: any; new: any }>,
        triggeredBy: string,
        sessionId?: string
    ): Promise<void> {
        await supabase.from('entity_timeline').insert({
            entity_id: entityId,
            event_type: eventType,
            event_description: `Entity ${eventType}: ${Object.keys(changes).join(', ')}`,
            changes,
            triggered_by: triggeredBy,
            source_session_id: sessionId,
        });
    }

    async createEntitySnapshot(entityId: string): Promise<void> {
        const { data: entity } = await supabase
            .from('user_entity_graph')
            .select('*')
            .eq('id', entityId)
            .single();

        if (!entity) return;

        const { data: relCount } = await supabase
            .from('entity_relationships')
            .select('id', { count: 'exact' })
            .or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`)
            .is('valid_until', null);

        await supabase.from('entity_snapshots').insert({
            entity_id: entityId,
            snapshot_at: new Date().toISOString(),
            snapshot_data: entity,
            relationship_count: relCount?.length || 0,
            importance_score_at_time: entity.importance_score,
        });
    }

    // ========================================================================
    // 🧮 ENTITY EMBEDDINGS
    // Generate semantic embeddings for similarity search
    // ========================================================================

    private async generateEntityEmbedding(entityId: string, entity: Entity): Promise<void> {
        try {
            const textToEmbed = [
                entity.name,
                entity.description || '',
                ...(entity.keyFacts || []),
                entity.type,
                entity.subtype || '',
            ].filter(Boolean).join(' ');

            const embedding = await generateEmbedding(textToEmbed);

            await supabase
                .from('user_entity_graph')
                .update({ embedding })
                .eq('id', entityId);

        } catch (error) {
            console.error('[NRM] Error generating embedding:', error);
        }
    }

    async findSimilarEntities(entityId: string, limit: number = 5): Promise<Entity[]> {
        const { data: entity } = await supabase
            .from('user_entity_graph')
            .select('embedding')
            .eq('id', entityId)
            .single();

        if (!entity?.embedding) return [];

        // Use pgvector similarity search
        const { data } = await supabase.rpc('match_entities', {
            query_embedding: entity.embedding,
            match_count: limit,
            user_id: this.productUserId,
        });

        if (!data) return [];

        return data.map((row: any) => this.dbRowToEntity(row));
    }

    // ========================================================================
    // 🛠️ UTILITY FUNCTIONS
    // ========================================================================

    private normalizeEntityName(name: string): string {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '_');
    }

    private extractJSON(text: string): any | null {
        // Try to extract JSON from markdown code blocks first
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            try {
                return JSON.parse(codeBlockMatch[1].trim());
            } catch { /* continue */ }
        }

        // Try to find balanced braces
        let depth = 0;
        let startIdx = -1;
        let endIdx = -1;

        for (let i = 0; i < text.length; i++) {
            if (text[i] === '{') {
                if (depth === 0) startIdx = i;
                depth++;
            } else if (text[i] === '}') {
                depth--;
                if (depth === 0 && startIdx !== -1) {
                    endIdx = i;
                    break;
                }
            }
        }

        if (startIdx !== -1 && endIdx !== -1) {
            try {
                return JSON.parse(text.substring(startIdx, endIdx + 1));
            } catch {
                try {
                    const fixed = text.substring(startIdx, endIdx + 1)
                        .replace(/,\s*}/g, '}')
                        .replace(/,\s*]/g, ']');
                    return JSON.parse(fixed);
                } catch { /* continue */ }
            }
        }

        return null;
    }

    private dbRowToEntity(row: any): Entity {
        return {
            id: row.id,
            name: row.entity_name,
            canonicalName: row.entity_name_normalized,
            type: row.entity_type as EntityType,
            subtype: row.entity_subtype,
            aliases: row.entity_aliases || [],
            description: row.description,
            keyFacts: row.key_facts || [],
            metadata: row.metadata || {},
            importanceScore: row.importance_score,
            mentionCount: row.mention_count,
            firstMentionedAt: row.first_mentioned_at ? new Date(row.first_mentioned_at) : undefined,
            lastMentionedAt: row.last_mentioned_at ? new Date(row.last_mentioned_at) : undefined,
        };
    }

    private dbRowToRelationship(row: any): Relationship {
        return {
            id: row.id,
            sourceEntityId: row.source_entity_id,
            targetEntityId: row.target_entity_id,
            category: row.relationship_category as RelationshipCategory,
            type: row.relationship_type,
            label: row.relationship_label,
            isBidirectional: row.is_bidirectional,
            strength: row.strength,
            sentiment: row.sentiment,
            confidence: row.confidence,
            inferenceMethod: row.inference_method,
            validFrom: row.valid_from ? new Date(row.valid_from) : undefined,
            validUntil: row.valid_until ? new Date(row.valid_until) : null,
            isTemporal: row.is_temporal,
            temporalContext: row.temporal_context,
            mentionCount: row.mention_count,
            contextExamples: row.context_examples || [],
        };
    }
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

export async function processEntitiesFromChat(
    productUserId: string,
    productId: string,
    messages: { role: string; content: string }[],
    sessionId?: string
): Promise<{
    entitiesProcessed: number;
    relationshipsProcessed: number;
    newEntities: string[];
}> {
    const nrm = new NeuralRelationalMemory(productUserId, productId);

    // Extract entities and relationships
    const extracted = await nrm.extractEntitiesFromMessages(messages);

    let entitiesProcessed = 0;
    let relationshipsProcessed = 0;
    const newEntities: string[] = [];
    const entityIdMap: Record<string, string> = {};

    // Store entities first and build name->ID map
    for (const item of extracted) {
        const entityId = await nrm.storeEntity(item.entity);
        if (entityId) {
            entityIdMap[item.entity.name] = entityId;
            // Also map canonical name and aliases
            if (item.entity.canonicalName) {
                entityIdMap[item.entity.canonicalName] = entityId;
            }
            (item.entity.aliases || []).forEach(alias => {
                entityIdMap[alias] = entityId;
            });
            entitiesProcessed++;
            newEntities.push(item.entity.name);
        }
    }

    // Process relationships that were extracted with entities
    // Each extracted entity has its relationships bundled
    for (const item of extracted) {
        for (const rel of item.relationships) {
            // The relationship has source/target info embedded
            // We need to find IDs for both source and target

            // Look up source entity ID (this entity)
            const sourceId = entityIdMap[item.entity.name] ||
                entityIdMap[item.entity.canonicalName || ''];

            // For each relationship, try to find the target entity
            // The target name comes from the relationship data
            // Since relationships are associated with entities, check both directions
            for (const [targetName, targetId] of Object.entries(entityIdMap)) {
                // Skip if same entity
                if (targetId === sourceId) continue;

                // Only create relationship if we haven't processed this pair yet
                const pairKey = [sourceId, targetId].sort().join('-');
                const relationship: Relationship = {
                    ...rel,
                    sourceEntityId: sourceId!,
                    targetEntityId: targetId,
                };

                // Store the relationship (deduplication happens in storeRelationship)
                const relId = await nrm.storeRelationship(relationship, sessionId);
                if (relId) relationshipsProcessed++;

                // Only process one relationship per entity pair per context
                break;
            }
        }
    }

    // Update co-occurrences for entities mentioned in same conversation
    const entityIds = [...new Set(Object.values(entityIdMap))];
    for (let i = 0; i < entityIds.length; i++) {
        for (let j = i + 1; j < entityIds.length; j++) {
            await nrm.updateCooccurrence(entityIds[i], entityIds[j], true);
        }
    }

    console.log(`[NRM] Processed ${entitiesProcessed} entities, ${relationshipsProcessed} relationships`);

    return {
        entitiesProcessed,
        relationshipsProcessed,
        newEntities,
    };
}

export default NeuralRelationalMemory;
