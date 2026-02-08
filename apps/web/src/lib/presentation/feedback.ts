/**
 * KARR AI - Presentation Feedback & Learning Engine
 * 
 * Captures user feedback (ratings, edits, downloads) and uses it
 * to continuously improve presentation generation
 */

import { createClient } from '@supabase/supabase-js';
import {
    PresentationFeedback,
    PresentationEdit,
    SlideJSONPresentation
} from './types';

// =====================================================
// FEEDBACK TRACKING
// =====================================================

/**
 * Record user rating for a presentation
 */
export async function recordRating(
    presentationId: string,
    userId: string,
    rating: number,
    feedback?: string
): Promise<boolean> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return false;

        // Update presentation with rating
        const { error } = await supabase
            .from('presentations')
            .update({
                user_rating: rating,
                user_feedback: feedback,
                updated_at: new Date().toISOString()
            })
            .eq('id', presentationId)
            .eq('user_id', userId);

        if (error) {
            console.error('[FeedbackEngine] Rating error:', error);
            return false;
        }

        // Check if this should be promoted to template
        if (rating >= 4) {
            await checkForTemplatePromotion(presentationId);
        }

        // Update layout performance based on rating
        await updateLayoutPerformance(presentationId, rating);

        console.log('[FeedbackEngine] Recorded rating:', rating, 'for:', presentationId);
        return true;

    } catch (error) {
        console.error('[FeedbackEngine] Error recording rating:', error);
        return false;
    }
}

/**
 * Record when user downloads a presentation
 */
export async function recordDownload(
    presentationId: string,
    userId: string,
    format: 'pptx' | 'pdf'
): Promise<boolean> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return false;

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
            exported_at: new Date().toISOString()
        };

        if (format === 'pptx') {
            updateData.downloaded_pptx = true;
        } else {
            updateData.downloaded_pdf = true;
        }

        const { error } = await supabase
            .from('presentations')
            .update(updateData)
            .eq('id', presentationId)
            .eq('user_id', userId);

        if (error) {
            console.error('[FeedbackEngine] Download tracking error:', error);
            return false;
        }

        console.log('[FeedbackEngine] Recorded download:', format, 'for:', presentationId);
        return true;

    } catch (error) {
        console.error('[FeedbackEngine] Error recording download:', error);
        return false;
    }
}

/**
 * Record when user views a presentation
 */
export async function recordView(
    presentationId: string,
    userId: string,
    durationSeconds: number
): Promise<boolean> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return false;

        // Get current view count
        const { data: current } = await supabase
            .from('presentations')
            .select('view_count, view_duration_seconds')
            .eq('id', presentationId)
            .single();

        const { error } = await supabase
            .from('presentations')
            .update({
                view_count: (current?.view_count || 0) + 1,
                view_duration_seconds: (current?.view_duration_seconds || 0) + durationSeconds,
                viewed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', presentationId)
            .eq('user_id', userId);

        if (error) {
            console.error('[FeedbackEngine] View tracking error:', error);
            return false;
        }

        return true;

    } catch (error) {
        console.error('[FeedbackEngine] Error recording view:', error);
        return false;
    }
}

/**
 * Record when user discards a presentation
 */
export async function recordDiscard(
    presentationId: string,
    userId: string
): Promise<boolean> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return false;

        const { error } = await supabase
            .from('presentations')
            .update({
                was_discarded: true,
                status: 'archived',
                updated_at: new Date().toISOString()
            })
            .eq('id', presentationId)
            .eq('user_id', userId);

        if (error) {
            console.error('[FeedbackEngine] Discard tracking error:', error);
            return false;
        }

        // Learn from discards - these are negative signals
        await learnFromDiscard(presentationId);

        console.log('[FeedbackEngine] Recorded discard for:', presentationId);
        return true;

    } catch (error) {
        console.error('[FeedbackEngine] Error recording discard:', error);
        return false;
    }
}

// =====================================================
// EDIT TRACKING
// =====================================================

