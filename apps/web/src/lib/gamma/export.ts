/**
 * 📤 Premium PPTX Export Engine
 * Convert Gamma presentations to stunning PowerPoint format
 * 
 * Features:
 * - Gradient backgrounds
 * - Beautiful typography with proper visual hierarchy
 * - Accent shapes and decorative elements
 * - Icon placeholders with visual markers
 * - Professional color schemes
 * - Slide master themes
 */

import type {
    GammaPresentation,
    GammaCard,
    ContentBlock,
    PresentationTheme,
    CardLayout
} from './types';

// Type definitions for pptxgenjs
interface PptxGenJS {
    new(): PptxPresentation;
}

interface PptxPresentation {
    author: string;
    title: string;
    subject: string;
    company: string;
    layout: string;
    defineLayout: (options: { name: string; width: number; height: number }) => void;
    defineSlideMaster: (options: any) => void;
    addSlide: (options?: { masterName?: string }) => PptxSlide;
    writeFile: (options: { fileName: string }) => Promise<void>;
    write: (options: { outputType: string }) => Promise<Blob>;
}

interface PptxSlide {
    addText: (text: string | TextProps[], options?: any) => void;
    addImage: (options: any) => void;
    addShape: (type: string, options: any) => void;
    addNotes: (text: string) => void;
    background: { color?: string; path?: string };
}

interface TextProps {
    text: string;
    options?: {
        fontSize?: number;
        fontFace?: string;
        color?: string;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        bullet?: { type: string; code?: string } | boolean;
        paraSpaceBefore?: number;
        paraSpaceAfter?: number;
        breakLine?: boolean;
    };
}

// Utility functions
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
}

function cleanFontName(font: string): string {
    // Always use Arial for maximum compatibility
    return 'Arial';
}

// Premium color palettes for gradient effects
const GRADIENT_PALETTES = {
    dark: {
        primary: ['0f172a', '1e293b'], // Slate gradient
        accent: ['312e81', '4338ca'], // Indigo gradient
        warm: ['7c2d12', 'b91c1c'], // Red-orange gradient
    },
    light: {
        primary: ['ffffff', 'f8fafc'], // White-slate gradient
        accent: ['eff6ff', 'dbeafe'], // Blue gradient
        warm: ['fef7ee', 'fed7aa'], // Orange gradient
    },
};

// Premium slide layouts with decorative elements
interface SlideLayout {
    title: { x: number; y: number; w: number; h: number; fontSize: number; align: string };
    content: { x: number; y: number; w: number; h: number };
    decorations?: Decoration[];
}

interface Decoration {
    type: 'gradient-bar' | 'accent-circle' | 'corner-shape' | 'divider-line' | 'dot-pattern';
    x: number;
    y: number;
    w: number;
    h: number;
    color?: string;
}

