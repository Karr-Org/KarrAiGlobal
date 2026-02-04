'use client';

/**
 * 🧠 COGNITIVE PROFILE DASHBOARD
 * 
 * The "Digital Twin" Viewer - Shows users everything the AI has learned about them.
 * 
 * Revolutionary Features:
 * - Real-time profile visualization
 * - Expertise levels with progress bars
 * - Entity knowledge graph preview
 * - Memory facts display
 * - Goals & challenges tracking
 * - Behavioral insights
 * 
 * @author Karr AI Architecture Team
 * @version 1.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain,
    User,
    Target,
    BookOpen,
    Users,
    Clock,
    Sparkles,
    ChevronRight,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Award,
    Zap,
    MessageSquare,
    Heart,
    Settings,
    RefreshCw,
    Eye,
    EyeOff,
    Lightbulb,
    Calendar,
    BarChart3,
    Network,
    Download,
    Edit2,
    Trash2,
    Plus,
    Check,
    X
} from 'lucide-react';
import { NRMInsights } from './NRMInsights';

// Types
interface CognitiveProfile {
    profession: string | null;
    industry: string | null;
    personaSummary: string | null;
    personaKeywords: string[];
    domains: string[];
    expertiseLevels: Record<string, { level: string; confidence: number }>;
    learningVelocity: Record<string, any>;
    knowledgeGaps: string[];
    communicationStyle: string | null;
    preferredResponseLength: string | null;
    vocabularyLevel: string | null;
    prefersStepByStep: boolean;
    activeHours: Record<string, number>;
    peakUsageTime: string | null;
    typicalSessionLength: number;
    defaultSentiment: string | null;
    frustrationTriggers: string[];
    patienceLevel: string | null;
    activeGoals: any[];
    completedGoals: any[];
    recurringChallenges: any[];
    totalSessions: number;
    totalMessages: number;
    daysActive: number;
    firstInteraction: string | null;
    lastInteraction: string | null;
    profileConfidence: number;
}

interface Entity {
    id: string;
    name: string;
    type: string;
    relationship: string;
    mentions: number;
    facts: string[];
    lastMentioned: string;
}

interface Fact {
    id: string;
    category: string;
    statement: string;
    confidence: number;
    learned: string;
}

interface CognitiveData {
    profile: CognitiveProfile | null;
    entities: Entity[];
    facts: Fact[];
    recentSessions: any[];
    insights: any[];
    summary: {
        entitiesKnown: number;
        factsStored: number;
        sessionsAnalyzed: number;
        insightsGenerated: number;
    };
}

interface CognitiveProfileDashboardProps {
    productUserId: string;
    productId: string;
    onClose?: () => void;
    isModal?: boolean;
}

// Helper function to get expertise level color
const getExpertiseColor = (level: string) => {
    switch (level.toLowerCase()) {
        case 'expert': return 'bg-purple-500';
        case 'advanced': return 'bg-amber-500';
        case 'intermediate': return 'bg-green-500';
        case 'beginner': return 'bg-blue-500';
        default: return 'bg-stone-400';
    }
};

const getExpertiseWidth = (level: string) => {
    switch (level.toLowerCase()) {
        case 'expert': return '100%';
        case 'advanced': return '75%';
        case 'intermediate': return '50%';
        case 'beginner': return '25%';
        default: return '10%';
    }
};

const getEntityIcon = (type: string) => {
    switch (type.toLowerCase()) {
        case 'person': return Users;
        case 'company': case 'organization': return Network;
        case 'concept': return Lightbulb;
        case 'project': return Target;
        default: return BookOpen;
    }
};

export function CognitiveProfileDashboard({
    productUserId,
    productId,
    onClose,
    isModal = false,
}: CognitiveProfileDashboardProps) {
    const [data, setData] = useState<CognitiveData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'expertise' | 'entities' | 'memory' | 'goals' | 'neural'>('overview');
    const [refreshing, setRefreshing] = useState(false);

    // Edit mode states
    const [editMode, setEditMode] = useState(false);
    const [editProfession, setEditProfession] = useState('');
    const [editIndustry, setEditIndustry] = useState('');
    const [newGoal, setNewGoal] = useState('');
    const [saving, setSaving] = useState(false);

    // Delete confirmation states
    const [deletingFactId, setDeletingFactId] = useState<string | null>(null);
    const [deletingEntityId, setDeletingEntityId] = useState<string | null>(null);

    // Export state
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchCognitiveProfile();
    }, [productUserId, productId]);

    const fetchCognitiveProfile = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/cognitive/profile?productUserId=${productUserId}`);
            if (!res.ok) throw new Error('Failed to fetch profile');
            const profileData = await res.json();
            setData(profileData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchCognitiveProfile();
        setRefreshing(false);
    };

    // Save profile updates
    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const updates: Record<string, any> = {};
            if (editProfession) updates.profession = editProfession;
            if (editIndustry) updates.industry = editIndustry;

            const res = await fetch('/api/cognitive/profile/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productUserId, updates }),
            });

            if (res.ok) {
                setEditMode(false);
                await fetchCognitiveProfile();
            }
        } catch (err) {
            console.error('Failed to save profile:', err);
        } finally {
            setSaving(false);
        }
    };

    // Add a new goal
    const handleAddGoal = async () => {
        if (!newGoal.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/cognitive/profile/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productUserId,
                    updates: { addGoal: newGoal.trim() },
                }),
            });

            if (res.ok) {
                setNewGoal('');
                await fetchCognitiveProfile();
            }
        } catch (err) {
            console.error('Failed to add goal:', err);
        } finally {
            setSaving(false);
        }
    };

    // Complete a goal
    const handleCompleteGoal = async (index: number) => {
        setSaving(true);
        try {
            const res = await fetch('/api/cognitive/profile/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productUserId,
                    updates: { completeGoalIndex: index },
                }),
            });

            if (res.ok) {
                await fetchCognitiveProfile();
            }
        } catch (err) {
            console.error('Failed to complete goal:', err);
        } finally {
            setSaving(false);
        }
    };

    // Delete a fact
    const handleDeleteFact = async (factId: string) => {
        setDeletingFactId(factId);
        try {
            const res = await fetch(
                `/api/cognitive/facts?factId=${factId}&productUserId=${productUserId}`,
                { method: 'DELETE' }
            );

            if (res.ok) {
                await fetchCognitiveProfile();
            }
        } catch (err) {
            console.error('Failed to delete fact:', err);
        } finally {
            setDeletingFactId(null);
        }
    };

    // Delete an entity
    const handleDeleteEntity = async (entityId: string) => {
        setDeletingEntityId(entityId);
        try {
            const res = await fetch(
                `/api/cognitive/entities/${entityId}?productUserId=${productUserId}`,
                { method: 'DELETE' }
            );

            if (res.ok) {
                await fetchCognitiveProfile();
            }
        } catch (err) {
            console.error('Failed to delete entity:', err);
        } finally {
            setDeletingEntityId(null);
        }
    };

    // Export all data
    const handleExportData = async () => {
        setExporting(true);
        try {
            const res = await fetch(`/api/cognitive/export?productUserId=${productUserId}`);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cognitive-profile-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to export data:', err);
        } finally {
            setExporting(false);
        }
    };

    // Initialize edit fields when entering edit mode
    const enterEditMode = () => {
        setEditProfession(data?.profile?.profession || '');
        setEditIndustry(data?.profile?.industry || '');
        setEditMode(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-terracotta-500 mx-auto mb-4" />
                    <p className="text-sand-500 text-sm">Loading your Digital Twin...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                    <p className="text-sand-800 font-medium">Failed to load profile</p>
                    <p className="text-sand-500 text-sm mt-1">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="mt-4 px-4 py-2 bg-terracotta-500 text-white rounded-lg text-sm hover:bg-terracotta-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const { profile, entities, facts, recentSessions, insights, summary } = data;

    return (
        <div className={`${isModal ? 'h-full' : 'h-full'} flex flex-col bg-cream-50`}>
            {/* Header */}
            <div className="flex-shrink-0 border-b border-sand-200 bg-white/80 backdrop-blur-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta-400 to-amber-500 flex items-center justify-center shadow-lg shadow-terracotta-500/20">
                                <Brain className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-sand-900">Your Digital Twin</h2>
                                <p className="text-xs text-sand-500">
                                    What I've learned about you • {summary.factsStored} facts stored
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Export Button */}
                            <button
                                onClick={handleExportData}
                                disabled={exporting}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand-100 hover:bg-sand-200 text-sand-700 text-sm font-medium transition-colors"
                                title="Export Your Data"
                            >
                                {exporting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                Export
                            </button>

                            {/* Edit Button */}
                            {!editMode ? (
                                <button
                                    onClick={enterEditMode}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-terracotta-100 hover:bg-terracotta-200 text-terracotta-700 text-sm font-medium transition-colors"
                                    title="Edit Profile"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 text-sm font-medium transition-colors"
                                    >
                                        {saving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Check className="w-4 h-4" />
                                        )}
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditMode(false)}
                                        className="p-1.5 rounded-lg hover:bg-sand-200 text-sand-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Refresh Button */}
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-2 rounded-lg hover:bg-sand-100 transition-colors"
                                title="Refresh Profile"
                            >
                                <RefreshCw className={`w-4 h-4 text-sand-500 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-sand-100 transition-colors"
                                >
                                    <Settings className="w-4 h-4 text-sand-500" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="flex items-center gap-6 mt-4">
                        {[
                            { label: 'Sessions', value: summary.sessionsAnalyzed, icon: MessageSquare },
                            { label: 'Entities', value: summary.entitiesKnown, icon: Users },
                            { label: 'Facts', value: summary.factsStored, icon: BookOpen },
                            { label: 'Insights', value: summary.insightsGenerated, icon: Lightbulb },
                        ].map((stat) => (
                            <div key={stat.label} className="flex items-center gap-2">
                                <stat.icon className="w-4 h-4 text-sand-400" />
                                <span className="text-sm font-semibold text-sand-800">{stat.value}</span>
                                <span className="text-xs text-sand-500">{stat.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mt-4">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'expertise', label: 'Expertise', icon: Award },
                            { id: 'entities', label: 'People & Things', icon: Users },
                            { id: 'memory', label: 'Memory', icon: Brain },
                            { id: 'goals', label: 'Goals', icon: Target },
                            { id: 'neural', label: 'Neural Insights', icon: Network },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === tab.id
                                    ? 'bg-sand-800 text-white'
                                    : 'text-sand-600 hover:bg-sand-100'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Profile Summary Card */}
                            <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-sand-800 mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4 text-terracotta-500" />
                                    Who You Are
                                </h3>

                                {profile?.personaSummary ? (
                                    <p className="text-sand-700 text-sm leading-relaxed">
                                        {profile.personaSummary}
                                    </p>
                                ) : (
                                    <p className="text-sand-500 text-sm italic">
                                        I'm still learning about you. Keep chatting and I'll build a better picture!
                                    </p>
                                )}

                                {profile?.personaKeywords && profile.personaKeywords.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {profile.personaKeywords.slice(0, 6).map((keyword, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 rounded-full bg-sand-100 text-sand-700 text-xs font-medium"
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="p-3 rounded-xl bg-sand-50">
                                        <p className="text-xs text-sand-500 mb-1">Profession</p>
                                        {editMode ? (
                                            <input
                                                type="text"
                                                value={editProfession}
                                                onChange={(e) => setEditProfession(e.target.value)}
                                                placeholder="e.g., Software Engineer"
                                                className="w-full text-sm font-medium text-sand-800 bg-white border border-sand-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-sand-800">
                                                {profile?.profession || 'Not detected yet'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="p-3 rounded-xl bg-sand-50">
                                        <p className="text-xs text-sand-500 mb-1">Industry</p>
                                        {editMode ? (
                                            <input
                                                type="text"
                                                value={editIndustry}
                                                onChange={(e) => setEditIndustry(e.target.value)}
                                                placeholder="e.g., Technology"
                                                className="w-full text-sm font-medium text-sand-800 bg-white border border-sand-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-sand-800">
                                                {profile?.industry || 'Not detected yet'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Communication Style */}
                            <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-sand-800 mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-blue-500" />
                                    How You Communicate
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-3 rounded-xl bg-blue-50">
                                        <p className="text-xs text-blue-600 mb-1">Style</p>
                                        <p className="text-sm font-medium text-blue-800 capitalize">
                                            {profile?.communicationStyle || 'Learning...'}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-green-50">
                                        <p className="text-xs text-green-600 mb-1">Response Length</p>
                                        <p className="text-sm font-medium text-green-800 capitalize">
                                            {profile?.preferredResponseLength || 'Learning...'}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-purple-50">
                                        <p className="text-xs text-purple-600 mb-1">Vocabulary</p>
                                        <p className="text-sm font-medium text-purple-800 capitalize">
                                            {profile?.vocabularyLevel || 'Learning...'}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-amber-50">
                                        <p className="text-xs text-amber-600 mb-1">Peak Time</p>
                                        <p className="text-sm font-medium text-amber-800 capitalize">
                                            {profile?.peakUsageTime || 'Learning...'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Stats */}
                            <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-sand-800 mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                                    Your Activity
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
                                        <p className="text-2xl font-bold text-emerald-600">{profile?.totalSessions || 0}</p>
                                        <p className="text-xs text-emerald-700 mt-1">Total Sessions</p>
                                    </div>
                                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                                        <p className="text-2xl font-bold text-blue-600">{profile?.totalMessages || 0}</p>
                                        <p className="text-xs text-blue-700 mt-1">Messages Exchanged</p>
                                    </div>
                                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                                        <p className="text-2xl font-bold text-amber-600">{profile?.daysActive || 0}</p>
                                        <p className="text-xs text-amber-700 mt-1">Days Active</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'expertise' && (
                        <motion.div
                            key="expertise"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Expertise Levels */}
                            <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-sand-800 mb-4 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-amber-500" />
                                    Your Expertise Levels
                                </h3>

                                {profile?.expertiseLevels && Object.keys(profile.expertiseLevels).length > 0 ? (
                                    <div className="space-y-4">
                                        {Object.entries(profile.expertiseLevels).map(([topic, data]) => (
                                            <div key={topic}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-sand-700">{topic}</span>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${data.level === 'expert' ? 'bg-purple-100 text-purple-700' :
                                                        data.level === 'advanced' ? 'bg-amber-100 text-amber-700' :
                                                            data.level === 'intermediate' ? 'bg-green-100 text-green-700' :
                                                                'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {data.level}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-sand-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: getExpertiseWidth(data.level) }}
                                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                                        className={`h-full ${getExpertiseColor(data.level)} rounded-full`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sand-500 text-sm italic">
                                        Keep exploring topics and I'll track your expertise growth!
                                    </p>
                                )}
                            </div>

                            {/* Knowledge Gaps */}
                            {profile?.knowledgeGaps && profile.knowledgeGaps.length > 0 && (
                                <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                                    <h3 className="text-sm font-semibold text-sand-800 mb-4 flex items-center gap-2">
                                        <Lightbulb className="w-4 h-4 text-blue-500" />
                                        Areas to Explore
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.knowledgeGaps.map((gap, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm border border-blue-100"
                                            >
                                                {gap}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Domains */}
                            {profile?.domains && profile.domains.length > 0 && (
                                <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                                    <h3 className="text-sm font-semibold text-sand-800 mb-4 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-green-500" />
                                        Your Domains
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.domains.map((domain, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm border border-green-100"
                                            >
                                                {domain}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'entities' && (
                        <motion.div
                            key="entities"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-sand-800 mb-4 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-purple-500" />
                                    People & Things I Know About
                                </h3>

                                {entities && entities.length > 0 ? (
                                    <div className="space-y-3">
                                        {entities.map((entity) => {
                                            const Icon = getEntityIcon(entity.type);
                                            return (
                                                <div
                                                    key={entity.id}
                                                    className="p-4 rounded-xl bg-sand-50 hover:bg-sand-100 transition-colors group relative"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 rounded-lg bg-white shadow-sm">
                                                            <Icon className="w-4 h-4 text-purple-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-medium text-sand-800">{entity.name}</h4>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-sand-500">
                                                                        {entity.mentions} mentions
                                                                    </span>
                                                                    <button
                                                                        onClick={() => handleDeleteEntity(entity.id)}
                                                                        disabled={deletingEntityId === entity.id}
                                                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 text-sand-400 hover:text-red-500 transition-all"
                                                                        title="Remove this entity"
                                                                    >
                                                                        {deletingEntityId === entity.id ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <Trash2 className="w-4 h-4" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-sand-500 mt-0.5 capitalize">
                                                                {entity.type} • {entity.relationship || 'Unknown relationship'}
                                                            </p>
                                                            {entity.facts && entity.facts.length > 0 && (
                                                                <div className="mt-2 space-y-1">
                                                                    {entity.facts.slice(0, 2).map((fact, fIdx) => (
                                                                        <p key={fIdx} className="text-xs text-sand-600 flex items-center gap-1">
                                                                            <ChevronRight className="w-3 h-3 flex-shrink-0" />
                                                                            {fact}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sand-500 text-sm italic">
                                        Mention people, companies, or concepts in your chats and I'll remember them!
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'memory' && (
                        <motion.div
                            key="memory"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-sand-800 mb-4 flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-indigo-500" />
                                    Things I Remember
                                </h3>

                                {facts && facts.length > 0 ? (
                                    <div className="space-y-2">
                                        {facts.map((fact) => (
                                            <div
                                                key={fact.id}
                                                className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 group relative"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm text-sand-800 flex-1">{fact.statement}</p>
                                                    <button
                                                        onClick={() => handleDeleteFact(fact.id)}
                                                        disabled={deletingFactId === fact.id}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 text-sand-400 hover:text-red-500 transition-all"
                                                        title="Remove this fact"
                                                    >
                                                        {deletingFactId === fact.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 capitalize">
                                                        {fact.category}
                                                    </span>
                                                    <span className="text-xs text-sand-500">
                                                        {Math.round(fact.confidence * 100)}% confident
                                                    </span>
                                                    <span className="text-xs text-sand-400">
                                                        {new Date(fact.learned).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sand-500 text-sm italic">
                                        As we chat, I'll extract and remember important facts about your work and preferences.
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'goals' && (
                        <motion.div
                            key="goals"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Active Goals */}
                            <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-sand-800 mb-4 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-green-500" />
                                    Active Goals
                                </h3>

                                {/* Add Goal Form */}
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={newGoal}
                                        onChange={(e) => setNewGoal(e.target.value)}
                                        placeholder="Add a new goal..."
                                        className="flex-1 px-3 py-2 text-sm border border-sand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                                    />
                                    <button
                                        onClick={handleAddGoal}
                                        disabled={saving || !newGoal.trim()}
                                        className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                                    >
                                        {saving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Plus className="w-4 h-4" />
                                        )}
                                        Add
                                    </button>
                                </div>

                                {profile?.activeGoals && profile.activeGoals.length > 0 ? (
                                    <div className="space-y-3">
                                        {profile.activeGoals.map((goal: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="p-4 rounded-xl bg-green-50 border border-green-100 group"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <Zap className="w-4 h-4 text-green-500" />
                                                        <span className="font-medium text-green-800">{goal.goal || goal}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCompleteGoal(idx)}
                                                        disabled={saving}
                                                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-all"
                                                        title="Mark as complete"
                                                    >
                                                        {saving ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="w-3 h-3" />
                                                        )}
                                                        Complete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sand-500 text-sm italic">
                                        Add your first goal above or share them in chat!
                                    </p>
                                )}
                            </div>

                            {/* Challenges */}
                            {profile?.recurringChallenges && profile.recurringChallenges.length > 0 && (
                                <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                                    <h3 className="text-sm font-semibold text-sand-800 mb-4 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-500" />
                                        Challenges I've Noticed
                                    </h3>
                                    <div className="space-y-2">
                                        {profile.recurringChallenges.map((challenge: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="p-3 rounded-xl bg-amber-50 border border-amber-100"
                                            >
                                                <span className="text-sm text-amber-800">
                                                    {challenge.challenge || challenge}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Completed Goals */}
                            {profile?.completedGoals && profile.completedGoals.length > 0 && (
                                <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                                    <h3 className="text-sm font-semibold text-sand-800 mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        Completed Goals
                                    </h3>
                                    <div className="space-y-2">
                                        {profile.completedGoals.map((goal: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                <span className="text-sm text-emerald-800">
                                                    {goal.goal || goal}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'neural' && (
                        <motion.div
                            key="neural"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <NRMInsights
                                productUserId={productUserId}
                                productId={productId}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default CognitiveProfileDashboard;
