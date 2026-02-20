'use client';

import React from 'react';
import {
    CheckCircle2,
    AlertCircle,
    Info,
    Lightbulb,
    ArrowRight,
    ExternalLink
} from 'lucide-react';

/**
 * Premium Markdown Renderer for AI Responses
 * 
 * Transforms raw markdown into beautifully styled content with:
 * - Proper bold/italic rendering
 * - Styled bullet points and numbered lists
 * - Highlighted keywords
 * - Citation badges
 * - Info/warning callouts
 * - Code blocks with syntax highlighting feel
 */

interface MarkdownRendererProps {
    content: string;
    brandColor?: string;
}

export function MarkdownRenderer({ content, brandColor = '#DA7B4D' }: MarkdownRendererProps) {
    const renderContent = () => {
        // Split into paragraphs
        const paragraphs = content.split('\n\n');

        return paragraphs.map((paragraph, pIndex) => {
            // Check if it's a list block
            const lines = paragraph.split('\n');
            const isListBlock = lines.every(line =>
                line.trim().startsWith('*') ||
                line.trim().startsWith('-') ||
                line.trim().startsWith('•') ||
                line.trim().match(/^\d+\./) ||
                line.trim() === ''
            );

            if (isListBlock && lines.some(l => l.trim())) {
                return (
                    <ul key={pIndex} className="space-y-2 my-4">
                        {lines.filter(line => line.trim()).map((line, lIndex) => {
                            // Remove bullet markers
                            const cleanLine = line.trim()
                                .replace(/^[\*\-•]\s*/, '')
                                .replace(/^\d+\.\s*/, '');

                            return (
                                <li key={lIndex} className="flex items-start gap-3 group">
                                    <span
                                        className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2.5 transition-transform group-hover:scale-125"
                                        style={{ backgroundColor: brandColor }}
                                    />
                                    <span className="text-sand-700 leading-relaxed">
                                        {renderInlineMarkdown(cleanLine, brandColor)}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                );
            }

            // Check for headers
            if (paragraph.trim().startsWith('###')) {
                return (
                    <h4 key={pIndex} className="text-base font-semibold text-sand-900 mt-5 mb-2">
                        {renderInlineMarkdown(paragraph.replace(/^###\s*/, ''), brandColor)}
                    </h4>
                );
            }
            if (paragraph.trim().startsWith('##')) {
                return (
                    <h3 key={pIndex} className="text-lg font-semibold text-sand-900 mt-6 mb-3">
                        {renderInlineMarkdown(paragraph.replace(/^##\s*/, ''), brandColor)}
                    </h3>
                );
            }
            if (paragraph.trim().startsWith('#')) {
                return (
                    <h2 key={pIndex} className="text-xl font-bold text-sand-900 mt-6 mb-3">
                        {renderInlineMarkdown(paragraph.replace(/^#\s*/, ''), brandColor)}
                    </h2>
                );
            }

            // Check for callouts/notes
            if (paragraph.toLowerCase().includes('note:') || paragraph.toLowerCase().includes('important:')) {
                return (
                    <div key={pIndex} className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 my-4">
                        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-blue-800 text-sm leading-relaxed">
                            {renderInlineMarkdown(paragraph.replace(/^(note|important):\s*/i, ''), brandColor)}
                        </p>
                    </div>
                );
            }

            if (paragraph.toLowerCase().includes('tip:') || paragraph.toLowerCase().includes('pro tip:')) {
                return (
                    <div key={pIndex} className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4 my-4">
                        <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-amber-800 text-sm leading-relaxed">
                            {renderInlineMarkdown(paragraph.replace(/^(pro\s*)?tip:\s*/i, ''), brandColor)}
                        </p>
                    </div>
                );
            }

            // Regular paragraph with inline list handling
            const hasInlineList = lines.some(l => l.trim().startsWith('*') || l.trim().startsWith('-'));

            if (hasInlineList) {
                return (
                    <div key={pIndex} className="my-3">
                        {lines.map((line, lIndex) => {
                            if (line.trim().startsWith('*') || line.trim().startsWith('-') || line.trim().startsWith('•')) {
                                const cleanLine = line.trim().replace(/^[\*\-•]\s*/, '');
                                return (
                                    <div key={lIndex} className="flex items-start gap-3 py-1">
                                        <span
                                            className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2.5"
                                            style={{ backgroundColor: brandColor }}
                                        />
                                        <span className="text-sand-700 leading-relaxed">
                                            {renderInlineMarkdown(cleanLine, brandColor)}
                                        </span>
                                    </div>
                                );
                            }
                            return (
                                <p key={lIndex} className="text-sand-700 leading-relaxed">
                                    {renderInlineMarkdown(line, brandColor)}
                                </p>
                            );
                        })}
                    </div>
                );
            }

            // Regular paragraph
            return (
                <p key={pIndex} className="text-sand-700 leading-relaxed my-3">
                    {renderInlineMarkdown(paragraph, brandColor)}
                </p>
            );
        });
    };

    return (
        <div className="prose-custom">
            {renderContent()}
        </div>
    );
}

/**
 * Render inline markdown elements (bold, italic, code, citations)
 * Improved parsing to handle edge cases like *VAT:* section headers
 */
function renderInlineMarkdown(text: string, brandColor: string): React.ReactNode {
    if (!text) return null;

    const elements: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        // 1. Check for bold first (** ... **) - must come before italic
        const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
        if (boldMatch) {
            elements.push(
                <strong key={key++} className="font-semibold text-sand-900">
                    {boldMatch[1]}
                </strong>
            );
            remaining = remaining.slice(boldMatch[0].length);
            continue;
        }

        // 2. Check for section headers like *VAT:* or *GST:* or *Examples of Specific Rates:*
        const sectionMatch = remaining.match(/^\*([A-Z][A-Za-z0-9\s]+):\*\s*/);
        if (sectionMatch) {
            elements.push(
                <span
                    key={key++}
                    className="block font-semibold mt-4 mb-2"
                    style={{ color: brandColor }}
                >
                    {sectionMatch[1]}:
                </span>
            );
            remaining = remaining.slice(sectionMatch[0].length);
            continue;
        }

        // 3. Check for regular italic (* ... *)
        const italicMatch = remaining.match(/^\*([^*]+)\*/);
        if (italicMatch && !remaining.startsWith('**')) {
            elements.push(
                <em key={key++} className="italic text-sand-600">
                    {italicMatch[1]}
                </em>
            );
            remaining = remaining.slice(italicMatch[0].length);
            continue;
        }

        // 4. Check for code (` ... `)
        const codeMatch = remaining.match(/^`([^`]+)`/);
        if (codeMatch) {
            elements.push(
                <code
                    key={key++}
                    className="px-1.5 py-0.5 rounded bg-sand-100 text-sand-800 text-[13px] font-mono"
                >
                    {codeMatch[1]}
                </code>
            );
            remaining = remaining.slice(codeMatch[0].length);
            continue;
        }

        // 5. Check for citation [Source N] or [Source N, M]
        const citationMatch = remaining.match(/^\[Source\s*([\d,\s]+)\]/);
        if (citationMatch) {
            const sources = citationMatch[1].split(',').map(s => s.trim());
            elements.push(
                <span key={key++} className="inline-flex items-center gap-0.5 ml-0.5">
                    {sources.map((src, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium text-white"
                            style={{ backgroundColor: brandColor }}
                            title={`Source ${src}`}
                        >
                            {src}
                        </span>
                    ))}
                </span>
            );
            remaining = remaining.slice(citationMatch[0].length);
            continue;
        }

        // 6. No match - find next special character and add plain text
        const nextSpecial = remaining.slice(1).search(/[\*`\[]/);
        if (nextSpecial === -1) {
            elements.push(<span key={key++}>{remaining}</span>);
            break;
        } else {
            const plainText = remaining.slice(0, nextSpecial + 1);
            elements.push(<span key={key++}>{plainText}</span>);
            remaining = remaining.slice(nextSpecial + 1);
        }
    }

    return elements.length > 0 ? elements : text;
}

/**
 * Premium AI Message Bubble Component
 */
interface AIMessageProps {
    content: string;
    brandColor?: string;
    confidence?: number;
}

export function AIMessage({
    content,
    brandColor = '#DA7B4D',
}: AIMessageProps) {
    return (
        <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Main Content */}
            <div className="px-5 py-4">
                <MarkdownRenderer content={content} brandColor={brandColor} />
            </div>
        </div>
    );
}

export default MarkdownRenderer;
