import { Candle } from "../types";

// Calculate Simple Moving Average (SMA)
export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

// Calculate Exponential Moving Average (EMA)
export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  let initialSMA = 0;
  for (let i = 0; i < period; i++) {
    if (i < data.length) {
      initialSMA += data[i];
    }
  }
  initialSMA /= period;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(NaN);
    } else if (i === period - 1) {
      ema.push(initialSMA);
    } else {
      const val = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
      ema.push(val);
    }
  }
  return ema;
}

// Calculate Relative Strength Index (RSI)
export function calculateRSI(closes: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  if (closes.length < period + 1) {
    return closes.map(() => 50);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      rsi.push(50);
    } else if (i === period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    } else {
      const diff = closes[i] - closes[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }
  }

  return rsi;
}

// Calculate MACD (12, 26, 9)
export function calculateMACD(closes: number[]) {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (isNaN(ema12[i]) || isNaN(ema26[i])) {
      macdLine.push(0);
    } else {
      macdLine.push(ema12[i] - ema26[i]);
    }
  }

  const signalLine = calculateEMA(macdLine, 9);
  const histogram: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    const sig = isNaN(signalLine[i]) ? 0 : signalLine[i];
    histogram.push(macdLine[i] - sig);
  }

  return {
    macdLine,
    signalLine,
    histogram,
  };
}

// Calculate Average True Range (ATR)
export function calculateATR(candles: Candle[], period: number = 14): number[] {
  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[i].high - candles[i].low);
    } else {
      const h_l = candles[i].high - candles[i].low;
      const h_pc = Math.abs(candles[i].high - candles[i - 1].close);
      const l_pc = Math.abs(candles[i].low - candles[i - 1].close);
      tr.push(Math.max(h_l, h_pc, l_pc));
    }
  }
  return calculateSMA(tr, period);
}

// Calculate Bollinger Bands (period 20, multiplier 2)
export function calculateBollingerBands(closes: number[], period: number = 20, mult: number = 2) {
  const sma = calculateSMA(closes, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (isNaN(sma[i])) {
      upper.push(NaN);
      lower.push(NaN);
    } else {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      upper.push(mean + mult * stdDev);
      lower.push(mean - mult * stdDev);
    }
  }

  return { middle: sma, upper, lower };
}

// Detect Key Support and Resistance Levels
export function detectKeyLevels(candles: Candle[], count: number = 3) {
  if (candles.length < 20) return { supports: [], resistances: [] };

  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const pivotHighs: number[] = [];
  const pivotLows: number[] = [];

  for (let i = 2; i < candles.length - 2; i++) {
    if (
      highs[i] > highs[i - 1] &&
      highs[i] > highs[i - 2] &&
      highs[i] > highs[i + 1] &&
      highs[i] > highs[i + 2]
    ) {
      pivotHighs.push(Number(highs[i].toFixed(2)));
    }
    if (
      lows[i] < lows[i - 1] &&
      lows[i] < lows[i - 2] &&
      lows[i] < lows[i + 1] &&
      lows[i] < lows[i + 2]
    ) {
      pivotLows.push(Number(lows[i].toFixed(2)));
    }
  }

  const lastPrice = candles[candles.length - 1].close;
  const resistances = pivotHighs
    .filter((h) => h >= lastPrice)
    .sort((a, b) => a - b)
    .slice(0, count);

  const supports = pivotLows
    .filter((l) => l <= lastPrice)
    .sort((a, b) => b - a)
    .slice(0, count);

  return {
    supports: supports.length ? supports : [Number((lastPrice - 5.0).toFixed(2))],
    resistances: resistances.length ? resistances : [Number((lastPrice + 5.0).toFixed(2))],
  };
}

