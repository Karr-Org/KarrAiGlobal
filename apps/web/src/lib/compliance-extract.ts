/**
 * compliance-extract — law text → a single deterministic compliance-rule JSON.
 *
 * The pure (no Next/Supabase) core behind POST /api/v1/extract. It generalizes
 * Karr's `compliance-draft` edge function to the FULL Karr rule contract
 * (applicability + predicate + exposure_model + deadline_rule + trigger_events)
 * and keeps the same two structural guardrails that make an LLM draft safe:
 *
 *   1. CLOSED-WORLD FIELD CATALOG — every JSON-Logic `var` a rule references
 *      (in applicability, predicate, AND exposure_model formulas) must be a fact
 *      the Karr engine actually supplies. Unknown field ⇒ rejected. This is the
 *      structural guard against the model inventing a fact path.
 *   2. QUOTE-OR-NULL — every numeric threshold/rate/date must be backed by an
 *      evidence span copied VERBATIM from the source text (server-checked). This
 *      kills hallucinated numbers.
 *
 * The endpoint NEVER publishes: the returned rule is forced to state='shadow' /
 * authored_via='llm_assist'. The caller (Karr) drops it into its own amendment
 * inbox; a human promotes it in Rule Studio. This module is deliberately
 * dependency-free so it can be unit-tested in isolation.
 *
 * Source of truth for the catalog/enums/DSL: Karr docs/COMPLIANCE_RULE_AUTHORING.md
 * + build_compliance_facts (migration 00172) + compute_exposure/compute_deadline
 * (00164). Keep in sync when Karr adds facts.
 */

// ─── Closed-world fact catalog ──────────────────────────────────────────────
// The ONLY paths a rule's JSON-Logic may reference. Union of build_compliance_facts
// (00172) and the facts the seeded rule packs (00154/00163/00169/00173) use.
// Superset-biased on purpose: excluding a real fact would wrongly reject a good
// rule; including a sometimes-absent one is fail-safe (a missing fact never fires).
export const EXTRACT_FIELD_CATALOG: ReadonlySet<string> = new Set([
    'event', 'period', 'period.days_to_due',
    // org
    'org.type', 'org.country', 'org.state', 'org.states_operated',
    'org.headcount', 'org.turnover_fy_to_date', 'org.turnover_run_rate_fy',
    'org.taxable_income_fy', 'org.is_foreign_formed',
    'org.business_nature', 'org.industry_sector',
    'org.registrations.gst', 'org.registrations.tan', 'org.registrations.vat',
    'org.registrations.pf', 'org.registrations.esi', 'org.registrations.fcra',
    'org.registrations.iec', 'org.registrations.udyam',
    // counterparty
    'counterparty.id', 'counterparty.type', 'counterparty.has_pan',
    'counterparty.is_msme', 'counterparty.is_nonresident', 'counterparty.gstin',
    'counterparty.is_b2b', 'counterparty.gstin_status', 'counterparty.pan_valid',
    'counterparty.tds_section',
    // txn
    'txn.id', 'txn.type', 'txn.amount', 'txn.taxable_value', 'txn.date',
    'txn.payment_mode', 'txn.gst_rate', 'txn.hsn', 'txn.has_irn',
    'txn.has_eway_bill', 'txn.country_data', 'txn.line_category',
    'txn.fy_to_date_aggregate_for_section', 'txn.fy_to_date_taxable_for_section',
    'txn.days_outstanding', 'txn.days_since_share_application',
    'txn.is_foreign_contribution', 'txn.into_fcra_designated_account',
    'txn.via_wps', 'txn.state_sales_ytd',
]);

export const ALLOWED_CHECK_TYPES: ReadonlySet<string> = new Set([
    'threshold_per_txn', 'threshold_cumulative', 'registration_required',
    'document_required', 'rate_lookup', 'due_date', 'counterparty_verify',
]);

export const ALLOWED_SEVERITY: ReadonlySet<string> = new Set(['info', 'warning', 'block']);

