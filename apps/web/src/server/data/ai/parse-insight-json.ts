import { aiInsightPayloadSchema, type AiInsightPayload } from '@sar/shared';

/** Strips ```json ... ``` fences some models wrap around JSON */
export function stripMarkdownJsonFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export function parseInsightPayload(raw: string): AiInsightPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripMarkdownJsonFence(raw));
  } catch {
    throw new Error('AI_INVALID_JSON');
  }
  return aiInsightPayloadSchema.parse(parsed);
}
