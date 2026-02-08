/**
 * 🎨 Template-Based Presentation Generator
 * Automatically selects and fills Gamma-style templates based on content
 */

import {
    GammaTemplate,
    GAMMA_TEMPLATES,
    getGammaTemplatesByCategory,
    suggestGammaTemplate
} from './gamma-templates';
import { GAMMA_ADDITIONAL_TEMPLATES } from './gamma-templates-extended';
import { GammaTheme, GAMMA_THEMES } from './gamma-styles';
import { renderGammaSlide, SlideContent, SlideImages, RenderedSlide } from './gamma-renderer';

// All available templates
const ALL_TEMPLATES = [...GAMMA_TEMPLATES, ...GAMMA_ADDITIONAL_TEMPLATES];

// Card data from AI or outline
export interface CardData {
    layout?: string;
    title?: string;
    subtitle?: string;
    body?: string;
    bullets?: string[];
    stats?: Array<{ value: string; label: string; trend?: string }>;
    features?: Array<{ icon?: string; title: string; description: string }>;
    events?: Array<{ year: string; title: string; description: string }>;
    quote?: string;
    author?: string;
    role?: string;
    leftLabel?: string;
    rightLabel?: string;
    rows?: Array<{ feature: string; left: string; right: string }>;
    imagePrompt?: string;
    speakerNotes?: string;
}

// Generated slide with template info
export interface GeneratedSlide {
    id: string;
    templateId: string;
    templateName: string;
    layout: string;
    content: SlideContent;
    images: SlideImages;
    html: string;
    speakerNotes?: string;
}

// Presentation output
export interface GeneratedPresentation {
    id: string;
    title: string;
    subtitle?: string;
    theme: GammaTheme;
    slides: GeneratedSlide[];
    css: string;
}

/**
 * Detect the best template based on card content
 */
export function detectBestTemplate(
    card: CardData,
    position: number,
    totalCards: number
): GammaTemplate {
    const isFirst = position === 0;
    const isLast = position === totalCards - 1;

    // First slide = title
    if (isFirst) {
        if (card.imagePrompt) {
            return getTemplateById('gamma-title-split') || GAMMA_TEMPLATES[0];
        }
        return getTemplateById('gamma-title-minimal') || GAMMA_TEMPLATES[0];
    }

    // Last slide = closing
    if (isLast) {
        if (card.body?.toLowerCase().includes('thank')) {
            return getTemplateById('gamma-closing-thank-you') || GAMMA_TEMPLATES[GAMMA_TEMPLATES.length - 1];
        }
        return getTemplateById('gamma-cta-gradient') || GAMMA_TEMPLATES[GAMMA_TEMPLATES.length - 1];
    }

    // Check for stats
    if (card.stats && card.stats.length > 0) {
        if (card.stats.length === 1) {
            return getTemplateById('gamma-stat-big-number')!;
        }
        if (card.stats.length <= 3) {
            return getTemplateById('gamma-stat-with-cards') || getTemplateById('gamma-stats-row')!;
        }
        return getTemplateById('gamma-stats-grid')!;
    }

    // Check for features
    if (card.features && card.features.length > 0) {
        if (card.features.length === 4) {
            return getTemplateById('gamma-features-4col')!;
        }
        if (card.features.length === 3) {
            return getTemplateById('gamma-features-3col')!;
        }
        return getTemplateById('gamma-features-cards')!;
    }

    // Check for timeline/events
    if (card.events && card.events.length > 0) {
        return getTemplateById('gamma-timeline-vertical')!;
    }

    // Check for quote
    if (card.quote) {
        if (card.imagePrompt) {
            return getTemplateById('gamma-quote-with-image')!;
        }
        return getTemplateById('gamma-quote-centered')!;
    }

    // Check for comparison
    if (card.leftLabel && card.rightLabel) {
        return getTemplateById('gamma-compare-side')!;
    }

    // Check for bullets
    if (card.bullets && card.bullets.length > 0) {
        if (card.imagePrompt) {
            // Alternate between left and right images
            return position % 2 === 0
                ? getTemplateById('gamma-content-split-right')!
                : getTemplateById('gamma-content-split-left')!;
        }
        return getTemplateById('gamma-content-bullets')!;
    }

    // Check for image
    if (card.imagePrompt) {
        return position % 2 === 0
            ? getTemplateById('gamma-content-split-right')!
            : getTemplateById('gamma-content-split-left')!;
    }

    // Default to text content
    return getTemplateById('gamma-content-text')!;
}

