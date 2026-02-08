/**
 * 🎨 Industry-Specific Gamma Templates
 * Specialized templates for specific use cases:
 * - Startup Pitch Decks
 * - Business Reports
 * - Product Launches
 * - Educational Content
 * - Marketing Campaigns
 * - Case Studies
 */

import { GammaTemplate, GammaLayoutType } from './gamma-templates';

// ==========================================
// STARTUP PITCH DECK TEMPLATES
// ==========================================
export const PITCH_DECK_TEMPLATES: GammaTemplate[] = [
    {
        id: 'pitch-problem',
        layout: 'gamma-content-split-right',
        name: 'Problem Statement',
        category: 'content',
        description: 'Highlight the problem your startup solves',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 50, style: 'serif', size: 'lg' },
            { id: 'problemStatement', type: 'body', required: true, maxLength: 200, style: 'sans', size: 'md' },
            { id: 'painPoints', type: 'bullets', required: true, maxLength: 300, style: 'sans', size: 'sm' },
            { id: 'impact', type: 'caption', required: false, maxLength: 100, style: 'muted', size: 'sm' }
        ],
        images: [
            { id: 'problemImage', position: 'right', aspectRatio: '4:3', size: 'large', keywords: ['challenge', 'problem', 'frustration'] }
        ],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'pitch-solution',
        layout: 'gamma-content-split-left',
        name: 'Solution Overview',
        category: 'content',
        description: 'Present your solution with impact',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 50, style: 'serif', size: 'lg' },
            { id: 'headline', type: 'subheading', required: true, maxLength: 80, style: 'sans', size: 'md' },
            { id: 'benefits', type: 'bullets', required: true, maxLength: 300, style: 'sans', size: 'sm' },
            { id: 'cta', type: 'label', required: false, maxLength: 30, style: 'accent', size: 'sm' }
        ],
        images: [
            { id: 'solutionImage', position: 'left', aspectRatio: '4:3', size: 'large', keywords: ['solution', 'technology', 'innovation'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'pitch-tam-sam-som',
        layout: 'gamma-stats-grid',
        name: 'TAM SAM SOM',
        category: 'stats',
        description: 'Market size breakdown with three tiers',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'tam', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xl' },
            { id: 'tamLabel', type: 'label', required: true, maxLength: 50, style: 'sans', size: 'sm' },
            { id: 'tamDesc', type: 'body', required: true, maxLength: 80, style: 'muted', size: 'xs' },
            { id: 'sam', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xl' },
            { id: 'samLabel', type: 'label', required: true, maxLength: 50, style: 'sans', size: 'sm' },
            { id: 'samDesc', type: 'body', required: true, maxLength: 80, style: 'muted', size: 'xs' },
            { id: 'som', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xl' },
            { id: 'somLabel', type: 'label', required: true, maxLength: 50, style: 'sans', size: 'sm' },
            { id: 'somDesc', type: 'body', required: true, maxLength: 80, style: 'muted', size: 'xs' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'pitch-business-model',
        layout: 'gamma-features-3col',
        name: 'Business Model',
        category: 'features',
        description: 'Revenue streams and monetization',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'model1Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'model1Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'model1Revenue', type: 'stat', required: true, maxLength: 20, style: 'accent', size: 'md' },
            { id: 'model2Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'model2Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'model2Revenue', type: 'stat', required: true, maxLength: 20, style: 'accent', size: 'md' },
            { id: 'model3Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'model3Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'model3Revenue', type: 'stat', required: true, maxLength: 20, style: 'accent', size: 'md' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'pitch-traction',
        layout: 'gamma-stat-with-cards',
        name: 'Traction Metrics',
        category: 'stats',
        description: 'Key traction metrics with supporting cards',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'mainMetric', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xxl' },
            { id: 'mainLabel', type: 'label', required: true, maxLength: 40, style: 'sans', size: 'md' },
            { id: 'growth', type: 'body', required: false, maxLength: 50, style: 'muted', size: 'sm' },
            { id: 'metric1', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'metric1Label', type: 'label', required: true, maxLength: 30, style: 'sans', size: 'sm' },
            { id: 'metric2', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'metric2Label', type: 'label', required: true, maxLength: 30, style: 'sans', size: 'sm' },
            { id: 'metric3', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'metric3Label', type: 'label', required: true, maxLength: 30, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: true, cardCount: 3, bgStyle: 'light' }
    },
    {
        id: 'pitch-funding-ask',
        layout: 'gamma-cta-gradient',
        name: 'Funding Ask',
        category: 'cta',
        description: 'Investment ask with use of funds',
        elements: [
            { id: 'askAmount', type: 'title', required: true, maxLength: 30, style: 'serif', size: 'xxl' },
            { id: 'round', type: 'subheading', required: true, maxLength: 40, style: 'sans', size: 'lg' },
            { id: 'useOfFunds', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'md' },
            { id: 'target', type: 'caption', required: false, maxLength: 80, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: true, hasAccentBar: false, hasCards: false, bgStyle: 'gradient' }
    },
    {
        id: 'pitch-team',
        layout: 'gamma-team-spotlight',
        name: 'Team Spotlight',
        category: 'team',
        description: 'Founding team with credentials',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'member1Name', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'member1Role', type: 'label', required: true, maxLength: 30, style: 'accent', size: 'sm' },
            { id: 'member1Bio', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'member2Name', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'member2Role', type: 'label', required: true, maxLength: 30, style: 'accent', size: 'sm' },
            { id: 'member2Bio', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'member3Name', type: 'subheading', required: false, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'member3Role', type: 'label', required: false, maxLength: 30, style: 'accent', size: 'sm' },
            { id: 'member3Bio', type: 'body', required: false, maxLength: 100, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'avatar1', position: 'avatar', aspectRatio: '1:1', size: 'medium', keywords: ['portrait', 'professional'] },
            { id: 'avatar2', position: 'avatar', aspectRatio: '1:1', size: 'medium', keywords: ['portrait', 'professional'] },
            { id: 'avatar3', position: 'avatar', aspectRatio: '1:1', size: 'medium', keywords: ['portrait', 'professional'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    }
];

// ==========================================
// PRODUCT LAUNCH TEMPLATES
// ==========================================
export const PRODUCT_LAUNCH_TEMPLATES: GammaTemplate[] = [
    {
        id: 'launch-hero',
        layout: 'gamma-title-gradient',
        name: 'Product Launch Hero',
        category: 'title',
        description: 'Dramatic product reveal',
        elements: [
            { id: 'productName', type: 'title', required: true, maxLength: 40, style: 'serif', size: 'xxl' },
            { id: 'tagline', type: 'subheading', required: true, maxLength: 80, style: 'sans', size: 'lg' },
            { id: 'launchDate', type: 'label', required: false, maxLength: 30, style: 'accent', size: 'sm' }
        ],
        images: [
            { id: 'productImage', position: 'background', aspectRatio: '16:9', size: 'full', keywords: ['product', 'technology', 'modern'] }
        ],
        design: { hasGradient: true, hasAccentBar: false, hasCards: false, bgStyle: 'gradient' }
    },
    {
        id: 'launch-features-showcase',
        layout: 'gamma-features-4col',
        name: 'Feature Showcase',
        category: 'features',
        description: 'Key product features with icons',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'f1Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'f1Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'f2Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'f2Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'f3Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'f3Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'f4Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'f4Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'icon1', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['feature', 'icon'] },
            { id: 'icon2', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['feature', 'icon'] },
            { id: 'icon3', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['feature', 'icon'] },
            { id: 'icon4', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['feature', 'icon'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 4, columnCount: 4, bgStyle: 'light' }
    },
    {
        id: 'launch-pricing',
        layout: 'gamma-compare-side',
        name: 'Pricing Tiers',
        category: 'compare',
        description: 'Product pricing comparison',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'tier1Name', type: 'subheading', required: true, maxLength: 20, style: 'serif', size: 'md' },
            { id: 'tier1Price', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'tier1Features', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' },
            { id: 'tier2Name', type: 'subheading', required: true, maxLength: 20, style: 'serif', size: 'md' },
            { id: 'tier2Price', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'tier2Features', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' },
            { id: 'tier2Badge', type: 'label', required: false, maxLength: 15, style: 'accent', size: 'xs' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 2, columnCount: 2, bgStyle: 'light' }
    },
    {
        id: 'launch-availability',
        layout: 'gamma-cta-gradient',
        name: 'Launch Availability',
        category: 'cta',
        description: 'Product availability and call to action',
        elements: [
            { id: 'headline', type: 'title', required: true, maxLength: 40, style: 'serif', size: 'xl' },
            { id: 'availability', type: 'subheading', required: true, maxLength: 60, style: 'sans', size: 'lg' },
            { id: 'cta', type: 'label', required: true, maxLength: 30, style: 'accent', size: 'md' },
            { id: 'note', type: 'caption', required: false, maxLength: 60, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: true, hasAccentBar: false, hasCards: false, bgStyle: 'gradient' }
    }
];

// ==========================================
// CASE STUDY TEMPLATES
// ==========================================
export const CASE_STUDY_TEMPLATES: GammaTemplate[] = [
    {
        id: 'case-client-intro',
        layout: 'gamma-content-split-right',
        name: 'Client Introduction',
        category: 'content',
        description: 'Introduce the case study client',
        elements: [
            { id: 'clientName', type: 'heading', required: true, maxLength: 50, style: 'serif', size: 'lg' },
            { id: 'industry', type: 'label', required: true, maxLength: 30, style: 'accent', size: 'sm' },
            { id: 'about', type: 'body', required: true, maxLength: 200, style: 'sans', size: 'md' },
            { id: 'scope', type: 'caption', required: false, maxLength: 100, style: 'muted', size: 'sm' }
        ],
        images: [
            { id: 'clientLogo', position: 'right', aspectRatio: '4:3', size: 'large', keywords: ['company', 'office', 'corporate'] }
        ],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'case-challenge',
        layout: 'gamma-content-bullets',
        name: 'The Challenge',
        category: 'content',
        description: 'Describe the client challenge',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'context', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'md' },
            { id: 'challenges', type: 'bullets', required: true, maxLength: 300, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'case-approach',
        layout: 'gamma-timeline-vertical',
        name: 'Our Approach',
        category: 'timeline',
        description: 'Step-by-step methodology',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'step1Phase', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'step1Title', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'step1Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'step2Phase', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'step2Title', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'step2Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'step3Phase', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'step3Title', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'step3Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'case-results',
        layout: 'gamma-stats-row',
        name: 'Results & Impact',
        category: 'stats',
        description: 'Key results with big numbers',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'result1', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xxl' },
            { id: 'result1Label', type: 'label', required: true, maxLength: 40, style: 'sans', size: 'sm' },
            { id: 'result2', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xxl' },
            { id: 'result2Label', type: 'label', required: true, maxLength: 40, style: 'sans', size: 'sm' },
            { id: 'result3', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xxl' },
            { id: 'result3Label', type: 'label', required: true, maxLength: 40, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'case-testimonial',
        layout: 'gamma-quote-with-image',
        name: 'Client Testimonial',
        category: 'quote',
        description: 'Client feedback quote',
        elements: [
            { id: 'quote', type: 'quote', required: true, maxLength: 250, style: 'serif', size: 'lg' },
            { id: 'authorName', type: 'author', required: true, maxLength: 40, style: 'sans', size: 'md' },
            { id: 'authorRole', type: 'caption', required: true, maxLength: 60, style: 'muted', size: 'sm' },
            { id: 'company', type: 'caption', required: false, maxLength: 40, style: 'muted', size: 'sm' }
        ],
        images: [
            { id: 'avatar', position: 'avatar', aspectRatio: '1:1', size: 'medium', keywords: ['portrait', 'professional'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 1, bgStyle: 'light' }
    }
];

// ==========================================
// EDUCATIONAL TEMPLATES
// ==========================================
export const EDUCATIONAL_TEMPLATES: GammaTemplate[] = [
    {
        id: 'edu-lesson-title',
        layout: 'gamma-title-centered',
        name: 'Lesson Title',
        category: 'title',
        description: 'Educational lesson introduction',
        elements: [
            { id: 'lessonNumber', type: 'label', required: false, maxLength: 20, style: 'accent', size: 'sm' },
            { id: 'title', type: 'title', required: true, maxLength: 60, style: 'serif', size: 'xl' },
            { id: 'learningObjective', type: 'subheading', required: true, maxLength: 100, style: 'sans', size: 'md' },
            { id: 'duration', type: 'caption', required: false, maxLength: 30, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'edu-key-concepts',
        layout: 'gamma-features-3col',
        name: 'Key Concepts',
        category: 'features',
        description: 'Main concepts to learn',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'concept1Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'concept1Def', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'concept2Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'concept2Def', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'concept3Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'concept3Def', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'icon1', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['concept', 'idea'] },
            { id: 'icon2', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['learning', 'book'] },
            { id: 'icon3', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['knowledge', 'brain'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'edu-diagram',
        layout: 'gamma-content-split-right',
        name: 'Concept Diagram',
        category: 'content',
        description: 'Explanation with visual diagram',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'explanation', type: 'body', required: true, maxLength: 200, style: 'sans', size: 'md' },
            { id: 'keyPoints', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' },
            { id: 'note', type: 'caption', required: false, maxLength: 80, style: 'muted', size: 'sm' }
        ],
        images: [
            { id: 'diagram', position: 'right', aspectRatio: '4:3', size: 'large', keywords: ['diagram', 'chart', 'illustration'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'edu-quiz',
        layout: 'gamma-cards-3',
        name: 'Quiz Questions',
        category: 'cards',
        description: 'Interactive knowledge check',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'q1', type: 'subheading', required: true, maxLength: 60, style: 'serif', size: 'md' },
            { id: 'q1Options', type: 'bullets', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'q2', type: 'subheading', required: true, maxLength: 60, style: 'serif', size: 'md' },
            { id: 'q2Options', type: 'bullets', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'q3', type: 'subheading', required: true, maxLength: 60, style: 'serif', size: 'md' },
            { id: 'q3Options', type: 'bullets', required: true, maxLength: 150, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'edu-summary',
        layout: 'gamma-content-bullets',
        name: 'Lesson Summary',
        category: 'content',
        description: 'Key takeaways from the lesson',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'intro', type: 'body', required: false, maxLength: 100, style: 'sans', size: 'md' },
            { id: 'takeaways', type: 'bullets', required: true, maxLength: 400, style: 'sans', size: 'md' },
            { id: 'nextSteps', type: 'caption', required: false, maxLength: 80, style: 'accent', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    }
];

// Combine all industry templates
export const ALL_INDUSTRY_TEMPLATES: GammaTemplate[] = [
    ...PITCH_DECK_TEMPLATES,
    ...PRODUCT_LAUNCH_TEMPLATES,
    ...CASE_STUDY_TEMPLATES,
    ...EDUCATIONAL_TEMPLATES
];

// Get templates by use case
export function getTemplatesByUseCase(useCase: 'pitch' | 'launch' | 'case-study' | 'education'): GammaTemplate[] {
    switch (useCase) {
        case 'pitch':
            return PITCH_DECK_TEMPLATES;
        case 'launch':
            return PRODUCT_LAUNCH_TEMPLATES;
        case 'case-study':
            return CASE_STUDY_TEMPLATES;
        case 'education':
            return EDUCATIONAL_TEMPLATES;
        default:
            return [];
    }
}

// Template count
export const TOTAL_INDUSTRY_TEMPLATE_COUNT = ALL_INDUSTRY_TEMPLATES.length;
