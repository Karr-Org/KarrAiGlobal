import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { userId, productId, displayName } = await request.json();

        if (!userId || !productId) {
            return NextResponse.json(
                { error: 'userId and productId are required' },
                { status: 400 }
            );
        }

        // Check if product exists
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, name')
            .eq('id', productId)
            .single();

        if (productError || !product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // Check if user already has access to this product
        const { data: existing } = await supabase
            .from('product_users')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .single();

        if (existing) {
            return NextResponse.json({
                success: true,
                productUserId: existing.id,
                message: 'User already has access to this product'
            });
        }

        // Create product user
        const { data: productUser, error: puError } = await supabase
            .from('product_users')
            .insert({
                user_id: userId,
                product_id: productId,
                display_name: displayName || 'User',
                role: 'user',
            })
            .select()
            .single();

        if (puError) {
            console.error('Error creating product user:', puError);
            return NextResponse.json(
                { error: 'Failed to create product user' },
                { status: 500 }
            );
        }

        // Create default knowledge base for user
        const { data: kb, error: kbError } = await supabase
            .from('user_knowledge_bases')
            .insert({
                product_user_id: productUser.id,
                name: 'My Documents',
                description: 'Your personal knowledge base',
            })
            .select()
            .single();

        if (kbError) {
            console.error('Error creating user KB:', kbError);
            // Don't fail the whole request, KB can be created later
        }

        return NextResponse.json({
            success: true,
            productUserId: productUser.id,
            knowledgeBaseId: kb?.id,
            message: 'Account created successfully!'
        });

    } catch (error: any) {
        console.error('Product signup error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
