import type { EventType } from '../constants.js';

export interface RelayEvent {
  id: string;
  type: EventType;
  timestamp: string;
  source: {
    agentId: string;
    agentName: string;
    sessionKey?: string;
  };
  projectId: string;
  payload: Record<string, unknown>;
  meta: {
    version: string;
    correlationId?: string;
    parentEventId?: string;
  };
}

export interface StoredEvent {
  id: string;
  type: string;
  timestamp: string;
  source_agent_id: string;
  source_agent_name: string;
  source_session_key: string | null;
  project_id: string;
  payload: string; // JSON
  correlation_id: string | null;
  parent_event_id: string | null;
  version: string;
}

export interface TokenUsage {
  input: number;
  output: number;
  model: string;
  thinkingLevel?: string;
  estimatedCost: number;
  currency?: string;
}
