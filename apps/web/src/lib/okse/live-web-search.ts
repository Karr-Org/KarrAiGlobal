/**
 * OKSE: Live Web Search Service
 * 
 * Real-time web search at query time:
 * 1. Search trusted domains for relevant pages
 * 2. Fetch and extract content
 * 3. Return formatted results for AI consumption
 * 4. Cache results for efficiency
 */

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// TYPES
// ============================================================================

export interface WebSearchResult {
    title: string;
    url: string;
    snippet: string;
    domain: string;
    content?: string;      // Full extracted content (if fetched)
    authority_score: number;
    cached: boolean;
}

export interface WebSearchResponse {
    query: string;
    results: WebSearchResult[];
    total_results: number;
    search_time_ms: number;
    source: 'serper' | 'scraper' | 'cache';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_TTL_HOURS = 24;
const MAX_RESULTS = 5;
const FETCH_TIMEOUT_MS = 8000;

// ============================================================================
// DEFAULT TRUSTED DOMAINS (Used when no product-specific domains configured)
// These are authoritative sources for tax/finance information
// ============================================================================
const DEFAULT_TRUSTED_DOMAINS = [
    // Indian Tax Authorities
    'cleartax.in',
    'gst.gov.in',
    'cbic.gov.in',
    'incometaxindia.gov.in',
    'incometax.gov.in',

    // Government Portals
    'pib.gov.in',
    'mca.gov.in',
    'rbi.org.in',

    // Trusted Tax Consultancies
    'taxmann.com',
    'caclubindia.com',
    'taxguru.in',

    // Legal/Judicial
    'indiankanoon.org',
];

// ============================================================================
// SERPER.DEV SEARCH (Primary)
// ============================================================================

async function searchWithSerper(
    query: string,
    domains: string[]
): Promise<WebSearchResult[]> {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
        console.log('[OKSE] No Serper API key, skipping Serper search');
        return [];
    }

    // Build site-restricted query
    const cleanDomains = domains.map(d => {
        try {
            return new URL(d.startsWith('http') ? d : `https://${d}`).hostname;
        } catch {
            return d;
        }
    });

    // CRITICAL SAFETY: Never search entire internet - require trusted domains
    if (cleanDomains.length === 0) {
        console.log('[OKSE] No trusted domains provided - refusing to search entire internet');
        return [];
    }

    // Build site-restricted query - ALWAYS uses domain restriction
    const siteQuery = `${query} (${cleanDomains.map(d => `site:${d}`).join(' OR ')})`;
    console.log(`[OKSE] Searching trusted domains only: ${cleanDomains.join(', ')}`);

    try {
        const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: siteQuery,
                num: MAX_RESULTS,
            }),
        });

        if (!response.ok) {
            console.error('[OKSE] Serper API error:', response.status);
            return [];
        }

        const data = await response.json();
        const results: WebSearchResult[] = [];

        for (const item of data.organic || []) {
            const url = new URL(item.link);
            const domain = url.hostname.replace('www.', '');

            // STRICT FILTERING: Only include results from trusted domains
            const isTrustedDomain = cleanDomains.some(trusted =>
                domain === trusted || domain.endsWith(`.${trusted}`)
            );

            if (!isTrustedDomain) {
                console.log(`[OKSE] Filtering out untrusted domain: ${domain}`);
                continue;
            }

            // Authority score based on domain type
            let authorityScore = 8;
            if (domain.endsWith('.gov.in') || domain.endsWith('.gov')) {
                authorityScore = 10; // Government sources
            } else if (domain === 'cleartax.in' || domain === 'taxmann.com') {
                authorityScore = 9; // Top-tier tax consultancies
            }

            results.push({
                title: item.title || 'Untitled',
                url: item.link,
                snippet: item.snippet || '',
                domain,
                authority_score: authorityScore,
                cached: false,
            });
        }

        console.log(`[OKSE] Filtered to ${results.length} results from trusted domains`);
        return results;
    } catch (error) {
        console.error('[OKSE] Serper search failed:', error);
        return [];
    }
}

