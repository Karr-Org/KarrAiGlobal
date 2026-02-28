/**
 * KARR AI - Product API Tool Test Endpoint
 * 
 * POST /api/creator/product-tools/test
 * 
 * Accepts a draft tool configuration + test parameters from the frontend,
 * makes the live API call, and returns both the raw JSON response and the
 * extracted results (what the LLM would see). Does NOT save anything to DB.
 * 
 * Key handling:
 * - If `api_key` is provided in the body, use it directly (new/unsaved tool).
 * - If `tool_id` is provided but no `api_key`, fetch the existing encrypted
 *   key from the database and decrypt it.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { decryptApiKey } from '@/lib/crypto';
import {
    buildToolRequest,
    extractToolResults,
    validateEndpoint,
    type ProductApiTool,
} from '@/lib/okse/custom-tool-executor';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verify the caller is authenticated and owns the product.
 */
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

export async function POST(req: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await req.json();
        const {
            // Draft tool config
            product_id,        // Required — for auth ownership check
            tool_id,           // Optional — for fetching existing encrypted key
            api_endpoint,
            http_method,
            auth_type,
            api_key,           // Plaintext — used directly if provided
            auth_header_name,
            auth_query_param,
            parameters_schema,
            response_config,
            request_config,
            // Test parameters (what the user enters)
            test_params,       // e.g. { query: "GST" }
        } = body;

        // Auth: verify caller owns the product
        if (!product_id) {
            return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
        }
        const userId = await verifyProductOwner(product_id);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate
        if (!api_endpoint) {
            return NextResponse.json({ error: 'api_endpoint is required' }, { status: 400 });
        }

        // SSRF — resolve DNS and validate resolved IP
        await validateEndpoint(api_endpoint);

        // Resolve API key
        let resolvedApiKey: string | null = null;
        if (api_key && api_key.trim()) {
            // User provided a fresh key for testing
            resolvedApiKey = api_key.trim();
        } else if (tool_id && auth_type !== 'none') {
            // No key provided — fetch existing encrypted key from DB
            const { data: existingTool } = await supabase
                .from('product_api_tools')
                .select('encrypted_api_key')
                .eq('id', tool_id)
                .single();

            if (existingTool?.encrypted_api_key) {
                resolvedApiKey = await decryptApiKey(existingTool.encrypted_api_key);
            }
        }

        // Build a mock ProductApiTool object for buildToolRequest
        const mockTool: ProductApiTool = {
            id: tool_id || 'test',
            product_id: 'test',
            tool_name: 'test_tool',
            display_name: 'Test',
            description: '',
            icon_emoji: null,
            api_endpoint,
            http_method: http_method || 'GET',
            auth_type: auth_type || 'none',
            encrypted_api_key: null,
            auth_header_name: auth_header_name || 'Authorization',
            auth_query_param: auth_query_param || null,
            parameters_schema: parameters_schema || {},
            response_config: response_config || {},
            request_config: request_config || {},
            is_active: true,
        };

        // Build request
        const { url, headers, body: reqBody } = buildToolRequest(
            mockTool,
            test_params || {},
            resolvedApiKey
        );

        // Execute with timeout (15s for test to be generous)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url, {
            method: mockTool.http_method,
            headers,
            body: reqBody,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseTime = Date.now() - startTime;
        const responseText = await response.text();
        const truncated = responseText.substring(0, 100 * 1024); // 100KB max for test

        let rawData: unknown;
        try {
            rawData = JSON.parse(truncated);
        } catch {
            // Not JSON — return raw text
            return NextResponse.json({
                success: true,
                status_code: response.status,
                response_time_ms: responseTime,
                content_type: response.headers.get('content-type') || 'unknown',
                raw_response: truncated.substring(0, 5000),
                extracted_results: [],
                is_json: false,
                error_message: response.ok ? null : `HTTP ${response.status}`,
            });
        }

        // Extract results using response_config
        const extractedResults = extractToolResults(rawData, response_config || {});

        // Update last_tested_at if we have a saved tool
        if (tool_id) {
            await supabase
                .from('product_api_tools')
                .update({
                    last_tested_at: new Date().toISOString(),
                    last_test_status: response.ok ? 'success' : 'error',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', tool_id);
        }

        return NextResponse.json({
            success: response.ok,
            status_code: response.status,
            response_time_ms: responseTime,
            content_type: response.headers.get('content-type') || 'unknown',
            raw_response: rawData,
            extracted_results: extractedResults,
            is_json: true,
            error_message: response.ok ? null : `HTTP ${response.status}`,
        });

    } catch (err: any) {
        const responseTime = Date.now() - startTime;

        if (err.name === 'AbortError') {
            return NextResponse.json({
                success: false,
                status_code: 408,
                response_time_ms: responseTime,
                error_message: 'Request timed out after 15 seconds',
                raw_response: null,
                extracted_results: [],
                is_json: false,
            });
        }

        console.error('[ProductTools/Test] Error:', err);
        return NextResponse.json({
            success: false,
            status_code: 0,
            response_time_ms: responseTime,
            error_message: err.message || 'Unknown error',
            raw_response: null,
            extracted_results: [],
            is_json: false,
        });
    }
}
