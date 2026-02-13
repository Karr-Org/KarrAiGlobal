'use client';

/**
 * Product-scoped Social Media page
 * 
 * This page wraps the social media functionality within the product context.
 * On custom domains: myproduct.com/social → /p/[slug]/social
 * On main domain: makemyai.app/p/[slug]/social
 * 
 * All navigation stays within the /p/[slug]/ namespace.
 */

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ProductSocialPage({ params }: { params: { slug: string } }) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /></div>}>
            <ProductSocialRedirect slug={params.slug} />
        </Suspense>
    );
}

/**
 * This component redirects to the main social page with the product context.
 * Since social features are shared infrastructure, we redirect to /social
 * but only when accessed from the main domain. On custom domains, the
 * middleware handles the rewriting.
 */
function ProductSocialRedirect({ slug }: { slug: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push(`/p/${slug}/auth`);
                return;
            }

            // Social is a shared feature — redirect to the main social page
            // The social page will look up the user's product context
            router.push('/social');
        }
        checkAuth();
    }, [router, slug]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-cream-50">
            <div className="text-center">
                <div className="w-6 h-6 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sand-500 text-sm">Loading Social Media...</p>
            </div>
        </div>
    );
}
