'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp,
    Eye,
    Heart,
    MessageCircle,
    Share2,
    MousePointerClick,
    BarChart3,
    ArrowUp,
    ArrowDown,
    Minus,
    Calendar,
    Trophy,
    Zap,
    Brain,
    BotIcon
} from 'lucide-react';

interface MarketingDashboardProps {
    productId: string;
}

interface AnalyticsOverview {
    social: {
        total_posts: number;
        total_impressions: number;
        total_engagements: number;
        total_clicks: number;
        avg_engagement_rate: string | number;
    };
    blog: {
        total_posts: number;
        total_views: number;
        total_unique_visitors: number;
    };
    platform_breakdown: Record<string, {
        posts: number;
        impressions: number;
        engagements: number;
        clicks: number;
    }>;
}

interface TopPost {
    id: string;
    platform?: string;
    content?: string;
    title?: string;
    slug?: string;
    impressions?: number;
    engagements?: number;
    views?: number;
    shares?: number;
    published_at: string;
}

interface Learning {
    id: string;
    learning_type: string;
    insight: string;
    evidence: any;
    applied: boolean;
    confidence: number;
}

interface LLMCitation {
    id: string;
    llm_name: string;
    query: string;
    citation_text: string;
    content_type: string;
    discovered_at: string;
}

