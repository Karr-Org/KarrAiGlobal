import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Domains that serve the main makemyai.app platform (NOT product custom domains)
const MAIN_DOMAINS = new Set([
    'makemyai.app',
    'www.makemyai.app',
    'karrai.com',
    'www.karrai.com',
    'karrai-global.vercel.app',
]);

// Paths that should NEVER be rewritten to /p/[slug] on custom domains
const PLATFORM_PATHS = [
    '/_next',
    '/api',
    '/admin',
    '/creator',
    '/marketplace',
    '/auth',
    '/favicon',
];

export async function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';
    const pathname = request.nextUrl.pathname;

    // SAFETY NET: If OAuth code lands at root (Supabase fallback), redirect to /auth/callback
    if (pathname === '/' && request.nextUrl.searchParams.has('code')) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/callback';
        // Preserve the 'next' param if missing, default to creator dashboard
        if (!url.searchParams.has('next')) {
            url.searchParams.set('next', '/creator/dashboard');
        }
        console.log('[Middleware] Caught OAuth code at root, redirecting to /auth/callback');
        return NextResponse.redirect(url);
    }

    console.log('[Middleware] Processing:', pathname);

    // 1. Always run Supabase session handling (PKCE cookies, token refresh)
    //    This MUST run for /creator and /auth paths for OAuth to work
    const supabaseResponse = await updateSession(request);
    console.log('[Middleware] Session updated for:', pathname);

    // 2. Local development — no custom domain routing needed
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        return supabaseResponse;
    }

    // 3. Platform paths — never rewrite these to /p/[slug]
    if (PLATFORM_PATHS.some(p => pathname.startsWith(p)) || pathname.includes('.')) {
        return supabaseResponse;
    }

    // 4. If URL already starts with /p/ it's already been resolved
    if (pathname.startsWith('/p/')) {
        return supabaseResponse;
    }

    // 5. Extract base domain (strip port and www prefix)
    const baseDomain = hostname.split(':')[0].replace(/^www\./, '');

    // 6. Main app domain — serve as-is
    if (MAIN_DOMAINS.has(baseDomain)) {
        return supabaseResponse;
    }

    // ─── CUSTOM PRODUCT DOMAIN ────────────────────────────────────
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const productRes = await fetch(
            `${request.nextUrl.origin}/api/products/by-domain?domain=${baseDomain}`,
            {
                headers: { 'x-middleware-cache': 'no-cache' },
                signal: controller.signal,
            }
        );
        clearTimeout(timeoutId);

        if (productRes.ok) {
            const product = await productRes.json();
            if (product?.slug) {
                const url = request.nextUrl.clone();
                url.pathname = `/p/${product.slug}${pathname === '/' ? '' : pathname}`;
                return NextResponse.rewrite(url);
            }
        }
    } catch (e) {
        console.warn('[middleware] Custom domain lookup failed for:', baseDomain, e);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        // Match ALL paths except static files and Next.js internals
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
    ],
};
