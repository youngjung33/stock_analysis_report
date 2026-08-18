/** §8.3 KR — DART corp_code (8-digit) for featured / candidate symbols (Phase L) */
const KR_CORP_CODE_BY_SYMBOL: Record<string, string> = {
  '005930': '00126380', // 삼성전자
  '000660': '00164779', // SK하이닉스
  '035420': '00266961', // NAVER
  '035720': '00258801', // 카카오
  '005380': '00164742', // 현대차
  '051910': '00356361', // LG화학
  '006400': '00126362', // 삼성SDI
  '105560': '00159023', // KB금융
  '055550': '00382199', // 신한지주
  '068270': '00413046', // 셀트리온
  '373220': '01515323', // LG에너지솔루션
  '207940': '00877059', // 삼성바이오로직스
  '028260': '00149655', // 삼성물산
  '012330': '00164788', // 현대모비스
  '000270': '00106641', // 기아
};

export function resolveKrCorpCode(symbol: string): string | null {
  const code = KR_CORP_CODE_BY_SYMBOL[symbol.trim()];
  return code ?? null;
}

export function isKrCorpCodeRegistered(symbol: string): boolean {
  return resolveKrCorpCode(symbol) != null;
}
