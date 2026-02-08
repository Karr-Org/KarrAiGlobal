/**
 * Social AI Image Generation API
 * POST — Generate an image from a text prompt
 * Strategy 1: Gemini 2.0 Flash image generation → return as data URL
 * Strategy 2: Picsum.photos (always works, beautiful photos)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function getCurrentUserId(request: Request): Promise<string | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) return user.id;
    } catch { /* cookie auth failed */ }
    const headerUserId = request.headers.get('x-user-id');
    if (headerUserId) return headerUserId;
    return null;
}

/**
 * Generate image using Google Gemini 2.0 Flash Experimental
 * Returns base64 data URL or null on failure
 */
async function generateWithGemini(prompt: string): Promise<string | null> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return null;

    try {
        const model = 'gemini-2.0-flash-exp';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Generate a high-quality, photorealistic image: ${prompt}`,
                    }],
                }],
                generationConfig: {
                    responseModalities: ['IMAGE', 'TEXT'],
                },
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error('[AI Image] Gemini error:', res.status, err.slice(0, 200));
            return null;
        }

        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData?.data) {
                const mime = part.inlineData.mimeType || 'image/png';
                // Return as data URL — always works in <img> tags
                return `data:${mime};base64,${part.inlineData.data}`;
            }
        }
        console.log('[AI Image] Gemini returned no image data in parts');
        return null;
    } catch (error) {
        console.error('[AI Image] Gemini error:', error);
        return null;
    }
}

/**
 * Get a reliable stock photo URL using picsum.photos
 * This ALWAYS returns a valid, working image URL
 */
function getReliableStockPhoto(prompt: string): string {
    // Create a numeric seed from the prompt for deterministic but varied results
    let seed = 0;
    for (let i = 0; i < prompt.length; i++) {
        seed = ((seed << 5) - seed + prompt.charCodeAt(i)) | 0;
    }
    // Add some randomness so regenerating gives different results
    seed = Math.abs(seed + Date.now()) % 10000;
    return `https://picsum.photos/seed/${seed}/800/600`;
}

export async function POST(request: Request) {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { prompt } = body;

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        console.log('[AI Image] Generating for prompt:', prompt.slice(0, 80));

        // Strategy 1: Gemini image generation
        const geminiDataUrl = await generateWithGemini(prompt);
        if (geminiDataUrl) {
            console.log('[AI Image] ✓ Gemini image generated successfully');
            return NextResponse.json({ url: geminiDataUrl, source: 'gemini' });
        }

        // Strategy 2: Reliable stock photo (picsum.photos always works)
        console.log('[AI Image] Falling back to stock photo');
        const stockUrl = getReliableStockPhoto(prompt);

        // Fetch the actual image URL (picsum redirects to a CDN URL)
        try {
            // picsum returns 302 → follow to get the final fastly CDN URL
            const imgRes = await fetch(stockUrl, { redirect: 'manual' });
            const location = imgRes.headers.get('location');
            if (location) {
                console.log('[AI Image] ✓ Stock photo CDN URL:', location.slice(0, 80));
                return NextResponse.json({ url: location, source: 'stock' });
            }
        } catch {
            // fallback to the picsum redirect URL
        }

        // Direct picsum URL (browsers follow the redirect automatically)
        return NextResponse.json({ url: stockUrl, source: 'stock' });
    } catch (error) {
        console.error('[AI Image] Error:', error);
        return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }
}
