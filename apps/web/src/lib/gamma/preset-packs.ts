/**
 * 📦 Template Preset Packs
 * Pre-built presentation structures with optimized slide order
 * Each pack is a complete presentation ready to be customized
 */

// ==========================================
// PRESET PACK TYPES
// ==========================================

export interface PresetSlide {
    templateId: string;
    name: string;
    purpose: string;
    isRequired: boolean;
    suggestedDuration?: number; // in seconds for presentation mode
}

export interface PresetPack {
    id: string;
    name: string;
    description: string;
    category: string;
    slideCount: number;
    estimatedTime: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
    color: string;
    emoji: string;
    slides: PresetSlide[];
}

// ==========================================
// STARTUP PITCH DECK PACKS
// ==========================================

export const PITCH_DECK_PACKS: PresetPack[] = [
    {
        id: 'pitch-deck-10',
        name: 'Complete Pitch Deck',
        description: 'The standard 10-slide investor pitch deck used by YC and top accelerators',
        category: 'pitch',
        slideCount: 10,
        estimatedTime: '10-15 min',
        difficulty: 'intermediate',
        tags: ['startup', 'fundraising', 'investors', 'seed', 'series-a'],
        color: '#6366f1',
        emoji: '🚀',
        slides: [
            { templateId: 'gamma-title-gradient', name: 'Title Slide', purpose: 'Company name, tagline, and your value proposition', isRequired: true, suggestedDuration: 30 },
            { templateId: 'pitch-problem', name: 'Problem', purpose: 'The pain point you are solving', isRequired: true, suggestedDuration: 60 },
            { templateId: 'pitch-solution', name: 'Solution', purpose: 'How you solve the problem', isRequired: true, suggestedDuration: 90 },
            { templateId: 'pitch-tam-sam-som', name: 'Market Size', purpose: 'TAM, SAM, SOM breakdown', isRequired: true, suggestedDuration: 60 },
            { templateId: 'pitch-business-model', name: 'Business Model', purpose: 'How you make money', isRequired: true, suggestedDuration: 60 },
            { templateId: 'pitch-traction', name: 'Traction', purpose: 'Key metrics and milestones', isRequired: true, suggestedDuration: 90 },
            { templateId: 'gamma-features-4col', name: 'Product', purpose: 'Key product features', isRequired: false, suggestedDuration: 60 },
            { templateId: 'gamma-compare-side', name: 'Competition', purpose: 'Competitive landscape', isRequired: true, suggestedDuration: 60 },
            { templateId: 'pitch-team', name: 'Team', purpose: 'Founding team backgrounds', isRequired: true, suggestedDuration: 60 },
            { templateId: 'pitch-funding-ask', name: 'The Ask', purpose: 'Funding amount and use of funds', isRequired: true, suggestedDuration: 60 }
        ]
    },
    {
        id: 'pitch-deck-5',
        name: 'Quick Pitch (5 slides)',
        description: 'Elevator pitch format for quick investor meetings or demo days',
        category: 'pitch',
        slideCount: 5,
        estimatedTime: '5 min',
        difficulty: 'beginner',
        tags: ['startup', 'demo-day', 'quick-pitch'],
        color: '#10b981',
        emoji: '⚡',
        slides: [
            { templateId: 'gamma-title-gradient', name: 'Hook', purpose: 'Attention-grabbing opener', isRequired: true, suggestedDuration: 30 },
            { templateId: 'pitch-problem', name: 'Problem & Solution', purpose: 'Combined problem/solution', isRequired: true, suggestedDuration: 60 },
            { templateId: 'pitch-traction', name: 'Traction', purpose: 'Your best metrics', isRequired: true, suggestedDuration: 60 },
            { templateId: 'pitch-team', name: 'Team', purpose: 'Why you will win', isRequired: true, suggestedDuration: 45 },
            { templateId: 'pitch-funding-ask', name: 'The Ask', purpose: 'What you need', isRequired: true, suggestedDuration: 45 }
        ]
    },
    {
        id: 'pitch-deck-extended',
        name: 'Extended Pitch Deck (15 slides)',
        description: 'Comprehensive pitch for detailed partner meetings',
        category: 'pitch',
        slideCount: 15,
        estimatedTime: '20-30 min',
        difficulty: 'advanced',
        tags: ['startup', 'series-a', 'series-b', 'detailed'],
        color: '#8b5cf6',
        emoji: '📊',
        slides: [
            { templateId: 'gamma-title-gradient', name: 'Title', purpose: 'Company introduction', isRequired: true },
            { templateId: 'gamma-stat-featured', name: 'Hook Stat', purpose: 'Attention-grabbing metric', isRequired: true },
            { templateId: 'pitch-problem', name: 'Problem', purpose: 'Market pain point', isRequired: true },
            { templateId: 'gamma-content-bullets', name: 'Problem Deep Dive', purpose: 'Problem details', isRequired: false },
            { templateId: 'pitch-solution', name: 'Solution', purpose: 'Your approach', isRequired: true },
            { templateId: 'gamma-features-4col', name: 'Product Features', purpose: 'Key capabilities', isRequired: true },
            { templateId: 'gamma-content-split-right', name: 'Demo Preview', purpose: 'Product screenshot', isRequired: false },
            { templateId: 'pitch-traction', name: 'Traction', purpose: 'Growth metrics', isRequired: true },
            { templateId: 'gamma-timeline-vertical', name: 'Milestones', purpose: 'Journey so far', isRequired: false },
            { templateId: 'pitch-tam-sam-som', name: 'Market Size', purpose: 'Market opportunity', isRequired: true },
            { templateId: 'pitch-business-model', name: 'Business Model', purpose: 'Revenue model', isRequired: true },
            { templateId: 'gamma-compare-side', name: 'Competition', purpose: 'Competitive analysis', isRequired: true },
            { templateId: 'gamma-content-bullets', name: 'Go-to-Market', purpose: 'GTM strategy', isRequired: true },
            { templateId: 'pitch-team', name: 'Team', purpose: 'Founders and advisors', isRequired: true },
            { templateId: 'pitch-funding-ask', name: 'The Ask', purpose: 'Investment ask', isRequired: true }
        ]
    }
];

