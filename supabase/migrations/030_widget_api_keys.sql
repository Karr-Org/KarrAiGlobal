-- =====================================================
-- 030: Widget & API Key System
-- Enables products to be used via embeddable widget
-- and public REST API with API key authentication
-- =====================================================
-- API Keys for product access
CREATE TABLE IF NOT EXISTS product_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    -- Key details
    key_prefix TEXT NOT NULL,
    -- First 8 chars (for display: "pk_abc1...")
    key_hash TEXT NOT NULL,
    -- SHA256 hash of the full key
    name TEXT DEFAULT 'Default',
    -- Friendly name: "Website Widget", "Mobile App"
    -- Permissions
    permissions TEXT [] DEFAULT ARRAY ['chat']::TEXT [],
    -- chat, read_kb, etc.
    -- Tracking
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    request_count BIGINT DEFAULT 0,
    -- Rate limiting
    rate_limit_per_minute INT DEFAULT 30,
    -- Allowed origins (CORS) — empty means allow all
    allowed_origins TEXT [] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Widget chat sessions (anonymous, no login required)
CREATE TABLE IF NOT EXISTS widget_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES product_api_keys(id),
    -- Visitor tracking
    visitor_id TEXT,
    -- Anonymous fingerprint/cookie ID
    visitor_name TEXT,
    -- Optional: if they provide name
    visitor_email TEXT,
    -- Optional: if they provide email
    -- Session data
    origin_url TEXT,
    -- Which page they're chatting from
    user_agent TEXT,
    ip_address TEXT,
    -- Conversation
    messages JSONB DEFAULT '[]'::JSONB,
    message_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_message_at TIMESTAMPTZ DEFAULT now()
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_product ON product_api_keys(product_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON product_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON product_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_widget_sessions_product ON widget_sessions(product_id);
CREATE INDEX IF NOT EXISTS idx_widget_sessions_visitor ON widget_sessions(visitor_id);
-- RLS
ALTER TABLE product_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_sessions ENABLE ROW LEVEL SECURITY;
-- Service role full access
DROP POLICY IF EXISTS "Service role full access on api_keys" ON product_api_keys;
CREATE POLICY "Service role full access on api_keys" ON product_api_keys FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role full access on widget_sessions" ON widget_sessions;
CREATE POLICY "Service role full access on widget_sessions" ON widget_sessions FOR ALL USING (auth.role() = 'service_role');
-- Creators can manage their API keys
DROP POLICY IF EXISTS "Creators manage their api keys" ON product_api_keys;
CREATE POLICY "Creators manage their api keys" ON product_api_keys FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM products p
        WHERE p.id = product_api_keys.product_id
            AND p.created_by = auth.uid()
    )
);