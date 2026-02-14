/**
 * OKSE: Omniscient Knowledge Synthesis Engine
 * 
 * Main orchestrator that combines all OKSE services:
 * - Query routing based on complexity
 * - Semantic caching for fast responses
 * - Knowledge fusion from KB + Web
 * - Speculative drafting for accuracy
 * - Hierarchical citations with domain names
 */

import { queryRouter } from './query-router';
import { semanticCache } from './semantic-cache';
import { knowledgeFusion } from './knowledge-fusion';
import { speculativeDrafting } from './speculative-drafting';
import { liveWebSearch } from './live-web-search';
import { generateContentWithGemini, generateContentWithGeminiFlash } from '@/lib/gemini';
import {
    OKSEResponse,
    QueryComplexityLevel,
    CitationSource,
    PIPELINE_CONFIGS,
    authorityToStars
} from './types';

// ============================================================================
// INLINE CRAG EVALUATION (Simplified for OKSE)
// ============================================================================

interface CRAGEvalResult {
    verdict: 'RELEVANT' | 'AMBIGUOUS' | 'IRRELEVANT';
    confidence: number;
}

async function evaluateCRAG(query: string, context: string): Promise<CRAGEvalResult> {
    try {
        const prompt = `Evaluate how relevant the following context is to answering the query.

Query: ${query}

Context:
${context.substring(0, 3000)}

Rate the relevance:
- RELEVANT: Context directly answers the query (confidence 0.85-1.0)
- AMBIGUOUS: Context partially addresses the query or needs supplementation (confidence 0.5-0.84)
- IRRELEVANT: Context does not help answer the query (confidence 0-0.49)

Respond in JSON: {"verdict": "RELEVANT|AMBIGUOUS|IRRELEVANT", "confidence": 0.0-1.0}`;

        const response = await generateContentWithGeminiFlash(prompt, {
            temperature: 0.1,
            maxOutputTokens: 100,
        });

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                verdict: parsed.verdict || 'AMBIGUOUS',
                confidence: parsed.confidence || 0.5,
            };
        }
    } catch (error) {
        console.error('[OKSE] CRAG evaluation failed:', error);
    }

    return { verdict: 'AMBIGUOUS', confidence: 0.5 };
}

// ============================================================================
// SIMPLE GENERATION (No speculative drafting)
// ============================================================================

const SIMPLE_GENERATION_PROMPT = `You are an expert AI assistant. Answer the following question based on the provided context.

Question: {query}

Context:
{context}

Instructions:
- Be concise and direct
- Use [1], [2], etc. to cite sources
- If information is not in the context, say so

Answer:`;

// ============================================================================
// OKSE ENGINE
// ============================================================================

export class OKSEEngine {

