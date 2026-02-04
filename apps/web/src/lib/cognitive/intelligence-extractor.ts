/**
 * KARR AI - Intelligence Extractor
 * 
 * Extracts deep insights from conversations including:
 * - Auto-generated titles and summaries
 * - Entity recognition (people, companies, concepts)
 * - User expertise signals
 * - Sentiment analysis
 * - Memory facts to store
 * 
 * Part of the Cognitive Digital Twin system.
 */

import { generateContent } from '@/lib/gemini';
import type { ChatMessage, EntityMention } from './session-manager';

/**
 * Robust JSON extraction from LLM responses
 * Handles extra text before/after JSON, markdown code blocks, and common malformations
 */
function extractJSON(text: string): any | null {
    // Try to extract JSON from markdown code blocks first
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
        try {
            return JSON.parse(codeBlockMatch[1].trim());
        } catch { /* continue */ }
    }

    // Try to find balanced braces
    let depth = 0;
    let startIdx = -1;
    let endIdx = -1;

    for (let i = 0; i < text.length; i++) {
        if (text[i] === '{') {
            if (depth === 0) startIdx = i;
            depth++;
        } else if (text[i] === '}') {
            depth--;
            if (depth === 0 && startIdx !== -1) {
                endIdx = i;
                break;
            }
        }
    }

    if (startIdx !== -1 && endIdx !== -1) {
        const jsonStr = text.substring(startIdx, endIdx + 1);
        try {
            return JSON.parse(jsonStr);
        } catch {
            // Try to fix common issues
            try {
                // Remove trailing commas before } or ]
                const fixed = jsonStr
                    .replace(/,\s*}/g, '}')
                    .replace(/,\s*]/g, ']')
                    .replace(/'/g, '"'); // Replace single quotes with double
                return JSON.parse(fixed);
            } catch { /* continue */ }
        }
    }

    return null;
}

// Types
export interface ConversationIntelligence {
    session: {
        title: string;
        titleEmoji: string;
        summary: string;
        primaryTopic: string;
        topics: string[];
        categories: string[];
    };
    entities: ExtractedEntity[];
    userInsights: {
        expertiseSignals: ExpertiseSignal[];
        communicationSignals: CommunicationSignal[];
        goalsDetected: DetectedGoal[];
        challengesDetected: DetectedChallenge[];
    };
    emotional: {
        dominantSentiment: string;
        sentimentJourney: SentimentPoint[];
        resolutionStatus: 'resolved' | 'partial' | 'unresolved' | 'ongoing';
        frustrationPoints: string[];
        satisfactionPoints: string[];
    };
    actionItems: ActionItem[];
    memoryFacts: MemoryFact[];
}

export interface ExtractedEntity {
    name: string;
    type: 'person' | 'company' | 'place' | 'product' | 'concept';
    subtype?: string;
    relationship?: string;
    context: string;
    facts: string[];
    firstMentionIndex: number;
}

export interface ExpertiseSignal {
    topic: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    evidence: string;
    confidence: number;
}

export interface CommunicationSignal {
    preference: string;
    evidence: string;
    confidence: number;
}

export interface DetectedGoal {
    goal: string;
    type: 'immediate' | 'ongoing' | 'learning';
    status: 'active' | 'completed' | 'blocked';
}

export interface DetectedChallenge {
    challenge: string;
    frequency: 'one_time' | 'recurring';
    resolved: boolean;
}

export interface SentimentPoint {
    messageIndex: number;
    sentiment: string;
    trigger?: string;
}

export interface ActionItem {
    task: string;
    deadline?: string;
    relatedEntity?: string;
    mentionedAt: number;
}

export interface MemoryFact {
    category: string;
    subject: string;
    predicate: string;
    object: string;
    fullText: string;
    confidence: number;
    isTemporal: boolean;
    temporalContext?: string;
}

/**
 * Generate a title for a conversation
 * Called after 3+ messages for sufficient context
 */
