/**
 * OMNIFORGE: CONTEXTUAL SUMMARIZER
 * 
 * Generates LLM context summaries for document chunks (Anthropic style).
 * This reduces retrieval failures by 49-67% according to Anthropic research.
 * 
 * Example:
 * - Raw chunk: "The rate is 5%"
 * - With context: "In the 2024 GST Notification on Gold Jewelry, the applicable rate is 5%"
 */

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY!;

interface ContextualSummaryOptions {
    documentTitle: string;
    documentType?: string;
    chunkContent: string;
    chunkIndex: number;
    totalChunks: number;
    previousChunkSummary?: string;  // For continuity
    metadata?: Record<string, any>;
}

interface ContextualSummaryResult {
    contextualSummary: string;
    structuredMetadata: Record<string, any>;
}

/**
 * Generate a contextual summary for a chunk using LLM.
 * This prepends context to make the chunk self-contained.
 */
export async function generateContextualSummary(
    options: ContextualSummaryOptions
): Promise<ContextualSummaryResult> {
    const {
        documentTitle,
        documentType,
        chunkContent,
        chunkIndex,
        totalChunks,
        previousChunkSummary,
        metadata
    } = options;

    // Skip very short chunks
    if (chunkContent.trim().length < 50) {
        return {
            contextualSummary: '',
            structuredMetadata: metadata || {}
        };
    }

    try {
        const prompt = buildContextPrompt(options);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,  // Low for consistency
                        maxOutputTokens: 300,
                        responseMimeType: 'application/json'
                    }
                })
            }
        );

        if (!response.ok) {
            console.error('[ContextualSummarizer] API error:', response.status);
            return { contextualSummary: '', structuredMetadata: metadata || {} };
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Parse JSON response
        try {
            const parsed = JSON.parse(rawText);
            return {
                contextualSummary: parsed.context_summary || '',
                structuredMetadata: {
                    ...metadata,
                    ...(parsed.extracted_metadata || {})
                }
            };
        } catch {
            // If not valid JSON, use the raw text as summary
            return {
                contextualSummary: rawText.slice(0, 500),
                structuredMetadata: metadata || {}
            };
        }

    } catch (error) {
        console.error('[ContextualSummarizer] Error:', error);
        return { contextualSummary: '', structuredMetadata: metadata || {} };
    }
}

/**
 * Build the prompt for contextual summarization.
 */
function buildContextPrompt(options: ContextualSummaryOptions): string {
    const { documentTitle, documentType, chunkContent, chunkIndex, totalChunks, previousChunkSummary } = options;

    return `You are a context enrichment AI. Your job is to make document chunks self-contained by adding context.

DOCUMENT INFO:
- Title: "${documentTitle}"
- Type: ${documentType || 'Unknown'}
- This is chunk ${chunkIndex + 1} of ${totalChunks}
${previousChunkSummary ? `- Previous chunk context: "${previousChunkSummary}"` : ''}

CHUNK CONTENT:
"""
${chunkContent.slice(0, 2000)}
"""

TASK:
1. Write a brief context summary (1-2 sentences) that situates this chunk within the document.
2. Extract any structured metadata (dates, names, numbers, categories) if present.

RESPONSE FORMAT (JSON):
{
  "context_summary": "In [Document Title], [section/chapter if known], this text discusses...",
  "extracted_metadata": {
    "year": null,
    "effective_date": null,
    "jurisdiction": null,
    "entities": [],
    "categories": [],
    "key_values": {}
  }
}

IMPORTANT:
- The context_summary should make the chunk understandable without reading the full document.
- Only include metadata fields that are actually present in the chunk.
- Keep context_summary under 150 words.

Respond with ONLY the JSON, no markdown.`;
}

/**
 * Generate contextual summaries for multiple chunks in batch.
 * Uses rate limiting to avoid API throttling.
 */
export async function batchGenerateContextualSummaries(
    documentTitle: string,
    documentType: string,
    chunks: string[],
    metadata?: Record<string, any>,
    options?: {
        delayMs?: number;    // Delay between API calls
        skipFirst?: number;  // Skip first N chunks (already processed)
    }
): Promise<ContextualSummaryResult[]> {
    const results: ContextualSummaryResult[] = [];
    const delayMs = options?.delayMs || 100;  // 100ms between calls
    const skipFirst = options?.skipFirst || 0;

    let previousSummary = '';

    for (let i = 0; i < chunks.length; i++) {
        // Skip already processed
        if (i < skipFirst) {
            results.push({ contextualSummary: '', structuredMetadata: {} });
            continue;
        }

        const result = await generateContextualSummary({
            documentTitle,
            documentType,
            chunkContent: chunks[i],
            chunkIndex: i,
            totalChunks: chunks.length,
            previousChunkSummary: previousSummary,
            metadata
        });

        results.push(result);
        previousSummary = result.contextualSummary;

        // Rate limiting
        if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return results;
}

/**
 * Quick context extraction without LLM (for speed when LLM is not needed).
 * Uses heuristics to extract basic context.
 */
export function extractQuickContext(
    documentTitle: string,
    chunkContent: string,
    chunkIndex: number
): string {
    // Extract any year mentions
    const yearMatch = chunkContent.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : null;

    // Extract any section/chapter mentions
    const sectionMatch = chunkContent.match(/(?:section|chapter|article|clause|part)\s*[\d.]+/i);
    const section = sectionMatch ? sectionMatch[0] : null;

    // Build quick context
    const parts: string[] = [`From "${documentTitle}"`];
    if (section) parts.push(`${section}`);
    if (year) parts.push(`(${year})`);
    parts.push(`[Chunk ${chunkIndex + 1}]`);

    return parts.join(' ');
}
