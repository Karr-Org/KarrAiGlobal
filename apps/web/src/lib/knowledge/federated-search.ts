/**
 * FEDERATED KNOWLEDGE SEARCH
 * 
 * This module handles searching across multiple knowledge sources:
 * 1. Internal Documents (existing vector search)
 * 2. External APIs (with caching)
 * 3. Trusted Web Search (domain-restricted)
 * 
 * The results are merged, ranked by trust level, and returned with rich citations.
 */

import { createClient } from '@supabase/supabase-js';
import { searchWithCustomScraper, ScrapedPage } from './domain-scraper';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY!;

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface KnowledgeSource {
    id: string;
    source_type: 'internal_documents' | 'external_api' | 'trusted_web';
    name: string;
    icon_emoji: string;
    trust_level: number;
    config: Record<string, any>;
    is_active: boolean;
}

export interface SearchResult {
    sourceId: string;
    sourceName: string;
    sourceType: string;
    sourceIcon: string;
    trustLevel: number;
    content: string;
    title: string;
    excerpt: string;
    url?: string;
    metadata?: Record<string, any>;
    relevanceScore: number;
}

export interface RichCitation {
    type: 'internal' | 'api' | 'web';
    icon: string;
    title: string;
    subtitle?: string;
    url?: string;
    trustBadge: string;
}

// ============================================
// MAIN FEDERATED SEARCH FUNCTION
// ============================================

export async function federatedSearch(
    productId: string,
    query: string,
    queryEmbedding: number[],
    userId?: string
): Promise<{ results: SearchResult[]; citations: RichCitation[] }> {

    console.log(`[FederatedSearch] Starting search for product ${productId}`);

    // 1. Get active knowledge sources for this product
    const { data: sources } = await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

    const activeSources = sources || [];
    console.log(`[FederatedSearch] Found ${activeSources.length} active sources`);

    // 2. Search each source in parallel
    const searchPromises: Promise<SearchResult[]>[] = [];

    for (const source of activeSources) {
        switch (source.source_type) {
            case 'internal_documents':
                searchPromises.push(searchInternalDocuments(productId, query, queryEmbedding, userId, source));
                break;
            case 'external_api':
                searchPromises.push(searchExternalApi(source, query, queryEmbedding));
                break;
            case 'trusted_web':
                searchPromises.push(searchTrustedWeb(source, query));
                break;
        }
    }

    // If no sources configured, fallback to default internal search
    if (activeSources.length === 0) {
        console.log('[FederatedSearch] No sources configured, using default internal search');
        searchPromises.push(searchInternalDocuments(productId, query, queryEmbedding, userId, null));
    }

    // 3. Wait for all searches to complete
    const allResults = await Promise.all(searchPromises);
    const flatResults = allResults.flat();

    // 4. Rank results by (trust_level * relevance_score)
    flatResults.sort((a, b) => {
        const scoreA = (a.trustLevel / 100) * a.relevanceScore;
        const scoreB = (b.trustLevel / 100) * b.relevanceScore;
        return scoreB - scoreA;
    });

    // 5. Build rich citations
    const citations = buildCitations(flatResults.slice(0, 10));

    console.log(`[FederatedSearch] Returning ${flatResults.length} results, ${citations.length} citations`);

    return {
        results: flatResults.slice(0, 15), // Top 15 results
        citations,
    };
}

// ============================================
// INTERNAL DOCUMENTS SEARCH (EXISTING LOGIC)
// ============================================

