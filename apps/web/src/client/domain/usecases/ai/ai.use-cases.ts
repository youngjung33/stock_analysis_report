import type { AiInsightEnvelope, Market, SupportedLocale } from '@sar/shared';
import { ApiAiRepository } from '@/client/data/repositories/ai.repository';

export class FetchStockAiInsightUseCase {
  constructor(private readonly repo: ApiAiRepository) {}

  execute(input: {
    symbol: string;
    name: string;
    market: Market;
    yahooSymbol?: string;
    locale: SupportedLocale;
  }): Promise<{ enabled: boolean; insight?: AiInsightEnvelope }> {
    return this.repo.fetchStockInsight(input);
  }
}

export class FetchPortfolioAiInsightUseCase {
  constructor(private readonly repo: ApiAiRepository) {}

  execute(locale: SupportedLocale): Promise<{ enabled: boolean; insight?: AiInsightEnvelope }> {
    return this.repo.fetchPortfolioInsight(locale);
  }
}

export class GetAiCredentialStatusUseCase {
  constructor(private readonly repo: ApiAiRepository) {}

  execute() {
    return this.repo.getCredentialStatus();
  }
}

export class UpsertAiCredentialUseCase {
  constructor(private readonly repo: ApiAiRepository) {}

  execute(provider: import('@sar/shared').AiProviderId, apiKey: string) {
    return this.repo.upsertCredential(provider, apiKey);
  }
}

export class DeleteAiCredentialUseCase {
  constructor(private readonly repo: ApiAiRepository) {}

  execute() {
    return this.repo.deleteCredential();
  }
}

export class ValidateAiCredentialUseCase {
  constructor(private readonly repo: ApiAiRepository) {}

  execute() {
    return this.repo.validateCredential();
  }
}
