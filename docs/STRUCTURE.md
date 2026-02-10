# Relay layeR — Structural Design

> Version: 0.1.0
> Last updated: 2026-02-09

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    relay.kukso.com                        │
│                   (Caddy reverse proxy)                   │
│                   SSL termination                         │
├────────────────────┬────────────────────────────────────┤
│                    │                                      │
│  :3000 Next.js     │  :3001 Fastify API + WebSocket      │
│  (Frontend)        │  (Backend)                           │
│                    │                                      │
│  ┌──────────────┐  │  ┌──────────────────────────────┐   │
│  │ Pages        │  │  │ REST Routes                  │   │
│  │ Components   │  │  │ WebSocket Server             │   │
│  │ Hooks        │  │  │ Event Bus                    │   │
│  │ Stores       │  │  │ Services                     │   │
│  └──────────────┘  │  └──────────┬───────────────────┘   │
│                    │             │                        │
│                    │      ┌──────┴──────┐                 │
│                    │      │   SQLite    │                 │
│                    │      │  relay.db   │                 │
│                    │      └─────────────┘                 │
├────────────────────┴────────────────────────────────────┤
│                    Ubuntu VDS                             │
│              (same host as Bulut/OpenClaw)                │
└─────────────────────────────────────────────────────────┘
```

**Why two processes?**
- Next.js handles SSR pages + static assets efficiently
- Fastify handles REST API + persistent WebSocket connections natively (`@fastify/websocket`)
- Clean separation — frontend doesn't know about DB internals
- Independent restart/update without downtime on the other
- PM2 manages both as a single ecosystem

---

## 2. Folder Structure

```
relay-layer/
├── docs/                          # Planning & design docs
│   ├── PLAN.md
│   ├── EVENT_PROTOCOL.md
│   └── STRUCTURE.md               # ← This file
│
├── packages/
│   ├── web/                       # Next.js Frontend
│   │   ├── src/
│   │   │   ├── app/               # App Router
│   │   │   │   ├── layout.tsx             # Root layout (dark theme, fonts)
│   │   │   │   ├── page.tsx               # Login page (PIN → Code)
│   │   │   │   └── dashboard/
│   │   │   │       ├── layout.tsx         # Dashboard shell (header, sidebars)
│   │   │   │       └── page.tsx           # Kanban board view
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── kanban/
│   │   │   │   │   ├── Board.tsx          # 7-column container
│   │   │   │   │   ├── Column.tsx         # Single status column
│   │   │   │   │   └── Card.tsx           # Task card (compact)
│   │   │   │   │
│   │   │   │   ├── task/
│   │   │   │   │   ├── DetailModal.tsx    # Expanded card view (overlay)
│   │   │   │   │   ├── ProgressBar.tsx    # Visual 0-100% bar
│   │   │   │   │   ├── LogTimeline.tsx    # Timestamped progress log
│   │   │   │   │   └── SubTaskList.tsx    # Nested sub-tasks
│   │   │   │   │
│   │   │   │   ├── chat/
│   │   │   │   │   ├── ChatViewer.tsx     # Telegram-style chat panel
│   │   │   │   │   ├── MessageBubble.tsx  # Individual message
│   │   │   │   │   ├── ChatHeader.tsx     # Chat title + filters
│   │   │   │   │   └── TelegramLogo.tsx   # Branding element
│   │   │   │   │
│   │   │   │   ├── sidebar/
│   │   │   │   │   ├── ActivitySidebar.tsx # Event feed (collapsible)
│   │   │   │   │   ├── AgentsSidebar.tsx  # Agent roster (collapsible)
│   │   │   │   │   ├── AgentCard.tsx      # Agent profile card
│   │   │   │   │   └── EventItem.tsx      # Single activity entry
│   │   │   │   │
│   │   │   │   ├── stats/
│   │   │   │   │   ├── StatsPanel.tsx     # Statistics container
│   │   │   │   │   ├── TasksPerWeek.tsx   # Bar chart (per agent)
│   │   │   │   │   ├── CostTracker.tsx    # LLM cost breakdown
│   │   │   │   │   └── PipelineFlow.tsx   # Avg time per stage
│   │   │   │   │
│   │   │   │   ├── auth/
│   │   │   │   │   ├── PinForm.tsx        # PIN entry step
│   │   │   │   │   └── CodeForm.tsx       # Telegram code step
│   │   │   │   │
│   │   │   │   ├── broadcast/
│   │   │   │   │   └── BroadcastModal.tsx # New task + PIN confirm
│   │   │   │   │
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Header.tsx         # Top nav bar
│   │   │   │   │   ├── ProjectSwitcher.tsx# Project dropdown
│   │   │   │   │   ├── LiveFilter.tsx     # "Show live tasks" toggle
│   │   │   │   │   └── MobileNav.tsx      # Responsive nav
│   │   │   │   │
│   │   │   │   └── ui/                    # Shared primitives
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Modal.tsx
│   │   │   │       ├── Badge.tsx
│   │   │   │       ├── Tooltip.tsx
│   │   │   │       └── Spinner.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useWebSocket.ts        # WS connection + reconnect
│   │   │   │   ├── useAuth.ts             # Auth state + session check
│   │   │   │   ├── useTasks.ts            # Task data fetching
│   │   │   │   ├── useAgents.ts           # Agent data fetching
│   │   │   │   ├── useEvents.ts           # Event stream subscription
│   │   │   │   └── useProject.ts          # Active project context
│   │   │   │
│   │   │   ├── stores/                    # Zustand stores
│   │   │   │   ├── taskStore.ts           # Tasks state + WS updates
│   │   │   │   ├── agentStore.ts          # Agents state
│   │   │   │   ├── eventStore.ts          # Activity feed state
│   │   │   │   ├── authStore.ts           # Auth/session state
│   │   │   │   ├── projectStore.ts        # Project selection
│   │   │   │   └── uiStore.ts             # Sidebar toggles, modals
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── api.ts                 # HTTP client (fetch wrapper)
│   │   │   │   ├── ws.ts                  # WebSocket client singleton
│   │   │   │   ├── formatters.ts          # Date, cost, token formatters
│   │   │   │   └── constants.ts           # Column defs, status maps
│   │   │   │
│   │   │   └── styles/
│   │   │       ├── globals.css            # Tailwind base + custom vars
│   │   │       └── theme.ts              # Design tokens (colors, spacing)
│   │   │
│   │   ├── public/
│   │   │   ├── fonts/                     # Inter font files
│   │   │   └── icons/                     # Agent avatars, logos
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                       # Fastify Backend
│       ├── src/
│       │   ├── index.ts                   # Server entry + plugin registration
│       │   │
│       │   ├── routes/
│       │   │   ├── auth.ts                # PIN, code, verify, logout
│       │   │   ├── tasks.ts               # CRUD + status transitions
│       │   │   ├── events.ts              # Ingest + query events
│       │   │   ├── projects.ts            # CRUD projects
│       │   │   ├── agents.ts              # CRUD agents + status
│       │   │   ├── stats.ts               # Aggregated statistics
│       │   │   └── comms.ts               # Chat/communication logs
│       │   │
│       │   ├── middleware/
│       │   │   ├── auth.ts                # Session token validation
│       │   │   ├── rateLimit.ts           # Per-endpoint rate limiting
│       │   │   └── validate.ts            # Request schema validation
│       │   │
│       │   ├── services/
│       │   │   ├── telegram.ts            # Bot API: send auth codes
│       │   │   ├── eventBus.ts            # In-memory pub/sub for WS broadcast
│       │   │   ├── taskService.ts         # Task lifecycle logic
│       │   │   ├── authService.ts         # PIN, code gen, session mgmt
│       │   │   └── statsService.ts        # Aggregation queries
│       │   │
│       │   ├── ws/
│       │   │   ├── server.ts              # WebSocket upgrade + connection mgmt
│       │   │   └── handlers.ts            # Message routing + auth check
│       │   │
│       │   ├── db/
│       │   │   ├── client.ts              # better-sqlite3 connection
│       │   │   ├── schema.sql             # Table definitions
│       │   │   └── migrations/            # Versioned schema changes
│       │   │       └── 001_initial.sql
│       │   │
│       │   └── types/                     # Shared with frontend via symlink/copy
│       │       ├── events.ts
│       │       ├── tasks.ts
│       │       ├── agents.ts
│       │       └── auth.ts
│       │
│       ├── tsconfig.json
│       └── package.json
│
├── shared/                        # Shared type definitions
│   ├── types/
│   │   ├── event.ts               # Event envelope + payload types
│   │   ├── task.ts                # Task, TaskLog, SubTask
│   │   ├── agent.ts               # Agent profile + status
│   │   ├── project.ts             # Project definition
│   │   └── auth.ts                # Auth types
│   ├── validation/
│   │   ├── eventSchema.ts         # Zod schemas for event validation
│   │   └── taskSchema.ts          # Zod schemas for task validation
│   ├── constants.ts               # Shared constants (statuses, priorities)
│   └── package.json
│
├── deploy/
│   ├── Caddyfile                  # Reverse proxy config
│   ├── ecosystem.config.js        # PM2 process definitions
│   └── setup.sh                   # First-time server setup script
│
├── .env.example                   # Environment variable template
├── .gitignore
├── package.json                   # Root workspace config (npm workspaces)
├── tsconfig.base.json             # Shared TS config
└── README.md
```

---

## 3. Database Schema

### SQLite: `relay.db`

```sql
-- ============================================
-- PROJECTS
-- ============================================
CREATE TABLE projects (
  id            TEXT PRIMARY KEY,           -- 'relay-layer', 'wickdbot', etc.
  name          TEXT NOT NULL,              -- 'Relay layeR'
  description   TEXT,
  icon          TEXT,                       -- emoji or image path
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- AGENTS
-- ============================================
CREATE TABLE agents (
  id              TEXT PRIMARY KEY,         -- 'bulut', 'personal-trainer', etc.
  name            TEXT NOT NULL,            -- 'Bulut', 'PT', etc.
  title           TEXT,                     -- 'Orchestrator'
  tag             TEXT,                     -- 'Lead'
  description     TEXT,
  avatar          TEXT,                     -- emoji or image path
  skills          TEXT,                     -- JSON array: ["coordination", "quality-control"]
  model           TEXT,                     -- 'claude-sonnet-4-20250514'
  thinking_level  TEXT,                     -- 'high', 'low', 'off'
  status          TEXT NOT NULL DEFAULT 'offline',  -- 'active', 'idle', 'offline'
  current_task_id TEXT,                     -- FK to tasks.id (nullable)
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- AGENT ↔ PROJECT (many-to-many)
-- ============================================
CREATE TABLE agent_projects (
  agent_id    TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  assigned_by TEXT NOT NULL DEFAULT 'bulut',
  PRIMARY KEY (agent_id, project_id)
);

-- ============================================
-- TASKS (Kanban cards)
-- ============================================
CREATE TABLE tasks (
  id              TEXT PRIMARY KEY,         -- 'task_01HQABC789'
  project_id      TEXT NOT NULL REFERENCES projects(id),
  parent_task_id  TEXT REFERENCES tasks(id),  -- sub-task parent
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'inbox',
    -- inbox | assigned | in_progress | review | done | burak | published
  priority        TEXT NOT NULL DEFAULT 'medium',
    -- low | medium | high | urgent
  assigned_to     TEXT REFERENCES agents(id),
  assigned_by     TEXT,                     -- 'bulut' or 'burak'
  progress        INTEGER NOT NULL DEFAULT 0,  -- 0-100
  depth           INTEGER NOT NULL DEFAULT 0,  -- sub-task nesting level
  tags            TEXT,                     -- JSON array
  created_by      TEXT NOT NULL,            -- 'burak' or 'bulut'
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  started_at      TEXT,
  completed_at    TEXT,
  published_at    TEXT
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);

-- ============================================
-- TASK LOGS (progress entries)
-- ============================================
CREATE TABLE task_logs (
  id          TEXT PRIMARY KEY,
  task_id     TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  stage       TEXT,
    -- research | planning | implementation | testing | documentation | cleanup
  message     TEXT NOT NULL,
  progress    INTEGER,                     -- progress snapshot at this point
  artifacts   TEXT,                         -- JSON array of {type, path, action}
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_task_logs_task ON task_logs(task_id);

-- ============================================
-- EVENTS (append-only event store)
-- ============================================
CREATE TABLE events (
  id                  TEXT PRIMARY KEY,     -- 'evt_01HQXYZ123456'
  type                TEXT NOT NULL,        -- 'task.progress', 'agent.online', etc.
  timestamp           TEXT NOT NULL,
  source_agent_id     TEXT,
  source_agent_name   TEXT,
  source_session_key  TEXT,
  project_id          TEXT,
  payload             TEXT NOT NULL,        -- JSON blob
  correlation_id      TEXT,                 -- related task_id
  parent_event_id     TEXT,
  version             TEXT NOT NULL DEFAULT '0.1.0'
);

CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_project ON events(project_id);
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_events_correlation ON events(correlation_id);

-- ============================================
-- COMMUNICATIONS (chat viewer source)
-- ============================================
CREATE TABLE communications (
  id              TEXT PRIMARY KEY,
  from_agent_id   TEXT NOT NULL,
  from_agent_name TEXT NOT NULL,
  to_agent_id     TEXT NOT NULL,
  to_agent_name   TEXT NOT NULL,
  content         TEXT NOT NULL,
  reply_to        TEXT,                     -- message id being replied to
  session_key     TEXT,
  project_id      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_comms_project ON communications(project_id);
CREATE INDEX idx_comms_agents ON communications(from_agent_id, to_agent_id);
CREATE INDEX idx_comms_timestamp ON communications(created_at);

-- ============================================
-- TOKEN USAGE (cost tracking)
-- ============================================
CREATE TABLE token_usage (
  id              TEXT PRIMARY KEY,
  task_id         TEXT REFERENCES tasks(id),
  agent_id        TEXT REFERENCES agents(id),
  project_id      TEXT REFERENCES projects(id),
  session_key     TEXT,
  input_tokens    INTEGER NOT NULL DEFAULT 0,
  output_tokens   INTEGER NOT NULL DEFAULT 0,
  model           TEXT,
  thinking_level  TEXT,
  estimated_cost  REAL NOT NULL DEFAULT 0.0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_token_agent ON token_usage(agent_id);
CREATE INDEX idx_token_project ON token_usage(project_id);
CREATE INDEX idx_token_task ON token_usage(task_id);

-- ============================================
-- AUTH: Sessions
-- ============================================
CREATE TABLE auth_sessions (
  id          TEXT PRIMARY KEY,
  token       TEXT NOT NULL UNIQUE,
  ip_address  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL                -- created_at + 24h
);

-- ============================================
-- AUTH: Pending codes
-- ============================================
CREATE TABLE auth_codes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL,               -- 6-digit code
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL,               -- created_at + 5min
  used        INTEGER NOT NULL DEFAULT 0
);

-- ============================================
-- AUTH: Attempt log (rate limiting)
-- ============================================
CREATE TABLE auth_attempts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT NOT NULL,               -- 'pin' | 'code'
  success     INTEGER NOT NULL DEFAULT 0,
  ip_address  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_auth_attempts_ip ON auth_attempts(ip_address, created_at);
```

---

## 4. API Routes

### Base URL: `https://relay.kukso.com/api`

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/pin` | ❌ | Validate PIN (1881). Rate limited. |
| `POST` | `/auth/code` | ❌ | Request Telegram code (requires valid PIN step). 2-min cooldown. |
| `POST` | `/auth/verify` | ❌ | Submit code → receive session token. |
| `POST` | `/auth/logout` | ✅ | Destroy current session. |

### Tasks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/tasks?projectId=&status=` | ✅ | List tasks (filterable by project, status) |
| `GET` | `/tasks/:id` | ✅ | Task detail + logs + sub-tasks |
| `POST` | `/tasks` | ✅ | Create task (Broadcast). Requires PIN in body. |
| `PATCH` | `/tasks/:id` | ✅ | Update task (status, progress, assignment) |
| `GET` | `/tasks/live` | ✅ | Get all tasks currently in_progress |

### Events

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/events` | 🔑 API Key | Ingest event from agent (internal) |
| `GET` | `/events?projectId=&type=&limit=` | ✅ | Query events for activity feed |

### Projects

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/projects` | ✅ | List all projects |
| `POST` | `/projects` | ✅ | Create project |
| `GET` | `/projects/:id` | ✅ | Project detail + agent roster |
| `PATCH` | `/projects/:id` | ✅ | Update project |

### Agents

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/agents` | ✅ | List all agents with status |
| `GET` | `/agents/:id` | ✅ | Agent detail + current task + stats |
| `POST` | `/agents` | ✅ | Register agent |
| `PATCH` | `/agents/:id` | ✅ | Update agent profile/status |
| `POST` | `/agents/:id/projects` | ✅ | Assign agent to project |
| `DELETE` | `/agents/:id/projects/:pid` | ✅ | Remove agent from project |

### Statistics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/stats/overview` | ✅ | Global: total tasks, completion rate, active agents |
| `GET` | `/stats/agents` | ✅ | Per-agent: tasks/week, cost, avg time |
| `GET` | `/stats/costs?range=` | ✅ | Cost breakdown: per agent, per project, trend |
| `GET` | `/stats/pipeline` | ✅ | Avg time per pipeline stage |

### Communications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/comms?projectId=&agentId=` | ✅ | Chat history (filterable) |

### WebSocket

| Path | Auth | Description |
|------|------|-------------|
| `/ws` | ✅ (token in query) | Real-time event stream |

**WS Message Types (server → client):**
```typescript
{ type: 'event', data: RelayEvent }          // New event
{ type: 'task_update', data: Task }          // Task state changed
{ type: 'agent_status', data: AgentStatus }  // Agent went online/offline
{ type: 'ping' }                              // Keepalive
```

**WS Message Types (client → server):**
```typescript
{ type: 'subscribe', projectId: string }      // Filter events by project
{ type: 'unsubscribe', projectId: string }
{ type: 'pong' }                              // Keepalive response
```

---

## 5. Data Flow

### Event Lifecycle

```
Agent completes work
  → Agent emits event via POST /api/events (API key auth)
  → Fastify validates against Zod schema
  → Event persisted to SQLite (events table)
  → Side effects triggered:
      ├─ Task status updated (tasks table)
      ├─ Task log appended (task_logs table)
      ├─ Token usage recorded (token_usage table)
      └─ Agent status updated (agents table)
  → Event published to in-memory EventBus
  → EventBus broadcasts to all WebSocket subscribers
  → Dashboard receives event, Zustand store updates
  → React re-renders affected components
```

### Auth Flow

```
Browser visits relay.kukso.com
  → Next.js serves login page
  → User enters PIN (1881)
  → POST /api/auth/pin → validates → returns pinToken (short-lived, 5min)
  → POST /api/auth/code (with pinToken) → generates 6-digit code
      → Sends code to Burak's Telegram DM via Bot API
      → Starts 2-min cooldown for new code requests
  → User enters code from Telegram
  → POST /api/auth/verify (code + pinToken) → validates
      → Creates session in auth_sessions (24h expiry)
      → Returns session token as HttpOnly cookie
  → Redirect to /dashboard
```

### Page Load (Dashboard)

```
Browser navigates to /dashboard
  → Next.js checks session cookie (middleware)
  → If invalid/expired → redirect to login
  → If valid → SSR fetches initial data:
      ├─ GET /api/projects (project list)
      ├─ GET /api/tasks?projectId=active (current board)
      ├─ GET /api/agents (agent roster)
      └─ GET /api/events?limit=50 (recent activity)
  → Page renders with initial data
  → Client hydrates, connects WebSocket
  → Real-time updates begin flowing
```

---

## 6. State Management (Zustand)

```typescript
// taskStore.ts
interface TaskStore {
  tasks: Map<string, Task>
  tasksByStatus: Record<TaskStatus, Task[]>  // derived, for Kanban columns
  selectedTask: Task | null
  liveTasks: Task[]                           // in_progress only

  // Actions
  fetchTasks: (projectId: string) => Promise<void>
  updateTask: (task: Partial<Task>) => void   // from WS event
  selectTask: (id: string | null) => void
}

// agentStore.ts
interface AgentStore {
  agents: Map<string, Agent>
  agentsList: Agent[]                         // derived, sorted

  fetchAgents: () => Promise<void>
  updateAgentStatus: (id: string, status: AgentStatus) => void
}

// eventStore.ts
interface EventStore {
  events: RelayEvent[]                        // recent, capped at 200
  unreadCount: number

  pushEvent: (event: RelayEvent) => void      // from WS
  markRead: () => void
}

// projectStore.ts
interface ProjectStore {
  projects: Project[]
  activeProjectId: string | null

  fetchProjects: () => Promise<void>
  setActiveProject: (id: string) => void
}

// uiStore.ts
interface UIStore {
  activitySidebarOpen: boolean
  agentsSidebarOpen: boolean
  chatViewerOpen: boolean
  statsOpen: boolean
  broadcastModalOpen: boolean

  toggle: (panel: string) => void
}

// authStore.ts
interface AuthStore {
  isAuthenticated: boolean
  sessionExpiresAt: string | null

  checkSession: () => Promise<boolean>
  logout: () => Promise<void>
}
```

---

## 7. Component Tree

```
<App>
├── <AuthGuard>                              # Redirects to login if no session
│   ├── <LoginPage>                          # /
│   │   ├── <PinForm />
│   │   └── <CodeForm />
│   │
│   └── <DashboardLayout>                    # /dashboard
│       ├── <Header>
│       │   ├── <Logo />                     # "Relay layeR"
│       │   ├── <ProjectSwitcher />          # Dropdown
│       │   ├── <LiveFilter />               # "Show live" toggle button
│       │   ├── <ChatViewerButton />         # Telegram icon
│       │   ├── <StatsButton />              # Chart icon
│       │   ├── <BroadcastButton />          # + icon → opens modal
│       │   ├── <ActivityToggle />           # Bell icon
│       │   └── <AgentsToggle />             # People icon
│       │
│       ├── <AgentsSidebar>                  # Left, collapsible
│       │   └── <AgentCard /> × N
│       │
│       ├── <MainContent>
│       │   ├── <KanbanBoard>                # Default view
│       │   │   └── <Column status="inbox|assigned|..."> × 7
│       │   │       └── <Card /> × N
│       │   │
│       │   ├── <ChatViewer>                 # Overlay/panel
│       │   │   ├── <ChatHeader />
│       │   │   └── <MessageBubble /> × N
│       │   │
│       │   └── <StatsPanel>                 # Overlay/panel
│       │       ├── <TasksPerWeek />
│       │       ├── <CostTracker />
│       │       └── <PipelineFlow />
│       │
│       ├── <ActivitySidebar>                # Right, collapsible
│       │   └── <EventItem /> × N
│       │
│       ├── <TaskDetailModal>                # Overlay on card click
│       │   ├── <ProgressBar />
│       │   ├── <LogTimeline />
│       │   └── <SubTaskList />
│       │
│       └── <BroadcastModal>                 # Overlay on broadcast click
│           ├── <TaskForm />
│           └── <PinConfirm />
```

---

## 8. Design Tokens

```typescript
// theme.ts — Balancer.fi inspired
export const theme = {
  colors: {
    // Backgrounds
    bg: {
      primary:   '#191B23',   // Main background
      secondary: '#1E2028',   // Card/panel background
      tertiary:  '#252831',   // Hover states, elevated surfaces
      surface:   '#2A2D37',   // Input fields, wells
    },

    // Text
    text: {
      primary:   '#E2E4E9',   // Main text
      secondary: '#8B8FA3',   // Muted/secondary text
      tertiary:  '#5E6272',   // Disabled/placeholder
      inverse:   '#191B23',   // Text on light backgrounds
    },

    // Accents
    accent: {
      purple:    '#7C5CFC',   // Primary actions, links
      teal:      '#2DD4BF',   // Success, positive states
      blue:      '#3B82F6',   // Info, in-progress
      amber:     '#F59E0B',   // Warnings, pending
      red:       '#EF4444',   // Errors, destructive
      pink:      '#EC4899',   // Highlights, special
    },

    // Status indicators
    status: {
      active:    '#2DD4BF',   // 🟢
      idle:      '#F59E0B',   // 🟡
      offline:   '#5E6272',   // 🔴 (muted, not bright red)
    },

    // Kanban column headers
    column: {
      inbox:      '#7C5CFC',
      assigned:   '#3B82F6',
      inProgress: '#2DD4BF',
      review:     '#F59E0B',
      done:       '#10B981',
      burak:      '#EC4899',
      published:  '#8B5CF6',
    },

    // Borders
    border: {
      subtle:    '#2A2D37',
      default:   '#363943',
      strong:    '#4A4E5C',
    },
  },

  // Spacing scale (px)
  space: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64],

  // Border radius
  radius: {
    sm:  '6px',
    md:  '10px',
    lg:  '14px',
    xl:  '20px',
    full: '9999px',
  },

  // Shadows (subtle for dark theme)
  shadow: {
    card:    '0 2px 8px rgba(0, 0, 0, 0.3)',
    modal:   '0 8px 32px rgba(0, 0, 0, 0.5)',
    glow:    '0 0 20px rgba(124, 92, 252, 0.15)',  // Purple glow
  },

  // Typography
  font: {
    family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    size: {
      xs:  '0.75rem',   // 12px
      sm:  '0.875rem',  // 14px
      md:  '1rem',      // 16px
      lg:  '1.125rem',  // 18px
      xl:  '1.25rem',   // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '2rem',    // 32px
    },
    weight: {
      regular: 400,
      medium:  500,
      semibold: 600,
      bold:    700,
    },
  },

  // Transitions
  transition: {
    fast:   '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow:   '400ms ease-in-out',
  },

  // Breakpoints
  breakpoint: {
    sm:  '640px',
    md:  '768px',
    lg:  '1024px',
    xl:  '1280px',
    '2xl': '1536px',
  },
}
```

---

## 9. Deployment

### Caddy Reverse Proxy

```caddyfile
relay.kukso.com {
  # Frontend (Next.js)
  handle /* {
    reverse_proxy localhost:3000
  }

  # API routes
  handle /api/* {
    reverse_proxy localhost:3001
  }

  # WebSocket
  handle /ws {
    reverse_proxy localhost:3001
  }

  # Security headers
  header {
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    X-XSS-Protection "1; mode=block"
    Referrer-Policy "strict-origin-when-cross-origin"
    Content-Security-Policy "default-src 'self'; connect-src 'self' wss://relay.kukso.com"
  }
}
```

### PM2 Ecosystem

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'relay-web',
      cwd: './packages/web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'relay-api',
      cwd: './packages/api',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_PATH: '../../relay.db',
        TELEGRAM_BOT_TOKEN: '...',
        TELEGRAM_CHAT_ID: '7475046663',
        AUTH_PIN: '1881',
        SESSION_SECRET: '...',
      },
    },
  ],
}
```

### Environment Variables

```env
# .env.example
NODE_ENV=production