// ==========================================
// SALES DECK PACKS
// ==========================================

export const SALES_DECK_PACKS: PresetPack[] = [
    {
        id: 'sales-deck-standard',
        name: 'Sales Presentation',
        description: 'Standard B2B sales deck for prospect meetings',
        category: 'sales',
        slideCount: 10,
        estimatedTime: '15-20 min',
        difficulty: 'intermediate',
        tags: ['sales', 'b2b', 'enterprise', 'proposals'],
        color: '#0ea5e9',
        emoji: '💼',
        slides: [
            { templateId: 'gamma-title-gradient', name: 'Title', purpose: 'Company + meeting purpose', isRequired: true },
            { templateId: 'sales-hook', name: 'Hook', purpose: 'Industry insight or challenge', isRequired: true },
            { templateId: 'sales-pain-points', name: 'Pain Points', purpose: 'Their challenges', isRequired: true },
            { templateId: 'gamma-content-split-right', name: 'Solution Overview', purpose: 'How you help', isRequired: true },
            { templateId: 'gamma-features-4col', name: 'Key Features', purpose: 'Product capabilities', isRequired: true },
            { templateId: 'sales-roi-calculator', name: 'ROI Impact', purpose: 'Value proposition', isRequired: true },
            { templateId: 'sales-case-study-mini', name: 'Success Story', purpose: 'Social proof', isRequired: true },
            { templateId: 'gamma-testimonials-3', name: 'Testimonials', purpose: 'Customer quotes', isRequired: false },
            { templateId: 'sales-next-steps', name: 'Implementation', purpose: 'Getting started', isRequired: true },
            { templateId: 'sales-closing', name: 'Next Steps', purpose: 'Call to action', isRequired: true }
        ]
    },
    {
        id: 'sales-deck-product-demo',
        name: 'Product Demo Deck',
        description: 'Structured product demonstration presentation',
        category: 'sales',
        slideCount: 8,
        estimatedTime: '20-30 min',
        difficulty: 'intermediate',
        tags: ['sales', 'demo', 'product', 'features'],
        color: '#14b8a6',
        emoji: '🎯',
        slides: [
            { templateId: 'gamma-title-minimal', name: 'Welcome', purpose: 'Demo introduction', isRequired: true },
            { templateId: 'gamma-content-bullets', name: 'Agenda', purpose: 'What we will cover', isRequired: true },
            { templateId: 'gamma-stat-featured', name: 'Key Value', purpose: 'Main benefit highlight', isRequired: true },
            { templateId: 'gamma-features-3col', name: 'Features Overview', purpose: 'What we will demo', isRequired: true },
            { templateId: 'gamma-content-split-right', name: 'Demo: Feature 1', purpose: 'First feature demo', isRequired: true },
            { templateId: 'gamma-content-split-right', name: 'Demo: Feature 2', purpose: 'Second feature demo', isRequired: true },
            { templateId: 'gamma-content-split-right', name: 'Demo: Feature 3', purpose: 'Third feature demo', isRequired: true },
            { templateId: 'gamma-cta-gradient', name: 'Next Steps', purpose: 'Trial or purchase CTA', isRequired: true }
        ]
    }
];

