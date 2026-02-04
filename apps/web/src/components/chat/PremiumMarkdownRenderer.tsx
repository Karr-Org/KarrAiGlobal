'use client';

import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Copy,
    Check,
    ExternalLink,
    AlertCircle,
    Info,
    Lightbulb,
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    FileCode2,
    Terminal,
    BookOpen,
    ChevronRight
} from 'lucide-react';
import { DiagramCard } from './DiagramCard';
import { fixMermaidCode } from '@/lib/mermaid-utils';

/**
 * 🎨 PREMIUM MARKDOWN RENDERER
 * 
 * World-class AI response rendering with:
 * - react-markdown for safe, extensible rendering
 * - remark-gfm for GitHub Flavored Markdown (tables, task lists)
 * - remark-breaks for chat-style line breaks
 * - remark-math + rehype-katex for LaTeX equations
 * - Shiki for beautiful code syntax highlighting (lazy loaded)
 * - Mermaid for diagrams (lazy loaded)
 * - Framer Motion for animations
 * - Custom callouts, citations, and styling
 */

// Import KaTeX CSS
import 'katex/dist/katex.min.css';

// ============ TYPES ============

interface PremiumMarkdownRendererProps {
    content: string;
    brandColor?: string;
    animate?: boolean;
    className?: string;
}

interface CodeBlockProps {
    language: string;
    code: string;
    brandColor: string;
}

// ============ ANIMATION VARIANTS ============

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
};

const fadeInScale = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
};

const slideInLeft = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    }
};

const staggerItem = {
    initial: { opacity: 0, y: 10 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
};

const hoverScale = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 }
};

