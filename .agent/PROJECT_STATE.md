# Karr AI - Current Project State

> **Last Updated:** 2026-02-04 21:30 IST
> **Purpose:** Quick reference for AI assistants to continue development across sessions.

---

## 🚀 Quick Start for New Session

**To continue development, say:**
> "Read `.agent/KARR_AI_SPECIFICATION.md` for the full specification, and `.agent/PROJECT_STATE.md` for current progress. Then continue from where we left off."

---

## 📁 Project Location

```
d:\Tohund Guide\Tohund Guide\Softwares\KarrAi.Global\
```

---

## ✅ What's Been Built (Phase 1 Progress)

### Infrastructure ✅
- [x] Monorepo structure with pnpm workspaces
- [x] Next.js 14 App Router (apps/web)
- [x] Supabase project configured with all tables
- [x] Environment variables set

### Admin Dashboard ✅
- [x] Admin layout with **Claude.ai-inspired UI**
- [x] Navigation (Dashboard, Products, Knowledge Base, Users, Analytics, Audit, Settings)

### Knowledge Base System ✅
- [x] Knowledge Bases Table (Reusable KBs)
- [x] Upload API & Multi-file upload (PDF, DOCX, TXT)
- [x] Document chunking & Vector embeddings (Gemini)

### User Dashboard (Product Level) ✅
- [x] **Redesigned UI:** Full Claude.ai-inspired clean aesthetic (Cream/Sand/Terracotta)
- [x] Product Landing Page (`/p/[slug]`)
- [x] Product Sign-In/Sign-Up (`/p/[slug]/signin`)
- [x] User Dashboard (`/p/[slug]/dashboard`)
- [x] Knowledge Library Tab
- [x] "Knowledge Gap Intelligence" for user uploads

### OmniForge AI Factory ✅ (ALL PHASES COMPLETE)
**Phase 1: Contextual Foundation (COMPLETED)**
- [x] **Schema Migration (015):** Added `contextual_summary` and `structured_metadata` columns
- [x] **Contextual Ingestion:** `contextual-summarizer.ts` integrated into `document-processor.ts` (LLM summaries)
- [x] **Hybrid Search:** `omniforge_hybrid_search` RPC function with **RRF Fusion** (BM25 + Vector)
- [x] **Federated Search Update:** Updated `federated-search.ts` to use new RRF search with fallback

**Phase 2: Corrective RAG (CRAG) (COMPLETED)**
- [x] **CRAG Evaluator:** `crag-evaluator.ts` implements relevance scoring (RELEVANT, AMBIGUOUS, IRRELEVANT)
- [x] **Corrective Actions:** Routing logic for Web Fallback vs. Direct Answer vs. "I Don't Know"
- [x] **Chat Integration:** Updated `api/chat/route.ts` to use CRAG evaluation and confidence scoring
- [x] **Graceful Fallbacks:** System now clearly states when it lacks confidence

**Phase 3: Reasoning Experience (COMPLETED)**
- [x] **Thinking UI Component:** `ThinkingProcess.tsx` - Premium 4-stage visualization (Searching → Evaluating → Correcting → Generating)
- [x] **useThinkingState Hook:** State machine to drive the UI through reasoning stages
- [x] **Dashboard Integration:** User dashboard now shows real-time thinking process
- [x] **Reasoning Metadata:** Both chat APIs return CRAG verdict, confidence, and correction info

---

## 🔧 Current Configuration

### AI Provider: **Google Gemini (FREE!)**
- Embeddings: `text-embedding-004`
- Chat: `gemini-2.0-flash`
- **Web Search:** Karr AI Smart Scraper (FREE) + CRAG Evaluator for verification

### OmniForge Architecture
- **Document Processor:** Chunks + Embeddings + Contextual Summaries
- **Search:** Internal (Vector+BM25+RRF) + Web (Scraper) -> CRAG Evaluator -> Thinking UI -> Answer

