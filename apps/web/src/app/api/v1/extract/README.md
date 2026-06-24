# POST /api/v1/extract — law text → compliance rule (Opus)

Structured-extraction sibling of `/api/v1/chat`. Turns a piece of statute /
notification / circular text into **one** deterministic compliance-rule JSON that
matches Karr's rule contract, with two server-side guardrails that make an LLM
draft safe to hand to a reviewer.

It is **stateless** (no DB writes besides a fire-and-forget usage stamp) and
**privileged** (server-to-server). The returned rule is always `state: "shadow"`,
`authored_via: "llm_assist"` — the **caller** (Karr) stores it in its own
amendment inbox and a human promotes it in Rule Studio. This endpoint never
publishes anything.

## Auth

Same as `/api/v1/chat`: `Authorization: Bearer pk_live_…`. The key must carry the
**`extract`** permission (a key with no `permissions` set is treated as
full/unscoped; a scoped key must list `"extract"` or `"*"`). Unlike the public
widget chat, this endpoint does **not** emit a wildcard CORS origin — a leaked key
cannot be replayed from an arbitrary browser.

## Env

- `ANTHROPIC_API_KEY` — required (the Opus call).
- `EXTRACT_MODEL` — optional, defaults to `claude-opus-4-8`.
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — for the key lookup.

## Request

```jsonc
POST /api/v1/extract
Authorization: Bearer pk_live_xxx
Content-Type: application/json
{
  "law_text": "Where any sum is paid to a contractor ... thirty thousand rupees ...",  // required (≤ 200,000 chars)
  "country":  "IN",                          // optional, default "IN"
  "hints":    { "code": "194C", "category": "tds", "citation_url": "https://…" },  // optional seeds
  "model":    "claude-opus-4-8"              // optional; must be in the allowlist
}
```

## Response — 200 (a valid draft)

```jsonc
{
  "ok": true,
  "rule": {
    "rule_key": "IN.TDS.194C", "country": "IN", "category": "tds", "code": "194C",
    "check_type": "threshold_per_txn", "severity": "warning", "state": "shadow",
    "eff_from": "2025-04-01",
    "applicability": { "==": [ {"var":"org.registrations.tan"}, true ] },
    "predicate":     { ">":  [ {"var":"txn.amount"}, 30000 ] },
    "params": { "threshold": 30000, "rate_pct": 1 },
    "trigger_events": ["bill","expense_claim"],
    "exposure_model": { "currency":"INR", "components":[ … ] },
    "deadline_rule":  { "next_month_day": 7 },
    "evidence_spans": [ { "quote":"thirty thousand rupees", "for":"threshold" } ],
    "authored_via": "llm_assist"
  },
  "valid": true,
  "evidence": [ … ],
  "confidence": 0.8,
  "model": "claude-opus-4-8",
  "usage": { "input_tokens": …, "output_tokens": … }
}
```

## Response — 422 (rejected by guardrails)

The model produced something, but it failed validation. The raw `proposal` is
returned so the caller can inspect/iterate.

```jsonc
{ "ok": false, "error": "Draft rejected by guardrails",
  "reasons": [ "references unknown fact field 'txn.foo' (not in the closed-world catalog)" ],
  "proposal": { … }, "model": "…", "usage": { … } }
```

Other errors: `401` (missing/invalid key), `403` (revoked / lacks `extract`),
`400` (bad body / `law_text` missing or too long), `502` (model call failed),
`500` (internal).

## The two guardrails (why this is safe)

1. **Closed-world fact catalog** — every JSON-Logic `var` used in `applicability`,
   `predicate`, and inside `exposure_model` formulas must be a fact the Karr engine
   actually supplies (see `lib/compliance-extract.ts → EXTRACT_FIELD_CATALOG`).
   Unknown field ⇒ rejected. The model can't invent a fact path.
2. **Quote-or-null** — every numeric threshold/rate/date must be backed by an
   `evidence_span` whose `quote` appears **verbatim** in `law_text`. Hallucinated
   numbers are rejected.

Plus: `check_type`, `severity`, `trigger_events`, exposure component types, and
`deadline_rule` keys are all enum-checked.

## Example

```bash
curl -s https://makemyai.app/api/v1/extract \
  -H "Authorization: Bearer pk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"law_text":"<statute text>","country":"IN","hints":{"code":"194C"}}'
```

## Karr integration

Karr's backend calls this per law section, takes `response.rule`, and inserts it
into `amendment_inbox.proposed_version` (state `pending`). A platform admin reviews
+ promotes it in Compliance → Rule Studio (shadow → published). The rule JSON
already matches Karr's `00173`-style seed shape — see Karr
`docs/COMPLIANCE_RULE_AUTHORING.md`.

## Rate limiting

Per-key 60s sliding window against `product_api_keys.rate_limit_per_minute`
(default 30/min), backed by the `extract_usage` table. **Apply migration
`supabase/migrations/20260624_extract_rate_limit.sql`** to enable it — the route
fails OPEN (runs unthrottled, logs a warning) until that table exists, so deploy
order is safe.
