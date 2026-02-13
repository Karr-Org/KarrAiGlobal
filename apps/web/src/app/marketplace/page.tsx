'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search,
    Sparkles,
    Users,
    ArrowRight,
    Globe,
    Filter,
    Star,
    X,
} from 'lucide-react';

interface MarketplaceProduct {
    id: string;
    name: string;
    slug: string;
    description: string;
    tagline: string | null;
    category: string;
    primaryColor: string;
    domain: string | null;
    isFeatured: boolean;
    userCount: number;
    creator: { name: string; company: string | null } | null;
}

const categories = [
    { value: '', label: 'All Categories' },
    { value: 'legal', label: 'Legal & Compliance' },
    { value: 'finance', label: 'Finance & Tax' },
    { value: 'health', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'tech', label: 'Technology' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'hr', label: 'HR & People' },
    { value: 'general', label: 'General' },
    { value: 'other', label: 'Other' },
];

export default function MarketplacePage() {
    const [products, setProducts] = useState<MarketplaceProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadProducts();
    }, [category]);

    const loadProducts = async (searchQuery?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery || search) params.set('search', searchQuery || search);
            if (category) params.set('category', category);
            params.set('limit', '50');

            const res = await fetch(`/api/marketplace/products?${params}`);
            const data = await res.json();
            setProducts(data.products || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error('Failed to load marketplace:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadProducts(search);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">MakeMyAI</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/creator/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                                Creator Login
                            </Link>
                            <Link
                                href="/creator/signup"
                                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-violet-700 hover:to-indigo-700"
                            >
                                Become a Creator
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="bg-gradient-to-br from-violet-700 via-indigo-800 to-violet-900 py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                        Discover AI Products
                    </h1>
                    <p className="text-lg text-violet-200 mb-8 max-w-2xl mx-auto">
                        Browse specialized AI assistants built by experts. Find the perfect tool for your industry.
                    </p>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex max-w-xl mx-auto">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search AI products..."
                                className="w-full pl-12 pr-4 py-3.5 rounded-l-xl border-0 focus:ring-2 focus:ring-violet-300 text-gray-900 text-lg"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-3.5 bg-violet-600 text-white rounded-r-xl font-medium hover:bg-violet-500 transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </div>
            </section>

            {/* Filters + Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Category Filters */}
                <div className="flex flex-wrap items-center gap-2 mb-8">
                    <Filter className="w-4 h-4 text-gray-400" />
                    {categories.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setCategory(cat.value)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${category === cat.value
                                    ? 'bg-violet-100 text-violet-700'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                    {(search || category) && (
                        <button
                            onClick={() => { setSearch(''); setCategory(''); loadProducts(''); }}
                            className="px-3 py-1.5 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-1"
                        >
                            <X className="w-3 h-3" /> Clear
                        </button>
                    )}
                </div>

                {/* Results Count */}
                <p className="text-sm text-gray-500 mb-6">{total} product{total !== 1 && 's'} found</p>

                {/* Product Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map(product => (
                            <Link
                                key={product.id}
                                href={`/p/${product.slug}`}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-violet-200 transition-all group"
                            >
                                {/* Color Banner */}
                                <div
                                    className="h-2"
                                    style={{ backgroundColor: product.primaryColor }}
                                />

                                <div className="p-6">
                                    {product.isFeatured && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 mb-3">
                                            <Star className="w-3 h-3" /> Featured
                                        </span>
                                    )}

                                    <div className="flex items-start gap-3 mb-3">
                                        <div
                                            className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                                            style={{ backgroundColor: product.primaryColor }}
                                        >
                                            {product.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 group-hover:text-violet-700 transition-colors truncate">
                                                {product.name}
                                            </h3>
                                            {product.tagline && (
                                                <p className="text-xs text-gray-500 truncate">{product.tagline}</p>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                        {product.description || 'AI-powered assistant'}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="capitalize bg-gray-100 px-2 py-0.5 rounded">{product.category}</span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {product.userCount}
                                            </span>
                                            {product.domain && (
                                                <span className="flex items-center gap-1">
                                                    <Globe className="w-3 h-3" />
                                                </span>
                                            )}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-violet-600 transition-colors" />
                                    </div>

                                    {product.creator && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                                            by {product.creator.company || product.creator.name}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
