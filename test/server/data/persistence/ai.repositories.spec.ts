import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

const { mockTransaction } = vi.hoisted(() => ({
  mockTransaction: vi.fn(),
}));

vi.mock('@/server/data/persistence/prisma.service', () => ({
  prisma: {
    aiUsageLog: {
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: mockTransaction,
  },
}));

vi.mock('@/server/observability/logger', () => ({
  logWarn: vi.fn(),
}));

import { PrismaAiUsageRepository } from '@/server/data/persistence/ai.repositories';

describe('PrismaAiUsageRepository', () => {
  it('uses serializable isolation for reserveUsage', async () => {
    mockTransaction.mockImplementation(async (fn, options) => {
      expect(options).toEqual({
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
      return fn({
        aiUsageLog: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockResolvedValue({ id: 'usage-1' }),
        },
      });
    });

    const repo = new PrismaAiUsageRepository();
    await expect(
      repo.reserveUsage('user-1', 'stock', new Date('2026-09-21'), new Date('2026-09-22'), 3),
    ).resolves.toBe('usage-1');
  });
});
