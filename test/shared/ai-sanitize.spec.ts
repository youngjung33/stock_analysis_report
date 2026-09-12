import { describe, expect, it } from 'vitest';
import { sanitizeMemoForAi } from '@sar/shared';

describe('sanitizeMemoForAi', () => {
  it('trims and collapses whitespace', () => {
    expect(sanitizeMemoForAi('  hello   world  ')).toBe('hello world');
  });

  it('returns null for empty', () => {
    expect(sanitizeMemoForAi('   ')).toBeNull();
  });

  it('truncates long memo', () => {
    const long = 'a'.repeat(250);
    const out = sanitizeMemoForAi(long);
    expect(out!.length).toBeLessThanOrEqual(201);
  });
});
