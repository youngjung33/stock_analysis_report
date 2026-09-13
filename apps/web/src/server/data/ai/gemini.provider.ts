import type { AiProviderPort, AiStructuredRequest } from '@/server/domain/ports/ai-provider.port';
import { parseInsightPayload } from './parse-insight-json';
import { AI_INSIGHT_PAYLOAD_JSON_SCHEMA } from './insight-json-schema';
import { readAiTimeoutMs } from './ai-config';

export class GeminiProvider implements AiProviderPort {
  readonly id = 'gemini';

  constructor(
    private readonly apiKey: string,
    readonly model: string,
  ) {}

  async completeStructured(req: AiStructuredRequest) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const userText = JSON.stringify({ locale: req.locale, context: req.context });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), readAiTimeoutMs());

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: req.systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: {
            temperature: req.temperature,
            maxOutputTokens: req.maxTokens,
            responseMimeType: 'application/json',
            responseSchema: AI_INSIGHT_PAYLOAD_JSON_SCHEMA,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`GEMINI_HTTP_${res.status}`);
      }

      const body = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('GEMINI_EMPTY_RESPONSE');
      return parseInsightPayload(text);
    } finally {
      clearTimeout(timer);
    }
  }
}
