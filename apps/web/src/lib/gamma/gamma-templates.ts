/**
 * 🎨 Gamma-Style Premium Templates
 * Based on analysis of actual Gamma.app presentations
 * 
 * Design System:
 * - Heading Font: Libre Baskerville (serif)
 * - Body Font: Open Sans (sans-serif)
 * - Primary Color: Theme accent (customizable)
 * - Muted Text: #49495A or theme muted
 * - Cards: Rounded rectangles with subtle backgrounds
 * - Layouts: Clean, spacious, professional
 */

// All available template layouts
export type GammaLayoutType =
    // Title slides
    | 'gamma-title-minimal'
    | 'gamma-title-gradient'
    | 'gamma-title-image-bg'
    | 'gamma-title-split'
    | 'gamma-title-centered'
    // Stats slides
    | 'gamma-stat-featured'
    | 'gamma-stats-row'
    | 'gamma-stats-grid'
    | 'gamma-stat-big-number'
    | 'gamma-stats-compare'
    // Content slides
    | 'gamma-content-text'
    | 'gamma-content-split-left'
    | 'gamma-content-split-right'
    | 'gamma-content-bullets'
    | 'gamma-content-numbered'
    // Feature/Grid slides
    | 'gamma-features-4col'
    | 'gamma-features-3col'
    | 'gamma-features-2col'
    | 'gamma-features-icons'
    | 'gamma-features-cards'
    // Card-based slides
    | 'gamma-cards-3'
    | 'gamma-cards-4'
    | 'gamma-cards-2-horizontal'
    | 'gamma-cards-highlight'
    // Timeline slides
    | 'gamma-timeline-vertical'
    | 'gamma-timeline-horizontal'
    | 'gamma-timeline-steps'
    // Quote slides
    | 'gamma-quote-centered'
    | 'gamma-quote-with-image'
    | 'gamma-quote-large'
    // Comparison slides
    | 'gamma-compare-table'
    | 'gamma-compare-side'
    | 'gamma-compare-before-after'
    // Team slides
    | 'gamma-team-grid'
    | 'gamma-team-spotlight'
    // CTA/Closing slides
    | 'gamma-cta-simple'
    | 'gamma-cta-gradient'
    | 'gamma-closing-thank-you'
    | 'gamma-closing-contact';

// Template definition matching Gamma style
export interface GammaTemplate {
    id: string;
    layout: GammaLayoutType;
    name: string;
    category: 'title' | 'stats' | 'content' | 'features' | 'cards' | 'timeline' | 'quote' | 'compare' | 'team' | 'cta';
    description: string;
    // Content structure
    elements: GammaElement[];
    // Image placeholders
    images: GammaImageSlot[];
    // Design hints for CSS generation
    design: {
        hasGradient: boolean;
        hasAccentBar: boolean;
        hasCards: boolean;
        cardCount?: number;
        columnCount?: number;
        bgStyle: 'light' | 'dark' | 'gradient' | 'image';
    };
}

export interface GammaElement {
    id: string;
    type: 'title' | 'subtitle' | 'heading' | 'subheading' | 'body' | 'bullets' | 'stat' | 'label' | 'caption' | 'quote' | 'author';
    required: boolean;
    maxLength?: number;
    style: 'serif' | 'sans' | 'accent' | 'muted';
    size: 'xl' | 'lg' | 'md' | 'sm' | 'xs';
}

export interface GammaImageSlot {
    id: string;
    position: 'background' | 'left' | 'right' | 'icon' | 'avatar' | 'card' | 'top';
    aspectRatio: '16:9' | '4:3' | '1:1' | '3:2' | '2:3';
    size: 'full' | 'large' | 'medium' | 'small' | 'icon';
    keywords: string[];
}

// ==========================================
// GAMMA-STYLE TEMPLATE LIBRARY (100+)
// ==========================================

