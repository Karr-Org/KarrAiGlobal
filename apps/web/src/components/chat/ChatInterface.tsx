'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
    Check,
    Sparkles,
    ArrowLeft,
    Menu,
    Loader2
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
    error?: boolean;
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
    sessionId?: string;
    /** Optional suggested queries; if not provided, no suggestions shown */
    suggestedQueries?: string[];
    /** Optional placeholder text for the input */
    placeholder?: string;
    /** Optional welcome message; if not provided, a generic one is used */
    welcomeMessage?: string;
}

export function ChatInterface({
    productId,
    productName,
    userId,
    sessionId: initialSessionId,
    suggestedQueries,
    placeholder,
    welcomeMessage,
}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: welcomeMessage || `Welcome! 👋\n\nI'm your AI assistant for **${productName}**. How can I help you today?`,
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [viewingPresentation, setViewingPresentation] = useState<GammaPresentation | null>(null);
    const [viewerMode, setViewerMode] = useState<'view' | 'edit'>('view');
    const [copied, setCopied] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Build conversation history for the API
    const getConversationHistory = useCallback(() => {
        return messages
            .filter(m => m.id !== '1') // Skip welcome message
            .map(m => ({ role: m.role, content: m.content }));
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
        const currentInput = input.trim();
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
                            generationTopic: undefined,
                            error: true
                        };
                    }
                    return m;
                }));
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Real API call
        const assistantId = (Date.now() + 1).toString();

        try {
            const conversationHistory = getConversationHistory();

            const response = await fetch('/api/chat/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: currentInput,
                    productId,
                    userId: userId || undefined,
                    sessionId: sessionId || undefined,
                    conversationHistory,
                    enableWebSearch: false,
                    enableExtendedKnowledge: false,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Server error (${response.status})`);
            }

            // Extract session ID if returned
            if (data.sessionId && !sessionId) {
                setSessionId(data.sessionId);
            }

            // Map sources from API response
            const apiSources: Source[] = (data.sources || []).map((s: any, i: number) => ({
                title: s.title || s.document_title || `Source ${i + 1}`,
                type: s.type || s.source_type || 'KB',
                authorityLevel: s.authority_level || s.similarity || 0.8,
                preview: s.excerpt || s.content?.substring(0, 150) || '',
            }));

            const assistantMessage: Message = {
                id: assistantId,
                role: 'assistant',
                content: data.answer || data.response || 'I was unable to generate a response.',
                timestamp: new Date(),
                confidence: data.confidence || data.metadata?.confidence || null,
                sources: apiSources.length > 0 ? apiSources : undefined,
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error('[ChatInterface] API error:', error);

            // Determine error type for user-friendly message
            let errorContent = 'I encountered an error processing your request. Please try again.';
            if (error.message?.includes('429') || error.message?.includes('rate')) {
                errorContent = '⚠️ Too many requests. Please wait a moment and try again.';
            } else if (error.message?.includes('503') || error.message?.includes('exhausted')) {
                errorContent = '⚠️ The service is temporarily overloaded. Please try again in a few seconds.';
            } else if (error.message?.includes('timeout') || error.message?.includes('network')) {
                errorContent = '⚠️ Network error. Please check your connection and try again.';
            }

            const errorMessage: Message = {
                id: assistantId,
                role: 'assistant',
                content: errorContent,
                timestamp: new Date(),
                error: true,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

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
                                onCopy={copyToClipboard}
                                copied={copied}
                                onViewPresentation={(p) => {
                                    setViewingPresentation(p);
                                    setViewerMode('view');
                                }}
                            />
                        ))}

                        {isLoading && !messages.some(m => m.isStreaming) && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {messages.length === 1 && suggestedQueries && suggestedQueries.length > 0 && (
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
                                    placeholder={placeholder || `Ask anything about ${productName}...`}
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
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================

function MessageBubble({ message, onViewPresentation, onCopy, copied }: {
    message: Message;
    onViewPresentation: (p: GammaPresentation) => void;
    onCopy: (text: string, id: string) => void;
    copied: string | null;
}) {
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
                    : message.error
                        ? 'bg-red-50 border border-red-200 rounded-tl-none text-red-800'
                        : 'bg-white shadow-sm border rounded-tl-none'
                    }`}>
                    <div className="text-sm whitespace-pre-wrap">
                        <MarkdownContent content={message.content} isUser={isUser} />
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
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Sources & Actions for Assistant */}
                {!isUser && !message.error && (
                    <div className="mt-2 space-y-2">
                        {/* Sources Toggle */}
                        {message.sources && message.sources.length > 0 && (
                            <>
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
                            </>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onCopy(message.content, message.id)}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                title="Copy"
                            >
                                {copied === message.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Email this">
                                <Mail className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Export PDF">
                                <FileText className="w-4 h-4" />
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

// ============================================================================
// MARKDOWN RENDERER (proper, no dangerouslySetInnerHTML)
// ============================================================================

function MarkdownContent({ content, isUser }: { content: string; isUser?: boolean }) {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Code block
        if (line.startsWith('```')) {
            const lang = line.slice(3).trim();
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // skip closing ```
            elements.push(
                <pre key={elements.length} className="bg-gray-900 text-green-400 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono">
                    <code>{codeLines.join('\n')}</code>
                </pre>
            );
            continue;
        }

        // Heading ##
        if (line.startsWith('## ')) {
            elements.push(
                <h3 key={elements.length} className="font-bold text-base mt-3 mb-1">
                    {renderInline(line.slice(3))}
                </h3>
            );
            i++;
            continue;
        }

        // Heading ###
        if (line.startsWith('### ')) {
            elements.push(
                <h4 key={elements.length} className="font-semibold text-sm mt-2 mb-1">
                    {renderInline(line.slice(4))}
                </h4>
            );
            i++;
            continue;
        }

        // Bullet points (-, *, •)
        if (/^[\-\*•]\s/.test(line)) {
            elements.push(
                <div key={elements.length} className="flex gap-2 ml-1">
                    <span className="text-gray-400 select-none">•</span>
                    <span>{renderInline(line.replace(/^[\-\*•]\s/, ''))}</span>
                </div>
            );
            i++;
            continue;
        }

        // Numbered lists
        if (/^\d+[\.\)]\s/.test(line)) {
            const num = line.match(/^(\d+)[\.\)]\s/)?.[1];
            const text = line.replace(/^\d+[\.\)]\s/, '');
            elements.push(
                <div key={elements.length} className="flex gap-2 ml-1">
                    <span className="text-gray-400 select-none min-w-[1.2em]">{num}.</span>
                    <span>{renderInline(text)}</span>
                </div>
            );
            i++;
            continue;
        }

        // Empty line = spacing
        if (line.trim() === '') {
            elements.push(<div key={elements.length} className="h-2" />);
            i++;
            continue;
        }

        // Regular paragraph
        elements.push(
            <div key={elements.length}>
                {renderInline(line)}
            </div>
        );
        i++;
    }

    return <>{elements}</>;
}

