import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    // 1. Create a list to track cookies that need to be set on the response
    const responseCookies: { name: string; value: string; options: CookieOptions }[] = [];

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    // Update request cookies so the updated session is available to next middleware/handlers
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    // Queue for response
                    responseCookies.push({ name, value, options });
                },
                remove(name: string, options: CookieOptions) {
                    // Update request
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    // Queue for response
                    responseCookies.push({ name, value: '', options });
                },
            },
        }
    );

    // 2. Refresh session if expired - with timeout
    try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));
        await Promise.race([
            supabase.auth.getUser(),
            timeoutPromise
        ]);
    } catch (e) {
        console.warn('Middleware auth check timed out or failed', e);
    }

    // 3. Create the final response with the *updated* request state
    const supabaseResponse = NextResponse.next({
        request,
    });

    // 4. Apply all queued cookies to the response
    responseCookies.forEach(({ name, value, options }) => {
        supabaseResponse.cookies.set({
            name,
            value,
            ...options,
        });
    });

    console.log('[Middleware] Session updated. Cookies set:', responseCookies.length);

    return supabaseResponse;
}
