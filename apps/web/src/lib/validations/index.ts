/**
 * KARR AI — Input Validation Utilities
 *
 * Zero-dependency validation for API request bodies.
 * Validates, sanitizes, and constrains input data before it reaches business logic.
 */

import { NextResponse } from 'next/server';

// ─── Validator Types ──────────────────────────────────────────────
type ValidationError = { field: string; message: string };
type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; response: NextResponse };

// ─── UUID Regex ───────────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Primitive Validators ─────────────────────────────────────────

function isUUID(val: unknown): val is string {
    return typeof val === 'string' && UUID_RE.test(val);
}

function isString(val: unknown, min = 1, max = 5000): val is string {
    return typeof val === 'string' && val.trim().length >= min && val.trim().length <= max;
}

function isOptionalString(val: unknown, max = 5000): boolean {
    return val === undefined || val === null || (typeof val === 'string' && val.length <= max);
}

function isBoolean(val: unknown): val is boolean {
    return typeof val === 'boolean';
}

function isArray(val: unknown): val is unknown[] {
    return Array.isArray(val);
}

function isEnum(val: unknown, values: readonly string[]): boolean {
    return typeof val === 'string' && values.includes(val);
}

// ─── Schema Definitions ──────────────────────────────────────────

export interface ChatQueryInput {
    query: string;
    productId: string;
    conversationId?: string;
    userId?: string;
    useOkse?: boolean;
    knowledgeBaseId?: string;
    forceComplexity?: string;
    skipCache?: boolean;
}

export function validateChatQuery(body: unknown): ValidationResult<ChatQueryInput> {
    const errors: ValidationError[] = [];
    if (!body || typeof body !== 'object') {
        return fail([{ field: 'body', message: 'Request body is required' }]);
    }
    const b = body as Record<string, unknown>;

    if (!isString(b.query, 1, 10000)) errors.push({ field: 'query', message: 'Query is required (1-10000 chars)' });
    if (!isUUID(b.productId)) errors.push({ field: 'productId', message: 'Valid productId UUID is required' });
    if (b.conversationId !== undefined && !isString(b.conversationId, 1, 100)) errors.push({ field: 'conversationId', message: 'Invalid conversationId' });
    if (b.userId !== undefined && !isString(b.userId, 1, 100)) errors.push({ field: 'userId', message: 'Invalid userId' });
    if (b.useOkse !== undefined && !isBoolean(b.useOkse)) errors.push({ field: 'useOkse', message: 'Must be boolean' });
    if (b.knowledgeBaseId !== undefined && !isUUID(b.knowledgeBaseId)) errors.push({ field: 'knowledgeBaseId', message: 'Must be a valid UUID' });
    if (b.forceComplexity !== undefined && !isEnum(b.forceComplexity, ['SIMPLE', 'MODERATE', 'COMPLEX'] as const)) {
        errors.push({ field: 'forceComplexity', message: 'Must be SIMPLE, MODERATE, or COMPLEX' });
    }
    if (b.skipCache !== undefined && !isBoolean(b.skipCache)) errors.push({ field: 'skipCache', message: 'Must be boolean' });

    if (errors.length > 0) return fail(errors);
    return { success: true, data: b as unknown as ChatQueryInput };
}

export interface WidgetChatInput {
    message: string;
    sessionId?: string;
    conversationHistory?: Array<{ role: string; content: string }>;
}

export function validateWidgetChat(body: unknown): ValidationResult<WidgetChatInput> {
    const errors: ValidationError[] = [];
    if (!body || typeof body !== 'object') {
        return fail([{ field: 'body', message: 'Request body is required' }]);
    }
    const b = body as Record<string, unknown>;

    if (!isString(b.message, 1, 10000)) errors.push({ field: 'message', message: 'Message is required (1-10000 chars)' });
    if (b.sessionId !== undefined && !isString(b.sessionId, 1, 100)) errors.push({ field: 'sessionId', message: 'Invalid sessionId' });
    if (b.conversationHistory !== undefined) {
        if (!isArray(b.conversationHistory)) {
            errors.push({ field: 'conversationHistory', message: 'Must be an array' });
        } else if ((b.conversationHistory as unknown[]).length > 50) {
            errors.push({ field: 'conversationHistory', message: 'Max 50 messages' });
        }
    }

    if (errors.length > 0) return fail(errors);
    return { success: true, data: b as unknown as WidgetChatInput };
}

export interface CreateProductInput {
    name: string;
    slug: string;
    domain?: string | null;
    description?: string;
    selectedKbIds?: string[];
    primaryColor?: string;
    webSources?: Array<{ domain: string; displayName?: string; authorityScore?: number }>;
}

