import { z } from 'zod';
import { EVENT_TYPES } from '../constants.js';

export const eventSourceSchema = z.object({
  agentId: z.string().min(1),
  agentName: z.string().min(1),
  sessionKey: z.string().optional(),
});

export const eventMetaSchema = z.object({
  version: z.string().default('0.1.0'),
  correlationId: z.string().optional(),
  parentEventId: z.string().optional(),
});

export const relayEventSchema = z.object({
  id: z.string().optional(),
  type: z.enum(EVENT_TYPES),
  timestamp: z.string().datetime().optional(),
  source: eventSourceSchema,
  projectId: z.string().min(1),
  payload: z.record(z.unknown()),
  meta: eventMetaSchema.optional(),
});

export const tokenUsageSchema = z.object({
  input: z.number().int().nonnegative(),
  output: z.number().int().nonnegative(),
  model: z.string(),
  thinkingLevel: z.string().optional(),
  estimatedCost: z.number().nonnegative(),
  currency: z.string().default('USD'),
});

export type RelayEventInput = z.infer<typeof relayEventSchema>;
