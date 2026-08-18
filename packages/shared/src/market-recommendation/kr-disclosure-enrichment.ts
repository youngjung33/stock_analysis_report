import { Market } from '../enums';
import type { StockEventDay, StockEventKind, StockEventSnapshot } from './event-enrichment';
import { eventDayOffsetFromDate } from './event-enrichment';

export interface KrDisclosureRow {
  reportName: string;
  /** YYYYMMDD or ISO date */
  receiptDate: string;
}

/** Classify DART report title → event kind (null if not scoring-relevant) */
export function classifyKrDisclosureReport(reportName: string): StockEventKind | null {
  const t = reportName.trim();
  if (!t) return null;

  if (/자기주식|주주환원|자사주\s*취득|자사주\s*매입/i.test(t)) return 'buyback';
  if (/배당/i.test(t)) return 'dividend';
  if (/실적.*(상회|호조|증가|개선|서프|어닝\s*서프)/i.test(t)) return 'earnings_beat';
  if (/실적.*(부진|감소|적자|하회|쇼크|미달)/i.test(t)) return 'earnings_miss';
  if (/분기보고서|반기보고서|사업보고서|분기\s*실적|잠정\s*실적/i.test(t)) return 'earnings_neutral';
  if (/실적\s*발표|실적\s*공시|영업이익|매출액/i.test(t)) return 'earnings_neutral';
  if (/실적|어닝|분기/i.test(t)) return 'earnings_neutral';

  return null;
}

function normalizeReceiptDate(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return null;
}

const KIND_PRIORITY: Record<StockEventKind, number> = {
  buyback: 0,
  dividend: 1,
  earnings_beat: 2,
  earnings_miss: 3,
  earnings_upcoming: 4,
  earnings_neutral: 5,
};

/** §8.3 KR — DART list.json rows → best event snapshot in D-1~D+1 window */
export function buildStockEventFromKrDisclosure(input: {
  symbol: string;
  market: Market;
  disclosures: KrDisclosureRow[];
  now?: number;
}): StockEventSnapshot | null {
  if (input.market !== Market.KR || input.disclosures.length === 0) return null;

  type Candidate = { snap: StockEventSnapshot; priority: number; sortDate: string };
  const candidates: Candidate[] = [];

  for (const row of input.disclosures) {
    const kind = classifyKrDisclosureReport(row.reportName);
    if (!kind) continue;

    const isoDate = normalizeReceiptDate(row.receiptDate);
    if (!isoDate) continue;

    const eventDay = eventDayOffsetFromDate(isoDate, input.now);
    if (!eventDay) continue;

    candidates.push({
      snap: {
        symbol: input.symbol,
        market: input.market,
        kind,
        eventDay,
        dedupeKey: `dart:${input.symbol.toUpperCase()}:${kind}:${isoDate}`,
        headlineSample: row.reportName.slice(0, 120),
        source: 'dart',
      },
      priority: KIND_PRIORITY[kind],
      sortDate: isoDate,
    });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.sortDate.localeCompare(a.sortDate);
  });

  return candidates[0].snap;
}
