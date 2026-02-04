/**
 * OMNIFORGE PHASE 2: CRAG (Corrective RAG) EVALUATOR
 * 
 * Self-correcting retrieval that scores results and takes corrective action:
 * - RELEVANT (>0.85): Proceed to generation
 * - AMBIGUOUS (0.5-0.85): Fetch from web/API to supplement
 * - IRRELEVANT (<0.5): Query expansion OR "I don't know"
 * 
 * Research: CRAG paper shows this significantly reduces hallucinations.
 */

import { SearchResult, federatedSearch } from './federated-search';
import { searchWithCustomScraper } from './domain-scraper';

// ============================================
// TYPES
// ============================================

export type CRAGVerdict = 'RELEVANT' | 'AMBIGUOUS' | 'IRRELEVANT' | 'NO_RESULTS';

export interface CRAGScore {
    relevanceScore: number;      // 0-1: How well does it answer the query?
    authorityWeight: number;     // 0-1: Trust level of source
    temporalValidity: number;    // 0-1: Is it still current?
    conflictFlag: boolean;       // Does it contradict other sources?

    finalScore: number;          // Weighted combination
    verdict: CRAGVerdict;
}

export interface CRAGResult {
    originalResults: SearchResult[];
    evaluatedResults: EvaluatedResult[];
    verdict: CRAGVerdict;
    confidence: number;
    correctionApplied: string | null;
    supplementalResults?: SearchResult[];
}

export interface EvaluatedResult extends SearchResult {
    cragScore: CRAGScore;
    isUsable: boolean;
}

// ============================================
// THRESHOLDS (Configurable per product in future)
// ============================================

const THRESHOLDS = {
    RELEVANT: 0.85,
    AMBIGUOUS_LOW: 0.5,
    MIN_RESULTS: 2,
    MIN_HIGH_CONFIDENCE: 1,
};

// ============================================
// MAIN CRAG EVALUATION
// ============================================

/**
 * Evaluate search results using CRAG methodology.
 * Returns scored results with verdict and optional corrections.
 */
export async function evaluateWithCRAG(
    results: SearchResult[],
    query: string,
    productId: string,
    options?: {
        enableWebFallback?: boolean;
        trustedDomains?: string[];
        maxSupplementalResults?: number;
    }
): Promise<CRAGResult> {

    // Handle empty results
    if (!results || results.length === 0) {
        return {
            originalResults: [],
            evaluatedResults: [],
            verdict: 'NO_RESULTS',
            confidence: 0,
            correctionApplied: 'none - no results found',
        };
    }

    // Score each result
    const evaluatedResults = results.map(result => evaluateSingleResult(result, query));

    // Sort by CRAG score
    evaluatedResults.sort((a, b) => b.cragScore.finalScore - a.cragScore.finalScore);

    // Determine overall verdict
    const highConfidence = evaluatedResults.filter(r => r.cragScore.finalScore >= THRESHOLDS.RELEVANT);
    const mediumConfidence = evaluatedResults.filter(r =>
        r.cragScore.finalScore >= THRESHOLDS.AMBIGUOUS_LOW &&
        r.cragScore.finalScore < THRESHOLDS.RELEVANT
    );
    const lowConfidence = evaluatedResults.filter(r => r.cragScore.finalScore < THRESHOLDS.AMBIGUOUS_LOW);

    let verdict: CRAGVerdict;
    let confidence: number;
    let correctionApplied: string | null = null;
    let supplementalResults: SearchResult[] | undefined;

    if (highConfidence.length >= THRESHOLDS.MIN_HIGH_CONFIDENCE) {
        // We have good results
        verdict = 'RELEVANT';
        confidence = highConfidence[0].cragScore.finalScore;
    } else if (mediumConfidence.length > 0) {
        // Results are ambiguous - try to supplement
        verdict = 'AMBIGUOUS';
        confidence = mediumConfidence[0].cragScore.finalScore;

        // Try web fallback if enabled
        if (options?.enableWebFallback !== false) {
            console.log('[CRAG] Ambiguous results, attempting web supplement');
            supplementalResults = await fetchWebSupplement(
                query,
                options?.trustedDomains || [],
                options?.maxSupplementalResults || 3
            );

            if (supplementalResults.length > 0) {
                correctionApplied = 'web_supplement';
                // Re-evaluate with supplemental
                const supplementalEvaluated = supplementalResults.map(r => evaluateSingleResult(r, query));
                evaluatedResults.push(...supplementalEvaluated);
                evaluatedResults.sort((a, b) => b.cragScore.finalScore - a.cragScore.finalScore);

                // Check if we now have high confidence
                const newHighConf = evaluatedResults.filter(r => r.cragScore.finalScore >= THRESHOLDS.RELEVANT);
                if (newHighConf.length >= THRESHOLDS.MIN_HIGH_CONFIDENCE) {
                    verdict = 'RELEVANT';
                    confidence = newHighConf[0].cragScore.finalScore;
                }
            }
        }
    } else {
        // Results are irrelevant
        verdict = 'IRRELEVANT';
        confidence = evaluatedResults[0]?.cragScore.finalScore || 0;
        correctionApplied = 'none - will suggest clarification';
    }

    // Mark usable results
    evaluatedResults.forEach(r => {
        r.isUsable = r.cragScore.finalScore >= THRESHOLDS.AMBIGUOUS_LOW;
    });

    console.log(`[CRAG] Verdict: ${verdict}, Confidence: ${(confidence * 100).toFixed(1)}%, High: ${highConfidence.length}, Medium: ${mediumConfidence.length}, Low: ${lowConfidence.length}`);

    return {
        originalResults: results,
        evaluatedResults,
        verdict,
        confidence,
        correctionApplied,
        supplementalResults,
    };
}

