# Relay layeR — Master Plan

> Last updated: 2026-02-09 (v0.2 — added Context & Token Economy)

## 1. Pipeline Columns

| Column | Description |
|--------|-------------|
| **INBOX** | Newly dropped tasks (via Broadcast or Bulut) |
| **ASSIGNED** | Assigned to an agent, not yet started |
| **IN PROGRESS** | Agent actively working |
| **REVIEW** | Awaiting quality review by Bulut |
| **DONE** | Completed locally, may be on a sub-branch |
| **BURAK** | Waiting for Burak's approval to merge/publish |
| **PUBLISHED** | Shipped to main/production |

Cards can move **backward** (e.g., REVIEW → IN PROGRESS on quality failure).

## 2. Authentication

### 3-Layer Security Flow

```
1. User visits relay.kukso.com
2. Enter PIN: 1881 (gateway — blocks bots, saves tokens)
3. Server sends 6-digit code to Burak's Telegram DM
4. 2-minute cooldown before new code can be generated
5. Rate limited: 3 failed attempts → 10 min lockout
6. On success: 24-hour session cookie (HttpOnly, Secure)
```

**Why PIN first?** Prevents scanners and bots from triggering Telegram messages. Zero cost until PIN is correct.

## 3. Event-Driven Architecture

- Agents emit structured JSON events (see EVENT_PROTOCOL.md)
- Dashboard subscribes via WebSocket — cards update in real-time
- Bulut (orchestrator) gets notified of significant state transitions
- No polling — the board reflects reality as it happens

### Loop Prevention

- Sub-task creation has a **max depth of 3**
- Circular dependency check: if a sub-task traces back to its ancestor, reject + flag in activity feed
- Agent cannot create tasks for themselves (must go through Bulut)

## 4. Task Creation

| Who | How |
|-----|-----|
| **Burak** | Broadcast button (PIN-protected) |
| **Bulut** | Direct creation during orchestration |
| **Other agents** | Request to Bulut → Bulut approves/rejects |

Bulut is the **final call** on all sub-task creation. Prevents runaway task generation.

## 5. Card Detail View

When clicking a card:
- **Header:** Title, assigned agent, project, priority, created/updated timestamps
- **Progress bar:** Visual percentage (agent-reported)
- **Log entries:** Timestamped structured entries (e.g., "Researching... → Draft written... → Tests passing...")
- **Sub-tasks:** Nested card list (if any)
- **Agent notes:** Freeform context left by the working agent
- **Metadata:** LLM model used, token count, estimated cost

## 6. Chat Viewer

- Sources: OpenClaw session transcripts (`sessions_send` / `sessions_history`)
- UI: Telegram-style — chat bubbles, agent avatars, timestamps
- Read-only observation mode
- Filterable by: project, agent pair, date range
- Telegram logo branding as requested

## 7. Sidebars

### Activity Sidebar (Left or Right, collapsible)
- Chronological feed of all events across the ecosystem
- Filterable by event type, agent, project
- Color-coded by severity (info, warning, error)

### Agents Sidebar (Left or Right, collapsible)
Each agent card shows:
- Avatar + Name
- Title & Tag (e.g., "Orchestrator · Lead")
- Description
- Skills (tag chips)
- LLM Model + Thinking Level
- Status: 🟢 Active / 🟡 Idle / 🔴 Offline
- Current task (if any, linked)
- Lifetime tasks completed

## 8. Statistics Panel

- **Tasks completed per agent per week** (bar chart)
- **LLM cost tracking** — per agent + total (token usage × model pricing)
- **Pipeline flow** — average time in each stage
- **Completion rate** — % of tasks that reach PUBLISHED
- Global view (not per-project) — ecosystem-wide performance

## 9. Multi-Project

- Project switcher in top nav (dropdown)
- Each project has its own Kanban board
- Agents are scoped per project (assigned by Bulut on demand)
- An agent can belong to multiple projects
- Statistics remain global (cross-project)

## 10. Broadcast Feature

- Button prominently placed in the dashboard header
- Clicking opens a modal: task title, description, priority, target project
- Requires PIN (1881) to submit
- On submit: creates card in INBOX + notifies Bulut via event

## 11. Design System

