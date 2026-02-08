/**
 * OKSE Query API - Main endpoint for OKSE-powered queries
 * 
 * This is the primary entry point for using OKSE to answer questions
 * with fused KB + Web knowledge and speculative drafting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { okseEngine } from '@/lib/okse';

// POST - Process a query through the OKSE pipeline
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const body = await request.json();
        const {
            query,
            product_id,
            knowledge_base_id,
            user_id,
            force_complexity,
            skip_cache,
            enable_live_web,
        } = body;

        // Validate required fields
        if (!query || !product_id || !knowledge_base_id) {
            return NextResponse.json(
                { error: 'query, product_id, and knowledge_base_id are required' },
                { status: 400 }
            );
        }

        console.log('[OKSE API] Processing query:', query.substring(0, 50) + '...');

        // Process through OKSE engine
        const result = await okseEngine.process(
            query,
            product_id,
            knowledge_base_id,
            {
                userId: user_id,
                forceComplexity: force_complexity,
                skipCache: skip_cache === true,
                enableLiveWeb: enable_live_web === true,
            }
        );

        return NextResponse.json({
            success: true,
            answer: result.answer,
            citations: result.citations,
            metadata: result.metadata,
        });

    } catch (error) {
        console.error('[OKSE API] Query error:', error);
        return NextResponse.json(
            { error: 'Query processing failed', details: String(error) },
            { status: 500 }
        );
    }
}

// GET - Get OKSE statistics for a product
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');

        if (!productId) {
            return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
        }

        const stats = await okseEngine.getStats(productId);

        return NextResponse.json({
            success: true,
            stats,
        });

    } catch (error) {
        console.error('[OKSE API] Stats error:', error);
        return NextResponse.json(
            { error: 'Failed to get stats', details: String(error) },
            { status: 500 }
        );
    }
}
