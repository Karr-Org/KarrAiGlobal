/**
 * KARR AI - Gemini AI Utility
 * 
 * Shared utility for calling Google Gemini API
 */

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

/**
 * Generate content using Google Gemini
 */
export async function generateContent(prompt: string): Promise<string> {
    if (!GOOGLE_AI_API_KEY) {
        throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 2048,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No text in Gemini response');
        }

        return text;
    } catch (error) {
        console.error('[Gemini] Error:', error);
        throw error;
    }
}

/**
 * Generate content with multi-turn conversation.
 * 
 * Accepts an optional systemInstruction which is passed via Gemini's
 * native `system_instruction` field (not injected into user messages).
 */
export async function generateContentMultiTurn(
    messages: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
    systemInstruction?: string
): Promise<string> {
    if (!GOOGLE_AI_API_KEY) {
        throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    try {
        const requestBody: Record<string, unknown> = {
            contents: messages,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
            },
        };

        // Use Gemini's native system_instruction field when provided
        if (systemInstruction) {
            requestBody.system_instruction = {
                parts: [{ text: systemInstruction }],
            };
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No text in Gemini response');
        }

        return text;
    } catch (error) {
        console.error('[Gemini] Multi-turn error:', error);
        throw error;
    }
}

/**
 * Generation options for configurable Gemini calls
 */
interface GenerationOptions {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
}

/**
 * Generate content with Gemini Pro model (for verification/complex reasoning)
 * Use this for high-quality, slower generation
 */
export async function generateContentWithGemini(
    prompt: string,
    options?: GenerationOptions
): Promise<string> {
    if (!GOOGLE_AI_API_KEY) {
        throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: options?.temperature ?? 0.3,
                        maxOutputTokens: options?.maxOutputTokens ?? 4096,
                        topP: options?.topP ?? 0.95,
                        topK: options?.topK ?? 40,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Gemini Pro API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No text in Gemini Pro response');
        }

        return text;
    } catch (error) {
        console.error('[Gemini Pro] Error:', error);
        throw error;
    }
}

/**
 * Generate content with Gemini Flash model (for fast drafts/summaries)
 * Use this for speed-optimized, cheaper generation
 */
export async function generateContentWithGeminiFlash(
    prompt: string,
    options?: GenerationOptions
): Promise<string> {
    if (!GOOGLE_AI_API_KEY) {
        throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: options?.temperature ?? 0.3,
                        maxOutputTokens: options?.maxOutputTokens ?? 2048,
                        topP: options?.topP ?? 0.95,
                        topK: options?.topK ?? 40,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Gemini Flash API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No text in Gemini Flash response');
        }

        return text;
    } catch (error) {
        console.error('[Gemini Flash] Error:', error);
        throw error;
    }
}

export default {
    generateContent,
    generateContentMultiTurn,
    generateContentWithGemini,
    generateContentWithGeminiFlash,
};

/**
 * Generate embedding vector using Google gemini-embedding-001
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!GOOGLE_AI_API_KEY) {
        throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GOOGLE_AI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'models/gemini-embedding-001',
                    content: {
                        parts: [{ text: text.substring(0, 5000) }] // Max 5000 chars
                    }
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Gemini Embedding API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const embedding = data.embedding?.values;

        if (!embedding || !Array.isArray(embedding)) {
            throw new Error('No embedding in Gemini response');
        }

        return embedding;
    } catch (error) {
        console.error('[Gemini] Embedding error:', error);
        throw error;
    }
}
