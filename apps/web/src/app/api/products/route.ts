import { NextRequest, NextResponse } from 'next/server';
import { requireCreator, getAdmin, withAuth } from '@/lib/auth';
import { validateCreateProduct } from '@/lib/validations';

// GET: List all products (creator/admin only)
export async function GET(request: NextRequest) {
    return withAuth(async () => {
        const { user } = await requireCreator();
        const supabase = getAdmin();

        // Only show products created by this creator (or all for super_admin)
        const { data: creator } = await supabase
            .from('creator_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        let query = supabase
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

        // Non-super_admins only see their own products
        if (creator?.role !== 'super_admin') {
            query = query.eq('created_by', user.id);
        }

        const { data: products, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const formattedProducts = (products || []).map((p: any) => ({
            ...p,
            knowledge_bases: p.product_knowledge_bases?.map((pkb: any) => pkb.knowledge_bases) || []
        }));

        return NextResponse.json(formattedProducts);
    });
}

// POST: Create product (creator only)
export async function POST(request: NextRequest) {
    return withAuth(async () => {
        const { user } = await requireCreator();
        const supabase = getAdmin();

        const body = await request.json();

        // Validate input
        const validation = validateCreateProduct(body);
        if (!validation.success) return validation.response;

        const {
            name,
            slug,
            domain,
            description,
            selectedKbIds,
            primaryColor,
            webSources
        } = validation.data;

        // 1. Create Product — assign to current creator
        const { data: product, error: prodError } = await supabase
            .from('products')
            .insert({
                name,
                slug,
                domain: domain || null,
                description,
                primary_color: primaryColor || '#1a365d',
                status: 'active',
                created_by: user.id,
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
                console.error('Failed to link KBs:', linkError);
                return NextResponse.json({ error: 'Product created but failed to link KBs: ' + linkError.message }, { status: 500 });
            }
        }

        // 3. Add Web Sources (OKSE)
        if (webSources && Array.isArray(webSources) && webSources.length > 0) {
            const sourcesToInsert = webSources.map((source: { domain: string; displayName?: string; authorityScore?: number }) => ({
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
            }
        }

        // Update creator's product count
        await supabase.rpc('increment_product_count', { creator_user_id: user.id }).catch(() => { });

        return NextResponse.json({ success: true, product });
    });
}
