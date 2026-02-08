'use client';

/**
 * 🎴 useGammaChat Hook
 * Easily generate presentations from chat context
 */

import { useState, useCallback } from 'react';
import type { GammaPresentation, GammaCard, ContentBlock } from '@/lib/gamma/types';
import { getThemeById, BUILTIN_THEMES } from '@/lib/gamma/themes';
import { parsePresentationRequest, getPresentationSystemPrompt } from './GammaChatIntegration';

interface UseGammaChatOptions {
    apiEndpoint?: string;
    defaultTheme?: string;
}

interface UseGammaChatReturn {
    isGenerating: boolean;
    currentTopic: string | null;
    error: string | null;
    generateFromMessage: (message: string) => Promise<GammaPresentation | null>;
    generatePresentation: (options: GenerateOptions) => Promise<GammaPresentation | null>;
    shouldHandleMessage: (message: string) => boolean;
}

interface GenerateOptions {
    topic: string;
    cardCount?: number;
    themeId?: string;
    audience?: string;
    tone?: string;
}

export function useGammaChat(options: UseGammaChatOptions = {}): UseGammaChatReturn {
    const { apiEndpoint = '/api/ai/generate', defaultTheme = 'midnight' } = options;

    const [isGenerating, setIsGenerating] = useState(false);
    const [currentTopic, setCurrentTopic] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const shouldHandleMessage = useCallback((message: string): boolean => {
        const result = parsePresentationRequest(message);
        return result.shouldGenerate;
    }, []);

    const generateFromMessage = useCallback(async (message: string): Promise<GammaPresentation | null> => {
        const parsed = parsePresentationRequest(message);

        if (!parsed.shouldGenerate || !parsed.topic) {
            return null;
        }

        return generatePresentation({
            topic: parsed.topic,
            cardCount: parsed.cardCount,
            themeId: parsed.theme,
            audience: parsed.audience,
            tone: parsed.tone,
        });
    }, []);

    const generatePresentation = useCallback(async (genOptions: GenerateOptions): Promise<GammaPresentation | null> => {
        const { topic, cardCount = 5, themeId = defaultTheme, audience = 'general audience', tone = 'professional' } = genOptions;

        setIsGenerating(true);
        setCurrentTopic(topic);
        setError(null);

        try {
            // Get the theme
            const theme = getThemeById(themeId) || BUILTIN_THEMES[0];

            // Build the prompt
            const userPrompt = `Create a ${cardCount}-card presentation about "${topic}" for ${audience}. 
The tone should be ${tone}.

Generate a complete presentation with:
1. A compelling title slide
2. ${cardCount - 2} content slides with relevant information
3. A conclusion/summary slide

Use varied layouts appropriate for the content type. Include speaker notes for each card.

Return ONLY valid JSON following the presentation schema.`;

            // Call the AI API
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: getPresentationSystemPrompt() },
                        { role: 'user', content: userPrompt }
                    ],
                    model: 'gemini-2.0-flash-exp',
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            let content = data.content || data.message?.content || data.choices?.[0]?.message?.content;

            // Extract JSON from the response
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                content.match(/(\{[\s\S]*\})/);

            if (!jsonMatch) {
                throw new Error('Could not parse presentation JSON from response');
            }

            const presentationData = JSON.parse(jsonMatch[1]);

            // Build the full presentation object
            const presentation: GammaPresentation = {
                id: `gamma-${Date.now()}`,
                title: presentationData.title || topic,
                description: presentationData.description || `A presentation about ${topic}`,
                theme,
                cards: presentationData.cards.map((card: any, index: number) => ({
                    id: `card-${Date.now()}-${index}`,
                    title: card.title || `Card ${index + 1}`,
                    layout: card.layout || 'single-column',
                    blocks: (card.blocks || []).map((block: any, blockIndex: number) => ({
                        id: `block-${Date.now()}-${index}-${blockIndex}`,
                        type: block.type,
                        content: block.content,
                        position: block.position,
                        style: block.style,
                    })),
                    speakerNotes: card.speakerNotes,
                    background: card.background,
                })),
                settings: {
                    aspectRatio: '16:9',
                    defaultTransition: 'fade',
                    transitionDuration: 0.5,
                    showProgress: true,
                    autoPlay: false,
                    autoPlayInterval: 5000,
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Generate AI images for cards that need them
            await generateCardImages(presentation);

            setIsGenerating(false);
            setCurrentTopic(null);
            return presentation;

        } catch (err) {
            console.error('Presentation generation failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate presentation');
            setIsGenerating(false);
            setCurrentTopic(null);

            // Return a fallback presentation on error
            return createFallbackPresentation(topic, themeId);
        }
    }, [apiEndpoint, defaultTheme]);

    return {
        isGenerating,
        currentTopic,
        error,
        generateFromMessage,
        generatePresentation,
        shouldHandleMessage,
    };
}

