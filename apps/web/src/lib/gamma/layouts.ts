/**
 * 🎨 Smart Layouts - Pre-designed card layouts
 * AI recommends these based on content type
 */

import { CardLayout, SmartLayout, BlockType } from './types';

export const SMART_LAYOUTS: SmartLayout[] = [
    // ==========================================
    // CONTENT LAYOUTS
    // ==========================================
    {
        id: 'title-centered',
        name: 'Title Card',
        description: 'Centered title with optional subtitle - perfect for opening slides',
        category: 'content',
        slots: [
            { id: 'title', name: 'Title', type: 'text', gridArea: 'center', required: true, defaultBlock: 'heading' },
            { id: 'subtitle', name: 'Subtitle', type: 'text', gridArea: 'below', required: false, defaultBlock: 'paragraph' },
        ],
        preview: '/layouts/title-centered.svg',
        suggestedFor: ['introduction', 'title', 'opening', 'cover'],
    },
    {
        id: 'single-column',
        name: 'Single Column',
        description: 'Full-width content - ideal for text-heavy slides',
        category: 'content',
        slots: [
            { id: 'heading', name: 'Heading', type: 'text', gridArea: 'top', required: true, defaultBlock: 'heading' },
            { id: 'content', name: 'Content', type: 'text', gridArea: 'main', required: true, defaultBlock: 'paragraph' },
        ],
        preview: '/layouts/single-column.svg',
        suggestedFor: ['text', 'explanation', 'body', 'content'],
    },
    {
        id: 'two-column',
        name: 'Two Columns',
        description: 'Side-by-side content blocks',
        category: 'content',
        slots: [
            { id: 'heading', name: 'Heading', type: 'text', gridArea: 'top', required: false, defaultBlock: 'heading' },
            { id: 'left', name: 'Left Column', type: 'any', gridArea: 'left', required: true },
            { id: 'right', name: 'Right Column', type: 'any', gridArea: 'right', required: true },
        ],
        preview: '/layouts/two-column.svg',
        suggestedFor: ['comparison', 'dual', 'pros-cons', 'before-after'],
    },
    {
        id: 'two-column-equal',
        name: 'Equal Columns',
        description: 'Two equal-width columns for balanced content',
        category: 'content',
        slots: [
            { id: 'left', name: 'Left Column', type: 'any', gridArea: 'left', required: true },
            { id: 'right', name: 'Right Column', type: 'any', gridArea: 'right', required: true },
        ],
        preview: '/layouts/two-column-equal.svg',
        suggestedFor: ['comparison', 'versus', 'options'],
    },

    // ==========================================
    // MEDIA LAYOUTS
    // ==========================================
    {
        id: 'accent-left',
        name: 'Image Left',
        description: 'Large image on left, content on right',
        category: 'media',
        slots: [
            { id: 'image', name: 'Image', type: 'image', gridArea: 'left', required: true, defaultBlock: 'image' },
            { id: 'heading', name: 'Heading', type: 'text', gridArea: 'top-right', required: true, defaultBlock: 'heading' },
            { id: 'content', name: 'Content', type: 'text', gridArea: 'bottom-right', required: true, defaultBlock: 'paragraph' },
        ],
        preview: '/layouts/accent-left.svg',
        suggestedFor: ['feature', 'showcase', 'product', 'visual'],
    },
    {
        id: 'accent-right',
        name: 'Image Right',
        description: 'Content on left, large image on right',
        category: 'media',
        slots: [
            { id: 'heading', name: 'Heading', type: 'text', gridArea: 'top-left', required: true, defaultBlock: 'heading' },
            { id: 'content', name: 'Content', type: 'text', gridArea: 'bottom-left', required: true, defaultBlock: 'paragraph' },
            { id: 'image', name: 'Image', type: 'image', gridArea: 'right', required: true, defaultBlock: 'image' },
        ],
        preview: '/layouts/accent-right.svg',
        suggestedFor: ['feature', 'showcase', 'product', 'visual'],
    },
    {
        id: 'split-left',
        name: 'Split 40/60',
        description: 'Narrow left column, wide right - for media emphasis',
        category: 'media',
        slots: [
            { id: 'left', name: 'Left (40%)', type: 'any', gridArea: 'left-narrow', required: true },
            { id: 'right', name: 'Right (60%)', type: 'any', gridArea: 'right-wide', required: true },
        ],
        preview: '/layouts/split-left.svg',
        suggestedFor: ['sidebar', 'navigation', 'index'],
    },
    {
        id: 'split-right',
        name: 'Split 60/40',
        description: 'Wide left column, narrow right',
        category: 'media',
        slots: [
            { id: 'left', name: 'Left (60%)', type: 'any', gridArea: 'left-wide', required: true },
            { id: 'right', name: 'Right (40%)', type: 'any', gridArea: 'right-narrow', required: true },
        ],
        preview: '/layouts/split-right.svg',
        suggestedFor: ['content', 'sidebar'],
    },
    {
        id: 'full-bleed',
        name: 'Full Bleed Image',
        description: 'Edge-to-edge image with text overlay',
        category: 'media',
        slots: [
            { id: 'background', name: 'Background Image', type: 'image', gridArea: 'full', required: true, defaultBlock: 'image' },
            { id: 'heading', name: 'Overlay Title', type: 'text', gridArea: 'overlay', required: true, defaultBlock: 'heading' },
            { id: 'subtitle', name: 'Overlay Text', type: 'text', gridArea: 'overlay-sub', required: false, defaultBlock: 'paragraph' },
        ],
        preview: '/layouts/full-bleed.svg',
        suggestedFor: ['hero', 'impact', 'visual', 'statement'],
    },
    {
        id: 'gallery',
        name: 'Image Gallery',
        description: 'Grid of images - 2x2 or 3x3',
        category: 'media',
        slots: [
            { id: 'heading', name: 'Heading', type: 'text', gridArea: 'top', required: false, defaultBlock: 'heading' },
            { id: 'image1', name: 'Image 1', type: 'image', gridArea: 'grid-1', required: true, defaultBlock: 'image' },
            { id: 'image2', name: 'Image 2', type: 'image', gridArea: 'grid-2', required: true, defaultBlock: 'image' },
            { id: 'image3', name: 'Image 3', type: 'image', gridArea: 'grid-3', required: false, defaultBlock: 'image' },
            { id: 'image4', name: 'Image 4', type: 'image', gridArea: 'grid-4', required: false, defaultBlock: 'image' },
        ],
        preview: '/layouts/gallery.svg',
        suggestedFor: ['gallery', 'portfolio', 'examples', 'showcase'],
    },

    // ==========================================
    // DATA LAYOUTS
    // ==========================================
    {
        id: 'stats',
        name: 'Stats & Numbers',
        description: 'Big bold statistics in a row',
        category: 'data',
        slots: [
            { id: 'heading', name: 'Heading', type: 'text', gridArea: 'top', required: false, defaultBlock: 'heading' },
            { id: 'stat1', name: 'Stat 1', type: 'data', gridArea: 'stat-1', required: true, defaultBlock: 'stat' },
            { id: 'stat2', name: 'Stat 2', type: 'data', gridArea: 'stat-2', required: true, defaultBlock: 'stat' },
            { id: 'stat3', name: 'Stat 3', type: 'data', gridArea: 'stat-3', required: false, defaultBlock: 'stat' },
            { id: 'stat4', name: 'Stat 4', type: 'data', gridArea: 'stat-4', required: false, defaultBlock: 'stat' },
        ],
        preview: '/layouts/stats.svg',
        suggestedFor: ['metrics', 'kpi', 'numbers', 'data', 'statistics'],
    },
    {
        id: 'comparison',
        name: 'Comparison Table',
        description: 'Side-by-side feature comparison',
        category: 'data',
        slots: [
            { id: 'heading', name: 'Heading', type: 'text', gridArea: 'top', required: true, defaultBlock: 'heading' },
            { id: 'left-title', name: 'Option A Title', type: 'text', gridArea: 'left-title', required: true, defaultBlock: 'heading' },
            { id: 'left-content', name: 'Option A Content', type: 'text', gridArea: 'left-content', required: true, defaultBlock: 'bullet-list' },
            { id: 'right-title', name: 'Option B Title', type: 'text', gridArea: 'right-title', required: true, defaultBlock: 'heading' },
            { id: 'right-content', name: 'Option B Content', type: 'text', gridArea: 'right-content', required: true, defaultBlock: 'bullet-list' },
        ],
        preview: '/layouts/comparison.svg',
        suggestedFor: ['comparison', 'versus', 'options', 'alternatives'],
    },
    {
        id: 'timeline',
        name: 'Timeline',
        description: 'Horizontal timeline for processes or history',
        category: 'data',
        slots: [
            { id: 'heading', name: 'Heading', type: 'text', gridArea: 'top', required: true, defaultBlock: 'heading' },
            { id: 'step1', name: 'Step 1', type: 'text', gridArea: 'step-1', required: true, defaultBlock: 'icon-text' },
            { id: 'step2', name: 'Step 2', type: 'text', gridArea: 'step-2', required: true, defaultBlock: 'icon-text' },
            { id: 'step3', name: 'Step 3', type: 'text', gridArea: 'step-3', required: true, defaultBlock: 'icon-text' },
            { id: 'step4', name: 'Step 4', type: 'text', gridArea: 'step-4', required: false, defaultBlock: 'icon-text' },
        ],
        preview: '/layouts/timeline.svg',
        suggestedFor: ['timeline', 'process', 'steps', 'history', 'roadmap'],
    },

    // ==========================================
    // SPECIAL LAYOUTS
    // ==========================================
    {
        id: 'quote',
        name: 'Quote',
        description: 'Large inspirational quote',
        category: 'special',
        slots: [
            { id: 'quote', name: 'Quote', type: 'text', gridArea: 'center', required: true, defaultBlock: 'quote' },
            { id: 'author', name: 'Author', type: 'text', gridArea: 'below', required: false, defaultBlock: 'paragraph' },
        ],
        preview: '/layouts/quote.svg',
        suggestedFor: ['quote', 'testimonial', 'inspiration', 'saying'],
    },
    {
        id: 'team',
        name: 'Team Grid',
        description: 'Team member photos in a grid',
        category: 'special',
        slots: [
            { id: 'heading', name: 'Heading', type: 'text', gridArea: 'top', required: true, defaultBlock: 'heading' },
            { id: 'member1', name: 'Team Member 1', type: 'any', gridArea: 'member-1', required: true },
            { id: 'member2', name: 'Team Member 2', type: 'any', gridArea: 'member-2', required: true },
            { id: 'member3', name: 'Team Member 3', type: 'any', gridArea: 'member-3', required: false },
            { id: 'member4', name: 'Team Member 4', type: 'any', gridArea: 'member-4', required: false },
        ],
        preview: '/layouts/team.svg',
        suggestedFor: ['team', 'people', 'about', 'staff'],
    },
    {
        id: 'pricing',
        name: 'Pricing Table',
        description: 'Pricing comparison cards',
        category: 'special',
        slots: [
            { id: 'heading', name: 'Heading', type: 'text', gridArea: 'top', required: true, defaultBlock: 'heading' },
            { id: 'plan1', name: 'Plan 1', type: 'any', gridArea: 'plan-1', required: true },
            { id: 'plan2', name: 'Plan 2', type: 'any', gridArea: 'plan-2', required: true },
            { id: 'plan3', name: 'Plan 3', type: 'any', gridArea: 'plan-3', required: false },
        ],
        preview: '/layouts/pricing.svg',
        suggestedFor: ['pricing', 'plans', 'packages', 'tiers'],
    },
    {
        id: 'features',
        name: 'Feature Grid',
        description: '3-column feature showcase with icons',
        category: 'special',
        slots: [
            { id: 'heading', name: 'Heading', type: 'text', gridArea: 'top', required: true, defaultBlock: 'heading' },
            { id: 'feature1', name: 'Feature 1', type: 'any', gridArea: 'feature-1', required: true, defaultBlock: 'icon-text' },
            { id: 'feature2', name: 'Feature 2', type: 'any', gridArea: 'feature-2', required: true, defaultBlock: 'icon-text' },
            { id: 'feature3', name: 'Feature 3', type: 'any', gridArea: 'feature-3', required: true, defaultBlock: 'icon-text' },
            { id: 'feature4', name: 'Feature 4', type: 'any', gridArea: 'feature-4', required: false, defaultBlock: 'icon-text' },
            { id: 'feature5', name: 'Feature 5', type: 'any', gridArea: 'feature-5', required: false, defaultBlock: 'icon-text' },
            { id: 'feature6', name: 'Feature 6', type: 'any', gridArea: 'feature-6', required: false, defaultBlock: 'icon-text' },
        ],
        preview: '/layouts/features.svg',
        suggestedFor: ['features', 'benefits', 'services', 'capabilities'],
    },
];