export async function generateSessionTitle(
    messages: ChatMessage[]
): Promise<{ title: string; emoji: string }> {
    if (messages.length < 2) {
        return { title: 'New Conversation', emoji: '💬' };
    }

    // Take first 5 messages for context
    const contextMessages = messages.slice(0, 5);
    const conversationText = contextMessages
        .map(m => `${m.role.toUpperCase()}: ${m.content.substring(0, 300)}`)
        .join('\n\n');

    const prompt = `Generate a concise, descriptive title for this conversation.

CONVERSATION:
${conversationText}

Requirements:
1. Title should be 5-8 words maximum
2. Capture the main topic or purpose
3. Be specific, not generic (avoid "Chat about taxes")
4. Include context if discussing someone specific (e.g., "GST Filing for Rahul's Bakery")

Also suggest one relevant emoji for this conversation.

Respond in JSON format only:
{
    "title": "Your descriptive title here",
    "emoji": "📋"
}`;

    try {
        const response = await generateContent(prompt);
        const parsed = extractJSON(response);
        if (parsed) {
            return {
                title: parsed.title || 'Untitled Conversation',
                emoji: parsed.emoji || '💬',
            };
        }
    } catch (error) {
        console.error('[IntelligenceExtractor] Error generating title:', error);
    }

    return { title: 'New Conversation', emoji: '💬' };
}

/**
 * Generate a summary for a conversation
 * Called when session becomes inactive
 */
export async function generateSessionSummary(
    messages: ChatMessage[]
): Promise<string> {
    if (messages.length < 2) {
        return 'Brief conversation with minimal content.';
    }

    const conversationText = messages
        .map(m => `${m.role.toUpperCase()}: ${m.content.substring(0, 500)}`)
        .join('\n\n');

    const prompt = `Summarize this conversation in 2-3 sentences. Focus on:
1. What the user was trying to accomplish
2. Key information or insights provided
3. Whether the issue was resolved

CONVERSATION:
${conversationText}

Write a natural, concise summary (2-3 sentences):`;

    try {
        const response = await generateContent(prompt);
        return response.trim();
    } catch (error) {
        console.error('[IntelligenceExtractor] Error generating summary:', error);
        return 'Conversation about various topics.';
    }
}

/**
 * Extract topics from a conversation
 */
export async function extractTopics(
    messages: ChatMessage[]
): Promise<{ topics: string[]; primaryTopic: string; categories: string[] }> {
    const conversationText = messages
        .map(m => `${m.role}: ${m.content.substring(0, 400)}`)
        .join('\n');

    const prompt = `Extract topics from this conversation.

CONVERSATION:
${conversationText}

Respond in JSON format:
{
    "topics": ["GST", "Input Credit", "GSTR-3B"],  // Specific topics discussed (max 8)
    "primaryTopic": "GST Input Credit",            // Main topic
    "categories": ["taxation", "compliance"]        // Broad categories (max 3)
}`;

    try {
        const response = await generateContent(prompt);
        const parsed = extractJSON(response);
        if (parsed) {
            return {
                topics: parsed.topics || [],
                primaryTopic: parsed.primaryTopic || '',
                categories: parsed.categories || [],
            };
        }
    } catch (error) {
        console.error('[IntelligenceExtractor] Error extracting topics:', error);
    }

    return { topics: [], primaryTopic: '', categories: [] };
}

/**
 * Extract entities (people, companies, concepts) from conversation
 */
export async function extractEntities(
    messages: ChatMessage[]
): Promise<ExtractedEntity[]> {
    const conversationText = messages
        .map((m, i) => `[${i}] ${m.role}: ${m.content.substring(0, 400)}`)
        .join('\n');

    const prompt = `Extract named entities from this conversation. Focus on:
- People (clients, colleagues, family members mentioned)
- Companies/Organizations
- Places (cities, countries)
- Products/Services
- Important concepts specific to user's context

CONVERSATION:
${conversationText}

Respond in JSON format:
{
    "entities": [
        {
            "name": "Rahul",
            "type": "person",
            "subtype": "client",
            "relationship": "User's client",
            "context": "Owns a bakery in Mumbai, GST registered",
            "facts": ["Annual turnover ~50L", "Quarterly GST filer"],
            "firstMentionIndex": 0
        }
    ]
}

Only include entities actually mentioned. If none found, return empty array.`;

    try {
        const response = await generateContent(prompt);
        const parsed = extractJSON(response);
        if (parsed) {
            return parsed.entities || [];
        }
    } catch (error) {
        console.error('[IntelligenceExtractor] Error extracting entities:', error);
    }

    return [];
}

