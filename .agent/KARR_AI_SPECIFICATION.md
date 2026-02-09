# MakeMyAI: THE DEFINITIVE BUILD SPECIFICATION
## Complete Engineering Prompt for AI Builders
### Version 2.0 — Final Consolidated Document

---

# DOCUMENT OVERVIEW

**Purpose:** This is the SINGLE SOURCE OF TRUTH for building MakeMyAI. Every requirement, specification, and architectural decision is here. Engineers treat this as their bible.

**Technology Stack:**
- **Backend:** Supabase (PostgreSQL + pgvector, Auth, Storage, Edge Functions, Realtime)
- **Frontend:** React Native (Mobile) + Next.js (Web) — MOBILE-FIRST design
- **AI:** Model-Agnostic (GPT-4, Claude, Gemini, Llama — swappable)
- **Payments:** Stripe (International) + Razorpay (India)

**Document Structure:**
- Part 1-4: Foundation (Vision, Architecture, Supabase, Mobile-First)
- Part 5-7: Three Levels (Global, Products, User Private)
- Part 8-12: Intelligence (RAG, Models, Self-Evolution, Reasoning, Prediction)
- Part 13-18: Actions & Features (Action Layer, NLP Actions, Multi-Modal, Collaboration, Workflows, Portal Co-Pilot)
- Part 19-22: Platform & Operations (KaaS, Security, Analytics, APIs)
- Part 23-25: Implementation (Data Models, Roadmap, Metrics)

---

# PART 1: VISION & CORE CONCEPT

## 1.1 What is MakeMyAI?

MakeMyAI is an **AI FACTORY PLATFORM** — a meta-system that creates, operates, and manages multiple domain-specific AI products from a single core infrastructure.

```
ONE FACTORY → UNLIMITED PRODUCTS → PERSONALIZED FOR EACH USER
```

**Think of it as:**
- **AWS for Professional AI** — One platform, infinite products
- **Shopify for AI Products** — Create, launch, manage without code
- **Stripe for Compliance** — Global infrastructure, local expertise

## 1.2 The Three-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEVEL 1: MakeMyAI GLOBAL                       │
│                       (MakeMyAI.global)                            │
│                                                                  │
│  The Factory — Houses AI engine, RAG core, billing, admin UI    │
│  Never exposed to end users of products                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Creates & Powers
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LEVEL 2: PRODUCT AIs                          │
│                                                                  │
│  GST AI          Income Tax AI       Companies Act AI    ...    │
│  (karrgstai.com) (karrincometaxai.com) (karrcompaniesai.com)   │
│                                                                  │
│  Each has: Own domain, Own KB, Own pricing, Own users           │
│  All share: Core AI engine from Level 1                         │
│  All billing: Flows back to MakeMyAI Global                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Personalized For
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  LEVEL 3: USER PRIVATE AI                        │
│                                                                  │
│  User's Documents + User's Context + User's History             │
│  Encrypted, Isolated, Personal AI Assistant                     │
│  Merges with Product AI for personalized responses              │
└─────────────────────────────────────────────────────────────────┘
```

## 1.3 The Ten Commandments (Non-Negotiable Principles)

### 1. ZERO CODE FOR NEW PRODUCTS
Admin logs into MakeMyAI.global → Clicks "New Product" → Configures → Launches.
Product goes live on its own domain. NO engineering intervention.

### 2. MODEL AGNOSTICISM
System works with ANY LLM. Swapping GPT-4 for Claude takes hours, not weeks.
Build adapters for: OpenAI, Anthropic, Google, Meta, Mistral, future models.

### 3. KNOWLEDGE IS THE MOAT
The LLM is commodity. The curated, verified, continuously-updated knowledge base is the product.
Invest 10x more in knowledge engineering than model engineering.

### 4. NEVER HALLUCINATE
In legal/tax, one wrong answer destroys trust forever.
Better to say "I need to verify this" than guess.
Below 70% confidence = don't answer, flag for review.

### 5. ACTION, NOT JUST ANSWERS
Users don't want text. They want: Emails sent, PDFs downloaded, Forms filled, Deadlines tracked.
The ACTION LAYER is the true differentiator.

### 6. AUDIT EVERYTHING
Every query, response, source cited, action taken = logged.
Immutable trail for 7+ years. Legal shield + training data goldmine.

### 7. JURISDICTION ISOLATION
Indian GST and UAE VAT must NEVER cross-contaminate.
Laws are not global. Architecture must enforce isolation.

### 8. MOBILE-FIRST
Professionals use phones in courts, client meetings, travel.
Every feature works perfectly on 5-inch screen. Desktop is scaled-up version.

### 9. SELF-EVOLUTION
System gets smarter automatically. New regulations detected and ingested without humans.
User corrections become training data. Knowledge gaps identified.

### 10. PLATFORM THINKING
Don't just build a product. Build infrastructure others can build on.
APIs, marketplace, white-label, integrations. Be the platform.

---

# PART 2: ARCHITECTURE OVERVIEW

## 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │   Mobile App    │  │   Web App       │  │   API Clients   │              │
│  │  (React Native) │  │   (Next.js)     │  │   (REST/WS)     │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
└───────────┴─────────────────────┴─────────────────────┴──────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE LAYER                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│
│  │   Auth     │ │  Database  │ │  Storage   │ │  Realtime  │ │   Edge     ││
│  │            │ │ (Postgres  │ │ (Documents)│ │  (Live)    │ │ Functions  ││
│  │            │ │ + pgvector)│ │            │ │            │ │            ││
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INTELLIGENCE LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │              Model Router & Abstraction                      │            │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │            │
│  │  │ OpenAI  │ │ Claude  │ │ Gemini  │ │ Llama   │           │            │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │            │
│  └─────────────────────────────────────────────────────────────┘            │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │              4-Tier RAG Engine                               │            │
│  │  Tier 1: Law │ Tier 2: Regulatory │ Tier 3: Cases │ Tier 4: User       │
│  └─────────────────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Stripe/ │ │  Email  │ │   SMS   │ │WhatsApp │ │   Gov   │               │
│  │Razorpay │ │(Resend) │ │         │ │   API   │ │ Portals │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Data Flow

```
User Query (Mobile/Web)
        │
        ▼
