'use client';

import type { TFunction } from 'i18next';
import { renderGuideFigureContent } from './registry';

interface Props {
  itemId: string;
  caption?: string;
  t: TFunction;
}

export function GuideFigure({ itemId, caption, t }: Props) {
  const content = renderGuideFigureContent(itemId, t);
  if (!content) return null;
  return content(caption);
}
