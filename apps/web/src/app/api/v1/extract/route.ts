/**
 * POST /api/v1/extract — law text → ONE validated compliance-rule JSON (Opus).
 *
 * The structured-extraction sibling of /api/v1/chat. Given statute/notification
 * text, it asks Claude (Opus by default) to draft a single rule matching Karr's
 * rule contract, then enforces the two structural guardrails server-side
 * (closed-world fact catalog + quote-or-null) before returning it. See
 * ../../../../lib/compliance-extract for the catalog, prompt, and validator.
 *
 * STATELESS: it does NOT write to any table. It returns the validated rule
 * (forced state='shadow', authored_via='llm_assist'); the CALLER (Karr) drops it
 * into its own amendment_inbox where a human promotes it in Rule Studio. The
 * engine never auto-publishes an LLM-authored rule.
 *
 * Auth: same pk_live_ Bearer + sha256 + product_api_keys lookup as /api/v1/chat,
 * but PRIVILEGED — the key must carry the 'extract' permission (or be an
 * unscoped/full key). Unlike the public widget chat, this endpoint is meant for
 * server-to-server use (Karr's backend), so it does NOT emit a wildcard CORS
 * origin — a leaked key cannot be used from an arbitrary browser.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY,
 * and optionally EXTRACT_MODEL (defaults to claude-opus-4-8).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import {
    EXTRACT_SYSTEM_PROMPT,
    buildExtractUser,
    parseRuleJson,
    validateRule,
    normalizeRule,
} from '@/lib/compliance-extract';

export const runtime = 'nodejs';
export const maxDuration = 60; // Opus extraction can take 20-40s on long statutes

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_MODEL = process.env.EXTRACT_MODEL || 'claude-opus-4-8';
// Only these models may be requested via the body (keeps cost/behaviour bounded).
const ALLOWED_MODELS = new Set<string>([
    'claude-opus-4-8', 'claude-sonnet-4-6',
    'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229',
]);

const MAX_LAW_TEXT = 200_000; // hard input cap (the prompt itself slices to 60k)

// This endpoint is server-to-server: no wildcard CORS. Browsers from a foreign
// origin are intentionally blocked (a leaked privileged key can't be abused from
// the browser). Same-origin and non-browser callers are unaffected.
const BASE_HEADERS: Record<string, string> = { 'Cache-Control': 'no-store' };

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        },
    });
}

function hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
}

/** One-shot Claude call via the Anthropic Messages API (raw fetch — matches the
 *  v1/chat pattern of calling the model provider directly, no SDK/workspace dep). */
async function callClaude(
    system: string, user: string, model: string, maxTokens = 4096,
): Promise<{ text: string; usage: unknown; stopReason: string | null }> {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('ANTHROPIC_API_KEY is not configured');

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            temperature: 0, // deterministic extraction
            system,
            messages: [{ role: 'user', content: user }],
        }),
    });

    const raw = await resp.text();
    if (!resp.ok) throw new Error(`Anthropic HTTP ${resp.status}: ${raw.slice(0, 400)}`);

    let data: {
        content?: Array<{ type?: string; text?: string }>;
        usage?: unknown;
        stop_reason?: string | null;
    };
    try { data = JSON.parse(raw); } catch { throw new Error('Anthropic returned non-JSON'); }
    const text = Array.isArray(data.content)
        ? data.content.filter((b) => b?.type === 'text').map((b) => b?.text ?? '').join('')
        : '';
    return { text, usage: data.usage ?? null, stopReason: data.stop_reason ?? null };
}

