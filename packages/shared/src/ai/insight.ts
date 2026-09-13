import { z } from 'zod';
import { AI_SCHEMA_VERSION } from './constants';

export const aiInsightSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  severity: z.enum(['info', 'watch', 'highlight']).optional(),
  relatedSymbols: z.array(z.string()).optional(),
  confidence: z.enum(['low', 'medium', 'high']).optional(),
});

export const aiInsightEnvelopeSchema = z.object({
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  kind: z.enum(['portfolio', 'stock']),
  locale: z.enum(['ko', 'en']),
  disclaimer: z.string().min(1),
  meta: z.object({
    providerId: z.string(),
    model: z.string(),
    promptVersion: z.string(),
    latencyMs: z.number().nonnegative(),
  }),
  sections: z.array(aiInsightSectionSchema).min(1),
});

export type AiInsightSection = z.infer<typeof aiInsightSectionSchema>;
export type AiInsightEnvelope = z.infer<typeof aiInsightEnvelopeSchema>;

/** Provider raw response before meta merge */
export const aiInsightPayloadSchema = z.object({
  sections: z.array(aiInsightSectionSchema).min(1),
});

export type AiInsightPayload = z.infer<typeof aiInsightPayloadSchema>;
