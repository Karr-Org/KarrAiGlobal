/**
 * 🎨 Gamma-Style HTML Renderer
 * Generates HTML slides that match Gamma.app's exact visual style
 */

import { GammaTemplate, GammaLayoutType, GAMMA_TEMPLATES } from './gamma-templates';
import { GammaTheme, GAMMA_THEMES } from './gamma-styles';

// Content data for a slide
export interface SlideContent {
    [key: string]: string | string[] | undefined;
}

// Image data for a slide
export interface SlideImages {
    [key: string]: { url: string; alt: string };
}

// Rendered slide output
export interface RenderedSlide {
    html: string;
    templateId: string;
    layout: GammaLayoutType;
}

/**
 * Render a slide using a Gamma template
 */
export function renderGammaSlide(
    template: GammaTemplate,
    content: SlideContent,
    images: SlideImages,
    theme: GammaTheme
): RenderedSlide {
    let html = '';

    // Apply gradient background if needed
    const bgClass = template.design.bgStyle === 'gradient' ? 'gamma-gradient-bg' : '';
    const slideClasses = `gamma-slide ${bgClass}`.trim();

    html = `<div class="${slideClasses}">`;

    // Add accent bar if needed
    if (template.design.hasAccentBar) {
        html += '<div class="gamma-accent-bar"></div>';
    }

    // Render based on layout type
    switch (template.layout) {
        case 'gamma-title-minimal':
            html += renderTitleMinimal(content, images, theme);
            break;
        case 'gamma-title-gradient':
            html += renderTitleGradient(content, images, theme);
            break;
        case 'gamma-title-split':
            html += renderTitleSplit(content, images, theme);
            break;
        case 'gamma-stat-featured':
            html += renderStatFeatured(template, content, images, theme);
            break;
        case 'gamma-stats-row':
            html += renderStatsRow(content, images, theme);
            break;
        case 'gamma-stats-grid':
            html += renderStatsGrid(content, images, theme);
            break;
        case 'gamma-stat-big-number':
            html += renderBigNumber(content, images, theme);
            break;
        case 'gamma-features-4col':
            html += renderFeatures4Col(content, images, theme);
            break;
        case 'gamma-features-3col':
            html += renderFeatures3Col(content, images, theme);
            break;
        case 'gamma-features-cards':
            html += renderFeaturesCards(content, images, theme);
            break;
        case 'gamma-content-text':
            html += renderContentText(content, images, theme);
            break;
        case 'gamma-content-split-left':
        case 'gamma-content-split-right':
            html += renderContentSplit(template.layout, content, images, theme);
            break;
        case 'gamma-content-bullets':
            html += renderContentBullets(content, images, theme);
            break;
        case 'gamma-cards-3':
            html += renderCards3(content, images, theme);
            break;
        case 'gamma-cards-highlight':
            html += renderCardsHighlight(content, images, theme);
            break;
        case 'gamma-timeline-vertical':
            html += renderTimelineVertical(content, images, theme);
            break;
        case 'gamma-quote-centered':
            html += renderQuoteCentered(content, images, theme);
            break;
        case 'gamma-quote-with-image':
            html += renderQuoteWithImage(content, images, theme);
            break;
        case 'gamma-compare-side':
            html += renderCompareSide(content, images, theme);
            break;
        case 'gamma-cta-gradient':
            html += renderCtaGradient(content, images, theme);
            break;
        case 'gamma-closing-thank-you':
            html += renderClosingThankYou(content, images, theme);
            break;
        default:
            html += renderContentText(content, images, theme);
    }

    html += '</div>';

    return {
        html,
        templateId: template.id,
        layout: template.layout
    };
}

// ==========================================
// TITLE RENDERERS
// ==========================================

function renderTitleMinimal(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    return `
        <h1 class="gamma-title">${content.title || ''}</h1>
        ${content.subtitle ? `<p class="gamma-body">${content.subtitle}</p>` : ''}
    `;
}

