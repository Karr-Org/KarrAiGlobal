/**
 * 🤖 AI Presentation Generator
 * Generates Gamma-style presentations using Gemini
 */

import {
    GammaPresentation,
    GammaCard,
    ContentBlock,
    GenerationRequest,
    GenerationOutline,
    OutlineCard,
    CardLayout,
    BlockType
} from './types';
import { BUILTIN_THEMES, getThemeById } from './themes';
import { SMART_LAYOUTS, recommendLayouts, getLayoutById } from './layouts';

// ============================================
// OUTLINE GENERATION
// ============================================

export async function generateOutline(request: GenerationRequest): Promise<GenerationOutline> {
    const prompt = `You are a professional presentation designer. Create an outline for a presentation.

Topic: ${request.topic}
Target Audience: ${request.audience}
Tone: ${request.tone}
Number of Cards: ${request.cardCount}
${request.existingContent ? `\nExisting Content to incorporate:\n${request.existingContent}` : ''}

Create a structured outline with the following JSON format:
{
    "title": "Presentation title",
    "cards": [
        {
            "title": "Card title",
            "layout": "<one of: title-centered, single-column, two-column, accent-left, accent-right, full-bleed, stats, comparison, quote, features, timeline>",
            "keyPoints": ["point 1", "point 2", "point 3"],
            "suggestedImage": "Brief description of ideal image for this card",
            "speakerNotes": "What the presenter should say"
        }
    ],
    "suggestedTheme": "<one of: midnight, obsidian, aurora, clean, cream, forest, professional, neon, sunset, mono, swiss>"
}

Rules:
1. First card should use "title-centered" layout
2. Last card should be a summary or call-to-action
3. Use varied layouts to keep the presentation engaging
4. Each card should have 2-4 key points
5. Image descriptions should be specific and evocative
6. Speaker notes should be conversational, not scripted
7. Choose theme based on topic and audience (dark themes for tech, light for corporate)

Return ONLY the JSON, no markdown formatting.`;

    try {
        const response = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, format: 'json' })
        });

        const data = await response.json();
        return JSON.parse(data.response);
    } catch (error) {
        console.error('Outline generation failed:', error);
        // Return a default outline
        return generateFallbackOutline(request);
    }
}

function generateFallbackOutline(request: GenerationRequest): GenerationOutline {
    const cards: OutlineCard[] = [
        {
            title: request.topic,
            layout: 'title-centered',
            keyPoints: [`Presented for ${request.audience}`],
            suggestedImage: 'Modern abstract background',
            speakerNotes: 'Welcome everyone to this presentation.'
        },
    ];

    for (let i = 1; i < request.cardCount - 1; i++) {
        cards.push({
            title: `Section ${i}`,
            layout: i % 2 === 0 ? 'accent-right' : 'accent-left',
            keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
            suggestedImage: 'Relevant illustration',
            speakerNotes: `Discuss section ${i}`
        });
    }

    cards.push({
        title: 'Thank You',
        layout: 'title-centered',
        keyPoints: ['Questions?', 'Contact information'],
        suggestedImage: 'Thank you background',
        speakerNotes: 'Thank you for your attention.'
    });

    return {
        title: request.topic,
        cards,
        suggestedTheme: 'midnight'
    };
}

// ============================================
// FULL PRESENTATION GENERATION
// ============================================

