'use client';

/**
 * 🎨 Enhanced Template Browser with Live Previews
 * Visual browser for all 150+ Gamma-style presentation templates
 * Features live template rendering with real content
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layout, Grid3X3, Type, BarChart3, Quote, GitBranch,
    Users, Zap, ArrowRight, X, Check, Eye, Search, Sparkles,
    ChevronLeft, ChevronRight, Palette, Maximize2, Download
} from 'lucide-react';

// Template interface
interface TemplatePreview {
    id: string;
    name: string;
    category: string;
    description: string;
    layout: string;
    hasImage: boolean;
    hasCards: boolean;
    cardCount?: number;
    sampleContent?: Record<string, string | string[]>;
}

// Template categories with icons and colors
const TEMPLATE_CATEGORIES = {
    title: { icon: Type, label: 'Title Slides', color: '#6366f1', emoji: '🎯' },
    stats: { icon: BarChart3, label: 'Statistics', color: '#10b981', emoji: '📊' },
    content: { icon: Layout, label: 'Content', color: '#3b82f6', emoji: '📝' },
    features: { icon: Grid3X3, label: 'Features', color: '#8b5cf6', emoji: '⚡' },
    cards: { icon: Layout, label: 'Cards', color: '#ec4899', emoji: '🃏' },
    timeline: { icon: GitBranch, label: 'Timeline', color: '#f59e0b', emoji: '📅' },
    quote: { icon: Quote, label: 'Quotes', color: '#06b6d4', emoji: '💬' },
    compare: { icon: ArrowRight, label: 'Comparison', color: '#ef4444', emoji: '⚖️' },
    team: { icon: Users, label: 'Team/Profile', color: '#14b8a6', emoji: '👥' },
    cta: { icon: Zap, label: 'Call to Action', color: '#f97316', emoji: '🚀' }
};

// Theme options
const THEMES = [
    { id: 'gamma', name: 'Gamma Purple', primary: '#403CCF', bg: '#FFFFFF' },
    { id: 'corporate', name: 'Corporate Blue', primary: '#1e40af', bg: '#FFFFFF' },
    { id: 'modern', name: 'Modern Teal', primary: '#0d9488', bg: '#FFFFFF' },
    { id: 'warm', name: 'Warm Orange', primary: '#ea580c', bg: '#fffbeb' },
    { id: 'dark', name: 'Dark Mode', primary: '#a78bfa', bg: '#0f172a' },
    { id: 'elegant', name: 'Elegant Rose', primary: '#be185d', bg: '#fff1f2' }
];

// Sample content for live previews
const SAMPLE_CONTENT: Record<string, Record<string, string | string[]>> = {
    'gamma-title-minimal': {
        title: 'The Future of AI',
        subtitle: 'Transforming Industries Through Intelligence'
    },
    'gamma-title-gradient': {
        title: 'Next-Gen Solutions',
        subtitle: 'Powering Tomorrow\'s Success'
    },
    'gamma-stat-featured': {
        title: 'Market Leadership',
        stat: '47%',
        statLabel: 'Market Share Growth',
        description: 'Year-over-year increase in market presence'
    },
    'gamma-stat-with-cards': {
        title: 'Key Metrics',
        stat: '$2.5M',
        statLabel: 'Monthly Revenue',
        card1Title: 'User Growth',
        card1Desc: '+156% increase in active users',
        card2Title: 'Retention',
        card2Desc: '94% customer retention rate',
        card3Title: 'NPS Score',
        card3Desc: 'Industry-leading satisfaction'
    },
    'gamma-features-4col': {
        title: 'Platform Capabilities',
        f1Title: 'AI-Powered',
        f1Desc: 'Advanced machine learning algorithms',
        f2Title: 'Real-Time',
        f2Desc: 'Instant data synchronization',
        f3Title: 'Scalable',
        f3Desc: 'Enterprise-grade infrastructure',
        f4Title: 'Secure',
        f4Desc: 'Bank-level encryption'
    },
    'gamma-content-bullets': {
        title: 'Strategic Priorities',
        intro: 'Our focus areas for the next quarter:',
        bullets: [
            'Expand market presence in APAC region',
            'Launch mobile application v2.0',
            'Implement advanced analytics dashboard',
            'Strengthen partnership ecosystem'
        ]
    },
    'gamma-quote-centered': {
        quote: 'This platform has fundamentally changed how we approach our business. The results speak for themselves.',
        author: 'Sarah Johnson',
        role: 'CEO, TechVentures Inc.'
    },
    'gamma-timeline-vertical': {
        title: 'Company Journey',
        event1Year: '2020',
        event1Title: 'Foundation',
        event1Desc: 'Started with a vision to transform the industry',
        event2Year: '2022',
        event2Title: 'Series A',
        event2Desc: 'Raised $15M to accelerate growth',
        event3Year: '2024',
        event3Title: 'Global Expansion',
        event3Desc: 'Launched in 12 new markets'
    },
    'gamma-compare-side': {
        title: 'Solution Comparison',
        leftTitle: 'Traditional Approach',
        rightTitle: 'Our Platform',
        leftPoints: ['Manual processes', 'Slow turnaround', 'Limited insights'],
        rightPoints: ['Fully automated', 'Real-time results', 'Deep analytics']
    },
    'gamma-cta-gradient': {
        title: 'Ready to Transform?',
        subtitle: 'Join thousands of companies already using our platform',
        cta: 'Get Started Today'
    }
};

// Live preview renderer
function LivePreview({
    template,
    theme,
    scale = 0.4
}: {
    template: TemplatePreview;
    theme: typeof THEMES[0];
    scale?: number;
}) {
    const content = SAMPLE_CONTENT[template.id] || {
        title: template.name,
        body: template.description
    };
    const categoryInfo = TEMPLATE_CATEGORIES[template.category as keyof typeof TEMPLATE_CATEGORIES];

    // Render different layouts
    const renderContent = () => {
        const layout = template.layout;

        // Title slides
        if (layout.includes('title')) {
            return (
                <div className="h-full flex flex-col justify-center px-8">
                    {layout.includes('gradient') && (
                        <div className="absolute inset-0" style={{
                            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}99 100%)`
                        }} />
                    )}
                    <div className="relative z-10">
                        <h1
                            className="text-4xl font-serif font-bold mb-4"
                            style={{ color: layout.includes('gradient') ? 'white' : theme.primary }}
                        >
                            {content.title}
                        </h1>
                        {content.subtitle && (
                            <p
                                className="text-xl"
                                style={{ color: layout.includes('gradient') ? 'rgba(255,255,255,0.9)' : '#666' }}
                            >
                                {content.subtitle}
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        // Stats
        if (layout.includes('stat')) {
            return (
                <div className="h-full flex flex-col px-8 py-6">
                    <h2 className="text-2xl font-serif mb-4" style={{ color: theme.primary }}>
                        {content.title}
                    </h2>
                    <div className="flex gap-4">
                        <div
                            className="px-6 py-4 rounded-lg"
                            style={{ background: theme.primary }}
                        >
                            <span className="text-4xl font-serif text-white">{content.stat}</span>
                            <p className="text-sm text-white/80">{content.statLabel}</p>
                        </div>
                        {content.description && (
                            <p className="text-sm text-gray-600 flex-1">{content.description}</p>
                        )}
                    </div>
                    {content.card1Title && (
                        <div className="flex gap-3 mt-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex-1 p-3 rounded-lg" style={{ background: `${theme.primary}10` }}>
                                    <h4 className="font-medium text-sm" style={{ color: theme.primary }}>
                                        {content[`card${i}Title` as keyof typeof content]}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        {content[`card${i}Desc` as keyof typeof content]}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Features
        if (layout.includes('features')) {
            const cols = layout.includes('4col') ? 4 : 3;
            return (
                <div className="h-full flex flex-col px-8 py-6">
                    <h2 className="text-2xl font-serif mb-4" style={{ color: theme.primary }}>
                        {content.title}
                    </h2>
                    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                        {Array.from({ length: cols }).map((_, i) => (
                            <div key={i} className="p-3 rounded-lg" style={{ background: `${theme.primary}08` }}>
                                <div
                                    className="w-10 h-10 rounded-lg mb-2 flex items-center justify-center"
                                    style={{ background: `${theme.primary}20` }}
                                >
                                    <Sparkles className="w-5 h-5" style={{ color: theme.primary }} />
                                </div>
                                <h4 className="font-medium text-sm">{content[`f${i + 1}Title` as keyof typeof content] || `Feature ${i + 1}`}</h4>
                                <p className="text-xs text-gray-500 mt-1">{content[`f${i + 1}Desc` as keyof typeof content] || 'Description'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Content with bullets
        if (layout.includes('bullets')) {
            return (
                <div className="h-full flex flex-col px-8 py-6">
                    <h2 className="text-2xl font-serif mb-3" style={{ color: theme.primary }}>
                        {content.title}
                    </h2>
                    {content.intro && <p className="text-sm text-gray-600 mb-3">{content.intro}</p>}
                    <ul className="space-y-2">
                        {(content.bullets as string[] || ['Point 1', 'Point 2', 'Point 3']).map((bullet, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <span style={{ color: theme.primary }}>•</span>
                                <span>{bullet}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }

        // Quote
        if (layout.includes('quote')) {
            return (
                <div className="h-full flex flex-col justify-center items-center text-center px-8">
                    <p className="text-3xl font-serif italic mb-4" style={{ color: theme.primary }}>
                        "{content.quote || 'A powerful quote goes here'}"
                    </p>
                    <div>
                        <p className="font-medium">{content.author || 'Author Name'}</p>
                        <p className="text-sm text-gray-500">{content.role || 'Title, Company'}</p>
                    </div>
                </div>
            );
        }

        // Timeline
        if (layout.includes('timeline')) {
            return (
                <div className="h-full flex flex-col px-8 py-6">
                    <h2 className="text-2xl font-serif mb-4" style={{ color: theme.primary }}>
                        {content.title}
                    </h2>
                    <div className="relative pl-6 space-y-4">
                        <div
                            className="absolute left-0 top-2 bottom-2 w-0.5"
                            style={{ background: theme.primary }}
                        />
                        {[1, 2, 3].map(i => (
                            <div key={i} className="relative">
                                <div
                                    className="absolute -left-6 w-3 h-3 rounded-full"
                                    style={{ background: theme.primary }}
                                />
                                <span className="text-sm font-bold" style={{ color: theme.primary }}>
                                    {content[`event${i}Year` as keyof typeof content] || `Year ${i}`}
                                </span>
                                <h4 className="font-medium">{content[`event${i}Title` as keyof typeof content] || `Event ${i}`}</h4>
                                <p className="text-xs text-gray-500">{content[`event${i}Desc` as keyof typeof content] || 'Description'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Compare
        if (layout.includes('compare')) {
            return (
                <div className="h-full flex flex-col px-8 py-6">
                    <h2 className="text-2xl font-serif mb-4" style={{ color: theme.primary }}>
                        {content.title}
                    </h2>
                    <div className="grid grid-cols-2 gap-4 flex-1">
                        <div className="p-4 rounded-lg bg-gray-100">
                            <h4 className="font-medium mb-2">{content.leftTitle || 'Option A'}</h4>
                            <ul className="text-sm space-y-1">
                                {(content.leftPoints as string[] || ['Point 1', 'Point 2']).map((p, i) => (
                                    <li key={i}>• {p}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-4 rounded-lg" style={{ background: theme.primary, color: 'white' }}>
                            <h4 className="font-medium mb-2">{content.rightTitle || 'Option B'}</h4>
                            <ul className="text-sm space-y-1">
                                {(content.rightPoints as string[] || ['Point 1', 'Point 2']).map((p, i) => (
                                    <li key={i}>• {p}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            );
        }

        // CTA
        if (layout.includes('cta')) {
            return (
                <div
                    className="h-full flex flex-col justify-center items-center text-center px-8"
                    style={{
                        background: layout.includes('gradient')
                            ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}cc 100%)`
                            : theme.bg
                    }}
                >
                    <h1
                        className="text-3xl font-serif font-bold mb-3"
                        style={{ color: layout.includes('gradient') ? 'white' : theme.primary }}
                    >
                        {content.title}
                    </h1>
                    <p
                        className="text-lg mb-6"
                        style={{ color: layout.includes('gradient') ? 'rgba(255,255,255,0.9)' : '#666' }}
                    >
                        {content.subtitle}
                    </p>
                    <button
                        className="px-6 py-2 rounded-lg font-medium"
                        style={{
                            background: layout.includes('gradient') ? 'white' : theme.primary,
                            color: layout.includes('gradient') ? theme.primary : 'white'
                        }}
                    >
                        {content.cta || 'Get Started'}
                    </button>
                </div>
            );
        }

        // Default content
        return (
            <div className="h-full flex flex-col px-8 py-6">
                <h2 className="text-2xl font-serif mb-4" style={{ color: theme.primary }}>
                    {content.title || template.name}
                </h2>
                <p className="text-sm text-gray-600">
                    {content.body || template.description}
                </p>
            </div>
        );
    };

    return (
        <div
            className="w-full aspect-video bg-white rounded-lg shadow-lg overflow-hidden"
            style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                background: theme.bg
            }}
        >
            {renderContent()}
        </div>
    );
}

// Template card with preview
function TemplateCard({
    template,
    isSelected,
    theme,
    onSelect,
    onPreview
}: {
    template: TemplatePreview;
    isSelected: boolean;
    theme: typeof THEMES[0];
    onSelect: (id: string) => void;
    onPreview: (id: string) => void;
}) {
    const categoryInfo = TEMPLATE_CATEGORIES[template.category as keyof typeof TEMPLATE_CATEGORIES];
    const Icon = categoryInfo?.icon || Layout;
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className={`relative bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all group ${isSelected
                    ? 'border-indigo-500 shadow-lg shadow-indigo-100'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-lg'
                }`}
            onClick={() => onSelect(template.id)}
        >
            {/* Live Preview Thumbnail */}
            <div className="relative h-36 overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        width: '250%',
                        height: '250%',
                        pointerEvents: 'none'
                    }}
                >
                    <LivePreview template={template} theme={theme} scale={0.4} />
                </div>

                {/* Hover overlay */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2"
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); onPreview(template.id); }}
                                className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                                title="Full Preview"
                            >
                                <Maximize2 className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onSelect(template.id); }}
                                className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                                title="Use Template"
                            >
                                <Check className="w-4 h-4 text-gray-700" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Selection indicator */}
                {isSelected && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg"
                    >
                        <Check className="w-4 h-4 text-white" />
                    </motion.div>
                )}
            </div>

            {/* Template Info */}
            <div className="p-3 border-t">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{categoryInfo?.emoji}</span>
                    <span className="text-sm font-medium text-gray-900 truncate">{template.name}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{template.description}</p>

                {/* Features badges */}
                <div className="flex gap-1 mt-2">
                    {template.hasImage && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded">📷 Image</span>
                    )}
                    {template.hasCards && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-600 rounded">
                            🃏 {template.cardCount} Cards
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// Full Preview Modal
function PreviewModal({
    template,
    theme,
    themes,
    onClose,
    onThemeChange,
    onUseTemplate
}: {
    template: TemplatePreview | null;
    theme: typeof THEMES[0];
    themes: typeof THEMES;
    onClose: () => void;
    onThemeChange: (theme: typeof THEMES[0]) => void;
    onUseTemplate: () => void;
}) {
    if (!template) return null;

    const categoryInfo = TEMPLATE_CATEGORIES[template.category as keyof typeof TEMPLATE_CATEGORIES];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{categoryInfo?.emoji}</span>
                        <div>
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            <p className="text-sm text-gray-500">{template.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onUseTemplate}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Use Template
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="p-8 bg-gray-100 min-h-[500px] flex items-center justify-center">
                    <div className="w-full max-w-3xl aspect-video">
                        <LivePreview template={template} theme={theme} scale={1} />
                    </div>
                </div>

                {/* Theme Selector */}
                <div className="p-4 border-t bg-gray-50 flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Palette className="w-4 h-4" />
                        <span>Theme:</span>
                    </div>
                    <div className="flex gap-2">
                        {themes.map(t => (
                            <button
                                key={t.id}
                                onClick={() => onThemeChange(t)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${theme.id === t.id ? 'border-gray-900 scale-110' : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                style={{ background: t.primary }}
                                title={t.name}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Main Template Browser Component
export default function TemplateBrowser({
    onSelectTemplate,
    selectedTemplates = [],
    mode = 'browse' // 'browse' | 'select'
}: {
    onSelectTemplate?: (templateId: string) => void;
    selectedTemplates?: string[];
    mode?: 'browse' | 'select';
}) {
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [previewTemplate, setPreviewTemplate] = useState<TemplatePreview | null>(null);
    const [selected, setSelected] = useState<string[]>(selectedTemplates);
    const [currentTheme, setCurrentTheme] = useState(THEMES[0]);

    // Templates data
    const templates: TemplatePreview[] = useMemo(() => [
        // Title templates
        { id: 'gamma-title-minimal', name: 'Minimal Title', category: 'title', description: 'Clean title with subtitle', layout: 'title-minimal', hasImage: false, hasCards: false },
        { id: 'gamma-title-gradient', name: 'Gradient Title', category: 'title', description: 'Bold title on gradient background', layout: 'title-gradient', hasImage: false, hasCards: false },
        { id: 'gamma-title-split', name: 'Split Title', category: 'title', description: 'Title with side image', layout: 'title-split', hasImage: true, hasCards: false },
        { id: 'gamma-title-centered', name: 'Centered Title', category: 'title', description: 'Centered with accent bar', layout: 'title-centered', hasImage: false, hasCards: false },
        { id: 'gamma-profile-split', name: 'Profile Split', category: 'title', description: 'Professional profile with photo', layout: 'title-split', hasImage: true, hasCards: false },

        // Stats templates
        { id: 'gamma-stat-featured', name: 'Featured Stat', category: 'stats', description: 'Large stat in colored box', layout: 'stat-featured', hasImage: false, hasCards: false },
        { id: 'gamma-stat-with-cards', name: 'Stat with Cards', category: 'stats', description: 'Featured stat + 3 info cards', layout: 'stat-cards', hasImage: false, hasCards: true, cardCount: 3 },
        { id: 'gamma-stats-row', name: 'Stats Row', category: 'stats', description: 'Three stats in a row', layout: 'stats-row', hasImage: false, hasCards: false },
        { id: 'gamma-stats-grid', name: 'Stats Grid', category: 'stats', description: '2x2 grid of stats', layout: 'stats-grid', hasImage: false, hasCards: true, cardCount: 4 },
        { id: 'gamma-stat-big-number', name: 'Big Number', category: 'stats', description: 'Single massive stat', layout: 'stat-big', hasImage: false, hasCards: false },

        // Content templates
        { id: 'gamma-content-text', name: 'Text Content', category: 'content', description: 'Title with body text', layout: 'content-text', hasImage: false, hasCards: false },
        { id: 'gamma-content-split-left', name: 'Split Left Image', category: 'content', description: 'Image left, content right', layout: 'content-split', hasImage: true, hasCards: false },
        { id: 'gamma-content-split-right', name: 'Split Right Image', category: 'content', description: 'Content left, image right', layout: 'content-split', hasImage: true, hasCards: false },
        { id: 'gamma-content-bullets', name: 'Bullet List', category: 'content', description: 'Title with bullet points', layout: 'content-bullets', hasImage: false, hasCards: false },

        // Feature templates
        { id: 'gamma-features-4col', name: '4-Column Features', category: 'features', description: 'Four features with icons', layout: 'features-4col', hasImage: false, hasCards: true, cardCount: 4 },
        { id: 'gamma-features-3col', name: '3-Column Features', category: 'features', description: 'Three features with icons', layout: 'features-3col', hasImage: false, hasCards: true, cardCount: 3 },
        { id: 'gamma-features-cards', name: 'Feature Cards', category: 'features', description: 'Features in rounded cards', layout: 'features-cards', hasImage: false, hasCards: true, cardCount: 3 },
        { id: 'gamma-services-4', name: 'Services Grid', category: 'features', description: 'Four services with icons', layout: 'features-4col', hasImage: false, hasCards: true, cardCount: 4 },

        // Card templates
        { id: 'gamma-cards-3', name: '3 Info Cards', category: 'cards', description: 'Three horizontal info cards', layout: 'cards-3', hasImage: false, hasCards: true, cardCount: 3 },
        { id: 'gamma-cards-highlight', name: 'Highlight Card', category: 'cards', description: 'One featured + secondary cards', layout: 'cards-highlight', hasImage: false, hasCards: true, cardCount: 1 },
        { id: 'gamma-experience-cards-2', name: 'Experience Cards', category: 'cards', description: 'Two experience cards side by side', layout: 'cards-2', hasImage: false, hasCards: true, cardCount: 2 },
        { id: 'gamma-impact-cards', name: 'Impact Cards', category: 'cards', description: 'Key impacts in card format', layout: 'cards-3', hasImage: false, hasCards: true, cardCount: 3 },

        // Timeline templates
        { id: 'gamma-timeline-vertical', name: 'Vertical Timeline', category: 'timeline', description: 'Vertical progression with dots', layout: 'timeline-vertical', hasImage: false, hasCards: false },
        { id: 'gamma-education-timeline', name: 'Education Timeline', category: 'timeline', description: 'Education history timeline', layout: 'timeline-vertical', hasImage: false, hasCards: false },
        { id: 'gamma-process-steps', name: 'Process Steps', category: 'timeline', description: 'Horizontal process steps', layout: 'timeline-horizontal', hasImage: false, hasCards: true, cardCount: 4 },

        // Quote templates
        { id: 'gamma-quote-centered', name: 'Centered Quote', category: 'quote', description: 'Large quote with attribution', layout: 'quote-centered', hasImage: false, hasCards: false },
        { id: 'gamma-quote-with-image', name: 'Quote with Photo', category: 'quote', description: 'Quote with author photo', layout: 'quote-image', hasImage: true, hasCards: false },
        { id: 'gamma-testimonial-featured', name: 'Featured Testimonial', category: 'quote', description: 'Single large testimonial', layout: 'quote-featured', hasImage: true, hasCards: true, cardCount: 1 },
        { id: 'gamma-testimonials-3', name: 'Testimonials Grid', category: 'quote', description: 'Three testimonials in cards', layout: 'quote-grid', hasImage: false, hasCards: true, cardCount: 3 },

        // Compare templates
        { id: 'gamma-compare-side', name: 'Side by Side', category: 'compare', description: 'Two columns comparison', layout: 'compare-side', hasImage: false, hasCards: true, cardCount: 2 },

        // Team templates  
        { id: 'gamma-skills-grid', name: 'Skills Grid', category: 'team', description: '4-column skills with badges', layout: 'features-4col', hasImage: false, hasCards: true, cardCount: 4 },
        { id: 'gamma-certifications', name: 'Certifications', category: 'team', description: 'Professional certifications grid', layout: 'features-3col', hasImage: false, hasCards: true, cardCount: 3 },

        // CTA templates
        { id: 'gamma-cta-gradient', name: 'Gradient CTA', category: 'cta', description: 'Call to action on gradient', layout: 'cta-gradient', hasImage: false, hasCards: false },
        { id: 'gamma-closing-thank-you', name: 'Thank You', category: 'cta', description: 'Thank you closing slide', layout: 'cta-thankyou', hasImage: false, hasCards: false },
        { id: 'gamma-contact-info', name: 'Contact Information', category: 'cta', description: 'Contact details with icons', layout: 'cta-contact', hasImage: false, hasCards: false },
        { id: 'gamma-cta-split', name: 'CTA with Image', category: 'cta', description: 'Call to action with side image', layout: 'cta-split', hasImage: true, hasCards: false },
    ], []);

    // Filter templates
    const filteredTemplates = useMemo(() => {
        return templates.filter(t => {
            const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
            const matchesSearch = !searchQuery ||
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [templates, activeCategory, searchQuery]);

    const handleSelect = useCallback((id: string) => {
        if (mode === 'select') {
            const newSelected = selected.includes(id)
                ? selected.filter(s => s !== id)
                : [...selected, id];
            setSelected(newSelected);
        }
        onSelectTemplate?.(id);
    }, [mode, selected, onSelectTemplate]);

    const handlePreview = useCallback((id: string) => {
        const template = templates.find(t => t.id === id);
        if (template) setPreviewTemplate(template);
    }, [templates]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-indigo-500" />
                                Template Gallery
                            </h1>
                            <p className="text-sm text-gray-500">{templates.length}+ professional presentation templates with live previews</p>
                        </div>

                        <div className="flex items-center gap-4">
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

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search templates..."
                                    title="Search templates"
                                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeCategory === 'all'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            ✨ All Templates
                        </button>
                        {Object.entries(TEMPLATE_CATEGORIES).map(([key, { icon: Icon, label, color, emoji }]) => (
                            <button
                                key={key}
                                onClick={() => setActiveCategory(key)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${activeCategory === key
                                        ? 'text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                style={{
                                    background: activeCategory === key ? color : undefined
                                }}
                            >
                                <span>{emoji}</span>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredTemplates.map((template) => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                theme={currentTheme}
                                isSelected={selected.includes(template.id)}
                                onSelect={handleSelect}
                                onPreview={handlePreview}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {filteredTemplates.length === 0 && (
                    <div className="text-center py-16">
                        <Layout className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No templates found matching your criteria</p>
                        <button
                            onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
                {previewTemplate && (
                    <PreviewModal
                        template={previewTemplate}
                        theme={currentTheme}
                        themes={THEMES}
                        onClose={() => setPreviewTemplate(null)}
                        onThemeChange={setCurrentTheme}
                        onUseTemplate={() => {
                            handleSelect(previewTemplate.id);
                            setPreviewTemplate(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
