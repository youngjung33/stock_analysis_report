import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';

function credentialsSecret(): Buffer {
  const secret = process.env.AI_CREDENTIALS_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error('AI_CREDENTIALS_SECRET must be at least 32 characters');
  }
  return createHashKey(secret);
}

function createHashKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

export function encryptApiKey(plain: string): { encryptedKey: string; keyIv: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, credentialsSecret(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encryptedKey: Buffer.concat([encrypted, tag]).toString('base64'),
    keyIv: iv.toString('base64'),
  };
}

export function decryptApiKey(encryptedKey: string, keyIv: string): string {
  const iv = Buffer.from(keyIv, 'base64');
  const data = Buffer.from(encryptedKey, 'base64');
  const tag = data.subarray(data.length - 16);
  const ciphertext = data.subarray(0, data.length - 16);
  const decipher = createDecipheriv(ALGO, credentialsSecret(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
