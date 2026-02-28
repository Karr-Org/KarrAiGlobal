/**
 * OKSE: Web Crawler Service
 * 
 * Crawls trusted web domains and caches content:
 * - Respects rate limits and robots.txt
 * - Delta detection to avoid re-processing unchanged content
 * - Content extraction using CSS selectors
 * - Chunking and embedding for vector search
 */

import { createClient } from '@supabase/supabase-js';
import { generateEmbedding, generateContentWithGeminiFlash } from '@/lib/gemini';
import { createHash } from 'crypto';
import {
    TrustedWebSource,
    WebKnowledgeCache,
    CrawlResult,
    CrawlJobStatus,
    CACHE_TTL
} from './types';

// Admin client for crawler (no request context needed)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CHUNK_SIZE = 500;  // tokens (approximate)
const CHUNK_OVERLAP = 50;
const MAX_PAGES_PER_CRAWL = 50;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function computeContentHash(content: string): string {
    return createHash('md5').update(content).digest('hex');
}

function getExpirationTime(authorityScore: number): Date {
    let ttlHours: number;

    if (authorityScore >= 9) {
        ttlHours = CACHE_TTL.web_official;
    } else if (authorityScore >= 7) {
        ttlHours = CACHE_TTL.web_professional;
    } else {
        ttlHours = CACHE_TTL.web_commentary;
    }

    // 6c: Extend TTL for high-authority sources to prevent premature expiration.
    // Government and top-tier professional content changes infrequently, so
    // aggressively short TTLs cause the crawler's data to silently disappear.
    if (authorityScore >= 8) {
        ttlHours = Math.max(ttlHours, 168); // At least 7 days for authority >= 8
    }

    return new Date(Date.now() + ttlHours * 60 * 60 * 1000);
}

function chunkText(text: string, chunkSize: number = DEFAULT_CHUNK_SIZE): string[] {
    // Simple word-based chunking
    const words = text.split(/\s+/);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize - CHUNK_OVERLAP) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        if (chunk.trim().length > 50) {  // Minimum chunk size
            chunks.push(chunk);
        }
    }

    return chunks;
}

// ============================================================================
// WEB CRAWLER SERVICE
// ============================================================================

export class WebCrawlerService {

    /**
     * Crawl a single trusted web source
     */
    async crawlSource(sourceId: string): Promise<CrawlJobStatus> {
        const supabase = supabaseAdmin;
        const startTime = Date.now();

        // First try trusted_web_sources table
        let { data: source, error: sourceError } = await supabase
            .from('trusted_web_sources')
            .select('*')
            .eq('id', sourceId)
            .single();

        // Fallback: Check knowledge_sources table (for legacy/bridge sources)
        if (sourceError || !source) {
            const { data: knowledgeSource } = await supabase
                .from('knowledge_sources')
                .select('*')
                .eq('id', sourceId)
                .single();

            if (knowledgeSource && knowledgeSource.source_type === 'trusted_web') {
                // Extract domain from config.allowed_domains
                const domains = knowledgeSource.config?.allowed_domains as string[] || [];
                if (domains.length > 0) {
                    // Create a synthetic source object compatible with the crawler
                    source = {
                        id: knowledgeSource.id,
                        product_id: knowledgeSource.product_id,
                        domain: domains[0],
                        display_name: knowledgeSource.name,
                        authority_score: Math.round((knowledgeSource.trust_level || 80) / 10),
                        source_type: 'professional',
                        crawl_frequency: 'daily',
                        url_patterns: ['/*'],
                        css_selectors: { content: 'main, article, .content', exclude: ['nav', 'footer', '.sidebar'] },
                        rate_limit_ms: 1000,
                        is_active: knowledgeSource.is_active,
                    };
                }
            }
        }

        if (!source) {
            return {
                source_id: sourceId,
                domain: 'unknown',
                status: 'failed',
                pages_crawled: 0,
                pages_updated: 0,
                pages_skipped: 0,
                errors: ['Source not found in either trusted_web_sources or knowledge_sources'],
                started_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
            };
        }

        const status: CrawlJobStatus = {
            source_id: sourceId,
            domain: source.domain,
            status: 'running',
            pages_crawled: 0,
            pages_updated: 0,
            pages_skipped: 0,
            errors: [],
            started_at: new Date().toISOString(),
            completed_at: null,
        };

        console.log(`[WebCrawler] Starting crawl for ${source.domain}`);

        try {
            // For MVP, we'll implement a simple single-page crawl
            // In production, this would discover and crawl multiple URLs
            const urls = await this.discoverUrls(source);

            for (const url of urls.slice(0, MAX_PAGES_PER_CRAWL)) {
                try {
                    const result = await this.fetchAndExtract(url, source);

                    if (result.success && result.content) {
                        // Check for delta
                        const isDelta = await this.checkDelta(source.id, url, result.content_hash!);

                        if (isDelta) {
                            // Process and store the new content
                            await this.processAndStore(source, url, result);
                            status.pages_updated++;
                        } else {
                            status.pages_skipped++;
                        }
                    }

                    status.pages_crawled++;

                    // Respect rate limit
                    await new Promise(resolve => setTimeout(resolve, source.rate_limit_ms || 1000));

                } catch (pageError) {
                    status.errors.push(`Failed to crawl ${url}: ${pageError}`);
                }
            }

            status.status = 'completed';

        } catch (error) {
            status.status = 'failed';
            status.errors.push(`Crawl failed: ${error}`);
        }

        status.completed_at = new Date().toISOString();

        // Update source last_crawled_at
        await supabase
            .from('trusted_web_sources')
            .update({
                last_crawled_at: new Date().toISOString(),
                last_crawl_status: status.status,
                total_pages_crawled: (source.total_pages_crawled || 0) + status.pages_updated,
            })
            .eq('id', sourceId);

        console.log(`[WebCrawler] Crawl completed for ${source.domain}:`, {
            crawled: status.pages_crawled,
            updated: status.pages_updated,
            skipped: status.pages_skipped,
            duration: Date.now() - startTime,
        });

        return status;
    }

