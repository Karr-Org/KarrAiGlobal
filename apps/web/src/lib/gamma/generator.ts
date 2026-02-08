/**
 * Gamma Presentation Generator (Stub)
 * Full implementation was moved to the v3 block-based system.
 * This stub exists to prevent build errors from legacy imports.
 */

import type { GammaPresentation } from './types';

export interface GenerateOptions {
    topic: string;
    cardCount?: number;
    theme?: string;
    audience?: string;
    tone?: string;
    productId?: string;
    userId?: string;
    style?: string;
    includeImages?: boolean;
}

export async function generatePresentation(options: GenerateOptions): Promise<GammaPresentation> {
    console.warn('[Gamma Generator] Using stub — full implementation moved to v3 block system');
    return {
        id: crypto.randomUUID(),
        title: options.topic,
        theme: (options.theme || 'midnight') as any,
        cards: [
            {
                id: crypto.randomUUID(),
                title: options.topic,
                layout: 'title',
                content: { body: `Presentation about ${options.topic}` },
            }
        ],
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            author: options.userId || 'anonymous',
            cardCount: 1,
        }
    };
}
