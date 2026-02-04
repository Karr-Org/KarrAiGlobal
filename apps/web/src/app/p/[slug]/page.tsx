'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Sparkles, ArrowRight, Shield, FileText, MessageSquare, ChevronRight } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    description: string;
    primary_color: string;
}

export default function ProductLandingPage({ params }: { params: { slug: string } }) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/products/by-slug/${params.slug}`)
            .then(res => res.json())
            .then(data => {
                if (!data.error) setProduct(data);
            })
            .finally(() => setLoading(false));
    }, [params.slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <div className="w-6 h-6 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sand-100 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-sand-400" />
                    </div>
                    <h1 className="text-xl font-semibold text-sand-800 mb-2">Product Not Found</h1>
                    <p className="text-sand-500">This AI assistant doesn't exist.</p>
                </div>
            </div>
        );
    }

    const brandColor = product.primary_color || '#DA7B4D';

    return (
        <div className="min-h-screen bg-cream-50 flex flex-col">
            {/* Navigation */}
            <nav className="border-b border-sand-200 px-6 py-4 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${brandColor}15` }}
                        >
                            <Sparkles className="w-4 h-4" style={{ color: brandColor }} />
                        </div>
                        <span className="font-semibold text-sand-900">{product.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/p/${params.slug}/signin`}
                            className="text-sand-600 hover:text-sand-800 text-sm font-medium transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href={`/p/${params.slug}/signup`}
                            className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
                            style={{ backgroundColor: brandColor }}
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col justify-center items-center px-6 py-20">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-sand-200 text-sm text-sand-600 mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        AI-Powered Knowledge Assistant
                    </div>

                    <h1 className="text-4xl md:text-5xl font-semibold text-sand-900 mb-6 leading-tight">
                        {product.name}
                    </h1>

                    <p className="text-lg text-sand-500 max-w-xl mx-auto mb-10 leading-relaxed">
                        {product.description || 'Access specialized knowledge, analyze your documents, and get instant answers powered by advanced AI.'}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            href={`/p/${params.slug}/signup`}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl text-white font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
                            style={{ backgroundColor: brandColor }}
                        >
                            Start Using {product.name}
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        <Link
                            href={`/p/${params.slug}/signin`}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium bg-white border border-sand-200 text-sand-700 hover:bg-sand-50 transition-all flex items-center justify-center"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="max-w-4xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            icon: Shield,
                            title: 'Private & Secure',
                            desc: 'Your data is encrypted and isolated. Only you have access to your personal documents.'
                        },
                        {
                            icon: FileText,
                            title: 'Document Analysis',
                            desc: 'Upload your own PDF, TXT, or DOCX files and chat with them instantly using AI.'
                        },
                        {
                            icon: MessageSquare,
                            title: 'Smart Chat',
                            desc: 'Context-aware responses that combine global knowledge with your personalized data.'
                        }
                    ].map((feat, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-sand-200 p-6 hover:shadow-soft transition-all">
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                                style={{ backgroundColor: `${brandColor}10` }}
                            >
                                <feat.icon className="w-5 h-5" style={{ color: brandColor }} />
                            </div>
                            <h3 className="text-lg font-semibold text-sand-900 mb-2">{feat.title}</h3>
                            <p className="text-sand-500 text-sm leading-relaxed">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            <footer className="border-t border-sand-200 py-8 text-center text-sand-500 text-sm bg-white">
                <p>&copy; {new Date().getFullYear()} {product.name}. Powered by Karr AI Global.</p>
            </footer>
        </div>
    );
}
