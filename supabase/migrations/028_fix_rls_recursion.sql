-- =====================================================
-- Migration 028: Fix RLS infinite recursion
-- The "Super admins" policy on creator_profiles queries
-- itself, causing infinite recursion when other tables
-- (knowledge_bases, products) also reference creator_profiles.
-- Fix: use a security-definer function that bypasses RLS.
-- =====================================================
-- 1. Create a helper function that checks super_admin status
--    SECURITY DEFINER = runs as the function owner (postgres),
--    bypassing RLS on creator_profiles to avoid recursion.
CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
SELECT EXISTS (
        SELECT 1
        FROM creator_profiles
        WHERE user_id = auth.uid()
            AND role = 'super_admin'
    );
$$;
-- 2. Fix creator_profiles: replace self-referencing policy
DROP POLICY IF EXISTS "Super admins can view all creators" ON creator_profiles;
CREATE POLICY "Super admins can view all creators" ON creator_profiles FOR
SELECT USING (
        auth.uid() = user_id
        OR public.is_super_admin()
    );
-- Also drop and recreate the basic "own profile" policy so it
-- doesn't conflict with the super_admin one (Postgres needs
-- at least one SELECT policy to pass for the row to be visible)
DROP POLICY IF EXISTS "Creators can view own profile" ON creator_profiles;
CREATE POLICY "Creators can view own profile" ON creator_profiles FOR
SELECT USING (auth.uid() = user_id);
-- 3. Fix knowledge_bases: use the helper function
DROP POLICY IF EXISTS "Super admins can view all KBs" ON knowledge_bases;
CREATE POLICY "Super admins can view all KBs" ON knowledge_bases FOR
SELECT USING (
        auth.uid() = created_by
        OR created_by IS NULL
        OR public.is_super_admin()
    );
-- 4. Fix products: use the helper function
DROP POLICY IF EXISTS "Creators can view own products" ON products;
CREATE POLICY "Creators can view own products" ON products FOR
SELECT USING (
        created_by = auth.uid()
        OR public.is_super_admin()
    );
DROP POLICY IF EXISTS "Creators can update own products" ON products;
CREATE POLICY "Creators can update own products" ON products FOR
UPDATE USING (
        created_by = auth.uid()
        OR public.is_super_admin()
    );
DROP POLICY IF EXISTS "Creators can insert products" ON products;
CREATE POLICY "Creators can insert products" ON products FOR
INSERT WITH CHECK (
        created_by = auth.uid()
        OR public.is_super_admin()
    );