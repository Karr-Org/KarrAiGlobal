/**
 * 🎨 Gamma-Style CSS Renderer
 * Generates CSS that matches Gamma.app's exact styling
 * 
 * Design tokens from actual Gamma presentations:
 * - Heading Font: Libre Baskerville (serif)
 * - Body Font: Open Sans (sans-serif)
 * - Card Radius: ~8-12px (roundRect in PPTX)
 * - Colors: Customizable per theme
 */

import { GammaTemplate, GammaLayoutType } from './gamma-templates';

// Theme configuration matching Gamma
export interface GammaTheme {
    name: string;
    colors: {
        primary: string;      // Main brand color (e.g., #403CCF)
        accent: string;       // Accent/secondary (e.g., same or complementary)
        text: string;         // Main text (#49495A in Gamma)
        textMuted: string;    // Muted text
        heading: string;      // Heading color (often same as primary)
        background: string;   // Page background (#FFFFFF)
        surface: string;      // Card/surface background (#EAE8F3 in Gamma)
        cardBg: string;       // Info card background
        white: string;        // White for contrast
    };
    fonts: {
        heading: string;      // "Libre Baskerville" in Gamma
        body: string;         // "Open Sans" in Gamma
    };
}

// Pre-built Gamma-style themes
export const GAMMA_THEMES: Record<string, GammaTheme> = {
    // Original Gamma blue/purple theme
    gamma: {
        name: 'Gamma Purple',
        colors: {
            primary: '#403CCF',
            accent: '#403CCF',
            text: '#49495A',
            textMuted: '#6B6B7B',
            heading: '#403CCF',
            background: '#FFFFFF',
            surface: '#EAE8F3',
            cardBg: '#EAE8F3',
            white: '#FFFFFF'
        },
        fonts: {
            heading: "'Libre Baskerville', Georgia, serif",
            body: "'Open Sans', -apple-system, sans-serif"
        }
    },
    // Professional blue
    corporate: {
        name: 'Corporate Blue',
        colors: {
            primary: '#1e40af',
            accent: '#2563eb',
            text: '#1e293b',
            textMuted: '#64748b',
            heading: '#1e40af',
            background: '#ffffff',
            surface: '#f1f5f9',
            cardBg: '#e2e8f0',
            white: '#ffffff'
        },
        fonts: {
            heading: "'Libre Baskerville', Georgia, serif",
            body: "'Open Sans', -apple-system, sans-serif"
        }
    },
    // Modern teal
    modern: {
        name: 'Modern Teal',
        colors: {
            primary: '#0d9488',
            accent: '#14b8a6',
            text: '#134e4a',
            textMuted: '#5eead4',
            heading: '#0d9488',
            background: '#ffffff',
            surface: '#f0fdfa',
            cardBg: '#ccfbf1',
            white: '#ffffff'
        },
        fonts: {
            heading: "'Libre Baskerville', Georgia, serif",
            body: "'Open Sans', -apple-system, sans-serif"
        }
    },
    // Warm orange
    warm: {
        name: 'Warm Orange',
        colors: {
            primary: '#ea580c',
            accent: '#fb923c',
            text: '#431407',
            textMuted: '#9a3412',
            heading: '#ea580c',
            background: '#fffbeb',
            surface: '#fed7aa',
            cardBg: '#ffedd5',
            white: '#ffffff'
        },
        fonts: {
            heading: "'Libre Baskerville', Georgia, serif",
            body: "'Open Sans', -apple-system, sans-serif"
        }
    },
    // Dark mode
    dark: {
        name: 'Dark Mode',
        colors: {
            primary: '#a78bfa',
            accent: '#8b5cf6',
            text: '#e2e8f0',
            textMuted: '#94a3b8',
            heading: '#a78bfa',
            background: '#0f172a',
            surface: '#1e293b',
            cardBg: '#334155',
            white: '#f1f5f9'
        },
        fonts: {
            heading: "'Libre Baskerville', Georgia, serif",
            body: "'Open Sans', -apple-system, sans-serif"
        }
    },
    // Elegant rose
    elegant: {
        name: 'Elegant Rose',
        colors: {
            primary: '#be185d',
            accent: '#ec4899',
            text: '#831843',
            textMuted: '#9d174d',
            heading: '#be185d',
            background: '#fff1f2',
            surface: '#fce7f3',
            cardBg: '#fbcfe8',
            white: '#ffffff'
        },
        fonts: {
            heading: "'Libre Baskerville', Georgia, serif",
            body: "'Open Sans', -apple-system, sans-serif"
        }
    }
};

