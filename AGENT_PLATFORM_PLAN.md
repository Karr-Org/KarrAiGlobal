# 🚀 KarrAI Agent Platform — Master Plan

## The Vision

Transform KarrAI from a "knowledge-base chatbot builder" into a **full-stack AI Agent Infrastructure Platform** — where creators build intelligent, brand-aware agents that deploy everywhere, learn continuously, and act autonomously.

**Think:** Intercom's AI + Custom GPTs + Voiceflow + Botpress — unified, simpler, and 10x more powerful.

---

## What We Have Today

| Feature | Status |
|---------|--------|
| Creator Portal (Products, KBs) | ✅ Built |
| Document Upload + RAG Pipeline | ✅ Built |
| Product Auth (Login/Signup/Google) | ✅ Built |
| Product Chat (Gemini + RAG) | ✅ Built |
| Web Sources (trusted domains) | ✅ Schema exists |
| Payments (Razorpay/Stripe) | ✅ Built |
| Social Media (Facebook) | ✅ Built |
| Cognitive Profile System | ✅ Built |

## What's Missing (The Opportunity)

| Feature | Impact | Difficulty |
|---------|--------|-----------|
| Agent Persona & Behavior System | 🔴 Critical | Medium |
| Embeddable Chat Widget | 🔴 Critical | Medium |
| Website Crawler (Auto-Learning) | 🔴 Critical | Hard |
| WhatsApp Integration | 🟠 High | Medium |
| Conversation Memory | 🟠 High | Medium |
| Actions & Function Calling | 🟠 High | Hard |
| Analytics Dashboard | 🟡 Medium | Medium |
| Multi-Model Support | 🟡 Medium | Easy |
| Human Handoff | 🟡 Medium | Medium |

---

## 🏗 Architecture: The Agent Stack

