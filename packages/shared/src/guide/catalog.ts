export type GuideCategoryId =
  | 'isa'
  | 'tax'
  | 'charts'
  | 'trading'
  | 'accounts'
  | 'portfolio'
  | 'type-analysis';

export interface GuideRelatedLink {
  href: string;
  labelKey: string;
}

export interface GuideFaqItemDef {
  id: string;
  categoryId: GuideCategoryId;
  tags?: string[];
  relatedLinks?: GuideRelatedLink[];
}

export const GUIDE_CATEGORIES: { id: GuideCategoryId; labelKey: string }[] = [
  { id: 'isa', labelKey: 'guide.categories.isa.label' },
  { id: 'tax', labelKey: 'guide.categories.tax.label' },
  { id: 'charts', labelKey: 'guide.categories.charts.label' },
  { id: 'trading', labelKey: 'guide.categories.trading.label' },
  { id: 'accounts', labelKey: 'guide.categories.accounts.label' },
  { id: 'portfolio', labelKey: 'guide.categories.portfolio.label' },
  { id: 'type-analysis', labelKey: 'guide.categories.typeAnalysis.label' },
];

export const GUIDE_FAQ_CATALOG: GuideFaqItemDef[] = [
  // ISA
  {
    id: 'isa-what-is',
    categoryId: 'isa',
    tags: ['isa', 'account', 'beginner'],
    relatedLinks: [{ href: '/tax', labelKey: 'guide.links.taxGuide' }],
  },
  {
    id: 'isa-yearly-limit',
    categoryId: 'isa',
    tags: ['isa', 'limit', 'tax-free'],
    relatedLinks: [{ href: '/tax', labelKey: 'guide.links.taxGuide' }],
  },
  {
    id: 'isa-early-withdrawal',
    categoryId: 'isa',
    tags: ['isa', 'withdrawal', 'maturity'],
  },
  {
    id: 'isa-vs-regular',
    categoryId: 'isa',
    tags: ['isa', 'brokerage', 'compare'],
  },
  {
    id: 'isa-overflow-tax',
    categoryId: 'isa',
    tags: ['isa', 'tax', '9.9'],
    relatedLinks: [{ href: '/tax', labelKey: 'guide.links.taxGuide' }],
  },
  {
    id: 'isa-comprehensive-tax-exclusion',
    categoryId: 'isa',
    tags: ['isa', 'comprehensive', 'tax'],
    relatedLinks: [{ href: '/tax', labelKey: 'guide.links.taxGuide' }],
  },
  {
    id: 'isa-eligibility-types',
    categoryId: 'isa',
    tags: ['isa', 'worker', 'senior', 'general'],
  },
  {
    id: 'isa-contribution-limit',
    categoryId: 'isa',
    tags: ['isa', 'deposit', 'limit'],
  },
  {
    id: 'isa-maturity-options',
    categoryId: 'isa',
    tags: ['isa', 'maturity', 'pension'],
  },
  {
    id: 'isa-loss-offset',
    categoryId: 'isa',
    tags: ['isa', 'loss', 'gain'],
  },
  // Tax
  {
    id: 'tax-domestic-capital-gains',
    categoryId: 'tax',
    tags: ['tax', 'korea', 'capital-gains'],
    relatedLinks: [{ href: '/tax', labelKey: 'guide.links.taxGuide' }],
  },
  {
    id: 'tax-dividend-154',
    categoryId: 'tax',
    tags: ['tax', 'dividend', '15.4'],
    relatedLinks: [{ href: '/tax', labelKey: 'guide.links.taxGuide' }],
  },
  {
    id: 'tax-foreign-gains',
    categoryId: 'tax',
    tags: ['tax', 'us', 'capital-gains'],
    relatedLinks: [{ href: '/tax', labelKey: 'guide.links.taxGuide' }],
  },
  {
    id: 'tax-foreign-dividend',
    categoryId: 'tax',
    tags: ['tax', 'us', 'dividend'],
    relatedLinks: [{ href: '/tax', labelKey: 'guide.links.taxGuide' }],
  },
  {
    id: 'tax-financial-comprehensive',
    categoryId: 'tax',
    tags: ['tax', 'comprehensive', '20m'],
    relatedLinks: [{ href: '/tax', labelKey: 'guide.links.taxGuide' }],
  },
  {
    id: 'tax-filing-schedule',
    categoryId: 'tax',
    tags: ['tax', 'filing', 'may'],
    relatedLinks: [{ href: '/tax', labelKey: 'guide.links.taxGuide' }],
  },
  {
    id: 'tax-securities-transaction',
    categoryId: 'tax',
    tags: ['tax', 'transaction', 'fee'],
    relatedLinks: [{ href: '/tax', labelKey: 'guide.links.taxGuide' }],
  },
  // Charts
  {
    id: 'charts-trendline',
    categoryId: 'charts',
    tags: ['chart', 'trendline', 'skill'],
    relatedLinks: [{ href: '/market/analysis', labelKey: 'guide.links.marketAnalysis' }],
  },
  {
    id: 'charts-support-resistance',
    categoryId: 'charts',
    tags: ['chart', 'support', 'resistance'],
    relatedLinks: [{ href: '/market/analysis', labelKey: 'guide.links.marketAnalysis' }],
  },
  {
    id: 'charts-rsi',
    categoryId: 'charts',
    tags: ['chart', 'rsi', 'indicator'],
    relatedLinks: [{ href: '/market/analysis', labelKey: 'guide.links.marketAnalysis' }],
  },
  {
    id: 'charts-macd',
    categoryId: 'charts',
    tags: ['chart', 'macd', 'indicator'],
    relatedLinks: [{ href: '/market/analysis', labelKey: 'guide.links.marketAnalysis' }],
  },
  {
    id: 'charts-moving-average',
    categoryId: 'charts',
    tags: ['chart', 'ma', 'average'],
    relatedLinks: [{ href: '/market/analysis', labelKey: 'guide.links.marketAnalysis' }],
  },
  {
    id: 'charts-volume',
    categoryId: 'charts',
    tags: ['chart', 'volume'],
    relatedLinks: [{ href: '/market/analysis', labelKey: 'guide.links.marketAnalysis' }],
  },
  {
    id: 'charts-vix',
    categoryId: 'charts',
    tags: ['chart', 'vix', 'fear'],
    relatedLinks: [{ href: '/market/analysis', labelKey: 'guide.links.marketAnalysis' }],
  },
  {
    id: 'charts-caution',
    categoryId: 'charts',
    tags: ['chart', 'caution', 'risk'],
  },
  // Trading
  {
    id: 'trading-average-cost',
    categoryId: 'trading',
    tags: ['trading', 'average-cost', 'basis'],
  },
  {
    id: 'trading-pnl',
    categoryId: 'trading',
    tags: ['trading', 'pnl', 'profit'],
  },
  {
    id: 'trading-market-vs-limit',
    categoryId: 'trading',
    tags: ['trading', 'order', 'market', 'limit'],
  },
  {
    id: 'trading-dividend-ex-date',
    categoryId: 'trading',
    tags: ['trading', 'dividend', 'ex-date'],
    relatedLinks: [{ href: '/transactions', labelKey: 'guide.links.transactions' }],
  },
  {
    id: 'trading-corporate-actions',
    categoryId: 'trading',
    tags: ['trading', 'split', 'merger'],
    relatedLinks: [{ href: '/transactions', labelKey: 'guide.links.transactions' }],
  },
  {
    id: 'trading-quantity',
    categoryId: 'trading',
    tags: ['trading', 'quantity', 'shares'],
  },
  // Accounts
  {
    id: 'accounts-brokerage',
    categoryId: 'accounts',
    tags: ['account', 'brokerage'],
  },
  {
    id: 'accounts-isa-role',
    categoryId: 'accounts',
    tags: ['account', 'isa'],
    relatedLinks: [{ href: '/tax', labelKey: 'guide.links.taxGuide' }],
  },
  {
    id: 'accounts-pension',
    categoryId: 'accounts',
    tags: ['account', 'pension'],
    relatedLinks: [{ href: '/tax', labelKey: 'guide.links.taxGuide' }],
  },
  {
    id: 'accounts-cma',
    categoryId: 'accounts',
    tags: ['account', 'cma', 'cash'],
  },
  // Portfolio
  {
    id: 'portfolio-diversification',
    categoryId: 'portfolio',
    tags: ['portfolio', 'diversification'],
    relatedLinks: [{ href: '/guide/investor-type', labelKey: 'guide.links.investorSurvey' }],
  },
  {
    id: 'portfolio-rebalancing',
    categoryId: 'portfolio',
    tags: ['portfolio', 'rebalance'],
    relatedLinks: [{ href: '/guide/investor-type', labelKey: 'guide.links.investorSurvey' }],
  },
  {
    id: 'portfolio-cash-ratio',
    categoryId: 'portfolio',
    tags: ['portfolio', 'cash'],
  },
  {
    id: 'portfolio-long-term',
    categoryId: 'portfolio',
    tags: ['portfolio', 'long-term'],
  },
  // Type analysis (tests)
  {
    id: 'analysis-investor-type',
    categoryId: 'type-analysis',
    tags: ['analysis', 'investor-type', 'survey', '10step'],
    relatedLinks: [{ href: '/guide/investor-type', labelKey: 'guide.links.startTest' }],
  },
  {
    id: 'analysis-risk-check',
    categoryId: 'type-analysis',
    tags: ['analysis', 'risk', 'survey', '5step'],
    relatedLinks: [{ href: '/guide/analysis/risk-check', labelKey: 'guide.links.startTest' }],
  },
  {
    id: 'analysis-horizon-goal',
    categoryId: 'type-analysis',
    tags: ['analysis', 'horizon', 'goal', 'survey', '5step'],
    relatedLinks: [{ href: '/guide/analysis/horizon-goal', labelKey: 'guide.links.startTest' }],
  },
  {
    id: 'analysis-allocation-style',
    categoryId: 'type-analysis',
    tags: ['analysis', 'allocation', 'survey', '5step'],
    relatedLinks: [{ href: '/guide/analysis/allocation-style', labelKey: 'guide.links.startTest' }],
  },
];

export function isGuideCategoryId(value: string): value is GuideCategoryId {
  return GUIDE_CATEGORIES.some((c) => c.id === value);
}