[Auth Validation] ──► Get user context, subscription, product
        │
        ▼
[Intent Classification] ──► What does user want? (Query/Action/Upload)
        │
        ▼
[RAG Retrieval]
├── Tier 1: Foundational Law (Acts, Statutes)
├── Tier 2: Regulatory (Circulars, Notifications)
├── Tier 3: Interpretive (Cases, Commentary)
└── Tier 4: User's Private Documents
        │
        ▼
[Context Assembly] ──► Combine retrieved chunks within token limit
        │
        ▼
[Model Router] ──► Select best LLM based on complexity/cost/availability
        │
        ▼
[LLM Generation] ──► Generate response with citations
        │
        ▼
[Validation] ──► Confidence scoring, fact checking, hallucination detection
        │
        ▼
[Response Formatting] ──► Add sources, action buttons, reasoning chain
        │
        ▼
[Audit Logging] ──► Log everything for compliance and training
        │
        ▼
[Return to User] ──► Response + Suggested Actions (Email, PDF, etc.)
```

---

# PART 3: SUPABASE INFRASTRUCTURE

## 3.1 Why Supabase?

- PostgreSQL with pgvector (vector search built-in)
- Row Level Security (multi-tenant isolation)
- Edge Functions (serverless, global)
- Realtime subscriptions (live updates)
- Built-in Auth (OAuth, SSO, MFA)
- Storage with CDN (documents)
- Open source (no vendor lock-in)

## 3.2 Database Schema

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==================== PRODUCTS ====================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    domain TEXT UNIQUE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    jurisdiction TEXT[] DEFAULT '{}',
    
    -- Branding
    logo_url TEXT,
    primary_color TEXT DEFAULT '#1a365d',
    secondary_color TEXT DEFAULT '#0d9488',
    
    -- Config
    config JSONB DEFAULT '{}',
    ai_config JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE product_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    price_monthly INTEGER,
    price_annual INTEGER,
    currency TEXT DEFAULT 'INR',
    queries_per_month INTEGER,
    documents_limit INTEGER,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(product_id, slug)
);

-- ==================== USERS ====================

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    profession TEXT,
    organization_name TEXT,
    jurisdiction TEXT DEFAULT 'IN',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    tier_id UUID REFERENCES product_tiers(id),
    status TEXT DEFAULT 'active',
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    product_id UUID REFERENCES products(id),
    metric_type TEXT NOT NULL, -- 'query', 'upload', 'export', 'email'
    quantity INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== KNOWLEDGE BASE ====================

CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    source_type TEXT NOT NULL, -- 'upload', 'url', 'api'
    file_path TEXT,
    document_type TEXT, -- 'act', 'circular', 'judgment', 'commentary'
    authority_level INTEGER DEFAULT 5 CHECK (authority_level BETWEEN 1 AND 10),
    jurisdiction TEXT,
    categories TEXT[] DEFAULT '{}',
    effective_from DATE,
    effective_until DATE,
    status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding VECTOR(1536),
    section_hierarchy TEXT[],
    entities JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector index
CREATE INDEX knowledge_chunks_embedding_idx ON knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Text search index
CREATE INDEX knowledge_chunks_content_idx ON knowledge_chunks 
USING gin (to_tsvector('english', content));

-- ==================== USER DOCUMENTS ====================

CREATE TABLE user_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    folder_path TEXT DEFAULT '/',
    status TEXT DEFAULT 'pending',
    contribution_status TEXT DEFAULT 'private', -- 'private', 'submitted', 'approved'
    quality_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES user_documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    product_id UUID REFERENCES products(id),
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX user_chunks_embedding_idx ON user_document_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ==================== CONVERSATIONS ====================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    title TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model_used TEXT,
    tokens_prompt INTEGER,
    tokens_completion INTEGER,
    confidence_score FLOAT,
    sources JSONB DEFAULT '[]',
    reasoning_chain JSONB,
    feedback TEXT CHECK (feedback IN ('positive', 'negative')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== ACTIONS ====================

CREATE TABLE actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    product_id UUID REFERENCES products(id),
    message_id UUID REFERENCES messages(id),
    action_type TEXT NOT NULL, -- 'email', 'pdf_export', 'calendar_event'
    status TEXT DEFAULT 'pending',
    input_data JSONB NOT NULL,
    output_data JSONB,
    file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ==================== AUDIT LOG ====================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    product_id UUID REFERENCES products(id),
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL,
    event_data JSONB NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== SURVEILLANCE ====================

CREATE TABLE surveillance_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    name TEXT NOT NULL,
    source_type TEXT NOT NULL, -- 'rss', 'website', 'api'
    url TEXT NOT NULL,
    check_frequency_hours INTEGER DEFAULT 24,
    is_active BOOLEAN DEFAULT TRUE,
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE surveillance_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES surveillance_sources(id),
    product_id UUID REFERENCES products(id),
    title TEXT,
    content_preview TEXT,
    source_url TEXT,
    ai_summary TEXT,
    ai_relevance_score FLOAT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== DEADLINES ====================

CREATE TABLE deadlines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    product_id UUID REFERENCES products(id),
    title TEXT NOT NULL,
    deadline_type TEXT,
    due_date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule TEXT,
    status TEXT DEFAULT 'upcoming',
    reminder_days INTEGER[] DEFAULT '{7, 3, 1}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;

-- Users see only their own data
CREATE POLICY "Users see own profile" ON user_profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users see own documents" ON user_documents
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own conversations" ON conversations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own messages" ON messages
    FOR SELECT USING (
        conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
    );

-- ==================== FUNCTIONS ====================

-- Hybrid search function
CREATE OR REPLACE FUNCTION hybrid_search(
    query_embedding VECTOR(1536),
    query_text TEXT,
    p_product_id UUID,
    p_user_id UUID DEFAULT NULL,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    chunk_id UUID,
    content TEXT,
    document_title TEXT,
    authority_level INT,
    source_tier TEXT,
    score FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    -- Product knowledge (Tiers 1-3)
    SELECT 
        kc.id,
        kc.content,
        kd.title,
        kd.authority_level,
        'product'::TEXT,
        (1 - (kc.embedding <=> query_embedding)) * (kd.authority_level::float / 10) as score
    FROM knowledge_chunks kc
    JOIN knowledge_documents kd ON kc.document_id = kd.id
    WHERE kc.product_id = p_product_id
    
    UNION ALL
    
    -- User knowledge (Tier 4)
    SELECT 
        udc.id,
        udc.content,
        ud.title,
        5, -- Default authority for user docs
        'user'::TEXT,
        (1 - (udc.embedding <=> query_embedding)) * 0.8 as score
    FROM user_document_chunks udc
    JOIN user_documents ud ON udc.document_id = ud.id
    WHERE udc.user_id = p_user_id 
        AND udc.product_id = p_product_id
        AND p_user_id IS NOT NULL
    
    ORDER BY score DESC
    LIMIT match_count;
END;
$$;
```

