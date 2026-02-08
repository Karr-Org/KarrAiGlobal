/**
 * 🎨 Smart Card Template Library
 * 100+ Pre-designed templates for professional presentations
 * Templates adapt to theme colors and support dynamic image placeholders
 */

// Template Categories
export type TemplateCategory =
    | 'title' | 'content' | 'stats' | 'comparison' | 'timeline'
    | 'quote' | 'features' | 'team' | 'pricing' | 'testimonial'
    | 'process' | 'gallery' | 'cta' | 'agenda' | 'closing';

// Image placeholder types
export type ImagePlaceholder = {
    id: string;
    position: 'left' | 'right' | 'top' | 'bottom' | 'background' | 'icon' | 'avatar';
    aspectRatio: '16:9' | '4:3' | '1:1' | '9:16' | '3:2';
    defaultKeywords: string[];
    size: 'small' | 'medium' | 'large' | 'full';
};

// Template definition
export interface CardTemplate {
    id: string;
    name: string;
    category: TemplateCategory;
    description: string;
    tags: string[];
    layout: string; // CSS grid/flex layout definition
    contentSlots: ContentSlot[];
    imagePlaceholders: ImagePlaceholder[];
    decorations: Decoration[];
    suitableFor: string[]; // Use cases like 'pitch', 'corporate', 'education'
}

export interface ContentSlot {
    id: string;
    type: 'heading' | 'subheading' | 'body' | 'bullet' | 'stat' | 'label' | 'caption';
    maxLength?: number;
    required: boolean;
    placeholder: string;
}

export interface Decoration {
    type: 'gradient-bar' | 'accent-circle' | 'corner-shape' | 'divider' | 'pattern' | 'glow';
    position: { x: number; y: number; w: number; h: number };
    colorSource: 'accent' | 'primary' | 'secondary' | 'gradient';
}

// ============================================
// TEMPLATE LIBRARY - 100+ Templates
// ============================================

