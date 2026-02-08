/**
 * 🖼️ Image Generation API
 * Supports multiple sources:
 * - AI Generated (Gemini/DALL-E placeholder)
 * - Pexels Stock Photos
 * - Unsplash (fallback)
 */

import { NextRequest, NextResponse } from 'next/server';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

interface ImageRequest {
    prompt: string;
    source: 'ai' | 'stock' | 'auto';
    style?: 'photo' | 'illustration' | 'abstract';
    orientation?: 'landscape' | 'portrait' | 'square';
}

interface ImageResult {
    url: string;
    thumbnailUrl?: string;
    source: 'ai' | 'pexels' | 'unsplash';
    prompt: string;
    photographer?: string;
    photographerUrl?: string;
    width?: number;
    height?: number;
}

// ==========================================
// PEXELS API
// ==========================================

async function searchPexels(query: string, orientation: string = 'landscape'): Promise<ImageResult | null> {
    if (!PEXELS_API_KEY) {
        console.log('Pexels API key not configured');
        return null;
    }

    try {
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=${orientation}`,
            {
                headers: {
                    'Authorization': PEXELS_API_KEY
                }
            }
        );

        if (!response.ok) {
            console.error('Pexels API error:', response.status);
            return null;
        }

        const data = await response.json();

        if (data.photos && data.photos.length > 0) {
            // Pick a random photo from results for variety
            const photo = data.photos[Math.floor(Math.random() * Math.min(5, data.photos.length))];
            return {
                url: photo.src.large2x || photo.src.large,
                thumbnailUrl: photo.src.medium,
                source: 'pexels',
                prompt: query,
                photographer: photo.photographer,
                photographerUrl: photo.photographer_url,
                width: photo.width,
                height: photo.height
            };
        }

        return null;
    } catch (error) {
        console.error('Pexels search failed:', error);
        return null;
    }
}

// ==========================================
// UNSPLASH API
// ==========================================

async function searchUnsplash(query: string, orientation: string = 'landscape'): Promise<ImageResult | null> {
    if (UNSPLASH_ACCESS_KEY) {
        try {
            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=${orientation}`,
                {
                    headers: {
                        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    const photo = data.results[Math.floor(Math.random() * Math.min(5, data.results.length))];
                    return {
                        url: photo.urls.regular,
                        thumbnailUrl: photo.urls.small,
                        source: 'unsplash',
                        prompt: query,
                        photographer: photo.user.name,
                        photographerUrl: photo.user.links.html,
                        width: photo.width,
                        height: photo.height
                    };
                }
            }
        } catch (error) {
            console.error('Unsplash search failed:', error);
        }
    }

    // Fallback to direct URL (no API key needed)
    const dimensions = orientation === 'landscape' ? '1200x800' : orientation === 'portrait' ? '800x1200' : '800x800';
    const [width, height] = dimensions.split('x').map(Number);

    return {
        url: `https://source.unsplash.com/${dimensions}/?${encodeURIComponent(query)}&sig=${Date.now()}`,
        source: 'unsplash',
        prompt: query,
        width,
        height
    };
}

// ==========================================
// AI IMAGE GENERATION (Placeholder for DALL-E, etc.)
// ==========================================

async function generateAIImage(prompt: string, style: string = 'photo'): Promise<ImageResult | null> {
    // TODO: Implement actual AI image generation
    // Options:
    // 1. OpenAI DALL-E API
    // 2. Stability AI (Stable Diffusion)
    // 3. Midjourney API
    // 4. Google Imagen

    // For now, use Pexels with enhanced prompt as placeholder
    const styleEnhancement = {
        photo: 'professional photography high quality',
        illustration: 'digital illustration modern',
        abstract: 'abstract artistic'
    };

    const enhancedPrompt = `${prompt} ${styleEnhancement[style as keyof typeof styleEnhancement] || ''}`;

    // Try Pexels first
    const pexelsResult = await searchPexels(enhancedPrompt);
    if (pexelsResult) {
        return {
            ...pexelsResult,
            source: 'ai' // Mark as AI placeholder
        };
    }

    // Fallback to Unsplash
    return searchUnsplash(prompt);
}

