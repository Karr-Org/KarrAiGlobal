# OKSE AI Chat — Remediation Report

**Date:** Feb 2026  
**Scope:** Security hardening, prompt engineering, query routing, frontend, backend, session management  
**Status:** ✅ All 6 phases complete

---

## Phase 1: Prompt Engineering & Security ✅

### 1.1 Identity Protection (`conversation-intelligence.ts`)

- Added `IDENTITY_PROTECTION_BLOCK` constant with 4 critical rules:
  - **Identity**: Refuses to reveal model name (Gemini, GPT, Claude, etc.)
  - **Prompt Protection**: Refuses to repeat/reveal system instructions
  - **Anti-Jailbreak**: Resists DAN, developer mode, persona override attacks
  - **Conversational Handling**: Responds naturally to greetings without KB search

### 1.2 Prompt Hardening (`STRICT_MODE_PROMPT`, `EXTENDED_MODE_PROMPT`)

- Injected `IDENTITY_PROTECTION_BLOCK` into both primary system prompts
- Added explicit instructions for marking knowledge base context as authoritative
- Added conversational handling instructions

### 1.3 Widget API Hardening (`v1/chat/route.ts`)

- Injected `IDENTITY_PROTECTION_BLOCK` into widget system prompt
- Strengthened `blocked_topics` guardrails with strict refusal messages
- Added `sanitizeUserInput()` for incoming messages
- Implemented sliding-window rate limiting against `rate_limit_per_minute`

### 1.4 Input Sanitization Utility (`conversation-intelligence.ts`)

- `sanitizeUserInput()`: Strips 10+ common prompt injection patterns
  - "ignore previous instructions", "you are now DAN", system/assistant role injection,
    `<<SYS>>`, `[INST]`, developer mode, etc.
- `isConversationalQuery()`: Detects greetings, farewells, acks, meta-questions

---

## Phase 2: Query Router Optimization ✅

### 2.1 New `CONVERSATIONAL` Complexity Level (`types.ts`)

- Added `CONVERSATIONAL` to `QueryComplexityLevel` type
- Created pipeline config: all search/processing disabled, 200ms max response time

### 2.2 Rule-Based Detection (`query-router.ts`)

- Added **Rule 0** (highest priority) with 8 pattern groups:
  - Greetings, time-of-day greetings, casual greetings
  - Farewells, thank-yous, acknowledgments
  - Meta-questions about the AI, bare "help"
- 1.0 confidence → no LLM classification fallback

### 2.3 LLM Classification Update (`query-router.ts`)

- Added `CONVERSATIONAL` to the LLM classification prompt for edge cases
- Fixed `getEstimatedSources()` — added `CONVERSATIONAL: 0` and `default: 5`

### 2.4 Engine Short-Circuit (`engine.ts`)

- CONVERSATIONAL queries bypass ALL retrieval (KB, web, embeddings, CRAG, speculative drafting)
- Direct Gemini Flash response with `temperature: 0.8`, `maxOutputTokens: 300`
- Fallback to static "Hello!" message if Gemini call fails

---

## Phase 3: Chat Frontend Fixes ✅

### 3.1 ChatInterface Rewrite (`ChatInterface.tsx`)

