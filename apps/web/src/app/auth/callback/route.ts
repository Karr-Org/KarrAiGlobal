import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/creator/dashboard';
    const error_description = searchParams.get('error_description');

    console.log('[Auth Callback] Started. Code present:', !!code, 'Next:', next);

    // If Google returned an error, show it
    if (error_description) {
        console.error('[Auth Callback] OAuth error from provider:', error_description);
        return NextResponse.redirect(`${origin}/creator/login?error=${encodeURIComponent(error_description)}`);
    }

    if (code) {
        const cookieStore = await cookies();

        // Track all cookies that Supabase sets during exchange
        // so we can apply them to the redirect response
        const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch {
                            // Ignore — will be set on redirect response instead
                        }
                        // Always track for redirect response
                        cookiesToSet.push({ name, value, options });
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options });
                        } catch {
                            // Ignore
                        }
                        cookiesToSet.push({ name, value: '', options });
                    },
                },
            }
        );

        console.log('[Auth Callback] Exchanging code for session...');
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('[Auth Callback] Code exchange error:', error.message);
            const loginPath = next.startsWith('/creator') ? '/creator/login' : '/auth/login';
            return NextResponse.redirect(`${origin}${loginPath}?error=${encodeURIComponent(error.message)}`);
        }
        console.log('[Auth Callback] Session exchanged successfully. Cookies to set:', cookiesToSet.length);

        // If this is a creator callback, auto-create creator profile
        if (next.startsWith('/creator')) {
            try {
                console.log('[Auth Callback] Checking creator profile...');
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    console.log('[Auth Callback] User found:', user.id);
                    const admin = createServiceClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.SUPABASE_SERVICE_ROLE_KEY!
                    );

                    // Check if creator profile exists
                    const { data: existing } = await admin
                        .from('creator_profiles')
                        .select('id')
                        .eq('user_id', user.id)
                        .single();

                    if (!existing) {
                        console.log('[Auth Callback] Creating new creator profile...');
                        const { data: freePlan } = await admin
                            .from('platform_plans')
                            .select('id')
                            .eq('name', 'free')
                            .single();

                        await admin.from('creator_profiles').insert({
                            user_id: user.id,
                            display_name: user.user_metadata?.full_name
                                || user.user_metadata?.display_name
                                || user.email?.split('@')[0]
                                || 'Creator',
                            role: 'creator',
                            plan_id: freePlan?.id || null,
                            plan_status: 'active',
                            avatar_url: user.user_metadata?.avatar_url || null,
                        });
                        console.log('[Auth Callback] Creator profile created.');
                    } else {
                        console.log('[Auth Callback] Creator profile already exists.');
                    }
                }
            } catch (e) {
                console.error('[Auth Callback] Error auto-creating creator profile:', e);
            }
        }

        // If this is a product callback (/p/[slug]/...), auto-create product_users record
        if (next.startsWith('/p/')) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const admin = createServiceClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.SUPABASE_SERVICE_ROLE_KEY!
                    );

                    // Extract slug from next path: /p/[slug]/dashboard
                    const slugMatch = next.match(/^\/p\/([^/]+)/);
                    if (slugMatch) {
                        const slug = slugMatch[1];
                        const { data: product } = await admin
                            .from('products')
                            .select('id')
                            .eq('slug', slug)
                            .single();

                        if (product) {
                            // Check if product_user already exists
                            const { data: existing } = await admin
                                .from('product_users')
                                .select('id')
                                .eq('user_id', user.id)
                                .eq('product_id', product.id)
                                .single();

                            if (!existing) {
                                console.log('[Auth Callback] Creating product_user for', slug);
                                await admin.from('product_users').insert({
                                    user_id: user.id,
                                    product_id: product.id,
                                    display_name: user.user_metadata?.full_name
                                        || user.user_metadata?.display_name
                                        || user.email?.split('@')[0]
                                        || 'User',
                                    role: 'user',
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('[Auth Callback] Error auto-creating product_user:', e);
            }
        }

        // Create redirect response and CARRY all session cookies
        const redirectUrl = `${origin}${next}`;
        console.log('[Auth Callback] Redirecting to:', redirectUrl, 'with', cookiesToSet.length, 'cookies');
        const response = NextResponse.redirect(redirectUrl);

        // Apply all cookies that Supabase set during exchangeCodeForSession
        cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
        });

        return response;
    }

    // No code at all — redirect to login
    const loginPath = next.startsWith('/creator') ? '/creator/login' : '/auth/login';
    return NextResponse.redirect(`${origin}${loginPath}?error=${encodeURIComponent('No authorization code received')}`);
}