### Environment Variables
```
GOOGLE_AI_API_KEY=<configured>
# All search/scraping is handled internally, no extra keys needed.
```

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `supabase/migrations/015_omniforge...sql` | Phase 1 DB Migration (RRF Search) |
| `apps/web/src/lib/knowledge/contextual-summarizer.ts` | Phase 1 LLM Context Generator |
| `apps/web/src/lib/knowledge/crag-evaluator.ts` | Phase 2 CRAG Scorer & Router |
| `apps/web/src/components/chat/ThinkingProcess.tsx` | **Phase 3 Thinking UI Component** |
| `apps/web/src/app/api/chat/route.ts` | Chat API with CRAG & Reasoning Metadata |
| `apps/web/src/app/api/chat/user/route.ts` | User Chat API with Reasoning Metadata |
| `apps/web/src/lib/knowledge/federated-search.ts` | Hybrid Search Logic |

---

### Cognitive Digital Twin System 🧠 (PHASE 3 COMPLETE!)
**Status:** ✅ Phase 1, 2 & 3 Complete | 🎉 Revolutionary AI Personalization LIVE!
**Goal:** Transform chat history into an active, learning, intelligent memory system.

**Phase 1: Foundation (COMPLETED ✅)**
- [x] **Database Schema:** `chat_sessions`, `chat_messages` tables active & fixed
- [x] **Session Persistence:** Chats auto-save to DB with correct metadata
- [x] **AI Title Generation:** Auto-generates titles + emojis after 3 messages
- [x] **Session Sidebar:** Real-time session list with search/filter
- [x] **URL State:** Session ID persists in URL (`?session=...`) for reload safety

**Phase 2: Intelligence Extraction (COMPLETED ✅) - REVOLUTIONARY!**
- [x] **Learning Orchestrator:** `learning-orchestrator.ts` - The brain of the system
- [x] **Entity Extraction:** Automatically identifies People, Companies, Places from chat
- [x] **Topic Analysis:** Categorizes sessions and extracts topics
- [x] **Sentiment Tracking:** Detects user frustration/satisfaction/emotion journey
- [x] **User Profile Building:** Extracts expertise levels, goals, challenges, preferences
- [x] **Entity Graph:** `user_entity_graph` table populated with relationships
- [x] **Memory Facts:** `memory_facts` table stores extracted knowledge
- [x] **Proactive Insights:** `proactive_insights` table generates smart reminders
- [x] **Background Processing:** Non-blocking learning after each chat (fire-and-forget)
- [x] **Chat API Integration:** Automatic trigger in `/api/chat/user/route.ts`

### Phase 3: Adaptive Intelligence (Cognitive Digital Twin) - **COMPLETED**
> **Goal:** Create a highly personalized AI that adapts to user expertise, emotional state, and learning velocity.

#### ✅ Completed Features
- **Cognitive Profile Engine:**
  - Tracks user profession, industry, and goals.
  - Monitors expertise levels and learning velocity.
  - Captures communication preferences.
- **Adaptive Intelligence System:**
  - `adaptive-intelligence.ts`: Core logic for context fusion.
  - **Emotional Intelligence:** Detects frustration, urgency, confusion.
  - **Temporal Awareness:** Adapts to time of day.
- **Proactive Intelligence (The "Revolutionary" Engine):**
  - **`ProactiveInsightsEngine`**: Generates 9 distinct types of caring insights (Curiosity, Deadlines, Milestones, etc.).
  - **Context-Aware Storage**: Smartly filters and prioritizes insights based on user state.
  - **Guaranteed Value**: Ensures every interaction provides at least one meaningful "nudge".

