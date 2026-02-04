/**
 * 🌐 ENTITY MANAGEMENT API
 * 
 * Manage individual entities - delete or update.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE an entity
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const entityId = params.id;
        const { searchParams } = new URL(request.url);
        const productUserId = searchParams.get('productUserId');

        if (!entityId || !productUserId) {
            return NextResponse.json(
                { error: 'entityId and productUserId required' },
                { status: 400 }
            );
        }

        // Hard delete - remove entity completely
        const { error } = await supabase
            .from('user_entity_graph')
            .delete()
            .eq('id', entityId)
            .eq('product_user_id', productUserId);

        if (error) {
            console.error('[EntityAPI] Delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Entity removed from knowledge graph'
        });

    } catch (error: any) {
        console.error('[EntityAPI] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}

// PATCH - update entity details
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const entityId = params.id;
        const body = await request.json();
        const { productUserId, updates } = body;

        if (!entityId || !productUserId) {
            return NextResponse.json(
                { error: 'entityId and productUserId required' },
                { status: 400 }
            );
        }

        // Only allow certain fields to be updated
        const allowedFields = ['relationship_to_user', 'key_facts', 'notes'];
        const updateData: Record<string, any> = {};

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        });

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'No valid update fields provided' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('user_entity_graph')
            .update(updateData)
            .eq('id', entityId)
            .eq('product_user_id', productUserId)
            .select()
            .single();

        if (error) {
            console.error('[EntityAPI] Update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            entity: data,
            message: 'Entity updated successfully'
        });

    } catch (error: any) {
        console.error('[EntityAPI] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}
