'use server';

/**
 * 🎴 Presentation Server Actions
 * Handles persistence for Gamma presentations
 */

import { createClient } from '@supabase/supabase-js';
import type { GammaPresentation } from '@/lib/gamma/types';

// Create Supabase client for server-side operations
function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not configured');
    }

    return createClient(supabaseUrl, supabaseKey);
}

/**
 * Save presentation edits to the database
 */
export async function savePresentation(
    presentationId: string,
    updates: {
        presentation: GammaPresentation;
        wasEdited?: boolean;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();

        const { error } = await supabase
            .from('presentations')
            .update({
                slide_json: updates.presentation,
                title: updates.presentation.title,
                slide_count: updates.presentation.cards.length,
                was_edited: updates.wasEdited ?? true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', presentationId);

        if (error) {
            console.error('[savePresentation] Error:', error);
            return { success: false, error: error.message };
        }

        console.log('[savePresentation] Saved presentation:', presentationId);
        return { success: true };
    } catch (err) {
        console.error('[savePresentation] Exception:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Upload an image to Supabase Storage for presentations
 */
export async function uploadPresentationImage(
    formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();

        const file = formData.get('file') as File;
        const presentationId = formData.get('presentationId') as string;
        const userId = formData.get('userId') as string;

        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop() || 'png';
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileName = `${userId || 'anonymous'}/${presentationId || 'temp'}/${timestamp}-${randomStr}.${fileExt}`;

        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('presentation-images')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            console.error('[uploadPresentationImage] Upload error:', error);
            return { success: false, error: error.message };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('presentation-images')
            .getPublicUrl(data.path);

        console.log('[uploadPresentationImage] Uploaded:', urlData.publicUrl);
        return { success: true, url: urlData.publicUrl };
    } catch (err) {
        console.error('[uploadPresentationImage] Exception:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Record presentation view event
 */
export async function recordPresentationView(
    presentationId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();

        // Increment view count and update viewed_at
        const { error } = await supabase.rpc('increment_presentation_view', {
            p_presentation_id: presentationId
        });

        // Fallback if RPC doesn't exist - use raw update
        if (error?.code === '42883') {
            // Function doesn't exist, do manual update
            const { data: current } = await supabase
                .from('presentations')
                .select('view_count')
                .eq('id', presentationId)
                .single();

            await supabase
                .from('presentations')
                .update({
                    view_count: (current?.view_count || 0) + 1,
                    viewed_at: new Date().toISOString(),
                })
                .eq('id', presentationId);

            return { success: true };
        }

        if (error) {
            console.error('[recordPresentationView] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('[recordPresentationView] Exception:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Track presentation edit for learning
 */
export async function trackPresentationEdit(
    presentationId: string,
    userId: string,
    edit: {
        editType: 'content' | 'layout' | 'image' | 'reorder' | 'delete' | 'add';
        cardIndex?: number;
        blockId?: string;
        before?: any;
        after?: any;
        reason?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();

        const { error } = await supabase
            .from('presentation_edits')
            .insert({
                presentation_id: presentationId,
                user_id: userId,
                edit_type: edit.editType,
                slide_index: edit.cardIndex,
                before_value: edit.before,
                after_value: edit.after,
                edit_reason: edit.reason,
            });

        if (error) {
            console.error('[trackPresentationEdit] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('[trackPresentationEdit] Exception:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Get user's presentations
 */
export async function getUserPresentations(
    userId: string,
    productId?: string
): Promise<{ success: boolean; presentations?: any[]; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();

        let query = supabase
            .from('presentations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (productId) {
            query = query.eq('product_id', productId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[getUserPresentations] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, presentations: data || [] };
    } catch (err) {
        console.error('[getUserPresentations] Exception:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}
