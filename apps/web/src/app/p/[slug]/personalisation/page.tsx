'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    User,
    Brain,
    FileText,
    Trophy,
    Upload,
    CheckCircle,
    AlertCircle,
    Plus,
    Trash2,
    Share2,
    PanelLeftClose,
    LogOut,
    MessageSquare,
    ExternalLink,
    Users
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import KnowledgeGraphDashboard from '@/components/cognitive/KnowledgeGraphDashboard';
import CognitiveProfileDashboard from '@/components/cognitive/CognitiveProfileDashboard';

// ============================================
// TYPES
// ============================================

interface Document {
    id: string;
    title: string;
    file_type: string;
    file_size: number;
    status: string;
    created_at: string;
    chunk_count?: number;
}

interface UploadItem {
    file: File;
    status: 'uploading' | 'success' | 'error';
    message: string;
}

interface LeaderboardEntry {
    id: string;
    display_name: string;
    contributor_score: number;
    contributor_rank: string;
    total_docs_contributed: number;
}

interface ProductUser {
    id: string;
    product_id: string;
    display_name: string;
}

interface Product {
    id: string;
    name: string;
    slug: string;
}

// ============================================
// PAGE COMPONENT (Product-scoped)
// ============================================

export default function ProductPersonalisationPage({ params }: { params: { slug: string } }) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-gray-300 border-t-amber-500 rounded-full animate-spin" /></div>}>
            <PersonalisationContent slug={params.slug} />
        </Suspense>
    );
}

