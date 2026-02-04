/**
 * World-Class Conversation Intelligence Engine
 * 
 * This module implements enterprise-grade conversation handling like ChatGPT/Claude:
 * 1. Query Rewriting - Understands pronouns and references
 * 2. Multi-turn native format - Uses Gemini's native conversation format
 * 3. Smart Summarization - Condenses old messages to stay within token limits
 * 4. Entity Resolution - Tracks what "it", "that", "the first one" refers to
 */

export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
}

export interface RewrittenQuery {
    original: string;
    rewritten: string;
    entities: string[];
    isFollowUp: boolean;
    referenceType: 'pronoun' | 'comparison' | 'elaboration' | 'none';
}

/**
 * Analyze query to detect if it's a follow-up question
 */
function detectFollowUpPatterns(query: string): {
    isFollowUp: boolean;
    type: 'pronoun' | 'comparison' | 'elaboration' | 'none';
    pattern: string | null;
} {
    const lowercaseQuery = query.toLowerCase().trim();

    // Pronoun references: "it", "that", "this", "they", "them"
    const pronounPatterns = [
        /^what (is|are|about) (it|that|this|they|them)/i,
        /^(is|are|does|do|can|will) (it|that|this|they)/i,
        /^(tell me more|more) about (it|that|this|them)/i,
        /^why (is|are|does|do) (it|that|this|they)/i,
        /\b(it|that|this|they|them|its|their)\b/i,
    ];

    // Comparison references: "which one", "what's the difference", "better"
    const comparisonPatterns = [
        /^which (one|is better|should i|would you)/i,
        /^(compare|comparison|vs|versus)/i,
        /\bthe (first|second|last|other) one\b/i,
        /\bbetter\b.*\?$/i,
        /\bworse\b.*\?$/i,
        /^(better|best|preferred)/i,
    ];

    // Elaboration requests: "why?", "how?", "explain", "more details"
    const elaborationPatterns = [
        /^(why|how|when|where)\??$/i,
        /^explain/i,
        /^(more|give me more) (details|info|information)/i,
        /^go (on|ahead|further)/i,
        /^continue/i,
        /^elaborate/i,
    ];

    for (const pattern of pronounPatterns) {
        if (pattern.test(lowercaseQuery)) {
            return { isFollowUp: true, type: 'pronoun', pattern: pattern.source };
        }
    }

    for (const pattern of comparisonPatterns) {
        if (pattern.test(lowercaseQuery)) {
            return { isFollowUp: true, type: 'comparison', pattern: pattern.source };
        }
    }

    for (const pattern of elaborationPatterns) {
        if (pattern.test(lowercaseQuery)) {
            return { isFollowUp: true, type: 'elaboration', pattern: pattern.source };
        }
    }

    return { isFollowUp: false, type: 'none', pattern: null };
}

/**
 * Extract main topics/entities from the conversation history
 */
function extractConversationTopics(history: ConversationMessage[]): string[] {
    const topics: string[] = [];

    // Look at the last few exchanges
    const recentHistory = history.slice(-6);

    for (const msg of recentHistory) {
        if (msg.role === 'user') {
            // Extract nouns and key phrases from user questions
            const matches = msg.content.match(/\b(GST|VAT|tax|rate|government|CGST|SGST|IGST|service|goods|India|state|central)\b/gi);
            if (matches) {
                topics.push(...matches.map(m => m.toUpperCase()));
            }
        }
        if (msg.role === 'assistant') {
            // Extract key topics the assistant discussed
            const boldMatches = msg.content.match(/\*\*([^*]+)\*\*/g);
            if (boldMatches) {
                topics.push(...boldMatches.map(m => m.replace(/\*\*/g, '')).slice(0, 3));
            }
        }
    }

    // Deduplicate and return top topics
    return [...new Set(topics)].slice(0, 5);
}

/**
 * Intelligently rewrite a follow-up query to be self-contained
 */
