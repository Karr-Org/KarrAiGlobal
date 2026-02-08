'use client';

/**
 * 🎬 Presentation Viewer & Export
 * Full-screen presentation mode with:
 * - Slide navigation
 * - Keyboard controls
 * - Progress bar
 * - Export to PDF/PNG
 * - Share functionality
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, X, Maximize2, Minimize2,
    Download, Share2, Play, Pause, Printer, Image as ImageIcon,
    Grid, List, FileText, Link as LinkIcon, Check, Copy,
    ArrowLeft, Home, Eye
} from 'lucide-react';

// ==========================================
// TYPES
// ==========================================

export interface PresentationCard {
    id: string;
    title: string;
    subtitle?: string;
    content: string;
    bullets?: string[];
    imageUrl?: string;
    layout: string;
}

export interface Presentation {
    id: string;
    title: string;
    cards: PresentationCard[];
    colorScheme: {
        primary: string;
        secondary: string;
    };
    createdAt: string;
}

interface PresentationViewerProps {
    presentation: Presentation;
    onClose?: () => void;
    onEdit?: () => void;
    mode?: 'preview' | 'fullscreen';
}

// ==========================================
// SLIDE RENDERER
// ==========================================

function SlideRenderer({
    card,
    colorScheme,
    isActive
}: {
    card: PresentationCard;
    colorScheme: { primary: string; secondary: string };
    isActive: boolean;
}) {
    const layoutStyles: Record<string, React.CSSProperties> = {
        'title-hero': {},
        'title-gradient': {},
        'content-split': {},
        'content-bullets': {},
        'features-3col': {},
        'quote': {},
        'stats': {},
        'cta': {}
    };

    // Title Hero Layout
    if (card.layout === 'title-hero') {
        return (
            <div className="w-full h-full relative overflow-hidden">
                {card.imageUrl && (
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${card.imageUrl})` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                    </div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={isActive ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-5xl md:text-7xl font-bold text-white mb-6"
                        style={{ fontFamily: 'Libre Baskerville, serif' }}
                    >
                        {card.title}
                    </motion.h1>
                    {card.subtitle && (
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={isActive ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="text-xl md:text-2xl text-white/80"
                        >
                            {card.subtitle}
                        </motion.p>
                    )}
                </div>
            </div>
        );
    }

    // Split Content Layout
    if (card.layout === 'content-split') {
        return (
            <div className="w-full h-full flex">
                <div className="w-1/2 p-12 flex flex-col justify-center">
                    <motion.h2
                        initial={{ opacity: 0, x: -30 }}
                        animate={isActive ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-4xl font-bold mb-6"
                        style={{ color: colorScheme.primary, fontFamily: 'Libre Baskerville, serif' }}
                    >
                        {card.title}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, x: -30 }}
                        animate={isActive ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-lg text-gray-700 mb-6"
                    >
                        {card.content}
                    </motion.p>
                    {card.bullets && card.bullets.length > 0 && (
                        <ul className="space-y-3">
                            {card.bullets.map((bullet, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={isActive ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                                    className="flex items-start gap-3 text-gray-700"
                                >
                                    <span
                                        className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                        style={{ backgroundColor: colorScheme.primary }}
                                    />
                                    {bullet}
                                </motion.li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="w-1/2">
                    {card.imageUrl ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={isActive ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${card.imageUrl})` }}
                        />
                    ) : (
                        <div
                            className="w-full h-full"
                            style={{ background: `linear-gradient(135deg, ${colorScheme.primary}20 0%, ${colorScheme.secondary}20 100%)` }}
                        />
                    )}
                </div>
            </div>
        );
    }

    // Bullet Points Layout
    if (card.layout === 'content-bullets') {
        return (
            <div className="w-full h-full p-12 flex flex-col justify-center">
                <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-4xl font-bold mb-8"
                    style={{ color: colorScheme.primary, fontFamily: 'Libre Baskerville, serif' }}
                >
                    {card.title}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-xl text-gray-700 mb-8 max-w-3xl"
                >
                    {card.content}
                </motion.p>
                {card.bullets && card.bullets.length > 0 && (
                    <div className="grid grid-cols-2 gap-6">
                        {card.bullets.map((bullet, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={isActive ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                                className="flex items-start gap-4 p-4 rounded-xl"
                                style={{ backgroundColor: `${colorScheme.primary}10` }}
                            >
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: colorScheme.primary }}
                                >
                                    <span className="text-white font-bold text-sm">{i + 1}</span>
                                </div>
                                <span className="text-gray-700 pt-1">{bullet}</span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Quote Layout
    if (card.layout === 'quote') {
        return (
            <div
                className="w-full h-full flex items-center justify-center p-16"
                style={{ background: `linear-gradient(135deg, ${colorScheme.primary}10 0%, ${colorScheme.secondary}10 100%)` }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isActive ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-4xl"
                >
                    <span
                        className="text-8xl opacity-20"
                        style={{ color: colorScheme.primary }}
                    >"</span>
                    <p
                        className="text-3xl md:text-4xl italic mb-8 -mt-12"
                        style={{ color: colorScheme.primary, fontFamily: 'Libre Baskerville, serif' }}
                    >
                        {card.content}
                    </p>
                    <p className="text-xl text-gray-600">— {card.title}</p>
                </motion.div>
            </div>
        );
    }

    // CTA Layout
    if (card.layout === 'cta') {
        return (
            <div
                className="w-full h-full flex flex-col items-center justify-center text-center p-16"
                style={{ background: `linear-gradient(135deg, ${colorScheme.primary} 0%, ${colorScheme.secondary} 100%)` }}
            >
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-5xl font-bold text-white mb-6"
                    style={{ fontFamily: 'Libre Baskerville, serif' }}
                >
                    {card.title}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-xl text-white/80 mb-10 max-w-2xl"
                >
                    {card.content}
                </motion.p>
                {card.bullets && card.bullets.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isActive ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="flex gap-4"
                    >
                        {card.bullets.map((bullet, i) => (
                            <div
                                key={i}
                                className="px-6 py-3 bg-white rounded-xl font-medium"
                                style={{ color: colorScheme.primary }}
                            >
                                {bullet}
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>
        );
    }

    // Default Layout
    return (
        <div className="w-full h-full p-12 flex flex-col justify-center">
            <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={isActive ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5 }}
                className="text-4xl font-bold mb-6"
                style={{ color: colorScheme.primary, fontFamily: 'Libre Baskerville, serif' }}
            >
                {card.title}
            </motion.h2>
            {card.subtitle && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={isActive ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-xl text-gray-600 mb-4"
                >
                    {card.subtitle}
                </motion.p>
            )}
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isActive ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-gray-700"
            >
                {card.content}
            </motion.p>
        </div>
    );
}

// ==========================================
// THUMBNAIL STRIP
// ==========================================

function ThumbnailStrip({
    cards,
    currentIndex,
    colorScheme,
    onSelect
}: {
    cards: PresentationCard[];
    currentIndex: number;
    colorScheme: { primary: string; secondary: string };
    onSelect: (index: number) => void;
}) {
    return (
        <div className="flex gap-2 overflow-x-auto p-2">
            {cards.map((card, index) => (
                <button
                    key={card.id}
                    onClick={() => onSelect(index)}
                    className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${index === currentIndex
                            ? 'border-white ring-2 ring-white'
                            : 'border-transparent opacity-50 hover:opacity-80'
                        }`}
                >
                    {card.imageUrl ? (
                        <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div
                            className="w-full h-full flex items-center justify-center text-[8px] font-medium text-white p-1"
                            style={{ backgroundColor: colorScheme.primary }}
                        >
                            {card.title.slice(0, 20)}
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
}

// ==========================================
// SHARE MODAL
// ==========================================

function ShareModal({
    presentation,
    onClose
}: {
    presentation: Presentation;
    onClose: () => void;
}) {
    const [copied, setCopied] = useState(false);
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/presentations/${presentation.id}`;

    const copyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold mb-4">Share Presentation</h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Share Link</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={shareUrl}
                                readOnly
                                className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                            />
                            <button
                                onClick={copyLink}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button className="flex-1 p-3 border rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2">
                            <FileText className="w-5 h-5" />
                            PDF
                        </button>
                        <button className="flex-1 p-3 border rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2">
                            <ImageIcon className="w-5 h-5" />
                            Images
                        </button>
                        <button className="flex-1 p-3 border rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2">
                            <LinkIcon className="w-5 h-5" />
                            Embed
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full py-2 text-gray-600 hover:text-gray-800"
                >
                    Close
                </button>
            </motion.div>
        </motion.div>
    );
}

// ==========================================
// MAIN VIEWER COMPONENT
// ==========================================

export default function PresentationViewer({
    presentation,
    onClose,
    onEdit,
    mode = 'preview'
}: PresentationViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(mode === 'fullscreen');
    const [isPlaying, setIsPlaying] = useState(false);
    const [showThumbnails, setShowThumbnails] = useState(true);
    const [showShare, setShowShare] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const { cards, colorScheme, title } = presentation;
    const currentCard = cards[currentIndex];

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            setCurrentIndex(prev => Math.min(prev + 1, cards.length - 1));
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setCurrentIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Escape') {
            if (isFullscreen) {
                document.exitFullscreen?.();
            } else if (onClose) {
                onClose();
            }
        } else if (e.key === 'f' || e.key === 'F') {
            toggleFullscreen();
        }
    }, [cards.length, isFullscreen, onClose]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Auto-play
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => {
                if (prev >= cards.length - 1) {
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [isPlaying, cards.length]);

    // Fullscreen handling
    const toggleFullscreen = () => {
        if (!isFullscreen) {
            containerRef.current?.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
        setIsFullscreen(!isFullscreen);
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Export functionality
    const handleExport = async (format: 'pdf' | 'images') => {
        // For now, just log - actual implementation would use html2canvas/jspdf
        console.log(`Exporting as ${format}`);
        alert(`Export to ${format.toUpperCase()} - Feature coming soon!`);
    };

    return (
        <div
            ref={containerRef}
            className={`flex flex-col bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'}`}
        >
            {/* Top Bar */}
            <div className="flex-shrink-0 bg-black/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                            title="Close"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-white font-semibold">{title}</h1>
                        <p className="text-white/50 text-sm">
                            Slide {currentIndex + 1} of {cards.length}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={() => setShowThumbnails(!showThumbnails)}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                        title="Toggle thumbnails"
                    >
                        <Grid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowShare(true)}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                        title="Share"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                        title="Download PDF"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                        title="Toggle fullscreen"
                    >
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="ml-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium"
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 relative overflow-hidden">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-10">
                    <motion.div
                        className="h-full"
                        style={{ backgroundColor: colorScheme.primary }}
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Slide */}
                <div className="w-full h-full bg-white">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentCard.id}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.4 }}
                            className="w-full h-full"
                        >
                            <SlideRenderer
                                card={currentCard}
                                colorScheme={colorScheme}
                                isActive={true}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation Arrows */}
                <button
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/50 text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={() => setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1))}
                    disabled={currentIndex === cards.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/50 text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Thumbnail Strip */}
            <AnimatePresence>
                {showThumbnails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex-shrink-0 bg-black/80 backdrop-blur-xl"
                    >
                        <ThumbnailStrip
                            cards={cards}
                            currentIndex={currentIndex}
                            colorScheme={colorScheme}
                            onSelect={setCurrentIndex}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Share Modal */}
            <AnimatePresence>
                {showShare && (
                    <ShareModal
                        presentation={presentation}
                        onClose={() => setShowShare(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ==========================================
// GRID VIEW (For thumbnail overview)
// ==========================================

export function PresentationGridView({
    presentation,
    onSelectSlide,
    onClose
}: {
    presentation: Presentation;
    onSelectSlide: (index: number) => void;
    onClose: () => void;
}) {
    const { cards, colorScheme, title } = presentation;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto"
        >
            <div className="sticky top-0 bg-gray-900/90 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                <div>
                    <h1 className="text-xl font-bold text-white">{title}</h1>
                    <p className="text-white/50">{cards.length} slides</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                    title="Close"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <button
                        key={card.id}
                        onClick={() => onSelectSlide(index)}
                        className="group bg-white rounded-xl overflow-hidden hover:ring-2 hover:ring-white transition-all"
                    >
                        <div className="aspect-video relative overflow-hidden">
                            {card.imageUrl ? (
                                <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center p-4"
                                    style={{ background: `linear-gradient(135deg, ${colorScheme.primary}20 0%, ${colorScheme.secondary}20 100%)` }}
                                >
                                    <span className="text-sm font-medium text-gray-700 line-clamp-2 text-center">
                                        {card.title}
                                    </span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div className="p-3 border-t">
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                    style={{ backgroundColor: colorScheme.primary }}
                                >
                                    {index + 1}
                                </span>
                                <span className="text-sm font-medium text-gray-900 truncate">{card.title}</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </motion.div>
    );
}
