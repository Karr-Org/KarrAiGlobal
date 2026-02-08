'use client';

/**
 * 📦 Preset Pack Selector
 * Browse and select pre-built presentation templates
 * Complete decks with optimized slide order
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Clock, Layers, Star, ChevronRight, Check, X,
    Sparkles, Filter, Search, Eye, ArrowRight, Zap
} from 'lucide-react';
import {
    PresetPack,
    ALL_PRESET_PACKS,
    PACK_CATEGORIES,
    getPresetPackById
} from '@/lib/gamma/preset-packs';

// ==========================================
// PACK CARD COMPONENT
// ==========================================

function PackCard({
    pack,
    onSelect,
    onPreview,
    isSelected
}: {
    pack: PresetPack;
    onSelect: () => void;
    onPreview: () => void;
    isSelected: boolean;
}) {
    const difficultyColors = {
        beginner: { bg: '#dcfce7', text: '#166534' },
        intermediate: { bg: '#fef3c7', text: '#92400e' },
        advanced: { bg: '#fce7f3', text: '#9d174d' }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className={`relative bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all group ${isSelected
                    ? 'border-indigo-500 shadow-lg shadow-indigo-100'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-lg'
                }`}
            onClick={onSelect}
        >
            {/* Header */}
            <div
                className="px-5 py-4 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${pack.color}15 0%, ${pack.color}05 100%)` }}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{pack.emoji}</span>
                        <div>
                            <h3 className="font-semibold text-gray-900">{pack.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span
                                    className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                                    style={{
                                        backgroundColor: difficultyColors[pack.difficulty].bg,
                                        color: difficultyColors[pack.difficulty].text
                                    }}
                                >
                                    {pack.difficulty}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">{pack.category}</span>
                            </div>
                        </div>
                    </div>

                    {isSelected && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: pack.color }}
                        >
                            <Check className="w-4 h-4 text-white" />
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-5 py-4">
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{pack.description}</p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Layers className="w-4 h-4" />
                        <span>{pack.slideCount} slides</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{pack.estimatedTime}</span>
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                    {pack.tags.slice(0, 3).map(tag => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full"
                        >
                            {tag}
                        </span>
                    ))}
                    {pack.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-gray-400 text-[10px]">
                            +{pack.tags.length - 3} more
                        </span>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-gray-50 border-t flex items-center justify-between">
                <button
                    onClick={(e) => { e.stopPropagation(); onPreview(); }}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                    <Eye className="w-3.5 h-3.5" />
                    Preview slides
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                    className="text-sm font-medium flex items-center gap-1"
                    style={{ color: pack.color }}
                >
                    Use pack
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </motion.div>
    );
}

// ==========================================
// PACK PREVIEW MODAL
// ==========================================

function PackPreviewModal({
    pack,
    onClose,
    onUse
}: {
    pack: PresetPack;
    onClose: () => void;
    onUse: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="px-6 py-5 flex items-center justify-between"
                    style={{ background: `linear-gradient(135deg, ${pack.color}20 0%, ${pack.color}05 100%)` }}
                >
                    <div className="flex items-center gap-4">
                        <span className="text-4xl">{pack.emoji}</span>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{pack.name}</h2>
                            <p className="text-gray-600">{pack.description}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        title="Close"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Stats */}
                <div className="px-6 py-4 border-b flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-900">{pack.slideCount} slides</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-900">{pack.estimatedTime}</span>
                    </div>
                    <div className="flex gap-2">
                        {pack.tags.map(tag => (
                            <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Slides List */}
                <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                        Slide Structure
                    </h3>
                    <div className="space-y-2">
                        {pack.slides.map((slide, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                            >
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                                    style={{ backgroundColor: pack.color }}
                                >
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">{slide.name}</span>
                                        {slide.isRequired && (
                                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
                                                Required
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500">{slide.purpose}</p>
                                </div>
                                {slide.suggestedDuration && (
                                    <span className="text-xs text-gray-400">
                                        ~{Math.round(slide.suggestedDuration / 60)} min
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        <Star className="w-4 h-4 inline text-amber-500 mr-1" />
                        {pack.slides.filter(s => s.isRequired).length} required slides
                    </p>
                    <button
                        onClick={onUse}
                        className="px-6 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: pack.color }}
                    >
                        <Zap className="w-4 h-4" />
                        Use This Pack
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ==========================================
// MAIN PRESET PACK SELECTOR
// ==========================================

interface PresetPackSelectorProps {
    onSelectPack: (pack: PresetPack) => void;
    mode?: 'page' | 'modal';
    onClose?: () => void;
}

export default function PresetPackSelector({
    onSelectPack,
    mode = 'page',
    onClose
}: PresetPackSelectorProps) {
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [previewPack, setPreviewPack] = useState<PresetPack | null>(null);
    const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

    // Filter packs
    const filteredPacks = useMemo(() => {
        return ALL_PRESET_PACKS.filter(pack => {
            const matchesCategory = activeCategory === 'all' || pack.category === activeCategory;
            const matchesSearch = !searchQuery ||
                pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pack.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pack.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery]);

    const handleSelectPack = (pack: PresetPack) => {
        setSelectedPackId(pack.id);
        onSelectPack(pack);
    };

    const content = (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                <Package className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Preset Packs</h1>
                                <p className="text-sm text-gray-500">{ALL_PRESET_PACKS.length} ready-to-use presentation templates</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search packs..."
                                    title="Search packs"
                                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                />
                            </div>

                            {mode === 'modal' && onClose && (
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                    title="Close"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {PACK_CATEGORIES.map(cat => {
                            const count = cat.id === 'all'
                                ? ALL_PRESET_PACKS.length
                                : ALL_PRESET_PACKS.filter(p => p.category === cat.id).length;

                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${activeCategory === cat.id
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <span>{cat.emoji}</span>
                                    {cat.label}
                                    <span className={`text-xs ${activeCategory === cat.id ? 'text-gray-300' : 'text-gray-400'}`}>
                                        ({count})
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Packs Grid */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredPacks.map((pack) => (
                            <PackCard
                                key={pack.id}
                                pack={pack}
                                isSelected={selectedPackId === pack.id}
                                onSelect={() => handleSelectPack(pack)}
                                onPreview={() => setPreviewPack(pack)}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {filteredPacks.length === 0 && (
                    <div className="text-center py-16">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No packs found</p>
                        <button
                            onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                            className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
                {previewPack && (
                    <PackPreviewModal
                        pack={previewPack}
                        onClose={() => setPreviewPack(null)}
                        onUse={() => {
                            handleSelectPack(previewPack);
                            setPreviewPack(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );

    if (mode === 'modal') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 overflow-y-auto"
            >
                <div className="min-h-screen">
                    {content}
                </div>
            </motion.div>
        );
    }

    return content;
}
