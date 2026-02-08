-- ============================================
-- AI MARKETING ENGINE - INCREMENTAL UPDATE
-- Adds: product_social_accounts, marketing_automation_rules
-- Run this if you already have the base marketing tables
-- ============================================
-- Product Social Accounts (OAuth tokens per platform per PRODUCT for auto-publishing)
CREATE TABLE IF NOT EXISTS product_social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (
        platform IN (
            'twitter',
            'linkedin',
            'facebook',
            'instagram',
            'youtube',
            'medium',
            'hashnode',
            'devto'
        )
    ),
    -- Platform identifiers
    platform_user_id VARCHAR(255),
    platform_username VARCHAR(255),
    platform_display_name VARCHAR(255),
    platform_avatar_url TEXT,
    platform_page_id VARCHAR(255),
    platform_page_name VARCHAR(255),
    -- OAuth tokens
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT [],
    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    auto_publish_enabled BOOLEAN DEFAULT true,
    -- Metadata
    last_synced_at TIMESTAMPTZ,
    last_post_at TIMESTAMPTZ,
    follower_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, platform, platform_user_id)
);
-- Automation Rules (Scheduled content generation and publishing)
CREATE TABLE IF NOT EXISTS marketing_automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    -- Trigger
    trigger_type TEXT NOT NULL CHECK (
        trigger_type IN (
            'schedule',
            'event',
            'manual'
        )
    ),
    schedule_cron TEXT,
    schedule_timezone TEXT DEFAULT 'UTC',
    -- Action
    action_type TEXT NOT NULL CHECK (
        action_type IN (
            'generate_ideas',
            'generate_blog',
            'generate_social',
            'publish_blog',
            'publish_social',
            'repurpose_content'
        )
    ),
    action_config JSONB DEFAULT '{}',
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    last_run_status TEXT,
    next_run_at TIMESTAMPTZ,
    run_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_social_accounts_product ON product_social_accounts(product_id);
CREATE INDEX IF NOT EXISTS idx_product_social_accounts_platform ON product_social_accounts(product_id, platform);
CREATE INDEX IF NOT EXISTS idx_automation_rules_product ON marketing_automation_rules(product_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_next_run ON marketing_automation_rules(next_run_at)
WHERE is_active = true;
-- Enable RLS
ALTER TABLE product_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_automation_rules ENABLE ROW LEVEL SECURITY;
-- RLS Policies (using DROP IF EXISTS pattern to avoid conflicts)
DO $$ BEGIN -- Product Social Accounts Policy
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'product_social_accounts'
        AND policyname = 'Users can manage their product social accounts'
) THEN CREATE POLICY "Users can manage their product social accounts" ON product_social_accounts FOR ALL USING (
    product_id IN (
        SELECT id
        FROM products
        WHERE created_by = auth.uid()
    )
);
END IF;
-- Automation Rules Policy
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'marketing_automation_rules'
        AND policyname = 'Users can manage their automation rules'
) THEN CREATE POLICY "Users can manage their automation rules" ON marketing_automation_rules FOR ALL USING (
    product_id IN (
        SELECT id
        FROM products
        WHERE created_by = auth.uid()
    )
);
END IF;
END $$;
-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_marketing_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Drop existing triggers if they exist (to avoid conflicts)
DROP TRIGGER IF EXISTS update_product_social_accounts_updated_at ON product_social_accounts;
DROP TRIGGER IF EXISTS update_marketing_automation_rules_updated_at ON marketing_automation_rules;
-- Create triggers
CREATE TRIGGER update_product_social_accounts_updated_at BEFORE
UPDATE ON product_social_accounts FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();
CREATE TRIGGER update_marketing_automation_rules_updated_at BEFORE
UPDATE ON marketing_automation_rules FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();
-- Grant permissions
GRANT ALL ON product_social_accounts TO authenticated;
GRANT ALL ON marketing_automation_rules TO authenticated;
-- Done!
SELECT 'Marketing Engine Social Accounts tables created successfully!' as status;