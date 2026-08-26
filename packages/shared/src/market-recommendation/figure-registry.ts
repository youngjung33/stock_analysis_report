import { Market } from '../enums';
import type { FigureLinkScope } from './score-dedupe';
import type { StockSectorTag } from './types';

export type FigureCategory = 'us_policy' | 'central_bank' | 'mega_cap_ceo' | 'kr_chaebol';

export interface FigureRegistryEntry {
  id: string;
  displayName: string;
  category: FigureCategory;
  impactTier: 1 | 2 | 3;
  linkScope: FigureLinkScope;
  aliases: string[];
  primarySymbols?: string[];
  sectorTags?: StockSectorTag[];
  topicTags?: string[];
  markets?: Market[];
}

/** §8.5 — static figure registry (v3 Phase J) */
export const FIGURE_REGISTRY: FigureRegistryEntry[] = [
  {
    id: 'trump_sector',
    displayName: 'Donald Trump',
    category: 'us_policy',
    impactTier: 2,
    linkScope: 'topic_conditional',
    aliases: ['trump tariff', 'trump chip', 'trump semiconductor', '관세 부과'],
    sectorTags: ['export', 'semiconductor'],
    topicTags: ['tariff', 'chip', 'semiconductor', '반도체', '관세'],
    markets: [Market.KR, Market.US],
  },
  {
    id: 'trump',
    displayName: 'Donald Trump',
    category: 'us_policy',
    impactTier: 1,
    linkScope: 'macro_only',
    aliases: ['donald trump', 'president trump', 'trump trade', 'trump says'],
    topicTags: ['tariff', 'trade', 'sanction', '관세', '무역'],
    markets: [Market.KR, Market.US],
  },
  {
    id: 'powell',
    displayName: 'Jerome Powell',
    category: 'central_bank',
    impactTier: 1,
    linkScope: 'macro_only',
    aliases: ['jerome powell', 'fed chair', 'federal reserve', '파월', '연준'],
    topicTags: ['rate', 'fed', '금리', '연준'],
    markets: [Market.KR, Market.US],
  },
  {
    id: 'musk',
    displayName: 'Elon Musk',
    category: 'mega_cap_ceo',
    impactTier: 3,
    linkScope: 'symbol_direct',
    aliases: ['elon musk', 'musk says', '머스크'],
    primarySymbols: ['TSLA'],
    markets: [Market.US],
  },
  {
    id: 'cook',
    displayName: 'Tim Cook',
    category: 'mega_cap_ceo',
    impactTier: 3,
    linkScope: 'symbol_direct',
    aliases: ['tim cook', 'ceo cook', '팀 쿡'],
    primarySymbols: ['AAPL'],
    markets: [Market.US],
  },
  {
    id: 'huang',
    displayName: 'Jensen Huang',
    category: 'mega_cap_ceo',
    impactTier: 3,
    linkScope: 'symbol_direct',
    aliases: ['jensen huang', 'jen-hsun huang', '황仁勳', '젠슨 황'],
    primarySymbols: ['NVDA'],
    markets: [Market.US],
  },
  {
    id: 'lee',
    displayName: 'Lee Jae-yong',
    category: 'kr_chaebol',
    impactTier: 3,
    linkScope: 'symbol_direct',
    aliases: ['이재용', 'lee jae-yong', '삼성 회장'],
    primarySymbols: ['005930'],
    markets: [Market.KR],
  },
];

export function findFigureInHeadline(title: string): FigureRegistryEntry | null {
  const lower = title.toLowerCase();
  for (const entry of FIGURE_REGISTRY) {
    if (entry.aliases.some((a) => lower.includes(a.toLowerCase()))) {
      return entry;
    }
  }
  return null;
}

export function headlineMatchesTopic(title: string, topicTags: string[]): boolean {
  const lower = title.toLowerCase();
  return topicTags.some((t) => lower.includes(t.toLowerCase()));
}

/** Phase N+ — Google News site:x.com secondary scan for figure posts */
export function buildFigureSnsNewsQuery(): string {
  const names = [...new Set(FIGURE_REGISTRY.map((e) => e.displayName))];
  const nameClause = names.map((n) => `"${n}"`).join(' OR ');
  return `(${nameClause}) (site:x.com OR site:twitter.com)`;
}