## 3.3 Edge Functions Structure

```
supabase/functions/
├── query-handler/          # Main query processing
├── document-ingest/        # Process uploaded documents  
├── action-email/           # Send emails
├── action-export-pdf/      # Generate PDFs
├── webhook-stripe/         # Handle Stripe webhooks
├── webhook-razorpay/       # Handle Razorpay webhooks
├── surveillance-check/     # Check regulatory sources
├── cron-reminders/         # Send deadline reminders
└── _shared/
    ├── llm/
    │   ├── router.ts       # Model routing logic
    │   ├── openai.ts       # OpenAI adapter
    │   ├── anthropic.ts    # Claude adapter
    │   └── google.ts       # Gemini adapter
    ├── rag/
    │   ├── retrieval.ts    # RAG retrieval
    │   ├── embedding.ts    # Generate embeddings
    │   └── ranking.ts      # Rank results
    └── utils/
        ├── pdf.ts          # PDF generation
        └── email.ts        # Email sending
```

---

# PART 4: MOBILE-FIRST DESIGN SYSTEM

## 4.1 Design Philosophy

**Mobile is PRIMARY. Desktop is SCALED UP.**

- Design for 360px width first
- Thumb-friendly touch targets (min 44x44pt)
- Bottom navigation (thumb zone)
- Voice input prominent
- Offline capability for recent data

