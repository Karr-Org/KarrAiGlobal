/**
 * 🎨 Premium Template Renderer
 * Renders stunning Gamma-style presentations with elegant typography and layouts
 */

import { PREMIUM_TEMPLATES, PREMIUM_CSS_BASE, PremiumTemplate } from './premium-templates';

// ============================================
// TYPES
// ============================================

export interface PremiumRenderOptions {
    theme?: 'lavender' | 'indigo' | 'rose' | 'emerald' | 'slate';
    includeAnimations?: boolean;
}

export interface PremiumCardData {
    templateId: string;
    content: Record<string, string | string[]>;
    images?: Record<string, string>;
}

export interface RenderedPremiumCard {
    html: string;
    css: string;
    templateId: string;
    templateName: string;
}

// ============================================
// THEME COLORS
// ============================================

const PREMIUM_THEMES = {
    lavender: {
        primary: '#5B4FD8',
        accent: '#7C3AED',
        background: '#FFFFFF',
        surface: '#F8F7FC',
        text: '#2D2D3A',
        muted: '#6B6B7B',
        highlight: '#EAE8F3'
    },
    indigo: {
        primary: '#4F46E5',
        accent: '#6366F1',
        background: '#FFFFFF',
        surface: '#EEF2FF',
        text: '#1E1B4B',
        muted: '#6366F1',
        highlight: '#C7D2FE'
    },
    rose: {
        primary: '#E11D48',
        accent: '#F43F5E',
        background: '#FFFFFF',
        surface: '#FFF1F2',
        text: '#1C1917',
        muted: '#78716C',
        highlight: '#FECDD3'
    },
    emerald: {
        primary: '#059669',
        accent: '#10B981',
        background: '#FFFFFF',
        surface: '#ECFDF5',
        text: '#1C1917',
        muted: '#6B7280',
        highlight: '#A7F3D0'
    },
    slate: {
        primary: '#475569',
        accent: '#64748B',
        background: '#FFFFFF',
        surface: '#F8FAFC',
        text: '#0F172A',
        muted: '#64748B',
        highlight: '#E2E8F0'
    }
};

// ============================================
// SMART TEMPLATE SELECTOR
// ============================================

export function selectPremiumTemplate(
    position: number,
    totalCards: number,
    content: Record<string, unknown>
): PremiumTemplate {
    const title = String(content.title || '').toLowerCase();
    const bullets = content.bulletPoints || content.bullets || [];

    // First card = Hero
    if (position === 0) {
        return PREMIUM_TEMPLATES.find(t => t.id === 'premium-hero-dashboard') || PREMIUM_TEMPLATES[0];
    }

    // Last card = CTA
    if (position === totalCards - 1) {
        return PREMIUM_TEMPLATES.find(t => t.id === 'premium-cta-closing') || PREMIUM_TEMPLATES[0];
    }

    // About/Bio detection
    if (title.includes('about') || title.includes('meet') || title.includes('who we are') || title.includes('partner')) {
        return PREMIUM_TEMPLATES.find(t => t.id === 'premium-about-bio') || PREMIUM_TEMPLATES[1];
    }

    // Services detection
    if (title.includes('service') || title.includes('offer') || title.includes('what we do') || title.includes('capabilities')) {
        return PREMIUM_TEMPLATES.find(t => t.id === 'premium-services-grid') || PREMIUM_TEMPLATES[2];
    }

    // Clients/Audience detection
    if (title.includes('client') || title.includes('who benefit') || title.includes('audience') || title.includes('ideal')) {
        return PREMIUM_TEMPLATES.find(t => t.id === 'premium-personas') || PREMIUM_TEMPLATES[3];
    }

    // Process/Phases detection
    if (title.includes('process') || title.includes('how we') || title.includes('approach') || title.includes('phase') || title.includes('step')) {
        return PREMIUM_TEMPLATES.find(t => t.id === 'premium-process-5phase') || PREMIUM_TEMPLATES[4];
    }

    // Stats/Metrics detection
    if (title.includes('metric') || title.includes('result') || title.includes('success') || title.includes('impact') || title.includes('number')) {
        return PREMIUM_TEMPLATES.find(t => t.id === 'premium-stats-impact') || PREMIUM_TEMPLATES[7];
    }

    // Default to about for middle slides
    return PREMIUM_TEMPLATES.find(t => t.id === 'premium-about-simple') || PREMIUM_TEMPLATES[5];
}

