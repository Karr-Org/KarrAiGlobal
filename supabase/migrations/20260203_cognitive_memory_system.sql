-- ============================================================================
-- KARR AI COGNITIVE DIGITAL TWIN - DATABASE MIGRATION
-- Version: 1.0
-- Description: Complete schema for the 7-layer cognitive memory system
-- ============================================================================

-- ============================================================================
-- LAYER 2: EPISODIC MEMORY - Enhance existing Chat Sessions table
-- ============================================================================

-- Add new columns to existing chat_sessions table
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS title_emoji VARCHAR(10);
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS summary_updated_at TIMESTAMPTZ;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS primary_topic VARCHAR(100);
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS topic_categories JSONB DEFAULT '[]';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS entities_mentioned JSONB DEFAULT '[]';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS primary_entities JSONB DEFAULT '[]';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS intent_type VARCHAR(50);
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS intent_summary TEXT;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS dominant_sentiment VARCHAR(30);
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS sentiment_journey JSONB DEFAULT '[]';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS resolution_status VARCHAR(20) DEFAULT 'ongoing';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS user_insights JSONB DEFAULT '{}';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS expertise_signals JSONB DEFAULT '{}';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS action_items JSONB DEFAULT '[]';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS follow_up_needed BOOLEAN DEFAULT false;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS follow_up_topic TEXT;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS user_message_count INTEGER DEFAULT 0;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS avg_message_length INTEGER DEFAULT 0;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS sources_used INTEGER DEFAULT 0;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS thinking_time_total INTEGER DEFAULT 0;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS archive_reason VARCHAR(50);
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS continued_from_session_id UUID;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS continuation_context TEXT;

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_recent ON chat_sessions(product_user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_product ON chat_sessions(product_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_topics ON chat_sessions USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_sessions_entities ON chat_sessions USING GIN(entities_mentioned);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON chat_sessions(product_user_id, is_active, last_message_at DESC);


-- ============================================================================
-- Add a session_id alias column if chat_session_id is what exists
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS message_index INTEGER;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'text';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS original_query TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS rewritten_query TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS query_rewrite_reason TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS source_count INTEGER DEFAULT 0;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS citations_used JSONB DEFAULT '[]';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS confidence FLOAT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reasoning_enabled BOOLEAN DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reasoning_data JSONB;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reasoning_duration_ms INTEGER;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS crag_verdict VARCHAR(20);
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS crag_confidence FLOAT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS entities_mentioned JSONB DEFAULT '[]';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20);
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sentiment_score FLOAT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS response_length INTEGER;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS formatting_used JSONB DEFAULT '[]';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS user_rating INTEGER;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS user_feedback TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS was_edited BOOLEAN DEFAULT false;

-- Update session_id from chat_session_id if needed
UPDATE chat_messages SET session_id = chat_session_id WHERE session_id IS NULL AND chat_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id, message_index);
CREATE INDEX IF NOT EXISTS idx_messages_role ON chat_messages(session_id, role);


