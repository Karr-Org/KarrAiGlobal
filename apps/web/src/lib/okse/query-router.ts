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

function applyRules(query: string): RuleResult {
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

const CLASSIFICATION_PROMPT = `You are a query complexity classifier for a professional knowledge AI system.

Classify the following query into one of these levels:

CONVERSATIONAL: Greetings, farewells, acknowledgements, or questions about the AI itself
- "Hello"
- "Thanks!"
- "Who are you?"

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
- "How does reverse charge mechanism relate to input tax credit?"

Query: "{query}"

Respond in JSON format:
{
  "level": "SIMPLE" | "MODERATE" | "COMPLEX" | "MULTI_HOP",
  "reasoning": "Brief explanation",
  "sub_queries": ["Only for MULTI_HOP: decomposed sub-queries"]
}`;

async function classifyWithLLM(query: string): Promise<QueryClassification> {
    const prompt = CLASSIFICATION_PROMPT.replace('{query}', query);

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
     * Classify a query and return the appropriate pipeline configuration
     */
    async classify(query: string): Promise<QueryClassification> {
        console.log('[QueryRouter] Classifying query:', query.substring(0, 50) + '...');

        // Step 1: Try rule-based classification
        const ruleResult = applyRules(query);
        console.log('[QueryRouter] Rule-based result:', ruleResult);

        // Step 2: If confidence is high enough, use rule result
        if (ruleResult.confidence >= this.llmConfidenceThreshold) {
            return {
                level: ruleResult.level,
                reasoning: ruleResult.reason,
                estimated_sources_needed: getEstimatedSources(ruleResult.level),
            };
        }

        // Step 3: Use LLM for edge cases
        console.log('[QueryRouter] Low confidence, using LLM classification');
        const llmResult = await classifyWithLLM(query);

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
    classifyFast(query: string): QueryClassification {
        const ruleResult = applyRules(query);
        return {
            level: ruleResult.level,
            reasoning: ruleResult.reason,
            estimated_sources_needed: getEstimatedSources(ruleResult.level),
        };
    }
}

// Export singleton instance
export const queryRouter = new QueryComplexityRouter();
