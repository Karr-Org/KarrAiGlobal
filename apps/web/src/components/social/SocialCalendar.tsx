'use client';

/**
 * 🗓️ Unified Social Calendar Component
 * 
 * A single calendar component that works for BOTH user and product contexts.
 * Displays scheduled, published, and suggested posts in a weekly/monthly view.
 * 
 * Usage:
 *   <SocialCalendar owner={userOwner} />      // User's personal calendar
 *   <SocialCalendar owner={productOwner} />   // Product's marketing calendar
 * 
 * Both render identically — shared UI, shared logic, shared improvements.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    Send,
    Edit3,
    Sparkles,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Zap,
    BarChart3,
    Eye,
} from 'lucide-react';
import { SocialOwner } from '@/lib/social/owner-context';
import {
    getCalendar,
    fillCalendarSlots,
    getPosts,
    publishNow,
    type ContentCalendar,
    type CalendarWeek,
    type CalendarEntry,
    type UnifiedSocialPost,
    type SocialPlatform,
} from '@/lib/social/unified-social-service';

// ============================================
// PLATFORM ICONS
// ============================================

const PLATFORM_STYLES: Record<string, { name: string; color: string; bgColor: string }> = {
    linkedin: { name: 'LinkedIn', color: '#0A66C2', bgColor: 'rgba(10, 102, 194, 0.1)' },
    twitter: { name: 'X (Twitter)', color: '#000000', bgColor: 'rgba(0, 0, 0, 0.05)' },
    facebook: { name: 'Facebook', color: '#1877F2', bgColor: 'rgba(24, 119, 242, 0.1)' },
    instagram: { name: 'Instagram', color: '#E4405F', bgColor: 'rgba(228, 64, 95, 0.1)' },
    youtube: { name: 'YouTube', color: '#FF0000', bgColor: 'rgba(255, 0, 0, 0.1)' },
    medium: { name: 'Medium', color: '#000000', bgColor: 'rgba(0, 0, 0, 0.05)' },
    hashnode: { name: 'Hashnode', color: '#2962FF', bgColor: 'rgba(41, 98, 255, 0.1)' },
    devto: { name: 'Dev.to', color: '#0A0A0A', bgColor: 'rgba(10, 10, 10, 0.05)' },
};

const STATUS_STYLES: Record<string, { label: string; color: string; bgColor: string; icon: typeof Send }> = {
    draft: { label: 'Draft', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)', icon: Edit3 },
    scheduled: { label: 'Scheduled', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)', icon: Clock },
    publishing: { label: 'Publishing...', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)', icon: Loader2 },
    published: { label: 'Published', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)', icon: CheckCircle2 },
    failed: { label: 'Failed', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)', icon: AlertCircle },
};

// ============================================
// PROPS
// ============================================

interface SocialCalendarProps {
    /** The owner context — user or product */
    owner: SocialOwner;
    /** Optional: Callback when a post is clicked for editing */
    onEditPost?: (post: UnifiedSocialPost) => void;
    /** Optional: Callback when "compose" is clicked for a slot */
    onComposeForSlot?: (date: string, platform?: SocialPlatform) => void;
    /** Optional: Number of weeks to display */
    weeks?: number;
    /** Optional: Accent color override (from product branding) */
    accentColor?: string;
}

