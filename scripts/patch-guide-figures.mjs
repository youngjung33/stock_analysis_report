import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const koPath = path.join(root, 'apps/web/src/i18n/locales/guide.ko.json');
const enPath = path.join(root, 'apps/web/src/i18n/locales/guide.en.json');

const captions = {
  ko: {
    'isa-what-is': 'ISA 계좌 구조: 납입 → 다양한 상품 운용 → 세제 혜택',
    'isa-yearly-limit': '유형별 ISA 연간 비과세 한도',
    'isa-early-withdrawal': '가입부터 만기까지 중도인출 시 세제 불이익',
    'isa-vs-regular': '일반 위탁계좌 vs ISA 비교',
    'isa-overflow-tax': '비과세 한도와 초과분(9.9%) 구간',
    'isa-comprehensive-tax-exclusion': 'ISA 소득은 금융소득종합과세에서 제외',
    'isa-eligibility-types': 'ISA 유형별 가입 요건·비과세 한도',
    'isa-contribution-limit': '연간 ISA 납입 한도',
    'isa-maturity-options': '만기 후 선택지: 현금화·연금전환·연장',
    'isa-loss-offset': 'ISA 계좌 내 손익통산 예시',
    'tax-domestic-capital-gains': '일반 투자자 국내 주식 매매차익: 비과세',
    'tax-dividend-154': '국내 배당 원천징수 15.4% 구성',
    'tax-foreign-gains': '해외 주식 양도소득세 요약',
    'tax-foreign-dividend': '해외 배당: 현지 원천징수 → 국내 신고',
    'tax-financial-comprehensive': '금융소득 2,000만 원 기준 종합과세 구간',
    'tax-filing-schedule': '연간 세금 신고 일정',
    'tax-securities-transaction': '매도 시 증권거래세 차감 흐름',
    'charts-trendline': '상승 추세선(저점 연결) 예시',
    'charts-support-resistance': '지지·저항선과 가격 움직임',
    'charts-rsi': 'RSI 과매수(70)·과매도(30) 구간',
    'charts-macd': 'MACD·시그널선·히스토그램 예시',
    'charts-moving-average': '가격과 이동평균선(MA20·MA60)',
    'charts-volume': '가격 차트와 거래량',
    'charts-vix': 'VIX: 시장 불안·변동성 지표',
    'charts-caution': '차트만으로 매매하지 말 것',
    'trading-average-cost': '평균 단가(평단) 계산 예시',
    'trading-pnl': '평가손익 vs 실현손익',
    'trading-market-vs-limit': '시장가·지정가 주문 비교',
    'trading-dividend-ex-date': '배당락일 전후 보유·가격 조정',
    'trading-corporate-actions': '액면분할 1:2 예시',
    'trading-quantity': '보유 수량 = 매수 − 매도 + 기업행위',
    'accounts-brokerage': '일반 위탁(증권)계좌',
    'accounts-isa-role': '계좌 유형별 역할',
    'accounts-pension': '연금 납입 → 노후 수령',
    'accounts-cma': '현금 → CMA/RP 운용',
    'portfolio-diversification': '섹터·종목 분산 비중 예시',
    'portfolio-rebalancing': '리밸런싱 전·후 비중 조정',
    'portfolio-cash-ratio': '주식 vs 현금 비중(예: 70/30)',
    'portfolio-long-term': '장기 투자 vs 예금 수익 비교',
  },
  en: {
    'isa-what-is': 'ISA flow: contribute → invest → tax benefits',
    'isa-yearly-limit': 'Annual tax-free limits by ISA type',
    'isa-early-withdrawal': 'Tax downside of early withdrawal before maturity',
    'isa-vs-regular': 'Regular brokerage vs ISA comparison',
    'isa-overflow-tax': 'Tax-free limit vs 9.9% excess portion',
    'isa-comprehensive-tax-exclusion': 'ISA income excluded from comprehensive financial tax',
    'isa-eligibility-types': 'ISA types: eligibility and tax-free limits',
    'isa-contribution-limit': 'Annual ISA contribution cap',
    'isa-maturity-options': 'At maturity: cash out, pension, or extend',
    'isa-loss-offset': 'Netting gains and losses within ISA',
    'tax-domestic-capital-gains': 'Domestic stock gains: generally 0% for retail investors',
    'tax-dividend-154': '15.4% dividend withholding breakdown',
    'tax-foreign-gains': 'Foreign stock capital gains tax summary',
    'tax-foreign-dividend': 'Foreign dividend: local withhold → KR filing',
    'tax-financial-comprehensive': 'KRW 20M comprehensive financial income threshold',
    'tax-filing-schedule': 'Annual tax filing timeline',
    'tax-securities-transaction': 'Securities transaction tax on sale',
    'charts-trendline': 'Uptrend line connecting higher lows',
    'charts-support-resistance': 'Support, resistance, and price action',
    'charts-rsi': 'RSI overbought (70) and oversold (30) zones',
    'charts-macd': 'MACD, signal line, and histogram',
    'charts-moving-average': 'Price vs moving averages (MA20, MA60)',
    'charts-volume': 'Price chart with volume bars',
    'charts-vix': 'VIX: market fear and volatility gauge',
    'charts-caution': 'Do not trade on charts alone',
    'trading-average-cost': 'Average cost basis example',
    'trading-pnl': 'Unrealized vs realized P/L',
    'trading-market-vs-limit': 'Market vs limit order comparison',
    'trading-dividend-ex-date': 'Hold before ex-date; price adjusts after',
    'trading-corporate-actions': '1:2 stock split example',
    'trading-quantity': 'Quantity = buys − sells + corporate actions',
    'accounts-brokerage': 'Regular brokerage account',
    'accounts-isa-role': 'Account types and roles',
    'accounts-pension': 'Pension contributions → retirement income',
    'accounts-cma': 'Cash parked in CMA/RP',
    'portfolio-diversification': 'Sector and name allocation example',
    'portfolio-rebalancing': 'Portfolio weights before and after rebalancing',
    'portfolio-cash-ratio': 'Stock vs cash split (e.g. 70/30)',
    'portfolio-long-term': 'Long-term investing vs savings returns',
  },
};