// ============================================================================
// DIRECT SCRAPING FALLBACK
// ============================================================================

async function searchWithScraping(
    query: string,
    domains: string[]
): Promise<WebSearchResult[]> {
    // For direct scraping, we construct search URLs for each domain
    // This is a simplified approach - in production, you'd use more sophisticated methods

    const results: WebSearchResult[] = [];

    for (const domain of domains.slice(0, 3)) { // Limit to 3 domains
        try {
            // Try to find relevant pages by searching domain + query
            // Many sites have search functionality we can leverage
            const searchUrls = [
                `https://${domain}/search?q=${encodeURIComponent(query)}`,
                `https://${domain}/?s=${encodeURIComponent(query)}`,
                `https://${domain}/search?query=${encodeURIComponent(query)}`,
            ];

            // For now, just fetch the homepage and extract
            const baseUrl = `https://${domain}`;

            const response = await fetch(baseUrl, {
                headers: {
                    'User-Agent': 'KarrAI-Search/1.0 (Educational)',
                    'Accept': 'text/html',
                },
                signal: AbortSignal.timeout(5000),
            });

            if (response.ok) {
                const html = await response.text();
                const title = extractTitle(html);
                const snippet = extractMetaDescription(html) || extractFirstParagraph(html);

                results.push({
                    title: title || domain,
                    url: baseUrl,
                    snippet: snippet.substring(0, 200),
                    domain,
                    authority_score: 7,
                    cached: false,
                });
            }
        } catch (error) {
            console.log(`[OKSE] Failed to scrape ${domain}:`, error);
        }
    }

    return results;
}

// ============================================================================
// CONTENT EXTRACTION
// ============================================================================

function extractTitle(html: string): string {
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match ? match[1].trim() : '';
}

function extractMetaDescription(html: string): string {
    const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    return match ? match[1].trim() : '';
}

function extractFirstParagraph(html: string): string {
    const match = html.match(/<p[^>]*>([^<]+)<\/p>/i);
    return match ? match[1].trim() : '';
}

export async function extractPageContent(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'KarrAI-Search/1.0 (Educational)',
                'Accept': 'text/html',
            },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });

        if (!response.ok) {
            return '';
        }

        const html = await response.text();

        // Clean HTML and extract text
        let content = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
            .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
            .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Limit content length
        return content.substring(0, 8000);
    } catch (error) {
        console.error(`[OKSE] Failed to extract content from ${url}:`, error);
        return '';
    }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

interface CachedSearch {
    query: string;
    product_id: string;
    results: WebSearchResult[];
    created_at: string;
}

async function getCachedResults(
    query: string,
    productId: string
): Promise<WebSearchResult[] | null> {
    try {
        const normalized = query.toLowerCase().trim();
        const { data } = await supabaseAdmin
            .from('semantic_cache')
            .select('response, created_at')
            .eq('product_id', productId)
            .eq('query_normalized', normalized)
            .single();

        if (!data) return null;

        // Check if cache is still valid
        const cacheAge = Date.now() - new Date(data.created_at).getTime();
        const maxAge = CACHE_TTL_HOURS * 60 * 60 * 1000;

        if (cacheAge > maxAge) {
            return null; // Cache expired
        }

        try {
            const cached = JSON.parse(data.response);
            if (cached?.web_results) {
                return cached.web_results.map((r: any) => ({ ...r, cached: true }));
            }
        } catch {
            // response wasn't JSON (e.g. a regular cached AI response) — skip
        }

        return null;
    } catch (error) {
        return null;
    }
}

async function cacheResults(
    query: string,
    productId: string,
    results: WebSearchResult[]
): Promise<void> {
    try {
        const normalized = query.toLowerCase().trim();
        await supabaseAdmin
            .from('semantic_cache')
            .upsert({
                product_id: productId,
                query_text: query,
                query_normalized: normalized,
                response: JSON.stringify({ web_results: results }),
                expires_at: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString(),
            }, {
                onConflict: 'product_id, query_normalized',
            });
    } catch (error) {
        console.error('[OKSE] Failed to cache results:', error);
    }
}