// ==========================================
// MARKETING PACKS
// ==========================================

export const MARKETING_PACKS: PresetPack[] = [
    {
        id: 'brand-guidelines-pack',
        name: 'Brand Guidelines',
        description: 'Complete brand identity documentation',
        category: 'marketing',
        slideCount: 10,
        estimatedTime: 'Reference doc',
        difficulty: 'intermediate',
        tags: ['brand', 'guidelines', 'identity', 'design'],
        color: '#ec4899',
        emoji: '🎨',
        slides: [
            { templateId: 'brand-intro', name: 'Cover', purpose: 'Brand guidelines title', isRequired: true },
            { templateId: 'gamma-content-bullets', name: 'Brand Story', purpose: 'Mission and vision', isRequired: true },
            { templateId: 'brand-values', name: 'Values', purpose: 'Core brand values', isRequired: true },
            { templateId: 'brand-color-palette', name: 'Colors', purpose: 'Primary and secondary colors', isRequired: true },
            { templateId: 'brand-typography', name: 'Typography', purpose: 'Font choices', isRequired: true },
            { templateId: 'brand-logo-usage', name: 'Logo Usage', purpose: 'Dos and don\'ts', isRequired: true },
            { templateId: 'gamma-compare-side', name: 'Logo Variations', purpose: 'Light/dark versions', isRequired: false },
            { templateId: 'brand-voice', name: 'Brand Voice', purpose: 'Tone guidelines', isRequired: true },
            { templateId: 'gamma-features-4col', name: 'Applications', purpose: 'Usage examples', isRequired: false },
            { templateId: 'gamma-content-bullets', name: 'Contact', purpose: 'Brand team contacts', isRequired: true }
        ]
    },
    {
        id: 'campaign-brief-pack',
        name: 'Campaign Brief',
        description: 'Marketing campaign planning and strategy',
        category: 'marketing',
        slideCount: 8,
        estimatedTime: '10-15 min',
        difficulty: 'beginner',
        tags: ['marketing', 'campaign', 'strategy', 'social'],
        color: '#f59e0b',
        emoji: '📣',
        slides: [
            { templateId: 'social-campaign-overview', name: 'Campaign Title', purpose: 'Campaign name and dates', isRequired: true },
            { templateId: 'gamma-content-bullets', name: 'Objectives', purpose: 'Campaign goals', isRequired: true },
            { templateId: 'social-audience-personas', name: 'Target Audience', purpose: 'Who we are reaching', isRequired: true },
            { templateId: 'gamma-content-split-right', name: 'Key Message', purpose: 'Core messaging', isRequired: true },
            { templateId: 'social-platform-strategy', name: 'Channels', purpose: 'Platform strategy', isRequired: true },
            { templateId: 'social-content-calendar', name: 'Timeline', purpose: 'Content calendar', isRequired: true },
            { templateId: 'social-kpis', name: 'KPIs', purpose: 'Success metrics', isRequired: true },
            { templateId: 'gamma-stats-grid', name: 'Budget', purpose: 'Budget allocation', isRequired: false }
        ]
    }
];

// ==========================================
// TRAINING PACKS
// ==========================================

