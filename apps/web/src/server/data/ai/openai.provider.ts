import type { AiProviderPort, AiStructuredRequest } from '@/server/domain/ports/ai-provider.port';
import { parseInsightPayload } from './parse-insight-json';
import { readAiTimeoutMs } from './ai-config';

export class OpenAiProvider implements AiProviderPort {
  readonly id = 'openai';

  constructor(
    private readonly apiKey: string,
    readonly model: string,
  ) {}

  async completeStructured(req: AiStructuredRequest) {
    const userText = JSON.stringify({ locale: req.locale, context: req.context });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), readAiTimeoutMs());

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          temperature: req.temperature,
          max_tokens: req.maxTokens,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: req.systemPrompt },
            { role: 'user', content: userText },
          ],
        }),
      });

      if (!res.ok) throw new Error(`OPENAI_HTTP_${res.status}`);
      const body = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = body.choices?.[0]?.message?.content;
      if (!text) throw new Error('OPENAI_EMPTY_RESPONSE');
      return parseInsightPayload(text);
    } finally {
      clearTimeout(timer);
    }
  }
}
