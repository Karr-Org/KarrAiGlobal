/**
 * 🎯 Template Matching Algorithm
 * Analyzes content and selects the best matching template
 * Uses keyword matching, content analysis, and position awareness
 */

import {
    CardTemplate,
    CARD_TEMPLATE_LIBRARY,
    TemplateCategory,
    ToneType,
    PresentationType,
    getTemplatesByCategory,
    getTemplatesForPosition,
    getTemplatesForTone
} from './card-templates';

// ============================================
// CONTENT ANALYSIS TYPES
// ============================================

export interface OutlineCard {
    id: string;
    title: string;
    bulletPoints: string[];
    suggestedLayout?: string;
}

export interface ContentAnalysis {
    hasNumbers: boolean;
    numberCount: number;
    extractedStats: Array<{ value: string; label: string }>;
    hasComparison: boolean;
    hasTimeline: boolean;
    hasQuote: boolean;
    hasTeam: boolean;
    hasPricing: boolean;
    hasCTA: boolean;
    bulletCount: number;
    keywords: string[];
    estimatedCategory: TemplateCategory;
    imageHint: boolean;  // Does content suggest an image would help?
}

export interface MatchResult {
    template: CardTemplate;
    score: number;
    reasons: string[];
}

// ============================================
// CONTENT DETECTION PATTERNS
// ============================================

const PATTERNS = {
    // Numbers and stats
    number: /\b(\d+[\d,]*(?:\.\d+)?[%+MKBTxX]?|\$[\d,]+(?:\.\d+)?[MKB]?)\b/gi,
    percentage: /\b\d+(\.\d+)?%/g,
    currency: /\$[\d,]+(?:\.\d+)?[MKB]?/g,
    multiplier: /\b\d+[xX]\b/g,
    largeNumber: /\b\d+[MKB]+\+?\b/gi,

    // Timeline indicators
    timeline: /\b(20\d{2}|timeline|roadmap|milestone|history|journey|evolution|founded|launched|phase|stage|step \d+|q[1-4]\s*20\d{2})\b/gi,

    // Comparison indicators
    comparison: /\b(vs\.?|versus|compared?|difference|alternative|option|better|worse|pros?|cons?|advantages?|disadvantages?|before|after)\b/gi,

    // Quote indicators
    quote: /\b(said|quote|testimonial|believes?|according to|"\s*[A-Z]|customer said|feedback)\b/gi,

    // Team/people indicators
    team: /\b(team|founder|ceo|cto|coo|leadership|people|member|advisor|board|our\s+team)\b/gi,

    // Pricing indicators
    pricing: /\b(pricing|price|cost|plan|tier|package|subscribe|monthly|yearly|free|premium|enterprise|starter|pro)\b/gi,

    // CTA/closing indicators
    cta: /\b(contact|get\s+started|try|demo|book|schedule|reach\s+out|next\s+steps?|thank\s+you|questions?|let'?s\s+talk)\b/gi,

    // Feature indicators
    features: /\b(feature|benefit|advantage|capability|include|offer|provide|solution|why\s+us)\b/gi,

    // Image hints (content that would benefit from visuals)
    imageHint: /\b(product|screenshot|demo|visual|show|appear|look|design|interface|example|illustration)\b/gi
};

// ============================================
// CONTENT ANALYZER
// ============================================

export function analyzeContent(card: OutlineCard): ContentAnalysis {
    const fullText = `${card.title} ${card.bulletPoints.join(' ')}`.toLowerCase();
    const fullTextOriginal = `${card.title} ${card.bulletPoints.join(' ')}`;

    // Extract stats/numbers
    const numberMatches = fullTextOriginal.match(PATTERNS.number) || [];
    const extractedStats = extractStats(fullTextOriginal);

    // Detect content types
    const hasComparison = PATTERNS.comparison.test(fullText);
    const hasTimeline = PATTERNS.timeline.test(fullText);
    const hasQuote = PATTERNS.quote.test(fullText);
    const hasTeam = PATTERNS.team.test(fullText);
    const hasPricing = PATTERNS.pricing.test(fullText);
    const hasCTA = PATTERNS.cta.test(fullText);
    const hasFeatures = PATTERNS.features.test(fullText);
    const imageHint = PATTERNS.imageHint.test(fullText);

    // Extract keywords for matching
    const keywords = extractKeywords(fullText);

    // Estimate best category
    let estimatedCategory: TemplateCategory = 'content';
    if (extractedStats.length >= 2) estimatedCategory = 'stats';
    else if (hasComparison) estimatedCategory = 'comparison';
    else if (hasTimeline) estimatedCategory = 'timeline';
    else if (hasQuote) estimatedCategory = 'quote';
    else if (hasTeam) estimatedCategory = 'team';
    else if (hasPricing) estimatedCategory = 'pricing';
    else if (hasCTA) estimatedCategory = 'cta';
    else if (hasFeatures && card.bulletPoints.length >= 3) estimatedCategory = 'features';

    return {
        hasNumbers: numberMatches.length > 0,
        numberCount: numberMatches.length,
        extractedStats,
        hasComparison,
        hasTimeline,
        hasQuote,
        hasTeam,
        hasPricing,
        hasCTA,
        bulletCount: card.bulletPoints.length,
        keywords,
        estimatedCategory,
        imageHint
    };
}

function extractStats(text: string): Array<{ value: string; label: string }> {
    const stats: Array<{ value: string; label: string }> = [];

    // Match patterns like "50M+ users" or "$2B revenue" or "99.9% uptime"
    const statPatterns = [
        /(\$?[\d,.]+[%+MKBTxX]?\+?)\s+([a-zA-Z][a-zA-Z\s]{2,20})/g,
        /([a-zA-Z][a-zA-Z\s]{2,20}):\s*(\$?[\d,.]+[%+MKBTxX]?\+?)/g,
        /^(\$?[\d,.]+[%+MKBTxX]?\+?)$/gm  // Standalone numbers on a line
    ];

    for (const pattern of statPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            if (match[1] && match[2]) {
                // Determine which is the value and which is the label
                const isFirstNumber = /[\d$]/.test(match[1][0]);
                stats.push({
                    value: isFirstNumber ? match[1].trim() : match[2].trim(),
                    label: isFirstNumber ? match[2].trim() : match[1].trim()
                });
            }
        }
    }

    // Also check bullet points for stats
    const lines = text.split('\n');
    for (const line of lines) {
        const parts = line.split(':');
        if (parts.length === 2) {
            const value = parts[1].trim();
            const label = parts[0].trim();
            if (/[\d$%]/.test(value) && !stats.find(s => s.value === value)) {
                stats.push({ value, label });
            }
        }
    }

    return stats.slice(0, 6); // Max 6 stats
}

function extractKeywords(text: string): string[] {
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
        'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
        'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
        'our', 'your', 'we', 'you', 'they', 'it', 'its', 'their', 'what',
        'how', 'why', 'when', 'where', 'which', 'who'
    ]);

    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word))
        .slice(0, 20);
}

