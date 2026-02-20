import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { webCrawler } from '@/lib/okse';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// HELPERS
// ============================================================================

async function verifyProductOwner(productId: string): Promise<string | null> {
    const authClient = await createServerSupabase();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return null;

    const { data: product } = await supabase
        .from('products')
        .select('created_by')
        .eq('id', productId)
        .single();

    if (!product || product.created_by !== user.id) return null;
    return user.id;
}

/**
 * Extract a clean domain from a URL string.
 * Handles inputs like "cleartax.in", "https://cleartax.in/gst", "www.cleartax.in"
 */
function extractDomain(urlInput: string): string | null {
    if (!urlInput || !urlInput.trim()) return null;

    let cleaned = urlInput.trim();

    // Ensure it has a protocol for URL parsing
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
        cleaned = `https://${cleaned}`;
    }

    try {
        const url = new URL(cleaned);
        // Strip www. prefix for cleaner domain storage
        return url.hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}

/**
 * After persona save, sync website_url → trusted_web_sources and trigger crawl.
 * - New URL: upsert trusted source + crawl
 * - Changed URL: deactivate old domain, activate/create new one + crawl
 * - Cleared URL: deactivate old trusted source
 */
async function syncWebsiteSource(
    productId: string,
    websiteUrl: string | null | undefined,
    ownerId: string
): Promise<{ sourceId?: string; crawlTriggered: boolean }> {
    const newDomain = extractDomain(websiteUrl || '');

    // Get existing active trusted source for this product
    const { data: existingSources } = await supabase
        .from('trusted_web_sources')
        .select('id, domain')
        .eq('product_id', productId)
        .eq('is_active', true);

    const existingSource = existingSources?.[0];
    const existingDomain = existingSource?.domain;

    // Case 1: URL cleared — deactivate existing source
    if (!newDomain) {
        if (existingSource) {
            await supabase
                .from('trusted_web_sources')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('id', existingSource.id);
            console.log(`[Persona API] Deactivated trusted source for ${existingDomain}`);
        }
        return { crawlTriggered: false };
    }

    // Case 2: Same domain — no change needed (user can manually recrawl)
    if (existingDomain === newDomain) {
        return { sourceId: existingSource!.id, crawlTriggered: false };
    }

    // Case 3: Domain changed — deactivate old, create/activate new
    if (existingSource && existingDomain !== newDomain) {
        await supabase
            .from('trusted_web_sources')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', existingSource.id);
        console.log(`[Persona API] Deactivated old domain: ${existingDomain}`);
    }

    // Upsert the new trusted source
    const { data: source, error: sourceError } = await supabase
        .from('trusted_web_sources')
        .upsert({
            product_id: productId,
            domain: newDomain,
            display_name: newDomain,
            authority_score: 8,
            source_type: 'professional',
            crawl_frequency: 'daily',
            url_patterns: ['/*'],
            css_selectors: { content: 'main, article, .content', exclude: ['nav', 'footer', '.sidebar'] },
            rate_limit_ms: 1000,
            is_active: true,
            created_by: ownerId,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'product_id, domain',
        })
        .select('id')
        .single();

    if (sourceError || !source) {
        console.error('[Persona API] Failed to upsert trusted source:', sourceError);
        return { crawlTriggered: false };
    }

    console.log(`[Persona API] Upserted trusted source ${source.id} for domain: ${newDomain}`);

    // Update persona crawl status to "crawling"
    await supabase
        .from('agent_persona')
        .update({
            website_crawl_status: 'crawling',
            updated_at: new Date().toISOString(),
        })
        .eq('product_id', productId);

    // Fire-and-forget: trigger crawl in background
    triggerCrawlInBackground(source.id, productId);

    return { sourceId: source.id, crawlTriggered: true };
}

/**
 * Trigger crawl in background — don't await, let it run async.
 * Updates persona status when done.
 */
