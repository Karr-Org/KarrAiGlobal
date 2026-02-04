/**
 * 🧬 KARR AI - ADAPTIVE INTELLIGENCE SYSTEM
 * 
 * THE MOST REVOLUTIONARY AI PERSONALIZATION ENGINE EVER BUILT
 * 
 * This system creates a true "Digital Twin" of the user's mind:
 * - Adapts response complexity based on per-topic expertise
 * - Detects emotional state and adjusts tone
 * - Uses temporal patterns for context
 * - Provides proactive intelligence
 * 
 * NO OTHER AI DOES THIS AT THIS LEVEL.
 * 
 * @author Karr AI Architecture Team
 * @version 3.0 - REVOLUTIONARY EDITION
 */

import { createClient } from '@supabase/supabase-js';
import { createContextFusion, type FusedContext } from './context-fusion';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// 🎯 ADAPTIVE RESPONSE CONFIGURATION
// ============================================================================

export interface AdaptiveConfig {
    // Expertise-based adaptations
    expertiseLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    shouldSimplify: boolean;
    shouldProvideExamples: boolean;
    technicalDepth: 'basic' | 'moderate' | 'detailed' | 'expert';

    // Communication style
    responseLength: 'brief' | 'balanced' | 'comprehensive';
    useStepByStep: boolean;
    useAnalogies: boolean;
    vocabularyLevel: 'simple' | 'professional' | 'technical';

    // Emotional adaptation
    detectedMood: 'positive' | 'neutral' | 'frustrated' | 'confused' | 'urgent';
    shouldBeMorePatient: boolean;
    shouldValidateFeelings: boolean;

    // Temporal context
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    isUsualActiveTime: boolean;
    daysSinceLastVisit: number;

    // Proactive elements
    hasRelevantInsight: boolean;
    shouldMentionGoal: boolean;
    shouldReferenceEntity: boolean;

    // The magic prompt injection
    adaptiveSystemPrompt: string;
}

export interface EmotionalSignal {
    mood: 'positive' | 'neutral' | 'frustrated' | 'confused' | 'urgent';
    confidence: number;
    triggers: string[];
}

export interface TemporalContext {
    currentHour: number;
    dayOfWeek: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    isWeekend: boolean;
    userActiveHours: number[];
    isUsualActiveTime: boolean;
    lastInteractionDaysAgo: number;
}

// ============================================================================
// 🧠 EMOTIONAL INTELLIGENCE DETECTOR
// ============================================================================

const FRUSTRATION_SIGNALS = [
    'not working', 'doesn\'t work', 'failed', 'error', 'stuck',
    'again', 'still', 'why isn\'t', 'why doesn\'t', 'confused',
    'don\'t understand', 'makes no sense', 'frustrated', 'annoying',
    'waste of time', 'same problem', 'keeps happening', 'broken'
];

const URGENCY_SIGNALS = [
    'urgent', 'asap', 'immediately', 'deadline', 'today', 'now',
    'critical', 'emergency', 'right now', 'hurry', 'quickly',
    'as soon as possible', 'time sensitive', 'by tomorrow'
];

const CONFUSION_SIGNALS = [
    'what is', 'what does', 'how does', 'explain', 'clarify',
    'mean', 'definition', 'not sure', 'don\'t know', 'what\'s the',
    'could you explain', 'i\'m new to', 'beginner', 'first time'
];

const POSITIVE_SIGNALS = [
    'thanks', 'thank you', 'great', 'awesome', 'perfect',
    'excellent', 'helpful', 'appreciate', 'wonderful', 'amazing',
    'good job', 'well done', 'exactly what', 'this is great'
];

/**
 * Detect emotional state from user query
 */
