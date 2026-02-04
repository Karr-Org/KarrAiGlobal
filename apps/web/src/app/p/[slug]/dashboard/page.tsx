'use client';

import { useState, useEffect, useRef } from 'react';
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
    User
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ProactiveInsights, WelcomeMessage } from '@/components/cognitive/ProactiveInsights';
import { ThinkingProcess, useThinkingState, ThinkingState } from '@/components/chat/ThinkingProcess';
import { AIMessage } from '@/components/chat/PremiumMarkdownRenderer';
import { useCognitiveSession } from '@/hooks/useCognitiveSession';
import KnowledgeGraphDashboard from '@/components/cognitive/KnowledgeGraphDashboard';
import CognitiveProfileDashboard from '@/components/cognitive/CognitiveProfileDashboard';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: { title: string; excerpt: string; type: string }[];
    metadata?: {
        taskDetected?: string;
        entityDetected?: string;
        sourcesUsed?: number;
        hasContextFile?: boolean;
    };
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
    const router = useRouter();
    const supabase = createClient();

    const [product, setProduct] = useState<Product | null>(null);
    const [productUser, setProductUser] = useState<ProductUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [showSources, setShowSources] = useState<number | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [loadingSession, setLoadingSession] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'clients' | 'leaderboard' | 'knowledge' | 'profile'>('chat');
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

    // Adaptive Intelligence State
    const [welcomeMessage, setWelcomeMessage] = useState<{
        greeting: string;
        message: string;
        suggestions: Array<{ label: string; action: string }>;
        expertiseLevel?: string;
    } | null>(null);
    const [insights, setInsights] = useState<any[]>([]);

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
            router.push('/signin');
            return;
        }

        const productRes = await fetch(`/api/products/by-slug/${params.slug}`);
        const productData = await productRes.json();
        if (productData.error) {
            router.push('/');
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
            router.push('/signin');
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
                    sources: m.sources,
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
        if (activeTab === 'documents' && productUser) {
            loadDocuments();
        }
        if (activeTab === 'clients' && productUser) {
            loadEntities();
        }
        if (activeTab === 'leaderboard' && productUser) {
            loadLeaderboard();
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

    const sendMessage = async () => {
        if (!input.trim() || !product || !productUser || sending) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
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

        // OmniForge Phase 3: Start the Thinking Process UI
        thinkingHook.startThinking(userMessage);

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
            const conversationHistory = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));
            formData.append('conversationHistory', JSON.stringify(conversationHistory));

            if (contextFile) {
                formData.append('contextFile', contextFile);
            }

            // Stage 1: Searching (simulated timing for smoother UX)
            thinkingHook.updateSearching([
                { name: 'Knowledge Base', type: 'internal', trustLevel: 100, matched: true },
                { name: 'Your Documents', type: 'internal', trustLevel: 100, matched: documents.length > 0 },
            ]);

            const res = await fetch('/api/chat/user', {
                method: 'POST',
                body: formData,
            });

            // Stage 2: Evaluating
            thinkingHook.startEvaluating(5);

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Request failed');

            // Update CRAG verdict if available
            if (data.reasoning) {
                thinkingHook.updateCRAGVerdict(
                    data.reasoning.verdict || 'RELEVANT',
                    data.reasoning.confidence || 0.85
                );

                if (data.reasoning.webSupplementUsed) {
                    thinkingHook.startCorrecting();
                    await new Promise(r => setTimeout(r, 300)); // Brief delay for UX
                }
            }

            // Stage 3: Generating
            thinkingHook.startGenerating();
            await new Promise(r => setTimeout(r, 200)); // Brief delay for UX

            const responseText = data.response || 'I apologize, but I could not generate a response. Please try again.';

            if (data.metadata?.taskDetected && data.metadata.taskDetected !== 'General Query') {
                setCurrentTask(data.metadata.taskDetected);
            }

            // Complete the thinking process
            thinkingHook.complete();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: responseText,
                sources: data.sources,
                metadata: data.metadata,
            }]);

            // 🧠 COGNITIVE: Save assistant response to session
            if (sessionId) {
                saveCognitiveMessage('assistant', responseText, data.sources);

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
        router.push('/signin');
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
                    <Link href="/signin" className="text-terracotta-600 hover:underline text-sm">
                        Sign in to continue
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-cream-50 flex overflow-hidden">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-[280px]' : 'w-0'} flex-shrink-0 transition-all duration-300 bg-cream-100 border-r border-sand-200 flex flex-col overflow-hidden`}>
                {/* Logo */}
                <div className="p-5 border-b border-sand-200">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${brandColor}15` }}
                        >
                            <Sparkles className="w-4 h-4" style={{ color: brandColor }} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-semibold text-sand-900 truncate text-[15px]">{product.name}</h1>
                            <p className="text-xs text-sand-500 truncate">{productUser.display_name}</p>
                        </div>
                    </div>
                </div>

                {/* New Chat Button */}
                <div className="p-4">
                    <button
                        onClick={() => {
                            setCurrentSessionId(null);
                            setMessages([]);
                            setActiveTab('chat');
                            // Clear session from URL
                            window.history.pushState({}, '', `/p/${params.slug}/dashboard`);
                        }}
                        className="w-full py-2.5 rounded-xl bg-sand-800 hover:bg-sand-900 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </button>
                </div>

                {/* Navigation */}
                <div className="px-3 space-y-1">
                    {[
                        { id: 'chat', icon: MessageSquare, label: 'Chat' },
                        { id: 'profile', icon: User, label: 'My Profile' },
                        { id: 'knowledge', icon: Brain, label: 'Knowledge Graph' },
                        { id: 'clients', icon: Users, label: 'My Clients' },
                        { id: 'documents', icon: FileText, label: 'My Documents' },
                        { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors ${activeTab === item.id
                                ? 'bg-sand-200/80 text-sand-900'
                                : 'text-sand-600 hover:bg-sand-200/50 hover:text-sand-800'
                                }`}
                        >
                            <item.icon className={`w-[18px] h-[18px] ${activeTab === item.id ? 'text-terracotta-600' : 'text-sand-400'}`} />
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Recent Chats with Search */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex-shrink-0 px-3 pt-4 pb-2">
                        <p className="text-xs text-sand-500 mb-2 px-2 font-medium">Recent Chats</p>

                        {/* Search Bar */}
                        <div className="px-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sand-400" />
                                <input
                                    type="text"
                                    placeholder="Search chats..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full py-1.5 pl-8 pr-3 text-xs rounded-lg border border-sand-200 bg-white/50 placeholder-sand-400 focus:outline-none focus:ring-1 focus:ring-sand-300 focus:border-sand-300"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Chat List */}
                    <div className="flex-1 overflow-y-auto px-3 pb-2">
                        <div className="space-y-1">
                            {(() => {
                                // Filter sessions by search query
                                const filteredSessions = searchQuery
                                    ? chatSessions.filter(s =>
                                        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        s.summary?.toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    : chatSessions;

                                if (filteredSessions.length === 0) {
                                    return (
                                        <p className="text-sand-400 text-sm px-2">
                                            {searchQuery ? 'No matching chats' : 'No conversations yet'}
                                        </p>
                                    );
                                }

                                return filteredSessions.slice(0, 20).map((session) => (
                                    <button
                                        key={session.id}
                                        onClick={() => loadCognitiveSession(session.id)}
                                        className={`w-full py-2 px-3 rounded-lg text-left text-sm truncate transition-colors flex items-center gap-2 ${currentSessionId === session.id
                                            ? 'bg-sand-200/80 text-sand-900'
                                            : 'text-sand-600 hover:text-sand-800 hover:bg-sand-200/50'
                                            }`}
                                    >
                                        {session.title_emoji && <span>{session.title_emoji}</span>}
                                        <span className="truncate flex-1">
                                            {session.title || 'New conversation'}
                                        </span>
                                        {session.is_starred && <span className="text-amber-500">★</span>}
                                    </button>
                                ));
                            })()}
                        </div>
                    </div>
                </div>

                {/* Contributor Stats Card */}
                {productUser && (
                    <div className="flex-shrink-0 px-3 py-3 border-t border-sand-200">
                        <div className="bg-white rounded-xl border border-sand-200 p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="text-2xl">
                                    {productUser.contributor_rank === 'diamond' ? '👑' :
                                        productUser.contributor_rank === 'platinum' ? '💎' :
                                            productUser.contributor_rank === 'gold' ? '🥇' :
                                                productUser.contributor_rank === 'silver' ? '🥈' :
                                                    productUser.contributor_rank === 'bronze' ? '🥉' : '🌱'}
                                </div>
                                <div>
                                    <p className="text-xs text-sand-500">Knowledge Contributor</p>
                                    <p className="text-sand-800 font-semibold capitalize text-sm">
                                        {productUser.contributor_rank || 'Newcomer'}
                                    </p>
                                </div>
                            </div>

                            {/* Score & Progress */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-sand-500">Score</span>
                                    <span className="text-sand-800 font-medium">{productUser.contributor_score || 0} pts</span>
                                </div>
                                <div className="h-2 bg-sand-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${Math.min(((productUser.contributor_score || 0) % 500) / 5, 100)}%`,
                                            backgroundColor: brandColor
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex justify-between text-xs text-sand-500">
                                <span>📄 {productUser.total_docs_contributed || 0} docs</span>
                                <span>🔥 {productUser.contribution_streak || 0} day streak</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* User Menu */}
                <div className="p-3 border-t border-sand-200">
                    <button
                        onClick={handleLogout}
                        className="w-full py-2.5 px-3 rounded-xl text-sand-600 hover:text-sand-800 hover:bg-sand-200/50 flex items-center gap-3 text-sm font-medium transition-colors"
                    >
                        <LogOut className="w-[18px] h-[18px] text-sand-400" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
                {/* Top Bar - Fixed */}
                <div className="flex-shrink-0 h-14 border-b border-sand-200 bg-white flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-sand-100 rounded-lg text-sand-500 hover:text-sand-700 transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h2 className="font-medium text-sand-800">
                            {activeTab === 'chat'
                                ? (currentSessionId
                                    ? (chatSessions.find(s => s.id === currentSessionId)?.title_emoji
                                        ? `${chatSessions.find(s => s.id === currentSessionId)?.title_emoji} ${chatSessions.find(s => s.id === currentSessionId)?.title || 'Chat'}`
                                        : chatSessions.find(s => s.id === currentSessionId)?.title || 'New Chat')
                                    : 'New Chat')
                                : activeTab === 'profile' ? 'My Profile'
                                    : activeTab === 'knowledge' ? 'Knowledge Graph'
                                        : activeTab === 'clients' ? 'My Clients'
                                            : activeTab === 'documents' ? 'My Documents'
                                                : 'Leaderboard'}
                        </h2>
                    </div>

                    {/* Right side actions - only show for chat */}
                    {activeTab === 'chat' && messages.length >= 2 && (
                        <button
                            onClick={() => handleCreateFlowchart()}
                            disabled={sending}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            style={{
                                backgroundColor: `${brandColor}15`,
                                color: brandColor
                            }}
                            title="Generate a flowchart summarizing this conversation"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span className="hidden sm:inline">Create Flowchart</span>
                        </button>
                    )}
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
                            <div className="max-w-3xl mx-auto p-6 space-y-6">
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
                                            <div
                                                className="max-w-[85%] rounded-2xl px-5 py-4 text-white"
                                                style={{ backgroundColor: brandColor }}
                                            >
                                                <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ) : (
                                            /* AI Message with Premium Rendering */
                                            <div className="max-w-[85%]">
                                                <AIMessage
                                                    content={msg.content}
                                                    sources={msg.sources}
                                                    brandColor={brandColor}
                                                    showSources={showSources === i}
                                                    onToggleSources={() => setShowSources(showSources === i ? null : i)}
                                                />
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

                        {/* Chat Input */}
                        <div className="border-t border-sand-200 bg-white p-4">
                            <div className="max-w-3xl mx-auto">
                                {contextFile && (
                                    <div className="mb-3 flex items-center gap-2 bg-terracotta-50 border border-terracotta-200 rounded-xl px-4 py-2">
                                        <Paperclip className="w-4 h-4 text-terracotta-600" />
                                        <span className="text-sm text-terracotta-700 flex-1 truncate">{contextFile.name}</span>
                                        <button
                                            onClick={() => setContextFile(null)}
                                            className="p-1 hover:bg-terracotta-100 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4 text-terracotta-600" />
                                        </button>
                                    </div>
                                )}
                                <div className="flex gap-3 items-center bg-sand-50 rounded-2xl p-2 border border-sand-200 focus-within:border-sand-300 transition-all">
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
                                    <button
                                        onClick={sendMessage}
                                        disabled={sending || !input.trim()}
                                        className="p-3 rounded-xl text-white disabled:opacity-50 transition-all"
                                        style={{ backgroundColor: brandColor }}
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'documents' ? (
                    /* Documents View */
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-sand-900">My Documents</h2>
                                    <p className="text-sand-500 text-sm">Upload and manage your personal knowledge library</p>
                                </div>
                                <label className="flex items-center gap-2 px-4 py-2.5 bg-sand-800 hover:bg-sand-900 text-white rounded-xl text-sm font-medium cursor-pointer transition-colors">
                                    <Upload className="w-4 h-4" />
                                    Upload Files
                                    <input
                                        ref={docInputRef}
                                        type="file"
                                        multiple
                                        onChange={handleFileInputChange}
                                        accept=".pdf,.txt,.md,.docx"
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* Upload Queue */}
                            {uploadQueue.length > 0 && (
                                <div className="mb-6 space-y-2">
                                    {uploadQueue.map((item, i) => (
                                        <div key={i} className="bg-white rounded-xl border border-sand-200 p-4">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-sand-400" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-sand-800 truncate">{item.file.name}</p>
                                                    <p className="text-xs text-sand-500">{item.message}</p>
                                                </div>
                                                {item.status === 'uploading' && (
                                                    <div className="w-6 h-6 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin"></div>
                                                )}
                                                {item.status === 'success' && (
                                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                )}
                                                {item.status === 'error' && (
                                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Documents List */}
                            {documents.length === 0 ? (
                                <div
                                    className={`text-center py-16 bg-white rounded-2xl border-2 border-dashed transition-colors ${isDragging ? 'border-terracotta-400 bg-terracotta-50' : 'border-sand-200'
                                        }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-sand-100 flex items-center justify-center">
                                        <Upload className="w-7 h-7 text-sand-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-sand-800 mb-2">No documents yet</h3>
                                    <p className="text-sand-500 mb-4">Drag and drop files here or click upload</p>
                                    <p className="text-xs text-sand-400">Supports PDF, TXT, MD, DOCX</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {documents.map((doc) => {
                                        const fileInfo = getFileIcon(doc.file_name || '');
                                        return (
                                            <div
                                                key={doc.id}
                                                className="group bg-white rounded-xl border border-sand-200 p-4 hover:border-sand-300 transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${fileInfo.bg}`}>
                                                        <fileInfo.icon className={`w-5 h-5 ${fileInfo.color}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sand-800 truncate">{doc.file_name}</p>
                                                        <p className="text-xs text-sand-500">
                                                            {doc.chunk_count} chunks • Uploaded {new Date(doc.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteDocument(doc.id)}
                                                        className="p-2 text-sand-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'clients' ? (
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
                ) : activeTab === 'knowledge' ? (
                    /* Knowledge Graph View */
                    <div className="flex-1 overflow-y-auto p-6">
                        <KnowledgeGraphDashboard
                            productUserId={productUser.id}
                        />
                    </div>
                ) : activeTab === 'profile' ? (
                    /* Profile View - Digital Twin */
                    <div className="flex-1 overflow-y-auto">
                        <CognitiveProfileDashboard
                            productUserId={productUser.id}
                            productId={product.id}
                        />
                    </div>
                ) : (
                    /* Leaderboard View */
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-sand-900">Knowledge Contributors</h2>
                                <p className="text-sand-500 text-sm">Top contributors to the knowledge base</p>
                            </div>
                            {leaderboardEntries.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-2xl border border-sand-200">
                                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center">
                                        <Trophy className="w-7 h-7 text-amber-500" />
                                    </div>
                                    <h3 className="text-lg font-medium text-sand-800 mb-2">No contributors yet</h3>
                                    <p className="text-sand-500">Be the first to contribute!</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {leaderboardEntries.map((entry, i) => (
                                        <div
                                            key={entry.id || i}
                                            className="bg-white rounded-xl border border-sand-200 p-4 hover:border-sand-300 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-amber-100 text-amber-600' :
                                                    i === 1 ? 'bg-gray-100 text-gray-500' :
                                                        i === 2 ? 'bg-orange-100 text-orange-600' :
                                                            'bg-sand-100 text-sand-500'
                                                    } font-bold`}>
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sand-800">{entry.display_name}</p>
                                                    <p className="text-xs text-sand-500">{entry.total_docs_contributed} docs • {entry.contributor_score} pts</p>
                                                </div>
                                                <span className="text-lg">
                                                    {entry.contributor_rank === 'diamond' ? '👑' :
                                                        entry.contributor_rank === 'platinum' ? '💎' :
                                                            entry.contributor_rank === 'gold' ? '🥇' :
                                                                entry.contributor_rank === 'silver' ? '🥈' :
                                                                    entry.contributor_rank === 'bronze' ? '🥉' : '🌱'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