export async function generatePresentation(
    request: GenerationRequest,
    outline?: GenerationOutline
): Promise<GammaPresentation> {
    // Get or generate outline
    const finalOutline = outline || await generateOutline(request);

    // Generate cards in parallel
    const cardPromises = finalOutline.cards.map((outlineCard, index) =>
        generateCard(outlineCard, index, request, finalOutline)
    );

    const cards = await Promise.all(cardPromises);

    // Get theme
    const theme = getThemeById(finalOutline.suggestedTheme);

    return {
        id: crypto.randomUUID(),
        title: finalOutline.title,
        description: `Presentation about ${request.topic} for ${request.audience}`,
        productId: request.productId,
        userId: request.userId,
        cards,
        theme,
        metadata: {
            wordCount: calculateWordCount(cards),
            estimatedDuration: Math.ceil(cards.length * 1.5),
            slideCount: cards.length,
            version: 1
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

async function generateCard(
    outlineCard: OutlineCard,
    index: number,
    request: GenerationRequest,
    outline: GenerationOutline
): Promise<GammaCard> {
    const blocks: ContentBlock[] = [];
    const layout = outlineCard.layout as CardLayout;

    // Generate content based on layout
    if (layout === 'title-centered') {
        blocks.push(createHeadingBlock(outlineCard.title, 1));
        if (index === 0 && request.audience) {
            blocks.push(createParagraphBlock(`For ${request.audience}`));
        } else if (outlineCard.keyPoints.length > 0) {
            blocks.push(createParagraphBlock(outlineCard.keyPoints[0]));
        }
    } else if (layout === 'stats') {
        blocks.push(createHeadingBlock(outlineCard.title, 2));
        // Generate stats from key points
        outlineCard.keyPoints.slice(0, 4).forEach((point, i) => {
            blocks.push(createStatBlock(point, i));
        });
    } else if (layout === 'quote') {
        blocks.push(createQuoteBlock(outlineCard.keyPoints[0] || outlineCard.title));
    } else {
        // Standard content cards
        blocks.push(createHeadingBlock(outlineCard.title, 2));

        if (outlineCard.keyPoints.length > 2) {
            blocks.push(createListBlock(outlineCard.keyPoints));
        } else {
            outlineCard.keyPoints.forEach(point => {
                blocks.push(createParagraphBlock(point));
            });
        }

        // Add image for accent layouts
        if (layout.includes('accent') || layout === 'full-bleed') {
            blocks.push(await createImageBlock(outlineCard.suggestedImage || outlineCard.title, request.style));
        }
    }

    return {
        id: crypto.randomUUID(),
        type: 'card',
        title: outlineCard.title,
        layout,
        blocks,
        speakerNotes: outlineCard.speakerNotes,
        transition: index === 0 ? 'none' : 'slide-up'
    };
}

// ============================================
// BLOCK CREATORS
// ============================================

function createHeadingBlock(text: string, level: 1 | 2 | 3 | 4 | 5 | 6): ContentBlock {
    return {
        id: crypto.randomUUID(),
        type: 'heading',
        content: { text, level }
    };
}

function createParagraphBlock(html: string): ContentBlock {
    return {
        id: crypto.randomUUID(),
        type: 'paragraph',
        content: { html: `<p>${html}</p>` }
    };
}

function createListBlock(items: string[]): ContentBlock {
    return {
        id: crypto.randomUUID(),
        type: 'bullet-list',
        content: { items, ordered: false }
    };
}

function createStatBlock(text: string, index: number): ContentBlock {
    // Try to extract numbers from the text
    const numberMatch = text.match(/(\d+(?:\.\d+)?%?)/);
    const value = numberMatch ? numberMatch[1] : `${(index + 1) * 25}%`;
    const label = text.replace(value, '').trim() || `Metric ${index + 1}`;

    return {
        id: crypto.randomUUID(),
        type: 'stat',
        content: {
            value,
            label,
            trend: 'up' as const
        }
    };
}

function createQuoteBlock(text: string): ContentBlock {
    return {
        id: crypto.randomUUID(),
        type: 'quote',
        content: {
            text,
            author: undefined,
            source: undefined
        }
    };
}

async function createImageBlock(description: string, style: string): Promise<ContentBlock> {
    // Generate image URL using Pollinations AI
    const prompt = `${description}, ${style}, professional presentation slide, high quality, clean`;
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1920&height=1080&nologo=true`;

    return {
        id: crypto.randomUUID(),
        type: 'image',
        content: {
            src: imageUrl,
            alt: description,
            fit: 'cover',
            aiPrompt: prompt
        }
    };
}

// ============================================
// UTILITIES
// ============================================

function calculateWordCount(cards: GammaCard[]): number {
    let count = 0;
    for (const card of cards) {
        if (card.title) count += card.title.split(/\s+/).length;
        for (const block of card.blocks) {
            if (block.type === 'heading' || block.type === 'paragraph') {
                const text = (block.content as any).text || (block.content as any).html || '';
                count += text.replace(/<[^>]*>/g, '').split(/\s+/).length;
            } else if (block.type === 'bullet-list' || block.type === 'numbered-list') {
                const items = (block.content as any).items || [];
                for (const item of items) {
                    count += item.split(/\s+/).length;
                }
            }
        }
    }
    return count;
}

// ============================================
// AI EDITING
// ============================================

export async function aiRewriteContent(
    content: string,
    instruction: string,
    context: { cardTitle?: string; presentationTopic?: string }
): Promise<string> {
    const prompt = `Rewrite this presentation content based on the instruction.

Current content: "${content}"
Instruction: "${instruction}"
${context.cardTitle ? `Card title: ${context.cardTitle}` : ''}
${context.presentationTopic ? `Presentation topic: ${context.presentationTopic}` : ''}

Rules:
- Keep the same general length unless asked to expand/shorten
- Match the professional tone
- Maintain markdown formatting if present
- Return ONLY the rewritten content, no explanations`;

    try {
        const response = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();
        return data.response.trim();
    } catch (error) {
        console.error('AI rewrite failed:', error);
        return content;
    }
}

export async function aiExpandContent(content: string, targetLength: 'short' | 'medium' | 'long'): Promise<string> {
    const lengthGuide = {
        short: '2-3 sentences',
        medium: '1 paragraph (4-6 sentences)',
        long: '2-3 paragraphs'
    };

    return aiRewriteContent(content, `Expand this to ${lengthGuide[targetLength]} while keeping the core message`, {});
}

export async function aiSummarizeContent(content: string): Promise<string> {
    return aiRewriteContent(content, 'Summarize this to 1-2 concise sentences', {});
}

export async function aiChangeToне(content: string, tone: 'professional' | 'casual' | 'inspiring' | 'technical'): Promise<string> {
    return aiRewriteContent(content, `Rewrite in a ${tone} tone`, {});
}