/**
 * Analyze sentiment journey through conversation
 */
export async function analyzeSentiment(
    messages: ChatMessage[]
): Promise<{
    dominantSentiment: string;
    sentimentJourney: SentimentPoint[];
    resolutionStatus: 'resolved' | 'partial' | 'unresolved' | 'ongoing';
    frustrationPoints: string[];
    satisfactionPoints: string[];
}> {
    const userMessages = messages
        .filter(m => m.role === 'user')
        .map((m, i) => `[${i}] ${m.content.substring(0, 300)}`)
        .join('\n');

    const prompt = `Analyze the emotional journey in these user messages.

USER MESSAGES:
${userMessages}

Respond in JSON format:
{
    "dominantSentiment": "curious",  // curious, frustrated, satisfied, confused, learning
    "sentimentJourney": [
        {"messageIndex": 0, "sentiment": "curious", "trigger": null},
        {"messageIndex": 2, "sentiment": "frustrated", "trigger": "Didn't understand the concept"}
    ],
    "resolutionStatus": "resolved",  // resolved, partial, unresolved, ongoing
    "frustrationPoints": ["Complex filing process"],  // What caused frustration
    "satisfactionPoints": ["Got clear answer on rates"]  // What satisfied them
}`;

    try {
        const response = await generateContent(prompt);
        const parsed = extractJSON(response);
        if (parsed) {
            return {
                dominantSentiment: parsed.dominantSentiment || 'neutral',
                sentimentJourney: parsed.sentimentJourney || [],
                resolutionStatus: parsed.resolutionStatus || 'ongoing',
                frustrationPoints: parsed.frustrationPoints || [],
                satisfactionPoints: parsed.satisfactionPoints || [],
            };
        }
    } catch (error) {
        console.error('[IntelligenceExtractor] Error analyzing sentiment:', error);
    }

    return {
        dominantSentiment: 'neutral',
        sentimentJourney: [],
        resolutionStatus: 'ongoing',
        frustrationPoints: [],
        satisfactionPoints: [],
    };
}

/**
 * Extract user insights (expertise, preferences, goals)
 */
export async function extractUserInsights(
    messages: ChatMessage[]
): Promise<{
    expertiseSignals: ExpertiseSignal[];
    communicationSignals: CommunicationSignal[];
    goalsDetected: DetectedGoal[];
    challengesDetected: DetectedChallenge[];
}> {
    const conversationText = messages
        .map(m => `${m.role.toUpperCase()}: ${m.content.substring(0, 400)}`)
        .join('\n\n');

    const prompt = `Analyze this conversation to understand the USER better.

CONVERSATION:
${conversationText}

Extract insights about the user in JSON format:
{
    "expertiseSignals": [
        {
            "topic": "GST",
            "level": "intermediate",  // beginner, intermediate, advanced, expert
            "evidence": "Asked detailed questions about input credit rules",
            "confidence": 0.8
        }
    ],
    "communicationSignals": [
        {
            "preference": "prefers_examples",
            "evidence": "Responded positively when examples were given",
            "confidence": 0.7
        }
    ],
    "goalsDetected": [
        {
            "goal": "Help client file quarterly GST returns",
            "type": "ongoing",  // immediate, ongoing, learning
            "status": "active"  // active, completed, blocked
        }
    ],
    "challengesDetected": [
        {
            "challenge": "Reconciling GSTR-2A with purchase records",
            "frequency": "recurring",  // one_time, recurring
            "resolved": false
        }
    ]
}

Only include patterns you can confidently infer. Empty arrays are fine.`;

    try {
        const response = await generateContent(prompt);
        const parsed = extractJSON(response);
        if (parsed) {
            return {
                expertiseSignals: parsed.expertiseSignals || [],
                communicationSignals: parsed.communicationSignals || [],
                goalsDetected: parsed.goalsDetected || [],
                challengesDetected: parsed.challengesDetected || [],
            };
        }
    } catch (error) {
        console.error('[IntelligenceExtractor] Error extracting user insights:', error);
    }

    return {
        expertiseSignals: [],
        communicationSignals: [],
        goalsDetected: [],
        challengesDetected: [],
    };
}

