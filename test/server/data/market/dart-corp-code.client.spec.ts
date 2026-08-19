import { describe, expect, it } from 'vitest';
import { deflateRawSync } from 'node:zlib';
import { extractDartCorpCodeXmlFromZip } from '@server/data/market/dart-corp-code.client';

function buildStoredZip(fileName: string, content: string): Buffer {
  const nameBuf = Buffer.from(fileName, 'utf8');
  const dataBuf = Buffer.from(content, 'utf8');
  const header = Buffer.alloc(30 + nameBuf.length);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt32LE(dataBuf.length, 18);
  header.writeUInt32LE(dataBuf.length, 22);
  header.writeUInt16LE(nameBuf.length, 26);
  header.writeUInt16LE(0, 28);
  nameBuf.copy(header, 30);
  return Buffer.concat([header, dataBuf]);
}

function buildDeflatedZip(fileName: string, content: string): Buffer {
  const nameBuf = Buffer.from(fileName, 'utf8');
  const dataBuf = deflateRawSync(Buffer.from(content, 'utf8'));
  const header = Buffer.alloc(30 + nameBuf.length);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(8, 8);
  header.writeUInt32LE(dataBuf.length, 18);
  header.writeUInt32LE(Buffer.byteLength(content), 22);
  header.writeUInt16LE(nameBuf.length, 26);
  header.writeUInt16LE(0, 28);
  nameBuf.copy(header, 30);
  return Buffer.concat([header, dataBuf]);
}

describe('extractDartCorpCodeXmlFromZip', () => {
  it('extracts stored xml entry', () => {
    const xml = '<result><list><corp_code>001</corp_code></list></result>';
    const zip = buildStoredZip('CORPCODE.xml', xml);
    expect(extractDartCorpCodeXmlFromZip(zip)).toBe(xml);
  });

  it('extracts deflated xml entry', () => {
    const xml = '<result><list><stock_code>005930</stock_code></list></result>';
    const zip = buildDeflatedZip('CORPCODE.xml', xml);
    expect(extractDartCorpCodeXmlFromZip(zip)).toBe(xml);
  });
});
