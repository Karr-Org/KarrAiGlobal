/**
 * 🎨 Built-in Themes for Gamma-Style Presentations
 * 12 professionally designed themes
 */

import { PresentationTheme } from './types';

export const BUILTIN_THEMES: PresentationTheme[] = [
    // ==========================================
    // DARK THEMES
    // ==========================================
    {
        id: 'midnight',
        name: 'Midnight',
        category: 'dark',
        colors: {
            primary: '#6366f1',
            secondary: '#818cf8',
            accent: '#f472b6',
            background: '#0f0f1a',
            surface: '#1a1a2e',
            text: '#ffffff',
            textMuted: '#a1a1aa',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
        },
        typography: {
            headingFont: "'Inter', sans-serif",
            bodyFont: "'Inter', sans-serif",
            headingSizes: {
                h1: '3.5rem',
                h2: '2.5rem',
                h3: '1.875rem',
                h4: '1.5rem',
                h5: '1.25rem',
                h6: '1rem',
            },
            bodySize: '1.125rem',
            lineHeight: 1.7,
            letterSpacing: '-0.01em',
        },
        card: {
            background: '#1a1a2e',
            borderRadius: '24px',
            padding: '3rem',
            shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
        },
        components: {
            button: {
                background: '#6366f1',
                text: '#ffffff',
                borderRadius: '12px',
                hoverBackground: '#4f46e5',
            },
            callout: {
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                iconColor: '#6366f1',
            },
            code: {
                background: '#0d0d14',
                text: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.1)',
            },
            quote: {
                borderColor: '#6366f1',
                textColor: '#e2e8f0',
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
            },
        },
    },
    {
        id: 'obsidian',
        name: 'Obsidian',
        category: 'dark',
        colors: {
            primary: '#22d3ee',
            secondary: '#67e8f9',
            accent: '#fbbf24',
            background: '#0a0a0a',
            surface: '#171717',
            text: '#fafafa',
            textMuted: '#a3a3a3',
            success: '#22c55e',
            warning: '#eab308',
            error: '#dc2626',
        },
        typography: {
            headingFont: "'Space Grotesk', sans-serif",
            bodyFont: "'IBM Plex Sans', sans-serif",
            headingSizes: {
                h1: '4rem',
                h2: '2.75rem',
                h3: '2rem',
                h4: '1.5rem',
                h5: '1.25rem',
                h6: '1rem',
            },
            bodySize: '1.125rem',
            lineHeight: 1.6,
            letterSpacing: '0',
        },
        card: {
            background: 'linear-gradient(135deg, #171717 0%, #0f0f0f 100%)',
            borderRadius: '16px',
            padding: '3rem',
            shadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
        },
        components: {
            button: {
                background: '#22d3ee',
                text: '#0a0a0a',
                borderRadius: '8px',
                hoverBackground: '#06b6d4',
            },
            callout: {
                background: 'rgba(34, 211, 238, 0.1)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                iconColor: '#22d3ee',
            },
            code: {
                background: '#0a0a0a',
                text: '#22d3ee',
                border: '1px solid #262626',
            },
            quote: {
                borderColor: '#22d3ee',
                textColor: '#e5e5e5',
                backgroundColor: 'rgba(34, 211, 238, 0.05)',
            },
        },
    },
    {
        id: 'aurora',
        name: 'Aurora',
        category: 'dark',
        colors: {
            primary: '#a78bfa',
            secondary: '#c4b5fd',
            accent: '#34d399',
            background: '#0c0a1d',
            surface: '#1e1b4b',
            text: '#f5f3ff',
            textMuted: '#a5b4fc',
            success: '#34d399',
            warning: '#fbbf24',
            error: '#f87171',
        },
        typography: {
            headingFont: "'Outfit', sans-serif",
            bodyFont: "'Inter', sans-serif",
            headingSizes: {
                h1: '3.75rem',
                h2: '2.5rem',
                h3: '1.875rem',
                h4: '1.5rem',
                h5: '1.25rem',
                h6: '1rem',
            },
            bodySize: '1.125rem',
            lineHeight: 1.7,
            letterSpacing: '-0.02em',
        },
        card: {
            background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.9) 0%, rgba(12, 10, 29, 0.95) 100%)',
            borderRadius: '32px',
            padding: '3.5rem',
            shadow: '0 30px 60px -15px rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(167, 139, 250, 0.15)',
        },
        components: {
            button: {
                background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                text: '#ffffff',
                borderRadius: '16px',
                hoverBackground: '#8b5cf6',
            },
            callout: {
                background: 'rgba(167, 139, 250, 0.1)',
                border: '1px solid rgba(167, 139, 250, 0.25)',
                iconColor: '#a78bfa',
            },
            code: {
                background: '#0c0820',
                text: '#c4b5fd',
                border: '1px solid rgba(167, 139, 250, 0.2)',
            },
            quote: {
                borderColor: '#a78bfa',
                textColor: '#e0e7ff',
                backgroundColor: 'rgba(167, 139, 250, 0.08)',
            },
        },
    },

    // ==========================================
    // LIGHT THEMES
    // ==========================================
    {
        id: 'clean',
        name: 'Clean White',
        category: 'light',
        colors: {
            primary: '#2563eb',
            secondary: '#3b82f6',
            accent: '#f97316',
            background: '#ffffff',
            surface: '#f8fafc',
            text: '#0f172a',
            textMuted: '#64748b',
            success: '#16a34a',
            warning: '#ca8a04',
            error: '#dc2626',
        },
        typography: {
            headingFont: "'Inter', sans-serif",
            bodyFont: "'Inter', sans-serif",
            headingSizes: {
                h1: '3.5rem',
                h2: '2.5rem',
                h3: '1.875rem',
                h4: '1.5rem',
                h5: '1.25rem',
                h6: '1rem',
            },
            bodySize: '1.125rem',
            lineHeight: 1.7,
            letterSpacing: '-0.01em',
        },
        card: {
            background: '#ffffff',
            borderRadius: '20px',
            padding: '3rem',
            shadow: '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
        },
        components: {
            button: {
                background: '#2563eb',
                text: '#ffffff',
                borderRadius: '10px',
                hoverBackground: '#1d4ed8',
            },
            callout: {
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                iconColor: '#2563eb',
            },
            code: {
                background: '#f1f5f9',
                text: '#1e293b',
                border: '1px solid #e2e8f0',
            },
            quote: {
                borderColor: '#2563eb',
                textColor: '#334155',
                backgroundColor: '#f8fafc',
            },
        },
    },
    {
        id: 'cream',
        name: 'Warm Cream',
        category: 'light',
        colors: {
            primary: '#b45309',
            secondary: '#d97706',
            accent: '#059669',
            background: '#fefce8',
            surface: '#fef9c3',
            text: '#1c1917',
            textMuted: '#78716c',
            success: '#16a34a',
            warning: '#ca8a04',
            error: '#dc2626',
        },
        typography: {
            headingFont: "'Playfair Display', serif",
            bodyFont: "'Source Sans Pro', sans-serif",
            headingSizes: {
                h1: '3.5rem',
                h2: '2.5rem',
                h3: '1.875rem',
                h4: '1.5rem',
                h5: '1.25rem',
                h6: '1rem',
            },
            bodySize: '1.125rem',
            lineHeight: 1.8,
            letterSpacing: '0',
        },
        card: {
            background: '#fffbeb',
            borderRadius: '16px',
            padding: '3rem',
            shadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
            border: '2px solid #fef3c7',
        },
        components: {
            button: {
                background: '#b45309',
                text: '#ffffff',
                borderRadius: '8px',
                hoverBackground: '#92400e',
            },
            callout: {
                background: '#fef9c3',
                border: '1px solid #fcd34d',
                iconColor: '#b45309',
            },
            code: {
                background: '#fef3c7',
                text: '#78350f',
                border: '1px solid #fcd34d',
            },
            quote: {
                borderColor: '#b45309',
                textColor: '#44403c',
                backgroundColor: '#fef9c3',
            },
        },
    },
    {
        id: 'forest',
        name: 'Forest',
        category: 'light',
        colors: {
            primary: '#166534',
            secondary: '#15803d',
            accent: '#0891b2',
            background: '#f0fdf4',
            surface: '#dcfce7',
            text: '#14532d',
            textMuted: '#3f6212',
            success: '#16a34a',
            warning: '#ca8a04',
            error: '#dc2626',
        },
        typography: {
            headingFont: "'Merriweather', serif",
            bodyFont: "'Open Sans', sans-serif",
            headingSizes: {
                h1: '3.25rem',
                h2: '2.25rem',
                h3: '1.75rem',
                h4: '1.375rem',
                h5: '1.125rem',
                h6: '1rem',
            },
            bodySize: '1.0625rem',
            lineHeight: 1.75,
            letterSpacing: '0',
        },
        card: {
            background: 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)',
            borderRadius: '12px',
            padding: '2.5rem',
            shadow: '0 12px 35px -10px rgba(22, 101, 52, 0.15)',
            border: '1px solid #bbf7d0',
        },
        components: {
            button: {
                background: '#166534',
                text: '#ffffff',
                borderRadius: '8px',
                hoverBackground: '#14532d',
            },
            callout: {
                background: '#dcfce7',
                border: '1px solid #86efac',
                iconColor: '#166534',
            },
            code: {
                background: '#ecfdf5',
                text: '#166534',
                border: '1px solid #bbf7d0',
            },
            quote: {
                borderColor: '#166534',
                textColor: '#14532d',
                backgroundColor: '#dcfce7',
            },
        },
    },

    // ==========================================
    // CORPORATE THEMES
    // ==========================================
    {
        id: 'professional',
        name: 'Corporate Pro',
        category: 'corporate',
        colors: {
            primary: '#1e40af',
            secondary: '#3b82f6',
            accent: '#f59e0b',
            background: '#f8fafc',
            surface: '#ffffff',
            text: '#1e293b',
            textMuted: '#64748b',
            success: '#059669',
            warning: '#d97706',
            error: '#dc2626',
        },
        typography: {
            headingFont: "'Roboto', sans-serif",
            bodyFont: "'Roboto', sans-serif",
            headingSizes: {
                h1: '3rem',
                h2: '2.25rem',
                h3: '1.75rem',
                h4: '1.375rem',
                h5: '1.125rem',
                h6: '1rem',
            },
            bodySize: '1rem',
            lineHeight: 1.65,
            letterSpacing: '0',
        },
        card: {
            background: '#ffffff',
            borderRadius: '8px',
            padding: '2.5rem',
            shadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0',
        },
        components: {
            button: {
                background: '#1e40af',
                text: '#ffffff',
                borderRadius: '6px',
                hoverBackground: '#1e3a8a',
            },
            callout: {
                background: '#eff6ff',
                border: '1px solid #93c5fd',
                iconColor: '#1e40af',
            },
            code: {
                background: '#f1f5f9',
                text: '#334155',
                border: '1px solid #cbd5e1',
            },
            quote: {
                borderColor: '#1e40af',
                textColor: '#475569',
                backgroundColor: '#f8fafc',
            },
        },
    },

    // ==========================================
    // CREATIVE THEMES
    // ==========================================
    {
        id: 'neon',
        name: 'Neon Nights',
        category: 'creative',
        colors: {
            primary: '#f0abfc',
            secondary: '#e879f9',
            accent: '#22d3ee',
            background: '#0f0f23',
            surface: '#1a1a40',
            text: '#fdf4ff',
            textMuted: '#d8b4fe',
            success: '#4ade80',
            warning: '#fbbf24',
            error: '#f87171',
        },
        typography: {
            headingFont: "'Orbitron', sans-serif",
            bodyFont: "'Exo 2', sans-serif",
            headingSizes: {
                h1: '4rem',
                h2: '2.75rem',
                h3: '2rem',
                h4: '1.5rem',
                h5: '1.25rem',
                h6: '1rem',
            },
            bodySize: '1.125rem',
            lineHeight: 1.6,
            letterSpacing: '0.05em',
        },
        card: {
            background: 'linear-gradient(135deg, rgba(26, 26, 64, 0.9) 0%, rgba(15, 15, 35, 0.95) 100%)',
            borderRadius: '0',
            padding: '3rem',
            shadow: '0 0 40px rgba(240, 171, 252, 0.2), 0 0 80px rgba(34, 211, 238, 0.1)',
            border: '2px solid rgba(240, 171, 252, 0.3)',
        },
        components: {
            button: {
                background: 'linear-gradient(90deg, #f0abfc 0%, #22d3ee 100%)',
                text: '#0f0f23',
                borderRadius: '0',
                hoverBackground: '#e879f9',
            },
            callout: {
                background: 'rgba(240, 171, 252, 0.1)',
                border: '1px solid rgba(240, 171, 252, 0.4)',
                iconColor: '#f0abfc',
            },
            code: {
                background: 'rgba(34, 211, 238, 0.1)',
                text: '#22d3ee',
                border: '1px solid rgba(34, 211, 238, 0.3)',
            },
            quote: {
                borderColor: '#22d3ee',
                textColor: '#e0e7ff',
                backgroundColor: 'rgba(34, 211, 238, 0.08)',
            },
        },
    },
    {
        id: 'sunset',
        name: 'Sunset Gradient',
        category: 'creative',
        colors: {
            primary: '#f97316',
            secondary: '#fb923c',
            accent: '#ec4899',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #ede9fe 100%)',
            surface: 'rgba(255, 255, 255, 0.8)',
            text: '#1c1917',
            textMuted: '#78716c',
            success: '#22c55e',
            warning: '#eab308',
            error: '#dc2626',
        },
        typography: {
            headingFont: "'Poppins', sans-serif",
            bodyFont: "'Nunito', sans-serif",
            headingSizes: {
                h1: '3.75rem',
                h2: '2.5rem',
                h3: '1.875rem',
                h4: '1.5rem',
                h5: '1.25rem',
                h6: '1rem',
            },
            bodySize: '1.125rem',
            lineHeight: 1.7,
            letterSpacing: '-0.01em',
        },
        card: {
            background: 'rgba(255, 255, 255, 0.75)',
            borderRadius: '32px',
            padding: '3rem',
            shadow: '0 20px 50px -15px rgba(249, 115, 22, 0.2)',
            border: 'none',
        },
        components: {
            button: {
                background: 'linear-gradient(90deg, #f97316 0%, #ec4899 100%)',
                text: '#ffffff',
                borderRadius: '999px',
                hoverBackground: '#ea580c',
            },
            callout: {
                background: 'rgba(249, 115, 22, 0.1)',
                border: 'none',
                iconColor: '#f97316',
            },
            code: {
                background: 'rgba(255, 255, 255, 0.9)',
                text: '#c2410c',
                border: 'none',
            },
            quote: {
                borderColor: '#f97316',
                textColor: '#44403c',
                backgroundColor: 'rgba(249, 115, 22, 0.08)',
            },
        },
    },

    // ==========================================
    // MINIMAL THEMES
    // ==========================================
    {
        id: 'mono',
        name: 'Monochrome',
        category: 'minimal',
        colors: {
            primary: '#18181b',
            secondary: '#3f3f46',
            accent: '#18181b',
            background: '#fafafa',
            surface: '#ffffff',
            text: '#18181b',
            textMuted: '#71717a',
            success: '#18181b',
            warning: '#18181b',
            error: '#18181b',
        },
        typography: {
            headingFont: "'DM Sans', sans-serif",
            bodyFont: "'DM Sans', sans-serif",
            headingSizes: {
                h1: '4rem',
                h2: '2.5rem',
                h3: '1.75rem',
                h4: '1.25rem',
                h5: '1rem',
                h6: '0.875rem',
            },
            bodySize: '1.0625rem',
            lineHeight: 1.75,
            letterSpacing: '-0.02em',
        },
        card: {
            background: '#ffffff',
            borderRadius: '4px',
            padding: '3rem',
            shadow: 'none',
            border: '1px solid #e4e4e7',
        },
        components: {
            button: {
                background: '#18181b',
                text: '#ffffff',
                borderRadius: '4px',
                hoverBackground: '#27272a',
            },
            callout: {
                background: '#f4f4f5',
                border: '1px solid #e4e4e7',
                iconColor: '#18181b',
            },
            code: {
                background: '#f4f4f5',
                text: '#18181b',
                border: 'none',
            },
            quote: {
                borderColor: '#18181b',
                textColor: '#3f3f46',
                backgroundColor: 'transparent',
            },
        },
    },
    {
        id: 'swiss',
        name: 'Swiss Design',
        category: 'minimal',
        colors: {
            primary: '#dc2626',
            secondary: '#b91c1c',
            accent: '#dc2626',
            background: '#ffffff',
            surface: '#f5f5f5',
            text: '#000000',
            textMuted: '#525252',
            success: '#16a34a',
            warning: '#ca8a04',
            error: '#dc2626',
        },
        typography: {
            headingFont: "'Helvetica Neue', 'Helvetica', sans-serif",
            bodyFont: "'Helvetica Neue', 'Helvetica', sans-serif",
            headingSizes: {
                h1: '5rem',
                h2: '3rem',
                h3: '2rem',
                h4: '1.5rem',
                h5: '1.25rem',
                h6: '1rem',
            },
            bodySize: '1rem',
            lineHeight: 1.5,
            letterSpacing: '0',
        },
        card: {
            background: '#ffffff',
            borderRadius: '0',
            padding: '4rem',
            shadow: 'none',
            border: 'none',
        },
        components: {
            button: {
                background: '#dc2626',
                text: '#ffffff',
                borderRadius: '0',
                hoverBackground: '#b91c1c',
            },
            callout: {
                background: '#fef2f2',
                border: '4px solid #dc2626',
                iconColor: '#dc2626',
            },
            code: {
                background: '#f5f5f5',
                text: '#000000',
                border: 'none',
            },
            quote: {
                borderColor: '#dc2626',
                textColor: '#000000',
                backgroundColor: 'transparent',
            },
        },
    },
];

