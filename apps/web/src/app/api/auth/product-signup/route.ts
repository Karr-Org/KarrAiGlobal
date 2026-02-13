import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Verify the caller is authenticated
        const user = await requireAuth();
        const admin = getAdmin();

        const { productId, displayName } = await request.json();

        if (!productId) {
            return NextResponse.json(
                { error: 'productId is required' },
                { status: 400 }
            );
        }

        // Check if product exists
        const { data: product, error: productError } = await admin
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
        const { data: existing } = await admin
            .from('product_users')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single();

        if (existing) {
            return NextResponse.json({
                success: true,
                productUserId: existing.id,
                message: 'User already has access to this product'
            });
        }

        // Create product user — userId comes from verified session
        const { data: productUser, error: puError } = await admin
            .from('product_users')
            .insert({
                user_id: user.id,
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
        const { data: kb, error: kbError } = await admin
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

    } catch (e) {
        if (e instanceof NextResponse) return e;
        const message = e instanceof Error ? e.message : 'Internal server error';
        console.error('Product signup error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
