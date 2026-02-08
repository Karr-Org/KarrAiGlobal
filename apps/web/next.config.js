/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@karrai/database', '@karrai/ai', '@karrai/rag'],
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
};

module.exports = nextConfig;
