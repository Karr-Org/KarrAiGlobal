'use client';

/**
 * 🧱 Block Renderer
 * Renders individual content blocks for Gamma cards
 */

import React from 'react';
import { ContentBlock, PresentationTheme, CardLayout } from '@/lib/gamma/types';

export interface BlockRendererProps {
    block: ContentBlock;
    theme: PresentationTheme;
    cardLayout: CardLayout;
}

export function BlockRenderer({ block, theme, cardLayout }: BlockRendererProps) {
    const getGridArea = () => {
        if (block.position?.gridArea) return block.position.gridArea;
        return undefined;
    };

    const baseStyle: React.CSSProperties = {
        gridArea: getGridArea(),
        ...(block.style?.textAlign && { textAlign: block.style.textAlign }),
        ...(block.style?.color && { color: block.style.color }),
        ...(block.style?.backgroundColor && { backgroundColor: block.style.backgroundColor }),
    };

    switch (block.type) {
        case 'heading': {
            const content = block.content as { text: string; level: number };
            const HeadingTag = `h${content.level}` as keyof JSX.IntrinsicElements;
            const fontSize = theme.typography.headingSizes[`h${content.level}` as keyof typeof theme.typography.headingSizes];
            return (
                <HeadingTag
                    style={{
                        ...baseStyle,
                        fontFamily: theme.typography.headingFont,
                        fontSize,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        letterSpacing: theme.typography.letterSpacing,
                    }}
                >
                    {content.text}
                </HeadingTag>
            );
        }

        case 'paragraph': {
            const content = block.content as { html: string };
            return (
                <div
                    style={{
                        ...baseStyle,
                        fontSize: theme.typography.bodySize,
                        lineHeight: theme.typography.lineHeight,
                    }}
                    dangerouslySetInnerHTML={{ __html: content.html }}
                />
            );
        }

        case 'bullet-list':
        case 'numbered-list': {
            const content = block.content as { items: string[]; ordered: boolean };
            const ListTag = content.ordered ? 'ol' : 'ul';
            return (
                <ListTag
                    style={{
                        ...baseStyle,
                        fontSize: theme.typography.bodySize,
                        lineHeight: theme.typography.lineHeight,
                        paddingLeft: '1.5rem',
                    }}
                    className={content.ordered ? 'list-decimal' : 'list-disc'}
                >
                    {content.items.map((item, i) => (
                        <li key={i} className="mb-2">{item}</li>
                    ))}
                </ListTag>
            );
        }

        case 'image': {
            const content = block.content as { src: string; alt?: string; fit: string };
            return (
                <div style={{ ...baseStyle, position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
                    <img
                        src={content.src}
                        alt={content.alt || ''}
                        className="w-full h-full"
                        style={{
                            objectFit: content.fit as any || 'cover',
                            minHeight: '200px'
                        }}
                        loading="lazy"
                    />
                </div>
            );
        }

        case 'stat': {
            const content = block.content as { value: string; label: string; prefix?: string; suffix?: string; trend?: string };
            return (
                <div style={{ ...baseStyle, textAlign: 'center' }}>
                    <div
                        style={{
                            fontSize: '3rem',
                            fontWeight: 700,
                            fontFamily: theme.typography.headingFont,
                            color: theme.colors.primary,
                            lineHeight: 1
                        }}
                    >
                        {content.prefix}{content.value}{content.suffix}
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.5rem' }}>
                        {content.label}
                    </div>
                </div>
            );
        }

        case 'quote': {
            const content = block.content as { text: string; author?: string };
            return (
                <blockquote
                    style={{
                        ...baseStyle,
                        borderLeft: `4px solid ${theme.colors.primary}`,
                        paddingLeft: '1.5rem',
                        fontStyle: 'italic',
                        fontSize: '1.5rem',
                        lineHeight: 1.5,
                    }}
                >
                    <p>"{content.text}"</p>
                    {content.author && (
                        <footer style={{ fontSize: '1rem', marginTop: '1rem', opacity: 0.8, fontStyle: 'normal' }}>
                            — {content.author}
                        </footer>
                    )}
                </blockquote>
            );
        }

        default:
            return null;
    }
}