#### 📂 Key Files & Architecture
| File | Purpose |
|------|---------|
| `apps/web/src/lib/cognitive/proactive-insights-engine.ts` | **🧠 CORE**: The "AI That Cares" logic |
| `apps/web/src/lib/cognitive/learning-orchestrator.ts` | **Orchestrator**: Manages when the engine runs |
| `apps/web/src/lib/cognitive/adaptive-intelligence.ts` | **Adapter**: Tunes responses based on profile |
| `apps/web/src/lib/cognitive/profile-builder.ts` | **Builder**: Updates the user's cognitive graph |
| `apps/web/src/components/cognitive/ProactiveInsights.tsx` | **UI**: Visual presentation of insights |

#### 🚀 Next Steps
1. **Phase 4: Autonomous Operations (KarrPulse):**
   - Create cron jobs to run `ProactiveInsightsEngine` daily.
   - Integrate with **WhatsApp/SMS** for multi-channel delivery.
2. **Payment Integration:**
   - Implement Razorpay for "Pro" tiers (required for advanced insights).

---

### Phase 5: Neural Relational Memory 🧠 (NEW - REVOLUTIONARY!)
> **Goal:** Build the world's first context-aware personal knowledge graph that THINKS about relationships.

**Status:** ✅ IMPLEMENTED | 🚀 The Most Advanced Entity Graph on the Market!

#### What Makes It Revolutionary (vs ChatGPT, Notion AI, Microsoft Graph):

| Feature | ChatGPT | Notion AI | MS Graph | **Karr AI NRM** |
|---------|---------|-----------|----------|-----------------|
| Entity Tracking | Basic facts | Contact fields | Org chart | **Auto-extracted + Rich context** |
| Relationships | ❌ None | Manual links | Org chart only | **Inferred + Evolved + Predicted** |
| Temporal | ❌ Static | ❌ Static | File timestamps | **Continuous time-travel** |
| Inference | ❌ None | ❌ None | Co-worker suggestions | **Multi-hop + Link prediction** |
| Proactive | ❌ Reactive | Basic reminders | Meeting insights | **"Thinks about you" daily** |

#### ✅ Implemented Features

**Layer 1: Enhanced Entity Core**
- Rich entity types: Person, Organization, Place, Concept, Project, Document, Event
- Canonical names + aliases for deduplication
- Importance scoring with decay over time
- Entity embeddings for semantic similarity

**Layer 2: Relationship Intelligence**
- 7 relationship categories: Professional, Personal, Transactional, Knowledge, Temporal, Inference, Emotional
- Automatic relationship inference from context
- Strength scoring that evolves with mentions
- Bidirectional relationship support

**Layer 3: Temporal Evolution Engine**
- Full timeline tracking for entities
- Point-in-time snapshots for "time travel" queries
- Valid-from/valid-until for relationships
- Historical context preservation

**Layer 4: Multi-hop Reasoning Engine**
- BFS-based pathfinding between entities
- Cached reasoning paths for performance
- Path strength calculation
- Natural language path summaries

**Layer 5: Predictive Intelligence**
- Relationship decay prediction (30-day inactivity warning)
- Connection opportunity detection (co-occurrence analysis)
- Automatic prediction storage with expiry

**Layer 6: Co-occurrence Tracking**
- Tracks which entities are mentioned together
- Proximity scoring for relationship inference
- Sample context preservation

**Layer 7: Entity Clustering**
- LLM-powered automatic cluster generation
- Work context, project, family, topic groupings
- Centroid entity identification

#### 📂 Key Files

| File | Purpose |
|------|---------|
| `supabase/migrations/016_neural_relational_memory.sql` | **Database Schema**: 8 new tables + helper functions |
| `apps/web/src/lib/cognitive/neural-relational-memory.ts` | **🧠 CORE ENGINE**: 1200+ lines of NRM logic |
| `apps/web/src/lib/gemini.ts` | **Embeddings**: Added `generateEmbedding()` for vectors |
| `apps/web/src/lib/cognitive/learning-orchestrator.ts` | **Integration**: NRM processing on every chat |

