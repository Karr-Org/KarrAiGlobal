/**
 * KARR AI DOMAIN SCRAPER
 * 
 * A world-class web scraper for extracting content from trusted domains.
 * No external API costs - completely free!
 * 
 * Features:
 * - Smart content extraction (removes headers, footers, nav, ads)
 * - Respects robots.txt
 * - Rate limiting to avoid blocks
 * - Caching for performance
 * - Multiple search strategies (DuckDuckGo, direct URL crawling)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ScrapedPage {
    url: string;
    title: string;
    content: string;
    excerpt: string;
    domain: string;
    scrapedAt: Date;
    relevanceScore: number;
}

export interface ScraperConfig {
    maxPagesPerDomain: number;
    timeoutMs: number;
    maxContentLength: number;
    respectRobotsTxt: boolean;
    userAgent: string;
}

const DEFAULT_CONFIG: ScraperConfig = {
    maxPagesPerDomain: 5,
    timeoutMs: 10000,
    maxContentLength: 50000, // 50KB max per page
    respectRobotsTxt: true,
    userAgent: 'KarrAI-Bot/1.0 (Knowledge Assistant; +https://karrai.global/bot)',
};

// Rate limiting - track last request time per domain
const domainLastRequest: Map<string, number> = new Map();
const RATE_LIMIT_MS = 1000; // 1 second between requests to same domain

// ============================================
// MAIN SEARCH FUNCTION
// ============================================

/**
 * Search for relevant content within specified domains
 * Uses DuckDuckGo to find pages, then scrapes them
 */
export async function searchDomains(
    query: string,
    allowedDomains: string[],
    config: Partial<ScraperConfig> = {}
): Promise<ScrapedPage[]> {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };

    console.log(`[DomainScraper] Searching "${query}" across ${allowedDomains.length} domains`);

    // Check cache first
    const cachedResults = await getCachedResults(query, allowedDomains);
    if (cachedResults.length > 0) {
        console.log(`[DomainScraper] Cache hit: ${cachedResults.length} results`);
        return cachedResults;
    }

    const allResults: ScrapedPage[] = [];

    // Strategy 1: Use DuckDuckGo to find relevant pages within domains
    const duckDuckGoResults = await searchWithDuckDuckGo(query, allowedDomains, fullConfig);
    allResults.push(...duckDuckGoResults);

    // Strategy 2: If DuckDuckGo didn't return enough, try direct site search
    if (allResults.length < 3) {
        console.log('[DomainScraper] Not enough results from search, trying direct scraping...');
        const directResults = await searchDirectly(query, allowedDomains, fullConfig);
        allResults.push(...directResults);
    }

    // Deduplicate by URL
    const uniqueResults = deduplicateResults(allResults);

    // Sort by relevance
    uniqueResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Cache results
    if (uniqueResults.length > 0) {
        await cacheResults(query, allowedDomains, uniqueResults);
    }

    console.log(`[DomainScraper] Returning ${uniqueResults.length} results`);
    return uniqueResults.slice(0, 10); // Top 10 results
}

// ============================================
// SEARCH STRATEGIES
// ============================================

/**
 * Use DuckDuckGo HTML to find relevant pages
 * DuckDuckGo is more scraper-friendly than Google
 */
