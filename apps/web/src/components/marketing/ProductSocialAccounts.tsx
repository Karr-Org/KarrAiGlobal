'use client';

import { useState, useEffect } from 'react';
import {
    Linkedin,
    Plus,
    ExternalLink,
    Trash2,
    RefreshCw,
    Check,
    X,
    AlertCircle,
    Zap,
    Settings2,
    Globe
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface SocialAccount {
    id: string;
    platform: string;
    platformUsername: string;
    platformDisplayName: string;
    platformAvatarUrl?: string;
    isActive: boolean;
    tokenExpiresAt?: string;
    productId?: string;
}

interface AutomationRule {
    id: string;
    name: string;
    description: string;
    trigger_type: string;
    schedule_cron: string;
    action_type: string;
    is_active: boolean;
    last_run_at: string;
    next_run_at: string;
}

interface ProductSocialAccountsProps {
    productId: string;
    productName: string;
}

// Platform configs using the same platforms as the user-level social system
const PLATFORMS = [
    {
        id: 'linkedin',
        name: 'LinkedIn',
        color: 'bg-blue-600',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        ),
    },
    {
        id: 'twitter',
        name: 'X (Twitter)',
        color: 'bg-black',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    {
        id: 'facebook',
        name: 'Facebook',
        color: 'bg-blue-500',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        ),
    },
    {
        id: 'instagram',
        name: 'Instagram',
        color: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
        ),
    },
];