// ============================================================================
// MAIN SEARCH FUNCTION
// ============================================================================

export async function liveWebSearch(
    query: string,
    productId: string,
    options: {
        domains?: string[];
        fetchContent?: boolean;
        maxResults?: number;
    } = {}
): Promise<WebSearchResponse> {
    const startTime = Date.now();
    const { domains = [], fetchContent = true, maxResults = MAX_RESULTS } = options;

    // 1. Check cache first
    const cachedResults = await getCachedResults(query, productId);
    if (cachedResults && cachedResults.length > 0) {
        console.log(`[OKSE] Returning ${cachedResults.length} cached results`);
        return {
            query,
            results: cachedResults.slice(0, maxResults),
            total_results: cachedResults.length,
            search_time_ms: Date.now() - startTime,
            source: 'cache',
        };
    }

    // 2. Get trusted domains for this product if not provided
    let searchDomains = domains;
    if (searchDomains.length === 0) {
        searchDomains = await getTrustedDomains(productId);
    }

    // 3. Try Serper first (best results)
    let results = await searchWithSerper(query, searchDomains);
    let source: 'serper' | 'scraper' = 'serper';

    // 4. Fallback to scraping if Serper fails or no API key
    if (results.length === 0) {
        results = await searchWithScraping(query, searchDomains);
        source = 'scraper';
    }

    // 5. Fetch full content for top results if requested
    if (fetchContent && results.length > 0) {
        const contentPromises = results.slice(0, 3).map(async (result) => {
            const content = await extractPageContent(result.url);
            return { ...result, content };
        });

        const resultsWithContent = await Promise.all(contentPromises);
        results = [...resultsWithContent, ...results.slice(3)];
    }

    // 6. Cache results for future queries
    if (results.length > 0) {
        await cacheResults(query, productId, results);
    }

    console.log(`[OKSE] Found ${results.length} results via ${source} in ${Date.now() - startTime}ms`);

    return {
        query,
        results: results.slice(0, maxResults),
        total_results: results.length,
        search_time_ms: Date.now() - startTime,
        source,
    };
}

// ============================================================================
// HELPER: Get Trusted Domains for Product
// ============================================================================

async function getTrustedDomains(productId: string): Promise<string[]> {
    try {
        // Query the OKSE trusted_web_sources table directly
        const { data: sources } = await supabaseAdmin
            .from('trusted_web_sources')
            .select('domain')
            .eq('product_id', productId)
            .eq('is_active', true);

        if (sources && sources.length > 0) {
            const domains = sources.map(s => s.domain);
            console.log(`[OKSE] Using ${domains.length} product-specific trusted domains: ${domains.join(', ')}`);
            return [...new Set(domains)]; // Deduplicate
        }

        // No product-specific domains configured — do NOT fall back to hardcoded defaults
        // The search function will safely refuse to search the internet without trusted domains
        console.warn('[OKSE] No trusted domains configured for product. Web search will be skipped.');
        return [];
    } catch (error) {
        console.error('[OKSE] Error getting trusted domains:', error);
        return [];
    }
}

// ============================================================================
// FORMAT FOR AI CONTEXT
// ============================================================================

export function formatWebResultsForAI(results: WebSearchResult[]): string {
    if (results.length === 0) {
        return '';
    }

    let context = '\n\n---\n📌 **Live Web Sources:**\n\n';

    for (const result of results) {
        context += `### [${result.title}](${result.url})\n`;
        context += `*Source: ${result.domain} • Authority: ${result.authority_score}/10*\n\n`;

        if (result.content) {
            // Truncate content to reasonable size
            const truncated = result.content.substring(0, 2000);
            context += `${truncated}...\n\n`;
        } else {
            context += `${result.snippet}\n\n`;
        }
    }

    context += '---\n';
    return context;
}
