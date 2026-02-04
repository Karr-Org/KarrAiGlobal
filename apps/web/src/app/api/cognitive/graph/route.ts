/**
 * 🧠 KARR AI - Knowledge Graph API
 * 
 * Returns the full entity network with relationships for visualization.
 * Part of the Neural Relational Memory (NRM) system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Color palette for entity types
const ENTITY_COLORS: Record<string, string> = {
    person: '#FF6B6B',        // Coral red
    organization: '#4ECDC4',  // Teal
    company: '#4ECDC4',       // Teal
    place: '#45B7D1',         // Sky blue
    location: '#45B7D1',      // Sky blue
    concept: '#96CEB4',       // Sage green
    product: '#F39C12',       // Orange
    service: '#E67E22',       // Dark orange
    project: '#FFEAA7',       // Yellow
    document: '#DDA0DD',      // Plum
    event: '#9B59B6',         // Purple
    temporal_fact: '#8E44AD', // Dark purple
    technology: '#3498DB',    // Blue
    tool: '#2980B9',          // Dark blue
    regulation: '#1ABC9C',    // Turquoise
    form: '#16A085',          // Dark turquoise
};

// Size multiplier based on importance
const getSizeFromImportance = (importance: number) => {
    return Math.max(5, Math.min(25, importance * 20 + 5));
};

interface GraphNode {
    id: string;
    name: string;
    type: string;
    subtype?: string;
    description?: string;
    importance: number;
    mentions: number;
    color: string;
    size: number;
    facts?: string[];
}

interface GraphLink {
    source: string;
    target: string;
    type: string;
    category: string;
    strength: number;
    label?: string;
    color: string;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
    stats: {
        totalNodes: number;
        totalLinks: number;
        nodesByType: Record<string, number>;
        linksByCategory: Record<string, number>;
    };
}

/**
 * GET /api/cognitive/graph
 * 
 * Get the full entity network for visualization.
 * 
 * Query params:
 * - productUserId: Required - User's ID
 * - limit: Optional - Max entities (default 100)
 * - minImportance: Optional - Minimum importance score (0-1)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productUserId = searchParams.get('productUserId');
        const limit = parseInt(searchParams.get('limit') || '100');
        const minImportance = parseFloat(searchParams.get('minImportance') || '0');

        if (!productUserId) {
            return NextResponse.json(
                { error: 'productUserId is required' },
                { status: 400 }
            );
        }

        // Fetch entities
        let entityQuery = supabase
            .from('user_entity_graph')
            .select(`
                id,
                entity_name,
                entity_type,
                entity_subtype,
                description,
                key_facts,
                relationship_strength,
                mention_count
            `)
            .eq('product_user_id', productUserId)
            .eq('is_active', true)
            .gte('relationship_strength', minImportance)
            .order('relationship_strength', { ascending: false })
            .limit(limit);

        const { data: entities, error: entitiesError } = await entityQuery;

        if (entitiesError) {
            console.error('[Graph API] Entities error:', entitiesError);
            return NextResponse.json(
                { error: 'Failed to fetch entities' },
                { status: 500 }
            );
        }

        // Get entity IDs for relationship lookup
        const entityIds = entities?.map(e => e.id) || [];

        // Fetch relationships between these entities (graceful degradation if table doesn't exist)
        let relationships: any[] = [];
        let cooccurrences: any[] = [];

        if (entityIds.length > 0) {
            try {
                const { data: relData } = await supabase
                    .from('entity_relationships')
                    .select(`
                        id,
                        source_entity_id,
                        target_entity_id,
                        relationship_type,
                        relationship_category,
                        relationship_label,
                        strength,
                        sentiment
                    `)
                    .eq('product_user_id', productUserId)
                    .is('valid_until', null)
                    .or(`source_entity_id.in.(${entityIds.join(',')}),target_entity_id.in.(${entityIds.join(',')})`)
                    .order('strength', { ascending: false });
                relationships = relData || [];
            } catch (err) {
                // Table may not exist yet - continue without relationships
                console.log('[Graph API] entity_relationships table not available');
            }

            try {
                // Also check co-occurrences for implicit relationships
                const { data: coocData } = await supabase
                    .from('entity_cooccurrence')
                    .select(`
                        entity_a_id,
                        entity_b_id,
                        cooccurrence_count,
                        inferred_relationship,
                        inference_confidence
                    `)
                    .eq('product_user_id', productUserId)
                    .gte('cooccurrence_count', 2);
                cooccurrences = coocData || [];
            } catch (err) {
                // Table may not exist yet - continue without cooccurrences
                console.log('[Graph API] entity_cooccurrence table not available');
            }
        }

        // Build graph nodes
        const nodes: GraphNode[] = (entities || []).map(entity => ({
            id: entity.id,
            name: entity.entity_name,
            type: entity.entity_type,
            subtype: entity.entity_subtype,
            description: entity.description,
            importance: entity.relationship_strength || 0.5,
            mentions: entity.mention_count || 1,
            color: ENTITY_COLORS[entity.entity_type] || '#888888',
            size: getSizeFromImportance(entity.relationship_strength || 0.5),
            facts: entity.key_facts || [],
        }));

        // Build graph links from explicit relationships
        const links: GraphLink[] = [];
        const linkSet = new Set<string>(); // Prevent duplicates

        // Add explicit relationships
        (relationships || []).forEach(rel => {
            // Only add if both entities are in our node set
            if (entityIds.includes(rel.source_entity_id) && entityIds.includes(rel.target_entity_id)) {
                const linkKey = `${rel.source_entity_id}-${rel.target_entity_id}-${rel.relationship_type}`;
                if (!linkSet.has(linkKey)) {
                    linkSet.add(linkKey);
                    links.push({
                        source: rel.source_entity_id,
                        target: rel.target_entity_id,
                        type: rel.relationship_type,
                        category: rel.relationship_category,
                        strength: rel.strength || 0.5,
                        label: rel.relationship_label,
                        color: getCategoryColor(rel.relationship_category),
                    });
                }
            }
        });

        // Add implicit relationships from co-occurrences (if no explicit relationship exists)
        (cooccurrences || []).forEach(cooc => {
            if (entityIds.includes(cooc.entity_a_id) && entityIds.includes(cooc.entity_b_id)) {
                const linkKey1 = `${cooc.entity_a_id}-${cooc.entity_b_id}`;
                const linkKey2 = `${cooc.entity_b_id}-${cooc.entity_a_id}`;

                // Check if any explicit relationship exists
                const hasExplicit = links.some(l =>
                    (l.source === cooc.entity_a_id && l.target === cooc.entity_b_id) ||
                    (l.source === cooc.entity_b_id && l.target === cooc.entity_a_id)
                );

                if (!hasExplicit && cooc.cooccurrence_count >= 3) {
                    links.push({
                        source: cooc.entity_a_id,
                        target: cooc.entity_b_id,
                        type: cooc.inferred_relationship || 'mentioned_together',
                        category: 'inference',
                        strength: Math.min(0.8, 0.3 + (cooc.cooccurrence_count * 0.1)),
                        label: `Mentioned together ${cooc.cooccurrence_count} times`,
                        color: '#AAAAAA', // Gray for inferred
                    });
                }
            }
        });

        // Calculate stats
        const nodesByType: Record<string, number> = {};
        nodes.forEach(n => {
            nodesByType[n.type] = (nodesByType[n.type] || 0) + 1;
        });

        const linksByCategory: Record<string, number> = {};
        links.forEach(l => {
            linksByCategory[l.category] = (linksByCategory[l.category] || 0) + 1;
        });

        const graphData: GraphData = {
            nodes,
            links,
            stats: {
                totalNodes: nodes.length,
                totalLinks: links.length,
                nodesByType,
                linksByCategory,
            }
        };

        return NextResponse.json({
            success: true,
            graph: graphData,
        });

    } catch (error: any) {
        console.error('[Graph API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// Color palette for relationship categories
function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
        professional: '#3498DB',   // Blue
        personal: '#E74C3C',       // Red
        transactional: '#2ECC71',  // Green
        knowledge: '#9B59B6',      // Purple
        temporal: '#F39C12',       // Orange
        inference: '#95A5A6',      // Gray
        emotional: '#E91E63',      // Pink
    };
    return colors[category] || '#888888';
}
