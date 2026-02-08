import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { ProactiveInsightsEngine } from '@/lib/cognitive/proactive-insights-engine';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Debug: Check cookies
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();
        const cookieNames = allCookies.map(c => c.name);
        console.log('[TestAPI] Cookies received:', cookieNames);

        let { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
            console.error('[TestAPI] Auth error:', authError);
        }

        // Fallback check: Try getSession
        if (!user) {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log('[TestAPI] Session check:', session ? 'Found' : 'Not Found');
            if (session?.user) {
                user = session.user;
            }
        }

        // ---------------------------------------------------------
        // BYPASS: Email Fallback (For Test Mode)
        // ---------------------------------------------------------
        let authMethod = user ? 'standard_cookie' : 'none';

        if (!user) {
            const email = request.nextUrl.searchParams.get('email');

            if (email && process.env.SUPABASE_SERVICE_ROLE_KEY) {
                console.log(`[TestAPI] Standard auth failed. Attempting email fallback for: ${email}`);

                // Create Admin Client
                const adminClient = createSupabaseClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY
                );

                // List users to find by email
                // Note: efficient only for small user bases in dev
                const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

                if (listError) {
                    console.error('[TestAPI] Admin listUsers error:', listError);
                } else {
                    const foundUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
                    if (foundUser) {
                        user = foundUser as any;
                        authMethod = 'admin_email_bypass';
                        console.log(`[TestAPI] User found via admin bypass: ${user?.id}`);
                    }
                }
            }
        }

        if (!user) {
            return NextResponse.json({
                error: 'Not authenticated. Please log in first.',
                message: 'TIP: Add ?email=your@email.com to the URL to bypass auth issues during testing.',
                debug: {
                    cookiesReceived: cookieNames,
                    authError: authError?.message
                }
            }, { status: 401 });
        }

        // Get product_user_id (finding the most recent visited product or just the first one)
        // We order by last_accessed_at descending to get the active one

        // Note: If using admin bypass, we might need admin client to read product_users if RLS blocks us
        let productUser = null;
        let productUserError = null;

        if (authMethod === 'admin_email_bypass') {
            const adminClient = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            const res = await adminClient
                .from('product_users')
                .select('id, product_id, products(name)')
                .eq('user_id', user.id)
                .order('last_accessed_at', { ascending: false })
                .limit(1)
                .single();
            productUser = res.data;
            productUserError = res.error;
        } else {
            const res = await supabase
                .from('product_users')
                .select('id, product_id, products(name)')
                .eq('user_id', user.id)
                .order('last_accessed_at', { ascending: false })
                .limit(1)
                .single();
            productUser = res.data;
            productUserError = res.error;
        }


        if (productUserError) {
            console.error('[TestAPI] ProductUser error:', productUserError);
        }

        if (!productUser) {
            return NextResponse.json({
                error: 'Product user not found',
                message: 'You need to join a product first.',
                debugUserInfo: user.id
            }, { status: 404 });
        }

        console.log(`[TestAPI] Generating insights for User: ${productUser.id} in Product: ${productUser.product_id}`);

        const engine = new ProactiveInsightsEngine();
        const count = await engine.generateInsightsForUser(productUser.id, productUser.product_id);

        return NextResponse.json({
            success: true,
            message: `Generated ${count} insights successfully!`,
            details: {
                productUserId: productUser.id,
                productId: productUser.product_id,
                productName: (productUser.products as any)?.name,
                authMethod,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error: any) {
        console.error('[TestAPI] Error:', error);
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