-- ============================================================================
-- LAYER 3: USER COGNITIVE PROFILE - The Digital Twin Core
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_cognitive_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_user_id UUID REFERENCES product_users(id) ON DELETE CASCADE UNIQUE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    -- Identity
    persona_summary TEXT,
    persona_keywords JSONB DEFAULT '[]',
    profession VARCHAR(100),
    industry VARCHAR(100),
    organization_type VARCHAR(50),
    
    -- Expertise
    domains JSONB DEFAULT '[]',
    expertise_levels JSONB DEFAULT '{}',
    expertise_evolution JSONB DEFAULT '[]',
    knowledge_gaps JSONB DEFAULT '[]',
    learning_velocity JSONB DEFAULT '{}',
    
    -- Goals & Challenges
    active_goals JSONB DEFAULT '[]',
    completed_goals JSONB DEFAULT '[]',
    recurring_challenges JSONB DEFAULT '[]',
    current_projects JSONB DEFAULT '[]',
    
    -- Communication Style
    communication_style VARCHAR(50),
    preferred_response_length VARCHAR(20),
    preferred_formatting JSONB DEFAULT '{}',
    vocabulary_level VARCHAR(20),
    preferred_examples_type VARCHAR(30),
    asks_followup_questions BOOLEAN,
    prefers_step_by_step BOOLEAN,
    
    -- Behavioral Patterns
    common_question_patterns JSONB DEFAULT '[]',
    query_complexity_avg FLOAT,
    typical_session_length INTEGER,
    typical_session_duration INTEGER,
    active_hours JSONB DEFAULT '{}',
    active_days JSONB DEFAULT '{}',
    peak_usage_time VARCHAR(20),
    
    -- Emotional Profile
    default_sentiment VARCHAR(20),
    frustration_triggers JSONB DEFAULT '[]',
    satisfaction_signals JSONB DEFAULT '[]',
    patience_level VARCHAR(20),
    handles_complexity VARCHAR(20),
    
    -- Aggregated Statistics
    total_sessions INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_queries INTEGER DEFAULT 0,
    first_interaction_at TIMESTAMPTZ,
    last_interaction_at TIMESTAMPTZ,
    days_active INTEGER DEFAULT 0,
    topics_explored JSONB DEFAULT '[]',
    entities_discussed JSONB DEFAULT '[]',
    
    -- Metadata
    profile_version INTEGER DEFAULT 1,
    profile_confidence FLOAT DEFAULT 0.0,
    last_profile_update TIMESTAMPTZ,
    profile_changelog JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_user ON user_cognitive_profile(product_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_product ON user_cognitive_profile(product_id);

-- ============================================================================
-- LAYER 4: ENTITY KNOWLEDGE GRAPH
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_entity_graph (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_user_id UUID REFERENCES product_users(id) ON DELETE CASCADE,
    
    -- Entity Core
    entity_name VARCHAR(200) NOT NULL,
    entity_name_normalized VARCHAR(200),
    entity_type VARCHAR(50) NOT NULL,
    entity_subtype VARCHAR(50),
    
    -- Relationship to User
    relationship_to_user VARCHAR(100),
    relationship_strength FLOAT DEFAULT 0.5,
    relationship_sentiment VARCHAR(20),
    
    -- Entity Context
    description TEXT,
    key_facts JSONB DEFAULT '[]',
    associated_topics JSONB DEFAULT '[]',
    
    -- Connections
    connected_entities JSONB DEFAULT '[]',
    
    -- Temporal
    first_mentioned_at TIMESTAMPTZ DEFAULT NOW(),
    last_mentioned_at TIMESTAMPTZ DEFAULT NOW(),
    mention_count INTEGER DEFAULT 1,
    mentions_by_session JSONB DEFAULT '[]',
    
    -- Evolution
    context_history JSONB DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    merged_into_id UUID REFERENCES user_entity_graph(id),
    
    -- Vector for similarity (using pgvector if available)
    -- embedding vector(768),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(product_user_id, entity_name_normalized, entity_type)
);

CREATE INDEX IF NOT EXISTS idx_entities_user ON user_entity_graph(product_user_id, relationship_strength DESC);
CREATE INDEX IF NOT EXISTS idx_entities_type ON user_entity_graph(product_user_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_name ON user_entity_graph(product_user_id, entity_name_normalized);

-- ============================================================================
-- LAYER 5: MEMORY FACTS - Extracted Knowledge
-- ============================================================================
CREATE TABLE IF NOT EXISTS memory_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_user_id UUID REFERENCES product_users(id) ON DELETE CASCADE,
    
    -- Source Tracking
    source_session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    source_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    extraction_method VARCHAR(50),
    
    -- Fact Classification
    fact_category VARCHAR(50) NOT NULL,
    fact_subcategory VARCHAR(50),
    
    -- Fact Content
    fact_key VARCHAR(300),
    fact_subject VARCHAR(200),
    fact_predicate VARCHAR(200),
    fact_object TEXT NOT NULL,
    fact_full_text TEXT,
    
    -- Context & Confidence
    extraction_context TEXT,
    confidence FLOAT DEFAULT 0.8,
    confidence_reason TEXT,
    
    -- Temporal Awareness
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_temporal BOOLEAN DEFAULT false,
    temporal_context VARCHAR(100),
    
    -- Importance & Usage
    importance_score FLOAT DEFAULT 0.5,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    last_reinforced_at TIMESTAMPTZ DEFAULT NOW(),
    reinforcement_count INTEGER DEFAULT 1,
    
    -- Contradiction Handling
    is_active BOOLEAN DEFAULT true,
    superseded_by_id UUID REFERENCES memory_facts(id),
    supersession_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facts_user ON memory_facts(product_user_id, is_active, importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_facts_category ON memory_facts(product_user_id, fact_category);
CREATE INDEX IF NOT EXISTS idx_facts_subject ON memory_facts(product_user_id, fact_subject);
CREATE INDEX IF NOT EXISTS idx_facts_temporal ON memory_facts(product_user_id, valid_from, valid_until);

-- ============================================================================
-- LAYER 7: PROACTIVE INSIGHTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS proactive_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_user_id UUID REFERENCES product_users(id) ON DELETE CASCADE,
    
    -- Insight Classification
    insight_type VARCHAR(50) NOT NULL,
    insight_category VARCHAR(50),
    
    -- Insight Content
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    relevance_explanation TEXT,
    
    -- Connection to User Knowledge
    related_topics JSONB DEFAULT '[]',
    related_entities JSONB DEFAULT '[]',
    related_sessions JSONB DEFAULT '[]',
    related_facts JSONB DEFAULT '[]',
    
    -- Trigger Conditions
    trigger_type VARCHAR(50),
    trigger_condition JSONB,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Delivery
    priority VARCHAR(20) DEFAULT 'normal',
    should_show_at TIMESTAMPTZ,
    show_context VARCHAR(50),
    
    -- User Interaction
    was_shown BOOLEAN DEFAULT false,
    shown_at TIMESTAMPTZ,
    was_dismissed BOOLEAN DEFAULT false,
    was_helpful BOOLEAN,
    was_acted_upon BOOLEAN,
    
    -- Lifecycle
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insights_user ON proactive_insights(product_user_id, is_active, priority);
CREATE INDEX IF NOT EXISTS idx_insights_pending ON proactive_insights(product_user_id, was_shown, should_show_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cognitive_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_entity_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_insights ENABLE ROW LEVEL SECURITY;

-- RLS for chat_sessions (drop existing policies first)
DROP POLICY IF EXISTS "Users can view own sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;

CREATE POLICY "Users can view own sessions" ON chat_sessions
    FOR SELECT USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own sessions" ON chat_sessions
    FOR INSERT WITH CHECK (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own sessions" ON chat_sessions
    FOR UPDATE USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

-- RLS for chat_messages (drop existing policies first)
DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;

CREATE POLICY "Users can view own messages" ON chat_messages
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM chat_sessions WHERE product_user_id IN (
                SELECT id FROM product_users WHERE user_id = auth.uid()
            )
        )
        OR 
        chat_session_id IN (
            SELECT id FROM chat_sessions WHERE product_user_id IN (
                SELECT id FROM product_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert own messages" ON chat_messages
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM chat_sessions WHERE product_user_id IN (
                SELECT id FROM product_users WHERE user_id = auth.uid()
            )
        )
        OR 
        chat_session_id IN (
            SELECT id FROM chat_sessions WHERE product_user_id IN (
                SELECT id FROM product_users WHERE user_id = auth.uid()
            )
        )
    );


-- RLS for user_cognitive_profile
CREATE POLICY "Users can view own profile" ON user_cognitive_profile
    FOR SELECT USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own profile" ON user_cognitive_profile
    FOR UPDATE USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

-- RLS for user_entity_graph
CREATE POLICY "Users can view own entities" ON user_entity_graph
    FOR SELECT USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own entities" ON user_entity_graph
    FOR ALL USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

-- RLS for memory_facts
CREATE POLICY "Users can view own facts" ON memory_facts
    FOR SELECT USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own facts" ON memory_facts
    FOR ALL USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

-- RLS for proactive_insights
CREATE POLICY "Users can view own insights" ON proactive_insights
    FOR SELECT USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own insights" ON proactive_insights
    FOR ALL USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_cognitive_profile_updated_at ON user_cognitive_profile;
CREATE TRIGGER update_user_cognitive_profile_updated_at
    BEFORE UPDATE ON user_cognitive_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_entity_graph_updated_at ON user_entity_graph;
CREATE TRIGGER update_user_entity_graph_updated_at
    BEFORE UPDATE ON user_entity_graph
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memory_facts_updated_at ON memory_facts;
CREATE TRIGGER update_memory_facts_updated_at
    BEFORE UPDATE ON memory_facts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DONE!
-- ============================================================================
