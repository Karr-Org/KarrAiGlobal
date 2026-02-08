/**
 * OKSE: Semantic Cache Service
 * 
 * Multi-level caching for query responses:
 * - Level 1: Exact match (normalized query hash)
 * - Level 2: Semantic similarity (embedding-based)
 * - Level 3: Retrieval cache (skip retrieval, regenerate answer)
 */

import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/gemini';
import {
    SemanticCacheEntry,
    CacheLookupResult,
    CitationSource,
    QueryComplexityLevel,
    CACHE_TTL
} from './types';

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const SEMANTIC_SIMILARITY_THRESHOLD = 0.88;  // High threshold for cache hits
const MIN_CONFIDENCE_FOR_CACHE = 0.7;        // Don't cache low-confidence responses

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function normalizeQuery(query: string): string {
    return query
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, ' ')  // Remove punctuation
        .replace(/\s+/g, ' ')       // Normalize whitespace
        .trim();
}

function getTTLHours(complexity: QueryComplexityLevel): number {
    switch (complexity) {
        case 'SIMPLE': return CACHE_TTL.semantic_simple;
        case 'MODERATE': return CACHE_TTL.semantic_moderate;
        case 'COMPLEX': return CACHE_TTL.semantic_complex;
        case 'MULTI_HOP': return CACHE_TTL.semantic_complex;
    }
}

// ============================================================================
// SEMANTIC CACHE SERVICE
// ============================================================================

export class SemanticCacheService {

    /**
     * Look up a query in the semantic cache
     * Returns the cached response if found, null otherwise
     */
    async lookup(
        query: string,
        productId: string,
        userId?: string
    ): Promise<CacheLookupResult | null> {
        const startTime = Date.now();
        console.log('[SemanticCache] Looking up:', query.substring(0, 50) + '...');

        const supabase = await createClient();

        // Level 1: Exact match lookup (fast)
        const normalized = normalizeQuery(query);
        const { data: exactMatch } = await supabase
            .from('semantic_cache')
            .select('id, query_text, response, sources, confidence')
            .eq('product_id', productId)
            .eq('query_normalized', normalized)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (exactMatch) {
            console.log('[SemanticCache] Exact match found in', Date.now() - startTime, 'ms');

            // Increment hit count
            await supabase.rpc('increment_cache_hit', { cache_id: exactMatch.id });

            return {
                cache_id: exactMatch.id,
                query_text: exactMatch.query_text,
                response: exactMatch.response,
                sources: exactMatch.sources as CitationSource[],
                confidence: exactMatch.confidence || 0.9,
                similarity: 1.0,
            };
        }

        // Level 2: Semantic similarity lookup
        const queryEmbedding = await generateEmbedding(query);

        const { data: semanticMatches } = await supabase.rpc('okse_cache_lookup', {
            p_query_embedding: queryEmbedding,
            p_product_id: productId,
            p_similarity_threshold: SEMANTIC_SIMILARITY_THRESHOLD,
            p_user_id: userId || null,
        });

        if (semanticMatches && semanticMatches.length > 0) {
            const match = semanticMatches[0];
            console.log('[SemanticCache] Semantic match found, similarity:', match.similarity, 'in', Date.now() - startTime, 'ms');

            // Increment hit count
            await supabase
                .from('semantic_cache')
                .update({
                    hit_count: supabase.rpc('increment', { x: 1 }),
                    last_hit_at: new Date().toISOString()
                })
                .eq('id', match.cache_id);

            return {
                cache_id: match.cache_id,
                query_text: match.query_text,
                response: match.response,
                sources: match.sources as CitationSource[],
                confidence: match.confidence,
                similarity: match.similarity,
            };
        }

        console.log('[SemanticCache] No cache hit in', Date.now() - startTime, 'ms');
        return null;
    }

