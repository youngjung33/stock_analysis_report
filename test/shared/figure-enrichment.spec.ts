import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import {
  applyFigureEnrichment,
  buildFigureStatementSnapshots,
  figureLinkScopeAllowsSymbolDelta,
} from '@sar/shared';
import type { RecommendationTag } from '@sar/shared';

function emptyTagScores(): Record<RecommendationTag, number> {
  return { momentum: 0, watchlist: 0, pullback: 0, defensive: 0 };
}

function recentIso(daysAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

describe('figure-enrichment (Phase J / v3)', () => {
  it('buildFigureStatementSnapshots matches Musk headline', () => {
    const snaps = buildFigureStatementSnapshots([
      {
        title: 'Elon Musk says Tesla demand remains strong',
        publishedAt: recentIso(0),
      },
    ]);
    expect(snaps).toHaveLength(1);
    expect(snaps[0].figureId).toBe('musk');
    expect(snaps[0].linkScope).toBe('symbol_direct');
  });

  it('applyFigureEnrichment adds CH_FIGURE_DIRECT for TSLA on bullish Musk', () => {
    const snap = buildFigureStatementSnapshots([
      { title: 'Elon Musk rally behind Tesla stock', publishedAt: recentIso(0) },
    ])[0];
    expect(snap).toBeDefined();

    const tagScores = emptyTagScores();
    const breakdown = applyFigureEnrichment(tagScores, snap, 'TSLA', Market.US, []);
    expect(breakdown.some((b) => b.factor.startsWith('CH_FIGURE_DIRECT:'))).toBe(true);
    expect(tagScores.momentum).toBeCloseTo(0.25, 8);
  });

  it('macro_only figure produces no symbol delta (INV-6)', () => {
    expect(figureLinkScopeAllowsSymbolDelta('macro_only')).toBe(false);

    const snap = buildFigureStatementSnapshots([
      { title: 'Donald Trump says trade policy remains uncertain', publishedAt: recentIso(0) },
    ])[0];
    expect(snap?.linkScope).toBe('macro_only');

    const tagScores = emptyTagScores();
    const breakdown = applyFigureEnrichment(tagScores, snap!, '005930', Market.KR, ['export']);
    expect(breakdown).toHaveLength(0);
  });

  it('topic_conditional figure applies CH_FIGURE_SECTOR for export tags', () => {
    const snap = buildFigureStatementSnapshots([
      { title: 'Trump tariff chip sector plunge worries exporters', publishedAt: recentIso(0) },
    ]).find((s) => s.linkScope === 'topic_conditional');
    expect(snap).toBeDefined();

    const tagScores = emptyTagScores();
    const breakdown = applyFigureEnrichment(tagScores, snap!, '000660', Market.KR, ['semiconductor', 'export']);
    expect(breakdown.length).toBeGreaterThan(0);
    expect(breakdown.some((b) => b.factor.startsWith('CH_FIGURE_SECTOR:'))).toBe(true);
  });
});
