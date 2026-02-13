/**
 * KARR AI — HTML Sanitization Utilities
 *
 * Prevents XSS by escaping HTML entities before rendering.
 * Use these functions BEFORE any dangerouslySetInnerHTML or
 * markdown-to-HTML conversion.
 */

// Escapes HTML entities to prevent XSS injection
export function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Sanitize HTML content — strips dangerous tags/attributes
// while preserving safe formatting tags.
const ALLOWED_TAGS = new Set([
    'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span', 'sup', 'sub',
    // SVG elements (for mermaid/diagram rendering)
    'svg', 'g', 'path', 'line', 'circle', 'rect', 'polygon', 'polyline',
    'ellipse', 'text', 'tspan', 'defs', 'clippath', 'marker', 'use',
    'foreignobject', 'title', 'desc',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
    'a': new Set(['href', 'title', 'target', 'rel']),
    'img': new Set(['src', 'alt', 'title', 'width', 'height']),
    '*': new Set(['class', 'id']),
};

// Simple tag-level sanitizer — use DOMPurify for production if available
export function sanitizeHtml(html: string): string {
    // Remove script tags and their content first
    let safe = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers (onclick, onerror, onload, etc.)
    safe = safe.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

    // Remove javascript: protocol in href/src
    safe = safe.replace(/(?:href|src)\s*=\s*(?:"|')?\s*javascript\s*:/gi, 'data-blocked=');

    // Remove data: protocol in src (can be used for XSS)
    safe = safe.replace(/src\s*=\s*(?:"|')?\s*data\s*:/gi, 'data-blocked=');

    // Remove style attributes (can contain expression() for XSS in older browsers)
    safe = safe.replace(/\s+style\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

    // Remove iframe, object, embed, form
    safe = safe.replace(/<\/?(?:iframe|object|embed|form|input|button|select|textarea)\b[^>]*>/gi, '');

    return safe;
}
