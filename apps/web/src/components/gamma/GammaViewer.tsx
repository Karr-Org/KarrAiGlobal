'use client';

/**
 * 🎴 Gamma-Style Card Viewer
 * Beautiful, scrollable, web-native presentation viewer
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
    Maximize2, Minimize2, Download, Share2, MoreVertical,
    Play, Pause, Eye, Clock, Star, Layout, Palette,
    Sparkles, FileText, Image as ImageIcon, Grid, List,
    FileDown, Presentation, FileType, Save, Loader2, Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    GammaPresentation,
    GammaCard,
    ContentBlock,
    PresentationTheme,
    CardLayout
} from '@/lib/gamma/types';
import { downloadPptx, exportToPdf } from '@/lib/gamma/export';
import { CardView } from './CardView';
import { savePresentation } from '@/app/actions/presentation';


interface GammaViewerProps {
    presentation: GammaPresentation;
    onClose: () => void;
    onEdit?: () => void;
    onSave?: (presentation: GammaPresentation) => void;
    mode?: 'view' | 'present' | 'edit';
    initialCard?: number;
    userId?: string;
}

export default function GammaViewer({
    presentation,
    onClose,
    onEdit,
    onSave,
    mode = 'view',
    initialCard = 0,
    userId
}: GammaViewerProps) {
    const [localPresentation, setLocalPresentation] = useState(presentation);
    const [isEditing, setIsEditing] = useState(mode === 'edit');
    const [currentCard, setCurrentCard] = useState(initialCard);
    const [isFullscreen, setIsFullscreen] = useState(mode === 'present');
    const [showNotes, setShowNotes] = useState(false);
    const [showThumbnails, setShowThumbnails] = useState(true);
    const [isPaused, setIsPaused] = useState(true);
    const [autoPlayInterval, setAutoPlayInterval] = useState(5000);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Default theme for fallback
    const defaultTheme: PresentationTheme = {
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
            headingFont: 'Inter, system-ui, sans-serif',
            bodyFont: 'Inter, system-ui, sans-serif',
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
            button: {
                background: '#3b82f6',
                text: '#ffffff',
                borderRadius: '0.5rem',
                hoverBackground: '#2563eb',
            },
            callout: {
                background: '#1e293b',
                border: '#334155',
                iconColor: '#60a5fa',
            },
            code: {
                background: '#0f172a',
                text: '#e2e8f0',
                border: '#334155',
            },
            quote: {
                borderColor: '#3b82f6',
                textColor: '#cbd5e1',
                backgroundColor: 'transparent',
            },
        },
    };

    // Derive theme from presentation with fallback to default
    const theme: PresentationTheme = {
        ...defaultTheme,
        ...(localPresentation.theme || {}),
        colors: {
            ...defaultTheme.colors,
            ...(localPresentation.theme?.colors || {}),
        },
        typography: {
            ...defaultTheme.typography,
            ...(localPresentation.theme?.typography || {}),
            headingSizes: {
                ...defaultTheme.typography.headingSizes,
                ...(localPresentation.theme?.typography?.headingSizes || {}),
            },
        },
        card: {
            ...defaultTheme.card,
            ...(localPresentation.theme?.card || {}),
        },
        components: {
            button: {
                ...defaultTheme.components.button,
                ...(localPresentation.theme?.components?.button || {}),
            },
            callout: {
                ...defaultTheme.components.callout,
                ...(localPresentation.theme?.components?.callout || {}),
            },
            code: {
                ...defaultTheme.components.code,
                ...(localPresentation.theme?.components?.code || {}),
            },
            quote: {
                ...defaultTheme.components.quote,
                ...(localPresentation.theme?.components?.quote || {}),
            },
        },
    };

    // Sync state with prop
    useEffect(() => {
        setLocalPresentation(presentation);
    }, [presentation]);


    // Update block content
    const handleBlockUpdate = useCallback((cardId: string, blockId: string, content: any) => {
        setLocalPresentation(prev => ({
            ...prev,
            cards: prev.cards.map(card => {
                if (card.id !== cardId) return card;
                return {
                    ...card,
                    blocks: card.blocks.map(block => {
                        if (block.id !== blockId) return block;
                        return { ...block, content };
                    })
                };
            })
        }));
        setHasChanges(true);
    }, []);

    const handleReorderBlock = useCallback((cardId: string, activeId: string, overId: string) => {
        setLocalPresentation(pres => {
            if (!pres) return pres;

            const cardIndex = pres.cards.findIndex(c => c.id === cardId);
            if (cardIndex === -1) return pres;

            const card = pres.cards[cardIndex];
            const oldIndex = card.blocks.findIndex(b => b.id === activeId);
            const newIndex = card.blocks.findIndex(b => b.id === overId);

            if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return pres;

            // Create new blocks array
            const newBlocks = [...card.blocks];
            const [movedBlock] = newBlocks.splice(oldIndex, 1);
            newBlocks.splice(newIndex, 0, movedBlock);

            // Preserve grid areas based on logical position (slots)
            const originalGridAreas = card.blocks.map(b => b.position?.gridArea);
            const finalBlocks = newBlocks.map((b, i) => ({
                ...b,
                position: { ...b.position, gridArea: originalGridAreas[i] }
            }));

            const newCards = [...pres.cards];
            newCards[cardIndex] = { ...card, blocks: finalBlocks };

            return { ...pres, cards: newCards };
        });
        setHasChanges(true);
    }, []);

    // Save presentation to database
    const handleSave = useCallback(async () => {
        if (!localPresentation.id) {
            console.warn('[GammaViewer] Cannot save: no presentation ID');
            return;
        }

        setIsSaving(true);
        setSaveSuccess(false);

        try {
            const result = await savePresentation(localPresentation.id, {
                presentation: localPresentation,
                wasEdited: true,
            });

            if (result.success) {
                setSaveSuccess(true);
                setHasChanges(false);
                onSave?.(localPresentation);
                setTimeout(() => setSaveSuccess(false), 2000);
            } else {
                console.error('[GammaViewer] Save failed:', result.error);
                alert('Failed to save: ' + result.error);
            }
        } catch (err) {
            console.error('[GammaViewer] Save exception:', err);
            alert('Failed to save presentation');
        } finally {
            setIsSaving(false);
        }
    }, [localPresentation, onSave]);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);

    const localCards = localPresentation.cards;
    const totalCards = localCards.length;


    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                case ' ':
                case 'PageDown':
                    e.preventDefault();
                    goToCard(Math.min(currentCard + 1, totalCards - 1));
                    break;
                case 'ArrowUp':
                case 'ArrowLeft':
                case 'PageUp':
                    e.preventDefault();
                    goToCard(Math.max(currentCard - 1, 0));
                    break;
                case 'Home':
                    e.preventDefault();
                    goToCard(0);
                    break;
                case 'End':
                    e.preventDefault();
                    goToCard(totalCards - 1);
                    break;
                case 'Escape':
                    if (isFullscreen) {
                        setIsFullscreen(false);
                    } else {
                        onClose();
                    }
                    break;
                case 'f':
                case 'F':
                    setIsFullscreen(!isFullscreen);
                    break;
                case 'n':
                case 'N':
                    setShowNotes(!showNotes);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentCard, totalCards, isFullscreen, showNotes]);

    // Auto-play
    useEffect(() => {
        if (!isPaused && currentCard < totalCards - 1) {
            const timer = setTimeout(() => {
                goToCard(currentCard + 1);
            }, autoPlayInterval);
            return () => clearTimeout(timer);
        }
    }, [isPaused, currentCard, autoPlayInterval, totalCards]);

    const goToCard = useCallback((index: number) => {
        setCurrentCard(index);
        // Scroll to card smoothly
        const cardElements = cardsRef.current?.children;
        if (cardElements && cardElements[index]) {
            cardElements[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, []);

    // Fullscreen handling
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    // Export handlers
    const handleExportPptx = async () => {
        setIsExporting(true);
        setShowExportMenu(false);
        try {
            await downloadPptx(presentation);
        } catch (error) {
            console.error('PPTX export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPdf = () => {
        setShowExportMenu(false);
        exportToPdf(presentation);
    };

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex"
            style={{
                background: theme.colors.background,
                fontFamily: theme.typography.bodyFont,
                color: theme.colors.text,
            }}
        >
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="flex items-center justify-between px-4 py-3 border-b"
                    style={{
                        borderColor: `${theme.colors.text}15`,
                        background: `${theme.colors.surface}cc`,
                        backdropFilter: 'blur(12px)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg transition-colors hover:bg-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="font-semibold" style={{ fontFamily: theme.typography.headingFont }}>
                                {presentation.title}
                            </h1>
                            <p className="text-xs opacity-60">
                                {currentCard + 1} of {totalCards} cards
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Auto-play controls */}
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className="p-2 rounded-lg transition-colors hover:bg-white/10"
                            title={isPaused ? 'Start autoplay' : 'Pause autoplay'}
                        >
                            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </button>

                        {/* Speaker notes toggle */}
                        <button
                            onClick={() => setShowNotes(!showNotes)}
                            className={`p-2 rounded-lg transition-colors ${showNotes ? 'bg-white/20' : 'hover:bg-white/10'}`}
                            title="Toggle speaker notes (N)"
                        >
                            <FileText className="w-4 h-4" />
                        </button>

                        {/* Thumbnail sidebar toggle */}
                        <button
                            onClick={() => setShowThumbnails(!showThumbnails)}
                            className={`p-2 rounded-lg transition-colors ${showThumbnails ? 'bg-white/20' : 'hover:bg-white/10'}`}
                            title="Toggle thumbnails"
                        >
                            <Grid className="w-4 h-4" />
                        </button>

                        {/* Fullscreen */}
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 rounded-lg transition-colors hover:bg-white/10"
                            title="Toggle fullscreen (F)"
                        >
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>

                        {/* Export Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className={`p-2 rounded-lg transition-colors ${showExportMenu ? 'bg-white/20' : 'hover:bg-white/10'}`}
                                title="Export presentation"
                                disabled={isExporting}
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
                            </button>

                            <AnimatePresence>
                                {showExportMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden shadow-xl z-50"
                                        style={{
                                            background: theme.colors.surface,
                                            border: `1px solid ${theme.colors.text}20`
                                        }}
                                    >
                                        <button
                                            onClick={handleExportPptx}
                                            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/10 transition-colors"
                                        >
                                            <Presentation className="w-4 h-4" style={{ color: theme.colors.primary }} />
                                            <div>
                                                <div className="text-sm font-medium">PowerPoint</div>
                                                <div className="text-xs opacity-60">.pptx file</div>
                                            </div>
                                        </button>
                                        <button
                                            onClick={handleExportPdf}
                                            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/10 transition-colors border-t"
                                            style={{ borderColor: `${theme.colors.text}10` }}
                                        >
                                            <FileType className="w-4 h-4" style={{ color: theme.colors.accent }} />
                                            <div>
                                                <div className="text-sm font-medium">PDF</div>
                                                <div className="text-xs opacity-60">Print to PDF</div>
                                            </div>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Save button - only show when editing */}
                        {isEditing && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !hasChanges}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                style={{
                                    background: saveSuccess ? '#22c55e' : hasChanges ? theme.colors.accent : `${theme.colors.text}20`,
                                    color: saveSuccess || hasChanges ? '#fff' : theme.colors.text,
                                    opacity: (!hasChanges && !saveSuccess) ? 0.5 : 1
                                }}
                            >
                                {isSaving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                ) : saveSuccess ? (
                                    <><Check className="w-4 h-4" /> Saved!</>
                                ) : (
                                    <><Save className="w-4 h-4" /> Save</>
                                )}
                            </button>
                        )}

                        {/* Edit button */}
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                style={{
                                    background: theme.colors.primary,
                                    color: '#fff'
                                }}
                            >
                                Edit
                            </button>
                        )}
                    </div>

                </header>

                {/* Cards Container */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Main cards area with scroll snap */}
                    <div
                        ref={cardsRef}
                        className="flex-1 overflow-y-auto scroll-smooth"
                        style={{ scrollSnapType: 'y mandatory' }}
                    >
                        {localCards.map((card, index) => (
                            <CardView
                                key={card.id}
                                card={card}
                                theme={theme}
                                isActive={index === currentCard}
                                onInView={() => setCurrentCard(index)}
                                isEditing={isEditing}
                                onUpdateBlock={handleBlockUpdate}
                                onReorderBlock={handleReorderBlock}
                                presentationId={localPresentation.id}
                                userId={userId}
                            />
                        ))}
                    </div>

                    {/* Thumbnail sidebar */}
                    <AnimatePresence>
                        {showThumbnails && (
                            <motion.aside
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 200, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                className="border-l overflow-y-auto"
                                style={{ borderColor: `${theme.colors.text}15` }}
                            >
                                <div className="p-3 space-y-2">
                                    {localCards.map((card, index) => (
                                        <button
                                            key={card.id}
                                            onClick={() => goToCard(index)}
                                            className={`w-full p-2 rounded-lg text-left transition-all ${index === currentCard
                                                ? 'ring-2 ring-purple-500'
                                                : 'opacity-60 hover:opacity-100'
                                                }`}
                                            style={{
                                                background: theme.colors.surface
                                            }}
                                        >

                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium"
                                                    style={{ background: `${theme.colors.primary}20`, color: theme.colors.primary }}
                                                >
                                                    {index + 1}
                                                </span>
                                                <span className="text-xs truncate flex-1">
                                                    {card.title || `Card ${index + 1}`}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.aside>
                        )}
                    </AnimatePresence>
                </div>

                {/* Speaker Notes Panel */}
                <AnimatePresence>
                    {showNotes && localCards[currentCard]?.speakerNotes && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t overflow-hidden"
                            style={{ borderColor: `${theme.colors.text}15` }}
                        >
                            <div className="p-4 max-h-32 overflow-y-auto">
                                <h4 className="text-xs font-medium opacity-60 mb-2">Speaker Notes</h4>
                                <p className="text-sm opacity-80">{localCards[currentCard].speakerNotes}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Progress Bar */}
                <div className="h-1" style={{ background: `${theme.colors.text}10` }}>
                    <motion.div
                        className="h-full"
                        style={{ background: theme.colors.primary }}
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentCard + 1) / totalCards) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>
        </motion.div>
    );
}

