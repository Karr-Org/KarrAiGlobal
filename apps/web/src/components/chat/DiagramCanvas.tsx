'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Download,
    Copy,
    Check,
    Sun,
    Moon,
    Maximize2,
    Minimize2,
    Move,
    FileImage,
    FileCode,
} from 'lucide-react';
import { fixMermaidCode } from '@/lib/mermaid-utils';
import { sanitizeHtml } from '@/lib/utils/sanitize';

interface DiagramCanvasProps {
    isOpen: boolean;
    onClose: () => void;
    mermaidCode: string;
    title?: string;
}

export function DiagramCanvas({ isOpen, onClose, mermaidCode, title }: DiagramCanvasProps) {
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Render Mermaid diagram
    useEffect(() => {
        if (!isOpen || !mermaidCode) return;

        const renderDiagram = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const mermaid = (await import('mermaid')).default;

                mermaid.initialize({
                    startOnLoad: false,
                    theme: isDarkMode ? 'dark' : 'base',
                    themeVariables: {
                        primaryColor: '#DA7B4D', // Terracotta
                        primaryTextColor: '#fff',
                        primaryBorderColor: '#C05621',
                        lineColor: isDarkMode ? '#A8A29E' : '#78716c',
                        secondaryColor: isDarkMode ? '#292524' : '#E7E5E4', // Sand-200
                        tertiaryColor: isDarkMode ? '#1c1917' : '#fff',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: '14px',
                    },
                    fontFamily: 'Inter, system-ui, sans-serif',
                    flowchart: {
                        useMaxWidth: false,
                        htmlLabels: true,
                        curve: 'basis',
                    },
                    securityLevel: 'loose',
                });

                const id = `canvas-mermaid-${Math.random().toString(36).substr(2, 9)}`;

                // Try rendering. If it fails, try fixing the code.
                try {
                    const { svg: renderedSvg } = await mermaid.render(id, mermaidCode.trim());
                    setSvg(renderedSvg);
                } catch (initialError) {
                    // Try to fix common syntax errors
                    const fixedCode = fixMermaidCode(mermaidCode.trim());
                    if (fixedCode !== mermaidCode.trim()) {
                        const { svg: fixedSvg } = await mermaid.render(id, fixedCode);
                        setSvg(fixedSvg);
                    } else {
                        throw initialError;
                    }
                }

                setIsLoading(false);
            } catch (err: any) {
                console.error('Mermaid rendering error:', err);
                setError(err.message || 'Failed to render diagram');
                setIsLoading(false);
            }
        };

        renderDiagram();
    }, [isOpen, mermaidCode, isDarkMode]);

    // Reset position and zoom when opening
    useEffect(() => {
        if (isOpen) {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen]);

    // Handle keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === '+' || e.key === '=') handleZoomIn();
            if (e.key === '-') handleZoomOut();
            if (e.key === '0') handleResetView();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Zoom handlers
    const handleZoomIn = useCallback(() => {
        setZoom((prev) => Math.min(prev + 0.25, 3));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom((prev) => Math.max(prev - 0.25, 0.25));
    }, []);

    const handleResetView = useCallback(() => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    // Mouse wheel zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((prev) => Math.max(0.25, Math.min(3, prev + delta)));
    }, []);

    // Pan handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }, [position]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Copy code to clipboard
    const handleCopyCode = async () => {
        await navigator.clipboard.writeText(mermaidCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Download as PNG
    const handleDownloadPNG = async () => {
        if (!svg) return;

        const svgElement = document.createElement('div');
        svgElement.innerHTML = svg;
        const svgNode = svgElement.querySelector('svg');
        if (!svgNode) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const svgData = new XMLSerializer().serializeToString(svgNode);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            canvas.width = img.width * 2;
            canvas.height = img.height * 2;
            ctx.scale(2, 2);
            ctx.fillStyle = isDarkMode ? '#1a1a1a' : '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);

            try {
                const pngUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `${title || 'diagram'}.png`;
                link.href = pngUrl;
                link.click();
            } catch (e) {
                console.error('Failed to export PNG (tainted canvas):', e);
                // Fallback to SVG download if PNG fails
                const link = document.createElement('a');
                link.download = `${title || 'diagram'}.svg`;
                link.href = url; // Use the blob url we already created (revoke it later or create new)
                // Actually url is revoked above, let's recreate or just accept this limitation
                // For now, simpler to just showing an error or calling handleDownloadSVG
                alert('Could not export as PNG due to browser security restrictions. Downloading as SVG instead.');

                const blob = new Blob([svg], { type: 'image/svg+xml' });
                const svgUrl = URL.createObjectURL(blob);
                link.href = svgUrl;
                link.click();
                URL.revokeObjectURL(svgUrl);
            }
        };

        img.crossOrigin = 'anonymous';
        img.src = url;
    };

    // Download as SVG
    const handleDownloadSVG = () => {
        if (!svg) return;

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${title || 'diagram'}.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Toggle fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                ref={containerRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className={`relative w-[95vw] h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'
                        }`}
                >
                    {/* Header */}
                    <div
                        className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-sand-200 bg-sand-50'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center">
                                <FileCode className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2
                                    className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-sand-900'
                                        }`}
                                >
                                    {title || 'Flowchart'}
                                </h2>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-sand-500'}`}>
                                    Interactive Diagram Canvas
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Zoom controls */}
                            <div
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-sand-100'
                                    }`}
                            >
                                <button
                                    onClick={handleZoomOut}
                                    className={`p-1.5 rounded-md hover:bg-opacity-50 transition-colors ${isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-sand-200 text-sand-600'
                                        }`}
                                    title="Zoom Out (-)"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span
                                    className={`text-sm font-medium min-w-[3rem] text-center ${isDarkMode ? 'text-gray-300' : 'text-sand-600'
                                        }`}
                                >
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button
                                    onClick={handleZoomIn}
                                    className={`p-1.5 rounded-md hover:bg-opacity-50 transition-colors ${isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-sand-200 text-sand-600'
                                        }`}
                                    title="Zoom In (+)"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={handleResetView}
                                className={`p-2 rounded-lg transition-colors ${isDarkMode
                                    ? 'hover:bg-gray-700 text-gray-300'
                                    : 'hover:bg-sand-100 text-sand-600'
                                    }`}
                                title="Reset View (0)"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>

                            <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-sand-200'}`} />

                            {/* Theme toggle */}
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className={`p-2 rounded-lg transition-colors ${isDarkMode
                                    ? 'hover:bg-gray-700 text-gray-300'
                                    : 'hover:bg-sand-100 text-sand-600'
                                    }`}
                                title="Toggle Theme"
                            >
                                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>

                            {/* Fullscreen */}
                            <button
                                onClick={toggleFullscreen}
                                className={`p-2 rounded-lg transition-colors ${isDarkMode
                                    ? 'hover:bg-gray-700 text-gray-300'
                                    : 'hover:bg-sand-100 text-sand-600'
                                    }`}
                                title="Toggle Fullscreen"
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="w-4 h-4" />
                                ) : (
                                    <Maximize2 className="w-4 h-4" />
                                )}
                            </button>

                            <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-sand-200'}`} />

                            {/* Download options */}
                            <button
                                onClick={handleDownloadPNG}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode
                                    ? 'hover:bg-gray-700 text-gray-300'
                                    : 'hover:bg-sand-100 text-sand-600'
                                    }`}
                                title="Download as PNG"
                            >
                                <FileImage className="w-4 h-4" />
                                <span className="hidden sm:inline">PNG</span>
                            </button>

                            <button
                                onClick={handleDownloadSVG}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode
                                    ? 'hover:bg-gray-700 text-gray-300'
                                    : 'hover:bg-sand-100 text-sand-600'
                                    }`}
                                title="Download as SVG"
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">SVG</span>
                            </button>

                            {/* Copy code */}
                            <button
                                onClick={handleCopyCode}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${copied
                                    ? 'bg-emerald-500/20 text-emerald-500'
                                    : isDarkMode
                                        ? 'hover:bg-gray-700 text-gray-300'
                                        : 'hover:bg-sand-100 text-sand-600'
                                    }`}
                                title="Copy Mermaid Code"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Code'}</span>
                            </button>

                            <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-sand-200'}`} />

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className={`p-2 rounded-lg transition-colors ${isDarkMode
                                    ? 'hover:bg-red-500/20 text-gray-300 hover:text-red-400'
                                    : 'hover:bg-red-50 text-sand-600 hover:text-red-500'
                                    }`}
                                title="Close (Esc)"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Canvas area */}
                    <div
                        ref={canvasRef}
                        className={`flex-1 overflow-hidden cursor-grab active:cursor-grabbing ${isDarkMode ? 'bg-gray-900' : 'bg-sand-50'
                            }`}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 border-3 border-terracotta-500 border-t-transparent rounded-full animate-spin" />
                                    <span className={isDarkMode ? 'text-gray-400' : 'text-sand-500'}>
                                        Rendering diagram...
                                    </span>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center p-8">
                                    <div className="text-red-500 mb-4">
                                        <X className="w-12 h-12 mx-auto" />
                                    </div>
                                    <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-sand-900'}`}>
                                        Failed to render diagram
                                    </h3>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-sand-500'}`}>
                                        {error}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="min-h-full min-w-full flex items-center justify-center p-8"
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                    transformOrigin: 'center center',
                                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                                }}
                            >
                                <div
                                    className={`p-8 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                                        }`}
                                >
                                    <style dangerouslySetInnerHTML={{
                                        __html: `
                                            .mermaid .node, .mermaid .actor, .mermaid .cluster {
                                                animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                                                opacity: 0;
                                                transform-origin: center;
                                                transform-box: fill-box;
                                            }
                                            @keyframes popIn {
                                                from { opacity: 0; transform: scale(0.9) translateY(10px); }
                                                to { opacity: 1; transform: scale(1) translateY(0); }
                                            }
                                            /* Stagger animations based on DOM order (approximate) */
                                            .mermaid g:nth-child(1) { animation-delay: 0.1s; }
                                            .mermaid g:nth-child(2) { animation-delay: 0.2s; }
                                            .mermaid g:nth-child(3) { animation-delay: 0.3s; }
                                            .mermaid g:nth-child(4) { animation-delay: 0.4s; }
                                            .mermaid g:nth-child(5) { animation-delay: 0.5s; }
                                            .mermaid g:nth-child(n+6) { animation-delay: 0.6s; }
                                            
                                            /* Edge animations */
                                            .mermaid .edgePath path {
                                                stroke-dasharray: 20;
                                                animation: flow 20s linear infinite;
                                            }
                                            @keyframes flow {
                                                to { stroke-dashoffset: -200; }
                                            }
                                        `}} />
                                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(svg) }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer hint */}
                    <div
                        className={`px-6 py-2 text-center text-xs border-t ${isDarkMode ? 'border-gray-700 bg-gray-800 text-gray-500' : 'border-sand-200 bg-sand-50 text-sand-400'
                            }`}
                    >
                        <Move className="w-3 h-3 inline mr-1" />
                        Drag to pan • Scroll to zoom • Press <kbd className="px-1 py-0.5 rounded bg-current/10">Esc</kbd> to close
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default DiagramCanvas;
