'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
    Plus,
    Globe,
    Users,
    ArrowRight,
    Clock,
    Search,
} from 'lucide-react';

interface Product {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    status: string;
    primary_color: string;
    user_count: number;
    created_at: string;
    category: string;
}

export default function CreatorProductsListPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const res = await fetch(`/api/creator/products?userId=${user.id}`);
            const data = await res.json();
            if (Array.isArray(data)) setProducts(data);
        } catch (err) {
            console.error('Failed to load products:', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto py-10 px-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-[#2d2d2d]">Products</h1>
                    <p className="text-[#8b8b8b] text-[13px] mt-0.5">{products.length} product{products.length !== 1 && 's'}</p>
                </div>
                <Link
                    href="/creator/products/new"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#c4715b] text-white rounded-lg text-[13px] font-medium hover:bg-[#b3624d] transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Product
                </Link>
            </div>

            {/* Search */}
            <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5b0a9]" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="input pl-9"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin w-6 h-6 border-2 border-[#c4715b] border-t-transparent rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-lg border border-[#e8e4df] p-10 text-center">
                    <p className="text-[#8b8b8b] text-sm">{search ? 'No products match your search' : 'No products yet'}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(product => (
                        <Link
                            key={product.id}
                            href={`/creator/products/${product.id}`}
                            className="block bg-white rounded-lg border border-[#e8e4df] px-5 py-4 hover:border-[#c4715b]/30 transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div
                                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                                        style={{ backgroundColor: product.primary_color || '#c4715b' }}
                                    >
                                        {product.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-[14px] font-medium text-[#2d2d2d] group-hover:text-[#c4715b] transition-colors">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center gap-2.5 mt-0.5 text-[12px] text-[#8b8b8b]">
                                            {product.domain ? (
                                                <span className="flex items-center gap-1">
                                                    <Globe className="w-3 h-3" />
                                                    {product.domain}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    /p/{product.slug}
                                                </span>
                                            )}
                                            <span>·</span>
                                            <span>{product.user_count} users</span>
                                            <span>·</span>
                                            <span className="capitalize">{product.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${product.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                        }`}>
                                        {product.status}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-[#d4d0cb] group-hover:text-[#c4715b] transition-colors" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
