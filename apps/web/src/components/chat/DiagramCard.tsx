'use client';

import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import {
    GitBranch,
    Network,
    Workflow,
    PieChart,
    BarChart3,
    GitCommit,
    Layers,
    ChevronRight,
    Sparkles,
} from 'lucide-react';
import { DiagramCanvas } from './DiagramCanvas';

interface DiagramCardProps {
    code: string;
    brandColor?: string;
}

// Detect diagram type from Mermaid code
function detectDiagramType(code: string): {
    type: string;
    icon: React.ElementType;
    label: string;
} {
    const firstLine = code.trim().split('\n')[0].toLowerCase();

    if (firstLine.includes('graph') || firstLine.includes('flowchart')) {
        return { type: 'flowchart', icon: Workflow, label: 'Flowchart' };
    }
    if (firstLine.includes('sequencediagram')) {
        return { type: 'sequence', icon: GitCommit, label: 'Sequence Diagram' };
    }
    if (firstLine.includes('classdiagram')) {
        return { type: 'class', icon: Layers, label: 'Class Diagram' };
    }
    if (firstLine.includes('statediagram')) {
        return { type: 'state', icon: Network, label: 'State Diagram' };
    }
    if (firstLine.includes('erdiagram')) {
        return { type: 'er', icon: GitBranch, label: 'ER Diagram' };
    }
    if (firstLine.includes('pie')) {
        return { type: 'pie', icon: PieChart, label: 'Pie Chart' };
    }
    if (firstLine.includes('gantt')) {
        return { type: 'gantt', icon: BarChart3, label: 'Gantt Chart' };
    }
    if (firstLine.includes('journey')) {
        return { type: 'journey', icon: GitCommit, label: 'User Journey' };
    }
    if (firstLine.includes('gitgraph')) {
        return { type: 'git', icon: GitBranch, label: 'Git Graph' };
    }
    if (firstLine.includes('mindmap')) {
        return { type: 'mindmap', icon: Network, label: 'Mind Map' };
    }
    if (firstLine.includes('timeline')) {
        return { type: 'timeline', icon: GitCommit, label: 'Timeline' };
    }

    return { type: 'diagram', icon: Sparkles, label: 'Diagram' };
}

// Extract a meaningful title from the diagram content
function extractTitle(code: string): string | null {
    const lines = code.trim().split('\n');

    // Look for title directive
    for (const line of lines) {
        const titleMatch = line.match(/title\s+(.+)/i);
        if (titleMatch) return titleMatch[1].trim();
    }

    // Try to get first node label for flowcharts
    for (const line of lines) {
        // Match patterns like: A[Label], A["Label"], A{Label}
        // Simplified regex to avoid parser issues
        const nodeMatch = line.match(/\w+\s*[\[{(](["']?)(.*?)\1[\]})]/);
        if (nodeMatch && nodeMatch[2]) {
            const label = nodeMatch[2].trim();
            // Clean up HTML entities
            const cleanLabel = label
                .replace(/&#40;/g, '(')
                .replace(/&#41;/g, ')')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
            if (cleanLabel.length > 3 && cleanLabel.length < 80) {
                return cleanLabel;
            }
        }
    }

    return null;
}

export const DiagramCard = memo(function DiagramCard({ code, brandColor = '#DA7B4D' }: DiagramCardProps) {
    const [isCanvasOpen, setIsCanvasOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const { icon: DiagramIcon, label: diagramLabel } = detectDiagramType(code);
    const extractedTitle = extractTitle(code);

    // Build display text
    const displayText = extractedTitle
        ? `${diagramLabel}: ${extractedTitle}`
        : diagramLabel;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="my-3"
            >
                <motion.button
                    onClick={() => setIsCanvasOpen(true)}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="w-full group relative"
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                >
                    {/* Main card */}
                    <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200"
                        style={{
                            backgroundColor: isHovered ? `${brandColor}08` : 'transparent',
                            borderColor: isHovered ? `${brandColor}40` : '#e7e5e4',
                        }}
                    >
                        {/* Icon */}
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                            style={{
                                backgroundColor: `${brandColor}15`,
                            }}
                        >
                            <DiagramIcon
                                className="w-4 h-4 transition-colors duration-200"
                                style={{ color: brandColor }}
                            />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0 text-left">
                            <p
                                className="text-sm font-medium truncate transition-colors duration-200"
                                style={{ color: isHovered ? brandColor : '#44403c' }}
                            >
                                {displayText}
                            </p>
                            <p className="text-xs text-sand-400 mt-0.5">
                                Click to expand diagram
                            </p>
                        </div>

                        {/* Arrow */}
                        <motion.div
                            animate={{ x: isHovered ? 3 : 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="flex-shrink-0"
                        >
                            <ChevronRight
                                className="w-5 h-5 transition-colors duration-200"
                                style={{ color: isHovered ? brandColor : '#a8a29e' }}
                            />
                        </motion.div>
                    </div>

                    {/* Subtle gradient line on hover */}
                    <motion.div
                        className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                        style={{
                            background: `linear-gradient(90deg, ${brandColor}, ${brandColor}40)`,
                        }}
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{
                            scaleX: isHovered ? 1 : 0,
                            opacity: isHovered ? 1 : 0
                        }}
                        transition={{ duration: 0.2 }}
                    />
                </motion.button>
            </motion.div>

            {/* Canvas Modal */}
            <DiagramCanvas
                isOpen={isCanvasOpen}
                onClose={() => setIsCanvasOpen(false)}
                mermaidCode={code}
                title={extractedTitle || diagramLabel}
            />
        </>
    );
});

export default DiagramCard;
