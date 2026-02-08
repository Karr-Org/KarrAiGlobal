/**
 * OKSE: Omniscient Knowledge Synthesis Engine
 * 
 * Barrel export for all OKSE services
 */

// Main engine
export { okseEngine, OKSEEngine } from './engine';

// Core services
export { queryRouter, QueryComplexityRouter } from './query-router';
export { semanticCache, SemanticCacheService } from './semantic-cache';
export { knowledgeFusion, KnowledgeFusionService } from './knowledge-fusion';
export { speculativeDrafting, SpeculativeDraftingService } from './speculative-drafting';
export { webCrawler, WebCrawlerService } from './web-crawler';
export { liveWebSearch, formatWebResultsForAI, extractPageContent } from './live-web-search';

// Types
export type {
    // Web sources
    TrustedWebSource,
    WebKnowledgeCache,
    WebKnowledgeChunk,

    // Caching
    SemanticCacheEntry,
    CacheLookupResult,

    // Query routing
    QueryComplexityLevel,
    QueryClassification,
    PipelineConfig,

    // Speculative drafting
    DraftPerspective,
    Draft,
    DraftVerification,

    // Knowledge fusion
    SourceType,
    CitationSource,
    FusedSearchResult,
    FormattedCitation,

    // Crawler
    CrawlResult,
    CrawlJobStatus,

    // Response
    OKSEResponse,
} from './types';

// Constants and utilities
export {
    PIPELINE_CONFIGS,
    CACHE_TTL,
    authorityToStars,
    formatTrustStars,
} from './types';
