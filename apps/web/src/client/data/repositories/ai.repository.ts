import type { AiInsightEnvelope, AiProviderId, Market, SupportedLocale } from '@sar/shared';
import { apiClient } from '../api/client';
import { toAppError } from '../../domain/errors/api-error';
import { AppErrorCode } from '@sar/shared';

export type AiAnalysisResponse = { enabled: boolean; insight?: AiInsightEnvelope };

export class ApiAiRepository {
  async fetchStockInsight(input: {
    symbol: string;
    name: string;
    market: Market;
    yahooSymbol?: string;
    locale: SupportedLocale;
  }): Promise<AiAnalysisResponse> {
    try {
      const { data } = await apiClient.post<AiAnalysisResponse>('/ai/stock-analysis', input);
      return data;
    } catch (error) {
      throw toAppError(error, AppErrorCode.AI_PROVIDER_ERROR);
    }
  }

  async fetchPortfolioInsight(locale: SupportedLocale): Promise<AiAnalysisResponse> {
    try {
      const { data } = await apiClient.post<AiAnalysisResponse>('/ai/portfolio-analysis', { locale });
      return data;
    } catch (error) {
      throw toAppError(error, AppErrorCode.AI_PROVIDER_ERROR);
    }
  }

  async getCredentialStatus() {
    const { data } = await apiClient.get<{ configured: boolean; provider?: AiProviderId; updatedAt?: string }>(
      '/account/ai-credential',
    );
    return data;
  }

  async upsertCredential(provider: AiProviderId, apiKey: string) {
    const { data } = await apiClient.put<{ success: boolean }>('/account/ai-credential', {
      provider,
      apiKey,
    });
    return data;
  }

  async deleteCredential() {
    const { data } = await apiClient.delete<{ success: boolean }>('/account/ai-credential');
    return data;
  }
}

export const aiRepository = new ApiAiRepository();
