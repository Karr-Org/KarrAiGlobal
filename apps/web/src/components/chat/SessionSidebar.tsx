'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    MessageSquare,
    Search,
    Plus,
    Star,
    Pin,
    Trash2,
    MoreHorizontal,
    Clock,
    ChevronDown,
    ChevronRight,
    Archive
} from 'lucide-react';

interface ChatSession {
    id: string;
    title: string | null;
    title_emoji: string | null;
    summary: string | null;
    primary_topic: string | null;
    topics: string[];
    message_count: number;
    last_message_at: string;
    is_starred: boolean;
    is_pinned: boolean;
    is_active: boolean;
}

interface GroupedSessions {
    pinned?: ChatSession[];
    today?: ChatSession[];
    yesterday?: ChatSession[];
    lastWeek?: ChatSession[];
    lastMonth?: ChatSession[];
    older?: ChatSession[];
}

interface SessionSidebarProps {
    productUserId: string;
    productId: string;
    currentSessionId?: string;
    onSessionSelect: (sessionId: string) => void;
    onNewSession: () => void;
    brandColor?: string;
}

const GROUP_LABELS: Record<string, string> = {
    pinned: '📌 Pinned',
    today: 'Today',
    yesterday: 'Yesterday',
    lastWeek: 'Last 7 Days',
    lastMonth: 'Last 30 Days',
    older: 'Older',
};

