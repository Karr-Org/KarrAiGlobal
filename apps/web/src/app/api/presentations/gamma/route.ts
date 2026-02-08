/**
 * 🧠 Smart Presentation Generation API
 * AI-powered layout selection and content structuring
 * Uses 125+ Gamma-style templates for professional slides
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    CardLayoutType,
    SmartCard,
    suggestLayoutForContent,
    getGradientForCard,
} from '@/lib/gamma/smart-cards';
import { CARD_TEMPLATES, suggestTemplate, getTemplateById, TemplateCategory } from '@/lib/gamma/templates';
import {
    detectBestTemplate,
    mapCardToContent,
    generateImages,
    convertAICard,
    CardData
} from '@/lib/gamma/template-generator';
import { GAMMA_THEMES, GammaTheme } from '@/lib/gamma/gamma-styles';
import { renderGammaSlide } from '@/lib/gamma/gamma-renderer';

// NEW: Import the new template system
import {
    CARD_TEMPLATE_LIBRARY,
    getCardTemplateById,
    findBestTemplate as findBestTemplateV2,
    analyzeContent,
    matchOutlineToTemplates,
    fillTemplateSlots,
    renderTemplate,
    TEMPLATE_THEMES,
    type OutlineCard,
    type ToneType,
    type PresentationType
} from '@/lib/gamma';

// PREMIUM: Import beautiful Gamma-style templates
import {
    selectPremiumTemplate,
    renderPremiumTemplate,
    mapContentToPremiumTemplate,
    renderPremiumPresentation,
    PREMIUM_CSS_BASE
} from '@/lib/gamma/premium-renderer';


const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

// ============================================
// SMART CARD GENERATION PROMPT
// ============================================

const SMART_GENERATION_PROMPT = `You are an expert presentation designer. Generate a complete, professionally-designed presentation.

For EACH card, you must:
1. ANALYZE the content to determine the best layout
2. GENERATE rich, structured content for that layout
3. CREATE an image prompt for visual elements

AVAILABLE LAYOUTS:
- title-hero: Opening/closing with big title (use for first and last)
- split-text-image: Text + supporting image (use for 40% of slides)
- split-image-text: Image + text (visual variety)
- bullet-list: Multiple related points (max 4-5 bullets)
- stats-grid: 2-4 big numbers with labels (when numbers present)
- quote-highlight: Impactful quotes or testimonials
- timeline: Chronological events (for roadmaps, history)
- comparison-table: Vs comparisons, pros/cons
- feature-grid: 2-4 features with icons
- diagram: Process flows, cycles
- callout: Important highlights, tips
- big-statement: Single powerful statement

RESPONSE FORMAT (JSON):
{
  "title": "Presentation Title",
  "subtitle": "Compelling subtitle",
  "cards": [
    {
      "layout": "title-hero",
      "content": {
        "title": "Big Impactful Title",
        "subtitle": "Supporting tagline",
        "backgroundType": "gradient"
      },
      "imagePrompt": null,
      "speakerNotes": "Welcome everyone..."
    },
    {
      "layout": "stats-grid",
      "content": {
        "title": "The Numbers Speak",
        "stats": [
          {"value": "50M+", "label": "Users Worldwide", "trend": "up"},
          {"value": "99.9%", "label": "Uptime", "trend": "neutral"},
          {"value": "$2B", "label": "Revenue", "trend": "up"}
        ]
      },
      "imagePrompt": null,
      "speakerNotes": "Let me share some key metrics..."
    },
    {
      "layout": "split-text-image",
      "content": {
        "title": "Our Solution",
        "body": "A brief paragraph explaining the core value proposition.",
        "bullets": ["Key benefit one", "Key benefit two", "Key benefit three"]
      },
      "imagePrompt": "Modern technology solution visualization, clean interface, blue tones, professional",
      "speakerNotes": "Here's how we solve the problem..."
    },
    {
      "layout": "timeline",
      "content": {
        "title": "Our Journey",
        "events": [
          {"year": "2020", "title": "Founded", "description": "Started with a vision"},
          {"year": "2022", "title": "Series A", "description": "Raised $10M"},
          {"year": "2024", "title": "Scale", "description": "Expanded globally"}
        ]
      },
      "imagePrompt": null,
      "speakerNotes": "Let me walk you through our journey..."
    },
    {
      "layout": "comparison-table",
      "content": {
        "title": "Why Choose Us?",
        "leftLabel": "Traditional",
        "rightLabel": "Our Solution",
        "rows": [
          {"feature": "Speed", "left": "Days", "right": "Minutes"},
          {"feature": "Cost", "left": "$$$", "right": "$"},
          {"feature": "Quality", "left": "Variable", "right": "Consistent"}
        ]
      },
      "imagePrompt": null,
      "speakerNotes": "Here's how we compare..."
    },
    {
      "layout": "feature-grid",
      "content": {
        "title": "Key Features",
        "features": [
          {"icon": "zap", "title": "Lightning Fast", "description": "Generate in seconds"},
          {"icon": "shield", "title": "Secure", "description": "Enterprise-grade security"},
          {"icon": "users", "title": "Collaborative", "description": "Real-time teamwork"}
        ]
      },
      "imagePrompt": null,
      "speakerNotes": "Our key features include..."
    },
    {
      "layout": "quote-highlight",
      "content": {
        "quote": "This product changed how we work. Absolutely transformative.",
        "author": "Jane Smith",
        "role": "CEO, TechCorp"
      },
      "imagePrompt": "Professional headshot placeholder, business executive, warm lighting",
      "speakerNotes": "Don't just take our word for it..."
    },
    {
      "layout": "big-statement",
      "content": {
        "statement": "Ready to Transform Your Business?",
        "subtext": "Join 50,000+ companies already using our platform"
      },
      "imagePrompt": null,
      "speakerNotes": "Thank you, any questions?"
    }
  ]
}

RULES:
1. First card MUST be title-hero
2. Last card MUST be big-statement or title-hero (call to action)
3. VARY layouts - never use same layout twice in a row
4. Use split-text-image for 40% of content slides
5. Use stats-grid when numbers are mentioned
6. Headlines: 6-8 words maximum
7. Bullets: Start with action verbs, 8-12 words each
8. Generate image prompts for visual layouts (split, quote, feature-grid)

Return ONLY valid JSON, no markdown code blocks.`;

// ============================================
// POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            topic,
            cardCount = 8,
            tone = 'professional',
            outline: providedOutline,
            imageStyle = 'photo',
            imageKeywords = [],
        } = body;

        console.log('[Smart Gamma API] Generating for:', topic);

        // Build the generation prompt
        let generationPrompt = SMART_GENERATION_PROMPT;

        if (providedOutline?.cards?.length > 0) {
            // User provided an edited outline - enhance it with smart layouts
            generationPrompt += `\n\nUSER'S OUTLINE TO ENHANCE:\nTitle: ${providedOutline.title}\nCards:\n${providedOutline.cards.map((c: any, i: number) =>
                `${i + 1}. ${c.title}\n   - ${c.bulletPoints?.join('\n   - ') || 'No bullets'}`
            ).join('\n')
                }\n\nTransform this outline into a professionally-designed presentation with appropriate layouts for each card.`;
        } else {
            // Generate from scratch
            generationPrompt += `\n\nTOPIC: ${topic}\nTONE: ${tone}\nNUMBER OF CARDS: ${cardCount}\n\nGenerate a complete ${cardCount}-card presentation about this topic.`;
        }

        // Add image style preference
        if (imageStyle !== 'none') {
            generationPrompt += `\n\nIMAGE STYLE: ${imageStyle}`;
            if (imageKeywords.length > 0) {
                generationPrompt += `\nIMAGE KEYWORDS: ${imageKeywords.join(', ')}`;
            }
        }

        // Call Gemini AI
        let presentation: any = null;

        try {
            const aiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: generationPrompt }] }],
                        generationConfig: {
                            temperature: 0.8,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 8192,
                        },
                    }),
                }
            );

            if (!aiResponse.ok) {
                const errorText = await aiResponse.text();
                console.error('[Smart Gamma API] AI Error:', errorText);
                // Don't throw, just use fallback
            } else {
                const aiData = await aiResponse.json();
                const responseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
                presentation = parseAIResponse(responseText);
            }
        } catch (aiError) {
            console.error('[Smart Gamma API] AI call failed:', aiError);
            // Continue with fallback
        }


        // Use fallback if AI didn't work
        if (!presentation || !presentation.cards || presentation.cards.length === 0) {
            console.log('[Smart Gamma API] Using enhanced fallback generation');

            // If we have an outline, use it to generate cards with smart layouts
            if (providedOutline?.cards?.length > 0) {
                presentation = generateFromOutline(providedOutline);
            } else {
                presentation = generateSmartFallback(topic || 'Presentation', cardCount);
            }
        }

        // Get theme (default to Gamma purple) - Map to new theme system
        const themeName = body.theme || 'lavender';
        const theme: GammaTheme = GAMMA_THEMES[themeName] || GAMMA_THEMES.gamma;
        const newTheme = TEMPLATE_THEMES[themeName] || TEMPLATE_THEMES.lavender;

        // Convert tone to ToneType
        const toneMap: Record<string, ToneType> = {
            'professional': 'professional',
            'casual': 'casual',
            'inspiring': 'inspiring',
            'educational': 'educational',
            'persuasive': 'persuasive',
            'storytelling': 'storytelling',
        };
        const mappedTone: ToneType = toneMap[tone] || 'professional';

        // Enhance cards with gradients, IDs, IMAGE URLs, and SMART TEMPLATES
        const enhancedCards: SmartCard[] = presentation.cards.map((card: any, index: number) => {
            const title = card.content?.title || card.title || `Card ${index + 1}`;
            const bullets = card.content?.bullets || card.bullets || [];

            // Create OutlineCard for the new template matcher
            const outlineCard: OutlineCard = {
                id: crypto.randomUUID(),
                title,
                bulletPoints: bullets,
                suggestedLayout: card.layout
            };

            // Use NEW template matching system
            const match = findBestTemplateV2(
                outlineCard,
                index,
                presentation.cards.length,
                mappedTone,
                'pitch',  // Default presentation type
                !!(card.imagePrompt || imageStyle !== 'none')
            );

            const matchedTemplate = match.template;
            const contentAnalysis = analyzeContent(outlineCard);

            // Fill template slots using new system
            const filledContent = fillTemplateSlots(matchedTemplate, outlineCard, contentAnalysis);

            // Generate images object
            const images: Record<string, string> = {};
            if (matchedTemplate.images.length > 0 && (card.imagePrompt || imageStyle !== 'none')) {
                const seed = title.replace(/\s+/g, '-').toLowerCase();
                matchedTemplate.images.forEach((img, imgIndex) => {
                    images[img.id] = `https://picsum.photos/seed/${encodeURIComponent(seed)}-${index}-${imgIndex}/800/600`;
                });
            }

            // Render using new template renderer
            let renderedHtml = '';
            let renderedCss = '';
            try {
                const rendered = renderTemplate(matchedTemplate, filledContent, images, { theme: newTheme });
                renderedHtml = rendered.html;
                renderedCss = rendered.css;
            } catch (e) {
                console.warn('[Smart Gamma API] New template render failed, falling back:', e);

                // Fallback to old system
                const cardData: CardData = convertAICard(card);
                const gammaTemplate = detectBestTemplate(cardData, index, presentation.cards.length);
                const templateContent = mapCardToContent(cardData, gammaTemplate);
                const templateImages = generateImages(cardData, gammaTemplate);
                try {
                    const rendered = renderGammaSlide(gammaTemplate, templateContent, templateImages, theme);
                    renderedHtml = rendered.html;
                } catch (fallbackError) {
                    console.warn('[Smart Gamma API] Fallback also failed:', fallbackError);
                }
            }

            // Legacy image URL generation - using Picsum which is more reliable
            let imageUrl: string | undefined;
            if (card.imagePrompt || card.layout === 'split-text-image' || card.layout === 'split-image-text') {
                const seed = title.replace(/\s+/g, '-').toLowerCase();
                imageUrl = `https://picsum.photos/seed/${encodeURIComponent(seed)}-${index}/800/600`;
            }

            return {
                id: crypto.randomUUID(),
                layout: card.layout || suggestLayoutForContent(index, presentation.cards.length, title, []).layout,
                content: card.content,
                gradient: getGradientForCard(index, 'vibrant'),
                imageUrl,
                imagePrompt: card.imagePrompt,
                speakerNotes: card.speakerNotes || '',
                // NEW template info (V2)
                templateId: matchedTemplate.id,
                templateName: matchedTemplate.name,
                templateCategory: matchedTemplate.metadata.category,
                templateScore: match.score,
                templateReasons: match.reasons,
                templateHtml: renderedHtml,
                templateCss: renderedCss,
                filledContent,
                contentAnalysis: {
                    hasNumbers: contentAnalysis.hasNumbers,
                    estimatedCategory: contentAnalysis.estimatedCategory,
                    bulletCount: contentAnalysis.bulletCount,
                },
                // PREMIUM: Beautiful Gamma-style templates
                premiumTemplate: (() => {
                    try {
                        const premiumTmpl = selectPremiumTemplate(index, presentation.cards.length, {
                            title,
                            bulletPoints: bullets,
                            ...card.content
                        });
                        const mappedContent = mapContentToPremiumTemplate(premiumTmpl, {
                            title,
                            subtitle: card.content?.subtitle || card.content?.body?.substring(0, 100) || '',
                            bulletPoints: bullets,
                            content: card.content?.body || '',
                            image: imageUrl
                        }, premiumTmpl.type.toUpperCase());
                        const rendered = renderPremiumTemplate(premiumTmpl, mappedContent, {
                            theme: themeName as 'lavender' | 'indigo' | 'rose' | 'emerald' | 'slate',
                            includeAnimations: true
                        });
                        return {
                            id: premiumTmpl.id,
                            name: premiumTmpl.name,
                            type: premiumTmpl.type,
                            html: rendered.html,
                            css: rendered.css
                        };
                    } catch (e) {
                        console.warn('[Premium Template] Failed:', e);
                        return null;
                    }
                })()
            };
        });

        console.log('[Smart Gamma API] Generated', enhancedCards.length, 'smart cards with Gamma templates');

        return NextResponse.json({
            success: true,
            presentation: {
                id: crypto.randomUUID(),
                title: presentation.title,
                subtitle: presentation.subtitle,
                cards: enhancedCards,
                theme: themeName,
                themeColors: theme.colors,
                // PREMIUM: Include global CSS for beautiful templates
                premiumCss: PREMIUM_CSS_BASE
            },
        });

    } catch (error) {
        console.error('[Smart Gamma API] Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Generation failed' },
            { status: 500 }
        );
    }
}

// ============================================
// IMAGE KEYWORD EXTRACTION
// ============================================

function extractImageKeywords(prompt: string): string {
    // Remove common style/descriptor words and extract key concepts
    const stopWords = ['professional', 'modern', 'clean', 'high', 'quality', 'style', 'image', 'photo', 'picture', 'showing', 'representing', 'visualization', 'concept', 'abstract', 'the', 'and', 'with', 'for', 'that', 'this'];

    const words = prompt
        .toLowerCase()
        .replace(/[^\w\s,]/g, ' ')
        .split(/[\s,]+/)
        .filter(w => w.length > 2 && !stopWords.includes(w))
        .slice(0, 4); // Take first 4 meaningful words

    return words.join(',') || 'business,technology';
}

// ============================================
// PARSE AI RESPONSE
// ============================================

function parseAIResponse(text: string): any {
    try {
        // Remove markdown code blocks if present
        let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Find JSON object
        const jsonStart = cleaned.indexOf('{');
        const jsonEnd = cleaned.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
        }

        return JSON.parse(cleaned);
    } catch (e) {
        console.error('[Smart Gamma API] Parse error:', e);
        return null;
    }
}

// ============================================
// GENERATE FROM USER OUTLINE
// ============================================

function generateFromOutline(outline: any): any {
    const totalCards = outline.cards?.length || 0;

    const cards = outline.cards.map((card: any, index: number) => {
        // Use smart layout suggestion based on content
        const { layout } = suggestLayoutForContent(
            index,
            totalCards,
            card.title || '',
            card.bulletPoints || []
        );

        // Generate content based on layout
        return generateCardContent(layout, card, index);
    });

    return {
        title: outline.title || 'Presentation',
        subtitle: outline.subtitle || 'AI-Enhanced Presentation',
        cards,
    };
}

function generateCardContent(layout: CardLayoutType, card: any, index: number): any {
    const title = card.title || `Card ${index + 1}`;
    const bullets = card.bulletPoints || [];

    const layoutContent: Record<string, any> = {
        'title-hero': {
            layout: 'title-hero',
            content: {
                title: title,
                subtitle: bullets[0] || 'Welcome to this presentation',
                backgroundType: 'gradient',
            },
            speakerNotes: `Welcome to ${title}`,
        },
        'split-text-image': {
            layout: 'split-text-image',
            content: {
                title: title,
                body: bullets.slice(0, 2).join('. ') || 'Key information about this topic.',
                bullets: bullets.slice(0, 4),
            },
            imagePrompt: `Professional image representing ${title}, modern, clean`,
            speakerNotes: `Let me explain ${title}`,
        },
        'stats-grid': {
            layout: 'stats-grid',
            content: {
                title: title,
                stats: bullets.slice(0, 4).map((b: string, i: number) => ({
                    value: extractNumber(b) || `${(i + 1) * 25}%`,
                    label: b.replace(/[\d%$+x]+/g, '').trim() || b,
                    trend: i % 2 === 0 ? 'up' : 'neutral',
                })),
            },
            speakerNotes: `Here are the key numbers for ${title}`,
        },
        'feature-grid': {
            layout: 'feature-grid',
            content: {
                title: title,
                features: bullets.slice(0, 4).map((b: string, i: number) => ({
                    icon: ['star', 'zap', 'shield', 'trending-up'][i % 4],
                    title: b.split(' ').slice(0, 3).join(' '),
                    description: b,
                })),
            },
            speakerNotes: `Let me highlight the key features of ${title}`,
        },
        'timeline': {
            layout: 'timeline',
            content: {
                title: title,
                events: bullets.slice(0, 4).map((b: string, i: number) => ({
                    year: `Step ${i + 1}`,
                    title: b.split(' ').slice(0, 4).join(' '),
                    description: b,
                })),
            },
            speakerNotes: `Here's the timeline for ${title}`,
        },
        'comparison-table': {
            layout: 'comparison-table',
            content: {
                title: title,
                leftLabel: 'Before',
                rightLabel: 'After',
                rows: bullets.slice(0, 4).map((b: string) => ({
                    feature: b,
                    left: '✗',
                    right: '✓',
                })),
            },
            speakerNotes: `Let's compare ${title}`,
        },
        'quote-highlight': {
            layout: 'quote-highlight',
            content: {
                quote: bullets[0] || title,
                author: 'Industry Expert',
                role: 'Thought Leader',
            },
            speakerNotes: `This powerful insight about ${title}`,
        },
        'bullet-list': {
            layout: 'bullet-list',
            content: {
                title: title,
                bullets: bullets.slice(0, 5),
                iconType: 'check',
            },
            speakerNotes: `Key points about ${title}`,
        },
        'big-statement': {
            layout: 'big-statement',
            content: {
                statement: title,
                subtext: bullets[0] || 'Take action today',
            },
            speakerNotes: `In conclusion, ${title}`,
        },
    };

    return layoutContent[layout] || layoutContent['split-text-image'];
}

function extractNumber(text: string): string | null {
    const match = text.match(/(\d+%|\$[\d,]+|\d+x|\d+\+|[\d,]+\s*(million|billion|M|B|K))/i);
    return match ? match[0] : null;
}

// ============================================
// SMART FALLBACK GENERATOR
// ============================================

function generateSmartFallback(topic: string, cardCount: number): any {
    const layouts: CardLayoutType[] = [
        'title-hero',
        'split-text-image',
        'stats-grid',
        'feature-grid',
        'split-image-text',
        'timeline',
        'comparison-table',
        'quote-highlight',
        'big-statement',
    ];

    const cards = [];

    // Title slide
    cards.push({
        layout: 'title-hero',
        content: {
            title: topic,
            subtitle: 'A comprehensive overview',
            backgroundType: 'gradient',
        },
        imagePrompt: null,
        speakerNotes: 'Welcome to this presentation.',
    });

    // Generate varied content cards
    for (let i = 1; i < cardCount - 1; i++) {
        const layout = layouts[i % layouts.length];
        cards.push(generateCardForLayout(layout, topic, i));
    }

    // Closing slide
    cards.push({
        layout: 'big-statement',
        content: {
            statement: 'Let\'s Get Started',
            subtext: `Transform your approach to ${topic}`,
        },
        imagePrompt: null,
        speakerNotes: 'Thank you for your attention.',
    });

    return {
        title: topic,
        subtitle: 'AI-Generated Presentation',
        cards,
    };
}

function generateCardForLayout(layout: CardLayoutType, topic: string, index: number): any {
    const baseContent: Record<string, any> = {
        'split-text-image': {
            layout: 'split-text-image',
            content: {
                title: `Key Insight ${index}`,
                body: `An important aspect of ${topic} that drives value and creates impact.`,
                bullets: [
                    'Actionable insight number one',
                    'Measurable outcome focus',
                    'Strategic implementation path',
                ],
            },
            imagePrompt: `Professional visualization of ${topic}, modern design, clean composition`,
        },
        'stats-grid': {
            layout: 'stats-grid',
            content: {
                title: 'By The Numbers',
                stats: [
                    { value: '85%', label: 'Efficiency Gain', trend: 'up' },
                    { value: '3x', label: 'Faster Results', trend: 'up' },
                    { value: '$2M+', label: 'Cost Savings', trend: 'up' },
                    { value: '99%', label: 'Satisfaction', trend: 'neutral' },
                ],
            },
            imagePrompt: null,
        },
        'feature-grid': {
            layout: 'feature-grid',
            content: {
                title: 'Key Features',
                features: [
                    { icon: 'zap', title: 'Fast', description: 'Lightning quick results' },
                    { icon: 'shield', title: 'Secure', description: 'Enterprise-grade protection' },
                    { icon: 'trending-up', title: 'Scalable', description: 'Grows with your needs' },
                    { icon: 'users', title: 'Collaborative', description: 'Team-first design' },
                ],
            },
            imagePrompt: null,
        },
        'timeline': {
            layout: 'timeline',
            content: {
                title: 'The Journey',
                events: [
                    { year: 'Phase 1', title: 'Foundation', description: 'Establishing the groundwork' },
                    { year: 'Phase 2', title: 'Growth', description: 'Scaling operations' },
                    { year: 'Phase 3', title: 'Maturity', description: 'Optimizing for excellence' },
                ],
            },
            imagePrompt: null,
        },
        'comparison-table': {
            layout: 'comparison-table',
            content: {
                title: 'The Difference',
                leftLabel: 'Before',
                rightLabel: 'After',
                rows: [
                    { feature: 'Speed', left: 'Days', right: 'Minutes' },
                    { feature: 'Accuracy', left: '70%', right: '99%' },
                    { feature: 'Cost', left: 'High', right: 'Low' },
                    { feature: 'Effort', left: 'Manual', right: 'Automated' },
                ],
            },
            imagePrompt: null,
        },
        'quote-highlight': {
            layout: 'quote-highlight',
            content: {
                quote: `This approach to ${topic} has transformed how we operate.`,
                author: 'Industry Expert',
                role: 'Thought Leader',
            },
            imagePrompt: 'Professional headshot, business executive, confident, warm lighting',
        },
        'split-image-text': {
            layout: 'split-image-text',
            content: {
                title: `Understanding ${topic}`,
                body: 'A deeper look at the core concepts and their practical applications.',
                bullets: [
                    'Core principle explained',
                    'Real-world application',
                    'Measurable impact',
                ],
            },
            imagePrompt: `Abstract visualization of ${topic}, modern geometric design`,
        },
    };

    return baseContent[layout] || baseContent['split-text-image'];
}
