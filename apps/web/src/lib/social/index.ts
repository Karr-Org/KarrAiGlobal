/**
 * 🔗 Social System — Public API
 * 
 * Single entry point for the unified social media system.
 * Import from here for all social operations.
 * 
 * Usage:
 *   import { createUserOwner, createProductOwner, getPosts, getCalendar } from '@/lib/social';
 */

// Owner context (the core unifying abstraction)
export {
    createUserOwner,
    createProductOwner,
    getOwnerFilters,
    getOwnerInsertFields,
    getOwnerQueryParams,
    parseOwnerFromParams,
    getContentSourceDescription,
    getAIContentContext,
} from './owner-context';

export type {
    SocialOwner,
    UserOwner,
    ProductOwner,
    OwnerType,
} from './owner-context';

// Unified service (all operations)
export {
    getAccounts,
    getConnectUrl,
    disconnectAccount,
    getPosts,
    createDraft,
    updatePost,
    deletePost,
    publishNow,
    getCalendar,
    fillCalendarSlots,
    getAnalytics,
    generateContent,
    getInsights,
    getAutomationRules,
} from './unified-social-service';

export type {
    SocialPlatform,
    PostStatus,
    UnifiedSocialAccount,
    UnifiedSocialPost,
    CalendarEntry,
    CalendarWeek,
    ContentCalendar,
    AnalyticsSummary,
} from './unified-social-service';