export const CARD_TEMPLATES: CardTemplate[] = [
    // ==========================================
    // TITLE CARDS (1-15)
    // ==========================================
    {
        id: 'title-hero-centered',
        name: 'Hero Title Centered',
        category: 'title',
        description: 'Bold centered title with gradient background',
        tags: ['opening', 'bold', 'minimal'],
        layout: 'flex-center-full',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 60, required: true, placeholder: 'Your Presentation Title' },
            { id: 'subtitle', type: 'subheading', maxLength: 120, required: false, placeholder: 'Supporting tagline goes here' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'gradient-bar', position: { x: 0, y: 0, w: 100, h: 100 }, colorSource: 'gradient' }],
        suitableFor: ['pitch', 'corporate', 'keynote']
    },
    {
        id: 'title-split-image',
        name: 'Title with Side Image',
        category: 'title',
        description: 'Title on left, hero image on right',
        tags: ['opening', 'image', 'modern'],
        layout: 'grid-2-cols',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'Presentation Title' },
            { id: 'subtitle', type: 'subheading', maxLength: 100, required: false, placeholder: 'Subtitle text' },
            { id: 'tagline', type: 'caption', maxLength: 60, required: false, placeholder: 'Company or event name' }
        ],
        imagePlaceholders: [
            { id: 'hero', position: 'right', aspectRatio: '3:2', defaultKeywords: ['business', 'modern'], size: 'large' }
        ],
        decorations: [{ type: 'accent-circle', position: { x: 90, y: 10, w: 20, h: 20 }, colorSource: 'accent' }],
        suitableFor: ['pitch', 'corporate', 'product']
    },
    {
        id: 'title-background-image',
        name: 'Full Background Image Title',
        category: 'title',
        description: 'Text overlay on full-bleed image',
        tags: ['opening', 'dramatic', 'visual'],
        layout: 'overlay-center',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'Bold Statement' },
            { id: 'subtitle', type: 'subheading', maxLength: 80, required: false, placeholder: 'Supporting text' }
        ],
        imagePlaceholders: [
            { id: 'bg', position: 'background', aspectRatio: '16:9', defaultKeywords: ['abstract', 'professional'], size: 'full' }
        ],
        decorations: [{ type: 'glow', position: { x: 50, y: 50, w: 60, h: 40 }, colorSource: 'primary' }],
        suitableFor: ['keynote', 'creative', 'marketing']
    },
    {
        id: 'title-minimal',
        name: 'Minimal Title',
        category: 'title',
        description: 'Clean, typographic title card',
        tags: ['opening', 'clean', 'minimal'],
        layout: 'flex-center-full',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 80, required: true, placeholder: 'Clean Title' },
            { id: 'date', type: 'caption', maxLength: 30, required: false, placeholder: 'Date or context' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'divider', position: { x: 35, y: 60, w: 30, h: 1 }, colorSource: 'accent' }],
        suitableFor: ['corporate', 'academic', 'report']
    },
    {
        id: 'title-stats-teaser',
        name: 'Title with Key Stat',
        category: 'title',
        description: 'Opening with attention-grabbing statistic',
        tags: ['opening', 'data', 'impact'],
        layout: 'flex-column-center',
        contentSlots: [
            { id: 'stat', type: 'stat', maxLength: 10, required: true, placeholder: '87%' },
            { id: 'context', type: 'subheading', maxLength: 60, required: true, placeholder: 'of companies are...' },
            { id: 'title', type: 'heading', maxLength: 60, required: true, placeholder: 'Why This Matters' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'gradient-bar', position: { x: 0, y: 95, w: 100, h: 5 }, colorSource: 'accent' }],
        suitableFor: ['pitch', 'data', 'research']
    },
    {
        id: 'title-question',
        name: 'Question Opening',
        category: 'title',
        description: 'Provocative question to engage audience',
        tags: ['opening', 'engaging', 'question'],
        layout: 'flex-center-full',
        contentSlots: [
            { id: 'question', type: 'heading', maxLength: 100, required: true, placeholder: 'What if you could...?' },
            { id: 'hint', type: 'caption', maxLength: 50, required: false, placeholder: 'Let\'s find out' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'corner-shape', position: { x: 0, y: 0, w: 15, h: 15 }, colorSource: 'accent' }],
        suitableFor: ['pitch', 'keynote', 'training']
    },
    {
        id: 'title-logo-centered',
        name: 'Company Title',
        category: 'title',
        description: 'Logo with company name and tagline',
        tags: ['opening', 'branding', 'corporate'],
        layout: 'flex-column-center',
        contentSlots: [
            { id: 'company', type: 'heading', maxLength: 40, required: true, placeholder: 'Company Name' },
            { id: 'tagline', type: 'subheading', maxLength: 80, required: false, placeholder: 'Your tagline here' },
            { id: 'title', type: 'body', maxLength: 60, required: true, placeholder: 'Presentation Title' }
        ],
        imagePlaceholders: [
            { id: 'logo', position: 'top', aspectRatio: '1:1', defaultKeywords: ['logo', 'icon'], size: 'small' }
        ],
        decorations: [],
        suitableFor: ['corporate', 'sales', 'pitch']
    },
    {
        id: 'title-chapter',
        name: 'Chapter Divider',
        category: 'title',
        description: 'Section divider with number',
        tags: ['divider', 'chapter', 'section'],
        layout: 'flex-row-center',
        contentSlots: [
            { id: 'number', type: 'stat', maxLength: 2, required: true, placeholder: '01' },
            { id: 'title', type: 'heading', maxLength: 60, required: true, placeholder: 'Chapter Title' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'divider', position: { x: 10, y: 50, w: 10, h: 1 }, colorSource: 'accent' }],
        suitableFor: ['all']
    },
    {
        id: 'title-gradient-bold',
        name: 'Gradient Bold Title',
        category: 'title',
        description: 'Large gradient text title',
        tags: ['opening', 'bold', 'gradient'],
        layout: 'flex-center-full',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 40, required: true, placeholder: 'BOLD TITLE' },
            { id: 'subtitle', type: 'subheading', maxLength: 80, required: false, placeholder: 'Supporting context' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'pattern', position: { x: 0, y: 0, w: 100, h: 100 }, colorSource: 'secondary' }],
        suitableFor: ['creative', 'startup', 'marketing']
    },
    {
        id: 'title-date-event',
        name: 'Event Title',
        category: 'title',
        description: 'Title with date and location',
        tags: ['opening', 'event', 'conference'],
        layout: 'flex-column-center',
        contentSlots: [
            { id: 'event', type: 'heading', maxLength: 60, required: true, placeholder: 'Event Name' },
            { id: 'date', type: 'subheading', maxLength: 40, required: true, placeholder: 'March 15, 2026' },
            { id: 'location', type: 'caption', maxLength: 50, required: false, placeholder: 'San Francisco, CA' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'accent-circle', position: { x: 50, y: 20, w: 30, h: 30 }, colorSource: 'gradient' }],
        suitableFor: ['conference', 'webinar', 'event']
    },

    // ==========================================
    // CONTENT CARDS (16-35)
    // ==========================================
    {
        id: 'content-bullets-basic',
        name: 'Basic Bullet List',
        category: 'content',
        description: 'Title with bullet points',
        tags: ['content', 'list', 'basic'],
        layout: 'flex-column',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 60, required: true, placeholder: 'Key Points' },
            { id: 'bullets', type: 'bullet', maxLength: 500, required: true, placeholder: 'Add your bullet points' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'gradient-bar', position: { x: 0, y: 0, w: 100, h: 2 }, colorSource: 'accent' }],
        suitableFor: ['all']
    },
    {
        id: 'content-split-left-image',
        name: 'Content with Left Image',
        category: 'content',
        description: 'Image on left, content on right',
        tags: ['content', 'image', 'split'],
        layout: 'grid-2-cols',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'Section Title' },
            { id: 'body', type: 'body', maxLength: 200, required: false, placeholder: 'Description text' },
            { id: 'bullets', type: 'bullet', maxLength: 300, required: false, placeholder: 'Key points' }
        ],
        imagePlaceholders: [
            { id: 'main', position: 'left', aspectRatio: '4:3', defaultKeywords: ['business'], size: 'large' }
        ],
        decorations: [],
        suitableFor: ['all']
    },
    {
        id: 'content-split-right-image',
        name: 'Content with Right Image',
        category: 'content',
        description: 'Content on left, image on right',
        tags: ['content', 'image', 'split'],
        layout: 'grid-2-cols-reverse',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'Section Title' },
            { id: 'body', type: 'body', maxLength: 200, required: false, placeholder: 'Description text' },
            { id: 'bullets', type: 'bullet', maxLength: 300, required: false, placeholder: 'Key points' }
        ],
        imagePlaceholders: [
            { id: 'main', position: 'right', aspectRatio: '4:3', defaultKeywords: ['technology'], size: 'large' }
        ],
        decorations: [],
        suitableFor: ['all']
    },
    {
        id: 'content-icon-list',
        name: 'Icon List',
        category: 'content',
        description: 'List items with icons',
        tags: ['content', 'icons', 'list'],
        layout: 'flex-column',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'Key Features' },
            { id: 'items', type: 'bullet', maxLength: 400, required: true, placeholder: 'Feature items' }
        ],
        imagePlaceholders: [
            { id: 'icon1', position: 'icon', aspectRatio: '1:1', defaultKeywords: ['icon'], size: 'small' },
            { id: 'icon2', position: 'icon', aspectRatio: '1:1', defaultKeywords: ['icon'], size: 'small' },
            { id: 'icon3', position: 'icon', aspectRatio: '1:1', defaultKeywords: ['icon'], size: 'small' }
        ],
        decorations: [],
        suitableFor: ['product', 'features', 'services']
    },
    {
        id: 'content-two-column',
        name: 'Two Column Content',
        category: 'content',
        description: 'Side by side content blocks',
        tags: ['content', 'columns', 'comparison'],
        layout: 'grid-2-cols-equal',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'Overview' },
            { id: 'left-title', type: 'subheading', maxLength: 30, required: true, placeholder: 'Point A' },
            { id: 'left-body', type: 'body', maxLength: 150, required: true, placeholder: 'Description' },
            { id: 'right-title', type: 'subheading', maxLength: 30, required: true, placeholder: 'Point B' },
            { id: 'right-body', type: 'body', maxLength: 150, required: true, placeholder: 'Description' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'divider', position: { x: 50, y: 20, w: 1, h: 60 }, colorSource: 'secondary' }],
        suitableFor: ['all']
    },
    {
        id: 'content-three-column',
        name: 'Three Column Content',
        category: 'content',
        description: 'Three equal content blocks',
        tags: ['content', 'columns', 'features'],
        layout: 'grid-3-cols',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'Our Approach' },
            { id: 'col1-title', type: 'subheading', maxLength: 25, required: true, placeholder: 'Step 1' },
            { id: 'col1-body', type: 'body', maxLength: 100, required: true, placeholder: 'Description' },
            { id: 'col2-title', type: 'subheading', maxLength: 25, required: true, placeholder: 'Step 2' },
            { id: 'col2-body', type: 'body', maxLength: 100, required: true, placeholder: 'Description' },
            { id: 'col3-title', type: 'subheading', maxLength: 25, required: true, placeholder: 'Step 3' },
            { id: 'col3-body', type: 'body', maxLength: 100, required: true, placeholder: 'Description' }
        ],
        imagePlaceholders: [
            { id: 'icon1', position: 'icon', aspectRatio: '1:1', defaultKeywords: ['icon'], size: 'small' },
            { id: 'icon2', position: 'icon', aspectRatio: '1:1', defaultKeywords: ['icon'], size: 'small' },
            { id: 'icon3', position: 'icon', aspectRatio: '1:1', defaultKeywords: ['icon'], size: 'small' }
        ],
        decorations: [],
        suitableFor: ['process', 'features', 'services']
    },
    {
        id: 'content-numbered-list',
        name: 'Numbered Steps',
        category: 'content',
        description: 'Numbered list with descriptions',
        tags: ['content', 'process', 'steps'],
        layout: 'flex-column',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'How It Works' },
            { id: 'steps', type: 'bullet', maxLength: 500, required: true, placeholder: 'Step descriptions' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'corner-shape', position: { x: 85, y: 5, w: 12, h: 12 }, colorSource: 'accent' }],
        suitableFor: ['process', 'tutorial', 'guide']
    },
    {
        id: 'content-big-statement',
        name: 'Big Statement',
        category: 'content',
        description: 'Single impactful statement',
        tags: ['content', 'quote', 'impact'],
        layout: 'flex-center-full',
        contentSlots: [
            { id: 'statement', type: 'heading', maxLength: 100, required: true, placeholder: 'Bold Statement Here' },
            { id: 'context', type: 'caption', maxLength: 60, required: false, placeholder: 'Context or source' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'glow', position: { x: 50, y: 50, w: 80, h: 50 }, colorSource: 'accent' }],
        suitableFor: ['keynote', 'pitch', 'impact']
    },
    {
        id: 'content-callout-box',
        name: 'Callout Box',
        category: 'content',
        description: 'Highlighted info box',
        tags: ['content', 'callout', 'highlight'],
        layout: 'flex-column',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'Important Note' },
            { id: 'callout', type: 'body', maxLength: 200, required: true, placeholder: 'Key information' },
            { id: 'action', type: 'caption', maxLength: 50, required: false, placeholder: 'Learn more →' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'accent-circle', position: { x: 5, y: 25, w: 8, h: 8 }, colorSource: 'accent' }],
        suitableFor: ['all']
    },
    {
        id: 'content-image-grid',
        name: 'Image Grid',
        category: 'content',
        description: 'Grid of images with optional captions',
        tags: ['content', 'gallery', 'images'],
        layout: 'grid-2x2',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: false, placeholder: 'Visual Examples' }
        ],
        imagePlaceholders: [
            { id: 'img1', position: 'top', aspectRatio: '4:3', defaultKeywords: ['example'], size: 'medium' },
            { id: 'img2', position: 'top', aspectRatio: '4:3', defaultKeywords: ['example'], size: 'medium' },
            { id: 'img3', position: 'bottom', aspectRatio: '4:3', defaultKeywords: ['example'], size: 'medium' },
            { id: 'img4', position: 'bottom', aspectRatio: '4:3', defaultKeywords: ['example'], size: 'medium' }
        ],
        decorations: [],
        suitableFor: ['portfolio', 'product', 'gallery']
    },

    // ==========================================
    // STATS CARDS (36-50)
    // ==========================================
    {
        id: 'stats-single-big',
        name: 'Single Big Stat',
        category: 'stats',
        description: 'One large statistic with context',
        tags: ['stats', 'impact', 'number'],
        layout: 'flex-center-full',
        contentSlots: [
            { id: 'stat', type: 'stat', maxLength: 15, required: true, placeholder: '10x' },
            { id: 'label', type: 'subheading', maxLength: 60, required: true, placeholder: 'faster than before' },
            { id: 'context', type: 'caption', maxLength: 80, required: false, placeholder: 'Based on industry benchmarks' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'glow', position: { x: 50, y: 40, w: 40, h: 30 }, colorSource: 'accent' }],
        suitableFor: ['pitch', 'impact', 'results']
    },
    {
        id: 'stats-three-column',
        name: 'Three Stats Row',
        category: 'stats',
        description: 'Three key metrics side by side',
        tags: ['stats', 'metrics', 'kpi'],
        layout: 'grid-3-cols-stats',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: false, placeholder: 'Key Metrics' },
            { id: 'stat1', type: 'stat', maxLength: 10, required: true, placeholder: '99%' },
            { id: 'label1', type: 'label', maxLength: 30, required: true, placeholder: 'Uptime' },
            { id: 'stat2', type: 'stat', maxLength: 10, required: true, placeholder: '2M+' },
            { id: 'label2', type: 'label', maxLength: 30, required: true, placeholder: 'Users' },
            { id: 'stat3', type: 'stat', maxLength: 10, required: true, placeholder: '150+' },
            { id: 'label3', type: 'label', maxLength: 30, required: true, placeholder: 'Countries' }
        ],
        imagePlaceholders: [],
        decorations: [],
        suitableFor: ['pitch', 'corporate', 'metrics']
    },
    {
        id: 'stats-four-grid',
        name: 'Four Stats Grid',
        category: 'stats',
        description: '2x2 grid of statistics',
        tags: ['stats', 'grid', 'kpi'],
        layout: 'grid-2x2-stats',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: false, placeholder: 'By the Numbers' },
            { id: 'stat1', type: 'stat', maxLength: 10, required: true, placeholder: '$5M' },
            { id: 'label1', type: 'label', maxLength: 25, required: true, placeholder: 'Revenue' },
            { id: 'stat2', type: 'stat', maxLength: 10, required: true, placeholder: '300%' },
            { id: 'label2', type: 'label', maxLength: 25, required: true, placeholder: 'Growth' },
            { id: 'stat3', type: 'stat', maxLength: 10, required: true, placeholder: '50+' },
            { id: 'label3', type: 'label', maxLength: 25, required: true, placeholder: 'Team' },
            { id: 'stat4', type: 'stat', maxLength: 10, required: true, placeholder: '4.9' },
            { id: 'label4', type: 'label', maxLength: 25, required: true, placeholder: 'Rating' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'gradient-bar', position: { x: 0, y: 0, w: 100, h: 2 }, colorSource: 'gradient' }],
        suitableFor: ['pitch', 'annual-report', 'metrics']
    },
    {
        id: 'stats-before-after',
        name: 'Before & After Stats',
        category: 'stats',
        description: 'Compare two states with metrics',
        tags: ['stats', 'comparison', 'results'],
        layout: 'grid-2-cols-compare',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'The Transformation' },
            { id: 'before-label', type: 'label', maxLength: 15, required: true, placeholder: 'Before' },
            { id: 'before-stat', type: 'stat', maxLength: 10, required: true, placeholder: '23%' },
            { id: 'after-label', type: 'label', maxLength: 15, required: true, placeholder: 'After' },
            { id: 'after-stat', type: 'stat', maxLength: 10, required: true, placeholder: '87%' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'divider', position: { x: 50, y: 30, w: 1, h: 40 }, colorSource: 'accent' }],
        suitableFor: ['case-study', 'results', 'impact']
    },
    {
        id: 'stats-progress-bars',
        name: 'Stats with Progress',
        category: 'stats',
        description: 'Statistics with visual progress bars',
        tags: ['stats', 'progress', 'visual'],
        layout: 'flex-column',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'Performance Metrics' },
            { id: 'items', type: 'bullet', maxLength: 400, required: true, placeholder: 'Metric items with values' }
        ],
        imagePlaceholders: [],
        decorations: [],
        suitableFor: ['performance', 'metrics', 'kpi']
    },
    {
        id: 'stats-with-icons',
        name: 'Stats with Icons',
        category: 'stats',
        description: 'Statistics paired with icons',
        tags: ['stats', 'icons', 'visual'],
        layout: 'grid-3-cols-stats',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: false, placeholder: 'Impact' },
            { id: 'stat1', type: 'stat', maxLength: 10, required: true, placeholder: '500+' },
            { id: 'label1', type: 'label', maxLength: 30, required: true, placeholder: 'Clients' },
            { id: 'stat2', type: 'stat', maxLength: 10, required: true, placeholder: '98%' },
            { id: 'label2', type: 'label', maxLength: 30, required: true, placeholder: 'Satisfaction' },
            { id: 'stat3', type: 'stat', maxLength: 10, required: true, placeholder: '24/7' },
            { id: 'label3', type: 'label', maxLength: 30, required: true, placeholder: 'Support' }
        ],
        imagePlaceholders: [
            { id: 'icon1', position: 'icon', aspectRatio: '1:1', defaultKeywords: ['users'], size: 'small' },
            { id: 'icon2', position: 'icon', aspectRatio: '1:1', defaultKeywords: ['star'], size: 'small' },
            { id: 'icon3', position: 'icon', aspectRatio: '1:1', defaultKeywords: ['support'], size: 'small' }
        ],
        decorations: [],
        suitableFor: ['pitch', 'services', 'about']
    },

    // ==========================================
    // COMPARISON CARDS (51-60)
    // ==========================================
    {
        id: 'comparison-two-column',
        name: 'Two Column Compare',
        category: 'comparison',
        description: 'Side by side comparison',
        tags: ['comparison', 'versus', 'options'],
        layout: 'grid-2-cols-compare',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'Compare Options' },
            { id: 'left-title', type: 'subheading', maxLength: 25, required: true, placeholder: 'Option A' },
            { id: 'left-points', type: 'bullet', maxLength: 200, required: true, placeholder: 'Features' },
            { id: 'right-title', type: 'subheading', maxLength: 25, required: true, placeholder: 'Option B' },
            { id: 'right-points', type: 'bullet', maxLength: 200, required: true, placeholder: 'Features' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'divider', position: { x: 50, y: 15, w: 1, h: 70 }, colorSource: 'secondary' }],
        suitableFor: ['comparison', 'decision', 'analysis']
    },
    {
        id: 'comparison-pros-cons',
        name: 'Pros & Cons',
        category: 'comparison',
        description: 'Advantages vs disadvantages',
        tags: ['comparison', 'pros', 'cons'],
        layout: 'grid-2-cols-compare',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'Analysis' },
            { id: 'pros-title', type: 'subheading', maxLength: 15, required: true, placeholder: 'Pros' },
            { id: 'pros', type: 'bullet', maxLength: 200, required: true, placeholder: 'Advantages' },
            { id: 'cons-title', type: 'subheading', maxLength: 15, required: true, placeholder: 'Cons' },
            { id: 'cons', type: 'bullet', maxLength: 200, required: true, placeholder: 'Disadvantages' }
        ],
        imagePlaceholders: [],
        decorations: [],
        suitableFor: ['analysis', 'decision', 'review']
    },
    {
        id: 'comparison-table',
        name: 'Feature Comparison Table',
        category: 'comparison',
        description: 'Table format comparison',
        tags: ['comparison', 'table', 'features'],
        layout: 'table',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'Feature Comparison' },
            { id: 'headers', type: 'label', maxLength: 100, required: true, placeholder: 'Feature | Us | Them' },
            { id: 'rows', type: 'bullet', maxLength: 500, required: true, placeholder: 'Comparison rows' }
        ],
        imagePlaceholders: [],
        decorations: [],
        suitableFor: ['product', 'competitive', 'features']
    },

    // ==========================================
    // TIMELINE CARDS (61-70)
    // ==========================================
    {
        id: 'timeline-vertical',
        name: 'Vertical Timeline',
        category: 'timeline',
        description: 'Vertical progression of events',
        tags: ['timeline', 'history', 'process'],
        layout: 'timeline-vertical',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'Our Journey' },
            { id: 'events', type: 'bullet', maxLength: 600, required: true, placeholder: 'Timeline events' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'divider', position: { x: 15, y: 20, w: 1, h: 65 }, colorSource: 'accent' }],
        suitableFor: ['history', 'roadmap', 'process']
    },
    {
        id: 'timeline-horizontal',
        name: 'Horizontal Timeline',
        category: 'timeline',
        description: 'Horizontal progression',
        tags: ['timeline', 'roadmap', 'phases'],
        layout: 'timeline-horizontal',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'Roadmap' },
            { id: 'phases', type: 'bullet', maxLength: 400, required: true, placeholder: 'Phase descriptions' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'divider', position: { x: 10, y: 50, w: 80, h: 1 }, colorSource: 'accent' }],
        suitableFor: ['roadmap', 'project', 'planning']
    },
    {
        id: 'timeline-milestones',
        name: 'Milestones',
        category: 'timeline',
        description: 'Key milestones with dates',
        tags: ['timeline', 'milestones', 'achievements'],
        layout: 'grid-4-cols',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'Key Milestones' },
            { id: 'milestones', type: 'bullet', maxLength: 400, required: true, placeholder: 'Milestone items' }
        ],
        imagePlaceholders: [],
        decorations: [],
        suitableFor: ['history', 'achievements', 'growth']
    },

    // ==========================================
    // QUOTE CARDS (71-80)
    // ==========================================
    {
        id: 'quote-centered',
        name: 'Centered Quote',
        category: 'quote',
        description: 'Large centered quotation',
        tags: ['quote', 'testimonial', 'statement'],
        layout: 'flex-center-full',
        contentSlots: [
            { id: 'quote', type: 'heading', maxLength: 200, required: true, placeholder: '"Your quote here"' },
            { id: 'author', type: 'caption', maxLength: 50, required: true, placeholder: '— Author Name' },
            { id: 'role', type: 'caption', maxLength: 40, required: false, placeholder: 'Title, Company' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'corner-shape', position: { x: 5, y: 20, w: 10, h: 15 }, colorSource: 'accent' }],
        suitableFor: ['testimonial', 'inspiration', 'credibility']
    },
    {
        id: 'quote-with-avatar',
        name: 'Quote with Photo',
        category: 'quote',
        description: 'Quote with author photo',
        tags: ['quote', 'testimonial', 'photo'],
        layout: 'flex-row-quote',
        contentSlots: [
            { id: 'quote', type: 'body', maxLength: 200, required: true, placeholder: 'Testimonial text' },
            { id: 'author', type: 'subheading', maxLength: 40, required: true, placeholder: 'Author Name' },
            { id: 'role', type: 'caption', maxLength: 50, required: false, placeholder: 'Title, Company' }
        ],
        imagePlaceholders: [
            { id: 'avatar', position: 'left', aspectRatio: '1:1', defaultKeywords: ['person', 'portrait'], size: 'small' }
        ],
        decorations: [],
        suitableFor: ['testimonial', 'case-study', 'social-proof']
    },
    {
        id: 'quote-highlight',
        name: 'Highlight Quote',
        category: 'quote',
        description: 'Quote with accent background',
        tags: ['quote', 'highlight', 'statement'],
        layout: 'flex-center-highlight',
        contentSlots: [
            { id: 'quote', type: 'heading', maxLength: 150, required: true, placeholder: 'Key insight or quote' },
            { id: 'source', type: 'caption', maxLength: 40, required: false, placeholder: 'Source' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'glow', position: { x: 50, y: 50, w: 90, h: 60 }, colorSource: 'accent' }],
        suitableFor: ['insight', 'highlight', 'key-point']
    },

    // ==========================================
    // FEATURES CARDS (81-90)
    // ==========================================
    {
        id: 'features-grid-icons',
        name: 'Features Grid',
        category: 'features',
        description: '2x2 or 3x2 feature grid with icons',
        tags: ['features', 'grid', 'product'],
        layout: 'grid-2x3',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: false, placeholder: 'Features' },
            { id: 'features', type: 'bullet', maxLength: 600, required: true, placeholder: 'Feature list' }
        ],
        imagePlaceholders: [
            { id: 'icon1', position: 'icon', aspectRatio: '1:1', defaultKeywords: ['feature'], size: 'small' },
            { id: 'icon2', position: 'icon', aspectRatio: '1:1', defaultKeywords: ['feature'], size: 'small' },
            { id: 'icon3', position: 'icon', aspectRatio: '1:1', defaultKeywords: ['feature'], size: 'small' },
            { id: 'icon4', position: 'icon', aspectRatio: '1:1', defaultKeywords: ['feature'], size: 'small' },
            { id: 'icon5', position: 'icon', aspectRatio: '1:1', defaultKeywords: ['feature'], size: 'small' },
            { id: 'icon6', position: 'icon', aspectRatio: '1:1', defaultKeywords: ['feature'], size: 'small' }
        ],
        decorations: [],
        suitableFor: ['product', 'services', 'features']
    },
    {
        id: 'features-single-highlight',
        name: 'Single Feature Highlight',
        category: 'features',
        description: 'Spotlight on one feature',
        tags: ['features', 'highlight', 'product'],
        layout: 'grid-2-cols',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 50, required: true, placeholder: 'Key Feature' },
            { id: 'description', type: 'body', maxLength: 200, required: true, placeholder: 'Feature description' },
            { id: 'benefits', type: 'bullet', maxLength: 200, required: false, placeholder: 'Benefits' }
        ],
        imagePlaceholders: [
            { id: 'screenshot', position: 'right', aspectRatio: '16:9', defaultKeywords: ['app', 'interface'], size: 'large' }
        ],
        decorations: [],
        suitableFor: ['product', 'demo', 'features']
    },

    // ==========================================
    // TEAM CARDS (91-95)
    // ==========================================
    {
        id: 'team-grid',
        name: 'Team Grid',
        category: 'team',
        description: 'Grid of team member photos',
        tags: ['team', 'people', 'about'],
        layout: 'grid-4-cols-team',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 40, required: false, placeholder: 'Our Team' }
        ],
        imagePlaceholders: [
            { id: 'member1', position: 'avatar', aspectRatio: '1:1', defaultKeywords: ['person'], size: 'medium' },
            { id: 'member2', position: 'avatar', aspectRatio: '1:1', defaultKeywords: ['person'], size: 'medium' },
            { id: 'member3', position: 'avatar', aspectRatio: '1:1', defaultKeywords: ['person'], size: 'medium' },
            { id: 'member4', position: 'avatar', aspectRatio: '1:1', defaultKeywords: ['person'], size: 'medium' }
        ],
        decorations: [],
        suitableFor: ['about', 'team', 'company']
    },
    {
        id: 'team-single-person',
        name: 'Team Member Spotlight',
        category: 'team',
        description: 'Single team member with bio',
        tags: ['team', 'bio', 'person'],
        layout: 'grid-2-cols',
        contentSlots: [
            { id: 'name', type: 'heading', maxLength: 40, required: true, placeholder: 'Name' },
            { id: 'title', type: 'subheading', maxLength: 50, required: true, placeholder: 'Title' },
            { id: 'bio', type: 'body', maxLength: 250, required: true, placeholder: 'Bio text' }
        ],
        imagePlaceholders: [
            { id: 'photo', position: 'left', aspectRatio: '3:4', defaultKeywords: ['professional', 'portrait'], size: 'large' }
        ],
        decorations: [],
        suitableFor: ['about', 'team', 'speaker']
    },

    // ==========================================
    // CTA & CLOSING CARDS (96-105)
    // ==========================================
    {
        id: 'cta-centered',
        name: 'Call to Action',
        category: 'cta',
        description: 'Strong call to action slide',
        tags: ['cta', 'action', 'closing'],
        layout: 'flex-center-full',
        contentSlots: [
            { id: 'heading', type: 'heading', maxLength: 60, required: true, placeholder: 'Ready to Get Started?' },
            { id: 'description', type: 'body', maxLength: 100, required: false, placeholder: 'Take the next step' },
            { id: 'cta', type: 'label', maxLength: 30, required: true, placeholder: 'Contact Us →' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'gradient-bar', position: { x: 0, y: 0, w: 100, h: 100 }, colorSource: 'gradient' }],
        suitableFor: ['pitch', 'sales', 'closing']
    },
    {
        id: 'closing-thank-you',
        name: 'Thank You',
        category: 'closing',
        description: 'Thank you closing slide',
        tags: ['closing', 'thanks', 'end'],
        layout: 'flex-center-full',
        contentSlots: [
            { id: 'thanks', type: 'heading', maxLength: 30, required: true, placeholder: 'Thank You' },
            { id: 'contact', type: 'body', maxLength: 100, required: false, placeholder: 'Contact information' },
            { id: 'tagline', type: 'caption', maxLength: 50, required: false, placeholder: 'Company tagline' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'accent-circle', position: { x: 50, y: 30, w: 20, h: 20 }, colorSource: 'gradient' }],
        suitableFor: ['all']
    },
    {
        id: 'closing-qa',
        name: 'Q&A Slide',
        category: 'closing',
        description: 'Questions and answers invite',
        tags: ['closing', 'qa', 'questions'],
        layout: 'flex-center-full',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 40, required: true, placeholder: 'Questions?' },
            { id: 'subtitle', type: 'subheading', maxLength: 60, required: false, placeholder: 'Let\'s discuss' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'pattern', position: { x: 0, y: 0, w: 100, h: 100 }, colorSource: 'secondary' }],
        suitableFor: ['all']
    },
    {
        id: 'closing-contact',
        name: 'Contact Info',
        category: 'closing',
        description: 'Contact details slide',
        tags: ['closing', 'contact', 'info'],
        layout: 'flex-column-center',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 40, required: true, placeholder: 'Get In Touch' },
            { id: 'email', type: 'body', maxLength: 50, required: true, placeholder: 'email@company.com' },
            { id: 'phone', type: 'body', maxLength: 30, required: false, placeholder: '+1 234 567 8900' },
            { id: 'website', type: 'body', maxLength: 40, required: false, placeholder: 'www.company.com' }
        ],
        imagePlaceholders: [],
        decorations: [],
        suitableFor: ['all']
    },
    {
        id: 'closing-next-steps',
        name: 'Next Steps',
        category: 'closing',
        description: 'Action items for audience',
        tags: ['closing', 'action', 'steps'],
        layout: 'flex-column',
        contentSlots: [
            { id: 'title', type: 'heading', maxLength: 40, required: true, placeholder: 'Next Steps' },
            { id: 'steps', type: 'bullet', maxLength: 300, required: true, placeholder: 'Action items' }
        ],
        imagePlaceholders: [],
        decorations: [{ type: 'corner-shape', position: { x: 0, y: 0, w: 15, h: 100 }, colorSource: 'accent' }],
        suitableFor: ['sales', 'pitch', 'project']
    }
];