export function detectEmotionalState(query: string): EmotionalSignal {
    const queryLower = query.toLowerCase();
    const triggers: string[] = [];

    // Check for frustration
    const frustrationCount = FRUSTRATION_SIGNALS.filter(s => {
        if (queryLower.includes(s)) {
            triggers.push(s);
            return true;
        }
        return false;
    }).length;

    // Check for urgency
    const urgencyCount = URGENCY_SIGNALS.filter(s => {
        if (queryLower.includes(s)) {
            triggers.push(s);
            return true;
        }
        return false;
    }).length;

    // Check for confusion
    const confusionCount = CONFUSION_SIGNALS.filter(s => {
        if (queryLower.includes(s)) {
            triggers.push(s);
            return true;
        }
        return false;
    }).length;

    // Check for positive
    const positiveCount = POSITIVE_SIGNALS.filter(s => {
        if (queryLower.includes(s)) {
            triggers.push(s);
            return true;
        }
        return false;
    }).length;

    // Determine dominant mood
    const scores = {
        frustrated: frustrationCount * 1.5, // Weight frustration more heavily
        urgent: urgencyCount * 1.3,
        confused: confusionCount,
        positive: positiveCount,
    };

    const maxScore = Math.max(...Object.values(scores));

    if (maxScore === 0) {
        return { mood: 'neutral', confidence: 0.8, triggers: [] };
    }

    if (scores.frustrated === maxScore && frustrationCount >= 1) {
        return { mood: 'frustrated', confidence: Math.min(0.9, 0.5 + frustrationCount * 0.15), triggers };
    }
    if (scores.urgent === maxScore && urgencyCount >= 1) {
        return { mood: 'urgent', confidence: Math.min(0.9, 0.5 + urgencyCount * 0.15), triggers };
    }
    if (scores.confused === maxScore && confusionCount >= 1) {
        return { mood: 'confused', confidence: Math.min(0.9, 0.5 + confusionCount * 0.1), triggers };
    }
    if (scores.positive === maxScore && positiveCount >= 1) {
        return { mood: 'positive', confidence: Math.min(0.9, 0.5 + positiveCount * 0.1), triggers };
    }

    return { mood: 'neutral', confidence: 0.7, triggers };
}

// ============================================================================
// ⏰ TEMPORAL AWARENESS ENGINE
// ============================================================================

/**
 * Build temporal context for the user
 */
export async function buildTemporalContext(
    productUserId: string
): Promise<TemporalContext> {
    const now = new Date();
    const currentHour = now.getHours();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[now.getDay()];
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // Determine time of day
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (currentHour >= 5 && currentHour < 12) {
        timeOfDay = 'morning';
    } else if (currentHour >= 12 && currentHour < 17) {
        timeOfDay = 'afternoon';
    } else if (currentHour >= 17 && currentHour < 21) {
        timeOfDay = 'evening';
    } else {
        timeOfDay = 'night';
    }

    // Get user's profile for active hours
    const { data: profile } = await supabase
        .from('user_cognitive_profile')
        .select('active_hours, last_interaction_at')
        .eq('product_user_id', productUserId)
        .single();

    const activeHours = profile?.active_hours?.hours || [];
    const isUsualActiveTime = activeHours.includes(currentHour);

    let lastInteractionDaysAgo = 0;
    if (profile?.last_interaction_at) {
        const lastDate = new Date(profile.last_interaction_at);
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        lastInteractionDaysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
        currentHour,
        dayOfWeek,
        timeOfDay,
        isWeekend,
        userActiveHours: activeHours,
        isUsualActiveTime,
        lastInteractionDaysAgo,
    };
}

// ============================================================================
// 🎓 EXPERTISE-ADAPTIVE RESPONSE BUILDER
// ============================================================================

/**
 * Get expertise level for a specific topic
 */
