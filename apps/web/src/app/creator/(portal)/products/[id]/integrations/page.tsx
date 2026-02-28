'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Loader2,
    Check,
    X,
    Plug,
    Zap,
    TestTube,
    ToggleLeft,
    ToggleRight,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    Link as LinkIcon,
    Key,
    Settings,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ToolFormData {
    id?: string;
    tool_name: string;
    display_name: string;
    description: string;
    icon_emoji: string;
    api_endpoint: string;
    http_method: 'GET' | 'POST';
    auth_type: 'none' | 'bearer' | 'header' | 'query_param';
    api_key: string; // plaintext, encrypted server-side
    auth_header_name: string;
    auth_query_param: string;
    parameters: ParamRow[];
    response_config: {
        results_path: string;
        title_field: string;
        content_field: string;
        url_field: string;
        max_results: number;
    };
    is_active: boolean;
}

interface ParamRow {
    name: string;
    type: 'STRING' | 'INTEGER' | 'BOOLEAN';
    description: string;
    required: boolean;
}

interface ToolRecord {
    id: string;
    tool_name: string;
    display_name: string;
    description: string;
    icon_emoji: string;
    api_endpoint: string;
    http_method: string;
    auth_type: string;
    is_active: boolean;
    last_tested_at: string | null;
    last_test_status: string | null;
    created_at: string;
    parameters_schema: Record<string, unknown>;
    response_config: Record<string, unknown>;
    request_config: Record<string, unknown>;
}

const DEFAULT_FORM: ToolFormData = {
    tool_name: '',
    display_name: '',
    description: '',
    icon_emoji: '🔌',
    api_endpoint: '',
    http_method: 'GET',
    auth_type: 'none',
    api_key: '',
    auth_header_name: 'Authorization',
    auth_query_param: 'api_key',
    parameters: [{ name: 'query', type: 'STRING', description: 'The search query', required: true }],
    response_config: {
        results_path: '',
        title_field: '',
        content_field: '',
        url_field: '',
        max_results: 5,
    },
    is_active: true,
};

