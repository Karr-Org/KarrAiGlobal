import Anthropic from '@anthropic-ai/sdk';
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

const ANTHROPIC_MODELS: ModelInfo[] = [
    {
        id: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        name: 'Claude 3.5 Sonnet',
        contextWindow: 200000,
        maxOutputTokens: 8192,
        capabilities: ['chat', 'vision'],
        costPer1kPrompt: 0.003,
        costPer1kCompletion: 0.015,
    },
    {
        id: 'claude-3-opus-20240229',
        provider: 'anthropic',
        name: 'Claude 3 Opus',
        contextWindow: 200000,
        maxOutputTokens: 4096,
        capabilities: ['chat', 'vision'],
        costPer1kPrompt: 0.015,
        costPer1kCompletion: 0.075,
    },
    {
        id: 'claude-3-sonnet-20240229',
        provider: 'anthropic',
        name: 'Claude 3 Sonnet',
        contextWindow: 200000,
        maxOutputTokens: 4096,
        capabilities: ['chat', 'vision'],
        costPer1kPrompt: 0.003,
        costPer1kCompletion: 0.015,
    },
    {
        id: 'claude-3-haiku-20240307',
        provider: 'anthropic',
        name: 'Claude 3 Haiku',
        contextWindow: 200000,
        maxOutputTokens: 4096,
        capabilities: ['chat', 'vision'],
        costPer1kPrompt: 0.00025,
        costPer1kCompletion: 0.00125,
    },
];

export class AnthropicAdapter implements LLMAdapter {
    readonly provider: ModelProvider = 'anthropic';
    private client: Anthropic;
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
        this.client = new Anthropic({ apiKey: this.apiKey });
    }

    async isAvailable(): Promise<boolean> {
        if (!this.apiKey) return false;
        try {
            // Test with a minimal request
            await this.client.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1,
                messages: [{ role: 'user', content: 'Hi' }],
            });
            return true;
        } catch {
            return false;
        }
    }

    async complete(request: CompletionRequest): Promise<CompletionResponse> {
        const startTime = Date.now();
        const modelId = request.model || 'claude-3-5-sonnet-20241022';

        const messages: Anthropic.MessageParam[] = request.messages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
        }));

        const response = await this.client.messages.create({
            model: modelId,
            max_tokens: request.maxTokens ?? 4096,
            system: request.systemPrompt,
            messages,
            temperature: request.temperature ?? 0.3,
            top_p: request.topP,
            stop_sequences: request.stop,
        });

        const latencyMs = Date.now() - startTime;

        const content = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('');

        const modelInfo = ANTHROPIC_MODELS.find(m => m.id === modelId) || ANTHROPIC_MODELS[0];
        const cost =
            (response.usage.input_tokens / 1000) * modelInfo.costPer1kPrompt +
            (response.usage.output_tokens / 1000) * modelInfo.costPer1kCompletion;

        return {
            content,
            model: modelId,
            provider: 'anthropic',
            usage: {
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            },
            finishReason: this.mapStopReason(response.stop_reason),
            latencyMs,
            cost,
        };
    }

    async completeStream(
        request: CompletionRequest,
        onChunk: (chunk: StreamChunk) => void
    ): Promise<CompletionResponse> {
        const startTime = Date.now();
        const modelId = request.model || 'claude-3-5-sonnet-20241022';

        const messages: Anthropic.MessageParam[] = request.messages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
        }));

        const stream = await this.client.messages.stream({
            model: modelId,
            max_tokens: request.maxTokens ?? 4096,
            system: request.systemPrompt,
            messages,
            temperature: request.temperature ?? 0.3,
        });

        let fullContent = '';
        let inputTokens = 0;
        let outputTokens = 0;
        let stopReason: Anthropic.Message['stop_reason'] = null;

        for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                fullContent += event.delta.text;
                onChunk({
                    content: event.delta.text,
                    isComplete: false,
                });
            } else if (event.type === 'message_delta') {
                stopReason = event.delta.stop_reason;
                outputTokens = event.usage?.output_tokens || 0;
            } else if (event.type === 'message_start') {
                inputTokens = event.message.usage?.input_tokens || 0;
            }
        }

        onChunk({
            content: '',
            isComplete: true,
            finishReason: this.mapStopReason(stopReason),
        });

        const latencyMs = Date.now() - startTime;

        const modelInfo = ANTHROPIC_MODELS.find(m => m.id === modelId) || ANTHROPIC_MODELS[0];
        const cost =
            (inputTokens / 1000) * modelInfo.costPer1kPrompt +
            (outputTokens / 1000) * modelInfo.costPer1kCompletion;

        return {
            content: fullContent,
            model: modelId,
            provider: 'anthropic',
            usage: {
                promptTokens: inputTokens,
                completionTokens: outputTokens,
                totalTokens: inputTokens + outputTokens,
            },
            finishReason: this.mapStopReason(stopReason),
            latencyMs,
            cost,
        };
    }

    async embed(_request: EmbeddingRequest): Promise<EmbeddingResponse> {
        // Anthropic doesn't provide embedding models
        // Fall back to OpenAI or other provider
        throw new Error('Anthropic does not support embeddings. Use OpenAI adapter for embeddings.');
    }

    countTokens(text: string): number {
        // Anthropic uses a similar tokenization to OpenAI
        // Approximate: ~4 chars per token for English
        return Math.ceil(text.length / 4);
    }

    getModels(): ModelInfo[] {
        return ANTHROPIC_MODELS;
    }

    private mapStopReason(reason?: Anthropic.Message['stop_reason']): 'stop' | 'length' | 'content_filter' | 'error' {
        switch (reason) {
            case 'end_turn':
                return 'stop';
            case 'max_tokens':
                return 'length';
            case 'stop_sequence':
                return 'stop';
            default:
                return 'stop';
        }
    }
}
