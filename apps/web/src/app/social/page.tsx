'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { PanelLeftClose } from 'lucide-react';
import PostComposer from '@/components/social/PostComposer';
import ConnectAccounts from '@/components/social/ConnectAccounts';
import { createClient } from '@/lib/supabase/client';

// ============================================
// TYPES
// ============================================

interface SocialAccount {
    id: string;
    platform: string;
    platformUsername: string;
    platformDisplayName: string;
    platformAvatarUrl?: string;
    isActive: boolean;
}

interface SocialPost {
    id: string;
    content: string;
    platform: string;
    status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
    scheduledAt?: string;
    publishedAt?: string;
    platformPostUrl?: string;
    aiDraftVariant?: string;
    sourceType?: string;
    hashtags?: string[];
    mediaUrls?: string[];
    createdAt: string;
}

interface SocialInsight {
    id: string;
    title: string;
    summary: string;
    key_takeaways: string[];
    content_worthiness_score: number;
    suggested_tone: string;
    status: string;
    created_at: string;
}

interface AnalyticsOverview {
    totalPosts: number;
    totalImpressions: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    avgEngagementRate: number;
}

interface PostAnalyticsData {
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
}

// ============================================
// ICONS
// ============================================

const PLATFORM_CONFIG: Record<string, { name: string; color: string; icon: React.ReactNode }> = {
    linkedin: {
        name: 'LinkedIn',
        color: '#0A66C2',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        ),
    },
    twitter: {
        name: 'X',
        color: '#000000',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    facebook: {
        name: 'Facebook',
        color: '#1877F2',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        ),
    },
    instagram: {
        name: 'Instagram',
        color: '#E4405F',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
        ),
    },
};

function PlatformBadge({ platform }: { platform: string }) {
    const cfg = PLATFORM_CONFIG[platform];
    if (!cfg) return null;
    return (
        <div
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold"
            style={{ backgroundColor: `${cfg.color}10`, color: cfg.color }}
        >
            {cfg.icon}
            {cfg.name}
        </div>
    );
}

// ============================================
// HELPERS
// ============================================

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
}