// Get layout by ID
export function getLayoutById(id: CardLayout): SmartLayout | undefined {
    return SMART_LAYOUTS.find(l => l.id === id);
}

// Get layouts by category
export function getLayoutsByCategory(category: SmartLayout['category']): SmartLayout[] {
    return SMART_LAYOUTS.filter(l => l.category === category);
}

// Recommend layouts based on content keywords
export function recommendLayouts(contentKeywords: string[]): SmartLayout[] {
    const scores = SMART_LAYOUTS.map(layout => {
        let score = 0;
        for (const keyword of contentKeywords) {
            const kw = keyword.toLowerCase();
            if (layout.suggestedFor.some(s => s.includes(kw) || kw.includes(s))) {
                score += 10;
            }
            if (layout.name.toLowerCase().includes(kw)) {
                score += 5;
            }
            if (layout.description.toLowerCase().includes(kw)) {
                score += 2;
            }
        }
        return { layout, score };
    });

    return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(s => s.layout);
}

// Generate CSS styles for layout
export function getLayoutStyles(layout: CardLayout): Record<string, string | number> {
    const layouts: Record<CardLayout, Record<string, string | number>> = {
        'title-centered': {
            placeItems: 'center',
            textAlign: 'center',
            justifyContent: 'center',
            alignContent: 'center',
        },
        'single-column': {
            gridTemplateColumns: '1fr',
            alignContent: 'start',
        },
        'two-column': {
            gridTemplateColumns: '1fr 1fr',
        },
        'two-column-equal': {
            gridTemplateColumns: '1fr 1fr',
        },
        'split-left': {
            gridTemplateColumns: '2fr 3fr',
        },
        'split-right': {
            gridTemplateColumns: '3fr 2fr',
        },
        'accent-left': {
            gridTemplateColumns: '1fr 1fr',
        },
        'accent-right': {
            gridTemplateColumns: '1fr 1fr',
        },
        'full-bleed': {
            position: 'relative',
        },
        'comparison': {
            gridTemplateColumns: '1fr 1fr',
        },
        'gallery': {
            gridTemplateColumns: '1fr 1fr',
        },
        'stats': {
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        },
        'quote': {
            placeItems: 'center',
            textAlign: 'center',
        },
        'timeline': {
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        },
        'team': {
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        },
        'pricing': {
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        },
        'features': {
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        },
    };

    return layouts[layout] || layouts['single-column'];
}
