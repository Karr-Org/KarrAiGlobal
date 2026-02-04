-- ============================================================================
-- KARR AI COGNITIVE DIGITAL TWIN - FIX MIGRATION
-- Run this in Supabase SQL Editor to fix missing columns
-- ============================================================================

-- Add missing message_count column
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

-- Update existing NULL values to defaults
UPDATE chat_sessions SET is_active = true WHERE is_active IS NULL;
UPDATE chat_sessions SET is_starred = false WHERE is_starred IS NULL;
UPDATE chat_sessions SET is_pinned = false WHERE is_pinned IS NULL;
UPDATE chat_sessions SET message_count = 0 WHERE message_count IS NULL;
UPDATE chat_sessions SET user_message_count = 0 WHERE user_message_count IS NULL;
UPDATE chat_sessions SET last_message_at = created_at WHERE last_message_at IS NULL;
UPDATE chat_sessions SET started_at = created_at WHERE started_at IS NULL;

-- Verify the fix
SELECT column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'chat_sessions' 
AND column_name IN ('message_count', 'is_active', 'is_starred', 'is_pinned')
ORDER BY column_name;
