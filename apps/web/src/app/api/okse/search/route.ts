import { NextRequest, NextResponse } from 'next/server';
import { liveWebSearch, formatWebResultsForAI } from '@/lib/okse/live-web-search';

// POST - Perform live web search
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, product_id, fetch_content = true, max_results = 5 } = body;

        if (!query) {
            return NextResponse.json({ error: 'query is required' }, { status: 400 });
        }

        if (!product_id) {
            return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
        }

        console.log(`[OKSE API] Live web search: "${query}" for product ${product_id}`);

        const results = await liveWebSearch(query, product_id, {
            fetchContent: fetch_content,
            maxResults: max_results,
        });

        // Also return formatted context for AI
        const aiContext = formatWebResultsForAI(results.results);

        return NextResponse.json({
            success: true,
            ...results,
            ai_context: aiContext,
        });

    } catch (error) {
        console.error('[OKSE API] Live search error:', error);
        return NextResponse.json(
            { error: 'Search failed', details: String(error) },
            { status: 500 }
        );
    }
}

// GET - Search with query params (for testing)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || searchParams.get('query');
        const productId = searchParams.get('product_id');

        if (!query) {
            return NextResponse.json({ error: 'q or query parameter is required' }, { status: 400 });
        }

        if (!productId) {
            return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
        }

        const results = await liveWebSearch(query, productId, {
            fetchContent: true,
            maxResults: 5,
        });

        return NextResponse.json({
            success: true,
            ...results,
        });

    } catch (error) {
        console.error('[OKSE API] Live search error:', error);
        return NextResponse.json(
            { error: 'Search failed', details: String(error) },
            { status: 500 }
        );
    }
}