const PREMIUM_LAYOUTS: Record<string, SlideLayout> = {
    'title-centered': {
        title: { x: 1, y: 2.5, w: 11.33, h: 1.5, fontSize: 54, align: 'center' },
        content: { x: 1, y: 4.2, w: 11.33, h: 2 },
        decorations: [
            { type: 'gradient-bar', x: 0, y: 0, w: 13.33, h: 0.15, color: 'primary' },
            { type: 'accent-circle', x: 0.5, y: 6.5, w: 0.5, h: 0.5, color: 'accent' },
            { type: 'accent-circle', x: 12.33, y: 6.5, w: 0.5, h: 0.5, color: 'accent' },
        ],
    },
    'single-column': {
        title: { x: 0.75, y: 0.6, w: 11.83, h: 1.2, fontSize: 40, align: 'left' },
        content: { x: 0.75, y: 2, w: 11.83, h: 5 },
        decorations: [
            { type: 'gradient-bar', x: 0.75, y: 1.9, w: 2, h: 0.04, color: 'primary' },
        ],
    },
    'two-column': {
        title: { x: 0.75, y: 0.6, w: 11.83, h: 1.2, fontSize: 40, align: 'left' },
        content: { x: 0.75, y: 2, w: 5.67, h: 5 },
        decorations: [
            { type: 'gradient-bar', x: 0.75, y: 1.9, w: 2, h: 0.04, color: 'primary' },
            { type: 'divider-line', x: 6.67, y: 2.2, w: 0.02, h: 4.5, color: 'muted' },
        ],
    },
    'accent-left': {
        title: { x: 5.5, y: 0.8, w: 7.08, h: 1.2, fontSize: 36, align: 'left' },
        content: { x: 5.5, y: 2.2, w: 7.08, h: 4.8 },
        decorations: [
            { type: 'corner-shape', x: 0, y: 0, w: 5, h: 7.5, color: 'accent' },
        ],
    },
    'accent-right': {
        title: { x: 0.75, y: 0.8, w: 7.08, h: 1.2, fontSize: 36, align: 'left' },
        content: { x: 0.75, y: 2.2, w: 7.08, h: 4.8 },
        decorations: [
            { type: 'corner-shape', x: 8.33, y: 0, w: 5, h: 7.5, color: 'accent' },
        ],
    },
    'stats': {
        title: { x: 0.75, y: 0.6, w: 11.83, h: 1, fontSize: 36, align: 'center' },
        content: { x: 0.75, y: 2, w: 11.83, h: 5 },
        decorations: [
            { type: 'gradient-bar', x: 0, y: 7.35, w: 13.33, h: 0.15, color: 'primary' },
        ],
    },
    'quote': {
        title: { x: 1.5, y: 2, w: 10.33, h: 3, fontSize: 32, align: 'center' },
        content: { x: 1.5, y: 5.2, w: 10.33, h: 1.5 },
        decorations: [
            { type: 'accent-circle', x: 5.92, y: 0.8, w: 1.5, h: 1.5, color: 'primary' },
        ],
    },
    default: {
        title: { x: 0.75, y: 0.6, w: 11.83, h: 1.2, fontSize: 40, align: 'left' },
        content: { x: 0.75, y: 2, w: 11.83, h: 5 },
        decorations: [
            { type: 'gradient-bar', x: 0.75, y: 1.9, w: 2, h: 0.04, color: 'primary' },
        ],
    },
};

/**
 * Export a Gamma presentation to premium PPTX format
 */
export async function exportToPptx(
    presentation: GammaPresentation,
    options: {
        includeNotes?: boolean;
        quality?: 'draft' | 'standard' | 'high';
        fileName?: string;
    } = {}
): Promise<Blob> {
    const PptxGenJS = (await import('pptxgenjs')).default;
    const pptx = new PptxGenJS();

    const theme = presentation.theme || getDefaultTheme();
    const { includeNotes = true } = options;
    const isDark = theme.category === 'dark';

    // Set presentation metadata
    pptx.author = 'Karr AI';
    pptx.title = presentation.title;
    pptx.subject = presentation.description || 'AI-Generated Presentation';
    pptx.company = 'Karr AI';
    pptx.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"

    // Extract color values
    const colors = {
        bg: theme.colors.background.replace('#', ''),
        surface: theme.colors.surface.replace('#', ''),
        text: theme.colors.text.replace('#', ''),
        textMuted: theme.colors.textMuted.replace('#', ''),
        primary: theme.colors.primary.replace('#', ''),
        secondary: theme.colors.secondary.replace('#', ''),
        accent: theme.colors.accent.replace('#', ''),
    };

    console.log(`[PPTX Export] Starting export of ${presentation.cards.length} slides`);

    // Process each card as a slide
    for (let i = 0; i < presentation.cards.length; i++) {
        const card = presentation.cards[i];
        console.log(`[PPTX Export] Adding slide ${i + 1}: "${card.title}" (${card.blocks.length} blocks)`);
        await addPremiumSlide(pptx, card, theme, colors, {
            includeNotes,
            isFirst: i === 0,
            isLast: i === presentation.cards.length - 1,
            slideNumber: i + 1,
            totalSlides: presentation.cards.length,
            isDark,
        });
    }

    console.log('[PPTX Export] Generating blob...');
    // Generate the file as a Blob
    const blob = await pptx.write({ outputType: 'blob' }) as Blob;
    console.log(`[PPTX Export] Complete! Blob size: ${blob.size} bytes`);
    return blob;
}

