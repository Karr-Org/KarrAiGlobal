'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        domain: '',
        description: '',
        knowledgeBaseOption: 'new', // 'new' | 'existing' - kept for backward compat logic if needed
        existingKnowledgeBaseId: '', // kept for compatibility
        selectedKbIds: [] as string[],
        primaryColor: '#1a365d'
    });

    useEffect(() => {
        // Fetch existing KBs
        fetch('/api/knowledge-bases')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setKnowledgeBases(data);
            })
            .catch(console.error);
    }, []);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        // Auto-generate slug
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setFormData(prev => ({ ...prev, name, slug }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Redirect to list
            router.push('/admin/products');
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-10 px-6">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 pb-4 border-b">🚀 Create New Product</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-lg border border-gray-100">

                {/* Name & Slug */}
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleNameChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                            placeholder="e.g. GST AI Assistant"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL safe)</label>
                        <input
                            type="text"
                            required
                            value={formData.slug}
                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-600"
                        />
                    </div>
                </div>

                {/* Domain */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Domain (Optional)</label>
                    <div className="flex">
                        <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                            https://
                        </span>
                        <input
                            type="text"
                            value={formData.domain}
                            onChange={e => setFormData({ ...formData, domain: e.target.value })}
                            className="flex-1 px-4 py-3 rounded-r-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                            placeholder="gst.karrai.com"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">You can configure DNS later.</p>
                </div>

                {/* Knowledge Base Config */}
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-blue-900">📚 Connect Knowledge Bases</h3>
                        <a href="/admin/knowledge-bases/new" target="_blank" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                            + Create New KB
                        </a>
                    </div>

                    <p className="text-sm text-blue-700 mb-4">
                        Select one or more Knowledge Bases to power this product. The AI will answer questions using documents from all selected KBs.
                    </p>

                    <div className="bg-white rounded-lg border border-blue-200 divide-y divide-gray-100 max-h-60 overflow-y-auto">
                        {knowledgeBases.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No Knowledge Bases found. <a href="/admin/knowledge-bases/new" className="text-blue-600 underline">Create one first</a>.
                            </div>
                        ) : (
                            knowledgeBases.map(kb => (
                                <label key={kb.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors">
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
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">{kb.name}</div>
                                        <div className="text-xs text-gray-500">{kb.description || 'No description'}</div>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>
                    <div className="mt-2 text-xs text-blue-600 text-right">
                        {formData.selectedKbIds.length} KB{formData.selectedKbIds.length !== 1 && 's'} selected
                    </div>
                </div>

                {/* Branding */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Brand Color</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="color"
                            value={formData.primaryColor}
                            onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                            className="h-10 w-20 p-1 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-gray-600 font-mono">{formData.primaryColor}</span>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Actions */}
                <div className="pt-6 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                    >
                        {loading ? 'Creating...' : 'Create Product ✨'}
                    </button>
                </div>

            </form>
        </div>
    );
}