// Get theme by ID
export function getThemeById(id: string): PresentationTheme {
    return BUILTIN_THEMES.find(t => t.id === id) || BUILTIN_THEMES[0];
}

// Get themes by category
export function getThemesByCategory(category: PresentationTheme['category']): PresentationTheme[] {
    return BUILTIN_THEMES.filter(t => t.category === category);
}

// Generate CSS variables from theme
export function generateThemeCSS(theme: PresentationTheme): string {
    return `
        :root {
            --theme-primary: ${theme.colors.primary};
            --theme-secondary: ${theme.colors.secondary};
            --theme-accent: ${theme.colors.accent};
            --theme-background: ${theme.colors.background};
            --theme-surface: ${theme.colors.surface};
            --theme-text: ${theme.colors.text};
            --theme-text-muted: ${theme.colors.textMuted};
            --theme-success: ${theme.colors.success};
            --theme-warning: ${theme.colors.warning};
            --theme-error: ${theme.colors.error};
            
            --theme-heading-font: ${theme.typography.headingFont};
            --theme-body-font: ${theme.typography.bodyFont};
            --theme-body-size: ${theme.typography.bodySize};
            --theme-line-height: ${theme.typography.lineHeight};
            
            --theme-card-bg: ${theme.card.background};
            --theme-card-radius: ${theme.card.borderRadius};
            --theme-card-padding: ${theme.card.padding};
            --theme-card-shadow: ${theme.card.shadow};
        }
    `;
}