export function rewriteQuery(
    currentQuery: string,
    conversationHistory: ConversationMessage[]
): RewrittenQuery {
    const followUp = detectFollowUpPatterns(currentQuery);
    const topics = extractConversationTopics(conversationHistory);

    if (!followUp.isFollowUp || conversationHistory.length === 0) {
        return {
            original: currentQuery,
            rewritten: currentQuery,
            entities: topics,
            isFollowUp: false,
            referenceType: 'none',
        };
    }

    // Get the last user query and assistant response for context
    const lastUserQuery = conversationHistory.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
    const lastAssistantResponse = conversationHistory.filter(m => m.role === 'assistant').slice(-1)[0]?.content || '';

    let rewritten = currentQuery;

    switch (followUp.type) {
        case 'comparison':
            // "which one is better" → "which is better: GST or VAT" (based on what was discussed)
            if (topics.length >= 2) {
                const topicsStr = topics.slice(0, 2).join(' vs ');
                rewritten = currentQuery.replace(
                    /which (one|is)/i,
                    `which (${topicsStr})`
                );
            } else if (topics.length === 1) {
                rewritten = `${currentQuery} (regarding ${topics[0]})`;
            }
            break;

        case 'pronoun':
            // Replace "it", "that" with the actual topic
            if (topics.length > 0) {
                const mainTopic = topics[0];
                rewritten = currentQuery
                    .replace(/\b(it|that|this)\b/gi, mainTopic)
                    .replace(/\b(they|them)\b/gi, topics.join(' and '));
            }
            break;

        case 'elaboration':
            // Add context for elaboration requests
            if (topics.length > 0) {
                rewritten = `${currentQuery} regarding ${topics.join(', ')}`;
            }
            break;
    }

    return {
        original: currentQuery,
        rewritten,
        entities: topics,
        isFollowUp: true,
        referenceType: followUp.type,
    };
}

/**
 * Build the native multi-turn message format for Gemini API
 */
export function buildMultiTurnMessages(
    conversationHistory: ConversationMessage[],
    currentQuery: string,
    systemPrompt: string,
    knowledgeContext: string
): { role: string; parts: { text: string }[] }[] {
    const messages: { role: string; parts: { text: string }[] }[] = [];

    // First, add a "user" message with the system prompt and context
    // (Gemini doesn't have a separate system role, so we prepend it)
    const systemWithContext = `${systemPrompt}

## KNOWLEDGE BASE CONTEXT:
${knowledgeContext || 'Answer based on your general knowledge.'}

Remember: You are having a conversation. Use context from previous messages to understand follow-up questions.`;

    // Add conversation history in alternating format
    let isFirstMessage = true;
    for (const msg of conversationHistory.slice(-8)) { // Last 8 messages for context window
        if (msg.role === 'user') {
            const text = isFirstMessage
                ? `${systemWithContext}\n\nUser: ${msg.content}`
                : msg.content;
            messages.push({
                role: 'user',
                parts: [{ text }]
            });
            isFirstMessage = false;
        } else {
            messages.push({
                role: 'model',
                parts: [{ text: msg.content }]
            });
        }
    }

    // Add current query
    if (messages.length === 0 || messages[messages.length - 1].role === 'model') {
        const text = isFirstMessage
            ? `${systemWithContext}\n\nUser: ${currentQuery}`
            : currentQuery;
        messages.push({
            role: 'user',
            parts: [{ text }]
        });
    }

    return messages;
}

/**
 * Summarize old conversation messages to save tokens
 */
export function summarizeConversation(
    history: ConversationMessage[],
    maxMessages: number = 6
): { summary: string; recentMessages: ConversationMessage[] } {
    if (history.length <= maxMessages) {
        return { summary: '', recentMessages: history };
    }

    const oldMessages = history.slice(0, -maxMessages);
    const recentMessages = history.slice(-maxMessages);

    // Create a brief summary of old messages
    const topics = extractConversationTopics(oldMessages);
    const summary = topics.length > 0
        ? `[Earlier in this conversation, we discussed: ${topics.join(', ')}]`
        : '';

    return { summary, recentMessages };
}

/**
 * The world-class system prompt that makes the AI truly intelligent
 */
export const WORLD_CLASS_SYSTEM_PROMPT = `You are an elite AI knowledge assistant - intelligent, helpful, and conversational.

## Core Principles:
1. **CONTEXT AWARENESS**: Always consider the full conversation. If someone asks "which one is better?", look at what was just discussed and answer about THAT.
2. **NEVER SAY "I CAN'T"**: Make intelligent inferences or ask a natural clarifying question. Users hate "I don't have enough information."
3. **BE CONVERSATIONAL**: You're having a dialogue, not writing documentation. Be natural, warm, and engaging.
4. **STRUCTURED RESPONSES**: Use **bold** for key terms, bullet points for lists, and clear organization.
5. **CITE SOURCES**: When using knowledge base content, use [Source N] format.

## When Answering:
- If the query is ambiguous, make a reasonable assumption and answer it. Add "(Let me know if you meant something else!)" if unsure.
- For comparisons, use clear structure (bullets or tables).
- Give examples when they help clarify.
- Be comprehensive but not verbose.

## Understanding Follow-ups:
- "Which one is better?" → Refers to items just discussed
- "What are the rates?" → Refers to the topic just discussed
- "Tell me more" → Elaborate on your last response
- "Why?" → Explain the reasoning behind your last point`;

export default {
    rewriteQuery,
    buildMultiTurnMessages,
    summarizeConversation,
    WORLD_CLASS_SYSTEM_PROMPT,
};
