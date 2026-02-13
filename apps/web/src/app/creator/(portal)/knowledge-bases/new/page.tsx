'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, X, FileText, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UploadedFile {
    file: File;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    progress: number;
    error?: string;
}

export default function CreatorNewKBPage() {
    const router = useRouter();
    const supabase = createClient();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [creating, setCreating] = useState(false);
    const [currentStep, setCurrentStep] = useState<'details' | 'uploading'>('details');
    const [error, setError] = useState<string | null>(null);

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
            setError('Some files skipped — only PDF, TXT, MD, DOCX are supported.');
        } else {
            setError(null);
        }

        setFiles(prev => [
            ...prev,
            ...validFiles.map(f => ({ file: f, status: 'pending' as const, progress: 0 }))
        ]);
    };

    const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

    const handleSubmit = async () => {
        if (!name.trim()) { setError('Knowledge Base name is required'); return; }
        if (files.length === 0) { setError('Please add at least one document'); return; }

        setCreating(true);
        setCurrentStep('uploading');
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Use API route (service role) to bypass RLS
            const createRes = await fetch('/api/knowledge-bases/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim(),
                    userId: user.id,
                }),
            });

            const createData = await createRes.json();
            if (!createRes.ok) throw new Error(createData.error || 'Failed to create Knowledge Base');

            const kb = createData.knowledgeBase;

            for (let i = 0; i < files.length; i++) {
                setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f));

                try {
                    const formData = new FormData();
                    formData.append('file', files[i].file);
                    formData.append('knowledgeBaseId', kb.id);
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

            setTimeout(() => {
                router.push('/creator/knowledge-bases');
                router.refresh();
            }, 1000);

        } catch (e: any) {
            setError(e.message);
            setCreating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-10 px-8">
            {/* Header */}
            <Link href="/creator/knowledge-bases" className="inline-flex items-center gap-1.5 text-[#8b8b8b] hover:text-[#2d2d2d] mb-6 text-[13px] transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
            </Link>

            <h1 className="text-xl font-semibold text-[#2d2d2d] mb-1">Create Knowledge Base</h1>
            <p className="text-[#8b8b8b] text-sm mb-8">Name your knowledge base and upload documents</p>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>{error}</div>
                </div>
            )}

            <div className="space-y-6">
                {/* Details */}
                <div>
                    <h2 className="text-[14px] font-medium text-[#2d2d2d] mb-3">Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="kbName" className="block text-[13px] font-medium text-[#2d2d2d] mb-1.5">
                                Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="kbName"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g., GST Returns Guide"
                                className="input"
                                disabled={creating}
                            />
                        </div>
                        <div>
                            <label htmlFor="kbDescription" className="block text-[13px] font-medium text-[#2d2d2d] mb-1.5">Description</label>
                            <textarea
                                id="kbDescription"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Optional description..."
                                className="input resize-none min-h-[80px]"
                                disabled={creating}
                            />
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#f0ece7]" />

                {/* Documents */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[14px] font-medium text-[#2d2d2d]">
                            Documents <span className="text-red-400">*</span>
                        </h2>
                        <span className="text-[11px] text-[#b5b0a9]">{files.length} files</span>
                    </div>

                    {/* Drop Zone */}
                    {!creating && (
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border border-dashed rounded-lg p-6 text-center transition-colors ${dragActive ? 'border-[#c4715b] bg-[#c4715b]/5' : 'border-[#e8e4df] hover:border-[#d4d0cb]'
                                }`}
                        >
                            <Upload className="w-5 h-5 text-[#b5b0a9] mx-auto mb-2" />
                            <p className="text-[13px] font-medium text-[#2d2d2d]">Drag & drop files here</p>
                            <p className="text-[12px] text-[#8b8b8b] mt-0.5 mb-3">PDF, MD, DOCX, TXT</p>
                            <label className="px-3 py-1.5 border border-[#e8e4df] rounded-lg text-[13px] font-medium text-[#2d2d2d] hover:bg-[#f4f1ed] cursor-pointer inline-flex transition-colors">
                                Browse Files
                                <input
                                    type="file"
                                    className="hidden"
                                    multiple
                                    onChange={handleFileInput}
                                    accept=".pdf,.txt,.md,.docx"
                                />
                            </label>
                        </div>
                    )}

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mt-4 space-y-1.5">
                            {files.map((f, i) => (
                                <div key={i} className="flex items-center px-3 py-2.5 bg-[#faf9f7] rounded-lg border border-[#f0ece7]">
                                    <FileText className="w-4 h-4 text-[#b5b0a9] mr-3 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium text-[#2d2d2d] truncate">{f.file.name}</p>
                                        <p className="text-[11px] text-[#b5b0a9]">{(f.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    {f.status === 'pending' && !creating && (
                                        <button onClick={() => removeFile(i)} className="p-1 hover:bg-[#e8e4df] rounded text-[#b5b0a9] hover:text-red-500 transition-colors" title="Remove file">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    {f.status === 'uploading' && <Loader2 className="w-4 h-4 text-[#c4715b] animate-spin" />}
                                    {f.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                    {f.status === 'error' && (
                                        <span className="text-red-500 text-[11px]" title={f.error}>
                                            Failed
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2 border-t border-[#f0ece7]">
                    <Link
                        href="/creator/knowledge-bases"
                        className={`px-4 py-2 rounded-lg border border-[#e8e4df] text-[#8b8b8b] text-[13px] font-medium hover:bg-[#f4f1ed] transition-colors ${creating ? 'pointer-events-none opacity-50' : ''}`}
                    >
                        Cancel
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={creating || !name.trim() || files.length === 0}
                        className="px-6 py-2 rounded-lg bg-[#c4715b] text-white text-[13px] font-medium hover:bg-[#b3624d] disabled:opacity-50 transition-colors min-w-[150px]"
                    >
                        {creating ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                {currentStep === 'details'
                                    ? 'Creating...'
                                    : `Uploading (${files.filter(f => f.status === 'completed').length}/${files.length})`
                                }
                            </span>
                        ) : (
                            'Create & Upload'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
