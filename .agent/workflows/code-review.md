---
description: Multi-persona code review before marking any task complete
---

# Multi-Persona Code Review Workflow

Run this workflow after every feature/task completion, **before** marking any task as `[x]` in task.md.
Adopt each persona sequentially and critique the code from that perspective.

---

## Step 1: Full-Stack Architect Review

Adopt the persona of a **Senior Full-Stack Architect (15+ years, ex-Google/Stripe)**.
Review for:

- [ ] Separation of concerns (UI vs Logic vs Data)
- [ ] No business logic in components (must be in `/lib` or hooks)
- [ ] Proper error boundaries and error handling
- [ ] No hardcoded values (use constants/config)
- [ ] TypeScript strict mode — no `any` types
- [ ] Proper async/await patterns (no unhandled promises)
- [ ] Database queries are efficient (no N+1, proper indexes)

## Step 2: Security & DevOps Review

Adopt the persona of a **Security Engineer + DevOps Lead (OWASP certified)**.
Review for:

- [ ] No secrets in code (API keys, passwords)
- [ ] RLS policies cover every table (no data leaks between orgs)
- [ ] Input sanitization on all user inputs (SQL injection, XSS)
- [ ] Auth checks on every API route
- [ ] Rate limiting on sensitive endpoints
- [ ] Environment variables for all config
- [ ] Build passes without warnings

## Step 3: Accounting Domain Expert Review

Adopt the persona of a **Chartered Accountant / CPA with tech experience (acting as domain expert)**.
Review for:

- [ ] Journal entries balance (Dr = Cr) — test with real scenarios
- [ ] Correct account types used (Asset Dr increases, Liability Cr increases)
- [ ] Tax calculations are accurate (GST/VAT/Sales Tax rates)
- [ ] Financial statement line mapping is correct (`fs_line`)
- [ ] Immutability preserved (no UPDATE/DELETE on journal_entries)
- [ ] Period locking is enforced

> [!NOTE]
> Skip this step if the task has no accounting/financial logic.

## Step 4: UI/UX Designer Review

Adopt the persona of a **Senior Product Designer (ex-Figma/Stripe)**.
Review for:

- [ ] Claude-inspired minimalism maintained (no clutter, warm tones)
- [ ] Serif headings (Lora) + Sans body (Inter) consistently applied
- [ ] Mobile responsive (test at 375px width)
- [ ] Keyboard accessible (Tab navigation, Enter to submit)
- [ ] Loading states shown (skeleton, spinner)
- [ ] Error states shown (empty states, error messages with recovery action)
- [ ] Micro-interactions present (hover, focus, transitions)

## Step 5: Performance & Scale Review

Adopt the persona of a **Performance Engineer (Netflix-scale)**.
Review for:

- [ ] Components are lazy-loaded where appropriate
- [ ] No unnecessary re-renders (React.memo, useMemo where needed)
- [ ] Bundle size check (no massive library imports)
- [ ] Database queries use indexes
- [ ] Offline-first logic works (Dexie queue doesn't grow unbounded)

## Step 6: Automated Checks

// turbo-all
Run these commands:

// turbo

1. `npx tsc --noEmit` — TypeScript compilation (zero errors)
// turbo
2. `npx eslint . --max-warnings 0` — Lint (zero warnings)
// turbo
3. `npm run test` — Unit tests pass
// turbo
4. `npm run build` — Production build succeeds

## Step 7: Write Review Report

Create a brief review report in the walkthrough document listing:

- What was reviewed
- Issues found (with severity: 🔴 Critical / 🟡 Medium / 🟢 Minor)
- Fixes applied
- Final verdict: ✅ PASS or ❌ FAIL (fix before proceeding)

> [!CAUTION]
> Only after ALL steps pass, mark the task as `[x]` in task.md.
