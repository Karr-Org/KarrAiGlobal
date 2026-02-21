'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Send,
    Loader2,
    FileText,
    Settings,
    LogOut,
    Plus,
    MessageSquare,
    BookOpen,
    ChevronDown,
    Sparkles,
    Upload,
    Menu,
    X,
    Home,
    Clock,
    Trash2,
    Building,
    Paperclip,
    Brain,
    Users,
    CheckCircle,
    File,
    FileCheck,
    AlertCircle,
    Zap,
    Trophy,
    ArrowLeft,
    Search,
    User,
    Globe,
    BookmarkCheck,
    Layers,
    Layout,
    Shield,
    Check,
    ChevronUp,
    PanelLeftClose,
    Type,
    Info,
    Edit2,
    Star,
    RotateCcw,
    ThumbsUp,
    ThumbsDown,
    Copy,
    Save,
    Presentation,
    Play,
    Share2,
    ExternalLink
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import { ProactiveInsights, WelcomeMessage } from '@/components/cognitive/ProactiveInsights';
import { ThinkingProcess, useThinkingState } from '@/components/chat/ThinkingProcess';
import type { ChatMode } from '@/components/chat/ThinkingProcess';
import { AIMessage } from '@/components/chat/PremiumMarkdownRenderer';
import type { InlineCitationData } from '@/components/chat/PremiumMarkdownRenderer';
import { useCognitiveSession } from '@/hooks/useCognitiveSession';
import KnowledgeGraphDashboard from '@/components/cognitive/KnowledgeGraphDashboard';
import CognitiveProfileDashboard from '@/components/cognitive/CognitiveProfileDashboard';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    metadata?: {
        taskDetected?: string;
        entityDetected?: string;
        sourcesUsed?: number;
        hasContextFile?: boolean;
    };
    kbWasEmpty?: boolean;
    inlineCitations?: InlineCitationData[];
}

interface Product {
    id: string;
    name: string;
    description: string;
    primary_color: string;
    slug: string;
}

interface ProductUser {
    id: string;
    product_id: string;
    display_name: string;
    role: string;
    contributor_score?: number;
    contributor_rank?: string;
    total_docs_contributed?: number;
    total_chunks_contributed?: number;
    contribution_streak?: number;
}

interface ChatSession {
    id: string;
    title: string | null;
    title_emoji?: string | null;
    summary?: string | null;
    message_count?: number;
    created_at: string;
    last_message_at?: string;
    is_starred?: boolean;
    is_pinned?: boolean;
}

export default function ProductDashboard({ params }: { params: { slug: string } }) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /></div>}>
            <ProductDashboardContent params={params} />
        </Suspense>
    );
}

