/**
 * KARR AI - Custom API Tool Executor
 * 
 * Builds HTTP requests from creator-defined tool configurations,
 * executes them against 3rd-party APIs, and parses the responses
 * for consumption by the Gemini multi-turn citation loop.
 */

import { decryptApiKey } from '@/lib/crypto';
import { lookup } from 'dns/promises';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductApiTool {
    id: string;
    product_id: string;
    tool_name: string;
    display_name: string;
    description: string;
    icon_emoji: string | null;
    api_endpoint: string;
    http_method: 'GET' | 'POST';
    auth_type: 'none' | 'bearer' | 'header' | 'query_param';
    encrypted_api_key: string | null;
    auth_header_name: string | null;
    auth_query_param: string | null;
    parameters_schema: Record<string, unknown>;
    response_config: ResponseConfig;
    request_config: RequestConfig;
    is_active: boolean;
}

interface ResponseConfig {
    /** JSON path to the array of results (e.g. "docs" or "results.items") */
    results_path?: string;
    /** Field name for result title */
    title_field?: string;
    /** Field name for result content/snippet */
    content_field?: string;
    /** Field name for result URL */
    url_field?: string;
    /** Max results to feed to LLM (default 5) */
    max_results?: number;
}

interface RequestConfig {
    /** Always-appended query/body params */
    static_params?: Record<string, string>;
    /** Extra headers */
    headers?: Record<string, string>;
    /** Request timeout in ms (default 10000) */
    timeout_ms?: number;
}

export interface ToolResult {
    title: string | null;
    content: string;
    url: string | null;
}

// ============================================================================
// SSRF / ENDPOINT VALIDATION
// ============================================================================

/**
 * Check if an IP address falls within a private/reserved range.
 * Covers: loopback, RFC 1918, link-local, broadcast, and IPv6 mapped.
 */
function isPrivateIP(ip: string): boolean {
    // Handle IPv6-mapped IPv4 (e.g. ::ffff:127.0.0.1)
    if (ip.startsWith('::ffff:')) {
        return isPrivateIP(ip.slice(7));
    }

    // IPv6 loopback and link-local
    if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
        return true;
    }

    // IPv4 checks
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(p => isNaN(p))) return false;

    const [a, b] = parts;
    if (a === 0) return true;                                     // 0.0.0.0/8
    if (a === 10) return true;                                    // 10.0.0.0/8
    if (a === 127) return true;                                   // 127.0.0.0/8
    if (a === 169 && b === 254) return true;                       // 169.254.0.0/16 (link-local + cloud metadata)
    if (a === 172 && b >= 16 && b <= 31) return true;              // 172.16.0.0/12
    if (a === 192 && b === 168) return true;                       // 192.168.0.0/16
    if (a === 255 && b === 255) return true;                       // broadcast

    return false;
}

/**
 * Validate an endpoint URL for safety.
 * Resolves DNS and checks the resulting IP address.
 * Throws on invalid/blocked endpoints.
 */
export async function validateEndpoint(endpoint: string): Promise<void> {
    let url: URL;
    try {
        url = new URL(endpoint);
    } catch {
        throw new Error('Invalid endpoint URL');
    }

    // Only allow http/https
    if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Only HTTP/HTTPS protocols are allowed');
    }

    const hostname = url.hostname.toLowerCase();

    // Quick-reject known bad hostnames
    if (['localhost', 'metadata.google.internal'].includes(hostname)) {
        throw new Error(`Blocked endpoint: ${hostname}`);
    }

    // Resolve DNS to IP and check against private ranges
    try {
        // If it's already an IP literal, check directly
        const ipParts = hostname.split('.');
        const isIpLiteral = ipParts.length === 4 && ipParts.every(p => !isNaN(Number(p)));

        if (isIpLiteral) {
            if (isPrivateIP(hostname)) {
                throw new Error(`Blocked: ${hostname} resolves to a private IP`);
            }
        } else {
            // Resolve hostname via DNS
            const result = await lookup(hostname);
            if (isPrivateIP(result.address)) {
                throw new Error(`Blocked: ${hostname} resolves to private IP ${result.address}`);
            }
        }
    } catch (err: any) {
        // If DNS resolution itself failed, block the request
        if (err.code === 'ENOTFOUND') {
            throw new Error(`DNS resolution failed for ${hostname}`);
        }
        // Re-throw our own validation errors
        if (err.message?.startsWith('Blocked')) throw err;
        throw new Error(`Endpoint validation failed: ${err.message}`);
    }
}

// ============================================================================
// REQUEST BUILDER
// ============================================================================

/**
 * Build the HTTP request (url, headers, body) from a tool config + LLM args.
 */
export function buildToolRequest(
    tool: ProductApiTool,
    llmArgs: Record<string, unknown>,
    decryptedApiKey: string | null
): { url: string; headers: Record<string, string>; body: string | null } {

    const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...(tool.request_config?.headers || {}),
    };

    // Merge LLM args with static params
    const allParams: Record<string, string> = {};
    if (tool.request_config?.static_params) {
        Object.assign(allParams, tool.request_config.static_params);
    }
    for (const [key, value] of Object.entries(llmArgs)) {
        allParams[key] = String(value);
    }

    // Apply authentication
    if (decryptedApiKey) {
        switch (tool.auth_type) {
            case 'bearer':
                headers['Authorization'] = `Bearer ${decryptedApiKey}`;
                break;
            case 'header':
                headers[tool.auth_header_name || 'X-API-Key'] = decryptedApiKey;
                break;
            case 'query_param':
                allParams[tool.auth_query_param || 'api_key'] = decryptedApiKey;
                break;
        }
    }

    let url = tool.api_endpoint;
    let body: string | null = null;

    if (tool.http_method === 'GET') {
        // Append params as query string
        const queryString = new URLSearchParams(allParams).toString();
        url = queryString ? `${url}${url.includes('?') ? '&' : '?'}${queryString}` : url;
    } else {
        // POST: Send params as JSON body
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(allParams);
    }

    return { url, headers, body };
}

