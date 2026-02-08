'use client';

import { useState, useEffect } from 'react';
import {
    Sparkles,
    Lightbulb,
    TrendingUp,
    Target,
    Zap,
    FileText,
    Twitter,
    Linkedin,
    Instagram,
    Youtube,
    Check,
    X,
    Loader2,
    ArrowRight,
    Filter,
    Calendar
} from 'lucide-react';
import { ContentIdea, IdeaStatus, ContentType } from '@/lib/marketing/types';

interface ContentIdeasPanelProps {
    productId: string;
    onSelectIdea?: (idea: ContentIdea) => void;
}

const contentTypeIcons: Record<string, React.ReactNode> = {
    blog: <FileText className="w-4 h-4" />,
    twitter_thread: <Twitter className="w-4 h-4" />,
    twitter_post: <Twitter className="w-4 h-4" />,
    linkedin_post: <Linkedin className="w-4 h-4" />,
    linkedin_article: <Linkedin className="w-4 h-4" />,
    instagram_post: <Instagram className="w-4 h-4" />,
    instagram_carousel: <Instagram className="w-4 h-4" />,
    video_script: <Youtube className="w-4 h-4" />
};

const statusColors: Record<IdeaStatus, string> = {
    idea: 'bg-gray-100 text-gray-600',
    approved: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-amber-100 text-amber-700',
    published: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    archived: 'bg-sand-100 text-sand-600'
};

export default function ContentIdeasPanel({ productId, onSelectIdea }: ContentIdeasPanelProps) {
    const [ideas, setIdeas] = useState<ContentIdea[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [filter, setFilter] = useState<IdeaStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');

    useEffect(() => {
        fetchIdeas();
    }, [productId, filter, typeFilter]);

    const fetchIdeas = async () => {
        try {
            let url = `/api/marketing/ideas?product_id=${productId}`;
            if (filter !== 'all') url += `&status=${filter}`;
            if (typeFilter !== 'all') url += `&content_type=${typeFilter}`;

            const res = await fetch(url);
            const data = await res.json();
            setIdeas(data.ideas || []);
        } catch (error) {
            console.error('Error fetching ideas:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateIdeas = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/marketing/ideas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate',
                    product_id: productId,
                    count: 10
                })
            });
            const data = await res.json();
            if (data.ideas) {
                setIdeas([...data.ideas, ...ideas]);
            }
        } catch (error) {
            console.error('Error generating ideas:', error);
        } finally {
            setGenerating(false);
        }
    };

    const updateIdeaStatus = async (ideaId: string, status: IdeaStatus) => {
        try {
            const res = await fetch('/api/marketing/ideas', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: ideaId, status })
            });
            const data = await res.json();
            if (data.idea) {
                setIdeas(ideas.map(i => i.id === ideaId ? data.idea : i));
            }
        } catch (error) {
            console.error('Error updating idea:', error);
        }
    };

    const ScoreBar = ({ label, score, color }: { label: string; score: number; color: string }) => (
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-sand-500 w-8">{label}</span>
            <div className="flex-1 h-1.5 bg-sand-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} rounded-full transition-all`}
                    style={{ width: `${score * 100}%` }}
                />
            </div>
            <span className="text-[10px] text-sand-600 w-6">{Math.round(score * 100)}%</span>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 text-sand-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-sand-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <Lightbulb className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-sand-900">Content Ideas</h2>
                            <p className="text-sm text-sand-500">{ideas.length} ideas in pipeline</p>
                        </div>
                    </div>
                    <button
                        onClick={generateIdeas}
                        disabled={generating}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generate Ideas
                            </>
                        )}
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <select
                        value={filter}
                        onChange={e => setFilter(e.target.value as IdeaStatus | 'all')}
                        className="px-3 py-1.5 text-sm border border-sand-200 rounded-lg bg-white"
                        aria-label="Filter by status"
                    >
                        <option value="all">All Status</option>
                        <option value="idea">Ideas</option>
                        <option value="approved">Approved</option>
                        <option value="in_progress">In Progress</option>
                        <option value="published">Published</option>
                    </select>
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value as ContentType | 'all')}
                        className="px-3 py-1.5 text-sm border border-sand-200 rounded-lg bg-white"
                        aria-label="Filter by content type"
                    >
                        <option value="all">All Types</option>
                        <option value="blog">Blog</option>
                        <option value="twitter_thread">Twitter Thread</option>
                        <option value="linkedin_post">LinkedIn Post</option>
                        <option value="instagram_carousel">Instagram Carousel</option>
                    </select>
                </div>
            </div>

            {/* Ideas List */}
            <div className="divide-y divide-sand-100 max-h-[600px] overflow-y-auto">
                {ideas.length === 0 ? (
                    <div className="text-center py-12">
                        <Lightbulb className="w-12 h-12 text-sand-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-sand-700 mb-2">No ideas yet</h3>
                        <p className="text-sand-500 mb-4">Click "Generate Ideas" to get AI-powered content suggestions</p>
                    </div>
                ) : (
                    ideas.map(idea => (
                        <div
                            key={idea.id}
                            className="p-4 hover:bg-sand-50 transition-colors cursor-pointer"
                            onClick={() => onSelectIdea?.(idea)}
                        >
                            <div className="flex items-start gap-3">
                                {/* Content Type Icon */}
                                <div className="w-8 h-8 rounded-lg bg-sand-100 flex items-center justify-center flex-shrink-0 text-sand-500">
                                    {contentTypeIcons[idea.content_type] || <FileText className="w-4 h-4" />}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-medium text-sand-800 truncate">{idea.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[idea.status]}`}>
                                            {idea.status}
                                        </span>
                                    </div>

                                    {idea.description && (
                                        <p className="text-sm text-sand-500 line-clamp-2 mb-2">{idea.description}</p>
                                    )}

                                    {/* Keywords */}
                                    {idea.target_keywords?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {idea.target_keywords.slice(0, 3).map(kw => (
                                                <span key={kw} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px]">
                                                    {kw}
                                                </span>
                                            ))}
                                            {idea.target_keywords.length > 3 && (
                                                <span className="text-[10px] text-sand-400">+{idea.target_keywords.length - 3} more</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Score Bars */}
                                    <div className="space-y-1 mb-2">
                                        <ScoreBar label="SEO" score={idea.seo_potential} color="bg-blue-500" />
                                        <ScoreBar label="AEO" score={idea.aeo_potential} color="bg-purple-500" />
                                        <ScoreBar label="Viral" score={idea.viral_potential} color="bg-pink-500" />
                                    </div>

                                    {/* Overall Score */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-amber-500" />
                                            <span className="text-sm font-medium text-sand-700">
                                                Score: {Math.round(idea.overall_score * 100)}%
                                            </span>
                                        </div>

                                        {/* Quick Actions */}
                                        {idea.status === 'idea' && (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateIdeaStatus(idea.id, 'approved');
                                                    }}
                                                    className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                    title="Approve"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateIdeaStatus(idea.id, 'rejected');
                                                    }}
                                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                    title="Reject"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        {idea.status === 'approved' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateIdeaStatus(idea.id, 'in_progress');
                                                }}
                                                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm"
                                            >
                                                Start <ArrowRight className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
