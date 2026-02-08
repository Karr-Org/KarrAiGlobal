import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Multi-domain middleware for product routing
// Maps custom domains to product slugs
// OPTIMIZED: Fast paths for localhost development
export async function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';
    const pathname = request.nextUrl.pathname;

    // FAST PATH: Skip everything on localhost for faster dev experience
    const baseDomain = hostname.split(':')[0];
    if (baseDomain === 'localhost' || baseDomain === '127.0.0.1') {
        return NextResponse.next();
    }

    // Skip for app routes, static files, admin, etc.
    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/p/') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/chat') ||
        pathname.startsWith('/demo') ||
        pathname.startsWith('/gst-ai') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Skip for main app domain (production)
    const mainDomains = ['karrai.com', 'www.karrai.com', 'karrai-global.vercel.app'];
    if (mainDomains.some(d => baseDomain === d || baseDomain.endsWith(`.${d}`))) {
        return NextResponse.next();
    }

    // For custom domains only, look up the product by domain
    // This rewrites the request to /p/[slug] internally
    try {
        // Fetch product by domain from our API with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        const productRes = await fetch(
            `${request.nextUrl.origin}/api/products/by-domain?domain=${baseDomain}`,
            {
                headers: { 'x-middleware-cache': 'no-cache' },
                signal: controller.signal
            }
        );
        clearTimeout(timeoutId);

        if (productRes.ok) {
            const product = await productRes.json();
            if (product?.slug) {
                // Rewrite to the product page
                const url = request.nextUrl.clone();
                url.pathname = `/p/${product.slug}${pathname === '/' ? '' : pathname}`;
                return NextResponse.rewrite(url);
            }
        }
    } catch (e) {
        // Silently ignore - don't block the request
        if (e instanceof Error && e.name !== 'AbortError') {
            console.error('Middleware domain lookup failed:', e);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Only match root and top-level paths that might need domain rewriting
        // Exclude all known app routes and static files for maximum performance
        '/((?!_next|api|admin|p|auth|chat|demo|gst-ai|favicon|.*\\.).*)',
    ],
};
