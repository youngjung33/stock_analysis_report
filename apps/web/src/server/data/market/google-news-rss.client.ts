import { Market } from '@sar/shared';

export interface RssNewsItem {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  market: Market | 'global';
}

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .trim();
}

function extractTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : null;
}

/** Google News RSS — API 키 없이 헤드라인 수집 */
export async function fetchGoogleNewsRss(
  query: string,
  market: Market | 'global',
  hl: string,
  gl: string,
  limit = 6,
): Promise<RssNewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=${gl}&ceid=${gl}:${hl.split('-')[0]}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockAnalysisReport/1.0)' },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Google News RSS error: ${res.status}`);
  }

  const xml = await res.text();
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  return items.slice(0, limit).map((block) => {
    const title = extractTag(block, 'title') ?? '제목 없음';
    const link = extractTag(block, 'link') ?? '';
    const pubDate = extractTag(block, 'pubDate') ?? new Date().toISOString();
    const source = title.includes(' - ') ? title.split(' - ').pop()!.trim() : 'Google News';
    const cleanTitle = title.includes(' - ') ? title.split(' - ').slice(0, -1).join(' - ').trim() : title;

    return {
      title: cleanTitle,
      source,
      publishedAt: new Date(pubDate).toISOString(),
      url: link,
      market,
    };
  });
}
