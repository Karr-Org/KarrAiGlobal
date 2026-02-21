'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

/**
 * 🧠 KARR AI - MODE-AWARE THINKING INDICATOR
 * 
 * Clean, honest loading states based on the active chat mode.
 * No fake sources, no simulated CRAG, no fabricated confidence scores.
 * 
 * Stages cycle on fixed timers per mode, with a composing phase
 * that transitions to random fallback messages if the response takes long.
 */

// ============================================================================
// TYPES
// ============================================================================

export type ChatMode = 'strict' | 'extended' | 'web' | 'full_power';

export interface ThinkingState {
    active: boolean;
    message: string;
    complete: boolean;
}

interface ThinkingProcessProps {
    state: ThinkingState;
    brandColor?: string;
}

// ============================================================================
// STAGE DEFINITIONS PER MODE
// ============================================================================

interface Stage {
    message: string;
    /** Duration in ms. If 0 = composing phase (special handling) */
    duration: number;
}

const MODE_STAGES: Record<ChatMode, Stage[]> = {
    strict: [
        { message: 'Searching knowledge base...', duration: 1000 },
        { message: 'Composing response...', duration: 0 }, // composing phase
    ],
    extended: [
        { message: 'Searching knowledge base...', duration: 1000 },
        { message: 'Connecting related concepts...', duration: 1000 },
        { message: 'Composing response...', duration: 0 },
    ],
    web: [
        { message: 'Searching the web...', duration: 1500 },
        { message: 'Verifying sources...', duration: 1800 },
        { message: 'Composing response...', duration: 0 },
    ],
    full_power: [
        { message: 'Searching knowledge base...', duration: 1000 },
        { message: 'Searching the web...', duration: 1500 },
        { message: 'Analyzing relevant information...', duration: 1000 },
        { message: 'Composing response...', duration: 0 },
    ],
};

const FALLBACK_MESSAGES = [
    'Synthesizing insights...',
    'Structuring a clear answer...',
    'Refining the response...',
    'Cross-checking details...',
    'Organizing key points...',
    'Optimizing clarity and accuracy...',
    'Finalizing the response...',
    'Reviewing for completeness...',
    'Preparing the final answer...',
];

// ============================================================================
// TYPING DOTS
// ============================================================================

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

// ============================================================================
// THINKING PROCESS COMPONENT
// ============================================================================