function timeUntil(date: string): string {
    const diff = new Date(date).getTime() - Date.now();
    if (diff < 0) return 'Overdue';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function relativeTime(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

// ============================================
// POST DETAIL MODAL — editable, with Post Now / Schedule
// ============================================

function PostDetailModal({ post, onClose, onPublishNow, onSave, publishing }: {
    post: SocialPost;
    onClose: () => void;
    onPublishNow: (id: string) => void;
    onSave: (post: SocialPost, updates: { content: string; hashtags: string[]; mediaUrls?: string[]; scheduledAt?: string }) => void;
    publishing: boolean;
}) {
    const cfg = PLATFORM_CONFIG[post.platform];
    const isEditable = post.status === 'draft' || post.status === 'scheduled';
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // Editable state
    const [content, setContent] = useState(post.content);
    const [hashtagText, setHashtagText] = useState((post.hashtags || []).join(', '));
    const [mediaUrls, setMediaUrls] = useState<string[]>(post.mediaUrls || []);
    const [mode, setMode] = useState<'idle' | 'schedule'>('idle');
    const [scheduleDate, setScheduleDate] = useState(post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '');
    const [hasChanges, setHasChanges] = useState(false);

    // Track changes
    useEffect(() => {
        const newHashtags = hashtagText.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
        const changed = content !== post.content ||
            JSON.stringify(newHashtags) !== JSON.stringify(post.hashtags || []) ||
            JSON.stringify(mediaUrls) !== JSON.stringify(post.mediaUrls || []);
        setHasChanges(changed);
    }, [content, hashtagText, mediaUrls, post]);

    // Escape to close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const parsedHashtags = hashtagText.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

    const handleSaveAndClose = () => {
        if (hasChanges) {
            onSave(post, { content, hashtags: parsedHashtags, mediaUrls, scheduledAt: post.scheduledAt });
        }
        onClose();
    };

    const handleSchedule = () => {
        if (!scheduleDate) return;
        onSave(post, { content, hashtags: parsedHashtags, mediaUrls, scheduledAt: new Date(scheduleDate).toISOString() });
        onClose();
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append('file', file);
                const headers: Record<string, string> = {};
                // userId would need to be passed from parent, fallback to no header
                const res = await fetch('/api/social/media', { method: 'POST', headers, body: formData });
                if (res.ok) {
                    const data = await res.json();
                    if (data.url) setMediaUrls(prev => [...prev, data.url]);
                } else {
                    const url = URL.createObjectURL(file);
                    setMediaUrls(prev => [...prev, url]);
                }
            }
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-sand-900/20 backdrop-blur-sm" onClick={handleSaveAndClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-cream-200 w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-cream-100">
                    <div className="flex items-center gap-3">
                        <PlatformBadge platform={post.platform} />
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${post.status === 'published' ? 'bg-emerald-50 text-emerald-600' :
                            post.status === 'scheduled' ? 'bg-blue-50 text-blue-600' :
                                post.status === 'failed' ? 'bg-red-50 text-red-600' :
                                    'bg-sand-100 text-sand-500'
                            }`}>{post.status}</span>
                    </div>
                    <button onClick={handleSaveAndClose} title="Close" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cream-100 transition-colors text-sand-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    {/* Content — editable */}
                    {isEditable ? (
                        <div>
                            <label htmlFor="post-content" className="text-[9px] uppercase tracking-[0.15em] font-bold text-sand-400 mb-1.5 block">Content</label>
                            <textarea
                                id="post-content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={6}
                                className="w-full text-sm text-sand-800 leading-relaxed bg-cream-50/50 border border-cream-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-300 transition-all"
                                placeholder="Write your post content..."
                            />
                            <p className="text-[10px] text-sand-400 mt-1 text-right tabular-nums">{content.length} characters</p>
                        </div>
                    ) : (
                        <p className="text-sm text-sand-800 leading-relaxed whitespace-pre-line">{post.content}</p>
                    )}

                    {/* Hashtags — editable */}
                    {isEditable ? (
                        <div>
                            <label htmlFor="post-hashtags" className="text-[9px] uppercase tracking-[0.15em] font-bold text-sand-400 mb-1.5 block">Hashtags</label>
                            <input
                                id="post-hashtags"
                                type="text"
                                value={hashtagText}
                                onChange={(e) => setHashtagText(e.target.value)}
                                className="w-full text-xs text-terracotta-600 bg-cream-50/50 border border-cream-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-300 transition-all"
                                placeholder="Ai, Startup, Tech (comma-separated)"
                            />
                            {parsedHashtags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {parsedHashtags.map((tag, i) => (
                                        <span key={i} className="text-[10px] text-terracotta-500 font-medium bg-terracotta-50 px-1.5 py-0.5 rounded">#{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : post.hashtags && post.hashtags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {post.hashtags.map((tag, i) => (
                                <span key={i} className="text-[11px] text-terracotta-500 font-medium bg-terracotta-50 px-2 py-0.5 rounded-md">#{tag}</span>
                            ))}
                        </div>
                    ) : null}

                    {/* Media — view / upload / remove */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-sand-400">Media</span>
                            {isEditable && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-[10px] font-semibold text-terracotta-500 hover:text-terracotta-600 transition-colors"
                                >
                                    + Upload
                                </button>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} title="Upload media" />

                        {mediaUrls.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                                {mediaUrls.map((url, i) => (
                                    <div key={i} className="relative group aspect-square bg-cream-50 rounded-lg overflow-hidden border border-cream-200">
                                        <img src={url} alt={`Media ${i + 1}`} className="w-full h-full object-cover" />
                                        {isEditable && (
                                            <button
                                                onClick={() => setMediaUrls(prev => prev.filter((_, idx) => idx !== i))}
                                                className="absolute top-1 right-1 w-5 h-5 bg-red-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold"
                                                title="Remove"
                                            >✕</button>
                                        )}
                                    </div>
                                ))}
                                {isEditable && (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square border-2 border-dashed border-cream-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-terracotta-200 transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-sand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                                    </div>
                                )}
                            </div>
                        ) : isEditable ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-cream-200 rounded-xl p-6 text-center cursor-pointer hover:border-terracotta-200 transition-colors"
                            >
                                <svg className="w-6 h-6 text-sand-300 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <p className="text-[10px] text-sand-400">Click to add images or videos</p>
                            </div>
                        ) : (
                            <p className="text-[10px] text-sand-300">No media attached</p>
                        )}
                    </div>

                    {/* Meta */}
                    {post.publishedAt && (
                        <div className="pt-3 border-t border-cream-100">
                            <p className="text-[9px] uppercase tracking-widest font-bold text-sand-400">Published</p>
                            <p className="text-xs text-sand-600 mt-0.5">{formatDate(post.publishedAt)}</p>
                            {post.platformPostUrl && (
                                <a href={post.platformPostUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-600 mt-1 inline-block">
                                    View on {cfg?.name || post.platform} ↗
                                </a>
                            )}
                        </div>
                    )}

                    {/* Schedule mode datetime picker */}
                    {mode === 'schedule' && (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                            <label htmlFor="schedule-datetime" className="text-[9px] uppercase tracking-[0.15em] font-bold text-blue-500 mb-2 block">Schedule Date & Time</label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="schedule-datetime"
                                    type="datetime-local"
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                    className="flex-1 text-sm text-sand-800 bg-white border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                                />
                                <button
                                    onClick={handleSchedule}
                                    disabled={!scheduleDate}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer — Post Now / Schedule */}
                <div className="flex items-center justify-between px-6 py-3.5 border-t border-cream-100 bg-cream-50/30">
                    <div className="flex items-center gap-2">
                        {hasChanges && (
                            <span className="text-[9px] text-terracotta-500 font-medium">● Unsaved changes</span>
                        )}
                    </div>
                    {isEditable ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setMode(mode === 'schedule' ? 'idle' : 'schedule')}
                                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${mode === 'schedule' ? 'bg-blue-100 text-blue-700' : 'bg-cream-100 text-sand-600 hover:bg-cream-200'
                                    }`}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Schedule
                            </button>
                            <button
                                onClick={() => {
                                    if (hasChanges) onSave(post, { content, hashtags: parsedHashtags, mediaUrls });
                                    onPublishNow(post.id);
                                }}
                                disabled={publishing}
                                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {publishing ? (
                                    <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing...</>
                                ) : (
                                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Post Now</>
                                )}
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleSaveAndClose} className="text-xs text-sand-400 hover:text-sand-600 transition-colors">Done</button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================
// MEDIA GALLERY (in-row)
// ============================================

function MediaThumbnails({ urls, onView }: { urls: string[]; onView: () => void }) {
    if (!urls || urls.length === 0) return <span className="text-[10px] text-sand-300">—</span>;
    return (
        <button onClick={(e) => { e.stopPropagation(); onView(); }} className="flex -space-x-1 group" title="View media">
            {urls.slice(0, 3).map((url, i) => (
                <div key={i} className="w-7 h-7 rounded-md border-2 border-white overflow-hidden bg-cream-100 group-hover:ring-2 ring-terracotta-200 transition-all">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
            ))}
            {urls.length > 3 && (
                <div className="w-7 h-7 rounded-md border-2 border-white bg-cream-100 flex items-center justify-center text-[8px] font-bold text-sand-500">
                    +{urls.length - 3}
                </div>
            )}
        </button>
    );
}

// ============================================
// MEDIA VIEWER MODAL
// ============================================

function MediaViewerModal({ urls, onClose, onUpload, onRemove }: {
    urls: string[];
    onClose: () => void;
    onUpload: (file: File) => void;
    onRemove: (index: number) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-sand-900/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-cream-200 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-5 py-3 border-b border-cream-100">
                    <h3 className="text-sm font-semibold text-sand-900">Media</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1 text-[10px] font-semibold text-terracotta-600 bg-terracotta-50 rounded-md hover:bg-terracotta-100 transition-colors"
                        >
                            + Upload
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onUpload(file);
                                e.target.value = '';
                            }}
                        />
                        <button onClick={onClose} title="Close" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-cream-100 text-sand-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {urls.length === 0 ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-cream-200 rounded-xl p-10 text-center cursor-pointer hover:border-terracotta-200 transition-colors"
                        >
                            <svg className="w-8 h-8 text-sand-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <p className="text-xs text-sand-400">Click to upload images or videos</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {urls.map((url, i) => (
                                <div key={i} className="relative group aspect-video bg-cream-50 rounded-lg overflow-hidden border border-cream-200">
                                    <img src={url} alt={`Media ${i + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => onRemove(i)}
                                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                        title="Remove media"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {/* Upload slot */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-video border-2 border-dashed border-cream-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-terracotta-200 transition-colors"
                            >
                                <span className="text-xl text-sand-300">+</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================
// PUBLISHED CARD — with engagement insights
// ============================================

function PublishedCard({ post, onClick, analytics }: { post: SocialPost; onClick: () => void; analytics?: PostAnalyticsData }) {
    const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
    return (
        <div
            className="bg-white rounded-lg border border-cream-200/80 px-3 py-2 cursor-pointer hover:shadow-sm hover:border-cream-300 transition-all"
            onClick={onClick}
        >
            {/* Row 1: Platform badge + time + content (single line) */}
            <div className="flex items-center gap-2">
                <PlatformBadge platform={post.platform} />
                <span className="text-[10px] text-sand-400 font-medium whitespace-nowrap">
                    {post.publishedAt ? relativeTime(post.publishedAt) : relativeTime(post.createdAt)}
                </span>
                {post.platformPostUrl && (
                    <a
                        href={post.platformPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-blue-500 hover:text-blue-600 font-medium whitespace-nowrap"
                    >
                        View ↗
                    </a>
                )}
                <p className="text-[12px] text-sand-700 truncate flex-1 min-w-0">{post.content}</p>
                <div className="flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
            </div>

            {/* Row 2: Insights — hashtags + analytics metrics */}
            <div className="flex items-center gap-3 mt-1 pl-6">
                {/* Hashtags (compact) */}
                {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex gap-1 min-w-0 overflow-hidden">
                        {post.hashtags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[9px] text-terracotta-400/80 font-medium whitespace-nowrap">#{tag}</span>
                        ))}
                        {post.hashtags.length > 3 && (
                            <span className="text-[9px] text-sand-300 whitespace-nowrap">+{post.hashtags.length - 3}</span>
                        )}
                    </div>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Analytics metrics */}
                <div className="flex items-center gap-2.5 text-[10px] text-sand-400 flex-shrink-0">
                    <span className="flex items-center gap-0.5" title="Impressions">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        {analytics ? fmt(analytics.impressions) : '—'}
                    </span>
                    <span className="flex items-center gap-0.5" title="Likes">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                        {analytics ? fmt(analytics.likes) : '—'}
                    </span>
                    <span className="flex items-center gap-0.5" title="Comments">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        {analytics ? fmt(analytics.comments) : '—'}
                    </span>
                    <span className="flex items-center gap-0.5" title="Shares">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        {analytics ? fmt(analytics.shares) : '—'}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// ANALYTICS DASHBOARD
// ============================================

function AnalyticsDashboard({ posts, analytics }: { posts: SocialPost[]; analytics: AnalyticsOverview | null }) {
    const published = posts.filter(p => p.status === 'published');
    const scheduled = posts.filter(p => p.status === 'scheduled');
    const totalPosts = analytics?.totalPosts || published.length;

    const hourBuckets: Record<string, number> = {};
    posts.forEach(p => {
        const hour = new Date(p.publishedAt || p.scheduledAt || p.createdAt).getHours();
        const label = hour < 6 ? 'Early AM' : hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : hour < 21 ? 'Evening' : 'Night';
        hourBuckets[label] = (hourBuckets[label] || 0) + 1;
    });
    const bestTimeSlot = Object.entries(hourBuckets).sort((a, b) => b[1] - a[1])[0];

    const tagCounts: Record<string, number> = {};
    posts.forEach(p => (p.hashtags || []).forEach(tag => { tagCounts[tag.toLowerCase()] = (tagCounts[tag.toLowerCase()] || 0) + 1; }));
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    if (totalPosts === 0) {
        return (
            <div className="bg-white rounded-2xl border border-cream-200 p-16 text-center">
                <svg className="w-10 h-10 text-sand-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <p className="text-sm text-sand-500 mb-1">No analytics yet</p>
                <p className="text-xs text-sand-400">Publish posts to see performance data</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'Published', val: totalPosts },
                    { label: 'Impressions', val: analytics?.totalImpressions || 0 },
                    { label: 'Engagement', val: `${((analytics?.avgEngagementRate || 0) * 100).toFixed(1)}%` },
                    { label: 'In Queue', val: scheduled.length },
                ].map(kpi => (
                    <div key={kpi.label} className="bg-white rounded-xl border border-cream-200/80 p-4">
                        <p className="text-[9px] uppercase tracking-[0.15em] font-bold text-sand-400 mb-1">{kpi.label}</p>
                        <p className="text-xl font-semibold text-sand-900 tabular-nums">{typeof kpi.val === 'number' ? kpi.val.toLocaleString() : kpi.val}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-cream-200/80 p-5">
                    <h4 className="text-[9px] uppercase tracking-[0.15em] font-bold text-sand-400 mb-3">Best Posting Time</h4>
                    {bestTimeSlot && <p className="text-xl font-semibold text-sand-900 mb-3">{bestTimeSlot[0]}</p>}
                    <div className="space-y-1.5">
                        {Object.entries(hourBuckets).map(([slot, count]) => (
                            <div key={slot} className="flex items-center gap-2">
                                <span className="text-[10px] text-sand-500 w-16">{slot}</span>
                                <div className="flex-1 h-1.5 bg-cream-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-terracotta-300 rounded-full" style={{ width: `${(count / Math.max(...Object.values(hourBuckets))) * 100}%` }} />
                                </div>
                                <span className="text-[10px] text-sand-400 tabular-nums w-4 text-right">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-cream-200/80 p-5">
                    <h4 className="text-[9px] uppercase tracking-[0.15em] font-bold text-sand-400 mb-3">Top Topics</h4>
                    {topTags.length > 0 ? (
                        <div className="space-y-2.5">
                            {topTags.map(([tag, count], i) => (
                                <div key={tag} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-terracotta-100 text-terracotta-600' : 'bg-cream-100 text-sand-500'}`}>{i + 1}</span>
                                        <span className="text-sm text-sand-700 font-medium">#{tag}</span>
                                    </div>
                                    <span className="text-xs text-sand-400 tabular-nums">{count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-sand-400">Add hashtags to see topic analytics</p>
                    )}
                </div>
            </div>

            <div className="bg-gradient-to-r from-sand-900 to-sand-800 rounded-xl p-5 text-white">
                <h4 className="text-[9px] uppercase tracking-[0.15em] font-bold text-white/50 mb-2">AI Recommendation</h4>
                <p className="text-sm font-medium leading-relaxed">
                    {totalPosts < 3
                        ? 'Publish 3+ posts to unlock AI-powered content recommendations.'
                        : `Based on ${totalPosts} posts: ${bestTimeSlot ? `${bestTimeSlot[0]} drives the most engagement.` : ''} ${topTags.length > 0 ? `#${topTags[0][0]} is your top topic.` : ''}`
                    }
                </p>
            </div>
        </div>
    );
}

