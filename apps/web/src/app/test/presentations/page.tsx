'use client';

/**
 * 🧠 Gamma-Style Smart Presentation App
 * AI-powered layout selection per card
 * Rich layouts: Stats, Timeline, Comparison, Features, Quotes, etc.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Loader2, Plus, Wand2, ArrowLeft, Trash2,
    FileText, Play, ChevronLeft, ChevronRight, Maximize2, Minimize2,
    Download, X, Check, Search, ChevronDown, Share2, Copy,
    Camera, Brush, Palette, Box, PenTool, Settings2, FileDown,
    Zap, Shield, TrendingUp, Users, Star, ArrowRight, Presentation,
    Quote, BarChart3, Clock, GitCompare, Grid3X3, Lightbulb, Monitor
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type CardLayoutType =
    | 'title-hero' | 'split-text-image' | 'split-image-text'
    | 'bullet-list' | 'stats-grid' | 'quote-highlight'
    | 'timeline' | 'comparison-table' | 'feature-grid'
    | 'diagram' | 'callout' | 'big-statement' | 'icon-list';

interface SmartCard {
    id: string;
    layout: CardLayoutType;
    content: any;
    gradient: string;
    imageUrl?: string;
    imagePrompt?: string;
    speakerNotes?: string;
}

interface Presentation {
    id: string;
    title: string;
    subtitle?: string;
    cards: SmartCard[];
    theme: Theme;
    createdAt: string;
}

interface OutlineCard { id: string; title: string; bulletPoints: string[]; }
interface Outline { title: string; subtitle: string; cards: OutlineCard[]; }

interface Theme {
    id: string; name: string; category: 'dark' | 'light' | 'professional' | 'colorful';
    colors: { background: string; surface: string; text: string; textMuted: string; heading: string; accent: string; link: string; };
    preview: { gradient?: string };
}

interface ImageSettings { source: 'ai' | 'pexels' | 'unsplash' | 'none'; style: 'photo' | 'illustration' | 'abstract' | '3d' | 'lineart' | 'custom'; useThemeStyle: boolean; keywords: string[]; }

// ============================================
// DATA
// ============================================

const THEMES: Theme[] = [
    { id: 'lavender', name: 'Lavender', category: 'light', colors: { background: '#f5f3ff', surface: '#ffffff', text: '#1f2937', textMuted: '#6b7280', heading: '#7c3aed', accent: '#8b5cf6', link: '#7c3aed' }, preview: { gradient: 'from-violet-100 to-purple-50' } },
    { id: 'indigo', name: 'Indigo', category: 'dark', colors: { background: '#1e1b4b', surface: '#312e81', text: '#e0e7ff', textMuted: '#a5b4fc', heading: '#c7d2fe', accent: '#818cf8', link: '#a5b4fc' }, preview: { gradient: 'from-indigo-900 to-indigo-800' } },
    { id: 'onyx', name: 'Onyx', category: 'dark', colors: { background: '#0a0a0a', surface: '#171717', text: '#fafafa', textMuted: '#a3a3a3', heading: '#ffffff', accent: '#3b82f6', link: '#60a5fa' }, preview: { gradient: 'from-neutral-950 to-neutral-900' } },
    { id: 'midnight', name: 'Midnight', category: 'dark', colors: { background: '#0f172a', surface: '#1e293b', text: '#f1f5f9', textMuted: '#94a3b8', heading: '#f8fafc', accent: '#8b5cf6', link: '#a78bfa' }, preview: { gradient: 'from-slate-900 to-slate-800' } },
    { id: 'corporate', name: 'Corporate', category: 'professional', colors: { background: '#ffffff', surface: '#f9fafb', text: '#111827', textMuted: '#6b7280', heading: '#1f2937', accent: '#2563eb', link: '#1d4ed8' }, preview: { gradient: 'from-white to-blue-50' } },
];

const IMAGE_STYLES = [
    { id: 'photo', name: 'Photo', icon: Camera },
    { id: 'illustration', name: 'Illustration', icon: Brush },
    { id: 'abstract', name: 'Abstract', icon: Palette },
    { id: '3d', name: '3D', icon: Box },
    { id: 'lineart', name: 'Line Art', icon: PenTool },
    { id: 'custom', name: 'Custom', icon: Settings2 },
];

const ICON_MAP: Record<string, any> = { zap: Zap, shield: Shield, 'trending-up': TrendingUp, users: Users, star: Star };

const TONE_OPTIONS = [
    { id: 'professional', name: 'Professional', description: 'Business-focused, data-driven' },
    { id: 'casual', name: 'Casual', description: 'Friendly, conversational' },
    { id: 'inspiring', name: 'Inspiring', description: 'Motivational, uplifting' },
    { id: 'educational', name: 'Educational', description: 'Clear, instructive' },
    { id: 'persuasive', name: 'Persuasive', description: 'Compelling, action-oriented' },
    { id: 'storytelling', name: 'Storytelling', description: 'Narrative-driven, engaging' },
];

// ============================================
// MAIN APP
// ============================================

export default function GammaApp() {
    const [page, setPage] = useState<'landing' | 'app' | 'create' | 'outline' | 'themes' | 'images' | 'generating' | 'viewer'>('landing');
    const [presentations, setPresentations] = useState<Presentation[]>([]);
    const [selectedPres, setSelectedPres] = useState<Presentation | null>(null);
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [outline, setOutline] = useState<Outline | null>(null);
    const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);
    const [imageSettings, setImageSettings] = useState<ImageSettings>({ source: 'ai', style: 'photo', useThemeStyle: true, keywords: [] });
    const [error, setError] = useState<string | null>(null);
    const [generatedCards, setGeneratedCards] = useState<SmartCard[]>([]);
    const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState(0);
    const [cardCount, setCardCount] = useState(8);
    const [presenterMode, setPresenterMode] = useState(false);
    const [selectedTone, setSelectedTone] = useState('professional');

    useEffect(() => {
        const saved = localStorage.getItem('gamma-presentations-v2');
        if (saved) setPresentations(JSON.parse(saved));
    }, []);

    const savePresentations = (pres: Presentation[]) => {
        localStorage.setItem('gamma-presentations-v2', JSON.stringify(pres));
        setPresentations(pres);
    };

    const generateOutline = async () => {
        if (!prompt.trim()) return;
        setGenerating(true);
        setError(null);
        try {
            const res = await fetch('/api/presentations/gamma/outline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: prompt, cardCount, tone: selectedTone })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Transform API response (array of cards) to Outline object
            const outlineCards = Array.isArray(data.outline) ? data.outline : [];
            const transformedOutline: Outline = {
                title: prompt,
                subtitle: `A ${cardCount}-card presentation`,
                cards: outlineCards.map((card: any) => ({
                    id: card.id || crypto.randomUUID(),
                    title: card.title || 'Untitled',
                    bulletPoints: card.description
                        ? [card.description]
                        : (card.bulletPoints || ['Add content here'])
                }))
            };

            setOutline(transformedOutline);
            setPage('outline');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate outline');
        } finally {
            setGenerating(false);
        }
    };

    const startSmartGeneration = async () => {
        if (!outline) return;
        setGenerating(true);
        setError(null);
        console.log('[Gamma UI] Starting smart generation...');

        try {
            const res = await fetch('/api/presentations/gamma', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: outline.title,
                    outline,
                    imageStyle: imageSettings.style,
                    imageKeywords: imageSettings.keywords,
                    tone: selectedTone,
                })
            });

            console.log('[Gamma UI] Response status:', res.status);
            const data = await res.json();
            console.log('[Gamma UI] Response data:', data);

            if (!res.ok) throw new Error(data.error || 'Generation failed');

            // Move to generating page only after successful response
            setPage('generating');
            setGeneratedCards([]);
            setCurrentGeneratingIndex(0);

            // Stream cards one by one for animation
            const cards = data.presentation.cards;
            for (let i = 0; i < cards.length; i++) {
                await new Promise(r => setTimeout(r, 600));
                setGeneratedCards(prev => [...prev, cards[i]]);
                setCurrentGeneratingIndex(i + 1);
            }

            // Create presentation
            setTimeout(() => {
                const newPres: Presentation = {
                    id: data.presentation.id,
                    title: data.presentation.title,
                    subtitle: data.presentation.subtitle,
                    cards,
                    theme: selectedTheme,
                    createdAt: new Date().toISOString(),
                };
                savePresentations([newPres, ...presentations]);
                setSelectedPres(newPres);
                setPage('viewer');
                setPrompt('');
                setOutline(null);
            }, 1000);

        } catch (err) {
            console.error('[Gamma UI] Generation error:', err);
            setError(err instanceof Error ? err.message : 'Generation failed');
            setPage('images');
        } finally {
            setGenerating(false);
        }
    };

    // Page renders...
    // Streamlined flow: Create → Outline → Generate (skip redundant theme/image pages)
    if (page === 'landing') return <LandingPage onStart={() => setPage('app')} />;
    if (page === 'create') return <CreatePage prompt={prompt} setPrompt={setPrompt} generating={generating} error={error} onBack={() => setPage('app')} onGenerate={generateOutline} cardCount={cardCount} setCardCount={setCardCount} selectedTone={selectedTone} setSelectedTone={setSelectedTone} imageSettings={imageSettings} setImageSettings={setImageSettings} selectedTheme={selectedTheme} setSelectedTheme={setSelectedTheme} />;
    if (page === 'outline' && outline) return <OutlineEditor outline={outline} setOutline={setOutline} onBack={() => setPage('create')} onContinue={startSmartGeneration} generating={generating} />;
    if (page === 'generating' && outline) return <GeneratingPage outline={outline} theme={selectedTheme} generatedCards={generatedCards} currentIndex={currentGeneratingIndex} />;
    if (page === 'viewer' && selectedPres) return <SmartPresentationViewer presentation={selectedPres} onBack={() => setPage('app')} />;

    return <Dashboard presentations={presentations} onSelectPresentation={(p) => { setSelectedPres(p); setPage('viewer'); }} onCreateNew={() => setPage('create')} onDelete={(id) => savePresentations(presentations.filter(p => p.id !== id))} />;
}

// ============================================
// LANDING PAGE
// ============================================

function LandingPage({ onStart }: { onStart: () => void }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900 overflow-hidden">
            <nav className="flex items-center justify-between px-8 py-5">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white">gamma</span>
                </div>
                <button onClick={onStart} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium">Get Started</button>
            </nav>
            <div className="max-w-5xl mx-auto px-8 pt-24 text-center">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
                        AI designs each slide<br />
                        <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">automatically</span>
                    </h1>
                    <p className="text-xl text-white/70 mb-10">Stats, timelines, comparisons, quotes — AI picks the perfect layout for your content.</p>
                    <button onClick={onStart} className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold rounded-full text-lg shadow-lg">
                        Start Creating
                    </button>
                </motion.div>
                <div className="mt-16 grid grid-cols-4 gap-4 text-white/60 text-sm">
                    {[
                        { icon: BarChart3, label: 'Stats Grid' },
                        { icon: Clock, label: 'Timeline' },
                        { icon: GitCompare, label: 'Comparison' },
                        { icon: Grid3X3, label: 'Feature Grid' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <item.icon className="w-8 h-8 mx-auto mb-2" />
                            <p>{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================
// DASHBOARD
// ============================================

function Dashboard({ presentations, onSelectPresentation, onCreateNew, onDelete }: any) {
    return (
        <div className="min-h-screen bg-gray-950">
            <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center"><Sparkles className="w-5 h-5 text-white" /></div>
                    <span className="text-xl font-bold text-white">gamma</span>
                </div>
            </nav>
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white">Your Presentations</h1>
                    <button onClick={onCreateNew} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold rounded-full"><Plus className="w-5 h-5" /> Create with AI</button>
                </div>
                {presentations.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6"><FileText className="w-10 h-10 text-white/30" /></div>
                        <h3 className="text-xl font-semibold text-white mb-2">No presentations yet</h3>
                        <button onClick={onCreateNew} className="mt-4 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full">Get started</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {presentations.map((pres: Presentation) => (
                            <motion.div key={pres.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 cursor-pointer" onClick={() => onSelectPresentation(pres)}>
                                <div className={`h-40 bg-gradient-to-br ${pres.cards?.[0]?.gradient || 'from-violet-600 to-purple-600'} flex items-center justify-center p-6`}>
                                    <h3 className="text-xl font-bold text-white text-center">{pres.title}</h3>
                                </div>
                                <div className="p-4 flex items-center justify-between">
                                    <p className="text-white/50 text-sm">{pres.cards?.length || 0} smart cards</p>
                                    <button onClick={(e) => { e.stopPropagation(); onDelete(pres.id); }} className="p-2 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// CREATE PAGE
// ============================================

function CreatePage({ prompt, setPrompt, generating, error, onBack, onGenerate, cardCount, setCardCount, selectedTone, setSelectedTone, imageSettings, setImageSettings, selectedTheme, setSelectedTheme }: any) {
    const CARD_COUNT_OPTIONS = [5, 6, 8, 10, 12, 15];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-950 flex items-center justify-center p-6">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-violet-600/5 to-fuchsia-600/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-3xl relative z-10 overflow-y-auto max-h-screen py-6">
                <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors" title="Go back">
                    <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl shadow-violet-500/10"
                >
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                            <Wand2 className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Create AI Presentation</h2>
                            <p className="text-white/50 text-sm">AI analyzes your content and designs every slide</p>
                        </div>
                    </div>

                    {/* Topic Input */}
                    <div className="mb-6">
                        <label className="block text-white/70 text-sm font-medium mb-2">Presentation Topic</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A pitch deck for an AI startup that just raised Series A..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
                            title="Enter your presentation topic"
                        />
                    </div>

                    {/* Two Column Layout for Slides and Tone */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* Card Count Selector */}
                        <div>
                            <label className="block text-white/70 text-sm font-medium mb-3">Number of Slides</label>
                            <div className="flex flex-wrap gap-2">
                                {CARD_COUNT_OPTIONS.map((count) => (
                                    <button
                                        key={count}
                                        onClick={() => setCardCount(count)}
                                        className={`px-4 py-2.5 rounded-xl font-medium transition-all ${cardCount === count
                                            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-lg shadow-orange-500/30'
                                            : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                                            }`}
                                        title={`Generate ${count} slides`}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tone Selector */}
                        <div>
                            <label className="block text-white/70 text-sm font-medium mb-3">Presentation Tone</label>
                            <div className="relative">
                                <select
                                    value={selectedTone}
                                    onChange={(e) => setSelectedTone(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer"
                                    title="Select presentation tone"
                                >
                                    {TONE_OPTIONS.map((tone) => (
                                        <option key={tone.id} value={tone.id} className="bg-slate-900 text-white">
                                            {tone.name} - {tone.description}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Theme Selector */}
                    <div className="mb-6">
                        <label className="block text-white/70 text-sm font-medium mb-3">Color Theme</label>
                        <div className="grid grid-cols-5 gap-2">
                            {THEMES.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => setSelectedTheme(theme)}
                                    className={`p-3 rounded-xl transition-all ${selectedTheme.id === theme.id
                                        ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900'
                                        : 'hover:ring-1 hover:ring-white/30'
                                        }`}
                                    title={`Use ${theme.name} theme`}
                                >
                                    <div className={`h-8 rounded-lg bg-gradient-to-br ${theme.preview.gradient} mb-1`} style={{ backgroundColor: theme.colors.background }} />
                                    <span className="text-xs text-white/60">{theme.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Image Style Selector */}
                    <div className="mb-6">
                        <label className="block text-white/70 text-sm font-medium mb-3">Image Style</label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            {IMAGE_STYLES.map((style) => {
                                const Icon = style.icon;
                                return (
                                    <button
                                        key={style.id}
                                        onClick={() => setImageSettings({ ...imageSettings, style: style.id })}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${imageSettings.style === style.id
                                            ? 'bg-gradient-to-r from-amber-400/20 to-orange-500/20 border-amber-400/50 text-amber-300'
                                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                            } border`}
                                        title={`Use ${style.name} images`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="text-xs font-medium">{style.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-xl border border-violet-500/20">
                        <p className="text-sm text-white/60">
                            <span className="text-violet-300 font-medium">💡 Pro tip:</span> Be specific about your audience and goals.
                            AI will select the best layout (stats, timeline, comparison, etc.) for each slide.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-center gap-3">
                            <X className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button onClick={onBack} className="px-5 py-2.5 text-white/60 hover:text-white transition-colors" title="Cancel">
                            Cancel
                        </button>
                        <button
                            onClick={onGenerate}
                            disabled={generating || !prompt.trim()}
                            className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-black font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all hover:scale-105 active:scale-100"
                            title="Generate presentation outline"
                        >
                            {generating ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Creating Outline...</>
                            ) : (
                                <><Sparkles className="w-5 h-5" /> Generate Outline</>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

// ============================================
// OUTLINE EDITOR
// ============================================

function OutlineEditor({ outline, setOutline, onBack, onContinue, generating }: { outline: Outline; setOutline: (o: Outline) => void; onBack: () => void; onContinue: () => void; generating?: boolean }) {
    const gradients = ['from-violet-600 to-purple-600', 'from-pink-600 to-rose-600', 'from-cyan-600 to-blue-600', 'from-orange-500 to-yellow-500', 'from-emerald-500 to-teal-500'];

    // Auto-resize all textareas on mount
    useEffect(() => {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(ta => {
            ta.style.height = 'auto';
            ta.style.height = ta.scrollHeight + 'px';
        });
    }, [outline.cards]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900">
            <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-sm sticky top-0 z-10">
                <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white" title="Go back"><ArrowLeft className="w-5 h-5" /> Back</button>
                <span className="text-white font-medium">Edit Outline</span>
                <button onClick={onContinue} disabled={generating} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold rounded-full disabled:opacity-50" title="Generate your presentation">
                    {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Presentation</>}
                </button>
            </nav>
            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="mb-8 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10">
                    <input type="text" value={outline.title} onChange={(e) => setOutline({ ...outline, title: e.target.value })} className="w-full text-3xl font-bold text-white bg-transparent border-none focus:outline-none" placeholder="Title" />
                </div>
                <div className="space-y-4">
                    {outline.cards.map((card, index) => (
                        <motion.div key={card.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="p-5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 group">
                            <div className="flex items-start gap-4">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center font-bold text-white`}>{index + 1}</div>
                                <div className="flex-1">
                                    <input type="text" value={card.title} onChange={(e) => { const nc = [...outline.cards]; nc[index].title = e.target.value; setOutline({ ...outline, cards: nc }); }} className="w-full text-xl font-semibold text-white bg-transparent border-none focus:outline-none mb-3" />
                                    <ul className="space-y-2">
                                        {card.bulletPoints.map((bullet, bi) => (
                                            <li key={bi} className="flex items-start gap-2">
                                                <span className="text-white/40 mt-1">•</span>
                                                <textarea
                                                    value={bullet}
                                                    onChange={(e) => { const nc = [...outline.cards]; nc[index].bulletPoints[bi] = e.target.value; setOutline({ ...outline, cards: nc }); }}
                                                    className="flex-1 text-white/70 bg-transparent border-none focus:outline-none resize-none overflow-hidden min-h-[1.5em]"
                                                    rows={1}
                                                    onInput={(e) => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px'; }}
                                                    placeholder="Description text..."
                                                />
                                                <button onClick={() => { const nc = [...outline.cards]; nc[index].bulletPoints.splice(bi, 1); setOutline({ ...outline, cards: nc }); }} className="text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100" title="Remove point"><X className="w-4 h-4" /></button>
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={() => { const nc = [...outline.cards]; nc[index].bulletPoints.push('New point'); setOutline({ ...outline, cards: nc }); }} className="text-sm text-yellow-400 mt-2 flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
                                </div>
                                <button onClick={() => setOutline({ ...outline, cards: outline.cards.filter((_, i) => i !== index) })} className="text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        </motion.div>
                    ))}
                </div>
                <button onClick={() => setOutline({ ...outline, cards: [...outline.cards, { id: crypto.randomUUID(), title: 'New Card', bulletPoints: ['Point 1'] }] })} className="mt-4 w-full p-4 border-2 border-dashed border-white/20 hover:border-white/40 rounded-2xl text-white/50 hover:text-white flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Add Card</button>
            </div>
        </div>
    );
}

// ============================================
// THEME SELECTOR
// ============================================

function ThemeSelector({ selectedTheme, onSelectTheme, onBack, onContinue }: { selectedTheme: Theme; onSelectTheme: (t: Theme) => void; onBack: () => void; onContinue: () => void }) {
    return (
        <div className="min-h-screen bg-slate-100 flex">
            <div className="w-[350px] bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900">Choose Theme</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 gap-3">
                        {THEMES.map(theme => (
                            <button key={theme.id} onClick={() => onSelectTheme(theme)} className={`text-left rounded-xl overflow-hidden border-2 ${selectedTheme.id === theme.id ? 'border-violet-500 ring-2 ring-violet-200' : 'border-slate-200'}`}>
                                <div className={`h-20 bg-gradient-to-br ${theme.preview.gradient} p-3 flex flex-col justify-end`} style={{ backgroundColor: theme.colors.background }}>
                                    <p className="font-semibold" style={{ color: theme.colors.heading }}>Title</p>
                                    <p className="text-xs" style={{ color: theme.colors.textMuted }}>Body text</p>
                                </div>
                                <div className="px-3 py-2 bg-white flex items-center gap-2">
                                    {selectedTheme.id === theme.id && <Check className="w-4 h-4 text-violet-600" />}
                                    <span className="text-sm text-slate-700">{theme.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                    <button onClick={onBack} className="text-slate-600 hover:text-slate-900 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
                </div>
                <div className="flex-1 p-8 overflow-y-auto" style={{ backgroundColor: selectedTheme.colors.background }}>
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-4xl font-bold mb-4" style={{ color: selectedTheme.colors.heading }}>Theme Preview</h1>
                        <p style={{ color: selectedTheme.colors.textMuted }}>Your presentation will use these colors and styles.</p>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
                    <button onClick={onBack} className="px-6 py-2.5 rounded-full border border-slate-300 text-slate-700 font-medium">Cancel</button>
                    <button onClick={onContinue} className="px-6 py-2.5 rounded-full bg-violet-600 text-white font-medium">Continue</button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// IMAGE SETTINGS
// ============================================

function ImageSettingsPage({ imageSettings, setImageSettings, onBack, onContinue, loading, error }: { imageSettings: ImageSettings; setImageSettings: (s: ImageSettings) => void; onBack: () => void; onContinue: () => void; loading?: boolean; error?: string | null }) {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Image Settings</h2>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Image source</label>
                    <select value={imageSettings.source} onChange={(e) => setImageSettings({ ...imageSettings, source: e.target.value as any })} className="w-full px-4 py-3 bg-slate-100 rounded-xl" title="Select image source">
                        <option value="ai">✨ AI images</option>
                        <option value="pexels">📷 Pexels</option>
                        <option value="none">🚫 No images</option>
                    </select>
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-3">Art style</label>
                    <div className="grid grid-cols-6 gap-3">
                        {IMAGE_STYLES.map(style => (
                            <button key={style.id} onClick={() => setImageSettings({ ...imageSettings, style: style.id as any })} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${imageSettings.style === style.id ? 'border-violet-500 bg-violet-50' : 'border-slate-200'}`} title={style.name}>
                                <style.icon className="w-6 h-6 text-slate-600" />
                                <span className="text-xs">{style.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
                {error && <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
                <div className="flex justify-end gap-3">
                    <button onClick={onBack} disabled={loading} className="px-6 py-3 rounded-full border border-slate-300 text-slate-700 font-medium disabled:opacity-50">Back</button>
                    <button onClick={onContinue} disabled={loading} className="px-6 py-3 rounded-full bg-violet-600 text-white font-medium flex items-center gap-2 disabled:opacity-50">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Smart Presentation</>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ============================================
// GENERATING PAGE (Streaming Cards)
// ============================================

function GeneratingPage({ outline, theme, generatedCards, currentIndex }: { outline: Outline; theme: Theme; generatedCards: SmartCard[]; currentIndex: number }) {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => { containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' }); }, [generatedCards.length]);

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.colors.background }}>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: theme.colors.surface }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.colors.accent }}>
                        <Sparkles className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold" style={{ color: theme.colors.heading }}>AI is designing your slides</h1>
                        <p className="text-sm" style={{ color: theme.colors.textMuted }}>{currentIndex} of {outline.cards.length} smart cards</p>
                    </div>
                </div>
                <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: theme.colors.accent }} initial={{ width: 0 }} animate={{ width: `${(currentIndex / outline.cards.length) * 100}%` }} />
                </div>
            </div>
            <div ref={containerRef} className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {generatedCards.map((card, i) => (
                        <motion.div key={card.id} initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, type: 'spring' }}>
                            <SmartCardRenderer card={card} theme={theme} index={i} />
                        </motion.div>
                    ))}
                    {currentIndex < outline.cards.length && (
                        <div className="rounded-2xl p-8" style={{ backgroundColor: theme.colors.surface + '80' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-200 animate-pulse" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-6 bg-slate-200 rounded-lg animate-pulse w-3/4" />
                                    <div className="h-4 bg-slate-200 rounded-lg animate-pulse w-1/2" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================
// SMART CARD RENDERER
// ============================================

function SmartCardRenderer({ card, theme, index }: { card: SmartCard; theme: Theme; index: number }) {
    const { layout, content, gradient } = card;

    // 🎨 PRIORITY: Use premium template HTML if available (beautiful Gamma-style designs)
    const premiumTemplate = (card as any).premiumTemplate;
    if (premiumTemplate?.html && premiumTemplate?.css) {
        return (
            <div className="premium-card-wrapper rounded-2xl overflow-hidden shadow-xl">
                <style dangerouslySetInnerHTML={{ __html: premiumTemplate.css }} />
                <div
                    className="premium-card"
                    dangerouslySetInnerHTML={{ __html: premiumTemplate.html }}
                />
            </div>
        );
    }

    // Common header bar
    const HeaderBar = () => <div className={`h-2 bg-gradient-to-r ${gradient}`} />;

    switch (layout) {
        case 'title-hero':
            return (
                <div className={`rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} p-12 text-center`}>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold text-white mb-4">{content.title}</motion.h1>
                    {content.subtitle && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-xl text-white/80">{content.subtitle}</motion.p>}
                </div>
            );

        case 'stats-grid':
            return (
                <div className="rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: theme.colors.surface }}>
                    <HeaderBar />
                    <div className="p-8">
                        {content.title && <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.heading }}>{content.title}</h2>}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {content.stats?.map((stat: any, i: number) => (
                                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="text-center p-4 rounded-xl" style={{ backgroundColor: theme.colors.background }}>
                                    <div className="text-3xl font-bold" style={{ color: theme.colors.accent }}>{stat.value}</div>
                                    <div className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>{stat.label}</div>
                                    {stat.trend === 'up' && <TrendingUp className="w-4 h-4 mx-auto mt-2 text-green-500" />}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case 'timeline':
            return (
                <div className="rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: theme.colors.surface }}>
                    <HeaderBar />
                    <div className="p-8">
                        {content.title && <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.heading }}>{content.title}</h2>}
                        <div className="relative pl-8 border-l-2" style={{ borderColor: theme.colors.accent }}>
                            {content.events?.map((event: any, i: number) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }} className="mb-6 relative">
                                    <div className="absolute -left-[25px] w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                                    <div className="text-sm font-semibold" style={{ color: theme.colors.accent }}>{event.year}</div>
                                    <div className="font-bold mt-1" style={{ color: theme.colors.heading }}>{event.title}</div>
                                    <div className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>{event.description}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case 'comparison-table':
            return (
                <div className="rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: theme.colors.surface }}>
                    <HeaderBar />
                    <div className="p-8">
                        {content.title && <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.heading }}>{content.title}</h2>}
                        <div className="grid grid-cols-3 gap-4">
                            <div></div>
                            <div className="text-center font-bold p-3 rounded-lg" style={{ backgroundColor: theme.colors.background, color: theme.colors.textMuted }}>{content.leftLabel}</div>
                            <div className="text-center font-bold p-3 rounded-lg" style={{ backgroundColor: theme.colors.accent, color: 'white' }}>{content.rightLabel}</div>
                            {content.rows?.map((row: any, i: number) => (
                                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="contents">
                                    <div className="font-medium p-3" style={{ color: theme.colors.text }}>{row.feature}</div>
                                    <div className="text-center p-3 rounded-lg" style={{ backgroundColor: theme.colors.background, color: theme.colors.textMuted }}>{typeof row.left === 'boolean' ? (row.left ? '✓' : '✗') : row.left}</div>
                                    <div className="text-center p-3 rounded-lg font-semibold" style={{ backgroundColor: theme.colors.accent + '20', color: theme.colors.accent }}>{typeof row.right === 'boolean' ? (row.right ? '✓' : '✗') : row.right}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case 'feature-grid':
            return (
                <div className="rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: theme.colors.surface }}>
                    <HeaderBar />
                    <div className="p-8">
                        {content.title && <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.heading }}>{content.title}</h2>}
                        <div className="grid grid-cols-2 gap-6">
                            {content.features?.map((feature: any, i: number) => {
                                const Icon = ICON_MAP[feature.icon] || Lightbulb;
                                return (
                                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-5 rounded-xl" style={{ backgroundColor: theme.colors.background }}>
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: theme.colors.accent + '20' }}>
                                            <Icon className="w-6 h-6" style={{ color: theme.colors.accent }} />
                                        </div>
                                        <div className="font-bold mb-1" style={{ color: theme.colors.heading }}>{feature.title}</div>
                                        <div className="text-sm" style={{ color: theme.colors.textMuted }}>{feature.description}</div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );

        case 'quote-highlight':
            return (
                <div className={`rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} p-12 text-center`}>
                    <Quote className="w-12 h-12 mx-auto mb-6 text-white/50" />
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-medium text-white mb-6 italic">&ldquo;{content.quote}&rdquo;</motion.p>
                    {content.author && <div className="text-white/80 font-semibold">{content.author}</div>}
                    {content.role && <div className="text-white/60 text-sm">{content.role}</div>}
                </div>
            );

        case 'big-statement':
            return (
                <div className={`rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} p-12 text-center`}>
                    <motion.h2 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-4xl font-bold text-white mb-4">{content.statement}</motion.h2>
                    {content.subtext && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-xl text-white/80">{content.subtext}</motion.p>}
                </div>
            );

        case 'split-text-image':
            return (
                <div className="rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: theme.colors.surface }}>
                    <HeaderBar />
                    <div className="grid md:grid-cols-2 gap-0">
                        <div className="p-8">
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white`}>{index + 1}</div>
                                <h2 className="text-2xl font-bold" style={{ color: theme.colors.heading }}>{content.title}</h2>
                            </div>
                            {content.body && <p className="mb-4" style={{ color: theme.colors.text }}>{content.body}</p>}
                            {content.bullets && (
                                <ul className="space-y-2">
                                    {content.bullets.map((bullet: string, i: number) => (
                                        <motion.li key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3">
                                            <span style={{ color: theme.colors.accent }}>•</span>
                                            <span style={{ color: theme.colors.text }}>{bullet}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="relative min-h-[250px] md:min-h-full">
                            {card.imageUrl ? (
                                <img
                                    src={card.imageUrl}
                                    alt={content.title || 'Slide image'}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20`} />
                            )}
                        </div>
                    </div>
                </div>
            );

        case 'split-image-text':
            return (
                <div className="rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: theme.colors.surface }}>
                    <HeaderBar />
                    <div className="grid md:grid-cols-2 gap-0">
                        <div className="relative min-h-[250px] md:min-h-full order-2 md:order-1">
                            {card.imageUrl ? (
                                <img
                                    src={card.imageUrl}
                                    alt={content.title || 'Slide image'}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20`} />
                            )}
                        </div>
                        <div className="p-8 order-1 md:order-2">
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white`}>{index + 1}</div>
                                <h2 className="text-2xl font-bold" style={{ color: theme.colors.heading }}>{content.title}</h2>
                            </div>
                            {content.body && <p className="mb-4" style={{ color: theme.colors.text }}>{content.body}</p>}
                            {content.bullets && (
                                <ul className="space-y-2">
                                    {content.bullets.map((bullet: string, i: number) => (
                                        <motion.li key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3">
                                            <span style={{ color: theme.colors.accent }}>•</span>
                                            <span style={{ color: theme.colors.text }}>{bullet}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            );

        case 'bullet-list':
        default:
            return (
                <div className="rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: theme.colors.surface }}>
                    <HeaderBar />
                    <div className="p-8">
                        <div className="flex items-start gap-4 mb-4">
                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white`}>{index + 1}</div>
                            <h2 className="text-2xl font-bold" style={{ color: theme.colors.heading }}>{content.title}</h2>
                        </div>
                        {content.body && <p className="mb-4" style={{ color: theme.colors.text }}>{content.body}</p>}
                        {content.bullets && (
                            <ul className="space-y-2">
                                {content.bullets.map((bullet: string, i: number) => (
                                    <motion.li key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3">
                                        <span style={{ color: theme.colors.accent }}>•</span>
                                        <span style={{ color: theme.colors.text }}>{bullet}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            );
    }
}

// ============================================
// SMART PRESENTATION VIEWER
// ============================================

function SmartPresentationViewer({ presentation, onBack }: { presentation: Presentation; onBack: () => void }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [presenterMode, setPresenterMode] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exporting, setExporting] = useState(false);
    const cards = presentation.cards || [];
    const theme = presentation.theme || THEMES[0];

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                setCurrentSlide(prev => Math.min(cards.length - 1, prev + 1));
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setCurrentSlide(prev => Math.max(0, prev - 1));
            } else if (e.key === 'Escape') {
                setPresenterMode(false);
            } else if (e.key === 'f' || e.key === 'F') {
                setPresenterMode(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cards.length]);

    // Export functions
    const exportToPDF = async () => {
        setExporting(true);
        setShowExportMenu(false);
        try {
            // Create printable HTML
            const printWindow = window.open('', '_blank');
            if (!printWindow) throw new Error('Popup blocked');

            const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${presentation.title} - Export</title>
    <style>
        @page { size: landscape; margin: 0; }
        body { margin: 0; font-family: 'Segoe UI', system-ui, sans-serif; }
        .slide { page-break-after: always; min-height: 100vh; padding: 60px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; }
        .slide:last-child { page-break-after: avoid; }
        h1, h2, h3 { margin: 0 0 20px 0; }
        ul { margin: 20px 0; padding-left: 30px; }
        li { margin: 10px 0; font-size: 1.2rem; }
        .slide-number { position: absolute; bottom: 20px; right: 40px; font-size: 0.9rem; opacity: 0.5; }
    </style>
</head>
<body>
    ${cards.map((card, i) => `
        <div class="slide" style="background: ${theme.colors.background}; color: ${theme.colors.text};">
            <h1 style="color: ${theme.colors.heading};">${card.content?.title || card.content?.statement || `Slide ${i + 1}`}</h1>
            ${card.content?.subtitle ? `<p style="color: ${theme.colors.textMuted}; font-size: 1.5rem;">${card.content.subtitle}</p>` : ''}
            ${card.content?.body ? `<p style="font-size: 1.2rem;">${card.content.body}</p>` : ''}
            ${card.content?.bullets?.length ? `<ul>${card.content.bullets.map((b: string) => `<li>${b}</li>`).join('')}</ul>` : ''}
            ${card.content?.quote ? `<blockquote style="font-size: 1.5rem; font-style: italic; border-left: 4px solid ${theme.colors.accent}; padding-left: 20px;">"${card.content.quote}"</blockquote>` : ''}
            <div class="slide-number">${i + 1} / ${cards.length}</div>
        </div>
    `).join('')}
    <script>window.onload = () => setTimeout(() => window.print(), 500);</script>
</body>
</html>`;
            printWindow.document.write(html);
            printWindow.document.close();
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExporting(false);
        }
    };

    const copyLink = async () => {
        setShowExportMenu(false);
        await navigator.clipboard.writeText(window.location.href);
    };

    // Presenter mode
    if (presenterMode) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center cursor-none"
                onClick={() => setCurrentSlide(prev => Math.min(cards.length - 1, prev + 1))}>
                <button
                    onClick={(e) => { e.stopPropagation(); setPresenterMode(false); }}
                    className="absolute top-4 right-4 p-3 bg-white/10 rounded-full hover:bg-white/20 z-50"
                    title="Exit presenter mode (Esc)"
                >
                    <Minimize2 className="w-6 h-6 text-white" />
                </button>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm">
                    {currentSlide + 1} / {cards.length} • Press Space or → for next slide • Esc to exit
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="w-full max-w-6xl px-8"
                    >
                        <SmartCardRenderer card={cards[currentSlide]} theme={theme} index={currentSlide} />
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.colors.background }}>
            {/* Header */}
            <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: theme.colors.surface }}>
                <button onClick={onBack} className="flex items-center gap-2 hover:opacity-80 transition-opacity" style={{ color: theme.colors.textMuted }} title="Back to Dashboard">
                    <ArrowLeft className="w-5 h-5" /> Dashboard
                </button>

                <span className="font-semibold text-lg" style={{ color: theme.colors.text }}>{presentation.title}</span>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Presenter mode */}
                    <button
                        onClick={() => setPresenterMode(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
                        style={{ backgroundColor: theme.colors.surface, color: theme.colors.text }}
                        title="Enter presenter mode (F)"
                    >
                        <Play className="w-4 h-4" /> Present
                    </button>

                    {/* Export dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
                            style={{ backgroundColor: theme.colors.accent, color: 'white' }}
                            title="Export options"
                        >
                            <Download className="w-4 h-4" /> Export <ChevronDown className="w-4 h-4" />
                        </button>

                        {showExportMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute top-full right-0 mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-50"
                                style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.background }}
                            >
                                <button
                                    onClick={exportToPDF}
                                    disabled={exporting}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                                    style={{ color: theme.colors.text }}
                                >
                                    <FileDown className="w-4 h-4" style={{ color: theme.colors.accent }} />
                                    {exporting ? 'Exporting...' : 'Export to PDF'}
                                </button>
                                <button
                                    onClick={copyLink}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-t"
                                    style={{ color: theme.colors.text, borderColor: theme.colors.background }}
                                >
                                    <Copy className="w-4 h-4" style={{ color: theme.colors.accent }} />
                                    Copy Link
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Slide view */}
            <div className="flex-1 flex items-center justify-center p-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="w-full max-w-4xl"
                    >
                        <SmartCardRenderer card={cards[currentSlide]} theme={theme} index={currentSlide} />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between px-8 py-6 border-t" style={{ borderColor: theme.colors.surface }}>
                {/* Slide info */}
                <div className="flex items-center gap-3">
                    <span className="text-sm px-3 py-1.5 rounded-lg font-medium capitalize" style={{ backgroundColor: theme.colors.surface, color: theme.colors.accent }}>
                        {cards[currentSlide]?.layout?.replace(/-/g, ' ')}
                    </span>
                </div>

                {/* Navigation controls */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                        disabled={currentSlide === 0}
                        className="p-3 rounded-full disabled:opacity-30 transition-all hover:scale-110"
                        style={{ backgroundColor: theme.colors.surface }}
                        title="Previous slide (←)"
                    >
                        <ChevronLeft className="w-6 h-6" style={{ color: theme.colors.text }} />
                    </button>

                    <div className="flex items-center gap-2">
                        {cards.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentSlide ? 'scale-150' : 'opacity-40 hover:opacity-70'}`}
                                style={{ backgroundColor: i === currentSlide ? theme.colors.accent : theme.colors.textMuted }}
                                title={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>

                    <span className="text-sm font-medium min-w-[60px] text-center" style={{ color: theme.colors.textMuted }}>
                        {currentSlide + 1} / {cards.length}
                    </span>

                    <button
                        onClick={() => setCurrentSlide(Math.min(cards.length - 1, currentSlide + 1))}
                        disabled={currentSlide === cards.length - 1}
                        className="p-3 rounded-full disabled:opacity-30 transition-all hover:scale-110"
                        style={{ backgroundColor: theme.colors.surface }}
                        title="Next slide (→)"
                    >
                        <ChevronRight className="w-6 h-6" style={{ color: theme.colors.text }} />
                    </button>
                </div>

                {/* Keyboard hint */}
                <div className="text-xs" style={{ color: theme.colors.textMuted }}>
                    ← → to navigate • F for fullscreen
                </div>
            </div>
        </div>
    );
}
