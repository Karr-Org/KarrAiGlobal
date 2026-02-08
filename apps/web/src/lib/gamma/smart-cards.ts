/**
 * 🧠 Smart Card Generation System
 * AI-powered layout selection and content structuring
 * Inspired by Gamma.app's multi-model approach and Slidev's rich components
 */

// ============================================
// CARD LAYOUT TYPES
// ============================================

export type CardLayoutType =
    | 'title-hero'        // Big title with subtitle, optional background
    | 'split-text-image'  // Text on left, image on right
    | 'split-image-text'  // Image on left, text on right
    | 'bullet-list'       // Traditional bullet points
    | 'numbered-list'     // Ordered steps/process
    | 'stats-grid'        // 2-4 big numbers with labels
    | 'quote-highlight'   // Big quote with attribution
    | 'timeline'          // Vertical timeline of events
    | 'comparison-table'  // Two-column comparison
    | 'feature-grid'      // 2x2 or 3x3 feature cards
    | 'image-gallery'     // Multiple images
    | 'diagram'           // Flowchart/process diagram
    | 'code-block'        // Code with syntax highlighting
    | 'callout'           // Highlighted info/warning box
    | 'team-profiles'     // Team member cards
    | 'pricing-table'     // Pricing comparison
    | 'testimonial'       // Customer quote with photo
    | 'chart-data'        // Bar/line/pie chart placeholder
    | 'icon-list'         // Bullets with icons
    | 'big-statement'     // Single impactful statement

// ============================================
// CONTENT STRUCTURES PER LAYOUT
// ============================================

export interface TitleHeroContent {
    title: string;
    subtitle?: string;
    backgroundType: 'gradient' | 'image' | 'pattern';
    backgroundValue: string;
}

export interface SplitContent {
    title: string;
    body: string;
    bullets?: string[];
    imagePrompt: string;
    imagePosition: 'left' | 'right';
}

export interface BulletListContent {
    title: string;
    intro?: string;
    bullets: string[];
    iconType?: 'check' | 'arrow' | 'star' | 'number';
}

export interface StatsGridContent {
    title?: string;
    stats: Array<{
        value: string;
        label: string;
        trend?: 'up' | 'down' | 'neutral';
        color?: string;
    }>;
}

export interface QuoteContent {
    quote: string;
    author?: string;
    role?: string;
    imagePrompt?: string;
}

export interface TimelineContent {
    title: string;
    events: Array<{
        year: string;
        title: string;
        description: string;
    }>;
}

export interface ComparisonContent {
    title: string;
    leftLabel: string;
    rightLabel: string;
    rows: Array<{
        feature: string;
        left: string | boolean;
        right: string | boolean;
    }>;
}

export interface FeatureGridContent {
    title?: string;
    features: Array<{
        icon: string;
        title: string;
        description: string;
    }>;
}

export interface DiagramContent {
    title: string;
    type: 'flowchart' | 'process' | 'cycle' | 'hierarchy';
    nodes: Array<{
        id: string;
        label: string;
    }>;
    connections?: Array<{
        from: string;
        to: string;
        label?: string;
    }>;
}

export interface CalloutContent {
    type: 'info' | 'warning' | 'success' | 'tip';
    title: string;
    body: string;
}

export interface BigStatementContent {
    statement: string;
    subtext?: string;
    emphasis?: string[];
}

// ============================================
// SMART CARD TYPE
// ============================================

export interface SmartCard {
    id: string;
    layout: CardLayoutType;
    content: any; // Typed based on layout
    gradient: string;
    imageUrl?: string;
    speakerNotes?: string;
}

// ============================================
// AI PROMPTS FOR LAYOUT ANALYSIS
// ============================================

