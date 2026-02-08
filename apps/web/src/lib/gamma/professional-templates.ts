/**
 * 🎨 Extended Professional Templates
 * Based on analysis of Fractional CFO presentation
 * Templates for professional services, consulting, and business presentations
 */

import { CardTemplate } from './card-templates';

// ============================================
// PROFESSIONAL SERVICE TEMPLATES
// ============================================

export const PROFESSIONAL_TEMPLATES: CardTemplate[] = [
    // ==========================================
    // ABOUT/BIO TEMPLATES
    // ==========================================
    {
        id: 'about-bio-full',
        name: 'Full Bio Page',
        description: 'Comprehensive bio with multiple paragraphs and experience callout',
        version: 1,
        metadata: {
            category: 'content',
            positions: ['middle'],
            suitableFor: ['pitch', 'corporate', 'sales'],
            tones: ['professional'],
            contentHints: ['about', 'bio', 'meet', 'background', 'experience', 'founder'],
            requiresImage: false,
            keywords: ['about', 'bio', 'meet', 'background', 'experience', 'founder', 'story', 'journey']
        },
        slots: [
            { id: 'sectionLabel', type: 'label', required: false, maxLength: 20, placeholder: 'ABOUT' },
            { id: 'title', type: 'heading', required: true, maxLength: 60, placeholder: 'Meet Your Strategic Partner' },
            { id: 'paragraph1', type: 'body', required: true, maxLength: 500, placeholder: 'First paragraph of bio...' },
            { id: 'paragraph2', type: 'body', required: false, maxLength: 500, placeholder: 'Second paragraph...' },
            { id: 'paragraph3', type: 'body', required: false, maxLength: 500, placeholder: 'Third paragraph...' },
            { id: 'philosophyLabel', type: 'subheading', required: false, maxLength: 30, placeholder: 'Core Philosophy:' },
            { id: 'philosophy', type: 'quote', required: false, maxLength: 100, placeholder: 'Less manual work. More clarity.' },
            { id: 'calloutLabel', type: 'subheading', required: false, maxLength: 40, placeholder: 'Experience That Counts' },
            { id: 'calloutText', type: 'body', required: false, maxLength: 150, placeholder: '10+ years supporting...' }
        ],
        images: [],
        previewGradient: 'from-slate-700 to-slate-800',
        html: `
            <div class="slide about-bio">
                {{#sectionLabel}}<span class="section-label">{{sectionLabel}}</span>{{/sectionLabel}}
                <h2 class="title">{{title}}</h2>
                <div class="bio-content">
                    <p class="paragraph">{{paragraph1}}</p>
                    {{#paragraph2}}<p class="paragraph">{{paragraph2}}</p>{{/paragraph2}}
                    {{#paragraph3}}<p class="paragraph">{{paragraph3}}</p>{{/paragraph3}}
                </div>
                {{#philosophy}}<div class="philosophy-box">
                    {{#philosophyLabel}}<h4>{{philosophyLabel}}</h4>{{/philosophyLabel}}
                    <p class="philosophy-text">{{philosophy}}</p>
                </div>{{/philosophy}}
                {{#calloutText}}<div class="experience-callout">
                    {{#calloutLabel}}<h4>{{calloutLabel}}</h4>{{/calloutLabel}}
                    <p>{{calloutText}}</p>
                </div>{{/calloutText}}
            </div>
        `
    },
    {
        id: 'about-bio-with-photo',
        name: 'Bio with Photo',
        description: 'Bio section with profile photo on side',
        version: 1,
        metadata: {
            category: 'content',
            positions: ['middle'],
            suitableFor: ['pitch', 'corporate', 'sales'],
            tones: ['professional', 'storytelling'],
            contentHints: ['about', 'bio', 'founder', 'team member', 'profile'],
            requiresImage: true,
            keywords: ['about', 'bio', 'founder', 'ceo', 'profile', 'story']
        },
        slots: [
            { id: 'name', type: 'heading', required: true, maxLength: 50, placeholder: 'John Doe' },
            { id: 'role', type: 'subheading', required: true, maxLength: 60, placeholder: 'CEO & Founder' },
            { id: 'bio', type: 'body', required: true, maxLength: 400, placeholder: 'Bio text...' },
            { id: 'credentials', type: 'caption', required: false, maxLength: 100, placeholder: 'MBA, CPA, 10+ years experience' }
        ],
        images: [
            { id: 'photo', position: 'left', aspectRatio: '1:1', size: 'medium' }
        ],
        previewGradient: 'from-blue-600 to-indigo-700',
        html: `
            <div class="slide bio-photo">
                <div class="photo-section">
                    <img src="{{photo}}" alt="{{name}}" class="profile-photo" />
                </div>
                <div class="bio-section">
                    <h2 class="name">{{name}}</h2>
                    <span class="role">{{role}}</span>
                    <p class="bio">{{bio}}</p>
                    {{#credentials}}<span class="credentials">{{credentials}}</span>{{/credentials}}
                </div>
            </div>
        `
    },

    // ==========================================
    // SERVICE GRID TEMPLATES
    // ==========================================
    {
        id: 'services-multi-category',
        name: 'Multi-Category Services',
        description: '5 service categories with bullet points each',
        version: 1,
        metadata: {
            category: 'features',
            positions: ['middle'],
            suitableFor: ['pitch', 'sales', 'corporate'],
            tones: ['professional', 'persuasive'],
            contentHints: ['services', 'offerings', 'what we do', 'solutions', 'capabilities'],
            requiresImage: false,
            minItems: 3,
            maxItems: 6,
            keywords: ['services', 'offerings', 'solutions', 'capabilities', 'we offer', 'we provide']
        },
        slots: [
            { id: 'sectionLabel', type: 'label', required: false, maxLength: 20, placeholder: 'SERVICES' },
            { id: 'title', type: 'heading', required: true, maxLength: 80, placeholder: 'Comprehensive Services' },
            { id: 'subtitle', type: 'subheading', required: false, maxLength: 120, placeholder: 'A full-service approach...' },
            { id: 's1Title', type: 'subheading', required: true, maxLength: 40, placeholder: 'Service 1' },
            { id: 's1Points', type: 'bullet', required: true, placeholder: 'Point' },
            { id: 's2Title', type: 'subheading', required: true, maxLength: 40, placeholder: 'Service 2' },
            { id: 's2Points', type: 'bullet', required: true, placeholder: 'Point' },
            { id: 's3Title', type: 'subheading', required: false, maxLength: 40, placeholder: 'Service 3' },
            { id: 's3Points', type: 'bullet', required: false, placeholder: 'Point' },
            { id: 's4Title', type: 'subheading', required: false, maxLength: 40, placeholder: 'Service 4' },
            { id: 's4Points', type: 'bullet', required: false, placeholder: 'Point' },
            { id: 's5Title', type: 'subheading', required: false, maxLength: 40, placeholder: 'Service 5' },
            { id: 's5Points', type: 'bullet', required: false, placeholder: 'Point' }
        ],
        images: [],
        previewGradient: 'from-emerald-600 to-teal-700',
        html: `
            <div class="slide services-multi">
                {{#sectionLabel}}<span class="section-label">{{sectionLabel}}</span>{{/sectionLabel}}
                <h2 class="title">{{title}}</h2>
                {{#subtitle}}<p class="subtitle">{{subtitle}}</p>{{/subtitle}}
                <div class="services-grid">
                    <div class="service-category">
                        <h3>{{s1Title}}</h3>
                        <ul>{{#s1Points}}<li>{{.}}</li>{{/s1Points}}</ul>
                    </div>
                    <div class="service-category">
                        <h3>{{s2Title}}</h3>
                        <ul>{{#s2Points}}<li>{{.}}</li>{{/s2Points}}</ul>
                    </div>
                    {{#s3Title}}<div class="service-category">
                        <h3>{{s3Title}}</h3>
                        <ul>{{#s3Points}}<li>{{.}}</li>{{/s3Points}}</ul>
                    </div>{{/s3Title}}
                    {{#s4Title}}<div class="service-category">
                        <h3>{{s4Title}}</h3>
                        <ul>{{#s4Points}}<li>{{.}}</li>{{/s4Points}}</ul>
                    </div>{{/s4Title}}
                    {{#s5Title}}<div class="service-category">
                        <h3>{{s5Title}}</h3>
                        <ul>{{#s5Points}}<li>{{.}}</li>{{/s5Points}}</ul>
                    </div>{{/s5Title}}
                </div>
            </div>
        `
    },

    // ==========================================
    // CLIENT PERSONAS TEMPLATES
    // ==========================================
    {
        id: 'ideal-clients-3col',
        name: 'Ideal Client Personas',
        description: 'Three client profiles with descriptions',
        version: 1,
        metadata: {
            category: 'features',
            positions: ['middle'],
            suitableFor: ['pitch', 'sales', 'marketing'],
            tones: ['professional', 'persuasive'],
            contentHints: ['clients', 'customers', 'who', 'audience', 'personas', 'ideal', 'who benefits'],
            requiresImage: false,
            minItems: 2,
            maxItems: 4,
            keywords: ['clients', 'customers', 'who', 'audience', 'personas', 'for', 'ideal', 'target']
        },
        slots: [
            { id: 'sectionLabel', type: 'label', required: false, maxLength: 20, placeholder: 'IDEAL CLIENTS' },
            { id: 'title', type: 'heading', required: true, maxLength: 60, placeholder: 'Who Benefits Most' },
            { id: 'subtitle', type: 'subheading', required: false, maxLength: 150, placeholder: 'Our services are designed for...' },
            { id: 'c1Title', type: 'subheading', required: true, maxLength: 30, placeholder: 'Startups' },
            { id: 'c1Desc', type: 'body', required: true, maxLength: 300, placeholder: 'Description of ideal client 1...' },
            { id: 'c2Title', type: 'subheading', required: true, maxLength: 30, placeholder: 'Enterprises' },
            { id: 'c2Desc', type: 'body', required: true, maxLength: 300, placeholder: 'Description of ideal client 2...' },
            { id: 'c3Title', type: 'subheading', required: false, maxLength: 30, placeholder: 'Agencies' },
            { id: 'c3Desc', type: 'body', required: false, maxLength: 300, placeholder: 'Description of ideal client 3...' }
        ],
        images: [],
        previewGradient: 'from-violet-600 to-purple-700',
        html: `
            <div class="slide ideal-clients">
                {{#sectionLabel}}<span class="section-label">{{sectionLabel}}</span>{{/sectionLabel}}
                <h2 class="title">{{title}}</h2>
                {{#subtitle}}<p class="subtitle">{{subtitle}}</p>{{/subtitle}}
                <div class="personas-grid">
                    <div class="persona">
                        <h3>{{c1Title}}</h3>
                        <p>{{c1Desc}}</p>
                    </div>
                    <div class="persona">
                        <h3>{{c2Title}}</h3>
                        <p>{{c2Desc}}</p>
                    </div>
                    {{#c3Title}}<div class="persona">
                        <h3>{{c3Title}}</h3>
                        <p>{{c3Desc}}</p>
                    </div>{{/c3Title}}
                </div>
            </div>
        `
    },

    // ==========================================
    // PROCESS/PHASES TEMPLATES
    // ==========================================
    {
        id: 'process-numbered-phases',
        name: 'Numbered Process Phases',
        description: '5-step process with numbered cards',
        version: 1,
        metadata: {
            category: 'timeline',
            positions: ['middle'],
            suitableFor: ['pitch', 'sales', 'educational', 'corporate'],
            tones: ['professional', 'educational'],
            contentHints: ['process', 'how', 'steps', 'phases', 'approach', 'methodology', 'engagement', 'workflow'],
            requiresImage: false,
            minItems: 3,
            maxItems: 6,
            keywords: ['process', 'steps', 'phases', 'how', 'approach', 'methodology', 'workflow', 'engagement']
        },
        slots: [
            { id: 'sectionLabel', type: 'label', required: false, maxLength: 20, placeholder: 'ENGAGEMENT MODEL' },
            { id: 'title', type: 'heading', required: true, maxLength: 60, placeholder: 'How We Work Together' },
            { id: 'subtitle', type: 'subheading', required: false, maxLength: 150, placeholder: 'A proven framework...' },
            { id: 'p1Title', type: 'subheading', required: true, maxLength: 40, placeholder: 'Phase 1' },
            { id: 'p1Desc', type: 'body', required: true, maxLength: 200, placeholder: 'Description...' },
            { id: 'p2Title', type: 'subheading', required: true, maxLength: 40, placeholder: 'Phase 2' },
            { id: 'p2Desc', type: 'body', required: true, maxLength: 200, placeholder: 'Description...' },
            { id: 'p3Title', type: 'subheading', required: true, maxLength: 40, placeholder: 'Phase 3' },
            { id: 'p3Desc', type: 'body', required: true, maxLength: 200, placeholder: 'Description...' },
            { id: 'p4Title', type: 'subheading', required: false, maxLength: 40, placeholder: 'Phase 4' },
            { id: 'p4Desc', type: 'body', required: false, maxLength: 200, placeholder: 'Description...' },
            { id: 'p5Title', type: 'subheading', required: false, maxLength: 40, placeholder: 'Phase 5' },
            { id: 'p5Desc', type: 'body', required: false, maxLength: 200, placeholder: 'Description...' }
        ],
        images: [],
        previewGradient: 'from-blue-600 to-cyan-600',
        html: `
            <div class="slide process-phases">
                {{#sectionLabel}}<span class="section-label">{{sectionLabel}}</span>{{/sectionLabel}}
                <h2 class="title">{{title}}</h2>
                {{#subtitle}}<p class="subtitle">{{subtitle}}</p>{{/subtitle}}
                <div class="phases-grid">
                    <div class="phase"><span class="phase-number">01</span><h3>{{p1Title}}</h3><p>{{p1Desc}}</p></div>
                    <div class="phase"><span class="phase-number">02</span><h3>{{p2Title}}</h3><p>{{p2Desc}}</p></div>
                    <div class="phase"><span class="phase-number">03</span><h3>{{p3Title}}</h3><p>{{p3Desc}}</p></div>
                    {{#p4Title}}<div class="phase"><span class="phase-number">04</span><h3>{{p4Title}}</h3><p>{{p4Desc}}</p></div>{{/p4Title}}
                    {{#p5Title}}<div class="phase"><span class="phase-number">05</span><h3>{{p5Title}}</h3><p>{{p5Desc}}</p></div>{{/p5Title}}
                </div>
            </div>
        `
    },

    // ==========================================
    // METRICS/SUCCESS TEMPLATES
    // ==========================================
    {
        id: 'metrics-mixed-grid',
        name: 'Mixed Metrics Grid',
        description: 'Large stats with supporting text and smaller stats',
        version: 1,
        metadata: {
            category: 'stats',
            positions: ['middle'],
            suitableFor: ['pitch', 'sales', 'corporate', 'report'],
            tones: ['professional', 'persuasive'],
            contentHints: ['metrics', 'success', 'results', 'outcomes', 'impact', 'numbers', 'what we achieved'],
            requiresImage: false,
            minItems: 3,
            maxItems: 6,
            keywords: ['metrics', 'results', 'outcomes', 'impact', 'success', 'achievement', 'performance']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 60, placeholder: 'Success Metrics' },
            { id: 'subtitle', type: 'subheading', required: false, maxLength: 100, placeholder: 'What good looks like' },
            { id: 'stat1', type: 'stat', required: true, maxLength: 10, placeholder: '70%' },
            { id: 'label1', type: 'label', required: true, maxLength: 30, placeholder: 'Reduction' },
            { id: 'desc1', type: 'caption', required: false, maxLength: 80, placeholder: 'Additional context' },
            { id: 'stat2', type: 'stat', required: true, maxLength: 10, placeholder: '90%' },
            { id: 'label2', type: 'label', required: true, maxLength: 30, placeholder: 'Accuracy' },
            { id: 'desc2', type: 'caption', required: false, maxLength: 80, placeholder: 'Additional context' },
            { id: 'stat3', type: 'stat', required: true, maxLength: 10, placeholder: '100%' },
            { id: 'label3', type: 'label', required: true, maxLength: 30, placeholder: 'Confidence' },
            { id: 'desc3', type: 'caption', required: false, maxLength: 80, placeholder: 'Additional context' },
            { id: 'impactTitle', type: 'subheading', required: false, maxLength: 30, placeholder: 'Real Impact' },
            { id: 'impactText', type: 'body', required: false, maxLength: 150, placeholder: 'Impact description' },
            { id: 'smallStat1', type: 'stat', required: false, maxLength: 10, placeholder: '1000+' },
            { id: 'smallLabel1', type: 'label', required: false, maxLength: 30, placeholder: 'Clients' },
            { id: 'smallStat2', type: 'stat', required: false, maxLength: 10, placeholder: '10+' },
            { id: 'smallLabel2', type: 'label', required: false, maxLength: 30, placeholder: 'Years' },
            { id: 'smallStat3', type: 'stat', required: false, maxLength: 10, placeholder: '5' },
            { id: 'smallLabel3', type: 'label', required: false, maxLength: 30, placeholder: 'Services' }
        ],
        images: [],
        previewGradient: 'from-amber-500 to-orange-600',
        html: `
            <div class="slide metrics-mixed">
                <h2 class="title">{{title}}</h2>
                {{#subtitle}}<p class="subtitle">{{subtitle}}</p>{{/subtitle}}
                <div class="main-stats">
                    <div class="big-stat"><span class="value">{{stat1}}</span><span class="label">{{label1}}</span>{{#desc1}}<span class="desc">{{desc1}}</span>{{/desc1}}</div>
                    <div class="big-stat"><span class="value">{{stat2}}</span><span class="label">{{label2}}</span>{{#desc2}}<span class="desc">{{desc2}}</span>{{/desc2}}</div>
                    <div class="big-stat"><span class="value">{{stat3}}</span><span class="label">{{label3}}</span>{{#desc3}}<span class="desc">{{desc3}}</span>{{/desc3}}</div>
                </div>
                {{#impactText}}<div class="impact-section">
                    {{#impactTitle}}<h4>{{impactTitle}}</h4>{{/impactTitle}}
                    <p>{{impactText}}</p>
                </div>{{/impactText}}
                {{#smallStat1}}<div class="small-stats">
                    <div class="small-stat"><span class="value">{{smallStat1}}</span><span class="label">{{smallLabel1}}</span></div>
                    {{#smallStat2}}<div class="small-stat"><span class="value">{{smallStat2}}</span><span class="label">{{smallLabel2}}</span></div>{{/smallStat2}}
                    {{#smallStat3}}<div class="small-stat"><span class="value">{{smallStat3}}</span><span class="label">{{smallLabel3}}</span></div>{{/smallStat3}}
                </div>{{/smallStat1}}
            </div>
        `
    },

    // ==========================================
    // CREDENTIALS TEMPLATES
    // ==========================================
    {
        id: 'credentials-cards',
        name: 'Credentials Cards',
        description: 'Professional certifications with icons and descriptions',
        version: 1,
        metadata: {
            category: 'features',
            positions: ['middle'],
            suitableFor: ['pitch', 'corporate', 'sales'],
            tones: ['professional'],
            contentHints: ['credentials', 'certifications', 'qualifications', 'expertise', 'background', 'professional'],
            requiresImage: false,
            minItems: 2,
            maxItems: 4,
            keywords: ['credentials', 'certifications', 'qualifications', 'certified', 'licensed', 'qualified']
        },
        slots: [
            { id: 'sectionLabel', type: 'label', required: false, maxLength: 20, placeholder: 'CREDENTIALS' },
            { id: 'title', type: 'heading', required: true, maxLength: 60, placeholder: 'Professional Credentials' },
            { id: 'subtitle', type: 'subheading', required: false, maxLength: 150, placeholder: 'Strong foundation of qualifications...' },
            { id: 'c1Title', type: 'subheading', required: true, maxLength: 50, placeholder: 'Chartered Accountant' },
            { id: 'c1Desc', type: 'body', required: true, maxLength: 200, placeholder: 'Description...' },
            { id: 'c2Title', type: 'subheading', required: true, maxLength: 50, placeholder: 'Registered Valuer' },
            { id: 'c2Desc', type: 'body', required: true, maxLength: 200, placeholder: 'Description...' },
            { id: 'c3Title', type: 'subheading', required: false, maxLength: 50, placeholder: 'CPA Candidate' },
            { id: 'c3Desc', type: 'body', required: false, maxLength: 200, placeholder: 'Description...' },
            { id: 'c4Title', type: 'subheading', required: false, maxLength: 50, placeholder: 'Harvard Program' },
            { id: 'c4Desc', type: 'body', required: false, maxLength: 200, placeholder: 'Description...' }
        ],
        images: [],
        previewGradient: 'from-indigo-600 to-violet-700',
        html: `
            <div class="slide credentials-cards">
                {{#sectionLabel}}<span class="section-label">{{sectionLabel}}</span>{{/sectionLabel}}
                <h2 class="title">{{title}}</h2>
                {{#subtitle}}<p class="subtitle">{{subtitle}}</p>{{/subtitle}}
                <div class="credentials-grid">
                    <div class="credential-card"><div class="icon">🎓</div><h3>{{c1Title}}</h3><p>{{c1Desc}}</p></div>
                    <div class="credential-card"><div class="icon">📋</div><h3>{{c2Title}}</h3><p>{{c2Desc}}</p></div>
                    {{#c3Title}}<div class="credential-card"><div class="icon">📊</div><h3>{{c3Title}}</h3><p>{{c3Desc}}</p></div>{{/c3Title}}
                    {{#c4Title}}<div class="credential-card"><div class="icon">🏛️</div><h3>{{c4Title}}</h3><p>{{c4Desc}}</p></div>{{/c4Title}}
                </div>
            </div>
        `
    },

    // ==========================================
    // TECHNOLOGY/TOOLS TEMPLATES
    // ==========================================
    {
        id: 'tech-tools-categorized',
        name: 'Categorized Tools',
        description: 'Technology tools organized by category',
        version: 1,
        metadata: {
            category: 'features',
            positions: ['middle'],
            suitableFor: ['pitch', 'corporate', 'educational'],
            tones: ['professional', 'educational'],
            contentHints: ['technology', 'tools', 'systems', 'software', 'platforms', 'tech stack', 'expertise'],
            requiresImage: false,
            minItems: 2,
            maxItems: 5,
            keywords: ['technology', 'tools', 'systems', 'software', 'platforms', 'stack', 'expertise']
        },
        slots: [
            { id: 'sectionLabel', type: 'label', required: false, maxLength: 20, placeholder: 'TECHNOLOGY' },
            { id: 'title', type: 'heading', required: true, maxLength: 60, placeholder: 'Tools & Systems Expertise' },
            { id: 'subtitle', type: 'subheading', required: false, maxLength: 150, placeholder: 'Technical proficiency across...' },
            { id: 'cat1Title', type: 'subheading', required: true, maxLength: 40, placeholder: 'Category 1' },
            { id: 'cat1Tools', type: 'bullet', required: true, placeholder: 'Tool: Description' },
            { id: 'cat2Title', type: 'subheading', required: true, maxLength: 40, placeholder: 'Category 2' },
            { id: 'cat2Tools', type: 'bullet', required: true, placeholder: 'Tool: Description' },
            { id: 'cat3Title', type: 'subheading', required: false, maxLength: 40, placeholder: 'Category 3' },
            { id: 'cat3Tools', type: 'bullet', required: false, placeholder: 'Tool: Description' },
            { id: 'cat4Title', type: 'subheading', required: false, maxLength: 40, placeholder: 'Category 4' },
            { id: 'cat4Tools', type: 'bullet', required: false, placeholder: 'Tool: Description' },
            { id: 'calloutTitle', type: 'subheading', required: false, maxLength: 40, placeholder: 'The Advantage' },
            { id: 'calloutText', type: 'body', required: false, maxLength: 200, placeholder: 'Why this matters...' }
        ],
        images: [],
        previewGradient: 'from-cyan-600 to-blue-700',
        html: `
            <div class="slide tech-tools">
                {{#sectionLabel}}<span class="section-label">{{sectionLabel}}</span>{{/sectionLabel}}
                <h2 class="title">{{title}}</h2>
                {{#subtitle}}<p class="subtitle">{{subtitle}}</p>{{/subtitle}}
                <div class="tools-grid">
                    <div class="tool-category"><h3>{{cat1Title}}</h3><ul>{{#cat1Tools}}<li>{{.}}</li>{{/cat1Tools}}</ul></div>
                    <div class="tool-category"><h3>{{cat2Title}}</h3><ul>{{#cat2Tools}}<li>{{.}}</li>{{/cat2Tools}}</ul></div>
                    {{#cat3Title}}<div class="tool-category"><h3>{{cat3Title}}</h3><ul>{{#cat3Tools}}<li>{{.}}</li>{{/cat3Tools}}</ul></div>{{/cat3Title}}
                    {{#cat4Title}}<div class="tool-category"><h3>{{cat4Title}}</h3><ul>{{#cat4Tools}}<li>{{.}}</li>{{/cat4Tools}}</ul></div>{{/cat4Title}}
                </div>
                {{#calloutText}}<div class="advantage-callout">
                    {{#calloutTitle}}<h4>{{calloutTitle}}</h4>{{/calloutTitle}}
                    <p>{{calloutText}}</p>
                </div>{{/calloutText}}
            </div>
        `
    },

    // ==========================================
    // COMPARISON/VALUE PROP TEMPLATES
    // ==========================================
    {
        id: 'value-prop-grid-quote',
        name: 'Value Props with Quote',
        description: 'Benefits grid with a supporting quote',
        version: 1,
        metadata: {
            category: 'comparison',
            positions: ['middle'],
            suitableFor: ['pitch', 'sales', 'marketing'],
            tones: ['persuasive', 'professional'],
            contentHints: ['why', 'benefits', 'advantages', 'value', 'choose', 'vs'],
            requiresImage: false,
            minItems: 3,
            maxItems: 4,
            keywords: ['why', 'choose', 'benefits', 'advantages', 'value', 'better', 'vs', 'versus']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 60, placeholder: 'Why Choose Us?' },
            { id: 'v1Title', type: 'subheading', required: true, maxLength: 30, placeholder: 'Cost Efficiency' },
            { id: 'v1Desc', type: 'body', required: true, maxLength: 150, placeholder: 'Description...' },
            { id: 'v2Title', type: 'subheading', required: true, maxLength: 30, placeholder: 'Flexibility' },
            { id: 'v2Desc', type: 'body', required: true, maxLength: 150, placeholder: 'Description...' },
            { id: 'v3Title', type: 'subheading', required: true, maxLength: 30, placeholder: 'Expertise' },
            { id: 'v3Desc', type: 'body', required: true, maxLength: 150, placeholder: 'Description...' },
            { id: 'v4Title', type: 'subheading', required: false, maxLength: 30, placeholder: 'Speed' },
            { id: 'v4Desc', type: 'body', required: false, maxLength: 150, placeholder: 'Description...' },
            { id: 'quote', type: 'quote', required: false, maxLength: 200, placeholder: 'Supporting quote...' }
        ],
        images: [],
        previewGradient: 'from-rose-600 to-pink-700',
        html: `
            <div class="slide value-props">
                <h2 class="title">{{title}}</h2>
                <div class="props-grid">
                    <div class="prop"><h3>{{v1Title}}</h3><p>{{v1Desc}}</p></div>
                    <div class="prop"><h3>{{v2Title}}</h3><p>{{v2Desc}}</p></div>
                    <div class="prop"><h3>{{v3Title}}</h3><p>{{v3Desc}}</p></div>
                    {{#v4Title}}<div class="prop"><h3>{{v4Title}}</h3><p>{{v4Desc}}</p></div>{{/v4Title}}
                </div>
                {{#quote}}<blockquote class="supporting-quote">"{{quote}}"</blockquote>{{/quote}}
            </div>
        `
    },

    // ==========================================
    // CTA/CONTACT TEMPLATES
    // ==========================================
    {
        id: 'cta-next-steps-contact',
        name: 'CTA with Next Steps',
        description: 'Closing slide with next steps and contact info',
        version: 1,
        metadata: {
            category: 'cta',
            positions: ['last'],
            suitableFor: ['pitch', 'sales', 'corporate'],
            tones: ['professional', 'persuasive'],
            contentHints: ['contact', 'next', 'steps', 'ready', 'start', 'get in touch', 'schedule', 'consultation'],
            requiresImage: false,
            keywords: ['contact', 'next', 'steps', 'ready', 'start', 'schedule', 'consultation', 'discuss']
        },
        slots: [
            { id: 'title', type: 'heading', required: true, maxLength: 60, placeholder: 'Ready to Transform?' },
            { id: 'intro1', type: 'body', required: false, maxLength: 200, placeholder: 'Opening paragraph...' },
            { id: 'intro2', type: 'body', required: false, maxLength: 200, placeholder: 'Supporting message...' },
            { id: 'ctaText', type: 'subheading', required: false, maxLength: 100, placeholder: 'Let\'s discuss how we can help.' },
            { id: 'stepsLabel', type: 'subheading', required: false, maxLength: 20, placeholder: 'Next Steps' },
            { id: 'steps', type: 'bullet', required: false, placeholder: 'Step description' },
            { id: 'contactLabel', type: 'subheading', required: false, maxLength: 30, placeholder: 'Contact Information' },
            { id: 'name', type: 'heading', required: false, maxLength: 50, placeholder: 'Your Name' },
            { id: 'credentials', type: 'caption', required: false, maxLength: 100, placeholder: 'Title & Credentials' },
            { id: 'email', type: 'label', required: false, maxLength: 50, placeholder: 'email@domain.com' },
            { id: 'phone', type: 'label', required: false, maxLength: 20, placeholder: '+1 234 567 890' }
        ],
        images: [],
        previewGradient: 'from-violet-600 to-purple-700',
        html: `
            <div class="slide cta-steps-contact">
                <h1 class="title">{{title}}</h1>
                {{#intro1}}<p class="intro">{{intro1}}</p>{{/intro1}}
                {{#intro2}}<p class="intro">{{intro2}}</p>{{/intro2}}
                {{#ctaText}}<p class="cta-text">{{ctaText}}</p>{{/ctaText}}
                <div class="cta-content">
                    {{#steps}}<div class="next-steps">
                        {{#stepsLabel}}<h3>{{stepsLabel}}</h3>{{/stepsLabel}}
                        <ul>{{#steps}}<li>{{.}}</li>{{/steps}}</ul>
                    </div>{{/steps}}
                    {{#name}}<div class="contact-info">
                        {{#contactLabel}}<h3>{{contactLabel}}</h3>{{/contactLabel}}
                        <span class="name">{{name}}</span>
                        {{#credentials}}<span class="credentials">{{credentials}}</span>{{/credentials}}
                        {{#email}}<span class="email">{{email}}</span>{{/email}}
                        {{#phone}}<span class="phone">{{phone}}</span>{{/phone}}
                    </div>{{/name}}
                </div>
            </div>
        `
    },

    // ==========================================
    // SECTION HEADER TEMPLATES
    // ==========================================
    {
        id: 'section-header-labeled',
        name: 'Section Header with Label',
        description: 'Section divider with label above title',
        version: 1,
        metadata: {
            category: 'title',
            positions: ['middle'],
            suitableFor: ['pitch', 'corporate', 'report', 'educational'],
            tones: ['professional', 'educational'],
            contentHints: ['section', 'chapter', 'part', 'introduction to'],
            requiresImage: false,
            keywords: ['section', 'chapter', 'part', 'overview', 'introduction']
        },
        slots: [
            { id: 'label', type: 'label', required: true, maxLength: 30, placeholder: 'SECTION NAME' },
            { id: 'title', type: 'heading', required: true, maxLength: 80, placeholder: 'Section Title' },
            { id: 'subtitle', type: 'subheading', required: false, maxLength: 150, placeholder: 'Brief description of section' }
        ],
        images: [],
        previewGradient: 'from-slate-700 to-slate-800',
        html: `
            <div class="slide section-header">
                <span class="section-label">{{label}}</span>
                <h1 class="title">{{title}}</h1>
                {{#subtitle}}<p class="subtitle">{{subtitle}}</p>{{/subtitle}}
            </div>
        `
    }
];

// Export count
export const PROFESSIONAL_TEMPLATE_COUNT = PROFESSIONAL_TEMPLATES.length;