export function getTopicExpertise(
    profile: FusedContext['userProfile'],
    query: string,
    defaultLevel: 'beginner' | 'intermediate' = 'intermediate'
): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (!profile?.expertiseLevels) return defaultLevel;

    const queryLower = query.toLowerCase();

    // Find matching expertise
    for (const [topic, data] of Object.entries(profile.expertiseLevels)) {
        if (queryLower.includes(topic.toLowerCase())) {
            return data.level as 'beginner' | 'intermediate' | 'advanced' | 'expert';
        }
    }

    // If no specific topic matched, check if user has general high expertise
    const expertiseValues = Object.values(profile.expertiseLevels);
    if (expertiseValues.length > 0) {
        const avgLevel = expertiseValues.reduce((sum, e) => {
            const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
            return sum + levels[e.level as keyof typeof levels];
        }, 0) / expertiseValues.length;

        if (avgLevel >= 3.5) return 'expert';
        if (avgLevel >= 2.5) return 'advanced';
        if (avgLevel >= 1.5) return 'intermediate';
    }

    return defaultLevel;
}

// ============================================================================
// 📈 LEARNING VELOCITY ANALYSIS
// ============================================================================

export interface LearningVelocityAnalysis {
    isFastLearner: boolean;
    learningSpeed: 'slow' | 'average' | 'fast' | 'exceptional';
    topicsWithProgress: string[];
    averageSessionsPerLevel: number | null;
    recommendation: string;
}

/**
 * Analyze user's learning velocity across topics
 * This helps us adjust complexity dynamically for fast learners
 */
export function analyzeLearningVelocity(
    profile: FusedContext['userProfile']
): LearningVelocityAnalysis {
    const velocity = profile?.learningVelocity || {};
    const topics = Object.keys(velocity);

    if (topics.length === 0) {
        return {
            isFastLearner: false,
            learningSpeed: 'average',
            topicsWithProgress: [],
            averageSessionsPerLevel: null,
            recommendation: 'Not enough data to assess learning speed',
        };
    }

    // Analyze learning patterns
    let totalLevelChanges = 0;
    let totalSessionsToLevel = 0;
    const topicsWithProgress: string[] = [];

    for (const [topic, data] of Object.entries(velocity)) {
        const topicData = data as any;
        if (topicData.levelChanges?.length > 0) {
            totalLevelChanges += topicData.levelChanges.length;
            topicsWithProgress.push(topic);

            // Sum up sessions it took to level up
            topicData.levelChanges.forEach((change: any) => {
                if (change.sessionsToLevel) {
                    totalSessionsToLevel += change.sessionsToLevel;
                }
            });
        }
    }

    // Calculate average sessions per level
    const avgSessionsPerLevel = totalLevelChanges > 0
        ? Math.round(totalSessionsToLevel / totalLevelChanges)
        : null;

    // Determine learning speed
    let learningSpeed: 'slow' | 'average' | 'fast' | 'exceptional' = 'average';
    let recommendation = '';

    if (avgSessionsPerLevel !== null) {
        if (avgSessionsPerLevel <= 2) {
            learningSpeed = 'exceptional';
            recommendation = 'This user learns extremely fast! Skip basics, use advanced terminology freely, and challenge them with edge cases.';
        } else if (avgSessionsPerLevel <= 5) {
            learningSpeed = 'fast';
            recommendation = 'Quick learner. Increase complexity slightly, mention advanced topics they could explore.';
        } else if (avgSessionsPerLevel <= 10) {
            learningSpeed = 'average';
            recommendation = 'Standard learning pace. Balance depth with accessibility.';
        } else {
            learningSpeed = 'slow';
            recommendation = 'Takes time to absorb concepts. Be extra patient, use more examples, reinforce key points.';
        }
    }

    return {
        isFastLearner: learningSpeed === 'fast' || learningSpeed === 'exceptional',
        learningSpeed,
        topicsWithProgress,
        averageSessionsPerLevel: avgSessionsPerLevel,
        recommendation,
    };
}

/**
 * Build learning velocity prompt addition
 */
