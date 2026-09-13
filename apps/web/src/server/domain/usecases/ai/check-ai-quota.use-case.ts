import {
  AI_PORTFOLIO_DAILY_LIMIT,
  AI_STOCK_DAILY_LIMIT,
  AppErrorCode,
  type AiAnalysisKind,
} from '@sar/shared';
import { ValidationError } from '../../errors/domain.errors';
import { kstDayBounds } from '@/server/data/ai/kst-day-bounds';
import { PrismaAiUsageRepository } from '@/server/data/persistence/ai.repositories';

export class CheckAiQuotaUseCase {
  constructor(private readonly usageRepo = new PrismaAiUsageRepository()) {}

  async assertCanUse(userId: string, kind: AiAnalysisKind): Promise<void> {
    const limit = kind === 'portfolio' ? AI_PORTFOLIO_DAILY_LIMIT : AI_STOCK_DAILY_LIMIT;
    const { start, end } = kstDayBounds();
    const count = await this.usageRepo.countToday(userId, kind, start, end);
    if (count >= limit) {
      throw new ValidationError(AppErrorCode.AI_QUOTA_EXCEEDED);
    }
  }

  async recordUsage(userId: string, kind: AiAnalysisKind): Promise<void> {
    await this.usageRepo.recordUsage(userId, kind);
  }
}
