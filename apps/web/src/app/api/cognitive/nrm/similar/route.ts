/**
 * 🔍 SIMILAR ENTITIES API
 * 
 * Finds semantically similar entities using embeddings
 */

import { NextRequest, NextResponse } from 'next/server';
import NeuralRelationalMemory from '@/lib/cognitive/neural-relational-memory';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productUserId = searchParams.get('productUserId');
        const productId = searchParams.get('productId');
        const entityId = searchParams.get('entityId');
        const limit = parseInt(searchParams.get('limit') || '5');

        if (!productUserId || !productId || !entityId) {
            return NextResponse.json(
                { error: 'productUserId, productId, and entityId required' },
                { status: 400 }
            );
        }

        const nrm = new NeuralRelationalMemory(productUserId, productId);
        const similarEntities = await nrm.findSimilarEntities(entityId, limit);

        return NextResponse.json({
            entityId,
            similarEntities: similarEntities.map(e => ({
                id: e.id,
                name: e.name,
                type: e.type,
                keyFacts: e.keyFacts?.slice(0, 2),
            })),
            count: similarEntities.length,
        });
    } catch (error: any) {
        console.error('[NRM Similar API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}