/**
 * Get template by ID from all templates
 */
function getTemplateById(id: string): GammaTemplate | undefined {
    return ALL_TEMPLATES.find(t => t.id === id);
}

/**
 * Map card data to template content slots
 */
export function mapCardToContent(card: CardData, template: GammaTemplate): SlideContent {
    const content: SlideContent = {};

    // Map common fields
    if (card.title) content.title = card.title;
    if (card.subtitle) content.subtitle = card.subtitle;
    if (card.body) content.body = card.body;
    if (card.bullets) content.bullets = card.bullets;

    // Map stats
    if (card.stats && card.stats.length > 0) {
        card.stats.forEach((stat, idx) => {
            content[`stat${idx + 1}`] = stat.value;
            content[`label${idx + 1}`] = stat.label;
        });
        // For single stat templates
        if (card.stats.length === 1) {
            content.stat = card.stats[0].value;
            content.statLabel = card.stats[0].label;
        }
    }

    // Map features
    if (card.features && card.features.length > 0) {
        card.features.forEach((feature, idx) => {
            content[`f${idx + 1}Title`] = feature.title;
            content[`f${idx + 1}Desc`] = feature.description;
        });
    }

    // Map events/timeline
    if (card.events && card.events.length > 0) {
        card.events.forEach((event, idx) => {
            content[`event${idx + 1}Year`] = event.year;
            content[`event${idx + 1}Title`] = event.title;
            content[`event${idx + 1}Desc`] = event.description;
        });
    }

    // Map quote
    if (card.quote) content.quote = card.quote;
    if (card.author) content.author = card.author;
    if (card.role) content.role = card.role;

    // Map comparison
    if (card.leftLabel) content.leftTitle = card.leftLabel;
    if (card.rightLabel) content.rightTitle = card.rightLabel;
    if (card.rows) {
        const leftPoints = card.rows.map(r => `${r.feature}: ${r.left}`);
        const rightPoints = card.rows.map(r => `${r.feature}: ${r.right}`);
        content.leftPoints = leftPoints;
        content.rightPoints = rightPoints;
    }

    // Map cards (for stat-with-cards template)
    if (template.id === 'gamma-stat-with-cards' && card.features) {
        card.features.slice(0, 3).forEach((feature, idx) => {
            content[`card${idx + 1}Title`] = feature.title;
            content[`card${idx + 1}Desc`] = feature.description;
        });
    }

    return content;
}

/**
 * Generate image URLs from prompt
 */
export function generateImages(card: CardData, template: GammaTemplate): SlideImages {
    const images: SlideImages = {};

    if (!card.imagePrompt) return images;

    // Extract keywords from prompt
    const keywords = extractKeywords(card.imagePrompt);

    // Generate URLs for each image placeholder in template
    template.images.forEach(placeholder => {
        const width = placeholder.size === 'full' ? 1200 :
            placeholder.size === 'large' ? 800 :
                placeholder.size === 'medium' ? 400 :
                    placeholder.size === 'small' ? 200 : 100;

        const [w, h] = placeholder.aspectRatio.split(':').map(Number);
        const height = Math.round(width * (h / w));

        // Combine template keywords with card keywords
        const allKeywords = [...placeholder.keywords, ...keywords].slice(0, 4).join(',');

        images[placeholder.id] = {
            url: `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(allKeywords)}`,
            alt: card.title || 'Slide image'
        };
    });

    return images;
}