// ============================================
// TEMPLATE MATCHER
// ============================================

export function findBestTemplate(
    card: OutlineCard,
    position: number,
    totalCards: number,
    tone: ToneType = 'professional',
    presentationType: PresentationType = 'pitch',
    hasImage: boolean = false
): MatchResult {
    const analysis = analyzeContent(card);
    const positionHint = position === 0 ? 'first' : position === totalCards - 1 ? 'last' : 'middle';

    // Get candidate templates
    let candidates = [...CARD_TEMPLATE_LIBRARY];

    // Score each template
    const scored: MatchResult[] = candidates.map(template => {
        const { score, reasons } = scoreTemplate(template, analysis, positionHint, tone, presentationType, hasImage);
        return { template, score, reasons };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Return best match
    return scored[0];
}

function scoreTemplate(
    template: CardTemplate,
    analysis: ContentAnalysis,
    position: 'first' | 'middle' | 'last',
    tone: ToneType,
    presentationType: PresentationType,
    hasImage: boolean
): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const meta = template.metadata;

    // 1. POSITION MATCH (Very important: 30 points)
    if (meta.positions.includes(position)) {
        score += 30;
        reasons.push(`Position match: ${position}`);
    } else if (meta.positions.includes('any')) {
        score += 15;
    } else {
        score -= 50; // Strong penalty for wrong position
    }

    // 2. CATEGORY MATCH (Important: 25 points)
    if (meta.category === analysis.estimatedCategory) {
        score += 25;
        reasons.push(`Category match: ${meta.category}`);
    } else if (isRelatedCategory(meta.category, analysis.estimatedCategory)) {
        score += 10;
    }

    // 3. TONE MATCH (15 points)
    if (meta.tones.includes(tone)) {
        score += 15;
        reasons.push(`Tone match: ${tone}`);
    }

    // 4. PRESENTATION TYPE MATCH (10 points)
    if (meta.suitableFor.includes(presentationType)) {
        score += 10;
        reasons.push(`Type match: ${presentationType}`);
    }

    // 5. KEYWORD MATCH (Up to 20 points)
    const keywordMatches = meta.keywords.filter(k =>
        analysis.keywords.some(ak => ak.includes(k) || k.includes(ak))
    );
    if (keywordMatches.length > 0) {
        const keywordScore = Math.min(keywordMatches.length * 5, 20);
        score += keywordScore;
        reasons.push(`Keywords: ${keywordMatches.slice(0, 3).join(', ')}`);
    }

    // 6. CONTENT HINTS MATCH (Up to 15 points)
    const hintMatches = meta.contentHints.filter(h =>
        analysis.keywords.some(k => k.includes(h) || h.includes(k))
    );
    if (hintMatches.length > 0) {
        score += Math.min(hintMatches.length * 5, 15);
    }

    // 7. STATS MATCHING (For stats templates)
    if (meta.category === 'stats') {
        if (analysis.extractedStats.length >= (meta.minItems || 1)) {
            score += 20;
            reasons.push(`Stats count: ${analysis.extractedStats.length}`);
        }
        if (meta.maxItems && analysis.extractedStats.length <= meta.maxItems) {
            score += 5;
        }
    }

    // 8. BULLET COUNT MATCHING
    if (meta.minItems && analysis.bulletCount >= meta.minItems) {
        score += 10;
    }
    if (meta.maxItems && analysis.bulletCount <= meta.maxItems) {
        score += 5;
    }

    // 9. IMAGE REQUIREMENTS
    if (meta.requiresImage && hasImage) {
        score += 15;
        reasons.push('Has image');
    } else if (meta.requiresImage && !hasImage && analysis.imageHint) {
        score += 5; // Content suggests image, template needs it
    } else if (meta.requiresImage && !hasImage) {
        score -= 10; // Penalty: template needs image but none provided
    }

    // 10. SPECIAL CONTENT BONUSES
    if (analysis.hasQuote && meta.category === 'quote') {
        score += 25;
        reasons.push('Quote detected');
    }
    if (analysis.hasTimeline && meta.category === 'timeline') {
        score += 25;
        reasons.push('Timeline detected');
    }
    if (analysis.hasComparison && meta.category === 'comparison') {
        score += 25;
        reasons.push('Comparison detected');
    }
    if (analysis.hasPricing && meta.category === 'pricing') {
        score += 25;
        reasons.push('Pricing detected');
    }
    if (analysis.hasTeam && meta.category === 'team') {
        score += 25;
        reasons.push('Team detected');
    }
    if (analysis.hasCTA && meta.category === 'cta') {
        score += 25;
        reasons.push('CTA detected');
    }

    return { score, reasons };
}

function isRelatedCategory(cat1: TemplateCategory, cat2: TemplateCategory): boolean {
    const related: Record<TemplateCategory, TemplateCategory[]> = {
        'title': ['cta'],
        'content': ['features'],
        'stats': ['features'],
        'features': ['content', 'stats'],
        'comparison': ['features'],
        'timeline': ['content'],
        'quote': ['content'],
        'team': ['content'],
        'pricing': ['features', 'comparison'],
        'cta': ['title'],
        'diagram': ['content', 'timeline'],
        'gallery': ['content']
    };
    return related[cat1]?.includes(cat2) || false;
}

// ============================================
// BATCH MATCHING FOR FULL OUTLINE
// ============================================

export interface OutlineMatchResult {
    cardId: string;
    templateId: string;
    templateName: string;
    score: number;
    reasons: string[];
    contentAnalysis: ContentAnalysis;
}

export function matchOutlineToTemplates(
    outline: { title: string; cards: OutlineCard[] },
    tone: ToneType = 'professional',
    presentationType: PresentationType = 'pitch',
    imageStyle: string = 'photo'
): OutlineMatchResult[] {
    const results: OutlineMatchResult[] = [];
    const usedTemplates = new Set<string>(); // Track used templates for variety

    outline.cards.forEach((card, index) => {
        // Analyze content
        const analysis = analyzeContent(card);

        // Determine if this card should have an image
        const hasImage = analysis.imageHint ||
            index % 3 === 1 || // Every 3rd slide
            imageStyle !== 'none';

        // Find best template
        let match = findBestTemplate(
            card,
            index,
            outline.cards.length,
            tone,
            presentationType,
            hasImage
        );

        // Try to avoid using same template twice in a row
        if (index > 0 && usedTemplates.has(match.template.id)) {
            // Find alternative with similar score
            const alternatives = findAlternativeTemplates(
                card,
                index,
                outline.cards.length,
                tone,
                presentationType,
                hasImage,
                usedTemplates
            );
            if (alternatives.length > 0 && alternatives[0].score > match.score * 0.7) {
                match = alternatives[0];
            }
        }

        usedTemplates.add(match.template.id);

        results.push({
            cardId: card.id,
            templateId: match.template.id,
            templateName: match.template.name,
            score: match.score,
            reasons: match.reasons,
            contentAnalysis: analysis
        });
    });

    return results;
}

function findAlternativeTemplates(
    card: OutlineCard,
    position: number,
    totalCards: number,
    tone: ToneType,
    presentationType: PresentationType,
    hasImage: boolean,
    excludeIds: Set<string>
): MatchResult[] {
    const analysis = analyzeContent(card);
    const positionHint = position === 0 ? 'first' : position === totalCards - 1 ? 'last' : 'middle';

    const candidates = CARD_TEMPLATE_LIBRARY.filter(t => !excludeIds.has(t.id));

    const scored: MatchResult[] = candidates.map(template => {
        const { score, reasons } = scoreTemplate(template, analysis, positionHint, tone, presentationType, hasImage);
        return { template, score, reasons };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3);
}

// ============================================
// UTILITY: FILL TEMPLATE WITH CONTENT
// ============================================

export interface FilledSlot {
    [key: string]: string | string[];
}

export function fillTemplateSlots(
    template: CardTemplate,
    card: OutlineCard,
    analysis: ContentAnalysis
): FilledSlot {
    const filled: FilledSlot = {};

    // Fill title
    filled.title = card.title;

    // Fill bullets if available
    if (card.bulletPoints.length > 0) {
        filled.bullets = card.bulletPoints;
    }

    // Fill stats
    if (analysis.extractedStats.length > 0) {
        analysis.extractedStats.forEach((stat, i) => {
            filled[`stat${i + 1}`] = stat.value;
            filled[`label${i + 1}`] = stat.label;
        });
        // For single stat templates
        filled.stat = analysis.extractedStats[0]?.value || '';
        filled.label = analysis.extractedStats[0]?.label || '';
    }

    // Fill comparison slots
    if (analysis.hasComparison && card.bulletPoints.length >= 2) {
        const mid = Math.floor(card.bulletPoints.length / 2);
        filled.leftPoints = card.bulletPoints.slice(0, mid);
        filled.rightPoints = card.bulletPoints.slice(mid);
        filled.leftTitle = 'Option A';
        filled.rightTitle = 'Option B';
    }

    // Fill features
    if (template.metadata.category === 'features') {
        card.bulletPoints.slice(0, 4).forEach((point, i) => {
            const [title, ...desc] = point.split(':');
            filled[`f${i + 1}Title`] = title.trim();
            filled[`f${i + 1}Desc`] = desc.join(':').trim() || point;
        });
    }

    return filled;
}

// ============================================
// DEBUG: Get match explanation
// ============================================

export function explainMatch(
    card: OutlineCard,
    position: number,
    totalCards: number,
    tone: ToneType = 'professional'
): string {
    const analysis = analyzeContent(card);
    const match = findBestTemplate(card, position, totalCards, tone, 'pitch', false);

    return `
Card: "${card.title}"
Position: ${position + 1}/${totalCards}

Content Analysis:
- Has Numbers: ${analysis.hasNumbers} (${analysis.numberCount})
- Extracted Stats: ${analysis.extractedStats.map(s => `${s.value} ${s.label}`).join(', ')}
- Has Comparison: ${analysis.hasComparison}
- Has Timeline: ${analysis.hasTimeline}
- Has Quote: ${analysis.hasQuote}
- Bullet Count: ${analysis.bulletCount}
- Estimated Category: ${analysis.estimatedCategory}
- Keywords: ${analysis.keywords.slice(0, 10).join(', ')}

Best Match:
- Template: ${match.template.name} (${match.template.id})
- Score: ${match.score}
- Reasons: ${match.reasons.join(', ')}
    `.trim();
}
