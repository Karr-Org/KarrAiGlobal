/**
 * 🎨 Premium Gamma-Style Templates
 * Pixel-perfect recreation of Gamma.app's stunning designs
 * 
 * Design System:
 * - Typography: Playfair Display (serif) for headings, Inter (sans) for body
 * - Primary: Deep violet (#5B4FD8)
 * - Accent: Soft lavender (#EAE8F3)
 * - Text: Charcoal (#2D2D3A), Muted (#6B6B7B)
 * - Generous whitespace and padding
 */

// ============================================
// PREMIUM TEMPLATE CSS BASE
// ============================================

export const PREMIUM_CSS_BASE = `
/* Google Fonts Import */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Inter:wght@300;400;500;600;700&display=swap');

/* Base Styles */
.premium-card {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #FFFFFF;
    color: #2D2D3A;
    min-height: 100%;
    position: relative;
    overflow: hidden;
}

/* Typography - Elegant Serif Headings */
.premium-card h1,
.premium-card h2,
.premium-card .premium-heading {
    font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
    font-weight: 500;
    line-height: 1.2;
    color: #2D2D3A;
    margin: 0 0 1rem 0;
}

.premium-card h1 { font-size: 3rem; }
.premium-card h2 { font-size: 2.5rem; }
.premium-card h3 { 
    font-family: 'Inter', sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: #2D2D3A;
    margin: 0 0 0.75rem 0;
}

/* Italic elegant style for titles */
.premium-card .elegant-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: 2.75rem;
    color: #5B4FD8;
    line-height: 1.3;
}

/* Body text */
.premium-card p,
.premium-card .body-text {
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    line-height: 1.7;
    color: #4A4A5A;
    margin: 0 0 1rem 0;
}

.premium-card .muted-text {
    color: #6B6B7B;
    font-size: 0.95rem;
}

/* Section Label Badge */
.premium-card .section-label {
    display: inline-block;
    padding: 0.4rem 1rem;
    background: #5B4FD8;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-radius: 4px;
    margin-bottom: 1.25rem;
}

/* Subtitle text */
.premium-card .subtitle {
    font-size: 1.1rem;
    color: #6B6B7B;
    line-height: 1.6;
    margin-bottom: 2rem;
}

/* Card Grids */
.premium-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
}

.premium-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
}

.premium-grid-5 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
}

.premium-grid-5 > *:nth-child(4),
.premium-grid-5 > *:nth-child(5) {
    grid-column: span 1;
}

/* Service/Feature Cards */
.premium-card .feature-card {
    background: #F8F7FC;
    border-radius: 12px;
    padding: 1.75rem;
    position: relative;
}

.premium-card .feature-card .icon-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #5B4FD8;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    margin-bottom: 1rem;
}

.premium-card .feature-card h3 {
    font-size: 1.15rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
}

.premium-card .feature-card ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.premium-card .feature-card li {
    position: relative;
    padding-left: 1.25rem;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    line-height: 1.5;
    color: #4A4A5A;
}

.premium-card .feature-card li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: #5B4FD8;
    font-weight: bold;
}

/* Phase/Process Cards */
.premium-card .phase-card {
    padding: 1.5rem 0;
    border-top: 3px solid #5B4FD8;
}

.premium-card .phase-number {
    font-family: 'Inter', sans-serif;
    font-size: 1.5rem;
    font-weight: 300;
    color: #BEBEC8;
    margin-bottom: 0.75rem;
}

.premium-card .phase-card h3 {
    font-size: 1.15rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: #2D2D3A;
}

.premium-card .phase-card p {
    font-size: 0.9rem;
    line-height: 1.6;
    color: #5A5A6A;
}

/* Callout Box */
.premium-card .callout-box {
    background: #F8F7FC;
    border-left: 4px solid #5B4FD8;
    padding: 1.25rem 1.5rem;
    border-radius: 0 8px 8px 0;
    margin-top: 1.5rem;
}

.premium-card .callout-box h4 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.premium-card .callout-box p {
    font-size: 0.95rem;
    color: #5A5A6A;
    margin: 0;
}

/* Philosophy/Quote styling */
.premium-card .philosophy {
    margin-top: 1.5rem;
}

.premium-card .philosophy-label {
    font-weight: 600;
    color: #2D2D3A;
    display: inline;
}

.premium-card .philosophy-text {
    display: inline;
    color: #5B4FD8;
    text-decoration: underline;
    text-decoration-color: #5B4FD8;
    text-underline-offset: 3px;
}

/* Split Layouts */
.premium-split {
    display: flex;
    gap: 3rem;
    align-items: flex-start;
}

.premium-split-content {
    flex: 1;
}

.premium-split-image {
    flex: 0 0 45%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.premium-split-image img {
    max-width: 100%;
    height: auto;
    border-radius: 12px;
}

/* Persona Cards */
.premium-card .persona-card {
    text-align: left;
}

.premium-card .persona-card .persona-image {
    width: 100%;
    height: 180px;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 1.25rem;
    background: #F0EEFF;
}

.premium-card .persona-card .persona-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.premium-card .persona-card h3 {
    font-family: 'Playfair Display', serif;
    font-size: 1.35rem;
    font-weight: 500;
    margin-bottom: 0.75rem;
}

.premium-card .persona-card p {
    font-size: 0.9rem;
    line-height: 1.6;
    color: #5A5A6A;
}

/* Hero Dashboard */
.premium-hero-dashboard {
    display: flex;
    gap: 2rem;
    padding: 2rem;
}

.premium-hero-dashboard .dashboard-section {
    flex: 0 0 50%;
    background: #FAFAFA;
    border-radius: 16px;
    padding: 1.5rem;
}

.premium-hero-dashboard .content-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-left: 2rem;
}

.premium-hero-dashboard .elegant-title {
    font-size: 3rem;
    margin-bottom: 1.5rem;
}

/* Dashboard Charts */
.dashboard-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    grid-template-rows: auto auto;
    gap: 1rem;
}

.chart-card {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.stat-row {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
}

.stat-card {
    flex: 1;
    background: white;
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    text-align: center;
}

.stat-card .stat-label {
    font-size: 0.75rem;
    color: #6B6B7B;
    margin-bottom: 0.25rem;
}

.stat-card .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #5B4FD8;
}

.stat-card .stat-change {
    font-size: 0.75rem;
    font-weight: 500;
}

.stat-card .stat-change.positive { color: #10B981; }
.stat-card .stat-change.negative { color: #EF4444; }

/* Profile Card */
.profile-section {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    margin-top: 2rem;
}

.profile-photo {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    background: #E5E5EA;
}

.profile-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.profile-info p {
    margin: 0.25rem 0;
    font-size: 0.9rem;
    color: #5A5A6A;
}

.profile-info .credentials {
    font-size: 0.85rem;
    color: #7A7A8A;
}

/* Padding container */
.premium-card .container {
    padding: 3rem 4rem;
}

/* Responsive */
@media (max-width: 768px) {
    .premium-grid-3 { grid-template-columns: 1fr; }
    .premium-grid-2 { grid-template-columns: 1fr; }
    .premium-split { flex-direction: column; }
    .premium-hero-dashboard { flex-direction: column; }
}
`;

