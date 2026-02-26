'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
    ArrowLeft,
    Bot,
    Globe,
    Shield,
    Sparkles,
    MessageSquare,
    Save,
    Loader2,
    Check,
    X,
    Plus,
    AlertTriangle,
    Brain,
    Eye,
    RefreshCw,
    Trash2,
} from 'lucide-react';

interface PersonaData {
    agent_name: string;
    agent_role: string;
    organization_name: string;
    tone: string;
    greeting_message: string;
    system_instructions: string;
    blocked_topics: string[];
    fallback_message: string;
    website_url: string;
    website_crawl_status: string;
    website_pages_indexed: number;
    website_last_crawled_at: string | null;
}

const DEFAULT_PERSONA: PersonaData = {
    agent_name: '',
    agent_role: '',
    organization_name: '',
    tone: 'professional',
    greeting_message: '',
    system_instructions: '',
    blocked_topics: [],
    fallback_message: '',
    website_url: '',
    website_crawl_status: 'none',
    website_pages_indexed: 0,
    website_last_crawled_at: null,
};

interface TrustedSource {
    id: string;
    domain: string;
    display_name: string;
    is_active: boolean;
    last_crawled_at: string | null;
    last_crawl_status: string | null;
    total_pages_crawled: number;
    crawl_frequency: string;
}

const TONE_OPTIONS = [
    { value: 'professional', label: 'Professional', desc: 'Clear, authoritative, business-appropriate', emoji: '👔' },
    { value: 'friendly', label: 'Friendly', desc: 'Warm, approachable, conversational', emoji: '😊' },
    { value: 'casual', label: 'Casual', desc: 'Relaxed, informal, relatable', emoji: '✌️' },
    { value: 'academic', label: 'Academic', desc: 'Scholarly, detailed, citation-heavy', emoji: '📚' },
    { value: 'witty', label: 'Witty', desc: 'Clever, engaging, light humor', emoji: '😄' },
];

