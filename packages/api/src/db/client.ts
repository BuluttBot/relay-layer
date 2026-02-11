import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DATABASE_PATH || join(__dirname, '..', '..', '..', '..', 'relay.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb(): void {
  const d = getDb();
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  d.exec(schema);
}

export function seedDb(): void {
  const d = getDb();

  const projectCount = d.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number };
  if (projectCount.c > 0) return;

  d.prepare(`INSERT INTO projects (id, name, description, icon) VALUES (?, ?, ?, ?)`).run(
    'relay-layer', 'Relay layeR', 'The agentic command center dashboard', '🔄'
  );
  d.prepare(`INSERT INTO projects (id, name, description, icon) VALUES (?, ?, ?, ?)`).run(
    'openclaw-ecosystem', 'OpenClaw Ecosystem', 'Agent infrastructure and orchestration', '🦞'
  );

  const agents = [
    ['bulut', 'Bulut', 'Orchestrator', 'Lead', 'Hub coordinator and second brain', '☁️', '["coordination","quality-control","communication","automation"]', 'claude-opus-4-6', 'low', 'active'],
    ['personal-trainer', 'PT', 'Personal Trainer', 'Specialist', 'Tracks gym workouts and training log', '💪', '["fitness-tracking","workout-planning"]', 'claude-sonnet-4-20250514', 'low', 'idle'],
    ['prayer', 'Dua', 'Prayer Tracker', 'Specialist', 'Tracks Ayat al-Kursi recitation goal', '🤲', '["prayer-tracking","spiritual-goals"]', 'claude-sonnet-4-20250514', 'low', 'idle'],
    ['hytale-modder', 'Simon', 'Hytale Modder', 'Specialist', 'Monitors Hytale news and modding tasks', '🎮', '["hytale","modding","game-dev"]', 'claude-sonnet-4-20250514', 'low', 'idle'],
    ['architect', 'The Architect', 'Infrastructure Engineer', 'Specialist', 'Infrastructure and systems work', '🏗️', '["infrastructure","systems","deployment"]', 'claude-sonnet-4-20250514', 'high', 'idle'],
    ['personal_psychologist', 'Alev', 'Psychologist', 'Specialist', 'Personal psychological advisor — tracks mental health, social/family relations, provides culturally-aware guidance', '🩺', '["psychology","mental-health","cultural-awareness","CBT","ACT","pattern-recognition"]', 'google-gemini-cli/gemini-3-flash-preview', 'low', 'idle'],
  ];

  const insertAgent = d.prepare(
    `INSERT INTO agents (id, name, title, tag, description, avatar, skills, model, thinking_level, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const a of agents) {
    insertAgent.run(...a);
  }

  const insertAP = d.prepare(`INSERT INTO agent_projects (agent_id, project_id, assigned_by) VALUES (?, ?, 'bulut')`);
  insertAP.run('bulut', 'relay-layer');
  insertAP.run('architect', 'relay-layer');
  insertAP.run('bulut', 'openclaw-ecosystem');
  insertAP.run('personal-trainer', 'openclaw-ecosystem');
  insertAP.run('prayer', 'openclaw-ecosystem');
  insertAP.run('hytale-modder', 'openclaw-ecosystem');
  insertAP.run('personal_psychologist', 'openclaw-ecosystem');
}
