-- Fix missing columns in user_documents table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_documents') THEN
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_documents' AND column_name = 'file_size_bytes') THEN
            ALTER TABLE user_documents ADD COLUMN file_size_bytes BIGINT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_documents' AND column_name = 'file_type') THEN
            ALTER TABLE user_documents ADD COLUMN file_type TEXT;
        END IF;

        -- Ensure status has default
        ALTER TABLE user_documents ALTER COLUMN status SET DEFAULT 'processing';

    END IF;
END $$;
