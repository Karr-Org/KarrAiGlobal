import { NextRequest, NextResponse } from 'next/server';
import { requireCreator, getAdmin } from '@/lib/auth';

// GET: List products owned by the authenticated creator
export async function GET() {
    try {
        const { user, creator } = await requireCreator();
        const admin = getAdmin();

        // Fetch products scoped to this creator
        let query = admin
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

        // Super admins see all, creators see only their own
        if (creator.role !== 'super_admin') {
            query = query.eq('created_by', user.id);
        }

        const { data: products, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get user counts per product
        const productIds = (products || []).map((p: any) => p.id);
        let userCounts: Record<string, number> = {};

        if (productIds.length > 0) {
            const { data: counts } = await admin
                .from('product_users')
                .select('product_id')
                .in('product_id', productIds);

            if (counts) {
                counts.forEach((c: any) => {
                    userCounts[c.product_id] = (userCounts[c.product_id] || 0) + 1;
                });
            }
        }

        const formattedProducts = (products || []).map((p: any) => ({
            ...p,
            knowledge_bases: p.product_knowledge_bases?.map((pkb: any) => pkb.knowledge_bases) || [],
            user_count: userCounts[p.id] || 0,
        }));

        return NextResponse.json(formattedProducts);

    } catch (e) {
        if (e instanceof NextResponse) return e;
        const message = e instanceof Error ? e.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST: Create a new product as a creator
export async function POST(request: NextRequest) {
    try {
        const { user, creator } = await requireCreator();
        const admin = getAdmin();

        const body = await request.json();
        const {
            name,
            slug,
            domain,
            description,
            tagline,
            category,
            selectedKbIds,
            primaryColor,
            webSources
        } = body;

        if (!name || !slug) {
            return NextResponse.json(
                { error: 'name and slug are required' },
                { status: 400 }
            );
        }

        // Check product limit
        const productLimit = creator.platform_plans?.product_limit || 1;
        if (creator.product_count >= productLimit) {
            return NextResponse.json({
                error: `You've reached your plan limit of ${productLimit} product(s). Upgrade your plan to create more.`,
                code: 'PLAN_LIMIT_REACHED'
            }, { status: 403 });
        }

        // Create product — created_by is the verified session user
        const { data: product, error: prodError } = await admin
            .from('products')
            .insert({
                name,
                slug,
                domain: domain || null,
                description,
                tagline: tagline || null,
                category: category || 'general',
                primary_color: primaryColor || '#1a365d',
                status: 'active',
                created_by: user.id,
            })
            .select()
            .single();

        if (prodError) {
            return NextResponse.json(
                { error: 'Failed to create product: ' + prodError.message },
                { status: 500 }
            );
        }

        // Link Knowledge Bases
        if (selectedKbIds && Array.isArray(selectedKbIds) && selectedKbIds.length > 0) {
            const associations = selectedKbIds.map((kbId: string) => ({
                product_id: product.id,
                knowledge_base_id: kbId,
            }));

            const { error: linkError } = await admin
                .from('product_knowledge_bases')
                .insert(associations);

            if (linkError) {
                console.error('Failed to link KBs:', linkError);
            }
        }

        // Add Web Sources (OKSE)
        if (webSources && Array.isArray(webSources) && webSources.length > 0) {
            const sourcesToInsert = webSources.map((source: any) => ({
                product_id: product.id,
                domain: source.domain,
                display_name: source.displayName || source.domain,
                authority_score: source.authorityScore || 7,
                source_type: 'professional',
                crawl_frequency: 'daily',
                url_patterns: ['/*'],
                css_selectors: { content: 'main, article, .content', exclude: ['nav', 'footer', '.sidebar'] },
                rate_limit_ms: 1000,
                is_active: true,
            }));

            await admin.from('trusted_web_sources').insert(sourcesToInsert);
        }

        // Atomically increment product count to avoid race condition
        await admin.rpc('increment_product_count', { creator_profile_id: creator.id });

        return NextResponse.json({ success: true, product });

    } catch (e) {
        if (e instanceof NextResponse) return e;
        const message = e instanceof Error ? e.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
