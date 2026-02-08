/**
 * KARR AI - Presentation Generation Engine
 * 
 * The brain of AI Presentation Factory - generates structured SlideJSON
 * from user requirements using Gemini AI + learned preferences
 */

import { generateContentWithGeminiFlash } from '../gemini';
import { createClient } from '@supabase/supabase-js';
import {
    SlideJSONPresentation,
    PresentationRequest,
    PresentationResponse,
    DesignTokens,
    Slide,
    LayoutType
} from './types';

// =====================================================
// DEFAULT DESIGN TOKENS
// =====================================================

const DEFAULT_DESIGN_TOKENS: DesignTokens = {
    primaryColor: '#1a1a2e',
    secondaryColor: '#16213e',
    accentColor: '#e94560',
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    fontHeading: 'Inter',
    fontBody: 'IBM Plex Sans',
    fontSizeBase: 16,
    preferredLayouts: ['title-centered', 'split-image-right', 'bullet-list', 'comparison', 'statistics'],
    imageStyle: 'modern, professional, 3D isometric, clean, vibrant colors'
};

// =====================================================
// LAYOUT DESCRIPTIONS (for AI context)
// =====================================================

const LAYOUT_DESCRIPTIONS: Record<LayoutType, string> = {
    'title-centered': 'Large centered title, perfect for opening/closing slides',
    'title-subtitle': 'Title with subtitle below, good for introductions',
    'split-image-left': 'Image on left (40%), content on right (60%)',
    'split-image-right': 'Content on left (60%), image on right (40%)',
    'bullet-list': 'Title + 3-5 bullet points with icons',
    'numbered-list': 'Title + numbered sequential items',
    'comparison': 'Two-column side-by-side comparison',
    'quote': 'Large inspiring quote with attribution',
    'statistics': '2-4 big numbers/statistics with labels',
    'timeline': 'Horizontal timeline with 3-5 events',
    'image-full': 'Full-bleed background image with overlay text',
    'chart-focus': 'Data visualization as main focus',
    'icon-grid': '4-6 icons in grid with short labels',
    'team-grid': 'Team member profiles in grid',
    'section-break': 'Visual section divider with title'
};

// =====================================================
// GENERATION PROMPTS
// =====================================================

function buildGenerationPrompt(
    request: PresentationRequest,
    designTokens: DesignTokens,
    knowledgeContext?: string,
    bestLayouts?: string[]
): string {
    const layoutList = bestLayouts?.length
        ? bestLayouts.join(', ')
        : designTokens.preferredLayouts.join(', ');

    const layoutDescriptions = Object.entries(LAYOUT_DESCRIPTIONS)
        .map(([key, desc]) => `- "${key}": ${desc}`)
        .join('\n');

    return `You are an expert presentation designer creating a SlideJSON presentation.

## TASK
Create a professional presentation about: "${request.topic}"
${request.audience ? `Target audience: ${request.audience}` : ''}
${request.goal ? `Goal: ${request.goal}` : ''}
${request.style ? `Style: ${request.style}` : 'Style: professional'}
Recommended slides: ${request.slideCount || 8}

## KNOWLEDGE CONTEXT
${knowledgeContext ? `Use this knowledge to inform the content:\n${knowledgeContext}` : 'Generate content based on general knowledge about the topic.'}

## DESIGN TOKENS (apply these consistently)
- Primary Color: ${designTokens.primaryColor}
- Accent Color: ${designTokens.accentColor}
- Image Style: ${designTokens.imageStyle}
- Fonts: ${designTokens.fontHeading} (headings), ${designTokens.fontBody} (body)

## PREFERRED LAYOUTS
Based on past performance, prefer these layouts: ${layoutList}

## AVAILABLE LAYOUTS
${layoutDescriptions}

## OUTPUT FORMAT
Return ONLY valid JSON matching this exact structure (no markdown, no explanation):

{
  "id": "pres_<random_id>",
  "version": "1.0",
  "title": "<presentation title>",
  "topic": "<topic category>",
  "audience": "<target audience>",
  "goal": "<presentation goal>",
  "slides": [
    {
      "id": "slide_001",
      "layout": "<layout_type>",
      "title": "<slide title>",
      "subtitle": "<optional subtitle>",
      "content": {
        "type": "<content_type: text|bullet-list|statistics|comparison|quote>",
        // For bullet-list:
        "items": [{"icon": "<lucide-icon>", "text": "<item text>"}],
        // For statistics:
        "stats": [{"value": "40%", "label": "Reduction in errors", "trend": "down"}],
        // For comparison:
        "columns": [{"title": "Before", "items": ["point1", "point2"]}],
        // For quote:
        "quote": "<quote text>",
        "attribution": "<author>"
      },
      "image": {
        "type": "ai-generated",
        "aiPrompt": "<detailed image prompt in style: ${designTokens.imageStyle}>",
        "position": "<background|left|right|center>"
      },
      "background": {
        "type": "gradient",
        "colors": ["${designTokens.primaryColor}", "${designTokens.secondaryColor}"]
      },
      "notes": "<speaker notes>",
      "topicKeywords": ["<keyword1>", "<keyword2>"]
    }
  ],
  "slideCount": <number>,
  "designTokens": ${JSON.stringify(designTokens)},
  "generatedAt": "<ISO timestamp>",
  "generatedBy": "gemini-flash"
}

## RULES
1. Create exactly ${request.slideCount || 8} slides
2. Start with a title-centered opening slide
3. End with a call-to-action or summary slide
4. Use varied layouts - don't repeat the same layout consecutively
5. Every content slide should have an image with a detailed aiPrompt
6. Image prompts must include style keywords: "${designTokens.imageStyle}"
7. Include speaker notes for each slide
8. Add topicKeywords for learning/analytics
9. Use bullet-list for info-heavy slides, statistics for data, quote for impact
10. Make content engaging and actionable`;
}

