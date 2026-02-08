'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Package,
    Plus,
    Globe,
    Database,
    Settings,
    Zap,
    ExternalLink,
    ChevronRight,
    Search,
    Rocket
} from 'lucide-react';

export default function ProductsListPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setProducts(data);
            })
            .finally(() => setLoading(false));
    }, []);

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto px-6 py-10">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-2xl font-semibold text-sand-900 mb-2">Products</h1>
                <p className="text-sand-500">Manage your AI-powered products and their configurations.</p>
            </div>

            {/* Search & Actions Bar */}
            <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sand-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-sand-200 rounded-xl text-sand-800 placeholder-sand-400 focus:outline-none focus:border-sand-300 focus:ring-1 focus:ring-sand-200 transition-all"
                    />
                </div>
                <Link
                    href="/admin/products/new"
                    className="flex items-center gap-2 px-5 py-2.5 bg-sand-800 hover:bg-sand-900 text-white rounded-xl text-sm font-medium transition-colors shadow-soft"
                >
                    <Plus className="w-4 h-4" />
                    New Product
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-6 h-6 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin"></div>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-sand-200">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-sand-100 flex items-center justify-center">
                        <Package className="w-7 h-7 text-sand-400" />
                    </div>
                    <h3 className="text-lg font-medium text-sand-800 mb-2">
                        {searchQuery ? 'No products found' : 'No products yet'}
                    </h3>
                    <p className="text-sand-500 mb-6">
                        {searchQuery ? 'Try a different search term' : 'Create your first AI product to get started'}
                    </p>
                    {!searchQuery && (
                        <Link
                            href="/admin/products/new"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sand-800 hover:bg-sand-900 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Product
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="group bg-white rounded-2xl border border-sand-200 hover:border-sand-300 hover:shadow-soft transition-all duration-200"
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    {/* Left: Product Info */}
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        {/* Product Icon */}
                                        <div
                                            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: product.primary_color ? `${product.primary_color}15` : '#F5F3EE' }}
                                        >
                                            <Package
                                                className="w-5 h-5"
                                                style={{ color: product.primary_color || '#9C9480' }}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-[15px] font-semibold text-sand-900 truncate">
                                                    {product.name}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${product.status === 'active'
                                                    ? 'bg-green-50 text-green-700 border border-green-100'
                                                    : 'bg-sand-100 text-sand-600 border border-sand-200'
                                                    }`}>
                                                    {product.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-sand-500 line-clamp-1 mb-3">
                                                {product.description || 'No description provided'}
                                            </p>

                                            {/* Meta Info */}
                                            <div className="flex items-center gap-4 text-xs text-sand-500">
                                                {product.domain && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Globe className="w-3.5 h-3.5 text-sand-400" />
                                                        <span className="font-mono">{product.domain}</span>
                                                    </div>
                                                )}
                                                {product.knowledge_bases?.length > 0 && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Database className="w-3.5 h-3.5 text-sand-400" />
                                                        <span>{product.knowledge_bases.length} Knowledge Base{product.knowledge_bases.length > 1 ? 's' : ''}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions - Always visible */}
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/admin/products/${product.id}/knowledge-sources`}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sand-600 hover:text-sand-800 hover:bg-sand-100 rounded-lg transition-colors"
                                        >
                                            <Zap className="w-3.5 h-3.5" />
                                            Sources
                                        </Link>
                                        <Link
                                            href={`/marketing?productId=${product.id}`}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                        >
                                            <Rocket className="w-3.5 h-3.5" />
                                            Marketing
                                        </Link>
                                        <Link
                                            href={`/admin/products/${product.id}/settings`}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sand-600 hover:text-sand-800 hover:bg-sand-100 rounded-lg transition-colors"
                                        >
                                            <Settings className="w-3.5 h-3.5" />
                                            Settings
                                        </Link>
                                        <Link
                                            href={`/admin/test-chat?productId=${product.id}&name=${encodeURIComponent(product.name)}`}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-terracotta-600 hover:text-terracotta-700 hover:bg-terracotta-50 rounded-lg transition-colors"
                                        >
                                            Test
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Stats */}
            {products.length > 0 && (
                <div className="mt-10 pt-8 border-t border-sand-200">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-semibold text-sand-900">{products.length}</div>
                            <div className="text-sm text-sand-500">Total Products</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-semibold text-sand-900">
                                {products.filter(p => p.status === 'active').length}
                            </div>
                            <div className="text-sm text-sand-500">Active</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-semibold text-sand-900">
                                {products.reduce((sum, p) => sum + (p.knowledge_bases?.length || 0), 0)}
                            </div>
                            <div className="text-sm text-sand-500">Knowledge Bases</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