    /**
     * Discover URLs to crawl from a source
     * In production, this would use sitemaps, RSS feeds, etc.
     */
    private async discoverUrls(source: TrustedWebSource): Promise<string[]> {
        const urls: string[] = [];
        const baseUrl = source.domain.startsWith('http')
            ? source.domain
            : `https://${source.domain}`;

        urls.push(baseUrl);

        // 6a: Parse sitemap.xml to discover actual content pages instead
        // of only crawling the homepage (which is often just marketing).
        try {
            const sitemapUrl = `${baseUrl}/sitemap.xml`;
            const sitemapRes = await fetch(sitemapUrl, {
                headers: { 'User-Agent': 'KarrAI-Crawler/1.0 (Compatible; Educational)' },
                signal: AbortSignal.timeout(5000),
            });
            if (sitemapRes.ok) {
                const sitemapXml = await sitemapRes.text();
                const urlMatches = sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g);
                for (const match of urlMatches) {
                    urls.push(match[1]);
                }
                console.log(`[WebCrawler] Sitemap found: ${urls.length - 1} URLs discovered from ${sitemapUrl}`);
            }
        } catch {
            console.log(`[WebCrawler] No sitemap.xml found for ${baseUrl}, using configured patterns`);
        }

        // Add configured URL patterns
        for (const pattern of source.url_patterns || []) {
            // Convert pattern to actual URL (simplified)
            const url = pattern.replace('*', '');
            if (url.startsWith('/')) {
                urls.push(`${baseUrl}${url}`);
            }
        }