// Canonical transactions.type enums (NOT UI words). Matches Karr trigger_events.
export const ALLOWED_TRIGGER_EVENTS: ReadonlySet<string> = new Set([
    'invoice', 'bill', 'expense_claim', 'payment', 'receipt', 'journal',
    'credit_note', 'debit_note', 'estimate', 'purchase_order',
    'delivery_challan', 'grn',
]);

// compute_exposure (00164) component types + compute_deadline keys.
export const ALLOWED_EXPOSURE_TYPES: ReadonlySet<string> = new Set([
    'penalty', 'interest', 'principal', 'disallowance', 'flat',
]);
export const ALLOWED_DEADLINE_KEYS: ReadonlySet<string> = new Set([
    'immediate', 'next_month_day', 'offset_days',
]);

export interface EvidenceSpan { quote: string; for: string }

export interface ExtractedRule {
    rule_key?: string;
    country?: string;
    category?: string;
    code?: string;
    check_type?: string;
    title?: string;
    description?: string;
    severity?: string;
    state?: string;
    eff_from?: string;
    applicability?: unknown;
    predicate?: unknown;
    params?: Record<string, unknown>;
    trigger_events?: string[];
    message?: string;
    remedy?: string;
    consequence?: string;
    citation?: string;
    citation_url?: string | null;
    exposure_model?: { currency?: string; components?: Array<Record<string, unknown>> };
    deadline_rule?: Record<string, unknown>;
    evidence_spans?: EvidenceSpan[];
    confidence?: number;
    authored_via?: string;
}

// ─── The drafting prompt ────────────────────────────────────────────────────

const CATALOG_LIST = [...EXTRACT_FIELD_CATALOG].join(', ');
const TRIGGER_LIST = [...ALLOWED_TRIGGER_EVENTS].join(' | ');
const CHECK_LIST = [...ALLOWED_CHECK_TYPES].join(' | ');

export const EXTRACT_SYSTEM_PROMPT = `You are a compliance rule-drafting assistant for an accounting platform (Karr).
You convert a single piece of plain-language tax/statutory text into ONE structured, deterministic compliance-rule PROPOSAL.
You are a DRAFTER, not an authority — a human compliance editor reviews, tests, and publishes. Never claim a number you cannot quote.

Output STRICT JSON ONLY (no markdown, no prose, no code fences) matching exactly this shape:
{
  "rule_key": "stable id <COUNTRY>.<CATEGORY>.<CODE>, e.g. IN.TDS.194C",
  "country": "ISO-2, e.g. IN",
  "category": "tds | gst | income_tax | roc | labour | ...",
  "code": "human section/notification code, e.g. 194C",
  "check_type": "${CHECK_LIST}",
  "title": "short human title",
  "description": "what the law says, plainly",
  "severity": "info | warning | block   (prefer 'warning'; 'block' only for per-se illegality)",
  "eff_from": "YYYY-MM-DD   (the law's OWN effective date, taken from the source)",
  "applicability": { ...JSON-Logic gate: does this law apply to this org? {} = applies to all... },
  "predicate": { ...JSON-Logic: has the obligation triggered? ... },
  "params": { "rate_pct": 10, "threshold": 30000 },
  "trigger_events": ["bill","expense_claim"],
  "message": "imperative: what the user should do",
  "remedy": "the fix",
  "consequence": "what happens if ignored",
  "citation": "human-readable, e.g. 'Income-tax Act 1961, s.194C'",
  "citation_url": "primary .gov.in / gazette URL if known, else null",
  "exposure_model": { "currency": "INR", "components": [ ... see DSL ... ] },
  "deadline_rule": { ...see DSL... },
  "evidence_spans": [ { "quote": "VERBATIM substring copied from the source", "for": "threshold" } ],
  "confidence": 0.0
}

HARD RULES — a draft that breaks any of these is rejected server-side:
1. CLOSED-WORLD FIELDS. Every JSON-Logic "var" used in applicability, predicate, and inside exposure_model formulas MUST be one of EXACTLY these fact paths (use them as the var name):
${CATALOG_LIST}.
Do NOT invent any other field. If the law needs a fact not in this list, express the rule only as far as these facts allow (or gate on counterparty.tds_section as a proxy), and note the gap in "description".
2. QUOTE-OR-NULL. For EVERY numeric threshold, rate, and date in params/predicate/exposure_model, include an evidence_span whose "quote" is copied VERBATIM (character-for-character) from the source text. If you cannot find the number in the source, leave it out and do NOT invent it.
3. JSON-Logic only: operators var, ==, !=, >, >=, <, <=, and, or, not, !, in, +, -, *, /. No function calls, no loops.
4. trigger_events: a non-empty array using ONLY these canonical transaction-type enums (NOT UI words like 'expense' or 'post_bill'): ${TRIGGER_LIST}. Per-transaction TDS rules normally fire on the bill/expense-claim credit (omit 'payment' to avoid GST-inflated double counting).
5. exposure_model components (the live Rs-at-risk). Each component is one of:
   {"type":"penalty","label":"...","pct":<0-1>,"of":<JSON-Logic>}                          // pct x eval(of)
   {"type":"interest","label":"...","pct_per_month":<0-1>,"of":<JSON-Logic>}                // x months overdue
   {"type":"principal"|"disallowance"|"flat","label":"...","formula":<JSON-Logic>,"floor":<n optional>}
   Build formulas from txn.amount or txn.taxable_value, e.g. {"*":[{"var":"txn.amount"},0.01]}. If you cannot quantify, use {} (empty).
6. deadline_rule: EXACTLY one of {"immediate":true} | {"next_month_day":<1-31>} | {"offset_days":<n>} | {} (none).
7. Output JSON only. Prefer severity 'warning'. Produce the single best proposal.`;

