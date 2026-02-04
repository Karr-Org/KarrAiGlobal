-- Update existing entities with dynamic importance scores
-- Importance = 0.3 + (log10(mention_count + 1) * 0.3), capped at 0.95

UPDATE user_entity_graph
SET relationship_strength = LEAST(0.95, 0.3 + (LOG(mention_count + 1) * 0.3))
WHERE relationship_strength = 0.5 OR relationship_strength IS NULL;

-- Show updated entities
SELECT 
    entity_name,
    entity_type,
    mention_count,
    relationship_strength,
    ROUND((relationship_strength * 100)::numeric, 0) as importance_percent
FROM user_entity_graph
WHERE is_active = true
ORDER BY relationship_strength DESC, mention_count DESC
LIMIT 20;