function triggerCrawlInBackground(sourceId: string, productId: string): void {
    webCrawler.crawlSource(sourceId)
        .then(async (result) => {
            // Update persona with crawl results
            const status = result.status === 'completed' ? 'completed' : 'error';
            await supabase
                .from('agent_persona')
                .update({
                    website_crawl_status: status,
                    website_pages_indexed: result.pages_crawled,
                    website_last_crawled_at: result.completed_at,
                    updated_at: new Date().toISOString(),
                })
                .eq('product_id', productId);

            console.log(`[Persona API] Crawl ${status} for product ${productId}: ${result.pages_crawled} pages`);
        })
        .catch(async (error) => {
            console.error('[Persona API] Background crawl failed:', error);
            await supabase
                .from('agent_persona')
                .update({
                    website_crawl_status: 'error',
                    updated_at: new Date().toISOString(),
                })
                .eq('product_id', productId);
        });
}

// ============================================================================
// ROUTES
// ============================================================================

// GET /api/products/[id]/persona — Fetch persona for a product
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: productId } = await params;

    const ownerId = await verifyProductOwner(productId);
    if (!ownerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('agent_persona')
        .select('*')
        .eq('product_id', productId)
        .single();

    if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ persona: data || null });
}

// PUT /api/products/[id]/persona — Create or update persona
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: productId } = await params;

    const ownerId = await verifyProductOwner(productId);
    if (!ownerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Strip fields that shouldn't be updated directly
    const {
        id: _id,
        product_id: _pid,
        created_at: _ca,
        updated_at: _ua,
        website_crawl_status: _wcs,
        website_pages_indexed: _wpi,
        website_last_crawled_at: _wlca,
        ...personaFields
    } = body;

    // Get existing persona to detect website_url changes
    const { data: existing } = await supabase
        .from('agent_persona')
        .select('id, website_url')
        .eq('product_id', productId)
        .single();

    let result;
    if (existing) {
        result = await supabase
            .from('agent_persona')
            .update({ ...personaFields, updated_at: new Date().toISOString() })
            .eq('product_id', productId)
            .select()
            .single();
    } else {
        result = await supabase
            .from('agent_persona')
            .insert({ ...personaFields, product_id: productId })
            .select()
            .single();
    }

    if (result.error) {
        console.error('[Persona API] Error:', result.error);
        return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    // Sync website_url → trusted_web_sources (only if URL changed)
    const oldUrl = existing?.website_url || '';
    const newUrl = personaFields.website_url || '';

    if (oldUrl !== newUrl) {
        const syncResult = await syncWebsiteSource(productId, newUrl, ownerId);
        if (syncResult.crawlTriggered) {
            // Re-fetch persona to include updated crawl status
            const { data: updated } = await supabase
                .from('agent_persona')
                .select('*')
                .eq('product_id', productId)
                .single();

            if (updated) {
                return NextResponse.json({ persona: updated, crawl_triggered: true });
            }
        }
    }

    return NextResponse.json({ persona: result.data });
}

// POST /api/products/[id]/persona — Actions (recrawl)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: productId } = await params;

    const ownerId = await verifyProductOwner(productId);
    if (!ownerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (body.action === 'recrawl') {
        // Find the active trusted source for this product
        const { data: sources } = await supabase
            .from('trusted_web_sources')
            .select('id, domain')
            .eq('product_id', productId)
            .eq('is_active', true);

        const source = sources?.[0];
        if (!source) {
            return NextResponse.json(
                { error: 'No website configured. Add a website URL first.' },
                { status: 400 }
            );
        }

        // Update persona crawl status
        await supabase
            .from('agent_persona')
            .update({
                website_crawl_status: 'crawling',
                updated_at: new Date().toISOString(),
            })
            .eq('product_id', productId);

        // Trigger crawl in background
        triggerCrawlInBackground(source.id, productId);

        return NextResponse.json({
            success: true,
            message: `Recrawl triggered for ${source.domain}`,
            crawl_triggered: true,
        });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
