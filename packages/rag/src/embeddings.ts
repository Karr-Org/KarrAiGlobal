import { getModelRouter } from '@karrai/ai';

/**
 * Embedding Generation
 * 
 * Generates vector embeddings for text using the AI model router
 */

export interface EmbeddingResult {
    embedding: number[];
    tokenCount: number;
    model: string;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
    const router = getModelRouter();
    const response = await router.embed({ text });

    return {
        embedding: response.embeddings[0],
        tokenCount: response.usage.totalTokens,
        model: response.model,
    };
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const router = getModelRouter();
    const response = await router.embed({ text: texts });

    return response.embeddings.map((embedding, i) => ({
        embedding,
        tokenCount: Math.ceil(response.usage.totalTokens / texts.length),
        model: response.model,
    }));
}

/**
 * Generate embeddings in batches to avoid rate limits
 */
export async function generateEmbeddingsBatched(
    texts: string[],
    batchSize: number = 100,
    delayMs: number = 100
): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchResults = await generateEmbeddings(batch);
        results.push(...batchResults);

        // Delay between batches to avoid rate limits
        if (i + batchSize < texts.length) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return results;
}