export function ThinkingProcess({ state, brandColor = '#DA7B4D' }: ThinkingProcessProps) {
    if (!state.active && !state.complete) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
        >
            <motion.div
                className={`
                    flex items-center gap-3 py-2.5 px-4 rounded-2xl
                    transition-all duration-300
                    ${state.complete
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-gradient-to-r from-sand-50 to-sand-100 border border-sand-200'
                    }
                `}
            >
                {/* Animated Icon */}
                <div
                    className={`
                        w-7 h-7 rounded-lg flex items-center justify-center
                        ${state.complete ? 'bg-emerald-100' : 'bg-white shadow-sm'}
                    `}
                >
                    {state.complete ? (
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
                                key={state.message}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className={`text-sm font-medium ${state.complete ? 'text-emerald-700' : 'text-sand-700'}`}
                            >
                                {state.message}
                            </motion.span>
                        </AnimatePresence>
                        {!state.complete && <TypingDots color={brandColor} />}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ============================================================================
// HOOK: useThinkingState
// ============================================================================

export function useThinkingState() {
    const [state, setState] = useState<ThinkingState>({
        active: false,
        message: '',
        complete: false,
    });

    // Track whether response has arrived
    const responseReady = useRef(false);
    // Track timers for cleanup
    const timersRef = useRef<NodeJS.Timeout[]>([]);
    // Track the composing interval
    const composingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    // Track used fallback messages to avoid repeats
    const usedFallbacksRef = useRef<Set<number>>(new Set());

    const clearAllTimers = useCallback(() => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
        if (composingIntervalRef.current) {
            clearInterval(composingIntervalRef.current);
            composingIntervalRef.current = null;
        }
        if (pendingCompleteTimerRef.current) {
            clearTimeout(pendingCompleteTimerRef.current);
            pendingCompleteTimerRef.current = null;
        }
    }, []);

    /**
     * Pick a random fallback message that hasn't been used yet.
     * Resets the pool if all have been used.
     */
    const pickFallback = useCallback((): string => {
        if (usedFallbacksRef.current.size >= FALLBACK_MESSAGES.length) {
            usedFallbacksRef.current.clear();
        }
        let idx: number;
        do {
            idx = Math.floor(Math.random() * FALLBACK_MESSAGES.length);
        } while (usedFallbacksRef.current.has(idx));
        usedFallbacksRef.current.add(idx);
        return FALLBACK_MESSAGES[idx];
    }, []);

    const composingStartTimeRef = useRef<number>(0);
    const pendingCompleteTimerRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Start the composing phase:
     * - "Composing response..." for 3s max before fallbacks
     * - Becomes preemptible after 2s (handled in complete())
     * - Cycles fallback messages every 4.5s
     */
    const startComposingPhase = useCallback(() => {
        setState(prev => ({ ...prev, message: 'Composing response...' }));
        composingStartTimeRef.current = Date.now();

        // After 3s of "Composing response...", start fallback cycling
        const fallbackTimer = setTimeout(() => {
            if (responseReady.current) return;

            // Start cycling fallback messages every 4.5s
            setState(prev => ({ ...prev, message: pickFallback() }));

            composingIntervalRef.current = setInterval(() => {
                if (responseReady.current) return;
                setState(prev => ({ ...prev, message: pickFallback() }));
            }, 4500);
        }, 3000);

        timersRef.current.push(fallbackTimer);
    }, [pickFallback]);

    /**
     * Start the thinking process for a given mode.
     * Schedules all fixed-duration stages, then enters composing phase.
     */
    const startThinking = useCallback((mode: ChatMode) => {
        // Reset state
        clearAllTimers();
        responseReady.current = false;
        usedFallbacksRef.current.clear();
        composingStartTimeRef.current = 0;

        const stages = MODE_STAGES[mode];
        if (!stages || stages.length === 0) return;

        // Show first stage immediately
        setState({
            active: true,
            message: stages[0].message,
            complete: false,
        });

        // Schedule remaining stages
        let accumulatedDelay = 0;

        for (let i = 0; i < stages.length; i++) {
            if (i === 0) {
                // Already shown
                accumulatedDelay += stages[i].duration;
                continue;
            }

            const stage = stages[i];

            if (stage.duration === 0) {
                // This is the composing phase — schedule it and enter special handling
                const timer = setTimeout(() => {
                    startComposingPhase();
                }, accumulatedDelay);
                timersRef.current.push(timer);
                break;
            }

            // Fixed-duration stage
            const timer = setTimeout(() => {
                setState(prev => ({ ...prev, message: stage.message }));
            }, accumulatedDelay);
            timersRef.current.push(timer);

            accumulatedDelay += stage.duration;
        }
    }, [clearAllTimers, startComposingPhase]);

    /**
     * Signal that the response has arrived.
     * If we're past the 1s composing minimum, show immediately.
     * Otherwise, wait until 1s is up, then complete.
     */
    const responseReceived = useCallback(() => {
        responseReady.current = true;
    }, []);

    /**
     * Show the "Complete" state and stop all timers.
     */
    const complete = useCallback(() => {
        const now = Date.now();
        const elapsed = now - composingStartTimeRef.current;

        // Ensure "Composing response..." shows for at least 2s before becoming preemptible
        if (composingStartTimeRef.current > 0 && elapsed < 2000) {
            const remaining = 2000 - elapsed;
            if (pendingCompleteTimerRef.current) clearTimeout(pendingCompleteTimerRef.current);
            pendingCompleteTimerRef.current = setTimeout(() => {
                clearAllTimers();
                setState({
                    active: true,
                    message: 'Complete',
                    complete: true,
                });
            }, remaining);
            return;
        }

        clearAllTimers();
        setState({
            active: true,
            message: 'Complete',
            complete: true,
        });
    }, [clearAllTimers]);

    /**
     * Reset to idle.
     */
    const reset = useCallback(() => {
        clearAllTimers();
        responseReady.current = false;
        usedFallbacksRef.current.clear();
        composingStartTimeRef.current = 0;
        setState({
            active: false,
            message: '',
            complete: false,
        });
    }, [clearAllTimers]);

    // Cleanup on unmount
    useEffect(() => {
        return () => clearAllTimers();
    }, [clearAllTimers]);

    return {
        state,
        startThinking,
        responseReceived,
        complete,
        reset,
    };
}

export default ThinkingProcess;
