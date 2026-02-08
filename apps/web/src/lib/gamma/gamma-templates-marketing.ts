/**
 * 🎨 Marketing Campaign Templates
 * Specialized templates for marketing presentations:
 * - Social Media Campaigns
 * - Email Marketing
 * - Brand Guidelines
 * - Product Marketing
 * - Event Marketing
 * - Influencer Marketing
 */

import { GammaTemplate } from './gamma-templates';

// ==========================================
// SOCIAL MEDIA CAMPAIGN TEMPLATES
// ==========================================
export const SOCIAL_MEDIA_TEMPLATES: GammaTemplate[] = [
    {
        id: 'social-campaign-overview',
        layout: 'gamma-title-gradient',
        name: 'Campaign Overview',
        category: 'title',
        description: 'Social media campaign introduction',
        elements: [
            { id: 'campaignName', type: 'title', required: true, maxLength: 50, style: 'serif', size: 'xxl' },
            { id: 'hashtag', type: 'label', required: true, maxLength: 30, style: 'accent', size: 'lg' },
            { id: 'duration', type: 'subheading', required: true, maxLength: 50, style: 'sans', size: 'md' },
            { id: 'platforms', type: 'caption', required: false, maxLength: 60, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: true, hasAccentBar: false, hasCards: false, bgStyle: 'gradient' }
    },
    {
        id: 'social-audience-personas',
        layout: 'gamma-features-3col',
        name: 'Audience Personas',
        category: 'team',
        description: 'Target audience breakdown',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'persona1Name', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'persona1Age', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'sm' },
            { id: 'persona1Traits', type: 'bullets', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'persona2Name', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'persona2Age', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'sm' },
            { id: 'persona2Traits', type: 'bullets', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'persona3Name', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'persona3Age', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'sm' },
            { id: 'persona3Traits', type: 'bullets', required: true, maxLength: 100, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'avatar1', position: 'avatar', aspectRatio: '1:1', size: 'medium', keywords: ['person', 'portrait'] },
            { id: 'avatar2', position: 'avatar', aspectRatio: '1:1', size: 'medium', keywords: ['person', 'portrait'] },
            { id: 'avatar3', position: 'avatar', aspectRatio: '1:1', size: 'medium', keywords: ['person', 'portrait'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'social-content-calendar',
        layout: 'gamma-timeline-horizontal',
        name: 'Content Calendar',
        category: 'timeline',
        description: 'Weekly content schedule',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'week', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'sm' },
            { id: 'monday', type: 'body', required: true, maxLength: 40, style: 'sans', size: 'sm' },
            { id: 'wednesday', type: 'body', required: true, maxLength: 40, style: 'sans', size: 'sm' },
            { id: 'friday', type: 'body', required: true, maxLength: 40, style: 'sans', size: 'sm' },
            { id: 'weekend', type: 'body', required: false, maxLength: 40, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 4, columnCount: 4, bgStyle: 'light' }
    },
    {
        id: 'social-platform-strategy',
        layout: 'gamma-features-4col',
        name: 'Platform Strategy',
        category: 'features',
        description: 'Per-platform approach',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'instagram', type: 'subheading', required: true, maxLength: 15, style: 'serif', size: 'md' },
            { id: 'instagramStrategy', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'tiktok', type: 'subheading', required: true, maxLength: 15, style: 'serif', size: 'md' },
            { id: 'tiktokStrategy', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'twitter', type: 'subheading', required: true, maxLength: 15, style: 'serif', size: 'md' },
            { id: 'twitterStrategy', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'linkedin', type: 'subheading', required: true, maxLength: 15, style: 'serif', size: 'md' },
            { id: 'linkedinStrategy', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 4, columnCount: 4, bgStyle: 'light' }
    },
    {
        id: 'social-kpis',
        layout: 'gamma-stats-grid',
        name: 'Campaign KPIs',
        category: 'stats',
        description: 'Target metrics and goals',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'reach', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xl' },
            { id: 'reachLabel', type: 'label', required: true, maxLength: 30, style: 'sans', size: 'sm' },
            { id: 'engagement', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xl' },
            { id: 'engagementLabel', type: 'label', required: true, maxLength: 30, style: 'sans', size: 'sm' },
            { id: 'conversions', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xl' },
            { id: 'conversionsLabel', type: 'label', required: true, maxLength: 30, style: 'sans', size: 'sm' },
            { id: 'roi', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xl' },
            { id: 'roiLabel', type: 'label', required: true, maxLength: 30, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: true, cardCount: 4, columnCount: 4, bgStyle: 'light' }
    }
];

// ==========================================
// BRAND GUIDELINES TEMPLATES
// ==========================================
export const BRAND_TEMPLATES: GammaTemplate[] = [
    {
        id: 'brand-intro',
        layout: 'gamma-title-minimal',
        name: 'Brand Introduction',
        category: 'title',
        description: 'Brand guidelines cover',
        elements: [
            { id: 'brandName', type: 'title', required: true, maxLength: 40, style: 'serif', size: 'xxl' },
            { id: 'subtitle', type: 'subheading', required: true, maxLength: 60, style: 'sans', size: 'lg' },
            { id: 'version', type: 'caption', required: false, maxLength: 30, style: 'muted', size: 'sm' }
        ],
        images: [
            { id: 'logo', position: 'center', aspectRatio: '1:1', size: 'medium', keywords: ['logo', 'brand'] }
        ],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'brand-values',
        layout: 'gamma-features-3col',
        name: 'Brand Values',
        category: 'features',
        description: 'Core values and principles',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'value1', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'value1Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'value2', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'value2Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'value3', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'value3Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'brand-color-palette',
        layout: 'gamma-features-4col',
        name: 'Color Palette',
        category: 'features',
        description: 'Brand colors with hex codes',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'primary', type: 'label', required: true, maxLength: 20, style: 'sans', size: 'md' },
            { id: 'primaryHex', type: 'caption', required: true, maxLength: 10, style: 'mono', size: 'sm' },
            { id: 'secondary', type: 'label', required: true, maxLength: 20, style: 'sans', size: 'md' },
            { id: 'secondaryHex', type: 'caption', required: true, maxLength: 10, style: 'mono', size: 'sm' },
            { id: 'accent', type: 'label', required: true, maxLength: 20, style: 'sans', size: 'md' },
            { id: 'accentHex', type: 'caption', required: true, maxLength: 10, style: 'mono', size: 'sm' },
            { id: 'neutral', type: 'label', required: true, maxLength: 20, style: 'sans', size: 'md' },
            { id: 'neutralHex', type: 'caption', required: true, maxLength: 10, style: 'mono', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 4, columnCount: 4, bgStyle: 'light' }
    },
    {
        id: 'brand-typography',
        layout: 'gamma-content-split-right',
        name: 'Typography',
        category: 'content',
        description: 'Font choices and usage',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'headingFont', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'headingUsage', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'bodyFont', type: 'subheading', required: true, maxLength: 30, style: 'sans', size: 'md' },
            { id: 'bodyUsage', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'typographyExample', position: 'right', aspectRatio: '4:3', size: 'large', keywords: ['typography', 'font', 'text'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'brand-logo-usage',
        layout: 'gamma-compare-side',
        name: 'Logo Usage',
        category: 'compare',
        description: 'Dos and don\'ts for logo',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'dosTitle', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'md' },
            { id: 'dos', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' },
            { id: 'dontsTitle', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'md' },
            { id: 'donts', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 2, columnCount: 2, bgStyle: 'light' }
    },
    {
        id: 'brand-voice',
        layout: 'gamma-content-bullets',
        name: 'Brand Voice',
        category: 'content',
        description: 'Tone and messaging guidelines',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'intro', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'md' },
            { id: 'traits', type: 'bullets', required: true, maxLength: 300, style: 'sans', size: 'sm' },
            { id: 'examples', type: 'caption', required: false, maxLength: 100, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    }
];

// ==========================================
// EVENT MARKETING TEMPLATES
// ==========================================
export const EVENT_TEMPLATES: GammaTemplate[] = [
    {
        id: 'event-announcement',
        layout: 'gamma-title-gradient',
        name: 'Event Announcement',
        category: 'title',
        description: 'Event launch announcement',
        elements: [
            { id: 'eventName', type: 'title', required: true, maxLength: 50, style: 'serif', size: 'xxl' },
            { id: 'tagline', type: 'subheading', required: true, maxLength: 60, style: 'sans', size: 'lg' },
            { id: 'date', type: 'label', required: true, maxLength: 30, style: 'accent', size: 'md' },
            { id: 'location', type: 'caption', required: true, maxLength: 50, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: true, hasAccentBar: false, hasCards: false, bgStyle: 'gradient' }
    },
    {
        id: 'event-agenda',
        layout: 'gamma-timeline-vertical',
        name: 'Event Agenda',
        category: 'timeline',
        description: 'Schedule of activities',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'time1', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'session1', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'session1Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'time2', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'session2', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'session2Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'time3', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'session3', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'session3Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'event-speakers',
        layout: 'gamma-team-spotlight',
        name: 'Featured Speakers',
        category: 'team',
        description: 'Speaker lineup',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'speaker1Name', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'speaker1Title', type: 'label', required: true, maxLength: 40, style: 'accent', size: 'sm' },
            { id: 'speaker1Bio', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'speaker2Name', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'speaker2Title', type: 'label', required: true, maxLength: 40, style: 'accent', size: 'sm' },
            { id: 'speaker2Bio', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'speaker3Name', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'speaker3Title', type: 'label', required: true, maxLength: 40, style: 'accent', size: 'sm' },
            { id: 'speaker3Bio', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'photo1', position: 'avatar', aspectRatio: '1:1', size: 'medium', keywords: ['speaker', 'professional'] },
            { id: 'photo2', position: 'avatar', aspectRatio: '1:1', size: 'medium', keywords: ['speaker', 'professional'] },
            { id: 'photo3', position: 'avatar', aspectRatio: '1:1', size: 'medium', keywords: ['speaker', 'professional'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'event-pricing',
        layout: 'gamma-compare-side',
        name: 'Ticket Pricing',
        category: 'compare',
        description: 'Ticket tiers and pricing',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'tier1', type: 'subheading', required: true, maxLength: 20, style: 'serif', size: 'md' },
            { id: 'tier1Price', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'tier1Features', type: 'bullets', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'tier2', type: 'subheading', required: true, maxLength: 20, style: 'serif', size: 'md' },
            { id: 'tier2Price', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'tier2Features', type: 'bullets', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'tier2Badge', type: 'label', required: false, maxLength: 15, style: 'accent', size: 'xs' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 2, columnCount: 2, bgStyle: 'light' }
    },
    {
        id: 'event-register-cta',
        layout: 'gamma-cta-gradient',
        name: 'Register Now',
        category: 'cta',
        description: 'Event registration CTA',
        elements: [
            { id: 'headline', type: 'title', required: true, maxLength: 40, style: 'serif', size: 'xl' },
            { id: 'earlyBird', type: 'label', required: false, maxLength: 40, style: 'accent', size: 'md' },
            { id: 'deadline', type: 'subheading', required: true, maxLength: 50, style: 'sans', size: 'md' },
            { id: 'cta', type: 'label', required: true, maxLength: 25, style: 'accent', size: 'lg' }
        ],
        images: [],
        design: { hasGradient: true, hasAccentBar: false, hasCards: false, bgStyle: 'gradient' }
    }
];

// ==========================================
// SALES DECK TEMPLATES
// ==========================================
export const SALES_TEMPLATES: GammaTemplate[] = [
    {
        id: 'sales-hook',
        layout: 'gamma-content-split-right',
        name: 'Opening Hook',
        category: 'content',
        description: 'Attention-grabbing opener',
        elements: [
            { id: 'hook', type: 'title', required: true, maxLength: 80, style: 'serif', size: 'xl' },
            { id: 'stats', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'md' },
            { id: 'source', type: 'caption', required: false, maxLength: 50, style: 'muted', size: 'sm' }
        ],
        images: [
            { id: 'visual', position: 'right', aspectRatio: '4:3', size: 'large', keywords: ['business', 'growth', 'success'] }
        ],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'sales-pain-points',
        layout: 'gamma-cards-3',
        name: 'Pain Points',
        category: 'cards',
        description: 'Customer pain points',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'pain1Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'pain1Impact', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'pain2Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'pain2Impact', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'pain3Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'pain3Impact', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'sales-roi-calculator',
        layout: 'gamma-stat-with-cards',
        name: 'ROI Calculator',
        category: 'stats',
        description: 'Return on investment breakdown',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'totalRoi', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xxl' },
            { id: 'roiLabel', type: 'label', required: true, maxLength: 30, style: 'sans', size: 'md' },
            { id: 'timeSaved', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'timeSavedLabel', type: 'label', required: true, maxLength: 25, style: 'sans', size: 'sm' },
            { id: 'costReduction', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'costReductionLabel', type: 'label', required: true, maxLength: 25, style: 'sans', size: 'sm' },
            { id: 'efficiency', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'efficiencyLabel', type: 'label', required: true, maxLength: 25, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: true, cardCount: 3, bgStyle: 'light' }
    },
    {
        id: 'sales-case-study-mini',
        layout: 'gamma-quote-with-image',
        name: 'Success Story',
        category: 'quote',
        description: 'Quick customer success',
        elements: [
            { id: 'result', type: 'title', required: true, maxLength: 60, style: 'serif', size: 'lg' },
            { id: 'quote', type: 'quote', required: true, maxLength: 200, style: 'serif', size: 'md' },
            { id: 'customer', type: 'author', required: true, maxLength: 30, style: 'sans', size: 'sm' },
            { id: 'company', type: 'caption', required: true, maxLength: 40, style: 'muted', size: 'sm' }
        ],
        images: [
            { id: 'logo', position: 'left', aspectRatio: '16:9', size: 'medium', keywords: ['company', 'office'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 1, bgStyle: 'light' }
    },
    {
        id: 'sales-next-steps',
        layout: 'gamma-timeline-vertical',
        name: 'Next Steps',
        category: 'timeline',
        description: 'Implementation roadmap',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'step1', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'step1Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'step1Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'step2', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'step2Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'step2Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'step3', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'step3Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'step3Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'sales-closing',
        layout: 'gamma-cta-gradient',
        name: 'Closing Slide',
        category: 'cta',
        description: 'Final call to action',
        elements: [
            { id: 'headline', type: 'title', required: true, maxLength: 50, style: 'serif', size: 'xl' },
            { id: 'offer', type: 'subheading', required: false, maxLength: 60, style: 'sans', size: 'lg' },
            { id: 'cta', type: 'label', required: true, maxLength: 25, style: 'accent', size: 'lg' },
            { id: 'contact', type: 'caption', required: true, maxLength: 50, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: true, hasAccentBar: false, hasCards: false, bgStyle: 'gradient' }
    }
];

// Combine all marketing templates
export const ALL_MARKETING_TEMPLATES: GammaTemplate[] = [
    ...SOCIAL_MEDIA_TEMPLATES,
    ...BRAND_TEMPLATES,
    ...EVENT_TEMPLATES,
    ...SALES_TEMPLATES
];

// Get templates by category
export function getMarketingTemplates(type: 'social' | 'brand' | 'event' | 'sales'): GammaTemplate[] {
    switch (type) {
        case 'social':
            return SOCIAL_MEDIA_TEMPLATES;
        case 'brand':
            return BRAND_TEMPLATES;
        case 'event':
            return EVENT_TEMPLATES;
        case 'sales':
            return SALES_TEMPLATES;
        default:
            return [];
    }
}

// Total marketing template count
export const TOTAL_MARKETING_TEMPLATE_COUNT = ALL_MARKETING_TEMPLATES.length;
