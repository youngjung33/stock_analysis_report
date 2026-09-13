import type { AiContext, AiInsightPayload, SupportedLocale } from '@sar/shared';

export interface AiStructuredRequest {
  systemPrompt: string;
  context: AiContext;
  locale: SupportedLocale;
  maxTokens: number;
  temperature: number;
}

export interface AiProviderPort {
  readonly id: string;
  readonly model: string;
  completeStructured(req: AiStructuredRequest): Promise<AiInsightPayload>;
}

export interface ResolvedAiCredentials {
  providerId: string;
  apiKey: string;
  model: string;
  customEndpoint?: string;
}
