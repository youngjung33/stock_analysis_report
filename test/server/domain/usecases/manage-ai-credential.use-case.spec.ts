import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppErrorCode } from '@sar/shared';
import {
  DeleteAiCredentialUseCase,
  GetAiCredentialStatusUseCase,
  UpsertAiCredentialUseCase,
  ValidateAiCredentialUseCase,
} from '@/server/domain/usecases/ai/manage-ai-credential.use-case';

const { mockFindByUserId, mockUpsert, mockDelete, mockEncryptApiKey, mockValidateExecute } =
  vi.hoisted(() => ({
    mockFindByUserId: vi.fn(),
    mockUpsert: vi.fn(),
    mockDelete: vi.fn(),
    mockEncryptApiKey: vi.fn(),
    mockValidateExecute: vi.fn(),
  }));

vi.mock('@/server/data/persistence/ai.repositories', () => ({
  PrismaUserAiCredentialRepository: vi.fn().mockImplementation(() => ({
    findByUserId: mockFindByUserId,
    upsert: mockUpsert,
    delete: mockDelete,
  })),
}));

vi.mock('@/server/data/ai/credential-cipher', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/data/ai/credential-cipher')>();
  return {
    ...actual,
    encryptApiKey: (...args: unknown[]) => mockEncryptApiKey(...args),
  };
});

const ORIGINAL_SECRET = process.env.AI_CREDENTIALS_SECRET;

describe('manage-ai-credential use cases', () => {
  beforeEach(() => {
    process.env.AI_CREDENTIALS_SECRET = 'test-ai-credentials-secret-min-32-chars!!';
    mockFindByUserId.mockReset();
    mockUpsert.mockReset();
    mockDelete.mockReset();
    mockEncryptApiKey.mockReset();
    mockValidateExecute.mockReset();
    mockEncryptApiKey.mockReturnValue({ encryptedKey: 'enc', keyIv: 'iv' });
    mockValidateExecute.mockResolvedValue({ ok: true });
    mockUpsert.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (ORIGINAL_SECRET === undefined) delete process.env.AI_CREDENTIALS_SECRET;
    else process.env.AI_CREDENTIALS_SECRET = ORIGINAL_SECRET;
  });

  const mockValidateUseCase = { execute: mockValidateExecute } as unknown as ValidateAiCredentialUseCase;

  describe('GetAiCredentialStatusUseCase', () => {
    it('returns configured false when no row', async () => {
      mockFindByUserId.mockResolvedValue(null);
      const result = await new GetAiCredentialStatusUseCase().execute('user-1');
      expect(result).toEqual({ configured: false });
    });

    it('returns provider when configured', async () => {
      const { encryptApiKey: realEncrypt } = await vi.importActual<
        typeof import('@/server/data/ai/credential-cipher')
      >('@/server/data/ai/credential-cipher');
      const { encryptedKey, keyIv } = realEncrypt('valid-api-key-12345678');
      mockFindByUserId.mockResolvedValue({
        provider: 'gemini',
        encryptedKey,
        keyIv,
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      });
      const result = await new GetAiCredentialStatusUseCase().execute('user-1');
      expect(result).toMatchObject({ configured: true, provider: 'gemini', decryptFailed: false });
    });

    it('flags decryptFailed when stored key cannot be decrypted', async () => {
      mockFindByUserId.mockResolvedValue({
        provider: 'gemini',
        encryptedKey: 'bad',
        keyIv: 'bad',
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      });
      const result = await new GetAiCredentialStatusUseCase().execute('user-1');
      expect(result).toMatchObject({ configured: true, decryptFailed: true });
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

    it('persists encrypted credential and returns validation result', async () => {
      const result = await new UpsertAiCredentialUseCase(mockValidateUseCase).execute(
        'user-1',
        'gemini',
        '  valid-api-key-123  ',
      );
      expect(result).toEqual({ success: true, validated: true });
      expect(mockEncryptApiKey).toHaveBeenCalledWith('valid-api-key-123');
      expect(mockUpsert).toHaveBeenCalledWith('user-1', 'gemini', 'enc', 'iv');
      expect(mockValidateExecute).toHaveBeenCalledWith('user-1');
    });

    it('returns validated false when smoke test fails', async () => {
      mockValidateExecute.mockResolvedValue({ ok: false });
      const result = await new UpsertAiCredentialUseCase(mockValidateUseCase).execute(
        'user-1',
        'gemini',
        'valid-api-key-123',
      );
      expect(result).toEqual({ success: true, validated: false });
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
