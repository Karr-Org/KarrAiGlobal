/**
 * KARR AI - Cognitive Session Manager
 * 
 * Manages chat sessions with intelligent persistence, auto-titling,
 * and metadata extraction. Part of the Cognitive Digital Twin system.
 */

import { createClient } from '@supabase/supabase-js';

// Types
export interface ChatSession {
    id: string;
    product_user_id: string;
    product_id: string;
    title: string | null;
    title_emoji: string | null;
    summary: string | null;
    topics: string[];
    primary_topic: string | null;
    entities_mentioned: EntityMention[];
    dominant_sentiment: string | null;
    resolution_status: string;
    message_count: number;
    user_message_count: number;
    started_at: string;
    last_message_at: string;
    is_active: boolean;
    is_starred: boolean;
    is_pinned: boolean;
    created_at: string;
}

export interface ChatMessage {
    id: string;
    session_id: string;
    message_index: number;
    role: 'user' | 'assistant';
    content: string;
    original_query?: string;
    rewritten_query?: string;
    sources?: any[];
    confidence?: number;
    reasoning_data?: any;
    entities_mentioned?: EntityMention[];
    sentiment?: string;
    created_at: string;
}

export interface EntityMention {
    name: string;
    type: 'person' | 'company' | 'place' | 'product' | 'concept';
    subtype?: string;
    context?: string;
}

export interface SessionCreateInput {
    product_user_id: string;
    product_id: string;
    continued_from_session_id?: string;
}

export interface MessageCreateInput {
    session_id: string;
    role: 'user' | 'assistant';
    content: string;
    original_query?: string;
    rewritten_query?: string;
    query_rewrite_reason?: string;
    sources?: any[];
    confidence?: number;
    reasoning_data?: any;
    reasoning_duration_ms?: number;
    crag_verdict?: string;
    crag_confidence?: number;
    entities_mentioned?: EntityMention[];
    sentiment?: string;
    sentiment_score?: number;
}

/**
 * Session Manager Class
 * Handles all session and message operations
 */
