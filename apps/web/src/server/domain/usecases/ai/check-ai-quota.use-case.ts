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

  /** Atomically reserves one daily quota slot; throws when limit reached */
  async reserveUsage(userId: string, kind: AiAnalysisKind): Promise<string> {
    const limit = kind === 'portfolio' ? AI_PORTFOLIO_DAILY_LIMIT : AI_STOCK_DAILY_LIMIT;
    const { start, end } = kstDayBounds();
    const id = await this.usageRepo.reserveUsage(userId, kind, start, end, limit);
    if (!id) {
      throw new ValidationError(AppErrorCode.AI_QUOTA_EXCEEDED);
    }
    return id;
  }

  /** Refunds a reserved slot when provider/sanitize fails */
  async releaseUsage(usageId: string): Promise<void> {
    await this.usageRepo.deleteUsage(usageId);
  }

  /** @deprecated use reserveUsage */
  async assertCanUse(userId: string, kind: AiAnalysisKind): Promise<void> {
    await this.reserveUsage(userId, kind);
  }

  /** @deprecated use reserveUsage */
  async recordUsage(userId: string, kind: AiAnalysisKind): Promise<void> {
    await this.usageRepo.recordUsage(userId, kind);
  }
}
