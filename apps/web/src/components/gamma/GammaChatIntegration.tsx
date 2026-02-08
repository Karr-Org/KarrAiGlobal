'use client';

import type { GammaPresentation } from '@/lib/gamma/types';

/**
 * Gamma Chat Integration Components (Stubs)
 * Kept for backward compatibility with ChatInterface
 */

export function parsePresentationRequest(message: string): {
    shouldGenerate: boolean;
    topic?: string;
    cardCount?: number;
    theme?: string;
    audience?: string;
    tone?: string;
} {
    const lower = message.toLowerCase();
    const triggers = ['create a presentation', 'make a presentation', 'generate a presentation', 'build a presentation'];
    const shouldGenerate = triggers.some(t => lower.includes(t));

    if (!shouldGenerate) return { shouldGenerate: false };

    // Extract topic (crude parsing)
    const aboutMatch = message.match(/(?:about|on|regarding)\s+(.+?)(?:\.|$)/i);
    const topic = aboutMatch?.[1]?.trim() || message.replace(/create|make|generate|build|a|presentation/gi, '').trim() || 'Untitled';

    return {
        shouldGenerate: true,
        topic,
        cardCount: 5,
        theme: 'midnight',
        tone: 'professional'
    };
}

export function GammaChatCard({ presentation, onOpenViewer, onEdit }: {
    presentation: GammaPresentation;
    onOpenViewer: () => void;
    onEdit: () => void;
}) {
    return (
        <div
            className="border rounded-xl p-4 bg-gradient-to-br from-purple-50 to-indigo-50 cursor-pointer hover:shadow-md transition-shadow"
            onClick={onOpenViewer}
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-white font-bold">
                    P
                </div>
                <div>
                    <h4 className="font-medium text-gray-900">{presentation.title}</h4>
                    <p className="text-xs text-gray-500">{presentation.cards.length} slides</p>
                </div>
            </div>
            <div className="mt-3 flex gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onOpenViewer(); }}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                    View
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="px-3 py-1 text-xs bg-white border text-gray-700 rounded-lg hover:bg-gray-50"
                >
                    Edit
                </button>
            </div>
        </div>
    );
}

export function PresentationGenerating({ topic }: { topic: string }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
            <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
            <span className="text-sm text-purple-700">Generating presentation: {topic}...</span>
        </div>
    );
}
