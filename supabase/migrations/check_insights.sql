-- Check proactive insights
SELECT count(*) as total_insights FROM proactive_insights;

SELECT 
    title, 
    insight_type, 
    priority, 
    is_active, 
    was_shown, 
    created_at 
FROM proactive_insights 
ORDER BY created_at DESC 
LIMIT 10;

-- Check user entities count
SELECT count(*) as entity_count FROM user_entity_graph;
