# Hybrid Knowledge Engine - Implementation Specification

> **Vision:** Transform MakeMyAI from a document-based Q&A system into the world's most trusted Hybrid Knowledge Platform. The "Shopify of Knowledge Agents."

---

## 🎯 Core Principles

### 1. Platform-First Design
Every feature applies to ALL products. When we add "External API" support, every product creator gets it. No exception.

### 2. Zero Breaking Changes
The existing document upload → approval → points system is LOCKED. We extend, we don't modify.

### 3. Trust Hierarchy
```
Level 1 (Highest): Internal Documents (Admin-curated, user-contributed approved)
Level 2 (High):    Certified APIs (Pre-integrated, verified sources)
Level 3 (Moderate): Trusted Web (Whitelisted domains per product)
```

### 4. Cost Intelligence
- **Stagnant Knowledge**: Fetch once, cache forever (e.g., CGST Act 2017)
- **Dynamic Knowledge**: Fresh fetch with TTL (e.g., latest circulars)
- **Real-time Knowledge**: Live web search (e.g., current news)

---

## 📊 Database Schema

### Table: `knowledge_sources`
Defines what sources a product can use.

```sql
CREATE TABLE knowledge_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Source Type
    source_type TEXT NOT NULL CHECK (source_type IN ('internal_documents', 'external_api', 'trusted_web')),
    
    -- Display
    name TEXT NOT NULL,                    -- e.g., "Supreme Court Database"
    description TEXT,
    icon_emoji TEXT DEFAULT '📚',          -- For UI display
    
    -- Configuration (Type-specific)
    config JSONB NOT NULL DEFAULT '{}',
    /*
    For external_api:
    {
        "provider": "indian_kanoon",           -- Pre-built integration ID
        "api_endpoint": "https://api.indiankanoon.org/search",
        "api_key_encrypted": "...",            -- Encrypted key
        "refresh_strategy": "stagnant|dynamic|realtime",
        "cache_ttl_seconds": 86400,            -- 24 hours for dynamic
        "rate_limit_per_minute": 60
    }
    
    For trusted_web:
    {
        "allowed_domains": ["indiankanoon.org", "taxguru.in", "cbic.gov.in"],
        "search_provider": "google_pse",       -- Google Programmable Search Engine
        "pse_id": "...",
        "max_results": 5
    }
    */
    
    -- Trust & Priority
    trust_level INTEGER DEFAULT 80 CHECK (trust_level BETWEEN 0 AND 100),
    priority INTEGER DEFAULT 0,             -- Higher = searched first
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_knowledge_sources_product ON knowledge_sources(product_id);
CREATE INDEX idx_knowledge_sources_type ON knowledge_sources(source_type);
```

### Table: `knowledge_source_cache`
Stores cached API/Web responses to avoid redundant fetches.

```sql
CREATE TABLE knowledge_source_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
    
    -- Cache Key (hash of query + params)
    cache_key TEXT NOT NULL,
    
    -- Cached Response
    response_data JSONB NOT NULL,
    embedding vector(768),                  -- Pre-computed for vector search
    
    -- Metadata
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,                 -- NULL = never expires (stagnant)
    hit_count INTEGER DEFAULT 0,            -- Analytics
    
    UNIQUE(source_id, cache_key)
);

CREATE INDEX idx_source_cache_key ON knowledge_source_cache(source_id, cache_key);
CREATE INDEX idx_source_cache_expiry ON knowledge_source_cache(expires_at) WHERE expires_at IS NOT NULL;
```

### Table: `api_integrations` (Pre-Built Templates)
Marketplace of ready-to-use API integrations.

