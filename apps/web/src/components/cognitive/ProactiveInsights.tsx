'use client';

/**
 * 💡 PROACTIVE INSIGHTS WIDGET
 * 
 * A beautiful, floating widget that displays intelligent suggestions,
 * reminders, and contextual insights to the user.
 * 
 * Features:
 * - Animated entrance
 * - Glassmorphic design
 * - Dismissible cards
 * - Action buttons
 * - Smart positioning
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lightbulb,
    Target,
    User,
    Clock,
    Bell,
    X,
    ChevronRight,
    Sparkles,
    CheckCircle2
} from 'lucide-react';

interface Insight {
    id: string;
    type: 'insight' | 'reminder' | 'goal' | 'entity' | 'tip' | 'warning';
    title: string;
    content: string;
    relevance: 'high' | 'medium' | 'low';
    actionable: boolean;
    relatedTo?: string;
}

interface ProactiveInsightsProps {
    productUserId: string;
    productId: string;
    onInsightClick?: (insight: Insight) => void;
    onInsightDismiss?: (insightId: string) => void;
    position?: 'top-right' | 'bottom-right' | 'bottom-left';
    maxVisible?: number;
}

const typeIcons = {
    insight: Lightbulb,
    reminder: Bell,
    goal: Target,
    entity: User,
    tip: Sparkles,
    warning: Clock,
};

const typeColors = {
    insight: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    reminder: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
    goal: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    entity: 'from-purple-500/20 to-violet-500/20 border-purple-500/30',
    tip: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
    warning: 'from-red-500/20 to-orange-500/20 border-red-500/30',
};

const iconColors = {
    insight: 'text-amber-500',
    reminder: 'text-blue-500',
    goal: 'text-green-500',
    entity: 'text-purple-500',
    tip: 'text-pink-500',
    warning: 'text-red-500',
};

export function ProactiveInsights({
    productUserId,
    productId,
    onInsightClick,
    onInsightDismiss,
    position = 'bottom-right',
    maxVisible = 3,
}: ProactiveInsightsProps) {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    // Fetch insights on mount
    useEffect(() => {
        fetchInsights();
    }, [productUserId, productId]);

    const fetchInsights = async () => {
        try {
            const response = await fetch(
                `/api/cognitive/insights?productUserId=${productUserId}&productId=${productId}`
            );
            if (response.ok) {
                const data = await response.json();
                setInsights(data.insights || []);
            }
        } catch (error) {
            console.error('Error fetching insights:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDismiss = (insightId: string) => {
        setDismissedIds(prev => new Set([...prev, insightId]));
        onInsightDismiss?.(insightId);

        // API call to mark as dismissed
        fetch('/api/cognitive/insights/dismiss', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ insightId }),
        });
    };

    const handleAction = (insight: Insight) => {
        onInsightClick?.(insight);
        handleDismiss(insight.id);
    };

    const visibleInsights = insights
        .filter(i => !dismissedIds.has(i.id))
        .slice(0, isExpanded ? insights.length : maxVisible);

    if (isLoading || visibleInsights.length === 0) return null;

    const positionClasses = {
        'top-right': 'top-4 right-4',
        'bottom-right': 'bottom-24 right-4',
        'bottom-left': 'bottom-24 left-4',
    };

    return (
        <div className={`fixed ${positionClasses[position]} z-40 max-w-sm w-full`}>
            <AnimatePresence mode="popLayout">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-2 px-1"
                >
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <motion.div
                                className="absolute inset-0 bg-amber-500/30 rounded-full blur-md"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                        <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
                            {visibleInsights.length} insight{visibleInsights.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    {insights.length > maxVisible && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                        >
                            {isExpanded ? 'Show less' : `Show all (${insights.length})`}
                        </button>
                    )}
                </motion.div>

                {/* Insight Cards */}
                <div className="space-y-2">
                    {visibleInsights.map((insight, index) => {
                        const Icon = typeIcons[insight.type] || Lightbulb;

                        return (
                            <motion.div
                                key={insight.id}
                                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                                animate={{
                                    opacity: 1,
                                    x: 0,
                                    scale: 1,
                                    transition: { delay: index * 0.1 }
                                }}
                                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                                layout
                                className={`
                                    relative overflow-hidden rounded-xl border backdrop-blur-xl
                                    bg-gradient-to-br ${typeColors[insight.type]}
                                    shadow-lg shadow-black/5
                                    dark:shadow-black/20
                                `}
                            >
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

                                <div className="relative p-3">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg bg-white/50 dark:bg-black/20 ${iconColors[insight.type]}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                                                    {insight.type}
                                                </span>
                                                {insight.relevance === 'high' && (
                                                    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                        Important
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDismiss(insight.id)}
                                            className="p-1 rounded-lg hover:bg-white/30 dark:hover:bg-black/20 transition-colors"
                                        >
                                            <X className="w-4 h-4 text-stone-400" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <h4 className="font-semibold text-stone-800 dark:text-stone-100 text-sm mb-1">
                                        {insight.title}
                                    </h4>
                                    <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2">
                                        {insight.content}
                                    </p>

                                    {/* Action Button */}
                                    {insight.actionable && (
                                        <button
                                            onClick={() => handleAction(insight)}
                                            className="mt-3 flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Take action
                                            <ChevronRight className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// 🌟 WELCOME MESSAGE COMPONENT
// ============================================================================

interface WelcomeMessageProps {
    greeting: string;
    quickActions?: string[];
    onQuickAction?: (action: string) => void;
    userName?: string;
}

export function WelcomeMessage({
    greeting,
    quickActions = [],
    onQuickAction,
    userName,
}: WelcomeMessageProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 px-4"
        >
            {/* Animated Logo/Icon */}
            <motion.div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 mb-6 shadow-lg shadow-amber-500/10"
                animate={{
                    scale: [1, 1.02, 1],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
                <Sparkles className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </motion.div>

            {/* Personalized Greeting */}
            <h2 className="text-2xl font-semibold text-stone-800 dark:text-stone-100 mb-2">
                {userName ? `Hi, ${userName}!` : 'Welcome!'}
            </h2>

            {/* Time-based greeting */}
            <p className="text-stone-500 dark:text-stone-400 mb-8">
                {greeting}
            </p>

            {/* Elegant divider */}
            <div className="flex items-center justify-center gap-3 mb-8">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-stone-200 dark:to-stone-700" />
                <span className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                    Quick actions
                </span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-stone-200 dark:to-stone-700" />
            </div>

            {/* Quick Actions - Premium styled */}
            {quickActions.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                    {quickActions.map((action, index) => (
                        <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                transition: { delay: 0.3 + index * 0.1 }
                            }}
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onQuickAction?.(action)}
                            className="
                                px-5 py-2.5 rounded-xl text-sm font-medium
                                bg-white dark:bg-stone-800
                                border border-stone-200 dark:border-stone-700
                                text-stone-700 dark:text-stone-300
                                hover:border-amber-400 dark:hover:border-amber-600
                                hover:shadow-md hover:shadow-amber-500/10
                                transition-all duration-200
                            "
                        >
                            {action}
                        </motion.button>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// ============================================================================
// 🎯 EXPERTISE INDICATOR COMPONENT
// ============================================================================

interface ExpertiseIndicatorProps {
    topic: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    showLabel?: boolean;
}

export function ExpertiseIndicator({ topic, level, showLabel = true }: ExpertiseIndicatorProps) {
    const levels = {
        beginner: { color: 'bg-blue-500', width: '25%', label: 'Beginner' },
        intermediate: { color: 'bg-green-500', width: '50%', label: 'Intermediate' },
        advanced: { color: 'bg-amber-500', width: '75%', label: 'Advanced' },
        expert: { color: 'bg-purple-500', width: '100%', label: 'Expert' },
    };

    const config = levels[level];

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: config.width }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full ${config.color} rounded-full`}
                />
            </div>
            {showLabel && (
                <span className="text-xs text-stone-500 dark:text-stone-400 min-w-[80px]">
                    {config.label}
                </span>
            )}
        </div>
    );
}

// ============================================================================
// 😊 EMOTIONAL STATE INDICATOR
// ============================================================================

interface EmotionalIndicatorProps {
    mood: 'positive' | 'neutral' | 'frustrated' | 'confused' | 'urgent';
    confidence: number;
}

export function EmotionalIndicator({ mood, confidence }: EmotionalIndicatorProps) {
    const moodConfig = {
        positive: { emoji: '😊', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
        neutral: { emoji: '😐', color: 'text-stone-500', bg: 'bg-stone-100 dark:bg-stone-800' },
        frustrated: { emoji: '😤', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
        confused: { emoji: '😕', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
        urgent: { emoji: '⚡', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    };

    const config = moodConfig[mood];

    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${config.bg}`}>
            <span className="text-lg">{config.emoji}</span>
            <span className={`text-xs font-medium ${config.color} capitalize`}>{mood}</span>
            {confidence > 0.7 && (
                <span className="text-[10px] text-stone-400">({Math.round(confidence * 100)}%)</span>
            )}
        </div>
    );
}

export default ProactiveInsights;
