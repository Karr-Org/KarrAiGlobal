'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    BookOpen,
    Users,
    Settings,
    BarChart3,
    Shield,
    Lightbulb,
    Globe,
    ChevronRight,
    Plus
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Knowledge Bases', href: '/admin/knowledge-bases', icon: BookOpen },
    { name: 'Knowledge Gaps', href: '/admin/knowledge-suggestions', icon: Lightbulb },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Audit Logs', href: '/admin/audit', icon: Shield },
];

const bottomNav = [
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === href;
        return pathname.startsWith(href);
    };

    return (
        <div className="hidden lg:flex lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0">
            <div className="flex flex-col flex-grow bg-cream-100 border-r border-sand-200">
                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-5 border-b border-sand-200">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-terracotta-500 to-terracotta-600 flex items-center justify-center shadow-soft">
                        <span className="text-white font-bold text-lg">K</span>
                    </div>
                    <div>
                        <span className="text-[15px] font-semibold text-sand-800">Karr AI</span>
                        <span className="text-[15px] text-sand-500 ml-1">Global</span>
                    </div>
                </div>

                {/* New Conversation Button - Like Claude */}
                <div className="px-3 py-4">
                    <Link
                        href="/admin/products/new"
                        className="flex items-center gap-2 w-full px-4 py-2.5 bg-sand-800 hover:bg-sand-900 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Product
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 ${active
                                    ? 'bg-sand-200/80 text-sand-900'
                                    : 'text-sand-600 hover:bg-sand-200/50 hover:text-sand-800'
                                    }`}
                            >
                                <Icon className={`w-[18px] h-[18px] ${active ? 'text-terracotta-600' : 'text-sand-400 group-hover:text-sand-500'}`} />
                                {item.name}
                                {active && (
                                    <ChevronRight className="w-4 h-4 ml-auto text-sand-400" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Navigation */}
                <div className="px-3 pb-3 border-t border-sand-200 pt-3">
                    {bottomNav.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 ${active
                                    ? 'bg-sand-200/80 text-sand-900'
                                    : 'text-sand-600 hover:bg-sand-200/50 hover:text-sand-800'
                                    }`}
                            >
                                <Icon className={`w-[18px] h-[18px] ${active ? 'text-terracotta-600' : 'text-sand-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                {/* User Profile */}
                <div className="px-3 pb-4">
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sand-200/50 cursor-pointer transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">A</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-sand-800 truncate">Admin User</p>
                            <p className="text-xs text-sand-500 truncate">admin@karrai.global</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
