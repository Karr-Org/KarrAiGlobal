/**
 * 🎨 Additional Gamma Templates
 * Extended template library based on CV/Profile presentations
 * Includes experience cards, timeline cards, skill grids, and more
 */

import { GammaTemplate, GammaLayoutType } from './gamma-templates';

// Additional templates for profile/resume/team presentations
export const GAMMA_ADDITIONAL_TEMPLATES: GammaTemplate[] = [
    // ==========================================
    // PROFILE TEMPLATES
    // ==========================================
    {
        id: 'gamma-profile-split',
        layout: 'gamma-title-split',
        name: 'Profile Split',
        category: 'title',
        description: 'Professional profile with photo - like resume title slide',
        elements: [
            { id: 'name', type: 'title', required: true, maxLength: 50, style: 'serif', size: 'xl' },
            { id: 'role', type: 'subheading', required: true, maxLength: 80, style: 'sans', size: 'lg' },
            { id: 'credentials', type: 'body', required: false, maxLength: 200, style: 'serif', size: 'md' },
            { id: 'location', type: 'caption', required: false, maxLength: 50, style: 'muted', size: 'sm' },
            { id: 'email', type: 'caption', required: false, maxLength: 50, style: 'muted', size: 'sm' },
            { id: 'phone', type: 'caption', required: false, maxLength: 30, style: 'muted', size: 'sm' },
            { id: 'linkedin', type: 'caption', required: false, maxLength: 50, style: 'accent', size: 'sm' }
        ],
        images: [
            { id: 'photo', position: 'right', aspectRatio: '3:4', size: 'large', keywords: ['portrait', 'professional'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },

    // ==========================================
    // EXPERIENCE CARD TEMPLATES
    // ==========================================
    {
        id: 'gamma-experience-cards-2',
        layout: 'gamma-cards-highlight',
        name: 'Experience Cards 2-Column',
        category: 'cards',
        description: 'Two experience cards side by side - like CV experience slide',
        elements: [
            { id: 'sectionBadge', type: 'caption', required: false, maxLength: 20, style: 'accent', size: 'xs' },
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            // Card 1
            { id: 'exp1Title', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'exp1Company', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'exp1Date', type: 'caption', required: true, maxLength: 30, style: 'muted', size: 'xs' },
            { id: 'exp1Bullets', type: 'bullets', required: true, maxLength: 500, style: 'sans', size: 'sm' },
            // Card 2
            { id: 'exp2Title', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'exp2Company', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'exp2Date', type: 'caption', required: true, maxLength: 30, style: 'muted', size: 'xs' },
            { id: 'exp2Bullets', type: 'bullets', required: true, maxLength: 500, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'icon1', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['briefcase'] },
            { id: 'icon2', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['building'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 2, columnCount: 2, bgStyle: 'light' }
    },
    {
        id: 'gamma-experience-single',
        layout: 'gamma-content-text',
        name: 'Single Experience Card',
        category: 'cards',
        description: 'Full-width experience card with details',
        elements: [
            { id: 'sectionBadge', type: 'caption', required: false, maxLength: 20, style: 'accent', size: 'xs' },
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'role', type: 'subheading', required: true, maxLength: 50, style: 'serif', size: 'md' },
            { id: 'company', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'date', type: 'caption', required: true, maxLength: 30, style: 'muted', size: 'xs' },
            { id: 'bullets', type: 'bullets', required: true, maxLength: 800, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'icon', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['work'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 1, bgStyle: 'light' }
    },

    // ==========================================
    // SKILLS/EXPERTISE TEMPLATES
    // ==========================================
    {
        id: 'gamma-skills-grid',
        layout: 'gamma-features-4col',
        name: 'Skills Grid',
        category: 'features',
        description: '4-column skills with badges',
        elements: [
            { id: 'sectionBadge', type: 'caption', required: false, maxLength: 20, style: 'accent', size: 'xs' },
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 's1Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'sm' },
            { id: 's1Items', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'xs' },
            { id: 's2Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'sm' },
            { id: 's2Items', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'xs' },
            { id: 's3Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'sm' },
            { id: 's3Items', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'xs' },
            { id: 's4Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'sm' },
            { id: 's4Items', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'xs' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 4, columnCount: 4, bgStyle: 'light' }
    },
    {
        id: 'gamma-skills-tags',
        layout: 'gamma-content-text',
        name: 'Skills Tags',
        category: 'content',
        description: 'Skills displayed as pill badges',
        elements: [
            { id: 'sectionBadge', type: 'caption', required: false, maxLength: 20, style: 'accent', size: 'xs' },
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'category1', type: 'subheading', required: true, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'tags1', type: 'bullets', required: true, maxLength: 200, style: 'sans', size: 'sm' },
            { id: 'category2', type: 'subheading', required: false, maxLength: 30, style: 'serif', size: 'md' },
            { id: 'tags2', type: 'bullets', required: false, maxLength: 200, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },

    // ==========================================
    // EDUCATION TEMPLATES
    // ==========================================
    {
        id: 'gamma-education-timeline',
        layout: 'gamma-timeline-vertical',
        name: 'Education Timeline',
        category: 'timeline',
        description: 'Education history in timeline format',
        elements: [
            { id: 'sectionBadge', type: 'caption', required: false, maxLength: 20, style: 'accent', size: 'xs' },
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'edu1Year', type: 'label', required: true, maxLength: 10, style: 'accent', size: 'sm' },
            { id: 'edu1Degree', type: 'subheading', required: true, maxLength: 50, style: 'serif', size: 'md' },
            { id: 'edu1School', type: 'body', required: true, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'edu2Year', type: 'label', required: false, maxLength: 10, style: 'accent', size: 'sm' },
            { id: 'edu2Degree', type: 'subheading', required: false, maxLength: 50, style: 'serif', size: 'md' },
            { id: 'edu2School', type: 'body', required: false, maxLength: 60, style: 'sans', size: 'sm' },
            { id: 'edu3Year', type: 'label', required: false, maxLength: 10, style: 'accent', size: 'sm' },
            { id: 'edu3Degree', type: 'subheading', required: false, maxLength: 50, style: 'serif', size: 'md' },
            { id: 'edu3School', type: 'body', required: false, maxLength: 60, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'gamma-certifications',
        layout: 'gamma-features-3col',
        name: 'Certifications Grid',
        category: 'features',
        description: 'Professional certifications in grid',
        elements: [
            { id: 'sectionBadge', type: 'caption', required: false, maxLength: 20, style: 'accent', size: 'xs' },
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'cert1Name', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'cert1Org', type: 'caption', required: true, maxLength: 50, style: 'muted', size: 'sm' },
            { id: 'cert2Name', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'cert2Org', type: 'caption', required: true, maxLength: 50, style: 'muted', size: 'sm' },
            { id: 'cert3Name', type: 'subheading', required: true, maxLength: 40, style: 'serif', size: 'md' },
            { id: 'cert3Org', type: 'caption', required: true, maxLength: 50, style: 'muted', size: 'sm' }
        ],
        images: [
            { id: 'badge1', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['certificate'] },
            { id: 'badge2', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['award'] },
            { id: 'badge3', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['seal'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },

    // ==========================================
    // ACHIEVEMENTS TEMPLATES
    // ==========================================
    {
        id: 'gamma-achievements-stats',
        layout: 'gamma-stats-row',
        name: 'Achievement Stats',
        category: 'stats',
        description: 'Key achievements with big numbers',
        elements: [
            { id: 'sectionBadge', type: 'caption', required: false, maxLength: 20, style: 'accent', size: 'xs' },
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'stat1', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'xl' },
            { id: 'label1', type: 'label', required: true, maxLength: 30, style: 'muted', size: 'sm' },
            { id: 'stat2', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'xl' },
            { id: 'label2', type: 'label', required: true, maxLength: 30, style: 'muted', size: 'sm' },
            { id: 'stat3', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'xl' },
            { id: 'label3', type: 'label', required: true, maxLength: 30, style: 'muted', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, columnCount: 3, bgStyle: 'light' }
    },
    {
        id: 'gamma-impact-cards',
        layout: 'gamma-cards-3',
        name: 'Impact Cards',
        category: 'cards',
        description: 'Key impacts/outcomes in card format',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'impact1Title', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'lg' },
            { id: 'impact1Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'impact2Title', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'lg' },
            { id: 'impact2Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'impact3Title', type: 'stat', required: true, maxLength: 10, style: 'accent', size: 'lg' },
            { id: 'impact3Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },

    // ==========================================
    // SERVICES/OFFERINGS TEMPLATES
    // ==========================================
    {
        id: 'gamma-services-4',
        layout: 'gamma-features-4col',
        name: 'Services Grid 4',
        category: 'features',
        description: 'Four services/offerings with icons',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'intro', type: 'body', required: false, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 'svc1Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'svc1Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'svc2Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'svc2Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'svc3Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'svc3Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' },
            { id: 'svc4Title', type: 'subheading', required: true, maxLength: 25, style: 'serif', size: 'md' },
            { id: 'svc4Desc', type: 'body', required: true, maxLength: 100, style: 'sans', size: 'sm' }
        ],
        images: [
            { id: 'icon1', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['service'] },
            { id: 'icon2', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['feature'] },
            { id: 'icon3', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['solution'] },
            { id: 'icon4', position: 'icon', aspectRatio: '1:1', size: 'icon', keywords: ['benefit'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 4, columnCount: 4, bgStyle: 'light' }
    },
    {
        id: 'gamma-process-steps',
        layout: 'gamma-timeline-horizontal',
        name: 'Process Steps',
        category: 'timeline',
        description: 'Horizontal process/methodology steps',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'step1Num', type: 'stat', required: true, maxLength: 5, style: 'accent', size: 'lg' },
            { id: 'step1Title', type: 'subheading', required: true, maxLength: 20, style: 'serif', size: 'md' },
            { id: 'step1Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'step2Num', type: 'stat', required: true, maxLength: 5, style: 'accent', size: 'lg' },
            { id: 'step2Title', type: 'subheading', required: true, maxLength: 20, style: 'serif', size: 'md' },
            { id: 'step2Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'step3Num', type: 'stat', required: true, maxLength: 5, style: 'accent', size: 'lg' },
            { id: 'step3Title', type: 'subheading', required: true, maxLength: 20, style: 'serif', size: 'md' },
            { id: 'step3Desc', type: 'body', required: true, maxLength: 80, style: 'sans', size: 'sm' },
            { id: 'step4Num', type: 'stat', required: false, maxLength: 5, style: 'accent', size: 'lg' },
            { id: 'step4Title', type: 'subheading', required: false, maxLength: 20, style: 'serif', size: 'md' },
            { id: 'step4Desc', type: 'body', required: false, maxLength: 80, style: 'sans', size: 'sm' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 4, columnCount: 4, bgStyle: 'light' }
    },

    // ==========================================
    // TESTIMONIAL TEMPLATES
    // ==========================================
    {
        id: 'gamma-testimonial-featured',
        layout: 'gamma-quote-with-image',
        name: 'Featured Testimonial',
        category: 'quote',
        description: 'Single large testimonial with photo',
        elements: [
            { id: 'sectionBadge', type: 'caption', required: false, maxLength: 20, style: 'accent', size: 'xs' },
            { id: 'quote', type: 'quote', required: true, maxLength: 300, style: 'serif', size: 'lg' },
            { id: 'authorName', type: 'author', required: true, maxLength: 40, style: 'sans', size: 'md' },
            { id: 'authorRole', type: 'caption', required: true, maxLength: 60, style: 'muted', size: 'sm' },
            { id: 'company', type: 'caption', required: false, maxLength: 50, style: 'muted', size: 'sm' }
        ],
        images: [
            { id: 'avatar', position: 'avatar', aspectRatio: '1:1', size: 'medium', keywords: ['portrait'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 1, bgStyle: 'light' }
    },
    {
        id: 'gamma-testimonials-3',
        layout: 'gamma-cards-3',
        name: 'Testimonials Grid',
        category: 'quote',
        description: 'Three testimonials in card format',
        elements: [
            { id: 'title', type: 'heading', required: false, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 't1Quote', type: 'quote', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 't1Author', type: 'author', required: true, maxLength: 30, style: 'serif', size: 'sm' },
            { id: 't1Role', type: 'caption', required: true, maxLength: 40, style: 'muted', size: 'xs' },
            { id: 't2Quote', type: 'quote', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 't2Author', type: 'author', required: true, maxLength: 30, style: 'serif', size: 'sm' },
            { id: 't2Role', type: 'caption', required: true, maxLength: 40, style: 'muted', size: 'xs' },
            { id: 't3Quote', type: 'quote', required: true, maxLength: 150, style: 'sans', size: 'sm' },
            { id: 't3Author', type: 'author', required: true, maxLength: 30, style: 'serif', size: 'sm' },
            { id: 't3Role', type: 'caption', required: true, maxLength: 40, style: 'muted', size: 'xs' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: false, hasCards: true, cardCount: 3, columnCount: 3, bgStyle: 'light' }
    },

    // ==========================================
    // CONTACT/CTA TEMPLATES
    // ==========================================
    {
        id: 'gamma-contact-info',
        layout: 'gamma-closing-contact',
        name: 'Contact Information',
        category: 'cta',
        description: 'Contact details with icons',
        elements: [
            { id: 'title', type: 'heading', required: true, maxLength: 40, style: 'serif', size: 'lg' },
            { id: 'subtitle', type: 'body', required: false, maxLength: 100, style: 'sans', size: 'md' },
            { id: 'email', type: 'body', required: true, maxLength: 50, style: 'accent', size: 'md' },
            { id: 'phone', type: 'body', required: false, maxLength: 30, style: 'sans', size: 'md' },
            { id: 'location', type: 'body', required: false, maxLength: 60, style: 'sans', size: 'md' },
            { id: 'linkedin', type: 'body', required: false, maxLength: 50, style: 'accent', size: 'md' },
            { id: 'website', type: 'body', required: false, maxLength: 50, style: 'accent', size: 'md' }
        ],
        images: [],
        design: { hasGradient: false, hasAccentBar: true, hasCards: false, bgStyle: 'light' }
    },
    {
        id: 'gamma-cta-split',
        layout: 'gamma-content-split-right',
        name: 'CTA with Image',
        category: 'cta',
        description: 'Call to action with side image',
        elements: [
            { id: 'title', type: 'title', required: true, maxLength: 50, style: 'serif', size: 'xl' },
            { id: 'body', type: 'body', required: true, maxLength: 200, style: 'sans', size: 'md' },
            { id: 'cta', type: 'label', required: true, maxLength: 30, style: 'accent', size: 'md' },
            { id: 'secondary', type: 'caption', required: false, maxLength: 50, style: 'muted', size: 'sm' }
        ],
        images: [
            { id: 'ctaImage', position: 'right', aspectRatio: '4:3', size: 'large', keywords: ['business', 'success'] }
        ],
        design: { hasGradient: false, hasAccentBar: false, hasCards: false, bgStyle: 'light' }
    }
];

// Combine all templates
export function getAllGammaTemplates(): GammaTemplate[] {
    // Import the original templates dynamically to avoid circular dependency
    const { GAMMA_TEMPLATES } = require('./gamma-templates');
    return [...GAMMA_TEMPLATES, ...GAMMA_ADDITIONAL_TEMPLATES];
}

// Template count including additional
export const TOTAL_GAMMA_TEMPLATE_COUNT = 110 + GAMMA_ADDITIONAL_TEMPLATES.length; // Base + Additional
