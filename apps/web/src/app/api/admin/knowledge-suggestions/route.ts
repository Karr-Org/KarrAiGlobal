import { NextRequest, NextResponse } from 'next/server';
import { requireCreator, getAdmin } from '@/lib/auth';

// GET: List knowledge gap suggestions for a product
export async function GET(request: NextRequest) {
    try {
        await requireCreator();
        const supabase = getAdmin();
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const status = searchParams.get('status') || 'pending';
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!productId) {
            return NextResponse.json(
                { error: 'productId is required' },
                { status: 400 }
            );
        }

        // Use direct query to always get source_document_id (needed for View Full Document feature)
        // RPC doesn't return source_document_id properly
        let query = supabase
            .from('knowledge_suggestions')
            .select(`
                id,
                topic,
                sample_content,
                detected_category,
                similarity_to_kb,
                uniqueness_score,
                occurrence_count,
                user_ids,
                priority_score,
                status,
                created_at,
                source_user_id,
                source_document_id,
                product_users!knowledge_suggestions_source_user_id_fkey(display_name)
            `)
            .eq('product_id', productId)
            .order('priority_score', { ascending: false })
            .limit(limit);

        // Add status filter if not 'all'
        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: rawSuggestions, error } = await query;

        if (error) {
            console.error('Error fetching suggestions:', error);
            return NextResponse.json(
                { error: 'Failed to fetch suggestions' },
                { status: 500 }
            );
        }

        // Transform to include user_count and source_user_name
        const suggestions = (rawSuggestions || []).map((s: any) => ({
            ...s,
            user_count: Array.isArray(s.user_ids) ? s.user_ids.length : 0,
            source_user_name: s.product_users?.display_name || null,
            product_users: undefined, // Remove the nested object
        }));

        // Get summary stats
        const { data: summary } = await supabase
            .from('knowledge_gap_summary')
            .select('*')
            .eq('product_id', productId)
            .single();

        return NextResponse.json({
            success: true,
            suggestions,
            summary: summary || {
                pending_count: 0,
                approved_count: 0,
                rejected_count: 0,
            },
        });

    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// Helper function to check if a string is a valid UUID
function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

// POST: Approve or reject a suggestion
export async function POST(request: NextRequest) {
    try {
        await requireCreator();
        const supabase = getAdmin();
        const body = await request.json();
        const { suggestionId, action, adminId, knowledgeBaseIds, notes } = body;

        if (!suggestionId || !action) {
            return NextResponse.json(
                { error: 'suggestionId and action are required' },
                { status: 400 }
            );
        }

        // Validate adminId - if not a valid UUID, set to null (database column is nullable or requires UUID)
        const validAdminId = adminId && isValidUUID(adminId) ? adminId : null;

        if (action === 'approve') {
            if (!knowledgeBaseIds || !Array.isArray(knowledgeBaseIds) || knowledgeBaseIds.length === 0) {
                return NextResponse.json(
                    { error: 'knowledgeBaseIds array is required for approval' },
                    { status: 400 }
                );
            }

            const { data: result, error } = await supabase.rpc('approve_knowledge_suggestion', {
                p_suggestion_id: suggestionId,
                p_admin_id: validAdminId,
                p_knowledge_base_ids: knowledgeBaseIds,
                p_admin_notes: notes || null,
            });

            if (error) {
                console.error('Approval error:', error);
                // Manual fallback
                const { error: updateError } = await supabase
                    .from('knowledge_suggestions')
                    .update({
                        status: 'approved',
                        reviewed_by: validAdminId,
                        reviewed_at: new Date().toISOString(),
                        admin_notes: notes,
                    })
                    .eq('id', suggestionId);

                if (updateError) {
                    return NextResponse.json(
                        { error: 'Failed to approve suggestion' },
                        { status: 500 }
                    );
                }

                return NextResponse.json({
                    success: true,
                    message: 'Suggestion approved (manual)',
                });
            }

            // Award contributor points after successful approval
            try {
                // Get suggestion details for point calculation
                const { data: suggestion, error: suggestionError } = await supabase
                    .from('knowledge_suggestions')
                    .select('source_user_id, similarity_to_kb')
                    .eq('id', suggestionId)
                    .single();

                console.log('[Points] Suggestion data retrieved:', {
                    suggestionId,
                    source_user_id: suggestion?.source_user_id,
                    similarity_to_kb: suggestion?.similarity_to_kb,
                    error: suggestionError?.message
                });

                if (suggestion?.source_user_id) {
                    // Calculate uniqueness (inverse of similarity - lower similarity = more unique)
                    const uniquenessScore = suggestion.similarity_to_kb
                        ? Math.max(0, 1 - suggestion.similarity_to_kb)
                        : 0.5;

                    // Get chunk count from result if available
                    const chunkCount = result?.total_chunks_copied || 10; // Default estimate

                    console.log('[Points] Awarding points:', {
                        product_user_id: suggestion.source_user_id,
                        chunkCount,
                        uniquenessScore
                    });

                    const { data: pointsResult, error: pointsError } = await supabase.rpc('award_contributor_points', {
                        p_product_user_id: suggestion.source_user_id,
                        p_chunk_count: chunkCount,
                        p_uniqueness_score: uniquenessScore,
                    });

                    if (pointsError) {
                        console.error('[Points] Failed to award points:', pointsError);
                    } else {
                        console.log('[Points] Successfully awarded:', pointsResult);
                    }
                } else {
                    console.log('[Points] No source_user_id found - skipping points award');
                }
            } catch (pointsErr) {
                // Don't fail approval if points fail
                console.error('[Points] Calculation error:', pointsErr);
            }

            return NextResponse.json({
                success: true,
                result,
            });

        } else if (action === 'reject') {
            const { data: result, error } = await supabase.rpc('reject_knowledge_suggestion', {
                p_suggestion_id: suggestionId,
                p_admin_id: validAdminId,
                p_reason: notes || null,
            });

            if (error) {
                console.error('Rejection error:', error);
                // Manual fallback
                const { error: updateError } = await supabase
                    .from('knowledge_suggestions')
                    .update({
                        status: 'rejected',
                        reviewed_by: validAdminId,
                        reviewed_at: new Date().toISOString(),
                        admin_notes: notes,
                    })
                    .eq('id', suggestionId);

                if (updateError) {
                    return NextResponse.json(
                        { error: 'Failed to reject suggestion' },
                        { status: 500 }
                    );
                }

                return NextResponse.json({
                    success: true,
                    message: 'Suggestion rejected (manual)',
                });
            }

            return NextResponse.json({
                success: true,
                result,
            });

        } else {
            return NextResponse.json(
                { error: 'Invalid action. Use "approve" or "reject"' },
                { status: 400 }
            );
        }

    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
