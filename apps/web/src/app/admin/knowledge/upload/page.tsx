'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Upload,
    FileText,
    AlertCircle,
    CheckCircle,
    X,
    Loader2,
    Plus
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UploadedFile {
    id: string;
    file: File;
    name: string;
    size: number;
    type: string;
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
    progress: number;
    error?: string;
}

interface Product {
    id: string;
    name: string;
    slug: string;
}

export default function UploadDocumentPage() {
    const [mode, setMode] = useState<'file' | 'text'>('file');
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    // Products
    const searchParams = useSearchParams();
    const preselectedKbId = searchParams.get('kbId');

    // KBs
    const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);
    const [selectedKb, setSelectedKb] = useState<string>('');
    const [loadingKbs, setLoadingKbs] = useState(true);

    // Text mode state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [docType, setDocType] = useState('circular');
    const [authority, setAuthority] = useState(5);

    // Fetch KBs on mount
    useEffect(() => {
        fetchKbs();
    }, []);

    const fetchKbs = async () => {
        try {
            const { data, error } = await supabase
                .from('knowledge_bases')
                .select('id, name')
                .order('name');

            if (error) throw error;
            setKnowledgeBases(data || []);

            if (preselectedKbId) {
                setSelectedKb(preselectedKbId);
            } else if (data && data.length > 0) {
                setSelectedKb(data[0].id);
            }
        } catch (e) {
            console.error('Failed to fetch KBs:', e);
        } finally {
            setLoadingKbs(false);
        }
    };



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

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const handleFiles = (newFiles: File[]) => {
        const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const maxSize = 10 * 1024 * 1024;

        const processedFiles: UploadedFile[] = newFiles
            .filter(file => {
                if (!validTypes.includes(file.type) && !file.name.endsWith('.txt')) {
                    setError(`${file.name}: Unsupported file type. Use PDF, DOCX, or TXT.`);
                    return false;
                }
                if (file.size > maxSize) {
                    setError(`${file.name}: File too large. Max 10MB.`);
                    return false;
                }
                return true;
            })
            .map(file => ({
                id: Math.random().toString(36).substring(7),
                file,
                name: file.name,
                size: file.size,
                type: file.type,
                status: 'pending' as const,
                progress: 0,
            }));

        setFiles(prev => [...prev, ...processedFiles]);
        setError(null);
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (type: string) => {
        if (type === 'application/pdf') return '📄';
        if (type.includes('word')) return '📝';
        return '📃';
    };

    const uploadFiles = async () => {
        if (files.length === 0 || !selectedKb) return;
        setUploading(true);
        setError(null);

        for (const fileObj of files) {
            try {
                setFiles(prev => prev.map(f =>
                    f.id === fileObj.id ? { ...f, status: 'uploading', progress: 10 } : f
                ));

                const formData = new FormData();
                formData.append('file', fileObj.file);
                formData.append('knowledgeBaseId', selectedKb);
                formData.append('documentType', docType);
                formData.append('authorityLevel', authority.toString());

                const response = await fetch('/api/knowledge/upload', {
                    method: 'POST',
                    body: formData,
                });

                setFiles(prev => prev.map(f =>
                    f.id === fileObj.id ? { ...f, progress: 50 } : f
                ));

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || 'Upload failed');
                }

                setFiles(prev => prev.map(f =>
                    f.id === fileObj.id ? { ...f, status: 'processing', progress: 75 } : f
                ));

                await response.json();

                setFiles(prev => prev.map(f =>
                    f.id === fileObj.id ? { ...f, status: 'completed', progress: 100 } : f
                ));

            } catch (err: any) {
                setFiles(prev => prev.map(f =>
                    f.id === fileObj.id ? { ...f, status: 'failed', error: err.message } : f
                ));
            }
        }

        setUploading(false);

        setTimeout(() => {
            const allCompleted = files.every(f => f.status === 'completed');
            if (allCompleted) {
                if (allCompleted) {
                    router.push('/admin/knowledge-bases');
                }
            }
        }, 1500);
    };

    const uploadText = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content || !selectedKb) {
            setError('Knowledge Base, title and content are required');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const response = await fetch('/api/knowledge/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    knowledgeBaseId: selectedKb,
                    documentType: docType,
                    authorityLevel: authority,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Upload failed');
            }

            router.push('/admin/knowledge-bases');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-4">
                <Link href="/admin/knowledge-bases" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Add Documents</h1>
                    <p className="text-sm text-gray-500">Upload files or paste text content</p>
                </div>
            </div>

            <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
                {/* Mode Toggle */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setMode('file')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'file'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Upload Files
                        </span>
                    </button>
                    <button
                        onClick={() => setMode('text')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'text'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Paste Text
                        </span>
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* KB Selection Card */}
                <div className="card mb-6">
                    <div className="card-header bg-primary-50">
                        <h2 className="text-sm font-semibold text-primary-900">Select Knowledge Base</h2>
                    </div>
                    <div className="card-body">
                        {loadingKbs ? (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading KBs...
                            </div>
                        ) : knowledgeBases.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-gray-500 mb-4">No Knowledge Bases found.</p>
                                <Link
                                    href="/admin/knowledge-bases/new"
                                    className="btn-primary inline-flex"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create KB
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <select
                                    value={selectedKb}
                                    onChange={(e) => setSelectedKb(e.target.value)}
                                    className="input flex-1"
                                >
                                    {knowledgeBases.map(kb => (
                                        <option key={kb.id} value={kb.id}>{kb.name}</option>
                                    ))}
                                </select>
                                <Link
                                    href="/admin/knowledge-bases/new"
                                    target='_blank'
                                    className="btn-outline text-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Settings Card */}
                <div className="card mb-6">
                    <div className="card-header bg-gray-50/50">
                        <h2 className="text-sm font-semibold text-gray-900">Document Settings</h2>
                    </div>
                    <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="input">
                                <option value="act">Act / Statute</option>
                                <option value="circular">Circular</option>
                                <option value="notification">Notification</option>
                                <option value="judgment">Court Judgment</option>
                                <option value="guide">Guide / FAQ</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Authority Level</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={authority}
                                    onChange={(e) => setAuthority(parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                />
                                <span className="text-sm font-bold w-6 text-center">{authority}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">10 = Supreme Court / Act, 1 = Blog</p>
                        </div>
                    </div>
                </div>

                {/* FILE UPLOAD MODE */}
                {mode === 'file' && (
                    <div className="space-y-6">
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
                                ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'}`}
                            onClick={() => document.getElementById('file-input')?.click()}
                        >
                            <input id="file-input" type="file" multiple accept=".pdf,.docx,.txt" onChange={handleFileInput} className="hidden" />
                            <div className="flex flex-col items-center gap-3">
                                <div className={`p-4 rounded-full ${dragActive ? 'bg-primary-100' : 'bg-gray-100'}`}>
                                    <Upload className={`w-8 h-8 ${dragActive ? 'text-primary-600' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-gray-900">{dragActive ? 'Drop files here' : 'Drag & drop files here'}</p>
                                    <p className="text-sm text-gray-500 mt-1">or <span className="text-primary-600 font-medium">browse</span> to select files</p>
                                </div>
                                <p className="text-xs text-gray-400">PDF, DOCX, TXT • Max 10MB each</p>
                            </div>
                        </div>

                        {files.length > 0 && (
                            <div className="card">
                                <div className="card-header bg-gray-50/50 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900">{files.length} file{files.length > 1 ? 's' : ''} selected</h3>
                                    <button onClick={() => setFiles([])} className="text-xs text-gray-500 hover:text-gray-700">Clear all</button>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {files.map((file) => (
                                        <div key={file.id} className="p-4 flex items-center gap-4">
                                            <div className="text-2xl">{getFileIcon(file.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                                {(file.status === 'uploading' || file.status === 'processing') && (
                                                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary-500 rounded-full transition-all duration-300" style={{ width: `${file.progress}%` }} />
                                                    </div>
                                                )}
                                                {file.error && <p className="text-xs text-red-600 mt-1">{file.error}</p>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {file.status === 'pending' && (
                                                    <button onClick={() => removeFile(file.id)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {file.status === 'uploading' && <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />}
                                                {file.status === 'processing' && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
                                                {file.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-600" />}
                                                {file.status === 'failed' && <AlertCircle className="w-5 h-5 text-red-600" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-4">
                            <Link href="/admin/knowledge" className="btn-ghost">Cancel</Link>
                            <button
                                onClick={uploadFiles}
                                disabled={files.length === 0 || uploading || !selectedKb}
                                className="btn-primary min-w-[140px]"
                            >
                                {uploading ? (
                                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Uploading...</span>
                                ) : (
                                    <span className="flex items-center gap-2"><Upload className="w-4 h-4" />Upload {files.length > 0 ? `(${files.length})` : ''}</span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* TEXT PASTE MODE */}
                {mode === 'text' && (
                    <form onSubmit={uploadText} className="space-y-6">
                        <div className="card">
                            <div className="card-header bg-gray-50/50">
                                <h2 className="text-sm font-semibold text-gray-900">Document Details</h2>
                            </div>
                            <div className="card-body space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                                    <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., CGST Act 2017 - Chapter III" className="input" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Content <span className="text-red-500">*</span></label>
                                    <textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste document content here..." rows={12} className="input font-mono text-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Link href="/admin/knowledge" className="btn-ghost">Cancel</Link>
                            <button type="submit" disabled={uploading || !selectedKb} className="btn-primary min-w-[140px]">
                                {uploading ? (
                                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Processing...</span>
                                ) : (
                                    <span className="flex items-center gap-2"><Upload className="w-4 h-4" />Add Document</span>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
