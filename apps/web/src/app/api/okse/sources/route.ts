/**
 * OKSE Sources API - Manage trusted web sources
 * 
 * Endpoints:
 * - POST /api/okse/sources - Add a new trusted source
 * - GET /api/okse/sources - List trusted sources
 * - PATCH /api/okse/sources - Update a source
 * - DELETE /api/okse/sources - Remove a source
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// Direct client for public endpoints (no cookie requirement)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Add a new trusted web source
export async function POST(request: NextRequest) {
    try {
        // NOTE: In production, add proper admin role check
        // For now, using supabaseAdmin which has service role access

        const body = await request.json();
        const {
            product_id,
            domain,
            display_name,
            source_type,
            authority_score,
            crawl_frequency,
            url_patterns,
            css_selectors,
            rate_limit_ms,
        } = body;

        // Validate required fields
        if (!product_id || !domain) {
            return NextResponse.json(
                { error: 'product_id and domain are required' },
                { status: 400 }
            );
        }

        // Check if domain already exists for this product
        const { data: existing } = await supabaseAdmin
            .from('trusted_web_sources')
            .select('id')
            .eq('product_id', product_id)
            .eq('domain', domain)
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { error: 'Domain already exists for this product' },
                { status: 409 }
            );
        }

        // Insert new source
        const { data: source, error } = await supabaseAdmin
            .from('trusted_web_sources')
            .insert({
                product_id,
                domain,
                display_name: display_name || domain,
                source_type: source_type || 'professional',
                authority_score: authority_score || 7,
                crawl_frequency: crawl_frequency || 'daily',
                url_patterns: url_patterns || ['/*'],
                css_selectors: css_selectors || { content: 'main, article, .content', exclude: ['nav', 'footer', '.sidebar'] },
                rate_limit_ms: rate_limit_ms || 1000,
                is_active: true,
                // created_by: null, // Set when proper auth is implemented
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            source,
            message: `Added ${domain} as trusted source`,
        });

    } catch (error) {
        console.error('[OKSE API] Add source error:', error);
        return NextResponse.json(
            { error: 'Failed to add source', details: String(error) },
            { status: 500 }
        );
    }
}

// GET - List trusted sources for a product (public endpoint)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');

        if (!productId) {
            return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
        }

        const { data: sources, error } = await supabaseAdmin
            .from('trusted_web_sources')
            .select('*')
            .eq('product_id', productId)
            .order('authority_score', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            sources: sources || [],
            total: sources?.length || 0,
        });

    } catch (error) {
        console.error('[OKSE API] List sources error:', error);
        return NextResponse.json(
            { error: 'Failed to list sources', details: String(error) },
            { status: 500 }
        );
    }
}

// PATCH - Update a trusted source
export async function PATCH(request: NextRequest) {
    try {
        // NOTE: In production, add proper admin role check

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        // Remove fields that shouldn't be updated directly
        delete updates.product_id;
        delete updates.created_at;
        delete updates.created_by;

        const { data: source, error } = await supabaseAdmin
            .from('trusted_web_sources')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            source,
        });

    } catch (error) {
        console.error('[OKSE API] Update source error:', error);
        return NextResponse.json(
            { error: 'Failed to update source', details: String(error) },
            { status: 500 }
        );
    }
}

// DELETE - Remove a trusted source
export async function DELETE(request: NextRequest) {
    try {
        // NOTE: In production, add proper admin role check

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        // Delete associated cache entries first
        const { data: source } = await supabaseAdmin
            .from('trusted_web_sources')
            .select('id')
            .eq('id', id)
            .single();

        if (!source) {
            return NextResponse.json({ error: 'Source not found' }, { status: 404 });
        }

        // Delete cache and chunks
        await supabaseAdmin
            .from('web_knowledge_cache')
            .delete()
            .eq('source_id', id);

        // Delete the source
        const { error } = await supabaseAdmin
            .from('trusted_web_sources')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Source deleted successfully',
        });

    } catch (error) {
        console.error('[OKSE API] Delete source error:', error);
        return NextResponse.json(
            { error: 'Failed to delete source', details: String(error) },
            { status: 500 }
        );
    }
}
