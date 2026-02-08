'use client';

/**
 * 🎨 Gamma Creator - Full Presentation Generation Flow
 * Following Gamma.app's exact workflow:
 * 1. Enter content/topic
 * 2. Select number of cards
 * 3. Select tone
 * 4. Select image type
 * 5. Generate outline (editable)
 * 6. Generate presentation
 * 7. Edit images/content
 * 8. Final output
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ArrowRight, ArrowLeft, Wand2, FileText,
    Palette, Image, Layout, Edit3, Check, RefreshCw,
    ChevronDown, Plus, Trash2, GripVertical, Loader2,
    Camera, Cpu, ImageIcon, X, Download, Eye, Play
} from 'lucide-react';
import CardEditor, { CardContent } from './CardEditor';
import PresentationViewer, { Presentation, PresentationCard } from './PresentationViewer';

// ==========================================
// TYPES
// ==========================================

interface OutlineCard {
    id: string;
    title: string;
    description: string;
    hasImage: boolean;
    imageType: 'hero' | 'side' | 'background' | 'icon' | 'none';
}

interface GeneratedCard {
    id: string;
    title: string;
    content: string;
    bullets?: string[];
    imageUrl?: string;
    imagePrompt?: string;
    layout: string;
    templateId: string;
}

interface CreatorState {
    step: number;
    topic: string;
    cardCount: number;
    tone: string;
    imageSource: 'ai' | 'stock' | 'auto';
    colorScheme: string;
    outline: OutlineCard[];
    generatedCards: GeneratedCard[];
    isGenerating: boolean;
}

// ==========================================
// CONFIG
// ==========================================

const CARD_COUNT_OPTIONS = [
    { value: 5, label: '5 cards', description: 'Quick overview' },
    { value: 7, label: '7 cards', description: 'Standard presentation' },
    { value: 10, label: '10 cards', description: 'Detailed deck' },
    { value: 12, label: '12 cards', description: 'Comprehensive' },
    { value: 15, label: '15 cards', description: 'In-depth presentation' },
];

const TONE_OPTIONS = [
    { value: 'professional', label: 'Professional', emoji: '💼', description: 'Formal and business-focused' },
    { value: 'casual', label: 'Casual', emoji: '😊', description: 'Friendly and approachable' },
    { value: 'inspiring', label: 'Inspiring', emoji: '✨', description: 'Motivational and uplifting' },
    { value: 'educational', label: 'Educational', emoji: '📚', description: 'Clear and instructive' },
    { value: 'persuasive', label: 'Persuasive', emoji: '🎯', description: 'Compelling and convincing' },
    { value: 'storytelling', label: 'Storytelling', emoji: '📖', description: 'Narrative-driven' },
];

const IMAGE_SOURCE_OPTIONS = [
    { value: 'auto', label: 'AI Decides', icon: Cpu, description: 'Let AI choose the best images' },
    { value: 'ai', label: 'AI Generated', icon: Sparkles, description: 'Create unique images with AI' },
    { value: 'stock', label: 'Stock Photos', icon: Camera, description: 'Professional stock photos' },
];

const COLOR_SCHEMES = [
    { value: 'gamma', label: 'Gamma Purple', primary: '#403CCF', secondary: '#6366f1' },
    { value: 'corporate', label: 'Corporate Blue', primary: '#1e40af', secondary: '#3b82f6' },
    { value: 'modern', label: 'Modern Teal', primary: '#0d9488', secondary: '#14b8a6' },
    { value: 'warm', label: 'Warm Orange', primary: '#ea580c', secondary: '#f97316' },
    { value: 'elegant', label: 'Elegant Rose', primary: '#be185d', secondary: '#ec4899' },
    { value: 'dark', label: 'Dark Mode', primary: '#1e293b', secondary: '#475569' },
];

// ==========================================
// STEP 1: TOPIC INPUT
// ==========================================

function TopicStep({
    topic,
    setTopic,
    onNext
}: {
    topic: string;
    setTopic: (t: string) => void;
    onNext: () => void;
}) {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">What's your presentation about?</h2>
                <p className="text-gray-500">Enter your topic, paste content, or describe what you want to create</p>
            </div>

            <div className="space-y-4">
                <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., 'A pitch deck for my AI-powered fitness app that helps users track workouts and nutrition'

or paste your content, notes, or document here..."
                    className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none text-lg"
                />

                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        Paste from docs
                    </span>
                    <span className="flex items-center gap-1">
                        <Wand2 className="w-4 h-4" />
                        AI will expand short topics
                    </span>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={onNext}
                    disabled={!topic.trim()}
                    className={`px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${topic.trim()
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

// ==========================================
// STEP 2: CARD COUNT
// ==========================================

function CardCountStep({
    cardCount,
    setCardCount,
    onNext,
    onBack
}: {
    cardCount: number;
    setCardCount: (c: number) => void;
    onNext: () => void;
    onBack: () => void;
}) {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                    <Layout className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">How many cards?</h2>
                <p className="text-gray-500">Choose the number of slides for your presentation</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {CARD_COUNT_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setCardCount(option.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${cardCount === option.value
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div>
                            <span className="font-semibold text-gray-900">{option.label}</span>
                            <span className="text-gray-500 ml-2">— {option.description}</span>
                        </div>
                        {cardCount === option.value && (
                            <Check className="w-5 h-5 text-indigo-600" />
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-8 flex justify-between">
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 flex items-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="px-8 py-3 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

// ==========================================
// STEP 3: TONE
// ==========================================

function ToneStep({
    tone,
    setTone,
    onNext,
    onBack
}: {
    tone: string;
    setTone: (t: string) => void;
    onNext: () => void;
    onBack: () => void;
}) {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
                    <Edit3 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">What's the tone?</h2>
                <p className="text-gray-500">Choose the voice and style for your content</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {TONE_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setTone(option.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${tone === option.value
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <span className="text-2xl mb-2 block">{option.emoji}</span>
                        <span className="font-semibold text-gray-900 block">{option.label}</span>
                        <span className="text-sm text-gray-500">{option.description}</span>
                    </button>
                ))}
            </div>

            <div className="mt-8 flex justify-between">
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 flex items-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="px-8 py-3 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

// ==========================================
// STEP 4: IMAGE SOURCE
// ==========================================

function ImageSourceStep({
    imageSource,
    setImageSource,
    colorScheme,
    setColorScheme,
    onNext,
    onBack
}: {
    imageSource: 'ai' | 'stock' | 'auto';
    setImageSource: (s: 'ai' | 'stock' | 'auto') => void;
    colorScheme: string;
    setColorScheme: (c: string) => void;
    onNext: () => void;
    onBack: () => void;
}) {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Images & Style</h2>
                <p className="text-gray-500">Choose your image source and color scheme</p>
            </div>

            {/* Image Source */}
            <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-3">Image Source</h3>
                <div className="grid grid-cols-3 gap-3">
                    {IMAGE_SOURCE_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                            <button
                                key={option.value}
                                onClick={() => setImageSource(option.value as 'ai' | 'stock' | 'auto')}
                                className={`p-4 rounded-xl border-2 text-center transition-all ${imageSource === option.value
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className={`w-8 h-8 mx-auto mb-2 ${imageSource === option.value ? 'text-indigo-600' : 'text-gray-400'}`} />
                                <span className="font-semibold text-gray-900 block text-sm">{option.label}</span>
                                <span className="text-xs text-gray-500">{option.description}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Color Scheme */}
            <div>
                <h3 className="font-semibold text-gray-900 mb-3">Color Scheme</h3>
                <div className="grid grid-cols-3 gap-3">
                    {COLOR_SCHEMES.map((scheme) => (
                        <button
                            key={scheme.value}
                            onClick={() => setColorScheme(scheme.value)}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${colorScheme === scheme.value
                                ? 'border-indigo-500'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex gap-1 mb-2">
                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: scheme.primary }} />
                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: scheme.secondary }} />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{scheme.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-8 flex justify-between">
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 flex items-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="px-8 py-3 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                >
                    Generate Outline
                    <Wand2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

// ==========================================
// STEP 5: OUTLINE EDITOR
// ==========================================

function OutlineStep({
    outline,
    setOutline,
    onNext,
    onBack,
    onRegenerate,
    isGenerating
}: {
    outline: OutlineCard[];
    setOutline: (o: OutlineCard[]) => void;
    onNext: () => void;
    onBack: () => void;
    onRegenerate: () => void;
    isGenerating: boolean;
}) {
    const updateCard = (id: string, updates: Partial<OutlineCard>) => {
        setOutline(outline.map(card =>
            card.id === id ? { ...card, ...updates } : card
        ));
    };

    const deleteCard = (id: string) => {
        setOutline(outline.filter(card => card.id !== id));
    };

    const addCard = () => {
        const newCard: OutlineCard = {
            id: `card-${Date.now()}`,
            title: 'New Card',
            description: '',
            hasImage: false,
            imageType: 'none'
        };
        setOutline([...outline, newCard]);
    };

    const moveCard = (index: number, direction: 'up' | 'down') => {
        const newOutline = [...outline];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < outline.length) {
            [newOutline[index], newOutline[targetIndex]] = [newOutline[targetIndex], newOutline[index]];
            setOutline(newOutline);
        }
    };

    if (isGenerating) {
        return (
            <div className="max-w-2xl mx-auto text-center py-16">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating Outline...</h2>
                <p className="text-gray-500">AI is creating the perfect structure for your presentation</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                    <Layout className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Edit Your Outline</h2>
                <p className="text-gray-500">Customize the structure before generating</p>
            </div>

            <div className="mb-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">{outline.length} cards</span>
                <button
                    onClick={onRegenerate}
                    className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                </button>
            </div>

            <div className="space-y-3 mb-6">
                {outline.map((card, index) => (
                    <motion.div
                        key={card.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-gray-200 rounded-xl p-4 group"
                    >
                        <div className="flex gap-3">
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => moveCard(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                    title="Move up"
                                >
                                    <ChevronDown className="w-4 h-4 rotate-180" />
                                </button>
                                <button
                                    onClick={() => moveCard(index, 'down')}
                                    disabled={index === outline.length - 1}
                                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                    title="Move down"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                                        {index + 1}
                                    </span>
                                    <input
                                        type="text"
                                        value={card.title}
                                        onChange={(e) => updateCard(card.id, { title: e.target.value })}
                                        className="flex-1 font-medium text-gray-900 border-0 focus:ring-0 p-0 bg-transparent"
                                        placeholder="Card title"
                                    />
                                </div>
                                <input
                                    type="text"
                                    value={card.description}
                                    onChange={(e) => updateCard(card.id, { description: e.target.value })}
                                    className="w-full text-sm text-gray-500 border-0 focus:ring-0 p-0 bg-transparent"
                                    placeholder="Brief description (optional)"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updateCard(card.id, { hasImage: !card.hasImage })}
                                    className={`p-2 rounded-lg transition-colors ${card.hasImage
                                        ? 'bg-indigo-100 text-indigo-600'
                                        : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                                        }`}
                                    title={card.hasImage ? 'Has image' : 'No image'}
                                >
                                    <ImageIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => deleteCard(card.id)}
                                    className="p-2 rounded-lg bg-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Delete card"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <button
                onClick={addCard}
                className="w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
            >
                <Plus className="w-5 h-5" />
                Add Card
            </button>

            <div className="mt-8 flex justify-between">
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 flex items-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2"
                >
                    <Sparkles className="w-5 h-5" />
                    Generate Presentation
                </button>
            </div>
        </div>
    );
}

// ==========================================
// STEP 6: GENERATING & PREVIEW
// ==========================================

function GeneratingStep({ progress }: { progress: number }) {
    return (
        <div className="max-w-2xl mx-auto text-center py-16">
            <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                <div
                    className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating Your Presentation</h2>
            <p className="text-gray-500 mb-6">Generating content and images...</p>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <motion.div
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
            <p className="text-sm text-gray-400">{progress}% complete</p>
        </div>
    );
}

// ==========================================
// STEP 7: PREVIEW & EDIT
// ==========================================

function PreviewStep({
    cards,
    colorScheme,
    presentationTitle,
    onBack,
    onFinish,
    onPreview,
    onRegenerateImage,
    onEditCard,
    isRegeneratingImage
}: {
    cards: GeneratedCard[];
    colorScheme: string;
    presentationTitle: string;
    onBack: () => void;
    onFinish: () => void;
    onPreview: () => void;
    onRegenerateImage: (cardId: string, prompt: string) => Promise<void>;
    onEditCard: (cardId: string, updates: Partial<GeneratedCard>) => void;
    isRegeneratingImage: string | null;
}) {
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [editingCard, setEditingCard] = useState<GeneratedCard | null>(null);
    const scheme = COLOR_SCHEMES.find(s => s.value === colorScheme) || COLOR_SCHEMES[0];

    const handleSaveCard = (updatedCard: CardContent) => {
        onEditCard(updatedCard.id, {
            title: updatedCard.title,
            content: updatedCard.content,
            bullets: updatedCard.bullets,
            imageUrl: updatedCard.imageUrl,
            imagePrompt: updatedCard.imagePrompt,
            layout: updatedCard.layout
        });
        setEditingCard(null);
    };

    const handleRegenerateCardImage = async (prompt: string): Promise<string> => {
        if (!editingCard) return '';
        await onRegenerateImage(editingCard.id, prompt);
        const updatedCard = cards.find(c => c.id === editingCard.id);
        return updatedCard?.imageUrl || '';
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Your Presentation</h2>
                <p className="text-gray-500">Click on a card to edit content and regenerate images</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {cards.map((card, index) => (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all group ${selectedCard === card.id
                            ? 'border-indigo-500 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                            }`}
                        onClick={() => setSelectedCard(selectedCard === card.id ? null : card.id)}
                    >
                        {/* Card Preview */}
                        <div
                            className="aspect-video relative overflow-hidden"
                            style={{ backgroundColor: `${scheme.primary}10` }}
                        >
                            {card.imageUrl ? (
                                <img
                                    src={card.imageUrl}
                                    alt={card.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center"
                                    style={{ background: `linear-gradient(135deg, ${scheme.primary}20 0%, ${scheme.secondary}20 100%)` }}
                                >
                                    <div className="text-center p-4">
                                        <h3 className="font-bold text-lg" style={{ color: scheme.primary }}>{card.title}</h3>
                                    </div>
                                </div>
                            )}

                            {/* Loading overlay for image regeneration */}
                            {isRegeneratingImage === card.id && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}

                            {/* Card number badge */}
                            <div
                                className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: scheme.primary }}
                            >
                                {index + 1}
                            </div>

                            {/* Edit overlay on hover/select */}
                            <div className={`absolute inset-0 bg-black/50 flex items-center justify-center gap-2 transition-opacity ${selectedCard === card.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`}>
                                {card.imageUrl && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRegenerateImage(card.id, card.imagePrompt || card.title);
                                        }}
                                        disabled={isRegeneratingImage === card.id}
                                        className="p-2 bg-white rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                        title="Regenerate image"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isRegeneratingImage === card.id ? 'animate-spin' : ''}`} />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingCard(card);
                                    }}
                                    className="p-2 bg-white rounded-lg hover:bg-gray-100"
                                    title="Edit card"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Card Info */}
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{card.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">{card.content}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex justify-between">
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 flex items-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Outline
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={onPreview}
                        className="px-6 py-3 rounded-xl font-semibold border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                    >
                        <Play className="w-5 h-5" />
                        Present
                    </button>
                    <button
                        onClick={onFinish}
                        className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        Finish
                    </button>
                </div>
            </div>

            {/* Card Editor Modal */}
            <AnimatePresence>
                {editingCard && (
                    <CardEditor
                        card={{
                            id: editingCard.id,
                            title: editingCard.title,
                            subtitle: '',
                            content: editingCard.content,
                            bullets: editingCard.bullets,
                            imageUrl: editingCard.imageUrl,
                            imagePrompt: editingCard.imagePrompt,
                            layout: editingCard.layout,
                            templateId: editingCard.templateId
                        }}
                        colorScheme={scheme}
                        onSave={handleSaveCard}
                        onCancel={() => setEditingCard(null)}
                        onRegenerateImage={handleRegenerateCardImage}
                        isOpen={true}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ==========================================
// MAIN CREATOR COMPONENT
// ==========================================

export default function GammaCreator() {
    const [state, setState] = useState<CreatorState>({
        step: 1,
        topic: '',
        cardCount: 7,
        tone: 'professional',
        imageSource: 'auto',
        colorScheme: 'gamma',
        outline: [],
        generatedCards: [],
        isGenerating: false
    });
    const [generatingProgress, setGeneratingProgress] = useState(0);
    const [isRegeneratingImage, setIsRegeneratingImage] = useState<string | null>(null);
    const [showViewer, setShowViewer] = useState(false);

    const updateState = useCallback((updates: Partial<CreatorState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Generate outline from topic
    const generateOutline = async () => {
        updateState({ isGenerating: true });

        try {
            const response = await fetch('/api/presentations/gamma/outline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: state.topic,
                    cardCount: state.cardCount,
                    tone: state.tone
                })
            });

            if (response.ok) {
                const data = await response.json();
                updateState({
                    outline: data.outline,
                    isGenerating: false
                });
            } else {
                // Fallback: generate a basic outline
                const basicOutline: OutlineCard[] = [
                    { id: '1', title: 'Introduction', description: 'Opening slide', hasImage: true, imageType: 'hero' as const },
                    { id: '2', title: 'The Problem', description: 'What needs solving', hasImage: false, imageType: 'none' as const },
                    { id: '3', title: 'Our Solution', description: 'How we solve it', hasImage: true, imageType: 'side' as const },
                    { id: '4', title: 'Key Features', description: 'Main benefits', hasImage: false, imageType: 'none' as const },
                    { id: '5', title: 'How It Works', description: 'Process overview', hasImage: true, imageType: 'side' as const },
                    { id: '6', title: 'Results', description: 'Impact and metrics', hasImage: false, imageType: 'none' as const },
                    { id: '7', title: 'Next Steps', description: 'Call to action', hasImage: true, imageType: 'hero' as const }
                ].slice(0, state.cardCount);

                updateState({
                    outline: basicOutline,
                    isGenerating: false
                });
            }
        } catch (error) {
            console.error('Failed to generate outline:', error);
            updateState({ isGenerating: false });
        }
    };

    // Generate full presentation
    const generatePresentation = async () => {
        updateState({ step: 6 });
        setGeneratingProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setGeneratingProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return prev;
                }
                return prev + 10;
            });
        }, 500);

        try {
            const response = await fetch('/api/presentations/gamma', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: state.topic,
                    outline: state.outline,
                    tone: state.tone,
                    imageSource: state.imageSource,
                    colorScheme: state.colorScheme
                })
            });

            clearInterval(progressInterval);
            setGeneratingProgress(100);

            if (response.ok) {
                const data = await response.json();
                updateState({
                    generatedCards: data.cards,
                    step: 7
                });
            } else {
                // Generate mock cards for preview
                const mockCards: GeneratedCard[] = state.outline.map((card, i) => ({
                    id: card.id,
                    title: card.title,
                    content: card.description || `Content for ${card.title}`,
                    imageUrl: card.hasImage ? `https://source.unsplash.com/800x600/?${encodeURIComponent(card.title)}` : undefined,
                    layout: i === 0 ? 'title-hero' : 'content-split',
                    templateId: 'gamma-default'
                }));

                updateState({
                    generatedCards: mockCards,
                    step: 7
                });
            }
        } catch (error) {
            clearInterval(progressInterval);
            console.error('Failed to generate presentation:', error);
        }
    };

    // Regenerate image for a card
    const regenerateImage = async (cardId: string, prompt: string): Promise<void> => {
        setIsRegeneratingImage(cardId);

        try {
            const response = await fetch('/api/presentations/gamma/images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    source: state.imageSource
                })
            });

            if (response.ok) {
                const data = await response.json();
                const newCards = state.generatedCards.map(card =>
                    card.id === cardId
                        ? { ...card, imageUrl: data.image.url, imagePrompt: prompt }
                        : card
                );
                updateState({ generatedCards: newCards });
            }
        } catch (error) {
            console.error('Failed to regenerate image:', error);
        } finally {
            setIsRegeneratingImage(null);
        }
    };

    // Step navigation
    const goToStep = (step: number) => updateState({ step });

    // Handle next step transitions
    const handleNext = (currentStep: number) => {
        if (currentStep === 4) {
            goToStep(5);
            generateOutline();
        } else if (currentStep === 5) {
            generatePresentation();
        } else {
            goToStep(currentStep + 1);
        }
    };

    // Progress indicator
    const steps = ['Topic', 'Cards', 'Tone', 'Style', 'Outline', 'Generate', 'Preview'];

    // Get color scheme for viewer
    const scheme = COLOR_SCHEMES.find(s => s.value === state.colorScheme) || COLOR_SCHEMES[0];

    // Convert to Presentation format for viewer
    const presentation: Presentation = {
        id: `presentation-${Date.now()}`,
        title: state.topic || 'Untitled Presentation',
        cards: state.generatedCards.map(card => ({
            id: card.id,
            title: card.title,
            subtitle: '',
            content: card.content,
            bullets: card.bullets,
            imageUrl: card.imageUrl,
            layout: card.layout
        })),
        colorScheme: {
            primary: scheme.primary,
            secondary: scheme.secondary
        },
        createdAt: new Date().toISOString()
    };

    // Show presentation viewer
    if (showViewer) {
        return (
            <PresentationViewer
                presentation={presentation}
                onClose={() => setShowViewer(false)}
                onEdit={() => setShowViewer(false)}
                mode="fullscreen"
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Progress Bar */}
            <div className="sticky top-0 z-10 bg-white border-b">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                        {steps.map((stepName, i) => (
                            <div key={i} className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${i + 1 < state.step
                                        ? 'bg-green-500 text-white'
                                        : i + 1 === state.step
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                        }`}
                                >
                                    {i + 1 < state.step ? <Check className="w-4 h-4" /> : i + 1}
                                </div>
                                {i < steps.length - 1 && (
                                    <div className={`w-12 h-0.5 mx-1 ${i + 1 < state.step ? 'bg-green-500' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        {steps.map((stepName, i) => (
                            <span key={i} className={state.step === i + 1 ? 'text-indigo-600 font-medium' : ''}>
                                {stepName}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="py-12 px-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={state.step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {state.step === 1 && (
                            <TopicStep
                                topic={state.topic}
                                setTopic={(t) => updateState({ topic: t })}
                                onNext={() => handleNext(1)}
                            />
                        )}
                        {state.step === 2 && (
                            <CardCountStep
                                cardCount={state.cardCount}
                                setCardCount={(c) => updateState({ cardCount: c })}
                                onNext={() => handleNext(2)}
                                onBack={() => goToStep(1)}
                            />
                        )}
                        {state.step === 3 && (
                            <ToneStep
                                tone={state.tone}
                                setTone={(t) => updateState({ tone: t })}
                                onNext={() => handleNext(3)}
                                onBack={() => goToStep(2)}
                            />
                        )}
                        {state.step === 4 && (
                            <ImageSourceStep
                                imageSource={state.imageSource}
                                setImageSource={(s) => updateState({ imageSource: s })}
                                colorScheme={state.colorScheme}
                                setColorScheme={(c) => updateState({ colorScheme: c })}
                                onNext={() => handleNext(4)}
                                onBack={() => goToStep(3)}
                            />
                        )}
                        {state.step === 5 && (
                            <OutlineStep
                                outline={state.outline}
                                setOutline={(o) => updateState({ outline: o })}
                                onNext={() => handleNext(5)}
                                onBack={() => goToStep(4)}
                                onRegenerate={generateOutline}
                                isGenerating={state.isGenerating}
                            />
                        )}
                        {state.step === 6 && (
                            <GeneratingStep progress={generatingProgress} />
                        )}
                        {state.step === 7 && (
                            <PreviewStep
                                cards={state.generatedCards}
                                colorScheme={state.colorScheme}
                                presentationTitle={state.topic}
                                onBack={() => goToStep(5)}
                                onFinish={() => {
                                    console.log('Presentation saved!', state.generatedCards);
                                    alert('Presentation created successfully! 🎉');
                                }}
                                onPreview={() => setShowViewer(true)}
                                onRegenerateImage={regenerateImage}
                                onEditCard={(id, updates) => {
                                    const newCards = state.generatedCards.map(c =>
                                        c.id === id ? { ...c, ...updates } : c
                                    );
                                    updateState({ generatedCards: newCards });
                                }}
                                isRegeneratingImage={isRegeneratingImage}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
