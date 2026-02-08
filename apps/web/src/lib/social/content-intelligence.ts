/**
 * 🧠 Content Intelligence
 * AI-powered engine that analyzes chats, extracts insights, and generates optimized social posts
 * Uses Gemini for natural language understanding and content generation
 */

import { createClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface ChatInsight {
    title: string;
    summary: string;
    keyTakeaways: string[];
    contentWorthinessScore: number; // 0-100
    suggestedTone: 'thought_leader' | 'casual' | 'educational' | 'controversial' | 'storytelling';
    suggestedHooks: string[];
    topicTags: string[];
    suggestedPlatforms: string[];
}

export interface DraftVariant {
    variant: 'hook_first' | 'story' | 'data_driven' | 'contrarian';
    content: string;
    hashtags: string[];
    estimatedEngagement: 'low' | 'medium' | 'high';
    characterCount: number;
}

export interface UserVoiceProfile {
    tone: string;
    topics: string[];
    writingStyle: string;
    preferredLength: 'short' | 'medium' | 'long';
    bestPerformingTopics: string[];
}

// ============================================
// INSIGHT EXTRACTION
// ============================================

/**
 * Analyze a chat session and extract content-worthy insights
 */
export async function extractInsightFromChat(
    messages: Array<{ role: string; content: string }>,
    userContext?: { name?: string; niche?: string; expertise?: string[] }
): Promise<ChatInsight | null> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        console.error('[ContentIntel] No GOOGLE_AI_API_KEY found');
        return null;
    }

    // Build the conversation text
    const conversationText = messages
        .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
        .join('\n\n');

    const prompt = `You are an expert content strategist analyzing a chat conversation to find content-worthy insights for social media.

CONVERSATION:
${conversationText.substring(0, 8000)}

USER CONTEXT:
${userContext ? JSON.stringify(userContext) : 'Professional user'}

TASK: Analyze this conversation and determine if it contains insights worth sharing on LinkedIn.

Score the conversation from 0-100 on "content worthiness":
- 0-30: Mundane, administrative, or too technical for social media
- 31-60: Has some interesting points but needs heavy editing
- 61-80: Good content potential with clear takeaways
- 81-100: Exceptional insight that would drive high engagement

If score >= 40, extract the insight. If score < 40, return null.

Respond in this exact JSON format (no markdown, no code blocks):
{
    "contentWorthinessScore": <number>,
    "title": "<short catchy title for internal reference>",
    "summary": "<2-3 sentence summary of the core insight>",
    "keyTakeaways": ["<takeaway 1>", "<takeaway 2>", "<takeaway 3>"],
    "suggestedTone": "<thought_leader|casual|educational|controversial|storytelling>",
    "suggestedHooks": ["<hook 1>", "<hook 2>", "<hook 3>"],
    "topicTags": ["<tag1>", "<tag2>", "<tag3>"],
    "suggestedPlatforms": ["linkedin"]
}

If the conversation is not worth posting about (score < 40), respond with exactly: null`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    },
                }),
            }
        );

        if (!response.ok) {
            console.error('[ContentIntel] Gemini API error:', response.status);
            return null;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!text || text === 'null') return null;

        // Parse JSON (handle potential markdown wrapping)
        const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const insight = JSON.parse(jsonStr) as ChatInsight;

        if (insight.contentWorthinessScore < 40) return null;

        return insight;
    } catch (error) {
        console.error('[ContentIntel] Failed to extract insight:', error);
        return null;
    }
}

// ============================================
// DRAFT GENERATION
// ============================================

/**
 * Generate multiple draft variants from an insight
 */
