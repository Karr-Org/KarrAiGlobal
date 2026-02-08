/**
 * 🎨 Template Renderer
 * Fills template placeholders with content and generates final HTML
 * Supports Mustache-like syntax: {{variable}}, {{#conditional}}, {{#list}}
 */

import { CardTemplate, getTemplateById } from './card-templates';
import { FilledSlot } from './template-matcher';

// ============================================
// TYPES
// ============================================

export interface TemplateTheme {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textSecondary: string;
    gradient: string;
}

export interface RenderOptions {
    theme: TemplateTheme;
    imageBaseUrl?: string;
    customCSS?: string;
}

export interface RenderedCard {
    id: string;
    templateId: string;
    templateName: string;
    html: string;
    css: string;
}

// ============================================
// DEFAULT THEMES
// ============================================

export const TEMPLATE_THEMES: Record<string, TemplateTheme> = {
    lavender: {
        primary: '#7c3aed',
        secondary: '#a78bfa',
        accent: '#f59e0b',
        background: '#faf5ff',
        text: '#1e1b4b',
        textSecondary: '#6b7280',
        gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)'
    },
    indigo: {
        primary: '#4f46e5',
        secondary: '#818cf8',
        accent: '#f97316',
        background: '#1e1b4b',
        text: '#ffffff',
        textSecondary: '#c7d2fe',
        gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)'
    },
    onyx: {
        primary: '#18181b',
        secondary: '#3f3f46',
        accent: '#eab308',
        background: '#09090b',
        text: '#fafafa',
        textSecondary: '#a1a1aa',
        gradient: 'linear-gradient(135deg, #27272a, #18181b)'
    },
    midnight: {
        primary: '#1e3a8a',
        secondary: '#3b82f6',
        accent: '#06b6d4',
        background: '#0f172a',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        gradient: 'linear-gradient(135deg, #1e3a8a, #3b82f6)'
    },
    corporate: {
        primary: '#1f2937',
        secondary: '#4b5563',
        accent: '#3b82f6',
        background: '#ffffff',
        text: '#111827',
        textSecondary: '#6b7280',
        gradient: 'linear-gradient(135deg, #1f2937, #374151)'
    },
    sunset: {
        primary: '#ea580c',
        secondary: '#fb923c',
        accent: '#fbbf24',
        background: '#fffbeb',
        text: '#431407',
        textSecondary: '#78350f',
        gradient: 'linear-gradient(135deg, #ea580c, #f97316)'
    },
    forest: {
        primary: '#047857',
        secondary: '#10b981',
        accent: '#84cc16',
        background: '#ecfdf5',
        text: '#064e3b',
        textSecondary: '#065f46',
        gradient: 'linear-gradient(135deg, #047857, #10b981)'
    },
    rose: {
        primary: '#be185d',
        secondary: '#ec4899',
        accent: '#f472b6',
        background: '#fdf2f8',
        text: '#831843',
        textSecondary: '#9d174d',
        gradient: 'linear-gradient(135deg, #be185d, #ec4899)'
    }
};

// ============================================
// TEMPLATE RENDERER
// ============================================

export function renderTemplate(
    template: CardTemplate,
    content: FilledSlot,
    images: Record<string, string>,
    options: RenderOptions
): RenderedCard {
    let html = template.html;
    const theme = options.theme;

    // Replace simple variables: {{variable}}
    html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        if (images[key]) return images[key];
        const value = content[key];
        if (typeof value === 'string') return escapeHtml(value);
        if (Array.isArray(value)) return value.map(escapeHtml).join(', ');
        return '';
    });

    // Handle conditionals: {{#variable}}...{{/variable}}
    html = html.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, inner) => {
        const value = content[key] || images[key];
        if (!value || (Array.isArray(value) && value.length === 0)) return '';

        // If it's an array, repeat the inner content for each item
        if (Array.isArray(value)) {
            return value.map(item => inner.replace(/\{\{\.\}\}/g, escapeHtml(item))).join('');
        }

        // Otherwise, just show the content with the value
        return inner.replace(/\{\{(\w+)\}\}/g, (__, k) => {
            if (k === key) return escapeHtml(value as string);
            const v = content[k];
            if (typeof v === 'string') return escapeHtml(v);
            return '';
        });
    });

    // Clean up any remaining empty placeholders
    html = html.replace(/\{\{[^}]+\}\}/g, '');

    // Generate CSS with theme
    const css = generateCardCSS(template, theme);

    return {
        id: crypto.randomUUID(),
        templateId: template.id,
        templateName: template.name,
        html,
        css
    };
}