/**
 * Record an edit made to a presentation
 */
export async function recordEdit(edit: PresentationEdit): Promise<boolean> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return false;

        // Insert edit record
        const { error: editError } = await supabase
            .from('presentation_edits')
            .insert({
                presentation_id: edit.presentationId,
                user_id: edit.userId,
                edit_type: edit.editType,
                slide_index: edit.slideIndex,
                before_value: edit.beforeValue,
                after_value: edit.afterValue,
                edit_reason: edit.editReason
            });

        if (editError) {
            console.error('[FeedbackEngine] Edit record error:', editError);
            return false;
        }

        // Mark presentation as edited
        await supabase
            .from('presentations')
            .update({
                was_edited: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', edit.presentationId);

        // Learn from the edit
        await learnFromEdit(edit);

        console.log('[FeedbackEngine] Recorded edit:', edit.editType);
        return true;

    } catch (error) {
        console.error('[FeedbackEngine] Error recording edit:', error);
        return false;
    }
}

// =====================================================
// LEARNING FUNCTIONS
// =====================================================

/**
 * Update layout performance based on user rating
 */
async function updateLayoutPerformance(
    presentationId: string,
    rating: number
): Promise<void> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        // Get the presentation
        const { data: pres } = await supabase
            .from('presentations')
            .select('product_id, slide_json, topic, was_edited')
            .eq('id', presentationId)
            .single();

        if (!pres) return;

        const slideJson = pres.slide_json as SlideJSONPresentation;
        const topicCategory = pres.topic?.toLowerCase().split(' ')[0] || 'general';

        // Update performance for each layout used
        for (const slide of slideJson.slides) {
            await supabase.rpc('update_layout_performance', {
                p_product_id: pres.product_id,
                p_layout_type: slide.layout,
                p_topic_category: topicCategory,
                p_rating: rating,
                p_was_edited: pres.was_edited || false
            });
        }

    } catch (error) {
        console.error('[FeedbackEngine] Error updating layout performance:', error);
    }
}

/**
 * Check if a high-rated presentation should become a template
 */
async function checkForTemplatePromotion(presentationId: string): Promise<void> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        // Use the DB function
        const { data: templateId } = await supabase.rpc('promote_to_template', {
            p_presentation_id: presentationId
        });

        if (templateId) {
            console.log('[FeedbackEngine] Promoted presentation to template:', templateId);
        }

    } catch (error) {
        console.error('[FeedbackEngine] Error promoting to template:', error);
    }
}

/**
 * Learn from user edits to improve future generations
 */
async function learnFromEdit(edit: PresentationEdit): Promise<void> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        // Get presentation details
        const { data: pres } = await supabase
            .from('presentations')
            .select('product_id, topic')
            .eq('id', edit.presentationId)
            .single();

        if (!pres) return;

        // Track image prompt changes for learning
        if (edit.editType === 'image' && edit.beforeValue && edit.afterValue) {
            const before = edit.beforeValue as { aiPrompt?: string };
            const after = edit.afterValue as { aiPrompt?: string };

            if (before.aiPrompt && after.aiPrompt) {
                // Track that the original prompt was replaced
                const { data: existing } = await supabase
                    .from('image_prompt_performance')
                    .select('id, times_replaced, replacement_prompts')
                    .eq('product_id', pres.product_id)
                    .eq('original_prompt', before.aiPrompt)
                    .single();

                if (existing) {
                    const replacements = existing.replacement_prompts || [];
                    replacements.push(after.aiPrompt);

                    await supabase
                        .from('image_prompt_performance')
                        .update({
                            times_replaced: (existing.times_replaced || 0) + 1,
                            replacement_prompts: replacements.slice(-10), // Keep last 10
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existing.id);
                } else {
                    await supabase
                        .from('image_prompt_performance')
                        .insert({
                            product_id: pres.product_id,
                            original_prompt: before.aiPrompt,
                            topic_keywords: [pres.topic],
                            times_used: 1,
                            times_replaced: 1,
                            replacement_prompts: [after.aiPrompt]
                        });
                }
            }
        }

        // Track layout edits
        if (edit.editType === 'layout' && edit.beforeValue && edit.afterValue) {
            // This indicates the user preferred a different layout
            // Could be used to adjust layout recommendations
            console.log('[FeedbackEngine] Layout change tracked:', edit.beforeValue, '->', edit.afterValue);
        }

    } catch (error) {
        console.error('[FeedbackEngine] Error learning from edit:', error);
    }
}

