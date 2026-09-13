import { createHash } from 'node:crypto';

export function computeContextHash(payload: unknown): string {
  const canonical = JSON.stringify(payload);
  return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}
