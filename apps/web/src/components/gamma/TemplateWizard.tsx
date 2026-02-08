'use client';

/**
 * 🧙‍♂️ Template Selection Wizard
 * Guided wizard to help users pick the perfect template for their presentation
 * Step by step selection: Purpose → Style → Theme → Templates
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ArrowRight, Check, Sparkles, Briefcase, GraduationCap,
    TrendingUp, Megaphone, Users, FileText, Presentation, Target,
    Palette, Layout, X, RefreshCw, Wand2
} from 'lucide-react';

// ==========================================
// WIZARD CONFIGURATION
// ==========================================

// Presentation purposes
const PRESENTATION_PURPOSES = [
    {
        id: 'pitch',
        label: 'Startup Pitch',
        description: 'Raise funding or pitch your idea',
        icon: TrendingUp,
        color: '#6366f1',
        templates: ['pitch-problem', 'pitch-solution', 'pitch-tam-sam-som', 'pitch-business-model', 'pitch-traction', 'pitch-funding-ask', 'pitch-team']
    },
    {
        id: 'sales',
        label: 'Sales Deck',
        description: 'Close deals and win customers',
        icon: Target,
        color: '#10b981',
        templates: ['sales-hook', 'sales-pain-points', 'sales-roi-calculator', 'sales-case-study-mini', 'sales-next-steps', 'sales-closing']
    },
    {
        id: 'marketing',
        label: 'Marketing Campaign',
        description: 'Social media, brand, or events',
        icon: Megaphone,
        color: '#f59e0b',
        templates: ['social-campaign-overview', 'social-audience-personas', 'social-platform-strategy', 'social-kpis']
    },
    {
        id: 'training',
        label: 'Training / Education',
        description: 'Teach and onboard',
        icon: GraduationCap,
        color: '#8b5cf6',
        templates: ['training-welcome', 'training-agenda', 'training-objectives', 'training-concept', 'training-step-by-step', 'training-key-takeaways']
    },
    {
        id: 'investor',
        label: 'Investor Update',
        description: 'Quarterly reports and updates',
        icon: Briefcase,
        color: '#0ea5e9',
        templates: ['investor-quarterly-cover', 'investor-key-metrics', 'investor-revenue-breakdown', 'investor-product-updates', 'investor-guidance']
    },
    {
        id: 'annual',
        label: 'Annual Report',
        description: 'Year-end company review',
        icon: FileText,
        color: '#64748b',
        templates: ['annual-cover', 'annual-ceo-letter', 'annual-year-highlights', 'annual-financials', 'annual-milestones', 'annual-next-year-outlook']
    },
    {
        id: 'project',
        label: 'Project Update',
        description: 'Status reports and progress',
        icon: Layout,
        color: '#14b8a6',
        templates: ['project-status-overview', 'project-milestones', 'project-blockers', 'project-next-steps']
    },
    {
        id: 'general',
        label: 'General Presentation',
        description: 'Custom or other purpose',
        icon: Presentation,
        color: '#ec4899',
        templates: []
    }
];

// Presentation styles
const PRESENTATION_STYLES = [
    {
        id: 'professional',
        label: 'Professional',
        description: 'Clean and corporate',
        preview: { bg: '#f8fafc', accent: '#1e40af', text: '#1e293b' }
    },
    {
        id: 'modern',
        label: 'Modern',
        description: 'Bold and contemporary',
        preview: { bg: '#0f172a', accent: '#818cf8', text: '#f1f5f9' }
    },
    {
        id: 'minimal',
        label: 'Minimal',
        description: 'Simple and elegant',
        preview: { bg: '#ffffff', accent: '#6366f1', text: '#334155' }
    },
    {
        id: 'vibrant',
        label: 'Vibrant',
        description: 'Colorful and energetic',
        preview: { bg: '#fef3c7', accent: '#ea580c', text: '#422006' }
    }
];

// Theme options
const THEME_OPTIONS = [
    { id: 'gamma', name: 'Gamma Purple', primary: '#403CCF', bg: '#FFFFFF', emoji: '💜' },
    { id: 'corporate', name: 'Corporate Blue', primary: '#1e40af', bg: '#FFFFFF', emoji: '💙' },
    { id: 'modern', name: 'Modern Teal', primary: '#0d9488', bg: '#FFFFFF', emoji: '🩵' },
    { id: 'warm', name: 'Warm Orange', primary: '#ea580c', bg: '#fffbeb', emoji: '🧡' },
    { id: 'dark', name: 'Dark Mode', primary: '#a78bfa', bg: '#0f172a', emoji: '🌙' },
    { id: 'elegant', name: 'Elegant Rose', primary: '#be185d', bg: '#fff1f2', emoji: '🩷' }
];

// Slide count options
const SLIDE_COUNTS = [
    { id: 'short', label: '5-7 slides', count: 6, description: 'Quick overview' },
    { id: 'medium', label: '8-12 slides', count: 10, description: 'Standard presentation' },
    { id: 'long', label: '15-20 slides', count: 17, description: 'Comprehensive deck' }
];

// ==========================================
// WIZARD STATE INTERFACE
// ==========================================

interface WizardState {
    purpose: string | null;
    style: string | null;
    theme: string | null;
    slideCount: string | null;
    selectedTemplates: string[];
}

interface WizardProps {
    onComplete: (state: WizardState) => void;
    onCancel?: () => void;
    initialState?: Partial<WizardState>;
}

// ==========================================
// STEP COMPONENTS
// ==========================================

// Step 1: Purpose Selection
function PurposeStep({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your presentation for?</h2>
                <p className="text-gray-500">We'll suggest the best templates for your goal</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PRESENTATION_PURPOSES.map((purpose) => {
                    const Icon = purpose.icon;
                    const isSelected = selected === purpose.id;

                    return (
                        <motion.button
                            key={purpose.id}
                            onClick={() => onSelect(purpose.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative p-6 rounded-xl border-2 text-left transition-all ${isSelected
                                    ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                }`}
                        >
                            <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                                style={{ backgroundColor: `${purpose.color}15` }}
                            >
                                <Icon className="w-6 h-6" style={{ color: purpose.color }} />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">{purpose.label}</h3>
                            <p className="text-sm text-gray-500">{purpose.description}</p>

                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
                                >
                                    <Check className="w-4 h-4 text-white" />
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

// Step 2: Style Selection
function StyleStep({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose your style</h2>
                <p className="text-gray-500">Set the overall look and feel</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PRESENTATION_STYLES.map((style) => {
                    const isSelected = selected === style.id;

                    return (
                        <motion.button
                            key={style.id}
                            onClick={() => onSelect(style.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                    ? 'border-indigo-500 shadow-lg'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                }`}
                        >
                            {/* Style Preview */}
                            <div
                                className="w-full aspect-video rounded-lg mb-4 p-3 flex flex-col"
                                style={{ backgroundColor: style.preview.bg }}
                            >
                                <div
                                    className="h-3 w-1/2 rounded mb-2"
                                    style={{ backgroundColor: style.preview.accent }}
                                />
                                <div
                                    className="h-2 w-3/4 rounded mb-1"
                                    style={{ backgroundColor: `${style.preview.text}30` }}
                                />
                                <div
                                    className="h-2 w-1/2 rounded"
                                    style={{ backgroundColor: `${style.preview.text}20` }}
                                />
                            </div>

                            <h3 className="font-semibold text-gray-900">{style.label}</h3>
                            <p className="text-sm text-gray-500">{style.description}</p>

                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
                                >
                                    <Check className="w-4 h-4 text-white" />
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

