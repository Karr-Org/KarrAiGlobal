/**
 * OKSE: Citation Tool — Gemini Function Calling for Inline Citations
 * 
 * Uses Gemini's function calling with mode: "ANY" to force the LLM to
 * return a structured response containing:
 *   - answer: The complete markdown response (no [N] markers)
 *   - inline_citations: Array of { cited_text, source_index } linking
 *     specific text spans to their backing sources
 * 
 * This replaces the old "show ALL sources" approach with granular,
 * LLM-driven inline citations.
 */

import {
    CitationSource,
    InlineCitation,
    CitationToolResponse,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY!;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

// ============================================================================
// TOOL DECLARATION
// ============================================================================

/**
 * Gemini function declaration for respond_with_citations.
 * 
 * The model is forced to call this function (mode: "ANY"), packing both
 * the answer and granular inline citations into the function arguments.
 */
const CITATION_TOOL_DECLARATION = {
    functionDeclarations: [
        {
            name: 'respond_with_citations',
            description: `Answer the user's query using the provided source context. For every factual claim, statistic, legal provision, or specific detail derived from the sources, include an inline citation that maps the exact text you wrote to the source you used. Do NOT include [1], [2] style markers in the answer text — use the inline_citations array instead.`,
            parameters: {
                type: 'OBJECT',
                properties: {
                    answer: {
                        type: 'STRING',
                        description: 'Your complete response in markdown format. Write naturally without any citation markers like [1] or [Source 1] in the text itself.',
                    },
                    inline_citations: {
                        type: 'ARRAY',
                        items: {
                            type: 'OBJECT',
                            properties: {
                                cited_text: {
                                    type: 'STRING',
                                    description: 'The exact substring from your answer that is supported by this source. Must be a verbatim match of text in the answer field.',
                                },
                                source_index: {
                                    type: 'INTEGER',
                                    description: '1-based index of the source from the provided context that supports this text.',
                                },
                            },
                            required: ['cited_text', 'source_index'],
                        },
                        description: 'Array of inline citations. Each links a specific text span in your answer to the source that supports it. Include a citation for every claim derived from the sources.',
                    },
                },
                required: ['answer', 'inline_citations'],
            },
        },
    ],
};

// ============================================================================
// CORE FUNCTION
// ============================================================================

/**
 * Generate a response with inline citations using Gemini function calling.
 * 
 * @param messages - Multi-turn conversation messages (Gemini format)
 * @param sources - The retrieved sources (KB + web) to cite from
 * @param options - Generation options
 * @returns CitationToolResponse with answer, inline citations, and filtered sources
 */
export async function generateWithCitationTool(
    messages: { role: string; parts: { text: string }[] }[],
    sources: CitationSource[],
    options?: {
        temperature?: number;
        maxOutputTokens?: number;
    }
): Promise<CitationToolResponse> {
    if (!GOOGLE_AI_API_KEY) {
        throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    const startTime = Date.now();
    console.log('[CitationTool] Calling Gemini with citation tool, sources:', sources.length);

    try {
        const response = await fetch(`${GEMINI_ENDPOINT}?key=${GOOGLE_AI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: messages,
                tools: [CITATION_TOOL_DECLARATION],
                toolConfig: {
                    functionCallingConfig: {
                        mode: 'ANY',
                        allowedFunctionNames: ['respond_with_citations'],
                    },
                },
                generationConfig: {
                    temperature: options?.temperature ?? 0.3,
                    maxOutputTokens: options?.maxOutputTokens ?? 4096,
                    topP: 0.95,
                    topK: 40,
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[CitationTool] Gemini API error:', response.status, errorData);
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];

        if (!candidate?.content?.parts) {
            console.error('[CitationTool] No parts in response');
            throw new Error('Empty response from Gemini');
        }

        // Look for the function call in the response parts
        const functionCallPart = candidate.content.parts.find(
            (part: { functionCall?: { name: string } }) => part.functionCall?.name === 'respond_with_citations'
        );

        if (functionCallPart?.functionCall?.args) {
            const args = functionCallPart.functionCall.args;
            const answer: string = args.answer || '';
            const rawCitations: { cited_text: string; source_index: number }[] = args.inline_citations || [];

            // Resolve citations: attach source objects and filter to valid indices
            const inlineCitations = resolveCitations(rawCitations, sources);
            const citedSources = filterSourcesByCitations(sources, inlineCitations);

            console.log(
                '[CitationTool] Success in', Date.now() - startTime, 'ms |',
                'Citations:', inlineCitations.length, '| Cited sources:', citedSources.length, '/', sources.length
            );

            return { answer, inlineCitations, citedSources };
        }

        // Fallback: model returned text instead of a function call
        console.warn('[CitationTool] No function call in response, falling back to text extraction');
        const textPart = candidate.content.parts.find(
            (part: { text?: string }) => part.text
        );
        const fallbackText = textPart?.text || '';

        return extractCitationsFallback(fallbackText, sources);

    } catch (error) {
        console.error('[CitationTool] Error:', error);
        throw error;
    }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Resolve raw citation data from the tool call into full InlineCitation objects.
 * Validates source indices and attaches the source objects.
 */
function resolveCitations(
    rawCitations: { cited_text: string; source_index: number }[],
    sources: CitationSource[]
): InlineCitation[] {
    return rawCitations
        .filter(c => {
            // Validate: source_index is 1-based, must be within range
            if (c.source_index < 1 || c.source_index > sources.length) {
                console.warn('[CitationTool] Invalid source_index:', c.source_index);
                return false;
            }
            if (!c.cited_text || c.cited_text.trim().length === 0) {
                console.warn('[CitationTool] Empty cited_text, skipping');
                return false;
            }
            return true;
        })
        .map(c => ({
            cited_text: c.cited_text,
            source_index: c.source_index,
            source: sources[c.source_index - 1], // Convert 1-based to 0-based
        }));
}

/**
 * Filter the full source list down to only sources that were actually cited.
 */
function filterSourcesByCitations(
    allSources: CitationSource[],
    citations: InlineCitation[]
): CitationSource[] {
    const citedIndices = new Set(citations.map(c => c.source_index));
    return allSources.filter((_, i) => citedIndices.has(i + 1)); // 1-based
}

/**
 * Fallback: extract [N] style citations from plain text when function calling fails.
 * Mirrors the approach in speculative-drafting.ts.
 */
function extractCitationsFallback(
    text: string,
    sources: CitationSource[]
): CitationToolResponse {
    console.log('[CitationTool] Using regex fallback for citation extraction');

    const matches = text.match(/\[(\d+)\]/g) || [];
    const citedIndices = new Set(
        [...matches]
            .map(m => parseInt(m.replace(/[\[\]]/g, ''), 10))
            .filter(n => n >= 1 && n <= sources.length)
    );

    const citedSources = sources.filter((_, i) => citedIndices.has(i + 1));

    // Build inline citations from the regex matches (less granular than tool calling)
    const inlineCitations: InlineCitation[] = [];
    for (const idx of citedIndices) {
        inlineCitations.push({
            cited_text: `[${idx}]`, // Fallback: the marker itself
            source_index: idx,
            source: sources[idx - 1],
        });
    }

    return {
        answer: text,
        inlineCitations,
        citedSources,
    };
}

// ============================================================================
// UTILITY: Format sources for the system prompt context
// ============================================================================

/**
 * Format sources into numbered context blocks for the system prompt.
 * Used to build the context that the LLM sees alongside the citation tool.
 */
export function formatSourcesForPrompt(sources: CitationSource[]): string {
    if (sources.length === 0) return '';

    return sources.map((s, i) => {
        const sourceTag = s.domain ? `[${s.domain}]` : '[Your Knowledge Base]';
        const authorityInfo = `Authority: ${s.authority_score}/10`;
        return `[Source ${i + 1}] ${s.title} ${sourceTag} (${authorityInfo})\n${s.chunk_content}`;
    }).join('\n\n---\n\n');
}