// ============================================
// SINGLE RESULT EVALUATION
// ============================================

function evaluateSingleResult(result: SearchResult, query: string): EvaluatedResult {
    // 1. Relevance Score (from vector/BM25 search)
    const relevanceScore = result.relevanceScore || 0.5;

    // 2. Authority Weight (from trust level)
    const authorityWeight = (result.trustLevel || 50) / 100;

    // 3. Temporal Validity (check for date indicators)
    const temporalValidity = estimateTemporalValidity(result);

    // 4. Conflict Detection (simplified - check for contradicting terms)
    const conflictFlag = false; // Would need multi-result analysis

    // 5. Calculate Final Score
    // Weighted formula: 50% relevance, 30% authority, 20% temporal
    const finalScore = (
        relevanceScore * 0.5 +
        authorityWeight * 0.3 +
        temporalValidity * 0.2
    );

    // Determine verdict for this single result
    let verdict: CRAGVerdict;
    if (finalScore >= THRESHOLDS.RELEVANT) {
        verdict = 'RELEVANT';
    } else if (finalScore >= THRESHOLDS.AMBIGUOUS_LOW) {
        verdict = 'AMBIGUOUS';
    } else {
        verdict = 'IRRELEVANT';
    }

    return {
        ...result,
        cragScore: {
            relevanceScore,
            authorityWeight,
            temporalValidity,
            conflictFlag,
            finalScore,
            verdict,
        },
        isUsable: finalScore >= THRESHOLDS.AMBIGUOUS_LOW,
    };
}

// ============================================
// HELPERS
// ============================================

/**
 * Estimate temporal validity based on content/metadata.
 * Returns 1.0 for current, decreases for older content.
 */
function estimateTemporalValidity(result: SearchResult): number {
    const content = result.content.toLowerCase();
    const currentYear = new Date().getFullYear();

    // Check for year mentions
    const yearMatch = content.match(/\b(20[0-2][0-9])\b/);
    if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        const age = currentYear - year;
        if (age === 0) return 1.0;
        if (age === 1) return 0.9;
        if (age === 2) return 0.8;
        if (age <= 5) return 0.6;
        return 0.4;
    }

    // Check for recency indicators
    if (content.includes('latest') || content.includes('current') || content.includes('updated')) {
        return 0.9;
    }

    // Default - assume reasonably current
    return 0.7;
}

/**
 * Fetch supplemental results from web when internal results are ambiguous.
 */
async function fetchWebSupplement(
    query: string,
    trustedDomains: string[],
    maxResults: number
): Promise<SearchResult[]> {
    try {
        // Use our custom scraper for web search
        const webResults = await searchWithCustomScraper(
            query,
            trustedDomains.length > 0 ? trustedDomains : [],
            maxResults
        );

        // Convert to SearchResult format
        return webResults.map((page, index) => ({
            sourceId: 'web_supplement',
            sourceName: 'Web Search',
            sourceType: 'trusted_web',
            sourceIcon: '🌐',
            trustLevel: 60, // Lower trust for web sources
            content: page.content,
            title: page.title,
            excerpt: page.content.substring(0, 200) + '...',
            url: page.url,
            relevanceScore: 0.7 - (index * 0.05), // Decay by position
            metadata: {
                fetchedAt: new Date().toISOString(),
                domain: new URL(page.url).hostname,
            },
        }));

    } catch (error) {
        console.error('[CRAG] Web supplement fetch failed:', error);
        return [];
    }
}

// ============================================
// GRACEFUL "I DON'T KNOW" GENERATOR
// ============================================

export interface IDontKnowResponse {
    message: string;
    suggestions: string[];
    reason: string;
}

/**
 * Generate a graceful "I don't know" response when CRAG verdict is IRRELEVANT or NO_RESULTS.
 */
export function generateIDontKnow(
    query: string,
    cragResult: CRAGResult,
    productName?: string
): IDontKnowResponse {
    const aiName = productName ? `${productName} AI` : 'I';

    if (cragResult.verdict === 'NO_RESULTS') {
        return {
            message: `${aiName} couldn't find any information related to your question in the knowledge base.`,
            suggestions: [
                'Try rephrasing your question with different keywords',
                'Be more specific about what you\'re looking for',
                'Check if this topic is covered in the available resources',
            ],
            reason: 'no_matching_documents',
        };
    }

    if (cragResult.verdict === 'IRRELEVANT') {
        return {
            message: `${aiName} found some information, but ${aiName === 'I' ? 'I\'m' : 'it\'s'} not confident it answers your specific question.`,
            suggestions: [
                'Could you provide more context about what you need?',
                'Try a more specific question',
                'Let me know if you\'d like me to search with different terms',
            ],
            reason: 'low_confidence_match',
        };
    }

    // Ambiguous case
    return {
        message: `${aiName} found some relevant information, but ${aiName === 'I' ? 'I\'d' : 'it would'} like to verify before answering.`,
        suggestions: [
            'Would you like me to search more sources?',
            'Can you clarify which aspect you\'re most interested in?',
        ],
        reason: 'ambiguous_match',
    };
}
