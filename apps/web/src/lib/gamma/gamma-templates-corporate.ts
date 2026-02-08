/**
 * 🎨 Corporate & Professional Templates
 * Specialized templates for:
 * - Annual Reports
 * - Investor Updates / Quarterly Reviews
 * - Training Materials / Onboarding
 * - Project Status Updates
 * - Company All-Hands / Town Halls
 */

import { GammaTemplate } from './gamma-templates';

// ==========================================
// ANNUAL REPORT TEMPLATES
// ==========================================
export const ANNUAL_REPORT_TEMPLATES: GammaTemplate[] = [
    {
        id: 'annual-cover',
        layout: 'gamma-title-gradient',
        name: 'Annual Report Cover',
        category: 'title',
        description: 'Year-end report cover slide',
        elements: [
            { id: 'companyName', type: 'label', required: true, maxLength: 40, style: 'sans', size: 'md' },
            { id: 'title', type: 'title', required: true, maxLength: 50, style: 'serif', size: 'xxl' },
            { id: 'fiscalYear', type: 'subheading', required: true, maxLength: 20, style: 'sans', size: 'lg' },
            { id: 'tagline', type: 'caption', required: false, maxLength: 60, style: 'muted', size: 'md' }
        ],
        images: [],
        design: { hasGradient: true, hasAccentBar: false, hasCards: false, bgStyle: 'gradient' }
    },
    {
        id: 'annual-ceo-letter',
        layout: 'gamma-content-split-left',
        name: 'CEO Letter',
        category: 'content',
        description: 'Message from leadership',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'greeting', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'md' },
            { id: 'message', type: 'body', required: true, maxLength: 300, style: 'sans', size: 'sm' },
            { id: 'signature', type: 'label', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'role', type: 'caption', required: true, maxLength: 40, style: 'muted', size: 'sm' }
        ],
        images: [
            { id: 'ceoPhoto', position: 'left', aspectRatio: '4:5', size: 'large', keywords: ['executive', 'portrait', 'professional'] }
        ],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'annual-year-highlights',
        layout: 'gamma-stats-grid',
        name: 'Year Highlights',
        category: 'stats',
        description: 'Key annual achievements',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'revenue', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xxl' },
            { id: 'revenueLabel', type: 'label', required: true, maxLength: 30, style: 'sans', size: 'sm' },
            { id: 'revenueChange', type: 'caption', required: true, maxLength: 15, style: 'accent', size: 'xs' },
            { id: 'customers', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xxl' },
            { id: 'customersLabel', type: 'label', required: true, maxLength: 30, style: 'sans', size: 'sm' },
            { id: 'customersChange', type: 'caption', required: true, maxLength: 15, style: 'accent', size: 'xs' },
            { id: 'employees', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xxl' },
            { id: 'employeesLabel', type: 'label', required: true, maxLength: 30, style: 'sans', size: 'sm' },
            { id: 'markets', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xxl' },
            { id: 'marketsLabel', type: 'label', required: true, maxLength: 30, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: true, cardCount: 4, columnCount: 4, bgStyle: 'light' }
    },
    {
        id: 'annual-financials',
        layout: 'gamma-compare-side',
        name: 'Financial Summary',
        category: 'compare',
        description: 'Year-over-year financials',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'thisYearLabel', type: 'subheading', required: true, maxLength: 15, style: 'serif', size: 'md' },
            { id: 'thisYearRevenue', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'thisYearBreakdown', type: 'bullets', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'lastYearLabel', type: 'subheading', required: true, maxLength: 15, style: 'serif', size: 'md' },
            { id: 'lastYearRevenue', type: 'stat', required: true, maxLength: 15, style: 'muted', size: 'lg' },
            { id: 'lastYearBreakdown', type: 'bullets', required: true, maxLength: 150, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 2, columnCount: 2, bgStyle: 'light' }
    },
    {
        id: 'annual-milestones',
        layout: 'gamma-timeline-vertical',
        name: 'Year Milestones',
        category: 'timeline',
        description: 'Key moments through the year',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'q1Date', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'q1Event', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'q1Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'q2Date', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'q2Event', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'q2Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'q3Date', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'q3Event', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'q3Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'q4Date', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'q4Event', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'q4Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'annual-next-year-outlook',
        layout: 'gamma-content-bullets',
        name: 'Next Year Outlook',
        category: 'content',
        description: 'Future priorities and goals',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'intro', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'md' },
            { id: 'priorities', type: 'bullets', required: true, maxLength: 400, style: 'sans', size: 'sm' },
            { id: 'closing', type: 'caption', required: false, maxLength: 100, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    }
];