// ============================================
// MAIN PAGE
// ============================================

export default function SocialPulsePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /></div>}>
            <SocialPulseContent />
        </Suspense>
    );
}

function SocialPulseContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const initialTab = (searchParams.get('tab') as 'analytics' | 'queue' | 'published') || 'analytics';
    const [activeView, setActiveView] = useState<'analytics' | 'queue' | 'published'>(initialTab);
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [insights, setInsights] = useState<SocialInsight[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
    const [postAnalyticsMap, setPostAnalyticsMap] = useState<Record<string, PostAnalyticsData>>({});
    const [showComposer, setShowComposer] = useState(false);
    const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    // Modal states
    const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
    const [mediaViewerPost, setMediaViewerPost] = useState<SocialPost | null>(null);

    // Filter
    const [platformFilter, setPlatformFilter] = useState<string>('all');

    // Sidebar
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [productSlug, setProductSlug] = useState<string | null>(null);
    const [productName, setProductName] = useState<string>('');

    // Auth + fetch product
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (user?.id) {
                setUserId(user.id);
                setIsAuthenticated(true);
                // Fetch user's product for sidebar
                try {
                    const { data: pu } = await supabase
                        .from('product_users')
                        .select('product_id, products(name, slug)')
                        .eq('user_id', user.id)
                        .limit(1)
                        .single();
                    if (pu?.products) {
                        const prod = pu.products as unknown as { name: string; slug: string };
                        setProductSlug(prod.slug);
                        setProductName(prod.name);
                    }
                } catch { /* ignore */ }
            } else {
                setIsAuthenticated(false);
                setLoading(false);
            }
        });
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('connected')) { setErrorMessage(null); window.history.replaceState({}, '', '/social'); }
        if (params.get('error')) { setErrorMessage(params.get('error')); window.history.replaceState({}, '', '/social'); }
    }, []);

    const authHeaders = useCallback((): HeadersInit => {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (userId) (headers as Record<string, string>)['x-user-id'] = userId;
        return headers;
    }, [userId]);

    const fetchData = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const hdrs = { 'x-user-id': userId };
            const [aRes, pRes, iRes, anRes] = await Promise.all([
                fetch('/api/social/accounts', { headers: hdrs }),
                fetch('/api/social/posts?limit=50', { headers: hdrs }),
                fetch('/api/social/insights?status=pending&limit=5', { headers: hdrs }),
                fetch('/api/social/analytics', { headers: hdrs }),
            ]);
            if (aRes.status === 401) { setIsAuthenticated(false); setLoading(false); return; }
            if (aRes.ok) setAccounts((await aRes.json()).accounts || []);
            if (pRes.ok) setPosts((await pRes.json()).posts || []);
            if (iRes.ok) setInsights((await iRes.json()).insights || []);
            if (anRes.ok) {
                const anData = await anRes.json();
                setAnalytics(anData.overview || null);
                // Build per-post analytics map
                const pam: Record<string, PostAnalyticsData> = {};
                if (anData.posts) {
                    for (const p of anData.posts) {
                        const sa = Array.isArray(p.social_analytics) ? p.social_analytics : [];
                        const latest = sa[sa.length - 1];
                        if (latest) {
                            pam[p.id] = {
                                likes: latest.likes || 0,
                                comments: latest.comments || 0,
                                shares: latest.shares || 0,
                                impressions: latest.impressions || 0,
                            };
                        }
                    }
                }
                setPostAnalyticsMap(pam);
            }
        } catch (e) { console.error('Fetch failed:', e); }
        finally { setLoading(false); }
    }, [userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Approve = publish immediately
    const handleApprove = async (postId: string) => {
        setPublishing(postId);
        try {
            const res = await fetch('/api/social/publish', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ postId }),
            });
            if (res.ok) {
                setSelectedPost(null);
                await fetchData();
            } else {
                const data = await res.json();
                setErrorMessage(data.error || 'Failed to publish');
            }
        } catch { setErrorMessage('Network error during publish'); }
        finally { setPublishing(null); }
    };

    const handleConnect = async (platform: string) => {
        setErrorMessage(null);
        try {
            const res = await fetch('/api/social/accounts', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ platform }) });
            if (res.status === 401) { setIsAuthenticated(false); return; }
            const data = await res.json();
            if (!res.ok) { setErrorMessage(data.error || 'Failed to connect.'); return; }
            if (data.authUrl) window.location.href = data.authUrl;
            else setErrorMessage('No authorization URL received.');
        } catch { setErrorMessage('Network error.'); }
    };

    const handleMediaUpload = async (file: File) => {
        console.log('Upload media:', file.name);
        setErrorMessage('Media upload coming soon — storage integration pending.');
    };

    const handleMediaRemove = (index: number) => {
        console.log('Remove media at index:', index);
    };

    // Save edits from modal (content, hashtags, media, schedule)
    const handleSavePost = async (post: SocialPost, updates: { content: string; hashtags: string[]; mediaUrls?: string[]; scheduledAt?: string }) => {
        try {
            const res = await fetch('/api/social/posts', {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ postId: post.id, ...updates }),
            });
            if (res.ok) {
                await fetchData();
            } else {
                console.error('Failed to save post');
            }
        } catch (e) {
            console.error('Save failed:', e);
        }
    };

    // Derived data
    const filteredPosts = platformFilter === 'all' ? posts : posts.filter(p => p.platform === platformFilter);

    const queuePosts = filteredPosts
        .filter(p => p.status === 'scheduled' || p.status === 'draft')
        .sort((a, b) => {
            if (a.scheduledAt && b.scheduledAt) return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
            if (a.scheduledAt) return -1;
            if (b.scheduledAt) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    const publishedPosts = filteredPosts
        .filter(p => p.status === 'published')
        .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());

    const uniquePlatforms = [...new Set(posts.map(p => p.platform))];

    const tabs = [
        { id: 'analytics' as const, label: 'Analytics', count: null },
        { id: 'queue' as const, label: 'Queue', count: queuePosts.length },
        { id: 'published' as const, label: 'Posted', count: publishedPosts.length },
    ];

    // URL-based tab routing
    const handleTabChange = (tab: typeof activeView) => {
        setActiveView(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // NOTE: LinkedIn analytics collection is disabled.
    // The socialActions API requires 'r_member_social' scope which is a closed/restricted
    // permission. Until we get Community Management API approval from LinkedIn Partner Program,
    // post engagement data (likes, comments, shares) cannot be fetched via API.
    // Posts will show "—" for analytics instead of misleading 0s.
    // To apply: https://www.linkedin.com/developers/apps → Products → Community Management API

    return (
        <div className="h-screen bg-cream-50 flex overflow-hidden">
            {/* Dashboard-style Sidebar */}
            <div className={`${sidebarOpen ? 'w-[280px]' : 'w-16'} flex-shrink-0 transition-all duration-300 bg-cream-50 flex flex-col overflow-hidden`}>
                {/* Header: Toggle + Product Name */}
                <div className="p-3 flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-sand-200/50 transition-colors flex-shrink-0"
                        title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                    >
                        <PanelLeftClose className={`w-5 h-5 text-sand-500 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
                    </button>
                    {sidebarOpen && productName && (
                        <button
                            onClick={() => productSlug ? router.push(`/p/${productSlug}/dashboard`) : router.back()}
                            className="font-semibold text-sand-900 truncate text-lg animate-in fade-in duration-200 hover:opacity-70 text-left min-w-0"
                            title="Go to Chat"
                        >
                            {productName}
                        </button>
                    )}
                </div>

                {/* New Chat Button */}
                <div className="px-3 pb-2">
                    <button
                        onClick={() => productSlug ? router.push(`/p/${productSlug}/dashboard`) : router.back()}
                        className={`${sidebarOpen ? 'w-full py-2.5 px-4' : 'w-10 h-10 mx-auto'} rounded-xl bg-sand-800 hover:bg-sand-900 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all`}
                        title="New Chat"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        {sidebarOpen && <span>New Chat</span>}
                    </button>
                </div>

                {/* Navigation */}
                <div className="px-2 space-y-1">
                    {/* Personalisation - External Link */}
                    <button
                        onClick={() => router.push('/personalisation')}
                        className={`${sidebarOpen ? 'w-full py-2.5 px-3' : 'w-10 h-10 mx-auto'} rounded-xl flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} text-sm font-medium transition-all text-sand-600 hover:bg-sand-200/50 hover:text-sand-800 group`}
                        title="Personalisation"
                    >
                        <svg className="w-[18px] h-[18px] flex-shrink-0 text-sand-400 group-hover:text-terracotta-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        {sidebarOpen && (
                            <span className="flex items-center gap-2 flex-1">
                                Personalisation
                                <svg className="w-3 h-3 text-sand-300 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </span>
                        )}
                    </button>

                    {/* My Clients */}
                    <button
                        onClick={() => productSlug ? router.push(`/p/${productSlug}/dashboard?tab=clients`) : undefined}
                        className={`${sidebarOpen ? 'w-full py-2.5 px-3' : 'w-10 h-10 mx-auto'} rounded-xl flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} text-sm font-medium transition-all text-sand-600 hover:bg-sand-200/50 hover:text-sand-800`}
                        title="My Clients"
                    >
                        <svg className="w-[18px] h-[18px] flex-shrink-0 text-sand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        {sidebarOpen && <span>My Clients</span>}
                    </button>
                </div>

                {/* Social Media — Active */}
                <div className="px-2 mt-2 pt-2 border-t border-sand-200/40">
                    <button
                        className={`${sidebarOpen ? 'w-full py-2.5 px-3' : 'w-10 h-10 mx-auto'} rounded-xl flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} text-sm font-medium transition-all bg-sand-200/80 text-sand-900`}
                        title="Social Media"
                    >
                        <svg className="w-[18px] h-[18px] flex-shrink-0 text-terracotta-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        {sidebarOpen && <span>Social Media</span>}
                    </button>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Sign Out */}
                <div className="px-2 py-3">
                    <button
                        onClick={async () => {
                            const supabase = createClient();
                            await supabase.auth.signOut();
                            router.push('/signin');
                        }}
                        className={`${sidebarOpen ? 'w-full py-2.5 px-3' : 'w-10 h-10 mx-auto'} rounded-xl text-sand-600 hover:text-sand-800 hover:bg-sand-200/50 flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} text-sm font-medium transition-all`}
                        title="Sign Out"
                    >
                        <svg className="w-[18px] h-[18px] text-sand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        {sidebarOpen && <span>Sign Out</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-auto">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-cream-50/90 backdrop-blur-xl border-b border-cream-200/60">
                    <div className="max-w-5xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-lg font-semibold text-sand-900 tracking-tight">Social Pulse</h1>
                            <div className="flex items-center gap-2.5">
                                <ConnectAccounts accounts={accounts} onConnect={handleConnect} />
                                <button
                                    onClick={() => { setEditingPost(null); setShowComposer(true); }}
                                    title="Create a new post"
                                    className="px-3.5 py-1.5 bg-sand-900 text-white text-xs font-semibold rounded-lg hover:bg-sand-800 transition-colors flex items-center gap-1.5"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    New Post
                                </button>
                            </div>
                        </div>

                        {/* Tabs + Platform filter */}
                        <div className="flex items-center justify-between mt-4">
                            <nav className="flex gap-0.5 p-0.5 bg-cream-100 rounded-lg">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${activeView === tab.id ? 'bg-white text-sand-900 shadow-sm' : 'text-sand-400 hover:text-sand-600'
                                            }`}
                                    >
                                        {tab.label}
                                        {tab.count !== null && tab.count > 0 && (
                                            <span className={`text-[9px] font-bold tabular-nums px-1 py-px rounded ${activeView === tab.id ? 'bg-sand-900 text-white' : 'bg-cream-200 text-sand-500'
                                                }`}>{tab.count}</span>
                                        )}
                                    </button>
                                ))}
                            </nav>

                            {/* Platform filter */}
                            {uniquePlatforms.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPlatformFilter('all')}
                                        className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${platformFilter === 'all' ? 'bg-sand-900 text-white' : 'text-sand-400 hover:bg-cream-100'
                                            }`}
                                    >All</button>
                                    {uniquePlatforms.map(p => {
                                        const cfg = PLATFORM_CONFIG[p];
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => setPlatformFilter(p)}
                                                className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all flex items-center gap-1 ${platformFilter === p ? 'bg-sand-900 text-white' : 'text-sand-400 hover:bg-cream-100'
                                                    }`}
                                            >
                                                {cfg?.name || p}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="max-w-5xl mx-auto px-6 py-6">
                    {/* Error */}
                    {errorMessage && (
                        <div className="mb-5 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
                            <p className="text-xs text-red-600">{errorMessage}</p>
                            <button onClick={() => setErrorMessage(null)} title="Dismiss" className="text-red-400 hover:text-red-600 p-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    )}

                    {!isAuthenticated ? (
                        <div className="bg-white rounded-2xl border border-cream-200 p-16 text-center">
                            <h2 className="text-base font-semibold text-sand-900 mb-1.5">Sign in to continue</h2>
                            <p className="text-xs text-sand-400 mb-5">Sign in from the dashboard first.</p>
                            <button onClick={() => router.back()} title="Go back" className="px-5 py-2 bg-sand-900 text-white text-xs font-medium rounded-lg">← Back</button>
                        </div>
                    ) : loading ? (
                        <div className="flex items-center justify-center py-24">
                            <div className="w-5 h-5 border-2 border-terracotta-300 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-cream-200 p-16 text-center">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#0A66C210', color: '#0A66C2' }}>
                                {PLATFORM_CONFIG.linkedin.icon}
                            </div>
                            <h2 className="text-base font-semibold text-sand-900 mb-1.5">Connect LinkedIn</h2>
                            <p className="text-xs text-sand-400 max-w-xs mx-auto mb-5">Link your account to start publishing.</p>
                            <button onClick={() => handleConnect('linkedin')} className="px-5 py-2 bg-[#0A66C2] text-white text-xs font-semibold rounded-lg hover:bg-[#004182] transition-colors">
                                Connect LinkedIn
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* ===== QUEUE TAB — TABLE STYLE ===== */}
                            {activeView === 'queue' && (
                                <>
                                    {/* Insights from Chat Sessions */}
                                    {insights.length > 0 && (
                                        <div className="mb-5">
                                            <h3 className="text-[9px] uppercase tracking-[0.15em] font-bold text-sand-400 mb-2.5 flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                                Content Ideas from Your Chats
                                            </h3>
                                            <div className="grid gap-2.5">
                                                {insights.map(insight => (
                                                    <div
                                                        key={insight.id}
                                                        className="bg-gradient-to-r from-amber-50/80 to-orange-50/40 rounded-xl border border-amber-100/60 p-4 hover:shadow-sm transition-all"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-[13px] font-semibold text-sand-900 mb-1">{insight.title}</h4>
                                                                <p className="text-[11px] text-sand-500 leading-relaxed line-clamp-2">{insight.summary}</p>
                                                                {insight.key_takeaways && insight.key_takeaways.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                                        {insight.key_takeaways.slice(0, 3).map((t: string, i: number) => (
                                                                            <span key={i} className="text-[9px] bg-amber-100/60 text-amber-700 px-1.5 py-0.5 rounded font-medium">{t}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col gap-1.5 flex-shrink-0">
                                                                <span className="text-[9px] font-bold text-amber-500 tabular-nums text-center">
                                                                    {Math.round(insight.content_worthiness_score * 100)}%
                                                                </span>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingPost(null);
                                                                        setShowComposer(true);
                                                                    }}
                                                                    className="px-3 py-1.5 bg-sand-900 text-white text-[10px] font-semibold rounded-lg hover:bg-sand-800 transition-colors whitespace-nowrap"
                                                                >
                                                                    Draft Post →
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {queuePosts.length > 0 ? (
                                        <div className="bg-white rounded-xl border border-cream-200/80 overflow-hidden">
                                            {/* Table header */}
                                            <div className="grid grid-cols-[100px_1fr_80px_140px_120px] gap-3 px-5 py-2.5 bg-cream-50 border-b border-cream-100 text-[9px] uppercase tracking-[0.15em] font-bold text-sand-400">
                                                <span>Platform</span>
                                                <span>Content</span>
                                                <span>Media</span>
                                                <span>Schedule</span>
                                                <span className="text-right">Action</span>
                                            </div>

                                            {/* Rows */}
                                            {queuePosts.map((post, i) => (
                                                <div
                                                    key={post.id}
                                                    className={`grid grid-cols-[100px_1fr_80px_140px_120px] gap-3 px-5 py-3.5 items-center cursor-pointer transition-colors hover:bg-cream-50/50 ${i !== queuePosts.length - 1 ? 'border-b border-cream-100/60' : ''
                                                        }`}
                                                    onClick={() => setSelectedPost(post)}
                                                >
                                                    {/* Platform */}
                                                    <PlatformBadge platform={post.platform} />

                                                    {/* Content preview */}
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] text-sand-800 truncate leading-snug">{post.content}</p>
                                                        {post.hashtags && post.hashtags.length > 0 && (
                                                            <div className="flex gap-1 mt-0.5">
                                                                {post.hashtags.slice(0, 3).map((t, j) => (
                                                                    <span key={j} className="text-[9px] text-terracotta-400 font-medium">#{t}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Media */}
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        {post.mediaUrls && post.mediaUrls.length > 0 ? (
                                                            <MediaThumbnails urls={post.mediaUrls} onView={() => setMediaViewerPost(post)} />
                                                        ) : (
                                                            <button
                                                                onClick={() => setMediaViewerPost(post)}
                                                                className="text-[10px] text-sand-300 hover:text-terracotta-500 transition-colors flex items-center gap-1"
                                                                title="Add media"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                Add
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Schedule */}
                                                    <div>
                                                        {post.scheduledAt ? (
                                                            <div>
                                                                <p className="text-[11px] text-sand-600 font-medium">{formatDate(post.scheduledAt)}</p>
                                                                <p className="text-[9px] text-sand-400">in {timeUntil(post.scheduledAt)}</p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-sand-300 italic">Draft</span>
                                                        )}
                                                    </div>

                                                    {/* Actions — only Approve, editing is in the modal */}
                                                    <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleApprove(post.id)}
                                                            disabled={publishing === post.id}
                                                            className="px-2.5 py-1 text-[10px] font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                                                            title="Approve and publish now"
                                                        >
                                                            {publishing === post.id ? (
                                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                            )}
                                                            Approve
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-2xl border border-cream-200/60 p-16 text-center">
                                            <p className="text-sm text-sand-400 mb-4">Your queue is empty</p>
                                            <button onClick={() => setShowComposer(true)} className="px-4 py-2 bg-sand-900 text-white text-xs font-medium rounded-lg hover:bg-sand-800 transition-colors">
                                                Create your first post
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* ===== PUBLISHED TAB ===== */}
                            {activeView === 'published' && (
                                publishedPosts.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {publishedPosts.map(post => (
                                            <PublishedCard key={post.id} post={post} onClick={() => setSelectedPost(post)} analytics={postAnalyticsMap[post.id]} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl border border-cream-200/60 p-16 text-center">
                                        <p className="text-sm text-sand-400 mb-1">No published posts yet</p>
                                        <p className="text-xs text-sand-300">Approve posts from the Queue to publish them</p>
                                    </div>
                                )
                            )}

                            {/* ===== ANALYTICS TAB ===== */}
                            {activeView === 'analytics' && (
                                <AnalyticsDashboard posts={posts} analytics={analytics} />
                            )}
                        </>
                    )}
                </main>

                {/* Post Detail Modal */}
                {selectedPost && (
                    <PostDetailModal
                        post={selectedPost}
                        onClose={() => setSelectedPost(null)}
                        onPublishNow={handleApprove}
                        onSave={handleSavePost}
                        publishing={publishing === selectedPost.id}
                    />
                )}

                {/* Media Viewer Modal */}
                {mediaViewerPost && (
                    <MediaViewerModal
                        urls={mediaViewerPost.mediaUrls || []}
                        onClose={() => setMediaViewerPost(null)}
                        onUpload={handleMediaUpload}
                        onRemove={handleMediaRemove}
                    />
                )}

                {/* Post Composer Modal */}
                {showComposer && (
                    <PostComposer
                        editingPost={editingPost}
                        accounts={accounts}
                        userId={userId}
                        onClose={() => { setShowComposer(false); setEditingPost(null); }}
                        onCreated={() => { setShowComposer(false); setEditingPost(null); fetchData(); }}
                    />
                )}
            </div>
        </div>
    );
}
