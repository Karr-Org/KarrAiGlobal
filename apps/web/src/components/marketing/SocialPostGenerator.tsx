'use client';

import { useState, useEffect } from 'react';
import {
    Twitter,
    Linkedin,
    Instagram,
    Youtube,
    Sparkles,
    Send,
    Copy,
    Check,
    Loader2,
    Hash,
    Image as ImageIcon,
    FileText,
    Repeat2,
    Calendar,
    Clock,
    ChevronDown,
    Plus,
    Edit3
} from 'lucide-react';
import { AISocialPost, Platform, SocialContentType } from '@/lib/marketing/types';

interface SocialPostGeneratorProps {
    productId: string;
    blogId?: string;
    blogTitle?: string;
    onPostGenerated?: (post: AISocialPost) => void;
}

const platformConfig: Record<Platform, { icon: React.ComponentType<any>; color: string; name: string; maxLength: number }> = {
    twitter: { icon: Twitter, color: 'bg-sky-500', name: 'Twitter/X', maxLength: 280 },
    linkedin: { icon: Linkedin, color: 'bg-blue-700', name: 'LinkedIn', maxLength: 3000 },
    instagram: { icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500', name: 'Instagram', maxLength: 2200 },
    facebook: { icon: FileText, color: 'bg-blue-600', name: 'Facebook', maxLength: 63206 },
    youtube: { icon: Youtube, color: 'bg-red-600', name: 'YouTube', maxLength: 5000 },
    medium: { icon: FileText, color: 'bg-gray-800', name: 'Medium', maxLength: 50000 },
    hashnode: { icon: FileText, color: 'bg-blue-500', name: 'Hashnode', maxLength: 50000 },
    reddit: { icon: FileText, color: 'bg-orange-600', name: 'Reddit', maxLength: 40000 },
    quora: { icon: FileText, color: 'bg-red-700', name: 'Quora', maxLength: 50000 },
    devto: { icon: FileText, color: 'bg-gray-900', name: 'Dev.to', maxLength: 50000 }
};

const contentTypes: { value: SocialContentType; label: string; platforms: Platform[] }[] = [
    { value: 'post', label: 'Simple Post', platforms: ['twitter', 'linkedin', 'instagram', 'facebook'] },
    { value: 'thread', label: 'Thread', platforms: ['twitter'] },
    { value: 'carousel', label: 'Carousel', platforms: ['instagram', 'linkedin'] },
    { value: 'reel', label: 'Video Script', platforms: ['youtube', 'instagram'] },
    { value: 'article', label: 'Article', platforms: ['linkedin', 'medium', 'hashnode'] },
    { value: 'answer', label: 'Answer', platforms: ['quora'] }
];

export default function SocialPostGenerator({ productId, blogId, blogTitle, onPostGenerated }: SocialPostGeneratorProps) {
    const [platform, setPlatform] = useState<Platform>('twitter');
    const [contentType, setContentType] = useState<SocialContentType>('post');
    const [topic, setTopic] = useState(blogTitle || '');
    const [content, setContent] = useState('');
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [threadParts, setThreadParts] = useState<string[]>([]);
    const [carouselSlides, setCarouselSlides] = useState<{ title: string; content: string; visual_prompt?: string }[]>([]);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [scheduledFor, setScheduledFor] = useState('');
    const [showSchedule, setShowSchedule] = useState(false);

    // New hashtag input
    const [newHashtag, setNewHashtag] = useState('');

    const config = platformConfig[platform];
    const PlatformIcon = config.icon;

    useEffect(() => {
        // Reset content type if not supported by new platform
        const supportedTypes = contentTypes.filter(t => t.platforms.includes(platform));
        if (!supportedTypes.find(t => t.value === contentType)) {
            setContentType(supportedTypes[0]?.value || 'post');
        }
    }, [platform]);

    const generatePost = async () => {
        if (!topic) return;

        setGenerating(true);
        try {
            const body: any = {
                action: 'generate',
                product_id: productId,
                platform,
                content_type: contentType,
                topic,
                blog_id: blogId,
                hashtag_count: 5
            };

            if (contentType === 'thread') {
                body.thread_length = 7;
            } else if (contentType === 'carousel') {
                body.carousel_slide_count = 8;
            }

            const res = await fetch('/api/marketing/social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.post) {
                setContent(data.post.content || '');
                setHashtags(data.post.hashtags || []);
                setThreadParts(data.post.thread_parts || []);
                setCarouselSlides(data.post.carousel_slides || []);
                onPostGenerated?.(data.post);
            }
        } catch (error) {
            console.error('Error generating post:', error);
        } finally {
            setGenerating(false);
        }
    };

    const repurposeBlog = async () => {
        if (!blogId) return;

        setGenerating(true);
        try {
            const res = await fetch('/api/marketing/social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'repurpose',
                    product_id: productId,
                    blog_id: blogId,
                    platforms: [platform]
                })
            });
            const data = await res.json();
            if (data.posts?.[0]) {
                const post = data.posts[0];
                setContent(post.content || '');
                setHashtags(post.hashtags || []);
                onPostGenerated?.(post);
            }
        } catch (error) {
            console.error('Error repurposing blog:', error);
        } finally {
            setGenerating(false);
        }
    };

    const savePost = async (status: 'draft' | 'scheduled' | 'published') => {
        setSaving(true);
        try {
            const res = await fetch('/api/marketing/social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: productId,
                    platform,
                    content_type: contentType,
                    content,
                    hashtags,
                    thread_parts: contentType === 'thread' ? threadParts : undefined,
                    carousel_slides: contentType === 'carousel' ? carouselSlides : undefined,
                    status,
                    scheduled_for: status === 'scheduled' ? scheduledFor : undefined,
                    blog_id: blogId
                })
            });
            const data = await res.json();
            if (data.post) {
                onPostGenerated?.(data.post);
                // Reset form
                setContent('');
                setHashtags([]);
                setThreadParts([]);
                setCarouselSlides([]);
                setTopic('');
            }
        } catch (error) {
            console.error('Error saving post:', error);
        } finally {
            setSaving(false);
        }
    };

    const copyContent = () => {
        const fullContent = contentType === 'thread'
            ? threadParts.join('\n\n---\n\n')
            : content + (hashtags.length ? '\n\n' + hashtags.map(h => `#${h}`).join(' ') : '');
        navigator.clipboard.writeText(fullContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const addHashtag = () => {
        if (!newHashtag.trim()) return;
        const tag = newHashtag.trim().replace(/^#/, '');
        if (!hashtags.includes(tag)) {
            setHashtags([...hashtags, tag]);
        }
        setNewHashtag('');
    };

    const removeHashtag = (tag: string) => {
        setHashtags(hashtags.filter(h => h !== tag));
    };

    const updateThreadPart = (index: number, value: string) => {
        const updated = [...threadParts];
        updated[index] = value;
        setThreadParts(updated);
    };

    const addThreadPart = () => {
        setThreadParts([...threadParts, '']);
    };

    const removeThreadPart = (index: number) => {
        setThreadParts(threadParts.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-sand-100">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center`}>
                        <PlatformIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-sand-900">Social Post Generator</h2>
                        <p className="text-sm text-sand-500">Create content for {config.name}</p>
                    </div>
                </div>
            </div>

            {/* Platform & Type Selector */}
            <div className="px-6 py-4 border-b border-sand-100 flex gap-4">
                {/* Platform Pills */}
                <div className="flex gap-2">
                    {Object.entries(platformConfig).slice(0, 5).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        return (
                            <button
                                key={key}
                                onClick={() => setPlatform(key as Platform)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${platform === key
                                    ? `${cfg.color} text-white shadow-lg`
                                    : 'bg-sand-100 text-sand-500 hover:bg-sand-200'
                                    }`}
                                aria-label={`Select ${cfg.name} platform`}
                                title={cfg.name}
                            >
                                <Icon className="w-5 h-5" />
                            </button>
                        );
                    })}
                </div>

                {/* Content Type */}
                <div className="flex-1">
                    <select
                        value={contentType}
                        onChange={e => setContentType(e.target.value as SocialContentType)}
                        className="w-full px-4 py-2 border border-sand-200 rounded-xl bg-white"
                        aria-label="Select content type"
                    >
                        {contentTypes
                            .filter(t => t.platforms.includes(platform))
                            .map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                    </select>
                </div>
            </div>

            {/* Topic Input */}
            <div className="px-6 py-4 border-b border-sand-100">
                <label className="block text-sm font-medium text-sand-700 mb-2">Topic / Main Message</label>
                <textarea
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className="w-full px-4 py-3 border border-sand-200 rounded-xl resize-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
                    rows={2}
                    placeholder="What's the main topic or message?"
                />
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={generatePost}
                        disabled={generating || !topic}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generate Post
                            </>
                        )}
                    </button>
                    {blogId && (
                        <button
                            onClick={repurposeBlog}
                            disabled={generating}
                            className="flex items-center gap-2 px-4 py-2.5 bg-sand-100 hover:bg-sand-200 text-sand-700 rounded-xl font-medium transition-all"
                        >
                            <Repeat2 className="w-4 h-4" />
                            From Blog
                        </button>
                    )}
                </div>
            </div>

            {/* Content Editor */}
            <div className="px-6 py-4">
                {/* Thread Editor */}
                {contentType === 'thread' && threadParts.length > 0 ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-sand-700">Thread ({threadParts.length} parts)</label>
                            <button onClick={addThreadPart} className="text-sm text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1">
                                <Plus className="w-4 h-4" /> Add Part
                            </button>
                        </div>
                        {threadParts.map((part, i) => (
                            <div key={i} className="relative group">
                                <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center font-bold -translate-x-1/2 -translate-y-1/2 z-10">
                                    {i + 1}
                                </div>
                                <textarea
                                    value={part}
                                    onChange={e => updateThreadPart(i, e.target.value)}
                                    className="w-full pl-6 pr-10 py-3 border border-sand-200 rounded-xl resize-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                    rows={3}
                                    maxLength={280}
                                    aria-label={`Thread part ${i + 1}`}
                                    placeholder="Write tweet content..."
                                />
                                <div className="absolute right-2 top-2 text-xs text-sand-400">{part.length}/280</div>
                                {threadParts.length > 1 && (
                                    <button
                                        onClick={() => removeThreadPart(i)}
                                        className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 text-sand-400 hover:text-red-500 transition-all"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : contentType === 'carousel' && carouselSlides.length > 0 ? (
                    /* Carousel Editor */
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-sand-700 mb-2">Carousel Slides ({carouselSlides.length})</label>
                        <div className="grid grid-cols-2 gap-3">
                            {carouselSlides.map((slide, i) => (
                                <div key={i} className="p-4 border border-sand-200 rounded-xl bg-sand-50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-6 h-6 rounded-lg bg-pink-500 text-white text-xs flex items-center justify-center font-bold">
                                            {i + 1}
                                        </span>
                                        <input
                                            value={slide.title}
                                            onChange={e => {
                                                const updated = [...carouselSlides];
                                                updated[i] = { ...slide, title: e.target.value };
                                                setCarouselSlides(updated);
                                            }}
                                            className="flex-1 px-2 py-1 border border-sand-200 rounded-lg text-sm font-medium"
                                            placeholder="Slide title..."
                                        />
                                    </div>
                                    <textarea
                                        value={slide.content}
                                        onChange={e => {
                                            const updated = [...carouselSlides];
                                            updated[i] = { ...slide, content: e.target.value };
                                            setCarouselSlides(updated);
                                        }}
                                        className="w-full px-2 py-1 border border-sand-200 rounded-lg text-sm resize-none"
                                        rows={3}
                                        placeholder="Slide content..."
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Simple Post Editor */
                    <div>
                        <label className="block text-sm font-medium text-sand-700 mb-2">Content</label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            className="w-full px-4 py-3 border border-sand-200 rounded-xl resize-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
                            rows={6}
                            placeholder={`Write your ${config.name} post...`}
                            maxLength={config.maxLength}
                        />
                        <div className="flex justify-between mt-1">
                            <div className="text-xs text-sand-400">{content.length}/{config.maxLength}</div>
                        </div>
                    </div>
                )}

                {/* Hashtags */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-sand-700 mb-2">Hashtags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {hashtags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-sky-50 text-sky-700 rounded-lg text-sm flex items-center gap-1">
                                #{tag}
                                <button onClick={() => removeHashtag(tag)} className="text-sky-500 hover:text-sky-700">×</button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            value={newHashtag}
                            onChange={e => setNewHashtag(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && addHashtag()}
                            className="flex-1 px-3 py-1.5 border border-sand-200 rounded-lg text-sm"
                            placeholder="Add hashtag..."
                        />
                        <button onClick={addHashtag} className="px-3 py-1.5 bg-sand-100 hover:bg-sand-200 rounded-lg text-sm" aria-label="Add hashtag" title="Add hashtag">
                            <Hash className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-sand-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={copyContent}
                        className="flex items-center gap-2 px-3 py-1.5 text-sand-600 hover:bg-sand-50 rounded-lg text-sm transition-colors"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Schedule */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSchedule(!showSchedule)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sand-600 hover:bg-sand-50 rounded-lg text-sm transition-colors"
                        >
                            <Clock className="w-4 h-4" />
                            Schedule
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        {showSchedule && (
                            <div className="absolute right-0 top-full mt-2 p-3 bg-white border border-sand-200 rounded-xl shadow-lg z-10">
                                <input
                                    type="datetime-local"
                                    value={scheduledFor}
                                    onChange={e => setScheduledFor(e.target.value)}
                                    className="px-3 py-2 border border-sand-200 rounded-lg text-sm"
                                    aria-label="Schedule date and time"
                                />
                                <button
                                    onClick={() => { savePost('scheduled'); setShowSchedule(false); }}
                                    disabled={!scheduledFor || saving}
                                    className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                >
                                    Schedule
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => savePost('draft')}
                        disabled={saving || !content}
                        className="flex items-center gap-2 px-4 py-2 bg-sand-100 hover:bg-sand-200 text-sand-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        <Edit3 className="w-4 h-4" />
                        Save Draft
                    </button>

                    <button
                        onClick={() => savePost('published')}
                        disabled={saving || !content}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Post Now
                    </button>
                </div>
            </div>
        </div>
    );
}
