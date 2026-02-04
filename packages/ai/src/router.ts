import { OpenAIAdapter } from './adapters/openai';
import { AnthropicAdapter } from './adapters/anthropic';
import { GoogleAdapter } from './adapters/google';
import {
    LLMAdapter,
    ModelProvider,
    CompletionRequest,
    CompletionResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    RoutingConfig,
    RoutingDecision,
    QueryComplexity,
    StreamChunk,
} from './types';

/**
 * Model Router - Intelligent routing between LLM providers
 * 
 * Features:
 * - Automatic fallback on failure
 * - Cost optimization
 * - Complexity-based routing
 * - Availability checking
 */
export class ModelRouter {
    private adapters: Map<ModelProvider, LLMAdapter> = new Map();
    private config: RoutingConfig;

    constructor(config?: Partial<RoutingConfig>) {
        this.config = {
            primaryProvider: 'openai',
            fallbackProviders: ['anthropic', 'google'],
            costOptimize: true,
            ...config,
        };

        // Initialize adapters
        this.adapters.set('openai', new OpenAIAdapter());
        this.adapters.set('anthropic', new AnthropicAdapter());
        this.adapters.set('google', new GoogleAdapter());
    }

    /**
     * Get the best adapter for a given query
     */
    async route(
        request: CompletionRequest,
        complexity: QueryComplexity = 'medium'
    ): Promise<RoutingDecision> {
        // Determine model based on complexity and cost optimization
        const { provider, model, reason } = this.selectModel(complexity);

        // Check availability
        const adapter = this.adapters.get(provider);
        if (adapter && await adapter.isAvailable()) {
            return { adapter, model, reason };
        }

        // Fallback through providers
        for (const fallbackProvider of this.config.fallbackProviders) {
            const fallbackAdapter = this.adapters.get(fallbackProvider);
            if (fallbackAdapter && await fallbackAdapter.isAvailable()) {
                const fallbackModel = this.getDefaultModel(fallbackProvider, complexity);
                return {
                    adapter: fallbackAdapter,
                    model: fallbackModel,
                    reason: `Fallback to ${fallbackProvider} (${provider} unavailable)`,
                };
            }
        }

        throw new Error('No LLM providers available');
    }

    /**
     * Complete a query with automatic routing
     */
    async complete(
        request: CompletionRequest,
        complexity: QueryComplexity = 'medium'
    ): Promise<CompletionResponse> {
        const { adapter, model } = await this.route(request, complexity);

        try {
            return await adapter.complete({ ...request, model });
        } catch (error) {
            // Try fallback on error
            for (const fallbackProvider of this.config.fallbackProviders) {
                if (fallbackProvider === adapter.provider) continue;

                const fallbackAdapter = this.adapters.get(fallbackProvider);
                if (fallbackAdapter && await fallbackAdapter.isAvailable()) {
                    const fallbackModel = this.getDefaultModel(fallbackProvider, complexity);
                    return await fallbackAdapter.complete({ ...request, model: fallbackModel });
                }
            }
            throw error;
        }
    }

    /**
     * Stream a query with automatic routing
     */
    async completeStream(
        request: CompletionRequest,
        onChunk: (chunk: StreamChunk) => void,
        complexity: QueryComplexity = 'medium'
    ): Promise<CompletionResponse> {
        const { adapter, model } = await this.route(request, complexity);
        return await adapter.completeStream({ ...request, model }, onChunk);
    }

    /**
     * Generate embeddings (always uses OpenAI for consistency with pgvector)
     */
    async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
        const openai = this.adapters.get('openai');
        if (openai && await openai.isAvailable()) {
            return openai.embed(request);
        }

        // Fallback to Google embeddings
        const google = this.adapters.get('google');
        if (google && await google.isAvailable()) {
            return google.embed(request);
        }

        throw new Error('No embedding provider available');
    }

    /**
     * Assess query complexity based on content
     */
    assessComplexity(query: string): QueryComplexity {
        const wordCount = query.split(/\s+/).length;
        const hasLegalTerms = /\b(section|act|rule|circular|notification|judgment|tribunal|court|appeal)\b/i.test(query);
        const hasCalculation = /\b(calculate|compute|percentage|amount|rate|value)\b/i.test(query);
        const hasMultipleParts = query.includes('?') && query.split('?').length > 2;

        if (wordCount > 100 || hasMultipleParts || (hasLegalTerms && hasCalculation)) {
            return 'high';
        } else if (wordCount > 30 || hasLegalTerms || hasCalculation) {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Get adapter by provider
     */
    getAdapter(provider: ModelProvider): LLMAdapter | undefined {
        return this.adapters.get(provider);
    }

    /**
     * Check availability of all providers
     */
    async checkAvailability(): Promise<Record<ModelProvider, boolean>> {
        const result: Record<ModelProvider, boolean> = {
            openai: false,
            anthropic: false,
            google: false,
            meta: false,
        };

        for (const [provider, adapter] of this.adapters) {
            result[provider] = await adapter.isAvailable();
        }

        return result;
    }

    private selectModel(complexity: QueryComplexity): { provider: ModelProvider; model: string; reason: string } {
        const primary = this.config.primaryProvider;

        if (this.config.costOptimize) {
            // Cost-optimized routing
            switch (complexity) {
                case 'low':
                    return {
                        provider: 'openai',
                        model: 'gpt-4o-mini',
                        reason: 'Low complexity query, using cost-effective model',
                    };
                case 'medium':
                    return {
                        provider: primary,
                        model: this.getDefaultModel(primary, 'medium'),
                        reason: 'Medium complexity, using primary provider',
                    };
                case 'high':
                    return {
                        provider: primary,
                        model: this.getDefaultModel(primary, 'high'),
                        reason: 'High complexity query, using powerful model',
                    };
            }
        }

        return {
            provider: primary,
            model: this.getDefaultModel(primary, complexity),
            reason: 'Using primary provider',
        };
    }

    private getDefaultModel(provider: ModelProvider, complexity: QueryComplexity): string {
        switch (provider) {
            case 'openai':
                return complexity === 'high' ? 'gpt-4-turbo' : 'gpt-4o-mini';
            case 'anthropic':
                return complexity === 'high' ? 'claude-3-5-sonnet-20241022' : 'claude-3-haiku-20240307';
            case 'google':
                return complexity === 'high' ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
            default:
                return 'gpt-4o-mini';
        }
    }
}

// Singleton instance
let routerInstance: ModelRouter | null = null;

export function getModelRouter(config?: Partial<RoutingConfig>): ModelRouter {
    if (!routerInstance) {
        routerInstance = new ModelRouter(config);
    }
    return routerInstance;
}
