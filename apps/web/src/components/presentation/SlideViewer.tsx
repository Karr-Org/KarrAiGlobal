'use client';

/**
 * KARR AI - SlideJSON Presentation Viewer
 * 
 * A pure React/CSS presentation viewer that renders SlideJSON
 * without requiring reveal.js. Includes:
 * - Quality score display
 * - Rating system (1-5 stars)
 * - Download options
 * - Feedback collection
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    X, Maximize, Minimize, Download, Star,
    ThumbsUp, BarChart3, Sparkles,
    FileText, Loader2, Check, ChevronLeft, ChevronRight,
    Circle, Image as ImageIcon
} from 'lucide-react';
import { SlideJSONPresentation, Slide } from '@/lib/presentation/types';

interface SlideViewerProps {
    presentation?: SlideJSONPresentation;
    markdown?: string;
    onClose: () => void;
    userId?: string;
    onRatingSubmit?: (rating: number, feedback?: string) => void;
}

export default function SlideViewer({
    presentation,
    markdown,
    onClose,
    userId,
    onRatingSubmit
}: SlideViewerProps) {
    const viewStartTimeRef = useRef<number>(Date.now());

    const [currentSlide, setCurrentSlide] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showRating, setShowRating] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasRated, setHasRated] = useState(false);
    const [showQuality, setShowQuality] = useState(false);

    // Parse markdown into slides if no SlideJSON
    const slides: Slide[] = presentation?.slides || parseMarkdownSlides(markdown || '');
    const totalSlides = slides.length;

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setCurrentSlide(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [totalSlides, onClose]);

    // Record view duration on close
    const handleClose = useCallback(async () => {
        const viewDuration = Math.round((Date.now() - viewStartTimeRef.current) / 1000);

        if (presentation?.id && userId) {
            try {
                await fetch('/api/presentations/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'view',
                        presentationId: presentation.id,
                        userId,
                        durationSeconds: viewDuration
                    })
                });
            } catch (e) {
                console.error('Failed to record view:', e);
            }
        }

        onClose();
    }, [presentation?.id, userId, onClose]);

    // Submit rating
    const handleSubmitRating = async () => {
        if (rating === 0 || !presentation?.id || !userId) return;

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/presentations/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'rate',
                    presentationId: presentation.id,
                    userId,
                    rating,
                    feedback: feedback || undefined
                })
            });

            if (response.ok) {
                setHasRated(true);
                setShowRating(false);
                onRatingSubmit?.(rating, feedback);
            }
        } catch (e) {
            console.error('Failed to submit rating:', e);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Download PDF (using browser print)
    const handleDownloadPdf = async () => {
        if (presentation?.id && userId) {
            try {
                await fetch('/api/presentations/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'download',
                        presentationId: presentation.id,
                        userId,
                        format: 'pdf'
                    })
                });
            } catch (e) {
                console.error('Failed to record download:', e);
            }
        }
        window.print();
    };

    // Quality score color
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-amber-400';
        return 'text-red-400';
    };

    const qualityScores = presentation?.qualityScores;
    const designTokens = presentation?.designTokens;
    const currentSlideData = slides[currentSlide];

    return (
        <div className={`fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col transition-all duration-300 ${isFullscreen ? 'p-0' : 'p-4 md:p-6'}`}>

            {/* Toolbar */}
            <div className="flex items-center justify-between text-white mb-3 px-2">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-fuchsia-400" />
                        {presentation?.title || 'Presentation Preview'}
                    </h2>

                    {/* Quality Score Badge */}
                    {qualityScores && (
                        <button
                            onClick={() => setShowQuality(!showQuality)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm"
                            title="View Quality Scores"
                        >
                            <BarChart3 className="w-4 h-4" />
                            <span className={getScoreColor(qualityScores.overall)}>
                                {qualityScores.overall}
                            </span>
                            <span className="text-white/60">Quality</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Rating Button */}
                    {!hasRated && presentation?.id && (
                        <button
                            onClick={() => setShowRating(!showRating)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${showRating ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 hover:bg-white/20 text-white/80'
                                }`}
                            title="Rate this presentation"
                        >
                            <Star className="w-4 h-4" />
                            Rate
                        </button>
                    )}

                    {hasRated && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm">
                            <Check className="w-4 h-4" />
                            Rated {rating}★
                        </div>
                    )}

                    {/* Download Button */}
                    <button
                        onClick={handleDownloadPdf}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
                        title="Download as PDF"
                    >
                        <FileText className="w-4 h-4" />
                        PDF
                    </button>

                    {/* Fullscreen Toggle */}
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>

                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors"
                        title="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Quality Scores Panel */}
            <AnimatePresence>
                {showQuality && qualityScores && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mx-2 mb-3 p-4 bg-white/5 rounded-xl border border-white/10"
                    >
                        <h3 className="text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            AI Quality Analysis
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { label: 'Overall', score: qualityScores.overall },
                                { label: 'Content', score: qualityScores.content },
                                { label: 'Design', score: qualityScores.design },
                                { label: 'Narrative', score: qualityScores.narrative },
                                { label: 'Accessibility', score: qualityScores.accessibility },
                            ].map(({ label, score }) => (
                                <div key={label} className="text-center">
                                    <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                                        {score}
                                    </div>
                                    <div className="text-xs text-white/50">{label}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rating Panel */}
            <AnimatePresence>
                {showRating && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mx-2 mb-3 p-4 bg-white/5 rounded-xl border border-white/10"
                    >
                        <h3 className="text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-400" />
                            How was this presentation?
                        </h3>

                        {/* Stars */}
                        <div className="flex items-center gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1 transition-transform hover:scale-110"
                                    title={`Rate ${star} stars`}
                                >
                                    <Star
                                        className={`w-8 h-8 transition-colors ${star <= (hoverRating || rating)
                                                ? 'text-amber-400 fill-amber-400'
                                                : 'text-white/20'
                                            }`}
                                    />
                                </button>
                            ))}
                            {rating > 0 && (
                                <span className="ml-3 text-white/60 text-sm">
                                    {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Very Poor'}
                                </span>
                            )}
                        </div>

                        {/* Feedback Text */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Optional feedback..."
                                aria-label="Feedback"
                                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-fuchsia-500/50"
                            />
                            <button
                                onClick={handleSubmitRating}
                                disabled={rating === 0 || isSubmitting}
                                className="px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ThumbsUp className="w-4 h-4" />
                                )}
                                Submit
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Slide Container */}
            <div className="flex-1 flex items-center justify-center relative">
                {/* Previous Button */}
                <button
                    onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 0))}
                    disabled={currentSlide === 0}
                    className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Previous slide"
                >
                    <ChevronLeft className="w-6 h-6 text-white" />
                </button>

                {/* Slide */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-4xl aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl mx-16"
                        style={{
                            background: getSlideBackground(currentSlideData, designTokens),
                        }}
                    >
                        <div className="h-full p-8 md:p-12 flex flex-col justify-center">
                            {renderSlideContent(currentSlideData, designTokens)}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Next Button */}
                <button
                    onClick={() => setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1))}
                    disabled={currentSlide === totalSlides - 1}
                    className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Next slide"
                >
                    <ChevronRight className="w-6 h-6 text-white" />
                </button>
            </div>

            {/* Slide Indicators */}
            <div className="flex items-center justify-center gap-2 py-4">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className="transition-all"
                        title={`Go to slide ${index + 1}`}
                    >
                        <Circle
                            className={`w-2.5 h-2.5 ${index === currentSlide
                                    ? 'text-fuchsia-400 fill-fuchsia-400'
                                    : 'text-white/30'
                                }`}
                        />
                    </button>
                ))}
                <span className="ml-4 text-white/50 text-sm">
                    {currentSlide + 1} / {totalSlides}
                </span>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .slide-content, .slide-content * { visibility: visible; }
                }
            `}</style>
        </div>
    );
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getSlideBackground(slide: Slide | undefined, designTokens: SlideJSONPresentation['designTokens'] | undefined): string {
    if (!slide) return 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';

    if (slide.background) {
        if (slide.background.type === 'gradient' && slide.background.colors) {
            return `linear-gradient(135deg, ${slide.background.colors[0]} 0%, ${slide.background.colors[1] || slide.background.colors[0]} 100%)`;
        }
        if (slide.background.type === 'solid' && slide.background.color) {
            return slide.background.color;
        }
    }

    // Default gradient from design tokens
    const primary = designTokens?.primaryColor || '#1a1a2e';
    const secondary = designTokens?.secondaryColor || '#16213e';
    return `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
}

function renderSlideContent(slide: Slide | undefined, designTokens: SlideJSONPresentation['designTokens'] | undefined) {
    if (!slide) return null;

    const accentColor = designTokens?.accentColor || '#e94560';

    return (
        <div className="slide-content h-full flex flex-col">
            {/* Title */}
            {slide.title && (
                <h1
                    className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight"
                    style={{ fontFamily: designTokens?.fontHeading || 'Inter' }}
                >
                    {slide.title}
                </h1>
            )}

            {/* Subtitle */}
            {slide.subtitle && (
                <p className="text-lg md:text-xl text-white/70 mb-6" style={{ fontFamily: designTokens?.fontBody || 'IBM Plex Sans' }}>
                    {slide.subtitle}
                </p>
            )}

            {/* Content */}
            {slide.content && (
                <div className="flex-1 flex items-center">
                    {renderContent(slide.content, accentColor, designTokens)}
                </div>
            )}

            {/* Image */}
            {slide.image && slide.image.position !== 'background' && slide.image.aiPrompt && (
                <div className="mt-4 flex justify-center">
                    <div className="relative rounded-xl overflow-hidden shadow-lg max-w-md">
                        <img
                            src={`https://image.pollinations.ai/prompt/${encodeURIComponent(slide.image.aiPrompt)}?width=600&height=400&nologo=true`}
                            alt="Slide illustration"
                            className="w-full h-auto"
                            loading="lazy"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1">
                            <ImageIcon className="w-3 h-3 text-white/70" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function renderContent(content: Slide['content'], accentColor: string, designTokens: SlideJSONPresentation['designTokens'] | undefined) {
    if (!content) return null;

    switch (content.type) {
        case 'bullet-list':
            return (
                <ul className="space-y-3 text-white/90">
                    {content.items?.map((item, i) => (
                        <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-3 text-lg"
                        >
                            <span
                                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                style={{ backgroundColor: accentColor }}
                            />
                            <span style={{ fontFamily: designTokens?.fontBody || 'IBM Plex Sans' }}>
                                {item.text}
                            </span>
                        </motion.li>
                    ))}
                </ul>
            );

        case 'statistics':
            return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                    {content.stats?.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="text-center"
                        >
                            <div
                                className="text-4xl md:text-5xl font-bold mb-1"
                                style={{ color: accentColor }}
                            >
                                {stat.value}
                            </div>
                            <div className="text-white/70 text-sm">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            );

        case 'quote':
            return (
                <div className="text-center max-w-2xl mx-auto">
                    <blockquote
                        className="text-2xl md:text-3xl text-white/90 italic mb-4"
                        style={{ fontFamily: designTokens?.fontBody || 'IBM Plex Sans' }}
                    >
                        "{content.quote}"
                    </blockquote>
                    {content.attribution && (
                        <cite className="text-white/60">— {content.attribution}</cite>
                    )}
                </div>
            );

        case 'comparison':
            return (
                <div className="grid grid-cols-2 gap-6 w-full">
                    {content.columns?.map((col, i) => (
                        <div key={i} className={`p-4 rounded-xl ${i === 0 ? 'bg-white/5' : 'bg-white/10'}`}>
                            <h3 className="text-xl font-semibold text-white mb-3">{col.title}</h3>
                            <ul className="space-y-2">
                                {col.items?.map((item, j) => (
                                    <li key={j} className="text-white/80 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            );

        case 'text':
            return (
                <div className="prose prose-invert prose-lg max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content.text || ''}
                    </ReactMarkdown>
                </div>
            );

        default:
            return null;
    }
}

// Parse markdown into basic slides (fallback)
function parseMarkdownSlides(markdown: string): Slide[] {
    const slideParts = markdown.split(/^---$/m);

    return slideParts.map((part, index) => {
        const lines = part.trim().split('\n');
        let title = '';
        let content = '';

        for (const line of lines) {
            if (line.startsWith('# ')) {
                title = line.replace(/^# /, '');
            } else {
                content += line + '\n';
            }
        }

        return {
            id: `slide_${index + 1}`,
            layout: 'bullet-list' as const,
            title: title || `Slide ${index + 1}`,
            content: {
                type: 'text' as const,
                text: content.trim()
            }
        };
    }).filter(slide => slide.title || slide.content?.text);
}