## 4.2 Breakpoints

```
sm: 360px   ← PRIMARY DESIGN TARGET
md: 600px   ← Large phones, small tablets
lg: 900px   ← Tablets
xl: 1200px  ← Desktop
```

## 4.3 Mobile Navigation

```
┌─────────────────────────────────────────┐
│                                         │
│              [Content Area]             │
│                                         │
├─────────────────────────────────────────┤
│  💬      📁      📅      ⚙️           │
│ Chat    Docs  Deadlines Settings       │
└─────────────────────────────────────────┘
```

## 4.4 Mobile Chat Interface

```
┌─────────────────────────────────────────┐
│ ← GST AI                          [•••]│
├─────────────────────────────────────────┤
│                                         │
│                    ┌──────────────────┐ │
│                    │ Can I claim ITC  │ │
│                    │ on office rent?  │ │
│                    └──────────────────┘ │
│                                         │
│ ┌────────────────────────────────────┐ │
│ │ 🤖 Yes, you can claim ITC on      │ │
│ │ office rent, subject to:          │ │
│ │                                    │ │
│ │ • Business purpose                 │ │
│ │ • Valid tax invoice               │ │
│ │ • Registered landlord (if >₹20L)  │ │
│ │                                    │ │
│ │ 📎 Sources [3]              [∨]   │ │
│ │                                    │ │
│ │ [📧] [📄] [📋] [👍] [👎]        │ │
│ └────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ [📎] Ask anything...          [🎤][➤] │
└─────────────────────────────────────────┘
```

## 4.5 Mobile Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- App size: < 15MB
- Works on 3G networks
- Offline: View recent conversations

## 4.6 Mobile-Specific Features

1. **Voice Input** — Prominent mic button, supports Indian English
2. **Push Notifications** — Deadlines, regulatory updates, responses ready
3. **Biometric Auth** — Face ID / Fingerprint for quick access
4. **Share Extensions** — Share TO and FROM MakeMyAI
5. **Widgets** — Quick query, upcoming deadlines

---

# PART 5: MakeMyAI GLOBAL (LEVEL 1) — THE FACTORY

## 5.1 Admin Dashboard

```
Sections:
1. Overview — Products, users, revenue, system health
2. Product Management — Create/edit/manage products
3. Knowledge Management — Global KB, surveillance queue
4. Users & Billing — User search, subscriptions, revenue
5. System Settings — Models, API keys, email config
6. Audit & Compliance — Logs, reports, data requests
```

## 5.2 Product Creation (Zero-Code)

```
Step 1: Basic Info
├── Product name, slug, description
├── Category (Tax, Compliance, Legal, Finance)
├── Jurisdiction(s)
└── Primary language

Step 2: Branding
├── Logo, favicon upload
├── Colors (primary, secondary, accent)
└── Custom CSS (optional)

Step 3: Domain
├── Subdomain (gstai.MakeMyAI.global) OR
└── Custom domain (karrgstai.com)

Step 4: Knowledge Base
├── Upload documents (PDF, DOCX, TXT)
├── Connect URLs for auto-fetch
└── Set authority levels

Step 5: Pricing
├── Define tiers (Free, Pro, Enterprise)
├── Set limits (queries, documents, storage)
└── Configure trial period

Step 6: AI Behavior
├── Welcome message
├── Personality/tone
├── Confidence threshold
└── Low-confidence behavior

Step 7: Review & Launch
├── Preview product
├── Test queries
└── Go live!
```

## 5.3 Billing (Centralized)

All billing flows through MakeMyAI Global:
- Stripe (International) + Razorpay (India)
- Subscription management, upgrades, downgrades
- Usage metering and overage handling
- Invoice generation, tax calculation
- Failed payment retry and dunning

---

# PART 6: PRODUCT AI (LEVEL 2) — THE PRODUCTS

## 6.1 User Features

### Authentication
- Email + Password
- Google OAuth
- Phone OTP (India)
- MFA optional

### Onboarding
- Welcome screen
- Personalization (profession, state)
- First query suggestions

### Chat Interface
- Natural conversation
- Sources with authority levels
- Action buttons (email, PDF, copy)
- Feedback (thumbs up/down)
- Voice input

### Document Management
- Upload from phone/camera/files
- Auto-processing and analysis
- Folder organization
- Contribution to community KB

