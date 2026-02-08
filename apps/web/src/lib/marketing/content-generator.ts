// ============================================
// AI CONTENT GENERATOR
// ============================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    BlogPost,
    AISocialPost,
    ContentIdea,
    ProductMarketingProfile,
    GenerateBlogRequest,
    GenerateSocialPostRequest,
    ContentScore,
    FAQ,
    Definition,
    Platform,
    ContentOutline
} from './types';

// Initialize Gemini
const getGemini = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
    return new GoogleGenerativeAI(apiKey);
};

// ============================================
// BLOG GENERATION
// ============================================

export async function generateBlogPost(
    request: GenerateBlogRequest,
    profile: ProductMarketingProfile
): Promise<Partial<BlogPost>> {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: profile.ai_model_preference || 'gemini-2.0-flash' });

    const wordCount = request.target_word_count || 2500;

    const prompt = `You are a world-class content strategist and SEO expert. Generate a comprehensive blog post that will rank #1 on Google AND get cited by AI assistants like ChatGPT and Claude.

## BRAND CONTEXT
- Brand Voice: ${profile.brand_voice}
- Tone Keywords: ${profile.tone_keywords.join(', ')}
- Language Style: ${profile.language_style}

## CONTENT REQUEST
- Title: ${request.title}
- Primary Keywords: ${request.keywords.join(', ')}
- Content Pillar: ${request.content_pillar || 'Education'}
- Target Word Count: ${wordCount} words

## OUTPUT REQUIREMENTS

Generate the blog in this EXACT JSON format:
{
    "title": "The optimized title (include primary keyword)",
    "slug": "url-friendly-slug",
    "excerpt": "Compelling 2-3 sentence excerpt for social sharing",
    "content": "Full blog content in Markdown format",
    "meta_title": "SEO meta title (50-60 chars)",
    "meta_description": "SEO meta description (150-160 chars)",
    "og_title": "Open Graph title for social",
    "og_description": "Open Graph description for social",
    "faqs": [
        {"question": "Common question 1?", "answer": "Clear, concise answer"},
        {"question": "Common question 2?", "answer": "Clear, concise answer"}
    ],
    "definitions": [
        {"term": "Key Term", "definition": "Clear definition that LLMs will cite", "related_terms": ["term1", "term2"]}
    ],
    "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
    "tags": ["tag1", "tag2", "tag3"],
    "keywords": ["keyword1", "keyword2"]
}

## CONTENT STRUCTURE REQUIREMENTS

1. **Introduction** (Hook + Why This Matters + What You'll Learn)
2. **Quick Definition/TL;DR** (For AI extraction - use blockquote)
3. **Main Sections** (Use H2/H3 hierarchy, include examples)
4. **Practical Examples** (Code, calculations, real-world cases)
5. **Common Mistakes/Pitfalls** (Shows expertise)
6. **Comparison Section** (If applicable - "X vs Y vs Z")
7. **FAQ Section** (Structured for featured snippets)
8. **Conclusion with CTA**

## AEO (AI Engine Optimization) Rules
- Start with a clear, quotable definition in the first 100 words
- Use structured data format (headers, lists, tables)
- Include specific numbers, dates, and facts
- Be authoritative but acknowledge limitations
- Cite sources/methodology when making claims

## SEO Rules
- Include primary keyword in title, H1, first paragraph, conclusion
- Use semantic variations throughout
- Internal linking placeholders: [LINK: related topic]
- Optimal paragraph length: 3-4 sentences
- Include one relevant list per 500 words

Generate the complete blog post now as valid JSON:`;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to extract JSON from response');
        }

        const blogData = JSON.parse(jsonMatch[0]);

        // Calculate scores
        const scores = await scoreBlogContent(blogData.content, request.keywords);

        return {
            ...blogData,
            seo_score: scores.seo_score,
            aeo_score: scores.aeo_score,
            readability_score: scores.readability_score,
            word_count: countWords(blogData.content),
            read_time_minutes: Math.ceil(countWords(blogData.content) / 200)
        };
    } catch (error) {
        console.error('Blog generation error:', error);
        throw error;
    }
}

