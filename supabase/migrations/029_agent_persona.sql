-- =====================================================
-- 029: Agent Persona System
-- Every product can have a persona that defines WHO the 
-- agent is, HOW it behaves, and WHAT it knows about
-- =====================================================
-- Agent Persona Table
CREATE TABLE IF NOT EXISTS agent_persona (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    -- Identity
    agent_name TEXT,
    -- "Dr. TaxBot", "Maya"
    agent_role TEXT,
    -- "Senior Tax Consultant"
    organization_name TEXT,
    -- "Shah & Associates"
    -- Personality & Behavior
    tone TEXT DEFAULT 'professional',
    -- professional, friendly, casual, academic, witty
    greeting_message TEXT,
    -- First message shown to users
    -- System Instructions (the CORE — free-form behavior definition)
    system_instructions TEXT,
    -- "You are a tax expert. Always cite section numbers..."
    -- Guardrails
    blocked_topics TEXT [] DEFAULT '{}',
    -- Topics agent must refuse
    fallback_message TEXT,
    -- When agent can't answer
    -- Website Learning
    website_url TEXT,
    -- Organization website to learn from
    website_crawl_status TEXT DEFAULT 'none',
    -- none, crawling, completed, error
    website_pages_indexed INT DEFAULT 0,
    website_last_crawled_at TIMESTAMPTZ,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- One persona per product
    UNIQUE(product_id)
);
-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_agent_persona_product ON agent_persona(product_id);
-- RLS Policies
ALTER TABLE agent_persona ENABLE ROW LEVEL SECURITY;
-- Anyone can read persona (needed for chat route)
DROP POLICY IF EXISTS "Anyone can read agent persona" ON agent_persona;
CREATE POLICY "Anyone can read agent persona" ON agent_persona FOR
SELECT USING (true);
-- Creators can manage their product's persona
DROP POLICY IF EXISTS "Creators can manage their persona" ON agent_persona;
CREATE POLICY "Creators can manage their persona" ON agent_persona FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM products p
        WHERE p.id = agent_persona.product_id
            AND p.created_by = auth.uid()
    )
);
-- Service role can do everything (for API routes)
DROP POLICY IF EXISTS "Service role full access on agent_persona" ON agent_persona;
CREATE POLICY "Service role full access on agent_persona" ON agent_persona FOR ALL USING (auth.role() = 'service_role');