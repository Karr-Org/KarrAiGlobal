-- ============================================================================
-- KARR AI - NEURAL RELATIONAL MEMORY (NRM)
-- Version: 1.0
-- The World's First Context-Aware Personal Knowledge Graph
-- ============================================================================

-- ============================================================================
-- LAYER 1: ENHANCED ENTITY CORE
-- Beyond simple entity storage - rich context, temporal awareness, embeddings
-- ============================================================================

-- Add new columns to existing user_entity_graph table
ALTER TABLE user_entity_graph ADD COLUMN IF NOT EXISTS entity_aliases JSONB DEFAULT '[]';
ALTER TABLE user_entity_graph ADD COLUMN IF NOT EXISTS canonical_name VARCHAR(200);
ALTER TABLE user_entity_graph ADD COLUMN IF NOT EXISTS importance_score FLOAT DEFAULT 0.5;
ALTER TABLE user_entity_graph ADD COLUMN IF NOT EXISTS decay_rate FLOAT DEFAULT 0.01;
ALTER TABLE user_entity_graph ADD COLUMN IF NOT EXISTS last_decay_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_entity_graph ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE user_entity_graph ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE user_entity_graph ADD COLUMN IF NOT EXISTS source_urls JSONB DEFAULT '[]';
ALTER TABLE user_entity_graph ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE user_entity_graph ADD COLUMN IF NOT EXISTS verification_source TEXT;
ALTER TABLE user_entity_graph ADD COLUMN IF NOT EXISTS predicted_attributes JSONB DEFAULT '{}';
ALTER TABLE user_entity_graph ADD COLUMN IF NOT EXISTS contradiction_flags JSONB DEFAULT '[]';

-- Create specialized entity subtypes table for rich typing
CREATE TABLE IF NOT EXISTS entity_subtypes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES user_entity_graph(id) ON DELETE CASCADE,
    subtype VARCHAR(100) NOT NULL,
    confidence FLOAT DEFAULT 1.0,
    inferred_from TEXT,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entity_subtypes ON entity_subtypes(entity_id, valid_until);

