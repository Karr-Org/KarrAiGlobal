/**
 * KARR AI — Centralized Auth Helpers
 *
 * Every API route that mutates data or returns user-specific data
 * MUST call one of these helpers instead of trusting userId from the request body.
 *
 * Usage:
 *   const user = await requireAuth();          // Any logged-in user
 *   const { user, creator } = await requireCreator();  // Must be a creator
 *   const { user, creator } = await requireProductOwner(productId); // Must own the product
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Lazy-init admin client (service role, bypasses RLS)
let _admin: SupabaseClient<Database> | null = null;
function getAdmin() {
    if (!_admin) {
        _admin = createAdminClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }
    return _admin;
}

export { getAdmin };

// ─── Error response helpers ──────────────────────────────────
export function unauthorized(message = 'Unauthorized') {
    return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Forbidden') {
    return NextResponse.json({ error: message }, { status: 403 });
}

// ─── Types ───────────────────────────────────────────────────
export interface AuthUser {
    id: string;
    email?: string;
}

export interface CreatorProfile {
    id: string;
    user_id: string;
    role: string;
    product_count: number;
    plan_id: string | null;
    plan_status: string;
    platform_plans?: {
        product_limit: number;
        storage_limit_gb: number;
        kb_limit: number;
        user_limit: number;
    } | null;
}

// ─── requireAuth ─────────────────────────────────────────────
// Verifies the caller is logged in via Supabase session cookies.
// Returns the user object or throws a NextResponse (401).
export async function requireAuth(): Promise<AuthUser> {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw unauthorized();
    }

    return { id: user.id, email: user.email };
}

// ─── requireCreator ──────────────────────────────────────────
// Verifies the caller is a creator (has a creator_profiles row).
export async function requireCreator(): Promise<{ user: AuthUser; creator: CreatorProfile }> {
    const user = await requireAuth();
    const admin = getAdmin();

    const { data: creator, error } = await admin
        .from('creator_profiles')
        .select(`
            id, user_id, role, product_count, plan_id, plan_status,
            platform_plans (product_limit, storage_limit_gb, kb_limit, user_limit)
        `)
        .eq('user_id', user.id)
        .single();

    if (error || !creator) {
        throw forbidden('Not a creator');
    }

    return { user, creator: creator as CreatorProfile };
}

// ─── requireProductOwner ─────────────────────────────────────
// Verifies the caller owns the given product (or is super_admin).
export async function requireProductOwner(productId: string): Promise<{ user: AuthUser; creator: CreatorProfile }> {
    const { user, creator } = await requireCreator();

    // Super admins can access any product
    if (creator.role === 'super_admin') {
        return { user, creator };
    }

    const admin = getAdmin();
    const { data: product } = await admin
        .from('products')
        .select('id')
        .eq('id', productId)
        .eq('created_by', user.id)
        .single();

    if (!product) {
        throw forbidden('You do not own this product');
    }

    return { user, creator };
}

// ─── withAuth wrapper ────────────────────────────────────────
// Catches the thrown NextResponse from requireAuth/requireCreator
// so route handlers can use try/catch cleanly.
export async function withAuth<T>(fn: () => Promise<T>): Promise<T | NextResponse> {
    try {
        return await fn();
    } catch (e) {
        if (e instanceof NextResponse) return e;
        // Re-check: our helpers throw NextResponse objects
        if (e && typeof e === 'object' && 'status' in e) return e as NextResponse;
        throw e; // Re-throw unexpected errors
    }
}
