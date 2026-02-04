# 🧠 Cognitive Digital Twin - Integration Guide

## Step 1: Run the Database Migration

**IMPORTANT:** Run this FIRST in Supabase Dashboard → SQL Editor

1. Open your Supabase project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New query**
4. Open file: `.agent/cognitive_memory_standalone.sql`
5. Copy ALL contents and paste into SQL Editor
6. Click **RUN**

Expected result: "Success. No rows returned" - this is normal!

---

## Step 2: What Gets Installed

After running the migration, your database will have:

| Table | Purpose |
|-------|---------|
| `chat_sessions` (enhanced) | AI metadata, topics, entities, sentiment tracking |
| `chat_messages` (enhanced) | Reasoning data, CRAG verdict, sentiment per message |
| `user_cognitive_profile` | User's "Digital Twin" - persona, expertise, communication style |
| `user_entity_graph` | Knowledge graph of people, companies, concepts |
| `memory_facts` | AI-extracted facts with temporal awareness |
| `proactive_insights` | Anticipatory suggestions and reminders |

---

## Step 3: Backend Services (Already Created)

All these services are ready to use:

```typescript
import { cognitive } from '@/lib/cognitive';

// Session Management
await cognitive.createSessionManager().createSession(productUserId);
await cognitive.createSessionManager().addMessage(sessionId, 'user', 'Hello!');

// AI-Powered Extraction
await cognitive.createIntelligenceExtractor().generateAutoTitle(messages);
await cognitive.createIntelligenceExtractor().extractEntities(messages);

// Context Fusion for Personalization
await cognitive.createContextFusionEngine().buildFullContext(productUserId);

// Profile Building
await cognitive.createProfileBuilder().updateFromConversation(productUserId, sessionId);
```

---

## Step 4: API Endpoints (Already Created)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cognitive/sessions` | GET | List all sessions (paginated, searchable) |
| `/api/cognitive/sessions` | POST | Create new session |
| `/api/cognitive/sessions/[id]` | GET | Get session with messages |
| `/api/cognitive/sessions/[id]` | PATCH | Update session (star, pin, archive, extract intelligence) |
| `/api/cognitive/sessions/[id]` | DELETE | Delete session |
| `/api/cognitive/sessions/[id]/messages` | GET | Get messages for session |
| `/api/cognitive/sessions/[id]/messages` | POST | Add message (auto-generates title after 3 messages) |

---

## Step 5: Frontend Integration

### Option A: Use the React Hook (Recommended)

```tsx
import { useCognitiveSession } from '@/hooks/useCognitiveSession';

function ChatComponent() {
  const {
    session,
    messages,
    isLoading,
    addMessage,
    startNewSession,
  } = useCognitiveSession({ productUserId: 'xxx' });

  const handleSend = async (content: string) => {
    await addMessage('user', content);
    // Call your AI API...
    await addMessage('assistant', response);
  };
}
```

### Option B: Add the SessionSidebar Component

```tsx
import { SessionSidebar } from '@/components/chat/SessionSidebar';

function Layout() {
  return (
    <div className="flex">
      <SessionSidebar
        productUserId={productUser.id}
        currentSessionId={currentSession?.id}
        onSessionSelect={(session) => loadSession(session.id)}
        onNewChat={() => startNewSession()}
        brandColor={product.primary_color}
      />
      <main>
        {/* Your chat content */}
      </main>
    </div>
  );
}
```

---

## Step 6: What Happens Automatically

Once integrated, the system will:

1. **Auto-title sessions** after 3 messages (AI-generated)
2. **Extract entities** (people, companies, concepts) from conversations
3. **Track sentiment** throughout the conversation
4. **Build user profile** over time (expertise, communication style, goals)
5. **Enable search** across all conversations
6. **Create proactive insights** based on patterns

---

## Files Reference

| File | Path |
|------|------|
| Standalone SQL | `.agent/cognitive_memory_standalone.sql` |
| Architecture Doc | `.agent/COGNITIVE_MEMORY_ARCHITECTURE.md` |
| Session Manager | `apps/web/src/lib/cognitive/session-manager.ts` |
| Intelligence Extractor | `apps/web/src/lib/cognitive/intelligence-extractor.ts` |
| Context Fusion | `apps/web/src/lib/cognitive/context-fusion.ts` |
| Profile Builder | `apps/web/src/lib/cognitive/profile-builder.ts` |
| Sessions API | `apps/web/src/app/api/cognitive/sessions/route.ts` |
| Session Sidebar | `apps/web/src/components/chat/SessionSidebar.tsx` |
| React Hook | `apps/web/src/hooks/useCognitiveSession.ts` |

---

## Quick Test After Migration

Run in SQL Editor to verify tables exist:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_cognitive_profile', 'user_entity_graph', 'memory_facts', 'proactive_insights');
```

Should return 4 rows!
