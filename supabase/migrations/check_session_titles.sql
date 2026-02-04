-- Check existing sessions without titles
SELECT 
    id,
    title,
    title_emoji,
    created_at,
    (SELECT COUNT(*) FROM chat_messages WHERE session_id = chat_sessions.id) as message_count
FROM chat_sessions
WHERE title IS NULL OR title = '' OR title = 'New Conversation'
ORDER BY created_at DESC
LIMIT 20;

-- For sessions with messages, we can manually set a title based on the first user message
-- This is a diagnostic query - actual title regeneration requires running the learning orchestrator