async function searchInternalDocuments(
    productId: string,
    query: string,
    queryEmbedding: number[],
    userId: string | undefined,
    source: KnowledgeSource | null
): Promise<SearchResult[]> {

    try {
        // OmniForge Phase 1: Try new hybrid search with RRF fusion
        const { data: chunks, error } = await supabase.rpc('omniforge_hybrid_search', {
            p_query_embedding: queryEmbedding,
            p_query_text: query,
            p_product_id: productId,
            p_user_id: userId || null,
            p_match_count: 10
        });

        if (error) {
            console.log('[FederatedSearch] OmniForge search failed, trying legacy:', error.message);
            // Fallback to legacy hybrid_search
            const { data: legacyChunks, error: legacyError } = await supabase.rpc('hybrid_search', {
                query_embedding: queryEmbedding,
                query_text: query,
                p_product_id: productId,
                p_user_id: userId || null,
                match_count: 10
            });

            if (legacyError) {
                console.log('[FederatedSearch] Legacy search also failed, using fallback');
                return await fallbackInternalSearch(productId, queryEmbedding);
            }

            return mapLegacyChunks(legacyChunks || [], source);
        }

        // Map OmniForge results with enhanced metadata
        return (chunks || []).map((chunk: any, index: number) => ({
            sourceId: source?.id || 'internal',
            sourceName: source?.name || 'Internal Documents',
            sourceType: 'internal_documents',
            sourceIcon: source?.icon_emoji || '📚',
            trustLevel: source?.trust_level || chunk.authority_level * 10 || 100,
            content: chunk.content,
            title: chunk.document_title || 'Document',
            excerpt: (chunk.contextual_summary || chunk.content.substring(0, 200)) + '...',
            relevanceScore: chunk.combined_score || (1 - index * 0.05),
            metadata: {
                chunkIndex: index,
                vectorScore: chunk.vector_score,
                bm25Score: chunk.bm25_score,
                contextualSummary: chunk.contextual_summary,
                authorityLevel: chunk.authority_level,
            },
        }));

    } catch (error) {
        console.error('[FederatedSearch] Internal documents search error:', error);
        return [];
    }
}

// Helper to map legacy chunks format
function mapLegacyChunks(chunks: any[], source: KnowledgeSource | null): SearchResult[] {
    return chunks.map((chunk: any, index: number) => ({
        sourceId: source?.id || 'internal',
        sourceName: source?.name || 'Internal Documents',
        sourceType: 'internal_documents',
        sourceIcon: source?.icon_emoji || '📚',
        trustLevel: source?.trust_level || 100,
        content: chunk.content,
        title: chunk.knowledge_documents?.title || chunk.document_title || 'Document',
        excerpt: chunk.content.substring(0, 200) + '...',
        relevanceScore: chunk.similarity || chunk.score || (1 - index * 0.05),
        metadata: {
            chunkIndex: chunk.chunk_index,
            documentId: chunk.document_id,
        },
    }));
}

async function fallbackInternalSearch(productId: string, queryEmbedding: number[]): Promise<SearchResult[]> {
    // Get KB ID first
    const { data: product } = await supabase
        .from('products')
        .select('knowledge_base_id')
        .eq('id', productId)
        .single();

    if (!product?.knowledge_base_id) return [];

    const { data: chunks } = await supabase
        .from('knowledge_chunks')
        .select(`
            id,
            content,
            chunk_index,
            document_id,
            knowledge_documents!inner (
                title,
                knowledge_base_id
            )
        `)
        .eq('knowledge_documents.knowledge_base_id', product.knowledge_base_id)
        .limit(10);

    return (chunks || []).map((chunk: any, index: number) => ({
        sourceId: 'internal',
        sourceName: 'Internal Documents',
        sourceType: 'internal_documents',
        sourceIcon: '📚',
        trustLevel: 100,
        content: chunk.content,
        title: chunk.knowledge_documents?.title || 'Document',
        excerpt: chunk.content.substring(0, 200) + '...',
        relevanceScore: 1 - index * 0.05,
        metadata: {
            chunkIndex: chunk.chunk_index,
            documentId: chunk.document_id,
        },
    }));
}

// ============================================
// EXTERNAL API SEARCH (WITH CACHING)
// ============================================