export class SessionManager {
    private supabase;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    /**
     * Create a new chat session
     */
    async createSession(input: SessionCreateInput): Promise<ChatSession | null> {
        const { data, error } = await this.supabase
            .from('chat_sessions')
            .insert({
                product_user_id: input.product_user_id,
                product_id: input.product_id,
                continued_from_session_id: input.continued_from_session_id,
                started_at: new Date().toISOString(),
                last_message_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('[SessionManager] Error creating session:', error);
            return null;
        }

        return data;
    }

    /**
     * Get or create an active session for a user
     * Returns the most recent active session or creates a new one
     */
    async getOrCreateActiveSession(
        productUserId: string,
        productId: string,
        maxIdleMinutes: number = 30
    ): Promise<ChatSession | null> {
        // Check for recent active session
        const cutoffTime = new Date(Date.now() - maxIdleMinutes * 60 * 1000).toISOString();

        const { data: existingSession, error: fetchError } = await this.supabase
            .from('chat_sessions')
            .select('*')
            .eq('product_user_id', productUserId)
            .eq('product_id', productId)
            .eq('is_active', true)
            .gte('last_message_at', cutoffTime)
            .order('last_message_at', { ascending: false })
            .limit(1)
            .single();

        if (existingSession && !fetchError) {
            return existingSession;
        }

        // Create new session
        return this.createSession({
            product_user_id: productUserId,
            product_id: productId,
        });
    }

    /**
     * Add a message to a session
     */
    async addMessage(input: MessageCreateInput): Promise<ChatMessage | null> {
        // Get current message count for index
        const { count } = await this.supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .or(`session_id.eq.${input.session_id},chat_session_id.eq.${input.session_id}`);

        const messageIndex = (count || 0);

        const { data, error } = await this.supabase
            .from('chat_messages')
            .insert({
                // IMPORTANT: Include BOTH session_id (new) and chat_session_id (legacy NOT NULL)
                session_id: input.session_id,
                chat_session_id: input.session_id, // Legacy column - required!
                message_index: messageIndex,
                role: input.role,
                content: input.content,
                original_query: input.original_query,
                rewritten_query: input.rewritten_query,
                query_rewrite_reason: input.query_rewrite_reason,
                sources: input.sources || [],
                source_count: input.sources?.length || 0,
                confidence: input.confidence,
                reasoning_enabled: !!input.reasoning_data,
                reasoning_data: input.reasoning_data,
                reasoning_duration_ms: input.reasoning_duration_ms,
                crag_verdict: input.crag_verdict,
                crag_confidence: input.crag_confidence,
                entities_mentioned: input.entities_mentioned || [],
                sentiment: input.sentiment,
                sentiment_score: input.sentiment_score,
                response_length: input.content.length,
            })
            .select()
            .single();

        if (error) {
            console.error('[SessionManager] Error adding message:', error);
            return null;
        }

        // Update session stats
        await this.updateSessionStats(input.session_id, input.role);

        return data;
    }


    /**
     * Update session statistics after adding a message
     */
    private async updateSessionStats(sessionId: string, role: 'user' | 'assistant'): Promise<void> {
        const { data: session } = await this.supabase
            .from('chat_sessions')
            .select('message_count, user_message_count')
            .eq('id', sessionId)
            .single();

        if (!session) return;

        const updates: any = {
            message_count: (session.message_count || 0) + 1,
            last_message_at: new Date().toISOString(),
        };

        if (role === 'user') {
            updates.user_message_count = (session.user_message_count || 0) + 1;
        }

        await this.supabase
            .from('chat_sessions')
            .update(updates)
            .eq('id', sessionId);
    }

    /**
     * Update session title and metadata
     */
    async updateSessionMetadata(
        sessionId: string,
        metadata: {
            title?: string;
            title_emoji?: string;
            summary?: string;
            topics?: string[];
            primary_topic?: string;
            entities_mentioned?: EntityMention[];
            dominant_sentiment?: string;
            resolution_status?: string;
            user_insights?: any;
        }
    ): Promise<boolean> {
        const updates: any = { ...metadata };

        if (metadata.summary) {
            updates.summary_updated_at = new Date().toISOString();
        }

        const { error } = await this.supabase
            .from('chat_sessions')
            .update(updates)
            .eq('id', sessionId);

        if (error) {
            console.error('[SessionManager] Error updating session metadata:', error);
            return false;
        }

        return true;
    }

    /**
     * Get all sessions for a user (with pagination)
     */
    async getUserSessions(
        productUserId: string,
        productId: string,
        options: {
            limit?: number;
            offset?: number;
            includeArchived?: boolean;
        } = {}
    ): Promise<ChatSession[]> {
        const { limit = 20, offset = 0, includeArchived = false } = options;

        let query = this.supabase
            .from('chat_sessions')
            .select('*')
            .eq('product_user_id', productUserId)
            .eq('product_id', productId)
            .order('is_pinned', { ascending: false })
            .order('last_message_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (!includeArchived) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[SessionManager] Error fetching sessions:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Get a specific session with all messages
     */
    async getSessionWithMessages(sessionId: string): Promise<{
        session: ChatSession;
        messages: ChatMessage[];
    } | null> {
        const { data: session, error: sessionError } = await this.supabase
            .from('chat_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            console.error('[SessionManager] Error fetching session:', sessionError);
            return null;
        }

        const { data: messages, error: messagesError } = await this.supabase
            .from('chat_messages')
            .select('*')
            .or(`session_id.eq.${sessionId},chat_session_id.eq.${sessionId}`)
            .order('message_index', { ascending: true });

        if (messagesError) {
            console.error('[SessionManager] Error fetching messages:', messagesError);
            return null;
        }

        return {
            session,
            messages: messages || [],
        };
    }

    /**
     * Star/unstar a session
     */
    async toggleSessionStar(sessionId: string): Promise<boolean> {
        const { data: session } = await this.supabase
            .from('chat_sessions')
            .select('is_starred')
            .eq('id', sessionId)
            .single();

        if (!session) return false;

        const { error } = await this.supabase
            .from('chat_sessions')
            .update({ is_starred: !session.is_starred })
            .eq('id', sessionId);

        return !error;
    }

    /**
     * Pin/unpin a session
     */
    async toggleSessionPin(sessionId: string): Promise<boolean> {
        const { data: session } = await this.supabase
            .from('chat_sessions')
            .select('is_pinned')
            .eq('id', sessionId)
            .single();

        if (!session) return false;

        const { error } = await this.supabase
            .from('chat_sessions')
            .update({ is_pinned: !session.is_pinned })
            .eq('id', sessionId);

        return !error;
    }

    /**
     * Archive a session
     */
    async archiveSession(sessionId: string, reason: string = 'completed'): Promise<boolean> {
        const { error } = await this.supabase
            .from('chat_sessions')
            .update({
                is_active: false,
                archive_reason: reason
            })
            .eq('id', sessionId);

        return !error;
    }

    /**
     * Delete a session and all its messages
     */
    async deleteSession(sessionId: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('chat_sessions')
            .delete()
            .eq('id', sessionId);

        return !error;
    }

    /**
     * Search sessions by topic or content
     */
    async searchSessions(
        productUserId: string,
        productId: string,
        query: string
    ): Promise<ChatSession[]> {
        // Search in titles, summaries, and topics
        const { data, error } = await this.supabase
            .from('chat_sessions')
            .select('*')
            .eq('product_user_id', productUserId)
            .eq('product_id', productId)
            .or(`title.ilike.%${query}%,summary.ilike.%${query}%,primary_topic.ilike.%${query}%`)
            .order('last_message_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('[SessionManager] Error searching sessions:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Get session statistics for a user
     */
    async getUserSessionStats(productUserId: string, productId: string): Promise<{
        totalSessions: number;
        totalMessages: number;
        activeSessionsToday: number;
        topTopics: string[];
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: totalSessions } = await this.supabase
            .from('chat_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('product_user_id', productUserId)
            .eq('product_id', productId);

        const { data: sessions } = await this.supabase
            .from('chat_sessions')
            .select('message_count, topics, started_at')
            .eq('product_user_id', productUserId)
            .eq('product_id', productId);

        const totalMessages = sessions?.reduce((sum, s) => sum + (s.message_count || 0), 0) || 0;
        const activeSessionsToday = sessions?.filter(s =>
            new Date(s.started_at) >= today
        ).length || 0;

        // Extract top topics
        const topicCounts: Record<string, number> = {};
        sessions?.forEach(s => {
            (s.topics || []).forEach((topic: string) => {
                topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            });
        });
        const topTopics = Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([topic]) => topic);

        return {
            totalSessions: totalSessions || 0,
            totalMessages,
            activeSessionsToday,
            topTopics,
        };
    }
}

/**
 * Create a session manager instance
 */
export function createSessionManager(): SessionManager {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return new SessionManager(supabaseUrl, supabaseKey);
}

export default SessionManager;
