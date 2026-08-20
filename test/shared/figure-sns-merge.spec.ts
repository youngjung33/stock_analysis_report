import { describe, expect, it } from 'vitest';
import {
  FIGURE_STATEMENT_ARTICLE_SCAN_LIMIT,
  buildFigureSnsNewsQuery,
  buildFigureStatementSnapshots,
  mergeFigureStatementArticles,
} from '@sar/shared';

describe('figure SNS merge (Phase N+)', () => {
  it('FIGURE_STATEMENT_ARTICLE_SCAN_LIMIT covers RSS + SNS fetch caps', () => {
    expect(FIGURE_STATEMENT_ARTICLE_SCAN_LIMIT).toBe(25);
  });

  it('mergeFigureStatementArticles prefers RSS on duplicate headline', () => {
    const merged = mergeFigureStatementArticles(
      [{ title: 'Elon Musk Tesla demand strong', publishedAt: '2026-07-24T00:00:00Z', sourceChannel: 'rss' }],
      [{ title: 'Elon Musk Tesla demand strong', publishedAt: '2026-07-24T01:00:00Z', sourceChannel: 'sns' }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].sourceChannel).toBe('rss');
  });

  it('mergeFigureStatementArticles adds SNS-only headlines', () => {
    const merged = mergeFigureStatementArticles(
      [],
      [{ title: 'Tim Cook says Apple services growth continues', publishedAt: '2026-07-24T00:00:00Z' }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].sourceChannel).toBe('sns');
  });

  it('buildFigureStatementSnapshots preserves sourceChannel', () => {
    const snaps = buildFigureStatementSnapshots([
      {
        title: 'Elon Musk says Tesla AI day ahead',
        publishedAt: new Date().toISOString(),
        sourceChannel: 'sns',
      },
    ]);
    expect(snaps[0]?.sourceChannel).toBe('sns');
  });

  it('buildFigureSnsNewsQuery includes x.com site filter', () => {
    const q = buildFigureSnsNewsQuery();
    expect(q).toContain('site:x.com');
    expect(q).toContain('Elon Musk');
  });
});