/**
 * Render inline markdown: **bold**, *italic*, `code`, [links](url), [Source N] citations
 */
function renderInline(text: string): React.ReactNode {
    if (!text) return null;

    // Split by inline patterns
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        // Bold: **text**
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        // Italic: *text* (but not **)
        const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
        // Inline code: `text`
        const codeMatch = remaining.match(/`([^`]+)`/);
        // Link: [text](url)
        const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
        // Citation: [Source N] or [N]
        const citationMatch = remaining.match(/\[(Source\s+\d+|\d+)\]/);

        // Find the earliest match
        const matches = [
            boldMatch ? { type: 'bold', match: boldMatch } : null,
            italicMatch ? { type: 'italic', match: italicMatch } : null,
            codeMatch ? { type: 'code', match: codeMatch } : null,
            linkMatch ? { type: 'link', match: linkMatch } : null,
            citationMatch ? { type: 'citation', match: citationMatch } : null,
        ].filter(Boolean) as { type: string; match: RegExpMatchArray }[];

        if (matches.length === 0) {
            parts.push(remaining);
            break;
        }

        // Sort by position (earliest first)
        matches.sort((a, b) => (a.match.index || 0) - (b.match.index || 0));
        const earliest = matches[0];
        const idx = earliest.match.index || 0;

        // Text before the match
        if (idx > 0) {
            parts.push(remaining.substring(0, idx));
        }

        switch (earliest.type) {
            case 'bold':
                parts.push(<strong key={key++}>{earliest.match[1]}</strong>);
                break;
            case 'italic':
                parts.push(<em key={key++}>{earliest.match[1]}</em>);
                break;
            case 'code':
                parts.push(
                    <code key={key++} className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-xs font-mono">
                        {earliest.match[1]}
                    </code>
                );
                break;
            case 'link':
                parts.push(
                    <a key={key++} href={earliest.match[2]} target="_blank" rel="noopener noreferrer"
                        className="text-primary-600 hover:underline">
                        {earliest.match[1]}
                    </a>
                );
                break;
            case 'citation':
                parts.push(
                    <span key={key++} className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full font-medium">
                        [{earliest.match[1]}]
                    </span>
                );
                break;
        }

        remaining = remaining.substring(idx + earliest.match[0].length);
    }

    return <>{parts}</>;
}
