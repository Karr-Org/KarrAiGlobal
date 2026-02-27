'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
    ArrowLeft,
    Globe,
    Users,
    ExternalLink,
    Loader2,
    Trash2,
    Copy,
    Brain,
    BookOpen,
    Zap,
    Plug,
} from 'lucide-react';

interface Product {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    description: string;
    tagline: string | null;
    category: string;
    primary_color: string;
    status: string;
    user_count: number;
    created_at: string;
}

export default function CreatorProductSettingsPage() {
    const { id } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [domainInput, setDomainInput] = useState('');
    const [domainStatus, setDomainStatus] = useState<string | null>(null);
    const [domainLoading, setDomainLoading] = useState(false);

    useEffect(() => {
        loadProduct();
    }, [id]);

    const loadProduct = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const res = await fetch(`/api/creator/products?userId=${user.id}`);
            const products = await res.json();
            const found = products.find((p: any) => p.id === id);
            if (found) {
                setProduct(found);
                setDomainInput(found.domain || '');
            }
        } catch (err) {
            console.error('Failed to load product:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDomain = async () => {
        if (!domainInput || !product) return;
        setDomainLoading(true);
        setDomainStatus(null);

        try {
            const res = await fetch('/api/domains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: domainInput, productId: product.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setDomainStatus('Domain added! Configure DNS to point to your app.');
            setProduct({ ...product, domain: domainInput });
        } catch (err: any) {
            setDomainStatus('Error: ' + err.message);
        } finally {
            setDomainLoading(false);
        }
    };

    const handleRemoveDomain = async () => {
        if (!product?.domain) return;
        if (!confirm('Remove this domain?')) return;
        setDomainLoading(true);

        try {
            const res = await fetch(`/api/domains?domain=${product.domain}&productId=${product.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to remove domain');
            setProduct({ ...product, domain: null });
            setDomainInput('');
            setDomainStatus('Domain removed');
        } catch (err: any) {
            setDomainStatus('Error: ' + err.message);
        } finally {
            setDomainLoading(false);
        }
    };

    const handleCheckDomain = async () => {
        if (!product?.domain) return;
        setDomainLoading(true);
        try {
            const res = await fetch(`/api/domains?domain=${product.domain}`);
            const data = await res.json();
            setDomainStatus(data.configured ? 'Domain verified and active' : 'DNS not propagated yet. Check back soon.');
        } catch {
            setDomainStatus('Could not check domain status');
        } finally {
            setDomainLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-[#c4715b]" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-8 text-center">
                <h2 className="text-lg font-medium text-[#2d2d2d]">Product not found</h2>
                <Link href="/creator/dashboard" className="text-[#c4715b] mt-4 inline-block text-sm">← Back to dashboard</Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-10 px-8">
            <Link href="/creator/products" className="inline-flex items-center gap-1.5 text-[#8b8b8b] hover:text-[#2d2d2d] mb-6 text-[13px] transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                All products
            </Link>

            {/* Product Header */}
            <div className="flex items-center gap-3.5 mb-8">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: product.primary_color }}
                >
                    {product.name.charAt(0)}
                </div>
                <div>
                    <h1 className="text-xl font-semibold text-[#2d2d2d]">{product.name}</h1>
                    <div className="flex items-center gap-2.5 text-[12px] text-[#8b8b8b] mt-0.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${product.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                            {product.status}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {product.user_count} users
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                <a
                    href={product.domain ? `https://${product.domain}` : `/p/${product.slug}`}
                    target="_blank"
                    className="bg-white rounded-lg border border-[#e8e4df] p-3.5 hover:border-[#c4715b]/30 transition-colors flex items-center gap-3"
                >
                    <ExternalLink className="w-4 h-4 text-[#c4715b]" />
                    <div>
                        <div className="text-[13px] font-medium text-[#2d2d2d]">View Product</div>
                        <div className="text-[11px] text-[#8b8b8b]">{product.domain || `/p/${product.slug}`}</div>
                    </div>
                </a>
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(
                            product.domain ? `https://${product.domain}` : `${window.location.origin}/p/${product.slug}`
                        );
                    }}
                    title="Copy product link"
                    className="bg-white rounded-lg border border-[#e8e4df] p-3.5 hover:border-[#c4715b]/30 transition-colors flex items-center gap-3 text-left"
                >
                    <Copy className="w-4 h-4 text-[#c4715b]" />
                    <div>
                        <div className="text-[13px] font-medium text-[#2d2d2d]">Copy Link</div>
                        <div className="text-[11px] text-[#8b8b8b]">Share with your users</div>
                    </div>
                </button>
                <Link
                    href={`/creator/products/${id}/persona`}
                    className="bg-white rounded-lg border border-[#e8e4df] p-3.5 hover:border-[#c4715b]/30 transition-colors flex items-center gap-3"
                >
                    <Brain className="w-4 h-4 text-[#c4715b]" />
                    <div>
                        <div className="text-[13px] font-medium text-[#2d2d2d]">Agent Persona</div>
                        <div className="text-[11px] text-[#8b8b8b]">Define behavior & identity</div>
                    </div>
                </Link>
                <Link
                    href="/creator/knowledge-bases"
                    className="bg-white rounded-lg border border-[#e8e4df] p-3.5 hover:border-[#c4715b]/30 transition-colors flex items-center gap-3"
                >
                    <BookOpen className="w-4 h-4 text-[#c4715b]" />
                    <div>
                        <div className="text-[13px] font-medium text-[#2d2d2d]">Knowledge Bases</div>
                        <div className="text-[11px] text-[#8b8b8b]">Upload docs & manage KB</div>
                    </div>
                </Link>
                <Link
                    href={`/creator/products/${id}/deploy`}
                    className="bg-white rounded-lg border border-[#e8e4df] p-3.5 hover:border-[#c4715b]/30 transition-colors flex items-center gap-3"
                >
                    <Zap className="w-4 h-4 text-[#c4715b]" />
                    <div>
                        <div className="text-[13px] font-medium text-[#2d2d2d]">Deploy & Integrate</div>
                        <div className="text-[11px] text-[#8b8b8b]">Widget, API keys & embed code</div>
                    </div>
                </Link>
                <Link
                    href={`/creator/products/${id}/integrations`}
                    className="bg-white rounded-lg border border-[#e8e4df] p-3.5 hover:border-[#c4715b]/30 transition-colors flex items-center gap-3"
                >
                    <Plug className="w-4 h-4 text-[#c4715b]" />
                    <div>
                        <div className="text-[13px] font-medium text-[#2d2d2d]">API Integrations</div>
                        <div className="text-[11px] text-[#8b8b8b]">Connect external APIs</div>
                    </div>
                </Link>
            </div>

            {/* Domain Management */}
            <div className="bg-white rounded-lg border border-[#e8e4df] p-5 mb-5">
                <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-[#c4715b]" />
                    <h2 className="text-[15px] font-medium text-[#2d2d2d]">Custom Domain</h2>
                </div>

                {product.domain ? (
                    <div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100 mb-3">
                            <div className="flex-1">
                                <div className="font-medium text-green-800 text-sm">{product.domain}</div>
                                <div className="text-[11px] text-green-600">Domain configured</div>
                            </div>
                            <button onClick={handleCheckDomain} disabled={domainLoading} className="text-[12px] text-green-700 hover:text-green-900 font-medium">
                                {domainLoading ? 'Checking...' : 'Verify'}
                            </button>
                            <button onClick={handleRemoveDomain} disabled={domainLoading} className="p-1 text-red-400 hover:text-red-600" title="Remove domain">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <p className="text-[11px] text-[#8b8b8b]">
                            Point your domain&apos;s DNS CNAME to <code className="bg-[#f4f1ed] px-1.5 py-0.5 rounded text-[11px]">cname.vercel-dns.com</code>
                        </p>
                    </div>
                ) : (
                    <div>
                        <p className="text-[13px] text-[#8b8b8b] mb-3">
                            Connect a custom domain for your product.
                        </p>
                        <div className="flex gap-2">
                            <div className="flex flex-1">
                                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[#e8e4df] bg-[#f4f1ed] text-[#8b8b8b] text-[13px]">
                                    https://
                                </span>
                                <input
                                    type="text"
                                    value={domainInput}
                                    onChange={(e) => setDomainInput(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-r-lg border border-[#e8e4df] focus:border-[#c4715b] focus:outline-none text-sm"
                                    placeholder="yourdomain.com"
                                />
                            </div>
                            <button
                                onClick={handleAddDomain}
                                disabled={domainLoading || !domainInput}
                                className="px-4 py-2 bg-[#c4715b] text-white rounded-lg text-[13px] font-medium hover:bg-[#b3624d] disabled:opacity-50 transition-colors"
                            >
                                {domainLoading ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </div>
                )}

                {domainStatus && (
                    <div className="mt-3 p-3 rounded-lg bg-[#f4f1ed] text-[13px] text-[#2d2d2d]">
                        {domainStatus}
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-lg border border-[#e8e4df] p-5">
                <h2 className="text-[15px] font-medium text-[#2d2d2d] mb-4">Product Info</h2>
                <div className="space-y-0 text-[13px]">
                    <div className="flex justify-between py-2.5 border-b border-[#f0ece7]">
                        <span className="text-[#8b8b8b]">Slug</span>
                        <span className="text-[#2d2d2d] font-mono">/p/{product.slug}</span>
                    </div>
                    <div className="flex justify-between py-2.5 border-b border-[#f0ece7]">
                        <span className="text-[#8b8b8b]">Category</span>
                        <span className="text-[#2d2d2d] capitalize">{product.category}</span>
                    </div>
                    <div className="flex justify-between py-2.5 border-b border-[#f0ece7]">
                        <span className="text-[#8b8b8b]">Created</span>
                        <span className="text-[#2d2d2d]">{new Date(product.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                        <span className="text-[#8b8b8b]">Brand Color</span>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: product.primary_color }} />
                            <span className="text-[#2d2d2d] font-mono">{product.primary_color}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