// =====================================================
// MAIN GENERATION FUNCTION
// =====================================================

export async function generatePresentation(
    request: PresentationRequest
): Promise<PresentationResponse> {
    console.log('[PresentationEngine] Starting generation for:', request.topic);

    try {
        // 1. Get design tokens for this product
        const designTokens = await getDesignTokens(request.productId);
        console.log('[PresentationEngine] Got design tokens');

        // 2. Get best performing layouts for similar topics
        const bestLayouts = await getBestLayouts(request.productId, request.topic);
        console.log('[PresentationEngine] Best layouts:', bestLayouts);

        // 3. Build the generation prompt
        const prompt = buildGenerationPrompt(
            request,
            designTokens,
            request.knowledgeContext,
            bestLayouts
        );

        // 4. Generate with Gemini
        console.log('[PresentationEngine] Calling Gemini...');
        const response = await generateContentWithGeminiFlash(prompt, {
            temperature: 0.7,
            maxOutputTokens: 8192
        });

        // 5. Parse the JSON response
        const presentation = parseSlideJSON(response, designTokens, request);

        if (!presentation) {
            throw new Error('Failed to parse generated presentation');
        }

        console.log('[PresentationEngine] Generated', presentation.slides.length, 'slides');

        // 6. Generate quality scores
        const qualityScores = await scorePresentation(presentation);
        presentation.qualityScores = qualityScores;

        // 7. Generate fallback markdown for Reveal.js
        const markdown = convertToMarkdown(presentation);

        return {
            success: true,
            presentation,
            markdown,
            qualityScores
        };

    } catch (error) {
        console.error('[PresentationEngine] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function getDesignTokens(productId: string): Promise<DesignTokens> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.warn('[PresentationEngine] Supabase not configured, using defaults');
            return DEFAULT_DESIGN_TOKENS;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase.rpc('get_or_create_design_tokens', {
            p_product_id: productId
        });

        if (error || !data) {
            console.warn('[PresentationEngine] Could not get design tokens:', error);
            return DEFAULT_DESIGN_TOKENS;
        }

        return {
            primaryColor: data.primary_color || DEFAULT_DESIGN_TOKENS.primaryColor,
            secondaryColor: data.secondary_color || DEFAULT_DESIGN_TOKENS.secondaryColor,
            accentColor: data.accent_color || DEFAULT_DESIGN_TOKENS.accentColor,
            backgroundColor: data.background_color || DEFAULT_DESIGN_TOKENS.backgroundColor,
            textColor: data.text_color || DEFAULT_DESIGN_TOKENS.textColor,
            fontHeading: data.font_heading || DEFAULT_DESIGN_TOKENS.fontHeading,
            fontBody: data.font_body || DEFAULT_DESIGN_TOKENS.fontBody,
            fontSizeBase: data.font_size_base || DEFAULT_DESIGN_TOKENS.fontSizeBase,
            preferredLayouts: data.preferred_layouts || DEFAULT_DESIGN_TOKENS.preferredLayouts,
            imageStyle: data.image_style || DEFAULT_DESIGN_TOKENS.imageStyle,
            learnedPreferences: data.learned_preferences || {}
        };
    } catch (error) {
        console.error('[PresentationEngine] Error getting design tokens:', error);
        return DEFAULT_DESIGN_TOKENS;
    }
}

async function getBestLayouts(productId: string, topic: string): Promise<string[]> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return [];
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Extract topic category (simple keyword extraction)
        const topicCategory = topic.toLowerCase().split(' ')[0];

        const { data, error } = await supabase.rpc('get_best_layouts_for_topic', {
            p_product_id: productId,
            p_topic_category: topicCategory,
            p_limit: 5
        });

        if (error || !data) {
            return [];
        }

        return data.map((row: { layout_type: string }) => row.layout_type);
    } catch {
        return [];
    }
}