export function buildLearningVelocityPrompt(analysis: LearningVelocityAnalysis): string {
    if (analysis.averageSessionsPerLevel === null) {
        return '';
    }

    return `
## Learning Style Analysis
- Learning Speed: **${analysis.learningSpeed.toUpperCase()}**
- ${analysis.recommendation}
${analysis.isFastLearner ? '- Feel free to introduce more advanced concepts proactively' : '- Take time to ensure understanding before moving on'}`;
}

/**
 * Build expertise-adaptive prompt section
 */
export function buildExpertiseAdaptivePrompt(
    expertiseLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
): string {
    switch (expertiseLevel) {
        case 'beginner':
            return `
## Expertise Adaptation: BEGINNER USER
- Use simple, everyday language
- Always explain jargon and technical terms
- Provide real-world analogies
- Use step-by-step explanations
- Include examples for every concept
- Avoid assuming prior knowledge
- Be encouraging and patient`;

        case 'intermediate':
            return `
## Expertise Adaptation: INTERMEDIATE USER
- Use professional language with key terms
- Brief explanations for complex concepts
- Provide practical examples
- Balance depth with accessibility
- Mention relevant advanced topics they could explore`;

        case 'advanced':
            return `
## Expertise Adaptation: ADVANCED USER
- Use technical/professional terminology freely
- Focus on nuance and edge cases
- Provide efficient, information-dense responses
- Reference regulations, cases, or technical specs
- Skip basic explanations`;

        case 'expert':
            return `
## Expertise Adaptation: EXPERT USER
- Peer-level communication
- Deep technical discussion welcomed
- Focus on latest developments, exceptions, edge cases
- Reference specific sections, rulings, or technical details
- Skip all foundational explanations`;
    }
}

// ============================================================================
// 💡 PROACTIVE INTELLIGENCE BUILDER
// ============================================================================

export interface ProactiveElement {
    type: 'insight' | 'reminder' | 'goal' | 'entity' | 'tip' | 'warning';
    title: string;
    content: string;
    relevance: 'high' | 'medium' | 'low';
    actionable: boolean;
    relatedTo?: string;
}

/**
 * Build proactive elements based on context
 */
export async function buildProactiveElements(
    productUserId: string,
    query: string,
    context: FusedContext
): Promise<ProactiveElement[]> {
    const elements: ProactiveElement[] = [];

    // Check for entity mentions in query
    const queryLower = query.toLowerCase();
    for (const entity of context.relevantEntities) {
        if (queryLower.includes(entity.name.toLowerCase())) {
            elements.push({
                type: 'entity',
                title: `About ${entity.name}`,
                content: entity.context || `${entity.type}: ${entity.relationship || 'Known contact'}`,
                relevance: 'high',
                actionable: false,
                relatedTo: entity.name,
            });
        }
    }

    // Check for goal alignment
    if (context.userProfile?.activeGoals) {
        for (const goal of context.userProfile.activeGoals.slice(0, 2)) {
            const goalWords = goal.goal.toLowerCase().split(/\s+/);
            const matches = goalWords.filter((w: string) => queryLower.includes(w)).length;
            if (matches >= 2) {
                elements.push({
                    type: 'goal',
                    title: 'This relates to your goal',
                    content: goal.goal,
                    relevance: 'medium',
                    actionable: true,
                });
            }
        }
    }

    // Add pending insights
    for (const insight of context.pendingInsights.slice(0, 2)) {
        elements.push({
            type: 'insight',
            title: insight.title,
            content: insight.description,
            relevance: insight.priority === 'high' ? 'high' : 'medium',
            actionable: true,
        });
    }

    return elements;
}

// ============================================================================
// 🎨 MASTER ADAPTIVE PROMPT BUILDER
// ============================================================================

/**
 * THE MASTER FUNCTION: Build a complete adaptive configuration
 */
