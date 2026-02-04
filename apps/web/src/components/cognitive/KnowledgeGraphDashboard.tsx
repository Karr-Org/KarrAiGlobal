'use client';

/**
 * 🧠 KARR AI - Knowledge Graph Dashboard
 * 
 * A full-featured dashboard for exploring the user's entity network.
 * Features entity list, graph visualization, and relationship insights.
 */

import React, { useEffect, useState } from 'react';
import EntityKnowledgeGraph from './EntityKnowledgeGraph';

interface Entity {
    id: string;
    entity_name: string;
    entity_type: string;
    entity_subtype?: string;
    description?: string;
    key_facts?: string[];
    relationship_strength?: number;
    mention_count: number;
    first_mentioned_at: string;
    last_mentioned_at: string;
    relationship_to_user?: string;
}

interface EntityStats {
    total: number;
    byType: Record<string, number>;
}

interface KnowledgeGraphDashboardProps {
    productUserId: string;
    className?: string;
}

// Entity type icons
const TYPE_ICONS: Record<string, string> = {
    person: '👤',
    organization: '🏢',
    company: '🏢',
    place: '📍',
    location: '📍',
    concept: '💡',
    product: '📦',
    service: '🛠️',
    project: '📋',
    document: '📄',
    event: '📅',
    temporal_fact: '⏰',
    technology: '💻',
    tool: '🔧',
    regulation: '⚖️',
    form: '📝',
};

// Entity type colors
const TYPE_COLORS: Record<string, string> = {
    person: '#FF6B6B',
    organization: '#4ECDC4',
    company: '#4ECDC4',
    place: '#45B7D1',
    location: '#45B7D1',
    concept: '#96CEB4',
    product: '#F39C12',
    service: '#E67E22',
    project: '#FFEAA7',
    document: '#DDA0DD',
    event: '#9B59B6',
    temporal_fact: '#8E44AD',
    technology: '#3498DB',
    tool: '#2980B9',
    regulation: '#1ABC9C',
    form: '#16A085',
};

