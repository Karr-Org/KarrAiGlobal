'use client';

/**
 * 🎴 Gamma Chat Integration
 * Allows generating and previewing presentations directly from chat
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Presentation, Play, Download, Edit3, Eye, ChevronDown, ChevronUp,
    Sparkles, Palette, Layout, Clock, FileType, ExternalLink
} from 'lucide-react';
import type { GammaPresentation, GammaCard } from '@/lib/gamma/types';
import { BUILTIN_THEMES, getThemeById } from '@/lib/gamma/themes';
import { downloadPptx, exportToPdf } from '@/lib/gamma/export';

interface GammaChatCardProps {
    presentation: GammaPresentation;
    onOpenViewer?: () => void;
    onEdit?: () => void;
}

/**
 * Compact presentation preview card for chat messages
 */
export function GammaChatCard({ presentation, onOpenViewer, onEdit }: GammaChatCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const { theme, cards, title, description } = presentation;

    const handleDownload = async () => {
        setIsExporting(true);
        try {
            await downloadPptx(presentation);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handlePdf = () => {
        exportToPdf(presentation);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden border shadow-lg max-w-2xl"
            style={{
                background: theme.colors.surface,
                borderColor: `${theme.colors.text}15`,
            }}
        >
            {/* Header */}
            <div
                className="p-4 flex items-start gap-4"
                style={{ background: `linear-gradient(135deg, ${theme.colors.primary}15, ${theme.colors.accent}10)` }}
            >
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: theme.colors.primary }}
                >
                    <Presentation className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3
                        className="font-semibold text-lg truncate"
                        style={{ color: theme.colors.text, fontFamily: theme.typography.headingFont }}
                    >
                        {title}
                    </h3>
                    <p className="text-sm opacity-70 line-clamp-2" style={{ color: theme.colors.text }}>
                        {description || `A ${cards.length}-card presentation`}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs opacity-60" style={{ color: theme.colors.text }}>
                        <span className="flex items-center gap-1">
                            <Layout className="w-3 h-3" />
                            {cards.length} cards
                        </span>
                        <span className="flex items-center gap-1">
                            <Palette className="w-3 h-3" />
                            {theme.name}
                        </span>
                    </div>
                </div>
            </div>

            {/* Card Thumbnails */}
            <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-thin">
                {cards.slice(0, 5).map((card, index) => (
                    <CardThumbnail key={card.id} card={card} theme={theme} index={index} />
                ))}
                {cards.length > 5 && (
                    <div
                        className="w-24 h-16 rounded-lg flex items-center justify-center shrink-0 text-xs font-medium"
                        style={{ background: `${theme.colors.text}10`, color: theme.colors.text }}
                    >
                        +{cards.length - 5} more
                    </div>
                )}
            </div>

            {/* Expandable Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t"
                        style={{ borderColor: `${theme.colors.text}10` }}
                    >
                        <div className="p-4 space-y-3">
                            <h4 className="text-sm font-medium opacity-70" style={{ color: theme.colors.text }}>
                                Card Overview
                            </h4>
                            {cards.map((card, index) => (
                                <div
                                    key={card.id}
                                    className="flex items-center gap-3 p-2 rounded-lg"
                                    style={{ background: `${theme.colors.text}05` }}
                                >
                                    <span
                                        className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                                        style={{ background: theme.colors.primary, color: '#fff' }}
                                    >
                                        {index + 1}
                                    </span>
                                    <span className="text-sm truncate" style={{ color: theme.colors.text }}>
                                        {card.title || `Card ${index + 1}`}
                                    </span>
                                    <span className="text-xs opacity-50 ml-auto" style={{ color: theme.colors.text }}>
                                        {card.layout}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Actions */}
            <div
                className="p-3 flex items-center gap-2 border-t"
                style={{ borderColor: `${theme.colors.text}10` }}
            >
                <button
                    onClick={onOpenViewer}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                    style={{ background: theme.colors.primary, color: '#fff' }}
                >
                    <Play className="w-4 h-4" />
                    View
                </button>

                <button
                    onClick={handleDownload}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/10"
                    style={{ background: `${theme.colors.text}10`, color: theme.colors.text }}
                >
                    {isExporting ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                            <Download className="w-4 h-4" />
                        </motion.div>
                    ) : (
                        <Download className="w-4 h-4" />
                    )}
                    PPTX
                </button>

                <button
                    onClick={handlePdf}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/10"
                    style={{ background: `${theme.colors.text}10`, color: theme.colors.text }}
                >
                    <FileType className="w-4 h-4" />
                    PDF
                </button>

                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/10"
                        style={{ background: `${theme.colors.text}10`, color: theme.colors.text }}
                    >
                        <Edit3 className="w-4 h-4" />
                        Edit
                    </button>
                )}

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="ml-auto p-2 rounded-lg transition-colors hover:bg-white/10"
                    style={{ color: theme.colors.text }}
                    title={isExpanded ? 'Collapse' : 'Expand'}
                >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>
        </motion.div>
    );
}

/**
 * Mini thumbnail for a card
 */
