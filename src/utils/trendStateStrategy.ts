import { Candle, Timeframe } from "../types";

export type SourceType =
  | "Close"
  | "HL2"
  | "HLC3"
  | "OHLC4"
  | "OCC3"
  | "HLCC4"
  | "Custom";

export interface TrendStateConfig {
  sourceType: SourceType;
  length: number; // Sensitivity Length, default 5
  multiplier: number; // Range Multiplier, default 2.0
  offset: number; // ALMA Offset, default 0.5
  sigma: number; // ALMA Sigma, default 1.0
  confirmClose: boolean; // Confirm Signals On Bar Close, default true
  bullColor: string; // #00FFAA
  bearColor: string; // #FF0000
  showGlow: boolean;
  showRibbon: boolean;
  showLabels: boolean;
  labelDist: number; // 1.0
  paintCandles: boolean;
}

export const defaultTSSConfig: TrendStateConfig = {
  sourceType: "Custom",
  length: 5,
  multiplier: 2.0,
  offset: 0.5,
  sigma: 1.0,
  confirmClose: true,
  bullColor: "#00F5A0",
  bearColor: "#FF334B",
  showGlow: true,
  showRibbon: true,
  showLabels: true,
  labelDist: 1.0,
  paintCandles: false,
};

export interface TSSBarResult {
  index: number;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  src: number;
  movement: number;
  smoothMove: number;
  adaptiveRange: number;
  upper: number;
  lower: number;
  filter: number;
  prevFilter: number;
  trend: number; // 1 = Bull, -1 = Bear, 0 = Flat
  bullSignal: boolean;
  bearSignal: boolean;
  candleColor: string;
  bullPos: number;
  bearPos: number;
}

export interface TrendStateStrategyResult {
  bars: TSSBarResult[];
  latestBar: TSSBarResult;
  currentTrend: "BULLISH" | "BEARISH" | "NEUTRAL";
  currentFilter: number;
  currentUpper: number;
  currentLower: number;
  currentAdaptiveRange: number;
  isBullSignalNow: boolean;
  isBearSignalNow: boolean;
  signalType: "BUY" | "SELL" | "HOLD";
  recommendedEntry: number;
  recommendedSL: number;
  recommendedTP1: number;
  recommendedTP2: number;
  recommendedTP3: number;
  recommendedTP4?: number;
  pipsSl?: number;
  pipsTp1?: number;
  pipsTp2?: number;
  pipsTp3?: number;
  pipsTp4?: number;
  riskRewardRatio: string;
  stats: {
    totalSignals: number;
    buySignals: number;
    sellSignals: number;
    currentTrendDurationBars: number;
  };
}

/**
 * Calculates Source Value based on Pine Script source type switch
 */
export function calculateSource(candle: Candle, type: SourceType = "Custom"): number {
  const { open, high, low, close } = candle;
  switch (type) {
    case "Close":
      return close;
    case "HL2":
      return (high + low) / 2;
    case "HLC3":
      return (high + low + close) / 3;
    case "OHLC4":
      return (open + high + low + close) / 4;
    case "HLCC4":
      return (high + low + 2 * close) / 4;
    case "OCC3":
      return (open + 2 * close) / 3;
    case "Custom":
    default:
      return (open + 2 * high + 2 * low + 2 * close) / 7;
  }
}

/**
 * Arnaud Legoux Moving Average (ALMA) implementation matching Pine Script ta.alma()
 * Formula:
 * m = offset * (length - 1)
 * s = length / sigma
 * w_i = exp( - (i - m)^2 / (2 * s^2) )
 * ALMA = sum(w_i * x_i) / sum(w_i)
 */