export default function KnowledgeGraphDashboard({
    productUserId,
    className = '',
}: KnowledgeGraphDashboardProps) {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [stats, setStats] = useState<EntityStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
    const [filterType, setFilterType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('importance');
    const [view, setView] = useState<'graph' | 'list'>('graph');

    // Fetch entities
    useEffect(() => {
        async function fetchEntities() {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    productUserId,
                    limit: '100',
                    sortBy,
                });
                if (filterType !== 'all') {
                    params.set('type', filterType);
                }

                const response = await fetch(`/api/cognitive/entities?${params}`);
                const data = await response.json();

                if (response.ok) {
                    setEntities(data.entities);
                    setStats(data.stats);
                }
            } catch (error) {
                console.error('Error fetching entities:', error);
            } finally {
                setLoading(false);
            }
        }

        if (productUserId) {
            fetchEntities();
        }
    }, [productUserId, filterType, sortBy]);

    // Handle node click from graph
    const handleNodeClick = (node: any) => {
        const entity = entities.find(e => e.id === node.id);
        if (entity) {
            setSelectedEntity(entity);
        }
    };

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className={`knowledge-graph-dashboard ${className}`}>
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h2>
                        <span className="icon">🧠</span>
                        Your Knowledge Graph
                    </h2>
                    <p className="subtitle">
                        Visualize everything your AI knows about your world
                    </p>
                </div>
                <div className="header-right">
                    <div className="view-toggle">
                        <button
                            className={view === 'graph' ? 'active' : ''}
                            onClick={() => setView('graph')}
                        >
                            🌐 Graph
                        </button>
                        <button
                            className={view === 'list' ? 'active' : ''}
                            onClick={() => setView('list')}
                        >
                            📋 List
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card total">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Entities</div>
                    </div>
                    {Object.entries(stats.byType).map(([type, count]) => {
                        const typeLower = type.toLowerCase();
                        return (
                            <div
                                key={type}
                                className="stat-card"
                                style={{ borderTopColor: TYPE_COLORS[typeLower] || TYPE_COLORS[type] || '#888' }}
                            >
                                <div className="stat-icon">{TYPE_ICONS[typeLower] || TYPE_ICONS[type] || '•'}</div>
                                <div className="stat-content">
                                    <div className="stat-value">{count}</div>
                                    <div className="stat-label">{type}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Filters */}
            <div className="filters-bar">
                <div className="filter-group">
                    <label>Filter by Type:</label>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        {Object.keys(stats?.byType || {}).map(type => (
                            <option key={type} value={type}>
                                {TYPE_ICONS[type]} {type} ({stats?.byType[type]})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Sort by:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="importance">Importance</option>
                        <option value="recent">Most Recent</option>
                        <option value="mentions">Most Mentioned</option>
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className="dashboard-content">
                {view === 'graph' ? (
                    <EntityKnowledgeGraph
                        productUserId={productUserId}
                        height={500}
                        onNodeClick={handleNodeClick}
                    />
                ) : (
                    <div className="entities-list">
                        {loading ? (
                            <div className="loading-state">Loading entities...</div>
                        ) : entities.length === 0 ? (
                            <div className="empty-state">
                                <p>No entities found. Start chatting to build your knowledge graph!</p>
                            </div>
                        ) : (
                            entities.map(entity => {
                                const typeLower = entity.entity_type.toLowerCase();
                                return (
                                    <div
                                        key={entity.id}
                                        className={`entity-card ${selectedEntity?.id === entity.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedEntity(entity)}
                                        style={{ borderLeftColor: TYPE_COLORS[typeLower] || TYPE_COLORS[entity.entity_type] || '#888' }}
                                    >
                                        <div className="entity-icon">
                                            {TYPE_ICONS[typeLower] || TYPE_ICONS[entity.entity_type] || '•'}
                                        </div>
                                        <div className="entity-content">
                                            <div className="entity-header">
                                                <h4>{entity.entity_name}</h4>
                                                <span className="entity-type">{entity.entity_type}</span>
                                            </div>
                                            {entity.description && (
                                                <p className="entity-description">{entity.description}</p>
                                            )}
                                            <div className="entity-meta">
                                                <span className="importance">
                                                    ⭐ {Math.round((entity.relationship_strength || 0.5) * 100)}%
                                                </span>
                                                <span className="mentions">
                                                    💬 {entity.mention_count} mentions
                                                </span>
                                                <span className="date">
                                                    📅 {formatDate(entity.last_mentioned_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Entity Details Sidebar */}
            {selectedEntity && (
                <div className="entity-sidebar">
                    <div className="sidebar-header">
                        <button className="close-btn" onClick={() => setSelectedEntity(null)}>×</button>
                        <div className="entity-title">
                            <span className="icon">{TYPE_ICONS[selectedEntity.entity_type]}</span>
                            <div>
                                <h3>{selectedEntity.entity_name}</h3>
                                <span className="type-badge" style={{ backgroundColor: TYPE_COLORS[selectedEntity.entity_type] }}>
                                    {selectedEntity.entity_type}
                                    {selectedEntity.entity_subtype && ` • ${selectedEntity.entity_subtype}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-content">
                        {selectedEntity.relationship_to_user && (
                            <div className="detail-section">
                                <h4>Relationship to You</h4>
                                <p className="relationship">{selectedEntity.relationship_to_user}</p>
                            </div>
                        )}

                        {selectedEntity.description && (
                            <div className="detail-section">
                                <h4>Description</h4>
                                <p>{selectedEntity.description}</p>
                            </div>
                        )}

                        {selectedEntity.key_facts && selectedEntity.key_facts.length > 0 && (
                            <div className="detail-section">
                                <h4>Key Facts</h4>
                                <ul className="facts-list">
                                    {selectedEntity.key_facts.map((fact, i) => (
                                        <li key={i}>{fact}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="detail-section">
                            <h4>Activity</h4>
                            <div className="activity-stats">
                                <div className="activity-stat">
                                    <span className="value">{selectedEntity.mention_count}</span>
                                    <span className="label">Total Mentions</span>
                                </div>
                                <div className="activity-stat">
                                    <span className="value">{Math.round((selectedEntity.relationship_strength || 0.5) * 100)}%</span>
                                    <span className="label">Importance</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4>Timeline</h4>
                            <div className="timeline">
                                <div className="timeline-item">
                                    <span className="date">{formatDate(selectedEntity.first_mentioned_at)}</span>
                                    <span className="event">First mentioned</span>
                                </div>
                                <div className="timeline-item">
                                    <span className="date">{formatDate(selectedEntity.last_mentioned_at)}</span>
                                    <span className="event">Last mentioned</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .knowledge-graph-dashboard {
                    position: relative;
                    background: var(--bg-secondary, #FAF8F5);
                    border-radius: 20px;
                    padding: 24px;
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                }

                .header-left h2 {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 0;
                    color: var(--text-primary, #2D2A26);
                    font-size: 24px;
                }

                .header-left .icon {
                    font-size: 28px;
                }

                .subtitle {
                    color: var(--text-secondary, #756F5F);
                    margin: 8px 0 0;
                }

                .view-toggle {
                    display: flex;
                    gap: 8px;
                    background: rgba(0,0,0,0.05);
                    padding: 4px;
                    border-radius: 12px;
                }

                .view-toggle button {
                    padding: 8px 16px;
                    border: none;
                    background: transparent;
                    border-radius: 8px;
                    cursor: pointer;
                    color: var(--text-secondary, #756F5F);
                    font-size: 14px;
                    transition: all 0.2s;
                }

                .view-toggle button.active {
                    background: white;
                    color: var(--text-primary, #2D2A26);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .stat-card {
                    background: white;
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border-top: 3px solid #C17F59;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }

                .stat-card.total {
                    grid-column: span 1;
                    text-align: center;
                    flex-direction: column;
                    border-top-color: #C17F59;
                }

                .stat-icon {
                    font-size: 24px;
                }

                .stat-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--text-primary, #2D2A26);
                }

                .stat-label {
                    font-size: 12px;
                    color: var(--text-secondary, #756F5F);
                    text-transform: capitalize;
                }

                .filters-bar {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 20px;
                    padding: 16px;
                    background: white;
                    border-radius: 12px;
                }

                .filter-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .filter-group label {
                    color: var(--text-secondary, #756F5F);
                    font-size: 14px;
                }

                .filter-group select {
                    padding: 8px 12px;
                    border: 1px solid rgba(0,0,0,0.1);
                    border-radius: 8px;
                    background: white;
                    color: var(--text-primary, #2D2A26);
                    font-size: 14px;
                    cursor: pointer;
                }

                .dashboard-content {
                    min-height: 500px;
                }

                .entities-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .entity-card {
                    display: flex;
                    gap: 16px;
                    padding: 16px;
                    background: white;
                    border-radius: 12px;
                    border-left: 4px solid;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .entity-card:hover {
                    transform: translateX(4px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                }

                .entity-card.selected {
                    background: linear-gradient(90deg, rgba(193,127,89,0.1) 0%, white 100%);
                }

                .entity-icon {
                    font-size: 32px;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0,0,0,0.05);
                    border-radius: 12px;
                }

                .entity-content {
                    flex: 1;
                }

                .entity-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 8px;
                }

                .entity-header h4 {
                    margin: 0;
                    color: var(--text-primary, #2D2A26);
                    font-size: 16px;
                }

                .entity-type {
                    padding: 4px 8px;
                    background: rgba(0,0,0,0.05);
                    border-radius: 6px;
                    font-size: 12px;
                    color: var(--text-secondary, #756F5F);
                    text-transform: capitalize;
                }

                .entity-description {
                    margin: 0 0 8px;
                    color: var(--text-secondary, #756F5F);
                    font-size: 14px;
                    line-height: 1.5;
                }

                .entity-meta {
                    display: flex;
                    gap: 16px;
                    font-size: 12px;
                    color: var(--text-tertiary, #A09A8C);
                }

                /* Entity Sidebar */
                .entity-sidebar {
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: 380px;
                    height: 100vh;
                    background: white;
                    box-shadow: -4px 0 24px rgba(0,0,0,0.15);
                    z-index: 1000;
                    overflow-y: auto;
                    animation: slideInRight 0.3s ease-out;
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }

                .sidebar-header {
                    padding: 24px;
                    border-bottom: 1px solid rgba(0,0,0,0.08);
                    position: relative;
                }

                .close-btn {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: rgba(0,0,0,0.05);
                    border-radius: 8px;
                    font-size: 20px;
                    cursor: pointer;
                    color: var(--text-secondary, #756F5F);
                    transition: all 0.2s;
                }

                .close-btn:hover {
                    background: rgba(0,0,0,0.1);
                }

                .entity-title {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                }

                .entity-title .icon {
                    font-size: 40px;
                }

                .entity-title h3 {
                    margin: 0 0 8px;
                    color: var(--text-primary, #2D2A26);
                    font-size: 20px;
                }

                .type-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 12px;
                    color: white;
                    text-transform: capitalize;
                }

                .sidebar-content {
                    padding: 24px;
                }

                .detail-section {
                    margin-bottom: 24px;
                }

                .detail-section h4 {
                    margin: 0 0 12px;
                    color: var(--text-secondary, #756F5F);
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .detail-section p {
                    margin: 0;
                    color: var(--text-primary, #2D2A26);
                    line-height: 1.6;
                }

                .relationship {
                    padding: 12px 16px;
                    background: linear-gradient(135deg, rgba(193,127,89,0.1) 0%, rgba(193,127,89,0.05) 100%);
                    border-radius: 8px;
                    border-left: 3px solid #C17F59;
                }

                .facts-list {
                    margin: 0;
                    padding-left: 20px;
                    color: var(--text-primary, #2D2A26);
                }

                .facts-list li {
                    margin-bottom: 8px;
                    line-height: 1.5;
                }

                .activity-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }

                .activity-stat {
                    text-align: center;
                    padding: 16px;
                    background: rgba(0,0,0,0.03);
                    border-radius: 12px;
                }

                .activity-stat .value {
                    display: block;
                    font-size: 28px;
                    font-weight: 700;
                    color: #C17F59;
                }

                .activity-stat .label {
                    font-size: 12px;
                    color: var(--text-secondary, #756F5F);
                }

                .timeline {
                    border-left: 2px solid rgba(0,0,0,0.1);
                    padding-left: 16px;
                    margin-left: 8px;
                }

                .timeline-item {
                    position: relative;
                    padding-bottom: 16px;
                }

                .timeline-item::before {
                    content: '';
                    position: absolute;
                    left: -22px;
                    top: 4px;
                    width: 12px;
                    height: 12px;
                    background: #C17F59;
                    border-radius: 50%;
                }

                .timeline-item .date {
                    display: block;
                    font-size: 12px;
                    color: var(--text-tertiary, #A09A8C);
                    margin-bottom: 4px;
                }

                .timeline-item .event {
                    color: var(--text-primary, #2D2A26);
                }

                .loading-state,
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: var(--text-secondary, #756F5F);
                }
            `}</style>
        </div>
    );
}