// ============================================
// TEMPLATE RENDERER
// ============================================

/**
 * Renders a premium template with the given content
 */
export function renderPremiumTemplate(
    template: PremiumTemplate,
    content: Record<string, string | string[]>,
    options: PremiumRenderOptions = {}
): RenderedPremiumCard {
    const theme = PREMIUM_THEMES[options.theme || 'lavender'];

    // Simple Mustache-like replacement
    let html = template.html;

    // Replace simple values
    Object.entries(content).forEach(([key, value]) => {
        if (typeof value === 'string') {
            // Replace {{key}} with value
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            html = html.replace(regex, value);
        } else if (Array.isArray(value)) {
            // Replace {{#key}}...{{/key}} sections with array items
            const sectionRegex = new RegExp(`\\{\\{#${key}\\}\\}([\\s\\S]*?)\\{\\{/${key}\\}\\}`, 'g');
            html = html.replace(sectionRegex, (_, inner) => {
                return value.map(item => inner.replace(/\{\{\.\}\}/g, item)).join('');
            });
        }
    });

    // Handle conditional sections (remove empty ones)
    html = html.replace(/\{\{#\w+\}\}[\s\S]*?\{\{\/\w+\}\}/g, '');

    // Remove any remaining unmatched mustache tags
    html = html.replace(/\{\{\w+\}\}/g, '');

    // Generate CSS with theme colors
    let css = PREMIUM_CSS_BASE;
    css = css.replace(/#5B4FD8/g, theme.primary);
    css = css.replace(/#F8F7FC/g, theme.surface);
    css = css.replace(/#2D2D3A/g, theme.text);
    css = css.replace(/#6B6B7B/g, theme.muted);
    css = css.replace(/#EAE8F3/g, theme.highlight);

    // Add animations if requested
    if (options.includeAnimations) {
        css += `
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .premium-card { animation: fadeInUp 0.6s ease-out; }
            .premium-card .feature-card,
            .premium-card .phase-card,
            .premium-card .persona-card {
                animation: fadeInUp 0.6s ease-out backwards;
            }
            .premium-card .feature-card:nth-child(1) { animation-delay: 0.1s; }
            .premium-card .feature-card:nth-child(2) { animation-delay: 0.2s; }
            .premium-card .feature-card:nth-child(3) { animation-delay: 0.3s; }
            .premium-card .feature-card:nth-child(4) { animation-delay: 0.4s; }
            .premium-card .feature-card:nth-child(5) { animation-delay: 0.5s; }
        `;
    }

    return {
        html,
        css,
        templateId: template.id,
        templateName: template.name
    };
}

// ============================================
// CONTENT MAPPER
// ============================================

/**
 * Maps generic card content to premium template fields
 */
export function mapContentToPremiumTemplate(
    template: PremiumTemplate,
    cardContent: {
        title?: string;
        subtitle?: string;
        bulletPoints?: string[];
        content?: string;
        image?: string;
    },
    sectionLabel?: string
): Record<string, string | string[]> {
    const result: Record<string, string | string[]> = {};

    // Common fields
    result.title = cardContent.title || 'Untitled';
    result.subtitle = cardContent.subtitle || '';
    result.sectionLabel = sectionLabel || template.type.toUpperCase();

    // Map bullet points based on template type
    if (template.id === 'premium-services-grid' && cardContent.bulletPoints) {
        // Split bullets into 5 service categories
        const chunks = chunkArray(cardContent.bulletPoints, Math.ceil(cardContent.bulletPoints.length / 5));
        result.s1Title = 'Service Area 1';
        result.s1Points = chunks[0] || [];
        result.s2Title = 'Service Area 2';
        result.s2Points = chunks[1] || [];
        result.s3Title = 'Service Area 3';
        result.s3Points = chunks[2] || [];
        result.s4Title = chunks[3]?.length ? 'Service Area 4' : '';
        result.s4Points = chunks[3] || [];
        result.s5Title = chunks[4]?.length ? 'Service Area 5' : '';
        result.s5Points = chunks[4] || [];
    }

    if (template.id === 'premium-process-5phase' && cardContent.bulletPoints) {
        const bullets = cardContent.bulletPoints;
        result.p1Title = bullets[0]?.split(':')[0] || 'Phase 1';
        result.p1Description = bullets[0]?.split(':')[1]?.trim() || bullets[0] || '';
        result.p2Title = bullets[1]?.split(':')[0] || 'Phase 2';
        result.p2Description = bullets[1]?.split(':')[1]?.trim() || bullets[1] || '';
        result.p3Title = bullets[2]?.split(':')[0] || 'Phase 3';
        result.p3Description = bullets[2]?.split(':')[1]?.trim() || bullets[2] || '';
        result.p4Title = bullets[3]?.split(':')[0] || 'Phase 4';
        result.p4Description = bullets[3]?.split(':')[1]?.trim() || bullets[3] || '';
        result.p5Title = bullets[4]?.split(':')[0] || 'Phase 5';
        result.p5Description = bullets[4]?.split(':')[1]?.trim() || bullets[4] || '';
    }

    if (template.id === 'premium-about-bio') {
        result.paragraph1 = cardContent.bulletPoints?.join(' ') || cardContent.content || '';
        result.illustration = cardContent.image || 'https://illustrations.popsy.co/violet/woman-with-a-laptop.svg';
    }

    if (template.id === 'premium-about-simple') {
        result.paragraph1 = cardContent.bulletPoints?.slice(0, 2).join(' ') || '';
        result.paragraph2 = cardContent.bulletPoints?.slice(2, 4).join(' ') || '';
    }

    if (template.id === 'premium-personas' && cardContent.bulletPoints) {
        const bullets = cardContent.bulletPoints;
        result.p1Title = 'Client Type 1';
        result.p1Description = bullets[0] || '';
        result.p1Image = 'https://illustrations.popsy.co/violet/man-working-on-laptop.svg';
        result.p2Title = 'Client Type 2';
        result.p2Description = bullets[1] || '';
        result.p2Image = 'https://illustrations.popsy.co/violet/woman-with-a-laptop.svg';
        result.p3Title = 'Client Type 3';
        result.p3Description = bullets[2] || '';
        result.p3Image = 'https://illustrations.popsy.co/violet/business-meeting.svg';
    }

    if (template.id === 'premium-stats-impact') {
        result.stat1 = '70%';
        result.label1 = 'Efficiency Gain';
        result.stat2 = '100+';
        result.label2 = 'Clients Served';
        result.stat3 = '10+';
        result.label3 = 'Years Experience';
    }

    if (template.id === 'premium-cta-closing') {
        result.ctaButton = 'Get Started';
        result.ctaLink = '#contact';
    }

    return result;
}

// Helper function
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// ============================================
// FULL PRESENTATION RENDERER
// ============================================

export function renderPremiumPresentation(
    cards: Array<{
        title?: string;
        subtitle?: string;
        bulletPoints?: string[];
        content?: string;
        image?: string;
    }>,
    options: PremiumRenderOptions = {}
): RenderedPremiumCard[] {
    return cards.map((card, index) => {
        // Select the best template for this card
        const template = selectPremiumTemplate(index, cards.length, card as Record<string, unknown>);

        // Map content to template fields
        const mappedContent = mapContentToPremiumTemplate(template, card);

        // Render the template
        return renderPremiumTemplate(template, mappedContent, options);
    });
}