function parseSlideJSON(
    response: string,
    designTokens: DesignTokens,
    request: PresentationRequest
): SlideJSONPresentation | null {
    try {
        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = response.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        const parsed = JSON.parse(jsonStr);

        // Validate and normalize
        const presentation: SlideJSONPresentation = {
            id: parsed.id || `pres_${Date.now()}`,
            version: '1.0',
            title: parsed.title || request.topic,
            topic: parsed.topic || request.topic,
            audience: parsed.audience || request.audience,
            goal: parsed.goal || request.goal,
            designTokens: designTokens,
            slides: validateSlides(parsed.slides || []),
            slideCount: parsed.slides?.length || 0,
            generatedAt: new Date().toISOString(),
            generatedBy: 'gemini-flash'
        };

        return presentation;
    } catch (error) {
        console.error('[PresentationEngine] JSON parse error:', error);
        console.error('[PresentationEngine] Raw response:', response.substring(0, 500));
        return null;
    }
}

function validateSlides(slides: Slide[]): Slide[] {
    return slides.map((slide, index) => ({
        id: slide.id || `slide_${String(index + 1).padStart(3, '0')}`,
        layout: slide.layout || 'bullet-list',
        title: slide.title || '',
        subtitle: slide.subtitle,
        content: slide.content,
        image: slide.image,
        background: slide.background,
        notes: slide.notes,
        topicKeywords: slide.topicKeywords || []
    }));
}

// =====================================================
// MARKDOWN CONVERTER (for Reveal.js fallback)
// =====================================================

