import { describe, expect, it } from 'vitest';
import { pathnameToSeoRoute, seoPathForPageKey } from '@/i18n/seo-routes';

describe('seo-routes', () => {
  it('maps pathnames to page keys', () => {
    expect(pathnameToSeoRoute('/')).toEqual({ pageKey: 'home' });
    expect(pathnameToSeoRoute('/login')).toEqual({ pageKey: 'login' });
    expect(pathnameToSeoRoute('/market/analysis')).toEqual({ pageKey: 'market' });
    expect(pathnameToSeoRoute('/stocks/AAPL')).toEqual({
      pageKey: 'stock',
      params: { symbol: 'AAPL' },
    });
  });

  it('builds canonical paths for page keys', () => {
    expect(seoPathForPageKey('home')).toBe('/');
    expect(seoPathForPageKey('login')).toBe('/login');
    expect(seoPathForPageKey('stock', { symbol: '005930' })).toBe('/stocks/005930');
  });

  it('round-trips static routes', () => {
    const paths = ['/login', '/tax', '/my-info', '/transactions'] as const;
    for (const path of paths) {
      const { pageKey } = pathnameToSeoRoute(path);
      expect(seoPathForPageKey(pageKey)).toBe(path);
    }
  });
});
