import { TypedSupabaseClient } from '@karrai/database';
import { generateEmbedding } from './embeddings';

/**
 * RAG Retrieval Engine
 * 
 * Retrieves relevant knowledge chunks using hybrid search
 */

export interface RetrievalOptions {
    productId: string;
    userId?: string;
    maxResults?: number;
    similarityThreshold?: number;
    filterDocumentTypes?: string[];
    minAuthorityLevel?: number;
}

export interface RetrievedChunk {
    chunkId: string;
    content: string;
    documentId: string;
    documentTitle: string;
    documentType: string | null;
    authorityLevel: number;
    sourceTier: 'product' | 'user';
    similarityScore: number;
    combinedScore: number;
}

export interface RetrievalResult {
    chunks: RetrievedChunk[];
    queryEmbedding: number[];
    totalRetrieved: number;
}

/**
 * Retrieve relevant chunks for a query
 */
export async function retrieveChunks(
    supabase: TypedSupabaseClient,
    query: string,
    options: RetrievalOptions
): Promise<RetrievalResult> {
    const {
        productId,
        userId,
        maxResults = 10,
        similarityThreshold = 0.5,
    } = options;

    // Generate query embedding
    const { embedding: queryEmbedding } = await generateEmbedding(query);

    // Call hybrid search function
    const { data, error } = await supabase.rpc('hybrid_search', {
        query_embedding: queryEmbedding as unknown as string, // Supabase expects vector as string
        query_text: query,
        p_product_id: productId,
        p_user_id: userId || null,
        match_count: maxResults,
        similarity_threshold: similarityThreshold,
    });

    if (error) {
        throw new Error(`Retrieval failed: ${error.message}`);
    }

    const chunks: RetrievedChunk[] = (data || []).map((row: {
        chunk_id: string;
        content: string;
        document_id: string;
        document_title: string;
        document_type: string | null;
        authority_level: number;
        source_tier: string;
        similarity_score: number;
        combined_score: number;
    }) => ({
        chunkId: row.chunk_id,
        content: row.content,
        documentId: row.document_id,
        documentTitle: row.document_title,
        documentType: row.document_type,
        authorityLevel: row.authority_level,
        sourceTier: row.source_tier as 'product' | 'user',
        similarityScore: row.similarity_score,
        combinedScore: row.combined_score,
    }));

    // Apply additional filters
    const filteredChunks = applyFilters(chunks, options);

    return {
        chunks: filteredChunks,
        queryEmbedding,
        totalRetrieved: filteredChunks.length,
    };
}

/**
 * Apply additional filters to retrieved chunks
 */
function applyFilters(chunks: RetrievedChunk[], options: RetrievalOptions): RetrievedChunk[] {
    let filtered = chunks;

    if (options.filterDocumentTypes?.length) {
        filtered = filtered.filter(
            c => c.documentType && options.filterDocumentTypes!.includes(c.documentType)
        );
    }

    if (options.minAuthorityLevel) {
        filtered = filtered.filter(c => c.authorityLevel >= options.minAuthorityLevel!);
    }

    return filtered;
}

/**
 * Re-rank chunks using additional signals
 */
export function rerankChunks(
    chunks: RetrievedChunk[],
    query: string,
    options: {
        boostRecent?: boolean;
        boostAuthority?: boolean;
        diversify?: boolean;
    } = {}
): RetrievedChunk[] {
    const { boostAuthority = true, diversify = true } = options;

    let ranked = [...chunks];

    // Boost by authority level
    if (boostAuthority) {
        ranked = ranked.map(chunk => ({
            ...chunk,
            combinedScore: chunk.combinedScore * (1 + chunk.authorityLevel * 0.05),
        }));
    }

    // Diversify: ensure variety of document sources
    if (diversify) {
        ranked = diversifyResults(ranked);
    }

    // Sort by combined score
    return ranked.sort((a, b) => b.combinedScore - a.combinedScore);
}

/**
 * Ensure diversity in results (not all from same document)
 */
function diversifyResults(chunks: RetrievedChunk[]): RetrievedChunk[] {
    const documentCounts = new Map<string, number>();
    const maxPerDocument = 3;

    return chunks.filter(chunk => {
        const count = documentCounts.get(chunk.documentId) || 0;
        if (count >= maxPerDocument) return false;
        documentCounts.set(chunk.documentId, count + 1);
        return true;
    });
}