// Calculate PnL for Gold XAU/USD (1 lot = 100 oz of gold)
export function calculateGoldPnL(
  type: "BUY" | "SELL",
  entryPrice: number,
  currentPrice: number,
  lotSize: number
): { pnlUsd: number; pnlPips: number } {
  // 1 pip in XAU/USD is typically $0.10 (10 points) or $0.01 depending on broker.
  // Standard Exness: 1 pip = 0.10 USD price difference. 1.00 lot = $10 per pip ($100 per $1 move).
  const priceDiff = type === "BUY" ? currentPrice - entryPrice : entryPrice - currentPrice;
  const pnlPips = Number((priceDiff / 0.1).toFixed(1));
  const pnlUsd = Number((priceDiff * 100 * lotSize).toFixed(2));
  return { pnlUsd, pnlPips };
}

// Calculate Recommended Lot Size based on Account Balance and SL distance
export function calculateLotSize(
  balance: number,
  riskPercent: number,
  entryPrice: number,
  stopLoss: number
): number {
  const riskAmountUsd = (balance * riskPercent) / 100;
  const slDistancePrice = Math.abs(entryPrice - stopLoss);
  if (slDistancePrice <= 0) return 0.01;

  // 1 lot loses $100 per $1 move in gold
  const rawLot = riskAmountUsd / (slDistancePrice * 100);
  const clampedLot = Math.min(10.0, Math.max(0.01, Math.floor(rawLot * 100) / 100));
  return Number(clampedLot.toFixed(2));
}

// Detect Price Action Candlestick Rejection Patterns (Pin Bars, Hammers, Engulfing)
export interface CandlestickRejection {
  type: "BULLISH_PIN" | "BEARISH_PIN" | "BULLISH_ENGULFING" | "BEARISH_ENGULFING" | "NEUTRAL";
  strength: number; // 0 to 100
  description: string;
}

export function detectCandlestickPattern(candles: Candle[]): CandlestickRejection {
  if (candles.length < 3) {
    return { type: "NEUTRAL", strength: 50, description: "Data candle belum cukup" };
  }

  const current = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  const totalRange = current.high - current.low;
  if (totalRange <= 0.05) {
    return { type: "NEUTRAL", strength: 50, description: "Volatilitas bar sangat rendah" };
  }

  const body = Math.abs(current.close - current.open);
  const isBullishClose = current.close >= current.open;
  const upperWick = current.high - Math.max(current.open, current.close);
  const lowerWick = Math.min(current.open, current.close) - current.low;

  // Bullish Pin Bar / Hammer (Lower wick is at least 55% of total range with rejection)
  if (lowerWick >= totalRange * 0.55 && isBullishClose) {
    return {
      type: "BULLISH_PIN",
      strength: Math.min(95, Math.round(75 + (lowerWick / totalRange) * 20)),
      description: `Rejection Bullish Pin Bar di $${current.low.toFixed(2)} (Ekor bawah ${(
        (lowerWick / totalRange) *
        100
      ).toFixed(0)}% menolak support)`,
    };
  }

  // Bearish Shooting Star / Pin Bar (Upper wick is at least 55% of total range)
  if (upperWick >= totalRange * 0.55 && !isBullishClose) {
    return {
      type: "BEARISH_PIN",
      strength: Math.min(95, Math.round(75 + (upperWick / totalRange) * 20)),
      description: `Rejection Bearish Pin Bar di $${current.high.toFixed(2)} (Ekor atas ${(
        (upperWick / totalRange) *
        100
      ).toFixed(0)}% menolak resistance)`,
    };
  }

  // Bullish Engulfing
  const prevBody = Math.abs(prev.close - prev.open);
  if (
    isBullishClose &&
    prev.close < prev.open &&
    current.close > prev.open &&
    current.open <= prev.close &&
    body > prevBody * 1.15
  ) {
    return {
      type: "BULLISH_ENGULFING",
      strength: 88,
      description: `Bullish Engulfing menelan candle bearish sebelumnya (${(
        (body / prevBody) *
        100
      ).toFixed(0)}% expansion)`,
    };
  }

  // Bearish Engulfing
  if (
    !isBullishClose &&
    prev.close > prev.open &&
    current.close < prev.open &&
    current.open >= prev.close &&
    body > prevBody * 1.15
  ) {
    return {
      type: "BEARISH_ENGULFING",
      strength: 88,
      description: `Bearish Engulfing menelan candle bullish sebelumnya (${(
        (body / prevBody) *
        100
      ).toFixed(0)}% expansion)`,
    };
  }

  return {
    type: "NEUTRAL",
    strength: 50,
    description: "Candle momentum standar tanpa rejection tajam",
  };
}

