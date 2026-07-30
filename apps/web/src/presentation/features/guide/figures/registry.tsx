import type { TFunction } from 'i18next';
import { getIsaFigureRenderers } from './isa-figures';
import { getTaxFigureRenderers } from './tax-figures';
import { getChartsFigureRenderers } from './charts-figures';
import {
  getAccountsFigureRenderers,
  getPortfolioFigureRenderers,
  getTradingFigureRenderers,
} from './trading-figures';

type FigureRenderer = (caption?: string) => React.ReactNode;

export function renderGuideFigureContent(
  itemId: string,
  t: TFunction,
): FigureRenderer | null {
  const all: Record<string, FigureRenderer> = {
    ...getIsaFigureRenderers(t),
    ...getTaxFigureRenderers(t),
    ...getChartsFigureRenderers(t),
    ...getTradingFigureRenderers(t),
    ...getAccountsFigureRenderers(t),
    ...getPortfolioFigureRenderers(t),
  };
  return all[itemId] ?? null;
}

export function hasGuideFigure(itemId: string): boolean {
  return renderGuideFigureContent(itemId, ((key) => key) as TFunction) !== null;
}
