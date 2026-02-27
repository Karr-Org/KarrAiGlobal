/**
 * KARR AI - Product API Tools CRUD
 * 
 * API route for creators to manage custom API integrations
 * for their products. Handles create, read, update, delete,
 * and test operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encryptApiKey } from '@/lib/crypto';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/creator/product-tools?product_id=xxx
 * Fetch all API tools for a product
 */
export async function GET(req: NextRequest) {
    try {
        const productId = req.nextUrl.searchParams.get('product_id');
        if (!productId) {
            return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('product_api_tools')
            .select('id, product_id, tool_name, display_name, description, icon_emoji, api_endpoint, http_method, auth_type, auth_header_name, auth_query_param, parameters_schema, response_config, request_config, is_active, last_tested_at, last_test_status, created_at, updated_at')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[ProductTools] Fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Never return encrypted_api_key to the frontend
        return NextResponse.json({ tools: data || [] });
    } catch (err: any) {
        console.error('[ProductTools] GET error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * POST /api/creator/product-tools
 * Create or update a tool. Body includes:
 * - product_id, tool_name, display_name, description, api_endpoint, http_method
 * - auth_type, api_key (plaintext → encrypted before storage)
 * - parameters_schema, response_config, request_config
 * - id (optional — if provided, updates instead of inserts)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            id,
            product_id,
            tool_name,
            display_name,
            description,
            icon_emoji,
            api_endpoint,
            http_method,
            auth_type,
            api_key,          // Plaintext — will be encrypted
            auth_header_name,
            auth_query_param,
            parameters_schema,
            response_config,
            request_config,
            is_active,
        } = body;

        // Validation
        if (!product_id || !tool_name || !display_name || !description || !api_endpoint) {
            return NextResponse.json(
                { error: 'product_id, tool_name, display_name, description, and api_endpoint are required' },
                { status: 400 }
            );
        }

        // Validate tool_name format (safe function name for Gemini)
        if (!/^[a-z][a-z0-9_]*$/.test(tool_name)) {
            return NextResponse.json(
                { error: 'tool_name must start with a lowercase letter and contain only [a-z0-9_]' },
                { status: 400 }
            );
        }

        // Encrypt the API key if provided
        let encrypted_api_key: string | null = null;
        if (api_key && api_key.trim()) {
            encrypted_api_key = await encryptApiKey(api_key.trim());
        }

        const toolData: Record<string, unknown> = {
            product_id,
            tool_name,
            display_name,
            description,
            icon_emoji: icon_emoji || '🔌',
            api_endpoint,
            http_method: http_method || 'GET',
            auth_type: auth_type || 'none',
            auth_header_name: auth_header_name || 'Authorization',
            auth_query_param: auth_query_param || null,
            parameters_schema: parameters_schema || { type: 'OBJECT', properties: { query: { type: 'STRING', description: 'The search query' } }, required: ['query'] },
            response_config: response_config || {},
            request_config: request_config || {},
            is_active: is_active ?? true,
            updated_at: new Date().toISOString(),
        };

        // Only set encrypted_api_key if a new key was provided
        // (don't overwrite existing key with null on edit)
        if (encrypted_api_key) {
            toolData.encrypted_api_key = encrypted_api_key;
        }

        let data, error;

        if (id) {
            // Update existing tool
            ({ data, error } = await supabase
                .from('product_api_tools')
                .update(toolData)
                .eq('id', id)
                .select()
                .single());
        } else {
            // Insert new tool
            ({ data, error } = await supabase
                .from('product_api_tools')
                .insert(toolData)
                .select()
                .single());
        }

        if (error) {
            console.error('[ProductTools] Save error:', error);
            if (error.code === '23505') {
                return NextResponse.json(
                    { error: `A tool named "${tool_name}" already exists for this product` },
                    { status: 409 }
                );
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`[ProductTools] ${id ? 'Updated' : 'Created'} tool "${tool_name}" for product ${product_id}`);

        // Strip encrypted_api_key from response
        if (data) {
            delete (data as Record<string, unknown>).encrypted_api_key;
        }

        return NextResponse.json({ tool: data });
    } catch (err: any) {
        console.error('[ProductTools] POST error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * DELETE /api/creator/product-tools?id=xxx
 * Delete a tool by ID
 */
export async function DELETE(req: NextRequest) {
    try {
        const toolId = req.nextUrl.searchParams.get('id');
        if (!toolId) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('product_api_tools')
            .delete()
            .eq('id', toolId);

        if (error) {
            console.error('[ProductTools] Delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`[ProductTools] Deleted tool ${toolId}`);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[ProductTools] DELETE error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * PATCH /api/creator/product-tools?id=xxx
 * Toggle a tool's is_active status, or update test status
 */
export async function PATCH(req: NextRequest) {
    try {
        const toolId = req.nextUrl.searchParams.get('id');
        if (!toolId) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const body = await req.json();
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

        if (typeof body.is_active === 'boolean') {
            updates.is_active = body.is_active;
        }
        if (body.last_test_status) {
            updates.last_tested_at = new Date().toISOString();
            updates.last_test_status = body.last_test_status;
        }

        const { data, error } = await supabase
            .from('product_api_tools')
            .update(updates)
            .eq('id', toolId)
            .select()
            .single();

        if (error) {
            console.error('[ProductTools] Patch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (data) {
            delete (data as Record<string, unknown>).encrypted_api_key;
        }

        return NextResponse.json({ tool: data });
    } catch (err: any) {
        console.error('[ProductTools] PATCH error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