- **Removed mock responses entirely** — all queries now go through `/api/chat/user`
- **Proper markdown rendering** — custom React components for:
  - Headings (##, ###), bold, italic, inline code, code blocks
  - Bullet/numbered lists, links, citation badges `[Source N]`
  - NO `dangerouslySetInnerHTML`
- **Dynamic props**: `productName`, `suggestedQueries`, `placeholder`, `welcomeMessage`
- **Error handling**: User-friendly messages for 429 (rate limit), 503 (overload), network errors
- **Session tracking**: Passes `sessionId` to API, stores returned session ID

### 3.2 GST AI Chat Page (`gst-ai/chat/page.tsx`)

- Now passes domain-specific `suggestedQueries`, `placeholder`, and `welcomeMessage`

### 3.3 Generic Chat Page (`chat/page.tsx`)

- Removed hardcoded GST questions — uses dynamic product name
- Added `ChatMarkdown` renderer with dark-theme styling
- Made placeholder text dynamic based on selected product

---

## Phase 4: Backend Fixes ✅

### 4.1 User Chat API (`api/chat/user/route.ts`)

- **Input sanitization**: Applied `sanitizeUserInput()` to incoming queries
- **Conversational detection**: `isConversationalQuery()` check before embedding generation
  - Conversational queries skip the embedding API call entirely (cost savings)
- **Web search guard**: Web search only triggers when `enableWebSearch=true` OR (KB empty AND query is substantive)
  - Greetings no longer trigger unnecessary Serper API calls

### 4.2 Main Chat API (`api/chat/route.ts`)

- **Error classification**: Replaced generic 500 with structured error codes:
  - `RATE_LIMITED` (429) — with `isWarning: true`
  - `SERVICE_OVERLOADED` (503) — with `isWarning: true`
  - `AUTH_ERROR` (500) — misconfigured API keys
  - `INTERNAL_ERROR` (500) — general fallback

### 4.3 Live Web Search (`live-web-search.ts`)

- **Removed hardcoded trusted domains fallback**: `DEFAULT_TRUSTED_DOMAINS` (cleartax.in, gst.gov.in, etc.)
  now only serves as documentation; the `getTrustedDomains()` function returns `[]` when no product-specific
  domains are configured, causing the safety check to refuse internet searches
- Products must explicitly configure their own trusted domains via Knowledge Sources → Trusted Web

---

## Phase 5: Session Management ✅

### 5.1 Race Condition Fix (`useCognitiveSession.ts`)

- Added `sessionInitializedRef` to prevent double initialization on React strict mode
- Initialization now properly sets `isLoading = true` so UI shows loading state
- `loadSession()` is now `await`ed during initialization — messages are fully loaded before session is ready
- Error recovery: `sessionInitializedRef` is reset on failure to allow retry

---

## Phase 6: Verification ✅

### TypeScript Compilation

- Zero TypeScript errors related to modified files
- Pre-existing `stripe` module import error in `payments/stripe.ts` (unrelated)

### Files Modified (13 total)

| File | Changes |
|------|---------|
| `conversation-intelligence.ts` | Identity protection, input sanitization, conversational detection |
| `okse/types.ts` | CONVERSATIONAL complexity level + pipeline config |
| `okse/query-router.ts` | Rule 0 conversational detection, LLM prompt update, getEstimatedSources fix |
| `okse/engine.ts` | Conversational short-circuit with direct Gemini response |
| `okse/live-web-search.ts` | Removed hardcoded domain fallback |
| `api/v1/chat/route.ts` | Rate limiting, input sanitization, prompt injection defense |
| `api/chat/route.ts` | Structured error classification |
| `api/chat/user/route.ts` | Input sanitization, conversational skip, web search guard |
| `components/chat/ChatInterface.tsx` | Full rewrite: real API, markdown, error handling |
| `app/gst-ai/chat/page.tsx` | Dynamic props |
| `app/chat/page.tsx` | Dynamic content, markdown renderer |
| `hooks/useCognitiveSession.ts` | Race condition fix |

---

## Security Summary

| Attack Vector | Mitigation |
|--------------|------------|
| Model identity probing | `IDENTITY_PROTECTION_BLOCK` in all prompts |
| Prompt injection | `sanitizeUserInput()` + prompt-level instructions |
| Jailbreaking (DAN, etc.) | Anti-jailbreak rules + input stripping |
| System prompt extraction | Explicit refusal instructions |
| Rate abuse | Sliding window rate limiter (widget API) |
| Uncontrolled web search | Domain restriction; requires explicit configuration |
| Session hijacking | Race condition fix prevents stale session state |

---

## Cost Optimization Summary

| Optimization | Savings |
|-------------|---------|
| Skip embedding for greetings | 1 Gemini API call per greeting |
| Skip KB search for conversational | 1-2 Supabase RPC calls per greeting |
| Skip web search for greetings | 1 Serper API call per greeting |
| CONVERSATIONAL short-circuit | Skips CRAG, speculative drafting, cache, fusion |
| **Estimated:** ~5-9 API calls saved per greeting/farewell message |