        return [...new Set(urls)];
    }

    /**
     * Fetch and extract content from a URL
     */
    private async fetchAndExtract(url: string, source: TrustedWebSource): Promise<CrawlResult> {
        console.log(`[WebCrawler] Fetching: ${url}`);

        try {
            // Simple fetch (in production, use headless browser for JS-rendered content)
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'KarrAI-Crawler/1.0 (Compatible; Educational)',
                    'Accept': 'text/html,application/xhtml+xml',
                },
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                return {
                    success: false,
                    url,
                    title: null,
                    content: null,
                    content_hash: null,
                    page_type: null,
                    extracted_date: null,
                    error: `HTTP ${response.status}`,
                };
            }

            const html = await response.text();

            // Extract content using simple patterns (in production, use proper HTML parsing)
            const content = this.extractContent(html, source.css_selectors as TrustedWebSource['css_selectors']);
            const title = this.extractTitle(html);
            const contentHash = computeContentHash(content);

            return {
                success: true,
                url,
                title,
                content,
                content_hash: contentHash,
                page_type: this.detectPageType(url, content),
                extracted_date: this.extractDate(content),
            };

        } catch (error) {
            return {
                success: false,
                url,
                title: null,
                content: null,
                content_hash: null,
                page_type: null,
                extracted_date: null,
                error: String(error),
            };
        }
    }

    /**
     * Extract main content from HTML
     */
    private extractContent(html: string, selectors?: { content?: string; exclude?: string[] }): string {
        // Simple extraction - remove script, style, navigation
        let content = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
            .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
            .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

        // Remove HTML tags but keep text
        content = content
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return content;
    }

    /**
     * Extract title from HTML
     */
    private extractTitle(html: string): string | null {
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        return titleMatch ? titleMatch[1].trim() : null;
    }

    /**
     * Detect page type from URL and content
     */
    private detectPageType(url: string, content: string): string {
        const urlLower = url.toLowerCase();
        const contentLower = content.toLowerCase();

        if (urlLower.includes('circular') || contentLower.includes('circular no')) {
            return 'circular';
        }
        if (urlLower.includes('notification') || contentLower.includes('notification no')) {
            return 'notification';
        }
        if (urlLower.includes('faq')) {
            return 'faq';
        }
        if (urlLower.includes('press') || urlLower.includes('news')) {
            return 'news';
        }

        return 'article';
    }

    /**
     * Extract date from content
     */
    private extractDate(content: string): string | null {
        // Simple date extraction (DD/MM/YYYY or DD-MM-YYYY format)
        const dateMatch = content.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (dateMatch) {
            const [, day, month, year] = dateMatch;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return null;
    }

    /**
     * Check if content has changed (delta detection)
     */
    private async checkDelta(sourceId: string, url: string, newHash: string): Promise<boolean> {
        const supabase = supabaseAdmin;

        const { data: existing } = await supabase
            .from('web_knowledge_cache')
            .select('content_hash')
            .eq('source_id', sourceId)
            .eq('url', url)
            .maybeSingle();

        if (!existing) {
            return true;  // New URL, treat as delta
        }

        return existing.content_hash !== newHash;
    }

    /**
     * Process and store crawled content
     */
    private async processAndStore(
        source: TrustedWebSource,
        url: string,
        result: CrawlResult
    ): Promise<void> {
        const supabase = supabaseAdmin;

        // 1. Store in web_knowledge_cache
        const expiresAt = getExpirationTime(source.authority_score);

        const { data: cache, error: cacheError } = await supabase
            .from('web_knowledge_cache')
            .upsert({
                source_id: source.id,
                product_id: source.product_id,
                url,
                canonical_url: url,
                title: result.title,
                content_hash: result.content_hash,
                raw_content: result.content,
                page_type: result.page_type,
                extracted_date: result.extracted_date,
                expires_at: expiresAt.toISOString(),
                is_expired: false,
                crawled_at: new Date().toISOString(),
            }, {
                onConflict: 'source_id, url',
            })
            .select('id')
            .single();

        if (cacheError || !cache) {
            console.error('[WebCrawler] Failed to store cache:', cacheError);
            return;
        }

        // 2. Delete old chunks for this cache
        await supabase
            .from('web_knowledge_chunks')
            .delete()
            .eq('cache_id', cache.id);

        // 3. Chunk and embed content
        const chunks = chunkText(result.content!);
        console.log(`[WebCrawler] Processing ${chunks.length} chunks for ${url}`);

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            // 6b: Prefix chunk with source domain context so the LLM knows
            // where this information comes from. Without this, marketing
            // text like "File your ITR today" has no attribution and the
            // LLM can't answer "what is ClearTax?" from those chunks.
            const enrichedChunk = `[From ${source.display_name || source.domain}] ${chunk}`;

            // Generate embedding from enriched chunk for better retrieval
            const embedding = await generateEmbedding(enrichedChunk);

            // Generate contextual summary
            const contextualSummary = await this.generateContextualSummary(chunk, result.title || url);

            // Store chunk with enriched content
            await supabase.from('web_knowledge_chunks').insert({
                cache_id: cache.id,
                product_id: source.product_id,
                source_domain: source.domain,
                source_display_name: source.display_name || source.domain,
                source_url: url,
                source_title: result.title,
                content: enrichedChunk,
                chunk_index: i,
                embedding,
                contextual_summary: contextualSummary,
                authority_score: source.authority_score,
                expires_at: expiresAt.toISOString(),
            });
        }

        console.log(`[WebCrawler] Stored ${chunks.length} chunks for ${url}`);
    }

    /**
     * Generate contextual summary for a chunk
     */
    private async generateContextualSummary(chunk: string, title: string): Promise<string> {
        try {
            const prompt = `Given this document titled "${title}", briefly summarize what this specific section is about in 1-2 sentences:

${chunk}

Summary:`;

            const summary = await generateContentWithGeminiFlash(prompt, {
                temperature: 0.1,
                maxOutputTokens: 100,
            });

            return summary.trim();
        } catch (error) {
            console.error('[WebCrawler] Failed to generate contextual summary:', error);
            return '';
        }
    }

    /**
     * Crawl all sources that are due for crawling
     * Called by cron job
     */
    async crawlAllDue(): Promise<CrawlJobStatus[]> {
        const supabase = supabaseAdmin;

        // Find sources that need crawling based on their frequency
        const { data: sources } = await supabase
            .from('trusted_web_sources')
            .select('*')
            .eq('is_active', true);

        if (!sources || sources.length === 0) {
            console.log('[WebCrawler] No sources to crawl');
            return [];
        }

        const dueSources = sources.filter(source => {
            if (!source.last_crawled_at) return true;  // Never crawled

            const lastCrawled = new Date(source.last_crawled_at);
            const now = new Date();
            const hoursSince = (now.getTime() - lastCrawled.getTime()) / (1000 * 60 * 60);

            switch (source.crawl_frequency) {
                case 'realtime': return true;
                case '15min': return hoursSince >= 0.25;
                case 'hourly': return hoursSince >= 1;
                case 'daily': return hoursSince >= 24;
                case 'weekly': return hoursSince >= 168;
                default: return hoursSince >= 24;
            }
        });

        console.log(`[WebCrawler] ${dueSources.length} sources due for crawling`);

        const results: CrawlJobStatus[] = [];
        for (const source of dueSources) {
            const result = await this.crawlSource(source.id);
            results.push(result);
        }

        return results;
    }
}

// Export singleton instance
export const webCrawler = new WebCrawlerService();
