-- Rate-limit log for POST /api/v1/extract.
--
-- The extract endpoint is privileged + calls Claude Opus (expensive), so it needs
-- a per-API-key sliding-window limiter (mirrors the widget_sessions-based limit
-- the chat endpoint uses). One row per accepted extract call; the route counts
-- rows in the last 60s against product_api_keys.rate_limit_per_minute.
--
-- Server-side only: the route uses the service-role client. RLS is enabled with
-- NO client policies, so only service_role (which bypasses RLS) can read/write —
-- end users can never see or tamper with the log. The route FAILS OPEN if this
-- table is absent, so deploying the endpoint before this migration is harmless
-- (it just runs unthrottled until the table exists).
CREATE TABLE IF NOT EXISTS extract_usage (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id  UUID NOT NULL REFERENCES product_api_keys(id) ON DELETE CASCADE,
    product_id  UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_extract_usage_key_time
    ON extract_usage (api_key_id, created_at DESC);

ALTER TABLE extract_usage ENABLE ROW LEVEL SECURITY;
-- (intentionally no policies — service_role only)