export const TRAINING_PACKS: PresetPack[] = [
    {
        id: 'training-session-pack',
        name: 'Training Session',
        description: 'Complete training module structure',
        category: 'training',
        slideCount: 12,
        estimatedTime: '45-60 min',
        difficulty: 'intermediate',
        tags: ['training', 'learning', 'education', 'workshop'],
        color: '#8b5cf6',
        emoji: '📚',
        slides: [
            { templateId: 'training-welcome', name: 'Welcome', purpose: 'Session introduction', isRequired: true },
            { templateId: 'training-agenda', name: 'Agenda', purpose: 'What we will cover', isRequired: true },
            { templateId: 'training-objectives', name: 'Objectives', purpose: 'Learning goals', isRequired: true },
            { templateId: 'training-concept', name: 'Concept 1', purpose: 'First key concept', isRequired: true },
            { templateId: 'training-step-by-step', name: 'Process', purpose: 'Step by step guide', isRequired: true },
            { templateId: 'training-concept', name: 'Concept 2', purpose: 'Second key concept', isRequired: true },
            { templateId: 'training-dos-donts', name: 'Best Practices', purpose: 'Dos and don\'ts', isRequired: true },
            { templateId: 'training-exercise', name: 'Activity', purpose: 'Hands-on exercise', isRequired: true },
            { templateId: 'training-quiz', name: 'Knowledge Check', purpose: 'Quiz questions', isRequired: false },
            { templateId: 'training-key-takeaways', name: 'Key Takeaways', purpose: 'Summary points', isRequired: true },
            { templateId: 'training-resources', name: 'Resources', purpose: 'Additional materials', isRequired: false },
            { templateId: 'gamma-cta-gradient', name: 'Thank You', purpose: 'Closing and feedback', isRequired: true }
        ]
    },
    {
        id: 'onboarding-pack',
        name: 'Employee Onboarding',
        description: 'New hire orientation presentation',
        category: 'training',
        slideCount: 10,
        estimatedTime: '30-45 min',
        difficulty: 'beginner',
        tags: ['onboarding', 'HR', 'orientation', 'new-hire'],
        color: '#10b981',
        emoji: '👋',
        slides: [
            { templateId: 'gamma-title-gradient', name: 'Welcome', purpose: 'Welcome to the team', isRequired: true },
            { templateId: 'gamma-content-bullets', name: 'About Us', purpose: 'Company overview', isRequired: true },
            { templateId: 'gamma-features-4col', name: 'Values', purpose: 'Core values', isRequired: true },
            { templateId: 'gamma-timeline-vertical', name: 'Our Story', purpose: 'Company history', isRequired: false },
            { templateId: 'hr-team-intro', name: 'Leadership', purpose: 'Meet leadership', isRequired: true },
            { templateId: 'gamma-features-3col', name: 'Departments', purpose: 'Team structure', isRequired: true },
            { templateId: 'hr-benefits', name: 'Benefits', purpose: 'Perks and benefits', isRequired: true },
            { templateId: 'gamma-content-bullets', name: 'First Week', purpose: 'What to expect', isRequired: true },
            { templateId: 'training-resources', name: 'Resources', purpose: 'Key resources', isRequired: true },
            { templateId: 'gamma-cta-gradient', name: 'Let\'s Go!', purpose: 'Getting started', isRequired: true }
        ]
    }
];

// ==========================================
// INVESTOR UPDATE PACKS
// ==========================================

