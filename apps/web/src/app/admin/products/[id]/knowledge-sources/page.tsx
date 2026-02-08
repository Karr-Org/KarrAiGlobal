'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Plus,
    FileText,
    Code,
    Globe,
    Check,
    X,
    Trash2,
    ChevronRight,
    Zap,
    Database,
    Eye,
    RefreshCw
} from 'lucide-react';

interface KnowledgeSource {
    id: string;
    product_id: string;
    source_type: 'internal_documents' | 'external_api' | 'trusted_web';
    name: string;
    description: string | null;
    icon_emoji: string;
    config: Record<string, any>;
    trust_level: number;
    priority: number;
    is_active: boolean;
    created_at: string;
    cached_entries?: number;
    total_hits?: number;
    last_fetch?: string;
}

interface ApiIntegration {
    id: string;
    name: string;
    description: string;
    category: string;
    icon_emoji: string;
    base_url: string;
    auth_type: string;
    requires_user_key: boolean;
    config_schema: Record<string, any>;
    default_config: Record<string, any>;
}

export default function KnowledgeSourcesPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    const [sources, setSources] = useState<KnowledgeSource[]>([]);
    const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<ApiIntegration | null>(null);
    const [saving, setSaving] = useState(false);
    const [crawlingSourceId, setCrawlingSourceId] = useState<string | null>(null);

    const [formType, setFormType] = useState<'api' | 'web'>('api');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        apiKey: '',
        domains: '',
        trustLevel: 80,
        searchProvider: 'custom' as 'custom' | 'tavily' | 'google_pse',
        searchEntireWeb: false, // Default to domain-restricted (since custom scraper is domain-based)
    });

    useEffect(() => {
        fetchSources();
        fetchIntegrations();
    }, [productId]);

    async function fetchSources() {
        try {
            const res = await fetch(`/api/admin/knowledge-sources?productId=${productId}`);
            const data = await res.json();
            if (data.sources) setSources(data.sources);
        } catch (error) {
            console.error('Failed to fetch sources:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchIntegrations() {
        try {
            const res = await fetch('/api/admin/api-integrations');
            const data = await res.json();
            if (data.integrations) setIntegrations(data.integrations);
        } catch (error) {
            console.error('Failed to fetch integrations:', error);
        }
    }

    async function toggleSource(sourceId: string, isActive: boolean) {
        try {
            await fetch('/api/admin/knowledge-sources', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceId, isActive }),
            });
            setSources(sources.map(s =>
                s.id === sourceId ? { ...s, is_active: isActive } : s
            ));
        } catch (error) {
            console.error('Failed to toggle source:', error);
        }
    }

    async function addApiSource() {
        if (!selectedIntegration) return;
        setSaving(true);

        try {
            const res = await fetch('/api/admin/knowledge-sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    sourceType: 'external_api',
                    name: formData.name || selectedIntegration.name,
                    description: formData.description || selectedIntegration.description,
                    iconEmoji: selectedIntegration.icon_emoji,
                    trustLevel: formData.trustLevel,
                    config: {
                        provider: selectedIntegration.id,
                        api_key: formData.apiKey,
                        ...selectedIntegration.default_config,
                    },
                }),
            });

            if (res.ok) {
                closeModal();
                fetchSources();
            }
        } catch (error) {
            console.error('Failed to add source:', error);
        } finally {
            setSaving(false);
        }
    }

    async function addWebSource() {
        // Custom scraper requires domains
        const domains = formData.domains.split(',').map(d => d.trim()).filter(Boolean);
        if (domains.length === 0) {
            return;
        }
        setSaving(true);

        try {
            const name = formData.name || `Trusted Websites (${domains.length} domains)`;
            const description = formData.description || `Live web search from ${domains.join(', ')}`;

            const res = await fetch('/api/admin/knowledge-sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    sourceType: 'trusted_web',
                    name,
                    description,
                    iconEmoji: '🌐',
                    trustLevel: formData.trustLevel,
                    config: {
                        allowed_domains: domains,
                        search_provider: 'custom', // Karr AI Smart Scraper
                        max_results: 5,
                    },
                }),
            });

            if (res.ok) {
                closeModal();
                fetchSources();
            }
        } catch (error) {
            console.error('Failed to add web source:', error);
        } finally {
            setSaving(false);
        }
    }

    async function deleteSource(sourceId: string) {
        if (!confirm('Are you sure you want to delete this source?')) return;

        try {
            await fetch('/api/admin/knowledge-sources', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceId }),
            });
            setSources(sources.filter(s => s.id !== sourceId));
        } catch (error) {
            console.error('Failed to delete source:', error);
        }
    }

    async function crawlSource(sourceId: string) {
        setCrawlingSourceId(sourceId);
        try {
            const res = await fetch('/api/okse/crawler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source_id: sourceId }),
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ Crawl complete! ${data.result?.pages_crawled || 0} pages processed.`);
                fetchSources(); // Refresh to show updated stats
            } else {
                alert(`❌ Crawl failed: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to crawl source:', error);
            alert('Failed to start crawl. Check console for details.');
        } finally {
            setCrawlingSourceId(null);
        }
    }

    function closeModal() {
        setShowAddModal(false);
        setSelectedIntegration(null);
        setFormData({
            name: '',
            description: '',
            apiKey: '',
            domains: '',
            trustLevel: 80,
            searchProvider: 'custom',
            searchEntireWeb: false,
        });
    }

    const getSourceIcon = (type: string) => {
        switch (type) {
            case 'internal_documents':
                return <FileText className="w-5 h-5 text-violet-600" />;
            case 'external_api':
                return <Code className="w-5 h-5 text-blue-600" />;
            case 'trusted_web':
                return <Globe className="w-5 h-5 text-emerald-600" />;
            default:
                return <Database className="w-5 h-5 text-sand-500" />;
        }
    };

    const getSourceBg = (type: string) => {
        switch (type) {
            case 'internal_documents': return 'bg-violet-50';
            case 'external_api': return 'bg-blue-50';
            case 'trusted_web': return 'bg-emerald-50';
            default: return 'bg-sand-100';
        }
    };

    const getSourceLabel = (type: string) => {
        switch (type) {
            case 'internal_documents': return { text: 'Internal', color: 'text-violet-700 bg-violet-50 border-violet-100' };
            case 'external_api': return { text: 'API', color: 'text-blue-700 bg-blue-50 border-blue-100' };
            case 'trusted_web': return { text: 'Web', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
            default: return { text: 'Unknown', color: 'text-sand-600 bg-sand-100 border-sand-200' };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-6 h-6 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    const activeSources = sources.filter(s => s.is_active).length;
    const totalCached = sources.reduce((sum, s) => sum + (s.cached_entries || 0), 0);
    const totalHits = sources.reduce((sum, s) => sum + (s.total_hits || 0), 0);

    return (
        <div className="max-w-4xl mx-auto px-6 py-10">
            {/* Header */}
            <div className="mb-10">
                <Link
                    href="/admin/products"
                    className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-sand-700 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Products
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-sand-900 mb-2">Knowledge Sources</h1>
                        <p className="text-sand-500">Configure where your AI retrieves knowledge from.</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-sand-800 hover:bg-sand-900 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Source
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-sand-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <div className="text-xl font-semibold text-sand-900">{activeSources}</div>
                            <div className="text-xs text-sand-500">Active Sources</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-sand-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Database className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-xl font-semibold text-sand-900">{totalCached.toLocaleString()}</div>
                            <div className="text-xs text-sand-500">Cached Entries</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-sand-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Eye className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-xl font-semibold text-sand-900">{totalHits.toLocaleString()}</div>
                            <div className="text-xs text-sand-500">Queries Served</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sources List */}
            <div className="space-y-3">
                {sources.map((source) => {
                    const label = getSourceLabel(source.source_type);
                    return (
                        <div
                            key={source.id}
                            className={`group bg-white rounded-xl border transition-all duration-200 ${source.is_active
                                ? 'border-sand-200 hover:border-sand-300'
                                : 'border-sand-100 opacity-60'
                                }`}
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    {/* Left */}
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getSourceBg(source.source_type)}`}>
                                            {getSourceIcon(source.source_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-[15px] font-medium text-sand-900">{source.name}</h3>
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${label.color}`}>
                                                    {label.text}
                                                </span>
                                            </div>
                                            <p className="text-sm text-sand-500 mb-3">
                                                {source.description || 'No description'}
                                            </p>

                                            {/* Trust Level */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="text-xs text-sand-500">Trust</span>
                                                <div className="flex-1 max-w-[120px] h-1.5 bg-sand-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${source.trust_level >= 80 ? 'bg-emerald-500' :
                                                            source.trust_level >= 60 ? 'bg-blue-500' :
                                                                source.trust_level >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${source.trust_level}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-sand-700">{source.trust_level}%</span>
                                            </div>

                                            {/* Domains for Web Source */}
                                            {source.source_type === 'trusted_web' && source.config?.allowed_domains && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {source.config.allowed_domains.slice(0, 4).map((domain: string) => (
                                                        <span
                                                            key={domain}
                                                            className="px-2 py-1 bg-sand-50 border border-sand-100 rounded-md text-xs text-sand-600"
                                                        >
                                                            {domain}
                                                        </span>
                                                    ))}
                                                    {source.config.allowed_domains.length > 4 && (
                                                        <span className="px-2 py-1 text-xs text-sand-500">
                                                            +{source.config.allowed_domains.length - 4} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* API Provider Info */}
                                            {source.source_type === 'external_api' && source.config?.provider && (
                                                <div className="text-xs text-sand-500">
                                                    Provider: <span className="text-sand-700">{source.config.provider}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2">
                                        {source.source_type !== 'internal_documents' ? (
                                            <>
                                                <button
                                                    onClick={() => toggleSource(source.id, !source.is_active)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${source.is_active
                                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                        : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
                                                        }`}
                                                >
                                                    {source.is_active ? (
                                                        <>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-sand-400"></span>
                                                            Inactive
                                                        </>
                                                    )}
                                                </button>
                                                {source.source_type === 'trusted_web' && (
                                                    <button
                                                        onClick={() => crawlSource(source.id)}
                                                        disabled={crawlingSourceId === source.id}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                                        title="Crawl Now"
                                                    >
                                                        <RefreshCw className={`w-3.5 h-3.5 ${crawlingSourceId === source.id ? 'animate-spin' : ''}`} />
                                                        {crawlingSourceId === source.id ? 'Crawling...' : 'Crawl'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteSource(source.id)}
                                                    className="p-1.5 text-sand-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-xs font-medium">
                                                <Check className="w-3.5 h-3.5" />
                                                Always Active
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {sources.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-sand-200">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-sand-100 flex items-center justify-center">
                        <Database className="w-6 h-6 text-sand-400" />
                    </div>
                    <h3 className="text-lg font-medium text-sand-800 mb-2">No knowledge sources</h3>
                    <p className="text-sand-500 mb-6">Add APIs or trusted websites to expand your AI's knowledge</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-sand-800 hover:bg-sand-900 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Source
                    </button>
                </div>
            )}

            {/* Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto border border-sand-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-sand-100">
                            <h2 className="text-lg font-semibold text-sand-900">Add Knowledge Source</h2>
                            <button
                                onClick={closeModal}
                                className="p-1.5 text-sand-400 hover:text-sand-600 hover:bg-sand-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Tabs */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => { setFormType('api'); setSelectedIntegration(null); }}
                                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${formType === 'api'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                        : 'bg-sand-50 text-sand-600 border border-sand-100 hover:bg-sand-100'
                                        }`}
                                >
                                    <Code className="w-4 h-4 inline mr-2" />
                                    External API
                                </button>
                                <button
                                    onClick={() => { setFormType('web'); setSelectedIntegration(null); }}
                                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${formType === 'web'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : 'bg-sand-50 text-sand-600 border border-sand-100 hover:bg-sand-100'
                                        }`}
                                >
                                    <Globe className="w-4 h-4 inline mr-2" />
                                    Trusted Web
                                </button>
                            </div>

                            {/* API Selection */}
                            {formType === 'api' && !selectedIntegration && (
                                <div className="space-y-2">
                                    <p className="text-sm text-sand-600 mb-4">Select an integration:</p>
                                    {integrations.map((integration) => (
                                        <button
                                            key={integration.id}
                                            onClick={() => setSelectedIntegration(integration)}
                                            className="w-full p-4 bg-sand-50 hover:bg-sand-100 rounded-xl border border-sand-100 text-left transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{integration.icon_emoji}</span>
                                                <div className="flex-1">
                                                    <div className="font-medium text-sand-800">{integration.name}</div>
                                                    <div className="text-sm text-sand-500">{integration.description}</div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-sand-400" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* API Config Form */}
                            {formType === 'api' && selectedIntegration && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <span className="text-2xl">{selectedIntegration.icon_emoji}</span>
                                        <div>
                                            <div className="font-medium text-sand-800">{selectedIntegration.name}</div>
                                            <div className="text-sm text-sand-500">{selectedIntegration.category}</div>
                                        </div>
                                    </div>

                                    {selectedIntegration.requires_user_key && (
                                        <div>
                                            <label className="block text-sm font-medium text-sand-700 mb-1.5">API Key</label>
                                            <input
                                                type="password"
                                                value={formData.apiKey}
                                                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white border border-sand-200 rounded-xl text-sand-800 placeholder-sand-400 focus:outline-none focus:border-sand-300 focus:ring-1 focus:ring-sand-200"
                                                placeholder="Enter your API key"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-sand-700 mb-1.5">Display Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-sand-200 rounded-xl text-sand-800 placeholder-sand-400 focus:outline-none focus:border-sand-300 focus:ring-1 focus:ring-sand-200"
                                            placeholder={selectedIntegration.name}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-sand-700 mb-1.5">
                                            Trust Level: {formData.trustLevel}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={formData.trustLevel}
                                            onChange={(e) => setFormData({ ...formData, trustLevel: parseInt(e.target.value) })}
                                            className="w-full accent-blue-600"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => setSelectedIntegration(null)}
                                            className="px-4 py-2.5 bg-sand-100 text-sand-700 rounded-xl text-sm font-medium hover:bg-sand-200 transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={addApiSource}
                                            disabled={selectedIntegration.requires_user_key && !formData.apiKey || saving}
                                            className="flex-1 px-4 py-2.5 bg-sand-800 text-white rounded-xl text-sm font-medium hover:bg-sand-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {saving ? 'Adding...' : 'Add Source'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Web Source Form - Uses Karr AI Custom Scraper */}
                            {formType === 'web' && (
                                <div className="space-y-4">
                                    {/* Info Banner */}
                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <div className="flex items-start gap-2">
                                            <span className="text-emerald-500 mt-0.5">✨</span>
                                            <div className="text-xs text-emerald-700">
                                                <strong>Powered by Karr AI Smart Scraper</strong>
                                                <p className="mt-0.5 text-emerald-600">
                                                    Free, unlimited live web search from your trusted domains. No API costs!
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Domain input - Required */}
                                    <div>
                                        <label className="block text-sm font-medium text-sand-700 mb-1.5">
                                            Trusted Domains <span className="text-red-400">*</span>
                                        </label>
                                        <textarea
                                            value={formData.domains}
                                            onChange={(e) => setFormData({ ...formData, domains: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-sand-200 rounded-xl text-sand-800 placeholder-sand-400 focus:outline-none focus:border-sand-300 focus:ring-1 focus:ring-sand-200 h-24 resize-none"
                                            placeholder="cleartax.in, gst.gov.in, cbic-gst.gov.in, incometax.gov.in"
                                        />
                                        <p className="text-xs text-sand-500 mt-1.5">
                                            Enter domains separated by commas. These sites will be scraped in real-time when users ask questions.
                                        </p>
                                    </div>

                                    {/* Source Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-sand-700 mb-1.5">Source Name (Optional)</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-sand-200 rounded-xl text-sand-800 placeholder-sand-400 focus:outline-none focus:border-sand-300 focus:ring-1 focus:ring-sand-200"
                                            placeholder="e.g., Government Tax Portals"
                                        />
                                    </div>

                                    {/* Trust Level */}
                                    <div>
                                        <label className="block text-sm font-medium text-sand-700 mb-1.5">
                                            Trust Level: {formData.trustLevel}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={formData.trustLevel}
                                            onChange={(e) => setFormData({ ...formData, trustLevel: parseInt(e.target.value) })}
                                            className="w-full accent-emerald-600"
                                        />
                                        <p className="text-xs text-sand-500 mt-1">
                                            Official/government sites can have higher trust levels than blogs.
                                        </p>
                                    </div>

                                    {/* Features List */}
                                    <div className="p-3 bg-sand-50 rounded-xl border border-sand-100">
                                        <p className="text-xs font-medium text-sand-700 mb-2">What this enables:</p>
                                        <ul className="text-xs text-sand-600 space-y-1">
                                            <li className="flex items-center gap-2">
                                                <span className="text-emerald-500">✓</span>
                                                Real-time live search when answering questions
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-emerald-500">✓</span>
                                                Automatic content extraction (no manual uploads)
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-emerald-500">✓</span>
                                                Smart caching for faster responses
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-emerald-500">✓</span>
                                                Citations with direct links to sources
                                            </li>
                                        </ul>
                                    </div>

                                    <button
                                        onClick={addWebSource}
                                        disabled={!formData.domains.trim() || saving}
                                        className="w-full px-4 py-2.5 bg-sand-800 text-white rounded-xl text-sm font-medium hover:bg-sand-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {saving ? 'Adding...' : 'Add Trusted Websites'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
