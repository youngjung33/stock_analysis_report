export const AI_SCHEMA_VERSION = '1.0' as const;

export type AiAnalysisKind = 'portfolio' | 'stock';

export type AiProviderId = 'gemini' | 'openai' | 'anthropic' | 'custom' | 'off';

export const AI_PORTFOLIO_DAILY_LIMIT = 1;
export const AI_STOCK_DAILY_LIMIT = 3;

export const AI_MEMO_MAX_LENGTH = 200;

/** Max news titles sent to LLM (title-only, no URLs/body). */
export const AI_NEWS_TITLE_MAX = 5;

/** Cap insight sections after sanitize (cost + UI). */
export const AI_INSIGHT_SECTION_MAX = 6;

/** LLM generation — lower temperature for stability. */
export const AI_TEMPERATURE = 0.2;

/** Output token cap per request (cost control). */
export const AI_MAX_OUTPUT_TOKENS = 1536;

/** Max characters per insight section body after sanitize. */
export const AI_SECTION_BODY_MAX = 900;

export const AI_DISCLAIMER_KO =
  '본 내용은 AI가 제공한 참고 정보이며 투자 권유·매매 지시가 아닙니다. 최종 판단과 책임은 이용자에게 있습니다.';

export const AI_DISCLAIMER_EN =
  'This AI-generated content is for reference only and is not investment advice or a trading instruction. You are solely responsible for your decisions.';

export const STOCK_INSIGHT_SECTION_IDS = [
  'stock.summary',
  'stock.priceContext',
  'stock.catalysts',
  'stock.profileLink',
  'stock.openQuestions',
] as const;

export const PORTFOLIO_INSIGHT_SECTION_IDS = [
  'portfolio.summary',
  'portfolio.allocation',
  'portfolio.profileFit',
  'portfolio.riskWatch',
  'portfolio.nextQuestions',
] as const;
