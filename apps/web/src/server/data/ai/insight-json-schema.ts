/** JSON schema description for LLM structured output (sections only) */
export const AI_INSIGHT_PAYLOAD_JSON_SCHEMA = {
  type: 'object',
  properties: {
    sections: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          severity: { type: 'string', enum: ['info', 'watch', 'highlight'] },
          relatedSymbols: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['id', 'title', 'body'],
      },
    },
  },
  required: ['sections'],
} as const;