/**
 * Learn from discarded presentations
 */
async function learnFromDiscard(presentationId: string): Promise<void> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        // Get the presentation
        const { data: pres } = await supabase
            .from('presentations')
            .select('product_id, slide_json, topic')
            .eq('id', presentationId)
            .single();

        if (!pres) return;

        const slideJson = pres.slide_json as SlideJSONPresentation;
        const topicCategory = pres.topic?.toLowerCase().split(' ')[0] || 'general';

        // Update layout performance with negative signal (rating = 1)
        for (const slide of slideJson.slides) {
            await supabase.rpc('update_layout_performance', {
                p_product_id: pres.product_id,
                p_layout_type: slide.layout,
                p_topic_category: topicCategory,
                p_rating: 1, // Discards are treated as rating 1
                p_was_edited: false
            });
        }

    } catch (error) {
        console.error('[FeedbackEngine] Error learning from discard:', error);
    }
}

// =====================================================
// ANALYTICS
// =====================================================

/**
 * Get presentation analytics for a product
 */
export async function getProductPresentationAnalytics(productId: string): Promise<{
    totalGenerated: number;
    averageRating: number;
    downloadRate: number;
    editRate: number;
    topLayouts: Array<{ layout: string; score: number }>;
}> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            return {
                totalGenerated: 0,
                averageRating: 0,
                downloadRate: 0,
                editRate: 0,
                topLayouts: []
            };
        }

        // Get presentation stats
        const { data: presentations } = await supabase
            .from('presentations')
            .select('user_rating, downloaded_pptx, downloaded_pdf, was_edited, was_discarded')
            .eq('product_id', productId);

        if (!presentations || presentations.length === 0) {
            return {
                totalGenerated: 0,
                averageRating: 0,
                downloadRate: 0,
                editRate: 0,
                topLayouts: []
            };
        }

        const totalGenerated = presentations.length;
        const ratedPresentations = presentations.filter(p => p.user_rating);
        const averageRating = ratedPresentations.length > 0
            ? ratedPresentations.reduce((sum, p) => sum + (p.user_rating || 0), 0) / ratedPresentations.length
            : 0;
        const downloadRate = presentations.filter(p => p.downloaded_pptx || p.downloaded_pdf).length / totalGenerated;
        const editRate = presentations.filter(p => p.was_edited).length / totalGenerated;

        // Get top layouts
        const { data: layouts } = await supabase
            .from('layout_performance')
            .select('layout_type, avg_rating, edit_rate')
            .eq('product_id', productId)
            .order('avg_rating', { ascending: false })
            .limit(5);

        const topLayouts = (layouts || []).map(l => ({
            layout: l.layout_type,
            score: (l.avg_rating * 0.6 + (1 - l.edit_rate) * 40 * 0.4)
        }));

        return {
            totalGenerated,
            averageRating,
            downloadRate,
            editRate,
            topLayouts
        };

    } catch (error) {
        console.error('[FeedbackEngine] Error getting analytics:', error);
        return {
            totalGenerated: 0,
            averageRating: 0,
            downloadRate: 0,
            editRate: 0,
            topLayouts: []
        };
    }
}

// =====================================================
// UTILITIES
// =====================================================

function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.warn('[FeedbackEngine] Supabase not configured');
        return null;
    }

    return createClient(supabaseUrl, supabaseKey);
}

export default {
    recordRating,
    recordDownload,
    recordView,
    recordDiscard,
    recordEdit,
    getProductPresentationAnalytics
};
