/**
 * Karr AI Database Types
 * 
 * This file contains TypeScript types for all database tables.
 * In production, these should be auto-generated using:
 * `supabase gen types typescript --project-id <project-id>`
 */

// =====================================================
// ENUMS
// =====================================================

export type ProductStatus = 'draft' | 'active' | 'paused' | 'archived';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type DocumentType = 'act' | 'statute' | 'circular' | 'notification' | 'judgment' | 'order' | 'commentary' | 'form' | 'guide' | 'other';
export type ContributionStatus = 'private' | 'submitted' | 'approved' | 'rejected';
export type ConversationStatus = 'active' | 'archived' | 'deleted';
export type MessageRole = 'user' | 'assistant' | 'system';
export type ActionType = 'email' | 'pdf_export' | 'word_export' | 'excel_export' | 'calendar_event' | 'form_fill' | 'portal_action';
export type ActionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type MetricType = 'query' | 'upload' | 'export' | 'email' | 'api_call';
export type EventCategory = 'auth' | 'query' | 'action' | 'document' | 'subscription' | 'admin' | 'system';
export type SourceType = 'upload' | 'url' | 'api' | 'manual';
export type SurveillanceSourceType = 'rss' | 'website' | 'api' | 'gazette';
export type SurveillanceStatus = 'pending' | 'approved' | 'rejected' | 'ingested';
export type DeadlineStatus = 'upcoming' | 'completed' | 'overdue' | 'canceled';
export type MessageFeedback = 'positive' | 'negative';

// =====================================================
// PRODUCTS
// =====================================================

export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    domain: string | null;
    status: ProductStatus;
    jurisdiction: string[];
    logo_url: string | null;
    favicon_url: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    config: ProductConfig;
    ai_config: AIConfig;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export interface ProductConfig {
    welcome_message: string;
    personality: string;
    confidence_threshold: number;
    low_confidence_behavior: 'ask_clarification' | 'flag_review' | 'disclaimer';
}

export interface AIConfig {
    primary_model: string;
    fallback_model: string;
    temperature: number;
    max_tokens: number;
}

export interface ProductTier {
    id: string;
    product_id: string;
    name: string;
    slug: string;
    description: string | null;
    price_monthly: number | null;
    price_annual: number | null;
    currency: string;
    queries_per_month: number | null;
    documents_limit: number | null;
    storage_mb: number;
    features: string[];
    trial_days: number;
    is_active: boolean;
    display_order: number;
    created_at: string;
}

// =====================================================
// USERS
// =====================================================

export interface UserProfile {
    id: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    profession: string | null;
    organization_name: string | null;
    gstin: string | null;
    pan: string | null;
    jurisdiction: string;
    state: string | null;
    city: string | null;
    preferences: UserPreferences;
    created_at: string;
    updated_at: string;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
}

