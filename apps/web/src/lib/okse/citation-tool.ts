/**
 * OKSE: Citation Tool — Gemini Function Calling for Inline Citations + Web Search
 * 
 * Uses Gemini's function calling to:
 *   1. (Optional) Let the LLM request web searches via `web_search` tool
 *   2. Force a final `respond_with_citations` call with the complete answer
 * 
 * In Web Search / Full Power mode, the LLM can call `web_search` with
 * optimised queries. We execute them via Serper (open internet), feed
 * results back, and the LLM incorporates them into its final answer.
 * 
 * In Strict / Extended mode, the `web_search` tool is NOT included —
 * the LLM only sees `respond_with_citations`.
 */

import {
    CitationSource,
    InlineCitation,
    CitationToolResponse,
} from './types';

import { searchSerperOpen, extractPageContent } from './live-web-search';
import type { WebSearchResult } from './live-web-search';

// ============================================================================
// CONSTANTS
// ============================================================================

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY!;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

// Maximum number of web search tool calls allowed per request (prevents loops)
const MAX_WEB_SEARCH_CALLS = 3;

// ============================================================================
// TOOL DECLARATIONS
// ============================================================================

/**
 * respond_with_citations — the final answer tool.
 * The model writes its answer + inline citations as structured data.
 */
const CITATION_TOOL_DECLARATION = {
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
};

/**
 * web_search — lets the LLM request live internet searches.
 * Only included when enableWebSearch is true (Web Search / Full Power modes).
 */
const WEB_SEARCH_TOOL_DECLARATION = {
    name: 'web_search',
    description: `Search the internet for current, real-time information. Use this when:
- The user asks about recent events, news, or current affairs
- The provided knowledge base sources don't contain the answer
- You need to verify or supplement KB information with up-to-date data
- The question is about something that requires live/fresh information

You can call this tool multiple times with different queries to answer complex questions that span multiple topics. Write focused, specific search queries — not the user's raw question. For example, if the user asks "What's the latest in AI and what's happening in France?", call web_search twice: once for "latest AI news developments 2025" and once for "France current events news 2025".`,
    parameters: {
        type: 'OBJECT',
        properties: {
            queries: {
                type: 'ARRAY',
                items: {
                    type: 'STRING',
                },
                description: 'Array of 1-3 focused search queries to execute. Each query should be a specific, well-formed search engine query. Use multiple queries to cover different aspects of the user\'s question.',
            },
        },
        required: ['queries'],
    },
};

// ============================================================================
// CORE FUNCTION
// ============================================================================

/**
 * Generate a response with inline citations using Gemini function calling.
 * 
 * When enableWebSearch is true, the LLM can also call `web_search` to
 * search the open internet. This creates a multi-turn loop:
 *   1. Gemini sees query + KB sources + tools → may call `web_search`
 *   2. We execute Serper queries, feed results back as tool responses
 *   3. Gemini sees everything → calls `respond_with_citations` with final answer
 * 
 * @param messages - Multi-turn conversation messages (Gemini format)
 * @param sources - The retrieved sources (KB) to cite from
 * @param options - Generation options + enableWebSearch flag
 * @returns CitationToolResponse with answer, inline citations, and filtered sources
 */
