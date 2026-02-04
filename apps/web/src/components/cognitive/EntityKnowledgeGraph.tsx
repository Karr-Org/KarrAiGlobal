'use client';

/**
 * 🧠 KARR AI - Entity Knowledge Graph Visualization
 * 
 * A stunning, interactive visualization of the user's entity network.
 * Shows people, companies, places, and concepts as an interconnected graph.
 * 
 * Features:
 * - Interactive pan/zoom
 * - Node hover details
 * - Click to focus
 * - Color-coded by entity type
 * - Size by importance
 * - Animated links
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => (
        <div className="graph-loading">
            <div className="loading-spinner"></div>
            <p>Loading your knowledge graph...</p>
        </div>
    )
});

// Types
interface GraphNode {
    id: string;
    name: string;
    type: string;
    subtype?: string;
    description?: string;
    importance: number;
    mentions: number;
    color: string;
    size: number;
    facts?: string[];
    x?: number;
    y?: number;
}

interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    type: string;
    category: string;
    strength: number;
    label?: string;
    color: string;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
    stats: {
        totalNodes: number;
        totalLinks: number;
        nodesByType: Record<string, number>;
        linksByCategory: Record<string, number>;
    };
}

interface EntityKnowledgeGraphProps {
    productUserId: string;
    className?: string;
    height?: number;
    onNodeClick?: (node: GraphNode) => void;
}

// Entity type icons (using emoji for simplicity)
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

export default function EntityKnowledgeGraph({
    productUserId,
    className = '',
    height = 500,
    onNodeClick,
}: EntityKnowledgeGraphProps) {
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
    const graphRef = useRef<any>();

    // Fetch graph data
    useEffect(() => {
        async function fetchGraph() {
            try {
                setLoading(true);
                const response = await fetch(
                    `/api/cognitive/graph?productUserId=${productUserId}&limit=100`
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch graph');
                }

                setGraphData(data.graph);
            } catch (err: any) {
                console.error('Error fetching graph:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (productUserId) {
            fetchGraph();
        }
    }, [productUserId]);

    // Handle node click
    const handleNodeClick = useCallback((node: any) => {
        const graphNode = node as GraphNode;
        setSelectedNode(graphNode);
        onNodeClick?.(graphNode);

        // Center on node
        if (graphRef.current) {
            graphRef.current.centerAt(node.x, node.y, 500);
            graphRef.current.zoom(2.5, 500);
        }
    }, [onNodeClick]);

    // Handle node hover
    const handleNodeHover = useCallback((node: any) => {
        setHoverNode(node as GraphNode | null);
        document.body.style.cursor = node ? 'pointer' : 'default';
    }, []);

    // Custom node rendering
    const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.name;
        const fontSize = Math.max(12 / globalScale, 4);
        ctx.font = `${fontSize}px Inter, sans-serif`;

        // Draw node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Add glow effect for important nodes
        if (node.importance > 0.7) {
            ctx.shadowColor = node.color;
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Draw border if selected or hovered
        if (selectedNode?.id === node.id || hoverNode?.id === node.id) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3 / globalScale;
            ctx.stroke();
        }

        // Draw label
        if (globalScale > 0.5) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#E0DDD5';
            ctx.fillText(label, node.x, node.y + node.size + 2);
        }
    }, [selectedNode, hoverNode]);

    // Custom link rendering
    const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
        const start = link.source;
        const end = link.target;

        if (!start.x || !end.x) return;

        // Draw link
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = link.color;
        ctx.lineWidth = Math.max(0.5, link.strength * 3);
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }, []);

    // Empty state
    if (!loading && graphData && graphData.nodes.length === 0) {
        return (
            <div className={`entity-graph-container empty ${className}`}>
                <div className="empty-state">
                    <div className="empty-icon">🧠</div>
                    <h3>Your Knowledge Graph is Empty</h3>
                    <p>Start chatting with Karr AI to build your personal knowledge network!</p>
                    <p className="hint">Mention people, companies, places, and projects in your conversations.</p>
                </div>
                <style jsx>{`
                    .entity-graph-container.empty {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: ${height}px;
                        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                        border-radius: 16px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    .empty-state {
                        text-align: center;
                        padding: 40px;
                    }
                    .empty-icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                    }
                    .empty-state h3 {
                        color: #F5F0E8;
                        font-size: 20px;
                        margin-bottom: 10px;
                    }
                    .empty-state p {
                        color: #A09A8C;
                        margin-bottom: 8px;
                    }
                    .empty-state .hint {
                        font-size: 14px;
                        color: #756F5F;
                    }
                `}</style>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className={`entity-graph-container loading ${className}`}>
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <p>Loading your knowledge graph...</p>
                </div>
                <style jsx>{`
                    .entity-graph-container.loading {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: ${height}px;
                        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                        border-radius: 16px;
                    }
                    .loading-content {
                        text-align: center;
                    }
                    .loading-spinner {
                        width: 40px;
                        height: 40px;
                        border: 3px solid rgba(255,255,255,0.1);
                        border-top-color: #C17F59;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 15px;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                    .loading-content p {
                        color: #A09A8C;
                    }
                `}</style>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`entity-graph-container error ${className}`}>
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <p>{error}</p>
                </div>
                <style jsx>{`
                    .entity-graph-container.error {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: ${height}px;
                        background: #2d2d2d;
                        border-radius: 16px;
                    }
                    .error-state {
                        text-align: center;
                        color: #FF6B6B;
                    }
                    .error-icon {
                        font-size: 40px;
                        margin-bottom: 10px;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className={`entity-graph-container ${className}`}>
            {/* Graph Header */}
            <div className="graph-header">
                <div className="graph-title">
                    <span className="icon">🧠</span>
                    <h3>Your Knowledge Graph</h3>
                </div>
                <div className="graph-stats">
                    <span className="stat">
                        <strong>{graphData?.stats.totalNodes || 0}</strong> entities
                    </span>
                    <span className="stat">
                        <strong>{graphData?.stats.totalLinks || 0}</strong> connections
                    </span>
                </div>
            </div>

            {/* Legend */}
            <div className="graph-legend">
                {Object.entries(graphData?.stats.nodesByType || {}).map(([type, count]) => (
                    <div key={type} className="legend-item">
                        <span className="legend-icon">{TYPE_ICONS[type.toLowerCase()] || TYPE_ICONS[type] || '•'}</span>
                        <span className="legend-label">{type}</span>
                        <span className="legend-count">{count}</span>
                    </div>
                ))}
            </div>

            {/* Graph Canvas */}
            <div className="graph-canvas">
                {graphData && (
                    <ForceGraph2D
                        ref={graphRef}
                        graphData={graphData}
                        nodeCanvasObject={nodeCanvasObject}
                        linkCanvasObject={linkCanvasObject}
                        nodeRelSize={1}
                        linkDirectionalParticles={2}
                        linkDirectionalParticleSpeed={0.005}
                        linkDirectionalParticleWidth={2}
                        onNodeClick={handleNodeClick}
                        onNodeHover={handleNodeHover}
                        backgroundColor="#1a1a1a"
                        width={undefined}
                        height={height - 120}
                        cooldownTicks={100}
                        d3AlphaDecay={0.02}
                        d3VelocityDecay={0.3}
                    />
                )}
            </div>

            {/* Node Details Panel */}
            {(selectedNode || hoverNode) && (
                <div className="node-details">
                    <div
                        className="node-details-header"
                        style={{ borderLeftColor: (selectedNode || hoverNode)?.color }}
                    >
                        <span className="node-icon">{TYPE_ICONS[(selectedNode || hoverNode)?.type || ''] || '•'}</span>
                        <div className="node-info">
                            <h4>{(selectedNode || hoverNode)?.name}</h4>
                            <span className="node-type">
                                {(selectedNode || hoverNode)?.type}
                                {(selectedNode || hoverNode)?.subtype && ` • ${(selectedNode || hoverNode)?.subtype}`}
                            </span>
                        </div>
                    </div>
                    {(selectedNode || hoverNode)?.description && (
                        <p className="node-description">{(selectedNode || hoverNode)?.description}</p>
                    )}
                    <div className="node-meta">
                        <span>Importance: {Math.round(((selectedNode || hoverNode)?.importance || 0) * 100)}%</span>
                        <span>Mentions: {(selectedNode || hoverNode)?.mentions || 0}</span>
                    </div>
                    {(selectedNode || hoverNode)?.facts && (selectedNode || hoverNode)!.facts!.length > 0 && (
                        <div className="node-facts">
                            <strong>Key Facts:</strong>
                            <ul>
                                {(selectedNode || hoverNode)?.facts?.slice(0, 3).map((fact, i) => (
                                    <li key={i}>{fact}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .entity-graph-container {
                    position: relative;
                    background: linear-gradient(135deg, #1a1a1a 0%, #252525 100%);
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    overflow: hidden;
                }

                .graph-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    background: rgba(0, 0, 0, 0.2);
                }

                .graph-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .graph-title .icon {
                    font-size: 20px;
                }

                .graph-title h3 {
                    margin: 0;
                    color: #F5F0E8;
                    font-size: 16px;
                    font-weight: 600;
                }

                .graph-stats {
                    display: flex;
                    gap: 20px;
                }

                .graph-stats .stat {
                    color: #A09A8C;
                    font-size: 14px;
                }

                .graph-stats .stat strong {
                    color: #C17F59;
                    margin-right: 4px;
                }

                .graph-legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    padding: 12px 20px;
                    background: rgba(0, 0, 0, 0.15);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    font-size: 12px;
                }

                .legend-icon {
                    font-size: 14px;
                }

                .legend-label {
                    color: #E0DDD5;
                    text-transform: capitalize;
                }

                .legend-count {
                    color: #756F5F;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 11px;
                }

                .graph-canvas {
                    position: relative;
                }

                .node-details {
                    position: absolute;
                    bottom: 20px;
                    left: 20px;
                    max-width: 300px;
                    background: rgba(30, 30, 30, 0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 16px;
                    z-index: 10;
                    animation: slideIn 0.2s ease-out;
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .node-details-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding-left: 12px;
                    border-left: 3px solid;
                    margin-bottom: 12px;
                }

                .node-icon {
                    font-size: 24px;
                }

                .node-info h4 {
                    margin: 0;
                    color: #F5F0E8;
                    font-size: 16px;
                    font-weight: 600;
                }

                .node-type {
                    color: #A09A8C;
                    font-size: 12px;
                    text-transform: capitalize;
                }

                .node-description {
                    color: #C8C3B8;
                    font-size: 13px;
                    line-height: 1.5;
                    margin: 0 0 12px;
                }

                .node-meta {
                    display: flex;
                    gap: 16px;
                    font-size: 12px;
                    color: #756F5F;
                    margin-bottom: 12px;
                }

                .node-facts {
                    font-size: 12px;
                }

                .node-facts strong {
                    color: #A09A8C;
                }

                .node-facts ul {
                    margin: 8px 0 0;
                    padding-left: 16px;
                    color: #C8C3B8;
                }

                .node-facts li {
                    margin-bottom: 4px;
                    line-height: 1.4;
                }
            `}</style>
        </div>
    );
}
