import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import crypto from 'crypto';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify the authenticated user owns this product
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

function generateApiKey(): string {
    // Format: pk_live_<32 random hex chars>
    const random = crypto.randomBytes(24).toString('hex');
    return `pk_live_${random}`;
}

function hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
}

// GET — List API keys for a product
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
        .from('product_api_keys')
        .select('id, key_prefix, name, is_active, permissions, rate_limit_per_minute, allowed_origins, request_count, last_used_at, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ keys: data || [] });
}

// POST — Generate a new API key
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: productId } = await params;

    const ownerId = await verifyProductOwner(productId);
    if (!ownerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name = 'Default', allowed_origins = [] } = body;

    // Generate key
    const fullKey = generateApiKey();
    const keyHash = hashKey(fullKey);
    const keyPrefix = fullKey.substring(0, 12); // "pk_live_xxxx"

    const { data, error } = await supabase
        .from('product_api_keys')
        .insert({
            product_id: productId,
            key_prefix: keyPrefix,
            key_hash: keyHash,
            name,
            allowed_origins,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the full key ONLY on creation (never again)
    return NextResponse.json({
        key: {
            ...data,
            full_key: fullKey,  // ⚠️ Shown once, never stored in plain text
        },
    });
}

// DELETE — Revoke an API key
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: productId } = await params;

    const ownerId = await verifyProductOwner(productId);
    if (!ownerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('keyId');

    if (!keyId) {
        return NextResponse.json({ error: 'keyId is required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('product_api_keys')
        .delete()
        .eq('id', keyId)
        .eq('product_id', productId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
