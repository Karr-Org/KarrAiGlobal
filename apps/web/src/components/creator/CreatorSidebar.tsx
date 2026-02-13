'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    Database,
    Settings,
    LogOut,
    Plus,
    CreditCard,
    BarChart3,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
    { label: 'Dashboard', href: '/creator/dashboard', icon: LayoutDashboard },
    { label: 'Knowledge Bases', href: '/creator/knowledge-bases', icon: Database },
    { label: 'Products', href: '/creator/products', icon: Package },
    { label: 'Analytics', href: '/creator/analytics', icon: BarChart3 },
    { label: 'Billing', href: '/creator/billing', icon: CreditCard },
    { label: 'Settings', href: '/creator/settings', icon: Settings },
];

export function CreatorSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/creator/login');
    };

    return (
        <aside className="fixed top-0 left-0 h-screen w-[240px] bg-[#1a1a1a] flex flex-col z-40">
            {/* Brand */}
            <div className="px-5 pt-6 pb-5">
                <Link href="/creator/dashboard" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#c4715b] flex items-center justify-center">
                        <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <span className="text-[15px] font-semibold text-white tracking-tight">MakeMyAI</span>
                </Link>
            </div>

            {/* Create Button */}
            <div className="px-3 mb-1">
                <Link
                    href="/creator/products/new"
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-[#c4715b] text-white rounded-lg text-sm font-medium hover:bg-[#b3624d] transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Product
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 mt-3 px-3 space-y-0.5">
                {navItems.map(({ label, href, icon: Icon }) => {
                    const isActive = pathname === href || pathname.startsWith(href + '/');
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${isActive
                                ? 'bg-white/10 text-white'
                                : 'text-[#a0a0a0] hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <Icon className="w-[18px] h-[18px]" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-white/5">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-[#a0a0a0] hover:bg-white/5 hover:text-white transition-colors w-full"
                >
                    <LogOut className="w-[18px] h-[18px]" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
