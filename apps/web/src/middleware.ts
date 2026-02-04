import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Multi-domain middleware for product routing
// Maps custom domains to product slugs
export async function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';
    const pathname = request.nextUrl.pathname;

    // Skip for API routes, static files, admin, etc.
    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/p/') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Get the base domain (without port for local dev)
    const baseDomain = hostname.split(':')[0];

    // Skip for main app domain
    const mainDomains = ['localhost', 'karrai.com', 'www.karrai.com', 'karrai-global.vercel.app'];
    if (mainDomains.some(d => baseDomain === d || baseDomain.endsWith(`.${d}`))) {
        return NextResponse.next();
    }

    // For custom domains, look up the product by domain
    // This rewrites the request to /p/[slug] internally
    try {
        // Fetch product by domain from our API
        const productRes = await fetch(
            `${request.nextUrl.origin}/api/products/by-domain?domain=${baseDomain}`,
            { headers: { 'x-middleware-cache': 'no-cache' } }
        );

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
        console.error('Middleware domain lookup failed:', e);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all paths except static files
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