function escapeHtml(text: string): string {
    const escapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, char => escapeMap[char]);
}

// ============================================
// CSS GENERATOR
// ============================================

function generateCardCSS(template: CardTemplate, theme: TemplateTheme): string {
    const isDark = isColorDark(theme.background);

    return `
/* ${template.name} - ${template.id} */
.slide {
    width: 100%;
    height: 100%;
    min-height: 500px;
    padding: 48px;
    box-sizing: border-box;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: ${theme.background};
    color: ${theme.text};
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.slide.light {
    background: ${isDark ? theme.primary : theme.background};
}

/* Typography */
.slide .title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 16px 0;
    color: ${theme.text};
    line-height: 1.2;
}

.slide .subtitle {
    font-size: 1.25rem;
    color: ${theme.textSecondary};
    margin: 0 0 24px 0;
    line-height: 1.5;
}

.slide .body {
    font-size: 1.1rem;
    color: ${theme.textSecondary};
    line-height: 1.7;
    margin: 0 0 24px 0;
}

/* Bullets */
.slide .bullets {
    list-style: none;
    padding: 0;
    margin: 0;
}

.slide .bullets li {
    position: relative;
    padding-left: 24px;
    margin-bottom: 12px;
    font-size: 1.1rem;
    color: ${theme.text};
    line-height: 1.6;
}

.slide .bullets li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    width: 8px;
    height: 8px;
    background: ${theme.accent};
    border-radius: 50%;
}

/* Split Layout */
.slide.content-split {
    flex-direction: row;
    align-items: center;
    gap: 48px;
}

.slide.content-split .left-content,
.slide.content-split .right-content {
    flex: 1;
}

.slide.content-split .left-image,
.slide.content-split .right-image {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.slide.content-split img {
    max-width: 100%;
    max-height: 400px;
    border-radius: 16px;
    object-fit: cover;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}

.slide.content-split.reverse {
    flex-direction: row-reverse;
}

/* Stats */
.slide .stats-grid {
    display: grid;
    gap: 32px;
    margin-top: 32px;
}

.slide .stats-grid.three { grid-template-columns: repeat(3, 1fr); }
.slide .stats-grid.four { grid-template-columns: repeat(2, 1fr); }

.slide .stat-item {
    text-align: center;
    padding: 24px;
    background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
    border-radius: 16px;
}

.slide .stat-value {
    display: block;
    font-size: 3rem;
    font-weight: 800;
    color: ${theme.primary};
    margin-bottom: 8px;
}

.slide .stat-label {
    display: block;
    font-size: 1rem;
    color: ${theme.textSecondary};
    text-transform: uppercase;
    letter-spacing: 1px;
}

/* Stats Single */
.slide.stats-single {
    align-items: center;
    text-align: center;
}

.slide.stats-single .stat-display {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.slide.stats-single .stat-value {
    font-size: 6rem;
    background: ${theme.gradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.slide.stats-single .stat-label {
    font-size: 1.5rem;
    margin-top: 16px;
}

/* Features Grid */
.slide .features {
    display: grid;
    gap: 24px;
    margin-top: 32px;
}

.slide.features-grid.three .features { grid-template-columns: repeat(3, 1fr); }
.slide.features-grid.four .features { grid-template-columns: repeat(2, 1fr); }

.slide .feature {
    padding: 32px;
    background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
    border-radius: 16px;
    text-align: center;
}

.slide .feature .icon {
    font-size: 2rem;
    margin-bottom: 16px;
}

.slide .feature h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 12px 0;
    color: ${theme.text};
}

.slide .feature p {
    font-size: 0.95rem;
    color: ${theme.textSecondary};
    margin: 0;
    line-height: 1.6;
}

/* Comparison */
.slide .comparison {
    display: flex;
    gap: 48px;
    margin-top: 32px;
}

.slide .comparison .column {
    flex: 1;
    padding: 32px;
    background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
    border-radius: 16px;
}

.slide .comparison .column-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 24px 0;
    color: ${theme.primary};
}

.slide .comparison ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.slide .comparison li {
    padding: 8px 0;
    border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
}

.slide .comparison .divider {
    width: 2px;
    background: ${theme.gradient};
    border-radius: 1px;
}

/* Pros/Cons */
.slide.pros-cons .column.pros { border-left: 4px solid #10b981; }
.slide.pros-cons .column.cons { border-left: 4px solid #ef4444; }

/* Timeline */
.slide .timeline {
    display: flex;
    flex-direction: column;
    gap: 24px;
    margin-top: 32px;
    position: relative;
}

.slide .timeline::before {
    content: '';
    position: absolute;
    left: 20px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: ${theme.gradient};
}

.slide .timeline .event {
    display: flex;
    gap: 32px;
    position: relative;
    padding-left: 48px;
}

.slide .timeline .event::before {
    content: '';
    position: absolute;
    left: 12px;
    top: 8px;
    width: 16px;
    height: 16px;
    background: ${theme.primary};
    border-radius: 50%;
    border: 3px solid ${theme.background};
}

.slide .timeline .year {
    font-size: 1.25rem;
    font-weight: 700;
    color: ${theme.primary};
    min-width: 60px;
}

.slide .timeline .content h4 {
    margin: 0 0 8px 0;
    font-size: 1.25rem;
    color: ${theme.text};
}

.slide .timeline .content p {
    margin: 0;
    color: ${theme.textSecondary};
}

/* Quote */
.slide.quote-centered,
.slide.quote-image {
    text-align: center;
    align-items: center;
}

.slide .quote {
    font-size: 2rem;
    font-style: italic;
    line-height: 1.5;
    color: ${theme.text};
    max-width: 800px;
    margin: 0 auto 32px;
}

.slide .quote::before,
.slide .quote::after {
    color: ${theme.accent};
}

.slide .attribution {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.slide .author {
    font-size: 1.25rem;
    font-weight: 600;
    color: ${theme.text};
}

.slide .role {
    font-size: 1rem;
    color: ${theme.textSecondary};
}

.slide .avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    margin-bottom: 16px;
    object-fit: cover;
}

/* Chapter/Section */
.slide.title-chapter {
    text-align: center;
    align-items: center;
    background: ${theme.gradient};
    color: #ffffff;
}

.slide.title-chapter .chapter-number {
    font-size: 5rem;
    font-weight: 800;
    opacity: 0.3;
    margin-bottom: 16px;
}

.slide.title-chapter .title {
    color: #ffffff;
}

.slide.title-chapter .description {
    color: rgba(255,255,255,0.8);
}

/* CTA */
.slide.cta-simple,
.slide.cta-contact,
.slide.cta-thank-you {
    text-align: center;
    align-items: center;
}

.slide .cta-button {
    display: inline-block;
    padding: 16px 48px;
    background: ${theme.gradient};
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 600;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    margin-top: 24px;
    transition: transform 0.2s, box-shadow 0.2s;
}

.slide .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

/* Contact Info */
.slide .contact-info {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 32px;
}

.slide .contact-info .item {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: center;
}

.slide .contact-info .label {
    font-weight: 600;
    color: ${theme.textSecondary};
    min-width: 80px;
    text-align: right;
}

.slide .contact-info .value {
    color: ${theme.primary};
    font-size: 1.1rem;
}

/* Pricing */
.slide .pricing-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-top: 32px;
}

.slide .plan {
    padding: 32px;
    background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
    border-radius: 16px;
    text-align: center;
    position: relative;
}

.slide .plan.featured {
    background: ${theme.gradient};
    color: #ffffff;
    transform: scale(1.05);
}

.slide .plan h3 {
    font-size: 1.25rem;
    margin: 0 0 16px 0;
}

.slide .plan .price {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 24px;
}

.slide .plan ul {
    list-style: none;
    padding: 0;
    margin: 0;
    text-align: left;
}

.slide .plan li {
    padding: 8px 0;
    border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
}

.slide .plan .badge {
    position: absolute;
    top: -12px;
    right: 24px;
    background: ${theme.accent};
    color: #ffffff;
    padding: 4px 16px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
}

/* Team */
.slide .team-members {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 32px;
    margin-top: 32px;
}

.slide .member {
    text-align: center;
}

.slide .member img {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 16px;
    border: 4px solid ${theme.primary};
}

.slide .member h3 {
    font-size: 1.1rem;
    margin: 0 0 4px 0;
}

.slide .member span {
    font-size: 0.9rem;
    color: ${theme.textSecondary};
}

/* Background Image */
.slide.title-background-image {
    background-size: cover;
    background-position: center;
}

.slide.title-background-image .overlay {
    background: rgba(0,0,0,0.5);
    padding: 48px;
    border-radius: 16px;
    text-align: center;
}

.slide.title-background-image .title,
.slide.title-background-image .subtitle {
    color: #ffffff;
}

/* Icon List */
.slide .icon-items {
    list-style: none;
    padding: 0;
    margin: 32px 0 0 0;
}

.slide .icon-items li {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
    font-size: 1.1rem;
}

.slide .icon-items .icon {
    width: 32px;
    height: 32px;
    background: ${theme.primary};
    color: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
}

/* Two Column Content */
.slide.content-two-column .columns {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 48px;
    margin-top: 32px;
}

.slide .column-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: ${theme.primary};
    margin: 0 0 16px 0;
}

/* Centered Content */
.slide .content-center {
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
}

/* Hero Title */
.slide.title-hero-centered {
    background: ${theme.gradient};
    text-align: center;
    align-items: center;
}

.slide.title-hero-centered .title,
.slide.title-hero-centered .subtitle {
    color: #ffffff;
}

.slide.title-hero-centered .title {
    font-size: 3.5rem;
}

/* Responsive */
@media (max-width: 768px) {
    .slide { padding: 24px; }
    .slide .title { font-size: 1.75rem; }
    .slide.content-split { flex-direction: column; }
    .slide .stats-grid { grid-template-columns: 1fr 1fr; }
    .slide .features { grid-template-columns: 1fr; }
    .slide .pricing-grid { grid-template-columns: 1fr; }
    .slide .comparison { flex-direction: column; }
}
    `.trim();
}

function isColorDark(color: string): boolean {
    // Simple heuristic for common color formats
    if (color.includes('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5;
    }
    // Default assumption for gradient backgrounds
    return color.includes('0f') || color.includes('1e') || color.includes('09');
}

// ============================================
// RENDER FULL PRESENTATION
// ============================================

export function renderPresentation(
    cards: Array<{ template: CardTemplate; content: FilledSlot; images: Record<string, string> }>,
    themeName: string = 'lavender'
): { html: string; css: string } {
    const theme = TEMPLATE_THEMES[themeName] || TEMPLATE_THEMES.lavender;
    const options: RenderOptions = { theme };

    const renderedCards = cards.map(card =>
        renderTemplate(card.template, card.content, card.images, options)
    );

    // Combine all HTML
    const html = renderedCards.map((card, i) =>
        `<div class="card" data-index="${i}" data-template="${card.templateId}">${card.html}</div>`
    ).join('\n');

    // Combine all CSS (deduplicated)
    const css = renderedCards[0]?.css || generateCardCSS(cards[0].template, theme);

    return { html, css };
}
