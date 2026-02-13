-- =====================================================
-- Migration 027: Creator-scoped Knowledge Bases
-- Adds ownership so creators only see their own KBs
-- =====================================================
-- 1. Add created_by column to knowledge_bases
ALTER TABLE knowledge_bases
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
-- 2. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_created_by ON knowledge_bases(created_by);
-- 3. RLS: Creators can only see their own KBs
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
-- Drop any existing policies
DROP POLICY IF EXISTS "Creators can view own KBs" ON knowledge_bases;
DROP POLICY IF EXISTS "Creators can insert own KBs" ON knowledge_bases;
DROP POLICY IF EXISTS "Creators can update own KBs" ON knowledge_bases;
DROP POLICY IF EXISTS "Creators can delete own KBs" ON knowledge_bases;
DROP POLICY IF EXISTS "Super admins can view all KBs" ON knowledge_bases;
-- Creators see only their own
CREATE POLICY "Creators can view own KBs" ON knowledge_bases FOR
SELECT USING (
        auth.uid() = created_by
        OR created_by IS NULL -- legacy KBs without owner remain visible to all (admin)
    );
-- Creators can only insert with their own user_id
CREATE POLICY "Creators can insert own KBs" ON knowledge_bases FOR
INSERT WITH CHECK (auth.uid() = created_by);
-- Creators can update their own
CREATE POLICY "Creators can update own KBs" ON knowledge_bases FOR
UPDATE USING (auth.uid() = created_by);
-- Creators can delete their own
CREATE POLICY "Creators can delete own KBs" ON knowledge_bases FOR DELETE USING (auth.uid() = created_by);
-- Super admins can always see all
CREATE POLICY "Super admins can view all KBs" ON knowledge_bases FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM creator_profiles
            WHERE user_id = auth.uid()
                AND role = 'super_admin'
        )
    );