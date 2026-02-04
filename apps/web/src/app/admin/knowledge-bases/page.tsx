'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    BookOpen,
    Plus,
    Calendar,
    FileText
} from 'lucide-react';

export default function KnowledgeBasesListPage() {
    const [kbs, setKbs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/knowledge-bases')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setKbs(data);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Knowledge Bases</h1>
                    <p className="text-gray-500 mt-1">Manage shared knowledge repositories</p>
                </div>
                <Link
                    href="/admin/knowledge-bases/new"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition-all font-medium"
                >
                    <Plus className="w-5 h-5" /> Create New KB
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : kbs.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">No Knowledge Bases yet</h3>
                    <p className="text-gray-500 mt-2 mb-6">Create your first repository using the button above.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {kbs.map(kb => (
                        <div key={kb.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-6 flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <BookOpen className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                                    {kb.id.substring(0, 8)}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2">{kb.name}</h3>
                            <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-grow">
                                {kb.description || 'No description provided.'}
                            </p>

                            <div className="border-t pt-4 mt-auto">
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                    <Calendar className="w-4 h-4" />
                                    Created {new Date(kb.created_at).toLocaleDateString()}
                                </div>

                                <div className="flex gap-2">
                                    <Link
                                        href={`/admin/knowledge-bases/${kb.id}`}
                                        className="flex-1 text-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
                                    >
                                        Manage KB
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
