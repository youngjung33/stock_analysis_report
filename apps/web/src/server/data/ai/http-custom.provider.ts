import { dedicatedAnalyzeResponseSchema, aiInsightPayloadSchema } from '@sar/shared';
import type { AiProviderPort, AiStructuredRequest } from '@/server/domain/ports/ai-provider.port';
import { AI_INSIGHT_PAYLOAD_JSON_SCHEMA } from './insight-json-schema';
import { readAiTimeoutMs } from './ai-config';
export class HttpCustomProvider implements AiProviderPort {
  readonly id = 'custom';

  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string | undefined,
    readonly model: string,
  ) {}

  async completeStructured(req: AiStructuredRequest) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), readAiTimeoutMs());

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          context: req.context,
          outputSchema: AI_INSIGHT_PAYLOAD_JSON_SCHEMA,
          locale: req.locale,
        }),
      });

      if (!res.ok) throw new Error(`CUSTOM_HTTP_${res.status}`);
      const body = await res.json();
      if (body == null || (typeof body === 'object' && Object.keys(body).length === 0)) {
        throw new Error('CUSTOM_EMPTY_RESPONSE');
      }
      const dedicated = dedicatedAnalyzeResponseSchema.safeParse(body);
      if (dedicated.success) {
        return aiInsightPayloadSchema.parse({ sections: dedicated.data.insight.sections });
      }
      return aiInsightPayloadSchema.parse(body);
    } finally {
      clearTimeout(timer);
    }
  }
}