// Generate base CSS for slides
export function generateGammaBaseCSS(theme: GammaTheme): string {
    return `
/* Gamma-Style Base CSS */
@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Open+Sans:wght@400;500;600;700&display=swap');

.gamma-slide {
    width: 100%;
    min-height: 560px;
    padding: 48px 56px;
    background: ${theme.colors.background};
    font-family: ${theme.fonts.body};
    color: ${theme.colors.text};
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
}

/* Typography */
.gamma-title {
    font-family: ${theme.fonts.heading};
    font-size: 2.75rem;
    font-weight: 400;
    color: ${theme.colors.heading};
    margin: 0 0 1.5rem 0;
    line-height: 1.2;
}

.gamma-heading {
    font-family: ${theme.fonts.heading};
    font-size: 2rem;
    font-weight: 400;
    color: ${theme.colors.heading};
    margin: 0 0 1rem 0;
    line-height: 1.3;
}

.gamma-subheading {
    font-family: ${theme.fonts.heading};
    font-size: 1.25rem;
    font-weight: 400;
    color: ${theme.colors.text};
    margin: 0 0 0.5rem 0;
    line-height: 1.4;
}

.gamma-body {
    font-family: ${theme.fonts.body};
    font-size: 1rem;
    font-weight: 400;
    color: ${theme.colors.text};
    line-height: 1.6;
    margin: 0 0 1rem 0;
}

.gamma-body-sm {
    font-size: 0.875rem;
    line-height: 1.5;
}

.gamma-caption {
    font-family: ${theme.fonts.body};
    font-size: 0.875rem;
    color: ${theme.colors.textMuted};
    margin: 0;
}

.gamma-muted {
    color: ${theme.colors.textMuted};
}

.gamma-accent {
    color: ${theme.colors.accent};
}

/* Stats */
.gamma-stat {
    font-family: ${theme.fonts.heading};
    font-size: 3.5rem;
    font-weight: 400;
    color: ${theme.colors.white};
    line-height: 1;
}

.gamma-stat-dark {
    color: ${theme.colors.primary};
}

/* Cards - Gamma signature style */
.gamma-card {
    background: ${theme.colors.cardBg};
    border-radius: 10px;
    padding: 24px;
    height: 100%;
}

.gamma-card-accent {
    background: ${theme.colors.primary};
    color: ${theme.colors.white};
}

.gamma-card-accent .gamma-subheading,
.gamma-card-accent .gamma-body {
    color: ${theme.colors.white};
}

/* Bullets */
.gamma-bullets {
    list-style: none;
    padding: 0;
    margin: 0;
}

.gamma-bullets li {
    position: relative;
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
    font-size: 1rem;
    line-height: 1.5;
}

.gamma-bullets li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: ${theme.colors.primary};
    font-weight: bold;
}

/* Images */
.gamma-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
}

.gamma-icon {
    width: 80px;
    height: 80px;
    object-fit: contain;
}

.gamma-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
}

/* Gradients */
.gamma-gradient-bg {
    background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${adjustColor(theme.colors.primary, 40)} 100%);
    color: ${theme.colors.white};
}

.gamma-gradient-bg .gamma-title,
.gamma-gradient-bg .gamma-heading,
.gamma-gradient-bg .gamma-body {
    color: ${theme.colors.white};
}

/* Accent bar */
.gamma-accent-bar {
    height: 4px;
    background: ${theme.colors.primary};
    margin-bottom: 2rem;
}

/* Quote */
.gamma-quote {
    font-family: ${theme.fonts.heading};
    font-size: 1.75rem;
    font-style: italic;
    color: ${theme.colors.text};
    position: relative;
    padding-left: 2rem;
}

.gamma-quote::before {
    content: '"';
    position: absolute;
    left: 0;
    top: -0.25rem;
    font-size: 3rem;
    color: ${theme.colors.primary};
    font-style: normal;
}

/* Timeline */
.gamma-timeline {
    position: relative;
    padding-left: 2.5rem;
}

.gamma-timeline::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: ${theme.colors.primary};
    border-radius: 2px;
}

.gamma-timeline-item {
    position: relative;
    padding-bottom: 2rem;
}

.gamma-timeline-item::before {
    content: '';
    position: absolute;
    left: -2.5rem;
    top: 0.25rem;
    width: 12px;
    height: 12px;
    background: ${theme.colors.primary};
    border-radius: 50%;
}

.gamma-timeline-year {
    font-family: ${theme.fonts.body};
    font-size: 0.875rem;
    font-weight: 600;
    color: ${theme.colors.primary};
    margin-bottom: 0.25rem;
}
`;
}