export function calculateALMA(
  series: number[],
  length: number = 5,
  offset: number = 0.5,
  sigma: number = 1.0
): number[] {
  const n = series.length;
  const result: number[] = new Array(n).fill(0);
  if (n === 0) return result;

  const validLength = Math.max(1, Math.floor(length));
  const m = offset * (validLength - 1);
  const s = validLength / Math.max(0.001, sigma);
  const s2 = 2 * s * s;

  // Precompute weights
  const weights: number[] = new Array(validLength);
  let weightSum = 0;
  for (let i = 0; i < validLength; i++) {
    const w = Math.exp(-((i - m) * (i - m)) / s2);
    weights[i] = w;
    weightSum += w;
  }

  for (let t = 0; t < n; t++) {
    if (t < validLength - 1) {
      // Handle warmup period: compute partial ALMA for available bars
      let partialWeightSum = 0;
      let sum = 0;
      const count = t + 1;
      const subOffset = offset * (count - 1);
      const subS = count / Math.max(0.001, sigma);
      const subS2 = 2 * subS * subS;
      for (let i = 0; i < count; i++) {
        const w = Math.exp(-((i - subOffset) * (i - subOffset)) / subS2);
        sum += w * series[t - (count - 1 - i)];
        partialWeightSum += w;
      }
      result[t] = partialWeightSum > 0 ? sum / partialWeightSum : series[t];
    } else {
      let sum = 0;
      for (let i = 0; i < validLength; i++) {
        sum += weights[i] * series[t - (validLength - 1 - i)];
      }
      result[t] = weightSum > 0 ? sum / weightSum : series[t];
    }
  }

  return result;
}

/**
 * Executes the full Pine Script "Trend State Strategy" (TSS_Strat v6)
 */
