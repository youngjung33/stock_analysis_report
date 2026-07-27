// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { syncDocumentSeo } from '@/i18n/sync-document-seo';

describe('syncDocumentSeo', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.documentElement.lang = 'en';
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://example.com',
        href: 'https://example.com/login',
        pathname: '/login',
      },
      writable: true,
    });
  });

  it('syncs title, canonical, and og tags for login route', () => {
    syncDocumentSeo('en', 'login');

    expect(document.title).toContain('Log in');
    expect(document.documentElement.lang).toBe('en');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('Log in');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://example.com/login',
    );
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://example.com/login',
    );
    expect(document.querySelector('meta[property="og:site_name"]')?.getAttribute('content')).toBe(
      'SAR Portfolio',
    );
  });

  it('sets noindex robots for settings', () => {
    syncDocumentSeo('ko', 'settings');
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, follow');
  });
});
