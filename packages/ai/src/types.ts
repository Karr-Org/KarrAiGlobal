/**
 * Karr AI - Model Abstraction Layer Types
 * 
 * Provider-agnostic interfaces for LLM operations
 */

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'meta';

export type ModelCapability =
    | 'chat'
    | 'completion'
    | 'embedding'
    | 'vision'
    | 'function_calling'
    | 'json_mode';

export interface ModelInfo {
    id: string;
    provider: ModelProvider;
    name: string;
    contextWindow: number;
    maxOutputTokens: number;
    capabilities: ModelCapability[];
    costPer1kPrompt: number;  // USD
    costPer1kCompletion: number;  // USD
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    name?: string;
}

export interface CompletionRequest {
    messages: ChatMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stop?: string[];
    jsonMode?: boolean;
    systemPrompt?: string;
}

export interface CompletionResponse {
    content: string;
    model: string;
    provider: ModelProvider;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason: 'stop' | 'length' | 'content_filter' | 'error';
    latencyMs: number;
    cost: number;  // USD
}

export interface EmbeddingRequest {
    text: string | string[];
    model?: string;
}

export interface EmbeddingResponse {
    embeddings: number[][];
    model: string;
    provider: ModelProvider;
    usage: {
        totalTokens: number;
    };
    dimensions: number;
}

export interface StreamChunk {
    content: string;
    isComplete: boolean;
    finishReason?: 'stop' | 'length' | 'content_filter' | 'error';
}

export interface LLMAdapter {
    provider: ModelProvider;

    /**
     * Check if the adapter is available (API key set, service reachable)
     */
    isAvailable(): Promise<boolean>;

    /**
     * Generate a chat completion
     */
    complete(request: CompletionRequest): Promise<CompletionResponse>;

    /**
     * Generate a streaming chat completion
     */
    completeStream(
        request: CompletionRequest,
        onChunk: (chunk: StreamChunk) => void
    ): Promise<CompletionResponse>;

    /**
     * Generate embeddings for text
     */
    embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;

    /**
     * Count tokens in text (approximate)
     */
    countTokens(text: string): number;

    /**
     * Get available models from this provider
     */
    getModels(): ModelInfo[];
}

// Router types
export interface RoutingDecision {
    adapter: LLMAdapter;
    model: string;
    reason: string;
}

export interface RoutingConfig {
    primaryProvider: ModelProvider;
    fallbackProviders: ModelProvider[];
    costOptimize: boolean;
    maxCostPerQuery?: number;  // USD
}

export type QueryComplexity = 'low' | 'medium' | 'high';
