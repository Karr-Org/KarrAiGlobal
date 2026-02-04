'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    CheckCircle2,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Loader2,
    Globe,
    Database,
    Shield,
    Zap
} from 'lucide-react';

/**
 * 🧠 KARR AI - WORLD-CLASS THINKING INDICATOR
 * 
 * Inspired by Claude & ChatGPT's minimal, elegant design.
 * 
 * Philosophy:
 * - Minimal by default (single animated line)
 * - Expandable for power users
 * - Beautiful micro-animations
 * - Never steals focus from the answer
 */

export type ThinkingStage =
    | 'idle'
    | 'searching'
    | 'evaluating'
    | 'correcting'
    | 'generating'
    | 'complete';

export interface SourceHit {
    name: string;
    type: 'internal' | 'web' | 'api';
    trustLevel: number;
    matched: boolean;
}

export interface ThinkingState {
    stage: ThinkingStage;
    progress: number;
    message: string;
    details?: string;
    sourcesSearched?: SourceHit[];
    cragVerdict?: 'RELEVANT' | 'AMBIGUOUS' | 'IRRELEVANT' | 'NO_RESULTS';
    cragConfidence?: number;
    webFallbackUsed?: boolean;
}

interface ThinkingProcessProps {
    state: ThinkingState;
    brandColor?: string;
    compact?: boolean; // Kept for backward compatibility, but now always compact
}

