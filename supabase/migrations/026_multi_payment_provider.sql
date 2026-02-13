-- =====================================================
-- Migration 026: Multi-Provider Payment Support
-- Adds Razorpay columns alongside Stripe for dual-provider support
-- =====================================================
-- 1. Creator profiles — add Razorpay + provider tracking
ALTER TABLE creator_profiles
ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;
ALTER TABLE creator_profiles
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'razorpay';
CREATE INDEX IF NOT EXISTS idx_creator_profiles_razorpay ON creator_profiles(razorpay_customer_id);
-- 2. Subscriptions — add Razorpay IDs + provider tracking
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'razorpay';
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay ON subscriptions(razorpay_subscription_id);
-- 3. Product tiers — add Razorpay plan IDs
ALTER TABLE product_tiers
ADD COLUMN IF NOT EXISTS razorpay_plan_id_monthly TEXT;
ALTER TABLE product_tiers
ADD COLUMN IF NOT EXISTS razorpay_plan_id_annual TEXT;