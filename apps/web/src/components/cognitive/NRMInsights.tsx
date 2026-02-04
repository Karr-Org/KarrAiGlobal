/**
 * 🧠 NEURAL RELATIONAL MEMORY INSIGHTS
 * 
 * Advanced AI-powered insights from the knowledge graph:
 * - Relationship predictions (what might happen)
 * - Connection opportunities (people who should connect)
 * - Entity clusters (groups that form naturally)
 * - Decaying relationships (needs attention)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain,
    Network,
    TrendingDown,
    Lightbulb,
    Users,
    AlertTriangle,
    Sparkles,
    ChevronRight,
    RefreshCw,
    Loader2,
    Link2,
    Target,
    Clock,
    Zap,
    Eye,
    ArrowRight
} from 'lucide-react';

interface NRMInsightsProps {
    productUserId: string;
    productId: string;
}

interface Prediction {
    type: 'relationship_decay' | 'topic_interest' | 'connection_opportunity' | 'conflict_risk';
    entityId: string;
    targetEntityId?: string;
    prediction: Record<string, any>;
    confidence: number;
    reasoning: string;
    predictedTimeframe?: string;
}

interface DecayingRelationship {
    sourceEntityId: string;
    targetEntityId: string;
    strength: number;
    daysInactive: number;
}

interface ConnectionOpportunity {
    entityAId: string;
    entityBId: string;
    commonConnections: string[];
    suggestedRelationship: string;
    confidence: number;
    reasoning: string;
}

interface EntityCluster {
    id?: string;
    name: string;
    type: 'work_context' | 'project' | 'family' | 'friend_group' | 'topic_area' | 'organization';
    description?: string;
    members: string[];
    centroidEntityId?: string;
    cohesionScore?: number;
}

interface NRMData {
    predictions: Prediction[];
    decayingRelationships: DecayingRelationship[];
    connectionOpportunities: ConnectionOpportunity[];
    clusters: EntityCluster[];
    summary: {
        totalPredictions: number;
        decayingCount: number;
        opportunitiesCount: number;
        clustersCount: number;
    };
}

export function NRMInsights({ productUserId, productId }: NRMInsightsProps) {
    const [data, setData] = useState<NRMData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'predictions' | 'clusters' | 'opportunities' | 'decaying'>('predictions');
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            setRefreshing(true);
            const response = await fetch(
                `/api/cognitive/nrm?productUserId=${productUserId}&productId=${productId}&feature=all`
            );

            if (!response.ok) throw new Error('Failed to fetch NRM insights');

            const result = await response.json();
            setData(result);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [productUserId, productId]);

    const tabs = [
        {
            id: 'predictions' as const,
            label: 'Predictions',
            icon: Lightbulb,
            color: 'amber',
            count: data?.predictions?.length || 0
        },
        {
            id: 'clusters' as const,
            label: 'Clusters',
            icon: Users,
            color: 'purple',
            count: data?.clusters?.length || 0
        },
        {
            id: 'opportunities' as const,
            label: 'Opportunities',
            icon: Link2,
            color: 'green',
            count: data?.connectionOpportunities?.length || 0
        },
        {
            id: 'decaying' as const,
            label: 'Needs Attention',
            icon: AlertTriangle,
            color: 'red',
            count: data?.decayingRelationships?.length || 0
        },
    ];

    const getPredictionIcon = (type: string) => {
        switch (type) {
            case 'relationship_decay': return Clock;
            case 'topic_interest': return Target;
            case 'connection_opportunity': return Link2;
            case 'conflict_risk': return AlertTriangle;
            default: return Sparkles;
        }
    };

    const getClusterColor = (type: string) => {
        switch (type) {
            case 'work_context': return 'bg-blue-100 text-blue-700';
            case 'project': return 'bg-purple-100 text-purple-700';
            case 'family': return 'bg-pink-100 text-pink-700';
            case 'friend_group': return 'bg-green-100 text-green-700';
            case 'topic_area': return 'bg-amber-100 text-amber-700';
            case 'organization': return 'bg-indigo-100 text-indigo-700';
            default: return 'bg-sand-100 text-sand-700';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-terracotta-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 rounded-2xl border border-red-200">
                <p className="text-red-600">{error}</p>
                <button
                    onClick={fetchData}
                    className="mt-2 text-sm text-red-500 underline"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <Network className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-sand-900">Neural Insights</h2>
                        <p className="text-xs text-sand-500">AI-powered relationship intelligence</p>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    disabled={refreshing}
                    className="p-2 rounded-lg hover:bg-sand-100 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 text-sand-500 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'Predictions', value: data.summary?.totalPredictions || 0, color: 'amber' },
                    { label: 'Clusters', value: data.summary?.clustersCount || 0, color: 'purple' },
                    { label: 'Opportunities', value: data.summary?.opportunitiesCount || 0, color: 'green' },
                    { label: 'Attention', value: data.summary?.decayingCount || 0, color: 'red' },
                ].map((stat, idx) => (
                    <div
                        key={idx}
                        className={`p-3 rounded-xl bg-${stat.color}-50 border border-${stat.color}-100`}
                    >
                        <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                        <p className="text-xs text-sand-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-sand-200 pb-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? `bg-${tab.color}-100 text-${tab.color}-700`
                                    : 'text-sand-500 hover:bg-sand-100'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-xs ${isActive ? `bg-${tab.color}-200` : 'bg-sand-200'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'predictions' && (
                    <motion.div
                        key="predictions"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                    >
                        {data.predictions && data.predictions.length > 0 ? (
                            data.predictions.map((pred, idx) => {
                                const Icon = getPredictionIcon(pred.type);
                                return (
                                    <div
                                        key={idx}
                                        className="p-4 rounded-xl bg-amber-50 border border-amber-100"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-white shadow-sm">
                                                <Icon className="w-4 h-4 text-amber-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 capitalize">
                                                        {pred.type.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-xs text-sand-500">
                                                        {Math.round(pred.confidence * 100)}% confidence
                                                    </span>
                                                </div>
                                                <p className="text-sm text-sand-800">{pred.reasoning}</p>
                                                {pred.predictedTimeframe && (
                                                    <p className="text-xs text-sand-500 mt-1">
                                                        <Clock className="w-3 h-3 inline mr-1" />
                                                        {pred.predictedTimeframe}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sand-500 text-sm italic p-4">
                                Not enough data yet for predictions. Keep chatting to build your knowledge graph!
                            </p>
                        )}
                    </motion.div>
                )}

                {activeTab === 'clusters' && (
                    <motion.div
                        key="clusters"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                    >
                        {data.clusters && data.clusters.length > 0 ? (
                            data.clusters.map((cluster, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 rounded-xl bg-purple-50 border border-purple-100"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-purple-600" />
                                            <h4 className="font-medium text-sand-800">{cluster.name}</h4>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getClusterColor(cluster.type)}`}>
                                            {cluster.type.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    {cluster.description && (
                                        <p className="text-sm text-sand-600 mb-2">{cluster.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-1">
                                        {cluster.members.slice(0, 5).map((member, mIdx) => (
                                            <span
                                                key={mIdx}
                                                className="text-xs px-2 py-1 rounded-full bg-white border border-purple-100 text-purple-700"
                                            >
                                                {member}
                                            </span>
                                        ))}
                                        {cluster.members.length > 5 && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-600">
                                                +{cluster.members.length - 5} more
                                            </span>
                                        )}
                                    </div>
                                    {cluster.cohesionScore && (
                                        <div className="mt-2">
                                            <div className="flex items-center justify-between text-xs text-sand-500 mb-1">
                                                <span>Cohesion</span>
                                                <span>{Math.round(cluster.cohesionScore * 100)}%</span>
                                            </div>
                                            <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-purple-500 rounded-full"
                                                    style={{ width: `${cluster.cohesionScore * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-sand-500 text-sm italic p-4">
                                No clusters detected yet. As you mention more people and organizations, I'll identify natural groupings!
                            </p>
                        )}
                    </motion.div>
                )}

                {activeTab === 'opportunities' && (
                    <motion.div
                        key="opportunities"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                    >
                        {data.connectionOpportunities && data.connectionOpportunities.length > 0 ? (
                            data.connectionOpportunities.map((opp, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 rounded-xl bg-green-50 border border-green-100"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 rounded-lg bg-white border border-green-200 text-green-700 text-sm font-medium">
                                                {opp.entityAId}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-green-500" />
                                            <span className="px-2 py-1 rounded-lg bg-white border border-green-200 text-green-700 text-sm font-medium">
                                                {opp.entityBId}
                                            </span>
                                        </div>
                                        <span className="text-xs text-sand-500">
                                            {Math.round(opp.confidence * 100)}% match
                                        </span>
                                    </div>
                                    <p className="text-sm text-sand-800">{opp.reasoning}</p>
                                    {opp.commonConnections.length > 0 && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-sand-500">
                                            <Link2 className="w-3 h-3" />
                                            <span>Common: {opp.commonConnections.join(', ')}</span>
                                        </div>
                                    )}
                                    <p className="mt-2 text-xs text-green-600 font-medium">
                                        Suggested: {opp.suggestedRelationship}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sand-500 text-sm italic p-4">
                                No connection opportunities found yet. Build a richer network to discover potential connections!
                            </p>
                        )}
                    </motion.div>
                )}

                {activeTab === 'decaying' && (
                    <motion.div
                        key="decaying"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                    >
                        {data.decayingRelationships && data.decayingRelationships.length > 0 ? (
                            data.decayingRelationships.map((rel, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 rounded-xl bg-red-50 border border-red-100"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-red-500" />
                                            <span className="font-medium text-sand-800">
                                                {rel.sourceEntityId} → {rel.targetEntityId}
                                            </span>
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                            {rel.daysInactive} days inactive
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-sand-500">Strength:</span>
                                        <div className="flex-1 h-2 bg-red-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-red-400 rounded-full"
                                                style={{ width: `${rel.strength * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-red-600">
                                            {Math.round(rel.strength * 100)}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-sand-500 mt-2">
                                        Consider reaching out to maintain this connection.
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-center">
                                <Zap className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                <p className="text-green-700 font-medium">All relationships healthy!</p>
                                <p className="text-sm text-sand-500">No relationships need immediate attention.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default NRMInsights;
