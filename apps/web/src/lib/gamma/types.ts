/**
 * 🎴 Gamma-Style Card Editor Types
 * Core type definitions for the block-based presentation system
 */

// ============================================
// CARD & BLOCK TYPES
// ============================================

export interface GammaPresentation {
    id: string;
    title: string;
    description?: string;
    productId: string;
    userId: string;
    cards: GammaCard[];
    theme: PresentationTheme;
    metadata: PresentationMetadata;
    createdAt: string;
    updatedAt: string;
}

export interface GammaCard {
    id: string;
    type: 'card' | 'nested-card';
    title?: string;
    layout: CardLayout;
    blocks: ContentBlock[];
    background?: BackgroundConfig;
    speakerNotes?: string;
    isHidden?: boolean;
    nestedCards?: GammaCard[];
    transition?: TransitionType;
}

export type CardLayout =
    | 'single-column'
    | 'two-column'
    | 'two-column-equal'
    | 'split-left'      // 40% left, 60% right
    | 'split-right'     // 60% left, 40% right
    | 'accent-left'     // Image left, content right
    | 'accent-right'    // Content left, image right
    | 'full-bleed'      // Full-width image/background
    | 'title-centered'  // Centered title card
    | 'comparison'      // Side-by-side comparison
    | 'gallery'         // Grid of images
    | 'stats'           // Big numbers layout
    | 'quote'           // Large quote centered
    | 'timeline'        // Horizontal timeline
    | 'team'            // Team member grid
    | 'pricing'         // Pricing table
    | 'features';       // Feature grid

export interface ContentBlock {
    id: string;
    type: BlockType;
    content: BlockContent;
    style?: BlockStyle;
    position?: BlockPosition;
}

export type BlockType =
    | 'heading'
    | 'paragraph'
    | 'bullet-list'
    | 'numbered-list'
    | 'image'
    | 'video'
    | 'embed'
    | 'chart'
    | 'table'
    | 'code'
    | 'quote'
    | 'divider'
    | 'toggle'
    | 'callout'
    | 'gallery'
    | 'button'
    | 'stat'
    | 'icon-text'
    | 'spacer';

export type BlockContent =
    | HeadingContent
    | TextContent
    | ListContent
    | ImageContent
    | VideoContent
    | EmbedContent
    | ChartContent
    | TableContent
    | CodeContent
    | QuoteContent
    | CalloutContent
    | ButtonContent
    | StatContent
    | IconTextContent
    | SpacerContent;

// Block Content Types
export interface HeadingContent {
    text: string;
    level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface TextContent {
    html: string; // TipTap HTML output
}

export interface ListContent {
    items: string[];
    ordered: boolean;
}

export interface ImageContent {
    src: string;
    alt?: string;
    caption?: string;
    fit: 'cover' | 'contain' | 'fill';
    aiPrompt?: string; // For regeneration
}

export interface VideoContent {
    src: string;
    type: 'youtube' | 'vimeo' | 'url' | 'upload';
    autoplay?: boolean;
}

export interface EmbedContent {
    url: string;
    html?: string;
}

export interface ChartContent {
    type: 'bar' | 'line' | 'pie' | 'donut' | 'area';
    data: { label: string; value: number; color?: string }[];
    title?: string;
}

export interface TableContent {
    headers: string[];
    rows: string[][];
    striped?: boolean;
}

export interface CodeContent {
    code: string;
    language: string;
    showLineNumbers?: boolean;
}

export interface QuoteContent {
    text: string;
    author?: string;
    source?: string;
}

export interface CalloutContent {
    type: 'info' | 'warning' | 'success' | 'error' | 'tip';
    title?: string;
    text: string;
}

export interface ButtonContent {
    text: string;
    url: string;
    variant: 'primary' | 'secondary' | 'outline';
}

export interface StatContent {
    value: string;
    label: string;
    prefix?: string;
    suffix?: string;
    trend?: 'up' | 'down' | 'neutral';
}

export interface IconTextContent {
    icon: string;
    title: string;
    description: string;
}

export interface SpacerContent {
    height: 'small' | 'medium' | 'large';
}

// ============================================
// STYLING
// ============================================

export interface BlockStyle {
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
    fontSize?: 'small' | 'normal' | 'large' | 'xlarge';
    fontWeight?: 'normal' | 'medium' | 'bold';
    padding?: string;
    margin?: string;
    borderRadius?: string;
    opacity?: number;
}

export interface BlockPosition {
    gridArea?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}

export interface BackgroundConfig {
    type: 'solid' | 'gradient' | 'image' | 'video';
    value: string; // color, gradient css, or URL
    overlay?: string; // Optional overlay color with opacity
    blur?: number;
}

export type TransitionType =
    | 'none'
    | 'fade'
    | 'slide-up'
    | 'slide-left'
    | 'zoom'
    | 'flip';

// ============================================
// THEMES
// ============================================

export interface PresentationTheme {
    id: string;
    name: string;
    category: 'minimal' | 'bold' | 'corporate' | 'creative' | 'dark' | 'light';