### Subscriptions
- Plan comparison
- Easy upgrade/downgrade
- Usage tracking
- Invoice downloads

---

# PART 7: USER PRIVATE AI (LEVEL 3) — PERSONALIZATION

## 7.1 How It Works

```
Without User Context:
"Should I file GSTR-9?" 
→ Generic answer about GSTR-9 rules

With User Context (from uploaded docs):
"Should I file GSTR-9?"
→ "Based on your GSTR-3B filings, your turnover is ₹2.3Cr.
   Yes, you must file. I notice ITC mismatch of ₹45K to address.
   Due: Dec 31 (18 days left). Want me to help prepare?"
```

## 7.2 Privacy & Isolation

- Each user has isolated vector namespace
- Encryption at rest with user-specific keys
- RLS policies enforce isolation
- User A NEVER sees User B's data
- Complete data export on request
- Full deletion on request

---

# PART 8: THE FOUR-TIER RAG SYSTEM

## 8.1 Knowledge Hierarchy

```
TIER 1: FOUNDATIONAL LAW (Authority: 10/10)
├── What: Acts, statutes, constitutional provisions
├── Examples: GST Act, Income Tax Act, Companies Act
├── Update: Rare (amendments only)
└── Retrieval: Always include if relevant

TIER 2: REGULATORY CONTENT (Authority: 8/10)
├── What: Circulars, notifications, rules, guidelines
├── Examples: CBDT Circulars, GST Notifications
├── Update: Weekly (auto-surveillance)
└── Retrieval: High priority for recent queries

TIER 3: INTERPRETIVE (Authority: 6-7/10)
├── What: Court judgments, tribunal orders, commentary
├── Examples: Supreme Court rulings, ITAT orders
├── Update: Monthly
└── Retrieval: When interpretation needed

TIER 4: USER PRIVATE (Authority: Context-dependent)
├── What: User's uploaded documents
├── Examples: Notices, returns, contracts
├── Update: User-initiated
└── Retrieval: Always for personalized queries
```

## 8.2 Retrieval Strategy

1. Generate query embedding
2. Parallel search across all tiers
3. Hybrid search (vector + keyword)
4. Rank by relevance × authority × recency
5. Assemble context within token limit
6. Generate response with citations

## 8.3 Confidence Scoring

```
Factors:
- Retrieval quality (40%) — Similarity scores, source count
- Source authority (30%) — Tier levels, recency
- Query alignment (20%) — Does response address query?
- Contradiction check (10%) — Conflicting sources?

Levels:
- 85-100%: HIGH — Answer confidently
- 70-84%: MEDIUM — Answer with caveats
- 50-69%: LOW — Recommend verification
- <50%: DON'T ANSWER — Ask for clarification
```

---

# PART 9: INTELLIGENCE ABSTRACTION LAYER

## 9.1 Model Agnosticism

```typescript
interface LLMAdapter {
  generateCompletion(prompt: string, config: Config): Promise<Result>;
  generateEmbedding(text: string): Promise<number[]>;
  countTokens(text: string): number;
  estimateCost(prompt: string): CostEstimate;
  checkAvailability(): Promise<boolean>;
}

// Implementations for each provider
class OpenAIAdapter implements LLMAdapter { ... }
class AnthropicAdapter implements LLMAdapter { ... }
class GoogleAdapter implements LLMAdapter { ... }
class MetaAdapter implements LLMAdapter { ... }
```

## 9.2 Model Router

```
Routing Logic:
1. Check product preference
2. Assess query complexity (low/medium/high)
3. Consider cost sensitivity (user tier)
4. Check model availability
5. Select optimal model
6. Fallback chain if unavailable

Fallback Chain:
Primary: GPT-4 Turbo
Secondary: Claude 3 Sonnet
Tertiary: Gemini Pro
Emergency: Llama 3 (self-hosted)
```

---

# PART 10: SELF-EVOLVING KNOWLEDGE SYSTEM

## 10.1 Regulatory Surveillance

```
Surveillance Agents:
├── Gazette Monitor — Official gazettes (daily)
├── Portal Watcher — Government websites (6 hours)
├── Court Crawler — eCourts, SCC (daily)
├── Circular Tracker — CBDT, CBIC, RBI, SEBI (6 hours)
└── News Sentinel — Legal/tax news (hourly)

Flow:
Agent detects new content
    ↓
Auto-fetch and parse
    ↓
AI validation (genuine? relevant?)
    ↓
AI classification (which products affected?)
    ↓
AI analysis (contradicts existing? summary?)
    ↓
Queue for admin review
    ↓
If approved → Ingest into KB
    ↓
Notify affected users
```

## 10.2 Learning from Corrections