# API
API_PORT=3001
DATABASE_PATH=./relay.db

# Auth
AUTH_PIN=1881
SESSION_SECRET=<random-64-char-hex>
SESSION_TTL_HOURS=24
CODE_COOLDOWN_SECONDS=120
CODE_EXPIRY_SECONDS=300
MAX_PIN_ATTEMPTS=3
LOCKOUT_MINUTES=10

# Telegram
TELEGRAM_BOT_TOKEN=<bot-token>
TELEGRAM_CHAT_ID=7475046663

# Internal API Key (for agent event ingestion)
RELAY_API_KEY=<random-key-for-agents>

# Frontend
NEXT_PUBLIC_API_URL=https://relay.kukso.com/api
NEXT_PUBLIC_WS_URL=wss://relay.kukso.com/ws
```

---

## 10. Key Dependencies

### Frontend (`packages/web`)
```
next, react, react-dom       — Framework
zustand                      — State management
tailwindcss                  — Styling
recharts                     — Statistics charts
framer-motion                — Animations/transitions
lucide-react                 — Icons
clsx, tailwind-merge         — Utility classnames
date-fns                     — Date formatting
```

### Backend (`packages/api`)
```
fastify                      — HTTP framework
@fastify/websocket           — WebSocket support
@fastify/cookie              — Session cookies
@fastify/rate-limit          — Rate limiting
@fastify/cors                — CORS
better-sqlite3               — SQLite driver
zod                          — Schema validation
nanoid                       — ID generation
node-telegram-bot-api        — Telegram auth codes
```

### Shared
```
typescript                   — Type safety
zod                          — Shared validation schemas
```
