// ============================================
// AI MARKETING ENGINE - TYPE DEFINITIONS
// ============================================

// Content Types
export type ContentType =
    | 'blog'
    | 'twitter_thread'
    | 'twitter_post'
    | 'linkedin_post'
    | 'linkedin_article'
    | 'instagram_post'
    | 'instagram_carousel'
    | 'video_script'
    | 'email'
    | 'reddit_post'
    | 'quora_answer';

export type Platform =
    | 'twitter'
    | 'linkedin'
    | 'instagram'
    | 'facebook'
    | 'youtube'
    | 'reddit'
    | 'quora'
    | 'medium'
    | 'hashnode'
    | 'devto';

export type SocialContentType =
    | 'post'
    | 'thread'
    | 'carousel'
    | 'story'
    | 'reel'
    | 'article'
    | 'answer'
    | 'comment';

// Status Types
export type IdeaStatus = 'idea' | 'approved' | 'in_progress' | 'review' | 'published' | 'rejected' | 'archived';
export type BlogStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived';
export type SocialPostStatus = 'draft' | 'review' | 'approved' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'archived';

// Product Marketing Profile
export interface ProductMarketingProfile {
    id: string;
    product_id: string;

    // Brand Identity
    brand_voice: string;
    tone_keywords: string[];
    language_style: string;
    tagline?: string;
    unique_value_proposition?: string;

    // Target Audience
    primary_persona: Persona;
    secondary_personas: Persona[];

    // Content Pillars
    content_pillars: string[];
    pillar_weights: Record<string, number>;

    // Competitors
    competitors: Competitor[];

    // Keywords
    primary_keywords: string[];
    secondary_keywords: string[];
    long_tail_keywords: string[];

    // Publishing Rules
    blog_frequency: string;
    twitter_frequency: string;
    linkedin_frequency: string;
    instagram_frequency: string;
    posting_timezone: string;
    optimal_hours: Record<Platform, number[]>;

    // Settings
    auto_publish_blogs: boolean;
    auto_publish_social: boolean;
    require_human_approval: boolean;
    ai_model_preference: string;
    content_generation_enabled: boolean;

    created_at: string;
    updated_at: string;
}

export interface Persona {
    name: string;
    description?: string;
    pain_points: string[];
    goals: string[];
    demographics: {
        age_range?: string;
        location?: string;
        job_titles?: string[];
        industries?: string[];
    };
    channels?: string[];
    content_preferences?: string[];
}

export interface Competitor {
    name: string;
    url: string;
    description?: string;
    strengths: string[];
    weaknesses: string[];
    content_strategy?: string;
}

// Content Idea
export interface ContentIdea {
    id: string;
    product_id: string;

    title: string;
    description?: string;
    content_type: ContentType;
    content_pillar?: string;
    target_keywords: string[];
    outline?: ContentOutline;

    // Scoring
    trend_score: number;
    gap_score: number;
    viral_potential: number;
    seo_potential: number;
    aeo_potential: number;
    overall_score: number;

    // Status
    status: IdeaStatus;
    priority: number;

    // Metadata
    source: 'ai_generated' | 'trend_detection' | 'competitor_gap' | 'user_question' | 'manual';
    source_url?: string;
    source_data?: Record<string, unknown>;

    assigned_to?: string;
    scheduled_for?: string;

    created_at: string;
    updated_at: string;
}

export interface ContentOutline {
    introduction: string;
    sections: {
        heading: string;
        subheadings?: string[];
        key_points?: string[];
    }[];
    conclusion: string;
    faqs?: { question: string; answer_outline: string }[];
}

// Blog Post
export interface BlogPost {
    id: string;
    product_id: string;
    idea_id?: string;
    author_id?: string;

    // Content
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    content_html?: string;
    featured_image?: string;

    // SEO
    meta_title?: string;
    meta_description?: string;
    og_image?: string;
    og_title?: string;
    og_description?: string;
    canonical_url?: string;

    // AEO
    faqs: FAQ[];
    definitions: Definition[];
    key_takeaways: string[];
    structured_data?: Record<string, unknown>;

    // Classification
    category?: string;
    tags: string[];
    keywords: string[];

    // Scoring
    seo_score?: number;
    aeo_score?: number;
    readability_score?: number;
    word_count?: number;
    read_time_minutes?: number;

    // Publishing
    status: BlogStatus;
    published_at?: string;
    scheduled_for?: string;
    publish_to: string[];
    external_urls: Record<string, string>;

    // Internal Linking
    related_posts: string[];

    // Analytics
    views: number;
    unique_visitors: number;
    avg_time_on_page: number;
    bounce_rate?: number;
    scroll_depth?: number;
    shares: number;
    comments_count: number;

    // AI Learning
    keywords_ranked: Record<string, number>;
    llm_citations: number;

    version: number;

    created_at: string;
    updated_at: string;
}

export interface FAQ {
    question: string;
    answer: string;
}

export interface Definition {
    term: string;
    definition: string;
    related_terms?: string[];
}

// AI Social Post
export interface AISocialPost {
    id: string;
    product_id: string;
    idea_id?: string;
    blog_id?: string;

