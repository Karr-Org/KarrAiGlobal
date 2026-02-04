/**
 * KARR AI - Cognitive Digital Twin System
 * 
 * Central exports for the cognitive memory system.
 * This is the most advanced AI personalization system ever built.
 * 
 * Architecture Layers:
 * 1. Working Memory - Current session context
 * 2. Episodic Memory - Chat sessions and messages
 * 3. User Cognitive Profile - The user's digital DNA
 * 4. Entity Knowledge Graph - People and things they work with
 * 5. Memory Facts - Extracted knowledge with temporal awareness
 * 6. Emotional Intelligence - Sentiment tracking and adaptation
 * 7. Proactive Intelligence - Anticipatory insights and reminders
 */

// Session Management
export {
    SessionManager,
    createSessionManager,
    type ChatSession,
    type ChatMessage,
    type EntityMention,
    type SessionCreateInput,
    type MessageCreateInput,
} from './session-manager';

// Intelligence Extraction
export {
    generateSessionTitle,
    generateSessionSummary,
    extractTopics,
    extractEntities,
    analyzeSentiment,
    extractUserInsights,
    extractMemoryFacts,
    extractFullIntelligence,
    quickGenerateTitle,
    type ConversationIntelligence,
    type ExtractedEntity,
    type ExpertiseSignal,
    type CommunicationSignal,
    type DetectedGoal,
    type DetectedChallenge,
    type SentimentPoint,
    type ActionItem,
    type MemoryFact,
} from './intelligence-extractor';

// Context Fusion
export {
    ContextFusionEngine,
    createContextFusion,
    getQuickContext,
    type FusedContext,
    type UserProfileContext,
    type EntityContext,
    type FactContext,
    type SessionContext,
    type InsightContext,
} from './context-fusion';

// Profile Builder
export {
    ProfileBuilder,
    createProfileBuilder,
    type CognitiveProfile,
    type Goal,
    type Challenge,
} from './profile-builder';

// 🧠 LEARNING ORCHESTRATOR - THE REVOLUTIONARY BRAIN
export {
    CognitiveLearningOrchestrator,
    createLearningOrchestrator,
    triggerBackgroundLearning,
    type LearningConfig,
    type LearningResult,
} from './learning-orchestrator';

// Import for re-export in cognitive object
import { createSessionManager as _createSessionManager } from './session-manager';
import { createContextFusion as _createContextFusion, getQuickContext as _getQuickContext } from './context-fusion';
import { createProfileBuilder as _createProfileBuilder } from './profile-builder';
import {
    extractFullIntelligence as _extractFullIntelligence,
    generateSessionTitle as _generateSessionTitle,
    generateSessionSummary as _generateSessionSummary,
} from './intelligence-extractor';
import {
    createLearningOrchestrator as _createLearningOrchestrator,
    triggerBackgroundLearning as _triggerBackgroundLearning,
} from './learning-orchestrator';

// Convenience object with all main functions
export const cognitive = {
    createSessionManager: _createSessionManager,
    createContextFusion: _createContextFusion,
    createProfileBuilder: _createProfileBuilder,
    getQuickContext: _getQuickContext,
    extractFullIntelligence: _extractFullIntelligence,
    generateSessionTitle: _generateSessionTitle,
    generateSessionSummary: _generateSessionSummary,
    // 🧠 NEW: Learning Orchestrator
    createLearningOrchestrator: _createLearningOrchestrator,
    triggerBackgroundLearning: _triggerBackgroundLearning,
};

export default cognitive;
