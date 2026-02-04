import { RetrievedChunk } from './retrieval';
import { countTokens } from './chunking';

/**
 * Context Assembly
 * 
 * Assembles retrieved chunks into context for LLM prompt
 */

export interface ContextOptions {
    maxTokens?: number;
    includeMetadata?: boolean;
    formatStyle?: 'simple' | 'detailed' | 'citation';
}

export interface AssembledContext {
    text: string;
    tokenCount: number;
    includedChunks: RetrievedChunk[];
    excludedCount: number;
    sources: ContextSource[];
}

export interface ContextSource {
    documentId: string;
    documentTitle: string;
    documentType: string | null;
    authorityLevel: number;
    chunkCount: number;
}

const DEFAULT_MAX_TOKENS = 8000;

/**
 * Assemble context from retrieved chunks
 */
export function assembleContext(
    chunks: RetrievedChunk[],
    options: ContextOptions = {}
): AssembledContext {
    const {
        maxTokens = DEFAULT_MAX_TOKENS,
        includeMetadata = true,
        formatStyle = 'citation',
    } = options;

    const includedChunks: RetrievedChunk[] = [];
    const sourceMap = new Map<string, ContextSource>();
    let currentTokens = 0;

    // Sort by combined score (should already be sorted, but ensure)
    const sortedChunks = [...chunks].sort((a, b) => b.combinedScore - a.combinedScore);

    for (const chunk of sortedChunks) {
        const formatted = formatChunk(chunk, formatStyle, includeMetadata);
        const chunkTokens = countTokens(formatted);

        if (currentTokens + chunkTokens > maxTokens) {
            break;
        }

        includedChunks.push(chunk);
        currentTokens += chunkTokens;

        // Track sources
        if (!sourceMap.has(chunk.documentId)) {
            sourceMap.set(chunk.documentId, {
                documentId: chunk.documentId,
                documentTitle: chunk.documentTitle,
                documentType: chunk.documentType,
                authorityLevel: chunk.authorityLevel,
                chunkCount: 0,
            });
        }
        sourceMap.get(chunk.documentId)!.chunkCount++;
    }

    const contextText = includedChunks
        .map(chunk => formatChunk(chunk, formatStyle, includeMetadata))
        .join('\n\n---\n\n');

    return {
        text: contextText,
        tokenCount: currentTokens,
        includedChunks,
        excludedCount: chunks.length - includedChunks.length,
        sources: Array.from(sourceMap.values())
            .sort((a, b) => b.authorityLevel - a.authorityLevel),
    };
}

/**
 * Format a single chunk for context
 */
function formatChunk(
    chunk: RetrievedChunk,
    style: 'simple' | 'detailed' | 'citation',
    includeMetadata: boolean
): string {
    switch (style) {
        case 'simple':
            return chunk.content;

        case 'detailed':
            if (!includeMetadata) return chunk.content;
            return `[Source: ${chunk.documentTitle} | Type: ${chunk.documentType || 'Unknown'} | Authority: ${chunk.authorityLevel}/10]
${chunk.content}`;

        case 'citation':
        default:
            if (!includeMetadata) return chunk.content;
            return `[${chunk.documentTitle}]
${chunk.content}`;
    }
}

/**
 * Build the full prompt with context
 */
export function buildPromptWithContext(
    query: string,
    context: AssembledContext,
    systemPrompt: string
): string {
    const sourcesList = context.sources
        .map(s => `- ${s.documentTitle} (${s.documentType || 'Document'}, Authority: ${s.authorityLevel}/10)`)
        .join('\n');

    return `${systemPrompt}

## Available Knowledge Sources:
${sourcesList}

## Relevant Context:
${context.text}

## User Query:
${query}

## Instructions:
1. Answer the query using ONLY the information from the provided context
2. Cite your sources by referencing document titles
3. If the context doesn't contain enough information, say so clearly
4. Provide practical, actionable advice when applicable
5. Include relevant section/rule numbers when available`;
}

/**
 * Calculate confidence score based on context quality
 */
export function calculateConfidence(context: AssembledContext): {
    score: number;
    level: 'high' | 'medium' | 'low' | 'insufficient';
    factors: Record<string, number>;
} {
    const factors: Record<string, number> = {};

    // Factor 1: Retrieval quality (based on similarity scores)
    const avgSimilarity = context.includedChunks.length > 0
        ? context.includedChunks.reduce((sum, c) => sum + c.similarityScore, 0) / context.includedChunks.length
        : 0;
    factors.retrievalQuality = Math.min(avgSimilarity * 1.2, 1); // Scale up slightly

    // Factor 2: Source authority
    const avgAuthority = context.includedChunks.length > 0
        ? context.includedChunks.reduce((sum, c) => sum + c.authorityLevel, 0) / context.includedChunks.length
        : 0;
    factors.sourceAuthority = avgAuthority / 10;

    // Factor 3: Coverage (number of relevant chunks found)
    factors.coverage = Math.min(context.includedChunks.length / 5, 1); // 5+ chunks = full coverage

    // Factor 4: Source diversity
    factors.diversity = Math.min(context.sources.length / 3, 1); // 3+ sources = good

    // Weighted score
    const score =
        factors.retrievalQuality * 0.4 +
        factors.sourceAuthority * 0.3 +
        factors.coverage * 0.2 +
        factors.diversity * 0.1;

    const level = score >= 0.85 ? 'high'
        : score >= 0.7 ? 'medium'
            : score >= 0.5 ? 'low'
                : 'insufficient';

    return { score, level, factors };
}
