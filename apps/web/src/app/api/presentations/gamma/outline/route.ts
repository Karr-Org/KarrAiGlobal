/**
 * 🎯 Gamma Outline Generation API
 * Generates a structured outline for presentations based on topic
 * Returns editable card list with suggested layouts and image positions
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

interface OutlineCard {
    id: string;
    title: string;
    description: string;
    hasImage: boolean;
    imageType: 'hero' | 'side' | 'background' | 'icon' | 'none';
    suggestedLayout: string;
}

interface OutlineRequest {
    topic: string;
    cardCount: number;
    tone: string;
}

// Tone-specific prompts
const TONE_INSTRUCTIONS: Record<string, string> = {
    professional: 'Use formal, business-appropriate language. Focus on data and facts.',
    casual: 'Use friendly, conversational language. Keep it approachable.',
    inspiring: 'Use motivational, uplifting language. Focus on vision and possibilities.',
    educational: 'Use clear, instructive language. Focus on teaching and explaining.',
    persuasive: 'Use compelling, convincing language. Focus on benefits and value.',
    storytelling: 'Use narrative-driven language. Focus on journey and transformation.'
};

// Layout suggestions based on card position and content
function getSuggestedLayout(index: number, totalCards: number, hasImage: boolean): string {
    if (index === 0) return hasImage ? 'gamma-title-hero' : 'gamma-title-gradient';
    if (index === totalCards - 1) return 'gamma-cta-gradient';
    if (hasImage) return 'gamma-content-split-right';
    return 'gamma-content-bullets';
}

// Image position based on layout
function getImageType(index: number, totalCards: number): 'hero' | 'side' | 'background' | 'none' {
    if (index === 0) return 'hero';
    if (index === totalCards - 1) return 'background';
    // Every other card gets an image
    return index % 2 === 0 ? 'side' : 'none';
}

export async function POST(request: NextRequest) {
    try {
        const { topic, cardCount, tone }: OutlineRequest = await request.json();

        if (!topic || !cardCount) {
            return NextResponse.json(
                { error: 'Topic and card count are required' },
                { status: 400 }
            );
        }

        const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.professional;

        const prompt = `You are a presentation outline expert. Create a ${cardCount}-card presentation outline about: "${topic}"

Tone: ${toneInstruction}

Generate exactly ${cardCount} cards with titles and brief descriptions.

Rules:
1. First card should be an attention-grabbing title/introduction
2. Last card should be a call-to-action or summary
3. Middle cards should flow logically and build the narrative
4. Keep titles short (3-6 words)
5. Descriptions should be 1 sentence max, explaining what this card covers

Respond ONLY with a JSON array in this exact format:
[
  { "title": "Card Title", "description": "Brief description of what this card covers" },
  ...
]`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Add 30 second timeout to prevent infinite hang
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI generation timed out after 30 seconds')), 30000)
        );

        let text: string;
        try {
            const result = await Promise.race([
                model.generateContent(prompt),
                timeoutPromise
            ]);
            const response = await result.response;
            text = response.text();
        } catch (aiError) {
            console.warn('[Outline API] AI call failed or timed out:', aiError);
            // Use fallback outline
            const fallbackOutline = generateFallbackOutline(topic, cardCount);
            const fallbackCards = fallbackOutline.map((card, index) => ({
                id: `card-${Date.now()}-${index}`,
                title: card.title,
                description: card.description,
                hasImage: index % 2 === 0,
                imageType: index === 0 ? 'hero' as const : index % 2 === 0 ? 'side' as const : 'none' as const,
                suggestedLayout: getSuggestedLayout(index, cardCount, index % 2 === 0)
            }));
            return NextResponse.json({
                success: true,
                outline: fallbackCards,
                metadata: { topic, cardCount, tone, generatedAt: new Date().toISOString(), fallback: true }
            });
        }

        // Parse AI response
        let parsedOutline: { title: string; description: string }[] = [];

        try {
            // Clean up the response
            let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const jsonStart = cleaned.indexOf('[');
            const jsonEnd = cleaned.lastIndexOf(']');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
            }
            parsedOutline = JSON.parse(cleaned);
        } catch (parseError) {
            console.error('Failed to parse AI outline:', parseError);
            // Fallback outline
            parsedOutline = generateFallbackOutline(topic, cardCount);
        }

        // Ensure we have the right number of cards
        while (parsedOutline.length < cardCount) {
            parsedOutline.push({
                title: `Section ${parsedOutline.length + 1}`,
                description: 'Additional content'
            });
        }
        parsedOutline = parsedOutline.slice(0, cardCount);

        // Transform to full outline with IDs, layouts, and image info
        const outline: OutlineCard[] = parsedOutline.map((card, index) => {
            const imageType = getImageType(index, cardCount);
            const hasImage = imageType !== 'none';

            return {
                id: `card-${Date.now()}-${index}`,
                title: card.title,
                description: card.description,
                hasImage,
                imageType,
                suggestedLayout: getSuggestedLayout(index, cardCount, hasImage)
            };
        });

        return NextResponse.json({
            success: true,
            outline,
            metadata: {
                topic,
                cardCount,
                tone,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Outline generation error:', error);

        // Return fallback outline on error
        const { topic, cardCount } = await request.json().catch(() => ({ topic: '', cardCount: 7 }));
        const fallbackOutline = generateFallbackOutline(topic, cardCount);

        return NextResponse.json({
            success: true,
            outline: fallbackOutline.map((card, index) => ({
                id: `card-${Date.now()}-${index}`,
                title: card.title,
                description: card.description,
                hasImage: index % 2 === 0,
                imageType: index === 0 ? 'hero' : index % 2 === 0 ? 'side' : 'none',
                suggestedLayout: index === 0 ? 'gamma-title-gradient' : 'gamma-content-bullets'
            })),
            metadata: {
                topic,
                cardCount,
                fallback: true
            }
        });
    }
}

// Generate fallback outline when AI fails
function generateFallbackOutline(topic: string, cardCount: number): { title: string; description: string }[] {
    const baseOutlines: Record<number, { title: string; description: string }[]> = {
        5: [
            { title: 'Introduction', description: 'Opening slide with key message' },
            { title: 'The Challenge', description: 'Problem or opportunity being addressed' },
            { title: 'Our Approach', description: 'How we tackle this' },
            { title: 'Key Benefits', description: 'Main advantages and outcomes' },
            { title: 'Next Steps', description: 'Call to action' }
        ],
        7: [
            { title: 'Introduction', description: 'Opening slide with key message' },
            { title: 'The Problem', description: 'Challenge being addressed' },
            { title: 'Our Solution', description: 'How we solve it' },
            { title: 'How It Works', description: 'Process overview' },
            { title: 'Key Features', description: 'Main benefits and capabilities' },
            { title: 'Results', description: 'Impact and outcomes' },
            { title: 'Get Started', description: 'Call to action' }
        ],
        10: [
            { title: 'Welcome', description: 'Opening slide with key message' },
            { title: 'The Problem', description: 'Challenge being addressed' },
            { title: 'Market Opportunity', description: 'Size and potential' },
            { title: 'Our Solution', description: 'How we solve it' },
            { title: 'Key Features', description: 'Main capabilities' },
            { title: 'How It Works', description: 'Process overview' },
            { title: 'Benefits', description: 'Value proposition' },
            { title: 'Case Study', description: 'Success story' },
            { title: 'The Team', description: 'Who we are' },
            { title: 'Next Steps', description: 'Call to action' }
        ]
    };

    // Get the closest matching outline
    const counts = Object.keys(baseOutlines).map(Number).sort((a, b) => a - b);
    const closestCount = counts.reduce((prev, curr) =>
        Math.abs(curr - cardCount) < Math.abs(prev - cardCount) ? curr : prev
    );

    let outline = [...baseOutlines[closestCount]];

    // Adjust to match requested count
    while (outline.length < cardCount) {
        const insertPoint = Math.floor(outline.length / 2);
        outline.splice(insertPoint, 0, {
            title: `Section ${outline.length + 1}`,
            description: 'Additional content'
        });
    }

    return outline.slice(0, cardCount);
}