export async function generateDrafts(
    insight: ChatInsight,
    platform: string = 'linkedin',
    voiceProfile?: UserVoiceProfile
): Promise<DraftVariant[]> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return [];

    const platformLimits: Record<string, number> = {
        linkedin: 3000,
        twitter: 280,
        facebook: 5000,
        instagram: 2200,
    };

    const maxChars = platformLimits[platform] || 3000;

    const prompt = `You are an elite LinkedIn ghostwriter who creates viral, engaging posts.

INSIGHT TO TRANSFORM INTO A POST:
Title: ${insight.title}
Summary: ${insight.summary}
Key Takeaways: ${insight.keyTakeaways.join(', ')}
Suggested Tone: ${insight.suggestedTone}
Suggested Hooks: ${insight.suggestedHooks.join(' | ')}

${voiceProfile ? `USER'S VOICE PROFILE:
Tone: ${voiceProfile.tone}
Writing Style: ${voiceProfile.writingStyle}
Best Topics: ${voiceProfile.bestPerformingTopics.join(', ')}
Preferred Length: ${voiceProfile.preferredLength}` : ''}

PLATFORM: ${platform} (max ${maxChars} characters)

Generate 4 different draft variants of a ${platform} post:

1. **HOOK FIRST** — Start with a bold, attention-grabbing opening line. Use pattern interrupts. Short paragraphs. End with a question.

2. **STORY** — Start with "I..." and tell a mini-story from the insight. Make it personal and relatable. End with the lesson learned.

3. **DATA DRIVEN** — Lead with a surprising stat or data point (can be estimated). Use numbers and specifics. Bullet points for clarity.

4. **CONTRARIAN** — Challenge conventional wisdom. Start with "Unpopular opinion:" or "Hot take:". Be provocative but substantive.

FORMATTING RULES FOR LINKEDIN:
- Use line breaks between paragraphs (LinkedIn shows this well)
- Use emojis sparingly (1-2 max)
- Include 3-5 relevant hashtags at the end
- Keep under ${maxChars} characters
- No links in the post body (LinkedIn penalizes them)

Respond in this exact JSON format (no markdown, no code blocks):
[
    {
        "variant": "hook_first",
        "content": "<full post text including hashtags>",
        "hashtags": ["<tag1>", "<tag2>"],
        "estimatedEngagement": "<low|medium|high>"
    },
    {
        "variant": "story",
        "content": "<full post text>",
        "hashtags": ["<tag1>", "<tag2>"],
        "estimatedEngagement": "<low|medium|high>"
    },
    {
        "variant": "data_driven",
        "content": "<full post text>",
        "hashtags": ["<tag1>", "<tag2>"],
        "estimatedEngagement": "<low|medium|high>"
    },
    {
        "variant": "contrarian",
        "content": "<full post text>",
        "hashtags": ["<tag1>", "<tag2>"],
        "estimatedEngagement": "<low|medium|high>"
    }
]`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.85,
                        maxOutputTokens: 4096,
                    },
                }),
            }
        );

        if (!response.ok) return [];

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!text) return [];

        const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const drafts = JSON.parse(jsonStr) as DraftVariant[];

        return drafts.map(d => ({
            ...d,
            characterCount: d.content.length,
        }));
    } catch (error) {
        console.error('[ContentIntel] Failed to generate drafts:', error);
        return [];
    }
}

// ============================================
// PATTERN ANALYSIS
// ============================================

/**
 * Analyze posting patterns and generate AI recommendations
 */
export async function analyzeContentPatterns(
    posts: Array<{
        content: string;
        publishedAt: string;
        likes: number;
        comments: number;
        shares: number;
        impressions: number;
    }>
): Promise<{
    bestTopics: string[];
    bestTimes: string[];
    bestFormats: string[];
    narrative: string;
    recommendations: string[];
}> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey || posts.length < 3) {
        return {
            bestTopics: [],
            bestTimes: [],
            bestFormats: [],
            narrative: 'Need at least 3 published posts to analyze patterns.',
            recommendations: ['Post consistently to build enough data for AI insights.'],
        };
    }

    const postsData = posts.map(p => ({
        preview: p.content.substring(0, 200),
        day: new Date(p.publishedAt).toLocaleDateString('en-US', { weekday: 'long' }),
        hour: new Date(p.publishedAt).getHours(),
        engagement: p.likes + p.comments * 3 + p.shares * 5, // Weighted engagement
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
    }));

    const prompt = `Analyze these LinkedIn posts and their performance to find winning patterns:

POSTS DATA:
${JSON.stringify(postsData, null, 2)}

Respond in JSON (no markdown):
{
    "bestTopics": ["<topic that gets most engagement>", "..."],
    "bestTimes": ["<e.g. Tuesday 10am>", "..."],
    "bestFormats": ["<e.g. story-driven, data-heavy>", "..."],
    "narrative": "<2-3 sentence natural language summary of what's working and why>",
    "recommendations": ["<actionable recommendation 1>", "<recommendation 2>", "<recommendation 3>"]
}`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
                }),
            }
        );

        if (!response.ok) throw new Error('API error');
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        const jsonStr = text?.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(jsonStr || '{}');
    } catch {
        return {
            bestTopics: [],
            bestTimes: [],
            bestFormats: [],
            narrative: 'Analysis temporarily unavailable.',
            recommendations: [],
        };
    }
}

/**
 * Suggest the optimal posting time based on past performance
 */
export function suggestOptimalPostTime(
    patterns: Array<{ dayOfWeek: number; hour: number; avgEngagement: number }>
): Date {
    if (patterns.length === 0) {
        // Default: next Tuesday at 10:00 AM
        const now = new Date();
        const daysUntilTuesday = (2 - now.getDay() + 7) % 7 || 7;
        const nextTuesday = new Date(now);
        nextTuesday.setDate(now.getDate() + daysUntilTuesday);
        nextTuesday.setHours(10, 0, 0, 0);
        return nextTuesday;
    }

    // Find the best performing slot
    const best = patterns.reduce((a, b) => a.avgEngagement > b.avgEngagement ? a : b);

    const now = new Date();
    const daysUntil = (best.dayOfWeek - now.getDay() + 7) % 7 || 7;
    const optimalDate = new Date(now);
    optimalDate.setDate(now.getDate() + daysUntil);
    optimalDate.setHours(best.hour, 0, 0, 0);

    return optimalDate;
}