export async function buildAdaptiveConfig(
    productUserId: string,
    productId: string,
    query: string
): Promise<AdaptiveConfig> {
    // Parallel fetch all context
    const contextFusion = createContextFusion();
    const [context, temporalContext] = await Promise.all([
        contextFusion.buildContext(productUserId, productId, query),
        buildTemporalContext(productUserId),
    ]);

    // Detect emotional state
    const emotionalState = detectEmotionalState(query);

    // Get expertise level for this query
    const expertiseLevel = getTopicExpertise(context.userProfile, query);

    // Build proactive elements
    const proactiveElements = await buildProactiveElements(productUserId, query, context);

    // Determine communication adaptations
    const profile = context.userProfile;
    const responseLength = profile?.preferredResponseLength || 'balanced';
    const useStepByStep = profile?.communicationStyle?.includes('step') ||
        expertiseLevel === 'beginner' ||
        emotionalState.mood === 'confused';

    // Build the mega-prompt
    const promptSections: string[] = [];

    // 1. User profile context
    if (context.systemPromptAdditions) {
        promptSections.push(context.systemPromptAdditions);
    }

    // 2. Expertise adaptation
    promptSections.push(buildExpertiseAdaptivePrompt(expertiseLevel));

    // 3. Emotional adaptation
    if (emotionalState.mood !== 'neutral') {
        promptSections.push(buildEmotionalAdaptation(emotionalState));
    }

    // 4. Temporal context
    promptSections.push(buildTemporalPrompt(temporalContext));

    // 5. Learning velocity analysis
    const learningAnalysis = analyzeLearningVelocity(context.userProfile);
    const velocityPrompt = buildLearningVelocityPrompt(learningAnalysis);
    if (velocityPrompt) {
        promptSections.push(velocityPrompt);
    }

    // 6. Proactive elements
    if (proactiveElements.length > 0) {
        promptSections.push(buildProactivePrompt(proactiveElements));
    }

    return {
        expertiseLevel,
        shouldSimplify: expertiseLevel === 'beginner' || emotionalState.mood === 'confused',
        shouldProvideExamples: expertiseLevel !== 'expert',
        technicalDepth: expertiseLevel === 'expert' ? 'expert' :
            expertiseLevel === 'advanced' ? 'detailed' :
                expertiseLevel === 'intermediate' ? 'moderate' : 'basic',

        responseLength: responseLength as 'brief' | 'balanced' | 'comprehensive',
        useStepByStep,
        useAnalogies: expertiseLevel === 'beginner',
        vocabularyLevel: expertiseLevel === 'expert' ? 'technical' :
            expertiseLevel === 'advanced' ? 'professional' : 'simple',

        detectedMood: emotionalState.mood,
        shouldBeMorePatient: emotionalState.mood === 'frustrated' || emotionalState.mood === 'confused',
        shouldValidateFeelings: emotionalState.mood === 'frustrated',

        timeOfDay: temporalContext.timeOfDay,
        isUsualActiveTime: temporalContext.isUsualActiveTime,
        daysSinceLastVisit: temporalContext.lastInteractionDaysAgo,

        hasRelevantInsight: context.pendingInsights.length > 0,
        shouldMentionGoal: proactiveElements.some(e => e.type === 'goal'),
        shouldReferenceEntity: proactiveElements.some(e => e.type === 'entity'),

        adaptiveSystemPrompt: promptSections.join('\n\n'),
    };
}

// ============================================================================
// 🎭 EMOTIONAL ADAPTATION PROMPTS
// ============================================================================

function buildEmotionalAdaptation(emotional: EmotionalSignal): string {
    switch (emotional.mood) {
        case 'frustrated':
            return `
## Emotional Context: User seems FRUSTRATED
- Acknowledge their frustration briefly and empathetically
- Be solution-focused and direct
- Avoid lengthy preambles - get to the answer quickly
- Offer a clear, actionable next step
- Be extra patient if they need clarification`;

        case 'confused':
            return `
## Emotional Context: User seems CONFUSED
- Start with the simplest explanation
- Use analogies to familiar concepts
- Break down into small, digestible steps
- Check for understanding after key points
- Encourage questions`;

        case 'urgent':
            return `
## Emotional Context: User has URGENT need
- Be direct and concise
- Lead with the answer, then explain
- Highlight the most critical information first
- Skip nice-to-know details for now
- Offer to elaborate if they have time later`;

        case 'positive':
            return `
## Emotional Context: User is in POSITIVE mood
- Match their energy
- Feel free to be more conversational
- Celebrate their progress if applicable
- Suggest advanced topics they might enjoy`;

        default:
            return '';
    }
}

