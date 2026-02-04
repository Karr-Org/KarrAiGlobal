import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: List user's entities (clients, patients, cases)
export async function GET(request: NextRequest) {
    try {
        const productUserId = request.nextUrl.searchParams.get('productUserId');
        const entityId = request.nextUrl.searchParams.get('entityId');

        if (!productUserId) {
            return NextResponse.json(
                { error: 'productUserId is required' },
                { status: 400 }
            );
        }

        // If entityId provided, get single entity with facts
        if (entityId) {
            const { data: entity, error } = await supabase
                .from('user_entities')
                .select(`
                    *,
                    entity_type:product_entity_types(name, icon, fields),
                    facts:entity_facts(*)
                `)
                .eq('id', entityId)
                .eq('product_user_id', productUserId)
                .single();

            if (error || !entity) {
                return NextResponse.json(
                    { error: 'Entity not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ entity });
        }

        // Get product user to find entity types
        const { data: productUser } = await supabase
            .from('product_users')
            .select('product_id')
            .eq('id', productUserId)
            .single();

        if (!productUser) {
            return NextResponse.json(
                { error: 'Product user not found' },
                { status: 404 }
            );
        }

        // Get entity types for this product
        const { data: entityTypes } = await supabase
            .from('product_entity_types')
            .select('*')
            .eq('product_id', productUser.product_id);

        // Get all entities for this user
        const { data: entities, error } = await supabase
            .from('user_entities')
            .select(`
                *,
                entity_type:product_entity_types(name, icon),
                facts:entity_facts(count)
            `)
            .eq('product_user_id', productUserId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching entities:', error);
            return NextResponse.json(
                { error: 'Failed to fetch entities' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            entities: entities || [],
            entityTypes: entityTypes || [],
        });

    } catch (error: any) {
        console.error('Entities API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Create new entity
export async function POST(request: NextRequest) {
    try {
        const { productUserId, entityTypeId, name, metadata, notes } = await request.json();

        if (!productUserId || !name) {
            return NextResponse.json(
                { error: 'productUserId and name are required' },
                { status: 400 }
            );
        }

        // Get default entity type if not provided
        let typeId = entityTypeId;
        if (!typeId) {
            const { data: productUser } = await supabase
                .from('product_users')
                .select('product_id')
                .eq('id', productUserId)
                .single();

            if (productUser) {
                const { data: defaultType } = await supabase
                    .from('product_entity_types')
                    .select('id')
                    .eq('product_id', productUser.product_id)
                    .limit(1)
                    .single();

                typeId = defaultType?.id;
            }
        }

        if (!typeId) {
            return NextResponse.json(
                { error: 'No entity type found for this product' },
                { status: 400 }
            );
        }

        const { data: entity, error } = await supabase
            .from('user_entities')
            .insert({
                product_user_id: productUserId,
                entity_type_id: typeId,
                name,
                metadata: metadata || {},
                notes: notes || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating entity:', error);
            return NextResponse.json(
                { error: 'Failed to create entity' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            entity,
            message: `${name} created successfully`,
        });

    } catch (error: any) {
        console.error('Entity creation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT: Update entity
export async function PUT(request: NextRequest) {
    try {
        const { entityId, productUserId, name, metadata, notes } = await request.json();

        if (!entityId || !productUserId) {
            return NextResponse.json(
                { error: 'entityId and productUserId are required' },
                { status: 400 }
            );
        }

        const updates: any = { updated_at: new Date().toISOString() };
        if (name) updates.name = name;
        if (metadata) updates.metadata = metadata;
        if (notes !== undefined) updates.notes = notes;

        const { data: entity, error } = await supabase
            .from('user_entities')
            .update(updates)
            .eq('id', entityId)
            .eq('product_user_id', productUserId)
            .select()
            .single();

        if (error) {
            console.error('Error updating entity:', error);
            return NextResponse.json(
                { error: 'Failed to update entity' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            entity,
        });

    } catch (error: any) {
        console.error('Entity update error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Delete entity
export async function DELETE(request: NextRequest) {
    try {
        const entityId = request.nextUrl.searchParams.get('entityId');
        const productUserId = request.nextUrl.searchParams.get('productUserId');

        if (!entityId || !productUserId) {
            return NextResponse.json(
                { error: 'entityId and productUserId are required' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('user_entities')
            .delete()
            .eq('id', entityId)
            .eq('product_user_id', productUserId);

        if (error) {
            console.error('Error deleting entity:', error);
            return NextResponse.json(
                { error: 'Failed to delete entity' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Entity deleted successfully',
        });

    } catch (error: any) {
        console.error('Entity deletion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
