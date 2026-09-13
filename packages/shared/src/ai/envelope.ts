import { z } from 'zod';
import { AI_SCHEMA_VERSION } from './constants';

export const aiLocaleSchema = z.enum(['ko', 'en']);

export const aiContextConstraintsSchema = z.object({
  maxSections: z.number().int().positive(),
  tone: z.enum(['neutral', 'educational']),
  noTradeAdvice: z.literal(true),
});

export const aiContextEnvelopeSchema = z.object({
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  kind: z.enum(['portfolio', 'stock']),
  locale: aiLocaleSchema,
  generatedAt: z.string().datetime(),
  contextHash: z.string().min(8),
  constraints: aiContextConstraintsSchema,
});
