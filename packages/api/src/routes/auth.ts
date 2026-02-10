import type { FastifyInstance } from 'fastify';
import { isLockedOut, validatePin, validatePinToken, canRequestCode, generateCode, verifyCode, createSession, destroySession } from '../services/authService.js';
import { sendTelegramCode } from '../services/telegram.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/pin', async (req, reply) => {
    const ip = req.ip;
    if (isLockedOut(ip)) {
      return reply.code(429).send({ success: false, error: 'Too many attempts. Try again later.' });
    }
    const { pin } = req.body as { pin: string };
    const result = validatePin(pin, ip);
    if (!result.ok) {
      return reply.code(401).send({ success: false, error: 'Invalid PIN' });
    }
    return { success: true, pinToken: result.pinToken };
  });

  app.post('/api/auth/code', async (req, reply) => {
    const { pinToken } = req.body as { pinToken: string };
    if (!validatePinToken(pinToken)) {
      return reply.code(401).send({ success: false, error: 'Invalid or expired PIN token' });
    }
    if (!canRequestCode()) {
      return reply.code(429).send({ success: false, error: 'Please wait before requesting a new code' });
    }
    const code = generateCode();
    await sendTelegramCode(code);
    return { success: true, message: 'Code sent to Telegram' };
  });

  app.post('/api/auth/verify', async (req, reply) => {
    const { pinToken, code } = req.body as { pinToken: string; code: string };
    if (!validatePinToken(pinToken)) {
      return reply.code(401).send({ success: false, error: 'Invalid or expired PIN token' });
    }
    if (!verifyCode(code)) {
      return reply.code(401).send({ success: false, error: 'Invalid or expired code' });
    }
    const token = createSession(req.ip);
    reply.setCookie('relay_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 3600,
    });
    return { success: true };
  });

  app.post('/api/auth/logout', async (req, reply) => {
    const token = req.cookies?.relay_session;
    if (token) destroySession(token);
    reply.clearCookie('relay_session', { path: '/' });
    return { success: true };
  });

  app.get('/api/auth/check', async (req, reply) => {
    const token = req.cookies?.relay_session;
    if (!token) return { authenticated: false };
    const { validateSession } = await import('../services/authService.js');
    return { authenticated: validateSession(token) };
  });
}
