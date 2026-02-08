'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Rocket,
    Settings,
    Lightbulb,
    PenTool,
    Share2,
    BarChart3,
    Calendar,
    Brain,
    ChevronLeft,
    Sparkles,
    Target,
    TrendingUp,
    Menu,
    X,
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

type MarketingTab = 'dashboard' | 'accounts' | 'profile' | 'ideas' | 'blog' | 'social' | 'calendar';

export default function MarketingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [loading, setLoading] = useState(true);
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
                router.push('/login');
                return;
            }

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
                    {activeTab === 'calendar' && (
                        <ContentCalendarView productId={productId} />
                    )}
                </div>
            </main>
        </div>
    );
}

// Content Calendar Component (simplified)
function ContentCalendarView({ productId }: { productId: string }) {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        fetchCalendar();
    }, [productId, currentMonth]);

    const fetchCalendar = async () => {
        try {
            const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

            const res = await fetch(
                `/api/marketing/calendar?product_id=${productId}&start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`
            );
            const data = await res.json();
            setEntries(data.entries || []);
        } catch (error) {
            console.error('Error fetching calendar:', error);
        } finally {
            setLoading(false);
        }
    };

    const autoSchedule = async () => {
        try {
            const res = await fetch('/api/marketing/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'auto_schedule',
                    product_id: productId,
                    days_ahead: 14
                })
            });
            const data = await res.json();
            if (data.entries) {
                setEntries([...entries, ...data.entries]);
            }
        } catch (error) {
            console.error('Error auto-scheduling:', error);
        }
    };

    // Generate calendar days
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const days = [];

    // Empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="h-24 bg-sand-50/50"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEntries = entries.filter(e => e.entry_date === dateStr);
        const isToday = new Date().toISOString().split('T')[0] === dateStr;

        days.push(
            <div
                key={day}
                className={`h-24 border border-sand-100 p-2 ${isToday ? 'bg-terracotta-50 border-terracotta-200' : 'bg-white'} hover:bg-sand-50 transition-colors`}
            >
                <div className={`text-sm font-medium ${isToday ? 'text-terracotta-700' : 'text-sand-600'}`}>{day}</div>
                <div className="mt-1 space-y-1 overflow-hidden">
                    {dayEntries.slice(0, 2).map((entry, i) => (
                        <div
                            key={i}
                            className={`text-xs px-1.5 py-0.5 rounded truncate ${entry.entry_type === 'blog' ? 'bg-orange-100 text-orange-700' :
                                'bg-sky-100 text-sky-700'
                                }`}
                        >
                            {entry.title}
                        </div>
                    ))}
                    {dayEntries.length > 2 && (
                        <div className="text-[10px] text-sand-400">+{dayEntries.length - 2} more</div>
                    )}
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-6 h-6 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="px-6 py-4 border-b border-sand-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="p-2 hover:bg-sand-100 rounded-lg"
                        aria-label="Previous month"
                        title="Previous month"
                    >
                        <ChevronLeft className="w-5 h-5 text-sand-600" />
                    </button>
                    <h2 className="text-lg font-semibold text-sand-800">
                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        className="p-2 hover:bg-sand-100 rounded-lg rotate-180"
                        aria-label="Next month"
                        title="Next month"
                    >
                        <ChevronLeft className="w-5 h-5 text-sand-600" />
                    </button>
                </div>
                <button
                    onClick={autoSchedule}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-sm font-medium transition-all"
                >
                    <Sparkles className="w-4 h-4" />
                    Auto-Schedule
                </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-sand-100">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 text-center text-sm font-medium text-sand-500 bg-sand-50">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
                {days}
            </div>
        </div>
    );
}