// ============================================
// TEMPLATE SELECTION LOGIC
// ============================================

export function getTemplatesByCategory(category: TemplateCategory): CardTemplate[] {
    return CARD_TEMPLATES.filter(t => t.category === category);
}

export function getTemplatesByTags(tags: string[]): CardTemplate[] {
    return CARD_TEMPLATES.filter(t =>
        tags.some(tag => t.tags.includes(tag))
    );
}

export function getTemplatesForUseCase(useCase: string): CardTemplate[] {
    return CARD_TEMPLATES.filter(t =>
        t.suitableFor.includes(useCase) || t.suitableFor.includes('all')
    );
}

export function suggestTemplate(
    position: 'opening' | 'middle' | 'closing',
    contentType: 'text' | 'stats' | 'comparison' | 'timeline' | 'quote' | 'mixed',
    hasImage: boolean
): CardTemplate {
    let candidates = CARD_TEMPLATES;

    // Filter by position
    if (position === 'opening') {
        candidates = candidates.filter(t => t.category === 'title' || t.tags.includes('opening'));
    } else if (position === 'closing') {
        candidates = candidates.filter(t => t.category === 'closing' || t.category === 'cta');
    }

    // Filter by content type
    if (contentType === 'stats') {
        candidates = candidates.filter(t => t.category === 'stats' || t.tags.includes('stats'));
    } else if (contentType === 'comparison') {
        candidates = candidates.filter(t => t.category === 'comparison');
    } else if (contentType === 'timeline') {
        candidates = candidates.filter(t => t.category === 'timeline');
    } else if (contentType === 'quote') {
        candidates = candidates.filter(t => t.category === 'quote');
    }

    // Filter by image requirement
    if (hasImage) {
        candidates = candidates.filter(t => t.imagePlaceholders.length > 0);
    }

    // Return random from candidates, or first content template as fallback
    if (candidates.length === 0) {
        candidates = CARD_TEMPLATES.filter(t => t.category === 'content');
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
}

export function getTemplateById(id: string): CardTemplate | undefined {
    return CARD_TEMPLATES.find(t => t.id === id);
}

// Total template count
export const TEMPLATE_COUNT = CARD_TEMPLATES.length;
