/** pathname → SEO page key (matches seo.pages.* in locale files) */
export type SeoPageKey =
  | 'home'
  | 'login'
  | 'forgotPassword'
  | 'resetPassword'
  | 'settings'
  | 'myInfo'
  | 'transactions'
  | 'market'
  | 'tax'
  | 'stock';

export interface SeoRouteMatch {
  pageKey: SeoPageKey;
  params?: Record<string, string>;
}

export function pathnameToSeoRoute(pathname: string): SeoRouteMatch {
  const path = pathname.split('?')[0] ?? '/';

  if (path === '/') return { pageKey: 'home' };
  if (path === '/login') return { pageKey: 'login' };
  if (path === '/forgot-password') return { pageKey: 'forgotPassword' };
  if (path === '/reset-password') return { pageKey: 'resetPassword' };
  if (path === '/settings') return { pageKey: 'settings' };
  if (path === '/my-info') return { pageKey: 'myInfo' };
  if (path === '/transactions') return { pageKey: 'transactions' };
  if (path === '/market/analysis') return { pageKey: 'market' };
  if (path === '/tax') return { pageKey: 'tax' };

  const stockMatch = path.match(/^\/stocks\/([^/]+)$/);
  if (stockMatch?.[1]) {
    return { pageKey: 'stock', params: { symbol: decodeURIComponent(stockMatch[1]) } };
  }

  return { pageKey: 'home' };
}

/** Static routes included in sitemap.xml */
export const SITEMAP_PATHS = [
  '/',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/my-info',
  '/transactions',
  '/market/analysis',
  '/tax',
] as const;
