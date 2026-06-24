/** 단순 이동평균 (마지막 period 구간) */
export function sma(values: number[], period: number): number | null {
  if (values.length < period || period <= 0) return null;
  const slice = values.slice(-period);
  return slice.reduce((sum, v) => sum + v, 0) / period;
}

/** RSI(14) — Wilder smoothing 근사 */
export function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function ema(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let emaValue = values.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = period; i < values.length; i++) {
    emaValue = values[i] * k + emaValue * (1 - k);
  }
  return emaValue;
}

/** MACD line (12/26 EMA 차) */
export function macdLine(closes: number[]): number | null {
  const fast = ema(closes, 12);
  const slow = ema(closes, 26);
  if (fast === null || slow === null) return null;
  return fast - slow;
}

export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
  percentB: number;
  bandwidthPct: number;
}

/** 볼린저 밴드 (20, 2) + %B */
export function bollingerBands(
  closes: number[],
  period = 20,
  mult = 2,
): BollingerBandsResult | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const middle = slice.reduce((s, v) => s + v, 0) / period;
  const variance = slice.reduce((s, v) => s + (v - middle) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  const upper = middle + mult * std;
  const lower = middle - mult * std;
  const current = closes[closes.length - 1];
  const bandWidth = upper - lower;
  const percentB = bandWidth > 0 ? (current - lower) / bandWidth : 0.5;
  const bandwidthPct = middle > 0 ? (bandWidth / middle) * 100 : 0;
  return { upper, middle, lower, percentB, bandwidthPct };
}

export interface StochasticResult {
  k: number;
  d: number;
}

/** 스토캐스틱 %K(14) · %D(3) */
export function stochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod = 14,
  dPeriod = 3,
): StochasticResult | null {
  if (closes.length < kPeriod + dPeriod - 1) return null;

  const kValues: number[] = [];
  for (let i = kPeriod - 1; i < closes.length; i++) {
    const hSlice = highs.slice(i - kPeriod + 1, i + 1);
    const lSlice = lows.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...hSlice);
    const low = Math.min(...lSlice);
    const close = closes[i];
    if (high <= low) {
      kValues.push(50);
    } else {
      kValues.push(((close - low) / (high - low)) * 100);
    }
  }

  if (kValues.length < dPeriod) return null;
  const k = kValues[kValues.length - 1];
  const dSlice = kValues.slice(-dPeriod);
  const d = dSlice.reduce((s, v) => s + v, 0) / dPeriod;
  return { k, d };
}

/** N거래일 전 대비 등락률 */
export function changePercentOverBars(closes: number[], bars: number): number | null {
  if (closes.length <= bars) return null;
  const current = closes[closes.length - 1];
  const base = closes[closes.length - 1 - bars];
  if (base <= 0) return null;
  return ((current - base) / base) * 100;
}

export function stdDev(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function rangePosition(current: number, highs: number[], lows: number[]): number | null {
  if (highs.length === 0 || lows.length === 0) return null;
  const high = Math.max(...highs);
  const low = Math.min(...lows);
  if (high <= low) return null;
  return ((current - low) / (high - low)) * 100;
}

export function volumeRatio(volumes: number[], lookback = 20): number | null {
  const valid = volumes.filter((v) => v > 0);
  if (valid.length < lookback + 1) return null;
  const recent = valid[valid.length - 1];
  const avg = valid.slice(-lookback - 1, -1).reduce((s, v) => s + v, 0) / lookback;
  if (avg <= 0) return null;
  return recent / avg;
}
