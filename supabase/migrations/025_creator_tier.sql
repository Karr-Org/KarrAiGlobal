-- =====================================================
-- Migration 025: Creator Tier (Two-Tier Platform)
-- Adds creator identity, platform plans, and product ownership RLS
-- =====================================================
-- ============================================
-- 1. PLATFORM PLANS (what creators pay for)
-- ============================================
CREATE TABLE IF NOT EXISTS platform_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    -- 'free', 'pro', 'enterprise'
    display_name TEXT NOT NULL,
    price_monthly INTEGER DEFAULT 0,
    -- in cents (USD)
    price_annual INTEGER DEFAULT 0,
    product_limit INTEGER DEFAULT 1,
    -- max products on this plan
    storage_limit_gb INTEGER DEFAULT 1,
    kb_limit INTEGER DEFAULT 1,
    -- max knowledge bases
    user_limit INTEGER DEFAULT 100,
    -- max end-users across all products
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Seed default plans
INSERT INTO platform_plans (
        name,
        display_name,
        price_monthly,
        price_annual,
        product_limit,
        storage_limit_gb,
        kb_limit,
        user_limit,
        features
    )
VALUES (
        'free',
        'Starter',
        0,
        0,
        1,
        1,
        1,
        50,
        '["1 AI Product", "1 Knowledge Base", "50 End Users", "Community Support"]'::jsonb
    ),
    (
        'pro',
        'Professional',
        4900,
        49900,
        5,
        10,
        10,
        1000,
        '["5 AI Products", "10 Knowledge Bases", "1,000 End Users", "Custom Domains", "Priority Support", "Analytics"]'::jsonb
    ),
    (
        'enterprise',
        'Enterprise',
        19900,
        199900,
        50,
        100,
        100,
        10000,
        '["50 AI Products", "100 Knowledge Bases", "10,000 End Users", "Custom Domains", "White Label", "Dedicated Support", "API Access"]'::jsonb
    ) ON CONFLICT (name) DO NOTHING;
-- ============================================
-- 2. CREATOR PROFILES (Tier 1 users)
-- ============================================
CREATE TABLE IF NOT EXISTS creator_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    company_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    role TEXT DEFAULT 'creator' CHECK (role IN ('creator', 'super_admin')),
    -- Plan & billing
    plan_id UUID REFERENCES platform_plans(id),
    stripe_customer_id TEXT,
    plan_status TEXT DEFAULT 'active' CHECK (
        plan_status IN ('active', 'past_due', 'canceled', 'trialing')
    ),
    plan_expires_at TIMESTAMPTZ,
    -- Limits tracking
    product_count INTEGER DEFAULT 0,
    total_storage_used_bytes BIGINT DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_user_id ON creator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_stripe ON creator_profiles(stripe_customer_id);
-- Default plan: set to 'free' for new creators
DO $$
DECLARE free_plan_id UUID;
BEGIN
SELECT id INTO free_plan_id
FROM platform_plans
WHERE name = 'free'
LIMIT 1;
-- Will be used as default in API
END $$;
-- ============================================
-- 3. RLS on creator_profiles
-- ============================================
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_plans ENABLE ROW LEVEL SECURITY;
-- Anyone can read plans (they're public pricing info)
DROP POLICY IF EXISTS "Anyone can view platform plans" ON platform_plans;
CREATE POLICY "Anyone can view platform plans" ON platform_plans FOR
SELECT USING (true);
-- Creators can only see/edit their own profile
DROP POLICY IF EXISTS "Creators can view own profile" ON creator_profiles;
CREATE POLICY "Creators can view own profile" ON creator_profiles FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Creators can update own profile" ON creator_profiles;
CREATE POLICY "Creators can update own profile" ON creator_profiles FOR
UPDATE USING (auth.uid() = user_id);
-- Super admins can view all creator profiles
DROP POLICY IF EXISTS "Super admins can view all creators" ON creator_profiles;
CREATE POLICY "Super admins can view all creators" ON creator_profiles FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM creator_profiles cp
            WHERE cp.user_id = auth.uid()
                AND cp.role = 'super_admin'
        )
    );
-- ============================================
-- 4. RLS on products — scope to creator
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- Creators can only see their own products
DROP POLICY IF EXISTS "Creators can view own products" ON products;
CREATE POLICY "Creators can view own products" ON products FOR
SELECT USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM creator_profiles cp
            WHERE cp.user_id = auth.uid()
                AND cp.role = 'super_admin'
        )
    );
-- Creators can only update their own products
DROP POLICY IF EXISTS "Creators can update own products" ON products;
CREATE POLICY "Creators can update own products" ON products FOR
UPDATE USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM creator_profiles cp
            WHERE cp.user_id = auth.uid()
                AND cp.role = 'super_admin'
        )
    );
-- Creators can insert products (created_by is set by API)
DROP POLICY IF EXISTS "Creators can insert products" ON products;
CREATE POLICY "Creators can insert products" ON products FOR
INSERT WITH CHECK (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM creator_profiles cp
            WHERE cp.user_id = auth.uid()
                AND cp.role = 'super_admin'
        )
    );
-- Public read for active products (marketplace needs this)
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products" ON products FOR
SELECT USING (status = 'active');
-- ============================================
-- 5. Add category to products for marketplace
-- ============================================
ALTER TABLE products
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE products
ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
-- ============================================
-- 6. Product Subscriptions — Tier 2 enhancements
-- ============================================
-- Add Stripe fields to subscriptions table for end-user payments
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS price_cents INTEGER DEFAULT 0;
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS billing_period TEXT DEFAULT 'monthly' CHECK (
        billing_period IN ('monthly', 'annual', 'lifetime')
    );
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
-- Add Stripe fields to product_tiers for product-level pricing
ALTER TABLE product_tiers
ADD COLUMN IF NOT EXISTS stripe_price_id_monthly TEXT;
ALTER TABLE product_tiers
ADD COLUMN IF NOT EXISTS stripe_price_id_annual TEXT;