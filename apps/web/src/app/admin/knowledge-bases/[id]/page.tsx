'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Upload,
    FileText,
    Trash2,
    RefreshCw,
    Search,
    CheckCircle,
    AlertCircle,
    Loader2,
    X,
    Clock,
    Database,
    File,
    Eye
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Document {
    id: string;
    title: string;
    source_type: string;
    source_label?: string;
    document_type: string;
    status: string;
    chunk_count: number;
    created_at: string;
    contributor_name?: string;
    contributor_email?: string;
}

interface KnowledgeBase {
    id: string;
    name: string;
    description: string;
}

interface UploadFile {
    file: File;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
}

export default function ManageDocumentsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const kbId = params.id;
    const supabase = createClient();

    // State
    const [kb, setKb] = useState<KnowledgeBase | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState<'all' | 'upload' | 'user_suggestion'>('all');
    const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);

    // Upload State
    const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);

    // View Document Modal
    const [viewingDoc, setViewingDoc] = useState<{ id: string; title: string; content: string; loading: boolean } | null>(null);

    // Fetch KB and Documents
    useEffect(() => {
        if (!kbId) {
            router.push('/admin/knowledge-bases');
            return;
        }

        const fetchData = async () => {
            setLoading(true);

            // Get KB details
            const { data: kbData } = await supabase
                .from('knowledge_bases')
                .select('*')
                .eq('id', kbId)
                .single();

            if (!kbData) {
                router.push('/admin/knowledge-bases');
                return;
            }
            setKb(kbData);

            // Get documents
            const { data: docs } = await supabase
                .from('knowledge_documents')
                .select('*')
                .eq('knowledge_base_id', kbId)
                .order('created_at', { ascending: false });

            setDocuments(docs || []);
            setLoading(false);
        };

        fetchData();
    }, [kbId]);

    // Drag handlers
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.length) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    }, []);

    const addFiles = (files: File[]) => {
        const valid = files.filter(f =>
            f.name.match(/\.(pdf|txt|md|docx)$/i)
        );
        setUploadFiles(prev => [
            ...prev,
            ...valid.map(file => ({ file, status: 'pending' as const }))
        ]);
    };

    const removeFile = (index: number) => {
        setUploadFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Upload files
    const handleUpload = async () => {
        if (!kbId || uploadFiles.length === 0) return;

        setUploading(true);

        for (let i = 0; i < uploadFiles.length; i++) {
            setUploadFiles(prev => prev.map((f, idx) =>
                idx === i ? { ...f, status: 'uploading' } : f
            ));

            try {
                const formData = new FormData();
                formData.append('file', uploadFiles[i].file);
                formData.append('knowledgeBaseId', kbId);
                formData.append('documentType', 'general');
                formData.append('authorityLevel', '5');

                const res = await fetch('/api/knowledge/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Upload failed');
                }

                setUploadFiles(prev => prev.map((f, idx) =>
                    idx === i ? { ...f, status: 'completed' } : f
                ));
            } catch (err: any) {
                setUploadFiles(prev => prev.map((f, idx) =>
                    idx === i ? { ...f, status: 'error', error: err.message } : f
                ));
            }
        }

        setUploading(false);

        // Refresh documents list
        const { data: docs } = await supabase
            .from('knowledge_documents')
            .select('*')
            .eq('knowledge_base_id', kbId)
            .order('created_at', { ascending: false });
        setDocuments(docs || []);

        // Clear completed uploads after delay
        setTimeout(() => {
            setUploadFiles(prev => prev.filter(f => f.status === 'error'));
        }, 2000);
    };

    // Delete document
    const deleteDocument = async (docId: string) => {
        if (!confirm('Delete this document and all its chunks?')) return;

        await supabase.from('knowledge_chunks').delete().eq('document_id', docId);
        await supabase.from('knowledge_documents').delete().eq('id', docId);

        setDocuments(prev => prev.filter(d => d.id !== docId));
    };

    // Bulk delete
    const deleteSelected = async () => {
        if (selectedDocs.size === 0) return;
        if (!confirm(`Delete ${selectedDocs.size} selected documents?`)) return;

        setDeleting(true);

        for (const docId of selectedDocs) {
            await supabase.from('knowledge_chunks').delete().eq('document_id', docId);
            await supabase.from('knowledge_documents').delete().eq('id', docId);
        }

        setDocuments(prev => prev.filter(d => !selectedDocs.has(d.id)));
        setSelectedDocs(new Set());
        setDeleting(false);
    };

    // View document content
    const viewDocument = async (doc: Document) => {
        setViewingDoc({ id: doc.id, title: doc.title, content: '', loading: true });
        try {
            const res = await fetch(`/api/admin/document-content?documentId=${doc.id}&type=knowledge`);
            const data = await res.json();
            if (data.success && data.content) {
                setViewingDoc({ id: doc.id, title: doc.title, content: data.content, loading: false });
            } else {
                setViewingDoc({ id: doc.id, title: doc.title, content: 'No content available.', loading: false });
            }
        } catch (error) {
            setViewingDoc({ id: doc.id, title: doc.title, content: 'Failed to load content.', loading: false });
        }
    };

    // Filter documents
    const filteredDocs = documents.filter(d => {
        const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSource = sourceFilter === 'all' || d.source_type === sourceFilter;
        return matchesSearch && matchesSource;
    });

    // Stats by source
    const adminUploads = documents.filter(d => d.source_type === 'upload').length;
    const userContributions = documents.filter(d => d.source_type === 'user_suggestion').length;

    // Stats
    const totalChunks = documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/knowledge-bases" className="p-2 rounded-lg hover:bg-gray-100">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{kb?.name}</h1>
                        <p className="text-gray-500 text-sm">{kb?.description || 'No description'}</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4">
                    <div className="bg-blue-50 rounded-lg px-4 py-2 text-center">
                        <div className="text-2xl font-bold text-blue-700">{documents.length}</div>
                        <div className="text-xs text-blue-600">Documents</div>
                    </div>
                    <div className="bg-green-50 rounded-lg px-4 py-2 text-center">
                        <div className="text-2xl font-bold text-green-700">{totalChunks}</div>
                        <div className="text-xs text-green-600">Chunks</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg px-4 py-2 text-center" title="Knowledge from user contributions">
                        <div className="text-2xl font-bold text-emerald-700">{userContributions}</div>
                        <div className="text-xs text-emerald-600">User Contributions</div>
                    </div>
                </div>
            </div>

            {/* Documents Section */}
            <div className="card mb-8">
                <div className="card-header flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Documents</h2>
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm border rounded-lg w-64"
                            />
                        </div>

                        {/* Source Filter */}
                        <select
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value as any)}
                            className="px-3 py-2 text-sm border rounded-lg bg-white"
                        >
                            <option value="all">All Sources ({documents.length})</option>
                            <option value="upload">📤 Admin Uploads ({adminUploads})</option>
                            <option value="user_suggestion">👤 User Contributions ({userContributions})</option>
                        </select>

                        {/* Bulk Delete */}
                        {selectedDocs.size > 0 && (
                            <button
                                onClick={deleteSelected}
                                disabled={deleting}
                                className="btn-outline text-red-600 border-red-200 hover:bg-red-50"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Delete ({selectedDocs.size})
                            </button>
                        )}
                    </div>
                </div>

                <div className="card-body p-0">
                    {filteredDocs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No documents yet</p>
                            <p className="text-sm">Upload documents below to get started</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedDocs.size === filteredDocs.length && filteredDocs.length > 0}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedDocs(new Set(filteredDocs.map(d => d.id)));
                                                } else {
                                                    setSelectedDocs(new Set());
                                                }
                                            }}
                                            className="rounded"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chunks</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredDocs.map(doc => (
                                    <tr key={doc.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedDocs.has(doc.id)}
                                                onChange={(e) => {
                                                    const newSet = new Set(selectedDocs);
                                                    if (e.target.checked) {
                                                        newSet.add(doc.id);
                                                    } else {
                                                        newSet.delete(doc.id);
                                                    }
                                                    setSelectedDocs(newSet);
                                                }}
                                                className="rounded"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                                    <File className="w-4 h-4 text-gray-500" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 truncate max-w-xs">{doc.title}</div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {doc.source_type === 'user_suggestion' ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                                                                👤 {doc.contributor_name || 'User Contribution'}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-violet-100 text-violet-700">
                                                                📤 Admin Upload
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {doc.status === 'completed' || doc.status === 'ready' ? (
                                                <span className="badge-success flex items-center gap-1 w-fit">
                                                    <CheckCircle className="w-3 h-3" /> Processed
                                                </span>
                                            ) : doc.status === 'processing' ? (
                                                <span className="badge-warning flex items-center gap-1 w-fit">
                                                    <Loader2 className="w-3 h-3 animate-spin" /> Processing
                                                </span>
                                            ) : doc.status === 'pending' ? (
                                                <span className="badge-warning flex items-center gap-1 w-fit">
                                                    <Clock className="w-3 h-3" /> Pending
                                                </span>
                                            ) : (
                                                <span className="badge-error flex items-center gap-1 w-fit">
                                                    <AlertCircle className="w-3 h-3" /> Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-gray-700">{doc.chunk_count || 0}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => viewDocument(doc)}
                                                    className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                                                    title="View document content"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteDocument(doc.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Delete document"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Upload Section */}
            <div className="card">
                <div className="card-header">
                    <h2 className="text-lg font-semibold">Add Documents</h2>
                </div>
                <div className="card-body">
                    {/* Drop Zone */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
                            }`}
                    >
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="font-medium text-gray-900">Drag & Drop files here</p>
                        <p className="text-sm text-gray-500 mt-1 mb-4">PDF, DOCX, TXT, MD • Max 10MB each</p>
                        <label className="btn-outline cursor-pointer inline-flex">
                            Browse Files
                            <input
                                type="file"
                                className="hidden"
                                multiple
                                accept=".pdf,.txt,.md,.docx"
                                onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
                            />
                        </label>
                    </div>

                    {/* File List */}
                    {uploadFiles.length > 0 && (
                        <div className="mt-6 space-y-2">
                            {uploadFiles.map((f, i) => (
                                <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                    <File className="w-5 h-5 text-gray-400 mr-3" />
                                    <div className="flex-1">
                                        <div className="font-medium text-sm truncate">{f.file.name}</div>
                                        <div className="text-xs text-gray-500">{(f.file.size / 1024 / 1024).toFixed(2)} MB</div>
                                    </div>
                                    {f.status === 'pending' && (
                                        <button onClick={() => removeFile(i)} className="p-1 hover:bg-gray-200 rounded">
                                            <X className="w-4 h-4 text-gray-400" />
                                        </button>
                                    )}
                                    {f.status === 'uploading' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                                    {f.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                    {f.status === 'error' && (
                                        <span className="text-xs text-red-500">{f.error?.substring(0, 20)}...</span>
                                    )}
                                </div>
                            ))}

                            <button
                                onClick={handleUpload}
                                disabled={uploading || uploadFiles.every(f => f.status !== 'pending')}
                                className="btn-primary w-full mt-4"
                            >
                                {uploading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <Upload className="w-4 h-4" />
                                        Upload {uploadFiles.filter(f => f.status === 'pending').length} Files
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* View Document Modal */}
            {viewingDoc && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-violet-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">{viewingDoc.title}</h2>
                                    <p className="text-sm text-gray-500">Full Document Content</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingDoc(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-5">
                            {viewingDoc.loading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-4" />
                                    <p className="text-gray-500">Loading document content...</p>
                                </div>
                            ) : (
                                <div className="prose prose-sm max-w-none">
                                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed overflow-x-auto">
                                        {viewingDoc.content}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    {viewingDoc.content ? `${viewingDoc.content.length.toLocaleString()} characters` : ''}
                                </span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            if (confirm('Delete this document and all its chunks?')) {
                                                deleteDocument(viewingDoc.id);
                                                setViewingDoc(null);
                                            }
                                        }}
                                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => setViewingDoc(null)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
