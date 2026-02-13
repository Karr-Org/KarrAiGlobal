'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
    Package,
    Users,
    Globe,
    Plus,
    TrendingUp,
    ArrowRight,
    Clock,
} from 'lucide-react';

interface CreatorProfile {
    id: string;
    display_name: string;
    company_name: string | null;
    role: string;
    product_count: number;
    plan_status: string;
    platform_plans: {
        name: string;
        display_name: string;
        product_limit: number;
    } | null;
}

interface Product {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    status: string;
    description: string;
    primary_color: string;
    user_count: number;
    created_at: string;
}

export default function CreatorDashboardPage() {
    const [creator, setCreator] = useState<CreatorProfile | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const creatorRes = await fetch(`/api/creator/auth?userId=${user.id}`);
            const creatorData = await creatorRes.json();
            if (creatorData.exists) setCreator(creatorData.creator);

            const productsRes = await fetch(`/api/creator/products?userId=${user.id}`);
            const productsData = await productsRes.json();
            if (Array.isArray(productsData)) setProducts(productsData);
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalUsers = products.reduce((sum, p) => sum + (p.user_count || 0), 0);
    const activeProducts = products.filter(p => p.status === 'active').length;
    const domainsConfigured = products.filter(p => p.domain).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-6 h-6 border-2 border-[#c4715b] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-8">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-2xl font-semibold text-[#2d2d2d]">
                    Welcome back, {creator?.display_name || 'Creator'}
                </h1>
                <p className="text-[#8b8b8b] mt-1 text-sm">
                    {creator?.company_name && `${creator.company_name} · `}
                    {creator?.platform_plans?.display_name || 'Free'} Plan
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <StatCard label="Products" value={products.length} limit={creator?.platform_plans?.product_limit} icon={<Package className="w-4 h-4" />} />
                <StatCard label="Total Users" value={totalUsers} icon={<Users className="w-4 h-4" />} />
                <StatCard label="Active" value={activeProducts} icon={<TrendingUp className="w-4 h-4" />} />
                <StatCard label="Domains" value={domainsConfigured} icon={<Globe className="w-4 h-4" />} />
            </div>

            {/* Products */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-[#2d2d2d]">Your Products</h2>
                <Link
                    href="/creator/products/new"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#c4715b] text-white rounded-lg text-[13px] font-medium hover:bg-[#b3624d] transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Product
                </Link>
            </div>

            {products.length === 0 ? (
                <div className="bg-white rounded-lg border border-[#e8e4df] p-10 text-center">
                    <h3 className="text-[15px] font-medium text-[#2d2d2d] mb-1.5">Create your first product</h3>
                    <p className="text-[#8b8b8b] mb-5 text-sm max-w-sm mx-auto">
                        Upload knowledge, configure your AI, and go live in minutes.
                    </p>
                    <Link
                        href="/creator/products/new"
                        className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#c4715b] text-white rounded-lg text-sm font-medium hover:bg-[#b3624d] transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create Product
                    </Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {products.map(product => (
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
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${product.status === 'active'
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-amber-50 text-amber-700'
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

function StatCard({
    label,
    value,
    limit,
    icon,
}: {
    label: string;
    value: number;
    limit?: number;
    icon: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-lg border border-[#e8e4df] p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-[#8b8b8b] uppercase tracking-wide">{label}</span>
                <span className="text-[#b5b0a9]">{icon}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-xl font-semibold text-[#2d2d2d]">{value}</span>
                {limit !== undefined && (
                    <span className="text-[12px] text-[#b5b0a9]">/ {limit}</span>
                )}
            </div>
        </div>
    );
}