```
User interaction
    ↓
System responds
    ↓
User gives feedback / Expert corrects
    ↓
Log: {query, response, correction, expert_level}
    ↓
Batch analysis weekly
    ↓
Generate training data
    ↓
Fine-tune models
    ↓
System improves
```

## 10.3 Knowledge Gap Detection

- Track low-confidence queries
- Cluster similar problematic queries
- Identify missing topics
- Auto-generate acquisition tasks
- Weekly "Knowledge Health Report"

---

# PART 11: REASONING TRANSPARENCY ENGINE

## 11.1 Show the Work

```
For every response, capture:
├── Original question
├── Interpreted intent
├── Retrieved knowledge (with scores)
├── Reasoning steps
├── Assumptions made
├── Alternative interpretations
├── Why this answer was chosen
└── Confidence calculation
```

## 11.2 User-Facing View

```
┌─────────────────────────────────────────┐
│ How I reached this answer          [×] │
├─────────────────────────────────────────┤
│                                         │
│ 🎯 YOUR QUESTION:                      │
│ "Can I claim ITC on office rent?"       │
│                                         │
│ 🧠 MY UNDERSTANDING:                   │
│ ITC eligibility for commercial rent     │
│                                         │
│ 📚 KNOWLEDGE USED:                     │
│ • Section 16 of CGST Act               │
│ • Section 17(5) blocked credits        │
│ • Circular 184/2022                     │
│                                         │
│ 💭 REASONING:                          │
│ 1. Rent is a service (SAC 9972)        │
│ 2. Not in blocked list u/s 17(5)       │
│ 3. Therefore eligible if conditions met│
│                                         │
│ 📊 CONFIDENCE: 94%                     │
│                                         │
└─────────────────────────────────────────┘
```

---

# PART 12: PREDICTIVE INTELLIGENCE LAYER

## 12.1 Proactive, Not Reactive

Don't wait for users to ask. Alert them:

### Deadline Intelligence
- Learn all compliance deadlines
- Personalize for user's entities
- Alert before due dates
- Predict penalties if missed

### Risk Prediction
- Analyze user's data patterns
- Detect potential issues
- Alert: "3 suppliers haven't filed — your ITC at risk"

### Regulatory Impact
- When new circular detected
- Cross-reference affected users
- Personalized impact alert

---

# PART 13: ACTION LAYER — THE JACKPOT

## 13.1 Available Actions

Every response can be acted upon:

### Email
- Pre-filled composer
- To/CC/BCC fields
- Editable content
- Send via MakeMyAI or connected Gmail/Outlook
- Track delivery

### PDF Export
- Professional formatting
- Organization branding option
- Headers, footers, page numbers
- Table of contents (long docs)
- Password protection option

### Word Export
- Editable by user
- Proper styles
- Comments for citations

### Excel Export
- For tabular data
- Proper formatting
- Formulas where applicable

### Calendar
- Create deadline events
- Google Calendar / Outlook
- Reminders

### Form Filling
- Pre-built government form templates
- Auto-fill from response data
- Download as PDF

### Direct Filing (where API available)
- User authenticates with portal
- Submit via API
- Return acknowledgment

---

# PART 14: NATURAL LANGUAGE ACTIONS

## 14.1 Just Ask

Users shouldn't need buttons. They just say what they want:

```
"Email this to my client Sharma ji"
→ AI identifies action, finds contact, drafts email, sends

"Make a PDF and save to Acme Corp folder"
→ AI generates PDF, creates folder if needed, saves, confirms

"Remind me about this 2 weeks before the deadline"
→ AI calculates date, creates reminder, confirms

"Compare this with last month's discussion"
→ AI searches history, finds relevant conversation, generates comparison
```

## 14.2 Context Awareness

AI understands:
- "this" = current response/document
- "him/her" = recently mentioned person
- "last time" = previous relevant conversation
- "the deadline" = contextually relevant date

---

# PART 15: MULTI-MODAL PROCESSING

## 15.1 Beyond Text

### Document Intelligence
- Understand structure (not just text)
- Identify document type automatically
- Extract entities with context
- Handle tables properly
- Read handwritten annotations
- Process stamps and signatures

### Voice Interface
- Natural conversation
- Indian English accent support
- Hindi-English code-switching
- "Hey Karr, what's the TDS rate for professional services?"

### Image Understanding
- Photo of notice → "What should I do?"
- Screenshot of portal error → "How do I fix this?"
- Photo of calculation → "Is this correct?"

---

# PART 16: COLLABORATIVE INTELLIGENCE

## 16.1 Team Workspaces

For firms with multiple users:
- Shared knowledge base
- Team conversations
- Client folders (isolated per client)
- Role-based access (Partner, Manager, Associate)
- Approval workflows

## 16.2 Client Collaboration