const figureEn = {
  'isa-what-is': { deposit: 'Contribute', products: 'Stocks·Funds·Bonds', benefit: 'Tax benefits' },
  'isa-yearly-limit': {
    colType: 'Type', colLimit: 'Annual tax-free', rowGeneral: 'General', valGeneral: 'KRW 2M',
    rowWorker: 'Worker/Farmer', valWorker: 'KRW 4M', rowSenior: 'Senior', valSenior: 'KRW 4M',
  },
  'isa-early-withdrawal': { start: 'Open', early: 'Early exit ✕', maturity: '3-yr maturity' },
  'isa-vs-regular': {
    colItem: 'Item', colRegular: 'Regular', colIsa: 'ISA', rowGain: 'Netting', no: 'Per symbol',
    yes: 'Whole account', rowTaxFree: 'Tax-free', dash: '—', limit: '2–4M KRW',
  },
  'isa-overflow-tax': { taxFree: 'Tax-free zone', taxFreeVal: 'KRW 2M', overflow: 'Excess', overflowVal: '9.9%' },
  'isa-comprehensive-tax-exclusion': {
    isa: 'ISA income', exclude: 'Excluded', general: 'Regular financial', threshold: 'KRW 20M threshold',
  },
  'isa-eligibility-types': {
    colType: 'Type', colReq: 'Requirement', colLimit: 'Tax-free', general: 'General', none: 'None',
    worker: 'Worker', income: 'Income test', senior: 'Senior', age: 'Age 65+',
  },
  'isa-contribution-limit': { annual: 'Annual contribution cap', val: 'KRW 20M' },
  'isa-maturity-options': { maturity: 'Maturity', cash: 'Cash out', pension: 'To pension', extend: 'Extend' },
  'isa-loss-offset': { net: 'Net income' },
  'tax-domestic-capital-gains': { label: 'Retail trading gains' },
  'tax-dividend-154': { split: '14% + 1.4%' },
  'tax-foreign-gains': {
    rate: 'Capital gains tax', deduct: 'Basic deduction', deductVal: 'KRW 2.5M/yr',
    file: 'Filing', fileVal: 'May comprehensive',
  },
  'tax-foreign-dividend': { withhold: 'Withheld', may: 'May filing' },
  'tax-financial-comprehensive': { unit: 'M KRW', safe: 'Separate tax zone', over: 'Comprehensive tax' },
  'tax-filing-schedule': {
    colMonth: 'Month', colAction: 'Action', prepare: 'Gather documents', may: 'May',
    file: 'Comprehensive filing', done: 'Foreign/comp. done',
  },
  'tax-securities-transaction': { sell: 'Sell', proceeds: 'Net proceeds' },
  'charts-trendline': { line: 'Trend line' },
  'charts-support-resistance': { resistance: 'Resistance', support: 'Support' },
  'charts-rsi': { label: 'RSI', overbought: '70', oversold: '30' },
  'charts-macd': { label: 'MACD' },
  'charts-moving-average': { price: 'Price' },
  'charts-volume': { vol: 'Volume' },
  'charts-vix': { calm: 'Calm', fear: 'Fear' },
  'charts-caution': { msg: 'Charts + fundamentals + risk control' },
  'trading-average-cost': {
    colBuy: 'Buy', colQty: 'Qty', colPrice: 'Price', avg: 'Avg cost', avgVal: '53,333',
  },
  'trading-pnl': { unrealized: 'Unrealized P/L', hold: 'While holding', realized: 'Realized P/L', sold: 'After sale' },
  'trading-market-vs-limit': {
    col: 'Order', speed: 'Fill', price: 'Price', market: 'Market', fast: 'Immediate',
    slip: 'Slippage possible', limit: 'Limit', wait: 'Wait', fixed: 'Your price',
  },
  'trading-dividend-ex-date': { before: 'Hold day before', ex: 'Ex-date', drop: 'Price adjust' },
  'trading-corporate-actions': { share: ' share', shares: ' shares' },
  'trading-quantity': { formula: 'Buys − Sells + Corp. actions', unit: ' shares' },
  'accounts-brokerage': { title: 'Brokerage', sub: 'Stocks·ETF trading' },
  'accounts-isa-role': { l1: 'Regular brokerage', l2: 'ISA', l3: 'Pension' },
  'accounts-pension': { save: 'Contribute', retire: 'Retirement income' },
  'accounts-cma': { cash: 'Cash' },
  'portfolio-diversification': { label: 'Sector & name spread' },
  'portfolio-rebalancing': { before: 'Before rebalance', after: 'After rebalance' },
  'portfolio-cash-ratio': { stock: 'Stocks', cash: 'Cash' },
  'portfolio-long-term': { invest: 'Investing', save: 'Savings' },
};