/**
 * Add a premium-styled slide to the presentation
 */
async function addPremiumSlide(
    pptx: PptxPresentation,
    card: GammaCard,
    theme: PresentationTheme,
    colors: Record<string, string>,
    options: {
        includeNotes: boolean;
        isFirst: boolean;
        isLast: boolean;
        slideNumber: number;
        totalSlides: number;
        isDark: boolean;
    }
): Promise<void> {
    const slide = pptx.addSlide();
    const layout = PREMIUM_LAYOUTS[card.layout] || PREMIUM_LAYOUTS.default;

    // Set premium background
    slide.background = { color: colors.surface };

    // Add decorative elements
    addDecorations(slide, layout.decorations || [], colors, options.isDark);

    // Extract title and content blocks
    const titleBlock = card.blocks.find(b => b.type === 'heading');
    const contentBlocks = card.blocks.filter(b => b.type !== 'heading' || b !== titleBlock);

    // Add slide title with premium styling
    if (titleBlock) {
        const titleContent = titleBlock.content as { text: string; level: number };
        slide.addText(titleContent.text, {
            x: layout.title.x,
            y: layout.title.y,
            w: layout.title.w,
            h: layout.title.h,
            fontSize: layout.title.fontSize,
            fontFace: cleanFontName(theme.typography.headingFont),
            color: colors.text,
            bold: true,
            align: layout.title.align as any,
            valign: 'middle',
        });
    } else if (card.title) {
        slide.addText(card.title, {
            x: layout.title.x,
            y: layout.title.y,
            w: layout.title.w,
            h: layout.title.h,
            fontSize: layout.title.fontSize,
            fontFace: cleanFontName(theme.typography.headingFont),
            color: colors.text,
            bold: true,
            align: layout.title.align as any,
            valign: 'middle',
        });
    }

    // Add content blocks with premium styling
    let yOffset = layout.content.y;
    const contentWidth = layout.content.w;
    const contentX = layout.content.x;

    console.log(`[PPTX Export]   Processing ${contentBlocks.length} content blocks`);
    for (const block of contentBlocks) {
        console.log(`[PPTX Export]     Block type: ${block.type}`);
        const blockHeight = addPremiumBlock(slide, block, {
            x: contentX,
            y: yOffset,
            w: contentWidth,
            theme,
            colors,
            isDark: options.isDark,
        });
        yOffset += blockHeight + 0.25; // Add spacing between blocks
    }

    // Add page number footer
    slide.addText(`${options.slideNumber} / ${options.totalSlides}`, {
        x: 12,
        y: 7,
        w: 1,
        h: 0.4,
        fontSize: 10,
        fontFace: cleanFontName(theme.typography.bodyFont),
        color: colors.textMuted,
        align: 'right',
    });

    // Add speaker notes
    if (options.includeNotes && card.speakerNotes) {
        slide.addNotes(card.speakerNotes);
    }
}

/**
 * Add decorative elements to a slide
 */
function addDecorations(
    slide: PptxSlide,
    decorations: Decoration[],
    colors: Record<string, string>,
    isDark: boolean
): void {
    for (const deco of decorations) {
        const color = deco.color === 'primary' ? colors.primary :
            deco.color === 'accent' ? colors.accent :
                deco.color === 'muted' ? colors.textMuted :
                    deco.color || colors.primary;

        switch (deco.type) {
            case 'gradient-bar':
                slide.addShape('rect', {
                    x: deco.x,
                    y: deco.y,
                    w: deco.w,
                    h: deco.h,
                    fill: {
                        type: 'solid',
                        color: color,
                    },
                });
                break;

            case 'accent-circle':
                slide.addShape('ellipse', {
                    x: deco.x,
                    y: deco.y,
                    w: deco.w,
                    h: deco.h,
                    fill: { color: color, transparency: 70 },
                });
                break;

            case 'corner-shape':
                slide.addShape('rect', {
                    x: deco.x,
                    y: deco.y,
                    w: deco.w,
                    h: deco.h,
                    fill: { color: color, transparency: isDark ? 85 : 92 },
                });
                break;

            case 'divider-line':
                slide.addShape('rect', {
                    x: deco.x,
                    y: deco.y,
                    w: deco.w,
                    h: deco.h,
                    fill: { color: color, transparency: 60 },
                });
                break;
        }
    }
}

