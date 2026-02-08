// ============================================
// CONTENT CALENDAR API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch calendar entries
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const entryType = searchParams.get('entry_type');

        if (!productId) {
            return NextResponse.json({ error: 'product_id required' }, { status: 400 });
        }

        let query = supabase
            .from('content_calendar')
            .select(`
                *,
                idea:content_ideas(id, title, content_type),
                blog:blog_posts(id, title, slug, status),
                social_post:ai_social_posts(id, platform, content_type, status)
            `)
            .eq('product_id', productId)
            .order('entry_date', { ascending: true });

        if (startDate) query = query.gte('entry_date', startDate);
        if (endDate) query = query.lte('entry_date', endDate);
        if (entryType) query = query.eq('entry_type', entryType);

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ entries: data });
    } catch (error) {
        console.error('Error fetching calendar:', error);
        return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
    }
}

// POST - Create calendar entry
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { action, product_id, ...data } = body;

        if (!product_id) {
            return NextResponse.json({ error: 'product_id required' }, { status: 400 });
        }

        // Auto-generate calendar from ideas
        if (action === 'auto_schedule') {
            const { days_ahead = 14 } = data;

            // Get approved ideas that aren't scheduled
            const { data: ideas } = await supabase
                .from('content_ideas')
                .select('*')
                .eq('product_id', product_id)
                .eq('status', 'approved')
                .is('scheduled_for', null)
                .order('overall_score', { ascending: false })
                .limit(days_ahead);

            if (!ideas?.length) {
                return NextResponse.json({ message: 'No approved ideas to schedule', entries: [] });
            }

            // Get marketing profile for posting frequency
            const { data: profile } = await supabase
                .from('product_marketing_profiles')
                .select('blog_frequency, twitter_frequency, linkedin_frequency')
                .eq('product_id', product_id)
                .single();

            // Create calendar entries
            const entries = [];
            let currentDate = new Date();

            for (const idea of ideas) {
                currentDate.setDate(currentDate.getDate() + 1);
                const dateStr = currentDate.toISOString().split('T')[0];

                entries.push({
                    product_id,
                    entry_date: dateStr,
                    entry_type: idea.content_type === 'blog' ? 'blog' : 'social',
                    title: idea.title,
                    description: idea.description,
                    idea_id: idea.id,
                    status: 'planned',
                    platforms: idea.content_type === 'blog' ? ['website'] : [idea.content_type.split('_')[0]],
                    tags: idea.target_keywords || []
                });

                // Update idea with scheduled date
                await supabase
                    .from('content_ideas')
                    .update({ scheduled_for: dateStr })
                    .eq('id', idea.id);
            }

            const { data: savedEntries, error } = await supabase
                .from('content_calendar')
                .insert(entries)
                .select();

            if (error) throw error;

            return NextResponse.json({ entries: savedEntries, auto_scheduled: true });
        }

        // Create single entry
        const { data: entry, error } = await supabase
            .from('content_calendar')
            .insert({
                product_id,
                ...data
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ entry });
    } catch (error) {
        console.error('Error creating calendar entry:', error);
        return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
    }
}

// PATCH - Update calendar entry
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('content_calendar')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ entry: data });
    } catch (error) {
        console.error('Error updating calendar entry:', error);
        return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
    }
}

// DELETE - Delete calendar entry
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('content_calendar')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting calendar entry:', error);
        return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }
}