-- ============================================================================
-- LAYER 2: RELATIONSHIP INTELLIGENCE
-- Explicit + Inferred relationships with confidence scoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS entity_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_user_id UUID REFERENCES product_users(id) ON DELETE CASCADE,
    
    -- Source and Target Entities
    source_entity_id UUID REFERENCES user_entity_graph(id) ON DELETE CASCADE,
    target_entity_id UUID REFERENCES user_entity_graph(id) ON DELETE CASCADE,
    
    -- Relationship Type (hierarchical)
    relationship_category VARCHAR(50) NOT NULL, -- professional, personal, transactional, knowledge, temporal, inference
    relationship_type VARCHAR(100) NOT NULL,    -- works_at, client_of, expert_in, etc.
    relationship_label TEXT,                    -- Human-readable label
    
    -- Direction and Strength
    is_bidirectional BOOLEAN DEFAULT false,
    strength FLOAT DEFAULT 0.5,                 -- 0.0 to 1.0
    sentiment VARCHAR(20) DEFAULT 'neutral',    -- positive, neutral, negative
    
    -- Confidence and Source
    confidence FLOAT DEFAULT 0.8,
    inference_method VARCHAR(50),               -- explicit, co-occurrence, llm_inference, user_confirmed
    source_session_id UUID REFERENCES chat_sessions(id),
    source_context TEXT,
    
    -- Temporal Awareness
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,                    -- NULL = currently valid
    is_temporal BOOLEAN DEFAULT false,
    temporal_context VARCHAR(100),              -- "during project X", "when at company Y"
    
    -- Evolution Tracking
    previous_version_id UUID REFERENCES entity_relationships(id),
    evolution_reason TEXT,
    
    -- Interaction Metrics
    mention_count INTEGER DEFAULT 1,
    last_mentioned_at TIMESTAMPTZ DEFAULT NOW(),
    context_examples JSONB DEFAULT '[]',        -- Example sentences where relationship was mentioned
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate relationships in same time period
    UNIQUE(product_user_id, source_entity_id, target_entity_id, relationship_type, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_rel_source ON entity_relationships(source_entity_id, relationship_category);
CREATE INDEX IF NOT EXISTS idx_rel_target ON entity_relationships(target_entity_id, relationship_category);
CREATE INDEX IF NOT EXISTS idx_rel_user ON entity_relationships(product_user_id, valid_until);
CREATE INDEX IF NOT EXISTS idx_rel_temporal ON entity_relationships(product_user_id, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_rel_type ON entity_relationships(relationship_type, strength DESC);

-- ============================================================================
-- LAYER 3: TEMPORAL EVOLUTION ENGINE
-- Track how entities and relationships change over time
-- ============================================================================

CREATE TABLE IF NOT EXISTS entity_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES user_entity_graph(id) ON DELETE CASCADE,
    
    -- Timeline Event
    event_type VARCHAR(50) NOT NULL,            -- created, updated, relationship_added, 
                                                 -- attribute_changed, merged, archived
    event_description TEXT,
    
    -- Changes Made
    changes JSONB NOT NULL,                     -- {"field": "relationship", "old": "...", "new": "..."}
    
    -- Context
    triggered_by VARCHAR(50),                   -- chat_session, system_inference, user_action, decay
    source_session_id UUID REFERENCES chat_sessions(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_entity ON entity_timeline(entity_id, created_at DESC);

-- Entity Snapshots - Point-in-time views for "time travel" queries
CREATE TABLE IF NOT EXISTS entity_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES user_entity_graph(id) ON DELETE CASCADE,
    snapshot_at TIMESTAMPTZ NOT NULL,
    snapshot_data JSONB NOT NULL,               -- Full entity state at that time
    relationship_count INTEGER DEFAULT 0,
    importance_score_at_time FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshot_lookup ON entity_snapshots(entity_id, snapshot_at DESC);

-- ============================================================================
-- LAYER 4: MULTI-HOP REASONING CACHE
-- Pre-computed paths for fast inference queries
-- ============================================================================

CREATE TABLE IF NOT EXISTS reasoning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_user_id UUID REFERENCES product_users(id) ON DELETE CASCADE,
    
    -- Path Definition
    source_entity_id UUID REFERENCES user_entity_graph(id) ON DELETE CASCADE,
    target_entity_id UUID REFERENCES user_entity_graph(id) ON DELETE CASCADE,
    hop_count INTEGER NOT NULL,
    path_entities JSONB NOT NULL,               -- Array of entity IDs in path
    path_relationships JSONB NOT NULL,          -- Array of relationship types
    
    -- Path Metrics
    path_strength FLOAT NOT NULL,               -- Composite strength score
    shortest_path BOOLEAN DEFAULT false,
    
    -- Semantic Meaning
    path_summary TEXT,                          -- "User knows A who works with B who invested in C"
    
    -- Validity
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,                    -- Paths expire when entities change
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paths_source ON reasoning_paths(source_entity_id, hop_count);
CREATE INDEX IF NOT EXISTS idx_paths_target ON reasoning_paths(target_entity_id, hop_count);
CREATE INDEX IF NOT EXISTS idx_paths_user ON reasoning_paths(product_user_id, valid_until);

-- ============================================================================
-- LAYER 5: PREDICTIVE INTELLIGENCE
-- Predictions about entities, relationships, and future events
-- ============================================================================

CREATE TABLE IF NOT EXISTS entity_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_user_id UUID REFERENCES product_users(id) ON DELETE CASCADE,
    
    -- Prediction Type
    prediction_type VARCHAR(50) NOT NULL,       -- relationship_decay, topic_interest, 
                                                 -- connection_opportunity, conflict_risk
    
    -- Subject of Prediction
    entity_id UUID REFERENCES user_entity_graph(id) ON DELETE CASCADE,
    target_entity_id UUID REFERENCES user_entity_graph(id) ON DELETE CASCADE, -- For relationship predictions
    
    -- Prediction Details
    prediction_value JSONB NOT NULL,            -- Flexible prediction data
    confidence FLOAT NOT NULL,
    reasoning TEXT,                             -- Why this prediction was made
    
    -- Time Horizons
    predicted_timeframe VARCHAR(50),            -- next_week, next_month, next_quarter
    predicted_date TIMESTAMPTZ,
    
    -- Validation
    was_correct BOOLEAN,                        -- Filled in when prediction is validated
    validated_at TIMESTAMPTZ,
    validation_context TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    acted_upon BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pred_user ON entity_predictions(product_user_id, is_active, prediction_type);
CREATE INDEX IF NOT EXISTS idx_pred_entity ON entity_predictions(entity_id, prediction_type);

-- ============================================================================
-- LAYER 6: ENTITY CO-OCCURRENCE MATRIX
-- Track which entities are mentioned together (for inference)
-- ============================================================================

CREATE TABLE IF NOT EXISTS entity_cooccurrence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_user_id UUID REFERENCES product_users(id) ON DELETE CASCADE,
    
    entity_a_id UUID REFERENCES user_entity_graph(id) ON DELETE CASCADE,
    entity_b_id UUID REFERENCES user_entity_graph(id) ON DELETE CASCADE,
    
    -- Co-occurrence Metrics
    cooccurrence_count INTEGER DEFAULT 1,
    same_message_count INTEGER DEFAULT 0,       -- Mentioned in exact same message
    same_session_count INTEGER DEFAULT 0,       -- Mentioned in same session
    proximity_score FLOAT DEFAULT 0.5,          -- How "close" they are mentioned
    
    -- Context
    sample_contexts JSONB DEFAULT '[]',         -- Example sentences with both entities
    common_topics JSONB DEFAULT '[]',           -- Topics where both appear
    
    -- Inferred Relationship
    inferred_relationship VARCHAR(100),
    inference_confidence FLOAT,
    
    first_cooccurrence_at TIMESTAMPTZ DEFAULT NOW(),
    last_cooccurrence_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure we don't have duplicate pairs
    UNIQUE(product_user_id, entity_a_id, entity_b_id)
);

CREATE INDEX IF NOT EXISTS idx_cooccur_entities ON entity_cooccurrence(entity_a_id, entity_b_id);
CREATE INDEX IF NOT EXISTS idx_cooccur_user ON entity_cooccurrence(product_user_id, cooccurrence_count DESC);

-- ============================================================================
-- LAYER 7: ENTITY CLUSTERS
-- Group related entities for contextual understanding
-- ============================================================================

CREATE TABLE IF NOT EXISTS entity_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_user_id UUID REFERENCES product_users(id) ON DELETE CASCADE,
    
    cluster_name VARCHAR(200) NOT NULL,
    cluster_type VARCHAR(50) NOT NULL,          -- work_context, project, family, friend_group, topic_area
    cluster_description TEXT,
    
    -- Auto-generated or user-defined
    is_auto_generated BOOLEAN DEFAULT true,
    generation_method VARCHAR(50),              -- community_detection, topic_clustering, llm_inference
    
    -- Cluster Metrics
    member_count INTEGER DEFAULT 0,
    cohesion_score FLOAT,                       -- How tightly connected are members
    centroid_entity_id UUID REFERENCES user_entity_graph(id), -- Most central entity
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entity_cluster_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID REFERENCES entity_clusters(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES user_entity_graph(id) ON DELETE CASCADE,
    
    role_in_cluster VARCHAR(50),                -- central, peripheral, bridge
    membership_score FLOAT DEFAULT 1.0,
    
    added_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(cluster_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_cluster_members ON entity_cluster_members(entity_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to decay entity importance over time
CREATE OR REPLACE FUNCTION decay_entity_importance()
RETURNS void AS $$
BEGIN
    UPDATE user_entity_graph
    SET 
        importance_score = GREATEST(0.1, importance_score * (1 - decay_rate * 
            EXTRACT(EPOCH FROM (NOW() - last_decay_at)) / 86400)), -- Daily decay
        last_decay_at = NOW()
    WHERE last_decay_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Function to boost entity importance when mentioned
CREATE OR REPLACE FUNCTION boost_entity_on_mention(
    p_entity_id UUID,
    p_boost_amount FLOAT DEFAULT 0.1
) RETURNS void AS $$
BEGIN
    UPDATE user_entity_graph
    SET 
        importance_score = LEAST(1.0, importance_score + p_boost_amount),
        mention_count = mention_count + 1,
        last_mentioned_at = NOW()
    WHERE id = p_entity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to find shortest path between entities
CREATE OR REPLACE FUNCTION find_entity_path(
    p_user_id UUID,
    p_source_entity_id UUID,
    p_target_entity_id UUID,
    p_max_hops INTEGER DEFAULT 4
) RETURNS TABLE(
    hop_number INTEGER,
    entity_id UUID,
    entity_name TEXT,
    relationship_type TEXT,
    path_strength FLOAT
) AS $$
-- Placeholder for path-finding algorithm
-- In production, would use recursive CTE or external graph processing
SELECT 
    0 as hop_number,
    p_source_entity_id as entity_id,
    'Source' as entity_name,
    'start' as relationship_type,
    1.0 as path_strength;
$$ LANGUAGE sql;

-- Function to merge duplicate entities
CREATE OR REPLACE FUNCTION merge_entities(
    p_primary_entity_id UUID,
    p_duplicate_entity_id UUID
) RETURNS void AS $$
BEGIN
    -- Update all relationships to point to primary entity
    UPDATE entity_relationships
    SET source_entity_id = p_primary_entity_id
    WHERE source_entity_id = p_duplicate_entity_id;
    
    UPDATE entity_relationships
    SET target_entity_id = p_primary_entity_id
    WHERE target_entity_id = p_duplicate_entity_id;
    
    -- Merge aliases
    UPDATE user_entity_graph
    SET entity_aliases = (
        SELECT jsonb_agg(DISTINCT alias)
        FROM (
            SELECT jsonb_array_elements_text(entity_aliases) as alias
            FROM user_entity_graph
            WHERE id IN (p_primary_entity_id, p_duplicate_entity_id)
        ) t
    )
    WHERE id = p_primary_entity_id;
    
    -- Mark duplicate as merged
    UPDATE user_entity_graph
    SET 
        merged_into_id = p_primary_entity_id,
        is_active = false
    WHERE id = p_duplicate_entity_id;
    
    -- Log the merge
    INSERT INTO entity_timeline (entity_id, event_type, event_description, changes, triggered_by)
    VALUES (
        p_primary_entity_id,
        'merged',
        'Entity merged with duplicate',
        jsonb_build_object('merged_entity_id', p_duplicate_entity_id),
        'system_inference'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE entity_subtypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reasoning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_cooccurrence ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_cluster_members ENABLE ROW LEVEL SECURITY;

-- Entity subtypes - inherit from parent entity
CREATE POLICY "Users can manage entity subtypes" ON entity_subtypes
    FOR ALL USING (
        entity_id IN (
            SELECT id FROM user_entity_graph WHERE product_user_id IN (
                SELECT id FROM product_users WHERE user_id = auth.uid()
            )
        )
    );

-- Entity relationships
CREATE POLICY "Users can view own relationships" ON entity_relationships
    FOR SELECT USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own relationships" ON entity_relationships
    FOR ALL USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

-- Entity timeline
CREATE POLICY "Users can view entity timeline" ON entity_timeline
    FOR SELECT USING (
        entity_id IN (
            SELECT id FROM user_entity_graph WHERE product_user_id IN (
                SELECT id FROM product_users WHERE user_id = auth.uid()
            )
        )
    );

-- Entity snapshots
CREATE POLICY "Users can view entity snapshots" ON entity_snapshots
    FOR SELECT USING (
        entity_id IN (
            SELECT id FROM user_entity_graph WHERE product_user_id IN (
                SELECT id FROM product_users WHERE user_id = auth.uid()
            )
        )
    );

-- Reasoning paths
CREATE POLICY "Users can view own paths" ON reasoning_paths
    FOR SELECT USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

-- Entity predictions
CREATE POLICY "Users can view own predictions" ON entity_predictions
    FOR SELECT USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own predictions" ON entity_predictions
    FOR ALL USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

-- Entity cooccurrence
CREATE POLICY "Users can view own cooccurrence" ON entity_cooccurrence
    FOR SELECT USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

-- Entity clusters
CREATE POLICY "Users can manage own clusters" ON entity_clusters
    FOR ALL USING (
        product_user_id IN (
            SELECT id FROM product_users WHERE user_id = auth.uid()
        )
    );

-- Cluster members
CREATE POLICY "Users can manage cluster members" ON entity_cluster_members
    FOR ALL USING (
        cluster_id IN (
            SELECT id FROM entity_clusters WHERE product_user_id IN (
                SELECT id FROM product_users WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER update_entity_relationships_updated_at
    BEFORE UPDATE ON entity_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entity_clusters_updated_at
    BEFORE UPDATE ON entity_clusters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DONE!
-- ============================================================================
