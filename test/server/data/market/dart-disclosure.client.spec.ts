import { describe, expect, it, vi, afterEach } from 'vitest';
import { fetchDartDisclosureList } from '@server/data/market/dart-disclosure.client';

describe('fetchDartDisclosureList', () => {
  const original = process.env.DART_API_KEY;

  afterEach(() => {
    vi.restoreAllMocks();
    if (original === undefined) delete process.env.DART_API_KEY;
    else process.env.DART_API_KEY = original;
  });

  it('returns empty when DART_API_KEY is missing', async () => {
    delete process.env.DART_API_KEY;
    const rows = await fetchDartDisclosureList('00126380');
    expect(rows).toEqual([]);
  });

  it('parses list.json response', async () => {
    process.env.DART_API_KEY = 'test-key-40-chars-xxxxxxxxxxxxxxxxxxxx';
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          status: '000',
          list: [{ report_nm: '자기주식 취득 결정', rcept_dt: '20260818' }],
        }),
        { status: 200 },
      ),
    );

    const rows = await fetchDartDisclosureList('00126380', 7);
    expect(rows).toEqual([
      { reportName: '자기주식 취득 결정', receiptDate: '20260818' },
    ]);
  });
});