/**
 * Extract keywords from image prompt
 */
function extractKeywords(prompt: string): string[] {
    const stopWords = ['professional', 'modern', 'clean', 'high', 'quality', 'style', 'image',
        'photo', 'picture', 'showing', 'representing', 'visualization', 'concept',
        'abstract', 'the', 'and', 'with', 'for', 'that', 'this', 'a', 'an'];

    return prompt
        .toLowerCase()
        .replace(/[^\w\s,]/g, ' ')
        .split(/[\s,]+/)
        .filter(w => w.length > 2 && !stopWords.includes(w))
        .slice(0, 5);
}

/**
 * Generate a complete presentation from card data
 */
export function generatePresentation(
    title: string,
    subtitle: string | undefined,
    cards: CardData[],
    themeName: string = 'gamma'
): GeneratedPresentation {
    const theme = GAMMA_THEMES[themeName] || GAMMA_THEMES.gamma;

    const slides: GeneratedSlide[] = cards.map((card, index) => {
        // Detect best template
        const template = detectBestTemplate(card, index, cards.length);

        // Map content
        const content = mapCardToContent(card, template);

        // Generate images
        const images = generateImages(card, template);

        // Render HTML
        const rendered = renderGammaSlide(template, content, images, theme);

        return {
            id: crypto.randomUUID(),
            templateId: template.id,
            templateName: template.name,
            layout: template.layout,
            content,
            images,
            html: rendered.html,
            speakerNotes: card.speakerNotes
        };
    });

    // Generate CSS
    const { generateGammaBaseCSS } = require('./gamma-styles');
    const css = generateGammaBaseCSS(theme);

    return {
        id: crypto.randomUUID(),
        title,
        subtitle,
        theme,
        slides,
        css
    };
}

/**
 * Convert AI-generated card format to our CardData format
 */
export function convertAICard(aiCard: any): CardData {
    const card: CardData = {
        layout: aiCard.layout,
        title: aiCard.content?.title,
        subtitle: aiCard.content?.subtitle,
        body: aiCard.content?.body,
        imagePrompt: aiCard.imagePrompt,
        speakerNotes: aiCard.speakerNotes
    };

    // Convert bullets
    if (aiCard.content?.bullets) {
        card.bullets = aiCard.content.bullets;
    }

    // Convert stats
    if (aiCard.content?.stats) {
        card.stats = aiCard.content.stats;
    }

    // Convert features
    if (aiCard.content?.features) {
        card.features = aiCard.content.features;
    }

    // Convert events/timeline
    if (aiCard.content?.events) {
        card.events = aiCard.content.events;
    }

    // Convert quote
    if (aiCard.content?.quote) {
        card.quote = aiCard.content.quote;
        card.author = aiCard.content.author;
        card.role = aiCard.content.role;
    }

    // Convert comparison
    if (aiCard.content?.leftLabel) {
        card.leftLabel = aiCard.content.leftLabel;
        card.rightLabel = aiCard.content.rightLabel;
        card.rows = aiCard.content.rows;
    }

    // Convert statement (for big-statement layout)
    if (aiCard.content?.statement) {
        card.title = aiCard.content.statement;
        card.body = aiCard.content.subtext;
    }

    return card;
}

/**
 * Get all available templates for preview
 */
export function getAllTemplates(): GammaTemplate[] {
    return ALL_TEMPLATES;
}

/**
 * Get templates organized by category
 */
export function getTemplatesByCategory(): Record<string, GammaTemplate[]> {
    const categories = ['title', 'stats', 'content', 'features', 'cards', 'timeline', 'quote', 'compare', 'team', 'cta'] as const;
    const result: Record<string, GammaTemplate[]> = {};

    categories.forEach(cat => {
        result[cat] = ALL_TEMPLATES.filter(t => t.category === cat);
    });

    return result;
}

/**
 * Get template count
 */
export function getTemplateCount(): number {
    return ALL_TEMPLATES.length;
}