**Phase 5.1: Knowledge Graph Visualization (COMPLETED ✅)**
- [x] `/api/cognitive/entities` - Entity listing API with filters
- [x] `/api/cognitive/graph` - Full network data API
- [x] `EntityKnowledgeGraph.tsx` - Interactive 2D force graph visualization
- [x] `KnowledgeGraphDashboard.tsx` - Full dashboard with list/graph views
- [x] Dashboard integration - New "Knowledge Graph" tab

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/cognitive/learning-orchestrator.ts` | **🧠 THE BRAIN**: Revolutionary learning orchestrator |
| `apps/web/src/lib/cognitive/neural-relational-memory.ts` | **🌐 NRM ENGINE**: Entity extraction/inference |
| `apps/web/src/lib/cognitive/intelligence-extractor.ts` | Extracts entities, topics, sentiment, expertise |
| `apps/web/src/lib/cognitive/profile-builder.ts` | Updates user cognitive profile |
| `apps/web/src/lib/cognitive/context-fusion.ts` | Combines all memory for personalized context |
| `apps/web/src/lib/cognitive/adaptive-intelligence.ts` | **⚡ PHASE 3**: Emotional/Expertise/Temporal adaptation |
| `apps/web/src/lib/cognitive/session-manager.ts` | Handles session CRUD, message saving |
| `apps/web/src/components/cognitive/ProactiveInsights.tsx` | **🎨 PHASE 3**: Beautiful insights widget |
| `apps/web/src/components/cognitive/EntityKnowledgeGraph.tsx` | **🌐 GRAPH VIZ**: Interactive knowledge graph |
| `apps/web/src/components/cognitive/KnowledgeGraphDashboard.tsx` | **📊 DASHBOARD**: Full entity management UI |
| `apps/web/src/components/cognitive/CognitiveProfileDashboard.tsx` | **🧠 DIGITAL TWIN UI**: User profile viewer |
| `apps/web/src/app/api/cognitive/entities/route.ts` | Entity listing API |
| `apps/web/src/app/api/cognitive/graph/route.ts` | Graph data API |
| `apps/web/src/app/api/cognitive/profile/route.ts` | **User cognitive profile API** |
| `apps/web/src/app/api/cognitive/insights/route.ts` | Insights API endpoint |
| `apps/web/src/app/api/cognitive/learn/route.ts` | Learning API endpoint |
| `apps/web/src/app/api/chat/user/route.ts` | Chat API with adaptive intelligence + background learning |
| `apps/web/src/app/p/[slug]/dashboard/page.tsx` | Main Dashboard with chat UI + Knowledge Graph |

---

**Phase 5.5: UI Polish & Stability (COMPLETED ✅)**
- [x] **Dynamic Importance Scoring:** Fixed entity importance to use logarithmic mention decay (`0.3 + log(mentions)`)
- [x] **Chat Title Generation:** Optimized to trigger after 2 messages for faster titles
- [x] **App Shell Layout:** Fixed viewport layout (`h-screen overflow-hidden`) for native-app feel on Dashboard
- [x] **Proactive Insights:** Enhanced engine with Guaranteed Delivery (Entity Rotation) & fixed filtering logic
- [x] **Knowledge Graph UI:** Fixed icon case-sensitivity and legend display; added "Product" icon support
- [x] **Scrollable Areas:** Fixed sidebar and chat list scrolling issues

**Phase 6: Cognitive Profile Dashboard (COMPLETED ✅) - NEW!**
> **Goal:** Surface the "Digital Twin" to users - show them everything the AI has learned about them.

- [x] **CognitiveProfileDashboard Component:** Beautiful 5-tab dashboard with:
  - **Overview Tab:** Persona summary, communication style, activity stats
  - **Expertise Tab:** Skill levels with progress bars, knowledge gaps, domains
  - **Entities Tab:** People, companies, concepts the AI remembers
  - **Memory Tab:** Stored facts with confidence scores and categories
  - **Goals Tab:** Active goals, completed goals, recurring challenges
- [x] **Profile API:** `/api/cognitive/profile` returns full cognitive snapshot
- [x] **Dashboard Integration:** New "My Profile" navigation tab in sidebar
- [x] **Premium UI:** Tabs, animated progress bars, glassmorphic cards

**Phase 6.1: Interactive Profile Management (COMPLETED ✅) - NEW!**
> **Goal:** Give users full control over their cognitive data.

- [x] **Edit Profile:** Edit profession & industry with inline input fields
- [x] **Delete Facts:** Remove individual memory facts (soft delete)
- [x] **Delete Entities:** Remove tracked entities from knowledge graph
- [x] **Export Data:** Download complete cognitive profile as JSON
- [x] **Goal Management:**
  - Add new goals manually
  - Mark goals as complete
  - Goals auto-move to completed section

**New API Endpoints:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cognitive/profile/update` | PATCH | Update profile fields, add/complete goals |
| `/api/cognitive/facts` | DELETE | Soft-delete a memory fact |
| `/api/cognitive/entities/[id]` | DELETE | Remove an entity |
| `/api/cognitive/export` | GET | Export all cognitive data as JSON |