// ==========================================
// INVESTOR UPDATE TEMPLATES
// ==========================================
export const INVESTOR_UPDATE_TEMPLATES: GammaTemplate[] = [
    {
        id: 'investor-quarterly-cover',
        layout: 'gamma-title-minimal',
        name: 'Quarterly Update Cover',
        category: 'title',
        description: 'Quarterly investor update',
        elements: [
            { id: 'companyLogo', type: 'label', required: true, maxLength: 30, style: 'sans', size: 'sm' },
            { id: 'title', type: 'title', required: true, maxLength: 50, style: 'serif', size: 'xl' },
            { id: 'quarter', type: 'subheading', required: true, maxLength: 30, style: 'accent', size: 'lg' },
            { id: 'date', type: 'caption', required: true, maxLength: 30, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'investor-key-metrics',
        layout: 'gamma-stat-with-cards',
        name: 'Key Metrics',
        category: 'stats',
        description: 'Main performance indicators',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'mainMetric', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xxl' },
            { id: 'mainLabel', type: 'label', required: true, maxLength: 30, style: 'sans', size: 'md' },
            { id: 'mainChange', type: 'caption', required: true, maxLength: 20, style: 'accent', size: 'sm' },
            { id: 'metric1', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'metric1Label', type: 'label', required: true, maxLength: 25, style: 'sans', size: 'sm' },
            { id: 'metric2', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'metric2Label', type: 'label', required: true, maxLength: 25, style: 'sans', size: 'sm' },
            { id: 'metric3', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'metric3Label', type: 'label', required: true, maxLength: 25, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: true, cardCount: 3, bgStyle: 'light' }
    },
    {
        id: 'investor-revenue-breakdown',
        layout: 'gamma-features-4col',
        name: 'Revenue Breakdown',
        category: 'features',
        description: 'Revenue by segment',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'segment1', type: 'subheading', required: true, maxLength: 20, style: 'serif', size: 'md' },
            { id: 'segment1Revenue', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'segment1Pct', type: 'caption', required: true, maxLength: 10, style: 'muted', size: 'sm' },
            { id: 'segment2', type: 'subheading', required: true, maxLength: 20, style: 'serif', size: 'md' },
            { id: 'segment2Revenue', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'segment2Pct', type: 'caption', required: true, maxLength: 10, style: 'muted', size: 'sm' },
            { id: 'segment3', type: 'subheading', required: true, maxLength: 20, style: 'serif', size: 'md' },
            { id: 'segment3Revenue', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'segment3Pct', type: 'caption', required: true, maxLength: 10, style: 'muted', size: 'sm' },
            { id: 'segment4', type: 'subheading', required: true, maxLength: 20, style: 'serif', size: 'md' },
            { id: 'segment4Revenue', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'lg' },
            { id: 'segment4Pct', type: 'caption', required: true, maxLength: 10, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 4, columnCount: 4, bgStyle: 'light' }
    },
    {
        id: 'investor-product-updates',
        layout: 'gamma-cards-3',
        name: 'Product Updates',
        category: 'cards',
        description: 'Key product developments',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'update1Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'update1Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'update1Impact', type: 'label', required: false, maxLength: 30, style: 'accent', size: 'xs' },
            { id: 'update2Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'update2Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'update2Impact', type: 'label', required: false, maxLength: 30, style: 'accent', size: 'xs' },
            { id: 'update3Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'update3Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'update3Impact', type: 'label', required: false, maxLength: 30, style: 'accent', size: 'xs' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'investor-market-expansion',
        layout: 'gamma-content-split-right',
        name: 'Market Expansion',
        category: 'content',
        description: 'Geographic growth story',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'summary', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'md' },
            { id: 'newMarkets', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' },
            { id: 'outlook', type: 'caption', required: false, maxLength: 80, style: 'muted', size: 'sm' }
        ],
        images: [
            { id: 'mapGraphic', position: 'right', aspectRatio: '4:3', size: 'large', keywords: ['world', 'map', 'global'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'investor-guidance',
        layout: 'gamma-content-bullets',
        name: 'Forward Guidance',
        category: 'content',
        description: 'Future expectations',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'summary', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'md' },
            { id: 'guidance', type: 'bullets', required: true, maxLength: 300, style: 'sans', size: 'sm' },
            { id: 'disclaimer', type: 'caption', required: true, maxLength: 150, style: 'muted', size: 'xs' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    }
];

// ==========================================
// TRAINING / ONBOARDING TEMPLATES
// ==========================================
export const TRAINING_TEMPLATES: GammaTemplate[] = [
    {
        id: 'training-welcome',
        layout: 'gamma-title-gradient',
        name: 'Training Welcome',
        category: 'title',
        description: 'Training session opener',
        elements: [
            { id: 'courseName', type: 'title', required: true, maxLength: 50, style: 'serif', size: 'xxl' },
            { id: 'subtitle', type: 'subheading', required: true, maxLength: 60, style: 'sans', size: 'lg' },
            { id: 'duration', type: 'label', required: false, maxLength: 30, style: 'accent', size: 'md' },
            { id: 'instructor', type: 'caption', required: false, maxLength: 40, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: true, hasAccentBar: false, hasCards: false, bgStyle: 'gradient' }
    },
    {
        id: 'training-agenda',
        layout: 'gamma-features-4col',
        name: 'Training Agenda',
        category: 'features',
        description: 'Session modules overview',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'module1', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'module1Desc', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'module1Time', type: 'caption', required: true, maxLength: 15, style: 'accent', size: 'xs' },
            { id: 'module2', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'module2Desc', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'module2Time', type: 'caption', required: true, maxLength: 15, style: 'accent', size: 'xs' },
            { id: 'module3', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'module3Desc', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'module3Time', type: 'caption', required: true, maxLength: 15, style: 'accent', size: 'xs' },
            { id: 'module4', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'module4Desc', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'module4Time', type: 'caption', required: true, maxLength: 15, style: 'accent', size: 'xs' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 4, columnCount: 4, bgStyle: 'light' }
    },
    {
        id: 'training-objectives',
        layout: 'gamma-content-bullets',
        name: 'Learning Objectives',
        category: 'content',
        description: 'What you will learn',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'intro', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'md' },
            { id: 'objectives', type: 'bullets', required: true, maxLength: 400, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'training-concept',
        layout: 'gamma-content-split-right',
        name: 'Concept Explanation',
        category: 'content',
        description: 'Explain a key concept',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'definition', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'md' },
            { id: 'keyPoints', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' },
            { id: 'example', type: 'caption', required: false, maxLength: 100, style: 'muted', size: 'sm' }
        ],
        images: [
            { id: 'diagram', position: 'right', aspectRatio: '4:3', size: 'large', keywords: ['diagram', 'illustration', 'concept'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'training-step-by-step',
        layout: 'gamma-timeline-vertical',
        name: 'Step-by-Step Guide',
        category: 'timeline',
        description: 'Process walkthrough',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'step1Num', type: 'label', required: true, maxLength: 10, style: 'accent', size: 'md' },
            { id: 'step1Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'step1Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'step2Num', type: 'label', required: true, maxLength: 10, style: 'accent', size: 'md' },
            { id: 'step2Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'step2Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'step3Num', type: 'label', required: true, maxLength: 10, style: 'accent', size: 'md' },
            { id: 'step3Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'step3Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'step4Num', type: 'label', required: true, maxLength: 10, style: 'accent', size: 'md' },
            { id: 'step4Title', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'step4Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'training-dos-donts',
        layout: 'gamma-compare-side',
        name: 'Best Practices',
        category: 'compare',
        description: 'Dos and don\'ts',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'dosTitle', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'md' },
            { id: 'dos', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' },
            { id: 'dontsTitle', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'md' },
            { id: 'donts', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 2, columnCount: 2, bgStyle: 'light' }
    },
    {
        id: 'training-exercise',
        layout: 'gamma-cards-highlight',
        name: 'Practice Exercise',
        category: 'cards',
        description: 'Hands-on activity',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'instructions', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'md' },
            { id: 'task', type: 'subheading', required: true, maxLength: 60, style: 'serif', size: 'md' },
            { id: 'steps', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' },
            { id: 'duration', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: true, cardCount: 1, bgStyle: 'light' }
    },
    {
        id: 'training-quiz',
        layout: 'gamma-cards-3',
        name: 'Knowledge Check',
        category: 'cards',
        description: 'Quick quiz questions',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'q1', type: 'subheading', required: true, maxLength: 60, style: 'serif', size: 'md' },
            { id: 'q1Options', type: 'bullets', required: true, maxLength: 120, style: 'sans', size: 'sm' },
            { id: 'q2', type: 'subheading', required: true, maxLength: 60, style: 'serif', size: 'md' },
            { id: 'q2Options', type: 'bullets', required: true, maxLength: 120, style: 'sans', size: 'sm' },
            { id: 'q3', type: 'subheading', required: true, maxLength: 60, style: 'serif', size: 'md' },
            { id: 'q3Options', type: 'bullets', required: true, maxLength: 120, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'training-key-takeaways',
        layout: 'gamma-features-3col',
        name: 'Key Takeaways',
        category: 'features',
        description: 'Session summary',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'takeaway1', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'takeaway1Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'takeaway2', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'takeaway2Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'takeaway3', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'takeaway3Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'training-resources',
        layout: 'gamma-content-bullets',
        name: 'Additional Resources',
        category: 'content',
        description: 'Further learning materials',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'intro', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'md' },
            { id: 'resources', type: 'bullets', required: true, maxLength: 300, style: 'sans', size: 'sm' },
            { id: 'contact', type: 'caption', required: false, maxLength: 80, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    }
];

// ==========================================
// PROJECT STATUS TEMPLATES
// ==========================================
export const PROJECT_STATUS_TEMPLATES: GammaTemplate[] = [
    {
        id: 'project-status-overview',
        layout: 'gamma-stat-with-cards',
        name: 'Project Overview',
        category: 'stats',
        description: 'High-level project status',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'completion', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'xxl' },
            { id: 'completionLabel', type: 'label', required: true, maxLength: 20, style: 'sans', size: 'md' },
            { id: 'status', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'md' },
            { id: 'timeline', type: 'body', required: true, maxLength: 40, style: 'sans', size: 'sm' },
            { id: 'budget', type: 'body', required: true, maxLength: 40, style: 'sans', size: 'sm' },
            { id: 'risks', type: 'body', required: true, maxLength: 40, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: true, cardCount: 3, bgStyle: 'light' }
    },
    {
        id: 'project-milestones',
        layout: 'gamma-timeline-vertical',
        name: 'Project Milestones',
        category: 'timeline',
        description: 'Key deliverables timeline',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'm1Date', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'm1Name', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'm1Status', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'xs' },
            { id: 'm2Date', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'm2Name', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'm2Status', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'xs' },
            { id: 'm3Date', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'm3Name', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'm3Status', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'xs' },
            { id: 'm4Date', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'm4Name', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'm4Status', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'xs' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'project-blockers',
        layout: 'gamma-cards-3',
        name: 'Risks & Blockers',
        category: 'cards',
        description: 'Issues needing attention',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'issue1', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'issue1Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'issue1Priority', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'xs' },
            { id: 'issue2', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'issue2Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'issue2Priority', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'xs' },
            { id: 'issue3', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'issue3Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'issue3Priority', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'xs' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'project-next-steps',
        layout: 'gamma-content-bullets',
        name: 'Next Steps',
        category: 'content',
        description: 'Upcoming actions',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'summary', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'md' },
            { id: 'actions', type: 'bullets', required: true, maxLength: 300, style: 'sans', size: 'sm' },
            { id: 'deadline', type: 'caption', required: false, maxLength: 50, style: 'accent', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    }
];

// Combine all corporate templates
export const ALL_CORPORATE_TEMPLATES: GammaTemplate[] = [
    ...ANNUAL_REPORT_TEMPLATES,
    ...INVESTOR_UPDATE_TEMPLATES,
    ...TRAINING_TEMPLATES,
    ...PROJECT_STATUS_TEMPLATES
];

// Get templates by category
export function getCorporateTemplates(type: 'annual' | 'investor' | 'training' | 'project'): GammaTemplate[] {
    switch (type) {
        case 'annual':
            return ANNUAL_REPORT_TEMPLATES;
        case 'investor':
            return INVESTOR_UPDATE_TEMPLATES;
        case 'training':
            return TRAINING_TEMPLATES;
        case 'project':
            return PROJECT_STATUS_TEMPLATES;
        default:
            return [];
    }
}

// Total corporate template count
export const TOTAL_CORPORATE_TEMPLATE_COUNT = ALL_CORPORATE_TEMPLATES.length;
