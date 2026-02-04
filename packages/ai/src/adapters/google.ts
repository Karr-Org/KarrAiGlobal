import { GoogleGenerativeAI, GenerativeModel, Content } from '@google/generative-ai';
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

const GOOGLE_MODELS: ModelInfo[] = [
    {
        id: 'gemini-1.5-pro',
        provider: 'google',
        name: 'Gemini 1.5 Pro',
        contextWindow: 2000000,
        maxOutputTokens: 8192,
        capabilities: ['chat', 'vision'],
        costPer1kPrompt: 0.00125,
        costPer1kCompletion: 0.005,
    },
    {
        id: 'gemini-1.5-flash',
        provider: 'google',
        name: 'Gemini 1.5 Flash',
        contextWindow: 1000000,
        maxOutputTokens: 8192,
        capabilities: ['chat', 'vision'],
        costPer1kPrompt: 0.000075,
        costPer1kCompletion: 0.0003,
    },
    {
        id: 'gemini-pro',
        provider: 'google',
        name: 'Gemini Pro',
        contextWindow: 32760,
        maxOutputTokens: 8192,
        capabilities: ['chat'],
        costPer1kPrompt: 0.0005,
        costPer1kCompletion: 0.0015,
    },
];

export class GoogleAdapter implements LLMAdapter {
    readonly provider: ModelProvider = 'google';
    private client: GoogleGenerativeAI;
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.GOOGLE_AI_API_KEY || '';
        this.client = new GoogleGenerativeAI(this.apiKey);
    }

    async isAvailable(): Promise<boolean> {
        if (!this.apiKey) return false;
        try {
            const model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });
            await model.generateContent('Hi');
            return true;
        } catch {
            return false;
        }
    }

    async complete(request: CompletionRequest): Promise<CompletionResponse> {
        const startTime = Date.now();
        const modelId = request.model || 'gemini-1.5-flash';

        const model = this.client.getGenerativeModel({
            model: modelId,
            generationConfig: {
                temperature: request.temperature ?? 0.3,
                maxOutputTokens: request.maxTokens ?? 4096,
                topP: request.topP,
                stopSequences: request.stop,
            },
            systemInstruction: request.systemPrompt,
        });

        const contents = this.convertMessages(request.messages);

        const result = await model.generateContent({ contents });
        const response = result.response;

        const latencyMs = Date.now() - startTime;
        const content = response.text();

        // Get usage metadata
        const usageMetadata = response.usageMetadata;
        const promptTokens = usageMetadata?.promptTokenCount || this.countTokens(JSON.stringify(contents));
        const completionTokens = usageMetadata?.candidatesTokenCount || this.countTokens(content);

        const modelInfo = GOOGLE_MODELS.find(m => m.id === modelId) || GOOGLE_MODELS[1];
        const cost =
            (promptTokens / 1000) * modelInfo.costPer1kPrompt +
            (completionTokens / 1000) * modelInfo.costPer1kCompletion;

        return {
            content,
            model: modelId,
            provider: 'google',
            usage: {
                promptTokens,
                completionTokens,
                totalTokens: promptTokens + completionTokens,
            },
            finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason),
            latencyMs,
            cost,
        };
    }

    async completeStream(
        request: CompletionRequest,
        onChunk: (chunk: StreamChunk) => void
    ): Promise<CompletionResponse> {
        const startTime = Date.now();
        const modelId = request.model || 'gemini-1.5-flash';

        const model = this.client.getGenerativeModel({
            model: modelId,
            generationConfig: {
                temperature: request.temperature ?? 0.3,
                maxOutputTokens: request.maxTokens ?? 4096,
                topP: request.topP,
                stopSequences: request.stop,
            },
            systemInstruction: request.systemPrompt,
        });

        const contents = this.convertMessages(request.messages);

        const result = await model.generateContentStream({ contents });

        let fullContent = '';
        let finishReason: 'stop' | 'length' | 'content_filter' | 'error' = 'stop';

        for await (const chunk of result.stream) {
            const text = chunk.text();
            fullContent += text;

            if (chunk.candidates?.[0]?.finishReason) {
                finishReason = this.mapFinishReason(chunk.candidates[0].finishReason);
            }

            onChunk({
                content: text,
                isComplete: !!chunk.candidates?.[0]?.finishReason,
                finishReason: chunk.candidates?.[0]?.finishReason ? finishReason : undefined,
            });
        }

        const latencyMs = Date.now() - startTime;
        const promptTokens = this.countTokens(JSON.stringify(contents));
        const completionTokens = this.countTokens(fullContent);

        const modelInfo = GOOGLE_MODELS.find(m => m.id === modelId) || GOOGLE_MODELS[1];
        const cost =
            (promptTokens / 1000) * modelInfo.costPer1kPrompt +
            (completionTokens / 1000) * modelInfo.costPer1kCompletion;

        return {
            content: fullContent,
            model: modelId,
            provider: 'google',
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
        const modelId = request.model || 'text-embedding-004';
        const model = this.client.getGenerativeModel({ model: modelId });

        const texts = Array.isArray(request.text) ? request.text : [request.text];
        const embeddings: number[][] = [];

        for (const text of texts) {
            const result = await model.embedContent(text);
            embeddings.push(result.embedding.values);
        }

        return {
            embeddings,
            model: modelId,
            provider: 'google',
            usage: {
                totalTokens: this.countTokens(texts.join('')),
            },
            dimensions: embeddings[0]?.length || 768,
        };
    }

    countTokens(text: string): number {
        // Approximate: ~4 chars per token
        return Math.ceil(text.length / 4);
    }

    getModels(): ModelInfo[] {
        return GOOGLE_MODELS;
    }

    private convertMessages(messages: CompletionRequest['messages']): Content[] {
        const contents: Content[] = [];

        for (const msg of messages) {
            if (msg.role === 'system') {
                // System messages are handled via systemInstruction
                continue;
            }

            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            });
        }

        return contents;
    }

    private mapFinishReason(reason?: string): 'stop' | 'length' | 'content_filter' | 'error' {
        switch (reason) {
            case 'STOP':
                return 'stop';
            case 'MAX_TOKENS':
                return 'length';
            case 'SAFETY':
                return 'content_filter';
            case 'RECITATION':
                return 'content_filter';
            default:
                return 'stop';
        }
    }
}