// ============================================
// PREMIUM TEMPLATE DEFINITIONS
// ============================================

export interface PremiumTemplate {
    id: string;
    name: string;
    description: string;
    type: 'hero' | 'about' | 'services' | 'clients' | 'process' | 'stats' | 'cta';
    html: string;
    css?: string;
}

export const PREMIUM_TEMPLATES: PremiumTemplate[] = [
    // ==========================================
    // 1. HERO DASHBOARD (Slide 1 style)
    // ==========================================
    {
        id: 'premium-hero-dashboard',
        name: 'Hero with Dashboard',
        description: 'Stunning hero with charts and profile',
        type: 'hero',
        html: `
<div class="premium-card">
    <div class="premium-hero-dashboard">
        <div class="dashboard-section">
            <div class="dashboard-grid">
                <div class="chart-card" style="grid-row: span 2;">
                    <div style="font-size: 0.75rem; color: #6B6B7B; margin-bottom: 0.5rem;">
                        <span style="font-weight: 600;">Leurgle</span> 
                        <span style="color: #5B4FD8;">● TBTpnds</span>
                        <span style="color: #93C5FD;">● RAIL Ang</span>
                    </div>
                    <div style="height: 140px; background: linear-gradient(to right, #E0E7FF, #C7D2FE); border-radius: 8px; display: flex; align-items: flex-end; padding: 0.5rem;">
                        <svg viewBox="0 0 200 60" style="width: 100%;">
                            <path d="M0,50 Q50,45 100,30 T200,10" fill="none" stroke="#5B4FD8" stroke-width="2"/>
                            <path d="M0,55 Q50,50 100,40 T200,25" fill="none" stroke="#93C5FD" stroke-width="2"/>
                        </svg>
                    </div>
                </div>
                <div class="chart-card">
                    <div style="font-size: 0.75rem; color: #6B6B7B;">◇ 8.30%</div>
                </div>
                <div class="chart-card">
                    <div style="font-size: 0.75rem; color: #6B6B7B;">◇ 1.5%</div>
                </div>
            </div>
            <div class="stat-row">
                <div class="stat-card">
                    <div class="stat-label">{{stat1Label}}</div>
                    <div class="stat-value">{{stat1Value}}</div>
                    <div class="stat-change {{stat1Trend}}">{{stat1Change}}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">{{stat2Label}}</div>
                    <div class="stat-value">{{stat2Value}}</div>
                    <div class="stat-change {{stat2Trend}}">{{stat2Change}}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">{{stat3Label}}</div>
                    <div class="stat-value">{{stat3Value}}</div>
                    <div class="stat-change {{stat3Trend}}">{{stat3Change}}</div>
                </div>
            </div>
        </div>
        <div class="content-section">
            <h1 class="elegant-title">{{title}}</h1>
            <div class="profile-section">
                <div class="profile-photo">
                    <img src="{{profilePhoto}}" alt="{{name}}" />
                </div>
                <div class="profile-info">
                    <p style="font-weight: 500; color: #2D2D3A;">{{tagline}}</p>
                    <p>{{name}}</p>
                    <p class="credentials">{{credentials}}</p>
                </div>
            </div>
        </div>
    </div>
</div>
        `
    },

    // ==========================================
    // 2. ABOUT/BIO (Slide 2 style)
    // ==========================================
    {
        id: 'premium-about-bio',
        name: 'About Bio with Illustration',
        description: 'Elegant bio page with section label and callout',
        type: 'about',
        html: `
<div class="premium-card">
    <div class="container">
        <div class="premium-split">
            <div class="premium-split-content">
                <span class="section-label">{{sectionLabel}}</span>
                <h1 class="elegant-title">{{title}}</h1>
                
                <p class="body-text">{{paragraph1}}</p>
                {{#paragraph2}}<p class="body-text">{{paragraph2}}</p>{{/paragraph2}}
                {{#paragraph3}}<p class="body-text">{{paragraph3}}</p>{{/paragraph3}}
                
                {{#philosophy}}
                <div class="philosophy">
                    <span class="philosophy-label">Core Philosophy:</span>
                    <span class="philosophy-text">{{philosophy}}</span>
                </div>
                {{/philosophy}}
            </div>
            <div class="premium-split-image">
                <img src="{{illustration}}" alt="Illustration" />
            </div>
        </div>
        
        {{#calloutTitle}}
        <div class="callout-box" style="max-width: 400px; margin-left: auto; margin-top: 2rem;">
            <h4>📋 {{calloutTitle}}</h4>
            <p>{{calloutText}}</p>
        </div>
        {{/calloutTitle}}
    </div>
</div>
        `
    },

    // ==========================================
    // 3. SERVICES GRID (Slide 3 style)
    // ==========================================
    {
        id: 'premium-services-grid',
        name: 'Services Grid 5-Card',
        description: '3+2 grid of service cards with icons',
        type: 'services',
        html: `
<div class="premium-card">
    <div class="container">
        <span class="section-label">{{sectionLabel}}</span>
        <h1 class="elegant-title">{{title}}</h1>
        <p class="subtitle">{{subtitle}}</p>
        
        <div class="premium-grid-3" style="margin-bottom: 1.5rem;">
            <div class="feature-card">
                <div class="icon-circle">📊</div>
                <h3>{{s1Title}}</h3>
                <ul>
                    {{#s1Points}}<li>{{.}}</li>{{/s1Points}}
                </ul>
            </div>
            <div class="feature-card">
                <div class="icon-circle">📈</div>
                <h3>{{s2Title}}</h3>
                <ul>
                    {{#s2Points}}<li>{{.}}</li>{{/s2Points}}
                </ul>
            </div>
            <div class="feature-card">
                <div class="icon-circle">🚀</div>
                <h3>{{s3Title}}</h3>
                <ul>
                    {{#s3Points}}<li>{{.}}</li>{{/s3Points}}
                </ul>
            </div>
        </div>
        
        <div class="premium-grid-2">
            {{#s4Title}}
            <div class="feature-card">
                <div class="icon-circle">⚙️</div>
                <h3>{{s4Title}}</h3>
                <ul>
                    {{#s4Points}}<li>{{.}}</li>{{/s4Points}}
                </ul>
            </div>
            {{/s4Title}}
            {{#s5Title}}
            <div class="feature-card">
                <div class="icon-circle">💼</div>
                <h3>{{s5Title}}</h3>
                <ul>
                    {{#s5Points}}<li>{{.}}</li>{{/s5Points}}
                </ul>
            </div>
            {{/s5Title}}
        </div>
    </div>
</div>
        `
    },

    // ==========================================
    // 4. IDEAL CLIENTS / PERSONAS (Slide 4 style)
    // ==========================================
    {
        id: 'premium-personas',
        name: 'Three Persona Cards',
        description: 'Client personas with illustrations',
        type: 'clients',
        html: `
<div class="premium-card">
    <div class="container">
        <span class="section-label">{{sectionLabel}}</span>
        <h1 class="elegant-title">{{title}}</h1>
        <p class="subtitle">{{subtitle}}</p>
        
        <div class="premium-grid-3">
            <div class="persona-card">
                <div class="persona-image">
                    <img src="{{p1Image}}" alt="{{p1Title}}" />
                </div>
                <h3>{{p1Title}}</h3>
                <p>{{p1Description}}</p>
            </div>
            <div class="persona-card">
                <div class="persona-image">
                    <img src="{{p2Image}}" alt="{{p2Title}}" />
                </div>
                <h3>{{p2Title}}</h3>
                <p>{{p2Description}}</p>
            </div>
            <div class="persona-card">
                <div class="persona-image">
                    <img src="{{p3Image}}" alt="{{p3Title}}" />
                </div>
                <h3>{{p3Title}}</h3>
                <p>{{p3Description}}</p>
            </div>
        </div>
    </div>
</div>
        `
    },

    // ==========================================
    // 5. PHASED PROCESS (Slide 5 style)
    // ==========================================
    {
        id: 'premium-process-5phase',
        name: 'Five Phase Process',
        description: '5-phase engagement model with numbered cards',
        type: 'process',
        html: `
<div class="premium-card">
    <div class="container">
        <span class="section-label">{{sectionLabel}}</span>
        <h1 class="elegant-title">{{title}}</h1>
        <p class="subtitle">{{subtitle}}</p>
        
        <div class="premium-grid-3" style="margin-bottom: 1.5rem;">
            <div class="phase-card">
                <div class="phase-number">01</div>
                <h3>{{p1Title}}</h3>
                <p>{{p1Description}}</p>
            </div>
            <div class="phase-card">
                <div class="phase-number">02</div>
                <h3>{{p2Title}}</h3>
                <p>{{p2Description}}</p>
            </div>
            <div class="phase-card">
                <div class="phase-number">03</div>
                <h3>{{p3Title}}</h3>
                <p>{{p3Description}}</p>
            </div>
        </div>
        
        <div class="premium-grid-2">
            <div class="phase-card">
                <div class="phase-number">04</div>
                <h3>{{p4Title}}</h3>
                <p>{{p4Description}}</p>
            </div>
            <div class="phase-card">
                <div class="phase-number">05</div>
                <h3>{{p5Title}}</h3>
                <p>{{p5Description}}</p>
            </div>
        </div>
    </div>
</div>
        `
    },

    // ==========================================
    // 6. SIMPLE ABOUT (Text-focused)
    // ==========================================
    {
        id: 'premium-about-simple',
        name: 'Simple About Page',
        description: 'Clean text-focused about section',
        type: 'about',
        html: `
<div class="premium-card">
    <div class="container" style="max-width: 800px; margin: 0 auto;">
        <span class="section-label">{{sectionLabel}}</span>
        <h1 class="elegant-title">{{title}}</h1>
        
        <p class="body-text" style="font-size: 1.1rem;">{{paragraph1}}</p>
        {{#paragraph2}}<p class="body-text">{{paragraph2}}</p>{{/paragraph2}}
        {{#paragraph3}}<p class="body-text">{{paragraph3}}</p>{{/paragraph3}}
        
        {{#philosophy}}
        <div class="philosophy" style="margin-top: 2rem;">
            <span class="philosophy-label">Core Philosophy:</span>
            <span class="philosophy-text">{{philosophy}}</span>
        </div>
        {{/philosophy}}
    </div>
</div>
        `
    },

    // ==========================================
    // 7. CTA CLOSING SLIDE
    // ==========================================
    {
        id: 'premium-cta-closing',
        name: 'Closing CTA',
        description: 'Beautiful closing slide with contact info',
        type: 'cta',
        html: `
<div class="premium-card" style="background: linear-gradient(135deg, #5B4FD8 0%, #7C3AED 100%); color: white; min-height: 400px; display: flex; align-items: center; justify-content: center;">
    <div class="container" style="text-align: center; max-width: 700px;">
        <h1 class="elegant-title" style="color: white; font-size: 3rem; margin-bottom: 1.5rem;">{{title}}</h1>
        <p style="font-size: 1.2rem; opacity: 0.9; margin-bottom: 2rem;">{{subtitle}}</p>
        
        {{#ctaButton}}
        <a href="{{ctaLink}}" style="display: inline-block; padding: 1rem 2.5rem; background: white; color: #5B4FD8; font-weight: 600; border-radius: 50px; text-decoration: none; font-size: 1.1rem;">
            {{ctaButton}}
        </a>
        {{/ctaButton}}
        
        <div style="margin-top: 3rem; font-size: 0.95rem; opacity: 0.85;">
            <p style="margin: 0.5rem 0;">{{name}}</p>
            <p style="margin: 0.5rem 0;">{{email}}</p>
            <p style="margin: 0.5rem 0;">{{phone}}</p>
        </div>
    </div>
</div>
        `
    },

    // ==========================================
    // 8. STATS IMPACT (Big numbers)
    // ==========================================
    {
        id: 'premium-stats-impact',
        name: 'Impact Stats Grid',
        description: 'Big impactful statistics',
        type: 'stats',
        html: `
<div class="premium-card">
    <div class="container">
        <span class="section-label">{{sectionLabel}}</span>
        <h1 class="elegant-title">{{title}}</h1>
        <p class="subtitle">{{subtitle}}</p>
        
        <div class="premium-grid-3" style="margin-top: 2.5rem;">
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 4rem; font-weight: 700; color: #5B4FD8; font-family: 'Inter', sans-serif;">{{stat1}}</div>
                <div style="font-size: 1.1rem; color: #4A4A5A; margin-top: 0.5rem;">{{label1}}</div>
                {{#desc1}}<div style="font-size: 0.9rem; color: #7A7A8A; margin-top: 0.25rem;">{{desc1}}</div>{{/desc1}}
            </div>
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 4rem; font-weight: 700; color: #5B4FD8; font-family: 'Inter', sans-serif;">{{stat2}}</div>
                <div style="font-size: 1.1rem; color: #4A4A5A; margin-top: 0.5rem;">{{label2}}</div>
                {{#desc2}}<div style="font-size: 0.9rem; color: #7A7A8A; margin-top: 0.25rem;">{{desc2}}</div>{{/desc2}}
            </div>
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 4rem; font-weight: 700; color: #5B4FD8; font-family: 'Inter', sans-serif;">{{stat3}}</div>
                <div style="font-size: 1.1rem; color: #4A4A5A; margin-top: 0.5rem;">{{label3}}</div>
                {{#desc3}}<div style="font-size: 0.9rem; color: #7A7A8A; margin-top: 0.25rem;">{{desc3}}</div>{{/desc3}}
            </div>
        </div>
        
        {{#calloutText}}
        <div class="callout-box" style="max-width: 600px; margin: 2rem auto 0;">
            {{#calloutTitle}}<h4>{{calloutTitle}}</h4>{{/calloutTitle}}
            <p>{{calloutText}}</p>
        </div>
        {{/calloutText}}
    </div>
</div>
        `
    }
];

// Export count
export const PREMIUM_TEMPLATE_COUNT = PREMIUM_TEMPLATES.length;

// Helper to get template by ID
export function getPremiumTemplateById(id: string): PremiumTemplate | undefined {
    return PREMIUM_TEMPLATES.find(t => t.id === id);
}

// Helper to get templates by type
export function getPremiumTemplatesByType(type: PremiumTemplate['type']): PremiumTemplate[] {
    return PREMIUM_TEMPLATES.filter(t => t.type === type);
}