/**
 * Add a content block with premium styling
 */
function addPremiumBlock(
    slide: PptxSlide,
    block: ContentBlock,
    options: {
        x: number;
        y: number;
        w: number;
        theme: PresentationTheme;
        colors: Record<string, string>;
        isDark: boolean;
    }
): number {
    const { x, y, w, theme, colors, isDark } = options;
    let height = 0.8; // Default height

    switch (block.type) {
        case 'heading': {
            const content = block.content as { text: string; level: number };
            const fontSize = content.level === 1 ? 36 : content.level === 2 ? 28 : 22;
            height = content.level === 1 ? 1 : 0.8;

            slide.addText(content.text, {
                x,
                y,
                w,
                h: height,
                fontSize,
                fontFace: cleanFontName(theme.typography.headingFont),
                color: colors.text,
                bold: true,
            });
            break;
        }

        case 'paragraph': {
            const content = block.content as { html: string };
            const text = stripHtml(content.html);
            const lines = Math.ceil(text.length / 80);
            height = Math.max(0.6, lines * 0.35);

            slide.addText(text, {
                x,
                y,
                w,
                h: height,
                fontSize: 18,
                fontFace: cleanFontName(theme.typography.bodyFont),
                color: colors.text,
                lineSpacing: 24,
            });
            break;
        }

        case 'bullet-list':
        case 'numbered-list': {
            const content = block.content as { items: string[]; ordered: boolean };
            height = Math.max(1, content.items.length * 0.45);

            const textObjects: TextProps[] = content.items.map((item, i) => ({
                text: item,
                options: {
                    fontSize: 16,
                    fontFace: cleanFontName(theme.typography.bodyFont),
                    color: colors.text,
                    bullet: content.ordered
                        ? { type: 'number' }
                        : { type: 'bullet', code: '●' },
                    paraSpaceBefore: i === 0 ? 0 : 8,
                    breakLine: true,
                },
            }));

            slide.addText(textObjects, {
                x,
                y,
                w,
                h: height,
                valign: 'top',
            });
            break;
        }

        case 'stat': {
            const content = block.content as { value: string; label: string; prefix?: string; suffix?: string };
            height = 1.8;
            const statWidth = 2.5;

            // Stat value with large typography
            const displayValue = `${content.prefix || ''}${content.value}${content.suffix || ''}`;
            slide.addText(displayValue, {
                x,
                y,
                w: statWidth,
                h: 1.1,
                fontSize: 48,
                fontFace: cleanFontName(theme.typography.headingFont),
                color: colors.primary,
                bold: true,
                align: 'center',
            });

            // Stat label
            slide.addText(content.label, {
                x,
                y: y + 1.1,
                w: statWidth,
                h: 0.5,
                fontSize: 14,
                fontFace: cleanFontName(theme.typography.bodyFont),
                color: colors.textMuted,
                align: 'center',
            });
            break;
        }

        case 'quote': {
            const content = block.content as { text: string; author?: string };
            height = 2;

            // Quote opening mark
            slide.addText('"', {
                x: x - 0.3,
                y: y - 0.3,
                w: 1,
                h: 0.8,
                fontSize: 72,
                fontFace: 'Georgia',
                color: colors.primary,
                bold: true,
            });

            // Quote text
            slide.addText(content.text, {
                x: x + 0.5,
                y,
                w: w - 1,
                h: 1.4,
                fontSize: 24,
                fontFace: cleanFontName(theme.typography.bodyFont),
                color: colors.text,
                italic: true,
                align: 'left',
            });

            // Author
            if (content.author) {
                slide.addText(`— ${content.author}`, {
                    x: x + 0.5,
                    y: y + 1.5,
                    w: w - 1,
                    h: 0.4,
                    fontSize: 14,
                    fontFace: cleanFontName(theme.typography.bodyFont),
                    color: colors.textMuted,
                });
            }
            break;
        }

        case 'callout': {
            const content = block.content as { type: string; title?: string; text: string };
            height = 1.2;

            const calloutColors: Record<string, { bg: string; accent: string }> = {
                info: { bg: isDark ? '1e3a5f' : 'e0f2fe', accent: '0284c7' },
                warning: { bg: isDark ? '713f12' : 'fef3c7', accent: 'f59e0b' },
                success: { bg: isDark ? '14532d' : 'd1fae5', accent: '10b981' },
                error: { bg: isDark ? '7f1d1d' : 'fee2e2', accent: 'ef4444' },
                tip: { bg: isDark ? '4c1d95' : 'f3e8ff', accent: '8b5cf6' },
            };

            const calloutStyle = calloutColors[content.type] || calloutColors.info;

            // Callout background
            slide.addShape('roundRect', {
                x,
                y,
                w,
                h: height,
                fill: { color: calloutStyle.bg },
                rectRadius: 0.1,
            });

            // Accent bar on left
            slide.addShape('rect', {
                x,
                y,
                w: 0.08,
                h: height,
                fill: { color: calloutStyle.accent },
            });

            // Callout content
            const calloutText = content.title ? `${content.title}\n${content.text}` : content.text;
            slide.addText(calloutText, {
                x: x + 0.25,
                y: y + 0.15,
                w: w - 0.4,
                h: height - 0.3,
                fontSize: 14,
                fontFace: cleanFontName(theme.typography.bodyFont),
                color: isDark ? 'f8fafc' : '1e293b',
            });
            break;
        }

        case 'code': {
            const content = block.content as { code: string; language?: string };
            const lines = content.code.split('\n').length;
            height = Math.max(1, lines * 0.25 + 0.4);

            // Code block background
            slide.addShape('roundRect', {
                x,
                y,
                w,
                h: height,
                fill: { color: isDark ? '0f172a' : '1e293b' },
                rectRadius: 0.1,
            });

            // Code text
            slide.addText(content.code, {
                x: x + 0.2,
                y: y + 0.15,
                w: w - 0.4,
                h: height - 0.3,
                fontSize: 12,
                fontFace: 'Consolas',
                color: 'e2e8f0',
            });
            break;
        }

        case 'image': {
            const content = block.content as { src: string; alt?: string; caption?: string };
            height = 3;

            try {
                slide.addImage({
                    path: content.src,
                    x,
                    y,
                    w: Math.min(w, 6),
                    h: height - 0.5,
                    sizing: { type: 'contain', w: Math.min(w, 6), h: height - 0.5 },
                });
            } catch {
                // Add placeholder
                slide.addShape('rect', {
                    x,
                    y,
                    w: Math.min(w, 6),
                    h: height - 0.5,
                    fill: { color: colors.surface },
                    line: { color: colors.textMuted, width: 1, dashType: 'dash' },
                });
                slide.addText('Image placeholder', {
                    x,
                    y: y + (height - 0.5) / 2 - 0.2,
                    w: Math.min(w, 6),
                    h: 0.4,
                    fontSize: 12,
                    color: colors.textMuted,
                    align: 'center',
                });
            }

            // Caption
            if (content.caption) {
                slide.addText(content.caption, {
                    x,
                    y: y + height - 0.4,
                    w: Math.min(w, 6),
                    h: 0.3,
                    fontSize: 11,
                    fontFace: cleanFontName(theme.typography.bodyFont),
                    color: colors.textMuted,
                    align: 'center',
                    italic: true,
                });
            }
            break;
        }

        case 'divider': {
            height = 0.3;
            slide.addShape('rect', {
                x: x + w * 0.3,
                y: y + 0.1,
                w: w * 0.4,
                h: 0.02,
                fill: { color: colors.textMuted, transparency: 50 },
            });
            break;
        }

        case 'icon-text': {
            const content = block.content as { icon: string; title: string; description: string };
            height = 1.2;

            // Icon circle placeholder
            slide.addShape('ellipse', {
                x,
                y,
                w: 0.6,
                h: 0.6,
                fill: { color: colors.primary, transparency: 80 },
            });

            // Title and description
            slide.addText(content.title, {
                x: x + 0.8,
                y,
                w: w - 1,
                h: 0.4,
                fontSize: 16,
                fontFace: cleanFontName(theme.typography.headingFont),
                color: colors.text,
                bold: true,
            });

            slide.addText(content.description, {
                x: x + 0.8,
                y: y + 0.45,
                w: w - 1,
                h: 0.6,
                fontSize: 13,
                fontFace: cleanFontName(theme.typography.bodyFont),
                color: colors.textMuted,
            });
            break;
        }

        default:
            height = 0.5;
            break;
    }

    return height;
}