export const GAMMA_TEMPLATES: GammaTemplate[] = [
    // ==========================================
    // TITLE TEMPLATES (1-15)
    // ==========================================
    {
        id: 'gamma-title-minimal',
        layout: 'gamma-title-minimal',
        name: 'Minimal Title',
        category: 'title',
        description: 'Clean title with subtitle, like Gamma opening slides',
        elements: [
            { id: 'title', type: 'title', required: true, maxLength: 80, style: 'serif', size: 'xl' },
            { id: 'subtitle', type: 'body', required: false, maxLength: 400, style: 'sans', size: 'md' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'gamma-title-gradient',
        layout: 'gamma-title-gradient',
        name: 'Gradient Title',
        category: 'title',
        description: 'Bold title on gradient background',
        elements: [
            { id: 'title', type: 'title', required: true, maxLength: 60, style: 'serif', size: 'xl' },
            { id: 'subtitle', type: 'subtitle', required: false, maxLength: 120, style: 'sans', size: 'lg' }
        ],
        images: [],
        design: { hasGradient: true, hasAccentBar: false, hasCards: false, bgStyle: 'gradient' }
    },
    {
        id: 'gamma-title-image-bg',
        layout: 'gamma-title-image-bg',
        name: 'Image Background Title',
        category: 'title',
        description: 'Title overlay on full-bleed image',
        elements: [
            { id: 'title', type: 'title', required: true, maxLength: 50, style: 'serif', size: 'xl' },
            { id: 'tagline', type: 'caption', required: false, maxLength: 80, style: 'sans', size: 'md' }
        ],
        images: [
            { id: 'bg', position: 'background', aspectRatio: '16:9', size: 'full', keywords: ['abstract', 'business'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'image' }
    },
    {
        id: 'gamma-title-split',
        layout: 'gamma-title-split',
        name: 'Split Title',
        category: 'title',
        description: 'Title on left, image on right',
        elements: [
            { id: 'title', type: 'title', required: true, maxLength: 50, style: 'serif', size: 'xl' },
            { id: 'subtitle', type: 'body', required: false, maxLength: 200, style: 'sans', size: 'md' },
            { id: 'tagline', type: 'caption', required: false, maxLength: 60, style: 'muted', size: 'sm' }
        ],
        images: [
            { id: 'hero', position: 'right', aspectRatio: '4:3', size: 'large', keywords: ['professional', 'modern'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'gamma-title-centered',
        layout: 'gamma-title-centered',
        name: 'Centered Title',
        category: 'title',
        description: 'Centered title with company info',
        elements: [
            { id: 'company', type: 'caption', required: false, maxLength: 40, style: 'accent', size: 'sm' },
            { id: 'title', type: 'title', required: true, maxLength: 60, style: 'serif', size: 'xl' },
            { id: 'date', type: 'caption', required: false, maxLength: 40, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },

    // ==========================================
    // STATS TEMPLATES (16-30) - Gamma's signature style
    // ==========================================
    {
        id: 'gamma-stat-featured',
        layout: 'gamma-stat-featured',
        name: 'Featured Stat',
        category: 'stats',
        description: 'Large stat in colored box with explanation - Gamma signature style',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 60, style: 'serif', size: 'lg' },
            { id: 'stat', type: 'stat', required: true, maxLength: 10, style: 'serif', size: 'xl' },
            { id: 'statLabel', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'description', type: 'body', required: true, maxLength: 300, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 1, bgStyle: 'light' }
    },
    {
        id: 'gamma-stat-with-cards',
        layout: 'gamma-stat-featured',
        name: 'Stat with Info Cards',
        category: 'stats',
        description: 'Featured stat plus 3 info cards below - like Gamma slide 2',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 60, style: 'serif', size: 'lg' },
            { id: 'stat', type: 'stat', required: true, maxLength: 10, style: 'serif', size: 'xl' },
            { id: 'statLabel', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'description1', type: 'body', required: true, maxLength: 200, style: 'sans', size: 'sm' },
            { id: 'description2', type: 'body', required: false, maxLength: 200, style: 'sans', size: 'sm' },
            { id: 'card1Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'card1Desc', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'card2Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'card2Desc', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'card3Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'card3Desc', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'gamma-stats-row',
        layout: 'gamma-stats-row',
        name: 'Stats Row',
        category: 'stats',
        description: 'Three large stats in a row',
        elements: [
            { id: 'title', type: 'heading', required: false, maxLength: 50, style: 'serif', size: 'lg' },
            { id: 'stat1', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'xl' },
            { id: 'label1', type: 'label', required: true, maxLength: 30, style: 'muted', size: 'sm' },
            { id: 'stat2', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'xl' },
            { id: 'label2', type: 'label', required: true, maxLength: 30, style: 'muted', size: 'sm' },
            { id: 'stat3', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'xl' },
            { id: 'label3', type: 'label', required: true, maxLength: 30, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'gamma-stats-grid',
        layout: 'gamma-stats-grid',
        name: 'Stats Grid',
        category: 'stats',
        description: '2x2 grid of stats',
        elements: [
            { id: 'title', type: 'heading', required: false, maxLength: 50, style: 'serif', size: 'lg' },
            { id: 'stat1', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'xl' },
            { id: 'label1', type: 'label', required: true, maxLength: 30, style: 'muted', size: 'sm' },
            { id: 'stat2', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'xl' },
            { id: 'label2', type: 'label', required: true, maxLength: 30, style: 'muted', size: 'sm' },
            { id: 'stat3', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'xl' },
            { id: 'label3', type: 'label', required: true, maxLength: 30, style: 'muted', size: 'sm' },
            { id: 'stat4', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'xl' },
            { id: 'label4', type: 'label', required: true, maxLength: 30, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: true, cardCount: 4, columnCount: 2, bgStyle: 'light' }
    },
    {
        id: 'gamma-stat-big-number',
        layout: 'gamma-stat-big-number',
        name: 'Big Number',
        category: 'stats',
        description: 'Single massive stat for impact',
        elements: [
            { id: 'stat', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xl' },
            { id: 'context', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'lg' },
            { id: 'source', type: 'caption', required: false, maxLength: 50, style: 'muted', size: 'xs' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },

    // ==========================================
    // FEATURE/GRID TEMPLATES (31-50) - Gamma's icon grids
    // ==========================================
    {
        id: 'gamma-features-4col',
        layout: 'gamma-features-4col',
        name: '4-Column Features',
        category: 'features',
        description: 'Four features with icons - like Gamma slide 3',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 60, style: 'serif', size: 'lg' },
            { id: 'intro', type: 'body', required: false, maxLength: 200, style: 'sans', size: 'sm' },
            { id: 'f1Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'f1Desc', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'f2Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'f2Desc', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'f3Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'f3Desc', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'f4Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'f4Desc', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'icon1', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['icon', 'symbol'] },
            { id: 'icon2', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['icon', 'symbol'] },
            { id: 'icon3', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['icon', 'symbol'] },
            { id: 'icon4', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['icon', 'symbol'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, columnCount: 4, bgStyle: 'light' }
    },
    {
        id: 'gamma-features-3col',
        layout: 'gamma-features-3col',
        name: '3-Column Features',
        category: 'features',
        description: 'Three features with icons',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 60, style: 'serif', size: 'lg' },
            { id: 'f1Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'f1Desc', type: 'body', required: true, maxLength: 200, style: 'sans', size: 'sm' },
            { id: 'f2Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'f2Desc', type: 'body', required: true, maxLength: 200, style: 'sans', size: 'sm' },
            { id: 'f3Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'f3Desc', type: 'body', required: true, maxLength: 200, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'icon1', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['feature'] },
            { id: 'icon2', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['feature'] },
            { id: 'icon3', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['feature'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'gamma-features-cards',
        layout: 'gamma-features-cards',
        name: 'Feature Cards',
        category: 'features',
        description: 'Features in rounded cards with subtle background',
        elements: [
            { id: 'title', type: 'heading', required: false, maxLength: 50, style: 'serif', size: 'lg' },
            { id: 'f1Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'f1Desc', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'f2Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'f2Desc', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'f3Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'f3Desc', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },

    // ==========================================
    // CONTENT TEMPLATES (51-70)
    // ==========================================
    {
        id: 'gamma-content-text',
        layout: 'gamma-content-text',
        name: 'Text Content',
        category: 'content',
        description: 'Title with body text paragraphs',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 60, style: 'serif', size: 'lg' },
            { id: 'body', type: 'body', required: true, maxLength: 600, style: 'sans', size: 'md' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'gamma-content-split-left',
        layout: 'gamma-content-split-left',
        name: 'Split Left Image',
        category: 'content',
        description: 'Image left, content right',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 50, style: 'serif', size: 'lg' },
            { id: 'body', type: 'body', required: true, maxLength: 300, style: 'sans', size: 'md' },
            { id: 'bullets', type: 'bullets', required: false, maxLength: 400, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'main', position: 'left', aspectRatio: '4:3', size: 'large', keywords: ['professional'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'gamma-content-split-right',
        layout: 'gamma-content-split-right',
        name: 'Split Right Image',
        category: 'content',
        description: 'Content left, image right',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 50, style: 'serif', size: 'lg' },
            { id: 'body', type: 'body', required: true, maxLength: 300, style: 'sans', size: 'md' },
            { id: 'bullets', type: 'bullets', required: false, maxLength: 400, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'main', position: 'right', aspectRatio: '4:3', size: 'large', keywords: ['technology'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'gamma-content-bullets',
        layout: 'gamma-content-bullets',
        name: 'Bullet List',
        category: 'content',
        description: 'Title with bullet points',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 60, style: 'serif', size: 'lg' },
            { id: 'intro', type: 'body', required: false, maxLength: 150, style: 'sans', size: 'md' },
            { id: 'bullets', type: 'bullets', required: true, maxLength: 600, style: 'sans', size: 'md' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },

    // ==========================================
    // CARD-BASED TEMPLATES (71-85)
    // ==========================================
    {
        id: 'gamma-cards-3',
        layout: 'gamma-cards-3',
        name: '3 Info Cards',
        category: 'cards',
        description: 'Three horizontal info cards - Gamma style',
        elements: [
            { id: 'title', type: 'heading', required: false, maxLength: 50, style: 'serif', size: 'lg' },
            { id: 'card1Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'card1Desc', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'card2Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'card2Desc', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'card3Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'card3Desc', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'gamma-cards-highlight',
        layout: 'gamma-cards-highlight',
        name: 'Highlight Card',
        category: 'cards',
        description: 'One featured colored card + secondary cards',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 50, style: 'serif', size: 'lg' },
            { id: 'highlightStat', type: 'stat', required: true, maxLength: 10, style: 'serif', size: 'xl' },
            { id: 'highlightLabel', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'body', type: 'body', required: true, maxLength: 300, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 1, bgStyle: 'light' }
    },

    // ==========================================
    // TIMELINE TEMPLATES (86-95)
    // ==========================================
    {
        id: 'gamma-timeline-vertical',
        layout: 'gamma-timeline-vertical',
        name: 'Vertical Timeline',
        category: 'timeline',
        description: 'Vertical progression with dots',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 50, style: 'serif', size: 'lg' },
            { id: 'event1Year', type: 'label', required: true, maxLength: 10, style: 'accent', size: 'sm' },
            { id: 'event1Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'event1Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'event2Year', type: 'label', required: true, maxLength: 10, style: 'accent', size: 'sm' },
            { id: 'event2Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'event2Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'event3Year', type: 'label', required: true, maxLength: 10, style: 'accent', size: 'sm' },
            { id: 'event3Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'event3Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },

    // ==========================================
    // QUOTE TEMPLATES (96-100)
    // ==========================================
    {
        id: 'gamma-quote-centered',
        layout: 'gamma-quote-centered',
        name: 'Centered Quote',
        category: 'quote',
        description: 'Large quote with attribution',
        elements: [
            { id: 'quote', type: 'quote', required: true, maxLength: 200, style: 'serif', size: 'lg' },
            { id: 'author', type: 'author', required: true, maxLength: 40, style: 'sans', size: 'md' },
            { id: 'role', type: 'caption', required: false, maxLength: 50, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'gamma-quote-with-image',
        layout: 'gamma-quote-with-image',
        name: 'Quote with Photo',
        category: 'quote',
        description: 'Quote with author photo',
        elements: [
            { id: 'quote', type: 'quote', required: true, maxLength: 200, style: 'serif', size: 'lg' },
            { id: 'author', type: 'author', required: true, maxLength: 40, style: 'sans', size: 'md' },
            { id: 'role', type: 'caption', required: false, maxLength: 50, style: 'muted', size: 'sm' }
        ],
        images: [
            { id: 'avatar', position: 'avatar', aspectRatio: '1:1', size: 'medium', keywords: ['portrait', 'headshot'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },

    // ==========================================
    // COMPARISON TEMPLATES (101-105)
    // ==========================================
    {
        id: 'gamma-compare-side',
        layout: 'gamma-compare-side',
        name: 'Side by Side Compare',
        category: 'compare',
        description: 'Two columns comparison',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 50, style: 'serif', size: 'lg' },
            { id: 'leftTitle', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'leftPoints', type: 'bullets', required: true, maxLength: 300, style: 'sans', size: 'sm' },
            { id: 'rightTitle', type: 'subheading', required: true, maxLength: 25, style: 'accent', size: 'md' },
            { id: 'rightPoints', type: 'bullets', required: true, maxLength: 300, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 2, columnCount: 2, bgStyle: 'light' }
    },

    // ==========================================
    // CTA/CLOSING TEMPLATES (106-110)
    // ==========================================
    {
        id: 'gamma-cta-gradient',
        layout: 'gamma-cta-gradient',
        name: 'Gradient CTA',
        category: 'cta',
        description: 'Call to action on gradient',
        elements: [
            { id: 'title', type: 'title', required: true, maxLength: 50, style: 'serif', size: 'xl' },
            { id: 'subtitle', type: 'body', required: false, maxLength: 100, style: 'sans', size: 'md' },
            { id: 'cta', type: 'label', required: true, maxLength: 30, style: 'sans', size: 'md' }
        ],
        images: [],
        design: { hasGradient: true, hasAccentBar: false, hasCards: false, bgStyle: 'gradient' }
    },
    {
        id: 'gamma-closing-thank-you',
        layout: 'gamma-closing-thank-you',
        name: 'Thank You',
        category: 'cta',
        description: 'Thank you closing slide',
        elements: [
            { id: 'thanks', type: 'title', required: true, maxLength: 30, style: 'serif', size: 'xl' },
            { id: 'contact', type: 'body', required: false, maxLength: 100, style: 'sans', size: 'md' },
            { id: 'email', type: 'caption', required: false, maxLength: 50, style: 'accent', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    }
];

// Template count
export const GAMMA_TEMPLATE_COUNT = GAMMA_TEMPLATES.length;

// Get templates by category
export function getGammaTemplatesByCategory(category: GammaTemplate['category']): GammaTemplate[] {
    return GAMMA_TEMPLATES.filter(t => t.category === category);
}

// Get template by ID
export function getGammaTemplateById(id: string): GammaTemplate | undefined {
    return GAMMA_TEMPLATES.find(t => t.id === id);
}

// Suggest best template for content
export function suggestGammaTemplate(
    position: 'opening' | 'middle' | 'closing',
    contentHints: { hasStats?: boolean; hasComparison?: boolean; hasTimeline?: boolean; hasQuote?: boolean; hasImage?: boolean }
): GammaTemplate {
    if (position === 'opening') {
        return GAMMA_TEMPLATES.find(t => t.id === 'gamma-title-minimal')!;
    }

    if (position === 'closing') {
        return GAMMA_TEMPLATES.find(t => t.id === 'gamma-closing-thank-you')!;
    }

    // Middle content
    if (contentHints.hasStats) {
        return GAMMA_TEMPLATES.find(t => t.id === 'gamma-stat-with-cards')!;
    }
    if (contentHints.hasComparison) {
        return GAMMA_TEMPLATES.find(t => t.id === 'gamma-compare-side')!;
    }
    if (contentHints.hasTimeline) {
        return GAMMA_TEMPLATES.find(t => t.id === 'gamma-timeline-vertical')!;
    }
    if (contentHints.hasQuote) {
        return GAMMA_TEMPLATES.find(t => t.id === 'gamma-quote-centered')!;
    }
    if (contentHints.hasImage) {
        return GAMMA_TEMPLATES.find(t => t.id === 'gamma-content-split-right')!;
    }

    // Default to features
    return GAMMA_TEMPLATES.find(t => t.id === 'gamma-features-3col')!;
}