export default function ProductSocialAccounts({ productId, productName }: ProductSocialAccountsProps) {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [userId, setUserId] = useState<string | null>(null);
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
    const [connectError, setConnectError] = useState<string | null>(null);

    // Get current user
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                console.log('[Social] Authenticated user:', user.id);
            } else {
                console.warn('[Social] No authenticated user found');
            }
        };
        getUser();
    }, []);

    // Fetch accounts when productId or userId changes
    useEffect(() => {
        if (productId && userId) {
            fetchAccounts();
            fetchAutomationRules();
        }
    }, [productId, userId]);

    const fetchAccounts = async () => {
        try {
            const response = await fetch(`/api/social/accounts?productId=${productId}`, {
                headers: { 'x-user-id': userId || '' }
            });
            const data = await response.json();
            if (data.accounts) {
                setAccounts(data.accounts);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAutomationRules = async () => {
        try {
            const { data, error } = await supabase
                .from('marketing_automation_rules')
                .select('*')
                .eq('product_id', productId)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setAutomationRules(data);
            }
        } catch (error) {
            console.error('Error fetching automation rules:', error);
        }
    };

    const handleConnect = async (platformId: string) => {
        setConnectError(null);

        if (!userId) {
            setConnectError('Not authenticated. Please log in first.');
            console.error('[Social Connect] No userId — user not authenticated');
            return;
        }

        setConnectingPlatform(platformId);

        try {
            const response = await fetch('/api/social/accounts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                },
                body: JSON.stringify({ platform: platformId, productId }),
            });

            const data = await response.json();

            if (!response.ok) {
                setConnectError(data.error || `Server error: ${response.status}`);
                console.error('[Social Connect] API error:', data);
                setConnectingPlatform(null);
                return;
            }

            if (data.authUrl) {
                // Redirect to OAuth flow
                window.location.href = data.authUrl;
            } else {
                setConnectError('No auth URL returned from server. Check platform configuration.');
                console.error('[Social Connect] No auth URL returned:', data);
                setConnectingPlatform(null);
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            setConnectError(`Connection failed: ${msg}`);
            console.error('[Social Connect] Error:', error);
            setConnectingPlatform(null);
        }
    };

    const handleDisconnect = async (accountId: string) => {
        if (!confirm('Are you sure you want to disconnect this account?')) return;
        if (!userId) return;

        try {
            // Use the unified API
            const response = await fetch('/api/social/accounts', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                },
                body: JSON.stringify({ accountId }),
            });

            if (response.ok) {
                setAccounts(prev => prev.filter(a => a.id !== accountId));
            }
        } catch (error) {
            console.error('Error disconnecting account:', error);
        }
    };

    const toggleAutomationRule = async (ruleId: string, active: boolean) => {
        try {
            const { error } = await supabase
                .from('marketing_automation_rules')
                .update({ is_active: active })
                .eq('id', ruleId);

            if (!error) {
                setAutomationRules(prev => prev.map(r =>
                    r.id === ruleId ? { ...r, is_active: active } : r
                ));
            }
        } catch (error) {
            console.error('Error updating rule:', error);
        }
    };

    const connectedPlatforms = accounts.map(a => a.platform);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-sand-900 mb-2">Connected Accounts</h1>
                <p className="text-sand-500">
                    Connect social media accounts for <span className="font-medium text-sand-700">{productName}</span> to enable automatic content publishing.
                    Uses the same secure OAuth system as your personal social accounts.
                </p>
            </div>

            {/* Connected Accounts */}
            <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-sand-100 flex items-center justify-between">
                    <h2 className="font-semibold text-sand-800">Social Accounts</h2>
                    <button
                        onClick={() => setShowConnectModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-sand-800 hover:bg-sand-900 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Connect Account
                    </button>
                </div>

                {accounts.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-sand-100 flex items-center justify-center mx-auto mb-4">
                            <Zap className="w-8 h-8 text-sand-400" />
                        </div>
                        <h3 className="text-lg font-medium text-sand-800 mb-2">No accounts connected</h3>
                        <p className="text-sand-500 mb-6 max-w-sm mx-auto">
                            Connect your social media accounts to start auto-publishing content for {productName}.
                        </p>
                        <button
                            onClick={() => setShowConnectModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-terracotta-500 to-orange-500 hover:from-terracotta-600 hover:to-orange-600 text-white rounded-xl font-medium transition-colors"
                        >
                            Connect Your First Account
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-sand-100">
                        {accounts.map(account => {
                            const platformConfig = PLATFORMS.find(p => p.id === account.platform);
                            return (
                                <div key={account.id} className="p-4 flex items-center gap-4">
                                    {/* Platform Icon */}
                                    <div className={`w-12 h-12 rounded-xl ${platformConfig?.color || 'bg-gray-500'} flex items-center justify-center flex-shrink-0 text-white`}>
                                        {platformConfig?.icon || <Globe className="w-6 h-6" />}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sand-800">
                                                {account.platformDisplayName || account.platformUsername}
                                            </span>
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                                Connected
                                            </span>
                                        </div>
                                        <p className="text-sm text-sand-500">
                                            @{account.platformUsername} • {platformConfig?.name || account.platform}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => fetchAccounts()}
                                            className="p-2 text-sand-400 hover:text-sand-600 hover:bg-sand-50 rounded-lg transition-colors"
                                            title="Sync account"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDisconnect(account.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Disconnect"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Automation Rules */}
            <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-sand-100 flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-sand-800">Automation Rules</h2>
                        <p className="text-sm text-sand-500">Schedule automatic content generation and publishing</p>
                    </div>
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-sand-100 hover:bg-sand-200 text-sand-700 rounded-xl text-sm font-medium transition-colors"
                        title="Add automation rule"
                    >
                        <Settings2 className="w-4 h-4" />
                        Add Rule
                    </button>
                </div>

                {automationRules.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-sand-500">No automation rules configured yet.</p>
                        <p className="text-sm text-sand-400 mt-1">Create rules to automatically generate and publish content on schedule.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-sand-100">
                        {automationRules.map(rule => (
                            <div key={rule.id} className="p-4 flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sand-800">{rule.name}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rule.is_active
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-sand-100 text-sand-600'
                                            }`}>
                                            {rule.is_active ? 'Active' : 'Paused'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-sand-500">{rule.description}</p>
                                    {rule.next_run_at && (
                                        <p className="text-xs text-sand-400 mt-1">
                                            Next run: {new Date(rule.next_run_at).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => toggleAutomationRule(rule.id, !rule.is_active)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${rule.is_active
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                                        }`}
                                >
                                    {rule.is_active ? 'Pause' : 'Activate'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Connect Account Modal */}
            {showConnectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-sand-800">Connect Account</h2>
                            <button
                                onClick={() => setShowConnectModal(false)}
                                className="p-2 hover:bg-sand-100 rounded-lg transition-colors"
                                title="Close"
                            >
                                <X className="w-5 h-5 text-sand-500" />
                            </button>
                        </div>

                        <p className="text-sand-600 mb-6">
                            Choose a platform to connect for <span className="font-medium">{productName}</span>.
                            Same OAuth flow — just linked to this product.
                        </p>

                        <div className="space-y-3">
                            {PLATFORMS.map(platform => {
                                const isConnected = connectedPlatforms.includes(platform.id);
                                const isConnecting = connectingPlatform === platform.id;
                                return (
                                    <button
                                        key={platform.id}
                                        onClick={() => !isConnected && !isConnecting && handleConnect(platform.id)}
                                        disabled={isConnected || isConnecting}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${isConnected
                                            ? 'border-green-200 bg-green-50 cursor-not-allowed'
                                            : isConnecting
                                                ? 'border-blue-200 bg-blue-50 cursor-wait'
                                                : 'border-sand-200 hover:border-sand-300 hover:bg-sand-50'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-white`}>
                                            {platform.icon}
                                        </div>
                                        <span className="font-medium text-sand-800 flex-1 text-left">{platform.name}</span>
                                        {isConnected ? (
                                            <span className="flex items-center gap-1 text-green-600 text-sm">
                                                <Check className="w-4 h-4" />
                                                Connected
                                            </span>
                                        ) : isConnecting ? (
                                            <span className="flex items-center gap-1 text-blue-600 text-sm">
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Connecting...
                                            </span>
                                        ) : (
                                            <ExternalLink className="w-4 h-4 text-sand-400" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Error Display */}
                        {connectError && (
                            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                                <div className="flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                    <p className="text-sm text-red-700">{connectError}</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                <p className="text-sm text-amber-800">
                                    You&apos;ll be redirected to authorize access. We only request permissions needed to publish content.
                                    The same secure OAuth system used for personal accounts.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
