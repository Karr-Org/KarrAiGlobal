/**
 * OKSE: Speculative Drafting Engine
 * 
 * Implements Google's 2024 Speculative RAG breakthrough:
 * 1. Generate 3 parallel drafts with different perspectives
 * 2. Verify and synthesize using the main model
 * 3. Detect conflicts and return the best answer
 * 
 * Results: +12.97% accuracy, -51% latency (per Google research)
 */

import { generateContentWithGemini, generateContentWithGeminiFlash } from '@/lib/gemini';
import {
    Draft,
    DraftPerspective,
    DraftVerification,
    CitationSource,
    FusedSearchResult
} from './types';

// ============================================================================
// DRAFT PROMPTS
// ============================================================================

const DRAFT_PROMPTS: Record<DraftPerspective, string> = {
    conservative: `You are a legal/tax expert providing a CONSERVATIVE interpretation.

Focus on:
- What the law CLEARLY and UNAMBIGUOUSLY states
- Primary sources (Acts, Rules, official circulars)
- Avoid speculation or edge cases
- If uncertain, say so explicitly

Question: {query}

Context (ranked by authority):
{context}

Provide a concise, well-cited answer. Use [1], [2], etc. to reference sources.`,

    comprehensive: `You are a legal/tax expert providing a COMPREHENSIVE analysis.

Focus on:
- Cover ALL relevant aspects including edge cases
- Cite ALL applicable provisions, rules, and clarifications
- Mention recent amendments or updates
- Include exceptions and special scenarios

Question: {query}

Context (ranked by authority):
{context}

Provide a thorough, well-cited answer. Use [1], [2], etc. to reference sources.`,

    practical: `You are a legal/tax expert providing PRACTICAL guidance.

Focus on:
- What the user should ACTUALLY DO
- Step-by-step actionable advice
- Common pitfalls to avoid
- Real-world implications and compliance tips

Question: {query}

Context (ranked by authority):
{context}

Provide practical, actionable advice. Use [1], [2], etc. to reference sources.`,
};

const VERIFICATION_PROMPT = `You are an expert verifier for legal/tax responses. Given a query, source documents, and three draft answers, evaluate and synthesize the best response.

Original Query: {query}

Source Documents (with authority scores):
{sources}

Draft Answers:
---DRAFT 1 (Conservative)---
{draft1}

---DRAFT 2 (Comprehensive)---
{draft2}

---DRAFT 3 (Practical)---
{draft3}

Evaluate each draft for:
1. FACTUAL ACCURACY: Does it match the source documents? (0-1)
2. COMPLETENESS: Does it fully answer the question? (0-1)
3. CITATION ALIGNMENT: Are claims properly attributed? (0-1)
4. LOGICAL COHERENCE: Is the reasoning sound? (0-1)

Then:
- If drafts agree: Pick the best draft or synthesize them
- If drafts conflict: Explain the conflict and present both perspectives

Respond in JSON:
{
  "best_draft_index": 1 | 2 | 3,
  "factual_accuracy": 0.0-1.0,
  "completeness": 0.0-1.0,
  "citation_alignment": 0.0-1.0,
  "has_conflicts": true | false,
  "conflict_description": "If conflicts exist, explain them",
  "corrections": ["Any factual errors to fix"],
  "synthesis_needed": true | false,
  "final_answer": "The verified/synthesized answer with [1], [2] citations",
  "confidence_score": 0-100
}`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatContext(sources: (CitationSource | FusedSearchResult)[]): string {
    return sources.map((s, i) => {
        const domain = 'source_domain' in s ? s.source_domain : s.domain;
        const authority = s.authority_score;
        const title = 'source_title' in s ? s.source_title : s.title;
        const content = 'chunk_content' in s ? s.chunk_content : s.content;
        const sourceTag = domain ? `[${domain}]` : '[Your Knowledge Base]';
        return `[${i + 1}] (Authority: ${authority}/10) ${title} ${sourceTag}\n${content}`;
    }).join('\n\n');
}

function formatSourcesForVerification(sources: (CitationSource | FusedSearchResult)[]): string {
    return sources.map((s, i) => {
        const domain = 'source_domain' in s ? s.source_domain : s.domain;
        const authority = s.authority_score;
        const title = 'source_title' in s ? s.source_title : s.title;
        return `[${i + 1}] Authority: ${authority}/10 | ${title} | ${domain || 'Knowledge Base'}`;
    }).join('\n');
}

// ============================================================================
// SPECULATIVE DRAFTING SERVICE
// ============================================================================

export class SpeculativeDraftingService {

    /**
     * Generate 3 parallel drafts with different perspectives
     * Uses Gemini Flash for speed and cost efficiency
     */
    async generateDrafts(
        query: string,
        sources: (CitationSource | FusedSearchResult)[]
    ): Promise<Draft[]> {
        const startTime = Date.now();
        console.log('[SpeculativeDrafting] Generating 3 parallel drafts...');

        const context = formatContext(sources);
        const perspectives: DraftPerspective[] = ['conservative', 'comprehensive', 'practical'];

        // Generate all 3 drafts in parallel using Gemini Flash
        const draftPromises = perspectives.map(async (perspective) => {
            const perspectiveStart = Date.now();
            const prompt = DRAFT_PROMPTS[perspective]
                .replace('{query}', query)
                .replace('{context}', context);

            try {
                const content = await generateContentWithGeminiFlash(prompt, {
                    temperature: 0.3,  // Low temperature for consistency
                    maxOutputTokens: 1000,
                });

                return {
                    perspective,
                    content,
                    citations_used: this.extractCitations(content),
                    confidence: 0.8,  // Default, will be adjusted by verification
                    generation_time_ms: Date.now() - perspectiveStart,
                };
            } catch (error) {
                console.error(`[SpeculativeDrafting] Failed to generate ${perspective} draft:`, error);
                return {
                    perspective,
                    content: 'Failed to generate draft.',
                    citations_used: [],
                    confidence: 0,
                    generation_time_ms: Date.now() - perspectiveStart,
                };
            }
        });

        const drafts = await Promise.all(draftPromises);
        console.log('[SpeculativeDrafting] All drafts generated in', Date.now() - startTime, 'ms');

        return drafts;
    }