export async function generateBlogOutline(
    title: string,
    keywords: string[],
    profile: ProductMarketingProfile
): Promise<ContentOutline> {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Create a detailed blog outline for maximum SEO and AEO performance.

Title: ${title}
Keywords: ${keywords.join(', ')}
Brand Voice: ${profile.brand_voice}

Output as JSON:
{
    "introduction": "Brief intro outline",
    "sections": [
        {
            "heading": "Section H2 heading",
            "subheadings": ["H3 subheading 1", "H3 subheading 2"],
            "key_points": ["Point to cover", "Point to cover"]
        }
    ],
    "conclusion": "Conclusion outline",
    "faqs": [
        {"question": "FAQ 1?", "answer_outline": "Brief answer outline"}
    ]
}`;

    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch![0]);
}

// ============================================
// SOCIAL POST GENERATION
// ============================================

export async function generateSocialPost(
    request: GenerateSocialPostRequest,
    profile: ProductMarketingProfile
): Promise<Partial<AISocialPost>> {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const platformGuides = getPlatformGuide(request.platform);

    const prompt = `You are a viral social media strategist. Generate a ${request.content_type} for ${request.platform} that maximizes engagement.

## BRAND CONTEXT
- Brand Voice: ${profile.brand_voice}
- Tone: ${profile.tone_keywords.join(', ')}

## CONTENT REQUEST
- Platform: ${request.platform}
- Content Type: ${request.content_type}
- Topic: ${request.topic}
${request.blog_id ? '- This is promoting a blog post, include a CTA to read more' : ''}

## PLATFORM GUIDE
${platformGuides}

## OUTPUT FORMAT (JSON)
${getOutputFormat(request)}

## VIRAL OPTIMIZATION RULES
1. Hook in first line (pattern interrupt, bold claim, question)
2. Use line breaks for readability
3. Include emotional triggers (curiosity, FOMO, achievement)
4. End with engagement prompt (question, CTA)
5. Hashtags: ${request.hashtag_count || 5} relevant hashtags

Generate the social post now as valid JSON:`;

    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    const postData = JSON.parse(jsonMatch![0]);

    return {
        platform: request.platform,
        content_type: request.content_type,
        ...postData,
        ai_model: 'gemini-2.0-flash',
        generation_prompt: prompt.substring(0, 500)
    };
}

export async function generateTwitterThread(
    topic: string,
    tweetCount: number,
    profile: ProductMarketingProfile
): Promise<string[]> {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Create a viral Twitter/X thread with ${tweetCount} tweets.

Topic: ${topic}
Brand Voice: ${profile.brand_voice}

THREAD STRUCTURE:
1. Hook tweet (pattern interrupt, bold statement)
2-${tweetCount - 1}. Value tweets (one key insight per tweet)
${tweetCount}. Conclusion + CTA (follow, retweet, link)

RULES:
- Each tweet max 280 characters
- Use line breaks for readability
- Include 1-2 emojis per tweet where natural
- Make each tweet standalone valuable
- Last tweet should drive engagement

Output as JSON array:
["Tweet 1 text", "Tweet 2 text", ...]`;

    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\[[\s\S]*\]/);
    return JSON.parse(jsonMatch![0]);
}

export async function generateCarouselSlides(
    topic: string,
    slideCount: number,
    profile: ProductMarketingProfile
): Promise<Array<{ index: number; text: string; image_prompt: string }>> {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Create an Instagram/LinkedIn carousel with ${slideCount} slides.

Topic: ${topic}
Brand Voice: ${profile.brand_voice}

CAROUSEL STRUCTURE:
- Slide 1: Hook/Title slide
- Slides 2-${slideCount - 1}: Content slides (one key point each)
- Slide ${slideCount}: CTA slide (follow, save, share)

RULES:
- Max 50 words per slide
- Use bold headlines
- Include visual hierarchy
- Generate image prompt for each slide

Output as JSON array:
[
    {
        "index": 1,
        "text": "Slide headline\\n\\nSupporting text",
        "image_prompt": "Prompt for AI image generation"
    }
]`;

    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\[[\s\S]*\]/);
    return JSON.parse(jsonMatch![0]);
}

// ============================================
// CONTENT OPTIMIZATION
// ============================================

export async function optimizeForAEO(content: string): Promise<{
    optimized_content: string;
    added_faqs: FAQ[];
    added_definitions: Definition[];
    structured_data: Record<string, unknown>;
}> {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Optimize this content for AI Engine Optimization (AEO) so that LLMs like ChatGPT and Claude will cite it.

CONTENT:
${content}

OPTIMIZATION TASKS:
1. Add clear, quotable definitions for key terms
2. Add FAQ section with common questions
3. Ensure first paragraph has a clear, citable definition
4. Add structured data schema.org markup suggestions
5. Make claims more specific (add numbers, dates, sources)

Output as JSON:
{
    "optimized_content": "The optimized Markdown content",
    "added_faqs": [{"question": "...", "answer": "..."}],
    "added_definitions": [{"term": "...", "definition": "...", "related_terms": []}],
    "structured_data": {schema.org JSON-LD suggestion}
}`;

    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch![0]);
}

