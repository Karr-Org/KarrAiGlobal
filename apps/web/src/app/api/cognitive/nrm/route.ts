/**
 * 🧠 NEURAL RELATIONAL MEMORY API
 * 
 * Exposes advanced NRM features:
 * - Relationship predictions
 * - Connection opportunities
 * - Entity clusters
 * - Multi-hop reasoning paths
 */

import { NextRequest, NextResponse } from 'next/server';
import NeuralRelationalMemory from '@/lib/cognitive/neural-relational-memory';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productUserId = searchParams.get('productUserId');
        const productId = searchParams.get('productId');
        const feature = searchParams.get('feature'); // predictions, clusters, decaying, opportunities

        if (!productUserId || !productId) {
            return NextResponse.json(
                { error: 'productUserId and productId required' },
                { status: 400 }
            );
        }

        const nrm = new NeuralRelationalMemory(productUserId, productId);

        switch (feature) {
            case 'predictions': {
                // Get AI-generated predictions about entity relationships
                const predictions = await nrm.generatePredictions();
                return NextResponse.json({ predictions });
            }

            case 'decaying': {
                // Find relationships that are becoming inactive
                const decaying = await nrm.findDecayingRelationships();
                return NextResponse.json({ decayingRelationships: decaying });
            }

            case 'opportunities': {
                // Find connection opportunities
                const opportunities = await nrm.findConnectionOpportunities();
                return NextResponse.json({ connectionOpportunities: opportunities });
            }

            case 'clusters': {
                // Generate entity clusters
                const clusters = await nrm.generateClusters();
                return NextResponse.json({ clusters });
            }

            case 'all': {
                // Get all insights at once
                const [predictions, decaying, opportunities, clusters] = await Promise.all([
                    nrm.generatePredictions(),
                    nrm.findDecayingRelationships(),
                    nrm.findConnectionOpportunities(),
                    nrm.generateClusters(),
                ]);

                return NextResponse.json({
                    predictions,
                    decayingRelationships: decaying,
                    connectionOpportunities: opportunities,
                    clusters,
                    summary: {
                        totalPredictions: predictions.length,
                        decayingCount: decaying.length,
                        opportunitiesCount: opportunities.length,
                        clustersCount: clusters.length,
                    }
                });
            }

            default:
                return NextResponse.json(
                    { error: 'Invalid feature. Use: predictions, decaying, opportunities, clusters, or all' },
                    { status: 400 }
                );
        }
    } catch (error: any) {
        console.error('[NRM API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}
