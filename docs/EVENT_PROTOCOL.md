# Relay layeR — Event Protocol

> Version: 0.1.0 (Draft)
> Last updated: 2026-02-09

This document defines the structured JSON event schema that all agents in the ecosystem emit. These events are the backbone of the dashboard — every card movement, progress update, and status change flows through this protocol.

---

## 1. Base Event Envelope

Every event follows this envelope structure:

```json
{
  "id": "evt_01HQXYZ123456",
  "type": "task.progress",
  "timestamp": "2026-02-09T23:30:00.000Z",
  "source": {
    "agentId": "personal-trainer",
    "agentName": "PT",
    "sessionKey": "session_abc123"
  },
  "projectId": "relay-layer",
  "payload": { ... },
  "meta": {
    "version": "0.1.0",
    "correlationId": "task_01HQABC789",
    "parentEventId": null
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique event ID (prefixed `evt_`) |
| `type` | string | ✅ | Event type (see §2) |
| `timestamp` | ISO 8601 | ✅ | When the event occurred |
| `source.agentId` | string | ✅ | ID of the emitting agent |
| `source.agentName` | string | ✅ | Display name of the agent |
| `source.sessionKey` | string | ⬚ | OpenClaw session key (if applicable) |
| `projectId` | string | ✅ | Which project this event belongs to |
| `payload` | object | ✅ | Event-specific data (see §3) |
| `meta.version` | string | ✅ | Protocol version |
| `meta.correlationId` | string | ⬚ | Related task ID for correlation |
| `meta.parentEventId` | string | ⬚ | Parent event (for chains/sub-tasks) |

---

## 2. Event Types

### Task Events

| Type | Trigger | Column Transition |
|------|---------|-------------------|
| `task.created` | New task added to INBOX | → INBOX |
| `task.assigned` | Bulut assigns task to an agent | INBOX → ASSIGNED |
| `task.started` | Agent begins working | ASSIGNED → IN PROGRESS |
| `task.progress` | Agent reports progress update | (stays IN PROGRESS) |
| `task.completed` | Agent finishes work | IN PROGRESS → REVIEW |
| `task.review_passed` | Bulut approves quality | REVIEW → DONE |
| `task.review_failed` | Bulut rejects, needs rework | REVIEW → IN PROGRESS |
| `task.awaiting_approval` | Ready for Burak's sign-off | DONE → BURAK |
| `task.approved` | Burak approves | BURAK → PUBLISHED |
| `task.rejected` | Burak sends back | BURAK → REVIEW |
| `task.subtask_requested` | Agent requests a sub-task | (no transition) |
| `task.subtask_created` | Bulut creates a sub-task | → INBOX (new card) |
| `task.comment` | Agent or Bulut adds a note | (no transition) |

### Agent Events

| Type | Trigger |
|------|---------|
| `agent.online` | Agent session starts |
| `agent.offline` | Agent session ends |
| `agent.idle` | Agent has no active tasks |
| `agent.status_changed` | Any status transition |

### System Events

| Type | Trigger |
|------|---------|
| `system.broadcast` | New task via Broadcast button |
| `system.error` | System-level error |
| `system.auth` | Login attempt (success/failure) |
| `system.project_created` | New project added |
| `system.agent_assigned` | Agent added to a project |

### Communication Events

| Type | Trigger |
|------|---------|
| `comms.message` | Inter-agent message sent |
| `comms.request` | Agent requests something from another |
| `comms.response` | Agent responds to a request |

---

## 3. Payload Schemas

### task.created

```json
{
  "taskId": "task_01HQABC789",
  "title": "Implement user authentication",
  "description": "Set up Telegram-based auth flow with PIN gateway",
  "priority": "high",
  "createdBy": "burak",
  "tags": ["auth", "security"],
  "estimatedEffort": "medium"
}
```

### task.assigned

```json
{
  "taskId": "task_01HQABC789",
  "assignedTo": {
    "agentId": "architect",
    "agentName": "The Architect"
  },
  "assignedBy": "bulut",
  "notes": "Handle the backend auth logic, I'll review the flow"
}
```

### task.started

```json
{
  "taskId": "task_01HQABC789",
  "startedAt": "2026-02-09T23:30:00.000Z",
  "approach": "Starting with PIN validation endpoint, then Telegram Bot integration"
}
```

### task.progress

```json
{
  "taskId": "task_01HQABC789",
  "progress": 45,
  "stage": "implementation",
  "logEntry": "PIN validation endpoint complete. Moving to Telegram code generation.",
  "artifacts": [
    {
      "type": "file",
      "path": "src/auth/pin.ts",
      "action": "created"
    }
  ]
}
```

**Progress stages:** `research` → `planning` → `implementation` → `testing` → `documentation` → `cleanup`

### task.completed

```json
{
  "taskId": "task_01HQABC789",
  "completedAt": "2026-02-10T02:15:00.000Z",
  "summary": "Auth system implemented with 3-layer security. All tests passing.",
  "artifacts": [
    {
      "type": "branch",
      "ref": "feature/auth-system"
    },
    {
      "type": "file",
      "path": "src/auth/",
      "action": "created"
    }
  ],
  "tokenUsage": {
    "input": 45200,
    "output": 12800,
    "model": "claude-sonnet-4-20250514",
    "estimatedCost": 0.23
  }
}
```

### task.review_passed / task.review_failed

```json
{
  "taskId": "task_01HQABC789",
  "reviewedBy": "bulut",
  "verdict": "passed",
  "feedback": "Clean implementation. One minor suggestion: add rate limit headers to response.",
  "qualityScore": 8.5
}
```

### task.subtask_requested

```json
{
  "taskId": "task_01HQABC789",
  "requestedBy": {
    "agentId": "architect",
    "agentName": "The Architect"
  },
  "proposedTask": {
    "title": "Set up Caddy reverse proxy for SSL",
    "description": "Need SSL termination before the auth endpoints go live",
    "suggestedAssignee": null,
    "parentTaskId": "task_01HQABC789"
  },
  "depth": 1
}
```

### agent.status_changed

```json
{
  "agentId": "personal-trainer",
  "previousStatus": "active",
  "newStatus": "idle",
  "reason": "Task task_01HQABC789 completed, no pending assignments"
}
```

### comms.message

```json
{
  "from": {
    "agentId": "bulut",
    "agentName": "Bulut"
  },
  "to": {
    "agentId": "architect",
    "agentName": "The Architect"
  },
  "content": "Auth task is yours. Start with the PIN endpoint, keep it stateless.",
  "replyTo": null,
  "sessionKey": "session_xyz789"
}
```

### system.broadcast

```json
{
  "taskId": "task_01HQNEW001",
  "title": "New feature: dark mode toggle",
  "description": "Add a toggle in settings to switch between dark themes",
  "priority": "medium",
  "createdBy": "burak",
  "pinVerified": true,
  "projectId": "relay-layer"
}
```

---

## 4. Event Delivery

### WebSocket Channel

- Dashboard connects via WebSocket on `wss://relay.kukso.com/ws`
- Authenticated with the same session token
- Events stream in real-time
- Reconnection with exponential backoff