// ==========================================
// SMART SOURCE SELECTION
// ==========================================

function determineOptimalSource(prompt: string): 'ai' | 'stock' {
    const lowerPrompt = prompt.toLowerCase();

    // Keywords that work better with AI/illustration
    const aiKeywords = ['concept', 'abstract', 'futuristic', 'ai', 'digital', 'virtual',
        'creative', 'icon', 'symbol', 'diagram', 'chart', 'data visualization',
        'fantasy', 'imagination', 'surreal'];

    // Keywords that work better with stock photos
    const stockKeywords = ['team', 'office', 'people', 'meeting', 'workspace', 'city',
        'nature', 'building', 'person', 'business', 'professional',
        'portrait', 'landscape', 'real', 'authentic', 'corporate'];

    let aiScore = 0;
    let stockScore = 0;

    aiKeywords.forEach(kw => { if (lowerPrompt.includes(kw)) aiScore++; });
    stockKeywords.forEach(kw => { if (lowerPrompt.includes(kw)) stockScore++; });

    return aiScore > stockScore ? 'ai' : 'stock';
}

// ==========================================
// PROMPT ENHANCEMENT
// ==========================================

function enhancePrompt(prompt: string): string {
    // Remove common filler words
    const fillers = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
        'for', 'of', 'with', 'by', 'about', 'this', 'that', 'these', 'those'];

    let words = prompt
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !fillers.includes(w));

    // Keep only most relevant words (max 6)
    words = words.slice(0, 6);

    // Add quality modifier
    if (!words.includes('professional') && !words.includes('quality')) {
        words.push('professional');
    }

    return words.join(' ');
}

// ==========================================
// MAIN API ROUTE
// ==========================================

export async function POST(request: NextRequest) {
    try {
        const body: ImageRequest = await request.json();
        const { prompt, source = 'auto', style = 'photo', orientation = 'landscape' } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // Enhance the prompt
        const enhancedPrompt = enhancePrompt(prompt);

        // Determine actual source
        let actualSource = source;
        if (source === 'auto') {
            actualSource = determineOptimalSource(prompt);
        }

        let result: ImageResult | null = null;

        // Try to get image based on source
        if (actualSource === 'ai') {
            result = await generateAIImage(enhancedPrompt, style);
        } else {
            // Stock photos
            result = await searchPexels(enhancedPrompt, orientation);
            if (!result) {
                result = await searchUnsplash(enhancedPrompt, orientation);
            }
        }

        // Final fallback
        if (!result) {
            result = await searchUnsplash(enhancedPrompt, orientation);
        }

        if (!result) {
            return NextResponse.json(
                { error: 'Failed to generate image' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            image: result,
            metadata: {
                originalPrompt: prompt,
                enhancedPrompt,
                requestedSource: source,
                actualSource: actualSource
            }
        });

    } catch (error) {
        console.error('Image generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate image' },
            { status: 500 }
        );
    }
}

// ==========================================
// BATCH IMAGE GENERATION
// ==========================================

export async function PUT(request: NextRequest) {
    try {
        const { cards, source = 'auto' } = await request.json();

        if (!cards || !Array.isArray(cards)) {
            return NextResponse.json(
                { error: 'Cards array is required' },
                { status: 400 }
            );
        }

        const results: { cardId: string; image: ImageResult | null }[] = [];

        // Process cards that need images
        for (const card of cards) {
            if (!card.hasImage) {
                results.push({ cardId: card.id, image: null });
                continue;
            }

            const prompt = card.imagePrompt || card.title;
            const enhancedPrompt = enhancePrompt(prompt);

            let actualSource = source;
            if (source === 'auto') {
                actualSource = determineOptimalSource(prompt);
            }

            let image: ImageResult | null = null;

            if (actualSource === 'ai') {
                image = await generateAIImage(enhancedPrompt);
            } else {
                image = await searchPexels(enhancedPrompt);
                if (!image) {
                    image = await searchUnsplash(enhancedPrompt);
                }
            }

            results.push({ cardId: card.id, image });

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error) {
        console.error('Batch image generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate images' },
            { status: 500 }
        );
    }
}
