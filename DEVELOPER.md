# MakeMyAI — Developer Guide

> **Platform:** AI Factory — Build, deploy, and manage custom AI assistants  
> **Live:** [makemyai.app](https://makemyai.app) | Products: [indiangstai.com](https://indiangstai.com)  
> **Stack:** Next.js 14 (App Router) · Supabase · Gemini API · pnpm monorepo

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Architecture Overview](#architecture-overview)
4. [Core Modules](#core-modules)
5. [API Routes Reference](#api-routes-reference)
6. [Database Schema](#database-schema)
7. [Environment Variables](#environment-variables)
8. [Development Workflow](#development-workflow)
9. [Deployment](#deployment)

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Karr-Org/KarrAiGlobal.git
cd KarrAiGlobal

# 2. Install dependencies (requires pnpm 8+ and Node 20+)
pnpm install

# 3. Set up environment variables
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local with actual values (get from team lead)

# 4. Run the development server
pnpm dev:web

# App runs at http://localhost:3000
```

---

## Project Structure

```
KarrAiGlobal/
├── apps/
│   └── web/                          # Main Next.js 14 app (App Router)
│       └── src/
│           ├── app/                   # Pages & API routes
│           │   ├── api/               # Backend API (21 route groups)
│           │   ├── chat/              # Chat UI page
│           │   ├── gst-ai/            # GST AI product page
│           │   ├── creator/           # Creator dashboard
│           │   ├── admin/             # Admin panel
│           │   ├── p/[slug]/          # Product pages (dynamic)
│           │   ├── social/            # Social media management
│           │   └── marketing/         # Marketing tools
│           ├── components/            # React components
│           │   ├── chat/              # ChatInterface, message renderers
│           │   ├── cognitive/         # Digital twin UI components
│           │   ├── gamma/             # Presentation viewer
│           │   ├── marketing/         # Marketing campaign UI
│           │   └── social/            # Social media UI
│           ├── hooks/                 # React hooks
│           │   └── useCognitiveSession.ts
│           └── lib/                   # Core business logic
│               ├── okse/              # 🧠 OKSE AI Engine (main AI brain)
│               ├── cognitive/         # 🧬 Cognitive Digital Twin
│               ├── knowledge/         # 📚 Knowledge management
│               ├── social/            # 📱 Social media engine
│               ├── gamma/             # 🎨 Presentation generator
│               ├── marketing/         # 📢 Marketing engine
│               ├── payments/          # 💳 Payment processing
│               ├── auth/              # 🔐 Authentication helpers
│               └── gemini.ts          # Gemini API wrapper
│
├── packages/                          # Shared libraries
│   ├── ai/                            # AI model abstraction layer
│   │   └── src/
│   │       ├── adapters/              # Google, OpenAI, Anthropic adapters
│   │       ├── router.ts              # Model routing logic
│   │       └── types.ts               # AI type definitions
│   ├── database/                      # Database client & types
│   │   └── src/
│   │       └── client.ts              # Supabase client setup
│   └── rag/                           # RAG (Retrieval-Augmented Generation)
│       └── src/
│           ├── embeddings.ts          # Embedding generation
│           ├── chunking.ts            # Document chunking
│           ├── retrieval.ts           # Vector similarity search
│           └── context.ts             # Context window building
│
├── supabase/
│   ├── migrations/                    # 38 SQL migrations (run in order)
│   └── config.toml                    # Supabase project config
│
└── .env.example                       # Environment variable template
```

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                  │
│  Chat UI · Creator Dashboard · Admin · Marketing      │
└──────────────┬───────────────────────┬────────────────┘
               │                       │
    ┌──────────▼──────────┐  ┌────────▼─────────┐
    │  /api/chat/user     │  │  /api/v1/chat     │
    │  (Main Chat API)    │  │  (Widget/Embed)   │
    └──────────┬──────────┘  └────────┬──────────┘
               │                       │
    ┌──────────▼───────────────────────▼────────────────┐
    │              OKSE ENGINE (AI Brain)                │
    │  Query Router → Semantic Cache → Knowledge Fusion  │
    │  → CRAG Evaluator → Speculative Drafting           │
    │  → Live Web Search → Response Generation           │
    └──────────┬───────────────────────┬────────────────┘
               │                       │
    ┌──────────▼──────────┐  ┌────────▼─────────┐
    │  Supabase (DB)      │  │  Gemini API       │
    │  Knowledge Base     │  │  Embeddings       │
    │  User Data          │  │  Content Gen      │
    │  Sessions           │  │  Classification   │
    └─────────────────────┘  └──────────────────┘
```

---

## Core Modules

### 1. 🧠 OKSE Engine (`lib/okse/`)

**What:** The main AI processing pipeline. All AI chat queries flow through this.

| File | Purpose |
|------|---------|
| `engine.ts` | Main orchestrator — routes queries through the pipeline |
| `query-router.ts` | Classifies queries by complexity (SIMPLE → MULTI_HOP + CONVERSATIONAL) |
| `semantic-cache.ts` | Caches similar queries to avoid re-processing |
| `knowledge-fusion.ts` | Combines results from multiple knowledge sources |
| `speculative-drafting.ts` | Generates multiple answer drafts, picks the best |
| `live-web-search.ts` | Searches trusted web domains via Serper API |
| `web-crawler.ts` | Crawls and extracts content from web pages |
| `types.ts` | All TypeScript types for the OKSE system |
| `index.ts` | Public exports |

**Query Flow:**

```
User Query → Query Router (classify complexity)
  → CONVERSATIONAL? → Direct Gemini response (skip everything)
  → SIMPLE? → Semantic Cache check → KB search → Generate
  → COMPLEX? → Cache → KB + Web → CRAG evaluation → Multi-draft → Best answer
```

---

### 2. 🧬 Cognitive Digital Twin (`lib/cognitive/`)

**What:** Learns about each user over time — builds a "digital twin" profile.

| File | Purpose |
|------|---------|
| `adaptive-intelligence.ts` | Adapts responses based on user's interaction patterns |
| `context-fusion.ts` | Merges user context with query context |
| `intelligence-extractor.ts` | Extracts entities, facts, preferences from conversations |
| `learning-orchestrator.ts` | Coordinates the learning pipeline |
| `neural-relational-memory.ts` | Graph-based memory connecting entities and relationships |
| `proactive-insights-engine.ts` | Generates proactive suggestions for users |
| `profile-builder.ts` | Builds comprehensive user profiles |
| `session-manager.ts` | Manages conversation sessions with persistence |

---

### 3. 📚 Knowledge Management (`lib/knowledge/`)

**What:** Handles document ingestion, search, and retrieval.

| File | Purpose |
|------|---------|
| `federated-search.ts` | Searches across ALL knowledge sources (KB, web, APIs) |
| `crag-evaluator.ts` | CRAG (Corrective RAG) — evaluates if retrieved results are actually relevant |
| `document-processor.ts` | Processes uploaded documents (PDF, text, etc.) into chunks |
| `domain-scraper.ts` | Scrapes entire domains for knowledge base ingestion |
| `contextual-summarizer.ts` | Generates contextual summaries for search results |

---

### 4. 💬 Conversation Intelligence (`lib/conversation-intelligence.ts`)

**What:** Single file containing all prompt engineering, security, and conversation logic.

**Key exports:**

- `IDENTITY_PROTECTION_BLOCK` — Anti-jailbreak, identity protection rules
- `STRICT_MODE_PROMPT` / `EXTENDED_MODE_PROMPT` — System prompt templates
- `sanitizeUserInput()` — Strips prompt injection patterns
- `isConversationalQuery()` — Detects greetings/farewells
- `rewriteQuery()` — Rewrites queries for better retrieval
- `buildMultiTurnMessages()` — Builds conversation context

---

### 5. 📱 Social Media Engine (`lib/social/`)

**What:** Multi-platform social media posting and analytics.

| File | Purpose |
|------|---------|
| `social-engine.ts` | Core engine for social media operations |
| `unified-social-service.ts` | Unified API for all platforms |
| `facebook-client.ts` | Facebook/Meta API integration |
| `instagram-client.ts` | Instagram API integration |
| `linkedin-client.ts` | LinkedIn API integration |
| `twitter-client.ts` | Twitter/X API integration |
| `content-intelligence.ts` | AI-powered content suggestions |
| `platform-adapter.ts` | Platform-agnostic adapter pattern |

---

### 6. 🎨 Presentation Engine (`lib/gamma/`)

**What:** AI-generated presentations (like Gamma.app).

| File | Purpose |
|------|---------|
| `generator.ts` | Generates presentation JSON from topics |
| `types.ts` | Presentation type definitions |

---

### 7. 📦 Shared Packages

#### `packages/ai/` — AI Model Abstraction

- **Adapters:** Google (Gemini), OpenAI, Anthropic
- **Router:** Routes requests to the appropriate model based on config
- All AI calls go through this layer

#### `packages/rag/` — RAG Pipeline

- **Embeddings:** Generates vector embeddings (Gemini embedding model)
- **Chunking:** Splits documents into optimal chunks for retrieval
- **Retrieval:** Vector similarity search against Supabase pgvector
- **Context:** Builds context windows for LLM prompts

#### `packages/database/` — Database Client

- Supabase client initialization
- Shared across all modules

---

## API Routes Reference

### Chat APIs

| Route | Method | Description |
|-------|--------|-------------|
| `/api/chat` | POST | Main chat endpoint (legacy + OKSE modes) |
| `/api/chat/user` | POST | User-authenticated chat with session tracking |
| `/api/v1/chat` | POST | Widget/embed chat API (API key auth, rate limited) |

### Knowledge Base

| Route | Method | Description |
|-------|--------|-------------|
| `/api/knowledge-bases` | GET/POST | List/create knowledge bases |
| `/api/knowledge-bases/[id]` | GET/PUT | Get/update specific KB |
| `/api/knowledge-bases/[id]/upload` | POST | Upload documents to KB |
| `/api/knowledge/search` | POST | Search across knowledge sources |

### OKSE Engine

| Route | Method | Description |
|-------|--------|-------------|
| `/api/okse/cache` | GET/DELETE | View/clear semantic cache |
| `/api/okse/sources` | GET/POST | Manage OKSE knowledge sources |

### Cognitive / Digital Twin

| Route | Method | Description |
|-------|--------|-------------|
| `/api/cognitive/sessions` | POST | Create/get chat sessions |
| `/api/cognitive/sessions/[id]` | GET | Load a specific session |
| `/api/cognitive/learn` | POST | Trigger learning from conversation |
| `/api/cognitive/entities` | GET | Get extracted entities |
| `/api/cognitive/facts` | GET | Get user facts/preferences |
| `/api/cognitive/insights` | GET | Get proactive insights |
| `/api/cognitive/profile` | GET | Get user's cognitive profile |
| `/api/cognitive/nrm/*` | GET/POST | Neural relational memory operations |

### Products

| Route | Method | Description |
|-------|--------|-------------|
| `/api/products` | GET/POST | List/create AI products |
| `/api/products/[id]` | GET/PUT | Manage specific product |
| `/api/products/[id]/chat` | POST | Product-specific chat |
| `/api/products/[id]/persona` | GET/PUT | Product AI persona |

### Social Media

| Route | Method | Description |
|-------|--------|-------------|
| `/api/social/accounts` | GET/POST | Connected social accounts |
| `/api/social/posts` | GET/POST | Create/list social posts |
| `/api/social/publish` | POST | Publish to platforms |
| `/api/social/analytics` | GET | Social media analytics |
| `/api/social/insights` | GET | AI-powered social insights |
| `/api/social/ai-assist` | POST | AI content suggestions |
| `/api/social/calendar` | GET | Content calendar |

### Marketing

| Route | Method | Description |
|-------|--------|-------------|
| `/api/marketing/*` | Various | Campaign management, analytics, AB testing |

### User & Auth

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth` | Various | Supabase auth callbacks |
| `/api/user/facts` | GET/POST | User facts management |
| `/api/user/[id]` | GET/PUT | User profile |

### Payments

| Route | Method | Description |
|-------|--------|-------------|
| `/api/payments/platform` | POST | Payment processing |

---

## Database Schema

38 migrations, applied in order. Key tables:

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (via Supabase Auth) |
| `products` | AI products created by users |
| `product_users` | End-users interacting with products |
| `knowledge_bases` | Knowledge base configurations |
| `knowledge_documents` | Uploaded documents |
| `knowledge_chunks` | Chunked document content + embeddings (pgvector) |
| `knowledge_sources` | External knowledge sources (web, API, etc.) |
| `agent_persona` | AI persona configuration per product |
| `widget_api_keys` | API keys for embeddable widget |

### OKSE Tables

| Table | Purpose |
|-------|---------|
| `okse_semantic_cache` | Cached query-response pairs |
| `okse_web_sources` | Trusted web sources per product |
| `okse_query_logs` | Query analytics and performance tracking |

### Cognitive / Memory Tables

| Table | Purpose |
|-------|---------|
| `cognitive_sessions` | Chat session tracking |
| `cognitive_messages` | Message history per session |
| `cognitive_entities` | Extracted entities from conversations |
| `cognitive_facts` | User facts and preferences |
| `cognitive_relationships` | Entity relationships (graph) |
| `cognitive_insights` | Proactive insights for users |

### Social & Marketing Tables

| Table | Purpose |
|-------|---------|
| `social_accounts` | Connected social media accounts |
| `social_posts` | Scheduled/published posts |
| `marketing_campaigns` | Marketing campaign data |
| `marketing_analytics` | Campaign performance metrics |

### Business Tables

| Table | Purpose |
|-------|---------|
| `audit_logs` | All user actions and queries |
| `creator_tiers` | Subscription tier definitions |
| `payment_transactions` | Payment records |

---

## Environment Variables

Copy `.env.example` to `apps/web/.env.local` and fill in:

```bash
# === REQUIRED ===

# Supabase (get from supabase.com → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Gemini (get from aistudio.google.com → API Keys)
GOOGLE_AI_API_KEY=AIza...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000   # Use https://makemyai.app for prod

# === OPTIONAL (features won't work without these) ===

# Serper API — for live web search in OKSE (serper.dev)
SERPER_API_KEY=

# OpenAI — if using OpenAI models (api.openai.com)
OPENAI_API_KEY=sk-...

# Anthropic — if using Claude models (console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-...

# Stripe — for payments (dashboard.stripe.com)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Razorpay — for Indian payments (dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=

# Resend — for transactional emails (resend.com)
RESEND_API_KEY=re_...
```

---

## Development Workflow

### Branching Strategy

```
main (protected — requires PR + approval)
  ├── feature/your-feature-name
  ├── fix/bug-description
  └── hotfix/critical-fix
```

### Daily Workflow

```bash
# 1. Always pull latest
git checkout main
git pull origin main

# 2. Create a feature branch
git checkout -b feature/my-feature

# 3. Make changes, commit often
git add .
git commit -m "feat: add user preferences panel"

# 4. Push and create PR
git push origin feature/my-feature
# Go to GitHub → Create Pull Request → Request review

# 5. After approval → Merge → Vercel auto-deploys
```

### Running Locally

```bash
pnpm dev:web           # Start Next.js dev server (port 3000)
pnpm build:web         # Production build
pnpm lint              # Run linter across all packages
pnpm type-check        # TypeScript type checking
```

### Database Migrations

```bash
# When you need to add DB changes:
# 1. Create a new .sql file in supabase/migrations/
# 2. Name it: NNN_description.sql (next number in sequence)
# 3. Push to Supabase:
pnpm db:migrate
```

---

## Deployment

| Environment | Trigger | URL |
|-------------|---------|-----|
| **Production** | Merge to `main` | [makemyai.app](https://makemyai.app) |
| **Preview** | Any PR | Auto-generated Vercel URL |

Vercel is connected to `Karr-Org/KarrAiGlobal` and auto-deploys on every push.

---

## Key Concepts for New Developers

### Products

A **Product** is a custom AI assistant. Each product has its own:

- Knowledge base (uploaded documents)
- AI persona (tone, instructions, name)
- Widget for embedding on external sites
- Connected social media accounts
- Chat history and analytics

### The Chat Flow

1. User sends message → `/api/chat/user`
2. Input is sanitized (anti-injection) and classified
3. If **conversational** (greeting/farewell) → direct response, skip everything
4. If **substantive** → OKSE Engine processes:
   - Check semantic cache → if cache hit, return cached answer
   - Search knowledge base (vector similarity) + optional web search
   - CRAG evaluation (are results relevant?)
   - Generate answer with Gemini, citing sources
5. Response returned with sources and confidence score

### Security Layers

1. **Input sanitization** — strips prompt injection patterns
2. **Identity protection** — AI never reveals it's Gemini/GPT/Claude
3. **Anti-jailbreak** — resists DAN, developer mode, persona override attacks
4. **Rate limiting** — on widget API (configurable per API key)
5. **Domain-restricted web search** — only searches product-configured trusted domains

---

## Need Help?

- **Codebase questions:** Check the module sections above
- **Database schema:** Look at `supabase/migrations/` (files are numbered and descriptive)
- **API testing:** Use the Vercel preview deployments or run locally
- **Architecture decisions:** See `OKSE_REMEDIATION_REPORT.md` for recent security work
