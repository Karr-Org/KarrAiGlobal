-- Universal Professional Platform Schema
-- Migration 003: Entities, Tasks, and Style Learning

-- ============================================
-- PRODUCT ENTITY TYPES
-- Defines what entity types a product supports (Client, Patient, Case, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS product_entity_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                    -- "Client", "Patient", "Case"
    name_plural TEXT,                       -- "Clients", "Patients", "Cases"
    icon TEXT DEFAULT 'building',           -- lucide icon name
    fields JSONB DEFAULT '[]',              -- Custom fields: [{name, type, required}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, name)
);

-- ============================================
-- USER ENTITIES
-- User's actual entities (their clients, patients, cases, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS user_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_user_id UUID NOT NULL REFERENCES product_users(id) ON DELETE CASCADE,
    entity_type_id UUID NOT NULL REFERENCES product_entity_types(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                     -- "M/s ABC Trading", "John Doe"
    metadata JSONB DEFAULT '{}',            -- Custom field values
    notes TEXT,                             -- Free-form notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_entities_product_user ON user_entities(product_user_id);
CREATE INDEX IF NOT EXISTS idx_user_entities_name ON user_entities USING gin(to_tsvector('english', name));

-- ============================================
-- ENTITY DOCUMENTS
-- Link user's documents to specific entities
-- ============================================
CREATE TABLE IF NOT EXISTS entity_documents (
    entity_id UUID NOT NULL REFERENCES user_entities(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES user_knowledge_documents(id) ON DELETE CASCADE,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (entity_id, document_id)
);

-- ============================================
-- PRODUCT TASKS
-- Task templates defined per product (GST Notice Reply, Patient Summary, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS product_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                     -- "GST Notice Reply"
    description TEXT,                       -- Brief description
    trigger_keywords TEXT[] DEFAULT '{}',   -- ["notice", "reply", "draft"]
    output_format TEXT DEFAULT 'freeform',  -- "letter", "table", "memo", "freeform"
    system_prompt TEXT,                     -- Task-specific prompt override
    knowledge_sources TEXT[] DEFAULT ARRAY['global', 'user'], -- What to search
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_tasks_product ON product_tasks(product_id);

-- ============================================
-- USER STYLE SAMPLES
-- Store user's past outputs to learn their writing style
-- ============================================
CREATE TABLE IF NOT EXISTS user_style_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_user_id UUID NOT NULL REFERENCES product_users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES product_tasks(id) ON DELETE SET NULL,
    content TEXT NOT NULL,                  -- The sample output
    title TEXT,                             -- Optional title
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_style_samples_user ON user_style_samples(product_user_id);
CREATE INDEX IF NOT EXISTS idx_user_style_samples_task ON user_style_samples(task_id);

-- ============================================
-- ENTITY CHAT HISTORY
-- Track which entities were referenced in chat messages
-- ============================================
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS detected_task_id UUID REFERENCES product_tasks(id),
ADD COLUMN IF NOT EXISTS detected_entity_id UUID REFERENCES user_entities(id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE product_entity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_style_samples ENABLE ROW LEVEL SECURITY;

-- Product Entity Types: Anyone can view (it's product config)
DROP POLICY IF EXISTS "Anyone can view product entity types" ON product_entity_types;
CREATE POLICY "Anyone can view product entity types" ON product_entity_types
    FOR SELECT USING (true);

-- User Entities: Only owner can access
DROP POLICY IF EXISTS "Users can manage own entities" ON user_entities;
CREATE POLICY "Users can manage own entities" ON user_entities
    FOR ALL USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

-- Entity Documents: Only owner can access
DROP POLICY IF EXISTS "Users can manage own entity documents" ON entity_documents;
CREATE POLICY "Users can manage own entity documents" ON entity_documents
    FOR ALL USING (
        entity_id IN (
            SELECT ue.id FROM user_entities ue
            JOIN product_users pu ON ue.product_user_id = pu.id
            WHERE pu.user_id = auth.uid()
        )
    );

-- Product Tasks: Anyone can view (it's product config)
DROP POLICY IF EXISTS "Anyone can view product tasks" ON product_tasks;
CREATE POLICY "Anyone can view product tasks" ON product_tasks
    FOR SELECT USING (true);

-- User Style Samples: Only owner can access
DROP POLICY IF EXISTS "Users can manage own style samples" ON user_style_samples;
CREATE POLICY "Users can manage own style samples" ON user_style_samples
    FOR ALL USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- SEED DEFAULT ENTITY TYPES FOR GST PRODUCT
-- ============================================
DO $$
DECLARE
    gst_product_id UUID;
BEGIN
    -- Get GST Assistant product
    SELECT id INTO gst_product_id FROM products WHERE slug = 'gst-assistant' LIMIT 1;
    
    IF gst_product_id IS NOT NULL THEN
        -- Insert default entity type for GST
        INSERT INTO product_entity_types (product_id, name, name_plural, icon, fields)
        VALUES (
            gst_product_id,
            'Client',
            'Clients',
            'building',
            '[
                {"name": "GST Number", "type": "text", "required": false},
                {"name": "PAN", "type": "text", "required": false},
                {"name": "Contact Person", "type": "text", "required": false},
                {"name": "Email", "type": "email", "required": false},
                {"name": "Phone", "type": "text", "required": false}
            ]'::jsonb
        )
        ON CONFLICT (product_id, name) DO NOTHING;
        
        -- Insert default tasks for GST
        INSERT INTO product_tasks (product_id, name, description, trigger_keywords, output_format, system_prompt, knowledge_sources)
        VALUES 
        (
            gst_product_id,
            'GST Notice Reply',
            'Draft a formal reply to GST department notices',
            ARRAY['notice', 'reply', 'draft reply', 'respond', 'response'],
            'letter',
            'You are drafting a formal reply to a GST department notice. Be precise, cite relevant sections, and maintain a professional, respectful tone. Structure the reply with: Subject, Reference, Body paragraphs addressing each point, and closing.',
            ARRAY['global', 'entity', 'user']
        ),
        (
            gst_product_id,
            'ITC Analysis',
            'Analyze Input Tax Credit issues and provide recommendations',
            ARRAY['itc', 'input tax credit', 'credit', 'reconciliation', 'mismatch'],
            'memo',
            'You are analyzing an Input Tax Credit issue. Provide clear analysis with references to relevant sections (16, 17, 18), cite applicable circulars, and give actionable recommendations.',
            ARRAY['global', 'entity', 'user']
        ),
        (
            gst_product_id,
            'Client Advisory',
            'Prepare advisory memo for clients on GST matters',
            ARRAY['advisory', 'advise', 'memo', 'guidance', 'opinion'],
            'memo',
            'You are preparing a professional advisory memo for a client. Be clear, practical, and structure the advice with: Background, Analysis, Recommendations, and Action Items.',
            ARRAY['global', 'user']
        ),
        (
            gst_product_id,
            'Research Query',
            'General research and Q&A on GST topics',
            ARRAY[],
            'freeform',
            NULL,
            ARRAY['global', 'user']
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- HELPER FUNCTION: Detect task from message
-- ============================================
CREATE OR REPLACE FUNCTION detect_task_from_message(
    p_product_id UUID,
    p_message TEXT
)
RETURNS UUID AS $$
DECLARE
    detected_task_id UUID;
    message_lower TEXT;
BEGIN
    message_lower := lower(p_message);
    
    -- Find task with matching keyword
    SELECT id INTO detected_task_id
    FROM product_tasks
    WHERE product_id = p_product_id
      AND is_active = true
      AND EXISTS (
          SELECT 1 FROM unnest(trigger_keywords) kw
          WHERE message_lower LIKE '%' || lower(kw) || '%'
      )
    ORDER BY array_length(trigger_keywords, 1) DESC
    LIMIT 1;
    
    -- If no specific task found, return Research Query (fallback)
    IF detected_task_id IS NULL THEN
        SELECT id INTO detected_task_id
        FROM product_tasks
        WHERE product_id = p_product_id
          AND name = 'Research Query'
          AND is_active = true
        LIMIT 1;
    END IF;
    
    RETURN detected_task_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTION: Detect entity from message
-- ============================================
CREATE OR REPLACE FUNCTION detect_entity_from_message(
    p_product_user_id UUID,
    p_message TEXT
)
RETURNS UUID AS $$
DECLARE
    detected_entity_id UUID;
BEGIN
    -- Simple name matching (case insensitive)
    SELECT id INTO detected_entity_id
    FROM user_entities
    WHERE product_user_id = p_product_user_id
      AND lower(p_message) LIKE '%' || lower(name) || '%'
    ORDER BY length(name) DESC  -- Prefer longer (more specific) names
    LIMIT 1;
    
    RETURN detected_entity_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ENTITY FACTS - The Memory Layer
-- Extracted facts from chats about entities
-- ============================================
CREATE TABLE IF NOT EXISTS entity_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES user_entities(id) ON DELETE CASCADE,
    fact_type TEXT NOT NULL,              -- "notice", "case", "interaction", "outcome", "note"
    summary TEXT NOT NULL,                 -- "Received ITC mismatch notice for ₹5L"
    details JSONB DEFAULT '{}',            -- {notice_number, amount, date, etc.}
    source_chat_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entity_facts_entity ON entity_facts(entity_id);

-- ============================================
-- KB PROMOTION QUEUE - Crowdsourcing
-- Flag user docs that could improve Global KB
-- ============================================
CREATE TABLE IF NOT EXISTS kb_promotion_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_document_id UUID NOT NULL REFERENCES user_documents(id) ON DELETE CASCADE,
    suggested_by UUID NOT NULL REFERENCES product_users(id) ON DELETE CASCADE,
    filename TEXT,
    preview_text TEXT,                     -- First 500 chars for admin review
    status TEXT DEFAULT 'pending',         -- pending, approved, rejected
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_kb_promotion_status ON kb_promotion_queue(status);

-- ============================================
-- CHAT SESSION CONTEXT FILES
-- Temporary files uploaded during chat (not added to KB)
-- ============================================
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS context_files JSONB DEFAULT '[]';
-- Format: [{filename, file_type, extracted_text, uploaded_at}]

-- ============================================
-- RLS for new tables
-- ============================================
ALTER TABLE entity_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_promotion_queue ENABLE ROW LEVEL SECURITY;

-- Entity Facts: Only owner can access
DROP POLICY IF EXISTS "Users can manage own entity facts" ON entity_facts;
CREATE POLICY "Users can manage own entity facts" ON entity_facts
    FOR ALL USING (
        entity_id IN (
            SELECT ue.id FROM user_entities ue
            JOIN product_users pu ON ue.product_user_id = pu.id
            WHERE pu.user_id = auth.uid()
        )
    );

-- KB Promotion: Users can suggest, only admins can manage
DROP POLICY IF EXISTS "Users can suggest promotions" ON kb_promotion_queue;
CREATE POLICY "Users can suggest promotions" ON kb_promotion_queue
    FOR INSERT WITH CHECK (
        suggested_by IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view own promotions" ON kb_promotion_queue;
CREATE POLICY "Users can view own promotions" ON kb_promotion_queue
    FOR SELECT USING (
        suggested_by IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );
