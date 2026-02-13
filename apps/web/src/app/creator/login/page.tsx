'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { GoogleAuthButton, AuthDivider } from '@/components/auth/GoogleAuthButton';

function CreatorLoginContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const urlError = searchParams.get('error');
        if (urlError) setError(urlError);
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Login failed');

            const res = await fetch(`/api/creator/auth?userId=${authData.user.id}`);
            const data = await res.json();

            if (!data.exists) {
                setError('No creator account found for this email. Please sign up first.');
                await supabase.auth.signOut();
                setLoading(false);
                return;
            }

            router.push('/creator/dashboard');
            router.refresh();

        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-[380px]">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="w-10 h-10 rounded-lg bg-[#c4715b] flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-lg">M</span>
                    </div>
                    <h1 className="text-xl font-semibold text-[#2d2d2d]">Welcome back</h1>
                    <p className="text-[#8b8b8b] text-sm mt-1">Sign in to your creator portal</p>
                </div>

                {error && (
                    <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <GoogleAuthButton
                    redirectTo="/creator/dashboard"
                    label="Continue with Google"
                    onError={(msg) => setError(msg)}
                    onLoadingChange={(l) => setLoading(l)}
                    disabled={loading}
                />

                <AuthDivider text="or sign in with email" />

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-[13px] font-medium text-[#2d2d2d] mb-1.5">
                            Email address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5b0a9]" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input pl-9"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-[13px] font-medium text-[#2d2d2d] mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5b0a9]" />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input pl-9 pr-9"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b5b0a9] hover:text-[#8b8b8b]"
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-[#c4715b] text-white font-medium rounded-lg hover:bg-[#b3624d] disabled:opacity-50 transition-colors text-sm"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-6 text-center text-[13px] text-[#8b8b8b]">
                    Don&apos;t have an account?{' '}
                    <Link href="/creator/signup" className="font-medium text-[#c4715b] hover:text-[#b3624d]">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function CreatorLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#faf9f7] flex items-center justify-center"><div className="text-[#8b8b8b]">Loading...</div></div>}>
            <CreatorLoginContent />
        </Suspense>
    );
}

