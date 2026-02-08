'use client';

/**
 * 🎨 Card Editor Component
 * Inline editing for presentation cards with:
 * - Title editing
 * - Content/bullet editing
 * - Image regeneration
 * - Layout switching
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Edit3, Check, X, RefreshCw, Image as ImageIcon,
    Type, AlignLeft, List, Layout, Palette, Wand2,
    Plus, Trash2, GripVertical, Loader2, Upload, Link
} from 'lucide-react';

// ==========================================
// TYPES
// ==========================================

export interface CardContent {
    id: string;
    title: string;
    subtitle?: string;
    content: string;
    bullets?: string[];
    imageUrl?: string;
    imagePrompt?: string;
    layout: string;
    templateId: string;
    colorScheme?: string;
}

interface CardEditorProps {
    card: CardContent;
    colorScheme: { primary: string; secondary: string };
    onSave: (card: CardContent) => void;
    onCancel: () => void;
    onRegenerateImage: (prompt: string) => Promise<string>;
    isOpen: boolean;
}

interface InlineCardEditorProps {
    card: CardContent;
    colorScheme: { primary: string; secondary: string };
    onUpdate: (updates: Partial<CardContent>) => void;
    onRegenerateImage: () => void;
    isRegenerating?: boolean;
}

// ==========================================
// LAYOUT OPTIONS
// ==========================================

const LAYOUT_OPTIONS = [
    { id: 'title-hero', label: 'Hero Title', icon: '🎯', hasImage: true },
    { id: 'title-gradient', label: 'Gradient Title', icon: '🌈', hasImage: false },
    { id: 'content-split', label: 'Split Content', icon: '📊', hasImage: true },
    { id: 'content-bullets', label: 'Bullet Points', icon: '📋', hasImage: false },
    { id: 'features-3col', label: '3 Columns', icon: '🔲', hasImage: false },
    { id: 'quote', label: 'Quote', icon: '💬', hasImage: false },
    { id: 'stats', label: 'Statistics', icon: '📈', hasImage: false },
    { id: 'cta', label: 'Call to Action', icon: '🚀', hasImage: false },
];

// ==========================================
// INLINE CARD EDITOR (Compact)
// ==========================================

export function InlineCardEditor({
    card,
    colorScheme,
    onUpdate,
    onRegenerateImage,
    isRegenerating = false
}: InlineCardEditorProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingContent, setIsEditingContent] = useState(false);
    const [showBulletEditor, setShowBulletEditor] = useState(false);
    const titleRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditingTitle && titleRef.current) {
            titleRef.current.focus();
            titleRef.current.select();
        }
    }, [isEditingTitle]);

    useEffect(() => {
        if (isEditingContent && contentRef.current) {
            contentRef.current.focus();
        }
    }, [isEditingContent]);

    const updateBullet = (index: number, value: string) => {
        const newBullets = [...(card.bullets || [])];
        newBullets[index] = value;
        onUpdate({ bullets: newBullets });
    };

    const addBullet = () => {
        onUpdate({ bullets: [...(card.bullets || []), 'New point'] });
    };

    const removeBullet = (index: number) => {
        const newBullets = [...(card.bullets || [])];
        newBullets.splice(index, 1);
        onUpdate({ bullets: newBullets });
    };

    return (
        <div className="space-y-4">
            {/* Title Editor */}
            <div className="group">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                    Title
                </label>
                {isEditingTitle ? (
                    <div className="flex gap-2">
                        <input
                            ref={titleRef}
                            type="text"
                            value={card.title}
                            onChange={(e) => onUpdate({ title: e.target.value })}
                            onBlur={() => setIsEditingTitle(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-semibold"
                        />
                    </div>
                ) : (
                    <div
                        onClick={() => setIsEditingTitle(true)}
                        className="px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all flex items-center gap-2"
                    >
                        <span className="text-lg font-semibold text-gray-900">{card.title}</span>
                        <Edit3 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}
            </div>

            {/* Subtitle Editor (optional) */}
            <div className="group">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                    Subtitle (optional)
                </label>
                <input
                    type="text"
                    value={card.subtitle || ''}
                    onChange={(e) => onUpdate({ subtitle: e.target.value })}
                    placeholder="Add a subtitle..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
            </div>

            {/* Content Editor */}
            <div className="group">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                    Content
                </label>
                <textarea
                    ref={contentRef}
                    value={card.content}
                    onChange={(e) => onUpdate({ content: e.target.value })}
                    placeholder="Main content for this card..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                />
            </div>

            {/* Bullet Points Editor */}
            {(card.bullets && card.bullets.length > 0 || showBulletEditor) && (
                <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Bullet Points</span>
                        <button
                            onClick={() => setShowBulletEditor(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </label>
                    <div className="space-y-2">
                        {(card.bullets || []).map((bullet, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <span className="text-indigo-500">•</span>
                                <input
                                    type="text"
                                    value={bullet}
                                    onChange={(e) => updateBullet(index, e.target.value)}
                                    className="flex-1 px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                />
                                <button
                                    onClick={() => removeBullet(index)}
                                    className="p-1 text-gray-400 hover:text-red-500"
                                    title="Remove bullet"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={addBullet}
                            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                        >
                            <Plus className="w-3 h-3" />
                            Add point
                        </button>
                    </div>
                </div>
            )}

            {!showBulletEditor && (!card.bullets || card.bullets.length === 0) && (
                <button
                    onClick={() => {
                        setShowBulletEditor(true);
                        onUpdate({ bullets: ['First point'] });
                    }}
                    className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                >
                    <List className="w-4 h-4" />
                    Add bullet points
                </button>
            )}

            {/* Image Section */}
            {card.imageUrl && (
                <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                        Image
                    </label>
                    <div className="relative rounded-lg overflow-hidden">
                        <img
                            src={card.imageUrl}
                            alt={card.title}
                            className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                            <button
                                onClick={onRegenerateImage}
                                disabled={isRegenerating}
                                className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                            >
                                {isRegenerating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                                New Image
                            </button>
                        </div>
                    </div>
                    <input
                        type="text"
                        value={card.imagePrompt || ''}
                        onChange={(e) => onUpdate({ imagePrompt: e.target.value })}
                        placeholder="Describe the image you want..."
                        className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                </div>
            )}

            {/* Layout Selector */}
            <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                    Layout
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {LAYOUT_OPTIONS.map(layout => (
                        <button
                            key={layout.id}
                            onClick={() => onUpdate({ layout: layout.id })}
                            className={`p-2 rounded-lg text-center transition-all ${card.layout === layout.id
                                    ? 'bg-indigo-100 border-2 border-indigo-500'
                                    : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                                }`}
                            title={layout.label}
                        >
                            <span className="text-lg block">{layout.icon}</span>
                            <span className="text-[10px] text-gray-500">{layout.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ==========================================
// FULL CARD EDITOR MODAL
// ==========================================

export default function CardEditor({
    card,
    colorScheme,
    onSave,
    onCancel,
    onRegenerateImage,
    isOpen
}: CardEditorProps) {
    const [editedCard, setEditedCard] = useState<CardContent>(card);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'style' | 'image'>('content');

    useEffect(() => {
        setEditedCard(card);
    }, [card]);

    const handleUpdate = (updates: Partial<CardContent>) => {
        setEditedCard(prev => ({ ...prev, ...updates }));
    };

    const handleRegenerateImage = async () => {
        setIsRegenerating(true);
        try {
            const newUrl = await onRegenerateImage(editedCard.imagePrompt || editedCard.title);
            handleUpdate({ imageUrl: newUrl });
        } catch (error) {
            console.error('Failed to regenerate image:', error);
        }
        setIsRegenerating(false);
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onCancel}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Preview Side */}
                <div
                    className="w-1/2 p-8 flex items-center justify-center"
                    style={{ backgroundColor: `${colorScheme.primary}10` }}
                >
                    <div className="w-full aspect-video bg-white rounded-xl shadow-lg overflow-hidden">
                        {/* Card Preview */}
                        <div className="h-full p-6 flex flex-col">
                            {editedCard.imageUrl && (
                                <div className="relative h-1/2 mb-4 rounded-lg overflow-hidden">
                                    <img
                                        src={editedCard.imageUrl}
                                        alt={editedCard.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <h2
                                className="text-xl font-bold mb-2"
                                style={{ color: colorScheme.primary }}
                            >
                                {editedCard.title}
                            </h2>
                            {editedCard.subtitle && (
                                <p className="text-gray-600 mb-2">{editedCard.subtitle}</p>
                            )}
                            <p className="text-sm text-gray-700 mb-3 line-clamp-3">{editedCard.content}</p>
                            {editedCard.bullets && editedCard.bullets.length > 0 && (
                                <ul className="space-y-1">
                                    {editedCard.bullets.slice(0, 3).map((bullet, i) => (
                                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                            <span style={{ color: colorScheme.primary }}>•</span>
                                            <span className="line-clamp-1">{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Editor Side */}
                <div className="w-1/2 flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Edit Card</h3>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="Close"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="px-6 py-2 border-b flex gap-4">
                        {[
                            { id: 'content', label: 'Content', icon: Type },
                            { id: 'style', label: 'Layout', icon: Layout },
                            { id: 'image', label: 'Image', icon: ImageIcon }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'content' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={editedCard.title}
                                        onChange={(e) => handleUpdate({ title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                                    <input
                                        type="text"
                                        value={editedCard.subtitle || ''}
                                        onChange={(e) => handleUpdate({ subtitle: e.target.value })}
                                        placeholder="Optional subtitle"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                    <textarea
                                        value={editedCard.content}
                                        onChange={(e) => handleUpdate({ content: e.target.value })}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bullet Points</label>
                                    <div className="space-y-2 mb-2">
                                        {(editedCard.bullets || []).map((bullet, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={bullet}
                                                    onChange={(e) => {
                                                        const newBullets = [...(editedCard.bullets || [])];
                                                        newBullets[index] = e.target.value;
                                                        handleUpdate({ bullets: newBullets });
                                                    }}
                                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newBullets = [...(editedCard.bullets || [])];
                                                        newBullets.splice(index, 1);
                                                        handleUpdate({ bullets: newBullets });
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-red-500"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handleUpdate({ bullets: [...(editedCard.bullets || []), ''] })}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add bullet point
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'style' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Layout</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {LAYOUT_OPTIONS.map(layout => (
                                            <button
                                                key={layout.id}
                                                onClick={() => handleUpdate({ layout: layout.id })}
                                                className={`p-4 rounded-xl text-left transition-all ${editedCard.layout === layout.id
                                                        ? 'bg-indigo-100 border-2 border-indigo-500'
                                                        : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                                                    }`}
                                            >
                                                <span className="text-2xl block mb-1">{layout.icon}</span>
                                                <span className="font-medium text-gray-900">{layout.label}</span>
                                                {layout.hasImage && (
                                                    <span className="text-xs text-gray-500 ml-2">+ image</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'image' && (
                            <div className="space-y-4">
                                {editedCard.imageUrl ? (
                                    <>
                                        <div className="relative rounded-xl overflow-hidden">
                                            <img
                                                src={editedCard.imageUrl}
                                                alt={editedCard.title}
                                                className="w-full h-48 object-cover"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Image Description
                                            </label>
                                            <input
                                                type="text"
                                                value={editedCard.imagePrompt || ''}
                                                onChange={(e) => handleUpdate({ imagePrompt: e.target.value })}
                                                placeholder="Describe the image you want..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleRegenerateImage}
                                                disabled={isRegenerating}
                                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isRegenerating ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="w-4 h-4" />
                                                )}
                                                Regenerate
                                            </button>
                                            <button
                                                onClick={() => handleUpdate({ imageUrl: undefined })}
                                                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 mb-4">No image on this card</p>
                                        <div>
                                            <input
                                                type="text"
                                                value={editedCard.imagePrompt || ''}
                                                onChange={(e) => handleUpdate({ imagePrompt: e.target.value })}
                                                placeholder="Describe the image you want..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                                            />
                                            <button
                                                onClick={handleRegenerateImage}
                                                disabled={isRegenerating || !editedCard.imagePrompt}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
                                            >
                                                {isRegenerating ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Wand2 className="w-4 h-4" />
                                                )}
                                                Generate Image
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t flex justify-end gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSave(editedCard)}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Save Changes
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