function CardThumbnail({ card, theme, index }: { card: GammaCard; theme: GammaPresentation['theme']; index: number }) {
    const getFirstHeading = () => {
        const headingBlock = card.blocks.find(b => b.type === 'heading');
        if (headingBlock) {
            const content = headingBlock.content as { text: string };
            return content.text || '';
        }
        return card.title || `Card ${index + 1}`;
    };

    return (
        <div
            className="w-24 h-16 rounded-lg p-2 shrink-0 overflow-hidden"
            style={{
                background: card.background?.value || theme.card.background,
                border: theme.card.border,
            }}
        >
            <div
                className="text-[8px] font-semibold truncate"
                style={{ color: theme.colors.text, fontFamily: theme.typography.headingFont }}
            >
                {getFirstHeading()}
            </div>
            <div className="flex gap-1 mt-1">
                {card.blocks.slice(0, 3).map((block, i) => (
                    <div
                        key={i}
                        className="h-1 rounded-full flex-1"
                        style={{ background: `${theme.colors.text}30` }}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Parse chat message to detect presentation generation requests
 */
export function parsePresentationRequest(message: string): {
    shouldGenerate: boolean;
    topic?: string;
    cardCount?: number;
    theme?: string;
    audience?: string;
    tone?: string;
} {
    const lowerMessage = message.toLowerCase();

    // Check for presentation-related keywords
    const presentationKeywords = [
        'create a presentation',
        'make a presentation',
        'generate a presentation',
        'build a presentation',
        'create slides',
        'make slides',
        'generate slides',
        'powerpoint',
        'pptx',
        'deck about',
        'slide deck',
        'presentation about',
        'presentation on',
        'slides about',
        'slides on'
    ];

    const shouldGenerate = presentationKeywords.some(kw => lowerMessage.includes(kw));

    if (!shouldGenerate) {
        return { shouldGenerate: false };
    }

    // Extract topic (text after 'about' or 'on')
    let topic = '';
    const aboutMatch = message.match(/(?:about|on)\s+["']?([^"'\n.]+)["']?/i);
    if (aboutMatch) {
        topic = aboutMatch[1].trim();
    } else {
        // Try to extract topic from the end of the message
        const topicMatch = message.match(/presentation\s+(.+?)(?:\s+with|\s+for|\s*$)/i);
        if (topicMatch) {
            topic = topicMatch[1].trim();
        }
    }

    // Extract card count
    let cardCount = 5; // Default
    const countMatch = message.match(/(\d+)\s*(?:cards?|slides?)/i);
    if (countMatch) {
        cardCount = Math.min(Math.max(parseInt(countMatch[1]), 3), 15);
    }

    // Extract theme preference
    let theme = 'midnight';
    const themeNames = BUILTIN_THEMES.map(t => t.id.toLowerCase());
    for (const themeName of themeNames) {
        if (lowerMessage.includes(themeName)) {
            theme = themeName;
            break;
        }
    }
    // Also check for general theme descriptions
    if (lowerMessage.includes('dark')) theme = 'midnight';
    if (lowerMessage.includes('light')) theme = 'clean-white';
    if (lowerMessage.includes('professional') || lowerMessage.includes('corporate')) theme = 'professional';
    if (lowerMessage.includes('creative') || lowerMessage.includes('colorful')) theme = 'aurora';
    if (lowerMessage.includes('minimal')) theme = 'minimal';

    // Extract audience
    let audience = 'general audience';
    const audienceMatch = message.match(/for\s+([^,.\n]+?)(?:\s+audience)?(?:,|\.|$)/i);
    if (audienceMatch) {
        audience = audienceMatch[1].trim();
    }

    // Extract tone
    let tone = 'professional';
    if (lowerMessage.includes('casual') || lowerMessage.includes('informal')) tone = 'casual';
    if (lowerMessage.includes('formal')) tone = 'formal';
    if (lowerMessage.includes('fun') || lowerMessage.includes('playful')) tone = 'playful';
    if (lowerMessage.includes('technical')) tone = 'technical';
    if (lowerMessage.includes('educational') || lowerMessage.includes('teaching')) tone = 'educational';

    return {
        shouldGenerate: true,
        topic: topic || 'Untitled Presentation',
        cardCount,
        theme,
        audience,
        tone,
    };
}

/**
 * Generate presentation system prompt for AI
 */
export function getPresentationSystemPrompt(): string {
    return `You are a presentation design expert. When asked to create a presentation, analyze the topic and generate a structured JSON response following this exact format:

{
  "title": "Presentation Title",
  "description": "Brief description",
  "cards": [
    {
      "title": "Card Title",
      "layout": "title-centered | single-column | two-column | accent-left | accent-right | stats | quote",
      "blocks": [
        {
          "type": "heading",
          "content": { "text": "Heading text", "level": 1 }
        },
        {
          "type": "paragraph",
          "content": { "html": "<p>Paragraph content</p>" }
        },
        {
          "type": "bullet-list",
          "content": { "items": ["Item 1", "Item 2", "Item 3"], "ordered": false }
        },
        {
          "type": "stat",
          "content": { "value": "95%", "label": "Success Rate" }
        },
        {
          "type": "quote",
          "content": { "text": "Quote text", "author": "Author Name" }
        }
      ],
      "speakerNotes": "Notes for the presenter"
    }
  ]
}

Layout Guidelines:
- title-centered: Use for title slides, one main heading centered
- single-column: Use for content-heavy slides with multiple paragraphs
- two-column: Use when comparing two things or presenting parallel information
- accent-left/right: Use when you have an image or visual to pair with text
- stats: Use for displaying key metrics (3-4 stats per card)
- quote: Use for impactful quotes

Block Types:
- heading: Use levels 1-3 for hierarchy
- paragraph: Rich text content
- bullet-list/numbered-list: For lists of items
- stat: For key metrics with value and label
- quote: For testimonials or important quotes

Always create engaging, visually balanced presentations with a clear narrative flow.`;
}

/**
 * Presentation generation loading state component
 */
export function PresentationGenerating({ topic }: { topic: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 max-w-md"
        >
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center"
            >
                <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <div>
                <p className="font-medium text-white">Generating Presentation</p>
                <p className="text-sm text-white/60">Creating slides about {topic}...</p>
            </div>
        </motion.div>
    );
}

export default GammaChatCard;