export async function scoreBlogContent(
    content: string,
    targetKeywords: string[]
): Promise<ContentScore> {
    const wordCount = countWords(content);
    const keywordDensity = calculateKeywordDensity(content, targetKeywords);
    const readability = calculateReadability(content);

    // Basic scoring (can be enhanced with AI)
    let seoScore = 0;
    let aeoScore = 0;
    const issues: ContentScore['issues'] = [];
    const suggestions: string[] = [];

    // SEO Scoring
    if (wordCount >= 2000) seoScore += 20;
    else if (wordCount >= 1500) seoScore += 15;
    else issues.push({ type: 'warning', category: 'seo', message: 'Content is below recommended 2000 words', fix: 'Expand content with more examples and details' });

    if (keywordDensity >= 0.5 && keywordDensity <= 2.5) seoScore += 20;
    else if (keywordDensity < 0.5) issues.push({ type: 'warning', category: 'seo', message: 'Keyword density too low', fix: 'Naturally incorporate more target keywords' });
    else issues.push({ type: 'warning', category: 'seo', message: 'Keyword density too high (keyword stuffing)', fix: 'Reduce keyword repetition' });

    if (content.includes('## ')) seoScore += 15;
    if (content.includes('### ')) seoScore += 10;
    if (content.match(/\n- /g)?.length || 0 >= 3) seoScore += 10;
    if (content.includes('|')) seoScore += 10; // Tables

    // AEO Scoring
    if (content.match(/\*\*[^*]+\*\*/)) aeoScore += 15; // Bold definitions
    if (content.includes('FAQ') || content.includes('Frequently Asked')) aeoScore += 20;
    if (content.match(/> /)) aeoScore += 15; // Blockquotes
    if (content.match(/\d+%|\d+\.\d+/)) aeoScore += 15; // Specific numbers
    if (content.includes('According to') || content.includes('Research shows')) aeoScore += 15;

    // Clamping
    seoScore = Math.min(100, seoScore + 25);
    aeoScore = Math.min(100, aeoScore + 20);

    return {
        seo_score: seoScore,
        aeo_score: aeoScore,
        readability_score: readability,
        viral_potential: Math.round((seoScore + aeoScore + readability) / 3),
        issues,
        suggestions
    };
}

// ============================================
// IDEA GENERATION
// ============================================