const figureKo = {
  'isa-what-is': { deposit: '납입', products: '주식·펀드·채권', benefit: '세제혜택' },
  'isa-yearly-limit': {
    colType: '유형', colLimit: '연 비과세 한도', rowGeneral: '일반형', valGeneral: '200만 원',
    rowWorker: '서민·농어민형', valWorker: '400만 원', rowSenior: '노후형', valSenior: '400만 원',
  },
  'isa-early-withdrawal': { start: '가입', early: '중도인출 ✕', maturity: '3년 만기' },
  'isa-vs-regular': {
    colItem: '항목', colRegular: '일반 위탁', colIsa: 'ISA', rowGain: '손익 통산', no: '종목별',
    yes: '계좌 전체', rowTaxFree: '비과세', dash: '—', limit: '200~400만',
  },
  'isa-overflow-tax': { taxFree: '비과세 구간', taxFreeVal: '200만 원', overflow: '초과분', overflowVal: '9.9%' },
  'isa-comprehensive-tax-exclusion': {
    isa: 'ISA 소득', exclude: '종합과세 제외', general: '일반 금융소득', threshold: '2,000만 원 기준',
  },
  'isa-eligibility-types': {
    colType: '유형', colReq: '요건', colLimit: '비과세', general: '일반형', none: '없음',
    worker: '서민형', income: '소득요건', senior: '노후형', age: '만 65세+',
  },
  'isa-contribution-limit': { annual: '연 납입 한도', val: '2,000만 원' },
  'isa-maturity-options': { maturity: '만기', cash: '현금화', pension: '연금전환', extend: '연장' },
  'isa-loss-offset': { net: '순소득' },
  'tax-domestic-capital-gains': { label: '일반 투자자 매매차익' },
  'tax-dividend-154': { split: '14% + 1.4%' },
  'tax-foreign-gains': {
    rate: '양도소득세', deduct: '기본공제', deductVal: '250만 원/년', file: '신고', fileVal: '5월 종합소득세',
  },
  'tax-foreign-dividend': { withhold: '원천징수', may: '5월 신고' },
  'tax-financial-comprehensive': { unit: '만 원', safe: '분리과세 구간', over: '종합과세' },
  'tax-filing-schedule': {
    colMonth: '월', colAction: '내용', prepare: '자료 정리', may: '5월', file: '종합소득세 신고·납부', done: '해외·종합과세 완료',
  },
  'tax-securities-transaction': { sell: '매도', proceeds: '실수령' },
  'charts-trendline': { line: '추세선' },
  'charts-support-resistance': { resistance: '저항', support: '지지' },
  'charts-rsi': { label: 'RSI', overbought: '70', oversold: '30' },
  'charts-macd': { label: 'MACD' },
  'charts-moving-average': { price: '가격' },
  'charts-volume': { vol: '거래량' },
  'charts-vix': { calm: '안정', fear: '공포' },
  'charts-caution': { msg: '차트 + 펀더멘털 + 리스크 관리' },
  'trading-average-cost': {
    colBuy: '매수', colQty: '수량', colPrice: '단가', avg: '평단', avgVal: '53,333',
  },
  'trading-pnl': { unrealized: '평가손익', hold: '보유 중', realized: '실현손익', sold: '매도 후' },
  'trading-market-vs-limit': {
    col: '주문', speed: '체결', price: '가격', market: '시장가', fast: '즉시',
    slip: '슬리피지 가능', limit: '지정가', wait: '대기', fixed: '지정가',
  },
  'trading-dividend-ex-date': { before: '전일 보유', ex: '배당락', drop: '가격 조정' },
  'trading-corporate-actions': { share: '주', shares: '주' },
  'trading-quantity': { formula: '매수 − 매도 + 기업행위', unit: '주' },
  'accounts-brokerage': { title: '위탁계좌', sub: '주식·ETF 매매' },
  'accounts-isa-role': { l1: '일반 위탁', l2: 'ISA', l3: '연금' },
  'accounts-pension': { save: '납입', retire: '노후 수령' },
  'accounts-cma': { cash: '현금' },
  'portfolio-diversification': { label: '섹터·종목 분산' },
  'portfolio-rebalancing': { before: '리밸런싱 전', after: '리밸런싱 후' },
  'portfolio-cash-ratio': { stock: '주식', cash: '현금' },
  'portfolio-long-term': { invest: '투자', save: '예금' },
};

function patch(filePath, locale) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const capMap = captions[locale];
  const figMap = locale === 'ko' ? figureKo : figureEn;

  for (const [id, entry] of Object.entries(data.items)) {
    if (capMap[id]) entry.figureCaption = capMap[id];
    if (figMap[id]) entry.figure = figMap[id];
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Patched ${filePath}`);
}

patch(koPath, 'ko');
patch(enPath, 'en');
