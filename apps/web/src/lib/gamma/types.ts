/**
 * Gamma Presentation Types (Stub)
 * Kept for backward compatibility with ChatInterface imports
 */

export interface GammaCard {
    id: string;
    title: string;
    layout: string;
    content: Record<string, any>;
    backgroundImage?: string;
    notes?: string;
}

export interface GammaPresentation {
    id: string;
    title: string;
    theme: string;
    cards: GammaCard[];
    metadata: {
        createdAt: string;
        updatedAt: string;
        author: string;
        cardCount: number;
    };
}
