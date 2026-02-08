/**
 * 🎨 Gamma Presentation Library
 * Complete system for generating Gamma-style presentations
 * 
 * Features:
 * - 230+ pre-designed card templates (matching Gamma.app)
 * - Industry-specific templates for pitch decks, product launches, case studies
 * - Marketing templates for campaigns, brand guidelines, events, sales
 * - Corporate templates for annual reports, investor updates, training
 * - Specialized templates for HR, tech docs, webinars, research
 * - 15 preset packs for complete presentations
 * - 6 professional color themes
 * - HTML/CSS renderer for web display
 * - Template suggestion based on content type
 * - Automatic template detection and mapping
 * - Image service with Pexels, Unsplash, and AI support
 * 
 * Templates based on analysis of actual Gamma.app presentations:
 * - Libre Baskerville serif headings
 * - Open Sans body text
 * - Rounded rectangle cards with subtle backgrounds
 * - Featured stat boxes with accent colors
 * - Icon grids with descriptions
 * - Timeline layouts
 * - Quote cards
 * - Comparison tables
 */

// ========================================
// GAMMA-STYLE TEMPLATE SYSTEM (230+ templates)
// ========================================
export * from './gamma-templates';             // Core templates (title, stats, features, etc.)
export * from './gamma-templates-extended';    // Extended templates (profile, experience, skills)
export * from './gamma-templates-industry';    // Industry-specific (pitch deck, product launch, case study, education)
export * from './gamma-templates-marketing';   // Marketing (social media, brand, events, sales)
export * from './gamma-templates-corporate';   // Corporate (annual reports, investor updates, training, project status)
export * from './gamma-templates-specialized'; // Specialized (HR, tech docs, webinars, research)
export * from './gamma-styles';                // CSS generation and themes
export * from './gamma-renderer';              // HTML rendering
export * from './template-generator';          // Automatic template selection & mapping

// ========================================
// PRESET PACKS (15 complete presentations)
// ========================================
export * from './preset-packs';                // Pre-built presentation structures

// ========================================
// IMAGE SERVICE
// ========================================
export * from './image-service';               // Pexels, Unsplash, AI image generation

// ========================================
// LEGACY/ORIGINAL SYSTEM
// ========================================
export * from './templates';                   // Original template definitions

// ========================================
// NEW TEMPLATE SYSTEM (Primary)
// ========================================
export {
    // Card Templates
    CARD_TEMPLATE_LIBRARY,
    getTemplateById as getCardTemplateById,
    getTemplatesByCategory as getCardTemplatesByCategory,
    getTemplatesForPosition,
    getTemplatesForTone,
    getTemplateSummary,
    type CardTemplate as CardTemplateV2,
    type TemplateCategory as TemplateCategoryV2,
    type TemplateMetadata,
    type TemplateSlot,
    type TemplateImage,
    type ToneType,
    type PresentationType,
    type PositionHint
} from './card-templates';

export {
    // Template Matcher
    analyzeContent,
    findBestTemplate,
    matchOutlineToTemplates,
    fillTemplateSlots,
    explainMatch,
    type OutlineCard,
    type ContentAnalysis,
    type MatchResult,
    type OutlineMatchResult,
    type FilledSlot
} from './template-matcher';

export {
    // Template Renderer
    renderTemplate,
    renderPresentation as renderNewPresentation,
    TEMPLATE_THEMES,
    type TemplateTheme,
    type RenderOptions,
    type RenderedCard
} from './template-renderer';

// ========================================
// PROFESSIONAL TEMPLATES (Based on CFO deck)
// ========================================
export { PROFESSIONAL_TEMPLATES, PROFESSIONAL_TEMPLATE_COUNT } from './professional-templates';

// ========================================
// PREMIUM GAMMA-STYLE TEMPLATES
// ========================================
export {
    PREMIUM_TEMPLATES,
    PREMIUM_CSS_BASE,
    PREMIUM_TEMPLATE_COUNT,
    getPremiumTemplateById,
    getPremiumTemplatesByType,
    type PremiumTemplate
} from './premium-templates';

// ========================================
// PREMIUM RENDERER
// ========================================
export {
    selectPremiumTemplate,
    renderPremiumTemplate,
    mapContentToPremiumTemplate,
    renderPremiumPresentation,
    type PremiumRenderOptions,
    type PremiumCardData,
    type RenderedPremiumCard
} from './premium-renderer';

// ========================================
// SMART CARD UTILITIES
// ========================================
export * from './smart-cards';                 // Layout suggestions and gradients

// ========================================
// TEMPLATE COUNTS
// ========================================
export const TEMPLATE_SUMMARY = {
    core: 110,
    extended: 15,
    industry: 21,
    marketing: 22,
    corporate: 32,
    specialized: 33,
    premium: 8,  // NEW: Beautiful Gamma-style templates
    total: 241,
    presetPacks: 15,
    totalPackSlides: 130
};
