import {
  AI_DISCLAIMER_EN,
  AI_DISCLAIMER_KO,
  AI_MAX_OUTPUT_TOKENS,
  AI_TEMPERATURE,
  aiInsightEnvelopeSchema,
  aiInsightPayloadSchema,
  AppErrorCode,
  sanitizeInsightSections,
  type AiAnalysisKind,
  type AiContext,
  type AiInsightEnvelope,
  type SupportedLocale,
} from '@sar/shared';
import { ValidationError } from '../../errors/domain.errors';
import { loadAiPrompt } from '@/server/data/ai/load-prompt';
import { resolveAiProviderForUser } from '@/server/data/ai/resolve-ai-provider';
import { isAiEnabled } from '@/server/data/ai/ai-config';
import { CheckAiQuotaUseCase } from './check-ai-quota.use-case';

export class RunAiAnalysisUseCase {
  constructor(private readonly checkQuotaUseCase = new CheckAiQuotaUseCase()) {}

  async execute(input: {
    userId: string;
    kind: AiAnalysisKind;
    context: AiContext;
    locale: SupportedLocale;
  }): Promise<AiInsightEnvelope> {
    if (!isAiEnabled()) {
      throw new ValidationError(AppErrorCode.AI_DISABLED);
    }

    await this.checkQuotaUseCase.assertCanUse(input.userId, input.kind);

    const provider = await resolveAiProviderForUser(input.userId);
    if (!provider) {
      throw new ValidationError(AppErrorCode.AI_DISABLED);
    }

    const promptVersion = input.kind === 'stock' ? 'stock-v1' : 'portfolio-v1';
    const systemPrompt = loadAiPrompt(promptVersion);
    const started = Date.now();

    const request = {
      systemPrompt,
      context: input.context,
      locale: input.locale,
      maxTokens: AI_MAX_OUTPUT_TOKENS,
      temperature: AI_TEMPERATURE,
    };

    let rawPayload;
    try {
      rawPayload = await this.callProviderWithRetry(provider, request);
    } catch {
      throw new ValidationError(AppErrorCode.AI_PROVIDER_ERROR);
    }

    const sections = sanitizeInsightSections(rawPayload.sections, input.kind);
    if (sections.length === 0) {
      throw new ValidationError(AppErrorCode.AI_PROVIDER_ERROR);
    }

    const envelope = aiInsightEnvelopeSchema.parse({
      schemaVersion: input.context.schemaVersion,
      kind: input.kind,
      locale: input.locale,
      disclaimer: input.locale === 'en' ? AI_DISCLAIMER_EN : AI_DISCLAIMER_KO,
      meta: {
        providerId: provider.id,
        model: provider.model,
        promptVersion,
        latencyMs: Date.now() - started,
      },
      sections,
    });

    await this.checkQuotaUseCase.recordUsage(input.userId, input.kind);
    return envelope;
  }

  private async callProviderWithRetry(
    provider: Awaited<ReturnType<typeof resolveAiProviderForUser>>,
    request: Parameters<NonNullable<typeof provider>['completeStructured']>[0],
  ) {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const payload = await provider!.completeStructured(request);
        return aiInsightPayloadSchema.parse(payload);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }
}
