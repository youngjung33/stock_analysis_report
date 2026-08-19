import { inflateRawSync } from 'node:zlib';
import { MarketDataConfig } from './market-data.config';

const DART_CORP_CODE_URL = 'https://opendart.fss.or.kr/api/corpCode.xml';

/** Extract first .xml entry from DART corpCode.zip (single-file archive) */
export function extractDartCorpCodeXmlFromZip(buffer: Buffer): string {
  let offset = 0;

  while (offset + 30 <= buffer.length) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) break;

    const compMethod = buffer.readUInt16LE(offset + 8);
    const compSize = buffer.readUInt32LE(offset + 18);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const name = buffer.subarray(offset + 30, offset + 30 + nameLen).toString('utf8');
    const dataStart = offset + 30 + nameLen + extraLen;
    const data = buffer.subarray(dataStart, dataStart + compSize);

    if (/\.xml$/i.test(name)) {
      if (compMethod === 0) return data.toString('utf8');
      if (compMethod === 8) return inflateRawSync(data).toString('utf8');
      throw new Error(`Unsupported zip compression method ${compMethod} for ${name}`);
    }

    offset = dataStart + compSize;
  }

  throw new Error('CORPCODE.xml not found in DART zip');
}

export async function fetchDartCorpCodeXml(apiKey?: string): Promise<string> {
  const key = apiKey ?? new MarketDataConfig().dartApiKey;
  if (!key) {
    throw new Error('DART_API_KEY is not configured');
  }

  const url = `${DART_CORP_CODE_URL}?crtfc_key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockAnalysisReport/1.0)' },
  });
  if (!res.ok) {
    throw new Error(`DART corpCode download failed (${res.status})`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return extractDartCorpCodeXmlFromZip(buffer);
}
