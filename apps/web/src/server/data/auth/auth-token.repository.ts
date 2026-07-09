import { AuthTokenEntity } from '../../domain/entities';
import { IAuthTokenRepository } from '../../domain/repositories';
import { prisma as defaultPrisma } from '../persistence/prisma.service';
import { PrismaClient } from '@prisma/client';

export class PrismaAuthTokenRepository implements IAuthTokenRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async create(data: {
    userId: string;
    type: string;
    tokenHash: string;
    email?: string | null;
    expiresAt: Date;
  }): Promise<AuthTokenEntity> {
    return this.prisma.authToken.create({ data });
  }

  async consumeValid(tokenHash: string, type: string): Promise<AuthTokenEntity | null> {
    const row = await this.prisma.authToken.findUnique({ where: { tokenHash } });
    if (!row || row.type !== type || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    return this.prisma.authToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    });
  }

  async invalidateUserTokens(userId: string, type: string): Promise<void> {
    await this.prisma.authToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
