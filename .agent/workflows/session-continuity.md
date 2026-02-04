---
description: How to end a session and ensure continuity for the next AI assistant
---

# End Session & Ensure Continuity

Follow these steps before ending a session to ensure the next AI can continue seamlessly.

## Step 1: Update Project State

Ask the AI to update the project state file:

```
"Update .agent/PROJECT_STATE.md with everything we accomplished in this session"
```

## Step 2: Create Session Summary

Ask the AI to create a session summary log:

```
"Create a session summary in .agent/sessions/ with today's date"
```

## Step 3: Note the Session ID

The current session logs are automatically saved at:
```
C:\Users\User\.gemini\antigravity\brain\<session-id>\.system_generated\logs\
```

Copy the session ID from the antigravity brain folder for reference.

---

# Starting a New Session

Use this prompt to start a new session with full context:

```
I'm continuing development on Karr AI. Please read these files to understand the project:

1. `.agent/PROJECT_STATE.md` - Current progress and quick reference
2. `.agent/KARR_AI_SPECIFICATION.md` - Complete 25-part specification
3. `.agent/sessions/` - Recent session summaries (if any)

Project location: d:\Tohund Guide\Tohund Guide\Softwares\KarrAi.Global

Previous session logs (optional): C:\Users\User\.gemini\antigravity\brain\<session-id>\.system_generated\logs\

After reading, continue from where we left off.
```

---

# Quick Reference

## Key Files
- **Specification:** `.agent/KARR_AI_SPECIFICATION.md`
- **Current State:** `.agent/PROJECT_STATE.md`
- **Session Logs:** `.agent/sessions/YYYY-MM-DD.md`
- **Antigravity Logs:** `C:\Users\User\.gemini\antigravity\brain\<session-id>\`

## Dev Server
```powershell
cd "d:\Tohund Guide\Tohund Guide\Softwares\KarrAi.Global\apps\web"
npx next dev
```

## URLs
- App: http://localhost:3000
- Chat: http://localhost:3000/chat
- Admin: http://localhost:3000/admin
