'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, FileText, ThumbsUp, ThumbsDown, Copy, Check, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: { title: string; excerpt: string }[];
    confidence?: number;
    timestamp: Date;
}

interface Product {
    id: string;
    name: string;
    slug: string;
    primary_color: string;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchProducts = async () => {
        const { data } = await supabase
            .from('products')
            .select('id, name, slug, primary_color')
            .eq('status', 'active')
            .order('name');

        if (data && data.length > 0) {
            setProducts(data);
            setSelectedProduct(data[0]);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !selectedProduct || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: input,
                    productId: selectedProduct.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.answer,
                sources: data.sources,
                confidence: data.confidence,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error.message}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const suggestedQuestions = [
        `What are the key features of ${selectedProduct?.name || 'this product'}?`,
        `How can I get started?`,
        `What are the most common questions?`,
        `Tell me about the latest updates`,
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
            {/* Header */}
            <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 px-4 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">
                                {selectedProduct?.name || 'AI Assistant'}
                            </h1>
                            <p className="text-xs text-white/50">Powered by Karr AI</p>
                        </div>
                    </div>
                    {products.length > 1 && (
                        <select
                            value={selectedProduct?.id || ''}
                            onChange={(e) => setSelectedProduct(products.find(p => p.id === e.target.value) || null)}
                            className="bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/20"
                        >
                            {products.map(p => (
                                <option key={p.id} value={p.id} className="bg-slate-800">{p.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-400/20 to-blue-500/20 flex items-center justify-center">
                                <Sparkles className="w-10 h-10 text-teal-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Welcome to {selectedProduct?.name || 'AI Assistant'}
                            </h2>
                            <p className="text-white/60 mb-8 max-w-md mx-auto">
                                Ask me anything. I'll provide accurate answers based on official sources.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                                {suggestedQuestions.map((q: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(q)}
                                        className="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-500/50 transition-all group"
                                    >
                                        <p className="text-sm text-white/80 group-hover:text-white">{q}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-5 py-4 ${msg.role === 'user'
                                        ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                                        : 'bg-white/10 backdrop-blur-sm border border-white/10 text-white'
                                        }`}
                                >
                                    <div className="text-sm leading-relaxed">
                                        <ChatMarkdown content={msg.content} />
                                    </div>

                                    {/* Sources */}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-white/10">
                                            <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
                                                <FileText className="w-3 h-3" /> Sources ({msg.sources.length})
                                            </p>
                                            <div className="space-y-2">
                                                {msg.sources.slice(0, 3).map((source, i) => (
                                                    <div key={i} className="text-xs bg-white/5 rounded-lg p-2">
                                                        <p className="font-medium text-teal-400">{source.title}</p>
                                                        <p className="text-white/50 line-clamp-2 mt-1">{source.excerpt}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions for assistant messages */}
                                    {msg.role === 'assistant' && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <button
                                                onClick={() => copyToClipboard(msg.content, msg.id)}
                                                className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                                title="Copy"
                                            >
                                                {copied === msg.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                            <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-green-400 transition-colors">
                                                <ThumbsUp className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-red-400 transition-colors">
                                                <ThumbsDown className="w-4 h-4" />
                                            </button>
                                            {msg.confidence && (
                                                <span className="ml-auto text-xs text-white/30">
                                                    {Math.round(msg.confidence * 100)}% confident
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-4">
                                <div className="flex items-center gap-3 text-white/70">
                                    <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
                                    <span className="text-sm">Searching knowledge base...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="bg-white/5 backdrop-blur-lg border-t border-white/10 px-4 py-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-end gap-3">
                        <div className="flex-1 relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                placeholder={`Ask a question about ${selectedProduct?.name || 'this topic'}...`}
                                rows={1}
                                className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 pr-12 border border-white/20 focus:border-teal-500/50 focus:ring-0 focus:outline-none resize-none"
                                style={{ minHeight: '48px', maxHeight: '200px' }}
                            />
                        </div>
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || loading || !selectedProduct}
                            className="p-3 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-teal-500/25 transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-xs text-white/30 mt-2 text-center">
                        Responses are AI-generated. Always verify critical information with official sources.
                    </p>
                </div>
            </div>
        </div>
    );
}

/** Simple inline markdown renderer for the dark-themed chat page */
function ChatMarkdown({ content }: { content: string }) {
    if (!content) return null;
    const lines = content.split('\n');
    return (
        <>
            {lines.map((line, i) => {
                // Heading
                if (line.startsWith('## ')) {
                    return <h3 key={i} className="font-bold text-base mt-3 mb-1">{renderInline(line.slice(3))}</h3>;
                }
                if (line.startsWith('### ')) {
                    return <h4 key={i} className="font-semibold text-sm mt-2 mb-1">{renderInline(line.slice(4))}</h4>;
                }
                // Bullet
                if (/^[\-\*•]\s/.test(line)) {
                    return (
                        <div key={i} className="flex gap-2 ml-1">
                            <span className="text-teal-400 select-none">•</span>
                            <span>{renderInline(line.replace(/^[\-\*•]\s/, ''))}</span>
                        </div>
                    );
                }
                // Numbered list
                if (/^\d+[\.\)]\s/.test(line)) {
                    const num = line.match(/^(\d+)[\.\)]\s/)?.[1];
                    return (
                        <div key={i} className="flex gap-2 ml-1">
                            <span className="text-teal-400 select-none min-w-[1.2em]">{num}.</span>
                            <span>{renderInline(line.replace(/^\d+[\.\)]\s/, ''))}</span>
                        </div>
                    );
                }
                // Empty line
                if (line.trim() === '') return <div key={i} className="h-2" />;
                // Paragraph
                return <div key={i}>{renderInline(line)}</div>;
            })}
        </>
    );
}

function renderInline(text: string): React.ReactNode {
    if (!text) return null;
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;
    while (remaining.length > 0) {
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        const codeMatch = remaining.match(/`([^`]+)`/);
        const citationMatch = remaining.match(/\[(Source\s+\d+|\d+)\]/);
        const matches = [
            boldMatch ? { type: 'bold', match: boldMatch } : null,
            codeMatch ? { type: 'code', match: codeMatch } : null,
            citationMatch ? { type: 'citation', match: citationMatch } : null,
        ].filter(Boolean) as { type: string; match: RegExpMatchArray }[];
        if (matches.length === 0) { parts.push(remaining); break; }
        matches.sort((a, b) => (a.match.index || 0) - (b.match.index || 0));
        const earliest = matches[0];
        const idx = earliest.match.index || 0;
        if (idx > 0) parts.push(remaining.substring(0, idx));
        switch (earliest.type) {
            case 'bold': parts.push(<strong key={key++}>{earliest.match[1]}</strong>); break;
            case 'code': parts.push(<code key={key++} className="bg-white/10 text-teal-300 px-1.5 py-0.5 rounded text-xs font-mono">{earliest.match[1]}</code>); break;
            case 'citation': parts.push(<span key={key++} className="text-xs bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded-full font-medium">[{earliest.match[1]}]</span>); break;
        }
        remaining = remaining.substring(idx + earliest.match[0].length);
    }
    return <>{parts}</>;
}