export async function generateWithCitationTool(
    messages: { role: string; parts: { text: string }[] | any[] }[],
    sources: CitationSource[],
    options?: {
        temperature?: number;
        maxOutputTokens?: number;
        enableWebSearch?: boolean;
    }
): Promise<CitationToolResponse> {
    if (!GOOGLE_AI_API_KEY) {
        throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    const startTime = Date.now();
    const enableWebSearch = options?.enableWebSearch ?? false;

    // Build tool declarations based on mode
    const functionDeclarations = enableWebSearch
        ? [WEB_SEARCH_TOOL_DECLARATION, CITATION_TOOL_DECLARATION]
        : [CITATION_TOOL_DECLARATION];

    console.log(
        '[CitationTool] Starting generation | Sources:', sources.length,
        '| Web search:', enableWebSearch ? 'ENABLED' : 'disabled'
    );

    // Mutable sources array — web results get appended here as new CitationSources
    const allSources = [...sources];

    // Multi-turn conversation state — starts with the user's messages
    let conversationContents = [...messages];

    let webSearchCallCount = 0;

    try {
        // ── Multi-turn loop ──
        // Gemini may call web_search one or more times before calling respond_with_citations.
        // We loop until we get the final citation response or hit the max search calls.
        while (true) {
            const response = await fetch(`${GEMINI_ENDPOINT}?key=${GOOGLE_AI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: conversationContents,
                    tools: [{ functionDeclarations }],
                    toolConfig: {
                        functionCallingConfig: {
                            mode: 'AUTO',
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

            // Check for respond_with_citations (final answer)
            const citationCallPart = candidate.content.parts.find(
                (part: any) => part.functionCall?.name === 'respond_with_citations'
            );

            if (citationCallPart?.functionCall?.args) {
                // ── FINAL ANSWER ──
                const args = citationCallPart.functionCall.args;
                const answer: string = args.answer || '';
                const rawCitations: { cited_text: string; source_index: number }[] = args.inline_citations || [];

                const inlineCitations = resolveCitations(rawCitations, allSources);
                const citedSources = filterSourcesByCitations(allSources, inlineCitations);

                console.log(
                    '[CitationTool] ✅ Complete in', Date.now() - startTime, 'ms |',
                    'Citations:', inlineCitations.length, '| Sources cited:', citedSources.length, '/', allSources.length,
                    '| Web searches:', webSearchCallCount
                );

                return { answer, inlineCitations, citedSources };
            }

            // Check for web_search tool call
            const webSearchCallPart = candidate.content.parts.find(
                (part: any) => part.functionCall?.name === 'web_search'
            );

            if (webSearchCallPart?.functionCall?.args && webSearchCallCount < MAX_WEB_SEARCH_CALLS) {
                // ── EXECUTE WEB SEARCH ──
                webSearchCallCount++;
                const queries: string[] = webSearchCallPart.functionCall.args.queries || [];

                console.log(`[CitationTool] 🔍 Web search requested (call ${webSearchCallCount}/${MAX_WEB_SEARCH_CALLS}):`, queries);

                // Execute all search queries in parallel
                const searchPromises = queries.slice(0, 3).map(q => searchSerperOpen(q, 5));
                const searchResultArrays = await Promise.all(searchPromises);
                const allWebResults = searchResultArrays.flat();

                // Fetch content for top 3 results
                const topResults = allWebResults.slice(0, 5);
                const contentPromises = topResults.slice(0, 3).map(async (result) => {
                    const content = await extractPageContent(result.url);
                    return { ...result, content };
                });
                const resultsWithContent = await Promise.all(contentPromises);
                const finalResults = [...resultsWithContent, ...topResults.slice(3)];

                // Convert web results into CitationSources and track their indices
                const webSourceStartIndex = allSources.length;
                for (const result of finalResults) {
                    allSources.push({
                        id: `web-${allSources.length}`,
                        type: 'web' as const,
                        domain: result.domain,
                        display_name: result.title,
                        title: `${result.title} [${result.domain}]`,
                        url: result.url,
                        authority_score: result.authority_score,
                        trust_stars: Math.round(result.authority_score / 2),
                        contextual_summary: result.snippet,
                        chunk_content: result.content || result.snippet,
                        relevance_score: 0.75,
                    });
                }

                // Format search results as a tool response for Gemini
                const searchResultsSummary = formatWebResultsForLLM(finalResults, webSourceStartIndex);

                console.log(`[CitationTool] Fed ${finalResults.length} web results back (sources ${webSourceStartIndex + 1}-${allSources.length})`);

                // Append the model's function call + our tool response to the conversation
                conversationContents.push({
                    role: 'model',
                    parts: [{ functionCall: webSearchCallPart.functionCall }],
                });
                conversationContents.push({
                    role: 'user',
                    parts: [{
                        functionResponse: {
                            name: 'web_search',
                            response: {
                                results: searchResultsSummary,
                                total_results: finalResults.length,
                                source_indices: `Sources ${webSourceStartIndex + 1} to ${allSources.length}`,
                                note: 'These web search results have been added to your source context. Cite them using their source indices when answering.',
                            },
                        },
                    }],
                });

                // Loop again — Gemini will now have the web results and should either
                // search more or call respond_with_citations
                continue;
            }

            // Fallback: model returned text instead of a function call
            console.warn('[CitationTool] No function call in response, falling back to text extraction');
            const textPart = candidate.content.parts.find(
                (part: { text?: string }) => part.text
            );
            const fallbackText = textPart?.text || '';

            return extractCitationsFallback(fallbackText, allSources);
        }
    } catch (error) {
        console.error('[CitationTool] Error:', error);
        throw error;
    }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format web results for the LLM tool response — concise, indexable format.
 */
function formatWebResultsForLLM(results: WebSearchResult[], startIndex: number): string {
    if (results.length === 0) return 'No results found for this search.';

    return results.map((r, i) => {
        const sourceNum = startIndex + i + 1;
        const content = r.content
            ? r.content.substring(0, 2000)
            : r.snippet;

        return `[Source ${sourceNum}] ${r.title} [${r.domain}]\nURL: ${r.url}\n${content}`;
    }).join('\n\n---\n\n');
}

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
export function extractCitationsFallback(
    text: string,
    sources: CitationSource[]
): CitationToolResponse {
    console.log('[CitationTool] Using regex fallback for citation extraction');

    // Match both [N] and [Source N] patterns (case-insensitive)
    const bareMatches = text.match(/\[(\d+)\]/g) || [];
    const sourceMatches = text.match(/\[Source\s+(\d+)\]/gi) || [];

    console.log('[CitationTool] Bare [N] matches:', bareMatches.length, '| [Source N] matches:', sourceMatches.length);

    const citedIndices = new Set<number>();

    // Parse bare [N] matches
    for (const m of bareMatches) {
        const n = parseInt(m.replace(/[\[\]]/g, ''), 10);
        if (n >= 1 && n <= sources.length) citedIndices.add(n);
    }

    // Parse [Source N] matches
    for (const m of sourceMatches) {
        const n = parseInt(m.replace(/\[Source\s+/i, '').replace(']', ''), 10);
        if (n >= 1 && n <= sources.length) citedIndices.add(n);
    }

    console.log('[CitationTool] Cited indices found:', [...citedIndices]);

    const citedSources = sources.filter((_, i) => citedIndices.has(i + 1));

    // Build inline citations from the regex matches (less granular than tool calling)
    const inlineCitations: InlineCitation[] = [];
    for (const idx of citedIndices) {
        inlineCitations.push({
            cited_text: `Referenced from source ${idx}`,
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