    /**
     * Process a query through the OKSE pipeline
     */
    async process(
        query: string,
        productId: string,
        knowledgeBaseId: string,
        options?: {
            userId?: string;
            forceComplexity?: QueryComplexityLevel;
            skipCache?: boolean;
            enableLiveWeb?: boolean;
        }
    ): Promise<OKSEResponse> {
        const startTime = Date.now();
        const pipelineSteps: string[] = [];

        console.log('[OKSE] Processing query:', query.substring(0, 80) + '...');

        // Step 1: Classify query complexity
        const classification = options?.forceComplexity
            ? { level: options.forceComplexity, reasoning: 'Forced', estimated_sources_needed: 5 }
            : await queryRouter.classify(query);

        pipelineSteps.push(`complexity:${classification.level}`);
        console.log('[OKSE] Query classified as:', classification.level);

        const config = PIPELINE_CONFIGS[classification.level];

        // Short-circuit: CONVERSATIONAL queries skip all retrieval
        if (classification.level === 'CONVERSATIONAL') {
            console.log('[OKSE] Conversational query — skipping KB/Web/CRAG, generating direct response');
            pipelineSteps.push('conversational:direct');

            const directPrompt = `You are a helpful, friendly AI assistant. Respond naturally and warmly to this message. Do NOT search any knowledge base or cite sources. Keep it brief and conversational.\n\nUser: ${query}`;

            let answer: string;
            try {
                answer = await generateContentWithGeminiFlash(directPrompt, {
                    temperature: 0.8,
                    maxOutputTokens: 300,
                });
            } catch {
                answer = "Hello! I'm here to help. What would you like to know?";
            }

            return {
                answer,
                citations: [],
                sources_used: [],
                metadata: {
                    complexity_level: 'CONVERSATIONAL',
                    pipeline_used: pipelineSteps,
                    cache_hit: false,
                    retrieval_time_ms: 0,
                    generation_time_ms: Date.now() - startTime,
                    total_time_ms: Date.now() - startTime,
                    crag_verdict: null,
                    confidence: 1.0,
                    drafts_generated: 0,
                    web_sources_used: 0,
                    kb_sources_used: 0,
                },
            };
        }

        // Short-circuit: GENERAL_KNOWLEDGE queries skip all retrieval (math, trivia, translation)
        if (classification.level === 'GENERAL_KNOWLEDGE') {
            console.log('[OKSE] General knowledge query — skipping KB/Web, generating direct response');
            pipelineSteps.push('general_knowledge:direct');

            const directPrompt = `You are a helpful AI assistant. Answer this general knowledge question directly from your training data. Do NOT cite any sources or mention a knowledge base.\n\nUser: ${query}`;

            let answer: string;
            try {
                answer = await generateContentWithGeminiFlash(directPrompt, {
                    temperature: 0.3,
                    maxOutputTokens: 1000,
                });
            } catch {
                answer = "I'm sorry, I couldn't process that. Could you try rephrasing?";
            }

            return {
                answer,
                citations: [],
                sources_used: [],
                metadata: {
                    complexity_level: 'GENERAL_KNOWLEDGE',
                    pipeline_used: pipelineSteps,
                    cache_hit: false,
                    retrieval_time_ms: 0,
                    generation_time_ms: Date.now() - startTime,
                    total_time_ms: Date.now() - startTime,
                    crag_verdict: null,
                    confidence: 1.0,
                    drafts_generated: 0,
                    web_sources_used: 0,
                    kb_sources_used: 0,
                },
            };
        }

        // Step 2: Check semantic cache (if enabled)
        if (config.use_semantic_cache && !options?.skipCache) {
            const cacheHit = await semanticCache.lookup(query, productId, options?.userId);

            if (cacheHit) {
                console.log('[OKSE] Cache hit! Similarity:', cacheHit.similarity);
                pipelineSteps.push('cache:hit');

                return {
                    answer: cacheHit.response,
                    citations: knowledgeFusion.formatCitations(cacheHit.sources),
                    sources_used: cacheHit.sources,
                    metadata: {
                        complexity_level: classification.level,
                        pipeline_used: pipelineSteps,
                        cache_hit: true,
                        retrieval_time_ms: 0,
                        generation_time_ms: 0,
                        total_time_ms: Date.now() - startTime,
                        crag_verdict: null,
                        confidence: cacheHit.confidence,
                        drafts_generated: 0,
                        web_sources_used: cacheHit.sources.filter(s => s.type === 'web').length,
                        kb_sources_used: cacheHit.sources.filter(s => s.type === 'kb').length,
                    },
                };
            }
            pipelineSteps.push('cache:miss');
        }

        // Step 3: Fused retrieval (KB + Web if applicable)
        const retrievalStart = Date.now();

        let fusedResults;
        if (config.use_web_cache) {
            fusedResults = await knowledgeFusion.fusedSearch(
                query,
                productId,
                knowledgeBaseId,
                { kbLimit: config.kb_chunks, webLimit: config.web_chunks }
            );
            pipelineSteps.push('retrieval:fused');
        } else {
            // KB-only search
            fusedResults = await knowledgeFusion.fusedSearch(
                query,
                productId,
                knowledgeBaseId,
                { kbLimit: config.kb_chunks, webLimit: 0 }
            );
            pipelineSteps.push('retrieval:kb_only');
        }

        const retrievalTime = Date.now() - retrievalStart;
        const sources = knowledgeFusion.toCitationSources(fusedResults);

        console.log('[OKSE] Retrieved', sources.length, 'sources in', retrievalTime, 'ms');

        // Step 4: CRAG evaluation (if enabled)
        let cragVerdict: 'RELEVANT' | 'AMBIGUOUS' | 'IRRELEVANT' | null = null;

        if (config.use_crag && sources.length > 0) {
            const context = sources.map(s => s.chunk_content).join('\n\n');
            const cragResult = await evaluateCRAG(query, context);
            cragVerdict = cragResult.verdict;
            pipelineSteps.push(`crag:${cragVerdict.toLowerCase()}`);

            console.log('[OKSE] CRAG verdict:', cragVerdict, 'Confidence:', cragResult.confidence);

            // Live web search only when pipeline config allows it for this complexity level
            // AND either CRAG says context is irrelevant, or caller explicitly requested it
            const shouldLiveSearch = config.use_live_web && (cragVerdict === 'IRRELEVANT' || options?.enableLiveWeb === true);

            if (shouldLiveSearch) {
                console.log('[OKSE] Triggering live web search (Verdict: ' + cragVerdict + ', Explicit: ' + options?.enableLiveWeb + ')');
                pipelineSteps.push('live_web:triggered');

                try {
                    const webResults = await liveWebSearch(query, productId, {
                        fetchContent: true,
                        maxResults: 3
                    });

                    if (webResults.results.length > 0) {
                        console.log('[OKSE] Live search found ' + webResults.results.length + ' results');
                        pipelineSteps.push(`live_web:found_${webResults.results.length}`);

                        // Convert to CitationSource
                        const liveSources: CitationSource[] = webResults.results.map(r => ({
                            id: `live_${Math.random().toString(36).substr(2, 9)}`,
                            type: 'live_web',
                            domain: r.domain,
                            display_name: r.domain,
                            title: r.title,
                            url: r.url,
                            authority_score: r.authority_score,
                            trust_stars: authorityToStars(r.authority_score),
                            contextual_summary: r.snippet,
                            chunk_content: r.content ? r.content.substring(0, 1500) : r.snippet, // Truncate for context window
                            relevance_score: 0.9 // Assume high relevance if returned by search engine
                        }));

                        // Append to sources or replace if original was irrelevant
                        if (cragVerdict === 'IRRELEVANT') {
                            // If KB was irrelevant, prioritize web sources but keep KB as backup context
                            sources.unshift(...liveSources);
                            pipelineSteps.push('sources:augmented_web');
                        } else {
                            // Just append
                            sources.push(...liveSources);
                        }

                        // Recalculate CRAG verdict? No, trusting Search Engine for now.
                    }
                } catch (err) {
                    console.error('[OKSE] Live web search failed:', err);
                    pipelineSteps.push('live_web:failed');
                }
            }
        }

        // Step 5: Generate response
        const generationStart = Date.now();
        let answer: string;
        let confidence: number;
        let draftsGenerated = 0;

        if (config.use_speculative_drafting && sources.length > 0) {
            // Use speculative drafting for complex queries
            const draftingResult = await speculativeDrafting.run(query, sources);
            answer = draftingResult.answer;
            confidence = draftingResult.confidence;
            draftsGenerated = draftingResult.drafts_count;
            pipelineSteps.push(`speculative:${draftsGenerated}_drafts`);

            if (draftingResult.has_conflicts) {
                pipelineSteps.push('conflicts:detected');
            }
        } else {
            // Simple generation for straightforward queries
            const contextFormatted = sources.map((s, i) =>
                `[${i + 1}] (${s.domain || 'KB'}): ${s.chunk_content}`
            ).join('\n\n');

            const prompt = SIMPLE_GENERATION_PROMPT
                .replace('{query}', query)
                .replace('{context}', contextFormatted);

            answer = await generateContentWithGemini(prompt, {
                temperature: 0.3,
                maxOutputTokens: 1500,
            });
            confidence = 0.8;
            pipelineSteps.push('generation:simple');
        }

        const generationTime = Date.now() - generationStart;

        // Step 6: Add citations block to answer
        const citationsBlock = knowledgeFusion.formatCitationsBlock(sources);
        const finalAnswer = answer + citationsBlock;

        // Step 7: Cache the response (if confidence is high enough)
        const sourceDistribution = knowledgeFusion.analyzeSourceDistribution(sources);

        if (config.use_semantic_cache && confidence >= 0.7) {
            await semanticCache.store(
                query,
                productId,
                finalAnswer,
                sources,
                {
                    confidence,
                    complexity: classification.level,
                    crag_verdict: cragVerdict || undefined,
                    drafts_used: draftsGenerated,
                },
                options?.userId
            );
            pipelineSteps.push('cache:stored');
        }

        const totalTime = Date.now() - startTime;
        console.log('[OKSE] Response generated in', totalTime, 'ms');
        console.log('[OKSE] Pipeline:', pipelineSteps.join(' → '));

        return {
            answer: finalAnswer,
            citations: knowledgeFusion.formatCitations(sources),
            sources_used: sources,
            metadata: {
                complexity_level: classification.level,
                pipeline_used: pipelineSteps,
                cache_hit: false,
                retrieval_time_ms: retrievalTime,
                generation_time_ms: generationTime,
                total_time_ms: totalTime,
                crag_verdict: cragVerdict,
                confidence,
                drafts_generated: draftsGenerated,
                web_sources_used: sourceDistribution.web_count,
                kb_sources_used: sourceDistribution.kb_count,
            },
        };
    }

    /**
     * Get statistics about OKSE performance for a product
     */
    async getStats(productId: string) {
        const cacheStats = await semanticCache.getStats(productId);

        return {
            cache: cacheStats,
            // Add more stats as needed
        };
    }
}

// Export singleton instance
export const okseEngine = new OKSEEngine();