// Step 3: Theme Selection
function ThemeStep({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pick your color theme</h2>
                <p className="text-gray-500">Choose the primary accent color</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {THEME_OPTIONS.map((theme) => {
                    const isSelected = selected === theme.id;

                    return (
                        <motion.button
                            key={theme.id}
                            onClick={() => onSelect(theme.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                    ? 'border-indigo-500 shadow-lg'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                }`}
                            style={{ backgroundColor: theme.bg }}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-10 h-10 rounded-full shadow-inner flex items-center justify-center text-lg"
                                    style={{ backgroundColor: theme.primary }}
                                >
                                    {theme.emoji}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{theme.name}</h3>
                                    <p className="text-xs text-gray-500">{theme.primary}</p>
                                </div>
                            </div>

                            {/* Theme preview */}
                            <div
                                className="w-full h-2 rounded-full"
                                style={{
                                    background: `linear-gradient(90deg, ${theme.primary} 0%, ${theme.primary}66 100%)`
                                }}
                            />

                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
                                >
                                    <Check className="w-4 h-4 text-white" />
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

// Step 4: Slide Count
function SlideCountStep({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">How long should it be?</h2>
                <p className="text-gray-500">Choose the number of slides</p>
            </div>

            <div className="flex gap-4 justify-center max-w-lg mx-auto">
                {SLIDE_COUNTS.map((option) => {
                    const isSelected = selected === option.id;

                    return (
                        <motion.button
                            key={option.id}
                            onClick={() => onSelect(option.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative flex-1 p-6 rounded-xl border-2 text-center transition-all ${isSelected
                                    ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                }`}
                        >
                            <div className="text-3xl font-bold text-indigo-600 mb-2">{option.count}</div>
                            <h3 className="font-semibold text-gray-900 mb-1">{option.label}</h3>
                            <p className="text-sm text-gray-500">{option.description}</p>

                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
                                >
                                    <Check className="w-4 h-4 text-white" />
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

// Step 5: Summary & Confirmation
function SummaryStep({ state, theme }: { state: WizardState; theme: typeof THEME_OPTIONS[0] }) {
    const purpose = PRESENTATION_PURPOSES.find(p => p.id === state.purpose);
    const style = PRESENTATION_STYLES.find(s => s.id === state.style);
    const slideCount = SLIDE_COUNTS.find(c => c.id === state.slideCount);

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
                >
                    <Sparkles className="w-8 h-8 text-green-600" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
                <p className="text-gray-500">Here's your presentation configuration</p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Purpose</span>
                    <span className="font-medium text-gray-900 flex items-center gap-2">
                        {purpose && <purpose.icon className="w-4 h-4" style={{ color: purpose.color }} />}
                        {purpose?.label}
                    </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Style</span>
                    <span className="font-medium text-gray-900">{style?.label}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Theme</span>
                    <span className="font-medium text-gray-900 flex items-center gap-2">
                        <span>{theme.emoji}</span>
                        {theme.name}
                    </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Length</span>
                    <span className="font-medium text-gray-900">{slideCount?.label}</span>
                </div>
            </div>

            <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                    We'll suggest <span className="font-medium text-indigo-600">{purpose?.templates.length || slideCount?.count}</span> templates
                    optimized for your {purpose?.label.toLowerCase()} presentation
                </p>
            </div>
        </div>
    );
}

// ==========================================
// MAIN WIZARD COMPONENT
// ==========================================

export default function TemplateWizard({ onComplete, onCancel, initialState }: WizardProps) {
    const [step, setStep] = useState(1);
    const [state, setState] = useState<WizardState>({
        purpose: initialState?.purpose || null,
        style: initialState?.style || null,
        theme: initialState?.theme || null,
        slideCount: initialState?.slideCount || null,
        selectedTemplates: initialState?.selectedTemplates || []
    });

    const totalSteps = 5;
    const progress = (step / totalSteps) * 100;

    const currentTheme = useMemo(() =>
        THEME_OPTIONS.find(t => t.id === state.theme) || THEME_OPTIONS[0],
        [state.theme]
    );

    const canGoNext = useMemo(() => {
        switch (step) {
            case 1: return !!state.purpose;
            case 2: return !!state.style;
            case 3: return !!state.theme;
            case 4: return !!state.slideCount;
            case 5: return true;
            default: return false;
        }
    }, [step, state]);

    const handleNext = useCallback(() => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            // Complete wizard
            const purpose = PRESENTATION_PURPOSES.find(p => p.id === state.purpose);
            const slideCount = SLIDE_COUNTS.find(c => c.id === state.slideCount);

            // Set suggested templates based on purpose
            const templates = purpose?.templates || [];

            onComplete({
                ...state,
                selectedTemplates: templates.slice(0, slideCount?.count || 10)
            });
        }
    }, [step, state, onComplete]);

    const handleBack = useCallback(() => {
        if (step > 1) {
            setStep(step - 1);
        }
    }, [step]);

    const updateState = useCallback((key: keyof WizardState, value: string) => {
        setState(prev => ({ ...prev, [key]: value }));
    }, []);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Wand2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">Template Wizard</h1>
                            <p className="text-sm text-gray-500">Step {step} of {totalSteps}</p>
                        </div>
                    </div>

                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Close wizard"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-gray-100">
                    <motion.div
                        className="h-full bg-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {step === 1 && (
                                <PurposeStep
                                    selected={state.purpose}
                                    onSelect={(id) => updateState('purpose', id)}
                                />
                            )}
                            {step === 2 && (
                                <StyleStep
                                    selected={state.style}
                                    onSelect={(id) => updateState('style', id)}
                                />
                            )}
                            {step === 3 && (
                                <ThemeStep
                                    selected={state.theme}
                                    onSelect={(id) => updateState('theme', id)}
                                />
                            )}
                            {step === 4 && (
                                <SlideCountStep
                                    selected={state.slideCount}
                                    onSelect={(id) => updateState('slideCount', id)}
                                />
                            )}
                            {step === 5 && (
                                <SummaryStep state={state} theme={currentTheme} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                    <button
                        onClick={handleBack}
                        disabled={step === 1}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${step === 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <div className="flex gap-1">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-colors ${i + 1 === step ? 'bg-indigo-500' :
                                        i + 1 < step ? 'bg-indigo-300' : 'bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={!canGoNext}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${canGoNext
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {step === totalSteps ? (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Create Presentation
                            </>
                        ) : (
                            <>
                                Next
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// Export wizard state type for use in parent components
export type { WizardState };