### Event Store

- All events are persisted in SQLite (`events` table)
- Immutable append-only log
- Used for:
  - Rebuilding dashboard state on page load
  - Activity sidebar history
  - Statistics computation
  - Chat viewer reconstruction

### Event Flow

```
Agent emits event
  → API receives + validates against schema
  → Persisted to SQLite
  → Broadcast to WebSocket subscribers
  → Dashboard updates UI in real-time
```

---

## 5. Cost Tracking Schema

Embedded in relevant task events (`task.progress`, `task.completed`):

```json
{
  "tokenUsage": {
    "input": 45200,
    "output": 12800,
    "model": "claude-sonnet-4-20250514",
    "thinkingLevel": "high",
    "estimatedCost": 0.23,
    "currency": "USD"
  }
}
```

Aggregated in statistics:
- Per agent: total tokens, total cost, cost per task
- Per project: total cost, cost trend over time
- Global: ecosystem-wide spend

---

## 6. Validation Rules

1. **Required fields** — Events missing required fields are rejected with 400
2. **Known event types** — Unknown `type` values are rejected
3. **Agent registration** — `source.agentId` must match a registered agent
4. **Project scope** — `projectId` must exist
5. **Sub-task depth** — `depth` > 3 in `task.subtask_requested` is auto-rejected
6. **Circular check** — Sub-task cannot have an ancestor as its assignee
7. **Progress range** — `progress` must be 0-100 integer
8. **Timestamp sanity** — Events with future timestamps (>5min drift) are rejected

---

## 7. Agent Registration Schema

Each agent in the system is registered with:

```json
{
  "agentId": "personal-trainer",
  "name": "PT",
  "title": "Personal Trainer",
  "tag": "Specialist",
  "description": "Tracks gym workouts and training log",
  "avatar": "💪",
  "skills": ["fitness-tracking", "workout-planning", "health-monitoring"],
  "model": "claude-sonnet-4-20250514",
  "thinkingLevel": "low",
  "projects": ["personal-health"],
  "status": "idle",
  "createdAt": "2026-02-04T00:00:00.000Z"
}
```

---

## Changelog

- **0.1.0** (2026-02-09) — Initial draft. Brainstorming phase.
