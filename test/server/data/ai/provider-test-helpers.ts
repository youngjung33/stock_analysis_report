export const validInsightPayload = JSON.stringify({
  sections: [{ id: 'stock.summary', title: 'Summary', body: 'Body text' }],
});

export const minimalAiRequest = {
  systemPrompt: 'prompt',
  context: { kind: 'stock' } as never,
  locale: 'ko' as const,
  maxTokens: 512,
  temperature: 0.2,
};