// Animated typing dots component
function TypingDots({ color }: { color: string }) {
    return (
        <span className="inline-flex items-center gap-[3px] ml-1">
            {[0, 1, 2].map((i) => (
                <motion.span
                    key={i}
                    className="w-[5px] h-[5px] rounded-full"
                    style={{ backgroundColor: color }}
                    animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1, 0.8],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </span>
    );
}

// Stage icon with animation
function StageIcon({ stage, color, isActive }: { stage: ThinkingStage; color: string; isActive: boolean }) {
    const iconClass = "w-4 h-4";

    if (!isActive) {
        return <CheckCircle2 className={`${iconClass} text-emerald-500`} />;
    }

    const iconMap = {
        searching: Search,
        evaluating: Shield,
        correcting: Globe,
        generating: Sparkles,
        complete: CheckCircle2,
        idle: Loader2,
    };

    const Icon = iconMap[stage] || Loader2;

    return (
        <motion.div
            animate={{ rotate: stage === 'searching' ? 360 : 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
            <Icon className={iconClass} style={{ color }} />
        </motion.div>
    );
}

// Main message based on stage
function getStageMessage(stage: ThinkingStage): string {
    switch (stage) {
        case 'searching': return 'Searching knowledge';
        case 'evaluating': return 'Evaluating sources';
        case 'correcting': return 'Verifying information';
        case 'generating': return 'Generating response';
        case 'complete': return 'Complete';
        default: return 'Thinking';
    }
}

export function ThinkingProcess({ state, brandColor = '#DA7B4D' }: ThinkingProcessProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSourcesAnimation, setShowSourcesAnimation] = useState(false);

    // Trigger source animation when sources are updated
    useEffect(() => {
        if (state.sourcesSearched && state.sourcesSearched.length > 0) {
            setShowSourcesAnimation(true);
            const timer = setTimeout(() => setShowSourcesAnimation(false), 500);
            return () => clearTimeout(timer);
        }
    }, [state.sourcesSearched]);

    // Don't render if idle
    if (state.stage === 'idle') return null;

    const isComplete = state.stage === 'complete';
    const matchedSources = state.sourcesSearched?.filter(s => s.matched) || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative"
        >
            {/* Main Compact Indicator - Always Visible */}
            <motion.div
                className={`
                    flex items-center gap-3 py-2.5 px-4 rounded-2xl
                    transition-all duration-300 cursor-pointer
                    ${isComplete
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-gradient-to-r from-sand-50 to-sand-100 border border-sand-200 hover:border-sand-300'
                    }
                `}
                onClick={() => setIsExpanded(!isExpanded)}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
            >
                {/* Animated Icon */}
                <div
                    className={`
                        w-7 h-7 rounded-lg flex items-center justify-center
                        ${isComplete ? 'bg-emerald-100' : 'bg-white shadow-sm'}
                    `}
                >
                    {isComplete ? (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </motion.div>
                    ) : (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        >
                            <Loader2 className="w-4 h-4" style={{ color: brandColor }} />
                        </motion.div>
                    )}
                </div>

                {/* Message with Typing Animation */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={state.stage}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className={`text-sm font-medium ${isComplete ? 'text-emerald-700' : 'text-sand-700'}`}
                            >
                                {getStageMessage(state.stage)}
                            </motion.span>
                        </AnimatePresence>
                        {!isComplete && <TypingDots color={brandColor} />}
                    </div>

                    {/* Subtle source count - appears when sources are found */}
                    <AnimatePresence>
                        {matchedSources.length > 0 && !isComplete && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-xs text-sand-500 mt-0.5"
                            >
                                Found {matchedSources.length} relevant source{matchedSources.length !== 1 ? 's' : ''}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                {/* Expand/Collapse Button */}
                <motion.button
                    className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-sand-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-sand-400" />
                    )}
                </motion.button>
            </motion.div>

            {/* Expanded Details - Click to Show */}
            <AnimatePresence>
                {isExpanded && !isComplete && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 p-4 rounded-xl bg-white border border-sand-200 space-y-3">
                            {/* Progress Steps - Horizontal Compact */}
                            <div className="flex items-center gap-2">
                                {(['searching', 'evaluating', 'generating'] as ThinkingStage[]).map((stageId, i) => {
                                    const isPast = ['searching', 'evaluating', 'correcting', 'generating', 'complete'].indexOf(state.stage) > i;
                                    const isCurrent = state.stage === stageId ||
                                        (state.stage === 'correcting' && stageId === 'evaluating');

                                    return (
                                        <div key={stageId} className="flex items-center">
                                            <motion.div
                                                className={`
                                                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                                                    ${isPast ? 'bg-emerald-100 text-emerald-600' :
                                                        isCurrent ? 'border-2' : 'bg-sand-100 text-sand-400'}
                                                `}
                                                style={isCurrent ? { borderColor: brandColor, color: brandColor } : {}}
                                                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                                                transition={{ duration: 0.5, repeat: Infinity }}
                                            >
                                                {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                                            </motion.div>
                                            {i < 2 && (
                                                <div className="w-8 h-0.5 bg-sand-200 mx-1">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: brandColor }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: isPast ? '100%' : isCurrent ? '50%' : '0%' }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Sources Searched */}
                            {state.sourcesSearched && state.sourcesSearched.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {state.sourcesSearched.map((source, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className={`
                                                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
                                                ${source.matched
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-sand-100 text-sand-500'}
                                            `}
                                        >
                                            {source.type === 'internal' && <Database className="w-3 h-3" />}
                                            {source.type === 'web' && <Globe className="w-3 h-3" />}
                                            {source.name}
                                            {source.matched && <CheckCircle2 className="w-3 h-3" />}
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* CRAG Confidence */}
                            {state.cragConfidence !== undefined && (
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-xs text-sand-600">
                                        Confidence: {Math.round(state.cragConfidence * 100)}%
                                    </span>
                                    <div className="flex-1 h-1.5 bg-sand-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: brandColor }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${state.cragConfidence * 100}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Web Fallback Notice */}
                            {state.webFallbackUsed && (
                                <div className="flex items-center gap-2 text-xs text-blue-600">
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>Supplementing with web sources</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/**
 * Hook to manage thinking state with automatic progression
 */
export function useThinkingState() {
    const [state, setState] = useState<ThinkingState>({
        stage: 'idle',
        progress: 0,
        message: '',
    });

    const startThinking = (query: string) => {
        setState({
            stage: 'searching',
            progress: 10,
            message: 'Searching knowledge sources...',
            details: `Finding relevant information for: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`,
        });
    };

    const updateSearching = (sources: SourceHit[]) => {
        setState(prev => ({
            ...prev,
            stage: 'searching',
            progress: 30,
            message: `Found ${sources.filter(s => s.matched).length} matching sources`,
            sourcesSearched: sources,
        }));
    };

    const startEvaluating = (numResults: number) => {
        setState(prev => ({
            ...prev,
            stage: 'evaluating',
            progress: 50,
            message: 'Evaluating result quality...',
            details: `Scoring ${numResults} results for relevance and authority`,
        }));
    };

    const updateCRAGVerdict = (verdict: ThinkingState['cragVerdict'], confidence: number) => {
        setState(prev => ({
            ...prev,
            cragVerdict: verdict,
            cragConfidence: confidence,
            progress: 65,
            details: verdict === 'RELEVANT'
                ? 'High-quality sources found'
                : verdict === 'AMBIGUOUS'
                    ? 'Supplementing with additional sources...'
                    : 'Limited information available',
        }));
    };

    const startCorrecting = () => {
        setState(prev => ({
            ...prev,
            stage: 'correcting',
            progress: 75,
            message: 'Verifying with external sources...',
            details: 'Cross-referencing with trusted web sources',
            webFallbackUsed: true,
        }));
    };

    const startGenerating = () => {
        setState(prev => ({
            ...prev,
            stage: 'generating',
            progress: 85,
            message: 'Composing response...',
            details: 'Synthesizing information into a clear answer',
        }));
    };

    const complete = () => {
        setState(prev => ({
            ...prev,
            stage: 'complete',
            progress: 100,
            message: 'Complete',
        }));
    };

    const reset = () => {
        setState({
            stage: 'idle',
            progress: 0,
            message: '',
        });
    };

    return {
        state,
        startThinking,
        updateSearching,
        startEvaluating,
        updateCRAGVerdict,
        startCorrecting,
        startGenerating,
        complete,
        reset,
        setState,
    };
}

export default ThinkingProcess;
