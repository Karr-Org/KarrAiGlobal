'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Globe,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Copy,
    ExternalLink,
    RefreshCw,
    Trash2,
    Sparkles,
    Shield,
    Zap,
    Check,
    ArrowRight,
    Radio
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Product {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    status: string;
    primary_color: string;
}

export default function ProductSettingsPage({ params }: { params: { id: string } }) {
    const supabase = createClient();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [domain, setDomain] = useState('');
    const [domainStatus, setDomainStatus] = useState<'unconfigured' | 'pending' | 'active'>('unconfigured');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [checkingStatus, setCheckingStatus] = useState(false);

    useEffect(() => {
        fetchProduct();
    }, [params.id]);

    const fetchProduct = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('id', params.id)
            .single() as { data: Product | null };

        if (data) {
            setProduct(data);
            setDomain(data.domain || '');
            setDomainStatus(data.domain ? 'pending' : 'unconfigured');
        }
        setLoading(false);
    };

    const saveDomain = async () => {
        if (!product) return;
        setSaving(true);
        setMessage(null);

        const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

        try {
            // Add domain to Vercel programmatically
            const res = await fetch('/api/domains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: cleanDomain, productId: product.id }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.code === 'VERCEL_NOT_CONFIGURED') {
                    // Fallback: just save to database
                    await supabase.from('products').update({ domain: cleanDomain || null }).eq('id', product.id);
                    setMessage({ type: 'success', text: 'Domain saved! Deploy to Vercel and add domain there to go live.' });
                } else {
                    throw new Error(data.error || 'Failed to add domain');
                }
            } else {
                setMessage({ type: 'success', text: data.message || 'Domain added to Vercel! Configure DNS below.' });
            }

            setDomain(cleanDomain);
            setDomainStatus(cleanDomain ? 'pending' : 'unconfigured');
            setProduct({ ...product, domain: cleanDomain });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to save domain' });
        }
        setSaving(false);
    };

    const removeDomain = async () => {
        if (!confirm('Remove custom domain?')) return;
        setSaving(true);

        try {
            // Remove from Vercel
            await fetch(`/api/domains?domain=${domain}&productId=${product?.id}`, {
                method: 'DELETE',
            });

            setDomain('');
            setProduct(prev => prev ? { ...prev, domain: null } : null);
            setDomainStatus('unconfigured');
            setMessage({ type: 'success', text: 'Domain removed successfully' });
        } catch {
            setMessage({ type: 'error', text: 'Failed to remove domain' });
        }
        setSaving(false);
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const checkDomainStatus = async () => {
        if (!domain) return;
        setCheckingStatus(true);
        setMessage(null);

        try {
            // Check with Vercel API first
            const vercelRes = await fetch(`/api/domains?domain=${domain}`);
            const vercelData = await vercelRes.json();

            if (vercelData.verified) {
                setDomainStatus('active');
                setMessage({ type: 'success', text: '🎉 Domain is verified and live!' });
            } else if (vercelData.exists) {
                setDomainStatus('pending');
                setMessage({ type: 'error', text: 'Domain added to Vercel but DNS not verified yet. Check your DNS settings.' });
            } else {
                // Fallback: try direct domain check
                const directRes = await fetch(`/api/products/check-domain?domain=${domain}`);
                const directData = await directRes.json();

                if (directData.active) {
                    setDomainStatus('active');
                    setMessage({ type: 'success', text: '🎉 Domain is responding!' });
                } else {
                    setDomainStatus('pending');
                    setMessage({ type: 'error', text: directData.message || 'DNS still propagating...' });
                }
            }
        } catch {
            setMessage({ type: 'error', text: 'Could not verify domain status.' });
        } finally {
            setCheckingStatus(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-spin" style={{ animationDuration: '2s' }}></div>
                        <div className="absolute inset-1 rounded-full bg-[#0a0a0f]"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                        </div>
                    </div>
                    <p className="text-gray-400">Loading settings...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="text-center">
                    <p className="text-xl font-semibold text-white mb-2">Product not found</p>
                    <Link href="/admin/products" className="text-violet-400 hover:underline">
                        ← Back to Products
                    </Link>
                </div>
            </div>
        );
    }

    const steps = [
        { id: 1, label: 'Add Domain', done: !!domain },
        { id: 2, label: 'Configure DNS', done: domainStatus === 'active' },
        { id: 3, label: 'Go Live', done: domainStatus === 'active' },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px] animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10">
                {/* Premium Header */}
                <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
                    <div className="max-w-5xl mx-auto px-6 py-6">
                        <Link
                            href="/admin/products"
                            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Products
                        </Link>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                                    <Sparkles className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                        {product.name}
                                    </h1>
                                    <p className="text-gray-400 text-sm">Domain & Deployment Settings</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href={`/p/${product.slug}`}
                                    target="_blank"
                                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Preview
                                </Link>
                                <Link
                                    href={`/admin/test-chat?productId=${product.id}&name=${encodeURIComponent(product.name)}`}
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center gap-2"
                                >
                                    <Zap className="w-4 h-4" />
                                    Test RAG
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 py-8">
                    {/* Progress Steps */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-8">
                        <div className="flex items-center justify-between">
                            {steps.map((step, i) => (
                                <div key={step.id} className="flex items-center flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step.done
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                                            : i === 0 || steps[i - 1]?.done
                                                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30'
                                                : 'bg-white/10 text-gray-500'
                                            }`}>
                                            {step.done ? <Check className="w-5 h-5" /> : step.id}
                                            {(i === 0 || steps[i - 1]?.done) && !step.done && (
                                                <span className="absolute inset-0 rounded-full animate-ping bg-violet-500/50"></span>
                                            )}
                                        </div>
                                        <span className={`font-medium ${step.done ? 'text-emerald-400' : 'text-gray-300'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className="flex-1 mx-6 flex items-center">
                                            <div className={`flex-1 h-0.5 rounded-full transition-all ${step.done ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-white/10'
                                                }`} />
                                            <ArrowRight className={`w-4 h-4 mx-2 ${step.done ? 'text-emerald-400' : 'text-gray-600'}`} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* URL Cards */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        {/* Default URL */}
                        <div className="group bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Default URL</h3>
                                    <p className="text-xs text-gray-500">Always available</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                                <code className="text-sm text-gray-300">karrai.com/p/{product.slug}</code>
                                <a href={`/p/${product.slug}`} target="_blank" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <ExternalLink className="w-4 h-4 text-gray-400" />
                                </a>
                            </div>
                        </div>

                        {/* Custom Domain */}
                        <div className={`group rounded-2xl border p-6 transition-all ${domain
                            ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30'
                            : 'bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20'
                            }`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${domain ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-white/10'
                                    }`}>
                                    <Globe className={`w-5 h-5 ${domain ? 'text-white' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Custom Domain</h3>
                                    <p className="text-xs text-gray-500">{domain ? 'Your branded URL' : 'Not configured'}</p>
                                </div>
                            </div>
                            {domain ? (
                                <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-emerald-500/20">
                                    <code className="text-sm font-medium text-emerald-400">https://{domain}</code>
                                    <div className="flex items-center gap-2">
                                        {domainStatus === 'active' ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                                                <Radio className="w-3 h-3 animate-pulse" />
                                                Live
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-black/20 rounded-xl text-center text-gray-500 text-sm border border-dashed border-white/10">
                                    Configure below to add custom domain
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Domain Configuration */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                        <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Domain Configuration</h2>
                                    <p className="text-sm text-gray-400">Connect your custom domain</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {message && (
                                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                                    }`}>
                                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    <span className="font-medium">{message.text}</span>
                                </div>
                            )}

                            <div className="mb-8">
                                <label className="block text-sm font-semibold text-gray-300 mb-3">
                                    Your Custom Domain
                                </label>
                                <div className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">https://</span>
                                        <input
                                            type="text"
                                            value={domain}
                                            onChange={(e) => setDomain(e.target.value)}
                                            placeholder="yourdomain.com"
                                            className="w-full pl-20 pr-4 py-3.5 bg-black/30 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-white font-mono placeholder-gray-600 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={saveDomain}
                                        disabled={saving}
                                        className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 disabled:opacity-50 transition-all flex items-center gap-2"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        Save
                                    </button>
                                    {product.domain && (
                                        <button
                                            onClick={removeDomain}
                                            className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* DNS Instructions */}
                            {domain && (
                                <div className="bg-gradient-to-br from-violet-600/10 via-fuchsia-600/5 to-transparent rounded-2xl p-6 border border-violet-500/20">
                                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                        <span className="text-2xl">⚙️</span> DNS Configuration
                                    </h3>
                                    <p className="text-gray-400 mb-6">
                                        Add these records at your domain registrar (GoDaddy, Namecheap, Cloudflare)
                                    </p>

                                    <div className="space-y-4">
                                        {/* CNAME Record */}
                                        <div className="bg-black/30 rounded-xl p-5 border border-white/10">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="px-3 py-1.5 bg-violet-500/20 text-violet-400 rounded-lg text-sm font-bold">
                                                    CNAME Record
                                                </span>
                                                <button
                                                    onClick={() => copyToClipboard('cname.vercel-dns.com', 'cname')}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${copiedField === 'cname'
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                                                        }`}
                                                >
                                                    {copiedField === 'cname' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                    {copiedField === 'cname' ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-6">
                                                <div>
                                                    <div className="text-xs font-medium text-gray-500 mb-1">Type</div>
                                                    <div className="font-mono font-bold text-white">CNAME</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-gray-500 mb-1">Name</div>
                                                    <div className="font-mono font-bold text-white">@ or www</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-gray-500 mb-1">Value</div>
                                                    <div className="font-mono font-bold text-violet-400">cname.vercel-dns.com</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* A Record */}
                                        <div className="bg-black/20 rounded-xl p-5 border border-white/5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1.5 bg-white/10 text-gray-400 rounded-lg text-sm font-bold">
                                                        A Record
                                                    </span>
                                                    <span className="text-xs text-gray-500">(for root domains)</span>
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard('76.76.21.21', 'a')}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${copiedField === 'a'
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                                                        }`}
                                                >
                                                    {copiedField === 'a' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                    {copiedField === 'a' ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-6">
                                                <div>
                                                    <div className="text-xs font-medium text-gray-500 mb-1">Type</div>
                                                    <div className="font-mono text-gray-300">A</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-gray-500 mb-1">Name</div>
                                                    <div className="font-mono text-gray-300">@</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-gray-500 mb-1">Value</div>
                                                    <div className="font-mono text-violet-400">76.76.21.21</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between">
                                        <p className="text-gray-500 text-sm flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            DNS propagation takes 5 mins - 48 hours
                                        </p>
                                        <button
                                            onClick={checkDomainStatus}
                                            disabled={checkingStatus}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium border border-white/10 transition-all disabled:opacity-50"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                                            {checkingStatus ? 'Checking...' : 'Verify DNS'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