export const INVESTOR_PACKS: PresetPack[] = [
    {
        id: 'quarterly-update-pack',
        name: 'Quarterly Investor Update',
        description: 'Standard quarterly board/investor update',
        category: 'investor',
        slideCount: 10,
        estimatedTime: '20-30 min',
        difficulty: 'intermediate',
        tags: ['investor', 'quarterly', 'board', 'update'],
        color: '#64748b',
        emoji: '📈',
        slides: [
            { templateId: 'investor-quarterly-cover', name: 'Cover', purpose: 'Quarter and year', isRequired: true },
            { templateId: 'gamma-content-bullets', name: 'Executive Summary', purpose: 'Quarter highlights', isRequired: true },
            { templateId: 'investor-key-metrics', name: 'Key Metrics', purpose: 'KPI dashboard', isRequired: true },
            { templateId: 'investor-revenue-breakdown', name: 'Revenue', purpose: 'Revenue breakdown', isRequired: true },
            { templateId: 'gamma-stat-with-cards', name: 'Growth', purpose: 'Growth metrics', isRequired: true },
            { templateId: 'investor-product-updates', name: 'Product', purpose: 'Product updates', isRequired: true },
            { templateId: 'gamma-timeline-vertical', name: 'Milestones', purpose: 'Achieved milestones', isRequired: false },
            { templateId: 'investor-market-expansion', name: 'Market', purpose: 'Market updates', isRequired: false },
            { templateId: 'gamma-content-bullets', name: 'Challenges', purpose: 'Risks and challenges', isRequired: true },
            { templateId: 'investor-guidance', name: 'Outlook', purpose: 'Next quarter outlook', isRequired: true }
        ]
    },
    {
        id: 'annual-report-pack',
        name: 'Annual Report',
        description: 'Comprehensive year-end company report',
        category: 'investor',
        slideCount: 12,
        estimatedTime: '30-45 min',
        difficulty: 'advanced',
        tags: ['annual', 'report', 'year-end', 'comprehensive'],
        color: '#1e40af',
        emoji: '📊',
        slides: [
            { templateId: 'annual-cover', name: 'Cover', purpose: 'Annual report title', isRequired: true },
            { templateId: 'annual-ceo-letter', name: 'CEO Letter', purpose: 'Message from CEO', isRequired: true },
            { templateId: 'annual-year-highlights', name: 'Highlights', purpose: 'Year at a glance', isRequired: true },
            { templateId: 'annual-milestones', name: 'Timeline', purpose: 'Key moments', isRequired: true },
            { templateId: 'annual-financials', name: 'Financials', purpose: 'Financial summary', isRequired: true },
            { templateId: 'gamma-stat-with-cards', name: 'Growth', purpose: 'Growth metrics', isRequired: true },
            { templateId: 'investor-product-updates', name: 'Product', purpose: 'Product evolution', isRequired: true },
            { templateId: 'gamma-team-spotlight', name: 'Team', purpose: 'Team growth', isRequired: false },
            { templateId: 'gamma-testimonials-3', name: 'Customers', purpose: 'Customer stories', isRequired: false },
            { templateId: 'gamma-content-bullets', name: 'Sustainability', purpose: 'ESG initiatives', isRequired: false },
            { templateId: 'annual-next-year-outlook', name: 'Outlook', purpose: 'Next year plans', isRequired: true },
            { templateId: 'gamma-cta-gradient', name: 'Thank You', purpose: 'Closing', isRequired: true }
        ]
    }
];

// ==========================================
// WEBINAR PACKS
// ==========================================

export const WEBINAR_PACKS: PresetPack[] = [
    {
        id: 'webinar-standard-pack',
        name: 'Standard Webinar',
        description: '60-minute educational webinar structure',
        category: 'webinar',
        slideCount: 12,
        estimatedTime: '60 min',
        difficulty: 'intermediate',
        tags: ['webinar', 'presentation', 'virtual', 'online'],
        color: '#f97316',
        emoji: '🎥',
        slides: [
            { templateId: 'webinar-title', name: 'Title', purpose: 'Webinar intro', isRequired: true },
            { templateId: 'webinar-host-intro', name: 'Host', purpose: 'Speaker introduction', isRequired: true },
            { templateId: 'webinar-agenda', name: 'Agenda', purpose: 'What to expect', isRequired: true },
            { templateId: 'gamma-content-split-right', name: 'Topic 1', purpose: 'First main topic', isRequired: true },
            { templateId: 'gamma-features-3col', name: 'Key Points', purpose: 'Supporting content', isRequired: true },
            { templateId: 'webinar-poll', name: 'Poll', purpose: 'Engagement break', isRequired: false },
            { templateId: 'gamma-content-split-right', name: 'Topic 2', purpose: 'Second main topic', isRequired: true },
            { templateId: 'webinar-demo', name: 'Demo', purpose: 'Live demonstration', isRequired: false },
            { templateId: 'gamma-content-bullets', name: 'Topic 3', purpose: 'Third main topic', isRequired: true },
            { templateId: 'webinar-qa', name: 'Q&A', purpose: 'Questions break', isRequired: true },
            { templateId: 'webinar-resources', name: 'Resources', purpose: 'Downloads', isRequired: true },
            { templateId: 'webinar-closing', name: 'Thank You', purpose: 'Closing slide', isRequired: true }
        ]
    },
    {
        id: 'workshop-pack',
        name: 'Interactive Workshop',
        description: 'Hands-on workshop with exercises',
        category: 'webinar',
        slideCount: 15,
        estimatedTime: '90 min',
        difficulty: 'advanced',
        tags: ['workshop', 'hands-on', 'interactive', 'exercises'],
        color: '#a855f7',
        emoji: '🛠️',
        slides: [
            { templateId: 'webinar-title', name: 'Welcome', purpose: 'Workshop intro', isRequired: true },
            { templateId: 'webinar-host-intro', name: 'Facilitator', purpose: 'Instructor intro', isRequired: true },
            { templateId: 'webinar-agenda', name: 'Workshop Flow', purpose: 'Session outline', isRequired: true },
            { templateId: 'training-objectives', name: 'Objectives', purpose: 'Learning goals', isRequired: true },
            { templateId: 'training-concept', name: 'Concept 1', purpose: 'First concept', isRequired: true },
            { templateId: 'training-exercise', name: 'Exercise 1', purpose: 'First activity', isRequired: true },
            { templateId: 'webinar-break', name: 'Break', purpose: '10-min break', isRequired: true },
            { templateId: 'training-concept', name: 'Concept 2', purpose: 'Second concept', isRequired: true },
            { templateId: 'training-step-by-step', name: 'Process', purpose: 'Guided walkthrough', isRequired: true },
            { templateId: 'training-exercise', name: 'Exercise 2', purpose: 'Second activity', isRequired: true },
            { templateId: 'webinar-poll', name: 'Check-in', purpose: 'Progress check', isRequired: false },
            { templateId: 'training-concept', name: 'Concept 3', purpose: 'Third concept', isRequired: true },
            { templateId: 'training-exercise', name: 'Final Exercise', purpose: 'Combined exercise', isRequired: true },
            { templateId: 'training-key-takeaways', name: 'Takeaways', purpose: 'Summary', isRequired: true },
            { templateId: 'webinar-closing', name: 'Wrap Up', purpose: 'Closing and next steps', isRequired: true }
        ]
    }
];

