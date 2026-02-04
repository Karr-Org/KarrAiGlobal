---
description: Hybrid Knowledge Engine - Multi-Source Knowledge Integration
---

# Hybrid Knowledge Engine Implementation

## Summary
In this session, we implemented the complete Hybrid Knowledge Engine that transforms Karr AI from a document-only system into a multi-source knowledge platform. This includes integration with External APIs, Trusted Web Search, and a rich citation system.

## Key Accomplishments

### 1. Database Schema (Migration 014)
Created `knowledge_sources`, `knowledge_source_cache`, and `api_integrations` tables:
- **knowledge_sources**: Stores product-level knowledge source configs (internal, API, web)
- **knowledge_source_cache**: Intelligent caching with stagnant/dynamic strategies
- **api_integrations**: Marketplace of pre-built integrations

### 2. Federated Search Engine
Created `apps/web/src/lib/knowledge/federated-search.ts`:
- Parallel search across Internal Documents, External APIs, and Trusted Web
- Trust-weighted ranking (higher trust sources ranked first)
- Smart caching (stagnant data cached forever, dynamic data uses TTL)
- Rich citation builder with icons and trust badges

### 3. Pre-Built API Integrations
Seeded 4 integrations:
- **Indian Kanoon** (Legal - court judgments)
- **PubMed** (Medical - research papers)
- **Google Scholar** (Academic - papers/theses)
- **CBIC Circulars** (Tax - GST notifications)

### 4. Admin UI for Knowledge Sources
Created `/admin/products/[productId]/knowledge-sources` page:
- View all configured sources with stats
- Add External APIs (with API key management)
- Add Trusted Websites (with domain whitelist)
- Toggle sources on/off
- Set trust levels (0-100%)

### 5. Chat API Integration
Updated `/api/chat/route.ts` to use federated search:
- Searches across all active knowledge sources
- Returns rich citations with source type and trust
- Falls back gracefully if federated search fails
- Logs source diversity in audit logs

### 6. API Endpoints
- `GET/POST/PATCH/DELETE /api/admin/knowledge-sources` - CRUD for sources
- `GET /api/admin/api-integrations` - List available integrations

## Files Created/Modified

### New Files:
- `supabase/migrations/014_hybrid_knowledge_engine.sql`
- `apps/web/src/lib/knowledge/federated-search.ts`
- `apps/web/src/app/admin/products/[productId]/knowledge-sources/page.tsx`
- `apps/web/src/app/api/admin/knowledge-sources/route.ts`
- `apps/web/src/app/api/admin/api-integrations/route.ts`
- `.agent/HYBRID_KNOWLEDGE_ENGINE.md`

### Modified Files:
- `apps/web/src/app/api/chat/route.ts` - Integrated federated search
- `apps/web/src/app/admin/products/page.tsx` - Added "Sources" button to product cards
- `.agent/PROJECT_STATE.md` - Updated with Hybrid Engine features

## Architecture

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────────┐
│              FEDERATED SEARCH ENGINE                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📚 Internal Docs    ⚖️ External APIs    🔗 Web    │
│  (Vector Search)     (Cached/Live)     (Restricted) │
│  Trust: 100%         Trust: 70-90%     Trust: 60-80%│
│                                                      │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              TRUST-WEIGHTED RANKING                  │
│              + RICH CITATIONS                        │
└─────────────────────────────────────────────────────┘
```

## Testing Notes
- TypeScript compiles without errors
- Dev server running on port 3003
- Migration 014 deployed to Supabase
- Product users auto-receive "Internal Documents" source

## Next Steps
1. Configure Google Custom Search API for trusted web search
2. Add more pre-built API integrations
3. Update chat UI to display rich citations
4. Add source usage analytics dashboard

---
*Session Date: 2026-02-03 | Duration: ~20 minutes*
