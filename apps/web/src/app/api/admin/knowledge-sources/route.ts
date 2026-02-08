import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: List knowledge sources for a product
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json(
                { error: 'productId is required' },
                { status: 400 }
            );
        }

        // Get sources with stats from the view
        const { data: sources, error } = await supabase
            .from('knowledge_source_stats')
            .select('*')
            .eq('product_id', productId)
            .order('priority', { ascending: false });

        if (error) {
            // Fallback to base table if view doesn't exist yet
            const { data: fallbackSources, error: fallbackError } = await supabase
                .from('knowledge_sources')
                .select('*')
                .eq('product_id', productId)
                .order('priority', { ascending: false });

            if (fallbackError) throw fallbackError;
            return NextResponse.json({ sources: fallbackSources || [] });
        }

        return NextResponse.json({ sources: sources || [] });

    } catch (error: any) {
        console.error('Error fetching knowledge sources:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch sources' },
            { status: 500 }
        );
    }
}

// POST: Add a new knowledge source
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            productId,
            sourceType,
            name,
            description,
            iconEmoji,
            trustLevel,
            priority,
            config,
        } = body;

        if (!productId || !sourceType || !name) {
            return NextResponse.json(
                { error: 'productId, sourceType, and name are required' },
                { status: 400 }
            );
        }

        // Validate source type
        if (!['internal_documents', 'external_api', 'trusted_web'].includes(sourceType)) {
            return NextResponse.json(
                { error: 'Invalid sourceType' },
                { status: 400 }
            );
        }

        // Encrypt API key if present (simple base64 for now, should use proper encryption)
        let processedConfig = { ...config };
        if (config?.api_key) {
            processedConfig.api_key_encrypted = Buffer.from(config.api_key).toString('base64');
            delete processedConfig.api_key;
        }

        const { data: source, error } = await supabase
            .from('knowledge_sources')
            .insert({
                product_id: productId,
                source_type: sourceType,
                name,
                description,
                icon_emoji: iconEmoji || '📚',
                trust_level: trustLevel || 80,
                priority: priority || 0,
                config: processedConfig,
                is_active: true,
            })
            .select()
            .single();

        if (error) throw error;

        // If this is a trusted_web source, also add to trusted_web_sources for OKSE crawler
        if (sourceType === 'trusted_web' && config?.allowed_domains) {
            const domains = config.allowed_domains as string[];
            if (domains.length > 0) {
                // Insert each domain into trusted_web_sources
                for (const domain of domains) {
                    await supabase.from('trusted_web_sources').insert({
                        product_id: productId,
                        domain: domain,
                        display_name: name,
                        authority_score: Math.round((trustLevel || 80) / 10),
                        source_type: 'professional',
                        crawl_frequency: 'daily',
                        url_patterns: ['/*'],
                        css_selectors: { content: 'main, article, .content', exclude: ['nav', 'footer', '.sidebar'] },
                        rate_limit_ms: 1000,
                        is_active: true,
                        knowledge_source_id: source.id, // Link back to knowledge_sources
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            source,
        });

    } catch (error: any) {
        console.error('Error adding knowledge source:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to add source' },
            { status: 500 }
        );
    }
}

// PATCH: Update a knowledge source (toggle active, update config)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { sourceId, isActive, trustLevel, config, name, description } = body;

        if (!sourceId) {
            return NextResponse.json(
                { error: 'sourceId is required' },
                { status: 400 }
            );
        }

        const updates: Record<string, any> = { updated_at: new Date().toISOString() };

        if (typeof isActive === 'boolean') updates.is_active = isActive;
        if (typeof trustLevel === 'number') updates.trust_level = trustLevel;
        if (name) updates.name = name;
        if (description) updates.description = description;

        if (config) {
            // Handle API key encryption
            let processedConfig = { ...config };
            if (config.api_key) {
                processedConfig.api_key_encrypted = Buffer.from(config.api_key).toString('base64');
                delete processedConfig.api_key;
            }
            updates.config = processedConfig;
        }

        const { data: source, error } = await supabase
            .from('knowledge_sources')
            .update(updates)
            .eq('id', sourceId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            source,
        });

    } catch (error: any) {
        console.error('Error updating knowledge source:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update source' },
            { status: 500 }
        );
    }
}

// DELETE: Remove a knowledge source
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { sourceId } = body;

        if (!sourceId) {
            return NextResponse.json(
                { error: 'sourceId is required' },
                { status: 400 }
            );
        }

        // Prevent deleting internal_documents source
        const { data: source } = await supabase
            .from('knowledge_sources')
            .select('source_type')
            .eq('id', sourceId)
            .single();

        if (source?.source_type === 'internal_documents') {
            return NextResponse.json(
                { error: 'Cannot delete the Internal Documents source' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('knowledge_sources')
            .delete()
            .eq('id', sourceId);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error deleting knowledge source:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete source' },
            { status: 500 }
        );
    }
}