// Helper to adjust color brightness
function adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + amount);
    const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Generate layout-specific CSS
export function generateLayoutCSS(layout: GammaLayoutType, theme: GammaTheme): string {
    const layouts: Record<string, string> = {
        // Title layouts
        'gamma-title-minimal': `
            .gamma-slide { display: flex; flex-direction: column; justify-content: center; }
        `,
        'gamma-title-gradient': `
            .gamma-slide { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
        `,
        'gamma-title-split': `
            .gamma-slide { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        `,

        // Stats layouts
        'gamma-stat-featured': `
            .gamma-slide { display: flex; flex-direction: column; gap: 32px; }
            .gamma-stat-box { 
                background: ${theme.colors.primary}; 
                padding: 32px 40px; 
                border-radius: 10px; 
                display: inline-flex;
                flex-direction: column;
                max-width: 400px;
            }
            .gamma-cards-row { 
                display: grid; 
                grid-template-columns: repeat(3, 1fr); 
                gap: 20px; 
            }
        `,
        'gamma-stats-row': `
            .gamma-slide { display: flex; flex-direction: column; gap: 24px; }
            .gamma-stats-grid { 
                display: grid; 
                grid-template-columns: repeat(3, 1fr); 
                gap: 24px; 
                text-align: center;
            }
        `,
        'gamma-stats-grid': `
            .gamma-slide { display: flex; flex-direction: column; gap: 24px; }
            .gamma-stats-grid { 
                display: grid; 
                grid-template-columns: repeat(2, 1fr); 
                gap: 24px;
            }
        `,

        // Features layouts
        'gamma-features-4col': `
            .gamma-slide { display: flex; flex-direction: column; gap: 24px; }
            .gamma-features-grid { 
                display: grid; 
                grid-template-columns: repeat(4, 1fr); 
                gap: 32px;
            }
            .gamma-feature-item { display: flex; gap: 16px; }
            .gamma-feature-content { flex: 1; }
        `,
        'gamma-features-3col': `
            .gamma-slide { display: flex; flex-direction: column; gap: 24px; }
            .gamma-features-grid { 
                display: grid; 
                grid-template-columns: repeat(3, 1fr); 
                gap: 32px;
            }
        `,

        // Content layouts
        'gamma-content-split-left': `
            .gamma-slide { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
            .gamma-content-text { order: 2; }
            .gamma-content-image { order: 1; }
        `,
        'gamma-content-split-right': `
            .gamma-slide { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        `,
        'gamma-content-bullets': `
            .gamma-slide { display: flex; flex-direction: column; gap: 24px; }
        `,

        // Cards layouts
        'gamma-cards-3': `
            .gamma-slide { display: flex; flex-direction: column; gap: 24px; }
            .gamma-cards-row { 
                display: grid; 
                grid-template-columns: repeat(3, 1fr); 
                gap: 20px;
            }
        `,

        // Timeline
        'gamma-timeline-vertical': `
            .gamma-slide { display: flex; flex-direction: column; gap: 24px; }
        `,

        // Quote
        'gamma-quote-centered': `
            .gamma-slide { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
        `,

        // Compare
        'gamma-compare-side': `
            .gamma-slide { display: flex; flex-direction: column; gap: 24px; }
            .gamma-compare-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 32px;
            }
        `,

        // CTA
        'gamma-cta-gradient': `
            .gamma-slide { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
        `,
        'gamma-closing-thank-you': `
            .gamma-slide { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
        `
    };

    return layouts[layout] || '';
}

// Export complete CSS for a presentation
export function generatePresentationCSS(theme: GammaTheme): string {
    return generateGammaBaseCSS(theme);
}
