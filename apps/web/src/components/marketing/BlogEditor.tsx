'use client';
import { sanitizeHtml } from '@/lib/utils/sanitize';

import { useState, useEffect } from 'react';
import {
    PenTool,
    Sparkles,
    Save,
    Send,
    Eye,
    EyeOff,
    Copy,
    Check,
    Loader2,
    FileText,
    Target,
    BarChart3,
    Lightbulb,
    AlertCircle,
    CheckCircle,
    Info
} from 'lucide-react';
import { BlogPost, ContentScore } from '@/lib/marketing/types';

interface BlogEditorProps {
    productId: string;
    blogId?: string;
    ideaId?: string;
    ideaTitle?: string;
    onSave?: (blog: BlogPost) => void;
    onPublish?: (blog: BlogPost) => void;
}

export default function BlogEditor({ productId, blogId, ideaId, ideaTitle, onSave, onPublish }: BlogEditorProps) {
    const [blog, setBlog] = useState<Partial<BlogPost>>({
        title: ideaTitle || '',
        content: '',
        excerpt: '',
        meta_title: '',
        meta_description: '',
        tags: [],
        keywords: [],
        faqs: [],
        definitions: [],
        key_takeaways: [],
        status: 'draft'
    });
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [score, setScore] = useState<ContentScore | null>(null);
    const [scoringLoading, setScoringLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Keyword input
    const [newKeyword, setNewKeyword] = useState('');
    const [newTag, setNewTag] = useState('');

    useEffect(() => {
        if (blogId) {
            fetchBlog();
        }
    }, [blogId]);

    const fetchBlog = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/marketing/blog?product_id=${productId}&id=${blogId}`);
            const data = await res.json();
            if (data.post) {
                setBlog(data.post);
            }
        } catch (error) {
            console.error('Error fetching blog:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateBlog = async () => {
        if (!blog.title) return;

        setGenerating(true);
        try {
            const res = await fetch('/api/marketing/blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate',
                    product_id: productId,
                    idea_id: ideaId,
                    title: blog.title,
                    keywords: blog.keywords,
                    target_word_count: 2500
                })
            });
            const data = await res.json();
            if (data.post) {
                setBlog(data.post);
                setScore({
                    seo_score: data.post.seo_score || 0,
                    aeo_score: data.post.aeo_score || 0,
                    readability_score: data.post.readability_score || 0,
                    viral_potential: 0,
                    issues: [],
                    suggestions: []
                });
            }
        } catch (error) {
            console.error('Error generating blog:', error);
        } finally {
            setGenerating(false);
        }
    };

    const saveBlog = async () => {
        setSaving(true);
        try {
            const method = blog.id ? 'PATCH' : 'POST';
            const body = blog.id ? { id: blog.id, ...blog } : { product_id: productId, idea_id: ideaId, ...blog };

            const res = await fetch('/api/marketing/blog', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.post) {
                setBlog(data.post);
                onSave?.(data.post);
            }
        } catch (error) {
            console.error('Error saving blog:', error);
        } finally {
            setSaving(false);
        }
    };

    const publishBlog = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/marketing/blog', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: blog.id,
                    status: 'published'
                })
            });
            const data = await res.json();
            if (data.post) {
                setBlog(data.post);
                onPublish?.(data.post);
            }
        } catch (error) {
            console.error('Error publishing blog:', error);
        } finally {
            setSaving(false);
        }
    };

    const scoreContent = async () => {
        if (!blog.content) return;

        setScoringLoading(true);
        try {
            const res = await fetch('/api/marketing/blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'score',
                    product_id: productId,
                    content: blog.content,
                    keywords: blog.keywords
                })
            });
            const data = await res.json();
            if (data.score) {
                setScore(data.score);
            }
        } catch (error) {
            console.error('Error scoring content:', error);
        } finally {
            setScoringLoading(false);
        }
    };

    const optimizeForAEO = async () => {
        if (!blog.content) return;

        setGenerating(true);
        try {
            const res = await fetch('/api/marketing/blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'optimize',
                    product_id: productId,
                    id: blog.id,
                    content: blog.content
                })
            });
            const data = await res.json();
            if (data.post) {
                setBlog(data.post);
            } else if (data.optimized) {
                setBlog({
                    ...blog,
                    content: data.optimized.optimized_content,
                    faqs: data.optimized.added_faqs,
                    definitions: data.optimized.added_definitions
                });
            }
        } catch (error) {
            console.error('Error optimizing content:', error);
        } finally {
            setGenerating(false);
        }
    };

    const copyContent = () => {
        navigator.clipboard.writeText(blog.content || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const addKeyword = () => {
        if (!newKeyword.trim()) return;
        const updated = [...(blog.keywords || []), newKeyword.trim()];
        setBlog({ ...blog, keywords: updated });
        setNewKeyword('');
    };

    const removeKeyword = (kw: string) => {
        setBlog({ ...blog, keywords: (blog.keywords || []).filter(k => k !== kw) });
    };

    const ScoreBadge = ({ label, score: value, color }: { label: string; score: number; color: string }) => (
        <div className="text-center">
            <div className={`text-2xl font-bold ${color}`}>{Math.round(value)}</div>
            <div className="text-[10px] text-sand-500 uppercase tracking-wider">{label}</div>
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
        <div className="flex gap-6">
            {/* Main Editor */}
            <div className="flex-1 bg-white rounded-2xl border border-sand-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-sand-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <PenTool className="w-5 h-5 text-terracotta-500" />
                        <h2 className="text-lg font-semibold text-sand-900">Blog Editor</h2>
                        {blog.status && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${blog.status === 'published' ? 'bg-green-100 text-green-700' :
                                blog.status === 'review' ? 'bg-amber-100 text-amber-700' :
                                    'bg-sand-100 text-sand-600'
                                }`}>
                                {blog.status}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-sand-600 hover:text-sand-800 hover:bg-sand-50 rounded-lg transition-colors"
                        >
                            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {showPreview ? 'Edit' : 'Preview'}
                        </button>
                        <button
                            onClick={copyContent}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-sand-600 hover:text-sand-800 hover:bg-sand-50 rounded-lg transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={saveBlog}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-1.5 bg-sand-100 hover:bg-sand-200 text-sand-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save
                        </button>
                        {blog.id && blog.status !== 'published' && (
                            <button
                                onClick={publishBlog}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <Send className="w-4 h-4" />
                                Publish
                            </button>
                        )}
                    </div>
                </div>

                {/* Title & Meta */}
                <div className="px-6 py-4 border-b border-sand-100 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-sand-700 mb-1">Title</label>
                        <input
                            value={blog.title || ''}
                            onChange={e => setBlog({ ...blog, title: e.target.value })}
                            className="w-full px-4 py-2 border border-sand-200 rounded-xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-lg"
                            placeholder="Enter blog title..."
                        />
                    </div>

                    {/* Keywords */}
                    <div>
                        <label className="block text-sm font-medium text-sand-700 mb-1">Target Keywords</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {(blog.keywords || []).map(kw => (
                                <span key={kw} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center gap-1">
                                    {kw}
                                    <button onClick={() => removeKeyword(kw)} className="text-blue-500 hover:text-blue-700">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={newKeyword}
                                onChange={e => setNewKeyword(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && addKeyword()}
                                className="flex-1 px-3 py-1.5 border border-sand-200 rounded-lg text-sm"
                                placeholder="Add keyword..."
                            />
                            <button onClick={addKeyword} className="px-3 py-1.5 bg-sand-100 hover:bg-sand-200 rounded-lg text-sm">Add</button>
                        </div>
                    </div>

                    {/* Generate Button */}
                    {!blog.content && (
                        <button
                            onClick={generateBlog}
                            disabled={generating || !blog.title}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating with AI...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate Blog with AI
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Content Editor / Preview */}
                <div className="p-6">
                    {showPreview ? (
                        <div className="prose prose-sand max-w-none">
                            <h1>{blog.title}</h1>
                            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(blog.content_html || blog.content?.replace(/\n/g, '<br/>') || '') }} />
                        </div>
                    ) : (
                        <textarea
                            value={blog.content || ''}
                            onChange={e => setBlog({ ...blog, content: e.target.value })}
                            className="w-full h-[500px] px-4 py-3 border border-sand-200 rounded-xl font-mono text-sm resize-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
                            placeholder="Write your blog content in Markdown..."
                        />
                    )}
                </div>

                {/* SEO Meta */}
                <div className="px-6 pb-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-sand-700 mb-1">Meta Title (60 chars)</label>
                        <input
                            value={blog.meta_title || ''}
                            onChange={e => setBlog({ ...blog, meta_title: e.target.value })}
                            className="w-full px-4 py-2 border border-sand-200 rounded-xl text-sm"
                            placeholder="SEO meta title..."
                            maxLength={60}
                        />
                        <div className="text-xs text-sand-400 mt-1">{(blog.meta_title || '').length}/60</div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-sand-700 mb-1">Meta Description (160 chars)</label>
                        <textarea
                            value={blog.meta_description || ''}
                            onChange={e => setBlog({ ...blog, meta_description: e.target.value })}
                            className="w-full px-4 py-2 border border-sand-200 rounded-xl text-sm resize-none"
                            rows={2}
                            placeholder="SEO meta description..."
                            maxLength={160}
                        />
                        <div className="text-xs text-sand-400 mt-1">{(blog.meta_description || '').length}/160</div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-sand-700 mb-1">Excerpt</label>
                        <textarea
                            value={blog.excerpt || ''}
                            onChange={e => setBlog({ ...blog, excerpt: e.target.value })}
                            className="w-full px-4 py-2 border border-sand-200 rounded-xl text-sm resize-none"
                            rows={2}
                            placeholder="Brief excerpt for social sharing..."
                        />
                    </div>
                </div>
            </div>

            {/* Sidebar - Scoring & Analysis */}
            <div className="w-80 space-y-4">
                {/* Score Card */}
                <div className="bg-white rounded-2xl border border-sand-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-sand-800">Content Score</h3>
                        <button
                            onClick={scoreContent}
                            disabled={scoringLoading || !blog.content}
                            className="text-sm text-terracotta-600 hover:text-terracotta-700 disabled:opacity-50"
                        >
                            {scoringLoading ? 'Scoring...' : 'Refresh'}
                        </button>
                    </div>

                    {score ? (
                        <>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <ScoreBadge label="SEO" score={score.seo_score} color="text-blue-600" />
                                <ScoreBadge label="AEO" score={score.aeo_score} color="text-purple-600" />
                                <ScoreBadge label="Read" score={score.readability_score} color="text-green-600" />
                            </div>

                            {/* Issues */}
                            {score.issues.length > 0 && (
                                <div className="space-y-2">
                                    {score.issues.map((issue, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-start gap-2 p-2 rounded-lg text-sm ${issue.type === 'error' ? 'bg-red-50 text-red-700' :
                                                issue.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                                                    'bg-blue-50 text-blue-700'
                                                }`}
                                        >
                                            {issue.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> :
                                                issue.type === 'warning' ? <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> :
                                                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                                            <div>
                                                <p>{issue.message}</p>
                                                {issue.fix && <p className="text-xs opacity-75 mt-1">Fix: {issue.fix}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-sand-400">
                            <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Add content to see scores</p>
                        </div>
                    )}
                </div>

                {/* Optimize Button */}
                <button
                    onClick={optimizeForAEO}
                    disabled={generating || !blog.content}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                >
                    {generating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Target className="w-4 h-4" />
                    )}
                    Optimize for AI Citations
                </button>

                {/* Stats */}
                {blog.content && (
                    <div className="bg-white rounded-2xl border border-sand-200 p-4">
                        <h3 className="font-semibold text-sand-800 mb-3">Stats</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-sand-500">Words</span>
                                <span className="font-medium text-sand-700">{blog.word_count || blog.content.split(/\s+/).length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sand-500">Read time</span>
                                <span className="font-medium text-sand-700">{blog.read_time_minutes || Math.ceil((blog.content.split(/\s+/).length) / 200)} min</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sand-500">FAQs</span>
                                <span className="font-medium text-sand-700">{(blog.faqs || []).length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sand-500">Definitions</span>
                                <span className="font-medium text-sand-700">{(blog.definitions || []).length}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* FAQs */}
                {(blog.faqs || []).length > 0 && (
                    <div className="bg-white rounded-2xl border border-sand-200 p-4">
                        <h3 className="font-semibold text-sand-800 mb-3">FAQs ({blog.faqs?.length})</h3>
                        <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                            {blog.faqs?.map((faq, i) => (
                                <div key={i} className="p-2 bg-sand-50 rounded-lg">
                                    <p className="font-medium text-sand-700">{faq.question}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
