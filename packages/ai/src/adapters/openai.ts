import OpenAI from 'openai';
import {
    LLMAdapter,
    ModelProvider,
    ModelInfo,
    CompletionRequest,
    CompletionResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    StreamChunk,
} from '../types';

const OPENAI_MODELS: ModelInfo[] = [
    {
        id: 'gpt-4-turbo',
        provider: 'openai',
        name: 'GPT-4 Turbo',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        capabilities: ['chat', 'vision', 'function_calling', 'json_mode'],
        costPer1kPrompt: 0.01,
        costPer1kCompletion: 0.03,
    },
    {
        id: 'gpt-4o',
        provider: 'openai',
        name: 'GPT-4o',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        capabilities: ['chat', 'vision', 'function_calling', 'json_mode'],
        costPer1kPrompt: 0.005,
        costPer1kCompletion: 0.015,
    },
    {
        id: 'gpt-4o-mini',
        provider: 'openai',
        name: 'GPT-4o Mini',
        contextWindow: 128000,
        maxOutputTokens: 16384,
        capabilities: ['chat', 'vision', 'function_calling', 'json_mode'],
        costPer1kPrompt: 0.00015,
        costPer1kCompletion: 0.0006,
    },
    {
        id: 'gpt-3.5-turbo',
        provider: 'openai',
        name: 'GPT-3.5 Turbo',
        contextWindow: 16385,
        maxOutputTokens: 4096,
        capabilities: ['chat', 'function_calling', 'json_mode'],
        costPer1kPrompt: 0.0005,
        costPer1kCompletion: 0.0015,
    },
];

const EMBEDDING_MODELS = {
    'text-embedding-3-small': { dimensions: 1536, costPer1k: 0.00002 },
    'text-embedding-3-large': { dimensions: 3072, costPer1k: 0.00013 },
    'text-embedding-ada-002': { dimensions: 1536, costPer1k: 0.0001 },
};

export class OpenAIAdapter implements LLMAdapter {
    readonly provider: ModelProvider = 'openai';
    private client: OpenAI;
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
        this.client = new OpenAI({ apiKey: this.apiKey });
    }

    async isAvailable(): Promise<boolean> {
        if (!this.apiKey) return false;
        try {
            await this.client.models.list();
            return true;
        } catch {
            return false;
        }
    }

    async complete(request: CompletionRequest): Promise<CompletionResponse> {
        const startTime = Date.now();
        const modelId = request.model || 'gpt-4o-mini';

        const messages: OpenAI.ChatCompletionMessageParam[] = [];

        if (request.systemPrompt) {
            messages.push({ role: 'system', content: request.systemPrompt });
        }

        for (const msg of request.messages) {
            messages.push({
                role: msg.role as 'system' | 'user' | 'assistant',
                content: msg.content,
            });
        }

        const response = await this.client.chat.completions.create({
            model: modelId,
            messages,
            temperature: request.temperature ?? 0.3,
            max_tokens: request.maxTokens ?? 4096,
            top_p: request.topP,
            frequency_penalty: request.frequencyPenalty,
            presence_penalty: request.presencePenalty,
            stop: request.stop,
            response_format: request.jsonMode ? { type: 'json_object' } : undefined,
        });

        const latencyMs = Date.now() - startTime;
        const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

        // Calculate cost
        const modelInfo = OPENAI_MODELS.find(m => m.id === modelId) || OPENAI_MODELS[2];
        const cost =
            (usage.prompt_tokens / 1000) * modelInfo.costPer1kPrompt +
            (usage.completion_tokens / 1000) * modelInfo.costPer1kCompletion;

        return {
            content: response.choices[0]?.message?.content || '',
            model: modelId,
            provider: 'openai',
            usage: {
                promptTokens: usage.prompt_tokens,
                completionTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens,
            },
            finishReason: this.mapFinishReason(response.choices[0]?.finish_reason),
            latencyMs,
            cost,
        };
    }

    async completeStream(
        request: CompletionRequest,
        onChunk: (chunk: StreamChunk) => void
    ): Promise<CompletionResponse> {
        const startTime = Date.now();
        const modelId = request.model || 'gpt-4o-mini';

        const messages: OpenAI.ChatCompletionMessageParam[] = [];

        if (request.systemPrompt) {
            messages.push({ role: 'system', content: request.systemPrompt });
        }

        for (const msg of request.messages) {
            messages.push({
                role: msg.role as 'system' | 'user' | 'assistant',
                content: msg.content,
            });
        }

        const stream = await this.client.chat.completions.create({
            model: modelId,
            messages,
            temperature: request.temperature ?? 0.3,
            max_tokens: request.maxTokens ?? 4096,
            stream: true,
        });

        let fullContent = '';
        let finishReason: 'stop' | 'length' | 'content_filter' | 'error' = 'stop';

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            fullContent += content;

            if (chunk.choices[0]?.finish_reason) {
                finishReason = this.mapFinishReason(chunk.choices[0].finish_reason);
            }

            onChunk({
                content,
                isComplete: !!chunk.choices[0]?.finish_reason,
                finishReason: chunk.choices[0]?.finish_reason ? finishReason : undefined,
            });
        }

        const latencyMs = Date.now() - startTime;

        // Approximate token count for streaming (actual usage not provided in stream)
        const promptTokens = this.countTokens(messages.map(m => m.content).join(''));
        const completionTokens = this.countTokens(fullContent);

        const modelInfo = OPENAI_MODELS.find(m => m.id === modelId) || OPENAI_MODELS[2];
        const cost =
            (promptTokens / 1000) * modelInfo.costPer1kPrompt +
            (completionTokens / 1000) * modelInfo.costPer1kCompletion;

        return {
            content: fullContent,
            model: modelId,
            provider: 'openai',
            usage: {
                promptTokens,
                completionTokens,
                totalTokens: promptTokens + completionTokens,
            },
            finishReason,
            latencyMs,
            cost,
        };
    }

    async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
        const modelId = request.model || 'text-embedding-3-small';
        const texts = Array.isArray(request.text) ? request.text : [request.text];

        const response = await this.client.embeddings.create({
            model: modelId,
            input: texts,
        });

        const modelInfo = EMBEDDING_MODELS[modelId as keyof typeof EMBEDDING_MODELS] || EMBEDDING_MODELS['text-embedding-3-small'];

        return {
            embeddings: response.data.map(d => d.embedding),
            model: modelId,
            provider: 'openai',
            usage: {
                totalTokens: response.usage?.total_tokens || 0,
            },
            dimensions: modelInfo.dimensions,
        };
    }

    countTokens(text: string): number {
        // Approximate: ~4 chars per token for English
        // For accurate counting, use tiktoken library
        return Math.ceil(text.length / 4);
    }

    getModels(): ModelInfo[] {
        return OPENAI_MODELS;
    }

    private mapFinishReason(reason?: string | null): 'stop' | 'length' | 'content_filter' | 'error' {
        switch (reason) {
            case 'stop':
                return 'stop';
            case 'length':
                return 'length';
            case 'content_filter':
                return 'content_filter';
            default:
                return 'stop';
        }
    }
}
