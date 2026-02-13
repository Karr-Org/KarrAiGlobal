'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Database, FileText, Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface KnowledgeBase {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    created_by: string | null;
    document_count?: number;
}

export default function CreatorKnowledgeBasesPage() {
    const supabase = createClient();
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        loadKBs();
    }, []);

    const loadKBs = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const res = await fetch(`/api/knowledge-bases?userId=${user.id}`);
            const data = await res.json();

            if (Array.isArray(data)) {
                // Document counts are fetched server-side now
                setKnowledgeBases(data.map((kb: any) => ({ ...kb, document_count: kb.document_count || 0 })));
            }
        } catch (err) {
            console.error('Failed to load KBs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (kbId: string) => {
        if (!confirm('Delete this Knowledge Base and all its documents? This cannot be undone.')) return;
        setDeleting(kbId);

        try {
            const res = await fetch(`/api/knowledge-bases/${kbId}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Delete failed');
            }
            setKnowledgeBases(prev => prev.filter(kb => kb.id !== kbId));
        } catch (err: any) {
            alert('Failed to delete: ' + err.message);
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 text-[#c4715b] animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-xl font-semibold text-[#2d2d2d]">Knowledge Bases</h1>
                    <p className="text-[#8b8b8b] text-sm mt-0.5">
                        Upload documents to power your AI products.
                    </p>
                </div>
                <Link
                    href="/creator/knowledge-bases/new"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#c4715b] text-white rounded-lg text-[13px] font-medium hover:bg-[#b3624d] transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Knowledge Base
                </Link>
            </div>

            {/* KB List */}
            {knowledgeBases.length === 0 ? (
                <div className="bg-white rounded-lg border border-[#e8e4df] p-10 text-center">
                    <Database className="w-8 h-8 text-[#b5b0a9] mx-auto mb-3" />
                    <h3 className="text-[15px] font-medium text-[#2d2d2d] mb-1">No knowledge bases yet</h3>
                    <p className="text-[#8b8b8b] mb-5 max-w-md mx-auto text-sm">
                        Create your first knowledge base by uploading documents. Your AI products will use these to answer questions.
                    </p>
                    <Link
                        href="/creator/knowledge-bases/new"
                        className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#c4715b] text-white rounded-lg text-sm font-medium hover:bg-[#b3624d] transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create Knowledge Base
                    </Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {knowledgeBases.map(kb => (
                        <div
                            key={kb.id}
                            className="bg-white rounded-lg border border-[#e8e4df] px-5 py-4 hover:border-[#c4715b]/30 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <Link
                                        href={`/creator/knowledge-bases/${kb.id}`}
                                        className="text-[14px] font-medium text-[#2d2d2d] hover:text-[#c4715b] transition-colors"
                                    >
                                        {kb.name}
                                    </Link>
                                    {kb.description && (
                                        <p className="text-[12px] text-[#8b8b8b] mt-0.5">{kb.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#b5b0a9]">
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            {kb.document_count} document{kb.document_count !== 1 ? 's' : ''}
                                        </span>
                                        <span>·</span>
                                        <span>
                                            Created {new Date(kb.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Link
                                        href={`/creator/knowledge-bases/${kb.id}`}
                                        className="px-2.5 py-1 text-[12px] text-[#c4715b] hover:bg-[#f4f1ed] rounded-lg transition-colors font-medium"
                                    >
                                        Manage
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(kb.id)}
                                        disabled={deleting === kb.id}
                                        className="p-1.5 text-[#b5b0a9] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Knowledge Base"
                                    >
                                        {deleting === kb.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
