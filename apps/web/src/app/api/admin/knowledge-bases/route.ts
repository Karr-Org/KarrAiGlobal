
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/knowledge-bases
 * Fetch knowledge bases for a specific product.
 * Uses product_knowledge_bases junction table since KBs are shared.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
        return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    try {
        // Query through junction table: product_knowledge_bases links products to KBs
        const { data: junctionData, error: junctionError } = await supabase
            .from('product_knowledge_bases')
            .select('knowledge_base_id')
            .eq('product_id', productId);

        if (junctionError) {
            console.error('Error fetching junction data:', junctionError);
            return NextResponse.json({ error: junctionError.message }, { status: 500 });
        }

        // If no KBs linked, return empty array
        if (!junctionData || junctionData.length === 0) {
            console.log(`[Knowledge Bases API] No KBs linked to product ${productId}`);
            return NextResponse.json({
                success: true,
                knowledgeBases: []
            });
        }

        // Get the actual KB details
        const kbIds = junctionData.map(j => j.knowledge_base_id);
        const { data: knowledgeBases, error } = await supabase
            .from('knowledge_bases')
            .select('id, name, description')
            .in('id', kbIds)
            .order('name');

        if (error) {
            console.error('Error fetching knowledge bases:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`[Knowledge Bases API] Found ${knowledgeBases?.length || 0} KBs for product ${productId}`);

        return NextResponse.json({
            success: true,
            knowledgeBases: knowledgeBases || []
        });

    } catch (error: any) {
        console.error('Knowledge Bases API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
