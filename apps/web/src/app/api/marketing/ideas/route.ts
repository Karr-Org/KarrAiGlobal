// ============================================
// CONTENT IDEAS API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateContentIdeas } from '@/lib/marketing/content-generator';

// GET - Fetch content ideas
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');
        const status = searchParams.get('status');
        const contentType = searchParams.get('content_type');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!productId) {
            return NextResponse.json({ error: 'product_id required' }, { status: 400 });
        }

        let query = supabase
            .from('content_ideas')
            .select('*')
            .eq('product_id', productId)
            .order('overall_score', { ascending: false })
            .limit(limit);

        if (status) query = query.eq('status', status);
        if (contentType) query = query.eq('content_type', contentType);

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ ideas: data });
    } catch (error) {
        console.error('Error fetching content ideas:', error);
        return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 });
    }
}

// POST - Create idea or generate AI ideas
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { action, product_id, ...data } = body;

        if (!product_id) {
            return NextResponse.json({ error: 'product_id required' }, { status: 400 });
        }

        // Generate AI ideas
        if (action === 'generate') {
            const count = data.count || 10;

            // Get marketing profile
            const { data: profile } = await supabase
                .from('product_marketing_profiles')
                .select('*')
                .eq('product_id', product_id)
                .single();

            if (!profile) {
                return NextResponse.json({ error: 'Marketing profile not found. Please set up your marketing profile first.' }, { status: 400 });
            }

            // Generate ideas
            const ideas = await generateContentIdeas(profile, count);

            // Save to database
            const { data: savedIdeas, error } = await supabase
                .from('content_ideas')
                .insert(ideas.map(idea => ({
                    ...idea,
                    product_id
                })))
                .select();

            if (error) throw error;

            return NextResponse.json({ ideas: savedIdeas, generated: true });
        }

        // Create single idea manually
        const { data: idea, error } = await supabase
            .from('content_ideas')
            .insert({
                product_id,
                ...data,
                source: 'manual'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ idea });
    } catch (error) {
        console.error('Error creating content idea:', error);
        return NextResponse.json({ error: 'Failed to create idea' }, { status: 500 });
    }
}

// PATCH - Update idea
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('content_ideas')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ idea: data });
    } catch (error) {
        console.error('Error updating content idea:', error);
        return NextResponse.json({ error: 'Failed to update idea' }, { status: 500 });
    }
}

// DELETE - Delete idea
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('content_ideas')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting content idea:', error);
        return NextResponse.json({ error: 'Failed to delete idea' }, { status: 500 });
    }
}