```sql
CREATE TABLE api_integrations (
    id TEXT PRIMARY KEY,                    -- e.g., "indian_kanoon", "pubmed"
    
    -- Display
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,                          -- "legal", "medical", "finance", etc.
    logo_url TEXT,
    
    -- Integration Details
    base_url TEXT NOT NULL,
    auth_type TEXT DEFAULT 'api_key',       -- api_key, oauth2, none
    documentation_url TEXT,
    
    -- Schema for config
    config_schema JSONB,                    -- JSON Schema for validation
    
    -- Availability
    is_free BOOLEAN DEFAULT false,
    requires_user_key BOOLEAN DEFAULT true, -- User provides their own API key
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔄 Chat Flow (Updated)

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                    FEDERATED SEARCH                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Internal   │  │  External    │  │   Trusted    │       │
│  │   Documents  │  │  APIs        │  │   Web        │       │
│  │  (Existing)  │  │  (New)       │  │  (New)       │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │               │
│         ▼                 ▼                 ▼               │
│    Vector Search     Cache Check →    Domain-Restricted     │
│    on Chunks         API Call if      Web Search            │
│                      cache miss                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                    RESULT MERGER                             │
├─────────────────────────────────────────────────────────────┤
│  • Rank by trust_level × relevance_score                    │
│  • De-duplicate similar content                              │
│  • Attach source metadata for citations                      │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI RESPONSE                               │
├─────────────────────────────────────────────────────────────┤
│  • Generate answer using merged context                      │
│  • Build structured citations                                │
│  • Calculate confidence (weighted by source trust)           │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
Response with Rich Citations:
  📚 CGST Act Section 16 (Internal)
  🏛️ Case: Union of India vs ABC (API: Indian Kanoon)
  🔗 https://cbic.gov.in/circular/123 (Web)
```

---

## 📱 Admin UI - Source Management

### New Section: "Knowledge Sources" (Admin Dashboard)

```
┌─────────────────────────────────────────────────────────────┐
│  Knowledge Sources for [Product Name]                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📚 Internal Documents                    [Always Active]   │
│     ├─ 156 documents, 2,340 chunks                          │
│     └─ Trust Level: ████████████████████ 100%               │
│                                                              │
│  🏛️ Indian Kanoon (Legal Cases)          [✓ Active]        │
│     ├─ API Key: ****7890                                    │
│     ├─ Cache: 1,245 entries (Stagnant)                      │
│     └─ Trust Level: ████████████████░░░░ 85%                │
│                                                              │
│  🔗 Trusted Websites                      [✓ Active]        │
│     ├─ Domains: cbic.gov.in, taxguru.in, +2 more            │
│     ├─ Search Provider: Google PSE                          │
│     └─ Trust Level: ████████████░░░░░░░░ 70%                │
│                                                              │
│  [+ Add Knowledge Source]                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏷️ Citation Display (User Chat)

### Current (Basic):
```
Sources: Document 1, Document 2
```

### New (Rich Citations):
```
┌─────────────────────────────────────────────────────────────┐
│  📖 Sources                                                  │
├─────────────────────────────────────────────────────────────┤
│  📚 CGST Act 2017                                           │
│     Section 16 - Eligibility for Input Tax Credit           │
│     [Verified Internal Document]                             │
│                                                              │
│  🏛️ Union of India vs. Mohit Minerals (2022)               │
│     Supreme Court of India                                   │
│     [Indian Kanoon API] → View Full Judgment                 │
│                                                              │
│  🔗 Circular No. 123/2024                                   │
│     cbic.gov.in/circular/123                                 │
│     [Trusted Web] → Open Link                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Order

### Phase 1: Database & Core (Today)
1. ✅ Create `knowledge_sources` table
2. ✅ Create `knowledge_source_cache` table
3. ✅ Create `api_integrations` marketplace table
4. ✅ Seed with "Internal Documents" source for all products

### Phase 2: Admin UI (Next)
1. Knowledge Sources management page
2. Add/Edit/Delete sources
3. API key configuration (encrypted storage)
4. Domain whitelist editor

### Phase 3: Chat Integration
1. Modify chat route for federated search
2. Implement caching layer
3. Add web search with domain restriction
4. Build citation engine

### Phase 4: Pre-Built Integrations
1. Indian Kanoon (Legal)
2. PubMed (Medical)
3. Google Scholar (Academic)
4. Custom API builder

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Source diversity per product | 3+ sources |
| Cache hit rate for stagnant data | >90% |
| Citation accuracy | 100% (every answer cites source) |
| Admin setup time for new source | <5 minutes |

---

*Last Updated: 2026-02-03 | Author: AI Architect*
