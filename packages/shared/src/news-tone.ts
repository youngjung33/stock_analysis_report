export type NewsTone = 'bullish' | 'bearish' | 'neutral';

const BULLISH_NEWS = ['surge', 'rally', 'gain', 'record', 'beat', '상승', '급등', '호재', '반등', '신고가'];
const BEARISH_NEWS = ['fall', 'drop', 'plunge', 'loss', 'miss', '하락', '급락', '우려', '침체', '매도', '조정', 'recession'];

/** v1 headline tone heuristic — shared by market analysis & news enrichment */
export function newsToneFromTitle(title: string): NewsTone {
  const lower = title.toLowerCase();
  let score = 0;
  for (const w of BULLISH_NEWS) {
    if (lower.includes(w.toLowerCase())) score += 1;
  }
  for (const w of BEARISH_NEWS) {
    if (lower.includes(w.toLowerCase())) score -= 1;
  }
  if (score > 0) return 'bullish';
  if (score < 0) return 'bearish';
  return 'neutral';
}