export default function PersonaBuilderPage() {
    const { id } = useParams();
    const router = useRouter();
    const [persona, setPersona] = useState<PersonaData>(DEFAULT_PERSONA);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [productName, setProductName] = useState('');
    const [productColor, setProductColor] = useState('#c4715b');
    const [newBlockedTopic, setNewBlockedTopic] = useState('');
    const [testMode, setTestMode] = useState(false);
    const [testInput, setTestInput] = useState('');
    const [testResponse, setTestResponse] = useState('');
    const [testLoading, setTestLoading] = useState(false);
    const [crawling, setCrawling] = useState(false);

    // Multi-domain trusted sources state
    const [trustedSources, setTrustedSources] = useState<TrustedSource[]>([]);
    const [sourcesLoading, setSourcesLoading] = useState(true);
    const [newDomain, setNewDomain] = useState('');
    const [addingDomain, setAddingDomain] = useState(false);
    const [crawlingSourceId, setCrawlingSourceId] = useState<string | null>(null);

    useEffect(() => {
        loadPersona();
    }, [id]);

    const loadPersona = async () => {
        try {
            // Get product info
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const prodRes = await fetch(`/api/creator/products?userId=${user.id}`);
            const products = await prodRes.json();
            const product = products.find((p: any) => p.id === id);
            if (product) {
                setProductName(product.name);
                setProductColor(product.primary_color || '#c4715b');
            }

            // Get persona
            const res = await fetch(`/api/products/${id}/persona`);
            const data = await res.json();
            if (data.persona) {
                setPersona({
                    ...DEFAULT_PERSONA,
                    ...data.persona,
                    blocked_topics: data.persona.blocked_topics || [],
                });
            }

            // Load trusted web sources
            await loadTrustedSources();
        } catch (err) {
            console.error('Failed to load persona:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadTrustedSources = async () => {
        setSourcesLoading(true);
        try {
            const res = await fetch(`/api/okse/sources?product_id=${id}`);
            const data = await res.json();
            setTrustedSources(data.sources || []);
        } catch (err) {
            console.error('Failed to load trusted sources:', err);
        } finally {
            setSourcesLoading(false);
        }
    };

    const handleAddDomain = async () => {
        const domain = newDomain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
        if (!domain) return;
        setAddingDomain(true);
        try {
            const res = await fetch('/api/okse/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: id, domain }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setNewDomain('');
            await loadTrustedSources();

            // Trigger crawl for the new source
            if (data.source?.id) {
                handleCrawlSource(data.source.id);
            }
        } catch (err: any) {
            alert(err.message || 'Failed to add domain');
        } finally {
            setAddingDomain(false);
        }
    };

    const handleDeleteSource = async (sourceId: string, domain: string) => {
        if (!confirm(`Remove ${domain}? All cached data for this domain will be deleted.`)) return;
        try {
            await fetch(`/api/okse/sources?id=${sourceId}`, { method: 'DELETE' });
            setTrustedSources(prev => prev.filter(s => s.id !== sourceId));
        } catch (err) {
            console.error('Failed to delete source:', err);
        }
    };

    const handleCrawlSource = async (sourceId: string) => {
        setCrawlingSourceId(sourceId);
        try {
            const res = await fetch('/api/okse/crawler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source_id: sourceId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Reload sources to get updated status
            await loadTrustedSources();
        } catch (err) {
            console.error('Failed to trigger crawl:', err);
        } finally {
            setCrawlingSourceId(null);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const res = await fetch(`/api/products/${id}/persona`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(persona),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Update persona state with response (includes crawl status changes)
            if (data.persona) {
                setPersona(p => ({ ...p, ...data.persona }));
            }

            // If crawl was triggered, start polling for status
            if (data.crawl_triggered) {
                setCrawling(true);
                pollCrawlStatus();
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save persona:', err);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleRecrawl = async () => {
        setCrawling(true);
        setPersona(p => ({ ...p, website_crawl_status: 'crawling' }));
        try {
            const res = await fetch(`/api/products/${id}/persona`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'recrawl' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Start polling for crawl completion
            pollCrawlStatus();
        } catch (err) {
            console.error('Failed to trigger recrawl:', err);
            setCrawling(false);
            setPersona(p => ({ ...p, website_crawl_status: 'error' }));
        }
    };

    const pollCrawlStatus = () => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/products/${id}/persona`);
                const data = await res.json();
                if (data.persona) {
                    const status = data.persona.website_crawl_status;
                    setPersona(p => ({
                        ...p,
                        website_crawl_status: status,
                        website_pages_indexed: data.persona.website_pages_indexed || 0,
                        website_last_crawled_at: data.persona.website_last_crawled_at,
                    }));

                    if (status !== 'crawling') {
                        clearInterval(interval);
                        setCrawling(false);
                    }
                }
            } catch {
                clearInterval(interval);
                setCrawling(false);
            }
        }, 3000); // Poll every 3 seconds
    };

    const addBlockedTopic = () => {
        const topic = newBlockedTopic.trim();
        if (topic && !persona.blocked_topics.includes(topic)) {
            setPersona(p => ({ ...p, blocked_topics: [...p.blocked_topics, topic] }));
            setNewBlockedTopic('');
        }
    };

    const removeBlockedTopic = (topic: string) => {
        setPersona(p => ({ ...p, blocked_topics: p.blocked_topics.filter(t => t !== topic) }));
    };

    const handleTestAgent = async () => {
        if (!testInput.trim()) return;
        setTestLoading(true);
        setTestResponse('');
        try {
            // Simple preview — build the system prompt and show it
            const preview = buildSystemPromptPreview();
            setTestResponse(preview);
        } catch {
            setTestResponse('Failed to generate preview.');
        } finally {
            setTestLoading(false);
        }
    };

    const buildSystemPromptPreview = (): string => {
        const name = persona.agent_name || 'an AI assistant';
        const org = persona.organization_name || 'Karr AI Global';

        // Mirror the actual prompt structure from the chat route:
        // 1. Mode line (STRICT shown as default preview)
        let prompt = 'You are operating in STRICT MODE — only answer from the knowledge base.\n\n';

        // 2. Identity block (matches buildIdentityProtectionBlock output)
        prompt += '## 🔒 IDENTITY & SECURITY\n';
        prompt += `**IDENTITY**: You are ${name}`;
        if (persona.organization_name) prompt += ` at ${org}`;
        prompt += '.\n';
        prompt += `If asked "who made you?", respond: "I'm ${name}`;
        if (persona.organization_name) prompt += `, built by ${org}`;
        prompt += `. How can I help you?"\n\n`;

        // 3. KB rules (abbreviated for preview)
        prompt += '## ⚠️ KNOWLEDGE BASE ONLY\nOnly answer from the knowledge base context. Cite [Source N].\n\n';

        // 4. Role (if specified)
        if (persona.agent_role) {
            prompt += `## YOUR ROLE\nYour role is: ${persona.agent_role}.\n\n`;
        }

        // 5. Tone
        if (persona.tone) {
            const toneDesc = TONE_OPTIONS.find(t => t.value === persona.tone)?.desc || persona.tone;
            prompt += `## TONE\n${toneDesc}\n\n`;
        }

        // 6. Creator instructions
        if (persona.system_instructions) {
            prompt += `## CREATOR'S INSTRUCTIONS\n${persona.system_instructions}\n\n`;
        }

        // 7. Blocked topics
        if (persona.blocked_topics.length > 0) {
            prompt += `## ⛔ BLOCKED TOPICS (STRICT)\nYou MUST NEVER discuss: ${persona.blocked_topics.join(', ')}.\nIf asked, respond: "I'm not able to discuss that topic."\n\n`;
        }

        // 8. Fallback
        if (persona.fallback_message) {
            prompt += `## FALLBACK\nWhen you cannot answer, say: "${persona.fallback_message}"\n\n`;
        }

        return prompt || 'No persona configured yet. Fill in the fields above to define your agent.';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full py-20">
                <Loader2 className="w-6 h-6 animate-spin text-[#c4715b]" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-10 px-8">
            {/* Header */}
            <Link
                href={`/creator/products/${id}`}
                className="inline-flex items-center gap-1.5 text-[#8b8b8b] hover:text-[#2d2d2d] mb-6 text-[13px] transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to {productName || 'Product'}
            </Link>

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: productColor + '20' }}
                    >
                        <Brain className="w-5 h-5" style={{ color: productColor }} />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-[#2d2d2d]">Agent Persona</h1>
                        <p className="text-[13px] text-[#8b8b8b]">
                            Define who your AI agent is and how it behaves
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-50"
                    style={{ backgroundColor: productColor }}
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Persona'}
                </button>
            </div>

            {/* ===================== SECTION 1: Identity ===================== */}
            <div className="bg-white rounded-xl border border-[#e8e4df] p-6 mb-5">
                <div className="flex items-center gap-2 mb-5">
                    <Bot className="w-4.5 h-4.5" style={{ color: productColor }} />
                    <h2 className="text-[15px] font-semibold text-[#2d2d2d]">Identity</h2>
                    <span className="text-[11px] text-[#b5b0a9] ml-auto">Who is your agent?</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[13px] font-medium text-[#5a5a5a] mb-1.5">
                            Agent Name
                        </label>
                        <input
                            type="text"
                            value={persona.agent_name}
                            onChange={e => setPersona(p => ({ ...p, agent_name: e.target.value }))}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#e8e4df] focus:border-[#c4715b] focus:outline-none text-sm text-[#2d2d2d] placeholder-[#c0bbb5]"
                            placeholder='e.g. "Dr. TaxBot", "Maya", "Karr"'
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-medium text-[#5a5a5a] mb-1.5">
                            Role / Title
                        </label>
                        <input
                            type="text"
                            value={persona.agent_role}
                            onChange={e => setPersona(p => ({ ...p, agent_role: e.target.value }))}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#e8e4df] focus:border-[#c4715b] focus:outline-none text-sm text-[#2d2d2d] placeholder-[#c0bbb5]"
                            placeholder='e.g. "Senior Tax Consultant", "HR Assistant"'
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-[13px] font-medium text-[#5a5a5a] mb-1.5">
                        Organization Name
                    </label>
                    <input
                        type="text"
                        value={persona.organization_name}
                        onChange={e => setPersona(p => ({ ...p, organization_name: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#e8e4df] focus:border-[#c4715b] focus:outline-none text-sm text-[#2d2d2d] placeholder-[#c0bbb5]"
                        placeholder='e.g. "Shah & Associates", "MediCare Hospital", "TechCorps India"'
                    />
                </div>
            </div>

            {/* ===================== SECTION 2: Personality ===================== */}
            <div className="bg-white rounded-xl border border-[#e8e4df] p-6 mb-5">
                <div className="flex items-center gap-2 mb-5">
                    <Sparkles className="w-4.5 h-4.5" style={{ color: productColor }} />
                    <h2 className="text-[15px] font-semibold text-[#2d2d2d]">Personality & Tone</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {TONE_OPTIONS.map(tone => (
                        <button
                            key={tone.value}
                            onClick={() => setPersona(p => ({ ...p, tone: tone.value }))}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${persona.tone === tone.value
                                ? 'border-[#c4715b] bg-[#c4715b]/5'
                                : 'border-[#e8e4df] hover:border-[#d0ccc6]'
                                }`}
                        >
                            <div className="text-lg mb-1">{tone.emoji}</div>
                            <div className="text-[13px] font-medium text-[#2d2d2d]">{tone.label}</div>
                            <div className="text-[11px] text-[#8b8b8b] mt-0.5 leading-tight">{tone.desc}</div>
                        </button>
                    ))}
                </div>

                <div className="mt-5">
                    <label className="block text-[13px] font-medium text-[#5a5a5a] mb-1.5">
                        <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
                        Greeting Message
                    </label>
                    <textarea
                        value={persona.greeting_message}
                        onChange={e => setPersona(p => ({ ...p, greeting_message: e.target.value }))}
                        rows={2}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#e8e4df] focus:border-[#c4715b] focus:outline-none text-sm text-[#2d2d2d] placeholder-[#c0bbb5] resize-none"
                        placeholder='The first message your agent shows. e.g. "Namaste! I&#39;m Dr. TaxBot, your AI tax consultant. How can I help you today?"'
                    />
                    <p className="text-[11px] text-[#b5b0a9] mt-1">
                        Shown when a user first opens the chat. Leave empty for no greeting.
                    </p>
                </div>
            </div>

            {/* ===================== SECTION 3: System Instructions ===================== */}
            <div className="bg-white rounded-xl border border-[#e8e4df] p-6 mb-5">
                <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4.5 h-4.5" style={{ color: productColor }} />
                    <h2 className="text-[15px] font-semibold text-[#2d2d2d]">System Instructions</h2>
                </div>
                <p className="text-[13px] text-[#8b8b8b] mb-4">
                    The most important field — tell your agent exactly how to behave.
                    This is injected into every conversation.
                </p>

                <textarea
                    value={persona.system_instructions}
                    onChange={e => setPersona(p => ({ ...p, system_instructions: e.target.value }))}
                    rows={10}
                    className="w-full px-4 py-3 rounded-xl border border-[#e8e4df] focus:border-[#c4715b] focus:outline-none text-sm text-[#2d2d2d] placeholder-[#c0bbb5] font-mono leading-relaxed resize-y"
                    placeholder={`Example instructions:\n\nYou are a tax expert specializing in Indian Income Tax.\nAlways cite the specific section number when referencing tax law.\nIf asked about GST, redirect them to our GST product.\nNever give investment advice.\nAlways add a disclaimer that this is AI-generated and not legal advice.\nWhen explaining complex topics, use simple analogies.\nIf the user seems frustrated, be extra empathetic.\nRespond in the same language the user writes in.`}
                />

                <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-[12px] text-amber-700">
                        <strong>Pro tip:</strong> Be specific! "Be helpful" is too vague. "Always cite the section number,
                        use bullet points, and add a disclaimer" gives much better results.
                    </p>
                </div>
            </div>

            {/* ===================== SECTION 4: Guardrails ===================== */}
            <div className="bg-white rounded-xl border border-[#e8e4df] p-6 mb-5">
                <div className="flex items-center gap-2 mb-5">
                    <Shield className="w-4.5 h-4.5" style={{ color: productColor }} />
                    <h2 className="text-[15px] font-semibold text-[#2d2d2d]">Guardrails</h2>
                    <span className="text-[11px] text-[#b5b0a9] ml-auto">What the agent should NOT do</span>
                </div>

                {/* Blocked Topics */}
                <div className="mb-5">
                    <label className="block text-[13px] font-medium text-[#5a5a5a] mb-2">
                        Blocked Topics
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {persona.blocked_topics.map(topic => (
                            <span
                                key={topic}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-700 text-[12px] font-medium"
                            >
                                {topic}
                                <button onClick={() => removeBlockedTopic(topic)} className="hover:text-red-900" title={`Remove ${topic}`}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                        {persona.blocked_topics.length === 0 && (
                            <span className="text-[12px] text-[#b5b0a9]">No blocked topics yet</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newBlockedTopic}
                            onChange={e => setNewBlockedTopic(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBlockedTopic(); } }}
                            className="flex-1 px-3.5 py-2 rounded-lg border border-[#e8e4df] focus:border-[#c4715b] focus:outline-none text-sm placeholder-[#c0bbb5]"
                            placeholder="e.g. investment advice, competitor comparison..."
                        />
                        <button
                            onClick={addBlockedTopic}
                            disabled={!newBlockedTopic.trim()}
                            title="Add blocked topic"
                            className="px-3 py-2 rounded-lg border border-[#e8e4df] hover:border-[#c4715b] disabled:opacity-40 transition-colors"
                        >
                            <Plus className="w-4 h-4 text-[#5a5a5a]" />
                        </button>
                    </div>
                </div>

                {/* Fallback Message */}
                <div>
                    <label className="block text-[13px] font-medium text-[#5a5a5a] mb-1.5">
                        Fallback Message
                    </label>
                    <textarea
                        value={persona.fallback_message}
                        onChange={e => setPersona(p => ({ ...p, fallback_message: e.target.value }))}
                        rows={2}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#e8e4df] focus:border-[#c4715b] focus:outline-none text-sm text-[#2d2d2d] placeholder-[#c0bbb5] resize-none"
                        placeholder='When the agent can&#39;t answer. e.g. "I don&#39;t have this information. Please contact us at support@shah.com for further help."'
                    />
                </div>
            </div>

            {/* ===================== SECTION 5: Website Learning ===================== */}
            <div className="bg-white rounded-xl border border-[#e8e4df] p-6 mb-5">
                <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4.5 h-4.5" style={{ color: productColor }} />
                    <h2 className="text-[15px] font-semibold text-[#2d2d2d]">Website Learning</h2>
                </div>
                <p className="text-[13px] text-[#8b8b8b] mb-4">
                    Add your organization&apos;s websites. Your agent will crawl and learn from them &mdash;
                    team info, services, pricing, etc.
                </p>

                {/* Add Domain Input */}
                <div className="flex gap-2 mb-4">
                    <div className="flex flex-1">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[#e8e4df] bg-[#f4f1ed] text-[#8b8b8b] text-[13px]">
                            https://
                        </span>
                        <input
                            type="text"
                            value={newDomain}
                            onChange={e => setNewDomain(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddDomain()}
                            className="flex-1 px-3 py-2.5 rounded-r-lg border border-[#e8e4df] focus:border-[#c4715b] focus:outline-none text-sm"
                            placeholder="yourdomain.com"
                        />
                    </div>
                    <button
                        onClick={handleAddDomain}
                        disabled={addingDomain || !newDomain.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-[13px] font-medium transition-all disabled:opacity-50"
                        style={{ backgroundColor: productColor }}
                    >
                        {addingDomain ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Add
                    </button>
                </div>

                {/* Domain List */}
                {sourcesLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-[#c4715b]" />
                    </div>
                ) : trustedSources.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#e8e4df] p-6 text-center">
                        <Globe className="w-6 h-6 mx-auto text-[#c0bbb5] mb-2" />
                        <p className="text-[13px] text-[#8b8b8b]">
                            No websites added yet. Add a domain above to get started.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {trustedSources.map(source => (
                            <div
                                key={source.id}
                                className="flex items-center justify-between rounded-lg border border-[#e8e4df] bg-[#faf9f7] px-4 py-3"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Globe className="w-4 h-4 text-[#8b8b8b] flex-shrink-0" />
                                    <div className="min-w-0">
                                        <div className="text-[13px] font-medium text-[#2d2d2d] truncate">{source.domain}</div>
                                        <div className="flex items-center gap-2 text-[11px] text-[#8b8b8b]">
                                            {source.last_crawl_status === 'success' || source.total_pages_crawled > 0 ? (
                                                <span className="text-green-700">
                                                    ✅ {source.total_pages_crawled} pages
                                                    {source.last_crawled_at && (
                                                        <span className="text-[#b5b0a9] ml-1">
                                                            · {new Date(source.last_crawled_at).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </span>
                                            ) : source.last_crawl_status === 'error' ? (
                                                <span className="text-red-600">❌ Crawl failed</span>
                                            ) : crawlingSourceId === source.id ? (
                                                <span className="text-amber-700 flex items-center gap-1">
                                                    <Loader2 className="w-3 h-3 animate-spin" /> Crawling...
                                                </span>
                                            ) : (
                                                <span className="text-[#b5b0a9]">Ready to crawl</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                                    <button
                                        onClick={() => handleCrawlSource(source.id)}
                                        disabled={crawlingSourceId === source.id}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-[#8b8b8b] hover:text-[#2d2d2d] disabled:opacity-50"
                                        title={source.total_pages_crawled > 0 ? 'Re-crawl' : 'Crawl Now'}
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${crawlingSourceId === source.id ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSource(source.id, source.domain)}
                                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Remove domain"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <p className="text-[11px] text-[#b5b0a9] mt-3">
                    💡 This is different from your Knowledge Base. These websites give your agent
                    organizational context (who you are, what you do), while the KB provides deep domain expertise.
                </p>
            </div>

            {/* ===================== SECTION 6: Preview ===================== */}
            <div className="bg-white rounded-xl border border-[#e8e4df] p-6 mb-5">
                <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-4.5 h-4.5" style={{ color: productColor }} />
                    <h2 className="text-[15px] font-semibold text-[#2d2d2d]">System Prompt Preview</h2>
                    <span className="text-[11px] text-[#b5b0a9] ml-auto">
                        This is what gets injected into every AI conversation
                    </span>
                </div>

                <div className="bg-[#1a1a2e] rounded-xl p-5 font-mono text-[13px] text-green-300 leading-relaxed overflow-auto max-h-96 whitespace-pre-wrap">
                    {buildSystemPromptPreview() || (
                        <span className="text-gray-500">Configure the fields above to see the system prompt...</span>
                    )}
                </div>
            </div>

            {/* Bottom Save Bar */}
            <div className="sticky bottom-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-medium shadow-lg transition-all disabled:opacity-50 hover:shadow-xl"
                    style={{ backgroundColor: productColor }}
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Persona'}
                </button>
            </div>
        </div>
    );
}
