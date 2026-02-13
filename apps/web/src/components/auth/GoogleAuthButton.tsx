'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface GoogleAuthButtonProps {
    redirectTo: string;
    label?: string;
    variant?: 'light' | 'dark';
    onError?: (message: string) => void;
    onLoadingChange?: (loading: boolean) => void;
    disabled?: boolean;
    className?: string;
}

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

export function GoogleAuthButton({
    redirectTo,
    label = 'Continue with Google',
    variant = 'light',
    onError,
    onLoadingChange,
    disabled = false,
    className,
}: GoogleAuthButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        onLoadingChange?.(true);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
            },
        });

        if (error) {
            onError?.(error.message);
            setLoading(false);
            onLoadingChange?.(false);
        }
    };

    const baseStyles = variant === 'light'
        ? 'bg-white border border-[#e8e4df] text-[#2d2d2d] hover:bg-[#f4f1ed]'
        : 'bg-white/5 border border-white/10 text-white hover:bg-white/10';

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled || loading}
            className={className || `w-full py-3 px-4 ${baseStyles} rounded-xl font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-3 text-sm`}
        >
            <GoogleIcon />
            <span>{loading ? 'Redirecting...' : label}</span>
        </button>
    );
}

export function AuthDivider({
    text = 'or continue with email',
    variant = 'light',
}: {
    text?: string;
    variant?: 'light' | 'dark';
}) {
    return (
        <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${variant === 'light' ? 'border-[#e8e4df]' : 'border-white/10'}`}></div>
            </div>
            <div className="relative flex justify-center text-xs">
                <span className={`px-3 ${variant === 'light' ? 'bg-[#faf9f7] text-[#b5b0a9]' : 'bg-[#0a0a0f] text-gray-500'}`}>
                    {text}
                </span>
            </div>
        </div>
    );
}
