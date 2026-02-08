import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: '#0c4a6e',
};

export const metadata: Metadata = {
    title: 'Karr AI Global - AI Factory Platform',
    description: 'Create, operate, and manage multiple domain-specific AI products from a single infrastructure.',
    keywords: ['AI', 'Artificial Intelligence', 'Machine Learning', 'Global', 'Productivity', 'Automation'],
    authors: [{ name: 'Karr AI Global' }],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="h-full">
            <body className="h-full bg-gray-50">
                {children}
            </body>
        </html>
    );
}