// ============================================
// DAY NAMES & HELPERS
// ============================================

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function formatTime(hour: number): string {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h}:00 ${ampm}`;
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

// ============================================
// COMPONENT
// ============================================

export default function SocialCalendar({
    owner,
    onEditPost,
    onComposeForSlot,
    weeks = 4,
    accentColor,
}: SocialCalendarProps) {
    const [calendar, setCalendar] = useState<ContentCalendar | null>(null);
    const [loading, setLoading] = useState(true);
    const [filling, setFilling] = useState(false);
    const [startDate, setStartDate] = useState<string>(getWeekStart(new Date()).toISOString());
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);

    const accent = accentColor || '#6366F1';

    // ─── FETCH CALENDAR ──────────────────────

    const fetchCalendar = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getCalendar(owner, {
                weeks: viewMode === 'week' ? 1 : weeks,
                startDate,
            });
            setCalendar(data);
        } catch (e) {
            console.error('Failed to fetch calendar:', e);
        } finally {
            setLoading(false);
        }
    }, [owner, weeks, startDate, viewMode]);

    useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

    // ─── NAVIGATION ──────────────────────────

    const navigate = (direction: 'prev' | 'next') => {
        const d = new Date(startDate);
        const delta = viewMode === 'week' ? 7 : 28;
        d.setDate(d.getDate() + (direction === 'next' ? delta : -delta));
        setStartDate(d.toISOString());
    };

    const goToToday = () => {
        setStartDate(getWeekStart(new Date()).toISOString());
    };

    // ─── AI FILL SLOTS ──────────────────────

    const handleFillSlots = async () => {
        setFilling(true);
        try {
            await fillCalendarSlots(owner, 5);
            await fetchCalendar();
        } catch (e) {
            console.error('Failed to fill slots:', e);
        } finally {
            setFilling(false);
        }
    };

    // ─── RENDER ──────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: accent }} />
                <span className="ml-2 text-sm text-gray-500">Loading calendar...</span>
            </div>
        );
    }

    const currentWeek = calendar?.weeks?.[0];
    const dateRange = currentWeek
        ? `${formatDate(currentWeek.startDate)} – ${formatDate(currentWeek.endDate)}`
        : '';

    return (
        <div className="space-y-4">
            {/* ─── HEADER ─────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: `${accent}15` }}
                    >
                        <Calendar className="w-5 h-5" style={{ color: accent }} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {owner.type === 'product' ? 'Product' : 'My'} Content Calendar
                        </h3>
                        <p className="text-sm text-gray-500">{dateRange}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* View toggle */}
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'week'
                                ? 'text-white'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            style={viewMode === 'week' ? { backgroundColor: accent } : {}}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'month'
                                ? 'text-white'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            style={viewMode === 'month' ? { backgroundColor: accent } : {}}
                        >
                            Month
                        </button>
                    </div>

                    {/* Navigation */}
                    <button
                        onClick={() => navigate('prev')}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => navigate('next')}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>

                    {/* AI Fill */}
                    <button
                        onClick={handleFillSlots}
                        disabled={filling}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-all hover:shadow-md disabled:opacity-50"
                        style={{ backgroundColor: accent }}
                    >
                        {filling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                        )}
                        AI Fill
                    </button>
                </div>
            </div>

            {/* ─── STATS BAR ─────────────────────── */}
            <div className="grid grid-cols-4 gap-3">
                <StatCard
                    label="Total Posts"
                    value={calendar?.totalPosts || 0}
                    icon={BarChart3}
                    color={accent}
                />
                <StatCard
                    label="Posts/Week"
                    value={(calendar?.publishingFrequency || 0).toFixed(1)}
                    icon={Zap}
                    color="#10B981"
                />
                <StatCard
                    label="Platforms"
                    value={Object.keys(calendar?.platformDistribution || {}).length}
                    icon={Eye}
                    color="#3B82F6"
                />
                <StatCard
                    label="Next Slot"
                    value={calendar?.nextSuggestedSlot
                        ? formatDate(calendar.nextSuggestedSlot.date)
                        : '—'}
                    icon={Clock}
                    color="#F59E0B"
                />
            </div>

            {/* ─── CALENDAR GRID ──────────────────── */}
            {viewMode === 'week' ? (
                <WeekView
                    week={currentWeek || null}
                    accent={accent}
                    onEditPost={onEditPost}
                    onComposeForSlot={onComposeForSlot}
                    selectedEntry={selectedEntry}
                    onSelectEntry={setSelectedEntry}
                />
            ) : (
                <MonthView
                    weeks={calendar?.weeks || []}
                    accent={accent}
                    onEditPost={onEditPost}
                    onComposeForSlot={onComposeForSlot}
                />
            )}

            {/* ─── PLATFORM DISTRIBUTION ──────────── */}
            {calendar && Object.keys(calendar.platformDistribution).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Platform Distribution</h4>
                    <div className="flex gap-3 flex-wrap">
                        {Object.entries(calendar.platformDistribution).map(([platform, count]) => {
                            const style = PLATFORM_STYLES[platform];
                            const total = calendar.totalPosts || 1;
                            const pct = Math.round((count / total) * 100);
                            return (
                                <div
                                    key={platform}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                    style={{ backgroundColor: style?.bgColor || '#f3f4f6' }}
                                >
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: style?.color || '#6B7280' }}
                                    />
                                    <span className="text-xs font-medium" style={{ color: style?.color || '#6B7280' }}>
                                        {style?.name || platform}
                                    </span>
                                    <span className="text-xs text-gray-500">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// SUBCOMPONENTS
// ============================================

function StatCard({ label, value, icon: Icon, color }: {
    label: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
                <p className="text-lg font-semibold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
            </div>
        </div>
    );
}

function WeekView({ week, accent, onEditPost, onComposeForSlot, selectedEntry, onSelectEntry }: {
    week: CalendarWeek | null;
    accent: string;
    onEditPost?: (post: UnifiedSocialPost) => void;
    onComposeForSlot?: (date: string, platform?: SocialPlatform) => void;
    selectedEntry: CalendarEntry | null;
    onSelectEntry: (entry: CalendarEntry | null) => void;
}) {
    if (!week) {
        return (
            <div className="text-center py-12 text-gray-400">
                No calendar data available
            </div>
        );
    }

    // Group entries by day of week
    const dayEntries: Record<number, CalendarEntry[]> = {};
    for (const entry of week.entries) {
        const day = entry.dayOfWeek === 0 ? 6 : entry.dayOfWeek - 1; // Mon=0
        if (!dayEntries[day]) dayEntries[day] = [];
        dayEntries[day].push(entry);
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
                {DAY_NAMES.map((name, i) => {
                    const dayDate = new Date(week.startDate);
                    dayDate.setDate(dayDate.getDate() + i);
                    const isToday = dayDate.toDateString() === new Date().toDateString();

                    return (
                        <div
                            key={name}
                            className={`text-center py-3 text-xs font-medium ${isToday ? 'text-white' : 'text-gray-500'
                                }`}
                            style={isToday ? { backgroundColor: accent } : {}}
                        >
                            <div>{name}</div>
                            <div className={`text-lg font-semibold ${isToday ? 'text-white' : 'text-gray-900'}`}>
                                {dayDate.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 min-h-[240px]">
                {DAY_NAMES.map((_, i) => {
                    const entries = dayEntries[i] || [];
                    const dayDate = new Date(week.startDate);
                    dayDate.setDate(dayDate.getDate() + i);
                    const isPast = dayDate < new Date() && dayDate.toDateString() !== new Date().toDateString();

                    return (
                        <div
                            key={i}
                            className={`border-r border-gray-50 p-2 space-y-1.5 ${isPast ? 'bg-gray-50/50' : ''
                                } ${i === 6 ? 'border-r-0' : ''}`}
                        >
                            {entries.map(entry => (
                                <CalendarPostCard
                                    key={entry.id}
                                    entry={entry}
                                    accent={accent}
                                    onClick={() => {
                                        if (entry.post && onEditPost) {
                                            onEditPost(entry.post);
                                        } else if (!entry.post && onComposeForSlot) {
                                            onComposeForSlot(entry.date, entry.suggestedPlatform);
                                        }
                                        onSelectEntry(entry);
                                    }}
                                    isSelected={selectedEntry?.id === entry.id}
                                />
                            ))}

                            {/* Add button for empty future days */}
                            {entries.length === 0 && !isPast && (
                                <button
                                    onClick={() => onComposeForSlot?.(dayDate.toISOString())}
                                    className="w-full h-full min-h-[60px] rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 flex items-center justify-center transition-colors group"
                                >
                                    <Plus className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function MonthView({ weeks, accent, onEditPost, onComposeForSlot }: {
    weeks: CalendarWeek[];
    accent: string;
    onEditPost?: (post: UnifiedSocialPost) => void;
    onComposeForSlot?: (date: string, platform?: SocialPlatform) => void;
}) {
    return (
        <div className="space-y-2">
            {weeks.map((week, wi) => (
                <div key={wi} className="bg-white rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">
                            Week {week.weekNumber} · {formatDate(week.startDate)} – {formatDate(week.endDate)}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{week.totalScheduled} scheduled</span>
                            <span>·</span>
                            <span>{week.totalPublished} published</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 7 }).map((_, di) => {
                            const dayDate = new Date(week.startDate);
                            dayDate.setDate(dayDate.getDate() + di);
                            const dayEntries = week.entries.filter(e => {
                                const d = new Date(e.date);
                                return d.toDateString() === dayDate.toDateString();
                            });
                            const hasPost = dayEntries.some(e => e.post);

                            return (
                                <div
                                    key={di}
                                    className={`h-10 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-all hover:ring-2 ${hasPost
                                        ? 'text-white font-medium'
                                        : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                                        }`}
                                    style={hasPost ? { backgroundColor: accent } : {} as React.CSSProperties}
                                    onClick={() => {
                                        const postEntry = dayEntries.find(e => e.post);
                                        if (postEntry?.post && onEditPost) {
                                            onEditPost(postEntry.post);
                                        } else {
                                            onComposeForSlot?.(dayDate.toISOString());
                                        }
                                    }}
                                    title={`${DAY_NAMES_FULL[di]}: ${dayEntries.length} entries`}
                                >
                                    {dayDate.getDate()}
                                    {dayEntries.length > 1 && (
                                        <span className="ml-0.5 text-[10px] opacity-70">+{dayEntries.length - 1}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

function CalendarPostCard({ entry, accent, onClick, isSelected }: {
    entry: CalendarEntry;
    accent: string;
    onClick: () => void;
    isSelected: boolean;
}) {
    const post = entry.post;

    if (!post) {
        // Empty suggestion slot
        return (
            <button
                onClick={onClick}
                className="w-full px-2 py-1.5 rounded-lg border border-dashed border-gray-200 hover:border-gray-300 text-left transition-all group"
            >
                <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-gray-500">
                    <Sparkles className="w-3 h-3" />
                    <span>{formatTime(entry.hour)}</span>
                </div>
                {entry.isOptimalTime && (
                    <div className="text-[10px] text-emerald-500 mt-0.5">✨ Optimal time</div>
                )}
            </button>
        );
    }

    const statusStyle = STATUS_STYLES[post.status] || STATUS_STYLES.draft;
    const platformStyle = PLATFORM_STYLES[post.platform];
    const StatusIcon = statusStyle.icon;

    return (
        <button
            onClick={onClick}
            className={`w-full px-2 py-1.5 rounded-lg text-left transition-all hover:shadow-sm ${isSelected ? 'ring-2' : ''
                }`}
            style={{
                backgroundColor: platformStyle?.bgColor || '#f3f4f6',
                borderLeft: `3px solid ${platformStyle?.color || '#6B7280'}`,
            }}
        >
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium" style={{ color: platformStyle?.color }}>
                    {platformStyle?.name || post.platform}
                </span>
                <StatusIcon
                    className={`w-3 h-3 ${post.status === 'publishing' ? 'animate-spin' : ''}`}
                    style={{ color: statusStyle.color }}
                />
            </div>
            <p className="text-xs text-gray-700 line-clamp-2 mt-0.5 leading-relaxed">
                {post.content.substring(0, 60)}
                {post.content.length > 60 ? '...' : ''}
            </p>
            {post.scheduledAt && (
                <p className="text-[10px] text-gray-400 mt-1">
                    {formatTime(new Date(post.scheduledAt).getHours())}
                </p>
            )}
        </button>
    );
}

// ============================================
// HELPERS
// ============================================

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    d.setHours(0, 0, 0, 0);
    return d;
}
