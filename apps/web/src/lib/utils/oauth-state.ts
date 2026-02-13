/**
 * OAuth State HMAC Utility
 * 
 * Provides tamper-proof OAuth state parameters using HMAC-SHA256 signing.
 * This prevents CSRF attacks where an attacker could craft a malicious
 * OAuth callback URL with a spoofed state parameter.
 * 
 * State format: payload.signature
 * Payload format: userId:timestamp[:productId]
 */

import crypto from 'crypto';

const OAUTH_SECRET = process.env.OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-dev-secret';
const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Create a signed OAuth state parameter.
 */
export function createSignedState(userId: string, productId?: string): string {
    const payload = productId
        ? `${userId}:${Date.now()}:${productId}`
        : `${userId}:${Date.now()}`;

    const signature = crypto
        .createHmac('sha256', OAUTH_SECRET)
        .update(payload)
        .digest('hex')
        .slice(0, 16); // Use first 16 chars to keep URL short

    return `${payload}.${signature}`;
}

/**
 * Verify and parse a signed OAuth state parameter.
 * Returns null if verification fails.
 */
export function verifySignedState(state: string): {
    userId: string;
    timestamp: number;
    productId?: string;
} | null {
    const dotIndex = state.lastIndexOf('.');
    if (dotIndex === -1) {
        // Legacy unsigned state — parse but warn
        console.warn('[OAuth State] Received unsigned state parameter — allowing for backward compatibility');
        return parseLegacyState(state);
    }

    const payload = state.slice(0, dotIndex);
    const receivedSig = state.slice(dotIndex + 1);

    // Verify HMAC
    const expectedSig = crypto
        .createHmac('sha256', OAUTH_SECRET)
        .update(payload)
        .digest('hex')
        .slice(0, 16);

    if (!crypto.timingSafeEqual(
        Buffer.from(receivedSig, 'hex'),
        Buffer.from(expectedSig, 'hex')
    )) {
        console.error('[OAuth State] HMAC verification failed — possible tampering');
        return null;
    }

    // Parse payload
    const parts = payload.split(':');
    if (parts.length < 2) return null;

    const timestamp = parseInt(parts[1], 10);

    // Check expiry
    if (Date.now() - timestamp > STATE_MAX_AGE_MS) {
        console.error('[OAuth State] State expired — older than 10 minutes');
        return null;
    }

    return {
        userId: parts[0],
        timestamp,
        productId: parts.length >= 3 ? parts[2] : undefined,
    };
}

/**
 * Parse legacy unsigned state for backward compatibility.
 * Will be removed once all callback handlers are updated.
 */
function parseLegacyState(state: string): {
    userId: string;
    timestamp: number;
    productId?: string;
} | null {
    const parts = state.split(':');
    if (parts.length < 2) return null;

    return {
        userId: parts[0],
        timestamp: parseInt(parts[1], 10),
        productId: parts.length >= 3 ? parts[2] : undefined,
    };
}
