'use client';

import { useState, useRef, useCallback } from 'react';

// ============================================
// TYPES
// ============================================

interface SocialPost {
    id: string;
    content: string;
    platform: string;
    status: string;
    hashtags?: string[];
    mediaUrls?: string[];
}

interface SocialAccount {
    id: string;
    platform: string;
    platformDisplayName: string;
}

interface PostComposerProps {
    editingPost: SocialPost | null;
    accounts: SocialAccount[];
    userId: string | null;
    onClose: () => void;
    onCreated: () => void;
}

// ============================================
// SPARKLE ICON
// ============================================
const SparkleIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
);

// ============================================
// POST COMPOSER — AI-powered, with media uploads
// ============================================

export default function PostComposer({ editingPost, accounts, userId, onClose, onCreated }: PostComposerProps) {
    const [content, setContent] = useState(editingPost?.content || '');
    const [platform, setPlatform] = useState(editingPost?.platform || 'linkedin');
    const [hashtags, setHashtags] = useState(editingPost?.hashtags?.join(', ') || '');
    const [mediaUrls, setMediaUrls] = useState<string[]>(editingPost?.mediaUrls || []);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);

    // Schedule mode
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduledAt, setScheduledAt] = useState('');

    // AI states
    const [aiWriting, setAiWriting] = useState(false);
    const [aiHashtags, setAiHashtags] = useState(false);
    const [aiImagePrompt, setAiImagePrompt] = useState('');
    const [aiImageGenerating, setAiImageGenerating] = useState(false);
    const [showAiPrompt, setShowAiPrompt] = useState(false);
    const [aiPromptLoading, setAiPromptLoading] = useState(false);

    // Media upload
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const charLimit = platform === 'twitter' ? 280 : platform === 'linkedin' ? 3000 : platform === 'instagram' ? 2200 : 63206;
    const charCount = content.length;
    const charPercent = Math.min((charCount / charLimit) * 100, 100);

    const authHeaders = useCallback((): Record<string, string> => {
        const h: Record<string, string> = { 'Content-Type': 'application/json' };
        if (userId) h['x-user-id'] = userId;
        return h;
    }, [userId]);

    // ============================
    // AI: Write Content
    // ============================
    const handleAiWriteContent = async () => {
        setAiWriting(true);
        try {
            const res = await fetch('/api/social/ai-assist', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    type: 'content',
                    content: content.trim() || undefined,
                    topic: content.trim() ? undefined : 'professional insight about AI and technology',
                    platform,
                    tone: 'professional',
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.result) setContent(data.result);
            }
        } catch (e) {
            console.error('AI content generation failed:', e);
        } finally {
            setAiWriting(false);
        }
    };

    // ============================
    // AI: Generate Hashtags
    // ============================
    const handleAiHashtags = async () => {
        if (!content.trim()) return;
        setAiHashtags(true);
        try {
            const res = await fetch('/api/social/ai-assist', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    type: 'hashtags',
                    content,
                    platform,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.result) setHashtags(data.result);
            }
        } catch (e) {
            console.error('AI hashtag generation failed:', e);
        } finally {
            setAiHashtags(false);
        }
    };

    // ============================
    // AI: Auto-generate image prompt from content, then generate
    // ============================
    const handleAiGenerateImage = async () => {
        if (!content.trim()) return;
        setAiPromptLoading(true);
        setShowAiPrompt(true);

        try {
            // Step 1: Auto-generate image prompt from content
            const res = await fetch('/api/social/ai-assist', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    type: 'image_prompt',
                    content,
                    platform,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.result) {
                    setAiImagePrompt(data.result);
                }
            }
        } catch (e) {
            console.error('AI image prompt generation failed:', e);
        } finally {
            setAiPromptLoading(false);
        }
    };

    // Step 2: Generate the actual image using the prompt
    const handleGenerateImage = async () => {
        if (!aiImagePrompt.trim()) return;
        setAiImageGenerating(true);
        try {
            const res = await fetch('/api/social/ai-image', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ prompt: aiImagePrompt }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.url) {
                    setMediaUrls(prev => [...prev, data.url]);
                    setShowAiPrompt(false);
                    setAiImagePrompt('');
                }
            } else {
                console.error('Image generation failed:', await res.text());
            }
        } catch (err) {
            console.error('Image generation failed:', err);
        } finally {
            setAiImageGenerating(false);
        }
    };

    // ============================
    // Media: Upload to Supabase Storage
    // ============================
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);

        try {
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append('file', file);

                const headers: Record<string, string> = {};
                if (userId) headers['x-user-id'] = userId;

                const res = await fetch('/api/social/media', {
                    method: 'POST',
                    headers,
                    body: formData,
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.url) {
                        setMediaUrls(prev => [...prev, data.url]);
                    }
                } else {
                    // Fallback: Use object URL for preview
                    const url = URL.createObjectURL(file);
                    setMediaUrls(prev => [...prev, url]);
                    console.warn('Storage upload failed, using local preview');
                }
            }
        } catch (err) {
            console.error('File upload failed:', err);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // ============================
    // Save post (draft or scheduled)
    // ============================
    const savePost = async (scheduleDate?: string): Promise<string | null> => {
        try {
            const method = editingPost ? 'PATCH' : 'POST';
            const body = editingPost
                ? {
                    postId: editingPost.id,
                    content,
                    hashtags: hashtags.split(',').map(h => h.trim().replace(/^#/, '')).filter(Boolean),
                    mediaUrls,
                }
                : {
                    content,
                    platform,
                    hashtags: hashtags.split(',').map(h => h.trim().replace(/^#/, '')).filter(Boolean),
                    scheduledAt: scheduleDate || undefined,
                    socialAccountId: accounts.find(a => a.platform === platform)?.id,
                    mediaUrls,
                };

            const res = await fetch('/api/social/posts', {
                method,
                headers: authHeaders(),
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const data = await res.json();
                return data.post?.id || editingPost?.id || null;
            }
            return null;
        } catch (error) {
            console.error('Failed to save post:', error);
            return null;
        }
    };

    // ============================
    // POST NOW — save + publish immediately
    // ============================
    const handlePostNow = async () => {
        if (!content.trim()) return;
        setPublishing(true);
        try {
            const postId = await savePost();
            if (!postId) { setPublishing(false); return; }

            const res = await fetch('/api/social/publish', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ postId }),
            });

            if (res.ok) {
                onCreated();
            } else {
                const data = await res.json();
                alert(`Publishing failed: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Post now failed:', error);
        } finally {
            setPublishing(false);
        }
    };

    // ============================
    // SCHEDULE — save with date
    // ============================
    const handleSchedule = async () => {
        if (!content.trim() || !scheduledAt) return;
        setSaving(true);
        try {
            const postId = await savePost(new Date(scheduledAt).toISOString());
            if (postId) onCreated();
        } catch (error) {
            console.error('Schedule failed:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-sand-900/20 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl border border-cream-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-100">
                    <h2 className="text-base font-semibold text-sand-900">
                        {editingPost ? 'Edit Post' : 'Create Post'}
                    </h2>
                    <button onClick={onClose} title="Close composer" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cream-100 transition-colors text-sand-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    {/* Platform selector */}
                    {!editingPost && (
                        <div className="flex gap-2 flex-wrap">
                            {['linkedin', 'twitter', 'facebook', 'instagram'].map(p => {
                                const hasAccount = accounts.some(a => a.platform === p);
                                const label = p === 'twitter' ? 'X' : p.charAt(0).toUpperCase() + p.slice(1);
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPlatform(p)}
                                        className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${platform === p
                                            ? 'bg-sand-900 text-white'
                                            : hasAccount
                                                ? 'bg-cream-100 text-sand-600 hover:bg-cream-200'
                                                : 'bg-cream-50 text-sand-400 hover:bg-cream-100'
                                            }`}
                                    >
                                        {label}
                                        {!hasAccount && <span className="ml-1 text-[9px] opacity-50">⊘</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Content textarea with AI Write button */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="composer-content" className="text-[10px] font-semibold tracking-widest uppercase text-sand-400">
                                Content
                            </label>
                            <button
                                onClick={handleAiWriteContent}
                                disabled={aiWriting}
                                className="text-[10px] font-semibold flex items-center gap-1 px-2 py-1 rounded-md text-purple-500 hover:bg-purple-50 transition-all disabled:opacity-50"
                                title={content.trim() ? "Improve with AI" : "Write with AI"}
                            >
                                {aiWriting ? (
                                    <><div className="w-2.5 h-2.5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" /> Writing...</>
                                ) : (
                                    <><SparkleIcon className="w-3 h-3" /> {content.trim() ? 'Improve with AI' : 'Write with AI'}</>
                                )}
                            </button>
                        </div>
                        <div className="relative">
                            <textarea
                                id="composer-content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What's on your mind? Share your insight with the world..."
                                className="w-full min-h-[160px] p-4 text-sm text-sand-800 bg-cream-50/50 border border-cream-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-300 transition-all placeholder:text-sand-300 leading-relaxed"
                                maxLength={charLimit}
                            />
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                <div className="w-16 h-1 bg-cream-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${charPercent > 90 ? 'bg-red-400' : charPercent > 70 ? 'bg-yellow-400' : 'bg-terracotta-300'}`}
                                        style={{ width: `${charPercent}%` }}
                                    />
                                </div>
                                <span className={`text-[10px] tabular-nums ${charPercent > 90 ? 'text-red-400 font-medium' : 'text-sand-400'}`}>
                                    {charCount}/{charLimit}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Hashtags with AI suggest */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="composer-hashtags" className="text-[10px] font-semibold tracking-widest uppercase text-sand-400">
                                Hashtags
                            </label>
                            <button
                                onClick={handleAiHashtags}
                                disabled={aiHashtags || !content.trim()}
                                className="text-[10px] font-semibold flex items-center gap-1 px-2 py-1 rounded-md text-purple-500 hover:bg-purple-50 transition-all disabled:opacity-50"
                                title="AI suggest hashtags"
                            >
                                {aiHashtags ? (
                                    <><div className="w-2.5 h-2.5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" /> Suggesting...</>
                                ) : (
                                    <><SparkleIcon className="w-3 h-3" /> AI Suggest</>
                                )}
                            </button>
                        </div>
                        <input
                            id="composer-hashtags"
                            type="text"
                            value={hashtags}
                            onChange={(e) => setHashtags(e.target.value)}
                            placeholder="AI, Startups, Growth (comma separated)"
                            className="w-full px-4 py-2 text-sm bg-cream-50/50 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-300 transition-all placeholder:text-sand-300"
                        />
                        {hashtags.trim() && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {hashtags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean).map((tag, i) => (
                                    <span key={i} className="text-[10px] text-terracotta-500 font-medium bg-terracotta-50 px-1.5 py-0.5 rounded">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ====== MEDIA SECTION ====== */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-semibold tracking-widest uppercase text-sand-400">
                                Media
                            </label>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={handleAiGenerateImage}
                                    disabled={!content.trim() || aiPromptLoading}
                                    className={`text-[10px] font-semibold flex items-center gap-1 px-2 py-1 rounded-md transition-all disabled:opacity-40 ${showAiPrompt ? 'bg-purple-100 text-purple-600' : 'text-purple-500 hover:bg-purple-50'}`}
                                    title="AI Generate Image"
                                >
                                    {aiPromptLoading ? (
                                        <><div className="w-2.5 h-2.5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" /> Writing prompt...</>
                                    ) : (
                                        <><SparkleIcon className="w-3 h-3" /> AI Generate</>
                                    )}
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="text-[10px] font-semibold text-terracotta-500 hover:text-terracotta-600 transition-colors flex items-center gap-1 px-2 py-1 rounded-md hover:bg-terracotta-50 disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <><div className="w-2.5 h-2.5 border-2 border-terracotta-300 border-t-terracotta-600 rounded-full animate-spin" /> Uploading...</>
                                    ) : (
                                        <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Upload</>
                                    )}
                                </button>
                            </div>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                            multiple
                            className="hidden"
                            onChange={handleFileUpload}
                            title="Upload media files"
                        />

                        {/* AI Image Prompt (auto-filled from content) */}
                        {showAiPrompt && (
                            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3 mb-3">
                                <label htmlFor="ai-image-prompt" className="text-[9px] uppercase tracking-[0.15em] font-bold text-purple-500 mb-1.5 block">
                                    Image Prompt (auto-generated from your content)
                                </label>
                                <div className="flex gap-2">
                                    <textarea
                                        id="ai-image-prompt"
                                        value={aiImagePrompt}
                                        onChange={(e) => setAiImagePrompt(e.target.value)}
                                        placeholder="Generating prompt from your content..."
                                        rows={2}
                                        className="flex-1 px-3 py-2 text-xs bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder:text-purple-300 resize-none"
                                    />
                                    <div className="flex flex-col gap-1.5">
                                        <button
                                            onClick={handleGenerateImage}
                                            disabled={!aiImagePrompt.trim() || aiImageGenerating}
                                            className="px-3 py-2 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-40 flex items-center gap-1 min-w-[80px] justify-center"
                                        >
                                            {aiImageGenerating ? (
                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <><SparkleIcon className="w-3 h-3" /> Create</>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => { setShowAiPrompt(false); setAiImagePrompt(''); }}
                                            className="px-3 py-1 text-[10px] text-purple-400 hover:text-purple-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Media Grid */}
                        {mediaUrls.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2">
                                {mediaUrls.map((url, i) => (
                                    <div key={i} className="relative group aspect-square bg-cream-50 rounded-lg overflow-hidden border border-cream-200">
                                        <img src={url} alt={`Media ${i + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setMediaUrls(prev => prev.filter((_, idx) => idx !== i))}
                                            className="absolute top-1 right-1 w-5 h-5 bg-red-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold"
                                            title="Remove media"
                                        >✕</button>
                                    </div>
                                ))}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square border-2 border-dashed border-cream-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-terracotta-200 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-sand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-cream-200 rounded-xl p-5 text-center cursor-pointer hover:border-terracotta-200 transition-colors group"
                            >
                                <div className="flex items-center justify-center gap-3 text-sand-300 group-hover:text-sand-400 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span className="text-[11px] font-medium">Drop files or click to upload images, videos, documents</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Schedule picker */}
                    {showSchedule && (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                            <label htmlFor="composer-schedule" className="text-[9px] uppercase tracking-[0.15em] font-bold text-blue-500 mb-2 block">
                                Schedule Date & Time
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="composer-schedule"
                                    type="datetime-local"
                                    value={scheduledAt}
                                    onChange={(e) => setScheduledAt(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                    className="flex-1 text-sm text-sand-800 bg-white border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                                />
                                <button
                                    onClick={handleSchedule}
                                    disabled={!scheduledAt || saving}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                                >
                                    {saving ? (
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    )}
                                    Confirm
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer — Post Now / Schedule */}
                <div className="flex items-center justify-between px-6 py-3.5 border-t border-cream-100 bg-cream-50/30">
                    <button onClick={onClose} className="text-xs text-sand-400 hover:text-sand-600 transition-colors">
                        Cancel
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSchedule(!showSchedule)}
                            disabled={!content.trim()}
                            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-40 ${showSchedule ? 'bg-blue-100 text-blue-700' : 'bg-cream-100 text-sand-600 hover:bg-cream-200'}`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Schedule
                        </button>
                        <button
                            onClick={handlePostNow}
                            disabled={!content.trim() || publishing}
                            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                        >
                            {publishing ? (
                                <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing...</>
                            ) : (
                                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Post Now</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
