import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/lib/supabase/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyProductOwner(productId: string): Promise<string | null> {
    const authClient = await createServerSupabase();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return null;

    const { data: product } = await supabase
        .from('products')
        .select('created_by')
        .eq('id', productId)
        .single();

    if (!product || product.created_by !== user.id) return null;
    return user.id;
}

// GET /api/products/[id]/persona — Fetch persona for a product
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: productId } = await params;

    const ownerId = await verifyProductOwner(productId);
    if (!ownerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('agent_persona')
        .select('*')
        .eq('product_id', productId)
        .single();

    if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows (OK — just means no persona yet)
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ persona: data || null });
}

// PUT /api/products/[id]/persona — Create or update persona
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: productId } = await params;

    const ownerId = await verifyProductOwner(productId);
    if (!ownerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Strip fields that shouldn't be updated directly
    const {
        id: _id,
        product_id: _pid,
        created_at: _ca,
        updated_at: _ua,
        website_crawl_status: _wcs,
        website_pages_indexed: _wpi,
        website_last_crawled_at: _wlca,
        ...personaFields
    } = body;

    // Check if persona already exists
    const { data: existing } = await supabase
        .from('agent_persona')
        .select('id')
        .eq('product_id', productId)
        .single();

    let result;
    if (existing) {
        // Update
        result = await supabase
            .from('agent_persona')
            .update({ ...personaFields, updated_at: new Date().toISOString() })
            .eq('product_id', productId)
            .select()
            .single();
    } else {
        // Insert
        result = await supabase
            .from('agent_persona')
            .insert({ ...personaFields, product_id: productId })
            .select()
            .single();
    }

    if (result.error) {
        console.error('[Persona API] Error:', result.error);
        return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ persona: result.data });
}
