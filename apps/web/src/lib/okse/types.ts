/**
 * OKSE: Omniscient Knowledge Synthesis Engine - Type Definitions
 * 
 * These types define the core interfaces for the OKSE system:
 * - Web crawling and trusted sources
 * - Semantic caching
 * - Query routing
 * - Speculative drafting
 * - Knowledge fusion with citations
 */

// ============================================================================
// TRUSTED WEB SOURCES
// ============================================================================

export interface TrustedWebSource {
    id: string;
    product_id: string;
    domain: string;
    display_name: string | null;
    url_patterns: string[];
    exclude_patterns: string[];
    authority_score: number;
    source_type: 'official' | 'professional' | 'commentary' | 'blog';
    crawl_frequency: 'realtime' | '15min' | 'hourly' | 'daily' | 'weekly';
    css_selectors: {
        content?: string;
        title?: string;
        date?: string;
        exclude?: string[];
    };
    use_javascript: boolean;
    respect_robots_txt: boolean;
    rate_limit_ms: number;
    is_active: boolean;
    last_crawled_at: string | null;
    last_crawl_status: 'success' | 'error' | 'rate_limited' | null;
    total_pages_crawled: number;
    created_at: string;
    updated_at: string;
}

export interface WebKnowledgeCache {
    id: string;
    source_id: string;
    product_id: string;
    url: string;
    canonical_url: string | null;
    title: string | null;
    content_hash: string | null;
    raw_content: string | null;
    page_type: string | null;
    extracted_date: string | null;
    extracted_entities: Record<string, unknown>;
    expires_at: string;
    is_expired: boolean;
    crawled_at: string;
    times_used: number;
    last_used_at: string | null;
}

export interface WebKnowledgeChunk {
    id: string;
    cache_id: string;
    product_id: string;
    source_domain: string;
    source_display_name: string | null;
    source_url: string;
    source_title: string | null;
    content: string;
    chunk_index: number;
    contextual_summary: string | null;
    authority_score: number;
    expires_at: string;
}

// ============================================================================
// SEMANTIC CACHE
// ============================================================================

export interface SemanticCacheEntry {
    id: string;
    product_id: string;
    user_id: string | null;
    query_text: string;
    query_normalized: string;
    response: string;
    sources: CitationSource[];
    reasoning_metadata: {
        crag_verdict?: 'RELEVANT' | 'AMBIGUOUS' | 'IRRELEVANT';
        confidence?: number;
        complexity_level?: QueryComplexityLevel;
        drafts_used?: number;
    };
    confidence: number | null;
    complexity_level: QueryComplexityLevel | null;
    expires_at: string;
    hit_count: number;
    last_hit_at: string | null;
    user_feedback: 'positive' | 'negative' | null;
}

export interface CacheLookupResult {
    cache_id: string;
    query_text: string;
    response: string;
    sources: CitationSource[];
    confidence: number;
    similarity: number;
}

// ============================================================================
// QUERY ROUTING
// ============================================================================

export type QueryComplexityLevel = 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'MULTI_HOP';

export interface QueryClassification {
    level: QueryComplexityLevel;
    reasoning: string;
    sub_queries?: string[];  // For MULTI_HOP, decomposed queries
    estimated_sources_needed: number;
}

export interface PipelineConfig {
    use_kb: boolean;
    use_web_cache: boolean;
    use_live_web: boolean;
    use_entity_graph: boolean;
    use_semantic_cache: boolean;
    use_crag: boolean;
    use_speculative_drafting: boolean;
    num_drafts: number;
    kb_chunks: number;
    web_chunks: number;
    max_response_time_ms: number;
}

// ============================================================================
// SPECULATIVE DRAFTING
// ============================================================================

export type DraftPerspective = 'conservative' | 'comprehensive' | 'practical';

export interface Draft {
    perspective: DraftPerspective;
    content: string;
    citations_used: string[];
    confidence: number;
    generation_time_ms: number;
}

export interface DraftVerification {
    best_draft_index: number;
    factual_accuracy: number;
    completeness: number;
    citation_alignment: number;
    has_conflicts: boolean;
    conflict_description?: string;
    corrections: string[];
    synthesis_needed: boolean;
    final_answer: string;
    confidence_score: number;
}

// ============================================================================
// KNOWLEDGE FUSION & CITATIONS
// ============================================================================

export type SourceType = 'kb' | 'web' | 'user_kb' | 'live_web';