    // Content
    platform: Platform;
    content_type: SocialContentType;
    content: string;
    content_variations: string[];
    thread_parts: string[];
    carousel_slides: CarouselSlide[];
    media_urls: string[];
    hashtags: string[];
    mentions: string[];
    link_url?: string;
    call_to_action?: string;

    // AI Generation
    ai_model?: string;
    generation_prompt?: string;
    generation_temperature?: number;

    // Scheduling
    status: SocialPostStatus;
    scheduled_for?: string;
    published_at?: string;
    optimal_time_calculated: boolean;

    // External
    external_post_id?: string;
    external_url?: string;

    // Analytics
    impressions: number;
    reach: number;
    engagements: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    profile_visits: number;
    engagement_rate?: number;
    click_through_rate?: number;

    // Learning
    performance_score?: number;
    viral_success: boolean;
    learnings: string[];

    // A/B Testing
    ab_test_id?: string;
    ab_variant?: string;

    created_at: string;
    updated_at: string;
}

export interface CarouselSlide {
    index: number;
    text: string;
    image_url?: string;
    image_prompt?: string;
}

// Daily Report
export interface MarketingDailyReport {
    id: string;
    product_id: string;
    report_date: string;

    total_impressions: number;
    total_engagements: number;
    total_clicks: number;
    total_new_followers: number;
    blog_views: number;
    blog_unique_visitors: number;

    platform_metrics: Record<Platform, PlatformMetrics>;

    top_posts: TopPost[];
    worst_posts: TopPost[];

    ai_insights: string[];
    pattern_changes: Record<string, unknown>;
    anomalies: Anomaly[];

    strategy_recommendations: string[];
    content_suggestions: ContentSuggestion[];
    timing_adjustments: Record<Platform, number[]>;

    vs_yesterday: Comparison;
    vs_last_week: Comparison;
    vs_last_month: Comparison;

    created_at: string;
}

export interface PlatformMetrics {
    impressions: number;
    engagements: number;
    clicks: number;
    followers_change: number;
    top_post_id?: string;
}

export interface TopPost {
    id: string;
    platform: Platform;
    content_preview: string;
    metric_name: string;
    metric_value: number;
    published_at: string;
}

export interface Anomaly {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    metric: string;
    expected: number;
    actual: number;
}

export interface ContentSuggestion {
    type: ContentType;
    topic: string;
    reasoning: string;
    priority: number;
    suggested_date?: string;
}

export interface Comparison {
    impressions_change: number;
    engagements_change: number;
    clicks_change: number;
}

// LLM Citation
export interface LLMCitation {
    id: string;
    product_id: string;

    llm_name: 'chatgpt' | 'claude' | 'perplexity' | 'gemini' | 'copilot' | 'other';
    llm_model?: string;
    query?: string;
    response_snippet?: string;
    full_response?: string;
    citation_type: 'direct_mention' | 'recommendation' | 'comparison' | 'definition' | 'link';
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence?: number;

    source_url?: string;
    screenshot_url?: string;

    verified: boolean;
    verified_by?: string;
    verified_at?: string;

    discovered_at: string;
    discovered_by: string;
}

// Content Learning
export interface ContentLearning {
    id: string;
    product_id: string;

    learning_type: 'format' | 'topic' | 'timing' | 'hashtag' | 'length' | 'tone' | 'visual' | 'cta' | 'platform';
    platform?: Platform;
    finding: string;
    details: Record<string, unknown>;

    confidence: number;
    sample_size: number;
    statistical_significance?: number;

    metric_name?: string;
    before_value?: number;
    after_value?: number;
    improvement_percent?: number;

    applied_to_strategy: boolean;
    applied_at?: string;
    strategy_change_description?: string;

    valid_from: string;
    valid_until?: string;
    superseded_by?: string;

    created_at: string;
}

// Content Calendar Entry
export interface ContentCalendarEntry {
    id: string;
    product_id: string;

    entry_date: string;
    entry_type: 'blog' | 'social' | 'email' | 'video' | 'event' | 'milestone';
    title: string;
    description?: string;

    idea_id?: string;
    blog_id?: string;
    social_post_id?: string;

    assigned_to?: string;
    status: 'planned' | 'in_progress' | 'review' | 'ready' | 'published' | 'cancelled';

    platforms: string[];
    tags: string[];
    notes?: string;

    created_at: string;
    updated_at: string;
}

// AI Generation Request/Response
export interface GenerateBlogRequest {
    product_id: string;
    idea_id?: string;
    title: string;
    keywords: string[];
    content_pillar?: string;
    target_word_count?: number;
    include_faqs?: boolean;
    include_definitions?: boolean;
    tone?: string;
}

export interface GenerateSocialPostRequest {
    product_id: string;
    platform: Platform;
    content_type: SocialContentType;
    topic: string;
    blog_id?: string;
    hashtag_count?: number;
    include_cta?: boolean;
    tone?: string;
    thread_length?: number;
    carousel_slide_count?: number;
}

export interface ContentScore {
    seo_score: number;
    aeo_score: number;
    readability_score: number;
    viral_potential: number;
    issues: ContentIssue[];
    suggestions: string[];
}

export interface ContentIssue {
    type: 'error' | 'warning' | 'info';
    category: 'seo' | 'aeo' | 'readability' | 'engagement';
    message: string;
    fix?: string;
}