export function convertToMarkdown(presentation: SlideJSONPresentation): string {
    const slides: string[] = [];

    for (const slide of presentation.slides) {
        let md = '';

        // Background image
        if (slide.image?.position === 'background' && slide.image.aiPrompt) {
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(slide.image.aiPrompt)}?width=1920&height=1080&nologo=true`;
            md += `![bg](${imageUrl})\n\n`;
        }

        // Title
        if (slide.title) {
            md += `# ${slide.title}\n\n`;
        }

        // Subtitle
        if (slide.subtitle) {
            md += `*${slide.subtitle}*\n\n`;
        }

        // Content based on type
        if (slide.content) {
            switch (slide.content.type) {
                case 'bullet-list':
                    slide.content.items?.forEach(item => {
                        md += `- **${item.text}**\n`;
                    });
                    break;

                case 'numbered-list':
                    slide.content.items?.forEach((item, i) => {
                        md += `${i + 1}. ${item.text}\n`;
                    });
                    break;

                case 'statistics':
                    slide.content.stats?.forEach(stat => {
                        md += `### ${stat.value}\n${stat.label}\n\n`;
                    });
                    break;

                case 'quote':
                    md += `> ${slide.content.quote}\n\n`;
                    if (slide.content.attribution) {
                        md += `— *${slide.content.attribution}*\n`;
                    }
                    break;

                case 'comparison':
                    if (slide.content.columns && slide.content.columns.length >= 2) {
                        md += `| ${slide.content.columns[0].title} | ${slide.content.columns[1].title} |\n`;
                        md += `| --- | --- |\n`;
                        const maxItems = Math.max(
                            slide.content.columns[0].items?.length || 0,
                            slide.content.columns[1].items?.length || 0
                        );
                        for (let i = 0; i < maxItems; i++) {
                            md += `| ${slide.content.columns[0].items?.[i] || ''} | ${slide.content.columns[1].items?.[i] || ''} |\n`;
                        }
                    }
                    break;

                case 'text':
                    md += `${slide.content.text}\n`;
                    break;
            }
        }

        // Side image (not background)
        if (slide.image && slide.image.position !== 'background' && slide.image.aiPrompt) {
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(slide.image.aiPrompt)}?width=800&height=600&nologo=true`;
            md += `\n![](${imageUrl})\n`;
        }

        // Speaker notes
        if (slide.notes) {
            md += `\nNote: ${slide.notes}\n`;
        }

        slides.push(md);
    }

    return slides.join('\n---\n\n');
}

// =====================================================
// QUALITY SCORING ENGINE
// =====================================================

async function scorePresentation(
    presentation: SlideJSONPresentation
): Promise<{ overall: number; content: number; design: number; narrative: number; accessibility: number }> {
    // Score components
    let contentScore = 0;
    let designScore = 0;
    let narrativeScore = 0;
    let accessibilityScore = 0;

    const slides = presentation.slides;
    const slideCount = slides.length;

    // Content scoring (0-100)
    // - Has enough content per slide
    // - Balanced text length
    // - No empty slides
    let totalContentPoints = 0;
    for (const slide of slides) {
        let slidePoints = 0;

        // Has title
        if (slide.title && slide.title.length > 3) slidePoints += 20;

        // Has content
        if (slide.content) {
            if (slide.content.items && slide.content.items.length >= 3) slidePoints += 30;
            else if (slide.content.stats && slide.content.stats.length >= 2) slidePoints += 30;
            else if (slide.content.quote) slidePoints += 25;
            else if (slide.content.text && slide.content.text.length > 20) slidePoints += 20;
        }

        // Has image
        if (slide.image) slidePoints += 25;

        // Has background
        if (slide.background) slidePoints += 10;

        // Has notes
        if (slide.notes) slidePoints += 15;

        totalContentPoints += Math.min(slidePoints, 100);
    }
    contentScore = slideCount > 0 ? totalContentPoints / slideCount : 0;

    // Design scoring (0-100)
    // - Layout variety
    // - Consistent design tokens
    // - Good image prompts
    const usedLayouts = new Set(slides.map(s => s.layout));
    const layoutVariety = Math.min((usedLayouts.size / slideCount) * 100, 100);

    // Check for consecutive same layouts (bad)
    let consecutiveSame = 0;
    for (let i = 1; i < slides.length; i++) {
        if (slides[i].layout === slides[i - 1].layout) consecutiveSame++;
    }
    const layoutFlow = Math.max(0, 100 - (consecutiveSame * 20));

    // Image quality (has detailed prompts)
    const imageCount = slides.filter(s => s.image?.aiPrompt && s.image.aiPrompt.length > 30).length;
    const imageQuality = (imageCount / slideCount) * 100;

    designScore = (layoutVariety * 0.3) + (layoutFlow * 0.4) + (imageQuality * 0.3);

    // Narrative scoring (0-100)
    // - Has opening slide
    // - Has closing/CTA
    // - Logical flow
    let narrativePoints = 0;

    // Opening slide
    if (slides[0]?.layout === 'title-centered' || slides[0]?.layout === 'title-subtitle') {
        narrativePoints += 25;
    }

    // Closing slide
    const lastSlide = slides[slides.length - 1];
    if (lastSlide?.layout === 'title-centered' || lastSlide?.content?.type === 'quote') {
        narrativePoints += 25;
    }

    // Has section breaks for long presentations
    if (slideCount > 6) {
        const hasSectionBreak = slides.some(s => s.layout === 'section-break');
        if (hasSectionBreak) narrativePoints += 20;
    } else {
        narrativePoints += 20; // Short presentations don't need section breaks
    }

    // Good slide count
    if (slideCount >= 5 && slideCount <= 12) {
        narrativePoints += 30;
    } else if (slideCount >= 3 && slideCount <= 15) {
        narrativePoints += 20;
    }

    narrativeScore = narrativePoints;

    // Accessibility scoring (0-100)
    // - Reasonable title lengths
    // - Not too much text per slide
    // - Good contrast (assumed from design tokens)
    let accessibilityPoints = 0;

    // Title lengths (not too long)
    const goodTitles = slides.filter(s => s.title && s.title.length <= 60).length;
    accessibilityPoints += (goodTitles / slideCount) * 40;

    // Content not overwhelming
    const goodContent = slides.filter(s => {
        if (!s.content) return true;
        if (s.content.items && s.content.items.length <= 6) return true;
        if (s.content.stats && s.content.stats.length <= 4) return true;
        return true;
    }).length;
    accessibilityPoints += (goodContent / slideCount) * 30;

    // Has speaker notes (good for accessibility)
    const hasNotes = slides.filter(s => s.notes).length;
    accessibilityPoints += (hasNotes / slideCount) * 30;

    accessibilityScore = accessibilityPoints;

    // Overall score (weighted average)
    const overall = (
        contentScore * 0.35 +
        designScore * 0.25 +
        narrativeScore * 0.25 +
        accessibilityScore * 0.15
    );

    return {
        overall: Math.round(overall),
        content: Math.round(contentScore),
        design: Math.round(designScore),
        narrative: Math.round(narrativeScore),
        accessibility: Math.round(accessibilityScore)
    };
}

export default {
    generatePresentation,
    convertToMarkdown
};
