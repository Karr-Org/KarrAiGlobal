// ============================================
// BLOG POSTS API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateBlogPost, optimizeForAEO, scoreBlogContent } from '@/lib/marketing/content-generator';

// GET - Fetch blog posts
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');
        const status = searchParams.get('status');
        const slug = searchParams.get('slug');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Get single post by slug
        if (slug) {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error) throw error;
            return NextResponse.json({ post: data });
        }

        if (!productId) {
            return NextResponse.json({ error: 'product_id or slug required' }, { status: 400 });
        }

        let query = supabase
            .from('blog_posts')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status) query = query.eq('status', status);

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ posts: data });
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

// POST - Create or generate blog post
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { action, product_id, ...data } = body;

        if (!product_id) {
            return NextResponse.json({ error: 'product_id required' }, { status: 400 });
        }

        // Generate blog post with AI
        if (action === 'generate') {
            const { title, keywords, content_pillar, idea_id, target_word_count } = data;

            if (!title) {
                return NextResponse.json({ error: 'title required for generation' }, { status: 400 });
            }

            // Get marketing profile
            const { data: profile } = await supabase
                .from('product_marketing_profiles')
                .select('*')
                .eq('product_id', product_id)
                .single();

            if (!profile) {
                return NextResponse.json({ error: 'Marketing profile not found' }, { status: 400 });
            }

            // Generate blog content
            const blogData = await generateBlogPost({
                product_id,
                title,
                keywords: keywords || profile.primary_keywords,
                content_pillar,
                target_word_count,
                include_faqs: true,
                include_definitions: true
            }, profile);

            // Save to database
            const { data: savedPost, error } = await supabase
                .from('blog_posts')
                .insert({
                    product_id,
                    idea_id,
                    ...blogData,
                    status: 'draft'
                })
                .select()
                .single();

            if (error) throw error;

            // Update idea status if linked
            if (idea_id) {
                await supabase
                    .from('content_ideas')
                    .update({ status: 'in_progress' })
                    .eq('id', idea_id);
            }

            return NextResponse.json({ post: savedPost, generated: true });
        }

        // Optimize existing content for AEO
        if (action === 'optimize') {
            const { id, content } = data;

            if (!content) {
                return NextResponse.json({ error: 'content required for optimization' }, { status: 400 });
            }

            const optimized = await optimizeForAEO(content);

            // Update post if id provided
            if (id) {
                const { data: updatedPost, error } = await supabase
                    .from('blog_posts')
                    .update({
                        content: optimized.optimized_content,
                        faqs: optimized.added_faqs,
                        definitions: optimized.added_definitions,
                        structured_data: optimized.structured_data
                    })
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                return NextResponse.json({ post: updatedPost, optimized: true });
            }

            return NextResponse.json({ optimized });
        }

        // Score content
        if (action === 'score') {
            const { content, keywords } = data;
            const score = await scoreBlogContent(content, keywords || []);
            return NextResponse.json({ score });
        }

        // Create manual blog post
        const slug = data.slug || data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const { data: post, error } = await supabase
            .from('blog_posts')
            .insert({
                product_id,
                ...data,
                slug
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ post });
    } catch (error) {
        console.error('Error creating blog post:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}

// PATCH - Update blog post
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        // Handle publishing
        if (updates.status === 'published') {
            updates.published_at = new Date().toISOString();
        }

        // Increment version on content changes
        if (updates.content) {
            const { data: current } = await supabase
                .from('blog_posts')
                .select('version, content')
                .eq('id', id)
                .single();

            if (current) {
                updates.version = (current.version || 1) + 1;
                updates.previous_versions = [{
                    version: current.version,
                    content: current.content,
                    updated_at: new Date().toISOString()
                }];
            }
        }

        const { data, error } = await supabase
            .from('blog_posts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Update idea status if publishing
        if (updates.status === 'published' && data.idea_id) {
            await supabase
                .from('content_ideas')
                .update({ status: 'published' })
                .eq('id', data.idea_id);
        }

        return NextResponse.json({ post: data });
    } catch (error) {
        console.error('Error updating blog post:', error);
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }
}

// DELETE - Delete blog post
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting blog post:', error);
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }
}
