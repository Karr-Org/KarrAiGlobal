'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
    ArrowLeft,
    Key,
    Code,
    Copy,
    Check,
    Plus,
    Trash2,
    Loader2,
    Globe,
    Zap,
    Shield,
    Terminal,
} from 'lucide-react';

interface ApiKey {
    id: string;
    key_prefix: string;
    name: string;
    is_active: boolean;
    request_count: number;
    last_used_at: string | null;
    created_at: string;
    full_key?: string; // Only available on creation
}

export default function WidgetApiPage() {
    const { id } = useParams();
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [showNewKey, setShowNewKey] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [productName, setProductName] = useState('');
    const [productColor, setProductColor] = useState('#c4715b');
    const [activeTab, setActiveTab] = useState<'widget' | 'api'>('widget');
    const [widgetTheme, setWidgetTheme] = useState<'light' | 'dark'>('light');
    const [widgetPosition, setWidgetPosition] = useState('bottom-right');

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Load product
            const prodRes = await fetch(`/api/creator/products?userId=${user.id}`);
            const products = await prodRes.json();
            const product = products.find((p: any) => p.id === id);
            if (product) {
                setProductName(product.name);
                setProductColor(product.primary_color || '#c4715b');
            }

            // Load API keys
            const keysRes = await fetch(`/api/products/${id}/api-keys`);
            const keysData = await keysRes.json();
            setApiKeys(keysData.keys || []);
        } catch (err) {
            console.error('Failed to load:', err);
        } finally {
            setLoading(false);
        }
    };

    const createKey = async () => {
        setCreating(true);
        try {
            const res = await fetch(`/api/products/${id}/api-keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName || 'Default' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setShowNewKey(data.key.full_key);
            setApiKeys(prev => [data.key, ...prev]);
            setNewKeyName('');
        } catch (err: any) {
            alert('Failed to create key: ' + err.message);
        } finally {
            setCreating(false);
        }
    };

    const deleteKey = async (keyId: string) => {
        if (!confirm('Revoke this API key? Any widgets or integrations using it will stop working.')) return;
        try {
            await fetch(`/api/products/${id}/api-keys?keyId=${keyId}`, { method: 'DELETE' });
            setApiKeys(prev => prev.filter(k => k.id !== keyId));
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const getSelectedKey = () => {
        return apiKeys[0]?.full_key || showNewKey || apiKeys[0]?.key_prefix + '...';
    };

    const getWidgetCode = () => {
        const key = showNewKey || (apiKeys[0] ? apiKeys[0].key_prefix + '...' : 'YOUR_API_KEY');
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
        return `<!-- KarrAI Chat Widget -->
<script
  src="${origin}/api/embed/widget.js?key=${key}"
  data-karrai-key="${key}"
  data-theme="${widgetTheme}"
  data-position="${widgetPosition}"
  defer>
</script>`;
    };

    const getApiExample = () => {
        const key = showNewKey || (apiKeys[0] ? apiKeys[0].key_prefix + '...' : 'YOUR_API_KEY');
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
        return `curl -X POST ${origin}/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${key}" \\
  -d '{
    "message": "What services do you offer?",
    "session_id": null
  }'`;
    };

    const getJsExample = () => {
        const key = showNewKey || (apiKeys[0] ? apiKeys[0].key_prefix + '...' : 'YOUR_API_KEY');
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
        return `const response = await fetch('${origin}/api/v1/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${key}',
  },
  body: JSON.stringify({
    message: 'What services do you offer?',
    session_id: null, // Pass session_id from previous response for multi-turn
  }),
});

const data = await response.json();
console.log(data.response);    // AI response text
console.log(data.session_id);  // Use this for follow-up messages`;
    };

    const getPythonExample = () => {
        const key = showNewKey || (apiKeys[0] ? apiKeys[0].key_prefix + '...' : 'YOUR_API_KEY');
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
        return `import requests

response = requests.post(
    '${origin}/api/v1/chat',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${key}',
    },
    json={
        'message': 'What services do you offer?',
        'session_id': None,  # Pass session_id for multi-turn
    }
)

data = response.json()
print(data['response'])     # AI response text
print(data['session_id'])   # Use for follow-up messages`;
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

            <div className="flex items-center gap-3 mb-8">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: productColor + '20' }}
                >
                    <Zap className="w-5 h-5" style={{ color: productColor }} />
                </div>
                <div>
                    <h1 className="text-xl font-semibold text-[#2d2d2d]">Deploy & Integrate</h1>
                    <p className="text-[13px] text-[#8b8b8b]">
                        Embed your AI agent on any website or use the API
                    </p>
                </div>
            </div>

            {/* ===================== API Keys Section ===================== */}
            <div className="bg-white rounded-xl border border-[#e8e4df] p-6 mb-5">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <Key className="w-4 h-4" style={{ color: productColor }} />
                        <h2 className="text-[15px] font-semibold text-[#2d2d2d]">API Keys</h2>
                    </div>
                </div>

                {/* New key creation */}
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newKeyName}
                        onChange={e => setNewKeyName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') createKey(); }}
                        className="flex-1 px-3.5 py-2.5 rounded-lg border border-[#e8e4df] focus:border-[#c4715b] focus:outline-none text-sm placeholder-[#c0bbb5]"
                        placeholder='Key name (e.g. "Website Widget", "Mobile App")'
                    />
                    <button
                        onClick={createKey}
                        disabled={creating}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50"
                        style={{ backgroundColor: productColor }}
                    >
                        {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Generate Key
                    </button>
                </div>

                {/* Newly created key warning */}
                {showNewKey && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                        <div className="flex items-start gap-2 mb-2">
                            <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-amber-800">
                                    Save this key now — it won&apos;t be shown again!
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <code className="bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-[13px] font-mono text-amber-900 select-all">
                                        {showNewKey}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(showNewKey, 'new-key')}
                                        className="p-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                                        title="Copy API key"
                                    >
                                        {copied === 'new-key' ? (
                                            <Check className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-amber-700" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Existing keys */}
                <div className="space-y-2">
                    {apiKeys.map(key => (
                        <div
                            key={key.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-[#f8f7f5] border border-[#eee]"
                        >
                            <div className="flex items-center gap-3">
                                <Key className="w-3.5 h-3.5 text-[#8b8b8b]" />
                                <div>
                                    <div className="text-[13px] font-medium text-[#2d2d2d]">{key.name}</div>
                                    <div className="text-[11px] text-[#8b8b8b] font-mono">{key.key_prefix}...</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] text-[#b5b0a9]">
                                    {key.request_count || 0} requests
                                </span>
                                <button
                                    onClick={() => deleteKey(key.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-[#b5b0a9] hover:text-red-500 transition-colors"
                                    title="Revoke key"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {apiKeys.length === 0 && (
                        <p className="text-[13px] text-[#b5b0a9] text-center py-4">
                            No API keys yet. Generate one to get started.
                        </p>
                    )}
                </div>
            </div>

            {/* ===================== Tab Selector ===================== */}
            <div className="flex gap-1 p-1 bg-[#f4f1ed] rounded-xl mb-5">
                <button
                    onClick={() => setActiveTab('widget')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${activeTab === 'widget'
                        ? 'bg-white text-[#2d2d2d] shadow-sm'
                        : 'text-[#8b8b8b] hover:text-[#5a5a5a]'
                        }`}
                >
                    <Code className="w-4 h-4" />
                    Embed Widget
                </button>
                <button
                    onClick={() => setActiveTab('api')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${activeTab === 'api'
                        ? 'bg-white text-[#2d2d2d] shadow-sm'
                        : 'text-[#8b8b8b] hover:text-[#5a5a5a]'
                        }`}
                >
                    <Terminal className="w-4 h-4" />
                    REST API
                </button>
            </div>

            {/* ===================== Widget Tab ===================== */}
            {activeTab === 'widget' && (
                <div className="bg-white rounded-xl border border-[#e8e4df] p-6 mb-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Code className="w-4 h-4" style={{ color: productColor }} />
                        <h2 className="text-[15px] font-semibold text-[#2d2d2d]">Embeddable Chat Widget</h2>
                    </div>
                    <p className="text-[13px] text-[#8b8b8b] mb-5">
                        Add this single line of code to any website. Your AI agent will appear as a floating
                        chat bubble in the corner.
                    </p>

                    {/* Widget Options */}
                    <div className="grid grid-cols-2 gap-4 mb-5">
                        <div>
                            <label className="block text-[12px] font-medium text-[#5a5a5a] mb-1.5">Theme</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setWidgetTheme('light')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-[12px] font-medium border-2 transition-all ${widgetTheme === 'light'
                                        ? 'border-[#c4715b] bg-[#c4715b]/5'
                                        : 'border-[#e8e4df]'
                                        }`}
                                >
                                    ☀️ Light
                                </button>
                                <button
                                    onClick={() => setWidgetTheme('dark')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-[12px] font-medium border-2 transition-all ${widgetTheme === 'dark'
                                        ? 'border-[#c4715b] bg-[#c4715b]/5'
                                        : 'border-[#e8e4df]'
                                        }`}
                                >
                                    🌙 Dark
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[12px] font-medium text-[#5a5a5a] mb-1.5">Position</label>
                            <select
                                value={widgetPosition}
                                onChange={e => setWidgetPosition(e.target.value)}
                                title="Widget position"
                                className="w-full px-3 py-2 rounded-lg border border-[#e8e4df] text-[13px] focus:outline-none focus:border-[#c4715b]"
                            >
                                <option value="bottom-right">Bottom Right</option>
                                <option value="bottom-left">Bottom Left</option>
                            </select>
                        </div>
                    </div>

                    {/* Code block */}
                    <div className="relative">
                        <pre className="bg-[#1a1a2e] rounded-xl p-5 text-[13px] font-mono text-green-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                            {getWidgetCode()}
                        </pre>
                        <button
                            onClick={() => copyToClipboard(getWidgetCode(), 'widget')}
                            className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                            title="Copy embed code"
                        >
                            {copied === 'widget' ? (
                                <Check className="w-4 h-4 text-green-400" />
                            ) : (
                                <Copy className="w-4 h-4 text-white/70" />
                            )}
                        </button>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <p className="text-[12px] text-blue-700">
                            <strong>How it works:</strong> Paste this code before the closing {`</body>`} tag
                            of your website. A chat bubble will appear in the {widgetPosition.replace('-', ' ')} corner.
                            The widget uses your product&apos;s persona, knowledge base, and branding automatically.
                        </p>
                    </div>
                </div>
            )}

            {/* ===================== API Tab ===================== */}
            {activeTab === 'api' && (
                <div className="space-y-5">
                    {/* Endpoint info */}
                    <div className="bg-white rounded-xl border border-[#e8e4df] p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Globe className="w-4 h-4" style={{ color: productColor }} />
                            <h2 className="text-[15px] font-semibold text-[#2d2d2d]">REST API</h2>
                        </div>
                        <p className="text-[13px] text-[#8b8b8b] mb-5">
                            Use the API to integrate your AI agent into any application — mobile apps,
                            WhatsApp bots, Telegram bots, custom dashboards, and more.
                        </p>

                        {/* Endpoint */}
                        <div className="mb-5">
                            <label className="block text-[12px] font-medium text-[#5a5a5a] mb-1.5">Endpoint</label>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg bg-green-100 text-green-800 text-[11px] font-bold">POST</span>
                                <code className="bg-[#f4f1ed] px-3 py-1.5 rounded-lg text-[13px] font-mono text-[#2d2d2d]">
                                    /api/v1/chat
                                </code>
                            </div>
                        </div>

                        {/* Request/Response format */}
                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div>
                                <label className="block text-[12px] font-medium text-[#5a5a5a] mb-1.5">Request Body</label>
                                <pre className="bg-[#f4f1ed] rounded-lg p-3 text-[12px] font-mono text-[#5a5a5a] leading-relaxed">{`{
  "message": "string",
  "session_id": "string | null",
  "visitor_id": "string?",
  "visitor_name": "string?",
  "visitor_email": "string?"
}`}</pre>
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium text-[#5a5a5a] mb-1.5">Response</label>
                                <pre className="bg-[#f4f1ed] rounded-lg p-3 text-[12px] font-mono text-[#5a5a5a] leading-relaxed">{`{
  "response": "AI text...",
  "session_id": "uuid",
  "metadata": {
    "agent_name": "Dr. TaxBot",
    "has_knowledge_base": true,
    "sources_used": 3
  }
}`}</pre>
                            </div>
                        </div>
                    </div>

                    {/* cURL Example */}
                    <div className="bg-white rounded-xl border border-[#e8e4df] p-6">
                        <h3 className="text-[14px] font-semibold text-[#2d2d2d] mb-3 flex items-center gap-2">
                            <Terminal className="w-4 h-4" />
                            cURL Example
                        </h3>
                        <div className="relative">
                            <pre className="bg-[#1a1a2e] rounded-xl p-4 text-[12px] font-mono text-green-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                {getApiExample()}
                            </pre>
                            <button
                                onClick={() => copyToClipboard(getApiExample(), 'curl')}
                                className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                title="Copy cURL command"
                            >
                                {copied === 'curl' ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                    <Copy className="w-4 h-4 text-white/70" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* JavaScript Example */}
                    <div className="bg-white rounded-xl border border-[#e8e4df] p-6">
                        <h3 className="text-[14px] font-semibold text-[#2d2d2d] mb-3 flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            JavaScript / Node.js
                        </h3>
                        <div className="relative">
                            <pre className="bg-[#1a1a2e] rounded-xl p-4 text-[12px] font-mono text-blue-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                {getJsExample()}
                            </pre>
                            <button
                                onClick={() => copyToClipboard(getJsExample(), 'js')}
                                className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                title="Copy JS code"
                            >
                                {copied === 'js' ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                    <Copy className="w-4 h-4 text-white/70" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Python Example */}
                    <div className="bg-white rounded-xl border border-[#e8e4df] p-6">
                        <h3 className="text-[14px] font-semibold text-[#2d2d2d] mb-3 flex items-center gap-2">
                            🐍 Python
                        </h3>
                        <div className="relative">
                            <pre className="bg-[#1a1a2e] rounded-xl p-4 text-[12px] font-mono text-yellow-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                {getPythonExample()}
                            </pre>
                            <button
                                onClick={() => copyToClipboard(getPythonExample(), 'python')}
                                className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                title="Copy Python code"
                            >
                                {copied === 'python' ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                    <Copy className="w-4 h-4 text-white/70" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