```
┌─────────────────────────────────────────────────────────┐
│                    DEPLOYMENT CHANNELS                    │
│  Website Widget │ WhatsApp │ Telegram │ Slack │ API/SDK  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   AGENT RUNTIME ENGINE                    │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌───────────┐ │
│  │ Persona  │ │ Knowledge │ │ Actions  │ │  Memory   │ │
│  │ System   │ │ Retrieval │ │ Engine   │ │  System   │ │
│  └──────────┘ └───────────┘ └──────────┘ └───────────┘ │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌───────────┐ │
│  │ Guard    │ │ Multi-LLM │ │ Context  │ │ Analytics │ │
│  │ Rails    │ │ Router    │ │ Fusion   │ │ Tracker   │ │
│  └──────────┘ └───────────┘ └──────────┘ └───────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                  KNOWLEDGE LAYER                          │
│  Documents (RAG) │ Website Crawl │ Live APIs │ Q&A Pairs │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Agent Identity & Persona System 🎭

**Goal:** Every product becomes a living agent with personality, not just a Q&A bot.
**Timeline:** 1-2 weeks

### 1.1 Persona Configuration

The creator configures WHO the agent IS — its personality, constraints, and behavior.

**Database Schema:**

```sql
-- New table: agent_persona
CREATE TABLE agent_persona (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    -- Identity
    agent_name TEXT NOT NULL,           -- "TaxBot", "Dr. Maya"
    agent_role TEXT,                     -- "Senior Tax Consultant"
    organization_name TEXT,             -- "Shah & Associates"
    avatar_url TEXT,                     -- Custom avatar
    
    -- Personality
    tone TEXT DEFAULT 'professional',   -- professional, friendly, casual, academic, witty
    formality_level INT DEFAULT 7,      -- 1=very casual, 10=very formal
    verbosity TEXT DEFAULT 'balanced',  -- concise, balanced, detailed
    emoji_usage TEXT DEFAULT 'minimal', -- none, minimal, moderate, heavy
    
    -- Behavior
    system_instructions TEXT,           -- Free-form instructions (like CustomGPT)
    greeting_message TEXT,              -- First message when user opens chat
    fallback_message TEXT,              -- When agent can't answer
    handoff_message TEXT,               -- When escalating to human
    
    -- Guardrails
    allowed_topics TEXT[],              -- Topics agent CAN discuss
    blocked_topics TEXT[],              -- Topics agent must REFUSE
    blocked_keywords TEXT[],            -- Words/phrases to never use
    max_response_length INT DEFAULT 500,-- Token limit per response
    
    -- Language
    primary_language TEXT DEFAULT 'en', -- Main language
    supported_languages TEXT[],         -- Auto-detect & respond in these
    
    -- Knowledge behavior
    cite_sources BOOLEAN DEFAULT TRUE,          -- Show "Sources: ..." 
    admit_uncertainty BOOLEAN DEFAULT TRUE,     -- Say "I'm not sure" vs making up
    web_search_enabled BOOLEAN DEFAULT FALSE,   -- Can search the web
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.2 Persona Builder UI (Creator Portal)

A rich, intuitive UI where creators define their agent's DNA:

```
┌─────────────────────────────────────────────────────────┐
│ 🎭 Agent Persona                                        │
│                                                          │
│  Agent Name: [Dr. TaxBot_____]                          │
│  Role:       [Senior Tax Consultant]                    │
│  Org:        [Shah & Associates, Mumbai]                │
│  Avatar:     [📷 Upload] or [🎨 Generate]               │
│                                                          │
│ ─── Personality ──────────────────────────────────────── │
│  Tone:      ○ Formal  ● Professional  ○ Friendly        │
│  Detail:    ○ Concise ● Balanced      ○ Detailed        │
│  Emoji:     ● None    ○ Minimal       ○ Moderate        │
│                                                          │
│ ─── Custom Instructions ──────────────────────────────── │
│  ┌─────────────────────────────────────────────────┐    │
│  │ You are Dr. TaxBot, a tax expert specializing   │    │
│  │ in Indian Income Tax. Always cite the specific  │    │
│  │ section number. If asked about GST, redirect    │    │
│  │ to our GST product. Never give investment       │    │
│  │ advice. Always add a disclaimer that this is    │    │
│  │ AI-generated and not legal advice.              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│ ─── Greeting ──────────────────────────────────────────  │
│  "Namaste! I'm Dr. TaxBot, your AI tax consultant.     │
│   Ask me anything about Indian Income Tax."              │
│                                                          │
│ ─── Guardrails ────────────────────────────────────────  │
│  Blocked Topics: [investment advice] [stock tips] [+]   │
│  Blocked Words:  [guaranteed] [100% safe] [+]           │
│                                                          │
│  [💬 Test Agent]                    [Save Persona]       │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Persona → System Prompt Engine

The persona config auto-generates a rich system prompt injected into every LLM call:

```typescript
function buildSystemPrompt(persona: AgentPersona, kbContext: string): string {
    return `
You are ${persona.agent_name}, ${persona.agent_role} at ${persona.organization_name}.

## Your Personality
- Tone: ${persona.tone}
- Detail level: ${persona.verbosity}
- ${persona.emoji_usage === 'none' ? 'Never use emojis.' : ''}
- ${persona.admit_uncertainty ? 'If unsure, say "I\'m not sure about this, let me check" rather than guessing.' : ''}
- ${persona.cite_sources ? 'Always cite the source document when referencing knowledge base content.' : ''}

## Your Instructions
${persona.system_instructions}

## Guardrails
${persona.blocked_topics?.length ? `NEVER discuss: ${persona.blocked_topics.join(', ')}` : ''}
${persona.blocked_keywords?.length ? `NEVER use these words: ${persona.blocked_keywords.join(', ')}` : ''}
${persona.fallback_message ? `If you cannot answer, say: "${persona.fallback_message}"` : ''}

## Your Knowledge
${kbContext}
`.trim();
}
```

---

## Phase 2: Embeddable Chat Widget 💬

**Goal:** Any website gets an AI agent with one `<script>` tag.
**Timeline:** 1-2 weeks

### 2.1 Widget Architecture

```
Creator's Website                      KarrAI Server
┌─────────────────┐                   ┌──────────────┐
│                 │                   │              │
│  <script src=   │                   │  /api/widget │
│  "karrAI.js"    │ ◄──── iframe ──── │  /chat       │
│  data-agent=    │                   │              │
│  "taxai" />     │                   │  WebSocket / │
│                 │ ◄──── SSE ──────  │  SSE stream  │
│  ┌────────────┐ │                   │              │
│  │ 💬 Chat    │ │                   └──────────────┘
│  │ Widget     │ │
│  └────────────┘ │
└─────────────────┘
```

### 2.2 Embed Code (One Line)

```html
<!-- Add to any website -->
<script 
    src="https://app.karrai.com/widget.js" 
    data-agent="taxai"
    data-theme="dark"
    data-position="bottom-right"
    data-primary-color="#c4715b"
    async>
</script>
```

### 2.3 Widget Features

- **Floating button** (bottom-right, customizable position)
- **Chat window** (iframe-based, XSS-safe)
- **Streaming responses** (SSE for real-time typing effect)
- **File upload** (drag & drop documents into chat)
- **Rich messages** (markdown, links, images, cards)
- **Typing indicator**
- **Sound notifications**
- **Mobile responsive** (full-screen on mobile)
- **Branding** (creator's colors, logo, name)
- **Pre-chat form** (optional: ask name/email before chat)
- **Powered by KarrAI** badge (removable on paid plans)

### 2.4 Widget Customization (Creator Portal)

```
┌─────────────────────────────────────────────────────────┐
│ 🔌 Deploy Widget                                        │
│                                                          │
│  Position:  ○ Bottom-Right  ○ Bottom-Left               │
│  Theme:     ○ Light  ● Dark  ○ Match Site               │
│  Size:      ○ Small  ● Medium  ○ Large                  │
│                                                          │
│  Button Icon:  [💬 Default] [🤖 Robot] [? Help] [Custom]│
│  Button Text:  [Ask TaxBot_______]                      │
│                                                          │
│  Pre-chat:  ☑ Ask for name  ☐ Ask for email             │
│  Badge:     ☑ Show "Powered by KarrAI"                  │
│                                                          │
│ ─── Embed Code ────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ <script src="https://app.karrai.com/widget.js"  │ 📋 │
│  │   data-agent="taxai" async></script>             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  [Preview Widget]                                        │
└─────────────────────────────────────────────────────────┘
```

### 2.5 Database Schema

```sql
CREATE TABLE widget_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    -- Appearance
    position TEXT DEFAULT 'bottom-right',    -- bottom-right, bottom-left
    theme TEXT DEFAULT 'auto',               -- light, dark, auto
    primary_color TEXT,                       -- Override product color
    button_icon TEXT DEFAULT 'chat',         -- chat, robot, help, custom
    button_text TEXT,                         -- "Ask TaxBot"
    custom_css TEXT,                          -- Advanced: inject CSS
    
    -- Behavior
    auto_open_delay_ms INT,                  -- Auto-open after X ms (null = never)
    pre_chat_fields JSONB DEFAULT '[]',      -- ['name', 'email', 'phone']
    show_badge BOOLEAN DEFAULT TRUE,         -- "Powered by KarrAI"
    
    -- Allowed domains (CORS security)
    allowed_domains TEXT[] DEFAULT '{}',      -- Empty = allow all
    
    -- Rate limiting
    max_messages_per_session INT DEFAULT 50,
    max_sessions_per_day INT DEFAULT 1000,
    
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Phase 3: Website Crawler (Organization Learning) 🕷️

**Goal:** Agent continuously learns from the org's website — pricing, team, services, blog, FAQ.
**Timeline:** 2-3 weeks

### 3.1 How It Works

```
Creator enters: shahassociates.com
        │
        ▼
┌─────────────────┐
│ Sitemap Discovery│ → robots.txt, sitemap.xml
└────────┬────────┘
         │
┌────────▼────────┐
│ Smart Crawler    │ → Respects rate limits, extracts clean text  
│ (Puppeteer/      │ → Handles JS-rendered pages
│  Cheerio)         │ → Ignores nav, footer, cookie banners
└────────┬────────┘
         │
┌────────▼────────┐
│ Content Processor│ → Chunks text, generates embeddings
│ (Same RAG pipe)  │ → Tags with source URL, page title
└────────┬────────┘
         │
┌────────▼────────┐
│ Scheduled Recrawl│ → Daily/weekly, diff-based (only changed pages)
└─────────────────┘
```

### 3.2 This is DIFFERENT from Knowledge Base

| | Knowledge Base | Website Learning |
|---|---|---|
| **Input** | Uploaded documents | Live website URL |
| **Updates** | Manual re-upload | Auto-crawl on schedule |
| **Purpose** | Deep domain expertise | Organization context |
| **Content** | Textbooks, manuals, policies | About us, services, pricing, team, FAQ |
| **Gives agent...** | Expert knowledge | Organizational persona & context |

### 3.3 Crawl Configuration UI

```
┌─────────────────────────────────────────────────────────┐
│ 🌐 Website Learning                                     │
│                                                          │
│  Website URL: [https://shahassociates.com____]  [Crawl] │
│                                                          │
│  Crawl Status: ✅ 47 pages indexed (last: 2 hours ago) │
│  Next crawl: Tomorrow 3:00 AM                           │
│                                                          │
│ ─── Crawl Settings ───────────────────────────────────── │
│  Frequency:  ○ Daily  ● Weekly  ○ Monthly               │
│  Max pages:  [100__]                                     │
│  Max depth:  [3_]                                        │
│                                                          │
│ ─── Include/Exclude ──────────────────────────────────── │
│  Include: /services/*, /about, /pricing, /blog/*         │
│  Exclude: /admin/*, /login, /cart/*                      │
│                                                          │
│ ─── Crawled Pages ─────────────────────────────────────  │
│  ✅ /about-us                    1,234 chars  │ [View]  │
│  ✅ /services/tax-consulting     2,891 chars  │ [View]  │
│  ✅ /services/audit              1,567 chars  │ [View]  │
│  ✅ /team                        3,201 chars  │ [View]  │
│  ✅ /pricing                       890 chars  │ [View]  │
│  ✅ /blog/budget-2025            4,521 chars  │ [View]  │
│  ⏳ /blog/gst-updates           Pending...    │         │
│                                                          │
│  [Re-crawl Now]  [Clear All]                             │
└─────────────────────────────────────────────────────────┘
```

### 3.4 Database Schema

```sql
CREATE TABLE website_crawls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    -- Configuration
    base_url TEXT NOT NULL,
    crawl_frequency TEXT DEFAULT 'weekly',     -- daily, weekly, monthly
    max_pages INT DEFAULT 100,
    max_depth INT DEFAULT 3,
    include_patterns TEXT[] DEFAULT '{/*}',
    exclude_patterns TEXT[] DEFAULT '{/admin/*, /login*}',
    
    -- Status
    status TEXT DEFAULT 'pending',             -- pending, crawling, completed, error
    last_crawl_at TIMESTAMPTZ,
    next_crawl_at TIMESTAMPTZ,
    pages_crawled INT DEFAULT 0,
    total_chars INT DEFAULT 0,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE crawled_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crawl_id UUID REFERENCES website_crawls(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    url TEXT NOT NULL,
    page_title TEXT,
    content_text TEXT,             -- Extracted clean text
    content_hash TEXT,             -- For diff-based recrawling
    char_count INT,
    status TEXT DEFAULT 'pending', -- pending, indexed, error, unchanged
    
    crawled_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(crawl_id, url)
);
-- Crawled page chunks go into the SAME knowledge_chunks table
-- with source_type = 'website' to distinguish from documents
```

---

## Phase 4: Multi-Channel Deployment 📱

**Goal:** Same agent, everywhere.
**Timeline:** 2-4 weeks per channel

### 4.1 Channel Architecture

```sql
CREATE TABLE agent_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    channel_type TEXT NOT NULL,      -- 'widget', 'whatsapp', 'telegram', 'slack', 'api'
    is_active BOOLEAN DEFAULT FALSE,
    
    -- Channel-specific config (JSON)
    config JSONB DEFAULT '{}',
    -- WhatsApp: { phone_number_id, access_token, verify_token }
    -- Telegram: { bot_token }
    -- Slack: { bot_token, signing_secret }
    -- API: { api_key }
    
    -- Stats
    total_conversations INT DEFAULT 0,
    total_messages INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.2 WhatsApp Integration (via Cloud API)

```
User sends WhatsApp → Meta Webhook → /api/channels/whatsapp
        │
        ▼
┌──────────────────┐
│ Message Router   │ → Identifies product by phone number
│                  │ → Loads persona + knowledge
│                  │ → Generates response via Agent Runtime
│                  │ → Sends reply via WhatsApp Cloud API
└──────────────────┘
```

### 4.3 Telegram Bot

```
User sends Telegram → Telegram Webhook → /api/channels/telegram  
        │
        ▼
    Same Agent Runtime → Response → Telegram sendMessage API
```

### 4.4 REST API (Headless)

For developers who want to build custom integrations:

```bash
# Send a message to the agent
POST https://api.karrai.com/v1/agents/taxai/chat
Authorization: Bearer sk_live_xxx
Content-Type: application/json

{
    "message": "What is Section 80C?",
    "session_id": "user_123",
    "stream": true
}
```

---

## Phase 5: Conversation Memory & Intelligence 🧠

**Goal:** Agent remembers users across sessions, learns from conversations.
**Timeline:** 2 weeks

### 5.1 Memory Levels

```
Level 1: Session Memory (within one chat)
  → Current conversation context (already exists)

Level 2: User Memory (across chats)
  → "This user always asks about Section 80C"
  → "User is a salaried individual in Mumbai"
  → "User prefers Hindi explanations"

Level 3: Organization Memory (across all users)
  → "FAQs: 30% of users ask about Section 80C"
  → "Peak traffic: 6-8 PM IST"
  → "Users from Maharashtra ask about stamp duty"
```

### 5.2 Database Schema

```sql
CREATE TABLE user_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    user_id UUID,                          -- Can be anonymous
    session_id TEXT,                        -- For anonymous users
    
    memory_type TEXT,                       -- 'preference', 'fact', 'context'
    memory_key TEXT,                        -- 'tax_filing_status', 'preferred_language'
    memory_value TEXT,                      -- 'salaried', 'hindi'
    confidence FLOAT DEFAULT 0.8,
    
    source TEXT,                            -- 'explicit' (user said it) or 'inferred'
    
    created_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Phase 6: Actions & Function Calling ⚡

**Goal:** Agents don't just answer — they DO things.
**Timeline:** 3-4 weeks

### 6.1 Built-in Actions

| Action | Description |
|--------|-------------|
| 📧 Send Email | Agent sends email via Resend |
| 📅 Book Appointment | Calendly/Cal.com integration |
| 📝 Create Ticket | Support ticket in Zendesk/Freshdesk |
| 💰 Collect Payment | Razorpay/Stripe payment link |
| 📋 Fill Form | Collect structured data from user |
| 🔗 API Call | Custom webhook to any URL |
| 📊 Query Database | Read-only SQL against connected DB |
| 🔄 CRM Update | Push data to HubSpot/Salesforce |

### 6.2 Custom Actions (Creator-Defined)

```
┌─────────────────────────────────────────────────────────┐
│ ⚡ Custom Action: Check Tax Status                      │
│                                                          │
│  Trigger: When user asks about their tax filing status  │
│                                                          │
│  API: POST https://api.shah.com/check-status             │
│  Headers: Authorization: Bearer {{API_KEY}}              │
│  Body: { "pan": "{{user.pan_number}}" }                 │
│                                                          │
│  Response Template:                                      │
│  "Your tax return for AY {{response.year}} is            │
│   {{response.status}}. Filed on {{response.date}}."     │
│                                                          │
│  [Test Action]  [Save]                                   │
└─────────────────────────────────────────────────────────┘
```

### 6.3 Function Calling Schema

```sql
CREATE TABLE agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,              -- 'check_tax_status'
    display_name TEXT NOT NULL,      -- 'Check Tax Status'
    description TEXT,                -- For LLM: when to use this action
    
    -- Function definition (OpenAI function calling format)
    parameters JSONB,               -- JSON Schema for parameters
    
    -- Execution
    action_type TEXT NOT NULL,       -- 'webhook', 'email', 'payment', 'form'
    config JSONB NOT NULL,           -- Action-specific config
    
    -- Response
    response_template TEXT,          -- Handlebars template for formatting response
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Phase 7: Analytics & Insights 📊

**Goal:** Creators understand how their agent performs and improve it.
**Timeline:** 2 weeks

### 7.1 Creator Analytics Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ 📊 TaxAi Analytics                    Last 30 days ▼   │
│                                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│  │  1,247 │ │   89%  │ │  4.2/5 │ │  3.2s  │           │
│  │  Chats │ │ Resolved│ │ Rating │ │Avg Resp│           │
│  │ ↑ 23%  │ │ ↑ 5%   │ │ ↑ 0.3  │ │ ↓ 0.8s │          │
│  └────────┘ └────────┘ └────────┘ └────────┘           │
│                                                          │
│  ─── Top Questions ──────────────────────────────────── │
│  1. "What is Section 80C deduction limit?" (127 times)  │
│  2. "How to file ITR online?" (89 times)                │
│  3. "New tax regime vs old" (76 times)                  │
│  4. "HRA exemption calculation" (52 times)              │
│                                                          │
│  ─── Unanswered Questions ───────────────────────────── │
│  ⚠️ "Can I claim WFH expenses?" (14 times)              │
│     → [Add to Knowledge Base]                           │
│  ⚠️ "What about crypto tax?" (8 times)                   │
│     → [Add to Knowledge Base]                           │
│                                                          │
│  ─── Channel Breakdown ──────────────────────────────── │
│  Website Widget: 67%  │  WhatsApp: 28%  │  API: 5%     │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Conversation Review

- View full conversation transcripts
- Flag/star important conversations
- Add internal notes
- Thumbs up/down individual responses
- Corrections feed back into training

---

## Phase 8: Human Handoff & Live Chat 🤝

**Goal:** Seamless transition from AI to human when needed.
**Timeline:** 2 weeks

### 8.1 Escalation Triggers

- User explicitly asks for human
- Sentiment drops below threshold
- Agent confidence is low
- Sensitive topics detected
- N consecutive "I don't know" responses

### 8.2 Team Inbox

```
┌─────────────────────────────────────────────────────────┐
│ 🤝 Live Conversations                    3 waiting     │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 🔴 Rajesh Kumar         WhatsApp    2 min ago     │  │
│  │    "I need to speak to a real person about..."    │  │
│  ├───────────────────────────────────────────────────┤  │
│  │ 🟡 Priya Singh          Widget      5 min ago     │  │
│  │    "The AI couldn't help with my NRI taxation..." │  │
│  ├───────────────────────────────────────────────────┤  │
│  │ 🟢 Anonymous User       Widget      12 min ago    │  │
│  │    [AI summary: Asked about capital gains,        │  │
│  │     confused about holding period calculation]    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  [Take Over]  [Assign to Team]  [Send AI Summary]      │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 9: Multi-Model Intelligence 🤖

**Goal:** Best model for each task, automatic fallbacks.
**Timeline:** 1 week

```typescript
const MODEL_ROUTER = {
    // Simple Q&A → Fast, cheap model
    simple: { model: 'gemini-2.0-flash', provider: 'google' },
    
    // Complex reasoning → Powerful model
    complex: { model: 'gpt-4o', provider: 'openai' },
    
    // Code generation → Specialized model
    code: { model: 'claude-3.5-sonnet', provider: 'anthropic' },
    
    // Embeddings → Dedicated embedding model
    embeddings: { model: 'text-embedding-004', provider: 'google' },
    
    // Fallback chain
    fallback: ['gemini-2.0-flash', 'gpt-4o-mini', 'claude-3-haiku'],
};
```

---

## Phased Implementation Roadmap

### 🏃 Sprint 1 (This Week): Foundation

- [ ] **Persona System** — DB schema + Persona Builder UI + System prompt engine
- [ ] **Fix chat to use persona** — Inject persona into every LLM call

### 🏃 Sprint 2 (Next Week): Widget

- [ ] **Embeddable Widget** — `widget.js` + iframe chat + streaming
- [ ] **Widget Config UI** — Customization + embed code generator

### 🏃 Sprint 3: Website Learning

- [ ] **Crawler Engine** — Sitemap discovery + page extraction + chunking
- [ ] **Crawl UI** — Configuration + status + page viewer
- [ ] **Scheduled Re-crawls** — Cron/Edge Function for periodic updates

### 🏃 Sprint 4: Channels

- [ ] **WhatsApp Cloud API** — Webhook handler + message routing
- [ ] **Telegram Bot** — Bot creation flow + webhook
- [ ] **REST API** — Public API with API keys

### 🏃 Sprint 5: Intelligence

- [ ] **User Memory** — Cross-session memory extraction
- [ ] **Analytics Dashboard** — Conversation metrics + top questions
- [ ] **Human Handoff** — Escalation triggers + team inbox

### 🏃 Sprint 6: Actions

- [ ] **Built-in Actions** — Email, appointment, payment
- [ ] **Custom Actions** — Webhook builder UI
- [ ] **Function Calling** — LLM tool definitions

---

## Competitive Advantage: What Makes This WORLD-CLASS

| Feature | Intercom | ChatBot.com | CustomGPT | **KarrAI** |
|---------|----------|-------------|-----------|------------|
| RAG Pipeline | ❌ | Basic | ✅ | ✅ Advanced (Contextual) |
| Website Learning | ❌ | ❌ | URL only | ✅ Full crawler + auto-update |
| Persona System | Basic | ❌ | Basic | ✅ Rich config + guardrails |
| Multi-channel | ✅ | Partial | ❌ | ✅ Widget + WhatsApp + Telegram + API |
| Function Calling | ✅ | ❌ | ❌ | ✅ Custom actions |
| Multi-model | ❌ | ❌ | GPT only | ✅ Gemini + GPT + Claude |
| Creator Economy | ❌ | ❌ | ❌ | ✅ Creators monetize their agents |
| Cognitive Profile | ❌ | ❌ | ❌ | ✅ User personality modeling |
| Indian Market | ❌ | ❌ | ❌ | ✅ UPI, WhatsApp, Hindi, Razorpay |

### The Killer Differentiator 🎯

**Creator Economy for AI Agents:** Anyone can build an expert AI agent, deploy it everywhere, and EARN from it. Tax consultants, doctors, lawyers, educators — they bring the expertise, KarrAI provides the infrastructure.

---

## What Should We Build FIRST?

I recommend starting with **Phase 1 (Persona System)** + **Phase 2 (Widget)** because:

1. Persona System makes agents actually useful (not generic)
2. Widget is the #1 deployment channel (every business has a website)
3. Together, they unlock the core value prop: "Build an AI agent, put it on your site in 5 minutes"

**Ready to start building?** Tell me which phase to tackle first, or if you want to adjust the plan.
