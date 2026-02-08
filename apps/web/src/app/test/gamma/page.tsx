'use client';

/**
 * 🎴 Gamma-Style Presentation Generator Test Page
 * Generate stunning presentations with AI
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Wand2, Loader2, Play, Eye, Download,
    Palette, Layout, FileText, Users, Target, Volume2,
    ChevronRight, Check, RefreshCw, Zap
} from 'lucide-react';
import { GammaPresentation, GenerationRequest } from '@/lib/gamma/types';
import { generatePresentation } from '@/lib/gamma/generator';
import { BUILTIN_THEMES } from '@/lib/gamma/themes';
import GammaViewer from '@/components/gamma/GammaViewer';

// Demo presentation for testing
const DEMO_PRESENTATION: GammaPresentation = {
    id: 'demo-1',
    title: 'The Future of AI in Business',
    description: 'A comprehensive look at AI transformation',
    productId: 'demo',
    userId: 'demo',
    cards: [
        {
            id: 'card-1',
            type: 'card',
            title: 'The Future of AI in Business',
            layout: 'title-centered',
            blocks: [
                {
                    id: 'b1',
                    type: 'heading',
                    content: { text: 'The Future of AI in Business', level: 1 }
                },
                {
                    id: 'b2',
                    type: 'paragraph',
                    content: { html: '<p>Transforming enterprises through intelligent automation</p>' }
                }
            ],
            speakerNotes: 'Welcome everyone. Today we\'ll explore how AI is reshaping the business landscape.',
            transition: 'fade'
        },
        {
            id: 'card-2',
            type: 'card',
            title: 'Why AI Matters Now',
            layout: 'accent-right',
            blocks: [
                {
                    id: 'b3',
                    type: 'heading',
                    content: { text: 'Why AI Matters Now', level: 2 }
                },
                {
                    id: 'b4',
                    type: 'bullet-list',
                    content: {
                        items: [
                            'Data volumes are exploding exponentially',
                            'Computing power is now accessible to all',
                            'AI models have reached human-level performance',
                            'Early adopters are gaining massive advantages'
                        ],
                        ordered: false
                    }
                },
                {
                    id: 'b5',
                    type: 'image',
                    content: {
                        src: 'https://image.pollinations.ai/prompt/futuristic%20AI%20brain%20neural%20network%20blue%20glow%20dark%20background%20professional?width=800&height=600&nologo=true',
                        alt: 'AI Neural Network',
                        fit: 'cover'
                    }
                }
            ],
            speakerNotes: 'The confluence of these factors means AI is no longer optional - it\'s essential.',
            transition: 'slide-up'
        },
        {
            id: 'card-3',
            type: 'card',
            title: 'The Numbers Tell the Story',
            layout: 'stats',
            blocks: [
                {
                    id: 'b6',
                    type: 'heading',
                    content: { text: 'The Numbers Tell the Story', level: 2 }
                },
                {
                    id: 'b7',
                    type: 'stat',
                    content: { value: '85%', label: 'of CEOs plan AI investments', trend: 'up' }
                },
                {
                    id: 'b8',
                    type: 'stat',
                    content: { value: '$15T', label: 'AI economic impact by 2030', trend: 'up' }
                },
                {
                    id: 'b9',
                    type: 'stat',
                    content: { value: '40%', label: 'productivity gains with AI', trend: 'up' }
                },
                {
                    id: 'b10',
                    type: 'stat',
                    content: { value: '3x', label: 'faster decision making', trend: 'up' }
                }
            ],
            speakerNotes: 'These statistics from McKinsey and PwC demonstrate the unprecedented scale of AI transformation.',
            transition: 'slide-up'
        },
        {
            id: 'card-4',
            type: 'card',
            title: 'Key Use Cases',
            layout: 'comparison',
            blocks: [
                {
                    id: 'b11',
                    type: 'heading',
                    content: { text: 'Traditional vs AI-Powered', level: 2 }
                },
                {
                    id: 'b12',
                    type: 'heading',
                    content: { text: 'Traditional Approach', level: 3 }
                },
                {
                    id: 'b13',
                    type: 'bullet-list',
                    content: {
                        items: [
                            'Manual data analysis',
                            'Reactive decision making',
                            'Limited personalization',
                            'High operational costs'
                        ],
                        ordered: false
                    }
                },
                {
                    id: 'b14',
                    type: 'heading',
                    content: { text: 'AI-Powered Approach', level: 3 }
                },
                {
                    id: 'b15',
                    type: 'bullet-list',
                    content: {
                        items: [
                            'Real-time insights',
                            'Predictive analytics',
                            'Hyper-personalization',
                            'Automated efficiency'
                        ],
                        ordered: false
                    }
                }
            ],
            speakerNotes: 'The contrast is stark. Companies using AI are operating in a fundamentally different paradigm.',
            transition: 'slide-up'
        },
        {
            id: 'card-5',
            type: 'card',
            title: 'Start Your AI Journey',
            layout: 'title-centered',
            blocks: [
                {
                    id: 'b16',
                    type: 'heading',
                    content: { text: 'Ready to Transform?', level: 1 }
                },
                {
                    id: 'b17',
                    type: 'paragraph',
                    content: { html: '<p>Let\'s discuss how AI can accelerate your business.</p>' }
                },
                {
                    id: 'b18',
                    type: 'callout',
                    content: {
                        type: 'tip',
                        title: 'Next Step',
                        text: 'Schedule a free AI readiness assessment with our team.'
                    }
                }
            ],
            speakerNotes: 'Thank you for your attention. I\'m happy to take questions.',
            transition: 'slide-up'
        }
    ],
    theme: BUILTIN_THEMES[0], // Midnight theme
    metadata: {
        wordCount: 250,
        estimatedDuration: 8,
        slideCount: 5,
        version: 1
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

export default function GammaTestPage() {
    const [step, setStep] = useState<'input' | 'generating' | 'preview'>('input');
    const [presentation, setPresentation] = useState<GammaPresentation | null>(null);
    const [showViewer, setShowViewer] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState(BUILTIN_THEMES[0].id);
    const [viewerMode, setViewerMode] = useState<'view' | 'present' | 'edit'>('view');

    // Form state
    const [topic, setTopic] = useState('');
    const [audience, setAudience] = useState('');
    const [tone, setTone] = useState<GenerationRequest['tone']>('professional');
    const [cardCount, setCardCount] = useState(6);
    const [style, setStyle] = useState('modern, clean, professional');

    const handleGenerate = async () => {
        setStep('generating');

        try {
            const request: GenerationRequest = {
                topic,
                audience,
                tone,
                cardCount,
                style,
                includeImages: true,
                productId: 'demo',
                userId: 'demo'
            };

            const generated = await generatePresentation(request);
            setPresentation(generated);
            setStep('preview');
        } catch (error) {
            console.error('Generation failed:', error);
            // Use demo presentation as fallback
            setPresentation(DEMO_PRESENTATION);
            setStep('preview');
        }
    };

    const handleViewDemo = () => {
        setPresentation(DEMO_PRESENTATION);
        setShowViewer(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Hero Section */}
            <header className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent" />
                <div className="max-w-6xl mx-auto px-6 py-16 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm mb-6">
                            <Sparkles className="w-4 h-4" />
                            <span>Gamma-Style AI Presentations</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                            Create Stunning Presentations
                            <br />
                            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                                in Seconds
                            </span>
                        </h1>
                        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
                            AI-powered presentation generation with beautiful themes, smart layouts, and automatic image generation.
                        </p>

                        <div className="flex items-center justify-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 flex items-center gap-2"
                            >
                                <Wand2 className="w-5 h-5" />
                                Generate Presentation
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleViewDemo}
                                className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 flex items-center gap-2"
                            >
                                <Eye className="w-5 h-5" />
                                View Demo
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* Theme Preview */}
            <section className="max-w-6xl mx-auto px-6 py-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Palette className="w-6 h-6 text-purple-400" />
                    12 Beautiful Themes
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {BUILTIN_THEMES.map((theme) => (
                        <motion.button
                            key={theme.id}
                            whileHover={{ scale: 1.05, y: -5 }}
                            onClick={() => setSelectedTheme(theme.id)}
                            className={`relative p-1 rounded-xl overflow-hidden ${selectedTheme === theme.id ? 'ring-2 ring-purple-500' : ''
                                }`}
                        >
                            <div
                                className="h-24 rounded-lg flex items-center justify-center"
                                style={{ background: theme.card.background }}
                            >
                                <span
                                    className="font-semibold text-sm"
                                    style={{
                                        color: theme.colors.text,
                                        fontFamily: theme.typography.headingFont
                                    }}
                                >
                                    {theme.name}
                                </span>
                            </div>
                            {selectedTheme === theme.id && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </motion.button>
                    ))}
                </div>
            </section>

            {/* Generator Section */}
            <section id="generator" className="max-w-4xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
                >
                    <AnimatePresence mode="wait">
                        {step === 'input' && (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Zap className="w-6 h-6 text-yellow-400" />
                                    Create Your Presentation
                                </h2>

                                <div className="space-y-6">
                                    {/* Topic */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <FileText className="w-4 h-4 inline mr-2" />
                                            What's your topic?
                                        </label>
                                        <input
                                            type="text"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="e.g., The Future of Renewable Energy"
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    {/* Audience */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <Users className="w-4 h-4 inline mr-2" />
                                            Who's your audience?
                                        </label>
                                        <input
                                            type="text"
                                            value={audience}
                                            onChange={(e) => setAudience(e.target.value)}
                                            placeholder="e.g., Business executives, Students, Investors"
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    {/* Tone & Cards */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                <Volume2 className="w-4 h-4 inline mr-2" />
                                                Tone
                                            </label>
                                            <select
                                                value={tone}
                                                onChange={(e) => setTone(e.target.value as any)}
                                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            >
                                                <option value="professional">Professional</option>
                                                <option value="casual">Casual</option>
                                                <option value="educational">Educational</option>
                                                <option value="inspiring">Inspiring</option>
                                                <option value="technical">Technical</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                <Layout className="w-4 h-4 inline mr-2" />
                                                Number of Cards
                                            </label>
                                            <select
                                                value={cardCount}
                                                onChange={(e) => setCardCount(Number(e.target.value))}
                                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            >
                                                {[4, 5, 6, 8, 10, 12].map(n => (
                                                    <option key={n} value={n}>{n} cards</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Generate Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleGenerate}
                                        disabled={!topic}
                                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        Generate with AI
                                        <ChevronRight className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'generating' && (
                            <motion.div
                                key="generating"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-16"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    className="inline-block mb-6"
                                >
                                    <Loader2 className="w-16 h-16 text-purple-400" />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-white mb-2">Generating Your Presentation</h3>
                                <p className="text-slate-400">AI is crafting your slides with beautiful layouts...</p>

                                <div className="mt-8 space-y-3 max-w-sm mx-auto">
                                    {['Creating outline...', 'Generating content...', 'Adding images...', 'Applying theme...'].map((step, i) => (
                                        <motion.div
                                            key={step}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.8 }}
                                            className="flex items-center gap-3 text-left"
                                        >
                                            <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center">
                                                <Check className="w-3 h-3 text-purple-400" />
                                            </div>
                                            <span className="text-slate-300">{step}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 'preview' && presentation && (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">{presentation.title}</h3>
                                        <p className="text-slate-400">
                                            {presentation.cards.length} cards • ~{presentation.metadata.estimatedDuration} min
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setStep('input')}
                                            className="px-4 py-2 bg-slate-700 text-white rounded-lg flex items-center gap-2"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Regenerate
                                        </button>
                                        <button
                                            onClick={() => setShowViewer(true)}
                                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg flex items-center gap-2"
                                        >
                                            <Play className="w-4 h-4" />
                                            Present
                                        </button>
                                    </div>
                                </div>

                                {/* Card Thumbnails */}
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                    {presentation.cards.map((card, i) => (
                                        <motion.div
                                            key={card.id}
                                            whileHover={{ scale: 1.05, y: -5 }}
                                            className="aspect-[16/9] rounded-lg overflow-hidden cursor-pointer"
                                            style={{ background: presentation.theme.card.background }}
                                            onClick={() => {
                                                setShowViewer(true);
                                            }}
                                        >
                                            <div className="p-3 h-full flex flex-col justify-center items-center text-center">
                                                <span
                                                    className="text-xs font-medium truncate w-full"
                                                    style={{ color: presentation.theme.colors.text }}
                                                >
                                                    {card.title || `Card ${i + 1}`}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </section>

            {/* Features */}
            <section className="max-w-6xl mx-auto px-6 py-16">
                <h2 className="text-3xl font-bold text-white text-center mb-12">
                    Built Like Gamma, Powered by AI
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { icon: Layout, title: '17 Smart Layouts', desc: 'From title cards to stats grids, every layout you need' },
                        { icon: Sparkles, title: 'AI Content Generation', desc: 'Generate outlines, content, and images automatically' },
                        { icon: Palette, title: '12 Premium Themes', desc: 'Dark, light, corporate, and creative themes' },
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="p-6 rounded-2xl bg-white/5 border border-white/10"
                        >
                            <feature.icon className="w-10 h-10 text-purple-400 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                            <p className="text-slate-400">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Viewer Modal */}
            <AnimatePresence>
                {showViewer && presentation && (
                    <GammaViewer
                        presentation={presentation}
                        onClose={() => setShowViewer(false)}
                        mode="present"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
