/**
 * 🔗 ENTITY PATH FINDING API
 * 
 * Finds reasoning paths between two entities (multi-hop relationships)
 */

import { NextRequest, NextResponse } from 'next/server';
import NeuralRelationalMemory from '@/lib/cognitive/neural-relational-memory';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productUserId = searchParams.get('productUserId');
        const productId = searchParams.get('productId');
        const sourceEntityId = searchParams.get('sourceEntityId');
        const targetEntityId = searchParams.get('targetEntityId');
        const maxHops = parseInt(searchParams.get('maxHops') || '4');

        if (!productUserId || !productId || !sourceEntityId || !targetEntityId) {
            return NextResponse.json(
                { error: 'productUserId, productId, sourceEntityId, and targetEntityId required' },
                { status: 400 }
            );
        }

        const nrm = new NeuralRelationalMemory(productUserId, productId);
        const path = await nrm.findPathBetweenEntities(sourceEntityId, targetEntityId, maxHops);

        if (!path) {
            return NextResponse.json({
                found: false,
                message: `No path found between entities within ${maxHops} hops`,
            });
        }

        return NextResponse.json({
            found: true,
            path: path.path,
            hopCount: path.hopCount,
            pathStrength: path.pathStrength,
            pathSummary: path.pathSummary,
        });
    } catch (error: any) {
        console.error('[NRM Path API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}
