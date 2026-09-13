import { aiInsightPayloadSchema, type AiInsightPayload } from '@sar/shared';

export function parseInsightPayload(raw: string): AiInsightPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('AI_INVALID_JSON');
  }
  return aiInsightPayloadSchema.parse(parsed);
}