function PersonalisationContent({ slug }: { slug: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Tab state
    type TabType = 'profile' | 'knowledge' | 'documents' | 'leaderboard';
    const initialTab = (searchParams.get('tab') as TabType) || 'documents';
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);

    // Sidebar
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Auth state
    const [loading, setLoading] = useState(true);
    const [productUser, setProductUser] = useState<ProductUser | null>(null);
    const [product, setProduct] = useState<Product | null>(null);

    // Documents state
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const docInputRef = useRef<HTMLInputElement>(null);

    // Leaderboard state
    const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);

    const tabs = [
        { id: 'documents' as TabType, label: 'My Library', icon: FileText },
        { id: 'profile' as TabType, label: 'My Profile', icon: User },
        { id: 'knowledge' as TabType, label: 'Knowledge Graph', icon: Brain },
        { id: 'leaderboard' as TabType, label: 'Leaderboard', icon: Trophy },
    ];

    // ============================================
    // AUTH + INIT
    // ============================================

    useEffect(() => {
        async function init() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push(`/p/${slug}/auth`);
                    return;
                }

                // Get the product by slug first
                const productRes = await fetch(`/api/products/by-slug/${slug}`);
                const productData = await productRes.json();

                if (productData.error) {
                    router.push(`/p/${slug}`);
                    return;
                }
                setProduct(productData);

                // Get product_user for this user + product combination
                const { data: pu } = await supabase
                    .from('product_users')
                    .select('id, product_id, display_name')
                    .eq('user_id', user.id)
                    .eq('product_id', productData.id)
                    .single();

                if (pu) {
                    setProductUser(pu);
                } else {
                    router.push(`/p/${slug}/auth`);
                    return;
                }
            } catch (err) {
                console.error('Init error:', err);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [supabase, router, slug]);

    // ============================================
    // DOCUMENTS
    // ============================================

    const fetchDocuments = useCallback(async () => {
        if (!productUser) return;

        const { data } = await supabase
            .from('knowledge_documents')
            .select('id, title, file_type, file_size, status, created_at, chunk_count')
            .eq('uploaded_by', productUser.id)
            .order('created_at', { ascending: false });

        if (data) setDocuments(data);
    }, [supabase, productUser]);

    useEffect(() => {
        if (activeTab === 'documents' && productUser) {
            fetchDocuments();
        }
    }, [activeTab, productUser, fetchDocuments]);

    const handleFileUpload = async (files: FileList | File[]) => {
        if (!productUser || !product) return;

        const fileArray = Array.from(files);

        setUploadQueue(prev => [
            ...prev,
            ...fileArray.map(f => ({ file: f, status: 'uploading' as const, message: 'Uploading...' }))
        ]);

        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('product_id', product.id);
                formData.append('uploader_id', productUser.id);

                const res = await fetch('/api/knowledge/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) throw new Error('Upload failed');

                setUploadQueue(prev =>
                    prev.map((item) =>
                        item.file === file
                            ? { ...item, status: 'success', message: 'Uploaded successfully!' }
                            : item
                    )
                );
            } catch (err) {
                setUploadQueue(prev =>
                    prev.map((item) =>
                        item.file === file
                            ? { ...item, status: 'error', message: 'Upload failed' }
                            : item
                    )
                );
            }
        }

        setTimeout(() => {
            fetchDocuments();
            setTimeout(() => {
                setUploadQueue(prev => prev.filter(i => i.status === 'uploading'));
            }, 3000);
        }, 1000);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    const deleteDocument = async (docId: string) => {
        await supabase.from('knowledge_documents').delete().eq('id', docId);
        setDocuments(prev => prev.filter(d => d.id !== docId));
    };

    // ============================================
    // LEADERBOARD
    // ============================================

    const fetchLeaderboard = useCallback(async () => {
        if (!product) return;

        const { data } = await supabase
            .from('product_users')
            .select('id, display_name, contributor_score, contributor_rank, total_docs_contributed')
            .eq('product_id', product.id)
            .order('contributor_score', { ascending: false })
            .limit(20);

        if (data) setLeaderboardEntries(data);
    }, [supabase, product]);

    useEffect(() => {
        if (activeTab === 'leaderboard' && product) {
            fetchLeaderboard();
        }
    }, [activeTab, product, fetchLeaderboard]);

    // ============================================
    // LOGOUT
    // ============================================

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push(`/p/${slug}/auth`);
    };

    // ============================================
    // RENDER
    // ============================================

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <div className="text-center">
                    <div className="w-6 h-6 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sand-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!productUser || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <div className="text-center">
                    <h1 className="text-xl font-semibold text-sand-800 mb-2">Access Required</h1>
                    <Link href={`/p/${slug}/auth`} className="text-terracotta-600 hover:underline text-sm">
                        Sign in to continue
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-cream-50 flex overflow-hidden">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-[280px]' : 'w-16'} flex-shrink-0 transition-all duration-300 bg-cream-50 flex flex-col overflow-hidden`}>
                {/* Header */}
                <div className="p-3 flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-sand-200/50 transition-colors flex-shrink-0"
                        title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                    >
                        <PanelLeftClose className={`w-5 h-5 text-sand-500 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
                    </button>
                    {sidebarOpen && (
                        <span className="font-semibold text-sand-900 truncate text-lg animate-in fade-in duration-200">
                            {product.name}
                        </span>
                    )}
                </div>

                {/* New Chat Button */}
                <div className="px-3 pb-2">
                    <button
                        onClick={() => router.push(`/p/${slug}/dashboard`)}
                        className={`${sidebarOpen ? 'w-full py-2.5 px-4' : 'w-10 h-10 mx-auto'} rounded-xl bg-sand-800 hover:bg-sand-900 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all`}
                        title="New Chat"
                    >
                        <Plus className="w-4 h-4" />
                        {sidebarOpen && <span>New Chat</span>}
                    </button>
                </div>

                {/* Navigation */}
                <div className="px-2 space-y-1">
                    {/* Personalisation - Active */}
                    <button
                        className={`${sidebarOpen ? 'w-full py-2.5 px-3' : 'w-10 h-10 mx-auto'} rounded-xl flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} text-sm font-medium transition-all bg-sand-200/80 text-sand-900`}
                        title="Personalisation"
                    >
                        <User className="w-[18px] h-[18px] flex-shrink-0 text-terracotta-600" />
                        {sidebarOpen && <span>Personalisation</span>}
                    </button>

                    {/* My Clients */}
                    <button
                        onClick={() => router.push(`/p/${slug}/dashboard?tab=clients`)}
                        className={`${sidebarOpen ? 'w-full py-2.5 px-3' : 'w-10 h-10 mx-auto'} rounded-xl flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} text-sm font-medium transition-all text-sand-600 hover:bg-sand-200/50 hover:text-sand-800`}
                        title="My Clients"
                    >
                        <Users className="w-[18px] h-[18px] flex-shrink-0 text-sand-400" />
                        {sidebarOpen && <span>My Clients</span>}
                    </button>
                </div>

                {/* Social Media Link */}
                <div className="px-2 mt-2 pt-2 border-t border-sand-200/40">
                    <button
                        onClick={() => router.push(`/p/${slug}/social`)}
                        className={`${sidebarOpen ? 'w-full py-2.5 px-3' : 'w-10 h-10 mx-auto'} rounded-xl flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} text-sm font-medium transition-all text-sand-600 hover:bg-sand-200/50 hover:text-sand-800 group`}
                        title="Social Media"
                    >
                        <Share2 className="w-[18px] h-[18px] flex-shrink-0 text-sand-400 group-hover:text-terracotta-500 transition-colors" />
                        {sidebarOpen && (
                            <span className="flex items-center gap-2 flex-1">
                                Social Media
                                <ExternalLink className="w-3 h-3 text-sand-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                        )}
                    </button>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Sign Out */}
                <div className="px-2 py-3">
                    <button
                        onClick={handleLogout}
                        className={`${sidebarOpen ? 'w-full py-2.5 px-3' : 'w-10 h-10 mx-auto'} rounded-xl text-sand-600 hover:text-sand-800 hover:bg-sand-200/50 flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} text-sm font-medium transition-all`}
                        title="Sign Out"
                    >
                        <LogOut className="w-[18px] h-[18px] text-sand-400" />
                        {sidebarOpen && <span>Sign Out</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white rounded-tl-[32px] shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex-shrink-0 px-8 pt-6 pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-sand-900">Personalisation</h1>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 mt-4 border-b border-sand-100">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${isActive
                                        ? 'text-sand-900 border-terracotta-500 bg-terracotta-50/50'
                                        : 'text-sand-500 border-transparent hover:text-sand-700 hover:bg-sand-50'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-terracotta-500' : ''}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <CognitiveProfileDashboard
                            productUserId={productUser.id}
                            productId={product.id}
                        />
                    )}

                    {/* Knowledge Graph Tab */}
                    {activeTab === 'knowledge' && (
                        <div className="p-6">
                            <KnowledgeGraphDashboard productUserId={productUser.id} />
                        </div>
                    )}

                    {/* Documents Tab */}
                    {activeTab === 'documents' && (
                        <div className="p-6">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-sand-900">My Library</h2>
                                        <p className="text-sand-500 text-sm">Upload and manage your personal knowledge library</p>
                                    </div>
                                    <label className="flex items-center gap-2 px-4 py-2.5 bg-sand-800 hover:bg-sand-900 text-white rounded-xl text-sm font-medium cursor-pointer transition-colors">
                                        <Upload className="w-4 h-4" />
                                        Upload Files
                                        <input
                                            ref={docInputRef}
                                            type="file"
                                            multiple
                                            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                                            accept=".pdf,.txt,.md,.docx"
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                {/* Upload Queue */}
                                {uploadQueue.length > 0 && (
                                    <div className="mb-6 space-y-2">
                                        {uploadQueue.map((item, i) => (
                                            <div key={i} className="bg-white rounded-xl border border-sand-200 p-4">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-sand-400" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-sand-800 truncate">{item.file.name}</p>
                                                        <p className="text-xs text-sand-500">{item.message}</p>
                                                    </div>
                                                    {item.status === 'uploading' && (
                                                        <div className="w-6 h-6 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin"></div>
                                                    )}
                                                    {item.status === 'success' && (
                                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                    )}
                                                    {item.status === 'error' && (
                                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Documents List */}
                                {documents.length === 0 ? (
                                    <div
                                        className={`text-center py-16 bg-white rounded-2xl border-2 border-dashed transition-colors ${isDragging ? 'border-terracotta-400 bg-terracotta-50' : 'border-sand-200'}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-sand-100 flex items-center justify-center">
                                            <Upload className="w-7 h-7 text-sand-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-sand-800 mb-2">No documents yet</h3>
                                        <p className="text-sand-500 mb-4">Drag and drop files here or click upload</p>
                                        <p className="text-xs text-sand-400">Supports PDF, TXT, MD, DOCX</p>
                                    </div>
                                ) : (
                                    <div
                                        className={`space-y-2 ${isDragging ? 'opacity-50' : ''}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        {documents.map((doc) => (
                                            <div key={doc.id} className="bg-white rounded-xl border border-sand-200 p-4 hover:border-sand-300 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-sand-100 flex items-center justify-center">
                                                        <FileText className="w-5 h-5 text-sand-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-sand-800 truncate">{doc.title}</p>
                                                        <p className="text-xs text-sand-500">
                                                            {doc.file_type?.toUpperCase()} • {(doc.file_size / 1024).toFixed(1)} KB
                                                            {doc.chunk_count && ` • ${doc.chunk_count} chunks`}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${doc.status === 'processed' ? 'bg-emerald-100 text-emerald-700' :
                                                        doc.status === 'processing' ? 'bg-amber-100 text-amber-700' :
                                                            doc.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                                'bg-sand-100 text-sand-600'
                                                        }`}>
                                                        {doc.status}
                                                    </span>
                                                    <button
                                                        onClick={() => deleteDocument(doc.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete document"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Leaderboard Tab */}
                    {activeTab === 'leaderboard' && (
                        <div className="p-6">
                            <div className="max-w-4xl mx-auto">
                                <div className="mb-6">
                                    <h2 className="text-xl font-semibold text-sand-900">Knowledge Contributors</h2>
                                    <p className="text-sand-500 text-sm">Top contributors to the knowledge base</p>
                                </div>

                                {leaderboardEntries.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-2xl border border-sand-200">
                                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center">
                                            <Trophy className="w-7 h-7 text-amber-500" />
                                        </div>
                                        <h3 className="text-lg font-medium text-sand-800 mb-2">No contributors yet</h3>
                                        <p className="text-sand-500">Be the first to contribute!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {leaderboardEntries.map((entry, i) => (
                                            <div
                                                key={entry.id}
                                                className="bg-white rounded-xl border border-sand-200 p-4 hover:border-sand-300 transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-amber-100 text-amber-600' :
                                                        i === 1 ? 'bg-gray-100 text-gray-500' :
                                                            i === 2 ? 'bg-orange-100 text-orange-600' :
                                                                'bg-sand-100 text-sand-500'
                                                        } font-bold`}>
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sand-800">{entry.display_name}</p>
                                                        <p className="text-xs text-sand-500">{entry.total_docs_contributed} docs • {entry.contributor_score} pts</p>
                                                    </div>
                                                    <span className="text-lg">
                                                        {entry.contributor_rank === 'diamond' ? '👑' :
                                                            entry.contributor_rank === 'platinum' ? '💎' :
                                                                entry.contributor_rank === 'gold' ? '🥇' :
                                                                    entry.contributor_rank === 'silver' ? '🥈' :
                                                                        entry.contributor_rank === 'bronze' ? '🥉' : '🌱'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