// ============================================================================
// RESPONSE PARSER
// ============================================================================

/**
 * Navigate a JSON object by dot-separated path (e.g. "results.items").
 */
function getByPath(obj: unknown, path: string): unknown {
    let current: unknown = obj;
    for (const key of path.split('.')) {
        if (current == null || typeof current !== 'object') return undefined;
        current = (current as Record<string, unknown>)[key];
    }
    return current;
}

/**
 * Extract structured results from a raw API response using the response_config.
 */
export function extractToolResults(
    rawData: unknown,
    config: ResponseConfig
): ToolResult[] {
    const maxResults = config.max_results ?? 5;

    // Get the results array
    let items: unknown[];
    if (config.results_path) {
        const resolved = getByPath(rawData, config.results_path);
        items = Array.isArray(resolved) ? resolved : [rawData];
    } else if (Array.isArray(rawData)) {
        items = rawData;
    } else {
        // If no path configured and response isn't an array, treat the whole thing as one result
        items = [rawData];
    }

    return items.slice(0, maxResults).map(item => {
        if (typeof item !== 'object' || item === null) {
            return { title: null, content: String(item), url: null };
        }

        const record = item as Record<string, unknown>;

        const title = config.title_field
            ? String(record[config.title_field] ?? '')
            : null;

        const content = config.content_field
            ? String(record[config.content_field] ?? JSON.stringify(record).substring(0, 2000))
            : JSON.stringify(record).substring(0, 2000);

        const url = config.url_field
            ? String(record[config.url_field] ?? '') || null
            : null;

        return { title, content, url };
    });
}

// ============================================================================
// FORMAT FOR LLM
// ============================================================================

/**
 * Format extracted API results into a readable text summary for Gemini.
 */
export function formatApiResultsForLLM(
    results: ToolResult[],
    sourceStartIndex: number
): string {
    if (results.length === 0) {
        return 'No results found from this API call.';
    }

    return results.map((r, i) => {
        const sourceNum = sourceStartIndex + i + 1;
        const parts = [`[Source ${sourceNum}]`];
        if (r.title) parts.push(`Title: ${r.title}`);
        if (r.url) parts.push(`URL: ${r.url}`);
        parts.push(`Content: ${r.content.substring(0, 1500)}`);
        return parts.join('\n');
    }).join('\n\n---\n\n');
}

// ============================================================================
// EXECUTOR
// ============================================================================

/** Max response body size (50KB) */
const MAX_RESPONSE_SIZE = 50 * 1024;

/** Max custom tool calls per chat message */
export const MAX_CUSTOM_TOOL_CALLS = 3;

/**
 * Read a response body with a byte limit using streaming.
 * Aborts the connection as soon as the limit is exceeded,
 * preventing the entire payload from being buffered in memory.
 */
export async function readResponseWithLimit(
    response: Response,
    maxBytes: number
): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
        // Fallback for environments without streaming — safe-ish with small limit
        const text = await response.text();
        return text.substring(0, maxBytes);
    }

    const decoder = new TextDecoder();
    let result = '';
    let totalBytes = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            totalBytes += value.byteLength;
            if (totalBytes > maxBytes) {
                // Take only the bytes we need from this chunk
                const overshoot = totalBytes - maxBytes;
                const usable = value.slice(0, value.byteLength - overshoot);
                result += decoder.decode(usable, { stream: false });
                break;
            }
            result += decoder.decode(value, { stream: true });
        }
    } finally {
        reader.cancel().catch(() => { });
    }

    return result;
}

/**
 * Execute a custom API tool call end-to-end:
 * 1. Validate endpoint (SSRF protection)
 * 2. Decrypt the API key
 * 3. Build the request
 * 4. Execute with timeout
 * 5. Parse and return structured results
 */
export async function executeCustomTool(
    tool: ProductApiTool,
    llmArgs: Record<string, unknown>
): Promise<{ results: ToolResult[]; rawData: unknown }> {

    // SSRF protection — resolve DNS and validate IP
    await validateEndpoint(tool.api_endpoint);

    console.log(`[CustomTool] Executing "${tool.tool_name}" → ${tool.http_method} ${tool.api_endpoint}`);
    console.log(`[CustomTool] LLM args:`, JSON.stringify(llmArgs));

    // Decrypt API key if present
    let decryptedKey: string | null = null;
    if (tool.encrypted_api_key && tool.auth_type !== 'none') {
        decryptedKey = await decryptApiKey(tool.encrypted_api_key);
    }

    // Build request
    const { url, headers, body } = buildToolRequest(tool, llmArgs, decryptedKey);

    // Execute with timeout
    const timeoutMs = tool.request_config?.timeout_ms ?? 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            method: tool.http_method,
            headers,
            body,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errText = await readResponseWithLimit(response, 2048);
            console.error(`[CustomTool] API error ${response.status}:`, errText.substring(0, 500));
            throw new Error(`API returned ${response.status}: ${errText.substring(0, 200)}`);
        }

        // Read response with stream-based size limit (prevents OOM)
        const text = await readResponseWithLimit(response, MAX_RESPONSE_SIZE);
        const rawData = JSON.parse(text);

        // Extract structured results
        const results = extractToolResults(rawData, tool.response_config);

        console.log(`[CustomTool] ✅ "${tool.tool_name}" returned ${results.length} results`);

        return { results, rawData };
    } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error(`API call to ${tool.api_endpoint} timed out after ${timeoutMs}ms`);
        }
        throw error;
    }
}
