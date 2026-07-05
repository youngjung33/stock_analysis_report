import { OAuthProviderId } from '@sar/shared';
import { OAuthStateEntity, UserOAuthAccountEntity } from '../../domain/entities';
import { IOAuthStateRepository, IUserOAuthAccountRepository } from '../../domain/repositories';
import { prisma as defaultPrisma } from '../persistence/prisma.service';
import { PrismaClient } from '@prisma/client';

export class PrismaUserOAuthAccountRepository implements IUserOAuthAccountRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async findByProviderUserId(
    provider: OAuthProviderId,
    providerUserId: string,
  ): Promise<UserOAuthAccountEntity | null> {
    const account = await this.prisma.userOAuthAccount.findUnique({
      where: { provider_providerUserId: { provider, providerUserId } },
    });
    return account;
  }

  async create(
    data: Omit<UserOAuthAccountEntity, 'id' | 'createdAt'>,
  ): Promise<UserOAuthAccountEntity> {
    return this.prisma.userOAuthAccount.create({ data });
  }
}

export class PrismaOAuthStateRepository implements IOAuthStateRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async create(data: Omit<OAuthStateEntity, 'id' | 'createdAt'>): Promise<OAuthStateEntity> {
    return this.prisma.oAuthState.create({ data });
  }

  async consume(state: string, provider: OAuthProviderId): Promise<OAuthStateEntity | null> {
    const row = await this.prisma.oAuthState.findUnique({ where: { state } });
    if (!row || row.provider !== provider || row.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    await this.prisma.oAuthState.delete({ where: { id: row.id } });
    return row;
  }
}