    colors: ThemeColors;
    typography: ThemeTypography;
    card: ThemeCardStyle;
    components: ThemeComponents;
}

export interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    success: string;
    warning: string;
    error: string;
}

export interface ThemeTypography {
    headingFont: string;
    bodyFont: string;
    headingSizes: {
        h1: string;
        h2: string;
        h3: string;
        h4: string;
        h5: string;
        h6: string;
    };
    bodySize: string;
    lineHeight: number;
    letterSpacing: string;
}

export interface ThemeCardStyle {
    background: string;
    borderRadius: string;
    padding: string;
    shadow: string;
    border?: string;
}

export interface ThemeComponents {
    button: {
        background: string;
        text: string;
        borderRadius: string;
        hoverBackground: string;
    };
    callout: {
        background: string;
        border: string;
        iconColor: string;
    };
    code: {
        background: string;
        text: string;
        border: string;
    };
    quote: {
        borderColor: string;
        textColor: string;
        backgroundColor: string;
    };
}

// ============================================
// METADATA
// ============================================

export interface PresentationMetadata {
    wordCount: number;
    estimatedDuration: number; // minutes
    slideCount: number;
    lastEditedCard?: string;
    collaborators?: string[];
    viewCount?: number;
    version: number;
}

// ============================================
// SMART LAYOUTS
// ============================================

export interface SmartLayout {
    id: CardLayout;
    name: string;
    description: string;
    category: 'content' | 'media' | 'data' | 'special';
    slots: LayoutSlot[];
    preview: string; // SVG or thumbnail URL
    suggestedFor: string[]; // content types
}

export interface LayoutSlot {
    id: string;
    name: string;
    type: 'text' | 'image' | 'media' | 'data' | 'any';
    gridArea: string;
    required: boolean;
    defaultBlock?: BlockType;
}

// ============================================
// GENERATION
// ============================================

export interface GenerationRequest {
    topic: string;
    audience: string;
    tone: 'professional' | 'casual' | 'educational' | 'inspiring' | 'technical';
    cardCount: number;
    style: string;
    includeImages: boolean;
    productId: string;
    userId: string;
    existingContent?: string; // Paste in content to convert
}

export interface GenerationOutline {
    title: string;
    cards: OutlineCard[];
    suggestedTheme: string;
}

export interface OutlineCard {
    title: string;
    layout: CardLayout;
    keyPoints: string[];
    suggestedImage?: string;
    speakerNotes?: string;
}

// ============================================
// EXPORT
// ============================================

export interface ExportOptions {
    format: 'pptx' | 'pdf' | 'png' | 'html';
    quality: 'draft' | 'standard' | 'high';
    includeNotes: boolean;
    includeHidden: boolean;
}
