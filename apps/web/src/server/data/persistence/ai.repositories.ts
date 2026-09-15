import { prisma } from './prisma.service';
import type { AiProviderId } from '@sar/shared';

export class PrismaAiUsageRepository {
  countToday(userId: string, kind: string, start: Date, end: Date): Promise<number> {
    return prisma.aiUsageLog.count({
      where: { userId, kind, usedAt: { gte: start, lt: end } },
    });
  }

  /** Atomic quota check + reservation — returns null when limit reached */
  reserveUsage(
    userId: string,
    kind: string,
    start: Date,
    end: Date,
    limit: number,
  ): Promise<string | null> {
    return prisma.$transaction(async (tx) => {
      const count = await tx.aiUsageLog.count({
        where: { userId, kind, usedAt: { gte: start, lt: end } },
      });
      if (count >= limit) return null;
      const row = await tx.aiUsageLog.create({ data: { userId, kind } });
      return row.id;
    });
  }

  deleteUsage(id: string): Promise<void> {
    return prisma.aiUsageLog
      .delete({ where: { id } })
      .then(() => undefined)
      .catch(() => undefined);
  }

  /** @deprecated use reserveUsage */
  recordUsage(userId: string, kind: string): Promise<void> {
    return prisma.aiUsageLog
      .create({ data: { userId, kind } })
      .then(() => undefined);
  }
}

export interface StoredAiCredential {
  provider: AiProviderId;
  encryptedKey: string;
  keyIv: string;
}

export class PrismaUserAiCredentialRepository {
  findByUserId(userId: string) {
    return prisma.userAiCredential.findUnique({ where: { userId } });
  }

  upsert(userId: string, provider: AiProviderId, encryptedKey: string, keyIv: string) {
    return prisma.userAiCredential.upsert({
      where: { userId },
      create: { userId, provider, encryptedKey, keyIv },
      update: { provider, encryptedKey, keyIv },
    });
  }

  delete(userId: string) {
    return prisma.userAiCredential.deleteMany({ where: { userId } });
  }
}
