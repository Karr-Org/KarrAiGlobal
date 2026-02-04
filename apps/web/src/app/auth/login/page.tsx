'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        router.push('/admin');
        router.refresh();
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const supabase = createClient();

        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to home</span>
                    </Link>

                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">Karr AI Global</span>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
                    <p className="text-gray-600 mb-8">Sign in to your account to continue</p>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input pl-10"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pl-10 pr-10"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-gray-600">Remember me</span>
                            </label>
                            {/* <Link href="/auth/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                                Forgot password?
                            </Link> */}
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 flex items-start gap-2">
                            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>
                                <strong>Team Access Only:</strong> Logins are restricted to authorized team members.
                                Contact your administrator for access or password resets.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-2.5"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    {/* Removed Social Login & Signup Links for Security */}
                    {/*
                    <div className="relative my-8">...</div>
                    <button...Google...</button>
                    <p...Sign up...</p>
                     */}
                    <div className="mt-8 text-center text-sm text-gray-500">
                        Restricted Access System
                    </div>
                </div>
            </div>

            {/* Right Panel - Branding */}
            <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-700 to-primary-900 justify-center items-center p-12">
                <div className="max-w-md text-center">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-8">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">
                        Your Global AI Partner
                    </h3>
                    <p className="text-primary-100 text-lg">
                        Empowering every industry with specialized intelligence.
                        Join thousands of professionals globally who trust Karr AI Global.
                    </p>
                </div>
            </div>
        </div>
    );
}