/**
 * Generate AI images for cards that could use them
 */
async function generateCardImages(presentation: GammaPresentation): Promise<void> {
    const cardsNeedingImages = presentation.cards.filter(card => {
        // Cards with accent layouts or gallery layouts should have images
        return ['accent-left', 'accent-right', 'full-bleed', 'gallery'].includes(card.layout);
    });

    for (const card of cardsNeedingImages) {
        try {
            // Check if card already has an image block
            const hasImage = card.blocks.some(b => b.type === 'image');
            if (hasImage) continue;

            // Generate a prompt based on card content
            const headingBlock = card.blocks.find(b => b.type === 'heading');
            const heading = headingBlock ? (headingBlock.content as { text: string }).text : card.title;

            // Use Pollinations AI for image generation
            const imagePrompt = encodeURIComponent(`${heading}, professional presentation visual, clean modern design, abstract`);
            const imageUrl = `https://image.pollinations.ai/prompt/${imagePrompt}?width=800&height=600&nologo=true`;

            // Add image block to card
            const imageBlock: ContentBlock = {
                id: `img-${Date.now()}-${card.id}`,
                type: 'image',
                content: {
                    src: imageUrl,
                    alt: heading,
                    fit: 'cover',
                },
            };

            // Insert at the beginning for accent layouts
            if (card.layout === 'accent-left') {
                card.blocks.unshift(imageBlock);
            } else {
                card.blocks.push(imageBlock);
            }

        } catch (err) {
            console.warn('Failed to generate image for card:', card.id, err);
        }
    }
}

/**
 * Create a basic fallback presentation when AI generation fails
 */
function createFallbackPresentation(topic: string, themeId: string): GammaPresentation {
    const theme = getThemeById(themeId) || BUILTIN_THEMES[0];

    return {
        id: `gamma-fallback-${Date.now()}`,
        title: topic,
        description: `A presentation about ${topic}`,
        theme,
        cards: [
            {
                id: `card-${Date.now()}-0`,
                title: topic,
                layout: 'title-centered',
                blocks: [
                    {
                        id: `block-${Date.now()}-0-0`,
                        type: 'heading',
                        content: { text: topic, level: 1 },
                    },
                    {
                        id: `block-${Date.now()}-0-1`,
                        type: 'paragraph',
                        content: { html: '<p>An AI-generated presentation</p>' },
                    },
                ],
                speakerNotes: 'Welcome your audience and introduce the topic.',
            },
            {
                id: `card-${Date.now()}-1`,
                title: 'Overview',
                layout: 'single-column',
                blocks: [
                    {
                        id: `block-${Date.now()}-1-0`,
                        type: 'heading',
                        content: { text: 'Overview', level: 2 },
                    },
                    {
                        id: `block-${Date.now()}-1-1`,
                        type: 'bullet-list',
                        content: {
                            items: [
                                'Key Point 1 - Introduction to the topic',
                                'Key Point 2 - Main concepts and ideas',
                                'Key Point 3 - Practical applications',
                                'Key Point 4 - Summary and conclusions',
                            ],
                            ordered: false,
                        },
                    },
                ],
                speakerNotes: 'Outline the main points you will cover.',
            },
            {
                id: `card-${Date.now()}-2`,
                title: 'Thank You',
                layout: 'title-centered',
                blocks: [
                    {
                        id: `block-${Date.now()}-2-0`,
                        type: 'heading',
                        content: { text: 'Thank You!', level: 1 },
                    },
                    {
                        id: `block-${Date.now()}-2-1`,
                        type: 'paragraph',
                        content: { html: '<p>Questions?</p>' },
                    },
                ],
                speakerNotes: 'Thank your audience and open the floor for questions.',
            },
        ],
        settings: {
            aspectRatio: '16:9',
            defaultTransition: 'fade',
            transitionDuration: 0.5,
            showProgress: true,
            autoPlay: false,
            autoPlayInterval: 5000,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

export default useGammaChat;