async function searchExternalApi(
    source: KnowledgeSource,
    query: string,
    queryEmbedding: number[]
): Promise<SearchResult[]> {

    const provider = source.config.provider;
    console.log(`[FederatedSearch] Searching external API: ${provider}`);

    try {
        // 1. Check cache first
        const cacheKey = generateCacheKey(query, source.config);
        const { data: cachedResult } = await supabase
            .from('knowledge_source_cache')
            .select('*')
            .eq('source_id', source.id)
            .eq('cache_key', cacheKey)
            .single();

        if (cachedResult && (!cachedResult.expires_at || new Date(cachedResult.expires_at) > new Date())) {
            console.log(`[FederatedSearch] Cache HIT for ${provider}`);

            // Record cache hit (fire and forget)
            try {
                await supabase.rpc('record_cache_hit', { p_cache_id: cachedResult.id });
            } catch {
                // Ignore cache hit tracking failures
            }

            return parseCachedResults(cachedResult, source);
        }

        // 2. Fetch from API
        console.log(`[FederatedSearch] Cache MISS, fetching from ${provider}`);
        const apiResults = await fetchFromProvider(provider, query, source.config);

        // 3. Cache the results
        if (apiResults.length > 0) {
            await cacheApiResults(source.id, cacheKey, query, apiResults, source.config);
        }

        return apiResults.map((result: any) => ({
            sourceId: source.id,
            sourceName: source.name,
            sourceType: 'external_api',
            sourceIcon: source.icon_emoji,
            trustLevel: source.trust_level,
            content: result.content || result.snippet || '',
            title: result.title || 'API Result',
            excerpt: (result.content || result.snippet || '').substring(0, 200) + '...',
            url: result.url,
            relevanceScore: result.relevance || 0.8,
            metadata: result.metadata,
        }));

    } catch (error) {
        console.error(`[FederatedSearch] External API error for ${provider}:`, error);
        return [];
    }
}

