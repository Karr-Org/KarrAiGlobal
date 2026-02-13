'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Sparkles, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { GoogleAuthButton, AuthDivider } from '@/components/auth/GoogleAuthButton';

interface Product {
    id: string;
    name: string;
    description: string;
    primary_color: string;
}

export default function ProductAuthPage({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const supabase = createClient();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

    useEffect(() => {
        // Check if already logged in
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                // Check if user has access to this product
                checkProductAccess(session.user.id);
            }
        });
    }, [product]);

    const checkProductAccess = async (userId: string) => {
        if (!product) return;

        const { data } = await supabase
            .from('product_users')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', product.id)
            .single();

        if (data) {
            router.push(`/p/${params.slug}/dashboard`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        setError('');
        setSuccess('');
        setAuthLoading(true);

        try {
            if (mode === 'signup') {
                // Sign up
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

                // Create product user
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

                setSuccess('Account created! Check your email to verify.');

            } else {
                // Login
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email: form.email,
                    password: form.password,
                });

                if (authError) throw authError;
                if (!authData.user) throw new Error('Login failed');

                // Check product access
                const { data: productUser, error: puError } = await supabase
                    .from('product_users')
                    .select('id')
                    .eq('user_id', authData.user.id)
                    .eq('product_id', product.id)
                    .single();

                if (!productUser) {
                    // User exists but not for this product - create access
                    const res = await fetch('/api/auth/product-signup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: authData.user.id,
                            productId: product.id,
                            displayName: authData.user.user_metadata?.display_name || form.email.split('@')[0],
                        }),
                    });
                }

                router.push(`/p/${params.slug}/dashboard`);
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setAuthLoading(false);
        }
    };

    const brandColor = product?.primary_color || '#6366f1';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="text-center text-white">
                    <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
                    <p className="text-gray-400">This AI assistant doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[128px] animate-pulse opacity-30"
                    style={{ backgroundColor: brandColor }}
                />
                <div
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[128px] animate-pulse opacity-20"
                    style={{ backgroundColor: brandColor, animationDelay: '1s' }}
                />
            </div>

            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
                <div className="relative z-10 max-w-md">
                    <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8"
                        style={{ backgroundColor: `${brandColor}30` }}
                    >
                        <Sparkles className="w-10 h-10" style={{ color: brandColor }} />
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-6">
                        {product.name}
                    </h1>
                    <p className="text-xl text-gray-400 mb-8">
                        {product.description || 'Your AI-powered knowledge assistant'}
                    </p>
                    <div className="space-y-4">
                        {[
                            'AI-powered answers from your knowledge base',
                            'Upload your own documents for personalized insights',
                            'Secure, private, and always available',
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-gray-300">
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: `${brandColor}30` }}
                                >
                                    <ArrowRight className="w-3 h-3" style={{ color: brandColor }} />
                                </div>
                                {feature}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="flex-1 flex items-center justify-center p-8 relative z-10">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{ backgroundColor: `${brandColor}30` }}
                        >
                            <Sparkles className="w-8 h-8" style={{ color: brandColor }} />
                        </div>
                        <h1 className="text-2xl font-bold text-white">{product.name}</h1>
                    </div>

                    {/* Auth Card */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white">
                                {mode === 'login' ? 'Welcome back' : 'Create account'}
                            </h2>
                            <p className="text-gray-400 mt-2">
                                {mode === 'login'
                                    ? 'Sign in to continue to your dashboard'
                                    : 'Start your journey with ' + product.name}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
                                {success}
                            </div>
                        )}

                        {/* Google OAuth */}
                        <GoogleAuthButton
                            redirectTo={`/p/${params.slug}/dashboard`}
                            label={mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
                            variant="dark"
                            onError={(msg) => setError(msg)}
                            onLoadingChange={(l) => setAuthLoading(l)}
                            disabled={authLoading}
                        />

                        <AuthDivider text={mode === 'login' ? 'or sign in with email' : 'or sign up with email'} variant="dark" />

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {mode === 'signup' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all"
                                            style={{ '--tw-ring-color': brandColor } as any}
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all"
                                        style={{ '--tw-ring-color': brandColor } as any}
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="w-full pl-12 pr-12 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all"
                                        style={{ '--tw-ring-color': brandColor } as any}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={authLoading}
                                className="w-full py-4 rounded-xl text-white font-semibold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor: brandColor,
                                    boxShadow: `0 10px 40px -10px ${brandColor}80`
                                }}
                            >
                                {authLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => {
                                    setMode(mode === 'login' ? 'signup' : 'login');
                                    setError('');
                                    setSuccess('');
                                }}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                {mode === 'login'
                                    ? "Don't have an account? Sign up"
                                    : 'Already have an account? Sign in'}
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-gray-500 text-xs mt-6">
                        By continuing, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </div >
    );
}