export function validateCreateProduct(body: unknown): ValidationResult<CreateProductInput> {
    const errors: ValidationError[] = [];
    if (!body || typeof body !== 'object') {
        return fail([{ field: 'body', message: 'Request body is required' }]);
    }
    const b = body as Record<string, unknown>;

    if (!isString(b.name, 1, 255)) errors.push({ field: 'name', message: 'Name is required (1-255 chars)' });
    if (!isString(b.slug, 2, 100) || (typeof b.slug === 'string' && !/^[a-z0-9-]+$/.test(b.slug))) {
        errors.push({ field: 'slug', message: 'Slug must be lowercase alphanumeric with hyphens (2-100 chars)' });
    }
    if (b.primaryColor !== undefined && typeof b.primaryColor === 'string' && !/^#[0-9a-fA-F]{6}$/.test(b.primaryColor)) {
        errors.push({ field: 'primaryColor', message: 'Must be a hex color like #1a365d' });
    }
    if (b.selectedKbIds !== undefined) {
        if (!isArray(b.selectedKbIds)) {
            errors.push({ field: 'selectedKbIds', message: 'Must be an array of UUIDs' });
        } else {
            const ids = b.selectedKbIds as unknown[];
            if (ids.length > 20) errors.push({ field: 'selectedKbIds', message: 'Max 20 knowledge bases' });
            if (!ids.every(isUUID)) errors.push({ field: 'selectedKbIds', message: 'All IDs must be valid UUIDs' });
        }
    }
    if (b.webSources !== undefined) {
        if (!isArray(b.webSources)) {
            errors.push({ field: 'webSources', message: 'Must be an array' });
        } else if ((b.webSources as unknown[]).length > 50) {
            errors.push({ field: 'webSources', message: 'Max 50 web sources' });
        }
    }

    if (errors.length > 0) return fail(errors);
    return { success: true, data: b as unknown as CreateProductInput };
}

export interface CreateEntityInput {
    productUserId: string;
    entityTypeId?: string;
    name: string;
    metadata?: Record<string, unknown>;
    notes?: string;
}

export function validateCreateEntity(body: unknown): ValidationResult<CreateEntityInput> {
    const errors: ValidationError[] = [];
    if (!body || typeof body !== 'object') {
        return fail([{ field: 'body', message: 'Request body is required' }]);
    }
    const b = body as Record<string, unknown>;

    if (!isUUID(b.productUserId)) errors.push({ field: 'productUserId', message: 'Valid productUserId UUID is required' });
    if (b.entityTypeId !== undefined && !isUUID(b.entityTypeId)) errors.push({ field: 'entityTypeId', message: 'Must be a valid UUID' });
    if (!isString(b.name, 1, 255)) errors.push({ field: 'name', message: 'Name is required (1-255 chars)' });
    if (!isOptionalString(b.notes, 5000)) errors.push({ field: 'notes', message: 'Notes must be under 5000 chars' });

    if (errors.length > 0) return fail(errors);
    return { success: true, data: b as unknown as CreateEntityInput };
}

export interface CreateSessionInput {
    productUserId: string;
    productId: string;
    forceNew?: boolean;
}

export function validateCreateSession(body: unknown): ValidationResult<CreateSessionInput> {
    const errors: ValidationError[] = [];
    if (!body || typeof body !== 'object') {
        return fail([{ field: 'body', message: 'Request body is required' }]);
    }
    const b = body as Record<string, unknown>;

    if (!isUUID(b.productUserId)) errors.push({ field: 'productUserId', message: 'Valid productUserId UUID is required' });
    if (!isUUID(b.productId)) errors.push({ field: 'productId', message: 'Valid productId UUID is required' });
    if (b.forceNew !== undefined && !isBoolean(b.forceNew)) errors.push({ field: 'forceNew', message: 'Must be boolean' });

    if (errors.length > 0) return fail(errors);
    return { success: true, data: b as unknown as CreateSessionInput };
}

export interface ConnectSocialInput {
    platform: string;
    productId?: string;
}

export function validateConnectSocial(body: unknown): ValidationResult<ConnectSocialInput> {
    const errors: ValidationError[] = [];
    if (!body || typeof body !== 'object') {
        return fail([{ field: 'body', message: 'Request body is required' }]);
    }
    const b = body as Record<string, unknown>;

    if (!isEnum(b.platform, ['twitter', 'facebook', 'linkedin', 'instagram'] as const)) {
        errors.push({ field: 'platform', message: 'Platform must be twitter, facebook, linkedin, or instagram' });
    }
    if (b.productId !== undefined && !isUUID(b.productId)) {
        errors.push({ field: 'productId', message: 'Must be a valid UUID' });
    }

    if (errors.length > 0) return fail(errors);
    return { success: true, data: b as unknown as ConnectSocialInput };
}

export interface CreateKnowledgeBaseInput {
    name: string;
    description?: string;
    userId: string;
}

export function validateCreateKnowledgeBase(body: unknown): ValidationResult<CreateKnowledgeBaseInput> {
    const errors: ValidationError[] = [];
    if (!body || typeof body !== 'object') {
        return fail([{ field: 'body', message: 'Request body is required' }]);
    }
    const b = body as Record<string, unknown>;

    if (!isString(b.name, 1, 100)) errors.push({ field: 'name', message: 'Name is required (1-100 chars)' });
    if (!isOptionalString(b.description, 500)) errors.push({ field: 'description', message: 'Description max 500 chars' });
    if (!isUUID(b.userId)) errors.push({ field: 'userId', message: 'Valid userId UUID is required' });

    if (errors.length > 0) return fail(errors);
    return { success: true, data: b as unknown as CreateKnowledgeBaseInput };
}

// ─── Helper ───────────────────────────────────────────────────────

function fail(errors: ValidationError[]): { success: false; response: NextResponse } {
    return {
        success: false,
        response: NextResponse.json(
            {
                error: 'Validation failed',
                details: Object.fromEntries(errors.map(e => [e.field, e.message])),
            },
            { status: 400 },
        ),
    };
}