function generateCacheKey(query: string, config: Record<string, any>): string {
    // Simple hash of query + relevant config
    const str = query.toLowerCase().trim() + JSON.stringify(config.provider || '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `q_${Math.abs(hash)}`;
}

async function fetchFromProvider(provider: string, query: string, config: Record<string, any>): Promise<any[]> {
    // Provider-specific API calls
    switch (provider) {
        case 'indian_kanoon':
            return await fetchIndianKanoon(query, config);
        case 'pubmed':
            return await fetchPubMed(query, config);
        case 'cbic_circulars':
            return await fetchCBICCirculars(query, config);
        default:
            console.log(`[FederatedSearch] Unknown provider: ${provider}`);
            return [];
    }
}

async function fetchIndianKanoon(query: string, config: Record<string, any>): Promise<any[]> {
    const apiKey = config.api_key_encrypted
        ? Buffer.from(config.api_key_encrypted, 'base64').toString()
        : config.api_key;

    if (!apiKey) {
        console.log('[FederatedSearch] No API key for Indian Kanoon');
        return [];
    }

    try {
        const response = await fetch(`https://api.indiankanoon.org/search/?formInput=${encodeURIComponent(query)}&pagenum=0`, {
            headers: {
                'Authorization': `Token ${apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Indian Kanoon API error: ${response.status}`);
        }

        const data = await response.json();
        return (data.docs || []).slice(0, config.max_results || 5).map((doc: any) => ({
            title: doc.title,
            content: doc.headline || doc.docsource,
            url: `https://indiankanoon.org/doc/${doc.tid}/`,
            relevance: 0.85,
            metadata: {
                docId: doc.tid,
                court: doc.doctype,
            },
        }));

    } catch (error) {
        console.error('[FederatedSearch] Indian Kanoon fetch error:', error);
        return [];
    }
}

async function fetchPubMed(query: string, config: Record<string, any>): Promise<any[]> {
    // PubMed is free, no API key needed
    try {
        // First, search for IDs
        const searchResponse = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${config.max_results || 5}&retmode=json`
        );
        const searchData = await searchResponse.json();
        const ids = searchData.esearchresult?.idlist || [];

        if (ids.length === 0) return [];

        // Then, fetch summaries
        const summaryResponse = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
        );
        const summaryData = await summaryResponse.json();
        const results = summaryData.result || {};

        return ids.map((id: string) => {
            const article = results[id];
            if (!article) return null;
            return {
                title: article.title,
                content: `${article.title}. Authors: ${(article.authors || []).map((a: any) => a.name).join(', ')}. Published: ${article.pubdate}`,
                url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
                relevance: 0.8,
                metadata: {
                    pmid: id,
                    authors: article.authors,
                    journal: article.source,
                },
            };
        }).filter(Boolean);

    } catch (error) {
        console.error('[FederatedSearch] PubMed fetch error:', error);
        return [];
    }
}

async function fetchCBICCirculars(query: string, config: Record<string, any>): Promise<any[]> {
    // CBIC doesn't have a public API, return empty for now
    // In production, you'd scrape or use an unofficial API
    console.log('[FederatedSearch] CBIC Circulars - API not implemented yet');
    return [];
}

async function cacheApiResults(
    sourceId: string,
    cacheKey: string,
    queryText: string,
    results: any[],
    config: Record<string, any>
) {
    const contentText = results.map(r => r.content || r.snippet || '').join('\n\n');

    // Calculate expiry based on refresh strategy
    let expiresAt: string | null = null;
    if (config.refresh_strategy === 'dynamic' && config.cache_ttl_seconds) {
        expiresAt = new Date(Date.now() + config.cache_ttl_seconds * 1000).toISOString();
    }
    // stagnant = null (never expires)

    // Generate embedding for the cached content
    let embedding: number[] | null = null;
    try {
        embedding = await generateEmbedding(contentText.substring(0, 5000));
    } catch (e) {
        console.log('[FederatedSearch] Failed to generate embedding for cache');
    }

    await supabase
        .from('knowledge_source_cache')
        .upsert({
            source_id: sourceId,
            cache_key: cacheKey,
            query_text: queryText,
            response_data: results,
            content_text: contentText,
            embedding,
            expires_at: expiresAt,
            fetched_at: new Date().toISOString(),
        }, { onConflict: 'source_id,cache_key' });
}

function parseCachedResults(cachedResult: any, source: KnowledgeSource): SearchResult[] {
    const results = cachedResult.response_data || [];
    return results.map((result: any) => ({
        sourceId: source.id,
        sourceName: source.name,
        sourceType: 'external_api',
        sourceIcon: source.icon_emoji,
        trustLevel: source.trust_level,
        content: result.content || result.snippet || '',
        title: result.title || 'Cached Result',
        excerpt: (result.content || result.snippet || '').substring(0, 200) + '...',
        url: result.url,
        relevanceScore: result.relevance || 0.75,
        metadata: result.metadata,
    }));
}

// ============================================
// TRUSTED WEB SEARCH (CUSTOM SCRAPER + FALLBACKS)
// ============================================

async function searchTrustedWeb(source: KnowledgeSource, query: string): Promise<SearchResult[]> {
    const domains = source.config.allowed_domains || [];
    const searchProvider = source.config.search_provider || 'custom'; // Default to custom scraper
    const searchEntireWeb = source.config.search_entire_web || false;

    console.log(`[FederatedSearch] Web search provider: ${searchProvider}, domains: ${domains.length}, entireWeb: ${searchEntireWeb}`);

    // PRIMARY: Use our custom domain scraper (FREE!)
    if (searchProvider === 'custom' || searchProvider === 'scraper') {
        if (domains.length === 0 && !searchEntireWeb) {
            console.log('[FederatedSearch] No domains configured for custom scraper');
            return [];
        }
        return await searchWithKarrScraper(source, query, domains);
    }

    // FALLBACK 1: Tavily (for entire web search, requires API key)
    if (searchProvider === 'tavily') {
        return await searchWithTavily(source, query, domains, searchEntireWeb);
    }

    // FALLBACK 2: Google CSE (requires domains in Google console)
    if (searchProvider === 'google_pse') {
        return await searchWithGoogleCSE(source, query, domains);
    }

    // Default to custom scraper
    return await searchWithKarrScraper(source, query, domains);
}

// ============================================
// KARR AI CUSTOM SCRAPER (FREE & POWERFUL!)
// ============================================

async function searchWithKarrScraper(
    source: KnowledgeSource,
    query: string,
    allowedDomains: string[]
): Promise<SearchResult[]> {
    console.log(`[FederatedSearch] Using Karr AI custom scraper for ${allowedDomains.length} domains`);

    try {
        const scrapedPages = await searchWithCustomScraper(
            query,
            allowedDomains,
            source.config.max_results || 5
        );

        console.log(`[FederatedSearch] Custom scraper returned ${scrapedPages.length} pages`);

        return scrapedPages.map((page: ScrapedPage) => ({
            sourceId: source.id,
            sourceName: source.name,
            sourceType: 'trusted_web',
            sourceIcon: source.icon_emoji || '🌐',
            trustLevel: source.trust_level,
            content: page.content,
            title: page.title,
            excerpt: page.excerpt,
            url: page.url,
            relevanceScore: page.relevanceScore,
            metadata: {
                displayLink: page.domain,
                scrapedAt: page.scrapedAt,
                provider: 'karr_scraper',
            },
        }));

    } catch (error) {
        console.error('[FederatedSearch] Custom scraper error:', error);
        return [];
    }
}

// ============================================
// TAVILY SEARCH (AI-OPTIMIZED, ENTIRE WEB)
// ============================================

async function searchWithTavily(
    source: KnowledgeSource,
    query: string,
    allowedDomains: string[],
    searchEntireWeb: boolean
): Promise<SearchResult[]> {
    const tavilyApiKey = process.env.TAVILY_API_KEY;

    if (!tavilyApiKey) {
        console.log('[FederatedSearch] Tavily API key not configured, skipping web search');
        return [];
    }

    try {
        // Build the search query
        // If specific domains are set and not searching entire web, add site restrictions
        let searchQuery = query;
        if (!searchEntireWeb && allowedDomains.length > 0) {
            const domainFilter = allowedDomains.map(d => `site:${d.replace(/\/$/, '')}`).join(' OR ');
            searchQuery = `${query} (${domainFilter})`;
        }

        console.log(`[FederatedSearch] Tavily search query: ${searchQuery.substring(0, 100)}...`);

        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: tavilyApiKey,
                query: searchQuery,
                search_depth: source.config.search_depth || 'basic', // 'basic' or 'advanced'
                include_answer: true, // Get AI-generated answer summary
                include_raw_content: false,
                max_results: source.config.max_results || 5,
                // Include domains filter if specified (Tavily natively supports this)
                ...(allowedDomains.length > 0 && !searchEntireWeb && {
                    include_domains: allowedDomains.map(d => d.replace(/\/$/, '').replace(/^https?:\/\//, ''))
                }),
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[FederatedSearch] Tavily API error: ${response.status} - ${errorText}`);
            throw new Error(`Tavily API error: ${response.status}`);
        }

        const data = await response.json();
        const results = data.results || [];

        console.log(`[FederatedSearch] Tavily returned ${results.length} results`);

        // Map Tavily results to our SearchResult format
        return results.map((result: any, index: number) => ({
            sourceId: source.id,
            sourceName: source.name,
            sourceType: 'trusted_web',
            sourceIcon: source.icon_emoji || '🌐',
            trustLevel: source.trust_level,
            content: result.content || result.raw_content || '',
            title: result.title || 'Web Result',
            excerpt: (result.content || '').substring(0, 300) + '...',
            url: result.url,
            relevanceScore: result.score || (1 - index * 0.1),
            metadata: {
                displayLink: new URL(result.url).hostname,
                publishedDate: result.published_date,
                tavilyScore: result.score,
            },
        }));

    } catch (error) {
        console.error('[FederatedSearch] Tavily search error:', error);
        return [];
    }
}

