// ============================================
// MARKETING ENGINE API ROUTES
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    generateBlogPost,
    generateSocialPost,
    generateContentIdeas,
    generateTwitterThread,
    generateCarouselSlides,
    optimizeForAEO,
    repurposeBlogToSocial
} from '@/lib/marketing/content-generator';
import {
    ProductMarketingProfile,
    ContentIdea,
    BlogPost,
    AISocialPost,
    Platform
} from '@/lib/marketing/types';

// ============================================
// MARKETING PROFILE
// ============================================

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');

        if (!productId) {
            return NextResponse.json({ error: 'product_id required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('product_marketing_profiles')
            .select('*')
            .eq('product_id', productId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return NextResponse.json({ profile: data });
    } catch (error) {
        console.error('Error fetching marketing profile:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { product_id, ...profileData } = body;

        if (!product_id) {
            return NextResponse.json({ error: 'product_id required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('product_marketing_profiles')
            .upsert({
                product_id,
                ...profileData,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'product_id'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ profile: data });
    } catch (error) {
        console.error('Error saving marketing profile:', error);
        return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }
}
