'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    FileText,
    Filter,
    MoreHorizontal,
    CheckCircle,
    AlertCircle,
    Clock,
    Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

interface Document {
    id: string;
    title: string;
    document_type: string;
    authority_level: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    chunk_count: number;
    created_at: string;
}

export default function KnowledgeBasePage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const supabase = createClient();

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const { data, error } = await supabase
                .from('knowledge_documents')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const statusColors = {
        completed: 'text-green-700 bg-green-50 ring-green-600/20',
        processing: 'text-blue-700 bg-blue-50 ring-blue-600/20',
        pending: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20',
        failed: 'text-red-700 bg-red-50 ring-red-600/20',
    };

    const statusIcons = {
        completed: CheckCircle,
        processing: Loader2,
        pending: Clock,
        failed: AlertCircle,
    };

    const filteredDocuments = documents.filter(doc =>
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.document_type.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="lg:pl-64 h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage acts, circulars, and documents for the AI.
                        </p>
                    </div>
                    <Link href="/admin/knowledge/upload" className="btn-primary gap-2">
                        <Plus className="w-4 h-4" />
                        Add Document
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input pl-9"
                        />
                    </div>
                    <button className="btn-outline gap-2 text-gray-600">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0">
                        <tr>
                            <th className="px-8 py-3 w-8"><input type="checkbox" className="rounded" /></th>
                            <th className="px-4 py-3">Document Title</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Authority</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Uploaded</th>
                            <th className="px-8 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-8 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                                        <span>Loading documents...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredDocuments.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-8 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="w-8 h-8 text-gray-300" />
                                        <span className="font-medium text-gray-900">No documents found</span>
                                        <span className="text-sm">Upload your first document to get started.</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredDocuments.map((doc) => {
                                const StatusIcon = statusIcons[doc.status];
                                return (
                                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-4"><input type="checkbox" className="rounded" /></td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded bg-primary-50 text-primary-600 mt-0.5">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{doc.title}</p>
                                                    <p className="text-xs text-gray-500">{doc.chunk_count} chunks</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                                                {doc.document_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1">
                                                <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary-600 rounded-full"
                                                        style={{ width: `${doc.authority_level * 10}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500">{doc.authority_level}/10</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${statusColors[doc.status]}`}>
                                                <StatusIcon className={`w-3.5 h-3.5 ${doc.status === 'processing' ? 'animate-spin' : ''}`} />
                                                <span className="capitalize">{doc.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500">
                                            {format(new Date(doc.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