// ============================================
// GOOGLE CSE FALLBACK (DOMAIN-RESTRICTED)
// ============================================

async function searchWithGoogleCSE(
    source: KnowledgeSource,
    query: string,
    domains: string[]
): Promise<SearchResult[]> {

    if (domains.length === 0) {
        console.log('[FederatedSearch] No domains configured for Google CSE search');
        return [];
    }

    const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const googleCseId = source.config.pse_id || process.env.GOOGLE_CSE_ID;

    if (!googleApiKey || !googleCseId) {
        console.log('[FederatedSearch] Google Search API not configured');
        return [];
    }

    try {
        // Build site-restricted query
        const siteQuery = domains.map((d: string) => `site:${d}`).join(' OR ');
        const fullQuery = `${query} (${siteQuery})`;

        const response = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(fullQuery)}&num=${source.config.max_results || 5}`
        );

        if (!response.ok) {
            throw new Error(`Google Search API error: ${response.status}`);
        }

        const data = await response.json();
        const items = data.items || [];

        return items.map((item: any, index: number) => ({
            sourceId: source.id,
            sourceName: source.name,
            sourceType: 'trusted_web',
            sourceIcon: source.icon_emoji,
            trustLevel: source.trust_level,
            content: item.snippet || '',
            title: item.title,
            excerpt: item.snippet || '',
            url: item.link,
            relevanceScore: 1 - (index * 0.1),
            metadata: {
                displayLink: item.displayLink,
            },
        }));

    } catch (error) {
        console.error('[FederatedSearch] Google CSE search error:', error);
        return [];
    }
}

// ============================================
// CITATION BUILDER
// ============================================

function buildCitations(results: SearchResult[]): RichCitation[] {
    const seen = new Set<string>();
    const citations: RichCitation[] = [];

    for (const result of results) {
        // Deduplicate by title
        const key = result.title.toLowerCase().substring(0, 50);
        if (seen.has(key)) continue;
        seen.add(key);

        let type: 'internal' | 'api' | 'web';
        let trustBadge: string;

        switch (result.sourceType) {
            case 'internal_documents':
                type = 'internal';
                trustBadge = 'Verified Internal';
                break;
            case 'external_api':
                type = 'api';
                trustBadge = result.sourceName;
                break;
            case 'trusted_web':
                type = 'web';
                trustBadge = 'Trusted Web';
                break;
            default:
                type = 'internal';
                trustBadge = 'Unknown';
        }

        citations.push({
            type,
            icon: result.sourceIcon,
            title: result.title,
            subtitle: result.metadata?.court || result.metadata?.journal || result.metadata?.displayLink,
            url: result.url,
            trustBadge,
        });

        if (citations.length >= 5) break;
    }

    return citations;
}

// ============================================
// HELPER: GENERATE EMBEDDING
// ============================================

async function generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/text-embedding-004',
                content: { parts: [{ text: text.substring(0, 5000) }] },
            }),
        }
    );

    if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
    }

    const data = await response.json();
    return data.embedding.values;
}

// ============================================
// CONTEXT BUILDER FOR AI
// ============================================

export function buildContextFromResults(results: SearchResult[]): string {
    let context = '';

    for (const result of results) {
        const sourceLabel = `${result.sourceIcon} ${result.sourceName}`;
        const trustNote = result.trustLevel >= 90 ? '(Verified)' : `(Trust: ${result.trustLevel}%)`;

        context += `\n\n--- From "${result.title}" [${sourceLabel}] ${trustNote} ---\n`;
        context += result.content;

        if (result.url) {
            context += `\nSource URL: ${result.url}`;
        }
    }

    return context;
}
