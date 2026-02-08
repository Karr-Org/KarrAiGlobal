'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, AlertCircle, CheckCircle, BookOpen, Sparkles } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: { title: string; excerpt: string }[];
    confidence?: number;
    chunksUsed?: number;
}

export default function TestChatPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /></div>}>
            <TestChatContent />
        </Suspense>
    );
}

function TestChatContent() {
    const searchParams = useSearchParams();
    const productId = searchParams.get('productId');
    const productName = searchParams.get('name') || 'Product';

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || !productId || loading) return;

        const userMessage = input.trim();
        setInput('');
        setError(null);
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userMessage,
                    productId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Chat failed');
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.answer,
                sources: data.sources,
                confidence: data.confidence,
                chunksUsed: data.chunksUsed,
            }]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">🧪 RAG Test: {productName}</h1>
                        <p className="text-xs text-gray-500">Testing knowledge base retrieval</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <span>Powered by Gemini + Your Knowledge Base</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-primary-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Test Your RAG System</h2>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Ask questions about your uploaded documents. The AI will retrieve relevant chunks and generate answers based on YOUR knowledge base.
                        </p>
                        <div className="mt-6 text-sm text-gray-400">
                            <p className="font-medium text-gray-600 mb-2">Try questions like:</p>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setInput("What is the registration threshold for GST?")}
                                    className="block mx-auto px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
                                >
                                    "What is the registration threshold for GST?"
                                </button>
                                <button
                                    onClick={() => setInput("Explain the input tax credit mechanism")}
                                    className="block mx-auto px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
                                >
                                    "Explain the input tax credit mechanism"
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-3xl ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-white border'} rounded-2xl px-5 py-4 shadow-sm`}>
                            <div className="whitespace-pre-wrap">{msg.content}</div>

                            {/* RAG Metadata */}
                            {msg.role === 'assistant' && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    {/* Confidence & Chunks */}
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                        <span className="flex items-center gap-1">
                                            <CheckCircle className={`w-3 h-3 ${msg.confidence && msg.confidence > 0.7 ? 'text-green-500' : 'text-yellow-500'}`} />
                                            Confidence: {((msg.confidence || 0) * 100).toFixed(0)}%
                                        </span>
                                        <span>📄 {msg.chunksUsed} chunks retrieved</span>
                                    </div>

                                    {/* Sources */}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div>
                                            <div className="text-xs font-medium text-gray-600 mb-2">📚 Sources used:</div>
                                            <div className="space-y-2">
                                                {msg.sources.map((src, j) => (
                                                    <div key={j} className="bg-gray-50 rounded-lg p-3 text-xs">
                                                        <div className="font-medium text-gray-900">{src.title}</div>
                                                        <div className="text-gray-500 mt-1 line-clamp-2">{src.excerpt}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border rounded-2xl px-5 py-4 shadow-sm">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Searching knowledge base...</span>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex justify-center">
                        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t p-4">
                <div className="max-w-3xl mx-auto flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask a question about your knowledge base..."
                        className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        disabled={loading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
