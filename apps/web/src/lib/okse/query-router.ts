/**
 * OKSE: Query Complexity Router
 * 
 * Routes queries to appropriate processing pipelines based on complexity:
 * - CONVERSATIONAL: Greetings, thanks, meta-questions (no KB search needed)
 * - SIMPLE: Definition lookups, single fact queries
 * - MODERATE: Context-dependent questions, 1-2 conditions
 * - COMPLEX: Multi-condition, edge cases, what-if scenarios
 * - MULTI_HOP: Cross-document reasoning, comparisons
 */

import { generateContentWithGemini } from '@/lib/gemini';
import {
    QueryComplexityLevel,
    QueryClassification,
    PipelineConfig,
    PIPELINE_CONFIGS
} from './types';

// ============================================================================
// RULE-BASED CLASSIFICATION (Fast, no LLM call)
// ============================================================================

interface RuleResult {
    level: QueryComplexityLevel;
    confidence: number;
    reason: string;
}

/**
 * Extract meaningful keywords from KB document titles for matching.
 * Strips common filler words and returns unique lowercase keywords (3+ chars).
 */
function extractTitleKeywords(titles: string[]): Set<string> {
    const stopWords = new Set([
        'the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'were',
        'been', 'has', 'have', 'had', 'its', 'not', 'but', 'all', 'any', 'can',
        'will', 'may', 'shall', 'act', 'bill', 'new', 'old', 'pdf', 'doc', 'txt',
        'csv', 'xlsx', 'docx', 'file', 'document', 'chapter', 'section', 'part',
        'vol', 'volume', 'page', 'pages', 'draft', 'final', 'version', 'copy',
    ]);
    const keywords = new Set<string>();
    for (const title of titles) {
        // Split on non-alphanumeric (handles underscores, hyphens, spaces)
        const words = title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
        for (const w of words) {
            if (w.length >= 3 && !stopWords.has(w) && !/^\d+$/.test(w)) {
                keywords.add(w);
            }
        }
    }
    return keywords;
}

