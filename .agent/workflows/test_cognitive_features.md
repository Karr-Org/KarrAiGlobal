---
description: Test procedure for Cognitive Digital Twin features (Phase 3)
---

# Cognitive Digital Twin Testing Guide

This workflow validates the core components of the Phase 3 Cognitive Digital Twin system.

## 1. Prerequisites

- [x] Database migrations applied (including `20260203_cognitive_memory_system.sql`)
- [ ] Server running (`npm run dev`)
- [ ] User authenticated in the app

## 2. Testing Steps

### A. Memory Formation (Chat Session)

1. Start a new chat session.
2. Introduce yourself and mention a specific fact (e.g., "My name is [Name] and I work in [Industry]").
3. Verify `chat_sessions` table has a new entry.
4. Verify `user_cognitive_profile` is created/updated for your user.

### B. Entity Extraction

1. Mention a company or specific entity (e.g., "I use Notion for project management").
2. Check `user_entity_graph` table for "Notion" entry.
3. Verify `entity_type` is correctly classified (e.g., "App" or "Tool").

### C. Fact Retrieval

1. Start a *new* chat session.
2. Ask "What do you know about me?".
3. Verify the agent recalls the name/industry mentioned in step A.
4. Verify `memory_facts` table contains the extracted facts.

### D. Proactive Insights (Mock Test)

1. Manually insert a proactive insight via SQL:

   ```sql
   INSERT INTO proactive_insights (product_user_id, insight_type, title, description)
   VALUES ('[USER_ID]', 'suggestion', 'Test Insight', 'This is a test proactive insight.');
   ```

2. Verify the UI displays a notification or insight card.

## 3. Troubleshooting

- If facts aren't saved, check `supabase/functions/memory_processor` logs.
- If retrieval fails, check RLS policies on `memory_facts`.
