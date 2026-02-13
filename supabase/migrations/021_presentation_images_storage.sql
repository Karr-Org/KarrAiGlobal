-- =====================================================
-- PRESENTATION IMAGES STORAGE BUCKET
-- Run this in Supabase SQL Editor to create the storage bucket
-- =====================================================
-- 1. Create the storage bucket for presentation images
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'presentation-images',
        'presentation-images',
        true,
        5242880,
        -- 5MB limit
        ARRAY ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
    ) ON CONFLICT (id) DO
UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
-- 2. Create RLS policies for the bucket
-- Allow authenticated users to upload their own images
DROP POLICY IF EXISTS "Users can upload presentation images" ON storage.objects;
CREATE POLICY "Users can upload presentation images" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'presentation-images'
        AND auth.role() = 'authenticated'
    );
-- Allow public read access to all presentation images
DROP POLICY IF EXISTS "Presentation images are publicly accessible" ON storage.objects;
CREATE POLICY "Presentation images are publicly accessible" ON storage.objects FOR
SELECT USING (bucket_id = 'presentation-images');
-- Allow users to update their own images (same path prefix)
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
CREATE POLICY "Users can update their own images" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'presentation-images'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
-- Allow users to delete their own images
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE USING (
    bucket_id = 'presentation-images'
    AND auth.uid()::text = (storage.foldername(name)) [1]
);
-- Grant service role access for server-side uploads
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role;