import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppErrorCode } from '@sar/shared';
import {
  DeleteAiCredentialUseCase,
  GetAiCredentialStatusUseCase,
  UpsertAiCredentialUseCase,
} from '@/server/domain/usecases/ai/manage-ai-credential.use-case';

const { mockFindByUserId, mockUpsert, mockDelete, mockEncryptApiKey } = vi.hoisted(() => ({
  mockFindByUserId: vi.fn(),
  mockUpsert: vi.fn(),
  mockDelete: vi.fn(),
  mockEncryptApiKey: vi.fn(),
}));

vi.mock('@/server/data/persistence/ai.repositories', () => ({
  PrismaUserAiCredentialRepository: vi.fn().mockImplementation(() => ({
    findByUserId: mockFindByUserId,
    upsert: mockUpsert,
    delete: mockDelete,
  })),
}));

vi.mock('@/server/data/ai/credential-cipher', () => ({
  encryptApiKey: (...args: unknown[]) => mockEncryptApiKey(...args),
}));

describe('manage-ai-credential use cases', () => {
  beforeEach(() => {
    mockFindByUserId.mockReset();
    mockUpsert.mockReset();
    mockDelete.mockReset();
    mockEncryptApiKey.mockReset();
    mockEncryptApiKey.mockReturnValue({ encryptedKey: 'enc', keyIv: 'iv' });
    mockUpsert.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
  });

  describe('GetAiCredentialStatusUseCase', () => {
    it('returns configured false when no row', async () => {
      mockFindByUserId.mockResolvedValue(null);
      const result = await new GetAiCredentialStatusUseCase().execute('user-1');
      expect(result).toEqual({ configured: false });
    });

    it('returns provider when configured', async () => {
      mockFindByUserId.mockResolvedValue({
        provider: 'gemini',
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      });
      const result = await new GetAiCredentialStatusUseCase().execute('user-1');
      expect(result).toMatchObject({ configured: true, provider: 'gemini' });
    });
  });

  describe('UpsertAiCredentialUseCase', () => {
    it('throws VALIDATION for invalid provider', async () => {
      await expect(
        new UpsertAiCredentialUseCase().execute('user-1', 'invalid' as never, '12345678'),
      ).rejects.toMatchObject({ code: AppErrorCode.VALIDATION });
    });

    it('throws VALIDATION for short apiKey', async () => {
      await expect(
        new UpsertAiCredentialUseCase().execute('user-1', 'gemini', 'short'),
      ).rejects.toMatchObject({ code: AppErrorCode.VALIDATION });
    });

    it('throws INTERNAL when encryption misconfigured', async () => {
      mockEncryptApiKey.mockImplementation(() => {
        throw new Error('AI_CREDENTIALS_SECRET must be at least 32 characters');
      });
      await expect(
        new UpsertAiCredentialUseCase().execute('user-1', 'gemini', 'valid-api-key-123'),
      ).rejects.toMatchObject({ code: AppErrorCode.INTERNAL });
    });

    it('persists encrypted credential on success', async () => {
      const result = await new UpsertAiCredentialUseCase().execute(
        'user-1',
        'gemini',
        '  valid-api-key-123  ',
      );
      expect(result).toEqual({ success: true });
      expect(mockEncryptApiKey).toHaveBeenCalledWith('valid-api-key-123');
      expect(mockUpsert).toHaveBeenCalledWith('user-1', 'gemini', 'enc', 'iv');
    });
  });

  describe('DeleteAiCredentialUseCase', () => {
    it('deletes credential for user', async () => {
      const result = await new DeleteAiCredentialUseCase().execute('user-1');
      expect(result).toEqual({ success: true });
      expect(mockDelete).toHaveBeenCalledWith('user-1');
    });
  });
});
