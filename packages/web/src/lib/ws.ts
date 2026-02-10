type WsHandler = (data: any) => void;

let socket: WebSocket | null = null;
let handlers: WsHandler[] = [];
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let attempt = 0;

export function connectWs(token: string) {
  if (socket?.readyState === WebSocket.OPEN) return;

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
  socket = new WebSocket(`${wsUrl}?token=${token}`);

  socket.onopen = () => { attempt = 0; };

  socket.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'ping') {
        socket?.send(JSON.stringify({ type: 'pong' }));
        return;
      }
      handlers.forEach(h => h(msg));
    } catch {}
  };

  socket.onclose = () => {
    attempt++;
    const delay = Math.min(1000 * 2 ** attempt, 30000);
    reconnectTimer = setTimeout(() => connectWs(token), delay);
  };

  socket.onerror = () => socket?.close();
}

export function disconnectWs() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  socket?.close();
  socket = null;
  handlers = [];
}

export function onWsMessage(handler: WsHandler) {
  handlers.push(handler);
  return () => { handlers = handlers.filter(h => h !== handler); };
}