export function calculateTrendStateStrategy(
  candles: Candle[],
  config: Partial<TrendStateConfig> = {}
): TrendStateStrategyResult {
  const fullConfig: TrendStateConfig = { ...defaultTSSConfig, ...config };
  const n = candles.length;

  if (n === 0) {
    const emptyBar: TSSBarResult = {
      index: 0,
      time: Date.now(),
      open: 4500,
      high: 4500,
      low: 4500,
      close: 4500,
      src: 4500,
      movement: 0,
      smoothMove: 0,
      adaptiveRange: 1.5,
      upper: 4501.5,
      lower: 4498.5,
      filter: 4500,
      prevFilter: 4500,
      trend: 0,
      bullSignal: false,
      bearSignal: false,
      candleColor: "#94a3b8",
      bullPos: 4498.5,
      bearPos: 4501.5,
    };
    return {
      bars: [emptyBar],
      latestBar: emptyBar,
      currentTrend: "NEUTRAL",
      currentFilter: 4500,
      currentUpper: 4501.5,
      currentLower: 4498.5,
      currentAdaptiveRange: 1.5,
      isBullSignalNow: false,
      isBearSignalNow: false,
      signalType: "HOLD",
      recommendedEntry: 4500,
      recommendedSL: 4495,
      recommendedTP1: 4505,
      recommendedTP2: 4510,
      recommendedTP3: 4515,
      riskRewardRatio: "1:2.0",
      stats: { totalSignals: 0, buySignals: 0, sellSignals: 0, currentTrendDurationBars: 0 },
    };
  }

  // 1. Calculate Source Series
  const srcSeries: number[] = candles.map((c) => calculateSource(c, fullConfig.sourceType));

  // 2. Calculate Movement Series: movement = math.abs(ta.change(src))
  const movementSeries: number[] = new Array(n);
  movementSeries[0] = 0;
  for (let i = 1; i < n; i++) {
    movementSeries[i] = Math.abs(srcSeries[i] - srcSeries[i - 1]);
  }

  // 3. Adaptive Range: smoothMove = ta.alma(movement, length, offset, sigma)
  const smoothMoveSeries = calculateALMA(
    movementSeries,
    fullConfig.length,
    fullConfig.offset,
    fullConfig.sigma
  );

  const adaptiveRangeSeries: number[] = smoothMoveSeries.map(
    (val) => Math.max(0.2, val * fullConfig.multiplier)
  );

  // 4. Step Filter & Trend State Iteration
  const filterSeries: number[] = new Array(n);
  const upperSeries: number[] = new Array(n);
  const lowerSeries: number[] = new Array(n);
  const trendSeries: number[] = new Array(n);
  const prevFilterSeries: number[] = new Array(n);

  let currentFilter = srcSeries[0];
  let currentTrend = 0;

  for (let i = 0; i < n; i++) {
    const src = srcSeries[i];
    const adRange = adaptiveRangeSeries[i];
    const prevF = i === 0 ? src : currentFilter;
    prevFilterSeries[i] = prevF;

    const upper = prevF + adRange;
    const lower = prevF - adRange;
    upperSeries[i] = upper;
    lowerSeries[i] = lower;

    // Filter Step Logic
    if (src > upper) {
      currentFilter = src - adRange;
    } else if (src < lower) {
      currentFilter = src + adRange;
    } else {
      currentFilter = prevF;
    }
    filterSeries[i] = currentFilter;

    // Trend Logic:
    // trend := filter > filter[1] ? 1 : filter < filter[1] ? -1 : nz(trend[1], 0)
    if (i === 0) {
      currentTrend = 0;
    } else {
      const prevFilterVal = filterSeries[i - 1];
      if (currentFilter > prevFilterVal) {
        currentTrend = 1;
      } else if (currentFilter < prevFilterVal) {
        currentTrend = -1;
      } else {
        currentTrend = trendSeries[i - 1] || 0;
      }
    }
    trendSeries[i] = currentTrend;
  }

  // 5. Signals Calculation
  const bars: TSSBarResult[] = [];
  let totalSignals = 0;
  let buySignals = 0;
  let sellSignals = 0;

  for (let i = 0; i < n; i++) {
    const candle = candles[i];
    const tr = trendSeries[i];
    const bull = tr === 1;
    const bear = tr === -1;

    let bullSignal = false;
    let bearSignal = false;

    if (fullConfig.confirmClose) {
      // bullSignal = (trend[1] == 1 and nz(trend[2]) != 1)
      const tr1 = i >= 1 ? trendSeries[i - 1] : 0;
      const tr2 = i >= 2 ? trendSeries[i - 2] : 0;
      bullSignal = tr1 === 1 && tr2 !== 1;
      bearSignal = tr1 === -1 && tr2 !== -1;
    } else {
      // bullSignal = (bull and nz(trend[1]) != 1)
      const tr1 = i >= 1 ? trendSeries[i - 1] : 0;
      bullSignal = bull && tr1 !== 1;
      bearSignal = bear && tr1 !== -1;
    }

    if (bullSignal) {
      totalSignals++;
      buySignals++;
    }
    if (bearSignal) {
      totalSignals++;
      sellSignals++;
    }

    const candleColor = fullConfig.paintCandles
      ? bull
        ? fullConfig.bullColor
        : bear
        ? fullConfig.bearColor
        : "#94a3b8"
      : candle.close >= candle.open
      ? "#089981"
      : "#F23645";

    const filterVal = filterSeries[i];
    const adRangeVal = adaptiveRangeSeries[i];
    const bullPos = fullConfig.confirmClose && i >= 1
      ? filterSeries[i - 1] - adaptiveRangeSeries[i - 1] * fullConfig.labelDist
      : filterVal - adRangeVal * fullConfig.labelDist;
    const bearPos = fullConfig.confirmClose && i >= 1
      ? filterSeries[i - 1] + adaptiveRangeSeries[i - 1] * fullConfig.labelDist
      : filterVal + adRangeVal * fullConfig.labelDist;

    bars.push({
      index: i,
      time: candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      src: srcSeries[i],
      movement: movementSeries[i],
      smoothMove: smoothMoveSeries[i],
      adaptiveRange: adRangeVal,
      upper: upperSeries[i],
      lower: lowerSeries[i],
      filter: filterVal,
      prevFilter: prevFilterSeries[i],
      trend: tr,
      bullSignal,
      bearSignal,
      candleColor,
      bullPos,
      bearPos,
    });
  }

  const latestBar = bars[bars.length - 1];
  const currentTrendEnum: "BULLISH" | "BEARISH" | "NEUTRAL" =
    latestBar.trend === 1 ? "BULLISH" : latestBar.trend === -1 ? "BEARISH" : "NEUTRAL";

  // Calculate current trend duration in bars
  let currentTrendDurationBars = 1;
  for (let k = bars.length - 2; k >= 0; k--) {
    if (bars[k].trend === latestBar.trend) {
      currentTrendDurationBars++;
    } else {
      break;
    }
  }

  // Calculate optimal entry, SL, TP targets: Default SL 50 pips (5.000 USD on XAU/USD), TP1 (+50p), TP2 (+100p), TP3 (+150p), TP4 (+200p)
  const isBull = currentTrendEnum === "BULLISH";
  const isBear = currentTrendEnum === "BEARISH";
  const entryPrice = latestBar.close;
  const slPipsDistance = 5.0; // 50 pips on Gold XAU/USD

  let recommendedSL = entryPrice;
  let recommendedTP1 = entryPrice;
  let recommendedTP2 = entryPrice;
  let recommendedTP3 = entryPrice;
  let recommendedTP4 = entryPrice;

  if (isBull) {
    recommendedSL = Number((entryPrice - slPipsDistance).toFixed(3));
    recommendedTP1 = Number((entryPrice + 5.0).toFixed(3));
    recommendedTP2 = Number((entryPrice + 10.0).toFixed(3));
    recommendedTP3 = Number((entryPrice + 15.0).toFixed(3));
    recommendedTP4 = Number((entryPrice + 20.0).toFixed(3));
  } else if (isBear) {
    recommendedSL = Number((entryPrice + slPipsDistance).toFixed(3));
    recommendedTP1 = Number((entryPrice - 5.0).toFixed(3));
    recommendedTP2 = Number((entryPrice - 10.0).toFixed(3));
    recommendedTP3 = Number((entryPrice - 15.0).toFixed(3));
    recommendedTP4 = Number((entryPrice - 20.0).toFixed(3));
  }

  const signalType: "BUY" | "SELL" | "HOLD" = latestBar.bullSignal
    ? "BUY"
    : latestBar.bearSignal
    ? "SELL"
    : isBull
    ? "BUY"
    : isBear
    ? "SELL"
    : "HOLD";

  return {
    bars,
    latestBar,
    currentTrend: currentTrendEnum,
    currentFilter: latestBar.filter,
    currentUpper: latestBar.upper,
    currentLower: latestBar.lower,
    currentAdaptiveRange: latestBar.adaptiveRange,
    isBullSignalNow: latestBar.bullSignal,
    isBearSignalNow: latestBar.bearSignal,
    signalType,
    recommendedEntry: entryPrice,
    recommendedSL,
    recommendedTP1,
    recommendedTP2,
    recommendedTP3,
    recommendedTP4,
    pipsSl: 50,
    pipsTp1: 50,
    pipsTp2: 100,
    pipsTp3: 150,
    pipsTp4: 200,
    riskRewardRatio: "1:2.0",
    stats: {
      totalSignals,
      buySignals,
      sellSignals,
      currentTrendDurationBars,
    },
  };
}

