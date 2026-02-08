import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    const { data: products, error } = await supabase
        .from('products')
        .select(`
            *,
            product_knowledge_bases (
                knowledge_bases (
                    id,
                    name
                )
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform logic to flatten structure if needed for UI
    const formattedProducts = products.map((p: any) => ({
        ...p,
        knowledge_bases: p.product_knowledge_bases?.map((pkb: any) => pkb.knowledge_bases) || []
    }));

    return NextResponse.json(formattedProducts);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            slug,
            domain,
            description,
            selectedKbIds, // Array of KB IDs
            primaryColor,
            webSources // Array of { domain, displayName, authorityScore }
        } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
        }

        // 1. Create Product
        const { data: product, error: prodError } = await supabase
            .from('products')
            .insert({
                name,
                slug,
                domain: domain || null,
                description,
                // knowledge_base_id removed from schema
                primary_color: primaryColor || '#1a365d',
                status: 'active'
            })
            .select()
            .single();

        if (prodError) {
            return NextResponse.json({ error: 'Failed to create Product: ' + prodError.message }, { status: 500 });
        }

        // 2. Link Knowledge Bases
        if (selectedKbIds && Array.isArray(selectedKbIds) && selectedKbIds.length > 0) {
            const associations = selectedKbIds.map((kbId: string) => ({
                product_id: product.id,
                knowledge_base_id: kbId
            }));

            const { error: linkError } = await supabase
                .from('product_knowledge_bases')
                .insert(associations);

            if (linkError) {
                // Should we delete product? Maybe just warn.
                console.error('Failed to link KBs:', linkError);
                return NextResponse.json({ error: 'Product created but failed to link KBs: ' + linkError.message }, { status: 500 });
            }
        }

        // 3. Add Web Sources (OKSE)
        if (webSources && Array.isArray(webSources) && webSources.length > 0) {
            const sourcesToInsert = webSources.map((source: { domain: string; displayName: string; authorityScore: number }) => ({
                product_id: product.id,
                domain: source.domain,
                display_name: source.displayName || source.domain,
                authority_score: source.authorityScore || 7,
                source_type: 'professional',
                crawl_frequency: 'daily',
                url_patterns: ['/*'],
                css_selectors: { content: 'main, article, .content', exclude: ['nav', 'footer', '.sidebar'] },
                rate_limit_ms: 1000,
                is_active: true
            }));

            const { error: sourceError } = await supabase
                .from('trusted_web_sources')
                .insert(sourcesToInsert);

            if (sourceError) {
                console.error('Failed to add web sources:', sourceError);
                // Don't fail the whole request, just log
            }
        }

        return NextResponse.json({ success: true, product });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
