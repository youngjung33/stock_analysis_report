import { AI_MEMO_MAX_LENGTH } from './constants';

/** Control chars + excessive whitespace strip for memo fields sent to AI */
export function sanitizeMemoForAi(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let text = raw
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return null;
  if (text.length > AI_MEMO_MAX_LENGTH) {
    text = `${text.slice(0, AI_MEMO_MAX_LENGTH)}…`;
  }
  return text;
}
