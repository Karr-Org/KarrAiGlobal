'use client';

import { useState, useEffect } from 'react';
import {
    Lightbulb,
    Users,
    TrendingUp,
    Check,
    X,
    ChevronDown,
    ChevronUp,
    Sparkles,
    FileText,
    AlertCircle,
    Clock,
    Loader2,
    Filter,
    ArrowUpRight,
    Eye
} from 'lucide-react';

interface Suggestion {
    id: string;
    topic: string;
    sample_content: string;
    detected_category: string | null;
    similarity_to_kb: number;
    uniqueness_score: number;
    occurrence_count: number;
    user_count: number;
    priority_score: number;
    status: string;
    created_at: string;
    source_user_name: string | null;
    source_document_id: string | null;
}

interface Summary {
    pending_count: number;
    approved_count: number;
    rejected_count: number;
    total_user_uploads: number;
    avg_uniqueness: number;
    max_priority: number;
}

export default function KnowledgeSuggestionsPage() {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [products, setProducts] = useState<any[]>([]);
    const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);

    // Approval Modal State
    const [approvingSuggestion, setApprovingSuggestion] = useState<any | null>(null);
    const [selectedTargetKBs, setSelectedTargetKBs] = useState<string[]>([]);

    // Modal state for viewing full document
    const [viewingDocument, setViewingDocument] = useState<{ topic: string; content: string; loading: boolean } | null>(null);

    // Load products on mount
    useEffect(() => {
        loadProducts();
    }, []);

    // Load suggestions when product changes
    useEffect(() => {
        if (selectedProduct) {
            loadSuggestions();
            loadKnowledgeBases();
        }
    }, [selectedProduct, statusFilter]);

    const loadProducts = async () => {
        try {
            const res = await fetch('/api/admin/products');
            const data = await res.json();
            if (data.products && data.products.length > 0) {
                setProducts(data.products);
                setSelectedProduct(data.products[0].id);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
        }
    };

    const loadKnowledgeBases = async () => {
        try {
            const res = await fetch(`/api/admin/knowledge-bases?productId=${selectedProduct}`);
            const data = await res.json();
            if (data.knowledgeBases) {
                setKnowledgeBases(data.knowledgeBases);
            }
        } catch (error) {
            console.error('Failed to load KBs:', error);
        }
    };

    const loadSuggestions = async () => {
        if (!selectedProduct) return;

        setLoading(true);
        try {
            const res = await fetch(
                `/api/admin/knowledge-suggestions?productId=${selectedProduct}&status=${statusFilter}`
            );
            const data = await res.json();

            if (data.success) {
                setSuggestions(data.suggestions || []);
                setSummary(data.summary || null);
            }
        } catch (error) {
            console.error('Failed to load suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const openApprovalModal = (suggestion: any) => {
        setApprovingSuggestion(suggestion);
        if (knowledgeBases.length > 0) {
            setSelectedTargetKBs([knowledgeBases[0].id]);
        } else {
            setSelectedTargetKBs([]);
        }
    };

    const toggleKB = (kbId: string) => {
        if (selectedTargetKBs.includes(kbId)) {
            setSelectedTargetKBs(selectedTargetKBs.filter(id => id !== kbId));
        } else {
            setSelectedTargetKBs([...selectedTargetKBs, kbId]);
        }
    };

    const handleConfirmApprove = async () => {
        if (!approvingSuggestion || selectedTargetKBs.length === 0) return;

        const suggestionId = approvingSuggestion.id;
        setProcessing(suggestionId);

        try {
            const body = {
                suggestionId,
                action: 'approve',
                adminId: 'admin',
                knowledgeBaseIds: selectedTargetKBs
            };

            const res = await fetch('/api/admin/knowledge-suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                await loadSuggestions();
                setApprovingSuggestion(null);
                setSelectedTargetKBs([]);
            } else {
                const errText = await res.text();
                console.error('Approval failed:', errText);
                alert(`Approval failed: ${errText}`);
            }
        } catch (error) {
            console.error('Action failed:', error);
            alert('Network error during approval');
        } finally {
            setProcessing(null);
        }
    };

    const handleAction = async (suggestionId: string, action: 'approve' | 'reject') => {
        // If approve, open modal instead of immediate action
        if (action === 'approve') {
            const suggestion = (suggestions as any[]).find(s => s.id === suggestionId);
            if (suggestion) {
                openApprovalModal(suggestion);
            }
            return;
        }

        setProcessing(suggestionId);

        try {
            const body: any = {
                suggestionId,
                action,
                adminId: 'admin',
            };

            const res = await fetch('/api/admin/knowledge-suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                // Refresh suggestions
                await loadSuggestions();
            }
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setProcessing(null);
        }
    };

    const getPriorityColor = (score: number) => {
        if (score >= 30) return 'text-red-600 bg-red-50';
        if (score >= 15) return 'text-orange-600 bg-orange-50';
        return 'text-blue-600 bg-blue-50';
    };

    const getUniquenessColor = (score: number) => {
        if (score >= 0.8) return 'text-emerald-600';
        if (score >= 0.5) return 'text-amber-600';
        return 'text-gray-600';
    };

    // Load full document content
    const viewFullDocument = async (suggestion: Suggestion) => {
        setViewingDocument({ topic: suggestion.topic, content: '', loading: true });

        try {
            // Fetch full document content from API
            const res = await fetch(`/api/admin/document-content?documentId=${suggestion.source_document_id}`);
            const data = await res.json();

            if (data.success && data.content) {
                setViewingDocument({ topic: suggestion.topic, content: data.content, loading: false });
            } else {
                // Fallback to sample content if full content not available
                setViewingDocument({
                    topic: suggestion.topic,
                    content: suggestion.sample_content || 'Full document content not available.',
                    loading: false
                });
            }
        } catch (error) {
            console.error('Failed to load document:', error);
            setViewingDocument({
                topic: suggestion.topic,
                content: suggestion.sample_content || 'Failed to load document content.',
                loading: false
            });
        }
    };

    return (
        <div className="lg:pl-64">
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <Lightbulb className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Knowledge Gap Intelligence</h1>
                            <p className="text-gray-500">User-contributed knowledge suggestions for your product KB</p>
                        </div>
                    </div>
                </div>

                {/* Product Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Product</label>
                    <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    >
                        {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{summary.pending_count}</p>
                                    <p className="text-sm text-gray-500">Pending Review</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <Check className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{summary.approved_count}</p>
                                    <p className="text-sm text-gray-500">Approved</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{summary.total_user_uploads || 0}</p>
                                    <p className="text-sm text-gray-500">User Uploads</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {summary.avg_uniqueness ? `${(summary.avg_uniqueness * 100).toFixed(0)}%` : '-'}
                                    </p>
                                    <p className="text-sm text-gray-500">Avg Uniqueness</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 mb-6">
                    <Filter className="w-4 h-4 text-gray-400" />
                    {['pending', 'approved', 'rejected', 'all'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Suggestions List */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
                            <p className="text-gray-500">Loading suggestions...</p>
                        </div>
                    ) : suggestions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Suggestions Yet</h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                When users upload documents that contain knowledge not in your product KB,
                                suggestions will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {suggestions.map((suggestion) => (
                                <div key={suggestion.id} className="hover:bg-gray-50 transition-colors">
                                    {/* Main Row */}
                                    <div className="p-5 flex items-center gap-4">
                                        {/* Priority Badge */}
                                        <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${getPriorityColor(suggestion.priority_score)}`}>
                                            P{suggestion.priority_score.toFixed(0)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {suggestion.topic}
                                                </h3>
                                                {suggestion.detected_category && (
                                                    <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
                                                        {suggestion.detected_category}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3.5 h-3.5" />
                                                    {suggestion.occurrence_count} user{suggestion.occurrence_count !== 1 ? 's' : ''}
                                                </span>
                                                <span className={`flex items-center gap-1 ${getUniquenessColor(suggestion.uniqueness_score)}`}>
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    {(suggestion.uniqueness_score * 100).toFixed(0)}% unique
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(suggestion.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {suggestion.status === 'pending' && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleAction(suggestion.id, 'approve')}
                                                    disabled={processing === suggestion.id}
                                                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {processing === suggestion.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Check className="w-4 h-4" />
                                                    )}
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleAction(suggestion.id, 'reject')}
                                                    disabled={processing === suggestion.id}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Reject
                                                </button>
                                            </div>
                                        )}

                                        {suggestion.status !== 'pending' && (
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${suggestion.status === 'approved'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)}
                                            </span>
                                        )}

                                        {/* Expand Toggle */}
                                        <button
                                            onClick={() => setExpandedId(expandedId === suggestion.id ? null : suggestion.id)}
                                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            {expandedId === suggestion.id ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Expanded Content - Document Preview */}
                                    {expandedId === suggestion.id && (
                                        <div className="px-5 pb-5 pt-2 bg-gray-50 border-t border-gray-100">
                                            {/* Document Content Preview - Full Width */}
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                        <FileText className="w-4 h-4" />
                                                        Document Content Preview
                                                    </h4>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-gray-500">
                                                            {suggestion.sample_content ? `${suggestion.sample_content.length} characters (preview)` : 'No content'}
                                                        </span>
                                                        {suggestion.source_document_id && (
                                                            <button
                                                                onClick={() => viewFullDocument(suggestion)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors font-medium"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                View Full Document
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm text-gray-700 max-h-64 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
                                                    {suggestion.sample_content || 'No content preview available. The document might have failed to extract text properly.'}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                {/* Gap Analysis */}
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Gap Analysis</h4>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-500">Similarity to KB</span>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-violet-500 rounded-full"
                                                                        style={{ width: `${(suggestion.similarity_to_kb || 0) * 100}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    {((suggestion.similarity_to_kb || 0) * 100).toFixed(0)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-500">Uniqueness</span>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-emerald-500 rounded-full"
                                                                        style={{ width: `${(suggestion.uniqueness_score || 0) * 100}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    {((suggestion.uniqueness_score || 0) * 100).toFixed(0)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-500">Priority Score</span>
                                                            <span className={`text-sm font-bold ${getPriorityColor(suggestion.priority_score)} px-2 py-0.5 rounded`}>
                                                                {suggestion.priority_score.toFixed(1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Recommendation */}
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Recommendation</h4>
                                                    <div className={`p-3 rounded-lg ${suggestion.uniqueness_score >= 0.7 ? 'bg-green-50 border border-green-200' : suggestion.uniqueness_score >= 0.4 ? 'bg-amber-50 border border-amber-200' : 'bg-gray-100 border border-gray-200'}`}>
                                                        <p className={`text-sm ${suggestion.uniqueness_score >= 0.7 ? 'text-green-700' : suggestion.uniqueness_score >= 0.4 ? 'text-amber-700' : 'text-gray-600'}`}>
                                                            {suggestion.uniqueness_score >= 0.7
                                                                ? '✅ Highly recommended to add. This content is unique and would fill a gap in your knowledge base.'
                                                                : suggestion.uniqueness_score >= 0.4
                                                                    ? '⚠️ Consider adding. Some overlap with existing content, but has unique aspects.'
                                                                    : '❓ Low uniqueness. Similar content may already exist in your KB.'}
                                                        </p>
                                                    </div>

                                                    {suggestion.source_user_name && (
                                                        <div className="mt-4 pt-3 border-t border-gray-200">
                                                            <span className="text-sm text-gray-500">First uploaded by: </span>
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {suggestion.source_user_name}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* Help Text */}
                <div className="mt-6 p-4 bg-violet-50 rounded-xl border border-violet-200">
                    <div className="flex items-start gap-3">
                        <ArrowUpRight className="w-5 h-5 text-violet-600 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-violet-900 mb-1">How it works</h4>
                            <p className="text-sm text-violet-700">
                                When users upload documents to their personal library, the system analyzes if the content
                                already exists in your product knowledge base. If not, it creates a suggestion here with
                                a priority score based on uniqueness and how many users uploaded similar content.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Approval Modal */}
            {approvingSuggestion && (
                <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Approve Suggestion</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Add this content to your product knowledge base.
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center">
                                <Check className="w-6 h-6 text-violet-600" />
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Target Knowledge Base
                                </label>
                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto">
                                    {knowledgeBases.map(kb => (
                                        <label key={kb.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedTargetKBs.includes(kb.id)}
                                                onChange={() => toggleKB(kb.id)}
                                                className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                                            />
                                            <span className="text-sm text-gray-700">{kb.name}</span>
                                        </label>
                                    ))}
                                    {knowledgeBases.length === 0 && (
                                        <div className="p-4 text-sm text-gray-500 text-center">No Knowledge Bases found.</div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 ml-1">
                                    The document will be added to selected knowledge bases.
                                </p>
                            </div>

                            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Document to Add</span>
                                    {approvingSuggestion.source_document_id && (
                                        <button
                                            onClick={() => viewFullDocument(approvingSuggestion)}
                                            className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1 hover:underline"
                                        >
                                            <Eye className="w-3 h-3" />
                                            View Content
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 bg-violet-50 rounded-lg shrink-0">
                                        <FileText className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 line-clamp-1" title={approvingSuggestion.topic}>
                                            {approvingSuggestion.topic}
                                        </p>
                                        <p className="text-gray-500 text-xs mt-0.5">
                                            {(approvingSuggestion.sample_content?.length || 0).toLocaleString()} characters • Uploaded by users
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 rounded-b-2xl border-t border-gray-100 flex justify-between items-center">
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to reject this suggestion? It will be removed from the list.')) {
                                        handleAction(approvingSuggestion.id, 'reject');
                                        setApprovingSuggestion(null);
                                    }
                                }}
                                className="text-red-600 hover:text-red-700 text-sm font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Reject & Delete
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setApprovingSuggestion(null)}
                                    className="px-5 py-2.5 text-gray-600 hover:text-gray-900 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmApprove}
                                    disabled={selectedTargetKBs.length === 0 || processing === approvingSuggestion.id}
                                    className="px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 font-medium shadow-lg shadow-violet-200 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 transform active:scale-95 transition-all"
                                >
                                    {processing === approvingSuggestion.id ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Confirm Approval
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Document Viewer Modal */}
            {viewingDocument && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-violet-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">{viewingDocument.topic}</h2>
                                    <p className="text-sm text-gray-500">Full Document Content</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingDocument(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-5">
                            {viewingDocument.loading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-4" />
                                    <p className="text-gray-500">Loading document content...</p>
                                </div>
                            ) : (
                                <div className="prose prose-sm max-w-none">
                                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed overflow-x-auto">
                                        {viewingDocument.content}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    {viewingDocument.content ? `${viewingDocument.content.length.toLocaleString()} characters` : ''}
                                </span>
                                <button
                                    onClick={() => setViewingDocument(null)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
