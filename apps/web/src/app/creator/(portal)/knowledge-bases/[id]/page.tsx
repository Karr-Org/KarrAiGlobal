'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, X, FileText, Loader2, CheckCircle, Trash2, AlertTriangle, RefreshCw, ChevronRight, Eye, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Document {
    id: string;
    title: string;
    status: string; // 'processing' | 'completed' | 'ready' | 'error'
    chunk_count: number;
    created_at: string;
    file_size_bytes?: number;
    error_message?: string;
}

interface KnowledgeBase {
    id: string;
    name: string;
    description: string;
    documents: Document[];
}

interface UploadedFile {
    file: File;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    progress: number;
    error?: string;
}

interface ChunkData {
    id: string;
    content: string;
    chunk_index: number;
    section_hierarchy?: string[];
}

export default function ManageKnowledgeBasePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const supabase = createClient();
    const [kb, setKb] = useState<KnowledgeBase | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Upload state
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deletingDoc, setDeletingDoc] = useState<string | null>(null);

    // Document viewer state
    const [viewingDoc, setViewingDoc] = useState<string | null>(null);
    const [chunks, setChunks] = useState<ChunkData[]>([]);
    const [loadingChunks, setLoadingChunks] = useState(false);
    const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set());

    useEffect(() => {
        loadKB();
    }, [params.id]);

    const loadKB = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/knowledge-bases/${params.id}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to load Knowledge Base');
            setKb(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Document Viewer ---
    const viewDocChunks = async (docId: string) => {
        if (viewingDoc === docId) {
            setViewingDoc(null);
            setChunks([]);
            return;
        }

        setViewingDoc(docId);
        setLoadingChunks(true);
        setExpandedChunks(new Set());

        try {
            const { data, error } = await supabase
                .from('knowledge_chunks')
                .select('id, content, chunk_index, section_hierarchy')
                .eq('document_id', docId)
                .order('chunk_index', { ascending: true })
                .limit(100);

            if (error) throw error;
            setChunks(data || []);
        } catch (err: any) {
            console.error('Failed to load chunks:', err);
            setChunks([]);
        } finally {
            setLoadingChunks(false);
        }
    };

    const toggleChunk = (index: number) => {
        setExpandedChunks(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    // --- Upload Handlers ---
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.length > 0) handleFiles(Array.from(e.dataTransfer.files));
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) handleFiles(Array.from(e.target.files));
    };

    const handleFiles = (newFiles: File[]) => {
        const validExts = ['pdf', 'txt', 'md', 'docx'];
        const validFiles = newFiles.filter(f => {
            const ext = f.name.split('.').pop()?.toLowerCase();
            return ext && validExts.includes(ext);
        });

        if (validFiles.length < newFiles.length) {
            alert('Some files skipped — only PDF, TXT, MD, DOCX are supported.');
        }

        setFiles(prev => [
            ...prev,
            ...validFiles.map(f => ({ file: f, status: 'pending' as const, progress: 0 }))
        ]);
    };

    const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

    const handleUpload = async () => {
        if (files.filter(f => f.status === 'pending').length === 0) return;

        setUploading(true);

        const pendingIndices = files.map((f, i) => f.status === 'pending' ? i : -1).filter(i => i !== -1);

        for (const i of pendingIndices) {
            setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f));

            try {
                const formData = new FormData();
                formData.append('file', files[i].file);
                formData.append('knowledgeBaseId', params.id);
                formData.append('documentType', 'general');
                formData.append('authorityLevel', '5');

                const res = await fetch('/api/knowledge/upload', {
                    method: 'POST',
                    body: formData,
                });

                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'Upload failed');

                setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'completed' } : f));
            } catch (err: any) {
                setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: err.message } : f));
            }
        }

        setUploading(false);
        loadKB(); // Refresh list
    };

    const handleDeleteDoc = async (docId: string) => {
        if (!confirm('Delete this document and all its chunks?')) return;
        setDeletingDoc(docId);

        try {
            // Delete chunks first, then document
            const { error: chunkErr } = await supabase
                .from('knowledge_chunks')
                .delete()
                .eq('document_id', docId);

            if (chunkErr) console.warn('Chunk delete warning:', chunkErr.message);

            const { error } = await supabase
                .from('knowledge_documents')
                .delete()
                .eq('id', docId);

            if (error) throw error;

            setKb(prev => prev ? {
                ...prev,
                documents: prev.documents.filter(d => d.id !== docId)
            } : null);

            if (viewingDoc === docId) {
                setViewingDoc(null);
                setChunks([]);
            }

        } catch (err: any) {
            alert('Failed to delete document: ' + err.message);
        } finally {
            setDeletingDoc(null);
        }
    };

    const isDocReady = (status: string) => status === 'completed' || status === 'ready';
    const isDocError = (status: string) => status === 'error';
    const isDocProcessing = (status: string) => status === 'processing';

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 text-[#c4715b] animate-spin" />
        </div>
    );

    if (error || !kb) return (
        <div className="max-w-4xl mx-auto py-10 px-8">
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error || 'Knowledge Base not found'}
            </div>
            <Link href="/creator/knowledge-bases" className="mt-4 inline-block text-sm text-[#8b8b8b] hover:text-[#2d2d2d]">
                &larr; Back to Knowledge Bases
            </Link>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-10 px-8">
            {/* Header */}
            <Link href="/creator/knowledge-bases" className="inline-flex items-center gap-1.5 text-[#8b8b8b] hover:text-[#2d2d2d] mb-6 text-[13px] transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
            </Link>

            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-xl font-semibold text-[#2d2d2d] mb-1">{kb.name}</h1>
                    {kb.description && <p className="text-[#8b8b8b] text-sm">{kb.description}</p>}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadKB}
                        className="p-2 text-[#8b8b8b] hover:text-[#2d2d2d] hover:bg-[#f4f1ed] rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Content: Documents List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[14px] font-medium text-[#2d2d2d]">Documents ({kb.documents.length})</h2>
                    </div>

                    {kb.documents.length === 0 ? (
                        <div className="text-center py-12 bg-[#faf9f7] rounded-lg border border-[#f0ece7] border-dashed">
                            <FileText className="w-8 h-8 text-[#b5b0a9] mx-auto mb-3" />
                            <p className="text-[#8b8b8b] text-sm">No documents yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {kb.documents.map(doc => (
                                <div key={doc.id}>
                                    <div className="bg-white px-4 py-3 rounded-lg border border-[#e8e4df] flex items-center justify-between group hover:border-[#d4d0cb] transition-colors">
                                        <div
                                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                                            onClick={() => isDocReady(doc.status) && viewDocChunks(doc.id)}
                                        >
                                            <div className={`p-2 rounded-lg ${isDocReady(doc.status) ? 'bg-green-50 text-green-600' :
                                                isDocError(doc.status) ? 'bg-red-50 text-red-600' :
                                                    'bg-yellow-50 text-yellow-600'
                                                }`}>
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] font-medium text-[#2d2d2d] truncate max-w-[200px] sm:max-w-xs" title={doc.title}>
                                                    {doc.title}
                                                </p>
                                                <div className="flex items-center gap-2 text-[11px] text-[#8b8b8b]">
                                                    <span>{(doc.file_size_bytes ? (doc.file_size_bytes / 1024 / 1024).toFixed(2) : '—')} MB</span>
                                                    <span>·</span>
                                                    <span className={
                                                        isDocReady(doc.status) ? 'text-green-600' :
                                                            isDocError(doc.status) ? 'text-red-600' :
                                                                'text-yellow-600'
                                                    }>
                                                        {isDocReady(doc.status) ? `✓ ${doc.chunk_count} chunks` :
                                                            isDocError(doc.status) ? '✗ Failed' : '⏳ Processing...'}
                                                    </span>
                                                </div>
                                                {doc.error_message && (
                                                    <p className="text-[11px] text-red-500 mt-0.5 truncate max-w-xs">{doc.error_message}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {isDocReady(doc.status) && (
                                                <button
                                                    onClick={() => viewDocChunks(doc.id)}
                                                    className="p-1.5 text-[#b5b0a9] hover:text-[#c4715b] hover:bg-[#fef6f0] rounded-lg transition-all"
                                                    title="View Content"
                                                >
                                                    {viewingDoc === doc.id ? (
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <Eye className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteDoc(doc.id)}
                                                disabled={deletingDoc === doc.id}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-[#b5b0a9] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Document"
                                            >
                                                {deletingDoc === doc.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Chunk Viewer */}
                                    {viewingDoc === doc.id && (
                                        <div className="mt-1 bg-[#faf9f7] rounded-lg border border-[#f0ece7] overflow-hidden">
                                            {loadingChunks ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="w-4 h-4 text-[#c4715b] animate-spin" />
                                                    <span className="ml-2 text-[12px] text-[#8b8b8b]">Loading chunks...</span>
                                                </div>
                                            ) : chunks.length === 0 ? (
                                                <div className="py-6 text-center text-[12px] text-[#8b8b8b]">
                                                    No chunks found for this document.
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="px-4 py-2 border-b border-[#f0ece7] flex items-center justify-between">
                                                        <span className="text-[11px] font-medium text-[#8b8b8b]">
                                                            {chunks.length} chunks (showing first 100)
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                if (expandedChunks.size === chunks.length) {
                                                                    setExpandedChunks(new Set());
                                                                } else {
                                                                    setExpandedChunks(new Set(chunks.map((_, i) => i)));
                                                                }
                                                            }}
                                                            className="text-[11px] text-[#c4715b] hover:underline"
                                                        >
                                                            {expandedChunks.size === chunks.length ? 'Collapse All' : 'Expand All'}
                                                        </button>
                                                    </div>
                                                    <div className="max-h-[500px] overflow-y-auto">
                                                        {chunks.map((chunk, idx) => (
                                                            <div key={chunk.id} className="border-b border-[#f0ece7] last:border-b-0">
                                                                <button
                                                                    onClick={() => toggleChunk(idx)}
                                                                    className="w-full px-4 py-2 flex items-center justify-between hover:bg-[#f4f1ed] transition-colors text-left"
                                                                >
                                                                    <span className="text-[11px] font-medium text-[#2d2d2d]">
                                                                        Chunk {chunk.chunk_index + 1}
                                                                        {chunk.section_hierarchy?.length ? (
                                                                            <span className="ml-2 text-[#8b8b8b] font-normal">
                                                                                {chunk.section_hierarchy.join(' › ')}
                                                                            </span>
                                                                        ) : null}
                                                                    </span>
                                                                    <ChevronRight className={`w-3 h-3 text-[#b5b0a9] transition-transform ${expandedChunks.has(idx) ? 'rotate-90' : ''}`} />
                                                                </button>
                                                                {expandedChunks.has(idx) && (
                                                                    <div className="px-4 pb-3">
                                                                        <pre className="text-[11px] text-[#2d2d2d] whitespace-pre-wrap font-mono bg-white p-3 rounded border border-[#e8e4df] max-h-[300px] overflow-y-auto leading-relaxed">
                                                                            {chunk.content}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar: Upload */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg border border-[#e8e4df] p-5 sticky top-6">
                        <h3 className="text-[13px] font-medium text-[#2d2d2d] mb-4">Add Documents</h3>

                        {/* Drop Zone */}
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border border-dashed rounded-lg p-6 text-center transition-colors mb-4 ${dragActive ? 'border-[#c4715b] bg-[#c4715b]/5' : 'border-[#e8e4df] hover:border-[#d4d0cb]'
                                }`}
                        >
                            <Upload className="w-5 h-5 text-[#b5b0a9] mx-auto mb-2" />
                            <p className="text-[12px] font-medium text-[#2d2d2d]">Drag & drop or</p>
                            <p className="text-[12px] text-[#8b8b8b] mt-0.5 mb-3">PDF, MD, DOCX, TXT</p>
                            <label className="text-[#c4715b] hover:underline cursor-pointer text-[12px]">
                                browse files
                                <input
                                    type="file"
                                    className="hidden"
                                    multiple
                                    onChange={handleFileInput}
                                    accept=".pdf,.txt,.md,.docx"
                                />
                            </label>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="space-y-2 mb-4">
                                {files.map((f, i) => (
                                    <div key={i} className="flex items-center justify-between text-[12px] bg-[#faf9f7] px-2 py-1.5 rounded border border-[#f0ece7]">
                                        <p className="truncate max-w-[120px] text-[#2d2d2d]">{f.file.name}</p>
                                        <div className="flex items-center gap-2">
                                            {f.status === 'uploading' && <Loader2 className="w-3 h-3 text-[#c4715b] animate-spin" />}
                                            {f.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-500" />}
                                            {f.status === 'error' && <span className="text-red-500 text-[10px]">Failed</span>}
                                            {f.status === 'pending' && !uploading && (
                                                <button onClick={() => removeFile(i)} className="text-[#b5b0a9] hover:text-red-500" title="Remove file">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {files.some(f => f.status === 'pending') && (
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="w-full py-2 bg-[#c4715b] text-white text-[13px] font-medium rounded-lg hover:bg-[#b3624d] disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                            >
                                {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {uploading ? 'Uploading...' : 'Upload Files'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
