'use client';

import type { GammaPresentation } from '@/lib/gamma/types';

/**
 * Gamma Viewer Component (Stub)
 * Kept for backward compatibility with ChatInterface
 */

interface GammaViewerProps {
    presentation: GammaPresentation;
    mode: 'view' | 'edit';
    onClose: () => void;
    onEdit: () => void;
    onSave: (updated: GammaPresentation) => void;
    userId?: string;
}

export default function GammaViewer({ presentation, mode, onClose, onEdit, onSave }: GammaViewerProps) {
    return (
        <div className="fixed inset-0 bg-black/90 flex flex-col z-[100]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 bg-gray-900/80 border-b border-gray-800">
                <h2 className="text-white font-medium">{presentation.title}</h2>
                <div className="flex items-center gap-3">
                    {mode === 'view' && (
                        <button
                            onClick={onEdit}
                            className="px-4 py-1.5 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg"
                        >
                            Edit
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {presentation.cards.map((card, i) => (
                        <div key={card.id} className="bg-white rounded-2xl p-8 shadow-lg">
                            <div className="text-xs text-gray-400 mb-2">Slide {i + 1}</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">{card.title}</h3>
                            {card.content?.body && (
                                <p className="text-gray-600">{card.content.body}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
