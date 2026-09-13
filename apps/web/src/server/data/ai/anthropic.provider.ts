import type { AiProviderPort, AiStructuredRequest } from '@/server/domain/ports/ai-provider.port';
import { parseInsightPayload } from './parse-insight-json';
import { readAiTimeoutMs } from './ai-config';

export class AnthropicProvider implements AiProviderPort {
  readonly id = 'anthropic';

  constructor(
    private readonly apiKey: string,
    readonly model: string,
  ) {}

  async completeStructured(req: AiStructuredRequest) {
    const userText = JSON.stringify({ locale: req.locale, context: req.context });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), readAiTimeoutMs());

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          max_tokens: req.maxTokens,
          temperature: req.temperature,
          system: `${req.systemPrompt}\n\nRespond with JSON only: {"sections":[...]}`,
          messages: [{ role: 'user', content: userText }],
        }),
      });

      if (!res.ok) throw new Error(`ANTHROPIC_HTTP_${res.status}`);
      const body = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const text = body.content?.find((c) => c.type === 'text')?.text;
      if (!text) throw new Error('ANTHROPIC_EMPTY_RESPONSE');
      return parseInsightPayload(text);
    } finally {
      clearTimeout(timer);
    }
  }
}