// ============================================================================
// ⏰ TEMPORAL ADAPTATION PROMPTS
// ============================================================================

function buildTemporalPrompt(temporal: TemporalContext): string {
    const sections: string[] = [`## Temporal Context`];

    if (temporal.lastInteractionDaysAgo > 7) {
        sections.push(`- User returning after ${temporal.lastInteractionDaysAgo} days - consider a warm welcome back`);
    }

    if (temporal.timeOfDay === 'night' || temporal.timeOfDay === 'evening') {
        sections.push(`- It's ${temporal.timeOfDay} - keep responses efficient as user may be tired`);
    }

    if (temporal.isWeekend) {
        sections.push(`- It's the weekend - user might be catching up on work, be understanding of their time`);
    }

    if (!temporal.isUsualActiveTime && temporal.userActiveHours.length > 0) {
        sections.push(`- User is active at an unusual time - they may be dealing with something urgent`);
    }

    return sections.length > 1 ? sections.join('\n') : '';
}

// ============================================================================
// 💡 PROACTIVE INTELLIGENCE PROMPTS
// ============================================================================

function buildProactivePrompt(elements: ProactiveElement[]): string {
    if (elements.length === 0) return '';

    const sections = [`## Proactive Intelligence Available`];
    sections.push(`You have access to these contextual facts - use them naturally if relevant:`);

    for (const element of elements) {
        switch (element.type) {
            case 'entity':
                sections.push(`- **${element.title}**: ${element.content}`);
                break;
            case 'goal':
                sections.push(`- User's goal: "${element.content}" - reference if helping them progress`);
                break;
            case 'insight':
                sections.push(`- Insight: ${element.title} - ${element.content}`);
                break;
        }
    }

    sections.push(`\nUse this information naturally - don't force it if not relevant to the query.`);

    return sections.join('\n');
}

// ============================================================================
// 🌟 WELCOME MESSAGE GENERATOR
// ============================================================================

