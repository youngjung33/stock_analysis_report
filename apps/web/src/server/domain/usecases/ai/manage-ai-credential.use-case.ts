import { AppErrorCode, type AiProviderId } from '@sar/shared';
import { ValidationError } from '../../errors/domain.errors';
import { decryptApiKey, encryptApiKey } from '@/server/data/ai/credential-cipher';
import { PrismaUserAiCredentialRepository } from '@/server/data/persistence/ai.repositories';
import { resolveAiProviderForUser } from '@/server/data/ai/resolve-ai-provider';
import { loadAiPrompt } from '@/server/data/ai/load-prompt';
import type { StockAiContext } from '@sar/shared';

const credentialRepo = new PrismaUserAiCredentialRepository();

const VALID_PROVIDERS = new Set<AiProviderId>(['gemini', 'openai', 'anthropic', 'custom']);

export class GetAiCredentialStatusUseCase {
  async execute(userId: string) {
    const row = await credentialRepo.findByUserId(userId);
    if (!row) return { configured: false as const };

    let decryptFailed = false;
    try {
      decryptApiKey(row.encryptedKey, row.keyIv);
    } catch {
      decryptFailed = true;
    }

    return {
      configured: true as const,
      provider: row.provider as AiProviderId,
      updatedAt: row.updatedAt.toISOString(),
      decryptFailed,
    };
  }
}

export class UpsertAiCredentialUseCase {
  constructor(
    private readonly validateAiCredentialUseCase = new ValidateAiCredentialUseCase(),
  ) {}

  async execute(userId: string, provider: AiProviderId, apiKey: string) {
    if (!VALID_PROVIDERS.has(provider)) {
      throw new ValidationError(AppErrorCode.VALIDATION);
    }
    const trimmed = apiKey.trim();
    if (trimmed.length < 8) {
      throw new ValidationError(AppErrorCode.VALIDATION);
    }
    let encryptedKey: string;
    let keyIv: string;
    try {
      ({ encryptedKey, keyIv } = encryptApiKey(trimmed));
    } catch {
      throw new ValidationError(AppErrorCode.INTERNAL);
    }
    await credentialRepo.upsert(userId, provider, encryptedKey, keyIv);
    const validated = await this.validateAiCredentialUseCase.execute(userId);
    return { success: true, validated: validated.ok };
  }
}

export class DeleteAiCredentialUseCase {
  async execute(userId: string) {
    await credentialRepo.delete(userId);
    return { success: true };
  }
}

/** Optional smoke test when saving BYOK — minimal validate call */
export class ValidateAiCredentialUseCase {
  async execute(userId: string): Promise<{ ok: boolean }> {
    const provider = await resolveAiProviderForUser(userId);
    if (!provider) return { ok: false };
    const stubContext: StockAiContext = {
      schemaVersion: '1.0',
      kind: 'stock',
      locale: 'ko',
      generatedAt: new Date().toISOString(),
      contextHash: 'validate',
      constraints: { maxSections: 1, tone: 'neutral', noTradeAdvice: true },
      facts: {
        instrument: { symbol: 'TEST', name: 'Test', market: 'KR', currency: 'KRW' },
        price: { current: 100, change1d: 0, change1w: null, change1mo: null },
        ruleBasedReport: {
          tag: 'hold',
          tagLabel: 'hold',
          score: null,
          insights: [],
          scoreBreakdown: [],
        },
        technical: null,
        marketLink: { regimeIds: [], indexChange1d: null, leadingSectors: [] },
        userLink: { isHeld: false, isWatchlisted: false, portfolioWeightPercent: null },
        recentNewsTitles: [],
        recentEvent: null,
        derived: {
          priceTrendBand: 'flat',
          rsiZone: null,
          newsTone: null,
          eventHint: null,
          ruleTag: 'hold',
        },
      },
    };
    try {
      await provider.completeStructured({
        systemPrompt: loadAiPrompt('stock-v1'),
        context: stubContext,
        locale: 'ko',
        maxTokens: 256,
        temperature: 0,
      });
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }
}
