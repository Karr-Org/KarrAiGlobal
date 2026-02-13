import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getAdmin } from '@/lib/auth';

// POST: Register a new creator profile after Supabase auth signup
export async function POST(request: NextRequest) {
    try {
        // Verify the caller is actually logged in
        const user = await requireAuth();

        const { displayName, companyName } = await request.json();

        if (!displayName) {
            return NextResponse.json(
                { error: 'displayName is required' },
                { status: 400 }
            );
        }

        const admin = getAdmin();

        // Check if creator profile already exists
        const { data: existing } = await admin
            .from('creator_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (existing) {
            return NextResponse.json({
                success: true,
                creatorId: existing.id,
                message: 'Creator profile already exists'
            });
        }

        // Get the free plan ID
        const { data: freePlan } = await admin
            .from('platform_plans')
            .select('id')
            .eq('name', 'free')
            .single();

        // Create creator profile — userId comes from the verified session, NOT the body
        const { data: creator, error: createError } = await admin
            .from('creator_profiles')
            .insert({
                user_id: user.id,
                display_name: displayName,
                company_name: companyName || null,
                role: 'creator',
                plan_id: freePlan?.id || null,
                plan_status: 'active',
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating creator profile:', createError);
            return NextResponse.json(
                { error: 'Failed to create creator profile: ' + createError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            creator,
            message: 'Creator account created successfully!'
        });

    } catch (e) {
        if (e instanceof NextResponse) return e;
        const message = e instanceof Error ? e.message : 'Internal server error';
        console.error('Creator auth error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// GET: Check if the current user has a creator profile
export async function GET() {
    try {
        const user = await requireAuth();
        const admin = getAdmin();

        const { data: creator, error } = await admin
            .from('creator_profiles')
            .select(`
                *,
                platform_plans (
                    name,
                    display_name,
                    product_limit,
                    storage_limit_gb,
                    kb_limit,
                    user_limit
                )
            `)
            .eq('user_id', user.id)
            .single();

        if (error || !creator) {
            return NextResponse.json({ exists: false });
        }

        return NextResponse.json({
            exists: true,
            creator,
        });

    } catch (e) {
        if (e instanceof NextResponse) return e;
        const message = e instanceof Error ? e.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