export function buildExtractUser(lawText: string, country: string, hints?: Record<string, unknown>): string {
    const hintLine = hints && Object.keys(hints).length
        ? `\nHINTS (use if consistent with the source): ${JSON.stringify(hints)}`
        : '';
    return `Country: ${country}${hintLine}

SOURCE TEXT (statute / notification / circular / case law):
"""
${lawText.slice(0, 60000)}
"""

Produce the single best compliance-rule proposal as STRICT JSON only.`;
}

// ─── Parsing + validation ───────────────────────────────────────────────────

export function parseRuleJson(text: string): ExtractedRule | { error: string } {
    if (!text || !text.trim()) return { error: 'Empty model response' };
    let cleaned = text.trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();
    // Tolerate leading/trailing prose by isolating the outermost JSON object.
    if (cleaned[0] !== '{') {
        const first = cleaned.indexOf('{');
        const last = cleaned.lastIndexOf('}');
        if (first >= 0 && last > first) cleaned = cleaned.slice(first, last + 1);
    }
    try {
        return JSON.parse(cleaned) as ExtractedRule;
    } catch {
        return { error: 'Model did not return valid JSON' };
    }
}

/** Recursively collect every JSON-Logic `var` name from a node. */
export function collectVars(node: unknown, acc: Set<string>): void {
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
        for (const el of node) collectVars(el, acc);
        return;
    }
    for (const [op, val] of Object.entries(node as Record<string, unknown>)) {
        if (op === 'var') {
            if (typeof val === 'string') acc.add(val);
            else if (Array.isArray(val) && typeof val[0] === 'string') acc.add(val[0]);
        } else {
            collectVars(val, acc);
        }
    }
}

export interface ValidationResult { ok: boolean; errors: string[] }

/**
 * Server-side guardrails. Returns every problem found (not just the first) so the
 * caller can surface a complete rejection reason. A rule that passes is safe to
 * hand to a human reviewer — it is still shadow + needs_verification.
 */