Give clients limited access:
- See their documents only
- Ask questions (routed through professional)
- Professional reviews before client sees response

## 16.3 Expert Network

When AI confidence is low:
- "I'm not confident. Want to consult a specialist?"
- Match with verified expert network
- Expert responds
- AI learns from expert's input

---

# PART 17: WORKFLOW AUTOMATION

## 17.1 Custom Workflows

Let users define automated sequences:

```
Example: Monthly GST Compliance

Trigger: 5th of every month
    ↓
Step 1: Pull data from Tally
    ↓
Step 2: AI validates, flags discrepancies
    ↓
Step 3: Prepare GSTR-1 data
    ↓
Step 4: Reconcile with GSTR-2A/2B
    ↓
Step 5: Generate discrepancy report
    ↓
Step 6: Notify user
    ↓
Step 7: User approves
    ↓
Step 8: File (if API available)
    ↓
Step 9: Send confirmation to client
```

## 17.2 Template Workflows

Pre-built for common tasks:
- Monthly GST compliance
- Quarterly TDS filing
- Annual return preparation
- Notice response workflow

---

# PART 18: GOVERNMENT PORTAL CO-PILOT

## 18.1 Guided Navigation

"Help me file GSTR-3B"
```
AI: "I'll guide you step by step.

Step 1: Login to GST portal (you do this)
[User confirms]

Step 2: Navigate to Returns → GSTR-3B
[Shows screenshot]

Step 3: Verify pre-filled values:
- 3.1(a): ₹X [Matches my calculation ✓]
- 3.1(b): ₹Y [DISCREPANCY ⚠️]

Would you like me to explain the discrepancy?"
```

## 18.2 Error Resolution

"I'm getting error RET191145"
```
AI: "Error RET191145 means 'Invoice already reported.'

This usually happens when:
1. Duplicate invoice number
2. Amendment filed twice

Let me check your data...

Found it: Invoice #1234 appears in both January 
and February GSTR-1. 

Solution: File amendment to remove from February.
Want me to prepare the amendment data?"
```

---

# PART 19: PLATFORM & ECOSYSTEM (KaaS)

## 19.1 MakeMyAI as a Service

Let others build on your infrastructure:

### Knowledge API
- Access curated legal knowledge
- Pay per query
- For: LegalTech startups, FinTech apps

### Intelligence API
- Use domain-specific AI models
- Pay per token
- For: Developers building tax/legal features

### Workflow API
- Embed compliance workflows
- Pay per transaction
- For: Accounting software, ERPs, Banks

### Marketplace
- Third-party extensions
- Revenue share model
- For: Developers, consultants

## 19.2 Copilot Integrations

Embed MakeMyAI where work happens:
- Excel add-in
- Gmail/Outlook extension
- Tally plugin
- WhatsApp bot
- Browser extension for gov portals

---

# PART 20: SECURITY & COMPLIANCE

## 20.1 Security

- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Row Level Security (Supabase RLS)
- User-specific encryption keys
- MFA support
- API key scopes
- Rate limiting

## 20.2 Compliance

- GDPR ready (data export, deletion)
- India DPDP Act ready
- SOC 2 Type II target
- ISO 27001 target
- 7-year audit log retention
- Tamper-evident logging

---

# PART 21: ANALYTICS & CUSTOMER SUCCESS

## 21.1 Track User Outcomes

Not just your metrics — their success:
- Tax saved (calculated from advice)
- Penalties avoided
- Time saved
- Compliance score improvement

## 21.2 Customer Success Dashboard

```
Your MakeMyAI Impact (Last 12 Months):

💰 Tax Optimized: ₹23,45,000
⚠️ Penalties Avoided: ₹1,23,000
⏰ Time Saved: ~340 hours
📊 Compliance Score: 94/100 (up from 78)
✅ Notices Resolved: 12/12 (100% success)

"You've saved your clients 10x what you paid."
```

## 21.3 Proactive Success AI

- Monitor usage patterns
- Detect declining engagement
- Suggest relevant features
- Prevent churn proactively

---

# PART 22: API SPECIFICATIONS

## 22.1 External API

```
Authentication:
- API key in header: Authorization: Bearer <key>
- Scopes: read, write, admin

Endpoints:

POST /v1/query
- query: string
- conversation_id: string (optional)
- include_sources: boolean
→ Returns: answer, confidence, sources, suggested_actions

GET /v1/conversations
POST /v1/conversations
GET /v1/conversations/{id}
DELETE /v1/conversations/{id}

POST /v1/documents
GET /v1/documents
GET /v1/documents/{id}
DELETE /v1/documents/{id}

POST /v1/actions/email
POST /v1/actions/export
POST /v1/actions/calendar

Rate Limits:
- Free: 10/min, 100/day
- Pro: 60/min, 1000/day
- Enterprise: Custom
```

