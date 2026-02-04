'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Sparkles, ArrowRight, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Product {
    id: string;
    name: string;
    description: string;
    primary_color: string;
}

export default function SignUpPage({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const supabase = createClient();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        email: '',
        password: '',
        name: '',
    });

    useEffect(() => {
        fetch(`/api/products/by-slug/${params.slug}`)
            .then(res => res.json())
            .then(data => {
                if (!data.error) setProduct(data);
            })
            .finally(() => setLoading(false));
    }, [params.slug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        setError('');
        setAuthLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: {
                        display_name: form.name,
                    },
                },
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Signup failed');

            const res = await fetch('/api/auth/product-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: authData.user.id,
                    productId: product.id,
                    displayName: form.name,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create account');
            }

            router.push(`/p/${params.slug}/dashboard`);

        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setAuthLoading(false);
        }
    };

    const brandColor = product?.primary_color || '#DA7B4D';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <div className="w-6 h-6 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="min-h-screen bg-cream-50 flex">
            <div className="w-full flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Back Link */}
                    <Link
                        href={`/p/${params.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-sand-700 mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to {product.name}
                    </Link>

                    <div className="text-center mb-8">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{ backgroundColor: `${brandColor}15` }}
                        >
                            <Sparkles className="w-7 h-7" style={{ color: brandColor }} />
                        </div>
                        <h2 className="text-2xl font-semibold text-sand-900 mb-2">Create Account</h2>
                        <p className="text-sand-500">Join {product.name}</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-sand-200 p-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" />
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-sand-50 border border-sand-200 rounded-xl text-sand-800 placeholder-sand-400 focus:outline-none focus:border-sand-300 focus:ring-1 focus:ring-sand-200 transition-all"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" />
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-sand-50 border border-sand-200 rounded-xl text-sand-800 placeholder-sand-400 focus:outline-none focus:border-sand-300 focus:ring-1 focus:ring-sand-200 transition-all"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="w-full pl-12 pr-12 py-3 bg-sand-50 border border-sand-200 rounded-xl text-sand-800 placeholder-sand-400 focus:outline-none focus:border-sand-300 focus:ring-1 focus:ring-sand-200 transition-all"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={authLoading}
                                className="w-full py-3 rounded-xl text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ backgroundColor: brandColor }}
                            >
                                {authLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>Create Account <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link
                                href={`/p/${params.slug}/signin`}
                                className="text-sand-600 hover:text-sand-800 text-sm transition-colors"
                            >
                                Already have an account? <span className="font-medium text-sand-800">Sign in</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