// ==========================================
// PROJECT STATUS PACKS
// ==========================================

export const PROJECT_STATUS_PACKS: PresetPack[] = [
    {
        id: 'project-status-pack',
        name: 'Project Status Update',
        description: 'Weekly or bi-weekly project status report',
        category: 'project',
        slideCount: 6,
        estimatedTime: '10-15 min',
        difficulty: 'beginner',
        tags: ['project', 'status', 'update', 'weekly'],
        color: '#14b8a6',
        emoji: '📋',
        slides: [
            { templateId: 'gamma-title-minimal', name: 'Title', purpose: 'Project name and date', isRequired: true },
            { templateId: 'project-status-overview', name: 'Status', purpose: 'Overall status', isRequired: true },
            { templateId: 'project-milestones', name: 'Progress', purpose: 'Milestone updates', isRequired: true },
            { templateId: 'project-blockers', name: 'Blockers', purpose: 'Risks and issues', isRequired: true },
            { templateId: 'project-next-steps', name: 'Next Steps', purpose: 'Upcoming work', isRequired: true },
            { templateId: 'gamma-content-bullets', name: 'Actions', purpose: 'Action items', isRequired: true }
        ]
    }
];

// ==========================================
// ALL PACKS COMBINED
// ==========================================

export const ALL_PRESET_PACKS: PresetPack[] = [
    ...PITCH_DECK_PACKS,
    ...SALES_DECK_PACKS,
    ...MARKETING_PACKS,
    ...TRAINING_PACKS,
    ...INVESTOR_PACKS,
    ...WEBINAR_PACKS,
    ...PROJECT_STATUS_PACKS
];

// Get packs by category
export function getPresetPacksByCategory(category: string): PresetPack[] {
    if (category === 'all') return ALL_PRESET_PACKS;
    return ALL_PRESET_PACKS.filter(pack => pack.category === category);
}

// Get pack by ID
export function getPresetPackById(id: string): PresetPack | undefined {
    return ALL_PRESET_PACKS.find(pack => pack.id === id);
}

// Pack categories for filtering
export const PACK_CATEGORIES = [
    { id: 'all', label: 'All Packs', emoji: '✨' },
    { id: 'pitch', label: 'Pitch Decks', emoji: '🚀' },
    { id: 'sales', label: 'Sales', emoji: '💼' },
    { id: 'marketing', label: 'Marketing', emoji: '📣' },
    { id: 'training', label: 'Training', emoji: '📚' },
    { id: 'investor', label: 'Investor', emoji: '📈' },
    { id: 'webinar', label: 'Webinars', emoji: '🎥' },
    { id: 'project', label: 'Projects', emoji: '📋' }
];

// Total counts
export const TOTAL_PRESET_PACKS = ALL_PRESET_PACKS.length;
export const TOTAL_PACK_SLIDES = ALL_PRESET_PACKS.reduce((sum, pack) => sum + pack.slideCount, 0);
