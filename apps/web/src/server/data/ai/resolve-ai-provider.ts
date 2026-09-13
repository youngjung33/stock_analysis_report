import type { AiProviderId } from '@sar/shared';
import type { AiProviderPort } from '@/server/domain/ports/ai-provider.port';
import { readAiModel, readAiProvider } from './ai-config';
import { decryptApiKey } from './credential-cipher';
import { PrismaUserAiCredentialRepository } from '../persistence/ai.repositories';
import { GeminiProvider } from './gemini.provider';
import { OpenAiProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { HttpCustomProvider } from './http-custom.provider';

const credentialRepo = new PrismaUserAiCredentialRepository();

function serverApiKey(provider: AiProviderId): string | null {
  switch (provider) {
    case 'gemini':
      return process.env.GOOGLE_AI_API_KEY?.trim() || null;
    case 'openai':
      return process.env.OPENAI_API_KEY?.trim() || null;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY?.trim() || null;
    case 'custom':
      return process.env.AI_CUSTOM_API_KEY?.trim() || null;
    default:
      return null;
  }
}

function buildProvider(provider: AiProviderId, apiKey: string): AiProviderPort {
  const model = readAiModel(provider);
  switch (provider) {
    case 'gemini':
      return new GeminiProvider(apiKey, model);
    case 'openai':
      return new OpenAiProvider(apiKey, model);
    case 'anthropic':
      return new AnthropicProvider(apiKey, model);
    case 'custom': {
      const endpoint = process.env.AI_CUSTOM_ENDPOINT?.trim();
      if (!endpoint) throw new Error('AI_CUSTOM_ENDPOINT missing');
      return new HttpCustomProvider(endpoint, apiKey || undefined, model);
    }
    default:
      throw new Error('AI_PROVIDER_OFF');
  }
}

/** User BYOK first, then server env key for configured AI_PROVIDER */
export async function resolveAiProviderForUser(userId: string): Promise<AiProviderPort | null> {
  const defaultProvider = readAiProvider();
  if (defaultProvider === 'off') return null;

  const stored = await credentialRepo.findByUserId(userId);
  if (stored) {
    try {
      const key = decryptApiKey(stored.encryptedKey, stored.keyIv);
      return buildProvider(stored.provider as AiProviderId, key);
    } catch {
      // fall through to server key if decrypt fails
    }
  }

  const key = serverApiKey(defaultProvider);
  if (!key && defaultProvider !== 'custom') return null;
  if (defaultProvider === 'custom' && !process.env.AI_CUSTOM_ENDPOINT?.trim()) return null;
  return buildProvider(defaultProvider, key ?? '');
}
