import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cache = new Map<string, string>();

export function loadAiPrompt(name: 'stock-v1' | 'portfolio-v1'): string {
  const cached = cache.get(name);
  if (cached) return cached;
  const path = join(process.cwd(), 'src/server/data/ai/prompts', `${name}.txt`);
  const text = readFileSync(path, 'utf8');
  cache.set(name, text);
  return text;
}