export interface Subscription {
    id: string;
    user_id: string;
    product_id: string;
    tier_id: string | null;
    status: SubscriptionStatus;
    stripe_subscription_id: string | null;
    stripe_customer_id: string | null;
    razorpay_subscription_id: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    trial_ends_at: string | null;
    canceled_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface UsageRecord {
    id: string;
    user_id: string | null;
    product_id: string | null;
    subscription_id: string | null;
    metric_type: MetricType;
    quantity: number;
    metadata: Record<string, unknown>;
    created_at: string;
}

// =====================================================
// KNOWLEDGE BASE
// =====================================================

export interface KnowledgeDocument {
    id: string;
    product_id: string;
    title: string;
    source_type: SourceType;
    source_url: string | null;
    file_path: string | null;
    document_type: DocumentType | null;
    authority_level: number;
    jurisdiction: string | null;
    categories: string[];
    tags: string[];
    effective_from: string | null;
    effective_until: string | null;
    is_superseded: boolean;
    superseded_by: string | null;
    status: DocumentStatus;
    processing_error: string | null;
    chunk_count: number;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export interface KnowledgeChunk {
    id: string;
    document_id: string;
    product_id: string | null;
    content: string;
    chunk_index: number;
    embedding: number[] | null;
    section_hierarchy: string[];
    page_number: number | null;
    entities: Record<string, unknown>;
    token_count: number | null;
    created_at: string;
}

export interface UserDocument {
    id: string;
    user_id: string;
    product_id: string | null;
    title: string;
    file_path: string;
    file_type: string | null;
    file_size: number | null;
    folder_path: string;
    status: DocumentStatus;
    processing_error: string | null;
    chunk_count: number;
    contribution_status: ContributionStatus;
    quality_score: number | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface UserDocumentChunk {
    id: string;
    document_id: string;
    user_id: string | null;
    product_id: string | null;
    content: string;
    chunk_index: number;
    embedding: number[] | null;
    token_count: number | null;
    created_at: string;
}

// =====================================================
// CONVERSATIONS
// =====================================================

export interface Conversation {
    id: string;
    user_id: string;
    product_id: string | null;
    title: string | null;
    status: ConversationStatus;
    message_count: number;
    last_message_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    user_id: string | null;
    role: MessageRole;
    content: string;
    model_used: string | null;
    tokens_prompt: number | null;
    tokens_completion: number | null;
    latency_ms: number | null;
    confidence_score: number | null;
    sources: MessageSource[];
    reasoning_chain: ReasoningStep[] | null;
    feedback: MessageFeedback | null;
    feedback_comment: string | null;
    created_at: string;
}

export interface MessageSource {
    chunk_id: string;
    document_id: string;
    document_title: string;
    document_type: string | null;
    authority_level: number;
    content_preview: string;
    relevance_score: number;
}

export interface ReasoningStep {
    step: number;
    type: 'understanding' | 'retrieval' | 'analysis' | 'synthesis' | 'verification';
    description: string;
    confidence: number;
}

// =====================================================
// ACTIONS
// =====================================================

export interface Action {
    id: string;
    user_id: string | null;
    product_id: string | null;
    message_id: string | null;
    action_type: ActionType;
    status: ActionStatus;
    input_data: Record<string, unknown>;
    output_data: Record<string, unknown> | null;
    file_path: string | null;
    error_message: string | null;
    retry_count: number;
    created_at: string;
    completed_at: string | null;
}

// =====================================================
// AUDIT & SURVEILLANCE
// =====================================================

export interface AuditLog {
    id: string;
    user_id: string | null;
    product_id: string | null;
    event_type: string;
    event_category: EventCategory;
    event_data: Record<string, unknown>;
    ip_address: string | null;
    user_agent: string | null;
    session_id: string | null;
    created_at: string;
}

export interface SurveillanceSource {
    id: string;
    product_id: string | null;
    name: string;
    source_type: SurveillanceSourceType;
    url: string;
    check_frequency_hours: number;
    selectors: Record<string, string> | null;
    is_active: boolean;
    last_checked_at: string | null;
    last_error: string | null;
    consecutive_failures: number;
    created_at: string;
    updated_at: string;
}

export interface SurveillanceFinding {
    id: string;
    source_id: string | null;
    product_id: string | null;
    title: string | null;
    content_preview: string | null;
    source_url: string | null;
    published_at: string | null;
    ai_summary: string | null;
    ai_relevance_score: number | null;
    ai_categories: string[] | null;
    ai_impact_assessment: string | null;
    status: SurveillanceStatus;
    reviewed_by: string | null;
    reviewed_at: string | null;
    knowledge_document_id: string | null;
    created_at: string;
}

// =====================================================
// DEADLINES
// =====================================================

export interface Deadline {
    id: string;
    user_id: string | null;
    product_id: string | null;
    title: string;
    description: string | null;
    deadline_type: string | null;
    due_date: string;
    due_time: string | null;
    is_recurring: boolean;
    recurrence_rule: string | null;
    status: DeadlineStatus;
    completed_at: string | null;
    reminder_days: number[];
    last_reminder_sent_at: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

// =====================================================
// DATABASE TYPES (for Supabase)
// =====================================================

export interface Database {
    public: {
        Tables: {
            products: {
                Row: Product;
                Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Product, 'id'>>;
            };
            product_tiers: {
                Row: ProductTier;
                Insert: Omit<ProductTier, 'id' | 'created_at'>;
                Update: Partial<Omit<ProductTier, 'id'>>;
            };
            user_profiles: {
                Row: UserProfile;
                Insert: Omit<UserProfile, 'created_at' | 'updated_at'>;
                Update: Partial<Omit<UserProfile, 'id'>>;
            };
            subscriptions: {
                Row: Subscription;
                Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Subscription, 'id'>>;
            };
            usage_records: {
                Row: UsageRecord;
                Insert: Omit<UsageRecord, 'id' | 'created_at'>;
                Update: Partial<Omit<UsageRecord, 'id'>>;
            };
            knowledge_documents: {
                Row: KnowledgeDocument;
                Insert: Omit<KnowledgeDocument, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<KnowledgeDocument, 'id'>>;
            };
            knowledge_chunks: {
                Row: KnowledgeChunk;
                Insert: Omit<KnowledgeChunk, 'id' | 'created_at'>;
                Update: Partial<Omit<KnowledgeChunk, 'id'>>;
            };
            user_documents: {
                Row: UserDocument;
                Insert: Omit<UserDocument, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<UserDocument, 'id'>>;
            };
            user_document_chunks: {
                Row: UserDocumentChunk;
                Insert: Omit<UserDocumentChunk, 'id' | 'created_at'>;
                Update: Partial<Omit<UserDocumentChunk, 'id'>>;
            };
            conversations: {
                Row: Conversation;
                Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Conversation, 'id'>>;
            };
            messages: {
                Row: Message;
                Insert: Omit<Message, 'id' | 'created_at'>;
                Update: Partial<Omit<Message, 'id'>>;
            };
            actions: {
                Row: Action;
                Insert: Omit<Action, 'id' | 'created_at'>;
                Update: Partial<Omit<Action, 'id'>>;
            };
            audit_logs: {
                Row: AuditLog;
                Insert: Omit<AuditLog, 'id' | 'created_at'>;
                Update: never;
            };
            surveillance_sources: {
                Row: SurveillanceSource;
                Insert: Omit<SurveillanceSource, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<SurveillanceSource, 'id'>>;
            };
            surveillance_findings: {
                Row: SurveillanceFinding;
                Insert: Omit<SurveillanceFinding, 'id' | 'created_at'>;
                Update: Partial<Omit<SurveillanceFinding, 'id'>>;
            };
            deadlines: {
                Row: Deadline;
                Insert: Omit<Deadline, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Deadline, 'id'>>;
            };
        };
        Functions: {
            hybrid_search: {
                Args: {
                    query_embedding: number[];
                    query_text: string;
                    p_product_id: string;
                    p_user_id?: string;
                    match_count?: number;
                    similarity_threshold?: number;
                };
                Returns: {
                    chunk_id: string;
                    content: string;
                    document_id: string;
                    document_title: string;
                    document_type: string | null;
                    authority_level: number;
                    source_tier: string;
                    similarity_score: number;
                    combined_score: number;
                }[];
            };
            check_usage_limit: {
                Args: {
                    p_user_id: string;
                    p_product_id: string;
                    p_metric_type: string;
                };
                Returns: {
                    allowed: boolean;
                    limit: number | null;
                    used: number;
                    remaining?: number;
                };
            };
        };
    };
}
