import {
  AI_INSIGHT_SECTION_MAX,
  AI_SECTION_BODY_MAX,
  PORTFOLIO_INSIGHT_SECTION_IDS,
  STOCK_INSIGHT_SECTION_IDS,
  type AiAnalysisKind,
} from './constants';
import type { AiInsightSection } from './insight';

const ALLOWED_IDS: Record<AiAnalysisKind, readonly string[]> = {
  stock: STOCK_INSIGHT_SECTION_IDS,
  portfolio: PORTFOLIO_INSIGHT_SECTION_IDS,
};

/** Patterns that suggest explicit trade advice — section dropped if matched. */
const TRADE_ADVICE_PATTERN =
  /\b(buy now|sell now|strong buy|strong sell|must buy|must sell)\b|(매수하|매도하|지금\s*사|지금\s*팔|적극\s*매수|적극\s*매도|전량\s*매수|전량\s*매도)/i;

export function containsTradeAdvice(text: string): boolean {
  return TRADE_ADVICE_PATTERN.test(text);
}

export function sanitizeInsightSections(
  sections: AiInsightSection[],
  kind: AiAnalysisKind,
): AiInsightSection[] {
  const allowed = new Set<string>(ALLOWED_IDS[kind]);
  const seenIds = new Set<string>();
  const cleaned: AiInsightSection[] = [];

  for (const section of sections) {
    const id = section.id.trim();
    const title = section.title.trim();
    const body = section.body.trim();
    if (!id || !title || !body) continue;
    if (!allowed.has(id)) continue;
    if (seenIds.has(id)) continue;
    if (containsTradeAdvice(`${title} ${body}`)) continue;

    seenIds.add(id);
    cleaned.push({
      ...section,
      id,
      title,
      body: body.length > AI_SECTION_BODY_MAX ? `${body.slice(0, AI_SECTION_BODY_MAX)}…` : body,
    });
    if (cleaned.length >= AI_INSIGHT_SECTION_MAX) break;
  }

  return cleaned;
}