export function SessionSidebar({
    productUserId,
    productId,
    currentSessionId,
    onSessionSelect,
    onNewSession,
    brandColor = '#DA7B4D',
}: SessionSidebarProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [groupedSessions, setGroupedSessions] = useState<GroupedSessions>({});
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        pinned: true,
        today: true,
        yesterday: true,
        lastWeek: false,
        lastMonth: false,
        older: false,
    });
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Fetch sessions
    const fetchSessions = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                productUserId,
                productId,
                limit: '50',
            });

            if (searchQuery) {
                params.append('search', searchQuery);
            }

            const response = await fetch(`/api/cognitive/sessions?${params}`);
            const data = await response.json();

            if (data.sessions) {
                setSessions(data.sessions);
                setGroupedSessions(data.groupedSessions || {});
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setIsLoading(false);
        }
    }, [productUserId, productId, searchQuery]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) {
                fetchSessions();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Toggle group expansion
    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [group]: !prev[group],
        }));
    };

    // Session actions
    const handleSessionAction = async (sessionId: string, action: string) => {
        try {
            await fetch(`/api/cognitive/sessions/${sessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            fetchSessions();
        } catch (error) {
            console.error('Error performing action:', error);
        }
        setActiveMenu(null);
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!confirm('Delete this conversation? This cannot be undone.')) return;

        try {
            await fetch(`/api/cognitive/sessions/${sessionId}`, {
                method: 'DELETE',
            });
            fetchSessions();
        } catch (error) {
            console.error('Error deleting session:', error);
        }
        setActiveMenu(null);
    };

    // Format relative time
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    // Render session card
    const renderSession = (session: ChatSession) => {
        const isActive = session.id === currentSessionId;
        const title = session.title || 'New Conversation';
        const emoji = session.title_emoji || '💬';

        return (
            <div
                key={session.id}
                className={`
                    group relative px-3 py-2.5 rounded-xl cursor-pointer transition-all
                    ${isActive
                        ? 'bg-sand-100 shadow-sm'
                        : 'hover:bg-sand-50'
                    }
                `}
                onClick={() => onSessionSelect(session.id)}
            >
                <div className="flex items-start gap-2.5">
                    {/* Emoji */}
                    <span className="text-base flex-shrink-0 mt-0.5">{emoji}</span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            {session.is_starred && (
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                            )}
                            <h4 className={`
                                text-sm font-medium truncate
                                ${isActive ? 'text-sand-900' : 'text-sand-700'}
                            `}>
                                {title}
                            </h4>
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-sand-400">
                                {session.message_count} messages
                            </span>
                            <span className="text-xs text-sand-300">•</span>
                            <span className="text-xs text-sand-400">
                                {formatTime(session.last_message_at)}
                            </span>
                        </div>

                        {/* Primary topic badge */}
                        {session.primary_topic && (
                            <span
                                className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
                                style={{
                                    backgroundColor: `${brandColor}15`,
                                    color: brandColor,
                                }}
                            >
                                {session.primary_topic}
                            </span>
                        )}
                    </div>

                    {/* Actions menu */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(activeMenu === session.id ? null : session.id);
                            }}
                            className="p-1 rounded hover:bg-sand-200 text-sand-400 hover:text-sand-600"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown menu */}
                        {activeMenu === session.id && (
                            <div
                                className="absolute right-0 top-8 z-10 w-40 bg-white rounded-xl shadow-lg border border-sand-100 py-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => handleSessionAction(session.id, 'star')}
                                    className="w-full px-3 py-2 text-left text-sm text-sand-700 hover:bg-sand-50 flex items-center gap-2"
                                >
                                    <Star className="w-4 h-4" />
                                    {session.is_starred ? 'Unstar' : 'Star'}
                                </button>
                                <button
                                    onClick={() => handleSessionAction(session.id, 'pin')}
                                    className="w-full px-3 py-2 text-left text-sm text-sand-700 hover:bg-sand-50 flex items-center gap-2"
                                >
                                    <Pin className="w-4 h-4" />
                                    {session.is_pinned ? 'Unpin' : 'Pin'}
                                </button>
                                <button
                                    onClick={() => handleSessionAction(session.id, 'archive')}
                                    className="w-full px-3 py-2 text-left text-sm text-sand-700 hover:bg-sand-50 flex items-center gap-2"
                                >
                                    <Archive className="w-4 h-4" />
                                    Archive
                                </button>
                                <hr className="my-1 border-sand-100" />
                                <button
                                    onClick={() => handleDeleteSession(session.id)}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Render session group
    const renderGroup = (groupKey: string, sessions: ChatSession[]) => {
        const isExpanded = expandedGroups[groupKey];
        const label = GROUP_LABELS[groupKey] || groupKey;

        return (
            <div key={groupKey} className="mb-3">
                <button
                    onClick={() => toggleGroup(groupKey)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-sand-500 hover:text-sand-700"
                >
                    {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                    )}
                    {label}
                    <span className="text-sand-400">({sessions.length})</span>
                </button>

                {isExpanded && (
                    <div className="mt-1 space-y-1">
                        {sessions.map(renderSession)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-white border-r border-sand-100">
            {/* Header */}
            <div className="p-4 border-b border-sand-100">
                <button
                    onClick={onNewSession}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all hover:opacity-90 hover:shadow-md"
                    style={{ backgroundColor: brandColor }}
                >
                    <Plus className="w-4 h-4" />
                    New Chat
                </button>

                {/* Search */}
                <div className="relative mt-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-sand-50 border border-sand-100 text-sm text-sand-700 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-sand-200"
                    />
                </div>
            </div>

            {/* Sessions list */}
            <div className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-sand-200 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : Object.keys(groupedSessions).length === 0 ? (
                    <div className="text-center py-8 px-4">
                        <MessageSquare className="w-10 h-10 text-sand-300 mx-auto mb-3" />
                        <p className="text-sm text-sand-500">No conversations yet</p>
                        <p className="text-xs text-sand-400 mt-1">
                            Start a new chat to begin
                        </p>
                    </div>
                ) : (
                    Object.entries(groupedSessions).map(([group, sessions]) =>
                        renderGroup(group, sessions as ChatSession[])
                    )
                )}
            </div>

            {/* Footer stats */}
            <div className="p-3 border-t border-sand-100 bg-sand-50/50">
                <div className="flex items-center justify-between text-xs text-sand-400">
                    <span>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {sessions.length} conversations
                    </span>
                </div>
            </div>
        </div>
    );
}

export default SessionSidebar;
