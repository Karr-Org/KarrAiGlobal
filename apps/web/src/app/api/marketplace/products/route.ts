import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Public marketplace product listing
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // Base query — only active products
        let query = supabase
            .from('products')
            .select(`
                id,
                name,
                slug,
                description,
                tagline,
                category,
                primary_color,
                domain,
                is_featured,
                created_at,
                created_by
            `, { count: 'exact' })
            .eq('status', 'active')
            .order('is_featured', { ascending: false })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Category filter
        if (category) {
            query = query.eq('category', category);
        }

        // Search filter
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tagline.ilike.%${search}%`);
        }

        const { data: products, error, count } = await query;

        if (error) {
            // If foreign key join fails (creator_profiles table might not exist yet), fallback
            const fallbackQuery = supabase
                .from('products')
                .select('id, name, slug, description, tagline, category, primary_color, domain, is_featured, created_at', { count: 'exact' })
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data: fallbackProducts, count: fallbackCount } = await fallbackQuery;

            return NextResponse.json({
                products: fallbackProducts || [],
                total: fallbackCount || 0,
                page,
                limit,
            });
        }

        // Get user counts for each product
        const productIds = (products || []).map((p: any) => p.id);
        let userCounts: Record<string, number> = {};

        if (productIds.length > 0) {
            const { data: counts } = await supabase
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
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            tagline: p.tagline,
            category: p.category,
            primaryColor: p.primary_color,
            domain: p.domain,
            isFeatured: p.is_featured,
            userCount: userCounts[p.id] || 0,
            createdAt: p.created_at,
            creator: null,
        }));

        return NextResponse.json({
            products: formattedProducts,
            total: count || 0,
            page,
            limit,
        });

    } catch (error: any) {
        console.error('Marketplace error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
