'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface ChatSession {
    id: string;
    title: string | null;
    title_emoji: string | null;
    message_count: number;
}

interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
    created_at?: string;
}

interface UseCognitiveSessionOptions {
    productUserId: string;
    productId: string;
    onSessionChange?: (session: ChatSession | null) => void;
    autoSave?: boolean;
}

interface UseCognitiveSessionReturn {
    currentSession: ChatSession | null;
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;

    // Actions
    startNewSession: () => Promise<void>;
    loadSession: (sessionId: string) => Promise<void>;
    addMessage: (message: Omit<ChatMessage, 'id'>) => void;
    saveMessages: () => Promise<void>;

    // Session info
    sessionStats: {
        messageCount: number;
        lastMessageAt: string | null;
    };
}

/**
 * Hook for managing cognitive sessions in chat components
 */
export function useCognitiveSession({
    productUserId,
    productId,
    onSessionChange,
    autoSave = true,
}: UseCognitiveSessionOptions): UseCognitiveSessionReturn {
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingMessagesRef = useRef<ChatMessage[]>([]);

    // Start a new session
    const startNewSession = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/cognitive/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productUserId,
                    productId,
                    forceNew: true,
                }),
            });

            const data = await response.json();

            if (data.session) {
                setCurrentSession(data.session);
                setMessages([]);
                onSessionChange?.(data.session);
            } else {
                setError('Failed to create new session');
            }
        } catch (err) {
            setError('Failed to create session');
            console.error('Error creating session:', err);
        } finally {
            setIsLoading(false);
        }
    }, [productUserId, productId, onSessionChange]);

    // Load an existing session
    const loadSession = useCallback(async (sessionId: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`/api/cognitive/sessions/${sessionId}`);
            const data = await response.json();

            if (data.session) {
                setCurrentSession(data.session);
                setMessages(data.messages || []);
                onSessionChange?.(data.session);
            } else {
                setError('Session not found');
            }
        } catch (err) {
            setError('Failed to load session');
            console.error('Error loading session:', err);
        } finally {
            setIsLoading(false);
        }
    }, [onSessionChange]);

    // Add a message locally
    const addMessage = useCallback((message: Omit<ChatMessage, 'id'>) => {
        const newMessage: ChatMessage = {
            ...message,
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, newMessage]);
        pendingMessagesRef.current.push(newMessage);

        // Auto-save after short delay
        if (autoSave && currentSession) {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
                saveMessages();
            }, 1000);
        }
    }, [autoSave, currentSession]);

    // Save pending messages to backend
    const saveMessages = useCallback(async () => {
        if (!currentSession || pendingMessagesRef.current.length === 0) return;

        const messagesToSave = [...pendingMessagesRef.current];
        pendingMessagesRef.current = [];

        try {
            // Save each message
            for (const msg of messagesToSave) {
                await fetch(`/api/cognitive/sessions/${currentSession.id}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        role: msg.role,
                        content: msg.content,
                        sources: msg.sources,
                    }),
                });
            }

            // After 3+ messages, generate title if not set
            const totalMessages = messages.length;
            if (totalMessages >= 3 && !currentSession.title) {
                await fetch(`/api/cognitive/sessions/${currentSession.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'extract' }),
                });
            }
        } catch (err) {
            console.error('Error saving messages:', err);
            // Put messages back in pending queue
            pendingMessagesRef.current = [...messagesToSave, ...pendingMessagesRef.current];
        }
    }, [currentSession, messages.length]);

    // Initialize session on mount
    useEffect(() => {
        if (productUserId && productId && !currentSession) {
            // Get or create active session
            fetch('/api/cognitive/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productUserId,
                    productId,
                    forceNew: false,
                }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.session) {
                        setCurrentSession(data.session);
                        onSessionChange?.(data.session);

                        // If session has messages, load them
                        if (data.session.message_count > 0) {
                            loadSession(data.session.id);
                        }
                    }
                })
                .catch(err => {
                    console.error('Error initializing session:', err);
                });
        }
    }, [productUserId, productId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            // Save any pending messages
            if (pendingMessagesRef.current.length > 0) {
                saveMessages();
            }
        };
    }, [saveMessages]);

    // Session stats
    const sessionStats = {
        messageCount: messages.length,
        lastMessageAt: messages.length > 0
            ? messages[messages.length - 1].created_at || null
            : null,
    };

    return {
        currentSession,
        messages,
        isLoading,
        error,
        startNewSession,
        loadSession,
        addMessage,
        saveMessages,
        sessionStats,
    };
}

export default useCognitiveSession;