function ProductDashboardContent({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const supabase = createClient();

    const [product, setProduct] = useState<Product | null>(null);
    const [productUser, setProductUser] = useState<ProductUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);

    const [sidebarOpen, setSidebarOpen] = useState(false); // Claude-style: collapsed by default, click to open
    const [showChatDropdown, setShowChatDropdown] = useState(false); // Chat title dropdown
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [loadingSession, setLoadingSession] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'chat' | 'clients'>('chat');
    const [documents, setDocuments] = useState<any[]>([]);
    const [leaderboardEntries, setLeaderboardEntries] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [entities, setEntities] = useState<any[]>([]);
    const [entityTypes, setEntityTypes] = useState<any[]>([]);
    const [contextFile, setContextFile] = useState<File | null>(null);
    const [showMemoryModal, setShowMemoryModal] = useState(false);
    const [memorySuggestions, setMemorySuggestions] = useState<any>(null);
    const [currentTask, setCurrentTask] = useState<string | null>(null);
    const [uploadQueue, setUploadQueue] = useState<{ file: File; status: 'pending' | 'uploading' | 'success' | 'error'; progress: number; message?: string }[]>([]);

    // Live Web Search toggle
    const [enableWebSearch, setEnableWebSearch] = useState(false);
    // Extended Knowledge toggle - allows Gemini general knowledge (default: OFF for strict KB mode)
    const [enableExtendedKnowledge, setEnableExtendedKnowledge] = useState(false);
    // AI Mode Selector dropdown visibility
    const [showModeSelector, setShowModeSelector] = useState(false);
    const [showCreateDropdown, setShowCreateDropdown] = useState(false);
    // Chat text size: 'normal' | 'large' | 'larger'
    const [chatTextSize, setChatTextSize] = useState<'normal' | 'large' | 'larger'>('normal');
    // Chat management states
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editingChatTitle, setEditingChatTitle] = useState('');
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
    const [editMessageContent, setEditMessageContent] = useState('');
    const [feedbackMap, setFeedbackMap] = useState<Record<number, 'positive' | 'negative' | null>>({});
    const [showPresentation, setShowPresentation] = useState(false);
    const [presentationContent, setPresentationContent] = useState('');
    // Gamma Presentation State
    const [viewingGammaPresentation, setViewingGammaPresentation] = useState<any | null>(null);
    const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false);

    // Close dropdown on Escape
    // Close dropdown on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showChatDropdown) setShowChatDropdown(false);
                if (showModeSelector) setShowModeSelector(false);
                if (showCreateDropdown) setShowCreateDropdown(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showChatDropdown, showModeSelector, showCreateDropdown]);

    // Adaptive Intelligence State
    const [welcomeMessage, setWelcomeMessage] = useState<{
        greeting: string;
        message: string;
        suggestions: Array<{ label: string; action: string }>;
        expertiseLevel?: string;
    } | null>(null);
    const [insights, setInsights] = useState<any[]>([]);

    // Helper to format chat titles to sentence case while preserving acronyms
    const formatChatTitle = (title: string | null | undefined) => {
        if (!title) return '';
        return title.split(' ').map((word, i) => {
            // Keep acronyms (e.g. GST, AI, USA) - check if it has 2+ capitals
            if ((word.match(/[A-Z]/g) || []).length > 1) return word;
            // Otherwise lowercase, unless it's the first word
            const lower = word.toLowerCase();
            if (i === 0) return lower.charAt(0).toUpperCase() + lower.slice(1);
            return lower;
        }).join(' ');
    };

    const [isDragging, setIsDragging] = useState(false);
    const [uploadStage, setUploadStage] = useState<string>('');
    const processingMessages = [
        '📄 Extracting text from document...',
        '✂️ Breaking into searchable chunks...',
        '🧠 Generating AI embeddings...',
        '🔍 Analyzing content relevance...',
        '💡 Detecting unique knowledge...',
        '📚 Indexing for instant retrieval...'
    ];
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    // OmniForge Phase 3: Thinking Process State
    const thinkingHook = useThinkingState();

    useEffect(() => {
        initDashboard();
    }, [params.slug]);

    const initDashboard = async () => {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push(`/p/${params.slug}/auth`);
            return;
        }

        const productRes = await fetch(`/api/products/by-slug/${params.slug}`);
        const productData = await productRes.json();
        if (productData.error) {
            router.push(`/p/${params.slug}`);
            return;
        }
        setProduct(productData);

        const { data: pu, error: puError } = await supabase
            .from('product_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', productData.id)
            .single();

        if (puError || !pu) {
            router.push(`/p/${params.slug}/auth`);
            return;
        }
        setProductUser(pu);

        // Load sessions from Cognitive API for rich metadata
        await loadCognitiveSessions(pu.id, productData.id);

        // Check for session ID in URL and load it
        const sessionIdFromUrl = searchParams.get('session');
        if (sessionIdFromUrl) {
            await loadCognitiveSession(sessionIdFromUrl, true); // skipUrlUpdate since it's already in URL
        }

        setLoading(false);

        // Load proactive insights & welcome message
        if (pu) {
            loadProactiveInsights(pu.id, productData.id);
        }
    };

    const loadProactiveInsights = async (productUserId: string, productId?: string) => {
        const fallbackWelcome = {
            greeting: new Date().getHours() < 12 ? 'Good morning! ☀️' : new Date().getHours() < 17 ? 'Good afternoon! 👋' : 'Good evening! 🌙',
            message: 'How can I help you today?',
            suggestions: [
                { label: 'Ask a question', action: 'What can you help me with?' },
                { label: 'Explore topics', action: 'What topics do you know about?' },
            ],
        };

        try {
            // Need time of day for welcome message
            const hour = new Date().getHours();
            const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
            const pid = productId || product?.id;

            if (!pid) {
                console.warn('[Dashboard] No productId available for insights');
                setWelcomeMessage(fallbackWelcome);
                return;
            }

            console.log('[Dashboard] Loading insights for:', productUserId, pid);
            const res = await fetch(`/api/cognitive/insights?productUserId=${productUserId}&productId=${pid}&timeOfDay=${timeOfDay}&includeWelcome=true`);
            const data = await res.json();
            console.log('[Dashboard] Insights response:', data);

            if (data.insights) {
                setInsights(data.insights);
            }
            if (data.welcomeMessage) {
                console.log('[Dashboard] Setting welcome message:', data.welcomeMessage.greeting);
                setWelcomeMessage(data.welcomeMessage);
            } else {
                console.warn('[Dashboard] No welcomeMessage in response, using fallback');
                setWelcomeMessage(fallbackWelcome);
            }
        } catch (error) {
            console.error('Failed to load insights:', error);
            setWelcomeMessage(fallbackWelcome);
        }
    };


    // Load sessions from Cognitive Sessions API
    const loadCognitiveSessions = async (productUserId: string, productId?: string) => {
        try {
            const pid = productId || product?.id;
            if (!pid) {
                console.log('[Sessions] No productId available yet');
                return;
            }
            const res = await fetch(`/api/cognitive/sessions?productUserId=${productUserId}&productId=${pid}&limit=30`);
            const data = await res.json();
            console.log('[Sessions] Loaded:', data);
            if (data.sessions) {
                setChatSessions(data.sessions);
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    };


    // Start a new cognitive session
    const startNewCognitiveSession = async () => {
        if (!productUser || !product) return;

        try {
            const res = await fetch('/api/cognitive/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productUserId: productUser.id,
                    productId: product.id,
                    forceNew: true,
                }),
            });
            const data = await res.json();
            if (data.session) {
                setCurrentSessionId(data.session.id);
                setMessages([]);
                // Refresh session list
                await loadCognitiveSessions(productUser.id, product.id);
            }
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };


    // Rename a chat session
    const renameChatSession = async (sessionId: string, newTitle: string) => {
        try {
            await fetch(`/api/cognitive/sessions/${sessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle }),
            });
            // Update local state
            setChatSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
            setEditingChatId(null);
        } catch (error) {
            console.error('Failed to rename session:', error);
        }
    };

    // Delete a chat session
    const deleteChatSession = async (sessionId: string) => {
        if (!confirm('Are you sure you want to delete this chat?')) return;
        try {
            await fetch(`/api/cognitive/sessions/${sessionId}`, {
                method: 'DELETE',
            });
            // Update local state
            setChatSessions(prev => prev.filter(s => s.id !== sessionId));
            if (currentSessionId === sessionId) {
                setCurrentSessionId(null);
                setMessages([]);
                window.history.pushState({}, '', `/p/${params.slug}/dashboard`);
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    // Toggle star/favorite status
    const toggleStarChatSession = async (sessionId: string, currentStatus: boolean) => {
        try {
            // Optimistic update
            setChatSessions(prev => prev.map(s => s.id === sessionId ? { ...s, is_starred: !currentStatus } : s));

            await fetch(`/api/cognitive/sessions/${sessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_starred: !currentStatus }),
            });
        } catch (error) {
            console.error('Failed to toggle star:', error);
            // Revert on error
            setChatSessions(prev => prev.map(s => s.id === sessionId ? { ...s, is_starred: currentStatus } : s));
        }
    };

    // Load an existing session with messages
    const loadCognitiveSession = async (sessionId: string, skipUrlUpdate: boolean = false) => {
        setLoadingSession(true);
        try {
            const res = await fetch(`/api/cognitive/sessions/${sessionId}`);
            const data = await res.json();
            if (data.session && data.messages) {
                setCurrentSessionId(sessionId);
                setMessages(data.messages.map((m: any) => ({
                    role: m.role,
                    content: m.content,

                })));
                setActiveTab('chat');

                // Update URL with session ID (for reload persistence)
                if (!skipUrlUpdate) {
                    const newUrl = `/p/${params.slug}/dashboard?session=${sessionId}`;
                    window.history.pushState({}, '', newUrl);
                }
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        } finally {
            setLoadingSession(false);
        }
    };


    // Save a message to the current session
    const saveCognitiveMessage = async (role: 'user' | 'assistant', content: string, sources?: any[]) => {
        if (!currentSessionId) return;

        try {
            await fetch(`/api/cognitive/sessions/${currentSessionId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, content, sources }),
            });
        } catch (error) {
            console.error('Failed to save message:', error);
        }
    };

    const handleEditAndResend = (index: number, newContent: string) => {
        // 1. Get history before this message
        const historyBefore = messages.slice(0, index);
        // 2. Set editing to null
        setEditingMessageIndex(null);
        // 3. Send message with new context
        sendMessage(newContent, historyBefore);
    };

    const handleCreatePresentation = () => {
        // Trigger the AI workflow
        setInput("I'd like to create a presentation. Please act as a Presentation Architect. Ask me about the topic, audience, and goal. Once you have enough info, generate a Markdown presentation using '---' as slide separator. Use '# Title' for headers. IMPORTANT: Include rich visual backgrounds by adding markdown images like '![bg](https://image.pollinations.ai/prompt/KEYWORD?width=1920&height=1080&nologo=true)' at the top of slides.");
        // We defer the send to allow state update or user confirmation? 
        // Actually, user expects action. Let's auto-send or just fill input.
        // User said "it asks first the user...". So AI should initiate.
        // I will basically "pretend" the user asked this, so the AI responds with "Sure, what's the topic?".
        setTimeout(() => sendMessage(), 100);
    };


    const loadDocuments = async () => {
        if (!productUser) return;
        try {
            const res = await fetch(`/api/user/documents?productUserId=${productUser.id}`);
            const data = await res.json();
            if (data.documents) {
                setDocuments(data.documents);
            }
        } catch (error) {
            console.error('Failed to load documents', error);
        }
    };

    const loadEntities = async () => {
        if (!productUser) return;
        try {
            const res = await fetch(`/api/user/entities?productUserId=${productUser.id}`);
            const data = await res.json();
            if (data.entities) {
                setEntities(data.entities);
            }
            if (data.entityTypes) {
                setEntityTypes(data.entityTypes);
            }
        } catch (error) {
            console.error('Failed to load entities', error);
        }
    };

    const loadLeaderboard = async () => {
        if (!productUser) return;
        const { data, error } = await supabase
            .from('knowledge_leaderboard')
            .select('*')
            .eq('product_id', productUser.product_id)
            .limit(50);

        if (data) setLeaderboardEntries(data);
    };

    useEffect(() => {
        if (activeTab === 'clients' && productUser) {
            loadEntities();
        }
    }, [activeTab, productUser]);

    const handleMultiFileUpload = async (files: FileList | File[]) => {
        if (!productUser || files.length === 0) return;

        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(f =>
            f.name.endsWith('.pdf') || f.name.endsWith('.txt') || f.name.endsWith('.md') || f.name.endsWith('.docx')
        );

        if (validFiles.length === 0) {
            alert('Please select valid files (PDF, TXT, MD, DOCX)');
            return;
        }

        const newQueue = validFiles.map(file => ({
            file,
            status: 'pending' as const,
            progress: 0,
        }));
        setUploadQueue(prev => [...prev, ...newQueue]);
        setUploading(true);

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];

            setUploadQueue(prev => prev.map((item, idx) =>
                item.file.name === file.name && item.status === 'pending'
                    ? { ...item, status: 'uploading' as const, progress: 15, message: processingMessages[0] }
                    : item
            ));

            let messageIndex = 0;
            const messageInterval = setInterval(() => {
                messageIndex = (messageIndex + 1) % processingMessages.length;
                setUploadQueue(prev => prev.map(item =>
                    item.file.name === file.name && item.status === 'uploading'
                        ? { ...item, message: processingMessages[messageIndex], progress: Math.min(15 + (messageIndex * 12), 85) }
                        : item
                ));
            }, 1500);

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('productUserId', productUser.id);

                const res = await fetch('/api/user/documents', {
                    method: 'POST',
                    body: formData,
                });

                const data = await res.json();
                clearInterval(messageInterval);

                if (!res.ok) {
                    throw new Error(data.error || 'Upload failed');
                }

                const successMessage = data.gapDetected
                    ? `✨ ${data.chunksCreated} chunks • Unique knowledge detected!`
                    : `${data.chunksCreated} chunks indexed`;

                setUploadQueue(prev => prev.map(item =>
                    item.file.name === file.name && item.status === 'uploading'
                        ? { ...item, status: 'success' as const, progress: 100, message: successMessage }
                        : item
                ));
            } catch (error: any) {
                clearInterval(messageInterval);
                setUploadQueue(prev => prev.map(item =>
                    item.file.name === file.name && item.status === 'uploading'
                        ? { ...item, status: 'error' as const, progress: 0, message: error.message }
                        : item
                ));
            }
        }

        await loadDocuments();
        setUploading(false);

        setTimeout(() => {
            setUploadQueue(prev => prev.filter(item => item.status === 'error'));
        }, 3000);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            handleMultiFileUpload(e.dataTransfer.files);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleMultiFileUpload(e.target.files);
        }
        if (docInputRef.current) {
            docInputRef.current.value = '';
        }
    };

    const getFileIcon = (filename: string) => {
        if (filename.endsWith('.pdf')) return { icon: FileText, color: 'text-red-600', bg: 'bg-red-50' };
        if (filename.endsWith('.docx')) return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' };
        if (filename.endsWith('.txt') || filename.endsWith('.md')) return { icon: File, color: 'text-sand-600', bg: 'bg-sand-100' };
        return { icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50' };
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm('Are you sure you want to delete this document?') || !productUser) return;

        try {
            const res = await fetch(`/api/user/documents?documentId=${docId}&productUserId=${productUser.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setDocuments(prev => prev.filter(d => d.id !== docId));
            }
        } catch (error) {
            console.error('Delete error', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (overrideInput?: string, overrideHistory?: Message[]) => {
        // Prevent event objects from being treated as string input
        const actualInput = typeof overrideInput === 'string' ? overrideInput : input;

        if (!actualInput.trim() || !product || !productUser || sending) return;

        const userMessage = actualInput.trim();

        // Only clear input if we're not using an override (normal chat)
        if (typeof overrideInput !== 'string') setInput('');

        // If overriding history (editing), use that basis. Otherwise append to current.
        if (overrideHistory) {
            setMessages([...overrideHistory, { role: 'user', content: userMessage }]);
        } else {
            setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        }

        setSending(true);
        setCurrentTask(contextFile ? `Analyzing ${contextFile.name}...` : 'Processing...');

        // 🧠 COGNITIVE: Create session if not exists
        let sessionId = currentSessionId;
        if (!sessionId) {
            try {
                const sessionRes = await fetch('/api/cognitive/sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productUserId: productUser.id,
                        productId: product.id,
                        forceNew: true,
                    }),
                });
                const sessionData = await sessionRes.json();
                if (sessionData.session) {
                    sessionId = sessionData.session.id;
                    setCurrentSessionId(sessionId);
                    // Update URL with new session ID
                    window.history.pushState({}, '', `/p/${params.slug}/dashboard?session=${sessionId}`);
                }
            } catch (err) {
                console.error('Failed to create session:', err);
            }
        }

        // 🧠 COGNITIVE: Save user message to session
        if (sessionId) {
            saveCognitiveMessage('user', userMessage);
        }

        // Determine the active chat mode for loading UI
        const chatMode = enableWebSearch && enableExtendedKnowledge ? 'full_power'
            : enableWebSearch ? 'web'
                : enableExtendedKnowledge ? 'extended'
                    : 'strict';

        // Start mode-aware thinking process
        thinkingHook.startThinking(chatMode);

        try {
            const formData = new FormData();
            formData.append('query', userMessage);
            formData.append('productId', product.id);
            formData.append('productUserId', productUser.id);

            // 🧠 COGNITIVE: Send sessionId for background learning
            if (sessionId) {
                formData.append('sessionId', sessionId);
            }

            // CRITICAL: Send conversation history for context-aware responses
            // Only send last 10 messages to stay within token limits
            const historySource = overrideHistory || messages;
            const conversationHistory = historySource.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));
            formData.append('conversationHistory', JSON.stringify(conversationHistory));

            if (contextFile) {
                formData.append('contextFile', contextFile);
            }

            // 🌐 Live Web Search: Pass user preference
            if (enableWebSearch) {
                formData.append('enableWebSearch', 'true');
            }

            // 🧠 Extended Knowledge: Pass user preference
            if (enableExtendedKnowledge) {
                formData.append('enableExtendedKnowledge', 'true');
            }

            const res = await fetch('/api/chat/user', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Request failed');

            // Signal that the response has arrived (preemptible after composing minimum)
            thinkingHook.responseReceived();

            const responseText = data.response || 'I apologize, but I could not generate a response. Please try again.';

            if (data.metadata?.taskDetected && data.metadata.taskDetected !== 'General Query') {
                setCurrentTask(data.metadata.taskDetected);
            }

            // Complete the thinking process
            thinkingHook.complete();

            // Parse inline citations from the API response
            console.log('[DEBUG Citations] Raw API response inline_citations:', JSON.stringify(data.inline_citations));

            console.log('[DEBUG Citations] Response text preview:', responseText.substring(0, 200));
            const inlineCitations: InlineCitationData[] = (data.inline_citations || []).map((c: any) => ({
                cited_text: c.cited_text || '',
                source_index: c.source_index || 0,
                source: c.source ? {
                    ...c.source,
                    url: c.source.url || null,
                    excerpt: c.source.excerpt || null,
                } : null,
            })).filter((c: InlineCitationData) => c.cited_text.length > 0);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: responseText,

                metadata: data.metadata,
                kbWasEmpty: data.reasoning?.kbWasEmpty,
                inlineCitations: inlineCitations.length > 0 ? inlineCitations : undefined,
            }]);
            console.log('[DEBUG Citations] Final inlineCitations passed to message:', inlineCitations.length, inlineCitations);

            // 🧠 COGNITIVE: Save assistant response to session
            if (sessionId) {
                saveCognitiveMessage('assistant', responseText);

                // After 3+ messages, trigger title generation
                const totalMessages = messages.length + 2; // +2 for the new user & assistant messages
                if (totalMessages >= 3) {
                    fetch(`/api/cognitive/sessions/${sessionId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'extract' }),
                    }).then(() => {
                        // Refresh sessions to show new title
                        loadCognitiveSessions(productUser.id, product.id);
                    }).catch(err => console.error('Title generation failed:', err));
                }
            }

            setContextFile(null);

            if (data.memorySuggestions?.should_remember) {
                setMemorySuggestions(data.memorySuggestions);
                setShowMemoryModal(true);
            }
        } catch (err: any) {
            console.error('Chat error:', err);
            thinkingHook.reset();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Sorry, I encountered an error: ${err.message || 'Unknown error'}. Please try again.`,
            }]);
        } finally {
            setSending(false);
            setCurrentTask(null);
            // Reset thinking UI after a short delay so user can see "Complete"
            setTimeout(() => thinkingHook.reset(), 1500);
        }
    };


    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push(`/p/${params.slug}/auth`);
    };

    // Generate a flowchart summarizing the conversation
    const handleCreateFlowchart = async () => {
        if (!product || !productUser || messages.length < 2) return;

        setSending(true);

        // Build conversation summary for context
        const conversationText = messages.map(m =>
            `${m.role.toUpperCase()}: ${m.content}`
        ).join('\n\n');

        const flowchartPrompt = `Based on the following conversation, create a comprehensive Mermaid flowchart that:
1. Captures the main topic and key decision points discussed
2. Shows the logical flow of the information shared
3. Highlights key learnings, outcomes, or recommendations
4. Uses clear, concise labels for each node

CONVERSATION:
${conversationText}

Generate ONLY the Mermaid diagram code (starting with "graph TD" or "flowchart TD"), with no additional explanation. Make sure the flowchart is comprehensive and captures the essence of the discussion.`;

        try {
            const formData = new FormData();
            formData.append('query', flowchartPrompt);
            formData.append('productId', product.id);
            formData.append('productUserId', productUser.id);
            if (currentSessionId) {
                formData.append('sessionId', currentSessionId);
            }

            const res = await fetch('/api/chat/user', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to generate flowchart');

            // Extract the Mermaid code from the response
            let mermaidCode = data.response || '';

            // Clean up the response - extract just the mermaid block if wrapped
            const mermaidMatch = mermaidCode.match(/```mermaid\n?([\s\S]*?)```/);
            if (mermaidMatch) {
                mermaidCode = mermaidMatch[1].trim();
            } else if (mermaidCode.includes('graph') || mermaidCode.includes('flowchart')) {
                // Already clean, just trim
                mermaidCode = mermaidCode.trim();
            }

            // Wrap in mermaid code block for rendering
            const formattedResponse = `Here's a flowchart summarizing our conversation:\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\``;

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: formattedResponse,
            }]);

            // Save to session if exists
            if (currentSessionId) {
                saveCognitiveMessage('assistant', formattedResponse);
            }
        } catch (err: any) {
            console.error('Flowchart generation error:', err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Sorry, I couldn't generate a flowchart: ${err.message}. Please try again.`,
            }]);
        } finally {
            setSending(false);
        }
    };

    // Generate a Gamma-style presentation summarizing the conversation
    const handleCreateGammaPresentation = async () => {
        if (!product || !productUser || messages.length < 2) return;

        setIsGeneratingPresentation(true);

        try {
            // Build conversation summary for context
            const conversationSummary = messages
                .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.substring(0, 500)}`)
                .join('\n\n');

            // Get first user question as topic
            const firstQuestion = messages.find(m => m.role === 'user')?.content || 'Conversation Summary';
            const topic = firstQuestion.length > 100 ? firstQuestion.substring(0, 100) + '...' : firstQuestion;

            // Generate presentation using our Gamma API
            const res = await fetch('/api/presentations/gamma', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topic,
                    cardCount: Math.min(Math.max(3, Math.floor(messages.length / 2)), 8),
                    audience: 'General',
                    tone: 'professional',
                    existingContent: conversationSummary,
                    productId: product.id,
                    userId: productUser.id,
                    chatSessionId: currentSessionId,
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to generate presentation');

            if (data.presentation) {
                setViewingGammaPresentation(data.presentation);

                // Also add a message to the chat
                const presentationMessage = `✨ I've created a presentation summarizing our conversation! Click the presentation viewer above to see it.`;
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: presentationMessage,
                }]);

                if (currentSessionId) {
                    saveCognitiveMessage('assistant', presentationMessage);
                }
            }
        } catch (error: any) {
            console.error('Failed to generate presentation:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Sorry, I couldn't generate a presentation: ${error.message}. Please try again.`,
            }]);
        } finally {
            setIsGeneratingPresentation(false);
        }
    };

    const brandColor = product?.primary_color || '#DA7B4D';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <div className="text-center">
                    <div className="w-6 h-6 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sand-500 text-sm">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (!product || !productUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <div className="text-center">
                    <h1 className="text-xl font-semibold text-sand-800 mb-2">Access Denied</h1>
                    <Link href={`/p/${params.slug}/auth`} className="text-terracotta-600 hover:underline text-sm">
                        Sign in to continue
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="h-screen bg-cream-50 flex overflow-hidden">
                {/* Claude-Style Sidebar - Click to open/close */}
                <div className={`${sidebarOpen ? 'w-[280px]' : 'w-16'} flex-shrink-0 transition-all duration-300 bg-cream-50 flex flex-col overflow-hidden`}>
                    {/* Header Row: Toggle + Product Name (like Claude shows "Claude" next to toggle) */}
                    <div className="p-3 flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-sand-200/50 transition-colors flex-shrink-0"
                            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                        >
                            <PanelLeftClose className={`w-5 h-5 text-sand-500 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
                        </button>
                        {sidebarOpen && (
                            <button
                                onClick={() => setActiveTab('chat')}
                                className="font-semibold text-sand-900 truncate text-lg animate-in fade-in duration-200 hover:opacity-70 text-left min-w-0"
                                title="Go to Chat"
                            >
                                {product.name}
                            </button>
                        )}
                    </div>

                    {/* New Chat Button */}
                    <div className="px-3 pb-2">
                        <button
                            onClick={() => {
                                setCurrentSessionId(null);
                                setMessages([]);
                                setActiveTab('chat');
                                window.history.pushState({}, '', `/p/${params.slug}/dashboard`);
                            }}
                            className={`${sidebarOpen ? 'w-full py-2.5 px-4' : 'w-10 h-10 mx-auto'} rounded-xl bg-sand-800 hover:bg-sand-900 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all`}
                            title="New Chat"
                        >
                            <Plus className="w-4 h-4" />
                            {sidebarOpen && <span>New Chat</span>}
                        </button>
                    </div>

                    {/* Navigation */}
                    <div className="px-2 space-y-1">
                        {/* Personalisation - External Link */}
                        <button
                            onClick={() => router.push(`/p/${params.slug}/personalisation`)}
                            className={`${sidebarOpen ? 'w-full py-2.5 px-3' : 'w-10 h-10 mx-auto'} rounded-xl flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} text-sm font-medium transition-all text-sand-600 hover:bg-sand-200/50 hover:text-sand-800 group`}
                            title="Personalisation"
                        >
                            <User className="w-[18px] h-[18px] flex-shrink-0 text-sand-400 group-hover:text-terracotta-500 transition-colors" />
                            {sidebarOpen && (
                                <span className="flex items-center gap-2 flex-1">
                                    Personalisation
                                    <ExternalLink className="w-3 h-3 text-sand-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </span>
                            )}
                        </button>

                        {/* My Clients - stays in dashboard */}
                        <button
                            onClick={() => setActiveTab('clients')}
                            className={`${sidebarOpen ? 'w-full py-2.5 px-3' : 'w-10 h-10 mx-auto'} rounded-xl flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} text-sm font-medium transition-all ${activeTab === 'clients'
                                ? 'bg-sand-200/80 text-sand-900'
                                : 'text-sand-600 hover:bg-sand-200/50 hover:text-sand-800'
                                }`}
                            title="My Clients"
                        >
                            <Users className={`w-[18px] h-[18px] flex-shrink-0 ${activeTab === 'clients' ? 'text-terracotta-600' : 'text-sand-400'}`} />
                            {sidebarOpen && <span>My Clients</span>}
                        </button>
                    </div>

                    {/* Social Media - External Link */}
                    <div className="px-2 mt-2 pt-2 border-t border-sand-200/40">
                        <button
                            onClick={() => router.push(`/p/${params.slug}/social`)}
                            className={`${sidebarOpen ? 'w-full py-2.5 px-3' : 'w-10 h-10 mx-auto'} rounded-xl flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} text-sm font-medium transition-all text-sand-600 hover:bg-sand-200/50 hover:text-sand-800 group`}
                            title="Social Media"
                        >
                            <Share2 className="w-[18px] h-[18px] flex-shrink-0 text-sand-400 group-hover:text-terracotta-500 transition-colors" />
                            {sidebarOpen && (
                                <span className="flex items-center gap-2 flex-1">
                                    Social Media
                                    <ExternalLink className="w-3 h-3 text-sand-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Spacer to push sign out to bottom */}
                    <div className="flex-1" />

                    {/* User Menu - Seamless */}
                    <div className="px-2 py-3">
                        <button
                            onClick={handleLogout}
                            className={`${sidebarOpen ? 'w-full py-2.5 px-3' : 'w-10 h-10 mx-auto'} rounded-xl text-sand-600 hover:text-sand-800 hover:bg-sand-200/50 flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} text-sm font-medium transition-all`}
                            title="Sign Out"
                        >
                            <LogOut className="w-[18px] h-[18px] text-sand-400" />
                            {sidebarOpen && <span>Sign Out</span>}
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 min-h-0">
                    {/* Top Bar - Ultra-Compact */}
                    <div className="flex-shrink-0 h-10 flex items-center justify-between px-3 sticky top-0 z-30 backdrop-blur-xl bg-white/90 transition-all">
                        <div className="flex items-center gap-3">

                            {/* Claude-style Chat Title Dropdown */}
                            {activeTab === 'chat' ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowChatDropdown(!showChatDropdown)}
                                        className="group flex items-center gap-2 py-1 rounded-lg hover:text-sand-900 transition-colors"
                                        title="Switch chat"
                                    >
                                        <h2 className="text-sm font-normal text-sand-600 group-hover:text-sand-900 max-w-[300px] truncate transition-colors">
                                            {(() => {
                                                const s = chatSessions.find(se => se.id === currentSessionId);
                                                if (!s) return 'New Chat';
                                                const formatted = formatChatTitle(s.title || 'Chat');
                                                return formatted;
                                            })()}
                                        </h2>
                                        <ChevronDown className="w-3 h-3 text-sand-400 opacity-0 group-hover:opacity-100 transition-all" />
                                    </button>

                                    {/* Chat Dropdown */}
                                    {showChatDropdown && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setShowChatDropdown(false)}
                                            />
                                            <div className="absolute left-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-sand-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[500px]">
                                                {/* Search in dropdown - Sticky Header */}
                                                <div className="p-3 border-b border-sand-100 bg-white sticky top-0 z-10">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sand-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search chats..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            className="w-full py-2 pl-9 pr-3 text-sm rounded-lg border border-sand-100 bg-sand-50/50 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-300 transition-all font-medium text-sand-700"
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>

                                                {/* Scrollable List */}
                                                <div className="overflow-y-auto flex-1 pb-2">
                                                    {(() => {
                                                        const filteredSessions = searchQuery
                                                            ? chatSessions.filter(s =>
                                                                s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                                s.summary?.toLowerCase().includes(searchQuery.toLowerCase())
                                                            )
                                                            : chatSessions;

                                                        if (filteredSessions.length === 0) {
                                                            return (
                                                                <div className="px-4 py-8 text-center">
                                                                    <p className="text-sm text-sand-500 font-medium">No chats found</p>
                                                                    <p className="text-xs text-sand-400 mt-1">Try a different search or start a new chat</p>
                                                                </div>
                                                            );
                                                        }

                                                        // Group specific logic
                                                        const now = new Date();
                                                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                                                        const yesterday = today - 86400000;
                                                        const weekAgo = today - 86400000 * 7;

                                                        const groups: Record<string, typeof chatSessions> = {
                                                            'Today': [],
                                                            'Yesterday': [],
                                                            'Previous 7 Days': [],
                                                            'Older': []
                                                        };

                                                        filteredSessions.forEach(session => {
                                                            const date = new Date(session.created_at).getTime();
                                                            if (date >= today) groups['Today'].push(session);
                                                            else if (date >= yesterday) groups['Yesterday'].push(session);
                                                            else if (date >= weekAgo) groups['Previous 7 Days'].push(session);
                                                            else groups['Older'].push(session);
                                                        });

                                                        return Object.entries(groups).map(([groupName, sessions]) => {
                                                            if (sessions.length === 0) return null;
                                                            return (
                                                                <div key={groupName} className="mb-1">
                                                                    <h3 className="px-4 py-2 text-[10px] font-bold text-sand-400 uppercase tracking-wider bg-white sticky top-0 z-0">
                                                                        {groupName}
                                                                    </h3>
                                                                    {sessions.map((session) => (
                                                                        <div
                                                                            key={session.id}
                                                                            className={`group relative w-full flex items-center justify-between px-4 py-2 hover:bg-sand-50 cursor-pointer transition-all border-l-2 ${currentSessionId === session.id ? 'border-terracotta-500 bg-sand-50/50' : 'border-transparent'}`}
                                                                            onClick={() => {
                                                                                if (editingChatId !== session.id) {
                                                                                    loadCognitiveSession(session.id);
                                                                                    setShowChatDropdown(false);
                                                                                    setSearchQuery('');
                                                                                }
                                                                            }}
                                                                            onMouseEnter={() => setSelectedChatId(session.id)}
                                                                            onMouseLeave={() => {
                                                                                if (selectedChatId === session.id) setSelectedChatId(null);
                                                                            }}
                                                                        >
                                                                            {editingChatId === session.id ? (
                                                                                <div className="flex-1 flex items-center gap-2 min-w-0 z-10">
                                                                                    <input
                                                                                        autoFocus
                                                                                        type="text"
                                                                                        className="flex-1 bg-white border border-sand-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:border-terracotta-500 min-w-0"
                                                                                        value={editingChatTitle}
                                                                                        onChange={(e) => setEditingChatTitle(e.target.value)}
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === 'Enter') renameChatSession(session.id, editingChatTitle);
                                                                                            if (e.key === 'Escape') {
                                                                                                setEditingChatId(null);
                                                                                                e.stopPropagation();
                                                                                            }
                                                                                        }}
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        title="Rename chat"
                                                                                        placeholder="Chat title"
                                                                                    />
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            renameChatSession(session.id, editingChatTitle);
                                                                                        }}
                                                                                        className="p-1 hover:bg-sand-200 rounded text-terracotta-600"
                                                                                        title="Save"
                                                                                    >
                                                                                        <Save className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <>
                                                                                    <div className="flex-1 min-w-0 pr-4">
                                                                                        <p className={`truncate font-medium text-sand-700 ${currentSessionId === session.id ? 'text-sm' : 'text-xs'}`}>
                                                                                            {formatChatTitle(session.title) || 'Untitled Chat'}
                                                                                        </p>
                                                                                    </div>

                                                                                    {/* Date - Visible only when NOT hovering */}
                                                                                    <span className="text-[10px] text-sand-400 group-hover:hidden transition-opacity whitespace-nowrap">
                                                                                        {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                                    </span>

                                                                                    {/* Actions - Visible ONLY on hover */}
                                                                                    <div className="hidden group-hover:flex items-center gap-0.5 absolute right-2 top-1/2 -translate-y-1/2 bg-sand-50 pl-2 shadow-[-8px_0_8px_rgb(250,249,246)]">
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                setEditingChatId(session.id);
                                                                                                setEditingChatTitle(session.title || '');
                                                                                            }}
                                                                                            className="p-1 hover:bg-sand-200 rounded text-sand-400 hover:text-sand-700 transition-colors"
                                                                                            title="Rename"
                                                                                        >
                                                                                            <Edit2 className="w-3 h-3" />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                toggleStarChatSession(session.id, session.is_starred || false);
                                                                                            }}
                                                                                            className={`p-1 hover:bg-sand-200 rounded transition-colors ${session.is_starred ? 'text-yellow-500' : 'text-sand-400 hover:text-yellow-500'}`}
                                                                                            title={session.is_starred ? "Unfavorite" : "Favorite"}
                                                                                        >
                                                                                            <Star className={`w-3 h-3 ${session.is_starred ? 'fill-current' : ''}`} />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                deleteChatSession(session.id);
                                                                                            }}
                                                                                            className="p-1 hover:bg-red-50 rounded text-sand-400 hover:text-red-600 transition-colors"
                                                                                            title="Delete"
                                                                                        >
                                                                                            <Trash2 className="w-3 h-3" />
                                                                                        </button>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <h2 className="font-medium text-sand-800">
                                    My Clients
                                </h2>
                            )}
                        </div>

                        {/* Right side actions - Polished Chip Controls */}
                        <div className="flex items-center gap-1.5">
                            {activeTab === 'chat' && (
                                <>
                                    {/* AI Mode Chip */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowModeSelector(!showModeSelector)}
                                            className={`inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-lg text-[11px] font-medium transition-all border ${enableExtendedKnowledge && enableWebSearch
                                                ? 'bg-gradient-to-r from-violet-50 to-blue-50 text-violet-700 border-violet-200/60 hover:border-violet-300'
                                                : enableWebSearch
                                                    ? 'bg-blue-50/80 text-blue-600 border-blue-200/60 hover:border-blue-300'
                                                    : enableExtendedKnowledge
                                                        ? 'bg-amber-50/80 text-amber-700 border-amber-200/60 hover:border-amber-300'
                                                        : 'bg-sand-50 text-sand-600 border-sand-200/60 hover:border-sand-300'
                                                }`}
                                            title="AI Mode"
                                        >
                                            {enableExtendedKnowledge && enableWebSearch ? (
                                                <><Zap className="w-3 h-3" /> Full Power</>
                                            ) : enableWebSearch ? (
                                                <><Globe className="w-3 h-3" /> Web</>
                                            ) : enableExtendedKnowledge ? (
                                                <><Sparkles className="w-3 h-3" /> Extended</>
                                            ) : (
                                                <><Shield className="w-3 h-3" /> Strict</>
                                            )}
                                            <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${showModeSelector ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Mode Selector Dropdown */}
                                        {showModeSelector && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowModeSelector(false)} />
                                                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-sand-200 shadow-xl rounded-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                                    <div className="px-2.5 pb-1 mb-1 border-b border-sand-100">
                                                        <p className="text-[10px] font-semibold text-sand-400 uppercase tracking-wider">AI Mode</p>
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 px-1.5">
                                                        <div className={`group px-2.5 py-2 rounded-lg text-xs flex items-center gap-2.5 cursor-pointer transition-all ${!enableWebSearch && !enableExtendedKnowledge ? 'bg-sand-100/80 text-sand-900 font-medium' : 'text-sand-600 hover:bg-sand-50'}`}
                                                            onClick={() => { setEnableWebSearch(false); setEnableExtendedKnowledge(false); setShowModeSelector(false); }}>
                                                            <Shield className={`w-3.5 h-3.5 ${!enableWebSearch && !enableExtendedKnowledge ? 'text-sand-700' : 'text-sand-400'}`} />
                                                            <div className="flex-1">
                                                                <span className="block">Strict</span>
                                                                <span className="text-[10px] text-sand-400 font-normal">Knowledge base only</span>
                                                            </div>
                                                            {!enableWebSearch && !enableExtendedKnowledge && <Check className="w-3.5 h-3.5 text-sand-700" />}
                                                        </div>
                                                        <div className={`group px-2.5 py-2 rounded-lg text-xs flex items-center gap-2.5 cursor-pointer transition-all ${enableExtendedKnowledge && !enableWebSearch ? 'bg-amber-50/80 text-amber-800 font-medium' : 'text-sand-600 hover:bg-sand-50'}`}
                                                            onClick={() => { setEnableExtendedKnowledge(!enableExtendedKnowledge); if (enableWebSearch) setEnableWebSearch(false); setShowModeSelector(false); }}>
                                                            <Sparkles className={`w-3.5 h-3.5 ${enableExtendedKnowledge ? 'text-amber-500' : 'text-sand-400'}`} />
                                                            <div className="flex-1">
                                                                <span className="block">Extended</span>
                                                                <span className="text-[10px] text-sand-400 font-normal">Docs + AI knowledge</span>
                                                            </div>
                                                            {enableExtendedKnowledge && !enableWebSearch && <Check className="w-3.5 h-3.5 text-amber-600" />}
                                                        </div>
                                                        <div className={`group px-2.5 py-2 rounded-lg text-xs flex items-center gap-2.5 cursor-pointer transition-all ${enableWebSearch && !enableExtendedKnowledge ? 'bg-blue-50/80 text-blue-700 font-medium' : 'text-sand-600 hover:bg-sand-50'}`}
                                                            onClick={() => { setEnableWebSearch(!enableWebSearch); if (enableExtendedKnowledge) setEnableExtendedKnowledge(false); setShowModeSelector(false); }}>
                                                            <Globe className={`w-3.5 h-3.5 ${enableWebSearch ? 'text-blue-500' : 'text-sand-400'}`} />
                                                            <div className="flex-1">
                                                                <span className="block">Web Search</span>
                                                                <span className="text-[10px] text-sand-400 font-normal">Live web results</span>
                                                            </div>
                                                            {enableWebSearch && !enableExtendedKnowledge && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                                        </div>
                                                        <div className="border-t border-sand-100 mt-0.5 pt-0.5">
                                                            <div className={`group px-2.5 py-2 rounded-lg text-xs flex items-center gap-2.5 cursor-pointer transition-all ${enableExtendedKnowledge && enableWebSearch ? 'bg-gradient-to-r from-violet-50 to-blue-50 text-violet-800 font-medium' : 'text-sand-600 hover:bg-sand-50'}`}
                                                                onClick={() => { setEnableWebSearch(true); setEnableExtendedKnowledge(true); setShowModeSelector(false); }}>
                                                                <Zap className={`w-3.5 h-3.5 ${enableExtendedKnowledge && enableWebSearch ? 'text-violet-500' : 'text-sand-400'}`} />
                                                                <div className="flex-1">
                                                                    <span className="block">Full Power</span>
                                                                    <span className="text-[10px] text-sand-400 font-normal">Everything combined</span>
                                                                </div>
                                                                {enableExtendedKnowledge && enableWebSearch && <Check className="w-3.5 h-3.5 text-violet-600" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Create Chip */}
                                    {messages.length >= 2 && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                                                className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-lg text-[11px] font-medium bg-sand-50 text-sand-600 border border-sand-200/60 hover:border-sand-300 hover:text-sand-800 transition-all"
                                                title="Create from chat"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Create
                                                <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${showCreateDropdown ? 'rotate-180' : ''}`} />
                                            </button>

                                            {showCreateDropdown && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setShowCreateDropdown(false)} />
                                                    <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-sand-200 shadow-xl rounded-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                                        <div className="flex flex-col gap-0.5 px-1.5">
                                                            <button
                                                                onClick={() => { handleCreateFlowchart(); setShowCreateDropdown(false); }}
                                                                disabled={sending}
                                                                className="px-2.5 py-2 rounded-lg text-left text-xs text-sand-600 hover:text-sand-900 hover:bg-sand-50 transition-all flex items-center gap-2.5"
                                                            >
                                                                <Layout className="w-3.5 h-3.5 text-sand-400" />
                                                                Flowchart
                                                            </button>
                                                            <button
                                                                onClick={() => { handleCreateGammaPresentation(); setShowCreateDropdown(false); }}
                                                                disabled={isGeneratingPresentation}
                                                                className="px-2.5 py-2 rounded-lg text-left text-xs text-sand-600 hover:text-sand-900 hover:bg-sand-50 transition-all flex items-center gap-2.5 disabled:opacity-50"
                                                            >
                                                                {isGeneratingPresentation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Presentation className="w-3.5 h-3.5 text-sand-400" />}
                                                                Presentation
                                                            </button>
                                                            <button
                                                                onClick={() => setShowCreateDropdown(false)}
                                                                className="px-2.5 py-2 rounded-lg text-left text-xs text-sand-600 hover:text-sand-900 hover:bg-sand-50 transition-all flex items-center gap-2.5"
                                                            >
                                                                <FileText className="w-3.5 h-3.5 text-sand-400" />
                                                                Report
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Text Size Chip */}
                                    <button
                                        onClick={() => setChatTextSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'larger' : 'normal')}
                                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-semibold transition-all border ${chatTextSize === 'normal'
                                            ? 'bg-sand-50 text-sand-500 border-sand-200/60 hover:border-sand-300'
                                            : chatTextSize === 'large'
                                                ? 'bg-sand-100 text-sand-700 border-sand-300/60'
                                                : 'bg-sand-200/80 text-sand-900 border-sand-300'
                                            }`}
                                        title={`Text size: ${chatTextSize}`}
                                    >
                                        Aa
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {activeTab === 'chat' ? (
                        /* Chat View - Flex container for proper layout */
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            {/* Proactive Insights Widget - Fixed at top */}
                            <ProactiveInsights
                                productUserId={productUser.id}
                                productId={product.id}
                                onInsightClick={(insight) => {
                                    // If it has related content, we could load it
                                    if (insight.actionable) {
                                        // Maybe help user take action?
                                        setInput(`Tell me more about: ${insight.title}`);
                                    }
                                }}
                            />

                            {/* Scrollable Messages Area */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="max-w-3xl mx-auto p-4 space-y-4">
                                    {messages.length === 0 && (
                                        <div className="py-10">
                                            {!welcomeMessage ? (
                                                /* Loading State */
                                                <div className="flex flex-col items-center">
                                                    <div className="w-16 h-16 rounded-2xl bg-sand-100 animate-pulse mb-6"></div>
                                                    <div className="h-8 w-48 bg-sand-100 rounded-lg animate-pulse mb-3"></div>
                                                    <div className="h-4 w-64 bg-sand-100 rounded-lg animate-pulse mb-8"></div>
                                                    <div className="flex gap-2">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="h-10 w-32 bg-sand-100 rounded-xl animate-pulse"></div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Configured Welcome Message */
                                                <WelcomeMessage
                                                    greeting={welcomeMessage.greeting}
                                                    quickActions={welcomeMessage.suggestions.map(s => s.label)}
                                                    onQuickAction={(actionLabel) => {
                                                        const suggestion = welcomeMessage.suggestions.find(s => s.label === actionLabel);
                                                        if (suggestion) {
                                                            setInput(suggestion.action);
                                                        }
                                                    }}
                                                    userName={productUser.display_name}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {msg.role === 'user' ? (
                                                /* User Message */
                                                /* User Message */
                                                <div className="flex flex-col items-end gap-1 group max-w-[85%]">
                                                    <div
                                                        className="w-full rounded-2xl px-4 py-3 text-white"
                                                        style={{ backgroundColor: brandColor }}
                                                    >
                                                        {editingMessageIndex === i ? (
                                                            <div className="flex flex-col gap-2">
                                                                <textarea
                                                                    value={editMessageContent}
                                                                    onChange={(e) => setEditMessageContent(e.target.value)}
                                                                    className="w-full bg-white/10 text-white rounded p-2 focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
                                                                    rows={3}
                                                                    autoFocus
                                                                />
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => setEditingMessageIndex(null)}
                                                                        className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            handleEditAndResend(i, editMessageContent);
                                                                        }}
                                                                        className="px-2 py-1 text-xs bg-white text-sand-900 hover:bg-white/90 rounded transition-colors font-medium"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className={`whitespace-pre-wrap leading-relaxed ${chatTextSize === 'normal' ? 'text-[15px]' :
                                                                chatTextSize === 'large' ? 'text-[17px]' : 'text-[19px]'
                                                                }`}>
                                                                {msg.content}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Action Bar (User) */}
                                                    {!editingMessageIndex && (
                                                        <div className="flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingMessageIndex(i);
                                                                    setEditMessageContent(msg.content);
                                                                }}
                                                                className="p-1.5 rounded-md text-sand-400 hover:text-sand-600 hover:bg-sand-100 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(msg.content);
                                                                    setCopiedId(i);
                                                                    setTimeout(() => setCopiedId(null), 2000);
                                                                }}
                                                                className="p-1.5 rounded-md text-sand-400 hover:text-sand-600 hover:bg-sand-100 transition-colors"
                                                                title="Copy"
                                                            >
                                                                {copiedId === i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    console.log('Retry/Resend logic');
                                                                }}
                                                                className="p-1.5 rounded-md text-sand-400 hover:text-sand-600 hover:bg-sand-100 transition-colors"
                                                                title="Retry"
                                                            >
                                                                <RotateCcw className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                /* AI Message with Premium Rendering */
                                                <div className="flex flex-col items-start gap-1 group max-w-[85%]">
                                                    <div className={`w-full ${chatTextSize === 'normal' ? '' :
                                                        chatTextSize === 'large' ? 'text-[17px]' : 'text-[19px]'
                                                        }`}>
                                                        <AIMessage
                                                            content={msg.content}
                                                            brandColor={brandColor}
                                                            kbWasEmpty={msg.kbWasEmpty}
                                                            inlineCitations={msg.inlineCitations}
                                                        />
                                                    </div>

                                                    {/* Presentation Detection & Action */}
                                                    {(msg.content.includes('---') && (msg.content.includes('# ') || msg.content.includes('## '))) && (
                                                        <div className="mt-2 mb-1">
                                                            <button
                                                                onClick={() => {
                                                                    setPresentationContent(msg.content);
                                                                    setShowPresentation(true);
                                                                }}
                                                                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
                                                            >
                                                                <Play className="w-4 h-4" />
                                                                View Presentation
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Action Bar */}
                                                    <div className="flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none">
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(msg.content);
                                                                setCopiedId(i);
                                                                setTimeout(() => setCopiedId(null), 2000);
                                                            }}
                                                            className="p-1.5 rounded-md text-sand-400 hover:text-sand-600 hover:bg-sand-100 transition-colors"
                                                            title="Copy"
                                                        >
                                                            {copiedId === i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <button
                                                            onClick={() => setFeedbackMap(prev => ({ ...prev, [i]: prev[i] === 'positive' ? null : 'positive' }))}
                                                            className={`p-1.5 rounded-md hover:bg-sand-100 transition-colors ${feedbackMap[i] === 'positive' ? 'text-green-600 bg-green-50' : 'text-sand-400 hover:text-sand-600'}`}
                                                            title="Good response"
                                                        >
                                                            <ThumbsUp className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setFeedbackMap(prev => ({ ...prev, [i]: prev[i] === 'negative' ? null : 'negative' }))}
                                                            className={`p-1.5 rounded-md hover:bg-sand-100 transition-colors ${feedbackMap[i] === 'negative' ? 'text-red-500 bg-red-50' : 'text-sand-400 hover:text-sand-600'}`}
                                                            title="Bad response"
                                                        >
                                                            <ThumbsDown className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                // Basic retry logic
                                                                if (i === messages.length - 1) {
                                                                    // If it's the last message, we could potentially remove it and re-trigger
                                                                    // For now just console log as per safe implementation
                                                                    console.log('Retry requested for index', i);
                                                                }
                                                            }}
                                                            className="p-1.5 rounded-md text-sand-400 hover:text-sand-600 hover:bg-sand-100 transition-colors"
                                                            title="Retry"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* OmniForge Phase 3: Thinking Process UI */}
                                    {sending && (
                                        <div className="w-full">
                                            <ThinkingProcess
                                                state={thinkingHook.state}
                                                brandColor={brandColor}
                                            />
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Chat Input - Claude-style floating */}
                            <div className="p-4 pb-6">
                                <div className="max-w-3xl mx-auto">
                                    {contextFile && (
                                        <div className="mb-3 flex items-center gap-2 bg-terracotta-50 border border-terracotta-200 rounded-xl px-4 py-2">
                                            <Paperclip className="w-4 h-4 text-terracotta-600" />
                                            <span className="text-sm text-terracotta-700 flex-1 truncate">{contextFile.name}</span>
                                            <button
                                                onClick={() => setContextFile(null)}
                                                className="p-1 hover:bg-terracotta-100 rounded-lg transition-colors"
                                                title="Remove file"
                                            >
                                                <X className="w-4 h-4 text-terracotta-600" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex gap-3 items-center bg-white rounded-2xl p-2 border border-sand-200 shadow-sm focus-within:border-sand-300 focus-within:shadow-md transition-all">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) setContextFile(file);
                                                e.target.value = '';
                                            }}
                                            accept=".pdf,.txt,.md,.docx"
                                            className="hidden"
                                            title="Upload a file"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-3 rounded-xl text-sand-400 hover:text-sand-600 hover:bg-sand-100 transition-all"
                                            title="Attach a file"
                                            disabled={sending}
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                            placeholder={contextFile ? "Ask about this file..." : "Ask anything..."}
                                            className="flex-1 bg-transparent px-2 py-3 focus:outline-none text-sand-800 placeholder-sand-400"
                                            disabled={sending}
                                        />
                                        {/* Mode indicator - compact version in input bar */}
                                        <div
                                            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:bg-sand-100 transition-colors"
                                            onClick={() => setShowModeSelector(true)}
                                            title="Click to change AI mode"
                                        >
                                            {enableExtendedKnowledge && enableWebSearch ? (
                                                <><Layers className="w-4 h-4 text-purple-500" /><span className="text-sand-500 hidden sm:inline">Full</span></>
                                            ) : enableWebSearch ? (
                                                <><Globe className="w-4 h-4 text-blue-500" /><span className="text-sand-500 hidden sm:inline">Web</span></>
                                            ) : enableExtendedKnowledge ? (
                                                <><Brain className="w-4 h-4 text-purple-500" /><span className="text-sand-500 hidden sm:inline">Extended</span></>
                                            ) : (
                                                <><Shield className="w-4 h-4 text-green-500" /><span className="text-sand-500 hidden sm:inline">Strict</span></>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => sendMessage()}
                                            disabled={sending || !input.trim()}
                                            className="p-3 rounded-xl text-white disabled:opacity-50 transition-all"
                                            style={{ backgroundColor: brandColor }}
                                            title="Send message"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {/* Claude-style disclaimer */}
                                    <p className="text-xs text-sand-400 text-center mt-2">
                                        AI can make mistakes. Please verify important information.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Clients View */
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="max-w-4xl mx-auto">
                                <div className="mb-6">
                                    <h2 className="text-xl font-semibold text-sand-900">My Clients</h2>
                                    <p className="text-sand-500 text-sm">Manage your client information</p>
                                </div>
                                {entities.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-2xl border border-sand-200">
                                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-sand-100 flex items-center justify-center">
                                            <Users className="w-7 h-7 text-sand-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-sand-800 mb-2">No clients yet</h3>
                                        <p className="text-sand-500">Start chatting and I'll remember your clients</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {entities.map((entity) => (
                                            <div
                                                key={entity.id}
                                                className="bg-white rounded-xl border border-sand-200 p-4 hover:border-sand-300 transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                                        <Building className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sand-800">{entity.name}</p>
                                                        <p className="text-xs text-sand-500">{entity.type || 'Client'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div >
            </div >


        </>
    );
}
