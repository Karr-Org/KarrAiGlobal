/**
 * Social AI Assist API
 * POST — Generate content, hashtags, or image prompts using AI
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

interface AiAssistRequest {
    type: 'content' | 'hashtags' | 'image_prompt';
    topic?: string;          // for content generation
    content?: string;        // existing content (for hashtags/image_prompt)
    platform?: string;
    tone?: string;           // professional, casual, inspirational
}

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
    // Try Google Gemini first (GOOGLE_AI_API_KEY is available)
    const geminiKey = process.env.GOOGLE_AI_API_KEY;
    if (geminiKey) {
        const model = 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 1000,
                },
            }),
        });

        if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (text) return text;
        } else {
            const err = await res.text();
            console.error('[AI Assist] Gemini error:', res.status, err);
        }
    }

    // Fallback to OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) throw new Error('No AI API key configured (set GOOGLE_AI_API_KEY or OPENAI_API_KEY)');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            max_tokens: 1000,
            temperature: 0.8,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('[AI Assist] OpenAI error:', err);
        throw new Error(`AI generation failed: ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
}

export async function POST(request: Request) {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: AiAssistRequest = await request.json();
        const { type, topic, content, platform = 'linkedin', tone = 'professional' } = body;

        if (!type) {
            return NextResponse.json({ error: 'Type is required (content | hashtags | image_prompt)' }, { status: 400 });
        }

        let result: string = '';

        switch (type) {
            case 'content': {
                if (!topic && !content) {
                    return NextResponse.json({ error: 'Topic or content required for content generation' }, { status: 400 });
                }
                const systemPrompt = `You are a ${platform} content writer. Write ONE single post. Output ONLY the post text.

CRITICAL RULES:
- Write exactly ONE post — NEVER give multiple options or alternatives
- NO "Option 1", "Option 2", NO numbering, NO markdown formatting
- NO ** bold **, NO headings, NO bullet points
- Write plain text only, using line breaks for readability
- Do NOT include hashtags (they are handled separately)
- Keep under ${platform === 'twitter' ? '280' : '2000'} characters
- Be ${tone}, engaging, and authentic
- Use 1-2 emojis maximum, placed naturally
- End with a question or call to action to drive engagement`;

                const userPrompt = content
                    ? `Rewrite and improve this ${platform} post:\n\n${content}`
                    : `Write a ${platform} post about: ${topic}`;

                let rawContent = await callAI(systemPrompt, userPrompt);
                // Post-process: strip any markdown/options formatting
                rawContent = rawContent
                    .replace(/\*\*[^*]*\*\*:?\s*/g, '')  // remove **bold** headers
                    .replace(/^#+\s.*/gm, '')              // remove markdown headings
                    .replace(/^\s*Option\s*\d+[^a-zA-Z].*$/gim, '') // remove "Option N" lines
                    .replace(/^\s*---+\s*$/gm, '')         // remove horizontal rules
                    .replace(/\n{3,}/g, '\n\n')            // collapse triple+ newlines
                    .trim();
                result = rawContent;
                break;
            }

            case 'hashtags': {
                if (!content) {
                    return NextResponse.json({ error: 'Content required for hashtag generation' }, { status: 400 });
                }
                const systemPrompt = `You are a hashtag generator. Your output must be EXACTLY a single line of comma-separated words. Nothing else.

CRITICAL RULES:
- Output ONLY one single line of comma-separated words
- NO # symbols, NO markdown, NO bold, NO bullet points, NO numbering
- NO "Option 1" or alternatives - just ONE list
- 5-8 hashtags maximum
- Each hashtag is a single word or CamelCase compound (e.g. ArtificialIntelligence not Artificial Intelligence)
- Example correct output: AI, MachineLearning, Innovation, TechTrends, FutureOfWork`;

                const userPrompt = `Hashtags for this ${platform} post:\n\n${content}`;
                let rawResult = await callAI(systemPrompt, userPrompt);
                // Post-process: strip any markdown, #, numbering, "Option" text
                rawResult = rawResult
                    .replace(/\*\*[^*]*\*\*/g, '')     // remove **bold** text
                    .replace(/#{1,3}\s*/g, '')           // remove markdown headers
                    .replace(/^[\s\S]*?:\s*/gm, '')      // remove "Option 1:" prefixes
                    .replace(/#/g, '')                    // remove # symbols
                    .replace(/\n/g, ', ')                 // newlines to commas
                    .replace(/,\s*,/g, ',')              // remove double commas
                    .replace(/^\s*,\s*/, '')              // remove leading comma
                    .replace(/\s*,\s*$/, '')              // remove trailing comma
                    .trim();
                // Take only first 8 unique tags
                const tags = [...new Set(rawResult.split(',').map(t => t.trim()).filter(t => t.length > 0 && t.length < 40))].slice(0, 8);
                result = tags.join(', ');
                break;
            }

            case 'image_prompt': {
                if (!content) {
                    return NextResponse.json({ error: 'Content required for image prompt generation' }, { status: 400 });
                }
                const systemPrompt = `You are a creative AI image prompt writer. Generate an image prompt that would make a perfect visual companion for a social media post.
Rules:
- Return ONLY the image description prompt, nothing else
- Make it vivid, specific, and visually appealing
- Keep it under 100 words
- Focus on professional, modern aesthetics
- Think about what would make someone stop scrolling`;

                const userPrompt = `Create an image prompt for this social media post:\n\n${content}`;
                result = await callAI(systemPrompt, userPrompt);
                break;
            }

            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json({ result, type });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'AI generation failed';
        console.error('[AI Assist] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
