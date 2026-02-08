'use client';

/**
 * 🎴 Gamma Template Gallery
 * Browse and select templates to start presentations
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layout, Briefcase, GraduationCap, Palette, Zap,
    Search, Plus, Sparkles, ArrowRight
} from 'lucide-react';
import { BUILTIN_TEMPLATES, GammaTemplate, createPresentationFromTemplate } from '@/lib/gamma/templates';
import type { GammaPresentation } from '@/lib/gamma/types';

interface TemplateGalleryProps {
    onSelectTemplate: (presentation: GammaPresentation) => void;
    onRemixTemplate?: (template: GammaTemplate) => void;
}

const CATEGORIES = [
    { id: 'all', label: 'All Templates', icon: Layout },
    { id: 'business', label: 'Business', icon: Briefcase },
    { id: 'marketing', label: 'Marketing', icon: Zap },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'creative', label: 'Creative', icon: Palette },
    { id: 'personal', label: 'Personal', icon: Sparkles },
];

export function TemplateGallery({ onSelectTemplate, onRemixTemplate }: TemplateGalleryProps) {
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<GammaTemplate | null>(null);

    const filteredTemplates = BUILTIN_TEMPLATES.filter(template => {
        const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
        const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleSelect = (template: GammaTemplate) => {
        const presentation = createPresentationFromTemplate(template);
        onSelectTemplate(presentation);
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b bg-white dark:bg-slate-950">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    Start with a Template
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Choose a professionally designed template to jumpstart your presentation.
                </p>

                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    {/* Categories */}
                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
                                    ${activeCategory === cat.id
                                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <cat.icon className="w-4 h-4" />
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* New Blank Presentation Card */}
                    <motion.button
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all text-center h-[280px]"
                        onClick={() => {
                            // Create generic blank presentation
                            const blank = createPresentationFromTemplate({
                                id: 'blank',
                                title: 'Untitled Presentation',
                                description: 'Start from scratch',
                                category: 'personal',
                                thumbnail: '',
                                themeId: 'clean-white',
                                cards: 1,
                                structure: [{ title: '', layout: 'title-centered', note: '' }]
                            });
                            onSelectTemplate(blank);
                        }}
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6 text-slate-400 group-hover:text-purple-500" />
                        </div>
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Start from Scratch</h3>
                        <p className="text-sm text-slate-500 mt-1">Empty deck</p>
                    </motion.button>

                    {/* Template Cards */}
                    <AnimatePresence mode='popLayout'>
                        {filteredTemplates.map((template) => (
                            <motion.div
                                layout
                                key={template.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border border-slate-200 dark:border-slate-700 flex flex-col h-[280px]"
                            >
                                {/* Thumbnail */}
                                <div className="h-40 overflow-hidden relative">
                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                                        <button
                                            onClick={() => handleSelect(template)}
                                            className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-100 flex items-center gap-2"
                                        >
                                            Use Template
                                        </button>
                                        {onRemixTemplate && (
                                            <button
                                                onClick={() => onRemixTemplate(template)}
                                                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                                title="Remix with AI"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <img
                                        src={template.thumbnail}
                                        alt={template.title}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-[10px] text-white font-medium flex items-center gap-1">
                                        <Layout className="w-3 h-3" />
                                        {template.cards} slides
                                    </div>
                                </div>

                                /* Content */
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-semibold text-slate-900 dark:text-white truncate" title={template.title}>
                                        {template.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 flex-1">
                                        {template.description}
                                    </p>

                                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t pt-3 dark:border-slate-700">
                                        <span className="capitalize px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                                            {template.category}
                                        </span>
                                        <button
                                            onClick={() => handleSelect(template)}
                                            className="text-purple-600 dark:text-purple-400 font-medium hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Preview
                                            <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default TemplateGallery;