**Key Files:**
| `apps/web/src/components/cognitive/CognitiveProfileDashboard.tsx` | **🧠 DIGITAL TWIN UI**: Shows users what AI knows about them |

**Phase 6.2: Neural Relational Memory v2 (COMPLETED ✅) - NEW!**
> **Goal:** Expose advanced AI-powered relationship intelligence to users.

- [x] **Predictions Engine:** Anticipates relationship changes, connection opportunities
- [x] **Entity Clusters:** Auto-groups related people/companies/concepts
- [x] **Decaying Relationships:** Alerts when connections need attention
- [x] **Connection Opportunities:** Suggests potential introductions based on common connections
- [x] **Multi-hop Reasoning:** Finds paths between entities in knowledge graph
- [x] **Similar Entities:** Semantic similarity search using embeddings

**New API Endpoints:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cognitive/nrm?feature=all` | GET | Get all NRM insights at once |
| `/api/cognitive/nrm?feature=predictions` | GET | Get relationship predictions |
| `/api/cognitive/nrm?feature=clusters` | GET | Get entity clusters |
| `/api/cognitive/nrm?feature=decaying` | GET | Get decaying relationships |
| `/api/cognitive/nrm?feature=opportunities` | GET | Get connection opportunities |
| `/api/cognitive/nrm/path` | GET | Find path between two entities |
| `/api/cognitive/nrm/similar` | GET | Find semantically similar entities |

**Key Files:**
| File | Purpose |
|------|---------|
| `apps/web/src/components/cognitive/NRMInsights.tsx` | **🧠 NEURAL INSIGHTS UI**: Predictions, clusters, opportunities |
| `apps/web/src/app/api/cognitive/nrm/route.ts` | Main NRM API endpoint |
| `apps/web/src/lib/cognitive/neural-relational-memory.ts` | Core NRM engine (1200+ lines) |

---

## 🎯 Next Steps (Priorities)
1. [x] ~~**Phase 2 - Intelligence Extraction:** COMPLETED!~~
2. [x] ~~**Phase 3 - Context Fusion:** COMPLETED! Adaptive personalization active~~
3. [x] ~~**Phase 5 - Neural Relational Memory:** COMPLETED! Entity Knowledge Graph~~
4. [x] ~~**Knowledge Graph Visualization:** COMPLETED! Interactive graph UI~~
5. [x] ~~**Test the System:** Chat and see entities appear in the Knowledge Graph~~
6. [ ] **Razorpay Integration:** Complete billing & subscription flow
7. [ ] **Phase 4 - KarrPulse Autonomous Operations:** Cron jobs + WhatsApp/SMS

---