**Inspired by:** [balancer.fi](https://balancer.fi/)

| Element | Spec |
|---------|------|
| Background | Deep charcoal/navy (#191B23 → #1E2028) |
| Cards | Subtle elevation, rounded corners (12px), soft borders |
| Accents | Muted purple/teal gradients for active states |
| Typography | Inter (or similar clean sans-serif) |
| Whitespace | Generous — no visual clutter |
| Transitions | Smooth, 200-300ms ease-in-out |
| Mobile | Columns → swipeable horizontal, sidebars → slide-over panels |

## 12. Mobile Responsiveness

- Kanban columns collapse to horizontally swipeable cards
- Sidebars become full-screen slide-over panels
- Card detail view becomes a bottom sheet or full-screen modal
- Chat viewer adapts to full-width
- Touch-optimized tap targets (min 44px)
- Statistics charts resize or stack vertically

## 13. Security

- HTTPS via Let's Encrypt (reverse proxy: nginx or Caddy)
- 3-layer auth (PIN → Telegram code → session)
- Rate limiting on all auth endpoints
- HttpOnly + Secure + SameSite cookies
- No username/password stored anywhere
- CORS restricted to relay.kukso.com
- Content Security Policy headers
- SQLite file permissions locked to app user

## 14. Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Frontend | React + Next.js | SSR for initial load, SPA after, great DX |
| Backend API | Node.js (Express or Fastify) | Same ecosystem, lightweight |
| Real-time | WebSocket (native ws or Socket.IO) | Event-driven architecture demands it |
| Database | SQLite | Single-user, simple, no infra overhead |
| Auth delivery | Telegram Bot API | Already in ecosystem, Burak uses Telegram |
| Reverse proxy | Caddy or Nginx | SSL termination + routing |
| Process manager | PM2 or systemd | Keep dashboard alive |

## 15. Context & Token Economy

The ecosystem is **stateless-by-default** at the agent level. State lives in the event store and the database, not in bloated context windows. Bulut is the memory — agents are workers who get clean briefings and deliver results.

### Core Principle

Context window management is **structural, not discretionary**. Agents never decide when to reset — the architecture enforces it through session scoping.

### Three Session Types

| Type | Purpose | Lifespan | Cost Profile |
|------|---------|----------|-------------|
| **Main** | Bulut ↔ Burak (coordination) | Persistent | Grows over time, but it's a single session |
| **Task session** | Fresh spawn per task | Task duration only | Minimal — starts clean, ends clean |
| **Quick ping** | Status check to a persistent agent | Single exchange | Tiny — one message in, one out |

### Task-Scoped Sessions (Primary Pattern)

```
Burak broadcasts task / Bulut creates task
  → Bulut spawns a FRESH isolated session for Agent X
  → Agent X receives only: task brief + relevant project context
  → Agent X works in that clean, focused session
  → Agent X emits events (progress, completion)
  → Result returns to Bulut
  → Session is cleaned up or archived
```

**Why this works:**
- Every task starts with **minimal context** — just the brief + what's relevant
- No accumulated conversation bloat from prior tasks
- Cost is proportional to **task complexity**, not conversation history length
- No ambiguous "when should I reset?" decisions — it's baked into the flow

### When to Use Each Session Type

| Scenario | Session Type | Example |
|----------|-------------|---------|
| New task assignment | `sessions_spawn` (fresh) | "Architect, build the auth system" |
| Quick status check | `sessions_send` (ping) | "PT, what's today's workout status?" |
| Complex multi-step work | `sessions_spawn` (fresh) | "Simon, research and summarize Hytale news" |
| Follow-up on same task | Same task session | "Add rate limiting to the auth endpoint" |

### Summary Handoff (Large Task Recovery)

When a task is complex enough that a single session approaches token limits mid-work:

```
Session A (approaching limit)
  → Agent writes a structured summary of progress so far
  → Bulut spawns Session B with that summary as starting context
  → Agent continues from where they left off in Session B
  → Session A is archived (events preserved in event store)
```

The agent never decides this — Bulut monitors context size and triggers the handoff.

### Cost Guards

1. **Max tokens per task session** — configurable ceiling per agent/task type. If hit, force a summary handoff or escalate to Bulut.
2. **No open-ended sessions** — every spawn has a defined purpose and expected end state. No "just hang around" sessions.
3. **Event emission is lightweight** — structured JSON payloads, not conversational text. Tiny token footprint per event.
4. **Need-to-know context** — agents receive only what's relevant to their task. No "here's everything that happened this week."
5. **Quick pings over spawns** — for simple questions, use `sessions_send` (single exchange) instead of spawning a full session.

### Event Store as External Memory

Events are emitted **from** task sessions but stored **outside** them in SQLite. This decoupling is critical:

- When a session is cleaned up, the full event trail survives
- The dashboard reconstructs state from the event store, never from session history
- Agent profile cards, statistics, and activity feeds all read from the event store
- Cost tracking aggregates token usage reported in task events

### Token Cost Tracking

Every task session reports token usage in its completion event:

```json
{
  "tokenUsage": {
    "input": 45200,
    "output": 12800,
    "model": "claude-sonnet-4-20250514",
    "thinkingLevel": "high",
    "estimatedCost": 0.23
  }
}
```

Aggregated views:
- **Per agent:** total tokens, total cost, average cost per task
- **Per project:** total cost, cost trend over time
- **Global:** ecosystem-wide spend, burn rate, projected monthly cost

## 16. Hosting

- Runs on the same Ubuntu VDS where Bulut lives
- Domain: relay.kukso.com → VDS IPv4
- Caddy/Nginx reverse proxy with auto-SSL
- Dashboard runs as a background service
