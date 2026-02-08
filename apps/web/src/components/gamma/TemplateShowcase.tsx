'use client';

/**
 * 🎨 Template Showcase Page
 * Interactive gallery showcasing all 200+ Gamma-style templates
 * with live previews, filters, and the template wizard
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Layout, Search, Filter, Wand2, Grid3X3, List,
    ChevronDown, X, Download, Copy, Eye, Briefcase, Megaphone,
    GraduationCap, TrendingUp, Target, FileText, Presentation,
    ArrowRight, Check, Star, Palette
} from 'lucide-react';
import TemplateWizard, { WizardState } from './TemplateWizard';

// ==========================================
// TEMPLATE DATA STRUCTURES
// ==========================================

interface Template {
    id: string;
    name: string;
    category: string;
    useCase: string;
    description: string;
    layout: string;
    hasImage: boolean;
    cardCount?: number;
    popularity?: number;
    isNew?: boolean;
}

// Use case definitions
const USE_CASES = [
    { id: 'all', label: 'All Templates', icon: Grid3X3, color: '#6366f1' },
    { id: 'pitch', label: 'Pitch Deck', icon: TrendingUp, color: '#10b981' },
    { id: 'sales', label: 'Sales Deck', icon: Target, color: '#0ea5e9' },
    { id: 'marketing', label: 'Marketing', icon: Megaphone, color: '#f59e0b' },
    { id: 'training', label: 'Training', icon: GraduationCap, color: '#8b5cf6' },
    { id: 'investor', label: 'Investor', icon: Briefcase, color: '#64748b' },
    { id: 'annual', label: 'Annual Report', icon: FileText, color: '#14b8a6' },
    { id: 'general', label: 'General', icon: Presentation, color: '#ec4899' }
];

// Category definitions
const CATEGORIES = [
    { id: 'all', label: 'All Types', emoji: '✨' },
    { id: 'title', label: 'Title Slides', emoji: '🎯' },
    { id: 'stats', label: 'Statistics', emoji: '📊' },
    { id: 'content', label: 'Content', emoji: '📝' },
    { id: 'features', label: 'Features', emoji: '⚡' },
    { id: 'cards', label: 'Cards', emoji: '🃏' },
    { id: 'timeline', label: 'Timeline', emoji: '📅' },
    { id: 'quote', label: 'Quotes', emoji: '💬' },
    { id: 'compare', label: 'Compare', emoji: '⚖️' },
    { id: 'team', label: 'Team', emoji: '👥' },
    { id: 'cta', label: 'CTA', emoji: '🚀' }
];

// Theme options for preview
const THEMES = [
    { id: 'gamma', name: 'Gamma', primary: '#403CCF', bg: '#FFFFFF' },
    { id: 'corporate', name: 'Corporate', primary: '#1e40af', bg: '#FFFFFF' },
    { id: 'modern', name: 'Teal', primary: '#0d9488', bg: '#FFFFFF' },
    { id: 'warm', name: 'Warm', primary: '#ea580c', bg: '#fffbeb' },
    { id: 'dark', name: 'Dark', primary: '#a78bfa', bg: '#0f172a' },
    { id: 'elegant', name: 'Rose', primary: '#be185d', bg: '#fff1f2' }
];

// Sample templates (comprehensive list)
const ALL_TEMPLATES: Template[] = [
    // Pitch Deck Templates
    { id: 'pitch-problem', name: 'Problem Statement', category: 'content', useCase: 'pitch', description: 'Highlight the problem you solve', layout: 'split', hasImage: true, popularity: 95, isNew: false },
    { id: 'pitch-solution', name: 'Solution Overview', category: 'content', useCase: 'pitch', description: 'Present your solution', layout: 'split', hasImage: true, popularity: 98 },
    { id: 'pitch-tam-sam-som', name: 'TAM SAM SOM', category: 'stats', useCase: 'pitch', description: 'Market size breakdown', layout: 'stats-grid', hasImage: false, cardCount: 3, popularity: 90 },
    { id: 'pitch-business-model', name: 'Business Model', category: 'features', useCase: 'pitch', description: 'Revenue streams', layout: 'features-3col', hasImage: false, cardCount: 3, popularity: 85 },
    { id: 'pitch-traction', name: 'Traction Metrics', category: 'stats', useCase: 'pitch', description: 'Key traction metrics', layout: 'stat-cards', hasImage: false, cardCount: 3, popularity: 92 },
    { id: 'pitch-funding-ask', name: 'Funding Ask', category: 'cta', useCase: 'pitch', description: 'Investment ask', layout: 'cta-gradient', hasImage: false, popularity: 88 },
    { id: 'pitch-team', name: 'Team Spotlight', category: 'team', useCase: 'pitch', description: 'Founding team', layout: 'team-3col', hasImage: true, cardCount: 3, popularity: 87 },

    // Sales Templates
    { id: 'sales-hook', name: 'Opening Hook', category: 'content', useCase: 'sales', description: 'Attention-grabbing opener', layout: 'split', hasImage: true, popularity: 94 },
    { id: 'sales-pain-points', name: 'Pain Points', category: 'cards', useCase: 'sales', description: 'Customer pain points', layout: 'cards-3', hasImage: false, cardCount: 3, popularity: 89 },
    { id: 'sales-roi-calculator', name: 'ROI Calculator', category: 'stats', useCase: 'sales', description: 'Return on investment', layout: 'stat-cards', hasImage: false, cardCount: 3, popularity: 91 },
    { id: 'sales-case-study-mini', name: 'Success Story', category: 'quote', useCase: 'sales', description: 'Quick customer success', layout: 'quote-image', hasImage: true, popularity: 86 },
    { id: 'sales-closing', name: 'Closing Slide', category: 'cta', useCase: 'sales', description: 'Final call to action', layout: 'cta-gradient', hasImage: false, popularity: 93 },

    // Marketing Templates
    { id: 'social-campaign-overview', name: 'Campaign Overview', category: 'title', useCase: 'marketing', description: 'Campaign introduction', layout: 'title-gradient', hasImage: false, popularity: 88, isNew: true },
    { id: 'social-audience-personas', name: 'Audience Personas', category: 'team', useCase: 'marketing', description: 'Target audience breakdown', layout: 'team-3col', hasImage: true, cardCount: 3, popularity: 82 },
    { id: 'social-platform-strategy', name: 'Platform Strategy', category: 'features', useCase: 'marketing', description: 'Per-platform approach', layout: 'features-4col', hasImage: false, cardCount: 4, popularity: 79 },
    { id: 'social-kpis', name: 'Campaign KPIs', category: 'stats', useCase: 'marketing', description: 'Target metrics', layout: 'stats-grid', hasImage: false, cardCount: 4, popularity: 85 },
    { id: 'brand-values', name: 'Brand Values', category: 'features', useCase: 'marketing', description: 'Core values', layout: 'features-3col', hasImage: false, cardCount: 3, popularity: 81 },
    { id: 'brand-color-palette', name: 'Color Palette', category: 'features', useCase: 'marketing', description: 'Brand colors', layout: 'features-4col', hasImage: false, cardCount: 4, popularity: 77, isNew: true },

    // Training Templates
    { id: 'training-welcome', name: 'Training Welcome', category: 'title', useCase: 'training', description: 'Session opener', layout: 'title-gradient', hasImage: false, popularity: 90 },
    { id: 'training-agenda', name: 'Training Agenda', category: 'features', useCase: 'training', description: 'Session modules', layout: 'features-4col', hasImage: false, cardCount: 4, popularity: 88 },
    { id: 'training-objectives', name: 'Learning Objectives', category: 'content', useCase: 'training', description: 'What you will learn', layout: 'content-bullets', hasImage: false, popularity: 92 },
    { id: 'training-concept', name: 'Concept Explanation', category: 'content', useCase: 'training', description: 'Key concept with visual', layout: 'split', hasImage: true, popularity: 85 },
    { id: 'training-step-by-step', name: 'Step-by-Step Guide', category: 'timeline', useCase: 'training', description: 'Process walkthrough', layout: 'timeline-vertical', hasImage: false, popularity: 89 },
    { id: 'training-quiz', name: 'Knowledge Check', category: 'cards', useCase: 'training', description: 'Quick quiz', layout: 'cards-3', hasImage: false, cardCount: 3, popularity: 83 },
    { id: 'training-key-takeaways', name: 'Key Takeaways', category: 'features', useCase: 'training', description: 'Session summary', layout: 'features-3col', hasImage: false, cardCount: 3, popularity: 91 },

    // Investor Update Templates
    { id: 'investor-quarterly-cover', name: 'Quarterly Cover', category: 'title', useCase: 'investor', description: 'Q update cover', layout: 'title-minimal', hasImage: false, popularity: 87 },
    { id: 'investor-key-metrics', name: 'Key Metrics', category: 'stats', useCase: 'investor', description: 'Performance indicators', layout: 'stat-cards', hasImage: false, cardCount: 3, popularity: 94 },
    { id: 'investor-revenue-breakdown', name: 'Revenue Breakdown', category: 'features', useCase: 'investor', description: 'Revenue by segment', layout: 'features-4col', hasImage: false, cardCount: 4, popularity: 88 },
    { id: 'investor-guidance', name: 'Forward Guidance', category: 'content', useCase: 'investor', description: 'Future expectations', layout: 'content-bullets', hasImage: false, popularity: 82 },

    // Annual Report Templates
    { id: 'annual-cover', name: 'Annual Report Cover', category: 'title', useCase: 'annual', description: 'Year-end cover', layout: 'title-gradient', hasImage: false, popularity: 86 },
    { id: 'annual-ceo-letter', name: 'CEO Letter', category: 'content', useCase: 'annual', description: 'Message from leadership', layout: 'split', hasImage: true, popularity: 84 },
    { id: 'annual-year-highlights', name: 'Year Highlights', category: 'stats', useCase: 'annual', description: 'Key achievements', layout: 'stats-grid', hasImage: false, cardCount: 4, popularity: 92 },
    { id: 'annual-milestones', name: 'Year Milestones', category: 'timeline', useCase: 'annual', description: 'Key moments', layout: 'timeline-vertical', hasImage: false, popularity: 85 },

    // General Templates
    { id: 'gamma-title-minimal', name: 'Minimal Title', category: 'title', useCase: 'general', description: 'Clean title slide', layout: 'title-minimal', hasImage: false, popularity: 95 },
    { id: 'gamma-title-gradient', name: 'Gradient Title', category: 'title', useCase: 'general', description: 'Bold gradient title', layout: 'title-gradient', hasImage: false, popularity: 93 },
    { id: 'gamma-stat-featured', name: 'Featured Stat', category: 'stats', useCase: 'general', description: 'Large stat display', layout: 'stat-featured', hasImage: false, popularity: 91 },
    { id: 'gamma-stat-with-cards', name: 'Stat with Cards', category: 'stats', useCase: 'general', description: 'Stat + info cards', layout: 'stat-cards', hasImage: false, cardCount: 3, popularity: 94 },
    { id: 'gamma-content-bullets', name: 'Bullet List', category: 'content', useCase: 'general', description: 'Title with bullets', layout: 'content-bullets', hasImage: false, popularity: 89 },
    { id: 'gamma-features-3col', name: '3-Column Features', category: 'features', useCase: 'general', description: 'Three features', layout: 'features-3col', hasImage: false, cardCount: 3, popularity: 88 },
    { id: 'gamma-features-4col', name: '4-Column Features', category: 'features', useCase: 'general', description: 'Four features', layout: 'features-4col', hasImage: false, cardCount: 4, popularity: 86 },
    { id: 'gamma-timeline-vertical', name: 'Vertical Timeline', category: 'timeline', useCase: 'general', description: 'Events timeline', layout: 'timeline-vertical', hasImage: false, popularity: 87 },
    { id: 'gamma-quote-centered', name: 'Centered Quote', category: 'quote', useCase: 'general', description: 'Large quote', layout: 'quote-centered', hasImage: false, popularity: 90 },
    { id: 'gamma-compare-side', name: 'Side by Side', category: 'compare', useCase: 'general', description: 'Comparison columns', layout: 'compare-side', hasImage: false, cardCount: 2, popularity: 85 },
    { id: 'gamma-cta-gradient', name: 'Gradient CTA', category: 'cta', useCase: 'general', description: 'Call to action', layout: 'cta-gradient', hasImage: false, popularity: 92 }
];

// ==========================================
// TEMPLATE CARD COMPONENT
// ==========================================

function TemplateCard({
    template,
    theme,
    onPreview,
    onUse
}: {
    template: Template;
    theme: typeof THEMES[0];
    onPreview: () => void;
    onUse: () => void;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const category = CATEGORIES.find(c => c.id === template.category);
    const useCase = USE_CASES.find(u => u.id === template.useCase);
    const UseCaseIcon = useCase?.icon || Layout;

    // Generate visual preview based on layout
    const renderPreview = () => {
        const layout = template.layout;

        return (
            <div className="w-full h-full p-3 flex flex-col" style={{ backgroundColor: theme.bg }}>
                {/* Title layouts */}
                {layout.includes('title') && (
                    <div className="flex-1 flex flex-col justify-center items-center text-center">
                        {layout.includes('gradient') && (
                            <div
                                className="absolute inset-0 rounded-t-lg"
                                style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}cc 100%)` }}
                            />
                        )}
                        <div className="relative z-10">
                            <div
                                className="h-4 w-32 rounded mb-2 mx-auto"
                                style={{ backgroundColor: layout.includes('gradient') ? 'white' : theme.primary }}
                            />
                            <div
                                className="h-2 w-24 rounded mx-auto"
                                style={{ backgroundColor: layout.includes('gradient') ? 'rgba(255,255,255,0.6)' : '#94a3b8' }}
                            />
                        </div>
                    </div>
                )}

                {/* Stats layouts */}
                {layout.includes('stat') && (
                    <div className="flex-1 flex flex-col">
                        <div className="h-3 w-20 rounded mb-3" style={{ backgroundColor: theme.primary }} />
                        <div className="flex gap-2 flex-1">
                            <div className="w-1/3 p-2 rounded" style={{ backgroundColor: theme.primary }}>
                                <div className="h-5 w-full bg-white/30 rounded mb-1" />
                                <div className="h-2 w-3/4 bg-white/20 rounded" />
                            </div>
                            {template.cardCount && template.cardCount > 1 && (
                                <div className="flex-1 flex gap-1">
                                    {Array.from({ length: Math.min(3, template.cardCount) }).map((_, i) => (
                                        <div key={i} className="flex-1 p-1 rounded bg-gray-100">
                                            <div className="h-3 w-full rounded mb-1" style={{ backgroundColor: `${theme.primary}40` }} />
                                            <div className="h-1 w-3/4 bg-gray-200 rounded" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Features layouts */}
                {layout.includes('features') && (
                    <div className="flex-1 flex flex-col">
                        <div className="h-3 w-16 rounded mb-2" style={{ backgroundColor: theme.primary }} />
                        <div className="grid gap-1.5 flex-1" style={{ gridTemplateColumns: `repeat(${template.cardCount || 3}, 1fr)` }}>
                            {Array.from({ length: template.cardCount || 3 }).map((_, i) => (
                                <div key={i} className="p-1.5 rounded" style={{ backgroundColor: `${theme.primary}10` }}>
                                    <div className="w-4 h-4 rounded mb-1" style={{ backgroundColor: `${theme.primary}30` }} />
                                    <div className="h-2 w-full rounded mb-0.5" style={{ backgroundColor: `${theme.primary}40` }} />
                                    <div className="h-1 w-3/4 bg-gray-200 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content layouts */}
                {(layout.includes('content') || layout.includes('split')) && !layout.includes('stat') && !layout.includes('features') && (
                    <div className="flex-1 flex gap-2">
                        <div className="flex-1 flex flex-col">
                            <div className="h-3 w-16 rounded mb-2" style={{ backgroundColor: theme.primary }} />
                            <div className="space-y-1">
                                <div className="h-1.5 w-full bg-gray-200 rounded" />
                                <div className="h-1.5 w-5/6 bg-gray-200 rounded" />
                                <div className="h-1.5 w-4/6 bg-gray-200 rounded" />
                            </div>
                        </div>
                        {template.hasImage && (
                            <div className="w-1/3 rounded" style={{ backgroundColor: `${theme.primary}20` }} />
                        )}
                    </div>
                )}

                {/* Timeline layouts */}
                {layout.includes('timeline') && (
                    <div className="flex-1 flex flex-col">
                        <div className="h-3 w-16 rounded mb-2" style={{ backgroundColor: theme.primary }} />
                        <div className="flex gap-2 flex-1">
                            <div className="w-1 rounded-full" style={{ backgroundColor: theme.primary }} />
                            <div className="flex-1 space-y-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-1 items-start">
                                        <div className="w-2 h-2 rounded-full mt-0.5" style={{ backgroundColor: theme.primary }} />
                                        <div className="flex-1">
                                            <div className="h-2 w-12 rounded mb-0.5" style={{ backgroundColor: `${theme.primary}40` }} />
                                            <div className="h-1 w-full bg-gray-200 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Quote layouts */}
                {layout.includes('quote') && (
                    <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
                        <div className="h-3 w-4 rounded mb-2" style={{ backgroundColor: theme.primary }} />
                        <div className="space-y-1 mb-2">
                            <div className="h-2 w-24 bg-gray-200 rounded mx-auto" />
                            <div className="h-2 w-20 bg-gray-200 rounded mx-auto" />
                        </div>
                        <div className="h-1.5 w-12 rounded" style={{ backgroundColor: `${theme.primary}40` }} />
                    </div>
                )}

                {/* Compare layouts */}
                {layout.includes('compare') && (
                    <div className="flex-1 flex flex-col">
                        <div className="h-3 w-16 rounded mb-2" style={{ backgroundColor: theme.primary }} />
                        <div className="grid grid-cols-2 gap-2 flex-1">
                            <div className="p-2 rounded bg-gray-100">
                                <div className="h-2 w-12 bg-gray-300 rounded mb-1" />
                                <div className="h-1 w-full bg-gray-200 rounded" />
                            </div>
                            <div className="p-2 rounded" style={{ backgroundColor: theme.primary }}>
                                <div className="h-2 w-12 bg-white/50 rounded mb-1" />
                                <div className="h-1 w-full bg-white/30 rounded" />
                            </div>
                        </div>
                    </div>
                )}

                {/* CTA layouts */}
                {layout.includes('cta') && (
                    <div
                        className="flex-1 flex flex-col justify-center items-center rounded-lg"
                        style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}cc 100%)` }}
                    >
                        <div className="h-4 w-24 bg-white/30 rounded mb-2" />
                        <div className="h-2 w-16 bg-white/20 rounded mb-3" />
                        <div className="h-6 w-20 bg-white rounded" />
                    </div>
                )}

                {/* Cards layouts */}
                {layout.includes('cards') && !layout.includes('stat') && (
                    <div className="flex-1 flex flex-col">
                        <div className="h-3 w-16 rounded mb-2" style={{ backgroundColor: theme.primary }} />
                        <div className="grid gap-1.5 flex-1" style={{ gridTemplateColumns: `repeat(${template.cardCount || 3}, 1fr)` }}>
                            {Array.from({ length: template.cardCount || 3 }).map((_, i) => (
                                <div key={i} className="p-1.5 rounded bg-gray-50 border border-gray-100">
                                    <div className="h-2 w-full rounded mb-1" style={{ backgroundColor: `${theme.primary}30` }} />
                                    <div className="h-1 w-3/4 bg-gray-200 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Team layouts */}
                {layout.includes('team') && (
                    <div className="flex-1 flex flex-col">
                        <div className="h-3 w-16 rounded mb-2" style={{ backgroundColor: theme.primary }} />
                        <div className="grid grid-cols-3 gap-1.5 flex-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex flex-col items-center p-1.5 rounded bg-gray-50">
                                    <div className="w-6 h-6 rounded-full mb-1" style={{ backgroundColor: `${theme.primary}30` }} />
                                    <div className="h-1.5 w-10 rounded mb-0.5" style={{ backgroundColor: `${theme.primary}40` }} />
                                    <div className="h-1 w-8 bg-gray-200 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all group"
        >
            {/* Preview thumbnail */}
            <div className="relative h-36 overflow-hidden bg-gray-50">
                {renderPreview()}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                    {template.isNew && (
                        <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">NEW</span>
                    )}
                    {template.popularity && template.popularity >= 90 && (
                        <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5" /> Popular
                        </span>
                    )}
                </div>

                {/* Hover overlay */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2"
                        >
                            <button
                                onClick={onPreview}
                                className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                                title="Preview"
                            >
                                <Eye className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                                onClick={onUse}
                                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" />
                                Use
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Info */}
            <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                    <span>{category?.emoji}</span>
                    <h3 className="font-medium text-gray-900 text-sm truncate">{template.name}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-1">{template.description}</p>

                <div className="flex items-center justify-between">
                    <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ backgroundColor: `${useCase?.color}15`, color: useCase?.color }}
                    >
                        <UseCaseIcon className="w-3 h-3" />
                        {useCase?.label}
                    </div>
                    {template.cardCount && (
                        <span className="text-[10px] text-gray-400">{template.cardCount} cards</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ==========================================
// MAIN SHOWCASE PAGE
// ==========================================

export default function TemplateShowcase() {
    // State
    const [activeUseCase, setActiveUseCase] = useState('all');
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTheme, setCurrentTheme] = useState(THEMES[0]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showWizard, setShowWizard] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filter templates
    const filteredTemplates = useMemo(() => {
        return ALL_TEMPLATES.filter(t => {
            const matchesUseCase = activeUseCase === 'all' || t.useCase === activeUseCase;
            const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
            const matchesSearch = !searchQuery ||
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesUseCase && matchesCategory && matchesSearch;
        }).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }, [activeUseCase, activeCategory, searchQuery]);

    const handleWizardComplete = (state: WizardState) => {
        console.log('Wizard complete:', state);
        setShowWizard(false);
        // Here you would typically navigate to create presentation with selected templates
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Hero Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                                <Sparkles className="w-10 h-10" />
                                Template Showcase
                            </h1>
                            <p className="text-xl text-indigo-100">
                                {ALL_TEMPLATES.length}+ professional presentation templates
                            </p>
                        </div>

                        <button
                            onClick={() => setShowWizard(true)}
                            className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-lg"
                        >
                            <Wand2 className="w-5 h-5" />
                            Template Wizard
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search templates..."
                                title="Search templates"
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            />
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3">
                            {/* Theme selector */}
                            <div className="flex items-center gap-2">
                                <Palette className="w-4 h-4 text-gray-400" />
                                <div className="flex gap-1">
                                    {THEMES.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setCurrentTheme(t)}
                                            className={`w-6 h-6 rounded-full border-2 transition-all ${currentTheme.id === t.id ? 'border-gray-900 scale-110' : 'border-gray-200'
                                                }`}
                                            style={{ background: t.primary }}
                                            title={t.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* View mode */}
                            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                                    title="Grid view"
                                >
                                    <Grid3X3 className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                                    title="List view"
                                >
                                    <List className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>

                            {/* Filter toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 rounded-lg border ${showFilters ? 'bg-indigo-50 border-indigo-200' : 'border-gray-200 hover:bg-gray-50'}`}
                                title="Toggle filters"
                            >
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Use Case Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {USE_CASES.map(useCase => {
                            const Icon = useCase.icon;
                            const isActive = activeUseCase === useCase.id;
                            const count = useCase.id === 'all'
                                ? ALL_TEMPLATES.length
                                : ALL_TEMPLATES.filter(t => t.useCase === useCase.id).length;

                            return (
                                <button
                                    key={useCase.id}
                                    onClick={() => setActiveUseCase(useCase.id)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${isActive
                                            ? 'text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    style={{
                                        backgroundColor: isActive ? useCase.color : undefined
                                    }}
                                >
                                    <Icon className="w-4 h-4" />
                                    {useCase.label}
                                    <span className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                                        ({count})
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Category Filters (collapsible) */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="flex gap-2 pt-4 pb-2 overflow-x-auto scrollbar-hide">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex items-center gap-1 transition-colors ${activeCategory === cat.id
                                                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            <span>{cat.emoji}</span>
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Results count */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-medium text-gray-900">{filteredTemplates.length}</span> templates
                    </p>
                    {(searchQuery || activeUseCase !== 'all' || activeCategory !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setActiveUseCase('all');
                                setActiveCategory('all');
                            }}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                <div className={`grid gap-4 ${viewMode === 'grid'
                        ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
                        : 'grid-cols-1 md:grid-cols-2'
                    }`}>
                    <AnimatePresence mode="popLayout">
                        {filteredTemplates.map((template) => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                theme={currentTheme}
                                onPreview={() => setSelectedTemplate(template)}
                                onUse={() => {
                                    console.log('Use template:', template.id);
                                    // Navigate to editor with template
                                }}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {filteredTemplates.length === 0 && (
                    <div className="text-center py-16">
                        <Layout className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No templates found</p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setActiveUseCase('all');
                                setActiveCategory('all');
                            }}
                            className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

            {/* Template Wizard Modal */}
            <AnimatePresence>
                {showWizard && (
                    <TemplateWizard
                        onComplete={handleWizardComplete}
                        onCancel={() => setShowWizard(false)}
                    />
                )}
            </AnimatePresence>

            {/* Template Preview Modal */}
            <AnimatePresence>
                {selectedTemplate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-8"
                        onClick={() => setSelectedTemplate(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedTemplate.name}</h3>
                                    <p className="text-gray-500">{selectedTemplate.description}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedTemplate(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                    title="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                <p className="text-gray-400">Full preview coming soon</p>
                            </div>
                            <div className="p-6 bg-gray-50 flex items-center justify-between">
                                <div className="flex gap-4">
                                    {THEMES.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setCurrentTheme(t)}
                                            className={`w-8 h-8 rounded-full border-2 ${currentTheme.id === t.id ? 'border-gray-900' : 'border-gray-200'}`}
                                            style={{ background: t.primary }}
                                            title={t.name}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={() => {
                                        console.log('Using template:', selectedTemplate.id);
                                        setSelectedTemplate(null);
                                    }}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Use This Template
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
