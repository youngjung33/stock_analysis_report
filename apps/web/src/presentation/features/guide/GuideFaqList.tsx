'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GUIDE_CATEGORIES,
  GUIDE_FAQ_CATALOG,
  isGuideCategoryId,
  type GuideCategoryId,
  type GuideFaqItemDef,
} from '@sar/shared';
import { translateGuideCategory, translateGuideFaqItem } from '@/i18n';
import { Surface } from '../../design-system';
import { GuideCategoryTabs } from './GuideCategoryTabs';
import { GuideFaqAccordion } from './GuideFaqAccordion';
import { GuideSearchField } from './GuideSearchField';

function parseCategoryParam(value: string | null): GuideCategoryId | 'all' {
  if (value && isGuideCategoryId(value)) return value;
  return 'all';
}

export function GuideFaqList() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState<GuideCategoryId | 'all'>(() =>
    parseCategoryParam(searchParams.get('category')),
  );
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash.replace(/^#/, '');
    return hash || null;
  });

  useEffect(() => {
    setCategory(parseCategoryParam(searchParams.get('category')));
  }, [searchParams]);

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      setOpenId(hash || null);
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const currentHash = url.hash.replace(/^#/, '');
    const targetHash = openId ?? '';
    if (currentHash === targetHash) return;
    if (openId) url.hash = openId;
    else url.hash = '';
    window.history.replaceState(null, '', url.toString());
  }, [openId]);

  const handleCategoryChange = useCallback(
    (next: GuideCategoryId | 'all') => {
      setCategory(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === 'all') params.delete('category');
      else params.set('category', next);
      const qs = params.toString();
      router.replace(qs ? `/guide?${qs}` : '/guide', { scroll: false });
    },
    [router, searchParams],
  );

  const handleToggle = useCallback((itemId: string) => {
    setOpenId((prev) => (prev === itemId ? null : itemId));
  }, []);

  const categoryLabelMap = useMemo(
    () =>
      Object.fromEntries(
        GUIDE_CATEGORIES.map((c) => [c.id, translateGuideCategory(c.id, t).label]),
      ) as Record<GuideCategoryId, string>,
    [t],
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GUIDE_FAQ_CATALOG.filter((item) => {
      if (category !== 'all' && item.categoryId !== category) return false;
      if (!q) return true;
      const translated = translateGuideFaqItem(item.id, t);
      const haystack = [
        translated.title,
        ...translated.paragraphs,
        ...translated.tips,
        ...(item.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [category, query, t]);

  const grouped = useMemo(() => {
    if (category !== 'all') {
      return [{ categoryId: category, items: filteredItems }];
    }
    return GUIDE_CATEGORIES.map((cat) => ({
      categoryId: cat.id,
      items: filteredItems.filter((item) => item.categoryId === cat.id),
    })).filter((group) => group.items.length > 0);
  }, [category, filteredItems]);

  return (
    <div className="space-y-6">
      <Surface variant="section" className="space-y-4 border-primary/25 bg-primary/5">
        <div>
          <h2 className="text-lg font-semibold md:text-xl">{t('guide.title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('guide.intro')}</p>
        </div>
        <GuideSearchField value={query} onChange={setQuery} />
        <GuideCategoryTabs value={category} onChange={handleCategoryChange} />
        <p className="text-xs text-muted-foreground">
          {t('guide.itemCount', { count: filteredItems.length })}
        </p>
      </Surface>

      {filteredItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('guide.noResults')}</p>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.categoryId} className="space-y-3">
              {category === 'all' && (
                <div>
                  <h3 className="text-base font-semibold">
                    {categoryLabelMap[group.categoryId]}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {translateGuideCategory(group.categoryId, t).desc}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                {group.items.map((item: GuideFaqItemDef) => (
                  <GuideFaqAccordion
                    key={item.id}
                    id={item.id}
                    item={item}
                    categoryLabel={categoryLabelMap[item.categoryId]}
                    open={openId === item.id}
                    onToggle={() => handleToggle(item.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">{t('guide.disclaimer')}</p>
    </div>
  );
}
