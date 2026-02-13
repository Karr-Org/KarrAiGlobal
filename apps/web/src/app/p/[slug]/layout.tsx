import { Metadata } from 'next';

// Server-side metadata generation for product pages
// This ensures the correct product name/branding appears in browser tabs
// and search engine results, not the generic "Karr AI Global"

interface ProductLayoutProps {
    children: React.ReactNode;
    params: { slug: string };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    // Fetch product details for dynamic metadata
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/products/by-slug/${params.slug}`, {
            next: { revalidate: 300 }, // Cache for 5 minutes
        });

        if (res.ok) {
            const product = await res.json();
            return {
                title: product.name || 'AI Assistant',
                description: product.description || `${product.name} - AI-powered assistant`,
                themeColor: product.primary_color || '#DA7B4D',
            };
        }
    } catch (e) {
        console.warn('[ProductLayout] Failed to fetch product metadata for slug:', params.slug);
    }

    // Fallback metadata
    return {
        title: 'AI Assistant',
        description: 'AI-powered assistant',
    };
}

export default function ProductLayout({ children }: ProductLayoutProps) {
    return <>{children}</>;
}