export async function POST(request: NextRequest) {
    try {
        // ── 1. Authenticate via API key (mirrors /api/v1/chat) ──────────────
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { ok: false, error: 'Missing API key. Use Authorization: Bearer pk_live_xxx' },
                { status: 401, headers: BASE_HEADERS }
            );
        }
        const apiKey = authHeader.replace('Bearer ', '').trim();
        const keyHash = hashKey(apiKey);

        const { data: keyRecord, error: keyError } = await supabase
            .from('product_api_keys')
            .select('id, product_id, is_active, rate_limit_per_minute, allowed_origins, permissions, request_count')
            .eq('key_hash', keyHash)
            .single();

        if (keyError || !keyRecord) {
            return NextResponse.json({ ok: false, error: 'Invalid API key' }, { status: 401, headers: BASE_HEADERS });
        }
        if (!keyRecord.is_active) {
            return NextResponse.json({ ok: false, error: 'API key has been revoked' }, { status: 403, headers: BASE_HEADERS });
        }

        // Privileged: extraction must be explicitly granted. A key with no
        // permissions set (null/empty) is treated as a full/unscoped key; a
        // scoped key must list 'extract' (or '*').
        const perms: string[] = Array.isArray(keyRecord.permissions) ? keyRecord.permissions : [];
        const permitted = perms.length === 0 || perms.includes('extract') || perms.includes('*');
        if (!permitted) {
            return NextResponse.json(
                { ok: false, error: "API key lacks the 'extract' permission" },
                { status: 403, headers: BASE_HEADERS }
            );
        }

        // ── 1b. Rate limit (per key, 60s sliding window). FAILS OPEN if the
        //        extract_usage table isn't migrated yet (see 20260624 migration),
        //        so deploying the route before the migration is harmless.
        const rateLimit = (keyRecord.rate_limit_per_minute as number) || 30;
        const since = new Date(Date.now() - 60_000).toISOString();
        const { count: recent, error: rlErr } = await supabase
            .from('extract_usage')
            .select('id', { count: 'exact', head: true })
            .eq('api_key_id', keyRecord.id)
            .gte('created_at', since);
        if (rlErr) {
            console.warn('[extract] rate-limit table unavailable, running unthrottled:', rlErr.message);
        } else if ((recent ?? 0) >= rateLimit) {
            return NextResponse.json(
                { ok: false, error: 'Rate limit exceeded. Please slow down.', code: 'RATE_LIMITED' },
                { status: 429, headers: BASE_HEADERS }
            );
        } else {
            void supabase
                .from('extract_usage')
                .insert({ api_key_id: keyRecord.id, product_id: keyRecord.product_id })
                .then(undefined, (e) => console.warn('[extract] usage insert failed:', e?.message));
        }

        // ── 2. Parse + validate the request body ────────────────────────────
        let body: { law_text?: unknown; country?: unknown; hints?: unknown; model?: unknown };
        try { body = await request.json(); }
        catch { return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400, headers: BASE_HEADERS }); }

        const lawText = typeof body.law_text === 'string' ? body.law_text : '';
        if (!lawText.trim()) {
            return NextResponse.json({ ok: false, error: 'law_text is required' }, { status: 400, headers: BASE_HEADERS });
        }
        if (lawText.length > MAX_LAW_TEXT) {
            return NextResponse.json(
                { ok: false, error: `law_text too long (max ${MAX_LAW_TEXT} chars). Split the statute into sections.` },
                { status: 400, headers: BASE_HEADERS }
            );
        }
        const country = (typeof body.country === 'string' && body.country.trim() ? body.country : 'IN').toUpperCase();
        const hints = (body.hints && typeof body.hints === 'object') ? body.hints as Record<string, unknown> : undefined;
        const model = (typeof body.model === 'string' && ALLOWED_MODELS.has(body.model)) ? body.model : DEFAULT_MODEL;

        // Best-effort usage counter on the key (fire-and-forget). The actual
        // per-minute throttle is the extract_usage sliding window in step 1b above.
        void supabase
            .from('product_api_keys')
            .update({ last_used_at: new Date().toISOString(), request_count: (keyRecord.request_count as number ?? 0) + 1 })
            .eq('id', keyRecord.id)
            .then(undefined, (e) => console.warn('[extract] usage stamp failed:', e?.message));

        // ── 3. Draft with Claude ────────────────────────────────────────────
        let llm: { text: string; usage: unknown; stopReason: string | null };
        try {
            llm = await callClaude(EXTRACT_SYSTEM_PROMPT, buildExtractUser(lawText, country, hints), model);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error('[extract] LLM error:', msg);
            return NextResponse.json(
                { ok: false, error: `Extraction model failed: ${msg}` },
                { status: 502, headers: BASE_HEADERS }
            );
        }

        // ── 4. Parse + validate (the guardrails) ────────────────────────────
        const parsed = parseRuleJson(llm.text);
        if ('error' in parsed) {
            return NextResponse.json(
                {
                    ok: false, error: parsed.error,
                    truncated: llm.stopReason === 'max_tokens', // output cut off → JSON invalid
                    raw_excerpt: llm.text.slice(0, 600), model, usage: llm.usage,
                },
                { status: 422, headers: BASE_HEADERS }
            );
        }

        const validation = validateRule(parsed, lawText);
        if (!validation.ok) {
            return NextResponse.json(
                { ok: false, error: 'Draft rejected by guardrails', reasons: validation.errors, proposal: parsed, model, usage: llm.usage },
                { status: 422, headers: BASE_HEADERS }
            );
        }

        // ── 5. Return the safe, shadow draft ────────────────────────────────
        const rule = normalizeRule(parsed, (hints?.citation_url as string) ?? null);
        return NextResponse.json(
            {
                ok: true,
                rule,
                valid: true,
                evidence: rule.evidence_spans ?? [],
                confidence: typeof rule.confidence === 'number' ? rule.confidence : null,
                model,
                usage: llm.usage,
                note: 'Draft only — state=shadow, authored_via=llm_assist. Store in your amendment inbox and have a human verify + promote in Rule Studio.',
            },
            { status: 200, headers: BASE_HEADERS }
        );
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('[extract] error:', msg);
        return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500, headers: BASE_HEADERS });
    }
}
