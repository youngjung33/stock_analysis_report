'use client';

import { formatAmountInput, type AmountFormatOptions } from '@sar/shared';
import type { InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: string;
  onValueChange: (value: string) => void;
  formatOptions?: AmountFormatOptions;
};

/** 금액 입력 — 천 단위 쉼표 자동 적용 */
export function AmountInput({ value, onValueChange, formatOptions, ...rest }: Props) {
  const allowDecimal = (formatOptions?.maxFractionDigits ?? 0) > 0;

  return (
    <input
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      autoComplete="off"
      value={value}
      onChange={(e) => onValueChange(formatAmountInput(e.target.value, formatOptions))}
      {...rest}
    />
  );
}