function renderTitleGradient(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    return `
        <h1 class="gamma-title" style="font-size: 3.5rem;">${content.title || ''}</h1>
        ${content.subtitle ? `<p class="gamma-body" style="font-size: 1.25rem; max-width: 700px;">${content.subtitle}</p>` : ''}
    `;
}

function renderTitleSplit(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    const imageHtml = images.hero
        ? `<img src="${images.hero.url}" alt="${images.hero.alt}" class="gamma-image" />`
        : '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 100%; height: 100%; min-height: 300px; border-radius: 12px;"></div>';

    return `
        <div>
            <h1 class="gamma-title">${content.title || ''}</h1>
            ${content.subtitle ? `<p class="gamma-body">${content.subtitle}</p>` : ''}
            ${content.tagline ? `<p class="gamma-caption">${content.tagline}</p>` : ''}
        </div>
        <div class="gamma-content-image">
            ${imageHtml}
        </div>
    `;
}

// ==========================================
// STATS RENDERERS
// ==========================================

function renderStatFeatured(template: GammaTemplate, content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    // Check if this is the "Stat with Info Cards" variant
    const hasCards = template.elements.some(e => e.id.startsWith('card'));

    let html = `
        <h2 class="gamma-heading">${content.title || ''}</h2>
        <div style="display: flex; gap: 32px; align-items: flex-start;">
            <div class="gamma-stat-box">
                <span class="gamma-stat">${content.stat || ''}</span>
                <p class="gamma-body" style="color: white; margin: 0.5rem 0 0 0;">${content.statLabel || ''}</p>
            </div>
            <div style="flex: 1;">
                <p class="gamma-body">${content.description || content.description1 || ''}</p>
                ${content.description2 ? `<p class="gamma-body">${content.description2}</p>` : ''}
            </div>
        </div>
    `;

    // Add info cards if present
    if (hasCards && content.card1Title) {
        html += `
            <div class="gamma-cards-row">
                <div class="gamma-card">
                    <h3 class="gamma-subheading">${content.card1Title}</h3>
                    <p class="gamma-body gamma-body-sm">${content.card1Desc || ''}</p>
                </div>
                <div class="gamma-card">
                    <h3 class="gamma-subheading">${content.card2Title || ''}</h3>
                    <p class="gamma-body gamma-body-sm">${content.card2Desc || ''}</p>
                </div>
                <div class="gamma-card">
                    <h3 class="gamma-subheading">${content.card3Title || ''}</h3>
                    <p class="gamma-body gamma-body-sm">${content.card3Desc || ''}</p>
                </div>
            </div>
        `;
    }

    return html;
}

function renderStatsRow(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    return `
        ${content.title ? `<h2 class="gamma-heading">${content.title}</h2>` : ''}
        <div class="gamma-stats-grid">
            <div style="text-align: center;">
                <div class="gamma-stat gamma-stat-dark">${content.stat1 || ''}</div>
                <p class="gamma-caption">${content.label1 || ''}</p>
            </div>
            <div style="text-align: center;">
                <div class="gamma-stat gamma-stat-dark">${content.stat2 || ''}</div>
                <p class="gamma-caption">${content.label2 || ''}</p>
            </div>
            <div style="text-align: center;">
                <div class="gamma-stat gamma-stat-dark">${content.stat3 || ''}</div>
                <p class="gamma-caption">${content.label3 || ''}</p>
            </div>
        </div>
    `;
}

function renderStatsGrid(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    return `
        ${content.title ? `<h2 class="gamma-heading">${content.title}</h2>` : ''}
        <div class="gamma-stats-grid">
            <div class="gamma-card" style="text-align: center;">
                <div class="gamma-stat gamma-stat-dark">${content.stat1 || ''}</div>
                <p class="gamma-caption">${content.label1 || ''}</p>
            </div>
            <div class="gamma-card" style="text-align: center;">
                <div class="gamma-stat gamma-stat-dark">${content.stat2 || ''}</div>
                <p class="gamma-caption">${content.label2 || ''}</p>
            </div>
            <div class="gamma-card" style="text-align: center;">
                <div class="gamma-stat gamma-stat-dark">${content.stat3 || ''}</div>
                <p class="gamma-caption">${content.label3 || ''}</p>
            </div>
            <div class="gamma-card" style="text-align: center;">
                <div class="gamma-stat gamma-stat-dark">${content.stat4 || ''}</div>
                <p class="gamma-caption">${content.label4 || ''}</p>
            </div>
        </div>
    `;
}

