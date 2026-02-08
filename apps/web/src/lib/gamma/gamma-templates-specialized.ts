/**
 * 🎨 Specialized Templates
 * Templates for specific use cases:
 * - HR/Recruiting (job postings, candidate reviews, onboarding)
 * - Technical Documentation (API docs, architecture, changelogs)
 * - Webinars/Workshops (live sessions, Q&A, recordings)
 * - Research/Reports (findings, methodology, data analysis)
 */

import { GammaTemplate } from './gamma-templates';

// ==========================================
// HR / RECRUITING TEMPLATES
// ==========================================
export const HR_RECRUITING_TEMPLATES: GammaTemplate[] = [
    {
        id: 'hr-job-posting',
        layout: 'gamma-title-gradient',
        name: 'Job Posting',
        category: 'title',
        description: 'Open position announcement',
        elements: [
            { id: 'title', type: 'title', required: true, maxLength: 40, style: 'serif', size: 'xxl' },
            { id: 'department', type: 'label', required: true, maxLength: 25, style: 'accent', size: 'md' },
            { id: 'location', type: 'subheading', required: true, maxLength: 40, style: 'sans', size: 'lg' },
            { id: 'type', type: 'caption', required: true, maxLength: 20, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: true, hasAccentBar: false, hasCards: false, bgStyle: 'gradient' }
    },
    {
        id: 'hr-role-overview',
        layout: 'gamma-content-split-right',
        name: 'Role Overview',
        category: 'content',
        description: 'Position details and expectations',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'summary', type: 'body', required: true, maxLength: 200, style: 'sans', size: 'md' },
            { id: 'responsibilities', type: 'bullets', required: true, maxLength: 300, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'teamPhoto', position: 'right', aspectRatio: '4:3', size: 'large', keywords: ['team', 'office', 'workplace'] }
        ],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'hr-requirements',
        layout: 'gamma-compare-side',
        name: 'Requirements',
        category: 'compare',
        description: 'Must-have vs nice-to-have',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'mustHaveTitle', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'md' },
            { id: 'mustHave', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' },
            { id: 'niceToHaveTitle', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'md' },
            { id: 'niceToHave', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 2, columnCount: 2, bgStyle: 'light' }
    },
    {
        id: 'hr-benefits',
        layout: 'gamma-features-4col',
        name: 'Benefits Package',
        category: 'features',
        description: 'Perks and benefits',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'benefit1', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'benefit1Desc', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'benefit2', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'benefit2Desc', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'benefit3', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'benefit3Desc', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'benefit4', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'benefit4Desc', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 4, columnCount: 4, bgStyle: 'light' }
    },
    {
        id: 'hr-interview-process',
        layout: 'gamma-timeline-horizontal',
        name: 'Interview Process',
        category: 'timeline',
        description: 'Hiring stages',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'stage1', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'sm' },
            { id: 'stage1Desc', type: 'body', required: true, maxLength: 50, style: 'sans', size: 'sm' },
            { id: 'stage2', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'sm' },
            { id: 'stage2Desc', type: 'body', required: true, maxLength: 50, style: 'sans', size: 'sm' },
            { id: 'stage3', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'sm' },
            { id: 'stage3Desc', type: 'body', required: true, maxLength: 50, style: 'sans', size: 'sm' },
            { id: 'stage4', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'sm' },
            { id: 'stage4Desc', type: 'body', required: true, maxLength: 50, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 4, columnCount: 4, bgStyle: 'light' }
    },
    {
        id: 'hr-candidate-scorecard',
        layout: 'gamma-stat-with-cards',
        name: 'Candidate Scorecard',
        category: 'stats',
        description: 'Evaluation summary',
        elements: [
            { id: 'candidateName', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'overallScore', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'xxl' },
            { id: 'scoreLabel', type: 'label', required: true, maxLength: 20, style: 'sans', size: 'md' },
            { id: 'technicalScore', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'lg' },
            { id: 'technicalLabel', type: 'label', required: true, maxLength: 20, style: 'sans', size: 'sm' },
            { id: 'cultureScore', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'lg' },
            { id: 'cultureLabel', type: 'label', required: true, maxLength: 20, style: 'sans', size: 'sm' },
            { id: 'experienceScore', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'lg' },
            { id: 'experienceLabel', type: 'label', required: true, maxLength: 20, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: true, cardCount: 3, bgStyle: 'light' }
    },
    {
        id: 'hr-team-intro',
        layout: 'gamma-team-spotlight',
        name: 'Meet the Team',
        category: 'team',
        description: 'Team introduction for candidates',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'member1Name', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'member1Role', type: 'label', required: true, maxLength: 30, style: 'accent', size: 'sm' },
            { id: 'member1Bio', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'member2Name', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'member2Role', type: 'label', required: true, maxLength: 30, style: 'accent', size: 'sm' },
            { id: 'member2Bio', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'member3Name', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'member3Role', type: 'label', required: true, maxLength: 30, style: 'accent', size: 'sm' },
            { id: 'member3Bio', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'photo1', position: 'avatar', aspectRatio: '1:1', size: 'medium', keywords: ['professional', 'headshot'] },
            { id: 'photo2', position: 'avatar', aspectRatio: '1:1', size: 'medium', keywords: ['professional', 'headshot'] },
            { id: 'photo3', position: 'avatar', aspectRatio: '1:1', size: 'medium', keywords: ['professional', 'headshot'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'hr-apply-cta',
        layout: 'gamma-cta-gradient',
        name: 'Apply Now',
        category: 'cta',
        description: 'Application call to action',
        elements: [
            { id: 'title', type: 'title', required: true, maxLength: 40, style: 'serif', size: 'xl' },
            { id: 'subtitle', type: 'subheading', required: true, maxLength: 60, style: 'sans', size: 'lg' },
            { id: 'cta', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'lg' },
            { id: 'deadline', type: 'caption', required: false, maxLength: 40, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: true, hasAccentBar: false, hasCards: false, bgStyle: 'gradient' }
    }
];

// ==========================================
// TECHNICAL DOCUMENTATION TEMPLATES
// ==========================================
export const TECH_DOCS_TEMPLATES: GammaTemplate[] = [
    {
        id: 'tech-api-overview',
        layout: 'gamma-title-minimal',
        name: 'API Documentation',
        category: 'title',
        description: 'API docs cover',
        elements: [
            { id: 'apiName', type: 'title', required: true, maxLength: 40, style: 'mono', size: 'xxl' },
            { id: 'version', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'md' },
            { id: 'description', type: 'subheading', required: true, maxLength: 60, style: 'sans', size: 'lg' },
            { id: 'updated', type: 'caption', required: false, maxLength: 30, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'tech-endpoint',
        layout: 'gamma-content-code',
        name: 'API Endpoint',
        category: 'content',
        description: 'Single endpoint documentation',
        elements: [
            { id: 'method', type: 'label', required: true, maxLength: 10, style: 'accent', size: 'md' },
            { id: 'endpoint', type: 'subheading', required: true, maxLength: 80, style: 'mono', size: 'md' },
            { id: 'description', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'md' },
            { id: 'parameters', type: 'bullets', required: true, maxLength: 200, style: 'mono', size: 'sm' },
            { id: 'response', type: 'body', required: true, maxLength: 200, style: 'mono', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'tech-architecture',
        layout: 'gamma-content-split-right',
        name: 'System Architecture',
        category: 'content',
        description: 'High-level architecture diagram',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'overview', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'md' },
            { id: 'components', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'diagram', position: 'right', aspectRatio: '4:3', size: 'large', keywords: ['architecture', 'diagram', 'system'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'tech-data-flow',
        layout: 'gamma-timeline-horizontal',
        name: 'Data Flow',
        category: 'timeline',
        description: 'Data pipeline visualization',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'step1', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'sm' },
            { id: 'step1Desc', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'step2', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'sm' },
            { id: 'step2Desc', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'step3', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'sm' },
            { id: 'step3Desc', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'step4', type: 'label', required: true, maxLength: 20, style: 'accent', size: 'sm' },
            { id: 'step4Desc', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 4, columnCount: 4, bgStyle: 'light' }
    },
    {
        id: 'tech-changelog',
        layout: 'gamma-timeline-vertical',
        name: 'Changelog',
        category: 'timeline',
        description: 'Version history',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'v1Version', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'v1Date', type: 'caption', required: true, maxLength: 15, style: 'muted', size: 'xs' },
            { id: 'v1Changes', type: 'bullets', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'v2Version', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'v2Date', type: 'caption', required: true, maxLength: 15, style: 'muted', size: 'xs' },
            { id: 'v2Changes', type: 'bullets', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'v3Version', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'v3Date', type: 'caption', required: true, maxLength: 15, style: 'muted', size: 'xs' },
            { id: 'v3Changes', type: 'bullets', required: true, maxLength: 150, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'tech-code-example',
        layout: 'gamma-content-code-block',
        name: 'Code Example',
        category: 'content',
        description: 'Code snippet with explanation',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'language', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'description', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'md' },
            { id: 'code', type: 'body', required: true, maxLength: 500, style: 'mono', size: 'sm' },
            { id: 'explanation', type: 'caption', required: false, maxLength: 150, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: true, cardCount: 1, bgStyle: 'dark' }
    },
    {
        id: 'tech-error-codes',
        layout: 'gamma-cards-3',
        name: 'Error Codes',
        category: 'cards',
        description: 'Error code reference',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'error1Code', type: 'label', required: true, maxLength: 10, style: 'accent', size: 'md' },
            { id: 'error1Name', type: 'subheading', required: true, maxLength: 30, style: 'mono', size: 'sm' },
            { id: 'error1Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'error2Code', type: 'label', required: true, maxLength: 10, style: 'accent', size: 'md' },
            { id: 'error2Name', type: 'subheading', required: true, maxLength: 30, style: 'mono', size: 'sm' },
            { id: 'error2Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'error3Code', type: 'label', required: true, maxLength: 10, style: 'accent', size: 'md' },
            { id: 'error3Name', type: 'subheading', required: true, maxLength: 30, style: 'mono', size: 'sm' },
            { id: 'error3Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'tech-sdk-installation',
        layout: 'gamma-content-bullets',
        name: 'Installation Guide',
        category: 'content',
        description: 'SDK/package installation',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'intro', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'md' },
            { id: 'steps', type: 'bullets', required: true, maxLength: 300, style: 'mono', size: 'sm' },
            { id: 'note', type: 'caption', required: false, maxLength: 100, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    }
];

// ==========================================
// WEBINAR / WORKSHOP TEMPLATES
// ==========================================
export const WEBINAR_TEMPLATES: GammaTemplate[] = [
    {
        id: 'webinar-title',
        layout: 'gamma-title-gradient',
        name: 'Webinar Title',
        category: 'title',
        description: 'Webinar opener',
        elements: [
            { id: 'title', type: 'title', required: true, maxLength: 60, style: 'serif', size: 'xxl' },
            { id: 'subtitle', type: 'subheading', required: true, maxLength: 60, style: 'sans', size: 'lg' },
            { id: 'presenter', type: 'label', required: true, maxLength: 40, style: 'accent', size: 'md' },
            { id: 'date', type: 'caption', required: true, maxLength: 30, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: true, hasAccentBar: false, hasCards: false, bgStyle: 'gradient' }
    },
    {
        id: 'webinar-host-intro',
        layout: 'gamma-content-split-left',
        name: 'Host Introduction',
        category: 'content',
        description: 'Presenter bio',
        elements: [
            { id: 'name', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'title', type: 'label', required: true, maxLength: 40, style: 'accent', size: 'md' },
            { id: 'bio', type: 'body', required: true, maxLength: 200, style: 'sans', size: 'md' },
            { id: 'credentials', type: 'bullets', required: false, maxLength: 150, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'headshot', position: 'left', aspectRatio: '1:1', size: 'large', keywords: ['professional', 'speaker', 'presenter'] }
        ],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'webinar-agenda',
        layout: 'gamma-timeline-vertical',
        name: 'Session Agenda',
        category: 'timeline',
        description: 'What we will cover',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'time1', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'topic1', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'time2', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'topic2', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'time3', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'topic3', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'time4', type: 'label', required: true, maxLength: 15, style: 'accent', size: 'sm' },
            { id: 'topic4', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'webinar-poll',
        layout: 'gamma-features-3col',
        name: 'Live Poll',
        category: 'features',
        description: 'Interactive poll question',
        elements: [
            { id: 'question', type: 'heading', required: true, maxLength: 60, style: 'serif', size: 'lg' },
            { id: 'option1', type: 'subheading', required: true, maxLength: 40, style: 'sans', size: 'md' },
            { id: 'option1Emoji', type: 'label', required: false, maxLength: 5, style: 'accent', size: 'xl' },
            { id: 'option2', type: 'subheading', required: true, maxLength: 40, style: 'sans', size: 'md' },
            { id: 'option2Emoji', type: 'label', required: false, maxLength: 5, style: 'accent', size: 'xl' },
            { id: 'option3', type: 'subheading', required: true, maxLength: 40, style: 'sans', size: 'md' },
            { id: 'option3Emoji', type: 'label', required: false, maxLength: 5, style: 'accent', size: 'xl' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'webinar-qa',
        layout: 'gamma-content-centered',
        name: 'Q&A Time',
        category: 'content',
        description: 'Question and answer break',
        elements: [
            { id: 'title', type: 'title', required: true, maxLength: 40, style: 'serif', size: 'xxl' },
            { id: 'instructions', type: 'subheading', required: true, maxLength: 80, style: 'sans', size: 'lg' },
            { id: 'chatLink', type: 'caption', required: false, maxLength: 60, style: 'accent', size: 'md' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'webinar-demo',
        layout: 'gamma-content-split-right',
        name: 'Live Demo',
        category: 'content',
        description: 'Demo section header',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'description', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'md' },
            { id: 'steps', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'screenshot', position: 'right', aspectRatio: '16:9', size: 'large', keywords: ['demo', 'screen', 'interface'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'webinar-break',
        layout: 'gamma-title-minimal',
        name: 'Break Time',
        category: 'title',
        description: 'Short break slide',
        elements: [
            { id: 'title', type: 'title', required: true, maxLength: 30, style: 'serif', size: 'xxl' },
            { id: 'duration', type: 'subheading', required: true, maxLength: 30, style: 'sans', size: 'lg' },
            { id: 'returnTime', type: 'caption', required: false, maxLength: 30, style: 'accent', size: 'md' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'webinar-resources',
        layout: 'gamma-cards-3',
        name: 'Resources',
        category: 'cards',
        description: 'Downloadable materials',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'resource1', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'resource1Desc', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'resource1Link', type: 'caption', required: true, maxLength: 30, style: 'accent', size: 'xs' },
            { id: 'resource2', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'resource2Desc', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'resource2Link', type: 'caption', required: true, maxLength: 30, style: 'accent', size: 'xs' },
            { id: 'resource3', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'resource3Desc', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'resource3Link', type: 'caption', required: true, maxLength: 30, style: 'accent', size: 'xs' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'webinar-closing',
        layout: 'gamma-cta-gradient',
        name: 'Thank You',
        category: 'cta',
        description: 'Closing slide',
        elements: [
            { id: 'title', type: 'title', required: true, maxLength: 40, style: 'serif', size: 'xl' },
            { id: 'feedback', type: 'subheading', required: true, maxLength: 60, style: 'sans', size: 'lg' },
            { id: 'contact', type: 'caption', required: true, maxLength: 50, style: 'muted', size: 'md' },
            { id: 'social', type: 'caption', required: false, maxLength: 50, style: 'accent', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: true, hasAccentBar: false, hasCards: false, bgStyle: 'gradient' }
    }
];

// ==========================================
// RESEARCH / REPORTS TEMPLATES
// ==========================================
export const RESEARCH_TEMPLATES: GammaTemplate[] = [
    {
        id: 'research-cover',
        layout: 'gamma-title-minimal',
        name: 'Research Cover',
        category: 'title',
        description: 'Research report cover',
        elements: [
            { id: 'title', type: 'title', required: true, maxLength: 60, style: 'serif', size: 'xl' },
            { id: 'subtitle', type: 'subheading', required: false, maxLength: 60, style: 'sans', size: 'lg' },
            { id: 'authors', type: 'label', required: true, maxLength: 60, style: 'accent', size: 'md' },
            { id: 'date', type: 'caption', required: true, maxLength: 30, style: 'muted', size: 'sm' },
            { id: 'institution', type: 'caption', required: false, maxLength: 40, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'research-abstract',
        layout: 'gamma-content-bullets',
        name: 'Executive Summary',
        category: 'content',
        description: 'Key findings overview',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'summary', type: 'body', required: true, maxLength: 300, style: 'sans', size: 'md' },
            { id: 'keyFindings', type: 'bullets', required: true, maxLength: 300, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'research-methodology',
        layout: 'gamma-features-3col',
        name: 'Methodology',
        category: 'features',
        description: 'Research approach',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'approach1', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'approach1Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'approach2', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'approach2Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'approach3', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'approach3Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'research-data-highlight',
        layout: 'gamma-stat-featured',
        name: 'Key Finding',
        category: 'stats',
        description: 'Featured data point',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'stat', type: 'stat', required: true, maxLength: 15, style: 'accent', size: 'xxl' },
            { id: 'statLabel', type: 'label', required: true, maxLength: 40, style: 'sans', size: 'md' },
            { id: 'context', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'source', type: 'caption', required: false, maxLength: 50, style: 'muted', size: 'xs' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'research-comparison',
        layout: 'gamma-compare-side',
        name: 'Data Comparison',
        category: 'compare',
        description: 'Compare two data sets',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'group1', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'group1Data', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' },
            { id: 'group2', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'group2Data', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 2, columnCount: 2, bgStyle: 'light' }
    },
    {
        id: 'research-chart',
        layout: 'gamma-content-split-right',
        name: 'Chart Analysis',
        category: 'content',
        description: 'Data visualization with insights',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'insights', type: 'body', required: true, maxLength: 200, style: 'sans', size: 'md' },
            { id: 'keyPoints', type: 'bullets', required: true, maxLength: 150, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'chart', position: 'right', aspectRatio: '4:3', size: 'large', keywords: ['chart', 'graph', 'data'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'research-conclusions',
        layout: 'gamma-content-bullets',
        name: 'Conclusions',
        category: 'content',
        description: 'Research conclusions',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'summary', type: 'body', required: true, maxLength: 150, style: 'sans', size: 'md' },
            { id: 'conclusions', type: 'bullets', required: true, maxLength: 300, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'research-recommendations',
        layout: 'gamma-features-3col',
        name: 'Recommendations',
        category: 'features',
        description: 'Action items from research',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'rec1', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'rec1Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'rec2', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'rec2Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'rec3', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'rec3Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    }
];

// Combine all specialized templates
export const ALL_SPECIALIZED_TEMPLATES: GammaTemplate[] = [
    ...HR_RECRUITING_TEMPLATES,
    ...TECH_DOCS_TEMPLATES,
    ...WEBINAR_TEMPLATES,
    ...RESEARCH_TEMPLATES
];

// Get templates by category
export function getSpecializedTemplates(type: 'hr' | 'tech' | 'webinar' | 'research'): GammaTemplate[] {
    switch (type) {
        case 'hr':
            return HR_RECRUITING_TEMPLATES;
        case 'tech':
            return TECH_DOCS_TEMPLATES;
        case 'webinar':
            return WEBINAR_TEMPLATES;
        case 'research':
            return RESEARCH_TEMPLATES;
        default:
            return [];
    }
}

// Total specialized template count
export const TOTAL_SPECIALIZED_TEMPLATE_COUNT = ALL_SPECIALIZED_TEMPLATES.length;