// Detect SMC Order Blocks & Structure
export interface SMCStructureResult {
  marketStructure: "BULLISH_HH_HL" | "BEARISH_LH_LL" | "CHOPPY_RANGE";
  bosStatus: string;
  orderBlockZone: string;
  liquidityTarget: string;
  hasLiquiditySweep: boolean;
  scoreBonus: number;
}

export function analyzeSMCStructure(candles: Candle[], currentPrice: number): SMCStructureResult {
  if (candles.length < 15) {
    return {
      marketStructure: "CHOPPY_RANGE",
      bosStatus: "Konsolidasi range",
      orderBlockZone: `$${(currentPrice - 3).toFixed(2)} - $${(currentPrice + 3).toFixed(2)}`,
      liquidityTarget: `$${(currentPrice + 5).toFixed(2)}`,
      hasLiquiditySweep: false,
      scoreBonus: 0,
    };
  }

  const slice = candles.slice(-20);
  const highest = Math.max(...slice.map((c) => c.high));
  const lowest = Math.min(...slice.map((c) => c.low));
  const closes = slice.map((c) => c.close);
  const firstClose = closes[0];
  const lastClose = closes[closes.length - 1];

  const recentCandles = slice.slice(-6);
  const recentHigh = Math.max(...recentCandles.map((c) => c.high));
  const recentLow = Math.min(...recentCandles.map((c) => c.low));

  // Check liquidity sweeps (wick spikes past high/low followed by reversal)
  let hasBullishSweep = false;
  let hasBearishSweep = false;

  for (let i = slice.length - 4; i < slice.length; i++) {
    if (slice[i].low < lowest + 0.5 && slice[i].close > slice[i].low + 1.2) {
      hasBullishSweep = true;
    }
    if (slice[i].high > highest - 0.5 && slice[i].close < slice[i].high - 1.2) {
      hasBearishSweep = true;
    }
  }

  const isUpTrend = lastClose > firstClose + 2.5;
  const isDownTrend = lastClose < firstClose - 2.5;

  if (isUpTrend && !hasBearishSweep) {
    return {
      marketStructure: "BULLISH_HH_HL",
      bosStatus: "BOS Bullish Confirmed (Higher High Break)",
      orderBlockZone: `$${(recentLow - 0.5).toFixed(2)} - $${(recentLow + 1.5).toFixed(2)} Demand OB`,
      liquidityTarget: `$${(highest + 4.0).toFixed(2)} Buy-Side Liquidity (BSL)`,
      hasLiquiditySweep: hasBullishSweep,
      scoreBonus: hasBullishSweep ? 18 : 12,
    };
  } else if (isDownTrend && !hasBullishSweep) {
    return {
      marketStructure: "BEARISH_LH_LL",
      bosStatus: "BOS Bearish Confirmed (Lower Low Break)",
      orderBlockZone: `$${(recentHigh - 1.5).toFixed(2)} - $${(recentHigh + 0.5).toFixed(2)} Supply OB`,
      liquidityTarget: `$${(lowest - 4.0).toFixed(2)} Sell-Side Liquidity (SSL)`,
      hasLiquiditySweep: hasBearishSweep,
      scoreBonus: hasBearishSweep ? 18 : 12,
    };
  }

  return {
    marketStructure: "CHOPPY_RANGE",
    bosStatus: "Equilibrium Range (Menunggu Breakout)",
    orderBlockZone: `$${(lowest).toFixed(2)} - $${(highest).toFixed(2)} Range Midpoint`,
    liquidityTarget: `$${(highest + 2).toFixed(2)} / $${(lowest - 2).toFixed(2)}`,
    hasLiquiditySweep: false,
    scoreBonus: 0,
  };
}