export const LAYOUT_ANALYSIS_PROMPT = `You are an expert presentation designer. Analyze this outline card and determine the BEST layout type and content structure.

AVAILABLE LAYOUTS:
1. title-hero - For opening/closing slides with big impactful titles
2. split-text-image - When content benefits from a supporting image (50% of slides should use this)
3. bullet-list - For multiple related points (use sparingly, max 4-5 bullets)
4. stats-grid - When there are numbers/metrics to highlight (2-4 stats)
5. quote-highlight - For testimonials, famous quotes, or key statements
6. timeline - For historical events, roadmaps, or chronological content  
7. comparison-table - For vs comparisons, pros/cons, before/after
8. feature-grid - For features, benefits, or service offerings (2-4 items)
9. diagram - For processes, flows, or relationships
10. callout - For important tips, warnings, or highlights
11. big-statement - For single powerful statements or takeaways
12. icon-list - For lists that benefit from visual icons

RULES:
1. VARY the layouts - don't use same layout twice in a row
2. Use split-text-image for 40-50% of content slides
3. Use stats-grid when numbers are mentioned
4. Use timeline for anything chronological
5. Use comparison-table for any comparisons
6. First slide MUST be title-hero
7. Last slide should be title-hero or big-statement (call to action)

For the selected layout, generate the COMPLETE structured content.`;

export const CONTENT_GENERATION_PROMPT = `You are an expert presentation designer and copywriter.

Given this layout type and topic, generate COMPELLING content:

WRITING RULES:
1. Headlines: Maximum 6-8 words, punchy and memorable
2. Bullets: Start with action verbs, 8-12 words max each
3. Stats: Use specific numbers, not vague terms
4. Quotes: Make them impactful and memorable
5. Body text: Concise, no fluff, value-focused

IMAGE PROMPTS (when needed):
Generate detailed image prompts that would create PROFESSIONAL, MODERN visuals:
- Specify style: "professional photography", "modern illustration", "isometric 3d"
- Specify mood: lighting, colors, composition
- Avoid: generic stock photo look, clip art, cartoons (unless brand fits)
- Include: relevant objects, people (diverse), environments

Return ONLY valid JSON matching the layout's content structure.`;

// ============================================
// LAYOUT DECISION FUNCTION
// ============================================

export function suggestLayoutForContent(
    cardIndex: number,
    totalCards: number,
    title: string,
    bullets: string[]
): { layout: CardLayoutType; reasoning: string } {
    const content = `${title} ${bullets.join(' ')}`.toLowerCase();

    // First card = title hero
    if (cardIndex === 0) {
        return { layout: 'title-hero', reasoning: 'First slide should be a hero title' };
    }

    // Last card = call to action
    if (cardIndex === totalCards - 1) {
        return { layout: 'big-statement', reasoning: 'Last slide should be a strong closing' };
    }

    // Check for numbers/stats
    const hasNumbers = /\d+%|\d+x|\$\d+|\d+\+|\d+ million|\d+ billion/i.test(content);
    if (hasNumbers && bullets.length >= 2) {
        return { layout: 'stats-grid', reasoning: 'Contains numerical data - use stats grid' };
    }

    // Check for timeline/chronology
    const hasTimeline = /timeline|history|roadmap|journey|phase|stage|step|year|decade|century|evolution/i.test(content);
    if (hasTimeline) {
        return { layout: 'timeline', reasoning: 'Contains chronological content' };
    }

    // Check for comparison
    const hasComparison = /vs|versus|compare|comparison|difference|better|worse|pro|con|before|after|traditional|modern/i.test(content);
    if (hasComparison) {
        return { layout: 'comparison-table', reasoning: 'Contains comparison content' };
    }

    // Check for features/benefits
    const hasFeatures = /feature|benefit|advantage|capability|offering|service|solution/i.test(content);
    if (hasFeatures && bullets.length >= 3) {
        return { layout: 'feature-grid', reasoning: 'Contains feature/benefit list' };
    }

    // Check for quote
    const hasQuote = /quote|said|according to|research shows|studies show|expert|ceo|founder/i.test(content);
    if (hasQuote) {
        return { layout: 'quote-highlight', reasoning: 'Contains quotable content' };
    }

    // Check for process/flow
    const hasProcess = /process|workflow|flow|step|how it works|how to|pipeline|funnel/i.test(content);
    if (hasProcess) {
        return { layout: 'diagram', reasoning: 'Contains process/workflow content' };
    }

    // Check for important callout
    const hasCallout = /important|warning|note|tip|key|critical|remember|caution/i.test(content);
    if (hasCallout && bullets.length <= 2) {
        return { layout: 'callout', reasoning: 'Contains important highlight' };
    }

    // Alternate between split layouts and bullet lists
    if (cardIndex % 2 === 0) {
        return { layout: 'split-text-image', reasoning: 'Visual variety - image layout' };
    }

    if (bullets.length > 4) {
        return { layout: 'bullet-list', reasoning: 'Multiple points to cover' };
    }

    return { layout: 'split-image-text', reasoning: 'Default with visual support' };
}

