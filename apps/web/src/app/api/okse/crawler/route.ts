/**
 * OKSE Crawler API - Test and manage web crawling
 * 
 * Endpoints:
 * - POST /api/okse/crawler - Trigger crawl for a source
 * - GET /api/okse/crawler - Get crawl status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { webCrawler } from '@/lib/okse';

// POST - Trigger a crawl for a specific source or all due sources
export async function POST(request: NextRequest) {
    try {
        // NOTE: In production, add proper admin role check

        const body = await request.json();
        const { source_id, crawl_all } = body;

        if (crawl_all) {
            // Crawl all sources that are due
            console.log('[OKSE API] Triggering crawl for all due sources');
            const results = await webCrawler.crawlAllDue();

            return NextResponse.json({
                success: true,
                message: `Crawled ${results.length} sources`,
                results: results.map(r => ({
                    domain: r.domain,
                    status: r.status,
                    pages_crawled: r.pages_crawled,
                    pages_updated: r.pages_updated,
                    errors_count: r.errors.length,
                })),
            });
        }

        if (!source_id) {
            return NextResponse.json({ error: 'source_id is required' }, { status: 400 });
        }

        console.log('[OKSE API] Triggering crawl for source:', source_id);
        const result = await webCrawler.crawlSource(source_id);

        return NextResponse.json({
            success: result.status === 'completed',
            result: {
                domain: result.domain,
                status: result.status,
                pages_crawled: result.pages_crawled,
                pages_updated: result.pages_updated,
                pages_skipped: result.pages_skipped,
                errors: result.errors,
                started_at: result.started_at,
                completed_at: result.completed_at,
            },
        });

    } catch (error) {
        console.error('[OKSE API] Crawler error:', error);
        return NextResponse.json(
            { error: 'Crawl failed', details: String(error) },
            { status: 500 }
        );
    }
}

// GET - List trusted web sources and their crawl status
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');

        if (!productId) {
            return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
        }

        // Get all trusted sources for the product
        const { data: sources, error } = await supabase
            .from('trusted_web_sources')
            .select('*')
            .eq('product_id', productId)
            .order('authority_score', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get cache stats
        const { data: cacheStats } = await supabase
            .from('web_knowledge_chunks')
            .select('source_domain')
            .eq('product_id', productId);

        const chunksByDomain = (cacheStats || []).reduce((acc: Record<string, number>, chunk) => {
            acc[chunk.source_domain] = (acc[chunk.source_domain] || 0) + 1;
            return acc;
        }, {});

        const sourcesWithStats = (sources || []).map(source => ({
            ...source,
            cached_chunks: chunksByDomain[source.domain] || 0,
            is_due_for_crawl: isDueForCrawl(source),
        }));

        return NextResponse.json({
            success: true,
            sources: sourcesWithStats,
            total: sourcesWithStats.length,
        });

    } catch (error) {
        console.error('[OKSE API] Get sources error:', error);
        return NextResponse.json(
            { error: 'Failed to get sources', details: String(error) },
            { status: 500 }
        );
    }
}

// Helper: Check if a source is due for crawling
function isDueForCrawl(source: {
    last_crawled_at: string | null;
    crawl_frequency: string;
}): boolean {
    if (!source.last_crawled_at) return true;

    const lastCrawled = new Date(source.last_crawled_at);
    const now = new Date();
    const hoursSince = (now.getTime() - lastCrawled.getTime()) / (1000 * 60 * 60);

    switch (source.crawl_frequency) {
        case 'realtime': return true;
        case '15min': return hoursSince >= 0.25;
        case 'hourly': return hoursSince >= 1;
        case 'daily': return hoursSince >= 24;
        case 'weekly': return hoursSince >= 168;
        default: return hoursSince >= 24;
    }
}