const pulseGlow = {
    animate: {
        boxShadow: [
            "0 0 0 0 rgba(218, 123, 77, 0)",
            "0 0 20px 5px rgba(218, 123, 77, 0.15)",
            "0 0 0 0 rgba(218, 123, 77, 0)"
        ],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

// Spring configuration for natural motion
const springConfig = {
    type: "spring",
    stiffness: 400,
    damping: 30
};


// ============ CODE BLOCK WITH SYNTAX HIGHLIGHTING ============

const CodeBlock = memo(function CodeBlock({ language, code, brandColor }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const [highlighted, setHighlighted] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(code.split('\n').length > 20);

    // Language display names
    const languageLabels: Record<string, string> = {
        js: 'JavaScript',
        javascript: 'JavaScript',
        ts: 'TypeScript',
        typescript: 'TypeScript',
        tsx: 'TypeScript React',
        jsx: 'JavaScript React',
        py: 'Python',
        python: 'Python',
        bash: 'Bash',
        sh: 'Shell',
        shell: 'Shell',
        sql: 'SQL',
        json: 'JSON',
        html: 'HTML',
        css: 'CSS',
        md: 'Markdown',
        markdown: 'Markdown',
        yaml: 'YAML',
        yml: 'YAML',
        go: 'Go',
        rust: 'Rust',
        java: 'Java',
        cpp: 'C++',
        c: 'C',
        csharp: 'C#',
        cs: 'C#',
        ruby: 'Ruby',
        rb: 'Ruby',
        php: 'PHP',
        swift: 'Swift',
        kotlin: 'Kotlin',
        dart: 'Dart',
        r: 'R',
        matlab: 'MATLAB',
        latex: 'LaTeX',
        tex: 'LaTeX',
    };

    // Lazy load Shiki and highlight code
    useEffect(() => {
        let isMounted = true;

        const highlight = async () => {
            try {
                const { codeToHtml } = await import('shiki');

                const html = await codeToHtml(code.trim(), {
                    lang: language || 'text',
                    theme: 'github-dark-default',
                    transformers: [
                        {
                            line(node, line) {
                                node.properties['data-line'] = line;
                            }
                        }
                    ]
                });

                if (isMounted) {
                    setHighlighted(html);
                    setIsLoading(false);
                }
            } catch (error) {
                // Fallback to plain text if Shiki fails
                console.warn('Shiki highlighting failed:', error);
                if (isMounted) {
                    setHighlighted('');
                    setIsLoading(false);
                }
            }
        };

        highlight();

        return () => {
            isMounted = false;
        };
    }, [code, language]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const lines = code.split('\n');
    const displayedCode = isCollapsed ? lines.slice(0, 10).join('\n') : code;
    const languageLabel = languageLabels[language?.toLowerCase()] || language?.toUpperCase() || 'CODE';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            whileHover={{
                boxShadow: "0 8px 30px -10px rgba(0,0,0,0.3), 0 0 40px -15px rgba(218, 123, 77, 0.2)",
                transition: { duration: 0.3 }
            }}
            className="group relative my-4 rounded-xl overflow-hidden border border-sand-200 bg-[#0d1117] shadow-lg hover:border-sand-300 transition-colors"
        >
            {/* Animated gradient border on hover */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-terracotta-500/20 via-transparent to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Header Bar */}
            <div className="relative flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#30363d]">
                {/* Language indicator with animated dot */}
                <div className="flex items-center gap-2">
                    <motion.div
                        className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <FileCode2 className="w-4 h-4 text-sand-400" />
                    <span className="text-xs font-medium text-sand-300">{languageLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                    {lines.length > 20 && (
                        <motion.button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-sand-400 hover:text-sand-300 transition-colors rounded-md hover:bg-[#21262d]"
                        >
                            <motion.div
                                animate={{ rotate: isCollapsed ? 0 : 180 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChevronDown className="w-3 h-3" />
                            </motion.div>
                            {isCollapsed ? `Show all (${lines.length} lines)` : 'Collapse'}
                        </motion.button>
                    )}

                    {/* Animated Copy Button */}
                    <motion.button
                        onClick={handleCopy}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium overflow-hidden transition-colors ${copied
                            ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
                            : 'bg-[#21262d] text-sand-400 hover:text-sand-200 hover:bg-[#30363d] border border-transparent'
                            }`}
                    >
                        {/* Success ripple effect */}
                        <AnimatePresence>
                            {copied && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0.5 }}
                                    animate={{ scale: 2.5, opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute inset-0 bg-emerald-400 rounded-full"
                                    style={{ originX: 0.5, originY: 0.5 }}
                                />
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {copied ? (
                                <motion.div
                                    key="check"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                    className="flex items-center gap-1.5"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Copied!</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="copy"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                    className="flex items-center gap-1.5"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>
            </div>

            {/* Code Content with shimmer loading */}
            <div className="overflow-x-auto">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        // Shimmer loading skeleton
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-4 space-y-3"
                        >
                            {[...Array(Math.min(lines.length, 5))].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="relative h-4 rounded overflow-hidden"
                                    style={{ width: `${40 + Math.random() * 50}%` }}
                                >
                                    <div className="absolute inset-0 bg-[#21262d]" />
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#30363d] to-transparent"
                                        animate={{ x: ["-100%", "100%"] }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "linear",
                                            delay: i * 0.1
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : highlighted ? (
                        // Shiki-highlighted code with fade in
                        <motion.div
                            key="code"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="shiki-container text-sm leading-relaxed [&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:m-0 [&_code]:!font-mono"
                            dangerouslySetInnerHTML={{ __html: highlighted }}
                        />
                    ) : (
                        // Fallback plain text
                        <motion.pre
                            key="fallback"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-4 text-sm font-mono text-sand-200 leading-relaxed"
                        >
                            <code>{displayedCode}</code>
                        </motion.pre>
                    )}
                </AnimatePresence>
            </div>

            {/* Animated collapsed indicator */}
            <AnimatePresence>
                {isCollapsed && lines.length > 10 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 py-2 bg-[#161b22] border-t border-[#30363d] text-center overflow-hidden"
                    >
                        <motion.button
                            onClick={() => setIsCollapsed(false)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mx-auto px-3 py-1 rounded-md hover:bg-[#21262d] transition-colors"
                        >
                            <motion.div
                                animate={{ y: [0, 3, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <ChevronDown className="w-3 h-3" />
                            </motion.div>
                            Show {lines.length - 10} more lines
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

// ============ CALLOUT COMPONENTS ============

interface CalloutProps {
    type: 'note' | 'tip' | 'warning' | 'error' | 'success';
    children: React.ReactNode;
}

const Callout = memo(function Callout({ type, children }: CalloutProps) {
    const configs = {
        note: {
            icon: Info,
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            iconColor: 'text-blue-500',
            textColor: 'text-blue-800',
            label: 'Note'
        },
        tip: {
            icon: Lightbulb,
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            iconColor: 'text-amber-500',
            textColor: 'text-amber-800',
            label: 'Tip'
        },
        warning: {
            icon: AlertTriangle,
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            iconColor: 'text-orange-500',
            textColor: 'text-orange-800',
            label: 'Warning'
        },
        error: {
            icon: AlertCircle,
            bg: 'bg-red-50',
            border: 'border-red-200',
            iconColor: 'text-red-500',
            textColor: 'text-red-800',
            label: 'Error'
        },
        success: {
            icon: CheckCircle2,
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            iconColor: 'text-emerald-500',
            textColor: 'text-emerald-800',
            label: 'Success'
        }
    };

    const config = configs[type];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: 0.1
            }}
            whileHover={{
                scale: 1.01,
                transition: { duration: 0.2 }
            }}
            className={`relative flex items-start gap-3 rounded-xl p-4 my-4 ${config.bg} border ${config.border} overflow-hidden group`}
        >
            {/* Animated gradient overlay on hover */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/50 to-white/0 -translate-x-full"
                animate={{ translateX: ["−100%", "200%"] }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut"
                }}
            />

            {/* Animated icon */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                    delay: 0.2
                }}
            >
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
            </motion.div>

            <div className="flex-1 min-w-0 relative">
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className={`text-xs font-semibold ${config.textColor} uppercase tracking-wide mb-1`}
                >
                    {config.label}
                </motion.p>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`text-sm leading-relaxed ${config.textColor}`}
                >
                    {children}
                </motion.div>
            </div>
        </motion.div>
    );
});

// ============ CUSTOM COMPONENTS FOR REACT-MARKDOWN ============

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createCustomComponents(brandColor: string): Record<string, any> {
    return {
        // Headings with animations
        h1: ({ children }) => (
            <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-sand-900 mt-8 mb-4 first:mt-0"
            >
                {children}
            </motion.h1>
        ),
        h2: ({ children }) => (
            <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-sand-900 mt-6 mb-3 first:mt-0"
            >
                {children}
            </motion.h2>
        ),
        h3: ({ children }) => (
            <motion.h3
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-semibold text-sand-900 mt-5 mb-2 first:mt-0"
            >
                {children}
            </motion.h3>
        ),
        h4: ({ children }) => (
            <h4 className="text-base font-semibold text-sand-900 mt-4 mb-2 first:mt-0">
                {children}
            </h4>
        ),

        // Paragraphs
        p: ({ children }) => {
            // Check for callout patterns
            const text = String(children);
            if (text.toLowerCase().startsWith('note:')) {
                return <Callout type="note">{text.replace(/^note:\s*/i, '')}</Callout>;
            }
            if (text.toLowerCase().startsWith('tip:') || text.toLowerCase().startsWith('pro tip:')) {
                return <Callout type="tip">{text.replace(/^(pro\s*)?tip:\s*/i, '')}</Callout>;
            }
            if (text.toLowerCase().startsWith('warning:')) {
                return <Callout type="warning">{text.replace(/^warning:\s*/i, '')}</Callout>;
            }
            if (text.toLowerCase().startsWith('error:')) {
                return <Callout type="error">{text.replace(/^error:\s*/i, '')}</Callout>;
            }

            return (
                <p className="text-sand-700 leading-relaxed my-3">
                    {children}
                </p>
            );
        },

        // Lists with stagger animation
        ul: ({ children }) => (
            <motion.ul
                initial="initial"
                animate="animate"
                variants={{
                    animate: {
                        transition: { staggerChildren: 0.05 }
                    }
                }}
                className="space-y-2 my-4 list-none"
            >
                {children}
            </motion.ul>
        ),
        ol: ({ children }) => (
            <motion.ol
                initial="initial"
                animate="animate"
                variants={{
                    animate: {
                        transition: { staggerChildren: 0.05 }
                    }
                }}
                className="space-y-2 my-4 list-none counter-reset-item"
            >
                {children}
            </motion.ol>
        ),
        li: ({ children }) => (
            <motion.li
                variants={{
                    initial: { opacity: 0, x: -15 },
                    animate: {
                        opacity: 1,
                        x: 0,
                        transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 25
                        }
                    }
                }}
                whileHover={{ x: 3 }}
                className="flex items-start gap-3 group cursor-default"
            >
                {/* Animated bullet point */}
                <motion.span
                    className="flex-shrink-0 w-2 h-2 rounded-full mt-2 shadow-sm"
                    style={{ backgroundColor: brandColor }}
                    whileHover={{
                        scale: 1.5,
                        boxShadow: `0 0 10px ${brandColor}80`
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                />
                <span className="text-sand-700 leading-relaxed flex-1">{children}</span>
            </motion.li>
        ),

        // Code blocks
        pre: ({ children }) => {
            // Just pass through - actual handling is in `code`
            return <>{children}</>;
        },
        code: ({ className, children, ...props }) => {
            const code = String(children).replace(/\n$/, '');
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            // Check if it's inline code (no language class and short content)
            const isInline = !className && !code.includes('\n');

            // Handle Mermaid diagrams - Use Canvas/Artifact pattern for premium UX
            if (language === 'mermaid') {
                return <DiagramCard code={code} brandColor={brandColor} />;
            }

            // Inline code with hover effect
            if (isInline) {
                return (
                    <motion.code
                        className="px-1.5 py-0.5 rounded-md bg-sand-100 text-sand-800 text-[13px] font-mono border border-sand-200 cursor-pointer"
                        whileHover={{
                            backgroundColor: "#e7e5e4",
                            scale: 1.02,
                            transition: { duration: 0.15 }
                        }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {code}
                    </motion.code>
                );
            }

            // Block code with syntax highlighting
            return <CodeBlock language={language} code={code} brandColor={brandColor} />;
        },

        // Tables
        table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-sand-200">
                <table className="min-w-full divide-y divide-sand-200">
                    {children}
                </table>
            </div>
        ),
        thead: ({ children }) => (
            <thead className="bg-sand-50">
                {children}
            </thead>
        ),
        tbody: ({ children }) => (
            <tbody className="bg-white divide-y divide-sand-100">
                {children}
            </tbody>
        ),
        tr: ({ children }) => (
            <tr className="hover:bg-sand-50 transition-colors">
                {children}
            </tr>
        ),
        th: ({ children }) => (
            <th className="px-4 py-3 text-left text-xs font-semibold text-sand-600 uppercase tracking-wider">
                {children}
            </th>
        ),
        td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-sand-700">
                {children}
            </td>
        ),

        // Links with hover animation
        a: ({ href, children }) => (
            <motion.a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-terracotta-600 hover:text-terracotta-700 underline decoration-terracotta-300 underline-offset-2 transition-colors"
                whileHover={{
                    scale: 1.02,
                    x: 2
                }}
                whileTap={{ scale: 0.98 }}
            >
                {children}
                <motion.span
                    initial={{ rotate: 0 }}
                    whileHover={{ rotate: 15, x: 2, y: -2 }}
                    transition={{ type: "spring", stiffness: 400 }}
                >
                    <ExternalLink className="w-3 h-3" />
                </motion.span>
            </motion.a>
        ),

        // Blockquotes with enhanced animation
        blockquote: ({ children }) => (
            <motion.blockquote
                initial={{ opacity: 0, x: -20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                whileHover={{
                    x: 5,
                    transition: { duration: 0.2 }
                }}
                className="relative my-4 pl-4 border-l-4 border-sand-300 bg-gradient-to-r from-sand-50 to-transparent rounded-r-xl py-3 pr-4 overflow-hidden"
                style={{ borderLeftColor: brandColor }}
            >
                {/* Decorative quote mark */}
                <span className="absolute top-2 left-6 text-5xl text-sand-200 font-serif pointer-events-none select-none opacity-50">
                    "
                </span>
                <div className="text-sand-600 italic relative z-10">{children}</div>
            </motion.blockquote>
        ),

        // Animated horizontal rule
        hr: () => (
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="my-6"
            >
                <hr className="border-0 h-px bg-gradient-to-r from-transparent via-sand-300 to-transparent" />
            </motion.div>
        ),

        // Strong/Bold with subtle animation
        strong: ({ children }) => (
            <motion.strong
                className="font-semibold text-sand-900"
                whileHover={{ color: "#1c1917" }}
            >
                {children}
            </motion.strong>
        ),

        // Emphasis/Italic
        em: ({ children }) => (
            <em className="italic text-sand-600">{children}</em>
        ),

        // Animated task list checkboxes
        input: ({ checked }) => (
            <motion.span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-md border-2 mr-2 ${checked
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-sand-300 bg-white'
                    }`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
                <AnimatePresence>
                    {checked && (
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        >
                            <Check className="w-3.5 h-3.5 text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.span>
        ),

        // Images with enhanced animation
        img: ({ src, alt }) => (
            <motion.figure
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                whileHover={{
                    scale: 1.01,
                    transition: { duration: 0.2 }
                }}
                className="my-4 group"
            >
                <div className="relative overflow-hidden rounded-xl border border-sand-200 shadow-sm">
                    <motion.img
                        src={src}
                        alt={alt}
                        className="max-w-full"
                        loading="lazy"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                {alt && (
                    <motion.figcaption
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-2 text-center text-sm text-sand-500"
                    >
                        {alt}
                    </motion.figcaption>
                )}
            </motion.figure>
        ),
    };
}

// ============ MAIN COMPONENT ============

export function PremiumMarkdownRenderer({
    content,
    brandColor = '#DA7B4D',
    animate = true,
    className = ''
}: PremiumMarkdownRendererProps) {
    // Memoize components to avoid recreating on every render
    const components = useMemo(
        () => createCustomComponents(brandColor),
        [brandColor]
    );

    // Pre-process content to handle citation patterns like [Source 1, 2]
    const processedContent = useMemo(() => {
        // Convert [Source N] to superscript-style citations
        return content.replace(
            /\[Source\s*([\d,\s]+)\]/gi,
            (_, nums) => {
                const sources = nums.split(',').map((n: string) => n.trim());
                return sources
                    .map((n: string) => `<sup class="citation" data-source="${n}">[${n}]</sup>`)
                    .join('');
            }
        );
    }, [content]);

    return (
        <motion.div
            initial={animate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`premium-markdown prose-custom ${className}`}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
                components={components}
            >
                {processedContent}
            </ReactMarkdown>
        </motion.div>
    );
}

// ============ AI MESSAGE COMPONENT ============

interface AIMessageProps {
    content: string;
    sources?: { title: string; excerpt: string; type: string }[];
    brandColor?: string;
    showSources: boolean;
    onToggleSources: () => void;
    confidence?: number;
}

export function AIMessage({
    content,
    sources,
    brandColor = '#DA7B4D',
    showSources,
    onToggleSources,
    confidence
}: AIMessageProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-sand-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
            {/* Main Content */}
            <div className="px-5 py-4">
                <PremiumMarkdownRenderer content={content} brandColor={brandColor} />
            </div>

            {/* Sources Section */}
            {sources && sources.length > 0 && (
                <div className="border-t border-sand-100 px-5 py-3 bg-sand-50/50">
                    <button
                        onClick={onToggleSources}
                        className="flex items-center gap-2 text-xs text-sand-500 hover:text-sand-700 transition-colors w-full"
                    >
                        <BookOpen className="w-4 h-4" />
                        <span className="font-medium">{sources.length} sources</span>
                        <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform ${showSources ? 'rotate-90' : ''}`}
                        />

                        {confidence !== undefined && (
                            <span className="ml-auto flex items-center gap-1">
                                <span
                                    className={`w-2 h-2 rounded-full ${confidence >= 0.8 ? 'bg-emerald-400' :
                                        confidence >= 0.5 ? 'bg-amber-400' :
                                            'bg-red-400'
                                        }`}
                                />
                                <span className="text-sand-400">
                                    {Math.round(confidence * 100)}% confidence
                                </span>
                            </span>
                        )}
                    </button>

                    <AnimatePresence>
                        {showSources && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 space-y-2 overflow-hidden"
                            >
                                {sources.map((src, j) => (
                                    <motion.div
                                        key={j}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: j * 0.05 }}
                                        className="bg-white rounded-xl p-3 border border-sand-100 hover:border-sand-200 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span
                                                className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                                                style={{ backgroundColor: brandColor }}
                                            >
                                                {j + 1}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${src.type === 'private'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                : 'bg-violet-50 text-violet-700 border border-violet-100'
                                                }`}>
                                                {src.type === 'private' ? '📁 Your Document' : '📚 Knowledge Base'}
                                            </span>
                                            <span className="font-medium text-sand-800 text-sm truncate">
                                                {src.title}
                                            </span>
                                        </div>
                                        <p className="text-sand-500 text-xs leading-relaxed line-clamp-2 ml-7">
                                            {src.excerpt}
                                        </p>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
}

export default PremiumMarkdownRenderer;
