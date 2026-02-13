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

export default function NewKnowledgeBasePage() {
    const router = useRouter();
    const supabase = createClient();

    // KB State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    // File State
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [dragActive, setDragActive] = useState(false);

    // Global Process State
    const [creating, setCreating] = useState(false);
    const [currentStep, setCurrentStep] = useState<'details' | 'uploading'>('details');
    const [error, setError] = useState<string | null>(null);

    // Drag & Drop Handlers
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
        // Filter valid types (PDF, TXT, MD, DOCX)
        const validFiles = newFiles.filter(file => {
            const validTypes = [
                'application/pdf',
                'text/plain',
                'text/markdown',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];
            // Check extension as fallback
            const ext = file.name.split('.').pop()?.toLowerCase();
            const validExts = ['pdf', 'txt', 'md', 'docx'];

            return validTypes.includes(file.type) || (ext && validExts.includes(ext));
        });

        if (validFiles.length < newFiles.length) {
            setError('Some files were skipped due to invalid format. Only PDF, TXT, MD, DOCX supported.');
        } else {
            setError(null);
        }

        setFiles(prev => [
            ...prev,
            ...validFiles.map(f => ({
                file: f,
                status: 'pending' as const,
                progress: 0
            }))
        ]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Submission Logic
    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Knowledge Base name is required');
            return;
        }

        // Require at least one file
        if (files.length === 0) {
            setError('Please add at least one document to the Knowledge Base');
            return;
        }

        setCreating(true);
        setCurrentStep('uploading');
        setError(null);

        try {
            // Check for duplicate name first
            const { data: existing } = await supabase
                .from('knowledge_bases')
                .select('id')
                .ilike('name', name.trim())
                .single();

            if (existing) {
                throw new Error(`A Knowledge Base named "${name.trim()}" already exists. Please choose a different name.`);
            }

            // Get current user for ownership
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Create KB
            const { data: kb, error: kbError } = await supabase
                .from('knowledge_bases')
                .insert({
                    name: name.trim(),
                    description: description.trim(),
                    created_by: user.id,
                })
                .select()
                .single();

            if (kbError) throw new Error('Failed to create Knowledge Base: ' + kbError.message);


            // 2. Upload Files (if any)
            if (files.length > 0) {
                // Upload sequentially to avoid overwhelming server/browser
                for (let i = 0; i < files.length; i++) {
                    const fileObj = files[i];

                    // Update status to uploading
                    setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f));

                    try {
                        const formData = new FormData();
                        formData.append('file', fileObj.file);
                        formData.append('knowledgeBaseId', kb.id);
                        formData.append('documentType', 'general'); // Default
                        formData.append('authorityLevel', '5');      // Default

                        const res = await fetch('/api/knowledge/upload', {
                            method: 'POST',
                            body: formData,
                        });

                        const result = await res.json();
                        if (!res.ok) throw new Error(result.error || 'Upload failed');

                        // Update status to completed
                        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'completed' } : f));
                    } catch (err: any) {
                        console.error('Upload error:', err);
                        // Update status to error
                        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: err.message } : f));
                    }
                }
            }

            // 3. DONE
            // Wait a moment to show success
            setTimeout(() => {
                router.push('/admin/knowledge-bases');
                router.refresh();
            }, 1000);

        } catch (e: any) {
            console.error('Submission failed:', e);
            setError(e.message);
            setCreating(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/knowledge-bases" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Knowledge Base</h1>
                    <p className="text-gray-500 text-sm">Create a new repository and add initial documents</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>{error}</div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-8">
                {/* Step 1: Details */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="text-lg font-semibold text-gray-900">1. Details</h2>
                    </div>
                    <div className="card-body space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., GST Returns Guide"
                                className="input"
                                disabled={creating}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional description..."
                                className="input min-h-[100px]"
                                disabled={creating}
                            />
                        </div>
                    </div>
                </div>

                {/* Step 2: Documents */}
                <div className="card">
                    <div className="card-header flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">2. Documents <span className="text-red-500">*</span></h2>
                        <span className="text-xs text-gray-500">{files.length} files selected</span>
                    </div>
                    <div className="card-body">
                        {/* Drop Zone */}
                        {!creating && (
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <p className="font-medium text-gray-900">Drag & Drop files here</p>
                                <p className="text-sm text-gray-500 mt-1 mb-4">PDF, MD, DOCX, TXT up to 10MB</p>
                                <label className="btn-outline cursor-pointer inline-flex">
                                    Browse Files
                                    <input
                                        type="file"
                                        className="hidden"
                                        multiple
                                        onChange={handleFileInput}
                                        accept=".pdf,.txt,.md,.docx,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    />
                                </label>
                            </div>
                        )}

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="mt-6 space-y-3">
                                <h3 className="text-sm font-medium text-gray-700">Selected Files</h3>
                                {files.map((f, i) => (
                                    <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center mr-3 text-gray-500">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{f.file.name}</p>
                                            <p className="text-xs text-gray-500">{(f.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>

                                        {f.status === 'pending' && !creating && (
                                            <button onClick={() => removeFile(i)} className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}

                                        {f.status === 'uploading' && (
                                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                        )}
                                        {f.status === 'completed' && (
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        )}
                                        {f.status === 'error' && (
                                            <div className="text-red-500 text-xs text-right" title={f.error}>
                                                Failed: {f.error?.substring(0, 30)}...
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action */}
                <div className="flex justify-end gap-3 pt-4">
                    <Link href="/admin/knowledge-bases" className={`btn-ghost ${creating ? 'pointer-events-none opacity-50' : ''}`}>
                        Cancel
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={creating || !name.trim() || files.length === 0}
                        className="btn-primary min-w-[150px]"
                        title={files.length === 0 ? 'Add at least one document' : ''}
                    >
                        {creating ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {currentStep === 'details' ? 'Creating KB...' : `Uploading (${files.filter(f => f.status === 'completed').length}/${files.length})`}
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
