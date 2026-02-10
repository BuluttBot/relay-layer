CREATE TABLE IF NOT EXISTS projects (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  icon          TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agents (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  title           TEXT,
  tag             TEXT,
  description     TEXT,
  avatar          TEXT,
  skills          TEXT,
  model           TEXT,
  thinking_level  TEXT,
  status          TEXT NOT NULL DEFAULT 'offline',
  current_task_id TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_projects (
  agent_id    TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  assigned_by TEXT NOT NULL DEFAULT 'bulut',
  PRIMARY KEY (agent_id, project_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id),
  parent_task_id  TEXT REFERENCES tasks(id),
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'inbox',
  priority        TEXT NOT NULL DEFAULT 'medium',
  assigned_to     TEXT REFERENCES agents(id),
  assigned_by     TEXT,
  progress        INTEGER NOT NULL DEFAULT 0,
  depth           INTEGER NOT NULL DEFAULT 0,
  tags            TEXT,
  created_by      TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  started_at      TEXT,
  completed_at    TEXT,
  published_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);

CREATE TABLE IF NOT EXISTS task_logs (
  id          TEXT PRIMARY KEY,
  task_id     TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  stage       TEXT,
  message     TEXT NOT NULL,
  progress    INTEGER,
  artifacts   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_task_logs_task ON task_logs(task_id);

CREATE TABLE IF NOT EXISTS events (
  id                  TEXT PRIMARY KEY,
  type                TEXT NOT NULL,
  timestamp           TEXT NOT NULL,
  source_agent_id     TEXT,
  source_agent_name   TEXT,
  source_session_key  TEXT,
  project_id          TEXT,
  payload             TEXT NOT NULL,
  correlation_id      TEXT,
  parent_event_id     TEXT,
  version             TEXT NOT NULL DEFAULT '0.1.0'
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_correlation ON events(correlation_id);

CREATE TABLE IF NOT EXISTS communications (
  id              TEXT PRIMARY KEY,
  from_agent_id   TEXT NOT NULL,
  from_agent_name TEXT NOT NULL,
  to_agent_id     TEXT NOT NULL,
  to_agent_name   TEXT NOT NULL,
  content         TEXT NOT NULL,
  reply_to        TEXT,
  session_key     TEXT,
  project_id      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comms_project ON communications(project_id);
CREATE INDEX IF NOT EXISTS idx_comms_agents ON communications(from_agent_id, to_agent_id);
CREATE INDEX IF NOT EXISTS idx_comms_timestamp ON communications(created_at);

CREATE TABLE IF NOT EXISTS token_usage (
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

CREATE INDEX IF NOT EXISTS idx_token_agent ON token_usage(agent_id);
CREATE INDEX IF NOT EXISTS idx_token_project ON token_usage(project_id);
CREATE INDEX IF NOT EXISTS idx_token_task ON token_usage(task_id);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id          TEXT PRIMARY KEY,
  token       TEXT NOT NULL UNIQUE,
  ip_address  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_codes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL,
  used        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS auth_attempts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT NOT NULL,
  success     INTEGER NOT NULL DEFAULT 0,
  ip_address  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip ON auth_attempts(ip_address, created_at);
