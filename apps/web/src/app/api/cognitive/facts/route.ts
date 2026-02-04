/**
 * 🧠 MEMORY FACTS API
 * 
 * Manage memory facts - view and delete individual facts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE a fact
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const factId = searchParams.get('factId');
        const productUserId = searchParams.get('productUserId');

        if (!factId || !productUserId) {
            return NextResponse.json(
                { error: 'factId and productUserId required' },
                { status: 400 }
            );
        }

        // Soft delete - mark as inactive rather than hard delete
        const { error } = await supabase
            .from('memory_facts')
            .update({
                is_active: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', factId)
            .eq('product_user_id', productUserId);

        if (error) {
            console.error('[FactsAPI] Delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Fact removed from memory'
        });

    } catch (error: any) {
        console.error('[FactsAPI] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}

// GET facts with optional filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productUserId = searchParams.get('productUserId');
        const category = searchParams.get('category');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!productUserId) {
            return NextResponse.json({ error: 'productUserId required' }, { status: 400 });
        }

        let query = supabase
            .from('memory_facts')
            .select('*')
            .eq('product_user_id', productUserId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (category) {
            query = query.eq('fact_category', category);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[FactsAPI] Fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            facts: data,
            count: data?.length || 0
        });

    } catch (error: any) {
        console.error('[FactsAPI] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}
