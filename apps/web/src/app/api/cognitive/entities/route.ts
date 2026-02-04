/**
 * 🧠 KARR AI - Entity Graph API
 * 
 * Endpoints for accessing user's entity knowledge graph.
 * Part of the Neural Relational Memory (NRM) system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/cognitive/entities
 * 
 * Get all entities for a user with optional filtering.
 * 
 * Query params:
 * - productUserId: Required - User's ID
 * - type: Optional - Filter by entity type (person, organization, etc.)
 * - limit: Optional - Max entities to return (default 50)
 * - sortBy: Optional - Sort field (importance, recent, mentions)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productUserId = searchParams.get('productUserId');
        const entityType = searchParams.get('type');
        const limit = parseInt(searchParams.get('limit') || '50');
        const sortBy = searchParams.get('sortBy') || 'importance';

        if (!productUserId) {
            return NextResponse.json(
                { error: 'productUserId is required' },
                { status: 400 }
            );
        }

        // Build query
        let query = supabase
            .from('user_entity_graph')
            .select(`
                id,
                entity_name,
                entity_name_normalized,
                entity_type,
                entity_subtype,
                relationship_to_user,
                relationship_strength,
                description,
                key_facts,
                associated_topics,
                mention_count,
                first_mentioned_at,
                last_mentioned_at
            `)
            .eq('product_user_id', productUserId)
            .eq('is_active', true);

        // Apply type filter
        if (entityType) {
            query = query.eq('entity_type', entityType);
        }

        // Apply sorting
        switch (sortBy) {
            case 'recent':
                query = query.order('last_mentioned_at', { ascending: false });
                break;
            case 'mentions':
                query = query.order('mention_count', { ascending: false });
                break;
            case 'importance':
            default:
                query = query.order('relationship_strength', { ascending: false });
        }

        // Apply limit
        query = query.limit(limit);

        const { data: entities, error } = await query;

        if (error) {
            console.error('[Entities API] Error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch entities' },
                { status: 500 }
            );
        }

        // Get entity type counts for stats
        const { data: typeCounts } = await supabase
            .from('user_entity_graph')
            .select('entity_type')
            .eq('product_user_id', productUserId)
            .eq('is_active', true);

        const stats = {
            total: typeCounts?.length || 0,
            byType: {} as Record<string, number>,
        };

        typeCounts?.forEach(e => {
            stats.byType[e.entity_type] = (stats.byType[e.entity_type] || 0) + 1;
        });

        return NextResponse.json({
            success: true,
            entities: entities || [],
            stats,
            meta: {
                limit,
                sortBy,
                typeFilter: entityType,
            }
        });

    } catch (error: any) {
        console.error('[Entities API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