    /**
     * Verify drafts and synthesize the best answer
     * Uses the main Gemini Pro model for accurate verification
     */
    async verifyAndSynthesize(
        query: string,
        drafts: Draft[],
        sources: (CitationSource | FusedSearchResult)[]
    ): Promise<DraftVerification> {
        const startTime = Date.now();
        console.log('[SpeculativeDrafting] Verifying and synthesizing...');

        // If any draft failed, filter them out
        const validDrafts = drafts.filter(d => d.confidence > 0);

        if (validDrafts.length === 0) {
            return {
                best_draft_index: 0,
                factual_accuracy: 0,
                completeness: 0,
                citation_alignment: 0,
                has_conflicts: false,
                corrections: [],
                synthesis_needed: false,
                final_answer: 'Unable to generate a response. Please try again.',
                confidence_score: 0,
            };
        }

        if (validDrafts.length === 1) {
            // Only one valid draft, use it directly
            return {
                best_draft_index: 0,
                factual_accuracy: 0.7,
                completeness: 0.7,
                citation_alignment: 0.7,
                has_conflicts: false,
                corrections: [],
                synthesis_needed: false,
                final_answer: validDrafts[0].content,
                confidence_score: 70,
            };
        }

        const prompt = VERIFICATION_PROMPT
            .replace('{query}', query)
            .replace('{sources}', formatSourcesForVerification(sources))
            .replace('{draft1}', drafts[0]?.content || 'Not available')
            .replace('{draft2}', drafts[1]?.content || 'Not available')
            .replace('{draft3}', drafts[2]?.content || 'Not available');

        try {
            const response = await generateContentWithGemini(prompt, {
                temperature: 0.1,  // Very low for consistent verification
                maxOutputTokens: 2000,
            });

            // Parse JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                console.log('[SpeculativeDrafting] Verification complete in', Date.now() - startTime, 'ms');
                console.log('[SpeculativeDrafting] Best draft:', parsed.best_draft_index, 'Confidence:', parsed.confidence_score);

                return {
                    best_draft_index: parsed.best_draft_index || 1,
                    factual_accuracy: parsed.factual_accuracy || 0.7,
                    completeness: parsed.completeness || 0.7,
                    citation_alignment: parsed.citation_alignment || 0.7,
                    has_conflicts: parsed.has_conflicts || false,
                    conflict_description: parsed.conflict_description,
                    corrections: parsed.corrections || [],
                    synthesis_needed: parsed.synthesis_needed || false,
                    final_answer: parsed.final_answer || drafts[0].content,
                    confidence_score: parsed.confidence_score || 70,
                };
            }
        } catch (error) {
            console.error('[SpeculativeDrafting] Verification failed:', error);
        }

        // Fallback: use the comprehensive draft
        return {
            best_draft_index: 1,
            factual_accuracy: 0.7,
            completeness: 0.7,
            citation_alignment: 0.7,
            has_conflicts: false,
            corrections: [],
            synthesis_needed: false,
            final_answer: drafts[1]?.content || drafts[0].content,
            confidence_score: 70,
        };
    }

    /**
     * Detect conflicts between drafts
     * Returns true if drafts have contradictory conclusions
     */
    detectConflicts(drafts: Draft[]): boolean {
        // Simple conflict detection based on opposing keywords
        const conclusions = drafts.map(d => {
            const content = d.content.toLowerCase();
            if (content.includes('yes,') || content.includes('you can') || content.includes('is allowed')) {
                return 'positive';
            }
            if (content.includes('no,') || content.includes('cannot') || content.includes('not allowed') || content.includes('is not')) {
                return 'negative';
            }
            return 'neutral';
        });

        const hasPositive = conclusions.includes('positive');
        const hasNegative = conclusions.includes('negative');

        return hasPositive && hasNegative;
    }

    /**
     * Extract citation references from content
     */
    private extractCitations(content: string): string[] {
        const matches = content.match(/\[(\d+)\]/g) || [];
        return [...new Set(matches)];
    }

    /**
     * Run the full speculative drafting pipeline
     */
    async run(
        query: string,
        sources: (CitationSource | FusedSearchResult)[]
    ): Promise<{
        answer: string;
        confidence: number;
        drafts_count: number;
        has_conflicts: boolean;
        conflict_description?: string;
        verification_details: DraftVerification;
    }> {
        const startTime = Date.now();

        // Step 1: Generate parallel drafts
        const drafts = await this.generateDrafts(query, sources);

        // Step 2: Check for obvious conflicts
        const hasObviousConflicts = this.detectConflicts(drafts);
        if (hasObviousConflicts) {
            console.log('[SpeculativeDrafting] Obvious conflicts detected between drafts');
        }

        // Step 3: Verify and synthesize
        const verification = await this.verifyAndSynthesize(query, drafts, sources);

        console.log('[SpeculativeDrafting] Full pipeline completed in', Date.now() - startTime, 'ms');

        return {
            answer: verification.final_answer,
            confidence: verification.confidence_score / 100,
            drafts_count: drafts.filter(d => d.confidence > 0).length,
            has_conflicts: verification.has_conflicts || hasObviousConflicts,
            conflict_description: verification.conflict_description,
            verification_details: verification,
        };
    }
}

// Export singleton instance
export const speculativeDrafting = new SpeculativeDraftingService();