function renderBigNumber(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    return `
        <div style="text-align: center;">
            <div class="gamma-stat gamma-stat-dark" style="font-size: 6rem;">${content.stat || ''}</div>
            <p class="gamma-body" style="font-size: 1.5rem; max-width: 600px; margin: 1.5rem auto 0;">${content.context || ''}</p>
            ${content.source ? `<p class="gamma-caption" style="margin-top: 2rem;">Source: ${content.source}</p>` : ''}
        </div>
    `;
}

// ==========================================
// FEATURES RENDERERS
// ==========================================

function renderFeatures4Col(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    const features = [
        { icon: images.icon1, title: content.f1Title, desc: content.f1Desc },
        { icon: images.icon2, title: content.f2Title, desc: content.f2Desc },
        { icon: images.icon3, title: content.f3Title, desc: content.f3Desc },
        { icon: images.icon4, title: content.f4Title, desc: content.f4Desc }
    ];

    return `
        <h2 class="gamma-heading">${content.title || ''}</h2>
        ${content.intro ? `<p class="gamma-body gamma-body-sm">${content.intro}</p>` : ''}
        <div class="gamma-features-grid">
            ${features.map(f => `
                <div class="gamma-feature-item">
                    ${f.icon ? `<img src="${f.icon.url}" alt="${f.icon.alt}" class="gamma-icon" />` : generateIconPlaceholder(theme)}
                    <div class="gamma-feature-content">
                        <h3 class="gamma-subheading">${f.title || ''}</h3>
                        <p class="gamma-body gamma-body-sm">${f.desc || ''}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderFeatures3Col(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    const features = [
        { icon: images.icon1, title: content.f1Title, desc: content.f1Desc },
        { icon: images.icon2, title: content.f2Title, desc: content.f2Desc },
        { icon: images.icon3, title: content.f3Title, desc: content.f3Desc }
    ];

    return `
        <h2 class="gamma-heading">${content.title || ''}</h2>
        <div class="gamma-features-grid">
            ${features.map(f => `
                <div>
                    ${f.icon ? `<img src="${f.icon.url}" alt="${f.icon.alt}" class="gamma-icon" style="margin-bottom: 1rem;" />` : generateIconPlaceholder(theme)}
                    <h3 class="gamma-subheading">${f.title || ''}</h3>
                    <p class="gamma-body gamma-body-sm">${f.desc || ''}</p>
                </div>
            `).join('')}
        </div>
    `;
}

function renderFeaturesCards(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    return `
        ${content.title ? `<h2 class="gamma-heading">${content.title}</h2>` : ''}
        <div class="gamma-cards-row">
            <div class="gamma-card">
                <h3 class="gamma-subheading">${content.f1Title || ''}</h3>
                <p class="gamma-body gamma-body-sm">${content.f1Desc || ''}</p>
            </div>
            <div class="gamma-card">
                <h3 class="gamma-subheading">${content.f2Title || ''}</h3>
                <p class="gamma-body gamma-body-sm">${content.f2Desc || ''}</p>
            </div>
            <div class="gamma-card">
                <h3 class="gamma-subheading">${content.f3Title || ''}</h3>
                <p class="gamma-body gamma-body-sm">${content.f3Desc || ''}</p>
            </div>
        </div>
    `;
}

// ==========================================
// CONTENT RENDERERS
// ==========================================

function renderContentText(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    return `
        <h2 class="gamma-heading">${content.title || ''}</h2>
        <div class="gamma-body">${content.body || ''}</div>
    `;
}

function renderContentSplit(layout: GammaLayoutType, content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    const imageHtml = images.main
        ? `<img src="${images.main.url}" alt="${images.main.alt}" class="gamma-image" />`
        : '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 100%; height: 100%; min-height: 300px; border-radius: 12px;"></div>';

    const bullets = content.bullets
        ? (Array.isArray(content.bullets)
            ? content.bullets.map(b => `<li>${b}</li>`).join('')
            : `<li>${content.bullets}</li>`)
        : '';

    const textContent = `
        <div class="gamma-content-text">
            <h2 class="gamma-heading">${content.title || ''}</h2>
            <p class="gamma-body">${content.body || ''}</p>
            ${bullets ? `<ul class="gamma-bullets">${bullets}</ul>` : ''}
        </div>
    `;

    const imageContent = `
        <div class="gamma-content-image">
            ${imageHtml}
        </div>
    `;

    if (layout === 'gamma-content-split-left') {
        return imageContent + textContent;
    }
    return textContent + imageContent;
}

function renderContentBullets(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    const bullets = content.bullets
        ? (Array.isArray(content.bullets)
            ? content.bullets.map(b => `<li>${b}</li>`).join('')
            : content.bullets.split('\n').map(b => `<li>${b}</li>`).join(''))
        : '';

    return `
        <h2 class="gamma-heading">${content.title || ''}</h2>
        ${content.intro ? `<p class="gamma-body">${content.intro}</p>` : ''}
        <ul class="gamma-bullets">${bullets}</ul>
    `;
}

// ==========================================
// CARDS RENDERERS
// ==========================================

function renderCards3(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    return `
        ${content.title ? `<h2 class="gamma-heading">${content.title}</h2>` : ''}
        <div class="gamma-cards-row">
            <div class="gamma-card">
                <h3 class="gamma-subheading">${content.card1Title || ''}</h3>
                <p class="gamma-body gamma-body-sm">${content.card1Desc || ''}</p>
            </div>
            <div class="gamma-card">
                <h3 class="gamma-subheading">${content.card2Title || ''}</h3>
                <p class="gamma-body gamma-body-sm">${content.card2Desc || ''}</p>
            </div>
            <div class="gamma-card">
                <h3 class="gamma-subheading">${content.card3Title || ''}</h3>
                <p class="gamma-body gamma-body-sm">${content.card3Desc || ''}</p>
            </div>
        </div>
    `;
}

function renderCardsHighlight(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    return `
        <h2 class="gamma-heading">${content.title || ''}</h2>
        <div style="display: flex; gap: 32px; align-items: flex-start;">
            <div class="gamma-card gamma-card-accent" style="min-width: 300px;">
                <span class="gamma-stat">${content.highlightStat || ''}</span>
                <p class="gamma-body" style="margin-top: 0.5rem;">${content.highlightLabel || ''}</p>
            </div>
            <div style="flex: 1;">
                <p class="gamma-body">${content.body || ''}</p>
            </div>
        </div>
    `;
}

// ==========================================
// TIMELINE RENDERERS
// ==========================================

function renderTimelineVertical(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    const events = [
        { year: content.event1Year, title: content.event1Title, desc: content.event1Desc },
        { year: content.event2Year, title: content.event2Title, desc: content.event2Desc },
        { year: content.event3Year, title: content.event3Title, desc: content.event3Desc }
    ].filter(e => e.year);

    return `
        <h2 class="gamma-heading">${content.title || ''}</h2>
        <div class="gamma-timeline">
            ${events.map(e => `
                <div class="gamma-timeline-item">
                    <div class="gamma-timeline-year">${e.year}</div>
                    <h3 class="gamma-subheading">${e.title || ''}</h3>
                    <p class="gamma-body gamma-body-sm">${e.desc || ''}</p>
                </div>
            `).join('')}
        </div>
    `;
}

// ==========================================
// QUOTE RENDERERS
// ==========================================

function renderQuoteCentered(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    return `
        <div style="max-width: 700px;">
            <p class="gamma-quote">${content.quote || ''}</p>
            <div style="margin-top: 2rem;">
                <p class="gamma-body" style="font-weight: 600; margin-bottom: 0.25rem;">${content.author || ''}</p>
                ${content.role ? `<p class="gamma-caption">${content.role}</p>` : ''}
            </div>
        </div>
    `;
}

function renderQuoteWithImage(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    return `
        <div style="display: flex; align-items: center; gap: 2rem; max-width: 800px;">
            ${images.avatar ? `<img src="${images.avatar.url}" alt="${images.avatar.alt}" class="gamma-avatar" style="width: 80px; height: 80px;" />` : ''}
            <div>
                <p class="gamma-quote" style="font-size: 1.5rem;">${content.quote || ''}</p>
                <div style="margin-top: 1rem;">
                    <p class="gamma-body" style="font-weight: 600; margin-bottom: 0;">${content.author || ''}</p>
                    ${content.role ? `<p class="gamma-caption">${content.role}</p>` : ''}
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// COMPARE RENDERERS
// ==========================================

function renderCompareSide(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    const leftBullets = content.leftPoints
        ? (Array.isArray(content.leftPoints)
            ? content.leftPoints.map(b => `<li>${b}</li>`).join('')
            : content.leftPoints.split('\n').map(b => `<li>${b}</li>`).join(''))
        : '';

    const rightBullets = content.rightPoints
        ? (Array.isArray(content.rightPoints)
            ? content.rightPoints.map(b => `<li>${b}</li>`).join('')
            : content.rightPoints.split('\n').map(b => `<li>${b}</li>`).join(''))
        : '';

    return `
        <h2 class="gamma-heading">${content.title || ''}</h2>
        <div class="gamma-compare-grid">
            <div class="gamma-card">
                <h3 class="gamma-subheading">${content.leftTitle || 'Option A'}</h3>
                <ul class="gamma-bullets">${leftBullets}</ul>
            </div>
            <div class="gamma-card gamma-card-accent">
                <h3 class="gamma-subheading">${content.rightTitle || 'Option B'}</h3>
                <ul class="gamma-bullets">${rightBullets}</ul>
            </div>
        </div>
    `;
}

// ==========================================
// CTA RENDERERS
// ==========================================

function renderCtaGradient(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    return `
        <h1 class="gamma-title" style="font-size: 3rem;">${content.title || ''}</h1>
        ${content.subtitle ? `<p class="gamma-body" style="font-size: 1.25rem; margin: 1.5rem 0 2rem; max-width: 600px;">${content.subtitle}</p>` : ''}
        ${content.cta ? `<span style="display: inline-block; padding: 1rem 2.5rem; background: white; color: ${theme.colors.primary}; font-weight: 600; border-radius: 8px; font-size: 1.1rem;">${content.cta}</span>` : ''}
    `;
}

function renderClosingThankYou(content: SlideContent, images: SlideImages, theme: GammaTheme): string {
    return `
        <h1 class="gamma-title" style="font-size: 4rem;">${content.thanks || 'Thank You'}</h1>
        ${content.contact ? `<p class="gamma-body" style="font-size: 1.25rem; margin-top: 2rem;">${content.contact}</p>` : ''}
        ${content.email ? `<p class="gamma-accent" style="font-size: 1.1rem; margin-top: 1rem;">${content.email}</p>` : ''}
    `;
}

// ==========================================
// HELPERS
// ==========================================

function generateIconPlaceholder(theme: GammaTheme): string {
    return `
        <div style="width: 80px; height: 80px; background: ${theme.colors.surface}; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${theme.colors.primary}" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v8M8 12h8"/>
            </svg>
        </div>
    `;
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): GammaTemplate | undefined {
    return GAMMA_TEMPLATES.find(t => t.id === id);
}

/**
 * Render multiple slides for a presentation
 */
export function renderPresentation(
    slides: Array<{ templateId: string; content: SlideContent; images: SlideImages }>,
    themeName: string = 'gamma'
): RenderedSlide[] {
    const theme = GAMMA_THEMES[themeName] || GAMMA_THEMES.gamma;

    return slides.map(slide => {
        const template = getTemplateById(slide.templateId);
        if (!template) {
            throw new Error(`Template not found: ${slide.templateId}`);
        }
        return renderGammaSlide(template, slide.content, slide.images, theme);
    });
}
