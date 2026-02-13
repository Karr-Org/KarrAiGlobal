'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, User, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { GoogleAuthButton, AuthDivider } from '@/components/auth/GoogleAuthButton';

export default function CreatorSignupPage() {
    const [formData, setFormData] = useState({
        displayName: '',
        companyName: '',
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const supabase = createClient();

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        display_name: formData.displayName,
                        user_type: 'creator',
                    },
                },
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Signup failed — no user returned');

            let hasSession = !!authData.session;

            if (!hasSession) {
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                });

                if (signInError) {
                    await fetch('/api/creator/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: authData.user.id,
                            displayName: formData.displayName,
                            companyName: formData.companyName,
                        }),
                    });

                    setSuccessMessage(
                        'Account created! Please check your email to confirm, then sign in.'
                    );
                    setLoading(false);
                    return;
                }

                hasSession = !!signInData.session;
            }

            const res = await fetch('/api/creator/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: authData.user.id,
                    displayName: formData.displayName,
                    companyName: formData.companyName,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

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
            <div className="w-full max-w-[400px]">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="w-10 h-10 rounded-lg bg-[#c4715b] flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-lg">M</span>
                    </div>
                    <h1 className="text-xl font-semibold text-[#2d2d2d]">Create your account</h1>
                    <p className="text-[#8b8b8b] text-sm mt-1">Build AI products powered by your knowledge</p>
                </div>

                {error && (
                    <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-5 p-3 rounded-lg bg-green-50 border border-green-100 text-green-700 text-sm">
                        {successMessage}
                        <Link href="/creator/login" className="block mt-2 font-medium text-green-800 underline">
                            Go to Sign In →
                        </Link>
                    </div>
                )}

                <GoogleAuthButton
                    redirectTo="/creator/dashboard"
                    label="Sign up with Google"
                    onError={(msg) => setError(msg)}
                    onLoadingChange={(l) => setLoading(l)}
                    disabled={loading}
                />

                <AuthDivider text="or sign up with email" />

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="displayName" className="block text-[13px] font-medium text-[#2d2d2d] mb-1.5">
                            Your Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5b0a9]" />
                            <input
                                id="displayName"
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                className="input pl-9"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="companyName" className="block text-[13px] font-medium text-[#2d2d2d] mb-1.5">
                            Company / Brand <span className="text-[#b5b0a9]">(optional)</span>
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5b0a9]" />
                            <input
                                id="companyName"
                                type="text"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                className="input pl-9"
                                placeholder="My AI Company"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-[13px] font-medium text-[#2d2d2d] mb-1.5">
                            Email address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5b0a9]" />
                            <input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input pl-9 pr-9"
                                placeholder="••••••••"
                                required
                                minLength={6}
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
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="mt-6 text-center text-[13px] text-[#8b8b8b]">
                    Already have an account?{' '}
                    <Link href="/creator/login" className="font-medium text-[#c4715b] hover:text-[#b3624d]">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