async function searchWithDuckDuckGo(
    query: string,
    domains: string[],
    config: ScraperConfig
): Promise<ScrapedPage[]> {
    const results: ScrapedPage[] = [];

    // Build site-restricted query
    const siteQueries = domains.map(d => `site:${d.replace(/^https?:\/\//, '').replace(/\/$/, '')}`);
    const fullQuery = `${query} (${siteQueries.join(' OR ')})`;

    console.log(`[DomainScraper] DuckDuckGo query: ${fullQuery.substring(0, 80)}...`);

    try {
        // DuckDuckGo HTML search endpoint
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(fullQuery)}`;

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': config.userAgent,
                'Accept': 'text/html',
            },
            signal: AbortSignal.timeout(config.timeoutMs),
        });

        if (!response.ok) {
            console.log(`[DomainScraper] DuckDuckGo returned ${response.status}`);
            return [];
        }

        const html = await response.text();

        // Parse search results from DuckDuckGo HTML
        const urlRegex = /class="result__url"[^>]*>([^<]+)<|href="\/\/duckduckgo\.com\/l\/\?uddg=([^"&]+)/g;
        const titleRegex = /class="result__a"[^>]*>([^<]+)</g;
        const snippetRegex = /class="result__snippet"[^>]*>([^<]+)</g;

        const urls: string[] = [];
        const titles: string[] = [];
        const snippets: string[] = [];

        let match;
        while ((match = urlRegex.exec(html)) !== null) {
            const url = match[1] || (match[2] ? decodeURIComponent(match[2]) : null);
            if (url) {
                // Clean up URL
                let cleanUrl = url.trim();
                if (!cleanUrl.startsWith('http')) {
                    cleanUrl = 'https://' + cleanUrl;
                }
                urls.push(cleanUrl);
            }
        }

        while ((match = titleRegex.exec(html)) !== null) {
            titles.push(decodeHTMLEntities(match[1]));
        }

        while ((match = snippetRegex.exec(html)) !== null) {
            snippets.push(decodeHTMLEntities(match[1]));
        }

        // Process each result
        for (let i = 0; i < Math.min(urls.length, config.maxPagesPerDomain * domains.length); i++) {
            const url = urls[i];
            const title = titles[i] || 'Untitled';
            const snippet = snippets[i] || '';

            // Verify URL is from allowed domain
            const urlDomain = extractDomain(url);
            if (!domains.some(d => urlDomain.includes(d.replace(/^https?:\/\//, '').replace(/\/$/, '')))) {
                continue;
            }

            // Scrape the page for full content
            try {
                const pageContent = await scrapePage(url, config);
                if (pageContent) {
                    results.push({
                        url,
                        title: pageContent.title || title,
                        content: pageContent.content,
                        excerpt: pageContent.excerpt || snippet,
                        domain: urlDomain,
                        scrapedAt: new Date(),
                        relevanceScore: calculateRelevance(query, pageContent.content, 1 - (i * 0.1)),
                    });
                }
            } catch (error) {
                // If scraping fails, use the snippet from search results
                results.push({
                    url,
                    title,
                    content: snippet,
                    excerpt: snippet,
                    domain: urlDomain,
                    scrapedAt: new Date(),
                    relevanceScore: 0.5 - (i * 0.05),
                });
            }
        }

    } catch (error) {
        console.error('[DomainScraper] DuckDuckGo search error:', error);
    }

    return results;
}

/**
 * Direct site search - crawl the homepage and look for relevant pages
 */
async function searchDirectly(
    query: string,
    domains: string[],
    config: ScraperConfig
): Promise<ScrapedPage[]> {
    const results: ScrapedPage[] = [];

    for (const domain of domains) {
        await enforceRateLimit(domain);

        try {
            // Try to find a search page on the domain
            const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;

            // Common search URL patterns
            const searchPaths = [
                `/search?q=${encodeURIComponent(query)}`,
                `/search/?q=${encodeURIComponent(query)}`,
                `/?s=${encodeURIComponent(query)}`,
                `/search?query=${encodeURIComponent(query)}`,
            ];

            for (const searchPath of searchPaths) {
                const searchUrl = baseUrl.replace(/\/$/, '') + searchPath;
                try {
                    const response = await fetch(searchUrl, {
                        headers: { 'User-Agent': config.userAgent },
                        signal: AbortSignal.timeout(config.timeoutMs),
                        redirect: 'follow',
                    });

                    if (response.ok && response.url.includes('search')) {
                        const html = await response.text();
                        const pageLinks = extractLinks(html, baseUrl);

                        // Scrape top 3 links
                        for (const link of pageLinks.slice(0, 3)) {
                            const pageContent = await scrapePage(link, config);
                            if (pageContent && pageContent.content.length > 200) {
                                results.push({
                                    url: link,
                                    title: pageContent.title,
                                    content: pageContent.content,
                                    excerpt: pageContent.excerpt,
                                    domain: extractDomain(link),
                                    scrapedAt: new Date(),
                                    relevanceScore: calculateRelevance(query, pageContent.content, 0.7),
                                });
                            }
                        }
                        break; // Found search results, move to next domain
                    }
                } catch {
                    continue; // Try next search path
                }
            }
        } catch (error) {
            console.log(`[DomainScraper] Direct search failed for ${domain}:`, error);
        }
    }

    return results;
}

// ============================================
// PAGE SCRAPING
// ============================================

interface PageContent {
    title: string;
    content: string;
    excerpt: string;
}

/**
 * Scrape a single page and extract clean content
 */
async function scrapePage(url: string, config: ScraperConfig): Promise<PageContent | null> {
    const domain = extractDomain(url);
    await enforceRateLimit(domain);

    try {
        // Check robots.txt if required
        if (config.respectRobotsTxt) {
            const canScrape = await checkRobotsTxt(url, config.userAgent);
            if (!canScrape) {
                console.log(`[DomainScraper] Blocked by robots.txt: ${url}`);
                return null;
            }
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': config.userAgent,
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            signal: AbortSignal.timeout(config.timeoutMs),
            redirect: 'follow',
        });

        if (!response.ok) {
            console.log(`[DomainScraper] Page returned ${response.status}: ${url}`);
            return null;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
            console.log(`[DomainScraper] Not HTML (${contentType}): ${url}`);
            return null;
        }

        let html = await response.text();

        // Limit content size
        if (html.length > config.maxContentLength * 2) {
            html = html.substring(0, config.maxContentLength * 2);
        }

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? decodeHTMLEntities(titleMatch[1].trim()) : 'Untitled';

        // Clean and extract main content
        const content = extractMainContent(html);
        const excerpt = content.substring(0, 300).trim() + '...';

        return { title, content, excerpt };

    } catch (error) {
        console.log(`[DomainScraper] Failed to scrape ${url}:`, error);
        return null;
    }
}

/**
 * Extract main content from HTML, removing navigation, headers, footers, etc.
 */
function extractMainContent(html: string): string {
    // Remove script and style tags
    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    html = html.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

    // Remove common non-content elements
    html = html.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
    html = html.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
    html = html.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
    html = html.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
    html = html.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');

    // Remove elements by class/id patterns (ads, menus, etc.)
    html = html.replace(/<[^>]*class="[^"]*(?:menu|nav|sidebar|footer|header|cookie|banner|ad|popup|modal)[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, '');
    html = html.replace(/<[^>]*id="[^"]*(?:menu|nav|sidebar|footer|header|cookie|banner|ad|popup|modal)[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, '');

    // Try to find main content area
    let mainContent = html;

    // Look for main/article tags
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const contentMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

    if (mainMatch) {
        mainContent = mainMatch[1];
    } else if (articleMatch) {
        mainContent = articleMatch[1];
    } else if (contentMatch) {
        mainContent = contentMatch[1];
    }

    // Remove all HTML tags
    let text = mainContent.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    text = decodeHTMLEntities(text);

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Remove very short lines (likely navigation remnants)
    const lines = text.split(/[.!?]/).filter(line => line.trim().length > 30);
    text = lines.join('. ');

    return text;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function extractDomain(url: string): string {
    try {
        const parsed = new URL(url);
        return parsed.hostname;
    } catch {
        return url.split('/')[0];
    }
}

function extractLinks(html: string, baseUrl: string): string[] {
    const links: string[] = [];
    const linkRegex = /href="([^"]+)"/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
        let href = match[1];

        // Skip non-page links
        if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
            continue;
        }

        // Convert relative to absolute
        if (href.startsWith('/')) {
            href = baseUrl.replace(/\/$/, '') + href;
        } else if (!href.startsWith('http')) {
            continue;
        }

        // Only include links from same domain
        if (href.includes(extractDomain(baseUrl))) {
            links.push(href);
        }
    }

    return [...new Set(links)]; // Deduplicate
}

function decodeHTMLEntities(text: string): string {
    const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&nbsp;': ' ',
        '&#x27;': "'",
        '&#x2F;': '/',
        '&rsquo;': "'",
        '&lsquo;': "'",
        '&rdquo;': '"',
        '&ldquo;': '"',
        '&ndash;': '–',
        '&mdash;': '—',
        '&#8217;': "'",
        '&#8216;': "'",
        '&#8220;': '"',
        '&#8221;': '"',
    };

    let result = text;
    for (const [entity, char] of Object.entries(entities)) {
        result = result.replace(new RegExp(entity, 'gi'), char);
    }

    // Decode numeric entities
    result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
    result = result.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

    return result;
}

function calculateRelevance(query: string, content: string, positionBoost: number): number {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const contentLower = content.toLowerCase();

    let matchCount = 0;
    for (const term of queryTerms) {
        const occurrences = (contentLower.match(new RegExp(term, 'g')) || []).length;
        matchCount += Math.min(occurrences, 5); // Cap at 5 per term
    }

    const termScore = Math.min(matchCount / (queryTerms.length * 3), 1);
    return (termScore * 0.7) + (positionBoost * 0.3);
}

async function enforceRateLimit(domain: string): Promise<void> {
    const lastRequest = domainLastRequest.get(domain);
    if (lastRequest) {
        const elapsed = Date.now() - lastRequest;
        if (elapsed < RATE_LIMIT_MS) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
        }
    }
    domainLastRequest.set(domain, Date.now());
}

// Robots.txt cache
const robotsTxtCache: Map<string, { allowed: boolean; fetchedAt: number }> = new Map();

async function checkRobotsTxt(url: string, userAgent: string): Promise<boolean> {
    const domain = extractDomain(url);
    const cached = robotsTxtCache.get(domain);

    // Cache for 1 hour
    if (cached && Date.now() - cached.fetchedAt < 3600000) {
        return cached.allowed;
    }

    try {
        const robotsUrl = `https://${domain}/robots.txt`;
        const response = await fetch(robotsUrl, {
            headers: { 'User-Agent': userAgent },
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            // No robots.txt = allowed
            robotsTxtCache.set(domain, { allowed: true, fetchedAt: Date.now() });
            return true;
        }

        const robotsTxt = await response.text();

        // Simple check - look for Disallow: /
        const isBlocked = robotsTxt.includes('Disallow: /\n') || robotsTxt.includes('Disallow: / ');
        const allowed = !isBlocked;

        robotsTxtCache.set(domain, { allowed, fetchedAt: Date.now() });
        return allowed;

    } catch {
        // On error, assume allowed
        robotsTxtCache.set(domain, { allowed: true, fetchedAt: Date.now() });
        return true;
    }
}

