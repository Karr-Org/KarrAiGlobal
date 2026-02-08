/**
 * 🎨 Gamma-Style Card Template Library
 * Pre-designed templates with rich metadata for smart matching
 * Based on Gamma.app presentation templates
 */

// ============================================
// TYPES
// ============================================

export type TemplateCategory =
    | 'title'      // Opening slides, hero sections
    | 'content'    // Text-heavy slides with bullets/paragraphs
    | 'stats'      // Number-focused, metrics, KPIs
    | 'features'   // Feature grids, benefits
    | 'comparison' // Side-by-side, pros/cons, vs
    | 'timeline'   // Chronological, roadmaps, milestones
    | 'quote'      // Testimonials, quotes, callouts
    | 'team'       // Team members, profiles
    | 'pricing'    // Pricing tables, plans
    | 'cta'        // Call to action, closing slides
    | 'diagram'    // Process flows, cycles
    | 'gallery';   // Image grids, portfolios

export type PositionHint = 'first' | 'last' | 'middle' | 'any';
export type ToneType = 'professional' | 'casual' | 'inspiring' | 'educational' | 'persuasive' | 'storytelling' | 'creative';
export type PresentationType = 'pitch' | 'corporate' | 'educational' | 'marketing' | 'report' | 'creative' | 'sales' | 'product';

export interface TemplateSlot {
    id: string;
    type: 'heading' | 'subheading' | 'body' | 'bullet' | 'stat' | 'label' | 'caption' | 'quote' | 'author' | 'image';
    required: boolean;
    maxLength?: number;
    placeholder: string;
}

export interface TemplateImage {
    id: string;
    position: 'left' | 'right' | 'top' | 'bottom' | 'background' | 'icon';
    aspectRatio: '16:9' | '4:3' | '1:1' | '3:2';
    size: 'small' | 'medium' | 'large' | 'full';
}

export interface TemplateMetadata {
    category: TemplateCategory;
    positions: PositionHint[];              // Where in presentation this fits
    suitableFor: PresentationType[];        // What type of presentations
    tones: ToneType[];                      // What tone/mood it matches
    contentHints: string[];                 // Keywords to detect in content
    requiresImage: boolean;                 // Does this need an image?
    minItems?: number;                      // Min bullets/stats/features
    maxItems?: number;                      // Max bullets/stats/features
    keywords: string[];                     // Keywords for matching
}

export interface CardTemplate {
    id: string;
    name: string;
    description: string;
    version: number;
    metadata: TemplateMetadata;
    slots: TemplateSlot[];
    images: TemplateImage[];
    html: string;                           // The actual HTML template
    css?: string;                           // Optional custom CSS
    previewGradient: string;                // For UI preview
}

// ============================================
// TEMPLATE LIBRARY
// ============================================