/**
 * Get default theme if none provided
 */
function getDefaultTheme(): PresentationTheme {
    return {
        id: 'midnight',
        name: 'Midnight',
        category: 'dark',
        colors: {
            primary: '#3b82f6',
            secondary: '#6366f1',
            accent: '#8b5cf6',
            background: '#0f172a',
            surface: '#1e293b',
            text: '#f8fafc',
            textMuted: '#94a3b8',
            success: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444',
        },
        typography: {
            headingFont: 'Arial',
            bodyFont: 'Arial',
            headingSizes: { h1: '3rem', h2: '2.25rem', h3: '1.875rem', h4: '1.5rem', h5: '1.25rem', h6: '1rem' },
            bodySize: '1rem',
            lineHeight: 1.6,
            letterSpacing: '0',
        },
        card: {
            background: '#1e293b',
            borderRadius: '1rem',
            padding: '2rem',
            shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
        components: {
            button: { background: '#3b82f6', text: '#ffffff', borderRadius: '0.5rem', hoverBackground: '#2563eb' },
            callout: { background: '#1e293b', border: '#334155', iconColor: '#60a5fa' },
            code: { background: '#0f172a', text: '#e2e8f0', border: '#334155' },
            quote: { borderColor: '#3b82f6', textColor: '#cbd5e1', backgroundColor: 'transparent' },
        },
    };
}

/**
 * Download a presentation as PPTX file
 */
export async function downloadPptx(
    presentation: GammaPresentation,
    fileName?: string
): Promise<void> {
    const blob = await exportToPptx(presentation, { includeNotes: true, quality: 'high' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `${presentation.title.replace(/[^a-z0-9]/gi, '_')}.pptx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export to PDF (via browser print) - Premium version
 */
export function exportToPdf(presentation: GammaPresentation): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow popups to export PDF');
        return;
    }

    const theme = presentation.theme || getDefaultTheme();
    const { cards } = presentation;
    const isDark = theme.category === 'dark';

    // Generate premium print-friendly HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${presentation.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        @page { size: 16in 9in landscape; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .slide {
            width: 16in;
            height: 9in;
            padding: 1in;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            background: ${theme.colors.surface};
            color: ${theme.colors.text};
            position: relative;
            overflow: hidden;
        }
        .slide:last-child { page-break-after: avoid; }
        .slide::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent});
        }
        h1, h2, h3 { font-family: 'Outfit', 'Inter', sans-serif; font-weight: 600; line-height: 1.2; }
        h1 { font-size: 3.5rem; margin-bottom: 1.5rem; }
        h2 { font-size: 2.5rem; margin-bottom: 1rem; }
        h3 { font-size: 1.75rem; margin-bottom: 0.75rem; }
        p { font-size: 1.25rem; line-height: 1.7; margin-bottom: 0.75rem; color: ${theme.colors.textMuted}; }
        ul, ol { font-size: 1.25rem; margin-left: 2rem; margin-bottom: 1rem; }
        li { margin-bottom: 0.5rem; line-height: 1.6; }
        li::marker { color: ${theme.colors.primary}; }
        .stat { text-align: center; padding: 1rem; }
        .stat-value { 
            font-size: 4rem; 
            font-weight: 700; 
            color: ${theme.colors.primary}; 
            font-family: 'Outfit', sans-serif;
        }
        .stat-label { font-size: 1rem; color: ${theme.colors.textMuted}; margin-top: 0.5rem; }
        blockquote { 
            font-size: 1.75rem; 
            font-style: italic; 
            padding: 2rem;
            padding-left: 3rem;
            border-left: 4px solid ${theme.colors.primary};
            background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
            border-radius: 0.5rem;
            margin: 1.5rem 0;
        }
        blockquote cite { 
            display: block; 
            margin-top: 1rem; 
            font-size: 1rem; 
            font-style: normal; 
            color: ${theme.colors.textMuted}; 
        }
        .callout {
            padding: 1.25rem 1.5rem;
            border-radius: 0.75rem;
            margin: 1rem 0;
            border-left: 4px solid ${theme.colors.primary};
            background: ${isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
        }
        .centered { 
            text-align: center; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            height: 100%; 
        }
        .slide-number {
            position: absolute;
            bottom: 0.75in;
            right: 1in;
            font-size: 0.875rem;
            color: ${theme.colors.textMuted};
        }
        pre {
            background: ${isDark ? '#0f172a' : '#1e293b'};
            padding: 1.25rem;
            border-radius: 0.5rem;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 0.95rem;
            overflow-x: auto;
            color: #e2e8f0;
        }
        .stats-grid { display: flex; gap: 2rem; justify-content: center; margin-top: 2rem; }
    </style>
</head>
<body>
    ${cards.map((card, i) => generatePremiumCardHtml(card, theme, i + 1, cards.length)).join('')}
    <script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
}

function generatePremiumCardHtml(
    card: GammaCard,
    theme: PresentationTheme,
    slideNum: number,
    totalSlides: number
): string {
    const isCentered = card.layout === 'title-centered' || card.layout === 'quote';

    let content = '';
    for (const block of card.blocks) {
        content += generatePremiumBlockHtml(block, theme);
    }

    return `
        <div class="slide${isCentered ? ' centered' : ''}">
            ${content}
            <div class="slide-number">${slideNum} / ${totalSlides}</div>
        </div>
    `;
}

function generatePremiumBlockHtml(block: ContentBlock, theme: PresentationTheme): string {
    switch (block.type) {
        case 'heading': {
            const { text, level } = block.content as { text: string; level: number };
            return `<h${level}>${text}</h${level}>`;
        }
        case 'paragraph': {
            const { html } = block.content as { html: string };
            return `<p>${html}</p>`;
        }
        case 'bullet-list':
        case 'numbered-list': {
            const { items, ordered } = block.content as { items: string[]; ordered: boolean };
            const tag = ordered ? 'ol' : 'ul';
            return `<${tag}>${items.map(i => `<li>${i}</li>`).join('')}</${tag}>`;
        }
        case 'stat': {
            const { value, label, prefix, suffix } = block.content as { value: string; label: string; prefix?: string; suffix?: string };
            return `<div class="stat"><div class="stat-value">${prefix || ''}${value}${suffix || ''}</div><div class="stat-label">${label}</div></div>`;
        }
        case 'quote': {
            const { text, author } = block.content as { text: string; author?: string };
            return `<blockquote>"${text}"${author ? `<cite>— ${author}</cite>` : ''}</blockquote>`;
        }
        case 'callout': {
            const { title, text } = block.content as { title?: string; text: string };
            return `<div class="callout">${title ? `<strong>${title}</strong><br>` : ''}${text}</div>`;
        }
        case 'code': {
            const { code } = block.content as { code: string };
            return `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
        }
        default:
            return '';
    }
}