function deduplicateResults(results: ScrapedPage[]): ScrapedPage[] {
    const seen = new Set<string>();
    return results.filter(r => {
        const key = r.url.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// ============================================
// CACHING
// ============================================

async function getCachedResults(query: string, domains: string[]): Promise<ScrapedPage[]> {
    const cacheKey = generateCacheKey(query, domains);

    try {
        const { data } = await supabase
            .from('web_scrape_cache')
            .select('*')
            .eq('cache_key', cacheKey)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (data?.results) {
            return data.results;
        }
    } catch {
        // Cache miss or table doesn't exist yet
    }

    return [];
}

async function cacheResults(query: string, domains: string[], results: ScrapedPage[]): Promise<void> {
    const cacheKey = generateCacheKey(query, domains);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour cache

    try {
        await supabase
            .from('web_scrape_cache')
            .upsert({
                cache_key: cacheKey,
                query,
                domains,
                results,
                expires_at: expiresAt.toISOString(),
                created_at: new Date().toISOString(),
            }, { onConflict: 'cache_key' });
    } catch {
        // Caching is optional, don't fail on error
    }
}

function generateCacheKey(query: string, domains: string[]): string {
    const str = query.toLowerCase().trim() + domains.sort().join(',');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `scrape_${Math.abs(hash)}`;
}

// ============================================
// EXPORT FOR FEDERATED SEARCH
// ============================================

export async function searchWithCustomScraper(
    query: string,
    allowedDomains: string[],
    maxResults: number = 5
): Promise<ScrapedPage[]> {
    const results = await searchDomains(query, allowedDomains, {
        maxPagesPerDomain: Math.ceil(maxResults / allowedDomains.length),
    });
    return results.slice(0, maxResults);
}