export const CARD_TEMPLATE_LIBRARY: CardTemplate[] = [
    // ==========================================
    // TITLE TEMPLATES (1-8)
    // ==========================================
    {
        id: 'title-hero-centered',
        name: 'Hero Title Centered',
        description: 'Bold centered title with gradient background',
        version: 1,
        metadata: {
            category: 'title',
            positions: ['first'],
            suitableFor: ['pitch', 'corporate', 'marketing', 'creative'],
            tones: ['professional', 'inspiring', 'persuasive'],
            contentHints: ['opening', 'introduction', 'welcome'],
            requiresImage: false,
            keywords: ['title', 'hero', 'opening', 'introduction']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 80, placeholder: 'Your Presentation Title' },
            { id: 'subtitle', type: 'subheading', required: false, maxLength: 120, placeholder: 'A compelling subtitle' }
        ],
        images: [],
        previewGradient: 'from-violet-600 to-purple-700',
        html: `
            <div class="slide title-hero-centered">
                <div class="content-center">
                    <h1 class="title">{{title}}</h1>
                    {{#subtitle}}<p class="subtitle">{{subtitle}}</p>{{/subtitle}}
                </div>
            </div>
        `
    },
    {
        id: 'title-split-image',
        name: 'Title with Side Image',
        description: 'Title on left, hero image on right',
        version: 1,
        metadata: {
            category: 'title',
            positions: ['first'],
            suitableFor: ['pitch', 'corporate', 'marketing', 'sales'],
            tones: ['professional', 'persuasive'],
            contentHints: ['opening', 'product', 'visual'],
            requiresImage: true,
            keywords: ['title', 'image', 'product', 'visual']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 60, placeholder: 'Your Title' },
            { id: 'subtitle', type: 'subheading', required: false, maxLength: 100, placeholder: 'Your subtitle' },
            { id: 'tagline', type: 'caption', required: false, maxLength: 50, placeholder: 'Short tagline' }
        ],
        images: [
            { id: 'hero', position: 'right', aspectRatio: '4:3', size: 'large' }
        ],
        previewGradient: 'from-blue-600 to-indigo-700',
        html: `
            <div class="slide title-split-image">
                <div class="left-content">
                    <h1 class="title">{{title}}</h1>
                    {{#subtitle}}<p class="subtitle">{{subtitle}}</p>{{/subtitle}}
                    {{#tagline}}<span class="tagline">{{tagline}}</span>{{/tagline}}
                </div>
                <div class="right-image">
                    <img src="{{hero}}" alt="{{title}}" />
                </div>
            </div>
        `
    },
    {
        id: 'title-background-image',
        name: 'Full Background Image',
        description: 'Text overlay on full-bleed hero image',
        version: 1,
        metadata: {
            category: 'title',
            positions: ['first'],
            suitableFor: ['creative', 'marketing', 'pitch'],
            tones: ['inspiring', 'storytelling', 'creative'],
            contentHints: ['dramatic', 'visual', 'emotional'],
            requiresImage: true,
            keywords: ['background', 'dramatic', 'visual', 'hero']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 50, placeholder: 'Bold Title' },
            { id: 'subtitle', type: 'subheading', required: false, maxLength: 80, placeholder: 'Supporting text' }
        ],
        images: [
            { id: 'background', position: 'background', aspectRatio: '16:9', size: 'full' }
        ],
        previewGradient: 'from-slate-800 to-slate-900',
        html: `
            <div class="slide title-background-image" style="background-image: url('{{background}}')">
                <div class="overlay">
                    <h1 class="title">{{title}}</h1>
                    {{#subtitle}}<p class="subtitle">{{subtitle}}</p>{{/subtitle}}
                </div>
            </div>
        `
    },
    {
        id: 'title-minimal',
        name: 'Minimal Title',
        description: 'Clean, typography-focused title',
        version: 1,
        metadata: {
            category: 'title',
            positions: ['first'],
            suitableFor: ['corporate', 'report', 'educational'],
            tones: ['professional', 'educational'],
            contentHints: ['clean', 'simple', 'minimal'],
            requiresImage: false,
            keywords: ['minimal', 'clean', 'simple', 'corporate']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 80, placeholder: 'Presentation Title' },
            { id: 'subtitle', type: 'subheading', required: false, maxLength: 100, placeholder: 'Date or Author' }
        ],
        images: [],
        previewGradient: 'from-white to-gray-100',
        html: `
            <div class="slide title-minimal light">
                <div class="content-center">
                    <h1 class="title">{{title}}</h1>
                    {{#subtitle}}<p class="subtitle">{{subtitle}}</p>{{/subtitle}}
                </div>
            </div>
        `
    },
    {
        id: 'title-chapter',
        name: 'Chapter Divider',
        description: 'Section divider with chapter number',
        version: 1,
        metadata: {
            category: 'title',
            positions: ['middle'],
            suitableFor: ['report', 'educational', 'corporate'],
            tones: ['professional', 'educational'],
            contentHints: ['section', 'chapter', 'part', 'divider'],
            requiresImage: false,
            keywords: ['chapter', 'section', 'divider', 'part']
        },
        slots: [
            { id: 'number', type: 'stat', required: false, maxLength: 5, placeholder: '01' },
            { id: 'title', type: 'heading', required: true, maxLength: 50, placeholder: 'Section Title' },
            { id: 'description', type: 'body', required: false, maxLength: 150, placeholder: 'Brief description' }
        ],
        images: [],
        previewGradient: 'from-indigo-600 to-violet-700',
        html: `
            <div class="slide title-chapter">
                {{#number}}<span class="chapter-number">{{number}}</span>{{/number}}
                <h1 class="title">{{title}}</h1>
                {{#description}}<p class="description">{{description}}</p>{{/description}}
            </div>
        `
    },

    // ==========================================
    // CONTENT TEMPLATES (9-20)
    // ==========================================
    {
        id: 'content-bullets-left',
        name: 'Bullets with Image Right',
        description: 'Key points with supporting visual',
        version: 1,
        metadata: {
            category: 'content',
            positions: ['middle'],
            suitableFor: ['pitch', 'corporate', 'educational', 'sales'],
            tones: ['professional', 'educational', 'persuasive'],
            contentHints: ['points', 'list', 'features', 'benefits'],
            requiresImage: true,
            minItems: 2,
            maxItems: 5,
            keywords: ['points', 'benefits', 'features', 'why', 'how']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 60, placeholder: 'Your Heading' },
            { id: 'bullets', type: 'bullet', required: true, placeholder: 'Key point' }
        ],
        images: [
            { id: 'visual', position: 'right', aspectRatio: '4:3', size: 'large' }
        ],
        previewGradient: 'from-cyan-600 to-blue-700',
        html: `
            <div class="slide content-split">
                <div class="left-content">
                    <h2 class="title">{{title}}</h2>
                    <ul class="bullets">
                        {{#bullets}}<li>{{.}}</li>{{/bullets}}
                    </ul>
                </div>
                <div class="right-image">
                    <img src="{{visual}}" alt="{{title}}" />
                </div>
            </div>
        `
    },
    {
        id: 'content-image-left',
        name: 'Image Left with Content',
        description: 'Visual first, then key points',
        version: 1,
        metadata: {
            category: 'content',
            positions: ['middle'],
            suitableFor: ['pitch', 'marketing', 'creative', 'sales'],
            tones: ['professional', 'persuasive', 'storytelling'],
            contentHints: ['visual', 'product', 'showcase'],
            requiresImage: true,
            minItems: 2,
            maxItems: 4,
            keywords: ['product', 'showcase', 'visual', 'demo']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 60, placeholder: 'Your Heading' },
            { id: 'body', type: 'body', required: false, maxLength: 200, placeholder: 'Brief description' },
            { id: 'bullets', type: 'bullet', required: false, placeholder: 'Key point' }
        ],
        images: [
            { id: 'visual', position: 'left', aspectRatio: '4:3', size: 'large' }
        ],
        previewGradient: 'from-emerald-600 to-teal-700',
        html: `
            <div class="slide content-split reverse">
                <div class="left-image">
                    <img src="{{visual}}" alt="{{title}}" />
                </div>
                <div class="right-content">
                    <h2 class="title">{{title}}</h2>
                    {{#body}}<p class="body">{{body}}</p>{{/body}}
                    {{#bullets}}<ul class="bullets">{{#bullets}}<li>{{.}}</li>{{/bullets}}</ul>{{/bullets}}
                </div>
            </div>
        `
    },
    {
        id: 'content-text-only',
        name: 'Text Content',
        description: 'Clean text slide with bullet points',
        version: 1,
        metadata: {
            category: 'content',
            positions: ['middle'],
            suitableFor: ['corporate', 'educational', 'report'],
            tones: ['professional', 'educational'],
            contentHints: ['text', 'explanation', 'details'],
            requiresImage: false,
            minItems: 3,
            maxItems: 6,
            keywords: ['details', 'explain', 'understand', 'overview']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 60, placeholder: 'Your Heading' },
            { id: 'body', type: 'body', required: false, maxLength: 250, placeholder: 'Introduction text' },
            { id: 'bullets', type: 'bullet', required: true, placeholder: 'Key point' }
        ],
        images: [],
        previewGradient: 'from-slate-700 to-slate-800',
        html: `
            <div class="slide content-text">
                <h2 class="title">{{title}}</h2>
                {{#body}}<p class="body">{{body}}</p>{{/body}}
                <ul class="bullets">
                    {{#bullets}}<li>{{.}}</li>{{/bullets}}
                </ul>
            </div>
        `
    },
    {
        id: 'content-two-column',
        name: 'Two Column Content',
        description: 'Content split into two columns',
        version: 1,
        metadata: {
            category: 'content',
            positions: ['middle'],
            suitableFor: ['corporate', 'educational', 'report'],
            tones: ['professional', 'educational'],
            contentHints: ['dual', 'both', 'sides', 'balance'],
            requiresImage: false,
            minItems: 4,
            maxItems: 8,
            keywords: ['both', 'sides', 'dual', 'balance', 'aspects']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 60, placeholder: 'Your Heading' },
            { id: 'leftTitle', type: 'subheading', required: true, maxLength: 40, placeholder: 'Left Column' },
            { id: 'leftBullets', type: 'bullet', required: true, placeholder: 'Point' },
            { id: 'rightTitle', type: 'subheading', required: true, maxLength: 40, placeholder: 'Right Column' },
            { id: 'rightBullets', type: 'bullet', required: true, placeholder: 'Point' }
        ],
        images: [],
        previewGradient: 'from-purple-600 to-pink-700',
        html: `
            <div class="slide content-two-column">
                <h2 class="title">{{title}}</h2>
                <div class="columns">
                    <div class="column">
                        <h3 class="column-title">{{leftTitle}}</h3>
                        <ul class="bullets">{{#leftBullets}}<li>{{.}}</li>{{/leftBullets}}</ul>
                    </div>
                    <div class="column">
                        <h3 class="column-title">{{rightTitle}}</h3>
                        <ul class="bullets">{{#rightBullets}}<li>{{.}}</li>{{/rightBullets}}</ul>
                    </div>
                </div>
            </div>
        `
    },

    // ==========================================
    // STATS TEMPLATES (21-28)
    // ==========================================
    {
        id: 'stats-single-big',
        name: 'Big Single Stat',
        description: 'One impactful number, large and centered',
        version: 1,
        metadata: {
            category: 'stats',
            positions: ['middle'],
            suitableFor: ['pitch', 'marketing', 'sales'],
            tones: ['persuasive', 'inspiring'],
            contentHints: ['number', 'metric', 'stat', 'percentage', 'impact'],
            requiresImage: false,
            minItems: 1,
            maxItems: 1,
            keywords: ['big', 'impact', 'key', 'main', 'important']
        },
        slots: [
            { id: 'stat', type: 'stat', required: true, maxLength: 15, placeholder: '50M+' },
            { id: 'label', type: 'label', required: true, maxLength: 40, placeholder: 'Active Users' },
            { id: 'context', type: 'body', required: false, maxLength: 100, placeholder: 'Additional context' }
        ],
        images: [],
        previewGradient: 'from-amber-500 to-orange-600',
        html: `
            <div class="slide stats-single">
                <div class="stat-display">
                    <span class="stat-value">{{stat}}</span>
                    <span class="stat-label">{{label}}</span>
                </div>
                {{#context}}<p class="context">{{context}}</p>{{/context}}
            </div>
        `
    },
    {
        id: 'stats-three-row',
        name: '3 Stats Row',
        description: 'Three key metrics in a row',
        version: 1,
        metadata: {
            category: 'stats',
            positions: ['middle'],
            suitableFor: ['pitch', 'corporate', 'sales', 'report'],
            tones: ['professional', 'persuasive'],
            contentHints: ['metrics', 'numbers', 'kpi', 'data'],
            requiresImage: false,
            minItems: 3,
            maxItems: 3,
            keywords: ['metrics', 'numbers', 'kpi', 'performance', 'results']
        },
        slots: [
            { id: 'title', type: 'heading', required: false, maxLength: 50, placeholder: 'Key Metrics' },
            { id: 'stat1', type: 'stat', required: true, maxLength: 15, placeholder: '50M+' },
            { id: 'label1', type: 'label', required: true, maxLength: 30, placeholder: 'Users' },
            { id: 'stat2', type: 'stat', required: true, maxLength: 15, placeholder: '99.9%' },
            { id: 'label2', type: 'label', required: true, maxLength: 30, placeholder: 'Uptime' },
            { id: 'stat3', type: 'stat', required: true, maxLength: 15, placeholder: '$2B' },
            { id: 'label3', type: 'label', required: true, maxLength: 30, placeholder: 'Revenue' }
        ],
        images: [],
        previewGradient: 'from-blue-600 to-cyan-600',
        html: `
            <div class="slide stats-row">
                {{#title}}<h2 class="title">{{title}}</h2>{{/title}}
                <div class="stats-grid three">
                    <div class="stat-item">
                        <span class="stat-value">{{stat1}}</span>
                        <span class="stat-label">{{label1}}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">{{stat2}}</span>
                        <span class="stat-label">{{label2}}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">{{stat3}}</span>
                        <span class="stat-label">{{label3}}</span>
                    </div>
                </div>
            </div>
        `
    },
    {
        id: 'stats-four-grid',
        name: '4 Stats Grid',
        description: 'Four metrics in a 2x2 grid',
        version: 1,
        metadata: {
            category: 'stats',
            positions: ['middle'],
            suitableFor: ['pitch', 'corporate', 'report'],
            tones: ['professional', 'persuasive'],
            contentHints: ['metrics', 'numbers', 'kpi', 'comprehensive'],
            requiresImage: false,
            minItems: 4,
            maxItems: 4,
            keywords: ['metrics', 'kpi', 'dashboard', 'overview', 'comprehensive']
        },
        slots: [
            { id: 'title', type: 'heading', required: false, maxLength: 50, placeholder: 'Our Numbers' },
            { id: 'stat1', type: 'stat', required: true, maxLength: 15, placeholder: '100+' },
            { id: 'label1', type: 'label', required: true, maxLength: 25, placeholder: 'Clients' },
            { id: 'stat2', type: 'stat', required: true, maxLength: 15, placeholder: '50+' },
            { id: 'label2', type: 'label', required: true, maxLength: 25, placeholder: 'Countries' },
            { id: 'stat3', type: 'stat', required: true, maxLength: 15, placeholder: '10M+' },
            { id: 'label3', type: 'label', required: true, maxLength: 25, placeholder: 'Users' },
            { id: 'stat4', type: 'stat', required: true, maxLength: 15, placeholder: '99%' },
            { id: 'label4', type: 'label', required: true, maxLength: 25, placeholder: 'Satisfaction' }
        ],
        images: [],
        previewGradient: 'from-indigo-600 to-purple-700',
        html: `
            <div class="slide stats-grid-four">
                {{#title}}<h2 class="title">{{title}}</h2>{{/title}}
                <div class="stats-grid four">
                    <div class="stat-item"><span class="stat-value">{{stat1}}</span><span class="stat-label">{{label1}}</span></div>
                    <div class="stat-item"><span class="stat-value">{{stat2}}</span><span class="stat-label">{{label2}}</span></div>
                    <div class="stat-item"><span class="stat-value">{{stat3}}</span><span class="stat-label">{{label3}}</span></div>
                    <div class="stat-item"><span class="stat-value">{{stat4}}</span><span class="stat-label">{{label4}}</span></div>
                </div>
            </div>
        `
    },
    {
        id: 'stats-with-context',
        name: 'Stats with Context',
        description: 'Stats with explanatory text',
        version: 1,
        metadata: {
            category: 'stats',
            positions: ['middle'],
            suitableFor: ['pitch', 'report', 'educational'],
            tones: ['professional', 'educational'],
            contentHints: ['explain', 'context', 'data', 'analysis'],
            requiresImage: false,
            minItems: 2,
            maxItems: 3,
            keywords: ['data', 'analysis', 'explain', 'context', 'insight']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 60, placeholder: 'What the Numbers Say' },
            { id: 'body', type: 'body', required: true, maxLength: 200, placeholder: 'Context and explanation' },
            { id: 'stat1', type: 'stat', required: true, maxLength: 15, placeholder: '85%' },
            { id: 'label1', type: 'label', required: true, maxLength: 40, placeholder: 'Growth rate YoY' },
            { id: 'stat2', type: 'stat', required: true, maxLength: 15, placeholder: '3x' },
            { id: 'label2', type: 'label', required: true, maxLength: 40, placeholder: 'Revenue multiplier' }
        ],
        images: [],
        previewGradient: 'from-teal-600 to-emerald-600',
        html: `
            <div class="slide stats-context">
                <div class="content-section">
                    <h2 class="title">{{title}}</h2>
                    <p class="body">{{body}}</p>
                </div>
                <div class="stats-section">
                    <div class="stat-item"><span class="stat-value">{{stat1}}</span><span class="stat-label">{{label1}}</span></div>
                    <div class="stat-item"><span class="stat-value">{{stat2}}</span><span class="stat-label">{{label2}}</span></div>
                </div>
            </div>
        `
    },

    // ==========================================
    // FEATURES TEMPLATES (29-35)
    // ==========================================
    {
        id: 'features-three-column',
        name: '3 Features Grid',
        description: 'Three features with icons',
        version: 1,
        metadata: {
            category: 'features',
            positions: ['middle'],
            suitableFor: ['pitch', 'sales', 'marketing', 'product'],
            tones: ['professional', 'persuasive'],
            contentHints: ['features', 'benefits', 'capabilities', 'what we offer'],
            requiresImage: false,
            minItems: 3,
            maxItems: 3,
            keywords: ['features', 'benefits', 'capabilities', 'offer', 'provide']
        },
        slots: [
            { id: 'title', type: 'heading', required: false, maxLength: 50, placeholder: 'Key Features' },
            { id: 'f1Title', type: 'subheading', required: true, maxLength: 30, placeholder: 'Feature 1' },
            { id: 'f1Desc', type: 'body', required: true, maxLength: 100, placeholder: 'Description' },
            { id: 'f2Title', type: 'subheading', required: true, maxLength: 30, placeholder: 'Feature 2' },
            { id: 'f2Desc', type: 'body', required: true, maxLength: 100, placeholder: 'Description' },
            { id: 'f3Title', type: 'subheading', required: true, maxLength: 30, placeholder: 'Feature 3' },
            { id: 'f3Desc', type: 'body', required: true, maxLength: 100, placeholder: 'Description' }
        ],
        images: [],
        previewGradient: 'from-rose-600 to-pink-700',
        html: `
            <div class="slide features-grid three">
                {{#title}}<h2 class="title">{{title}}</h2>{{/title}}
                <div class="features">
                    <div class="feature"><div class="icon">✦</div><h3>{{f1Title}}</h3><p>{{f1Desc}}</p></div>
                    <div class="feature"><div class="icon">✦</div><h3>{{f2Title}}</h3><p>{{f2Desc}}</p></div>
                    <div class="feature"><div class="icon">✦</div><h3>{{f3Title}}</h3><p>{{f3Desc}}</p></div>
                </div>
            </div>
        `
    },
    {
        id: 'features-four-grid',
        name: '4 Features Grid',
        description: 'Four features in 2x2 grid',
        version: 1,
        metadata: {
            category: 'features',
            positions: ['middle'],
            suitableFor: ['pitch', 'sales', 'marketing', 'corporate'],
            tones: ['professional', 'persuasive'],
            contentHints: ['features', 'benefits', 'advantages', 'pillars'],
            requiresImage: false,
            minItems: 4,
            maxItems: 4,
            keywords: ['features', 'pillars', 'advantages', 'benefits', 'strengths']
        },
        slots: [
            { id: 'title', type: 'heading', required: false, maxLength: 50, placeholder: 'Our Advantages' },
            { id: 'f1Title', type: 'subheading', required: true, maxLength: 25, placeholder: 'Feature 1' },
            { id: 'f1Desc', type: 'body', required: true, maxLength: 80, placeholder: 'Description' },
            { id: 'f2Title', type: 'subheading', required: true, maxLength: 25, placeholder: 'Feature 2' },
            { id: 'f2Desc', type: 'body', required: true, maxLength: 80, placeholder: 'Description' },
            { id: 'f3Title', type: 'subheading', required: true, maxLength: 25, placeholder: 'Feature 3' },
            { id: 'f3Desc', type: 'body', required: true, maxLength: 80, placeholder: 'Description' },
            { id: 'f4Title', type: 'subheading', required: true, maxLength: 25, placeholder: 'Feature 4' },
            { id: 'f4Desc', type: 'body', required: true, maxLength: 80, placeholder: 'Description' }
        ],
        images: [],
        previewGradient: 'from-violet-600 to-indigo-700',
        html: `
            <div class="slide features-grid four">
                {{#title}}<h2 class="title">{{title}}</h2>{{/title}}
                <div class="features">
                    <div class="feature"><div class="icon">⚡</div><h3>{{f1Title}}</h3><p>{{f1Desc}}</p></div>
                    <div class="feature"><div class="icon">🎯</div><h3>{{f2Title}}</h3><p>{{f2Desc}}</p></div>
                    <div class="feature"><div class="icon">🚀</div><h3>{{f3Title}}</h3><p>{{f3Desc}}</p></div>
                    <div class="feature"><div class="icon">✨</div><h3>{{f4Title}}</h3><p>{{f4Desc}}</p></div>
                </div>
            </div>
        `
    },
    {
        id: 'features-icon-list',
        name: 'Icon List',
        description: 'Vertical list with icons',
        version: 1,
        metadata: {
            category: 'features',
            positions: ['middle'],
            suitableFor: ['pitch', 'sales', 'educational'],
            tones: ['professional', 'educational'],
            contentHints: ['list', 'steps', 'items', 'checklist'],
            requiresImage: false,
            minItems: 3,
            maxItems: 5,
            keywords: ['list', 'steps', 'includes', 'checklist', 'items']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 50, placeholder: 'What\'s Included' },
            { id: 'items', type: 'bullet', required: true, placeholder: 'Item description' }
        ],
        images: [],
        previewGradient: 'from-green-600 to-emerald-700',
        html: `
            <div class="slide icon-list">
                <h2 class="title">{{title}}</h2>
                <ul class="icon-items">
                    {{#items}}<li><span class="icon">✓</span><span>{{.}}</span></li>{{/items}}
                </ul>
            </div>
        `
    },

    // ==========================================
    // COMPARISON TEMPLATES (36-40)
    // ==========================================
    {
        id: 'compare-side-by-side',
        name: 'Side by Side Comparison',
        description: 'Two options compared',
        version: 1,
        metadata: {
            category: 'comparison',
            positions: ['middle'],
            suitableFor: ['pitch', 'sales', 'educational'],
            tones: ['professional', 'persuasive', 'educational'],
            contentHints: ['compare', 'versus', 'vs', 'difference', 'options'],
            requiresImage: false,
            minItems: 3,
            maxItems: 5,
            keywords: ['compare', 'versus', 'vs', 'difference', 'better', 'alternative']
        },
        slots: [
            { id: 'title', type: 'heading', required: false, maxLength: 50, placeholder: 'The Comparison' },
            { id: 'leftTitle', type: 'subheading', required: true, maxLength: 30, placeholder: 'Option A' },
            { id: 'rightTitle', type: 'subheading', required: true, maxLength: 30, placeholder: 'Option B' },
            { id: 'leftPoints', type: 'bullet', required: true, placeholder: 'Point' },
            { id: 'rightPoints', type: 'bullet', required: true, placeholder: 'Point' }
        ],
        images: [],
        previewGradient: 'from-red-600 to-rose-700',
        html: `
            <div class="slide compare-side">
                {{#title}}<h2 class="title">{{title}}</h2>{{/title}}
                <div class="comparison">
                    <div class="column left">
                        <h3 class="column-title">{{leftTitle}}</h3>
                        <ul>{{#leftPoints}}<li>{{.}}</li>{{/leftPoints}}</ul>
                    </div>
                    <div class="divider"></div>
                    <div class="column right">
                        <h3 class="column-title">{{rightTitle}}</h3>
                        <ul>{{#rightPoints}}<li>{{.}}</li>{{/rightPoints}}</ul>
                    </div>
                </div>
            </div>
        `
    },
    {
        id: 'compare-pros-cons',
        name: 'Pros and Cons',
        description: 'Advantages vs disadvantages',
        version: 1,
        metadata: {
            category: 'comparison',
            positions: ['middle'],
            suitableFor: ['educational', 'report', 'sales'],
            tones: ['educational', 'professional'],
            contentHints: ['pros', 'cons', 'advantages', 'disadvantages'],
            requiresImage: false,
            minItems: 2,
            maxItems: 4,
            keywords: ['pros', 'cons', 'advantages', 'disadvantages', 'tradeoffs']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 50, placeholder: 'Weighing the Options' },
            { id: 'pros', type: 'bullet', required: true, placeholder: 'Advantage' },
            { id: 'cons', type: 'bullet', required: true, placeholder: 'Disadvantage' }
        ],
        images: [],
        previewGradient: 'from-emerald-500 to-red-500',
        html: `
            <div class="slide pros-cons">
                <h2 class="title">{{title}}</h2>
                <div class="comparison">
                    <div class="column pros">
                        <h3 class="column-title">✓ Pros</h3>
                        <ul>{{#pros}}<li>{{.}}</li>{{/pros}}</ul>
                    </div>
                    <div class="column cons">
                        <h3 class="column-title">✗ Cons</h3>
                        <ul>{{#cons}}<li>{{.}}</li>{{/cons}}</ul>
                    </div>
                </div>
            </div>
        `
    },

    // ==========================================
    // TIMELINE TEMPLATES (41-45)
    // ==========================================
    {
        id: 'timeline-horizontal',
        name: 'Horizontal Timeline',
        description: 'Events on a horizontal timeline',
        version: 1,
        metadata: {
            category: 'timeline',
            positions: ['middle'],
            suitableFor: ['pitch', 'corporate', 'educational', 'report'],
            tones: ['professional', 'storytelling'],
            contentHints: ['timeline', 'history', 'milestones', 'roadmap', 'journey'],
            requiresImage: false,
            minItems: 3,
            maxItems: 5,
            keywords: ['timeline', 'history', 'milestones', 'journey', 'roadmap', 'when']
        },
        slots: [
            { id: 'title', type: 'heading', required: false, maxLength: 50, placeholder: 'Our Journey' },
            { id: 'events', type: 'bullet', required: true, placeholder: '2023: Milestone achieved' }
        ],
        images: [],
        previewGradient: 'from-blue-600 to-indigo-700',
        html: `
            <div class="slide timeline-horizontal">
                {{#title}}<h2 class="title">{{title}}</h2>{{/title}}
                <div class="timeline">
                    {{#events}}<div class="event"><div class="dot"></div><span>{{.}}</span></div>{{/events}}
                </div>
            </div>
        `
    },
    {
        id: 'timeline-vertical',
        name: 'Vertical Timeline',
        description: 'Detailed vertical timeline',
        version: 1,
        metadata: {
            category: 'timeline',
            positions: ['middle'],
            suitableFor: ['pitch', 'report', 'educational'],
            tones: ['professional', 'storytelling', 'educational'],
            contentHints: ['history', 'progress', 'evolution', 'development'],
            requiresImage: false,
            minItems: 3,
            maxItems: 6,
            keywords: ['history', 'evolution', 'progress', 'development', 'growth']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 50, placeholder: 'Our Story' },
            { id: 'e1Year', type: 'label', required: true, maxLength: 10, placeholder: '2020' },
            { id: 'e1Title', type: 'subheading', required: true, maxLength: 40, placeholder: 'Founded' },
            { id: 'e1Desc', type: 'body', required: false, maxLength: 100, placeholder: 'Description' },
            { id: 'e2Year', type: 'label', required: true, maxLength: 10, placeholder: '2022' },
            { id: 'e2Title', type: 'subheading', required: true, maxLength: 40, placeholder: 'Series A' },
            { id: 'e2Desc', type: 'body', required: false, maxLength: 100, placeholder: 'Description' },
            { id: 'e3Year', type: 'label', required: true, maxLength: 10, placeholder: '2024' },
            { id: 'e3Title', type: 'subheading', required: true, maxLength: 40, placeholder: 'Scale' },
            { id: 'e3Desc', type: 'body', required: false, maxLength: 100, placeholder: 'Description' }
        ],
        images: [],
        previewGradient: 'from-purple-600 to-violet-700',
        html: `
            <div class="slide timeline-vertical">
                <h2 class="title">{{title}}</h2>
                <div class="timeline">
                    <div class="event"><span class="year">{{e1Year}}</span><div class="content"><h4>{{e1Title}}</h4>{{#e1Desc}}<p>{{e1Desc}}</p>{{/e1Desc}}</div></div>
                    <div class="event"><span class="year">{{e2Year}}</span><div class="content"><h4>{{e2Title}}</h4>{{#e2Desc}}<p>{{e2Desc}}</p>{{/e2Desc}}</div></div>
                    <div class="event"><span class="year">{{e3Year}}</span><div class="content"><h4>{{e3Title}}</h4>{{#e3Desc}}<p>{{e3Desc}}</p>{{/e3Desc}}</div></div>
                </div>
            </div>
        `
    },

    // ==========================================
    // QUOTE TEMPLATES (46-50)
    // ==========================================
    {
        id: 'quote-centered',
        name: 'Centered Quote',
        description: 'Large centered quote',
        version: 1,
        metadata: {
            category: 'quote',
            positions: ['middle'],
            suitableFor: ['pitch', 'marketing', 'creative'],
            tones: ['inspiring', 'storytelling', 'persuasive'],
            contentHints: ['quote', 'testimonial', 'said', 'words'],
            requiresImage: false,
            keywords: ['quote', 'testimonial', 'said', 'believe', 'words']
        },
        slots: [
            { id: 'quote', type: 'quote', required: true, maxLength: 200, placeholder: 'The impactful quote goes here...' },
            { id: 'author', type: 'author', required: true, maxLength: 50, placeholder: 'Author Name' },
            { id: 'role', type: 'caption', required: false, maxLength: 50, placeholder: 'Title, Company' }
        ],
        images: [],
        previewGradient: 'from-amber-500 to-orange-600',
        html: `
            <div class="slide quote-centered">
                <blockquote class="quote">"{{quote}}"</blockquote>
                <cite class="attribution">
                    <span class="author">{{author}}</span>
                    {{#role}}<span class="role">{{role}}</span>{{/role}}
                </cite>
            </div>
        `
    },
    {
        id: 'quote-with-image',
        name: 'Quote with Photo',
        description: 'Quote with author photo',
        version: 1,
        metadata: {
            category: 'quote',
            positions: ['middle'],
            suitableFor: ['pitch', 'marketing', 'sales'],
            tones: ['storytelling', 'persuasive'],
            contentHints: ['testimonial', 'customer', 'feedback', 'review'],
            requiresImage: true,
            keywords: ['testimonial', 'customer', 'feedback', 'review', 'said']
        },
        slots: [
            { id: 'quote', type: 'quote', required: true, maxLength: 180, placeholder: 'Customer testimonial...' },
            { id: 'author', type: 'author', required: true, maxLength: 40, placeholder: 'Customer Name' },
            { id: 'role', type: 'caption', required: true, maxLength: 50, placeholder: 'CEO, Company' }
        ],
        images: [
            { id: 'avatar', position: 'icon', aspectRatio: '1:1', size: 'small' }
        ],
        previewGradient: 'from-teal-600 to-cyan-600',
        html: `
            <div class="slide quote-image">
                <blockquote class="quote">"{{quote}}"</blockquote>
                <div class="author-section">
                    <img src="{{avatar}}" alt="{{author}}" class="avatar" />
                    <div class="author-info">
                        <span class="author">{{author}}</span>
                        <span class="role">{{role}}</span>
                    </div>
                </div>
            </div>
        `
    },

    // ==========================================
    // CTA/CLOSING TEMPLATES (51-55)
    // ==========================================
    {
        id: 'cta-simple',
        name: 'Simple CTA',
        description: 'Clean call to action',
        version: 1,
        metadata: {
            category: 'cta',
            positions: ['last'],
            suitableFor: ['pitch', 'sales', 'marketing'],
            tones: ['persuasive', 'professional'],
            contentHints: ['cta', 'action', 'next', 'contact', 'start'],
            requiresImage: false,
            keywords: ['contact', 'start', 'try', 'get', 'book', 'schedule', 'next']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 50, placeholder: 'Ready to Get Started?' },
            { id: 'subtitle', type: 'subheading', required: false, maxLength: 100, placeholder: 'Let\'s discuss how we can help' },
            { id: 'cta', type: 'label', required: true, maxLength: 30, placeholder: 'Contact Us' }
        ],
        images: [],
        previewGradient: 'from-rose-600 to-pink-700',
        html: `
            <div class="slide cta-simple">
                <h1 class="title">{{title}}</h1>
                {{#subtitle}}<p class="subtitle">{{subtitle}}</p>{{/subtitle}}
                <button class="cta-button">{{cta}}</button>
            </div>
        `
    },
    {
        id: 'cta-contact',
        name: 'Contact Details',
        description: 'Closing with contact info',
        version: 1,
        metadata: {
            category: 'cta',
            positions: ['last'],
            suitableFor: ['pitch', 'corporate', 'sales'],
            tones: ['professional'],
            contentHints: ['contact', 'email', 'phone', 'website', 'reach'],
            requiresImage: false,
            keywords: ['contact', 'email', 'phone', 'website', 'reach', 'touch']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, placeholder: 'Get in Touch' },
            { id: 'email', type: 'label', required: true, maxLength: 50, placeholder: 'hello@company.com' },
            { id: 'phone', type: 'label', required: false, maxLength: 20, placeholder: '+1 234 567 890' },
            { id: 'website', type: 'label', required: false, maxLength: 40, placeholder: 'www.company.com' }
        ],
        images: [],
        previewGradient: 'from-slate-700 to-slate-800',
        html: `
            <div class="slide cta-contact">
                <h1 class="title">{{title}}</h1>
                <div class="contact-info">
                    <div class="item"><span class="label">Email</span><span class="value">{{email}}</span></div>
                    {{#phone}}<div class="item"><span class="label">Phone</span><span class="value">{{phone}}</span></div>{{/phone}}
                    {{#website}}<div class="item"><span class="label">Website</span><span class="value">{{website}}</span></div>{{/website}}
                </div>
            </div>
        `
    },
    {
        id: 'cta-thank-you',
        name: 'Thank You',
        description: 'Simple thank you closing',
        version: 1,
        metadata: {
            category: 'cta',
            positions: ['last'],
            suitableFor: ['pitch', 'corporate', 'educational', 'report'],
            tones: ['professional', 'casual'],
            contentHints: ['thank', 'questions', 'end', 'closing'],
            requiresImage: false,
            keywords: ['thank', 'questions', 'end', 'appreciate', 'closing']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 30, placeholder: 'Thank You' },
            { id: 'subtitle', type: 'subheading', required: false, maxLength: 50, placeholder: 'Questions?' }
        ],
        images: [],
        previewGradient: 'from-violet-600 to-purple-700',
        html: `
            <div class="slide cta-thank-you">
                <h1 class="title">{{title}}</h1>
                {{#subtitle}}<p class="subtitle">{{subtitle}}</p>{{/subtitle}}
            </div>
        `
    },

    // ==========================================
    // PRICING TEMPLATES (56-58)
    // ==========================================
    {
        id: 'pricing-three-tier',
        name: '3-Tier Pricing',
        description: 'Three pricing plans',
        version: 1,
        metadata: {
            category: 'pricing',
            positions: ['middle'],
            suitableFor: ['pitch', 'sales', 'marketing'],
            tones: ['professional', 'persuasive'],
            contentHints: ['pricing', 'plans', 'tiers', 'packages', 'cost'],
            requiresImage: false,
            minItems: 3,
            maxItems: 3,
            keywords: ['pricing', 'plans', 'cost', 'packages', 'tiers', 'subscribe']
        },
        slots: [
            { id: 'title', type: 'heading', required: false, maxLength: 40, placeholder: 'Choose Your Plan' },
            { id: 'p1Name', type: 'subheading', required: true, maxLength: 20, placeholder: 'Starter' },
            { id: 'p1Price', type: 'stat', required: true, maxLength: 15, placeholder: '$29' },
            { id: 'p1Features', type: 'bullet', required: true, placeholder: 'Feature' },
            { id: 'p2Name', type: 'subheading', required: true, maxLength: 20, placeholder: 'Pro' },
            { id: 'p2Price', type: 'stat', required: true, maxLength: 15, placeholder: '$99' },
            { id: 'p2Features', type: 'bullet', required: true, placeholder: 'Feature' },
            { id: 'p3Name', type: 'subheading', required: true, maxLength: 20, placeholder: 'Enterprise' },
            { id: 'p3Price', type: 'stat', required: true, maxLength: 15, placeholder: 'Custom' },
            { id: 'p3Features', type: 'bullet', required: true, placeholder: 'Feature' }
        ],
        images: [],
        previewGradient: 'from-green-600 to-emerald-700',
        html: `
            <div class="slide pricing-three">
                {{#title}}<h2 class="title">{{title}}</h2>{{/title}}
                <div class="pricing-grid">
                    <div class="plan"><h3>{{p1Name}}</h3><div class="price">{{p1Price}}</div><ul>{{#p1Features}}<li>{{.}}</li>{{/p1Features}}</ul></div>
                    <div class="plan featured"><h3>{{p2Name}}</h3><div class="price">{{p2Price}}</div><ul>{{#p2Features}}<li>{{.}}</li>{{/p2Features}}</ul><span class="badge">Popular</span></div>
                    <div class="plan"><h3>{{p3Name}}</h3><div class="price">{{p3Price}}</div><ul>{{#p3Features}}<li>{{.}}</li>{{/p3Features}}</ul></div>
                </div>
            </div>
        `
    },

    // ==========================================
    // TEAM TEMPLATES (59-60)
    // ==========================================
    {
        id: 'team-grid',
        name: 'Team Grid',
        description: 'Team members in a grid',
        version: 1,
        metadata: {
            category: 'team',
            positions: ['middle'],
            suitableFor: ['pitch', 'corporate', 'report'],
            tones: ['professional'],
            contentHints: ['team', 'people', 'leadership', 'founders', 'members'],
            requiresImage: true,
            minItems: 3,
            maxItems: 4,
            keywords: ['team', 'people', 'leadership', 'founders', 'who', 'about']
        },
        slots: [
            { id: 'title', type: 'heading', required: false, maxLength: 40, placeholder: 'Our Team' },
            { id: 't1Name', type: 'subheading', required: true, maxLength: 30, placeholder: 'Jane Doe' },
            { id: 't1Role', type: 'caption', required: true, maxLength: 30, placeholder: 'CEO' },
            { id: 't2Name', type: 'subheading', required: true, maxLength: 30, placeholder: 'John Smith' },
            { id: 't2Role', type: 'caption', required: true, maxLength: 30, placeholder: 'CTO' },
            { id: 't3Name', type: 'subheading', required: true, maxLength: 30, placeholder: 'Alex Chen' },
            { id: 't3Role', type: 'caption', required: true, maxLength: 30, placeholder: 'COO' }
        ],
        images: [
            { id: 't1Photo', position: 'icon', aspectRatio: '1:1', size: 'medium' },
            { id: 't2Photo', position: 'icon', aspectRatio: '1:1', size: 'medium' },
            { id: 't3Photo', position: 'icon', aspectRatio: '1:1', size: 'medium' }
        ],
        previewGradient: 'from-blue-600 to-cyan-600',
        html: `
            <div class="slide team-grid">
                {{#title}}<h2 class="title">{{title}}</h2>{{/title}}
                <div class="team-members">
                    <div class="member"><img src="{{t1Photo}}" alt="{{t1Name}}" /><h3>{{t1Name}}</h3><span>{{t1Role}}</span></div>
                    <div class="member"><img src="{{t2Photo}}" alt="{{t2Name}}" /><h3>{{t2Name}}</h3><span>{{t2Role}}</span></div>
                    <div class="member"><img src="{{t3Photo}}" alt="{{t3Name}}" /><h3>{{t3Name}}</h3><span>{{t3Role}}</span></div>
                </div>
            </div>
        `
    }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTemplateById(id: string): CardTemplate | undefined {
    return CARD_TEMPLATE_LIBRARY.find(t => t.id === id);
}

export function getTemplatesByCategory(category: TemplateCategory): CardTemplate[] {
    return CARD_TEMPLATE_LIBRARY.filter(t => t.metadata.category === category);
}

export function getTemplatesForPosition(position: PositionHint): CardTemplate[] {
    return CARD_TEMPLATE_LIBRARY.filter(t =>
        t.metadata.positions.includes(position) || t.metadata.positions.includes('any')
    );
}

export function getTemplatesForTone(tone: ToneType): CardTemplate[] {
    return CARD_TEMPLATE_LIBRARY.filter(t => t.metadata.tones.includes(tone));
}

export function getTemplateSummary(): { total: number; byCategory: Record<string, number> } {
    const byCategory: Record<string, number> = {};
    CARD_TEMPLATE_LIBRARY.forEach(t => {
        byCategory[t.metadata.category] = (byCategory[t.metadata.category] || 0) + 1;
    });
    return { total: CARD_TEMPLATE_LIBRARY.length, byCategory };
}
