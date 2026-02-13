'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Send,
    Mic,
    Paperclip,
    MoreVertical,
    ChevronDown,
    ThumbsUp,
    ThumbsDown,
    Mail,
    FileText,
    Copy,
    Sparkles,
    ArrowLeft,
    Menu
} from 'lucide-react';
import Link from 'next/link';
import { generatePresentation } from '@/lib/gamma/generator';
import type { GammaPresentation } from '@/lib/gamma/types';
import { GammaChatCard, parsePresentationRequest, PresentationGenerating } from '@/components/gamma/GammaChatIntegration';
import GammaViewer from '@/components/gamma/GammaViewer';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    sources?: Source[];
    confidence?: number;
    isStreaming?: boolean;
    presentation?: GammaPresentation;
    generationTopic?: string;
}

interface Source {
    title: string;
    type: string;
    authorityLevel: number;
    preview: string;
}

interface ChatInterfaceProps {
    productId: string;
    productName: string;
    userId?: string;
}

export function ChatInterface({ productId, productName, userId }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: `Welcome to ${productName}! 👋\n\nI'm your AI assistant for all GST-related queries. I can help you with:\n\n• **GST rates and classifications**\n• **Input Tax Credit (ITC) rules**\n• **Returns filing (GSTR-1, GSTR-3B, etc.)**\n• **Compliance requirements**\n• **Circulars and notifications**\n\nHow can I assist you today?`,
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [viewingPresentation, setViewingPresentation] = useState<GammaPresentation | null>(null);
    const [viewerMode, setViewerMode] = useState<'view' | 'edit'>('view');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Check for presentation request
        const presentationRequest = parsePresentationRequest(userMessage.content);

        if (presentationRequest.shouldGenerate) {
            // Add generating placeholder
            const generatingId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, {
                id: generatingId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                generationTopic: presentationRequest.topic || 'presentation',
                isStreaming: true
            }]);

            try {
                // Generate presentation
                const presentation = await generatePresentation({
                    topic: presentationRequest.topic || 'Untitled',
                    cardCount: presentationRequest.cardCount || 5,
                    theme: presentationRequest.theme as any || 'midnight',
                    audience: presentationRequest.audience || 'General Audience',
                    tone: (presentationRequest.tone || 'professional') as any,
                    productId,
                    userId: userId || 'anonymous',
                    style: 'photorealistic',
                    includeImages: true
                });

                // Update message with result
                setMessages(prev => prev.map(m => {
                    if (m.id === generatingId) {
                        return {
                            ...m,
                            content: `I've created a presentation about **${presentationRequest.topic}** for you.`,
                            presentation,
                            isStreaming: false,
                            generationTopic: undefined
                        };
                    }
                    return m;
                }));
            } catch (error) {
                console.error('Generation failed:', error);
                setMessages(prev => prev.map(m => {
                    if (m.id === generatingId) {
                        return {
                            ...m,
                            content: 'Sorry, I encountered an error while generating the presentation. Please try again.',
                            isStreaming: false,
                            generationTopic: undefined
                        };
                    }
                    return m;
                }));
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Simulate AI response (in production, this calls the actual API)
        setTimeout(() => {
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: generateMockResponse(userMessage.content),
                timestamp: new Date(),
                confidence: 0.92,
                sources: [
                    {
                        title: 'CGST Act, 2017 - Section 16',
                        type: 'Act',
                        authorityLevel: 10,
                        preview: 'Subject to section 49, every registered person shall...',
                    },
                    {
                        title: 'Circular No. 184/16/2022-GST',
                        type: 'Circular',
                        authorityLevel: 8,
                        preview: 'Clarification on issues related to ITC claims...',
                    },
                ],
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
        }, 1500);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const suggestedQueries = [
        "What is the GST rate for restaurant services?",
        "How to claim ITC on capital goods?",
        "When is GSTR-3B due date?",
        "Can I claim ITC on office rent?"
    ];

    return (
        <div className="flex h-full bg-gray-50">
            {/* Sidebar - Mobile */}
            {showSidebar && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)} />
                    <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
                        <div className="p-4 border-b">
                            <h3 className="font-semibold text-gray-900">Conversations</h3>
                        </div>
                        <div className="p-2">
                            <button className="w-full text-left px-3 py-2 rounded-lg bg-primary-50 text-primary-700">
                                New Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar - Desktop */}
            <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-white">
                <div className="p-4 border-b">
                    <button className="btn-primary w-full">
                        + New Chat
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    <div className="text-xs text-gray-500 px-3 py-2">Today</div>
                    <button className="w-full text-left px-3 py-2 rounded-lg bg-primary-50 text-primary-700 text-sm">
                        Current Conversation
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
                    <div className="flex items-center gap-3">
                        <button
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                            onClick={() => setShowSidebar(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <Link href="/" className="p-2 rounded-lg hover:bg-gray-100">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-gray-900">{productName}</span>
                        </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-gray-100">
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                        {messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                onViewPresentation={(p) => {
                                    setViewingPresentation(p);
                                    setViewerMode('view');
                                }}
                            />
                        ))}

                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {messages.length === 1 && (
                            <div className="mt-8">
                                <p className="text-sm text-gray-500 mb-3">Try asking:</p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedQueries.map((query, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(query)}
                                            className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 transition-colors"
                                        >
                                            {query}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="border-t bg-white px-4 py-3">
                    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                        <div className="flex items-end gap-2">
                            <button
                                type="button"
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                                title="Attach file"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>

                            <div className="flex-1 relative">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask anything about GST..."
                                    rows={1}
                                    className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 pr-12 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    style={{ maxHeight: '120px' }}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                                    title="Voice input"
                                >
                                    <Mic className="w-5 h-5" />
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="p-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 text-center mt-2">
                            Karr AI can make mistakes. Verify important information.
                        </p>
                    </form>
                </div>
            </div>

            {/* Gamma Viewer Overlay */}
            {viewingPresentation && (
                <div className="fixed inset-0 z-[100]">
                    <GammaViewer
                        presentation={viewingPresentation}
                        mode={viewerMode}
                        onClose={() => setViewingPresentation(null)}
                        onEdit={() => setViewerMode('edit')}
                        onSave={(updated) => {
                            // Update the presentation in messages state
                            setMessages(prev => prev.map(m =>
                                m.presentation?.id === updated.id
                                    ? { ...m, presentation: updated }
                                    : m
                            ));
                            setViewingPresentation(updated);
                        }}
                        userId={userId}
                    />
                </div>
            )}
        </div>
    );
}

function MessageBubble({ message, onViewPresentation }: { message: Message; onViewPresentation: (p: GammaPresentation) => void }) {
    const [showSources, setShowSources] = useState(false);
    const isUser = message.role === 'user';

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} chat-message`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isUser
                ? 'bg-gray-200'
                : 'bg-gradient-to-br from-primary-500 to-secondary-500'
                }`}>
                {isUser ? (
                    <span className="text-sm font-medium text-gray-600">U</span>
                ) : (
                    <Sparkles className="w-4 h-4 text-white" />
                )}
            </div>

            {/* Message Content */}
            <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
                <div className={`inline-block rounded-2xl px-4 py-3 ${isUser
                    ? 'bg-primary-600 text-white rounded-tr-none'
                    : 'bg-white shadow-sm border rounded-tl-none'
                    }`}>
                    <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none">
                        {formatContent(message.content)}
                    </div>

                    {message.isStreaming && message.generationTopic && (
                        <div className="mt-3">
                            <PresentationGenerating topic={message.generationTopic} />
                        </div>
                    )}

                    {message.presentation && (
                        <div className="mt-3">
                            <GammaChatCard
                                presentation={message.presentation}
                                onOpenViewer={() => onViewPresentation(message.presentation!)}
                                onEdit={() => {
                                    onViewPresentation(message.presentation!);
                                    // Mode will be set by the parent handler if logic allows, 
                                    // or passing specific mode callback needed.
                                    // For now GammaChatCard just opens viewer.
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Sources & Actions for Assistant */}
                {!isUser && message.sources && message.sources.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {/* Sources Toggle */}
                        <button
                            onClick={() => setShowSources(!showSources)}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Sources ({message.sources.length})</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSources ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Sources List */}
                        {showSources && (
                            <div className="space-y-2 animate-fade-in">
                                {message.sources.map((source, i) => (
                                    <div key={i} className="bg-gray-50 rounded-lg p-3 text-xs">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900">{source.title}</span>
                                            <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                                                {source.type}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 line-clamp-2">{source.preview}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Email this">
                                <Mail className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Export PDF">
                                <FileText className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Copy">
                                <Copy className="w-4 h-4" />
                            </button>
                            <div className="w-px h-4 bg-gray-200 mx-1" />
                            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-green-600" title="Helpful">
                                <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600" title="Not helpful">
                                <ThumbsDown className="w-4 h-4" />
                            </button>

                            {message.confidence && (
                                <span className="ml-2 text-xs text-gray-400">
                                    {Math.round(message.confidence * 100)}% confidence
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function formatContent(content: string): React.ReactNode {
    // Simple markdown-like formatting with XSS protection
    return content.split('\n').map((line, i) => {
        // Escape HTML entities first to prevent XSS
        line = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        // Then apply safe formatting (bold only)
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Bullet points
        if (line.startsWith('• ')) {
            return <div key={i} className="flex gap-2"><span>•</span><span dangerouslySetInnerHTML={{ __html: line.slice(2) }} /></div>;
        }
        return <div key={i} dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />;
    });
}

function generateMockResponse(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('itc') || lowerQuery.includes('input tax credit') || lowerQuery.includes('office rent')) {
        return `Yes, you can claim **Input Tax Credit (ITC)** on office rent, subject to the following conditions:

**Eligibility Criteria:**
• The rent must be for **business purposes**
• You must have a valid **tax invoice** from the landlord
• The landlord must be GST-registered if their turnover exceeds ₹20 lakhs
• The property should not be used for personal purposes

**Key Points:**
• ITC is available under Section 16 of CGST Act
• Commercial rent attracts **18% GST**
• Ensure the landlord's GSTIN is valid and active
• ITC must be claimed within the due date of filing September return of the following year

**Documentation Required:**
• GST-compliant tax invoice
• Rent agreement
• Bank payment proof (for amounts > ₹50,000)

Would you like me to help you with anything specific about ITC claims?`;
    }

    if (lowerQuery.includes('rate') || lowerQuery.includes('restaurant')) {
        return `**GST Rates for Restaurant Services:**

The GST rate depends on the type of restaurant:

**5% GST (without ITC):**
• Standalone restaurants (not in hotels with room tariff ≥ ₹7,500)
• Takeaway food
• Food delivery through apps

**18% GST (with ITC):**
• Restaurants in hotels with room tariff ≥ ₹7,500
• Outdoor catering services

**Note:** Most restaurants operate under the 5% composition scheme where ITC cannot be claimed.

Would you like more details on any specific scenario?`;
    }

    if (lowerQuery.includes('gstr-3b') || lowerQuery.includes('due date')) {
        return `**GSTR-3B Due Dates:**

GSTR-3B is a monthly/quarterly summary return. Here are the due dates:

**Monthly Filers:**
• Due by **20th of the following month**
• Example: January 2026 GSTR-3B due by February 20, 2026

**Quarterly Filers (QRMP Scheme):**
• Due by **22nd/24th of the month following the quarter**
• 22nd for taxpayers in Category I states
• 24th for taxpayers in Category II states

**Late Fee:**
• ₹50 per day (₹25 CGST + ₹25 SGST)
• Maximum ₹10,000 per return
• Nil returns: ₹20 per day (max ₹500)

**Interest on Late Payment:**
• 18% per annum on tax liability

Would you like me to help with filing GSTR-3B?`;
    }

    return `Thank you for your question about: "${query}"

I can help you with GST-related queries including:
• GST rates and classifications
• ITC (Input Tax Credit) rules
• Return filing procedures
• Compliance requirements
• Latest circulars and notifications

Could you please provide more specific details about your query so I can give you a more accurate answer?`;
}
