// ============================================
// AI SOCIAL POSTS API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    generateSocialPost,
    generateTwitterThread,
    generateCarouselSlides,
    repurposeBlogToSocial
} from '@/lib/marketing/content-generator';

// GET - Fetch social posts
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');
        const platform = searchParams.get('platform');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!productId) {
            return NextResponse.json({ error: 'product_id required' }, { status: 400 });
        }

        let query = supabase
            .from('ai_social_posts')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (platform) query = query.eq('platform', platform);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ posts: data });
    } catch (error) {
        console.error('Error fetching social posts:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

// POST - Create or generate social post
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { action, product_id, ...data } = body;

        if (!product_id) {
            return NextResponse.json({ error: 'product_id required' }, { status: 400 });
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

        // Generate single post
        if (action === 'generate') {
            const { platform, content_type, topic, blog_id, hashtag_count, thread_length, carousel_slide_count } = data;

            if (!platform || !topic) {
                return NextResponse.json({ error: 'platform and topic required' }, { status: 400 });
            }

            let postData;

            // Generate Twitter thread
            if (content_type === 'thread') {
                const threadParts = await generateTwitterThread(topic, thread_length || 7, profile);
                postData = {
                    platform,
                    content_type: 'thread',
                    content: threadParts[0],
                    thread_parts: threadParts,
                    hashtags: []
                };
            }
            // Generate carousel
            else if (content_type === 'carousel') {
                const slides = await generateCarouselSlides(topic, carousel_slide_count || 8, profile);
                postData = {
                    platform,
                    content_type: 'carousel',
                    content: topic,
                    carousel_slides: slides,
                    hashtags: []
                };
            }
            // Generate regular post
            else {
                postData = await generateSocialPost({
                    product_id,
                    platform,
                    content_type: content_type || 'post',
                    topic,
                    blog_id,
                    hashtag_count
                }, profile);
            }

            // Save to database
            const { data: savedPost, error } = await supabase
                .from('ai_social_posts')
                .insert({
                    product_id,
                    blog_id,
                    ...postData,
                    status: 'draft'
                })
                .select()
                .single();

            if (error) throw error;

            return NextResponse.json({ post: savedPost, generated: true });
        }

        // Repurpose blog to social posts
        if (action === 'repurpose') {
            const { blog_id, platforms } = data;

            if (!blog_id || !platforms?.length) {
                return NextResponse.json({ error: 'blog_id and platforms required' }, { status: 400 });
            }

            // Get the blog post
            const { data: blog } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('id', blog_id)
                .single();

            if (!blog) {
                return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
            }

            const posts = await repurposeBlogToSocial(blog, platforms, profile);

            // Save all posts
            const { data: savedPosts, error } = await supabase
                .from('ai_social_posts')
                .insert(posts.map(p => ({
                    product_id,
                    blog_id,
                    ...p,
                    status: 'draft'
                })))
                .select();

            if (error) throw error;

            return NextResponse.json({ posts: savedPosts, repurposed: true });
        }

        // Batch generate for multiple platforms
        if (action === 'batch_generate') {
            const { topic, platforms } = data;

            if (!topic || !platforms?.length) {
                return NextResponse.json({ error: 'topic and platforms required' }, { status: 400 });
            }

            const posts = [];
            for (const platform of platforms) {
                const postData = await generateSocialPost({
                    product_id,
                    platform,
                    content_type: 'post',
                    topic
                }, profile);

                posts.push({
                    product_id,
                    ...postData,
                    status: 'draft'
                });
            }

            const { data: savedPosts, error } = await supabase
                .from('ai_social_posts')
                .insert(posts)
                .select();

            if (error) throw error;

            return NextResponse.json({ posts: savedPosts, batch_generated: true });
        }

        // Create manual post
        const { data: post, error } = await supabase
            .from('ai_social_posts')
            .insert({
                product_id,
                ...data
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ post });
    } catch (error) {
        console.error('Error creating social post:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}

// PATCH - Update social post
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        // Handle scheduling
        if (updates.status === 'scheduled' && !updates.scheduled_for) {
            return NextResponse.json({ error: 'scheduled_for required when scheduling' }, { status: 400 });
        }

        // Handle publishing
        if (updates.status === 'published') {
            updates.published_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('ai_social_posts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ post: data });
    } catch (error) {
        console.error('Error updating social post:', error);
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }
}

// DELETE - Delete social post
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('ai_social_posts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting social post:', error);
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }
}
