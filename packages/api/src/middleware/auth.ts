import type { FastifyRequest, FastifyReply } from 'fastify';
import { validateSession } from '../services/authService.js';

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  // Allow API Key bypass
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string;
  const envKey = process.env.RELAY_API_KEY;

  if (envKey) {
    if (apiKey === envKey) return;
    if (authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7) === envKey) return;
  }

  const token = req.cookies?.relay_session;
  if (!token || !validateSession(token)) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}

export async function requireApiKey(req: FastifyRequest, reply: FastifyReply) {
  const key = req.headers['x-api-key'] as string;
  const expected = process.env.RELAY_API_KEY;
  if (!expected || key !== expected) {
    throw new Error('Invalid API key');
  }
}
