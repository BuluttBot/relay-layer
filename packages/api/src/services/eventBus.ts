type Listener = (data: unknown) => void;

class EventBus {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, fn: Listener): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
  }

  off(event: string, fn: Listener): void {
    this.listeners.get(event)?.delete(fn);
  }

  emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(fn => fn(data));
    if (event !== '*') this.listeners.get('*')?.forEach(fn => fn(data));
  }
}

export const eventBus = new EventBus();