    /**
     * Store a response in the semantic cache
     */
    async store(
        query: string,
        productId: string,
        response: string,
        sources: CitationSource[],
        metadata: {
            confidence: number;
            complexity: QueryComplexityLevel;
            crag_verdict?: 'RELEVANT' | 'AMBIGUOUS' | 'IRRELEVANT';
            drafts_used?: number;
        },
        userId?: string
    ): Promise<void> {
        // Don't cache low-confidence responses
        if (metadata.confidence < MIN_CONFIDENCE_FOR_CACHE) {
            console.log('[SemanticCache] Skipping cache - low confidence:', metadata.confidence);
            return;
        }

        const supabase = await createClient();
        const queryEmbedding = await generateEmbedding(query);
        const ttlHours = getTTLHours(metadata.complexity);
        const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

        const { error } = await supabase
            .from('semantic_cache')
            .upsert({
                product_id: productId,
                user_id: userId || null,
                query_text: query,
                query_normalized: normalizeQuery(query),
                query_embedding: queryEmbedding,
                response,
                sources,
                reasoning_metadata: {
                    crag_verdict: metadata.crag_verdict,
                    confidence: metadata.confidence,
                    complexity_level: metadata.complexity,
                    drafts_used: metadata.drafts_used,
                },
                confidence: metadata.confidence,
                complexity_level: metadata.complexity,
                expires_at: expiresAt,
                hit_count: 0,
                last_hit_at: null,
            }, {
                onConflict: 'product_id, query_normalized',
            });

        if (error) {
            console.error('[SemanticCache] Failed to store:', error);
        } else {
            console.log('[SemanticCache] Stored with TTL:', ttlHours, 'hours');
        }
    }

    /**
     * Invalidate cache entries for a product
     * Optionally filter by topic using semantic similarity
     */
    async invalidate(
        productId: string,
        options?: {
            topic?: string;              // Invalidate entries related to this topic
            olderThan?: Date;            // Invalidate entries older than this
            forceAll?: boolean;          // Invalidate ALL entries for this product
        }
    ): Promise<number> {
        const supabase = await createClient();

        if (options?.forceAll) {
            const { data } = await supabase
                .from('semantic_cache')
                .delete()
                .eq('product_id', productId)
                .select('id');

            console.log('[SemanticCache] Force invalidated all for product:', data?.length || 0);
            return data?.length || 0;
        }

        let query = supabase
            .from('semantic_cache')
            .update({ expires_at: new Date().toISOString() })
            .eq('product_id', productId);

        if (options?.olderThan) {
            query = query.lt('created_at', options.olderThan.toISOString());
        }

        // For topic-based invalidation, we'd need to do a semantic search first
        // This is a simplified version that invalidates by time
        const { data } = await query.select('id');

        console.log('[SemanticCache] Invalidated:', data?.length || 0);
        return data?.length || 0;
    }

    /**
     * Record user feedback on a cached response
     */
    async recordFeedback(
        cacheId: string,
        feedback: 'positive' | 'negative'
    ): Promise<void> {
        const supabase = await createClient();

        // For negative feedback, also reduce TTL
        const updates: Record<string, unknown> = {
            user_feedback: feedback,
        };

        if (feedback === 'negative') {
            // Expire in 1 hour instead of original TTL
            updates.expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        }

        await supabase
            .from('semantic_cache')
            .update(updates)
            .eq('id', cacheId);

        console.log('[SemanticCache] Recorded feedback:', feedback, 'for', cacheId);
    }

    /**
     * Get cache statistics for a product
     */
    async getStats(productId: string): Promise<{
        total_entries: number;
        active_entries: number;
        total_hits: number;
        avg_confidence: number;
        by_complexity: Record<string, number>;
    }> {
        const supabase = await createClient();

        const { data: entries } = await supabase
            .from('semantic_cache')
            .select('complexity_level, hit_count, confidence, expires_at')
            .eq('product_id', productId);

        if (!entries || entries.length === 0) {
            return {
                total_entries: 0,
                active_entries: 0,
                total_hits: 0,
                avg_confidence: 0,
                by_complexity: {},
            };
        }

        const now = new Date();
        const activeEntries = entries.filter(e => new Date(e.expires_at) > now);
        const totalHits = entries.reduce((sum, e) => sum + (e.hit_count || 0), 0);
        const avgConfidence = entries.reduce((sum, e) => sum + (e.confidence || 0), 0) / entries.length;

        const byComplexity: Record<string, number> = {};
        for (const entry of entries) {
            const level = entry.complexity_level || 'unknown';
            byComplexity[level] = (byComplexity[level] || 0) + 1;
        }

        return {
            total_entries: entries.length,
            active_entries: activeEntries.length,
            total_hits: totalHits,
            avg_confidence: Math.round(avgConfidence * 100) / 100,
            by_complexity: byComplexity,
        };
    }
}

// Export singleton instance
export const semanticCache = new SemanticCacheService();