function applyRules(query: string, kbTitles?: string[]): RuleResult {
    const normalizedQuery = query.toLowerCase().trim();
    const wordCount = normalizedQuery.split(/\s+/).length;

    // Rule 0: Conversational queries (greetings, thanks, meta) — NO KB search needed
    const conversationalPatterns = [
        // Greetings (expanded)
        /^(hi|hello|hey|howdy|greetings|yo|sup|hola|namaste|hii+|helo+|heya?)\b/i,
        /^good\s+(morning|afternoon|evening|night|day)\b/i,
        /^(what'?s\s+up|how\s+are\s+you|how'?s\s+it\s+going|how\s+do\s+you\s+do)\b/i,
        /^(hey\s+there|hi\s+there|hello\s+there)\s*[.!]?\s*$/i,
        // Farewells
        /^(bye|goodbye|see\s+you|take\s+care|have\s+a\s+(good|nice|great)|good\s*bye|later|cya|ttyl)\b/i,
        // Acknowledgements & short responses
        /^(thanks?|thank\s+you|thx|cheers|appreciated|ty|tysm|much\s+appreciated)\b/i,
        /^(ok|okay|got\s+it|understood|sure|cool|great|nice|awesome|perfect|alright|noted|yep|yup|yeah|yes|no|nope|nah|right|correct|absolutely|exactly|indeed|agreed)\s*[.!?]?\s*$/i,
        // Meta / about the AI
        /^(who\s+are\s+you|what\s+can\s+you\s+do|what\s+are\s+you|how\s+do\s+you\s+work|what\s+is\s+your\s+name)\s*\??\s*$/i,
        /^help\s*$/i,
        // Pleasantries & small talk
        /^(how\s+was\s+your\s+day|nice\s+to\s+meet\s+you|pleased\s+to\s+meet\s+you)\b/i,
        /^(that'?s?\s+(great|awesome|cool|nice|good|helpful|perfect|amazing))\s*[.!]?\s*$/i,
        /^(i\s+see|makes\s+sense|i\s+understand|no\s+worries|no\s+problem|all\s+good|sounds\s+good)\s*[.!]?\s*$/i,
    ];

    // Emoji-only or very short non-question messages (1-2 chars)
    if (normalizedQuery.length <= 2 || /^[\p{Emoji}\s]+$/u.test(query.trim())) {
        return { level: 'CONVERSATIONAL', confidence: 1.0, reason: 'Very short or emoji-only message' };
    }

    if (conversationalPatterns.some(p => p.test(query))) {
        return { level: 'CONVERSATIONAL', confidence: 1.0, reason: 'Greeting, farewell, or meta-question — no KB search needed' };
    }

    // Short single-word non-question messages that aren't domain terms
    if (wordCount === 1 && !normalizedQuery.includes('?')) {
        const domainTerms = /^(gst|tax|itc|tds|income|itr|filing|invoice|challan|refund|cess|hsn|sac|gstr|audit)\b/i;
        if (!domainTerms.test(normalizedQuery)) {
            return { level: 'CONVERSATIONAL', confidence: 0.85, reason: 'Single non-domain word without question mark' };
        }
    }

    // Rule 0.4: KB title keyword guard — if query matches KB topics, skip GENERAL_KNOWLEDGE
    // This runs BEFORE general knowledge patterns to prevent false positives
    if (kbTitles && kbTitles.length > 0) {
        const titleKeywords = extractTitleKeywords(kbTitles);
        const queryWords = normalizedQuery.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
        const matchedKeywords = queryWords.filter(w => titleKeywords.has(w));

        if (matchedKeywords.length > 0) {
            console.log('[QueryRouter] KB keyword match detected:', matchedKeywords.join(', '), '— skipping GENERAL_KNOWLEDGE');
            // Don't return GENERAL_KNOWLEDGE — let it fall through to SIMPLE/MODERATE classification
            // We'll continue to the complexity rules below
        }
    }

    // Rule 0.5: General knowledge — tight whitelist of clearly off-topic patterns
    // These ONLY match queries that are obviously unrelated to ANY product domain
    const generalKnowledgePatterns = [
        /^(what\s+is\s+)?\d+[\s]*[+\-*/×÷%^]\s*\d+/i,                                    // Math: "2+2", "what is 5*3"
        /^calculate\s+\d/i,                                                                 // "calculate 500..."
        /^(how\s+much\s+is\s+)?\d+(\. \d+)?\s*%\s+(of|from)\s+\d/i,                        // "18% of 5000"
        /^what\s+(time|day|date)\s+is\s+it/i,                                               // "what time is it"
        /^translate\s+.+\s+to\s+\w+/i,                                                      // "translate hello to Hindi"
        /^why\s+(is|are)\s+the\s+(sky|sun|moon|ocean|grass|earth)\b/i,                       // "why is the sky blue"
        /^(what\s+is\s+the\s+capital\s+of|where\s+is\s+\w+\s+(located|situated))\b/i,       // "capital of France"
        /^who\s+(won|scored|played)\s+(the|in)\s+(world\s+cup|olympics|super\s+bowl|oscars)/i, // "who won the world cup"
    ];

    // Only classify as GENERAL_KNOWLEDGE if NO KB keyword matches were found
    if (generalKnowledgePatterns.some(p => p.test(query))) {
        // Double-check: if KB titles contain related keywords, don't short-circuit
        if (kbTitles && kbTitles.length > 0) {
            const titleKeywords = extractTitleKeywords(kbTitles);
            const queryWords = normalizedQuery.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
            const hasKBOverlap = queryWords.some(w => titleKeywords.has(w));
            if (hasKBOverlap) {
                console.log('[QueryRouter] General knowledge pattern matched BUT KB keyword overlap found — routing to SIMPLE instead');
                return { level: 'SIMPLE', confidence: 0.85, reason: 'Query matches general knowledge pattern but overlaps with KB topics' };
            }
        }
        return { level: 'GENERAL_KNOWLEDGE', confidence: 0.95, reason: 'Clearly off-topic general knowledge query (math, trivia, utility)' };
    }

    // Rule 1: Multi-hop indicators
    const multiHopPatterns = [
        /\bcompare\b/i,
        /\bvs\.?\b/i,
        /\bversus\b/i,
        /\bdifference\s+between\b/i,
        /\bwhich\s+is\s+better\b/i,
        /\bpros\s+and\s+cons\b/i,
        /\bon\s+one\s+hand\b/i,
        /\bhow\s+does\s+.+\s+relate\s+to\b/i,
    ];

    if (multiHopPatterns.some(p => p.test(query))) {
        return { level: 'MULTI_HOP', confidence: 0.9, reason: 'Contains comparison/relation keywords' };
    }

    // Rule 2: Complex indicators (multiple conditions)
    const complexPatterns = [
        /\bif\b.*\band\b.*\bthen\b/i,
        /\bwhat\s+if\b/i,
        /\bin\s+case\s+of\b/i,
        /\bexcept\s+when\b/i,
        /\bhowever\b/i,
        /\bunless\b/i,
        /\bprovided\s+that\b/i,
        /\bsubject\s+to\b/i,
    ];

    const conditionWords = (query.match(/\b(if|when|but|however|unless|except|provided|subject)\b/gi) || []).length;

    if (complexPatterns.some(p => p.test(query)) || conditionWords >= 2) {
        return { level: 'COMPLEX', confidence: 0.85, reason: 'Multiple conditions or exception handling' };
    }

    // Rule 3: Long queries with specific details
    if (wordCount > 25) {
        return { level: 'COMPLEX', confidence: 0.7, reason: 'Long detailed query' };
    }

    // Rule 4: Simple definition/fact queries
    const simplePatterns = [
        /^what\s+is\b/i,
        /^what\s+are\b/i,
        /^define\b/i,
        /^explain\b/i,
        /^meaning\s+of\b/i,
        /^tell\s+me\s+about\b/i,
        /\brate\s+of\b/i,
        /\bdue\s+date\b/i,
        /\bdeadline\b/i,
    ];

    if (simplePatterns.some(p => p.test(query)) && wordCount <= 10) {
        return { level: 'SIMPLE', confidence: 0.8, reason: 'Definition or fact lookup pattern' };
    }

    // Rule 5: Moderate (contextual, single condition)
    const moderatePatterns = [
        /\bcan\s+i\b/i,
        /\bam\s+i\s+eligible\b/i,
        /\bdo\s+i\s+need\b/i,
        /\bshould\s+i\b/i,
        /\bhow\s+to\b/i,
        /\bwhen\s+to\b/i,
        /\bis\s+it\s+mandatory\b/i,
    ];

    if (moderatePatterns.some(p => p.test(query))) {
        return { level: 'MODERATE', confidence: 0.75, reason: 'Eligibility or procedural question' };
    }

    // Default: MODERATE with low confidence (may need LLM classification)
    return { level: 'MODERATE', confidence: 0.5, reason: 'Default classification' };
}

// ============================================================================
// LLM-BASED CLASSIFICATION (For edge cases)
// ============================================================================

function buildClassificationPrompt(query: string, kbContext?: string): string {
    const kbAwarenessBlock = kbContext
        ? `\n\n## CRITICAL — KNOWLEDGE BASE AWARENESS:\nThis AI's knowledge base contains documents about: ${kbContext}.\nIf the query relates to ANY topic covered by these documents — even if it sounds like a general question — you MUST classify it as SIMPLE, MODERATE, COMPLEX, or MULTI_HOP. Do NOT classify it as GENERAL_KNOWLEDGE.\nOnly use GENERAL_KNOWLEDGE for queries that are completely unrelated to the above topics (e.g., pure math, geography trivia, sports scores).`
        : '';

    return `You are a query complexity classifier for a professional knowledge AI system.

Classify the following query into one of these levels:

CONVERSATIONAL: Greetings, farewells, acknowledgements, or questions about the AI itself
- "Hello"
- "Thanks!"
- "Who are you?"

GENERAL_KNOWLEDGE: Pure math, science trivia, geography, sports, translation — clearly unrelated to any product domain
- "What is 2+2?"
- "Why is the sky blue?"
- "Translate hello to Hindi"
- "What is the capital of France?"

SIMPLE: Definition lookups, single fact queries, rate/deadline inquiries
- "What is GST?"
- "GST rate on coffee"
- "GSTR-3B due date"

MODERATE: Context-dependent questions, single condition, eligibility checks
- "Can I claim ITC on office rent?"
- "Is GST applicable on educational services?"
- "How to file GSTR-9?"

COMPLEX: Multiple conditions, edge cases, what-if scenarios, exception handling
- "Can I claim ITC on rent if landlord is unregistered and amount exceeds 20 lakh?"
- "What are the conditions for composition scheme eligibility?"
- "GST implications when supply crosses state borders with warehousing"

MULTI_HOP: Cross-document reasoning, comparisons between laws/concepts
- "Compare ITC rules under GST vs depreciation under Income Tax"
- "Difference between CGST and IGST on interstate supply"
- "How does reverse charge mechanism relate to input tax credit?"${kbAwarenessBlock}

Query: "${query}"

Respond in JSON format:
{
  "level": "GENERAL_KNOWLEDGE" | "SIMPLE" | "MODERATE" | "COMPLEX" | "MULTI_HOP",
  "reasoning": "Brief explanation",
  "sub_queries": ["Only for MULTI_HOP: decomposed sub-queries"]
}`;
}

async function classifyWithLLM(query: string, kbContext?: string): Promise<QueryClassification> {
    const prompt = buildClassificationPrompt(query, kbContext);

    try {
        const response = await generateContentWithGemini(prompt, {
            temperature: 0.1,
            maxOutputTokens: 200,
        });

        // Parse JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                level: parsed.level as QueryComplexityLevel,
                reasoning: parsed.reasoning || 'LLM classification',
                sub_queries: parsed.sub_queries,
                estimated_sources_needed: getEstimatedSources(parsed.level),
            };
        }
    } catch (error) {
        console.error('[QueryRouter] LLM classification failed:', error);
    }

    // Fallback to MODERATE
    return {
        level: 'MODERATE',
        reasoning: 'LLM classification failed, defaulting to moderate',
        estimated_sources_needed: 5,
    };
}