const AUTH_OPTIONS = [
    { value: 'none', label: 'No Auth', desc: 'API is public' },
    { value: 'bearer', label: 'Bearer Token', desc: 'Authorization: Bearer xxx' },
    { value: 'header', label: 'Custom Header', desc: 'e.g. X-API-Key: xxx' },
    { value: 'query_param', label: 'Query Parameter', desc: 'e.g. ?api_key=xxx' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function IntegrationsPage() {
    const { id: productId } = useParams();
    const [tools, setTools] = useState<ToolRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [productName, setProductName] = useState('');
    const [productColor, setProductColor] = useState('#c4715b');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<ToolFormData>(DEFAULT_FORM);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [expandedTool, setExpandedTool] = useState<string | null>(null);

    // Test state
    const [testing, setTesting] = useState(false);
    const [testParams, setTestParams] = useState<Record<string, string>>({});
    const [testResult, setTestResult] = useState<{
        success: boolean;
        status_code: number;
        response_time_ms: number;
        raw_response: any; // eslint-disable-line @typescript-eslint/no-explicit-any
        extracted_results: { title: string | null; content: string; url: string | null }[];
        is_json: boolean;
        error_message: string | null;
    } | null>(null);
    const [showRawJson, setShowRawJson] = useState(false);

    useEffect(() => {
        loadData();
    }, [productId]);

    const loadData = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Load product name
            const prodRes = await fetch(`/api/creator/products?userId=${user.id}`);
            const products = await prodRes.json();
            const product = products.find((p: any) => p.id === productId);
            if (product) {
                setProductName(product.name);
                setProductColor(product.primary_color || '#c4715b');
            }

            // Load tools
            const toolsRes = await fetch(`/api/creator/product-tools?product_id=${productId}`);
            const data = await toolsRes.json();
            setTools(data.tools || []);
        } catch (err) {
            console.error('Failed to load:', err);
        } finally {
            setLoading(false);
        }
    };

    const autoSlug = (displayName: string) => {
        return displayName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 40);
    };

    const handleSave = async () => {
        setError('');
        if (!form.display_name.trim() || !form.description.trim() || !form.api_endpoint.trim()) {
            setError('Display name, description, and API endpoint are required.');
            return;
        }
        if (!form.tool_name.trim()) {
            setError('Tool name is required.');
            return;
        }

        setSaving(true);
        try {
            // Build parameters_schema from the rows
            const properties: Record<string, unknown> = {};
            const required: string[] = [];
            for (const p of form.parameters) {
                if (!p.name.trim()) continue;
                properties[p.name] = { type: p.type, description: p.description };
                if (p.required) required.push(p.name);
            }

            const body = {
                id: form.id || undefined,
                product_id: productId,
                tool_name: form.tool_name,
                display_name: form.display_name,
                description: form.description,
                icon_emoji: form.icon_emoji,
                api_endpoint: form.api_endpoint,
                http_method: form.http_method,
                auth_type: form.auth_type,
                api_key: form.api_key || undefined,
                auth_header_name: form.auth_header_name,
                auth_query_param: form.auth_query_param,
                parameters_schema: { type: 'OBJECT', properties, required },
                response_config: form.response_config,
                is_active: form.is_active,
            };

            const res = await fetch('/api/creator/product-tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            setShowForm(false);
            setForm(DEFAULT_FORM);
            loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (toolId: string, currentActive: boolean) => {
        try {
            await fetch(`/api/creator/product-tools?id=${toolId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentActive }),
            });
            setTools(prev => prev.map(t => t.id === toolId ? { ...t, is_active: !currentActive } : t));
        } catch (err) {
            console.error('Toggle failed:', err);
        }
    };

    const handleDelete = async (toolId: string) => {
        if (!confirm('Delete this API tool? This cannot be undone.')) return;
        try {
            await fetch(`/api/creator/product-tools?id=${toolId}`, { method: 'DELETE' });
            setTools(prev => prev.filter(t => t.id !== toolId));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handleEdit = (tool: ToolRecord) => {
        // Reconstruct the form from the DB record
        const schema = tool.parameters_schema as any;
        const params: ParamRow[] = [];
        if (schema?.properties) {
            for (const [name, def] of Object.entries(schema.properties)) {
                const d = def as any;
                params.push({
                    name,
                    type: d.type || 'STRING',
                    description: d.description || '',
                    required: (schema.required || []).includes(name),
                });
            }
        }
        if (params.length === 0) {
            params.push({ name: 'query', type: 'STRING', description: 'The search query', required: true });
        }

        const rc = tool.response_config as any;
        setForm({
            id: tool.id,
            tool_name: tool.tool_name,
            display_name: tool.display_name,
            description: tool.description,
            icon_emoji: tool.icon_emoji || '🔌',
            api_endpoint: tool.api_endpoint,
            http_method: tool.http_method as 'GET' | 'POST',
            auth_type: tool.auth_type as any,
            api_key: '', // Never prefilled — user must re-enter to change
            auth_header_name: 'Authorization',
            auth_query_param: 'api_key',
            parameters: params,
            response_config: {
                results_path: rc?.results_path || '',
                title_field: rc?.title_field || '',
                content_field: rc?.content_field || '',
                url_field: rc?.url_field || '',
                max_results: rc?.max_results || 5,
            },
            is_active: tool.is_active,
        });
        setShowForm(true);
    };

    const addParamRow = () => {
        setForm(f => ({ ...f, parameters: [...f.parameters, { name: '', type: 'STRING', description: '', required: false }] }));
    };

    const removeParamRow = (i: number) => {
        setForm(f => ({ ...f, parameters: f.parameters.filter((_, idx) => idx !== i) }));
    };

    const updateParam = (i: number, field: keyof ParamRow, value: string | boolean) => {
        setForm(f => ({
            ...f,
            parameters: f.parameters.map((p, idx) => idx === i ? { ...p, [field]: value } : p),
        }));
    };

    const handleTest = async () => {
        setError('');
        if (!form.api_endpoint.trim()) {
            setError('API endpoint is required to test.');
            return;
        }
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/creator/product-tools/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: productId,
                    tool_id: form.id || undefined,
                    api_endpoint: form.api_endpoint,
                    http_method: form.http_method,
                    auth_type: form.auth_type,
                    api_key: form.api_key || undefined,
                    auth_header_name: form.auth_header_name,
                    auth_query_param: form.auth_query_param,
                    parameters_schema: undefined,
                    response_config: form.response_config,
                    request_config: undefined,
                    test_params: testParams,
                }),
            });
            const data = await res.json();
            setTestResult(data);
        } catch (err: any) {
            setTestResult({
                success: false,
                status_code: 0,
                response_time_ms: 0,
                raw_response: null,
                extracted_results: [],
                is_json: false,
                error_message: err.message || 'Network error',
            });
        } finally {
            setTesting(false);
        }
    };

    // ============================================================================
    // RENDER
    // ============================================================================

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
                href={`/creator/products/${productId}`}
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
                        <Plug className="w-5 h-5" style={{ color: productColor }} />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-[#2d2d2d]">API Integrations</h1>
                        <p className="text-[13px] text-[#8b8b8b]">
                            Connect external APIs so your AI can fetch live data
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => { setForm(DEFAULT_FORM); setShowForm(true); setError(''); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
                    style={{ backgroundColor: productColor }}
                >
                    <Plus className="w-4 h-4" />
                    Add Tool
                </button>
            </div>

            {/* Tool Cards List */}
            {tools.length === 0 && !showForm && (
                <div className="bg-white rounded-xl border border-[#e8e4df] p-10 text-center">
                    <div className="text-4xl mb-3">🔌</div>
                    <h3 className="text-[15px] font-semibold text-[#2d2d2d] mb-1">No API tools yet</h3>
                    <p className="text-[13px] text-[#8b8b8b] mb-4">
                        Connect an API like IndianKanoon, weather services, or any REST API.
                        Your AI will call it dynamically when users ask relevant questions.
                    </p>
                    <button
                        onClick={() => { setForm(DEFAULT_FORM); setShowForm(true); setError(''); }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 text-white"
                        style={{ backgroundColor: productColor }}
                    >
                        <Plus className="w-4 h-4" />
                        Create Your First Tool
                    </button>
                </div>
            )}

            {tools.map(tool => (
                <div key={tool.id} className="bg-white rounded-xl border border-[#e8e4df] p-5 mb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">{tool.icon_emoji || '🔌'}</span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-[14px] font-semibold text-[#2d2d2d]">{tool.display_name}</h3>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tool.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {tool.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <p className="text-[12px] text-[#8b8b8b]">
                                    {tool.http_method} {tool.api_endpoint}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleToggle(tool.id, tool.is_active)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                title={tool.is_active ? 'Disable' : 'Enable'}
                            >
                                {tool.is_active
                                    ? <ToggleRight className="w-5 h-5 text-green-600" />
                                    : <ToggleLeft className="w-5 h-5 text-gray-400" />
                                }
                            </button>
                            <button
                                onClick={() => setExpandedTool(expandedTool === tool.id ? null : tool.id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                {expandedTool === tool.id
                                    ? <ChevronUp className="w-4 h-4 text-gray-500" />
                                    : <ChevronDown className="w-4 h-4 text-gray-500" />
                                }
                            </button>
                            <button
                                onClick={() => handleEdit(tool)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-[13px] text-[#8b8b8b] hover:text-[#2d2d2d]"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(tool.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                        </div>
                    </div>

                    {expandedTool === tool.id && (
                        <div className="mt-4 pt-4 border-t border-[#e8e4df]">
                            <p className="text-[13px] text-[#5a5a5a] mb-2">{tool.description}</p>
                            <div className="grid grid-cols-2 gap-3 text-[12px] text-[#8b8b8b]">
                                <div><span className="font-medium text-[#5a5a5a]">Tool name:</span> {tool.tool_name}</div>
                                <div><span className="font-medium text-[#5a5a5a]">Auth:</span> {tool.auth_type}</div>
                                {tool.last_tested_at && (
                                    <div><span className="font-medium text-[#5a5a5a]">Last tested:</span> {new Date(tool.last_tested_at).toLocaleString()}</div>
                                )}
                                {tool.last_test_status && (
                                    <div><span className="font-medium text-[#5a5a5a]">Status:</span> {tool.last_test_status}</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-white rounded-xl border border-[#e8e4df] p-6 mb-5 mt-5">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4.5 h-4.5" style={{ color: productColor }} />
                            <h2 className="text-[15px] font-semibold text-[#2d2d2d]">
                                {form.id ? 'Edit API Tool' : 'New API Tool'}
                            </h2>
                        </div>
                        <button onClick={() => { setShowForm(false); setError(''); }} className="p-1 rounded hover:bg-gray-100">
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-[13px] mb-4">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Display Name + Tool Name */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-[12px] font-medium text-[#5a5a5a] mb-1">Display Name *</label>
                            <input
                                type="text"
                                value={form.display_name}
                                onChange={e => {
                                    const name = e.target.value;
                                    setForm(f => ({
                                        ...f,
                                        display_name: name,
                                        tool_name: f.id ? f.tool_name : autoSlug(name),
                                    }));
                                }}
                                placeholder="IndianKanoon Case Law Search"
                                className="w-full px-3 py-2 rounded-lg border border-[#e8e4df] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#c4715b]/30"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-medium text-[#5a5a5a] mb-1">Tool Name (function ID) *</label>
                            <input
                                type="text"
                                value={form.tool_name}
                                onChange={e => setForm(f => ({ ...f, tool_name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                                placeholder="search_case_law"
                                className="w-full px-3 py-2 rounded-lg border border-[#e8e4df] text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#c4715b]/30"
                            />
                        </div>
                    </div>

                    {/* LLM Description */}
                    <div className="mb-4">
                        <label className="block text-[12px] font-medium text-[#5a5a5a] mb-1">
                            When should AI use this tool? *
                        </label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Search Indian court judgments, case laws, and legal documents. Use when the user asks about court rulings, judgments, or legal precedents."
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-[#e8e4df] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#c4715b]/30 resize-none"
                        />
                        <p className="text-[11px] text-[#b5b0a9] mt-1">This is shown to the AI model — be specific about when to use this tool.</p>
                    </div>

                    {/* API Endpoint + Method */}
                    <div className="bg-[#faf9f7] rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <LinkIcon className="w-3.5 h-3.5" style={{ color: productColor }} />
                            <span className="text-[13px] font-medium text-[#2d2d2d]">API Configuration</span>
                        </div>
                        <div className="grid grid-cols-[1fr_120px] gap-3 mb-3">
                            <div>
                                <label className="block text-[11px] font-medium text-[#8b8b8b] mb-1">Endpoint URL *</label>
                                <input
                                    type="url"
                                    value={form.api_endpoint}
                                    onChange={e => setForm(f => ({ ...f, api_endpoint: e.target.value }))}
                                    placeholder="https://api.indiankanoon.org/search/"
                                    className="w-full px-3 py-2 rounded-lg border border-[#e8e4df] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#c4715b]/30"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-[#8b8b8b] mb-1">Method</label>
                                <select
                                    value={form.http_method}
                                    onChange={e => setForm(f => ({ ...f, http_method: e.target.value as 'GET' | 'POST' }))}
                                    className="w-full px-3 py-2 rounded-lg border border-[#e8e4df] text-[13px] focus:outline-none"
                                >
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Authentication */}
                    <div className="bg-[#faf9f7] rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Key className="w-3.5 h-3.5" style={{ color: productColor }} />
                            <span className="text-[13px] font-medium text-[#2d2d2d]">Authentication</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {AUTH_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setForm(f => ({ ...f, auth_type: opt.value as any }))}
                                    className={`px-3 py-2 rounded-lg border text-left text-[12px] transition-all ${form.auth_type === opt.value
                                        ? 'border-[#c4715b] bg-[#c4715b]/5'
                                        : 'border-[#e8e4df] hover:border-[#ccc]'
                                        }`}
                                >
                                    <div className="font-medium text-[#2d2d2d]">{opt.label}</div>
                                    <div className="text-[#8b8b8b] text-[11px]">{opt.desc}</div>
                                </button>
                            ))}
                        </div>

                        {form.auth_type !== 'none' && (
                            <div className="space-y-3 mt-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-[#8b8b8b] mb-1">
                                        API Key / Secret {form.id ? '(leave blank to keep existing)' : '*'}
                                    </label>
                                    <input
                                        type="password"
                                        value={form.api_key}
                                        onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
                                        placeholder="sk-xxxxxxxxxxxx"
                                        autoComplete="new-password"
                                        className="w-full px-3 py-2 rounded-lg border border-[#e8e4df] text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#c4715b]/30"
                                    />
                                    <p className="text-[11px] text-[#b5b0a9] mt-1">🔒 Encrypted at rest. Never exposed to end users.</p>
                                </div>
                                {form.auth_type === 'header' && (
                                    <div>
                                        <label className="block text-[11px] font-medium text-[#8b8b8b] mb-1">Header Name</label>
                                        <input
                                            type="text"
                                            value={form.auth_header_name}
                                            onChange={e => setForm(f => ({ ...f, auth_header_name: e.target.value }))}
                                            placeholder="X-API-Key"
                                            className="w-full px-3 py-2 rounded-lg border border-[#e8e4df] text-[13px] focus:outline-none"
                                        />
                                    </div>
                                )}
                                {form.auth_type === 'query_param' && (
                                    <div>
                                        <label className="block text-[11px] font-medium text-[#8b8b8b] mb-1">Query Parameter Name</label>
                                        <input
                                            type="text"
                                            value={form.auth_query_param}
                                            onChange={e => setForm(f => ({ ...f, auth_query_param: e.target.value }))}
                                            placeholder="api_key"
                                            className="w-full px-3 py-2 rounded-lg border border-[#e8e4df] text-[13px] focus:outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Parameters Builder */}
                    <div className="bg-[#faf9f7] rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Settings className="w-3.5 h-3.5" style={{ color: productColor }} />
                                <span className="text-[13px] font-medium text-[#2d2d2d]">Parameters</span>
                            </div>
                            <button onClick={addParamRow} className="text-[12px] text-[#c4715b] hover:underline flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add
                            </button>
                        </div>
                        <p className="text-[11px] text-[#b5b0a9] mb-3">Define what the AI extracts from the user&apos;s question and sends to the API.</p>

                        <div className="space-y-2">
                            {form.parameters.map((p, i) => (
                                <div key={i} className="grid grid-cols-[1fr_100px_1fr_60px_30px] gap-2 items-center">
                                    <input
                                        type="text"
                                        value={p.name}
                                        onChange={e => updateParam(i, 'name', e.target.value)}
                                        placeholder="query"
                                        className="px-2 py-1.5 rounded border border-[#e8e4df] text-[12px] font-mono focus:outline-none"
                                    />
                                    <select
                                        value={p.type}
                                        onChange={e => updateParam(i, 'type', e.target.value)}
                                        className="px-2 py-1.5 rounded border border-[#e8e4df] text-[12px] focus:outline-none"
                                    >
                                        <option value="STRING">String</option>
                                        <option value="INTEGER">Integer</option>
                                        <option value="BOOLEAN">Boolean</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={p.description}
                                        onChange={e => updateParam(i, 'description', e.target.value)}
                                        placeholder="Description"
                                        className="px-2 py-1.5 rounded border border-[#e8e4df] text-[12px] focus:outline-none"
                                    />
                                    <label className="flex items-center gap-1 text-[11px] text-[#8b8b8b]">
                                        <input
                                            type="checkbox"
                                            checked={p.required}
                                            onChange={e => updateParam(i, 'required', e.target.checked)}
                                            className="rounded"
                                        />
                                        Req
                                    </label>
                                    <button onClick={() => removeParamRow(i)} className="p-1 rounded hover:bg-red-50">
                                        <X className="w-3 h-3 text-red-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Response Mapping */}
                    <div className="bg-[#faf9f7] rounded-lg p-4 mb-5">
                        <div className="flex items-center gap-2 mb-3">
                            <TestTube className="w-3.5 h-3.5" style={{ color: productColor }} />
                            <span className="text-[13px] font-medium text-[#2d2d2d]">Response Mapping</span>
                        </div>
                        <p className="text-[11px] text-[#b5b0a9] mb-3">Tell us how to read the API&apos;s JSON response. Leave blank if it returns a simple array.</p>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-medium text-[#8b8b8b] mb-1">Results Array Path</label>
                                <input
                                    type="text"
                                    value={form.response_config.results_path}
                                    onChange={e => setForm(f => ({ ...f, response_config: { ...f.response_config, results_path: e.target.value } }))}
                                    placeholder="docs  (or results.items)"
                                    className="w-full px-2 py-1.5 rounded border border-[#e8e4df] text-[12px] font-mono focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-[#8b8b8b] mb-1">Title Field</label>
                                <input
                                    type="text"
                                    value={form.response_config.title_field}
                                    onChange={e => setForm(f => ({ ...f, response_config: { ...f.response_config, title_field: e.target.value } }))}
                                    placeholder="title"
                                    className="w-full px-2 py-1.5 rounded border border-[#e8e4df] text-[12px] font-mono focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-[#8b8b8b] mb-1">Content Field</label>
                                <input
                                    type="text"
                                    value={form.response_config.content_field}
                                    onChange={e => setForm(f => ({ ...f, response_config: { ...f.response_config, content_field: e.target.value } }))}
                                    placeholder="headline  (or snippet)"
                                    className="w-full px-2 py-1.5 rounded border border-[#e8e4df] text-[12px] font-mono focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-[#8b8b8b] mb-1">URL Field</label>
                                <input
                                    type="text"
                                    value={form.response_config.url_field}
                                    onChange={e => setForm(f => ({ ...f, response_config: { ...f.response_config, url_field: e.target.value } }))}
                                    placeholder="url"
                                    className="w-full px-2 py-1.5 rounded border border-[#e8e4df] text-[12px] font-mono focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Test Connection */}
                    <div className="bg-[#faf9f7] rounded-lg p-4 mb-5">
                        <div className="flex items-center gap-2 mb-3">
                            <TestTube className="w-3.5 h-3.5" style={{ color: productColor }} />
                            <span className="text-[13px] font-medium text-[#2d2d2d]">Test Connection</span>
                        </div>
                        <p className="text-[11px] text-[#b5b0a9] mb-3">
                            Enter test values for your parameters and hit Test to see the live API response.
                        </p>

                        {/* Test Parameter Inputs */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            {form.parameters.filter(p => p.name.trim()).map(p => (
                                <div key={p.name}>
                                    <label className="block text-[11px] font-medium text-[#8b8b8b] mb-1">
                                        {p.name} {p.required && <span className="text-red-400">*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        value={testParams[p.name] || ''}
                                        onChange={e => setTestParams(tp => ({ ...tp, [p.name]: e.target.value }))}
                                        placeholder={p.description || `Enter ${p.name}`}
                                        className="w-full px-2 py-1.5 rounded border border-[#e8e4df] text-[12px] focus:outline-none focus:ring-2 focus:ring-[#c4715b]/30"
                                    />
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleTest}
                            disabled={testing}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-[13px] font-medium transition-all disabled:opacity-50"
                            style={{ borderColor: productColor, color: productColor }}
                        >
                            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                            {testing ? 'Testing...' : 'Test Connection'}
                        </button>

                        {/* Test Results */}
                        {testResult !== null ? (
                            <div className="mt-4 rounded-lg border border-[#e8e4df] overflow-hidden">
                                {/* Status Bar */}
                                <div className={`px-4 py-2.5 flex items-center justify-between text-[13px] font-medium ${testResult.success
                                    ? 'bg-green-50 text-green-800 border-b border-green-100'
                                    : 'bg-red-50 text-red-800 border-b border-red-100'
                                    }`}>
                                    <span>
                                        {testResult.success ? '✅' : '❌'}{' '}
                                        HTTP {testResult.status_code}
                                    </span>
                                    <span className="text-[11px] font-normal opacity-70">
                                        {testResult.response_time_ms}ms
                                    </span>
                                </div>

                                {/* Error Message */}
                                {(testResult.error_message && !testResult.success) ? (
                                    <div className="px-4 py-2 bg-red-50 text-red-700 text-[12px]">
                                        {String(testResult.error_message)}
                                    </div>
                                ) : null}

                                {/* Extracted Results (what the LLM sees) */}
                                {(testResult.extracted_results.length > 0) ? (
                                    <div className="p-4 border-b border-[#e8e4df]">
                                        <div className="text-[12px] font-medium text-[#5a5a5a] mb-2">
                                            🤖 What the AI sees ({testResult.extracted_results.length} result{testResult.extracted_results.length !== 1 ? 's' : ''}):
                                        </div>
                                        <div className="space-y-2">
                                            {testResult.extracted_results.map((r, i) => (
                                                <div key={i} className="rounded bg-white border border-[#e8e4df] p-3 text-[12px]">
                                                    {r.title && <div className="font-medium text-[#2d2d2d] mb-1">{r.title}</div>}
                                                    <div className="text-[#5a5a5a] line-clamp-3">{r.content}</div>
                                                    {r.url && <div className="text-[#c4715b] mt-1 text-[11px] truncate">{r.url}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {/* Raw JSON Toggle */}
                                {testResult.is_json && testResult.raw_response && (
                                    <div className="p-4">
                                        <button
                                            onClick={() => setShowRawJson(!showRawJson)}
                                            className="text-[12px] text-[#8b8b8b] hover:text-[#2d2d2d] flex items-center gap-1 mb-2"
                                        >
                                            {showRawJson ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            {showRawJson ? 'Hide' : 'Show'} Raw JSON
                                        </button>
                                        {showRawJson && (
                                            <pre className="bg-[#1a1a2e] text-green-300 text-[11px] p-3 rounded-lg overflow-auto max-h-64 font-mono whitespace-pre-wrap">
                                                {JSON.stringify(testResult.raw_response, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                )}

                                {/* Non-JSON raw response */}
                                {!testResult.is_json && testResult.raw_response && (
                                    <div className="p-4">
                                        <div className="text-[12px] font-medium text-[#5a5a5a] mb-2">Raw Response (not JSON):</div>
                                        <pre className="bg-[#1a1a2e] text-amber-300 text-[11px] p-3 rounded-lg overflow-auto max-h-40 font-mono whitespace-pre-wrap">
                                            {String(testResult.raw_response)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => { setShowForm(false); setError(''); }}
                            className="px-4 py-2 rounded-lg text-[13px] text-[#8b8b8b] hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13px] font-medium transition-all disabled:opacity-50"
                            style={{ backgroundColor: productColor }}
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : saved ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {saving ? 'Saving...' : saved ? 'Saved!' : form.id ? 'Update Tool' : 'Create Tool'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
