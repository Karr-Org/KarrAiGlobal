/**
 * OKSE Cache API - Manage semantic cache
 * 
 * Endpoints:
 * - GET /api/okse/cache - Get cache stats
 * - DELETE /api/okse/cache - Clear cache
 * - POST /api/okse/cache/feedback - Record feedback on cached response
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { semanticCache } from '@/lib/okse';

// GET - Get cache statistics
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');

        if (!productId) {
            return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
        }

        const stats = await semanticCache.getStats(productId);

        return NextResponse.json({
            success: true,
            stats,
        });

    } catch (error) {
        console.error('[OKSE API] Cache stats error:', error);
        return NextResponse.json(
            { error: 'Failed to get cache stats', details: String(error) },
            { status: 500 }
        );
    }
}

// DELETE - Clear cache entries
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');
        const cacheId = searchParams.get('id');
        const clearAll = searchParams.get('clear_all') === 'true';

        if (!productId && !cacheId) {
            return NextResponse.json(
                { error: 'product_id or id is required' },
                { status: 400 }
            );
        }

        if (cacheId) {
            // Delete specific cache entry
            const { error } = await supabase
                .from('semantic_cache')
                .delete()
                .eq('id', cacheId);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: 'Cache entry deleted',
            });
        }

        if (clearAll && productId) {
            // Clear all cache for product
            const { error, count } = await supabase
                .from('semantic_cache')
                .delete()
                .eq('product_id', productId);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: `Cleared ${count || 0} cache entries`,
            });
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    } catch (error) {
        console.error('[OKSE API] Clear cache error:', error);
        return NextResponse.json(
            { error: 'Failed to clear cache', details: String(error) },
            { status: 500 }
        );
    }
}

// POST - Record feedback on a cached response
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { cache_id, is_helpful, feedback_text, user_id } = body;

        if (!cache_id) {
            return NextResponse.json({ error: 'cache_id is required' }, { status: 400 });
        }

        await semanticCache.recordFeedback(cache_id, is_helpful === true ? 'positive' : 'negative');

        // Optionally store detailed feedback
        if (feedback_text) {
            const supabase = await createClient();
            await supabase.from('semantic_cache_feedback').insert({
                cache_id,
                user_id,
                is_helpful: is_helpful === true,
                feedback_text,
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Feedback recorded',
        });

    } catch (error) {
        console.error('[OKSE API] Record feedback error:', error);
        return NextResponse.json(
            { error: 'Failed to record feedback', details: String(error) },
            { status: 500 }
        );
    }
}