/**
 * Extract memory facts to store for long-term recall
 */
export async function extractMemoryFacts(
    messages: ChatMessage[]
): Promise<MemoryFact[]> {
    const conversationText = messages
        .map(m => `${m.role.toUpperCase()}: ${m.content.substring(0, 400)}`)
        .join('\n\n');

    const prompt = `Extract factual information from this conversation that should be remembered for future reference.

CONVERSATION:
${conversationText}

Extract facts in JSON format. Focus on:
- User preferences ("User prefers detailed explanations")
- Entity information ("Rahul owns a bakery in Mumbai")
- Goals and challenges
- Important context that might be useful later

{
    "facts": [
        {
            "category": "entity_info",  // preference, entity_info, goal, challenge, expertise, context
            "subject": "Rahul",
            "predicate": "owns",
            "object": "a bakery in Mumbai with ~50L annual turnover",
            "fullText": "Rahul owns a bakery in Mumbai with approximately 50L annual turnover",
            "confidence": 0.9,
            "isTemporal": false,
            "temporalContext": null
        }
    ]
}

Only include facts with high confidence. Empty array is fine.`;

    try {
        const response = await generateContent(prompt);
        const parsed = extractJSON(response);
        if (parsed) {
            return parsed.facts || [];
        }
    } catch (error) {
        console.error('[IntelligenceExtractor] Error extracting memory facts:', error);
    }

    return [];
}

/**
 * Full conversation intelligence extraction
 * Combines all extraction methods for comprehensive analysis
 */
export async function extractFullIntelligence(
    messages: ChatMessage[]
): Promise<ConversationIntelligence> {
    // Run extractions in parallel for efficiency
    const [
        titleResult,
        summary,
        topicsResult,
        entities,
        sentimentResult,
        userInsights,
        memoryFacts,
    ] = await Promise.all([
        generateSessionTitle(messages),
        generateSessionSummary(messages),
        extractTopics(messages),
        extractEntities(messages),
        analyzeSentiment(messages),
        extractUserInsights(messages),
        extractMemoryFacts(messages),
    ]);

    return {
        session: {
            title: titleResult.title,
            titleEmoji: titleResult.emoji,
            summary,
            primaryTopic: topicsResult.primaryTopic,
            topics: topicsResult.topics,
            categories: topicsResult.categories,
        },
        entities,
        userInsights,
        emotional: sentimentResult,
        actionItems: [], // TODO: Extract action items
        memoryFacts,
    };
}

/**
 * Quick title generation for immediate use
 * More lightweight than full extraction
 */
export async function quickGenerateTitle(
    userQuery: string,
    assistantResponse: string
): Promise<{ title: string; emoji: string }> {
    const prompt = `Generate a 5-7 word title for this exchange:

User: ${userQuery.substring(0, 200)}
Assistant: ${assistantResponse.substring(0, 300)}

Respond in JSON: {"title": "...", "emoji": "..."}`;

    try {
        const response = await generateContent(prompt);
        const parsed = extractJSON(response);
        if (parsed) {
            return parsed;
        }
    } catch (error) {
        console.error('[IntelligenceExtractor] Error in quick title:', error);
    }

    return { title: 'New Conversation', emoji: '💬' };
}

export default {
    generateSessionTitle,
    generateSessionSummary,
    extractTopics,
    extractEntities,
    analyzeSentiment,
    extractUserInsights,
    extractMemoryFacts,
    extractFullIntelligence,
    quickGenerateTitle,
};