export async function generateContentIdeas(
    profile: ProductMarketingProfile,
    count: number = 10
): Promise<Partial<ContentIdea>[]> {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a content strategist generating content ideas that will:
1. Rank #1 on Google
2. Get shared virally on social media
3. Get cited by AI assistants like ChatGPT and Claude

## BRAND CONTEXT
- Keywords: ${profile.primary_keywords.join(', ')}
- Content Pillars: ${profile.content_pillars.join(', ')}
- Target Audience: ${profile.primary_persona.name}
- Pain Points: ${profile.primary_persona.pain_points.join(', ')}

## GENERATE ${count} CONTENT IDEAS

For each idea, think about:
- What questions is the audience asking?
- What topics are competitors missing?
- What definitions/glossary terms can we own?
- What comparison posts ("X vs Y") are valuable?

Output as JSON array:
[
    {
        "title": "Compelling title",
        "description": "Brief description",
        "content_type": "blog|twitter_thread|linkedin_post|etc",
        "content_pillar": "Which pillar this belongs to",
        "target_keywords": ["keyword1", "keyword2"],
        "trend_score": 0.0-1.0,
        "gap_score": 0.0-1.0,
        "viral_potential": 0.0-1.0,
        "seo_potential": 0.0-1.0,
        "aeo_potential": 0.0-1.0,
        "source": "ai_generated"
    }
]`;

    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\[[\s\S]*\]/);
    const ideas: Partial<ContentIdea>[] = JSON.parse(jsonMatch![0]);

    // Calculate overall score
    return ideas.map(idea => ({
        ...idea,
        overall_score: (
            (idea.trend_score || 0) * 0.15 +
            (idea.gap_score || 0) * 0.2 +
            (idea.viral_potential || 0) * 0.2 +
            (idea.seo_potential || 0) * 0.25 +
            (idea.aeo_potential || 0) * 0.2
        ),
        status: 'idea' as const,
        priority: 50
    }));
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
}

function calculateKeywordDensity(content: string, keywords: string[]): number {
    const wordCount = countWords(content);
    const lowerContent = content.toLowerCase();
    let keywordCount = 0;

    for (const keyword of keywords) {
        const regex = new RegExp(keyword.toLowerCase(), 'gi');
        const matches = lowerContent.match(regex);
        keywordCount += matches?.length || 0;
    }

    return (keywordCount / wordCount) * 100;
}

function calculateReadability(content: string): number {
    // Simplified Flesch-Kincaid approximation
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = countWords(content);
    const syllables = estimateSyllables(content);

    if (sentences.length === 0 || words === 0) return 50;

    const avgWordsPerSentence = words / sentences.length;
    const avgSyllablesPerWord = syllables / words;

    // Flesch Reading Ease
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    // Normalize to 0-100
    return Math.max(0, Math.min(100, score));
}

function estimateSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let totalSyllables = 0;

    for (const word of words) {
        // Simple syllable estimation
        const vowels = word.match(/[aeiouy]+/gi);
        totalSyllables += vowels ? vowels.length : 1;
    }

    return totalSyllables;
}

function getPlatformGuide(platform: Platform): string {
    const guides: Record<Platform, string> = {
        twitter: `
- Max 280 characters per tweet
- Use line breaks for readability
- 1-2 emojis where natural
- Hashtags at end (2-3 max)
- Hook in first line`,
        linkedin: `
- Professional but personable tone
- Use line breaks every 2-3 lines
- Start with a hook/question
- Include specific numbers/results
- End with question to drive comments
- 3-5 hashtags`,
        instagram: `
- Visual-first platform
- Carousel posts get highest engagement
- Caption max 2200 chars, first 125 visible
- Use emojis liberally
- 20-30 hashtags in first comment
- CTA: "Save this for later"`,
        facebook: `
- Conversational tone
- Medium-length posts perform best
- Include questions
- Minimal hashtags (1-2)`,
        youtube: `
- Hook viewers in first 5 seconds
- Clear value proposition
- Include timestamps in description
- Searchable titles and descriptions
- Call to action for subscribers`,
        reddit: `
- Authentic, non-promotional
- Provide genuine value
- No obvious marketing speak
- Match subreddit tone
- Detailed, helpful responses`,
        quora: `
- Authoritative yet accessible
- Answer the question directly first
- Then provide context and details
- Include credentials/experience
- Link to source if relevant`,
        medium: `
- Long-form content welcome
- Strong headlines
- Use publication if possible
- Include images every 300-400 words
- Claps system - emotional hooks work`,
        hashnode: `
- Developer-focused
- Include code snippets
- Technical but accessible
- Use proper markdown`,
        devto: `
- Developer community
- Technical tutorials
- Include working code
- Use appropriate tags`
    };

    return guides[platform] || '';
}

function getOutputFormat(request: GenerateSocialPostRequest): string {
    if (request.content_type === 'thread') {
        return `{
    "thread_parts": ["Tweet 1", "Tweet 2", ...],
    "hashtags": ["hashtag1", "hashtag2"],
    "call_to_action": "CTA text"
}`;
    }

    if (request.content_type === 'carousel') {
        return `{
    "carousel_slides": [
        {"index": 1, "text": "Slide text", "image_prompt": "Image description"}
    ],
    "content": "Caption text",
    "hashtags": ["hashtag1"],
    "call_to_action": "Save this post!"
}`;
    }

    return `{
    "content": "Post content with line breaks",
    "hashtags": ["hashtag1", "hashtag2"],
    "mentions": [],
    "call_to_action": "CTA text"
}`;
}

// ============================================
// REPURPOSING
// ============================================

export async function repurposeBlogToSocial(
    blog: BlogPost,
    platforms: Platform[],
    profile: ProductMarketingProfile
): Promise<Partial<AISocialPost>[]> {
    const posts: Partial<AISocialPost>[] = [];

    for (const platform of platforms) {
        const post = await generateSocialPost({
            product_id: blog.product_id,
            platform,
            content_type: platform === 'twitter' ? 'thread' : 'post',
            topic: blog.title,
            blog_id: blog.id,
            include_cta: true
        }, profile);

        posts.push({
            ...post,
            blog_id: blog.id,
            link_url: `/blog/${blog.slug}`
        });
    }

    return posts;
}