export interface CitationSource {
    id: string;
    type: SourceType;
    domain: string | null;          // "cbic.gov.in" for web sources
    display_name: string;           // "CBIC Official" or "Your Knowledge Base"
    title: string;
    url: string | null;
    authority_score: number;
    trust_stars: number;            // 1-5 stars for display
    contextual_summary: string | null;
    chunk_content: string;
    relevance_score: number;
}

export interface FusedSearchResult {
    chunk_id: string;
    content: string;
    source_type: SourceType;
    source_domain: string | null;
    source_title: string;
    source_url: string | null;
    authority_score: number;
    contextual_summary: string | null;
    rrf_score: number;
}

export interface FormattedCitation {
    index: number;
    trust_stars: string;            // "⭐⭐⭐⭐⭐" for display
    title: string;
    source_tag: string;             // "[cbic.gov.in]" or "[Your Knowledge Base]"
    url: string | null;
}

// ============================================================================
// CRAWLER TYPES
// ============================================================================

export interface CrawlResult {
    success: boolean;
    url: string;
    title: string | null;
    content: string | null;
    content_hash: string | null;
    page_type: string | null;
    extracted_date: string | null;
    error?: string;
}

export interface CrawlJobStatus {
    source_id: string;
    domain: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    pages_crawled: number;
    pages_updated: number;
    pages_skipped: number;
    errors: string[];
    started_at: string;
    completed_at: string | null;
}

// ============================================================================
// OKSE RESPONSE
// ============================================================================

export interface OKSEResponse {
    answer: string;
    citations: FormattedCitation[];
    sources_used: CitationSource[];
    metadata: {
        complexity_level: QueryComplexityLevel;
        pipeline_used: string[];
        cache_hit: boolean;
        retrieval_time_ms: number;
        generation_time_ms: number;
        total_time_ms: number;
        crag_verdict: 'RELEVANT' | 'AMBIGUOUS' | 'IRRELEVANT' | null;
        confidence: number;
        drafts_generated: number;
        web_sources_used: number;
        kb_sources_used: number;
    };
}

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

export const PIPELINE_CONFIGS: Record<QueryComplexityLevel, PipelineConfig> = {
    SIMPLE: {
        use_kb: true,
        use_web_cache: false,
        use_live_web: false,
        use_entity_graph: false,
        use_semantic_cache: true,
        use_crag: false,
        use_speculative_drafting: false,
        num_drafts: 1,
        kb_chunks: 3,
        web_chunks: 0,
        max_response_time_ms: 500,
    },
    MODERATE: {
        use_kb: true,
        use_web_cache: true,
        use_live_web: false,
        use_entity_graph: false,
        use_semantic_cache: true,
        use_crag: true,
        use_speculative_drafting: false,
        num_drafts: 1,
        kb_chunks: 5,
        web_chunks: 3,
        max_response_time_ms: 2000,
    },
    COMPLEX: {
        use_kb: true,
        use_web_cache: true,
        use_live_web: true,
        use_entity_graph: true,
        use_semantic_cache: true,
        use_crag: true,
        use_speculative_drafting: true,
        num_drafts: 3,
        kb_chunks: 8,
        web_chunks: 5,
        max_response_time_ms: 4000,
    },
    MULTI_HOP: {
        use_kb: true,
        use_web_cache: true,
        use_live_web: true,
        use_entity_graph: true,
        use_semantic_cache: true,
        use_crag: true,
        use_speculative_drafting: true,
        num_drafts: 3,
        kb_chunks: 10,
        web_chunks: 8,
        max_response_time_ms: 6000,
    },
};

// TTL configurations in hours
export const CACHE_TTL = {
    semantic_simple: 24,       // 24 hours for simple queries
    semantic_moderate: 12,     // 12 hours for moderate
    semantic_complex: 6,       // 6 hours for complex
    web_official: 2,           // 2 hours for government sites
    web_professional: 6,       // 6 hours for professional sites
    web_commentary: 24,        // 24 hours for commentary/blogs
    embedding: 168,            // 7 days for embeddings
};

// Authority score to trust stars mapping
export function authorityToStars(authority: number): number {
    if (authority >= 9) return 5;
    if (authority >= 7) return 4;
    if (authority >= 5) return 3;
    if (authority >= 3) return 2;
    return 1;
}

// Format trust stars for display
export function formatTrustStars(stars: number): string {
    const filled = '⭐'.repeat(stars);
    const empty = '☆'.repeat(5 - stars);
    return filled + empty;
}
