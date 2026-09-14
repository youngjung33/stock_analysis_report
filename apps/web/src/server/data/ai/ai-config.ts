import type { AiProviderId } from '@sar/shared';

export function readAiProvider(): AiProviderId {
  const raw = (process.env.AI_PROVIDER ?? 'off').trim().toLowerCase();
  if (raw === 'gemini' || raw === 'openai' || raw === 'anthropic' || raw === 'custom' || raw === 'off') {
    return raw;
  }
  return 'off';
}

export function isAiEnabled(): boolean {
  return readAiProvider() !== 'off';
}

export function isAiGuestAllowed(): boolean {
  return process.env.AI_ALLOW_GUEST === 'true';
}

export function readAiModel(provider: AiProviderId): string {
  const override = process.env.AI_MODEL?.trim();
  if (override) return override;
  switch (provider) {
    case 'gemini':
      return 'gemini-2.0-flash';
    case 'openai':
      return 'gpt-4o-mini';
    case 'anthropic':
      return 'claude-3-5-haiku-latest';
    default:
      return 'unknown';
  }
}

export function readAiTimeoutMs(): number {
  const raw = Number(process.env.AI_CUSTOM_TIMEOUT_MS ?? 30_000);
  return Number.isFinite(raw) && raw > 0 ? raw : 30_000;
}

/** In-memory insight cache by contextHash — default on; set AI_INSIGHT_CACHE=false to disable */
export function isAiInsightCacheEnabled(): boolean {
  return process.env.AI_INSIGHT_CACHE !== 'false';
}
