-- ============================================
-- UNIFIED SOCIAL ACCOUNTS: User + Product Level
-- Extends social_accounts to support product-level accounts
-- ============================================
-- Step 1: Add product_id column (nullable = user-level account)
ALTER TABLE social_accounts
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
-- Step 2: Drop old unique constraint (user_id, platform) 
-- This only allowed one account per platform per user
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_user_id_platform_key;
-- Step 3: Create partial unique indexes
-- User-level: one account per platform per user (when no product)
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_accounts_user_platform_unique ON social_accounts(user_id, platform)
WHERE product_id IS NULL;
-- Product-level: one account per platform per user per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_accounts_product_platform_unique ON social_accounts(user_id, platform, product_id)
WHERE product_id IS NOT NULL;
-- Step 4: Index for fast product lookups
CREATE INDEX IF NOT EXISTS idx_social_accounts_product_id ON social_accounts(product_id)
WHERE product_id IS NOT NULL;
-- Step 5: Update RLS policy to support both user-level and product-level access
DROP POLICY IF EXISTS "Users can manage own social accounts" ON social_accounts;
CREATE POLICY "Users can manage own social accounts" ON social_accounts FOR ALL USING (
    user_id = auth.uid()
    OR product_id IN (
        SELECT id
        FROM products
        WHERE created_by = auth.uid()
    )
);
-- Step 6: Drop the separate product_social_accounts table (no longer needed)
DROP TABLE IF EXISTS product_social_accounts CASCADE;
-- Done!
SELECT 'Unified social accounts system ready!' as status;