export default function MarketingDashboard({ productId }: MarketingDashboardProps) {
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    const [topContent, setTopContent] = useState<{ top_social_posts: TopPost[]; top_blog_posts: TopPost[] } | null>(null);
    const [learnings, setLearnings] = useState<Learning[]>([]);
    const [citations, setCitations] = useState<LLMCitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    useEffect(() => {
        fetchAllData();
    }, [productId, days]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [overviewRes, topRes, learningsRes, citationsRes] = await Promise.all([
                fetch(`/api/marketing/analytics?product_id=${productId}&type=overview&days=${days}`),
                fetch(`/api/marketing/analytics?product_id=${productId}&type=top_content`),
                fetch(`/api/marketing/analytics?product_id=${productId}&type=learnings`),
                fetch(`/api/marketing/analytics?product_id=${productId}&type=llm_citations`)
            ]);

            const [overviewData, topData, learningsData, citationsData] = await Promise.all([
                overviewRes.json(),
                topRes.json(),
                learningsRes.json(),
                citationsRes.json()
            ]);

            setOverview(overviewData.overview);
            setTopContent(topData);
            setLearnings(learningsData.learnings || []);
            setCitations(citationsData.citations || []);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateReport = async () => {
        try {
            const res = await fetch('/api/marketing/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_report',
                    product_id: productId
                })
            });
            const data = await res.json();
            console.log('Report generated:', data.report);
            fetchAllData();
        } catch (error) {
            console.error('Error generating report:', error);
        }
    };

    const MetricCard = ({ icon: Icon, label, value, change, color }: {
        icon: React.ComponentType<any>;
        label: string;
        value: string | number;
        change?: number;
        color: string
    }) => (
        <div className="bg-white rounded-xl border border-sand-200 p-4">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${color} bg-opacity-10 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
                </div>
                <span className="text-sm text-sand-500">{label}</span>
            </div>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-sand-900">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-sm ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-sand-400'
                        }`}>
                        {change > 0 ? <ArrowUp className="w-4 h-4" /> :
                            change < 0 ? <ArrowDown className="w-4 h-4" /> :
                                <Minus className="w-4 h-4" />}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-6 h-6 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-sand-900">Marketing Analytics</h2>
                    <p className="text-sm text-sand-500">Track performance and AI learnings</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={days}
                        onChange={e => setDays(Number(e.target.value))}
                        className="px-3 py-2 border border-sand-200 rounded-xl bg-white text-sm"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                    <button
                        onClick={generateReport}
                        className="px-4 py-2 bg-sand-800 hover:bg-sand-900 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    icon={Eye}
                    label="Total Impressions"
                    value={overview?.social.total_impressions || 0}
                    color="bg-blue-500"
                />
                <MetricCard
                    icon={Heart}
                    label="Total Engagements"
                    value={overview?.social.total_engagements || 0}
                    color="bg-pink-500"
                />
                <MetricCard
                    icon={MousePointerClick}
                    label="Total Clicks"
                    value={overview?.social.total_clicks || 0}
                    color="bg-green-500"
                />
                <MetricCard
                    icon={TrendingUp}
                    label="Avg. Engagement Rate"
                    value={`${overview?.social.avg_engagement_rate || 0}%`}
                    color="bg-purple-500"
                />
            </div>

            {/* Blog Stats */}
            <div className="grid grid-cols-3 gap-4">
                <MetricCard
                    icon={BarChart3}
                    label="Blog Views"
                    value={overview?.blog.total_views || 0}
                    color="bg-orange-500"
                />
                <MetricCard
                    icon={Eye}
                    label="Unique Visitors"
                    value={overview?.blog.total_unique_visitors || 0}
                    color="bg-cyan-500"
                />
                <MetricCard
                    icon={Share2}
                    label="Posts Published"
                    value={(overview?.social.total_posts || 0) + (overview?.blog.total_posts || 0)}
                    color="bg-indigo-500"
                />
            </div>

            {/* Platform Breakdown & Top Content */}
            <div className="grid grid-cols-2 gap-6">
                {/* Platform Breakdown */}
                <div className="bg-white rounded-2xl border border-sand-200 p-6">
                    <h3 className="font-semibold text-sand-800 mb-4">Platform Performance</h3>
                    <div className="space-y-3">
                        {overview?.platform_breakdown && Object.entries(overview.platform_breakdown).map(([platform, data]) => (
                            <div key={platform} className="flex items-center justify-between p-3 bg-sand-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-sand-700 capitalize">{platform}</span>
                                    <span className="text-xs text-sand-400">{data.posts} posts</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-blue-600">{data.impressions.toLocaleString()} imp</span>
                                    <span className="text-pink-600">{data.engagements.toLocaleString()} eng</span>
                                </div>
                            </div>
                        ))}
                        {(!overview?.platform_breakdown || Object.keys(overview.platform_breakdown).length === 0) && (
                            <div className="text-center py-8 text-sand-400">
                                No platform data yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Content */}
                <div className="bg-white rounded-2xl border border-sand-200 p-6">
                    <h3 className="font-semibold text-sand-800 mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Top Performing Content
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {topContent?.top_social_posts?.slice(0, 5).map((post, i) => (
                            <div key={post.id} className="flex items-start gap-3 p-3 bg-sand-50 rounded-xl">
                                <span className="w-6 h-6 rounded-lg bg-amber-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                                    {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-sand-700 truncate">{post.content?.substring(0, 60)}...</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-sand-400">
                                        <span className="capitalize">{post.platform}</span>
                                        <span>{post.engagements} engagements</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {topContent?.top_blog_posts?.slice(0, 3).map((post, i) => (
                            <div key={post.id} className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl">
                                <span className="w-6 h-6 rounded-lg bg-orange-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                                    B{i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-sand-700 truncate">{post.title}</p>
                                    <span className="text-xs text-sand-400">{post.views} views</span>
                                </div>
                            </div>
                        ))}
                        {(!topContent?.top_social_posts?.length && !topContent?.top_blog_posts?.length) && (
                            <div className="text-center py-8 text-sand-400">
                                No content data yet
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* LLM Citations - The Most Important Metric */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <BotIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sand-800">LLM Citations</h3>
                        <p className="text-sm text-sand-500">Times AI assistants referenced your content</p>
                    </div>
                    <div className="ml-auto">
                        <div className="text-3xl font-bold text-purple-600">{citations.length}</div>
                    </div>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto">
                    {citations.slice(0, 5).map(citation => (
                        <div key={citation.id} className="p-4 bg-white rounded-xl border border-purple-100">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                    {citation.llm_name}
                                </span>
                                <span className="text-xs text-sand-400">
                                    {new Date(citation.discovered_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-sand-600 mb-1">Query: "{citation.query}"</p>
                            <p className="text-sm text-sand-800 italic">"{citation.citation_text}"</p>
                        </div>
                    ))}
                    {citations.length === 0 && (
                        <div className="text-center py-8 text-purple-400">
                            <BotIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No LLM citations detected yet</p>
                            <p className="text-xs mt-1">Keep creating great content to get cited!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Learnings */}
            <div className="bg-white rounded-2xl border border-sand-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sand-800">AI Learnings</h3>
                        <p className="text-sm text-sand-500">Patterns discovered from your content performance</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {learnings.slice(0, 6).map(learning => (
                        <div key={learning.id} className="p-4 bg-sand-50 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${learning.applied ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {learning.applied ? 'Applied' : 'New'}
                                </span>
                                <span className="text-xs text-sand-400">{Math.round(learning.confidence * 100)}% confidence</span>
                            </div>
                            <p className="text-sm text-sand-700">{learning.insight}</p>
                        </div>
                    ))}
                    {learnings.length === 0 && (
                        <div className="col-span-2 text-center py-8 text-sand-400">
                            <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No learnings yet</p>
                            <p className="text-xs mt-1">The AI will learn from your content performance</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
