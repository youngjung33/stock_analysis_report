import path from 'path';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { isE2EDatabaseConfigured, resolveMemberE2ECredentials } from './member-e2e-env';

/** E2E member 테스트용 — seed 사용자 거래·현금 원장 초기화 (반복 실행 idempotent) */
export async function resetMemberE2EUserState(): Promise<void> {
  if (!isE2EDatabaseConfigured()) return;

  loadEnv({ path: path.resolve(__dirname, '../../apps/web/.env') });

  const { username } = resolveMemberE2ECredentials();
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return;

    await prisma.transaction.deleteMany({ where: { userId: user.id } });
    await prisma.cashLedgerEntry.deleteMany({ where: { userId: user.id } });
  } finally {
    await prisma.$disconnect();
  }
}
