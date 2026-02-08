'use client';

/**
 * 🎨 Gamma Slide Renderer
 * Renders slides using Gamma-style templates with proper CSS
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GammaTheme, GAMMA_THEMES, generateGammaBaseCSS } from '@/lib/gamma/gamma-styles';

interface GammaSlideProps {
    html: string;
    theme?: GammaTheme;
    themeName?: string;
    className?: string;
}

// Inject Gamma CSS into the page
function useGammaStyles(theme: GammaTheme) {
    React.useEffect(() => {
        const styleId = 'gamma-presentation-styles';
        let styleElement = document.getElementById(styleId) as HTMLStyleElement;

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = generateGammaBaseCSS(theme);

        return () => {
            // Don't remove - other slides may need it
        };
    }, [theme]);
}

/**
 * Renders a single Gamma-styled slide from HTML
 */
export function GammaSlide({ html, theme, themeName, className = '' }: GammaSlideProps) {
    const resolvedTheme = theme || GAMMA_THEMES[themeName || 'gamma'] || GAMMA_THEMES.gamma;

    useGammaStyles(resolvedTheme);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className={`gamma-slide-wrapper ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

/**
 * Full-screen Gamma slide presentation viewer
 */
interface GammaPresentationViewerProps {
    slides: Array<{
        id: string;
        gammaHtml?: string;
        templateId?: string;
        templateName?: string;
    }>;
    currentSlide: number;
    themeName?: string;
    onSlideChange?: (index: number) => void;
}

export function GammaPresentationViewer({
    slides,
    currentSlide,
    themeName = 'gamma',
    onSlideChange
}: GammaPresentationViewerProps) {
    const theme = GAMMA_THEMES[themeName] || GAMMA_THEMES.gamma;
    const currentSlideData = slides[currentSlide];

    useGammaStyles(theme);

    if (!currentSlideData?.gammaHtml) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded-xl">
                <p className="text-gray-500">No Gamma template available for this slide</p>
            </div>
        );
    }

    return (
        <div className="gamma-viewer relative w-full h-full">
            <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="gamma-slide-container w-full h-full"
                dangerouslySetInnerHTML={{ __html: currentSlideData.gammaHtml }}
            />

            {/* Template info badge */}
            {currentSlideData.templateName && (
                <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 rounded-full text-white text-xs font-medium backdrop-blur-sm">
                    {currentSlideData.templateName}
                </div>
            )}
        </div>
    );
}

/**
 * Slide thumbnail using Gamma template
 */
interface GammaThumbnailProps {
    html: string;
    isActive?: boolean;
    onClick?: () => void;
    index: number;
}

export function GammaThumbnail({ html, isActive, onClick, index }: GammaThumbnailProps) {
    return (
        <button
            onClick={onClick}
            className={`
                relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all
                ${isActive
                    ? 'border-indigo-500 shadow-lg shadow-indigo-100'
                    : 'border-gray-200 hover:border-gray-300'
                }
            `}
        >
            <div
                className="gamma-thumbnail-content absolute inset-0 scale-[0.2] origin-top-left"
                style={{ width: '500%', height: '500%' }}
                dangerouslySetInnerHTML={{ __html: html }}
            />
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-black/60 rounded text-white text-[10px] flex items-center justify-center font-medium">
                {index + 1}
            </div>
        </button>
    );
}

export default GammaSlide;
