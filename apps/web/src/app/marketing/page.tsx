'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Rocket,
    Settings,
    Lightbulb,
    PenTool,
    Share2,
    BarChart3,
    Calendar,
    ChevronLeft,
    Sparkles,
    Target,
    TrendingUp,
    Menu,
    Link2
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

// Components
import MarketingProfileEditor from '@/components/marketing/MarketingProfileEditor';
import ContentIdeasPanel from '@/components/marketing/ContentIdeasPanel';
import BlogEditor from '@/components/marketing/BlogEditor';
import SocialPostGenerator from '@/components/marketing/SocialPostGenerator';
import MarketingDashboard from '@/components/marketing/MarketingDashboard';
import ProductSocialAccounts from '@/components/marketing/ProductSocialAccounts';
import SocialCalendar from '@/components/social/SocialCalendar';
import { createProductOwner } from '@/lib/social/owner-context';

type MarketingTab = 'dashboard' | 'accounts' | 'profile' | 'ideas' | 'blog' | 'social' | 'calendar';

export default function MarketingPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" /></div>}>
            <MarketingPageContent />
        </Suspense>
    );
}

function MarketingPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [productId, setProductId] = useState<string | null>(null);
    const [productName, setProductName] = useState<string>('');
    const [productSlug, setProductSlug] = useState<string>('');
    const [activeTab, setActiveTab] = useState<MarketingTab>(
        (searchParams.get('tab') as MarketingTab) || 'dashboard'
    );
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // For content creation flow
    const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
    const [selectedIdeaTitle, setSelectedIdeaTitle] = useState<string>('');
    const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);

    useEffect(() => {
        fetchProduct();
    }, []);

    const fetchProduct = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push(productSlug ? `/p/${productSlug}/auth` : '/auth/login');
                return;
            }
            setUserId(user.id);

            // Check if productId is passed in URL (admin-level access)
            const urlProductId = searchParams.get('productId');

            if (urlProductId) {
                // Admin mode: Fetch the specific product by ID
                const { data: product, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', urlProductId)
                    .single();

                if (product && !error) {
                    setProductId(product.id);
                    setProductName(product.name);
                    setProductSlug(product.slug);
                } else {
                    console.error('Product not found:', urlProductId);
                    router.push('/admin/products');
                }
            } else {
                // User mode: Get user's first product (fallback for backward compatibility)
                const { data: products } = await supabase
                    .from('products')
                    .select('*')
                    .eq('created_by', user.id)
                    .limit(1);

                if (products?.[0]) {
                    setProductId(products[0].id);
                    setProductName(products[0].name);
                    setProductSlug(products[0].slug);
                }
            }
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'dashboard' as MarketingTab, label: 'Dashboard', icon: BarChart3, description: 'Analytics & insights' },
        { id: 'accounts' as MarketingTab, label: 'Accounts', icon: Link2, description: 'Connected platforms' },
        { id: 'profile' as MarketingTab, label: 'Profile', icon: Settings, description: 'Marketing configuration' },
        { id: 'ideas' as MarketingTab, label: 'Ideas', icon: Lightbulb, description: 'Content idea pipeline' },
        { id: 'blog' as MarketingTab, label: 'Blog', icon: PenTool, description: 'Create blog posts' },
        { id: 'social' as MarketingTab, label: 'Social', icon: Share2, description: 'Generate social posts' },
        { id: 'calendar' as MarketingTab, label: 'Calendar', icon: Calendar, description: 'Content schedule' }
    ];

    const handleSelectIdea = (idea: any) => {
        setSelectedIdeaId(idea.id);
        setSelectedIdeaTitle(idea.title);
        if (idea.content_type === 'blog') {
            setActiveTab('blog');
        } else {
            setActiveTab('social');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-sand-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sand-500">Loading Marketing Engine...</p>
                </div>
            </div>
        );
    }

    if (!productId) {
        return (
            <div className="min-h-screen bg-sand-50 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-terracotta-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
                        <Rocket className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-sand-800 mb-2">No Product Found</h2>
                    <p className="text-sand-500 mb-6">You need to create a product first before using the Marketing Engine.</p>
                    <button
                        onClick={() => router.push('/onboarding')}
                        className="px-6 py-3 bg-sand-800 hover:bg-sand-900 text-white rounded-xl font-medium transition-colors"
                    >
                        Create Your Product
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-sand-50 flex">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-sand-200 flex flex-col transition-all duration-300`}>
                {/* Logo */}
                <div className="p-4 border-b border-sand-100 flex items-center justify-between">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta-400 to-orange-500 flex items-center justify-center">
                                <Rocket className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-semibold text-sand-800">Marketing</h1>
                                <p className="text-xs text-sand-400">AI Engine</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta-400 to-orange-500 flex items-center justify-center mx-auto">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-sand-100 rounded-lg text-sand-400"
                        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>

                {/* Product Info */}
                {sidebarOpen && (
                    <div className="px-4 py-3 border-b border-sand-100">
                        <p className="text-xs text-sand-400 uppercase tracking-wider mb-1">Product</p>
                        <p className="font-medium text-sand-800 truncate">{productName || 'Your Product'}</p>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 p-2">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 ${isActive
                                    ? 'bg-terracotta-50 text-terracotta-700'
                                    : 'text-sand-600 hover:bg-sand-50 hover:text-sand-800'
                                    }`}
                                title={tab.label}
                            >
                                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-terracotta-500' : 'text-sand-400'}`} />
                                {sidebarOpen && (
                                    <div className="flex-1 text-left">
                                        <span>{tab.label}</span>
                                        <p className={`text-xs ${isActive ? 'text-terracotta-500' : 'text-sand-400'}`}>
                                            {tab.description}
                                        </p>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Quick Actions */}
                {sidebarOpen && (
                    <div className="p-4 border-t border-sand-100">
                        <p className="text-xs text-sand-400 uppercase tracking-wider mb-3">Quick Actions</p>
                        <div className="space-y-2">
                            <button
                                onClick={() => setActiveTab('ideas')}
                                className="w-full flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
                            >
                                <Sparkles className="w-4 h-4" />
                                Generate Ideas
                            </button>
                            <button
                                onClick={() => setActiveTab('blog')}
                                className="w-full flex items-center gap-2 px-3 py-2 bg-sand-100 hover:bg-sand-200 text-sand-700 rounded-xl text-sm font-medium transition-all"
                            >
                                <PenTool className="w-4 h-4" />
                                Write Blog
                            </button>
                        </div>
                    </div>
                )}

                {/* Back to Dashboard */}
                <div className="p-4 border-t border-sand-100">
                    <button
                        onClick={() => router.push(productSlug ? `/p/${productSlug}/dashboard` : '/dashboard')}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sand-500 hover:text-sand-700 hover:bg-sand-50 rounded-xl text-sm transition-all ${!sidebarOpen ? 'justify-center' : ''}`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {sidebarOpen && 'Back to Dashboard'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="bg-white border-b border-sand-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-sand-900">
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h1>
                            <p className="text-sm text-sand-500">
                                {tabs.find(t => t.id === activeTab)?.description}
                            </p>
                        </div>

                        {/* AEO Score Badge */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl">
                                <Target className="w-5 h-5 text-purple-500" />
                                <div>
                                    <p className="text-xs text-purple-600">AEO Score</p>
                                    <p className="font-bold text-purple-700">72%</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                <div>
                                    <p className="text-xs text-green-600">LLM Citations</p>
                                    <p className="font-bold text-green-700">12</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-6">
                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                        <MarketingDashboard productId={productId} />
                    )}

                    {/* Accounts Tab */}
                    {activeTab === 'accounts' && (
                        <ProductSocialAccounts productId={productId} productName={productName} />
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <MarketingProfileEditor productId={productId} />
                    )}

                    {/* Ideas Tab */}
                    {activeTab === 'ideas' && (
                        <ContentIdeasPanel
                            productId={productId}
                            onSelectIdea={handleSelectIdea}
                        />
                    )}

                    {/* Blog Tab */}
                    {activeTab === 'blog' && (
                        <BlogEditor
                            productId={productId}
                            blogId={selectedBlogId || undefined}
                            ideaId={selectedIdeaId || undefined}
                            ideaTitle={selectedIdeaTitle}
                            onSave={(blog) => {
                                setSelectedBlogId(blog.id);
                                setSelectedIdeaId(null);
                                setSelectedIdeaTitle('');
                            }}
                            onPublish={(blog) => {
                                setSelectedBlogId(null);
                                setSelectedIdeaId(null);
                                setSelectedIdeaTitle('');
                            }}
                        />
                    )}

                    {/* Social Tab */}
                    {activeTab === 'social' && (
                        <SocialPostGenerator
                            productId={productId}
                            blogId={selectedBlogId || undefined}
                            blogTitle={selectedIdeaTitle}
                        />
                    )}

                    {/* Calendar Tab */}
                    {activeTab === 'calendar' && productId && userId && (
                        <SocialCalendar
                            owner={createProductOwner(productId, userId, productSlug || productId, productName)}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