/**
 * Generates raw Pine Script source code for user reference or copy-paste into TradingView
 */
export function getPineScriptCode(config: TrendStateConfig = defaultTSSConfig): string {
  return `//@version=6
strategy("Trend State Strategy", "TSS_Strat", overlay = true, initial_capital = 1000, default_qty_type = strategy.percent_of_equity, default_qty_value = 100)

// INPUTS
groupCalc   = "Calculation"
groupVisual = "Visuals"

src_type    = input.string("${config.sourceType}", "Source Type", options = ["Close", "HL2", "HLC3", "OHLC4", "OCC3", "HLCC4", "Custom"], group = groupCalc)
src = switch src_type
    "Close"  => close
    "HL2"    => (high + low) / 2
    "HLC3"   => (high + low + close) / 3
    "OHLC4"  => (open + high + low + close) / 4
    "HLCC4"  => (high + low + 2 * close) / 4
    "OCC3"   => (open + 2 * close) / 3
    => (open + 2 * high + 2 * low + 2 * close) / 7

length        = input.int(${config.length}, "Sensitivity Length", minval = 1, group = groupCalc)
multiplier    = input.float(${config.multiplier}, "Range Multiplier", minval = 0.1, step = 0.025, group = groupCalc)
offset        = input.float(${config.offset}, "Offset", minval = 0.5, step = 0.025, group = groupCalc)
sigma         = input.float(${config.sigma}, "Sigma", minval = 1, step = 0.025, group = groupCalc)
confirmClose  = input.bool(${config.confirmClose}, "Confirm Signals On Bar Close", group = groupCalc)

bullColor     = input.color(${config.bullColor}, "Bullish Color", group = groupVisual)
bearColor     = input.color(${config.bearColor}, "Bearish Color", group = groupVisual)
showGlow      = input.bool(${config.showGlow}, "Show Line Glow", group = groupVisual)
showRibbon    = input.bool(${config.showRibbon}, "Show Gradient Ribbon", group = groupVisual)
showLabels    = input.bool(${config.showLabels}, "Show Bullish/Bearish Labels", group = groupVisual)
labelDist     = input.float(${config.labelDist}, "Label Vertical Distance", minval = 0, maxval = 5, step = 0.1, group = groupVisual)
paintCandles  = input.bool(${config.paintCandles}, "Color Candles", group = groupVisual)

// ADAPTIVE RANGE
movement      = math.abs(ta.change(src))
smoothMove    = ta.alma(movement, length, offset, sigma)
adaptiveRange = smoothMove * multiplier

// STEP FILTER
var float filter = na
prevFilter       = nz(filter[1], src)

upper = prevFilter + adaptiveRange
lower = prevFilter - adaptiveRange

filter := (src > upper ? src - adaptiveRange :
          src < lower ? src + adaptiveRange :
          prevFilter)

// TREND STATE
var int trend = 0
trend := filter > filter[1] ? 1 :
         filter < filter[1] ? -1 :
         nz(trend[1], 0)

bull = trend == 1
bear = trend == -1

trendColor = bull ? bullColor : bear ? bearColor : color.gray

bullSignal = confirmClose ? (trend[1] == 1 and nz(trend[2]) != 1) : (bull and nz(trend[1]) != 1)
bearSignal = confirmClose ? (trend[1] == -1 and nz(trend[2]) != -1) : (bear and nz(trend[1]) != -1)

// STRATEGY LOGIC (Wejście Long na BUY, wyjście na SELL)
if bullSignal
    strategy.entry("Long", strategy.long)

if bearSignal
    strategy.close("Long")

// VISUALIZATION
plot(showGlow ? filter : na, "Trend Line Glow", color.new(trendColor, 82), 7)

filterPlot = plot(filter, "Trend State Line", trendColor, 3)
pricePlot  = plot(hl2, "Price Midpoint", display = display.none)

ribbonColor = showRibbon ? color.new(trendColor, 20) : na

fill(filterPlot, pricePlot, hl2, filter, na, ribbonColor, title = "Trend State Ribbon")

bullPos = confirmClose ? filter[1] - adaptiveRange[1] * labelDist : filter - adaptiveRange * labelDist
bearPos = confirmClose ? filter[1] + adaptiveRange[1] * labelDist : filter + adaptiveRange * labelDist

// SIGNAL LABELS
plotshape(showLabels and bullSignal ? bullPos : na,
          "Bullish Signal", shape.labelup, location.absolute,
          bullColor, text = "BUY", textcolor = color.white, size = size.tiny, offset = confirmClose ? -1 : 0)

plotshape(showLabels and bearSignal ? bearPos : na,
          "Bearish Signal", shape.labeldown, location.absolute,
          bearColor, text = "SELL", textcolor = color.white, size = size.tiny, offset = confirmClose ? -1 : 0)

barcolor(paintCandles ? trendColor : na, title = "Trend Candles")`;
}
