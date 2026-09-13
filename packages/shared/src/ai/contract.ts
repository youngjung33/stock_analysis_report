import { z } from 'zod';
import { aiContextSchema } from './context';
import { aiInsightEnvelopeSchema } from './insight';

/** Dedicated custom AI endpoint contract */
export const dedicatedAnalyzeRequestSchema = z.object({
  context: aiContextSchema,
  outputSchema: z.record(z.unknown()),
  locale: z.enum(['ko', 'en']),
});

export const dedicatedAnalyzeResponseSchema = z.object({
  insight: aiInsightEnvelopeSchema.omit({ meta: true }).extend({
    meta: aiInsightEnvelopeSchema.shape.meta.optional(),
  }),
});

export type DedicatedAnalyzeRequest = z.infer<typeof dedicatedAnalyzeRequestSchema>;
export type DedicatedAnalyzeResponse = z.infer<typeof dedicatedAnalyzeResponseSchema>;
