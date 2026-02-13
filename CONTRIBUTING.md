# Contributing to KarrAI Global

## Team Roles

| Role | Owner | Areas |
|------|-------|-------|
| **Founder / Full-Stack** | @tohundguide | Everything (final approver) |
| **AI/ML Engineer** | @ai-engineer-username | `packages/ai/`, `packages/rag/`, `apps/web/src/lib/cognitive/`, `apps/web/src/lib/okse/` |

## Branching Strategy

```
main          ← production (protected, requires PR + approval)
  └── dev     ← integration branch
       ├── feat/cognitive-v2      (AI/ML engineer)
       ├── feat/rag-improvements  (AI/ML engineer)
       ├── feat/okse-v2           (AI/ML engineer)
       ├── fix/chat-response      (AI/ML engineer)
       └── feat/new-feature       (founder)
```

### Rules

1. **Never push directly to `main`** — always create a PR
2. **Branch names** must follow: `feat/`, `fix/`, `refactor/`, `docs/` prefix
3. **PRs require at least 1 approval** from a CODEOWNER
4. **AI/ML branches** should be prefixed with the area: `feat/ai-`, `feat/rag-`, `feat/cognitive-`, `feat/okse-`

## For AI/ML Engineer

### Your Workspace

You own and can freely modify these directories:

```
packages/ai/                          → LLM model adapters & routing
  └── src/
      ├── adapters/                   → Gemini, OpenAI, etc.
      ├── router.ts                   → Multi-model routing logic
      └── types.ts                    → AI type definitions

packages/rag/                         → RAG pipeline
  └── src/
      ├── chunking.ts                 → Document chunking strategies
      ├── embeddings.ts               → Embedding generation
      ├── retrieval.ts                → Vector similarity search
      └── context.ts                  → Context window building

apps/web/src/lib/cognitive/           → Cognitive Digital Twin
  ├── neural-relational-memory.ts     → Entity graph & memory
  ├── learning-orchestrator.ts        → Learning patterns
  ├── proactive-insights-engine.ts    → Proactive suggestions
  ├── profile-builder.ts             → User profile ML
  ├── intelligence-extractor.ts       → Information extraction
  ├── context-fusion.ts               → Multi-source context
  ├── adaptive-intelligence.ts        → Adaptive responses
  └── session-manager.ts             → Session state

apps/web/src/lib/okse/                → OKSE Search Engine
  ├── engine.ts                       → Core search engine
  ├── query-router.ts                 → Query classification & routing
  ├── semantic-cache.ts               → Semantic similarity cache
  ├── knowledge-fusion.ts             → Multi-source fusion
  ├── live-web-search.ts              → Real-time web search
  ├── web-crawler.ts                  → Web content extraction
  └── speculative-drafting.ts         → Speculative response generation
```

### API Routes You Can Modify

```
apps/web/src/app/api/chat/route.ts    → Main chat endpoint
apps/web/src/app/api/okse/            → OKSE query endpoints
```

### Areas You Should NOT Modify (require founder approval)

- `apps/web/src/lib/auth/` — Authentication
- `apps/web/src/lib/payments/` — Payment processing
- `apps/web/src/middleware.ts` — Request middleware
- `supabase/migrations/` — Database migrations
- `.env*` — Environment variables
- `package.json`, `pnpm-lock.yaml` — Dependencies (discuss first)

### Getting Started

```bash
# 1. Clone with sparse checkout (only your areas)
git clone --filter=blob:none --sparse https://github.com/tohundguide/KarrAiGlobal.git
cd KarrAiGlobal
git sparse-checkout set packages/ai packages/rag apps/web/src/lib/cognitive apps/web/src/lib/okse apps/web/src/app/api/chat apps/web/src/app/api/okse

# OR clone the full repo (recommended for running locally)
git clone https://github.com/tohundguide/KarrAiGlobal.git
cd KarrAiGlobal

# 2. Install dependencies
pnpm install

# 3. Set up environment (get .env from founder)
cp .env.example .env
# Fill in the values provided by the founder

# 4. Start development server
pnpm dev:web

# 5. Create a feature branch
git checkout -b feat/ai-your-feature-name

# 6. After making changes, push and create a PR
git push origin feat/ai-your-feature-name
# Then create a PR on GitHub
```

### Environment Variables You Need

```
NEXT_PUBLIC_SUPABASE_URL=...          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...     # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=...         # Supabase admin key
GOOGLE_AI_API_KEY=...                 # Gemini API key
OPENAI_API_KEY=...                    # OpenAI API key (if needed)
```

### Database

If you need new tables or modifications for AI features:

1. **DO NOT create migration files directly**
2. Write the SQL changes you need in a document
3. Share with the founder who will create the migration
4. This prevents breaking the migration chain

### Testing Your Changes

```bash
# Run the dev server
pnpm dev:web

# Test chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test query", "productId": "..."}'

# Test OKSE endpoint
curl -X POST http://localhost:3000/api/okse/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "product_id": "...", "knowledge_base_id": "..."}'
```

## PR Review Process

1. AI/ML engineer creates PR with changes
2. GitHub auto-assigns reviewers based on CODEOWNERS
3. Founder reviews and approves (or requests changes)
4. Once approved, founder merges to `main`
5. Vercel auto-deploys on merge to `main`