export async function generateWelcomeMessage(
    productUserId: string,
    productId: string
): Promise<{
    greeting: string;
    insights: ProactiveElement[];
    quickActions: string[];
}> {
    const contextFusion = createContextFusion();
    const [context, temporal] = await Promise.all([
        contextFusion.buildContext(productUserId, productId, ''),
        buildTemporalContext(productUserId),
    ]);

    // Extract user's context for personalization
    const activeGoals = context.userProfile?.activeGoals || [];
    const entities = context.relevantEntities || [];
    const recentSession = context.recentSessions?.[0];
    const daysAgo = temporal.lastInteractionDaysAgo;

    // Time-based emoji
    const timeEmoji = {
        morning: '☀️',
        afternoon: '👋',
        evening: '🌙',
        night: '🦉',
    }[temporal.timeOfDay];

    // Build a PERSONAL, CARING greeting message
    let personalMessage = '';
    const quickActions: string[] = [];

    // Check what we know about the user to craft the perfect message
    const hasGoals = activeGoals.length > 0;
    const hasEntities = entities.length > 0;
    const hasRecentSession = recentSession && recentSession.title;

    // Get key entity name if available
    const entityName = hasEntities ? entities[0].name : null;

    // Get primary goal if available
    const primaryGoal = hasGoals ? activeGoals[0].goal : null;

    // Create different greeting variants based on what we know
    if (hasEntities && hasGoals) {
        // User has both entities and goals - very personalized!
        const greetingVariants = [
            `How's ${entityName} coming along? ${timeEmoji}`,
            `Ready to continue with ${primaryGoal}? ${timeEmoji}`,
            `Let's pick up where we left off with ${entityName}! ${timeEmoji}`,
            `Still working on ${primaryGoal}? I'm here to help! ${timeEmoji}`,
        ];
        personalMessage = greetingVariants[Math.floor(Math.random() * greetingVariants.length)];

        // Action-oriented quick actions
        quickActions.push(`Continue with ${entityName}`);
        if (primaryGoal && primaryGoal.length <= 20) {
            quickActions.push(primaryGoal.charAt(0).toUpperCase() + primaryGoal.slice(1));
        }
        quickActions.push('Something new');

    } else if (hasEntities) {
        // User has mentioned entities
        const greetingVariants = [
            `Still thinking about ${entityName}? ${timeEmoji}`,
            `Need more help with ${entityName}? ${timeEmoji}`,
            `What else can I help you with regarding ${entityName}? ${timeEmoji}`,
        ];
        personalMessage = greetingVariants[Math.floor(Math.random() * greetingVariants.length)];

        quickActions.push(`More about ${entityName}`);
        quickActions.push('New question');
        quickActions.push('Browse topics');

    } else if (hasGoals) {
        // User has goals
        const greetingVariants = [
            `How's the progress on ${primaryGoal}? ${timeEmoji}`,
            `Ready to tackle ${primaryGoal} today? ${timeEmoji}`,
            `Let me help you with ${primaryGoal}! ${timeEmoji}`,
        ];
        personalMessage = greetingVariants[Math.floor(Math.random() * greetingVariants.length)];

        if (primaryGoal && primaryGoal.length <= 20) {
            quickActions.push(primaryGoal.charAt(0).toUpperCase() + primaryGoal.slice(1));
        }
        quickActions.push('Ask a question');
        quickActions.push('Explore more');

    } else if (daysAgo > 7) {
        // Returning user after a while
        personalMessage = `It's been a while! Great to have you back ${timeEmoji}`;
        quickActions.push('What can you help with?');
        quickActions.push('Browse topics');
        quickActions.push('Ask anything');

    } else if (daysAgo > 0) {
        // Regular returning user
        const greetingVariants = [
            `Welcome back! What shall we explore today? ${timeEmoji}`,
            `Good to see you again! How can I help? ${timeEmoji}`,
            `Back for more? Let's dive in! ${timeEmoji}`,
        ];
        personalMessage = greetingVariants[Math.floor(Math.random() * greetingVariants.length)];
        quickActions.push('Continue learning');
        quickActions.push('New topic');
        quickActions.push('Ask a question');

    } else {
        // First time or fresh session
        const timeGreeting = {
            morning: 'Good morning',
            afternoon: 'Good afternoon',
            evening: 'Good evening',
            night: 'Working late',
        }[temporal.timeOfDay];

        personalMessage = `${timeGreeting}! How can I help you today? ${timeEmoji}`;
        quickActions.push('Get started');
        quickActions.push('What can you do?');
        quickActions.push('Browse topics');
    }

    // Build insights from pending insights
    const insights: ProactiveElement[] = [];
    for (const insight of context.pendingInsights.slice(0, 3)) {
        insights.push({
            type: 'insight',
            title: insight.title,
            content: insight.description,
            relevance: insight.priority === 'high' ? 'high' : 'medium',
            actionable: true,
        });
    }

    return {
        greeting: personalMessage,
        insights,
        quickActions: quickActions.slice(0, 3), // Max 3 quick actions
    };
}

// ============================================================================
// 📊 EXPORTS
// ============================================================================

export default {
    detectEmotionalState,
    buildTemporalContext,
    getTopicExpertise,
    buildAdaptiveConfig,
    generateWelcomeMessage,
    buildProactiveElements,
};