function getEstimatedSources(level: QueryComplexityLevel): number {
    switch (level) {
        case 'CONVERSATIONAL': return 0;
        case 'GENERAL_KNOWLEDGE': return 0;
        case 'SIMPLE': return 2;
        case 'MODERATE': return 5;
        case 'COMPLEX': return 8;
        case 'MULTI_HOP': return 12;
        default: return 5;
    }
}

// ============================================================================
// MAIN ROUTER CLASS
// ============================================================================

export class QueryComplexityRouter {
    private llmConfidenceThreshold = 0.6;

    /**
     * Classify a query and return the appropriate pipeline configuration.
     * @param query The user's query
     * @param kbContext Optional KB awareness: { titles: string[], topicSummary?: string }
     */
    async classify(query: string, kbContext?: { titles: string[]; topicSummary?: string }): Promise<QueryClassification> {
        console.log('[QueryRouter] Classifying query:', query.substring(0, 50) + '...');
        if (kbContext?.titles.length) {
            console.log('[QueryRouter] KB context:', kbContext.titles.length, 'documents,', kbContext.topicSummary ? 'has topic summary' : 'no topic summary');
        }

        // Build a combined context string for the LLM prompt
        const kbContextStr = kbContext
            ? [kbContext.topicSummary, kbContext.titles.join(', ')].filter(Boolean).join('. Documents: ')
            : undefined;

        // Step 1: Try rule-based classification (with KB title keywords)
        const ruleResult = applyRules(query, kbContext?.titles);
        console.log('[QueryRouter] Rule-based result:', ruleResult);

        // Step 2: If confidence is high enough, use rule result
        if (ruleResult.confidence >= this.llmConfidenceThreshold) {
            return {
                level: ruleResult.level,
                reasoning: ruleResult.reason,
                estimated_sources_needed: getEstimatedSources(ruleResult.level),
            };
        }

        // Step 3: Use LLM for edge cases (with KB context injected into prompt)
        console.log('[QueryRouter] Low confidence, using LLM classification');
        const llmResult = await classifyWithLLM(query, kbContextStr);

        return llmResult;
    }

    /**
     * Get the pipeline configuration for a complexity level
     */
    getPipelineConfig(level: QueryComplexityLevel): PipelineConfig {
        return PIPELINE_CONFIGS[level];
    }

    /**
     * Quick classification without LLM (for performance-critical paths)
     */
    classifyFast(query: string, kbTitles?: string[]): QueryClassification {
        const ruleResult = applyRules(query, kbTitles);
        return {
            level: ruleResult.level,
            reasoning: ruleResult.reason,
            estimated_sources_needed: getEstimatedSources(ruleResult.level),
        };
    }
}

// Export singleton instance
export const queryRouter = new QueryComplexityRouter();
