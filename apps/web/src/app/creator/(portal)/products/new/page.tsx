'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreatorNewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        domain: '',
        description: '',
        tagline: '',
        category: 'general',
        selectedKbIds: [] as string[],
        primaryColor: '#c4715b',
        webSources: [] as { domain: string; displayName: string; authorityScore: number }[],
    });

    // Controlled state for web source inputs (avoids document.getElementById bugs)
    const [wsDomain, setWsDomain] = useState('');
    const [wsName, setWsName] = useState('');

    useEffect(() => {
        const loadKBs = async () => {
            try {
                const supabaseClient = createClient();
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (!user) return;
                const res = await fetch(`/api/knowledge-bases?userId=${user.id}`);
                const data = await res.json();
                if (Array.isArray(data)) setKnowledgeBases(data);
            } catch (err) {
                console.error(err);
            }
        };
        loadKBs();
    }, []);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setFormData(prev => ({ ...prev, name, slug }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const res = await fetch('/api/creator/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, userId: user.id }),
            });

            const data = await res.json();
            console.log('[CreateProduct] Response:', res.status, data);
            if (!res.ok) throw new Error(data.error || 'Failed to create product');

            // Redirect to the new product's manage page
            if (data.product?.id) {
                router.push(`/creator/products/${data.product.id}`);
            } else {
                router.push('/creator/dashboard');
            }
        } catch (error: any) {
            console.error('[CreateProduct] Error:', error);
            alert('Error creating product: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { value: 'general', label: 'General' },
        { value: 'legal', label: 'Legal & Compliance' },
        { value: 'finance', label: 'Finance & Tax' },
        { value: 'health', label: 'Healthcare' },
        { value: 'education', label: 'Education' },
        { value: 'tech', label: 'Technology' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'hr', label: 'HR & People' },
        { value: 'other', label: 'Other' },
    ];

    return (
        <div className="max-w-2xl mx-auto py-10 px-8">
            <Link href="/creator/dashboard" className="inline-flex items-center gap-1.5 text-[#8b8b8b] hover:text-[#2d2d2d] mb-6 text-[13px] transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
            </Link>

            <h1 className="text-xl font-semibold text-[#2d2d2d] mb-1">Create Product</h1>
            <p className="text-[#8b8b8b] text-sm mb-8">Build an AI product powered by your knowledge</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name & Slug */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="productName" className="block text-[13px] font-medium text-[#2d2d2d] mb-1.5">Product Name</label>
                        <input
                            id="productName"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleNameChange}
                            className="input"
                            placeholder="e.g. Tax AI Pro"
                        />
                    </div>
                    <div>
                        <label htmlFor="productSlug" className="block text-[13px] font-medium text-[#2d2d2d] mb-1.5">Slug (URL)</label>
                        <input
                            id="productSlug"
                            type="text"
                            required
                            value={formData.slug}
                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            className="input bg-[#f4f1ed]"
                        />
                    </div>
                </div>

                {/* Tagline */}
                <div>
                    <label htmlFor="tagline" className="block text-[13px] font-medium text-[#2d2d2d] mb-1.5">Tagline</label>
                    <input
                        id="tagline"
                        type="text"
                        value={formData.tagline}
                        onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                        className="input"
                        placeholder="One line describing your product"
                    />
                </div>

                {/* Category & Color */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="category" className="block text-[13px] font-medium text-[#2d2d2d] mb-1.5">Category</label>
                        <select
                            id="category"
                            title="Product category"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="input"
                        >
                            {categories.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="brandColor" className="block text-[13px] font-medium text-[#2d2d2d] mb-1.5">Brand Color</label>
                        <div className="flex items-center gap-3">
                            <input
                                id="brandColor"
                                type="color"
                                value={formData.primaryColor}
                                onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                                className="h-9 w-14 p-0.5 rounded border border-[#e8e4df] cursor-pointer"
                            />
                            <span className="text-[#8b8b8b] font-mono text-[13px]">{formData.primaryColor}</span>
                        </div>
                    </div>
                </div>

                {/* Domain */}
                <div>
                    <label htmlFor="customDomain" className="block text-[13px] font-medium text-[#2d2d2d] mb-1.5">
                        Custom Domain <span className="text-[#b5b0a9]">(optional)</span>
                    </label>
                    <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[#e8e4df] bg-[#f4f1ed] text-[#8b8b8b] text-[13px]">
                            https://
                        </span>
                        <input
                            id="customDomain"
                            type="text"
                            value={formData.domain}
                            onChange={e => setFormData({ ...formData, domain: e.target.value })}
                            className="flex-1 px-3 py-2.5 rounded-r-lg border border-[#e8e4df] focus:border-[#c4715b] focus:outline-none text-sm text-[#2d2d2d]"
                            placeholder="yourdomain.com"
                        />
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#f0ece7]" />

                {/* Knowledge Bases */}
                <div>
                    <h3 className="text-[14px] font-medium text-[#2d2d2d] mb-1">Knowledge Bases</h3>
                    <p className="text-[12px] text-[#8b8b8b] mb-3">
                        Select knowledge bases to power your AI product.
                    </p>
                    <div className="bg-white rounded-lg border border-[#e8e4df] divide-y divide-[#f0ece7] max-h-48 overflow-y-auto">
                        {knowledgeBases.length === 0 ? (
                            <div className="p-4 text-center text-[13px]">
                                <p className="text-[#8b8b8b] mb-2">No knowledge bases yet.</p>
                                <Link href="/creator/knowledge-bases/new" className="text-[#c4715b] hover:text-[#b3624d] font-medium">
                                    + Create your first Knowledge Base
                                </Link>
                            </div>
                        ) : (
                            knowledgeBases.map(kb => (
                                <label key={kb.id} className="flex items-center gap-3 p-3 hover:bg-[#faf9f7] cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.selectedKbIds.includes(kb.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFormData(prev => ({ ...prev, selectedKbIds: [...prev.selectedKbIds, kb.id] }));
                                            } else {
                                                setFormData(prev => ({ ...prev, selectedKbIds: prev.selectedKbIds.filter(id => id !== kb.id) }));
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-[#e8e4df] text-[#c4715b] focus:ring-[#c4715b]"
                                    />
                                    <div>
                                        <div className="text-[13px] font-medium text-[#2d2d2d]">{kb.name}</div>
                                        <div className="text-[11px] text-[#8b8b8b]">{kb.description || 'No description'}</div>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>
                    <div className="mt-1.5 text-[11px] text-[#8b8b8b] text-right">
                        {formData.selectedKbIds.length} selected
                    </div>
                </div>

                {/* Web Sources */}
                <div>
                    <h3 className="text-[14px] font-medium text-[#2d2d2d] mb-1">Web Sources</h3>
                    <p className="text-[12px] text-[#8b8b8b] mb-3">
                        Add trusted websites for real-time knowledge.
                    </p>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            placeholder="Domain (e.g., docs.example.com)"
                            value={wsDomain}
                            onChange={e => setWsDomain(e.target.value)}
                            className="flex-1 input"
                        />
                        <input
                            type="text"
                            placeholder="Name"
                            value={wsName}
                            onChange={e => setWsName(e.target.value)}
                            className="w-28 input"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (wsDomain.trim()) {
                                    const cleanDomain = wsDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
                                    setFormData(prev => ({
                                        ...prev,
                                        webSources: [...prev.webSources, {
                                            domain: cleanDomain,
                                            displayName: wsName.trim() || cleanDomain,
                                            authorityScore: 7
                                        }]
                                    }));
                                    setWsDomain('');
                                    setWsName('');
                                }
                            }}
                            className="px-3 py-2 bg-[#c4715b] text-white rounded-lg hover:bg-[#b3624d] text-[13px] font-medium transition-colors"
                        >
                            Add
                        </button>
                    </div>
                    {formData.webSources.length > 0 && (
                        <div className="bg-white rounded-lg border border-[#e8e4df] divide-y divide-[#f0ece7]">
                            {formData.webSources.map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-3">
                                    <span className="text-[13px] text-[#2d2d2d]">{s.displayName} <span className="text-[#b5b0a9]">({s.domain})</span></span>
                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, webSources: prev.webSources.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-500 text-[13px]">✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-[13px] font-medium text-[#2d2d2d] mb-1.5">Description</label>
                    <textarea
                        id="description"
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="input resize-none"
                        placeholder="Describe what your AI product does..."
                    />
                </div>

                {/* Actions */}
                <div className="pt-2 flex justify-end gap-3 border-t border-[#f0ece7]">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 rounded-lg border border-[#e8e4df] text-[#8b8b8b] text-[13px] font-medium hover:bg-[#f4f1ed] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 rounded-lg bg-[#c4715b] text-white text-[13px] font-medium hover:bg-[#b3624d] disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Creating...' : 'Create Product'}
                    </button>
                </div>
            </form>
        </div>
    );
}
