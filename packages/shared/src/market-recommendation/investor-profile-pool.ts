import { Market } from '../enums';
import type { RecommendationTag } from '../market-sentiment';
import {
  buildInvestorProfile,
  type BuiltInvestorProfile,
  type StoredInvestorProfile,
} from '../investor-survey/profile';
import { SECTOR_LEADER_SYMBOLS } from './sector-tags';

const TAG_SECTOR_NAMES: Partial<Record<RecommendationTag, { kr: string[]; us: string[] }>> = {
  defensive: { kr: ['금융'], us: ['금융', '헬스케어'] },
  momentum: { kr: ['반도체', '자동차'], us: ['반도체', '기술'] },
  pullback: { kr: ['반도체'], us: ['기술'] },
  watchlist: { kr: [], us: [] },
};

function sectorSymbolsForMarket(market: Market, sectorNames: string[]): string[] {
  const sectors = SECTOR_LEADER_SYMBOLS[market];
  const out: string[] = [];
  for (const name of sectorNames) {
    const entry = sectors[name];
    if (entry) out.push(...entry.symbols);
  }
  return out;
}

/** 투자 성향 preferredTags·레벨에 맞춘 후보 심볼 (pool `profile` 소스) */
export function buildInvestorProfilePoolSymbols(
  profile: BuiltInvestorProfile | StoredInvestorProfile,
): Array<{ symbol: string; market: Market }> {
  const built = 'preferredTags' in profile ? profile : buildInvestorProfile(profile);
  const krSectors = new Set<string>();
  const usSectors = new Set<string>();

  for (const tag of built.preferredTags) {
    const mapping = TAG_SECTOR_NAMES[tag];
    if (!mapping) continue;
    for (const s of mapping.kr) krSectors.add(s);
    for (const s of mapping.us) usSectors.add(s);
  }

  if (built.level <= 3) {
    krSectors.add('금융');
    usSectors.add('금융');
    usSectors.add('헬스케어');
  } else if (built.level >= 8) {
    krSectors.add('반도체');
    usSectors.add('기술');
    usSectors.add('반도체');
  }

  const usWeight = built.preferences.targetUsPercent;
  const krWeight = built.preferences.targetKrPercent;
  const total = usWeight + krWeight || 1;
  const usShare = usWeight / total;

  const krSymbols = sectorSymbolsForMarket(Market.KR, [...krSectors]);
  const usSymbols = sectorSymbolsForMarket(Market.US, [...usSectors]);

  const maxPerMarket = 8;
  const krCap = Math.max(2, Math.round(maxPerMarket * (1 - usShare * 0.5)));
  const usCap = Math.max(2, Math.round(maxPerMarket * (0.5 + usShare * 0.5)));

  const seen = new Set<string>();
  const out: Array<{ symbol: string; market: Market }> = [];

  for (const symbol of krSymbols.slice(0, krCap)) {
    const key = `${Market.KR}:${symbol}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ symbol, market: Market.KR });
  }
  for (const symbol of usSymbols.slice(0, usCap)) {
    const key = `${Market.US}:${symbol}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ symbol, market: Market.US });
  }

  return out;
}