// ============================================
// IMAGE PROMPT GENERATORS
// ============================================

export function generateImagePrompt(
    title: string,
    content: string,
    style: 'photo' | 'illustration' | 'abstract' | '3d' | 'lineart'
): string {
    const stylePrompts = {
        photo: 'professional photography, high quality, modern office/business setting, natural lighting, shallow depth of field',
        illustration: 'modern flat illustration, vibrant colors, clean lines, professional business style',
        abstract: 'abstract geometric shapes, gradient colors, modern minimalist design, professional',
        '3d': 'isometric 3D illustration, soft shadows, pastel colors, modern tech style',
        lineart: 'minimal line art, black and white, elegant strokes, professional sketch style'
    };

    // Extract key concepts from title and content
    const concepts = extractKeyConcepts(title, content);

    return `${concepts.join(', ')}, ${stylePrompts[style]}, no text in image`;
}

function extractKeyConcepts(title: string, content: string): string[] {
    const combined = `${title} ${content}`.toLowerCase();
    const concepts: string[] = [];

    // Business concepts
    if (/growth|scale|expand/i.test(combined)) concepts.push('upward arrow', 'growth chart');
    if (/team|collaborat/i.test(combined)) concepts.push('diverse team working together');
    if (/tech|digital|ai|software/i.test(combined)) concepts.push('modern technology', 'digital interface');
    if (/money|revenue|profit|financial/i.test(combined)) concepts.push('business success', 'financial growth');
    if (/customer|user|client/i.test(combined)) concepts.push('happy customers', 'user interaction');
    if (/innovation|future|next/i.test(combined)) concepts.push('futuristic', 'innovation');
    if (/sustain|green|eco|environment/i.test(combined)) concepts.push('nature', 'sustainability', 'green technology');
    if (/health|wellness|medical/i.test(combined)) concepts.push('healthcare', 'wellness', 'medical professional');
    if (/education|learn|training/i.test(combined)) concepts.push('learning', 'education', 'knowledge');
    if (/security|protect|safe/i.test(combined)) concepts.push('security', 'protection', 'shield');

    // Default concepts if none matched
    if (concepts.length === 0) {
        concepts.push('professional business concept', 'modern workspace');
    }

    return concepts;
}

// ============================================
// GRADIENT PALETTES
// ============================================

export const GRADIENT_PALETTES = {
    professional: [
        'from-slate-800 to-slate-900',
        'from-blue-800 to-indigo-900',
        'from-gray-800 to-gray-900',
        'from-zinc-800 to-zinc-900',
    ],
    vibrant: [
        'from-violet-600 to-purple-600',
        'from-pink-600 to-rose-600',
        'from-cyan-600 to-blue-600',
        'from-orange-500 to-yellow-500',
        'from-emerald-500 to-teal-500',
        'from-fuchsia-600 to-pink-600',
    ],
    warm: [
        'from-amber-500 to-orange-600',
        'from-rose-500 to-pink-600',
        'from-red-500 to-orange-500',
        'from-yellow-400 to-amber-500',
    ],
    cool: [
        'from-cyan-500 to-blue-600',
        'from-indigo-500 to-purple-600',
        'from-teal-500 to-cyan-600',
        'from-sky-500 to-indigo-600',
    ],
    nature: [
        'from-green-500 to-emerald-600',
        'from-teal-500 to-green-600',
        'from-lime-500 to-green-600',
        'from-emerald-500 to-teal-600',
    ],
};

export function getGradientForCard(index: number, palette: keyof typeof GRADIENT_PALETTES = 'vibrant'): string {
    const gradients = GRADIENT_PALETTES[palette];
    return gradients[index % gradients.length];
}
