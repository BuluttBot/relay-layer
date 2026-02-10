import type { FastifyInstance } from 'fastify';
import type { WebSocket, RawData } from 'ws';
import { validateSession } from '../services/authService.js';
import { eventBus } from '../services/eventBus.js';

const clients = new Set<WebSocket>();

export function setupWebSocket(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, (socket, req) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token || !validateSession(token)) {
      socket.close(4001, 'Unauthorized');
      return;
    }

    clients.add(socket);

    socket.on('message', (raw: RawData) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'pong') return;
      } catch {}
    });

    socket.on('close', () => clients.delete(socket));
    socket.on('error', () => clients.delete(socket));
  });

  const pingInterval = setInterval(() => {
    for (const c of clients) {
      try { c.send(JSON.stringify({ type: 'ping' })); } catch { clients.delete(c); }
    }
  }, 30000);

  app.addHook('onClose', () => clearInterval(pingInterval));

  eventBus.on('*', (data) => {
    const msg = JSON.stringify(data);
    for (const c of clients) {
      try { c.send(msg); } catch { clients.delete(c); }
    }
  });
}

export function broadcast(type: string, data: unknown) {
  eventBus.emit(type, { type, data, timestamp: new Date().toISOString() });
}
