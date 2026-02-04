import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Get facts for an entity
export async function GET(request: NextRequest) {
    try {
        const entityId = request.nextUrl.searchParams.get('entityId');
        const productUserId = request.nextUrl.searchParams.get('productUserId');

        if (!entityId || !productUserId) {
            return NextResponse.json(
                { error: 'entityId and productUserId are required' },
                { status: 400 }
            );
        }

        // Verify ownership
        const { data: entity } = await supabase
            .from('user_entities')
            .select('id')
            .eq('id', entityId)
            .eq('product_user_id', productUserId)
            .single();

        if (!entity) {
            return NextResponse.json(
                { error: 'Entity not found or access denied' },
                { status: 404 }
            );
        }

        const { data: facts, error } = await supabase
            .from('entity_facts')
            .select('*')
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching facts:', error);
            return NextResponse.json(
                { error: 'Failed to fetch facts' },
                { status: 500 }
            );
        }

        return NextResponse.json({ facts: facts || [] });

    } catch (error: any) {
        console.error('Facts API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Add fact to entity (usually from memory extraction)
export async function POST(request: NextRequest) {
    try {
        const { entityId, entityName, productUserId, factType, summary, details, sourceChatId } = await request.json();

        if (!productUserId || !factType || !summary) {
            return NextResponse.json(
                { error: 'productUserId, factType, and summary are required' },
                { status: 400 }
            );
        }

        if (!entityId && !entityName) {
            return NextResponse.json(
                { error: 'Either entityId or entityName is required' },
                { status: 400 }
            );
        }

        let targetEntityId = entityId;

        // If entityName is provided, find or create the entity
        if (!entityId && entityName) {
            // Try to find existing entity by name
            const { data: existingEntity } = await supabase
                .from('user_entities')
                .select('id')
                .eq('product_user_id', productUserId)
                .ilike('name', entityName)
                .single();

            if (existingEntity) {
                targetEntityId = existingEntity.id;
            } else {
                // Create new entity
                const { data: newEntity, error: createError } = await supabase
                    .from('user_entities')
                    .insert({
                        product_user_id: productUserId,
                        name: entityName,
                    })
                    .select('id')
                    .single();

                if (createError) {
                    console.error('Failed to create entity:', createError);
                    return NextResponse.json(
                        { error: 'Failed to create entity for fact' },
                        { status: 500 }
                    );
                }
                targetEntityId = newEntity.id;
            }
        } else {
            // Verify ownership if entityId was provided
            const { data: entity } = await supabase
                .from('user_entities')
                .select('id')
                .eq('id', entityId)
                .eq('product_user_id', productUserId)
                .single();

            if (!entity) {
                return NextResponse.json(
                    { error: 'Entity not found or access denied' },
                    { status: 404 }
                );
            }
        }

        const { data: fact, error } = await supabase
            .from('entity_facts')
            .insert({
                entity_id: targetEntityId,
                fact_type: factType,
                summary,
                details: details || {},
                source_chat_id: sourceChatId || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating fact:', error);
            return NextResponse.json(
                { error: 'Failed to create fact' },
                { status: 500 }
            );
        }

        // Update entity's updated_at
        await supabase
            .from('user_entities')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', targetEntityId);

        return NextResponse.json({
            success: true,
            fact,
            entityId: targetEntityId,
        });

    } catch (error: any) {
        console.error('Fact creation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Remove a fact
export async function DELETE(request: NextRequest) {
    try {
        const factId = request.nextUrl.searchParams.get('factId');
        const productUserId = request.nextUrl.searchParams.get('productUserId');

        if (!factId || !productUserId) {
            return NextResponse.json(
                { error: 'factId and productUserId are required' },
                { status: 400 }
            );
        }

        // Verify ownership through entity
        const { data: fact } = await supabase
            .from('entity_facts')
            .select('entity_id')
            .eq('id', factId)
            .single();

        if (!fact) {
            return NextResponse.json(
                { error: 'Fact not found' },
                { status: 404 }
            );
        }

        const { data: entity } = await supabase
            .from('user_entities')
            .select('id')
            .eq('id', fact.entity_id)
            .eq('product_user_id', productUserId)
            .single();

        if (!entity) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        const { error } = await supabase
            .from('entity_facts')
            .delete()
            .eq('id', factId);

        if (error) {
            console.error('Error deleting fact:', error);
            return NextResponse.json(
                { error: 'Failed to delete fact' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Fact deleted successfully',
        });

    } catch (error: any) {
        console.error('Fact deletion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
