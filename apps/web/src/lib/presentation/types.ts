/**
 * KARR AI - AI Presentation Factory Types
 * 
 * SlideJSON Schema - The structured format for AI-generated presentations
 * This enables quality scoring, learning, and multi-format export
 */

// =====================================================
// DESIGN TOKENS
// =====================================================

export interface DesignTokens {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    fontHeading: string;
    fontBody: string;
    fontSizeBase: number;
    preferredLayouts: LayoutType[];
    imageStyle: string;
    learnedPreferences?: Record<string, unknown>;
}

// =====================================================
// SLIDE LAYOUTS
// =====================================================

export type LayoutType =
    | 'title-centered'      // Big title in center (opening/closing slides)
    | 'title-subtitle'      // Title with subtitle
    | 'split-image-left'    // Image on left, content on right
    | 'split-image-right'   // Content on left, image on right
    | 'bullet-list'         // Title + bullet points
    | 'numbered-list'       // Title + numbered items
    | 'comparison'          // Two-column comparison
    | 'quote'               // Large quote with attribution
    | 'statistics'          // Big numbers/stats
    | 'timeline'            // Horizontal timeline
    | 'image-full'          // Full-bleed image with overlay text
    | 'chart-focus'         // Chart/diagram as main focus
    | 'icon-grid'           // Grid of icons with labels
    | 'team-grid'           // Team member profiles
    | 'section-break';      // Section divider

// =====================================================
// SLIDE CONTENT ELEMENTS
// =====================================================

export interface SlideImage {
    type: 'ai-generated' | 'url' | 'icon';
    aiPrompt?: string;           // For AI generation
    url?: string;                // For external images
    iconName?: string;           // For icon type
    position: 'background' | 'left' | 'right' | 'center' | 'top' | 'bottom';
    opacity?: number;            // 0-1
    fit?: 'cover' | 'contain' | 'fill';
}

export interface BulletItem {
    icon?: string;               // Lucide icon name
    text: string;
    subItems?: string[];
}

export interface StatItem {
    value: string;               // "40%", "$1.2M", "500+"
    label: string;
    icon?: string;
    trend?: 'up' | 'down' | 'neutral';
}

export interface ComparisonColumn {
    title: string;
    items: string[];
    highlight?: boolean;
}

export interface TimelineItem {
    date: string;
    title: string;
    description?: string;
}

export interface ChartData {
    type: 'bar' | 'line' | 'pie' | 'donut';
    title?: string;
    data: Array<{ label: string; value: number; color?: string }>;
}

export interface TeamMember {
    name: string;
    role: string;
    imagePrompt?: string;
    imageUrl?: string;
}

// =====================================================
// SLIDE STRUCTURE
// =====================================================

export interface SlideContent {
    type: 'text' | 'bullet-list' | 'numbered-list' | 'statistics' | 'comparison' | 'timeline' | 'chart' | 'quote' | 'team-grid';

    // Text content
    text?: string;

    // List content
    items?: BulletItem[];

    // Statistics content
    stats?: StatItem[];

    // Comparison content
    columns?: ComparisonColumn[];

    // Timeline content
    timeline?: TimelineItem[];

    // Chart content
    chart?: ChartData;

    // Quote content
    quote?: string;
    attribution?: string;

    // Team content
    team?: TeamMember[];
}

export interface SlideBackground {
    type: 'solid' | 'gradient' | 'image';
    color?: string;
    colors?: string[];           // For gradient
    gradientDirection?: 'horizontal' | 'vertical' | 'diagonal';
    image?: SlideImage;
}

export interface Slide {
    id: string;
    layout: LayoutType;

    // Core content
    title?: string;
    subtitle?: string;
    content?: SlideContent;

    // Visual elements
    image?: SlideImage;
    background?: SlideBackground;

    // Speaker notes
    notes?: string;

    // Metadata for learning
    topicKeywords?: string[];
}

// =====================================================
// FULL PRESENTATION
// =====================================================

export interface SlideJSONPresentation {
    id: string;
    version: '1.0';

    // Metadata
    title: string;
    topic?: string;
    audience?: string;
    goal?: string;

    // Design
    designTokens: DesignTokens;

    // Content
    slides: Slide[];
    slideCount: number;

    // Generation metadata
    generatedAt: string;
    generatedBy: 'gemini-flash' | 'gemini-pro';
    templateId?: string;

    // Quality scores (0-100, filled after generation)
    qualityScores?: {
        overall: number;
        content: number;
        design: number;
        narrative: number;
        accessibility: number;
    };
}

// =====================================================
// GENERATION REQUEST/RESPONSE
// =====================================================

export interface PresentationRequest {
    productId: string;
    userId: string;
    chatSessionId?: string;

    // User input
    topic: string;
    audience?: string;
    goal?: string;
    slideCount?: number;        // Suggested count (5-15)
    style?: 'professional' | 'creative' | 'minimal' | 'bold';

    // Context from chat
    knowledgeContext?: string;  // Relevant KB chunks

    // Template preference
    templateId?: string;
}

export interface PresentationResponse {
    success: boolean;
    presentation?: SlideJSONPresentation;
    markdown?: string;          // Fallback for Reveal.js
    qualityScores?: {
        overall: number;
        content: number;
        design: number;
        narrative: number;
        accessibility: number;
    };
    error?: string;
}

// =====================================================
// FEEDBACK & LEARNING
// =====================================================

export interface PresentationFeedback {
    presentationId: string;
    userId: string;

    rating?: number;            // 1-5 stars
    feedback?: string;          // Text feedback

    // Implicit signals
    viewDurationSeconds?: number;
    downloadedPptx?: boolean;
    downloadedPdf?: boolean;
    wasEdited?: boolean;
    wasDiscarded?: boolean;
}

export interface PresentationEdit {
    presentationId: string;
    userId: string;

    editType: 'title' | 'content' | 'image' | 'layout' | 'style' | 'reorder' | 'add_slide' | 'remove_slide';
    slideIndex?: number;

    beforeValue?: unknown;
    afterValue?: unknown;

    editReason?: string;
}

// =====================================================
// TEMPLATE TYPES
// =====================================================

export interface PresentationTemplate {
    id: string;
    productId?: string;
    name: string;
    description?: string;
    category?: 'pitch' | 'educational' | 'report' | 'tutorial' | 'general';
    structure: Partial<SlideJSONPresentation>;
    slideCount: number;

    // Performance
    timesUsed: number;
    avgRating: number;
    totalRatings: number;
    downloadCount: number;

    isSystemTemplate: boolean;
}

// =====================================================
// EXPORT TYPES
// =====================================================

export interface ExportOptions {
    format: 'pptx' | 'pdf' | 'html' | 'markdown';
    includeNotes?: boolean;
    imageQuality?: 'low' | 'medium' | 'high';
}
