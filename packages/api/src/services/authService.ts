import { getDb } from '../db/client.js';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

const PIN = process.env.AUTH_PIN || '1881';
const SESSION_TTL = parseInt(process.env.SESSION_TTL_HOURS || '24', 10);
const CODE_COOLDOWN = parseInt(process.env.CODE_COOLDOWN_SECONDS || '120', 10);
const CODE_EXPIRY = parseInt(process.env.CODE_EXPIRY_SECONDS || '300', 10);
const MAX_ATTEMPTS = parseInt(process.env.MAX_PIN_ATTEMPTS || '3', 10);
const LOCKOUT_MIN = parseInt(process.env.LOCKOUT_MINUTES || '10', 10);

const pinTokens = new Map<string, { createdAt: number; ip: string }>();

export function isLockedOut(ip: string): boolean {
  const db = getDb();
  const cutoff = new Date(Date.now() - LOCKOUT_MIN * 60000).toISOString();
  const row = db.prepare(
    `SELECT COUNT(*) as c FROM auth_attempts WHERE ip_address = ? AND type = 'pin' AND success = 0 AND created_at > ?`
  ).get(ip, cutoff) as { c: number };
  return row.c >= MAX_ATTEMPTS;
}

export function validatePin(pin: string, ip: string): { ok: boolean; pinToken?: string } {
  const db = getDb();
  if (pin === PIN) {
    db.prepare(`INSERT INTO auth_attempts (type, success, ip_address) VALUES ('pin', 1, ?)`).run(ip);
    const token = nanoid(32);
    pinTokens.set(token, { createdAt: Date.now(), ip });
    setTimeout(() => pinTokens.delete(token), 5 * 60000);
    return { ok: true, pinToken: token };
  }
  db.prepare(`INSERT INTO auth_attempts (type, success, ip_address) VALUES ('pin', 0, ?)`).run(ip);
  return { ok: false };
}

export function validatePinToken(token: string): boolean {
  const entry = pinTokens.get(token);
  if (!entry) return false;
  if (Date.now() - entry.createdAt > 5 * 60000) {
    pinTokens.delete(token);
    return false;
  }
  return true;
}

export function canRequestCode(): boolean {
  const db = getDb();
  const cutoff = new Date(Date.now() - CODE_COOLDOWN * 1000).toISOString();
  const row = db.prepare(
    `SELECT COUNT(*) as c FROM auth_codes WHERE created_at > ?`
  ).get(cutoff) as { c: number };
  return row.c === 0;
}

export function generateCode(): string {
  const db = getDb();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + CODE_EXPIRY * 1000).toISOString();
  db.prepare(`INSERT INTO auth_codes (code, expires_at) VALUES (?, ?)`).run(code, expiresAt);
  return code;
}

export function verifyCode(code: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const row = db.prepare(
    `SELECT id FROM auth_codes WHERE code = ? AND used = 0 AND expires_at > ?`
  ).get(code, now) as { id: number } | undefined;
  if (!row) return false;
  db.prepare(`UPDATE auth_codes SET used = 1 WHERE id = ?`).run(row.id);
  return true;
}

export function createSession(ip: string): string {
  const db = getDb();
  const id = nanoid();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL * 3600000).toISOString();
  db.prepare(`INSERT INTO auth_sessions (id, token, ip_address, expires_at) VALUES (?, ?, ?, ?)`).run(id, token, ip, expiresAt);
  return token;
}

export function validateSession(token: string): boolean {
  if (!token) return false;
  const db = getDb();
  const now = new Date().toISOString();
  const row = db.prepare(
    `SELECT id FROM auth_sessions WHERE token = ? AND expires_at > ?`
  ).get(token, now);
  return !!row;
}

export function destroySession(token: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM auth_sessions WHERE token = ?`).run(token);
}
