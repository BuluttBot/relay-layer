import type { FastifyRequest, FastifyReply } from 'fastify';
import { validateSession } from '../services/authService.js';

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const token = req.cookies?.relay_session;
  if (!token || !validateSession(token)) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
}

export function requireApiKey(req: FastifyRequest, reply: FastifyReply) {
  const key = req.headers['x-api-key'] as string;
  const expected = process.env.RELAY_API_KEY;
  if (!expected || key !== expected) {
    reply.code(401).send({ error: 'Invalid API key' });
  }
}
