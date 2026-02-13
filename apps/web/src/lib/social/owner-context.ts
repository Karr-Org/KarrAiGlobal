/**
 * 🔗 Social Owner Context
 * 
 * The unifying abstraction for the social media system.
 * Every social operation — connecting accounts, creating posts, scheduling,
 * publishing, analytics — flows through an "owner" which can be:
 * 
 * 1. A USER   — content derived from their best chats/insights
 * 2. A PRODUCT — content derived from what the product is about
 * 
 * This ensures any improvement (calendar, AI generation, analytics,
 * scheduling, publishing) benefits BOTH levels automatically.
 * 
 * Usage:
 *   const owner = createUserOwner(userId);
 *   const owner = createProductOwner(productId, userId);
 *   await getPosts(owner);
 *   await createPost(owner, ...);
 */

// ============================================
// TYPES
// ============================================

export type OwnerType = 'user' | 'product';

export interface SocialOwner {
    /** Whether this is a user-level or product-level context */
    type: OwnerType;
    /** The owning entity's ID (user UUID or product UUID) */
    ownerId: string;
    /** The authenticated user performing the action */
    actingUserId: string;
    /** Display name for the owner (user name or product name) */
    displayName?: string;
    /** Product slug (only for product owners, used in URL construction) */
    slug?: string;
}

// Narrowed types for type safety
export interface UserOwner extends SocialOwner {
    type: 'user';
}

export interface ProductOwner extends SocialOwner {
    type: 'product';
    slug: string;
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * Create a user-level social owner context.
 * Used when a user is managing their personal social media presence.
 */
export function createUserOwner(userId: string, displayName?: string): UserOwner {
    return {
        type: 'user',
        ownerId: userId,
        actingUserId: userId,
        displayName,
    };
}

/**
 * Create a product-level social owner context.
 * Used when a user is managing a product's social media presence.
 * The actingUserId is the user performing the action (for auth/RLS).
 */
export function createProductOwner(
    productId: string,
    actingUserId: string,
    slug: string,
    displayName?: string
): ProductOwner {
    return {
        type: 'product',
        ownerId: productId,
        actingUserId,
        displayName,
        slug,
    };
}

// ============================================
// QUERY HELPERS
// ============================================

/**
 * Get the Supabase filter conditions for querying social data by owner.
 * 
 * For user owners: filters by user_id, product_id IS NULL
 * For product owners: filters by product_id
 * 
 * Returns an object with filter key-value pairs to apply.
 */
export function getOwnerFilters(owner: SocialOwner): Record<string, string | null> {
    if (owner.type === 'user') {
        return {
            user_id: owner.ownerId,
            // Explicitly filter for user-level (no product) accounts
        };
    } else {
        return {
            product_id: owner.ownerId,
        };
    }
}

/**
 * Get the insert fields when creating new social records for an owner.
 * Always includes the acting user's ID for RLS and audit trails.
 */
export function getOwnerInsertFields(owner: SocialOwner): Record<string, string | null> {
    if (owner.type === 'user') {
        return {
            user_id: owner.actingUserId,
            product_id: null,
        };
    } else {
        return {
            user_id: owner.actingUserId,
            product_id: owner.ownerId,
        };
    }
}

/**
 * Get the API query params string for passing owner context to API routes.
 */
export function getOwnerQueryParams(owner: SocialOwner): string {
    const params = new URLSearchParams();
    params.set('ownerType', owner.type);
    params.set('ownerId', owner.ownerId);
    return params.toString();
}

/**
 * Parse owner context from API request search params.
 * Falls back to user-level if no owner type specified (backward compatible).
 */
export function parseOwnerFromParams(
    searchParams: URLSearchParams,
    userId: string
): SocialOwner {
    const ownerType = (searchParams.get('ownerType') as OwnerType) || 'user';
    const ownerId = searchParams.get('ownerId') || userId;

    if (ownerType === 'product') {
        return {
            type: 'product',
            ownerId,
            actingUserId: userId,
            slug: searchParams.get('slug') || '',
        };
    }

    return {
        type: 'user',
        ownerId: userId,
        actingUserId: userId,
    };
}

// ============================================
// CONTENT SOURCE DESCRIPTORS
// ============================================

/**
 * Get the content source description based on owner type.
 * Used by AI prompts to understand where content should come from.
 */
export function getContentSourceDescription(owner: SocialOwner): string {
    if (owner.type === 'user') {
        return `Generate social media content based on the user's most insightful and engaging chat conversations. Focus on their expertise, unique perspectives, and shareable knowledge discovered through their AI interactions.`;
    } else {
        return `Generate social media content based on the product's value proposition, features, and target audience. Focus on educational content, use cases, and thought leadership that establishes the product as an authority in its domain.`;
    }
}

/**
 * Get the AI prompt context for content generation.
 */
export function getAIContentContext(owner: SocialOwner, additionalContext?: Record<string, string>): Record<string, string> {
    const baseContext: Record<string, string> = {
        ownerType: owner.type,
        contentStrategy: owner.type === 'user'
            ? 'personal_brand'
            : 'product_marketing',
        voiceStyle: owner.type === 'user'
            ? 'first_person_authentic'
            : 'brand_voice_authoritative',
    };

    return { ...baseContext, ...additionalContext };
}