export function validateRule(rule: ExtractedRule, lawText: string): ValidationResult {
    const errors: string[] = [];

    if (!rule || typeof rule !== 'object') return { ok: false, errors: ['no rule object'] };

    if (!rule.rule_key && !rule.code) errors.push('rule_key or code is required');
    if (!rule.check_type || !ALLOWED_CHECK_TYPES.has(rule.check_type)) {
        errors.push(`check_type must be one of the 7 primitives (got '${rule.check_type ?? 'none'}')`);
    }
    if (!rule.severity || !ALLOWED_SEVERITY.has(rule.severity)) {
        errors.push(`severity must be info|warning|block (got '${rule.severity ?? 'none'}')`);
    }
    if (rule.predicate === undefined || rule.predicate === null || typeof rule.predicate !== 'object') {
        errors.push('predicate is required and must be a JSON-Logic object');
    }

    // Closed-world fields across applicability + predicate + exposure formulas.
    const vars = new Set<string>();
    collectVars(rule.predicate, vars);
    collectVars(rule.applicability, vars);
    for (const comp of rule.exposure_model?.components ?? []) {
        collectVars((comp as Record<string, unknown>)?.of, vars);
        collectVars((comp as Record<string, unknown>)?.formula, vars);
    }
    for (const v of vars) {
        if (!EXTRACT_FIELD_CATALOG.has(v)) {
            errors.push(`references unknown fact field '${v}' (not in the closed-world catalog)`);
        }
    }

    // trigger_events
    if (!Array.isArray(rule.trigger_events) || rule.trigger_events.length === 0) {
        errors.push('trigger_events must be a non-empty array');
    } else {
        for (const e of rule.trigger_events) {
            if (!ALLOWED_TRIGGER_EVENTS.has(e)) errors.push(`trigger_events has invalid enum '${e}'`);
        }
    }

    // exposure_model component types
    for (const comp of rule.exposure_model?.components ?? []) {
        const t = (comp as Record<string, unknown>)?.type;
        if (typeof t !== 'string' || !ALLOWED_EXPOSURE_TYPES.has(t)) {
            errors.push(`exposure_model component has invalid type '${String(t)}'`);
        }
    }

    // deadline_rule keys
    if (rule.deadline_rule && typeof rule.deadline_rule === 'object') {
        for (const k of Object.keys(rule.deadline_rule)) {
            if (!ALLOWED_DEADLINE_KEYS.has(k)) errors.push(`deadline_rule has invalid key '${k}'`);
        }
    }

    // eff_from format
    if (rule.eff_from && !/^\d{4}-\d{2}-\d{2}$/.test(rule.eff_from)) {
        errors.push(`eff_from must be YYYY-MM-DD (got '${rule.eff_from}')`);
    }

    // Quote-or-null: every evidence quote must appear verbatim; numeric params
    // must be backed by at least one verifiable span.
    const haystack = lawText.toLowerCase();
    const quotes = (rule.evidence_spans ?? [])
        .map((s) => (s?.quote ?? '').trim())
        .filter(Boolean);
    for (const q of quotes) {
        if (!haystack.includes(q.toLowerCase())) {
            errors.push(`evidence span not found verbatim in source (possible hallucination): "${q.slice(0, 60)}"`);
        }
    }
    const numericParams = Object.entries(rule.params ?? {}).filter(([, v]) => typeof v === 'number');
    if (numericParams.length > 0 && quotes.length === 0) {
        errors.push('numeric params present but no evidence_spans supplied (quote-or-null failed)');
    }

    return { ok: errors.length === 0, errors };
}

/**
 * Normalize a validated draft to a safe, ready-to-store shape: forces shadow +
 * llm_assist and fills the citation_url fallback. The engine never auto-publishes;
 * a human promotes shadow -> published in Rule Studio.
 */
export function normalizeRule(rule: ExtractedRule, citationUrlFallback?: string | null): ExtractedRule {
    return {
        ...rule,
        country: (rule.country || 'IN').toUpperCase(),
        state: 'shadow',
        authored_via: 'llm_assist',
        citation_url: rule.citation_url ?? citationUrlFallback ?? null,
        evidence_spans: rule.evidence_spans ?? [],
    };
}
