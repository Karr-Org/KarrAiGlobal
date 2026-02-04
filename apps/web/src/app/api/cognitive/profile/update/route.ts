/**
 * 🔧 COGNITIVE PROFILE UPDATE API
 * 
 * Allows users to manually update parts of their cognitive profile:
 * - Profession & Industry
 * - Add/remove goals
 * - Communication preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { productUserId, updates } = body;

        if (!productUserId) {
            return NextResponse.json({ error: 'productUserId required' }, { status: 400 });
        }

        // Build update object - only include fields that were provided
        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        // Profile fields that can be updated
        const editableFields = [
            'profession',
            'industry',
            'communication_style',
            'preferred_response_length',
            'vocabulary_level',
            'persona_summary',
        ];

        editableFields.forEach(field => {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        });

        // Handle array fields (goals, challenges)
        if (updates.addGoal) {
            const { data: currentProfile } = await supabase
                .from('user_cognitive_profile')
                .select('active_goals')
                .eq('product_user_id', productUserId)
                .single();

            const currentGoals = currentProfile?.active_goals || [];
            updateData.active_goals = [
                ...currentGoals,
                {
                    goal: updates.addGoal,
                    added_at: new Date().toISOString(),
                    source: 'manual',
                }
            ];
        }

        if (updates.removeGoalIndex !== undefined) {
            const { data: currentProfile } = await supabase
                .from('user_cognitive_profile')
                .select('active_goals')
                .eq('product_user_id', productUserId)
                .single();

            const currentGoals = currentProfile?.active_goals || [];
            currentGoals.splice(updates.removeGoalIndex, 1);
            updateData.active_goals = currentGoals;
        }

        if (updates.completeGoalIndex !== undefined) {
            const { data: currentProfile } = await supabase
                .from('user_cognitive_profile')
                .select('active_goals, completed_goals')
                .eq('product_user_id', productUserId)
                .single();

            const currentGoals = currentProfile?.active_goals || [];
            const completedGoals = currentProfile?.completed_goals || [];

            if (currentGoals[updates.completeGoalIndex]) {
                const completedGoal = {
                    ...currentGoals[updates.completeGoalIndex],
                    completed_at: new Date().toISOString(),
                };
                completedGoals.push(completedGoal);
                currentGoals.splice(updates.completeGoalIndex, 1);

                updateData.active_goals = currentGoals;
                updateData.completed_goals = completedGoals;
            }
        }

        // Perform the update
        const { data, error } = await supabase
            .from('user_cognitive_profile')
            .update(updateData)
            .eq('product_user_id', productUserId)
            .select()
            .single();

        if (error) {
            console.error('[ProfileUpdateAPI] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            profile: data,
            message: 'Profile updated successfully'
        });

    } catch (error: any) {
        console.error('[ProfileUpdateAPI] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}
