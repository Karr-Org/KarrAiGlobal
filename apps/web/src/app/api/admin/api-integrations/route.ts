import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: List all available API integrations
export async function GET(request: NextRequest) {
    try {
        const { data: integrations, error } = await supabase
            .from('api_integrations')
            .select('*')
            .eq('is_active', true)
            .order('category', { ascending: true });

        if (error) {
            // Table might not exist yet, return default integrations
            const defaultIntegrations = [
                {
                    id: 'indian_kanoon',
                    name: 'Indian Kanoon',
                    description: 'Search Indian court judgments, laws, and legal documents',
                    category: 'legal',
                    icon_emoji: '⚖️',
                    base_url: 'https://api.indiankanoon.org',
                    auth_type: 'api_key',
                    requires_user_key: true,
                    config_schema: {
                        type: 'object',
                        properties: {
                            api_key: { type: 'string', title: 'API Key' },
                            max_results: { type: 'integer', default: 10 }
                        }
                    },
                    default_config: { refresh_strategy: 'stagnant', cache_ttl_seconds: null }
                },
                {
                    id: 'pubmed',
                    name: 'PubMed',
                    description: 'Search biomedical literature from MEDLINE and life science journals',
                    category: 'medical',
                    icon_emoji: '🔬',
                    base_url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
                    auth_type: 'none',
                    requires_user_key: false,
                    config_schema: {
                        type: 'object',
                        properties: {
                            max_results: { type: 'integer', default: 10 }
                        }
                    },
                    default_config: { refresh_strategy: 'dynamic', cache_ttl_seconds: 86400 }
                },
                {
                    id: 'google_scholar',
                    name: 'Google Scholar',
                    description: 'Search scholarly articles, theses, books, and conference papers',
                    category: 'academic',
                    icon_emoji: '🎓',
                    base_url: 'https://serpapi.com/search',
                    auth_type: 'api_key',
                    requires_user_key: true,
                    config_schema: {
                        type: 'object',
                        properties: {
                            api_key: { type: 'string', title: 'SerpAPI Key' },
                            max_results: { type: 'integer', default: 10 }
                        }
                    },
                    default_config: { refresh_strategy: 'dynamic', cache_ttl_seconds: 3600 }
                },
                {
                    id: 'cbic_circulars',
                    name: 'CBIC Circulars',
                    description: 'Latest GST circulars and notifications from CBIC',
                    category: 'tax',
                    icon_emoji: '📋',
                    base_url: 'https://cbic-gst.gov.in/api',
                    auth_type: 'none',
                    requires_user_key: false,
                    config_schema: {
                        type: 'object',
                        properties: {
                            include_archives: { type: 'boolean', default: true }
                        }
                    },
                    default_config: { refresh_strategy: 'dynamic', cache_ttl_seconds: 3600 }
                }
            ];

            return NextResponse.json({ integrations: defaultIntegrations });
        }

        return NextResponse.json({ integrations: integrations || [] });

    } catch (error: any) {
        console.error('Error fetching API integrations:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch integrations' },
            { status: 500 }
        );
    }
}