## 22.2 Webhooks

Events:
- query.completed
- document.processed
- subscription.created/updated/canceled
- payment.succeeded/failed
- deadline.approaching

---

# PART 23: IMPLEMENTATION ROADMAP

## Phase 1: Foundation (Months 1-3)
- [ ] Supabase setup with schema
- [ ] Basic auth flow
- [ ] Model abstraction layer
- [ ] Basic RAG pipeline
- [ ] Mobile app skeleton
- [ ] Admin dashboard skeleton

## Phase 2: Core Product (Months 4-6)
- [ ] Full product factory
- [ ] Complete chat interface
- [ ] Document upload & processing
- [ ] Action layer (email, PDF)
- [ ] Billing integration
- [ ] First product launch (GST AI)

## Phase 3: Intelligence (Months 7-9)
- [ ] 4-tier RAG refinement
- [ ] Confidence scoring
- [ ] Reasoning transparency
- [ ] Regulatory surveillance
- [ ] Voice input
- [ ] Second product launch

## Phase 4: Advanced (Months 10-12)
- [ ] Predictive intelligence
- [ ] Workflow automation
- [ ] Team collaboration
- [ ] Natural language actions
- [ ] Portal co-pilot
- [ ] Platform APIs

---

# PART 24: SUCCESS METRICS

## Technical
| Metric | Target |
|--------|--------|
| Uptime | 99.9% |
| Response Time (P95) | < 3s |
| Query Success Rate | > 98% |
| Error Rate | < 0.1% |

## Quality
| Metric | Target |
|--------|--------|
| Answer Accuracy | > 95% |
| Hallucination Rate | < 1% |
| Citation Accuracy | > 98% |
| User Satisfaction | > 4.5/5 |

## Business
| Metric | Target |
|--------|--------|
| MoM Growth | > 30% |
| Monthly Churn | < 5% |
| Free to Paid | > 10% |
| NPS | > 50 |

---

# PART 25: FINAL NOTES

## What Makes This Unbeatable

1. **Knowledge Moat** — Years to replicate curated legal knowledge
2. **Network Effects** — Each user makes it better for all
3. **Workflow Lock-in** — Once integrated, switching is painful
4. **Trust** — Verification systems build confidence
5. **Self-Evolution** — Gets smarter automatically
6. **Platform** — Others build on your infrastructure

## The 10-Year Vision

- Year 1: Best AI for Indian tax professionals
- Year 2: Platform for all Indian compliance
- Year 3: Expand to UAE, UK, Singapore
- Year 5: Global compliance infrastructure
- Year 10: Operating system for professional services

---

**This document is the complete specification.**

**Build exactly this. Nothing more, nothing less.**

**Then iterate based on user feedback.**

---

END OF DOCUMENT

---

# PART 26: OKSE SYSTEM SPECIFICATION (Omniscient Knowledge Synthesis Engine)

## 26.1 Goal
Create a search engine capable of competing with Perplexity.ai by fusing internal curated knowledge (Phase 1) with real-time web data (Phase 2), governed by a Corrective RAG (CRAG) system.

## 26.2 Core Components

### 1. Trusted Web Sources
- **Database:** 	rusted_web_sources
- **Function:** Define domains (e.g., cleartax.in, gst.gov.in) with high authority.
- **Crawler:** web-crawler.ts fetches and chunks content for vector search.

### 2. Live Web Search (Serper.dev)
- **Primary Provider:** Serper.dev (Google Search API wrapper).
- **Fallback:** Direct scraping of trusted domains.
- **Smart Caching:** 
  - 24-hour TTL for standard queries.
  - 2-hour TTL for 'official' government sources.
- **Logic:**
  1. Check Semantic Cache.
  2. If miss, check Internal KB.
  3. If Internal KB confidence < threshold OR CRAG verdict = 'IRRELEVANT', trigger Live Web Search.
  4. Fuse Internal + Web results.

### 3. Knowledge Fusion
- **Algorithm:** Reciprocal Rank Fusion (RRF) to combine:
  - Vector Similarity (Semantic)
  - BM25 (Keyword)
  - Authority Score (Government > Professional > Blog)
- **Output:** A unified list of citations.

## 26.3 Architecture

\\\
User Query
    
    
[Query Complexity Router]
    
     SIMPLE: Semantic Cache -> KB Only
    
     COMPLEX: KB + Live Web Search (Serper)
    
    
[Knowledge Fusion]
     (Merges KB chunks + Web snippets)
    
    
[CRAG Evaluator]
     (Is context relevant?)
    
     YES -> Generate Answer
    
     NO -> Trigger Deep Web Search -> Generate Answer
\\\

