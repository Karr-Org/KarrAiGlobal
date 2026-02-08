/**
 * OKSE: Knowledge Fusion Service
 * 
 * Combines KB and Web knowledge with:
 * - Parallel retrieval from multiple sources
 * - Reciprocal Rank Fusion (RRF) with authority weighting
 * - Hierarchical citation formatting with domain names
 */

import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/gemini';
import {
    FusedSearchResult,
    CitationSource,
    FormattedCitation,
    SourceType,
    authorityToStars,
    formatTrustStars
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const RRF_K = 60;  // RRF constant (standard value)
const KB_WEIGHT = 0.6;
const WEB_WEIGHT = 0.4;

// ============================================================================
// KNOWLEDGE FUSION SERVICE
// ============================================================================

export class KnowledgeFusionService {

    /**
     * Perform fused search across KB and Web knowledge
     * Returns results ranked by RRF with authority weighting
     */
    async fusedSearch(
        query: string,
        productId: string,
        knowledgeBaseId: string,
        options?: {
            kbLimit?: number;
            webLimit?: number;
            minAuthority?: number;
        }
    ): Promise<FusedSearchResult[]> {
        const startTime = Date.now();
        console.log('[KnowledgeFusion] Starting fused search for:', query.substring(0, 50) + '...');

        const supabase = await createClient();
        const queryEmbedding = await generateEmbedding(query);

        const kbLimit = options?.kbLimit || 8;
        const webLimit = options?.webLimit || 5;

        // Use the RPC function for fused search
        const { data: fusedResults, error } = await supabase.rpc('okse_fused_search', {
            p_query_embedding: queryEmbedding,
            p_query_text: query,
            p_product_id: productId,
            p_knowledge_base_id: knowledgeBaseId,
            p_match_count: kbLimit + webLimit,
            p_kb_weight: KB_WEIGHT,
            p_web_weight: WEB_WEIGHT,
        });

        if (error) {
            console.error('[KnowledgeFusion] Fused search failed:', error);
            // Fallback to KB-only search
            return this.kbOnlySearch(queryEmbedding, knowledgeBaseId, kbLimit);
        }

        console.log('[KnowledgeFusion] Fused search returned', fusedResults?.length || 0, 'results in', Date.now() - startTime, 'ms');

        return (fusedResults || []) as FusedSearchResult[];
    }

    /**
     * Fallback: KB-only search
     */
    private async kbOnlySearch(
        queryEmbedding: number[],
        knowledgeBaseId: string,
        limit: number
    ): Promise<FusedSearchResult[]> {
        const supabase = await createClient();

        const { data } = await supabase.rpc('enhanced_hybrid_search', {
            p_query_embedding: queryEmbedding,
            p_query_text: '',
            p_knowledge_base_id: knowledgeBaseId,
            p_match_count: limit,
        });

        return (data || []).map((r: { id: string; content: string; document_title?: string; contextual_summary?: string; rrf_score?: number }) => ({
            chunk_id: r.id,
            content: r.content,
            source_type: 'kb' as SourceType,
            source_domain: null,
            source_title: r.document_title || 'Knowledge Base Document',
            source_url: null,
            authority_score: 10,
            contextual_summary: r.contextual_summary,
            rrf_score: r.rrf_score || 0.5,
        }));
    }

    /**
     * Search only web knowledge cache
     */
    async webOnlySearch(
        query: string,
        productId: string,
        limit: number = 5,
        minAuthority: number = 1
    ): Promise<FusedSearchResult[]> {
        const supabase = await createClient();
        const queryEmbedding = await generateEmbedding(query);

        const { data } = await supabase.rpc('okse_web_search', {
            p_query_embedding: queryEmbedding,
            p_product_id: productId,
            p_match_count: limit,
            p_min_authority: minAuthority,
        });

        return (data || []).map((r: { chunk_id: string; content: string; source_domain: string; source_display_name?: string; source_url: string; source_title?: string; authority_score: number; contextual_summary?: string; similarity: number }) => ({
            chunk_id: r.chunk_id,
            content: r.content,
            source_type: 'web' as SourceType,
            source_domain: r.source_domain,
            source_title: r.source_title || r.source_domain,
            source_url: r.source_url,
            authority_score: r.authority_score,
            contextual_summary: r.contextual_summary,
            rrf_score: r.similarity,
        }));
    }

    /**
     * Convert fused results to citation sources
     */
    toCitationSources(results: FusedSearchResult[]): CitationSource[] {
        return results.map(r => ({
            id: r.chunk_id,
            type: r.source_type,
            domain: r.source_domain,
            display_name: r.source_domain
                ? r.source_domain
                : 'Your Knowledge Base',
            title: r.source_title || 'Untitled',
            url: r.source_url,
            authority_score: r.authority_score,
            trust_stars: authorityToStars(r.authority_score),
            contextual_summary: r.contextual_summary,
            chunk_content: r.content,
            relevance_score: r.rrf_score,
        }));
    }

    /**
     * Format citations for display with domain names
     * 
     * Output format:
     * [1] ⭐⭐⭐⭐⭐ CGST Act Section 17(5) [Your Knowledge Base]
     * [2] ⭐⭐⭐⭐⭐ CBIC Circular 184/2022 [cbic.gov.in]
     * [3] ⭐⭐⭐☆☆ ITC Analysis [taxguru.in]
     */
    formatCitations(sources: CitationSource[]): FormattedCitation[] {
        // Deduplicate by title and sort by authority
        const uniqueSources = this.deduplicateSources(sources);
        const sorted = uniqueSources.sort((a, b) => b.authority_score - a.authority_score);

        return sorted.map((source, index) => ({
            index: index + 1,
            trust_stars: formatTrustStars(source.trust_stars),
            title: source.title,
            source_tag: source.domain
                ? `[${source.domain}]`
                : '[Your Knowledge Base]',
            url: source.url,
        }));
    }

    /**
     * Generate the citations block for the response
     */
    formatCitationsBlock(sources: CitationSource[]): string {
        const formatted = this.formatCitations(sources);

        if (formatted.length === 0) {
            return '';
        }

        const lines = formatted.map(c => {
            const urlPart = c.url ? ` - [View Source](${c.url})` : '';
            return `[${c.index}] ${c.trust_stars} ${c.title} ${c.source_tag}${urlPart}`;
        });

        return `\n\n---\n📎 **Sources (by authority):**\n${lines.join('\n')}`;
    }

    /**
     * Deduplicate sources by title similarity
     */
    private deduplicateSources(sources: CitationSource[]): CitationSource[] {
        const seen = new Map<string, CitationSource>();

        for (const source of sources) {
            const key = source.title.toLowerCase().trim();
            const existing = seen.get(key);

            if (!existing || source.authority_score > existing.authority_score) {
                seen.set(key, source);
            }
        }

        return Array.from(seen.values());
    }

    /**
     * Get statistics about source usage
     */
    analyzeSourceDistribution(sources: CitationSource[]): {
        kb_count: number;
        web_count: number;
        avg_authority: number;
        domains_used: string[];
    } {
        const kbCount = sources.filter(s => s.type === 'kb').length;
        const webCount = sources.filter(s => s.type === 'web').length;
        const avgAuthority = sources.reduce((sum, s) => sum + s.authority_score, 0) / sources.length || 0;
        const domains = [...new Set(sources.filter(s => s.domain).map(s => s.domain!))];

        return {
            kb_count: kbCount,
            web_count: webCount,
            avg_authority: Math.round(avgAuthority * 10) / 10,
            domains_used: domains,
        };
    }
}

// Export singleton instance
export const knowledgeFusion = new KnowledgeFusionService();
