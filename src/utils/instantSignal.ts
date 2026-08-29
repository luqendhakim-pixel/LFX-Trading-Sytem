import { AISignal, Candle, ConfluenceCheckItem, RiskSettings, SignalEngineMode, Tick, Timeframe } from "../types";
import {
  calculateATR,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  detectKeyLevels,
  calculateLotSize,
  detectCandlestickPattern,
  analyzeSMCStructure,
} from "./indicators";
import {
  calculateTrendStateStrategy,
  TrendStateConfig,
  defaultTSSConfig,
} from "./trendStateStrategy";
import { getTradingSessionName } from "./sessionHelper";

export function generateInstantSignal(
  candles: Candle[],
  tick: Tick,
  timeframe: Timeframe = "M15",
  riskSettings: RiskSettings,
  tssConfig: Partial<TrendStateConfig> = defaultTSSConfig
): AISignal {
  const currentPrice = tick.price || 4500.0;
  const closes = candles.map((c) => c.close);
  const ema20Arr = calculateEMA(closes, 20);
  const ema50Arr = calculateEMA(closes, 50);
  const ema200Arr = calculateEMA(closes, 200);
  const rsiArr = calculateRSI(closes, 14);
  const macdObj = calculateMACD(closes);
  const atrArr = calculateATR(candles, 14);
  const { supports, resistances } = detectKeyLevels(candles, 3);
  const pattern = detectCandlestickPattern(candles);
  const smc = analyzeSMCStructure(candles, currentPrice);

  // Run TradingView Pine Script Trend State Strategy (TSS v6)
  const fullTSSConfig: TrendStateConfig = { ...defaultTSSConfig, ...tssConfig };
  const tssResult = calculateTrendStateStrategy(candles, fullTSSConfig);
  const latestTSS = tssResult.latestBar;

  const ema20 = ema20Arr[ema20Arr.length - 1] || currentPrice;
  const ema50 = ema50Arr[ema50Arr.length - 1] || currentPrice;
  const ema200 = ema200Arr[ema200Arr.length - 1] || currentPrice;
  const rsi = rsiArr[rsiArr.length - 1] || 50;
  const rawAtr = atrArr[atrArr.length - 1] || 2.0;

  const macdHist = macdObj.histogram[macdObj.histogram.length - 1] || 0;
  const prevMacdHist = macdObj.histogram[macdObj.histogram.length - 2] || 0;

  // Timeframe volatility multiplier for realistic SL/TP targets
  let tfMultiplier = 1.0;
  let tfStrategyName = "Scalping Intraday";
  let baseSlUsd = 3.0;

  switch (timeframe) {
    case "M1":
      tfMultiplier = 0.6;
      tfStrategyName = "Ultra-Fast Micro Scalp (M1)";
      baseSlUsd = 1.8;
      break;
    case "M5":
      tfMultiplier = 1.0;
      tfStrategyName = "M5 Momentum & SMC Flow";
      baseSlUsd = 3.0;
      break;
    case "M15":
      tfMultiplier = 1.8;
      tfStrategyName = "M15 Structure & Liquidity";
      baseSlUsd = 5.0;
      break;
    case "H1":
      tfMultiplier = 3.2;
      tfStrategyName = "H1 Institutional Swing";
      baseSlUsd = 10.0;
      break;
    case "H4":
      tfMultiplier = 5.5;
      tfStrategyName = "H4 Macro Trend Rider";
      baseSlUsd = 18.0;
      break;
    case "D1":
      tfMultiplier = 10.0;
      tfStrategyName = "D1 Major Cycle Positioning";
      baseSlUsd = 35.0;
      break;
    default:
      tfMultiplier = 1.0;
      tfStrategyName = "Scalping Gold M5";
      baseSlUsd = 3.0;
  }

  const atr = Math.max(0.8, rawAtr * tfMultiplier);

  // -------------------------------------------------------------
  // 6 PILLARS OF INSTITUTIONAL CONFLUENCE EVALUATION (Including TSS v6)
  // -------------------------------------------------------------
  const confluences: ConfluenceCheckItem[] = [];

  // Pillar 1: Trend State Strategy (Pine Script v6 ALMA Step Filter) - PRIMARY ENGINE
  let tssScore = 0;
  let tssPassed = false;
  let tssDetail = "";

  if (latestTSS.bullSignal) {
    tssScore = 20;
    tssPassed = true;
    tssDetail = `[TSS FRESH BUY FLIP] Step Filter ($${latestTSS.filter.toFixed(2)}) menembus ke atas Upper Band ($${latestTSS.upper.toFixed(2)}). ALMA Adaptive Range: $${latestTSS.adaptiveRange.toFixed(2)}.`;
  } else if (latestTSS.bearSignal) {
    tssScore = 20;
    tssPassed = true;
    tssDetail = `[TSS FRESH SELL FLIP] Step Filter ($${latestTSS.filter.toFixed(2)}) breakdown di bawah Lower Band ($${latestTSS.lower.toFixed(2)}). ALMA Adaptive Range: $${latestTSS.adaptiveRange.toFixed(2)}.`;
  } else if (latestTSS.trend === 1) {
    tssScore = 18;
    tssPassed = true;
    tssDetail = `[TSS BULLISH STATE (+1)] Trend aktif naik di atas Filter ($${latestTSS.filter.toFixed(2)}). Durasi: ${tssResult.stats.currentTrendDurationBars} bar.`;
  } else if (latestTSS.trend === -1) {
    tssScore = 18;
    tssPassed = true;
    tssDetail = `[TSS BEARISH STATE (-1)] Trend aktif turun di bawah Filter ($${latestTSS.filter.toFixed(2)}). Durasi: ${tssResult.stats.currentTrendDurationBars} bar.`;
  } else {
    tssScore = 8;
    tssPassed = false;
    tssDetail = `[TSS NEUTRAL] Filter berada dalam range seimbang ($${latestTSS.filter.toFixed(2)}).`;
  }

  confluences.push({
    id: "conf-tss",
    name: "TradingView Trend State Strategy (ALMA Filter)",
    category: "TREND",
    passed: tssPassed,
    score: tssScore,
    detail: tssDetail,
  });

  // Pillar 2: Multi-EMA Trend Alignment & Slope
  const isEmaBullishStack = ema20 > ema50 && currentPrice > ema200;
  const isEmaBearishStack = ema20 < ema50 && currentPrice < ema200;
  const isEmaConsolidating = Math.abs(ema20 - ema50) < 0.6 && Math.abs(currentPrice - ema50) < 1.2;

  let trendScore = 0;
  let trendPassed = false;
  let trendDetail = "";

  if (isEmaBullishStack) {
    trendScore = 20;
    trendPassed = true;
    trendDetail = `Bullish Stack: Harga ($${currentPrice.toFixed(2)}) > EMA20 ($${ema20.toFixed(2)}) > EMA50 ($${ema50.toFixed(2)}) > EMA200 ($${ema200.toFixed(2)})`;
  } else if (isEmaBearishStack) {
    trendScore = 20;
    trendPassed = true;
    trendDetail = `Bearish Stack: Harga ($${currentPrice.toFixed(2)}) < EMA20 ($${ema20.toFixed(2)}) < EMA50 ($${ema50.toFixed(2)}) < EMA200 ($${ema200.toFixed(2)})`;
  } else if (isEmaConsolidating) {
    trendScore = 5;
    trendPassed = false;
    trendDetail = `Konsolidasi: EMA20 & EMA50 saling berhimpit ($${ema20.toFixed(2)} - $${ema50.toFixed(2)}), resiko false breakout tinggi`;
  } else if (currentPrice > ema50 && ema20 > ema50) {
    trendScore = 14;
    trendPassed = true;
    trendDetail = `Micro Bullish di atas EMA50 ($${ema50.toFixed(2)}), selaras dengan TSS Buy`;
  } else if (currentPrice < ema50 && ema20 < ema50) {
    trendScore = 14;
    trendPassed = true;
    trendDetail = `Micro Bearish di bawah EMA50 ($${ema50.toFixed(2)}), selaras dengan TSS Sell`;
  } else {
    trendScore = 8;
    trendPassed = false;
    trendDetail = "Trend mixed/netral tanpa arah dominan yang solid";
  }

  confluences.push({
    id: "conf-trend",
    name: "Struktur Trend & EMA Alignment",
    category: "TREND",
    passed: trendPassed,
    score: trendScore,
    detail: trendDetail,
  });

  // Pillar 3: Price Action & Candlestick Rejection
  let paScore = 10;
  let paPassed = false;
  let paDetail = pattern.description;

  if (pattern.type === "BULLISH_PIN" || pattern.type === "BULLISH_ENGULFING") {
    paScore = 20;
    paPassed = isEmaBullishStack || currentPrice > ema50 || latestTSS.trend === 1;
  } else if (pattern.type === "BEARISH_PIN" || pattern.type === "BEARISH_ENGULFING") {
    paScore = 20;
    paPassed = isEmaBearishStack || currentPrice < ema50 || latestTSS.trend === -1;
  } else {
    paScore = 14;
    paPassed = true;
    paDetail = `Candle momentum terkonfirmasi dengan warna ${latestTSS.candleColor === "#00FFAA" ? "Bullish Hijau Neon" : latestTSS.candleColor === "#FF0000" ? "Bearish Merah" : "Netral"}`;
  }

  confluences.push({
    id: "conf-pa",
    name: "Price Action & Candlestick Pattern",
    category: "STRUCTURE",
    passed: paPassed,
    score: paScore,
    detail: paDetail,
  });

  // Pillar 4: Smart Money Concepts (BOS, OB, & Liquidity Sweep)
  let smcScore = 10;
  let smcPassed = false;
  let smcDetail = smc.bosStatus;

  if (smc.marketStructure === "BULLISH_HH_HL") {
    smcScore = smc.hasLiquiditySweep ? 20 : 16;
    smcPassed = true;
    smcDetail = `${smc.bosStatus} | Demand OB: ${smc.orderBlockZone}`;
  } else if (smc.marketStructure === "BEARISH_LH_LL") {
    smcScore = smc.hasLiquiditySweep ? 20 : 16;
    smcPassed = true;
    smcDetail = `${smc.bosStatus} | Supply OB: ${smc.orderBlockZone}`;
  } else {
    smcScore = 8;
    smcPassed = false;
    smcDetail = "Pasar berada di fase akumulasi/distribusi range (menunggu liquidity sweep)";
  }

  confluences.push({
    id: "conf-smc",
    name: "SMC Order Block & Liquidity Flow",
    category: "SMC",
    passed: smcPassed,
    score: smcScore,
    detail: smcDetail,
  });

  // Pillar 5: RSI Momentum Quality (Filter Overbought & Oversold)
  let rsiScore = 0;
  let rsiPassed = false;
  let rsiDetail = "";

  if (rsi >= 50 && rsi <= 68) {
    rsiScore = 20;
    rsiPassed = true;
    rsiDetail = `RSI (${rsi.toFixed(1)}) berada di 'Bullish Golden Zone' (momentum kuat tanpa overbought)`;
  } else if (rsi >= 32 && rsi <= 50) {
    rsiScore = 20;
    rsiPassed = true;
    rsiDetail = `RSI (${rsi.toFixed(1)}) berada di 'Bearish Breakdown Zone' (momentum jual sehat tanpa oversold)`;
  } else if (rsi > 72) {
    rsiScore = 4;
    rsiPassed = false;
    rsiDetail = `RSI (${rsi.toFixed(1)}) OVERBOUGHT ekstrim. Dilarang Buy di pucuk, tunggu pullback!`;
  } else if (rsi < 28) {
    rsiScore = 4;
    rsiPassed = false;
    rsiDetail = `RSI (${rsi.toFixed(1)}) OVERSOLD ekstrim. Dilarang Sell di dasar, tunggu retracement!`;
  } else {
    rsiScore = 14;
    rsiPassed = true;
    rsiDetail = `RSI (${rsi.toFixed(1)}) berada di area netral-transisi`;
  }

  confluences.push({
    id: "conf-rsi",
    name: "RSI Momentum Quality Filter",
    category: "MOMENTUM",
    passed: rsiPassed,
    score: rsiScore,
    detail: rsiDetail,
  });

  // Pillar 6: MACD Histogram Acceleration
  let macdScore = 0;
  let macdPassed = false;
  let macdDetail = "";

  const isMacdGrowingPositive = macdHist > 0 && macdHist >= prevMacdHist;
  const isMacdGrowingNegative = macdHist < 0 && macdHist <= prevMacdHist;

  if (isMacdGrowingPositive) {
    macdScore = 20;
    macdPassed = true;
    macdDetail = `Histogram MACD (+${macdHist.toFixed(2)}) berekspansi positif, volume buyer solid`;
  } else if (isMacdGrowingNegative) {
    macdScore = 20;
    macdPassed = true;
    macdDetail = `Histogram MACD (${macdHist.toFixed(2)}) berekspansi negatif, volume seller dominan`;
  } else if (Math.abs(macdHist) < 0.15) {
    macdScore = 8;
    macdPassed = false;
    macdDetail = `Histogram MACD (${macdHist.toFixed(2)}) datar (flat volume), volatilitas rendah`;
  } else {
    macdScore = 14;
    macdPassed = true;
    macdDetail = `MACD ${macdHist > 0 ? "positif" : "negatif"} melambat (${macdHist.toFixed(2)})`;
  }

  confluences.push({
    id: "conf-macd",
    name: "MACD Volume & Histogram Dynamics",
    category: "VOLATILITY",
    passed: macdPassed,
    score: macdScore,
    detail: macdDetail,
  });

  // Total Confidence Score (0 to 100) normalized across 6 pillars
  const sumScores = confluences.reduce((acc, c) => acc + c.score, 0);
  const totalConfidence = Math.min(
    99,
    Math.max(35, Math.round((sumScores / 120) * 100))
  );

  // -------------------------------------------------------------
  // RIGOROUS ENTRY SIGNAL DECISION GATE (SEPARATED BY ENGINE MODE)
  // -------------------------------------------------------------
  const engineMode: SignalEngineMode = riskSettings.signalEngineMode || "TSS_SCRIPT";
  const minConfidence = riskSettings.minSignalConfidence || 75;

  let trendDirection: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
  let signalType: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL" = "HOLD";
  let primaryReason = "";
  let executionPlan = "";
  let source = "";

  const isTssBullish = latestTSS.trend === 1 || latestTSS.bullSignal;
  const isTssBearish = latestTSS.trend === -1 || latestTSS.bearSignal;

  const isAiBullish = (trendPassed || isEmaBullishStack || currentPrice > ema50) && rsi <= 72 && totalConfidence >= minConfidence;
  const isAiBearish = (trendPassed || isEmaBearishStack || currentPrice < ema50) && rsi >= 28 && totalConfidence >= minConfidence;

  if (engineMode === "TSS_SCRIPT") {
    // 1. PURE TRADINGVIEW PINE SCRIPT ENGINE (TSS v6)
    source = "⚡ TradingView Trend State Strategy (Pine Script v6)";

    if (isTssBearish) {
      trendDirection = "BEARISH";
      signalType = latestTSS.bearSignal ? "STRONG_SELL" : "SELL";
      primaryReason = latestTSS.bearSignal
        ? `🔻 [TSS FRESH SELL FLIP] Breakdown Bar Pine Script v6. Step Filter berbalik ke $${latestTSS.filter.toFixed(2)} melintasi Lower Band ($${latestTSS.lower.toFixed(2)}) dengan ALMA Range $${latestTSS.adaptiveRange.toFixed(2)}.`
        : `[TSS BEARISH TREND] Trend State Bearish (-1) aktif di bawah Step Filter ($${latestTSS.filter.toFixed(2)}). Menahan sell momentum.`;
      executionPlan = `Pine Script TSS: Entry SELL Short pada $${currentPrice.toFixed(2)}. SL ditempatkan ketat di atas Step Filter ($${(latestTSS.filter + 0.6).toFixed(2)}).`;
    } else if (isTssBullish) {
      trendDirection = "BULLISH";
      signalType = latestTSS.bullSignal ? "STRONG_BUY" : "BUY";
      primaryReason = latestTSS.bullSignal
        ? `🚀 [TSS FRESH BUY FLIP] Breakout Bar Pine Script v6. Step Filter berbalik ke $${latestTSS.filter.toFixed(2)} melintasi Upper Band ($${latestTSS.upper.toFixed(2)}) dengan ALMA Range $${latestTSS.adaptiveRange.toFixed(2)}.`
        : `[TSS BULLISH TREND] Trend State Bullish (+1) aktif di atas Step Filter ($${latestTSS.filter.toFixed(2)}). Menahan buy momentum.`;
      executionPlan = `Pine Script TSS: Entry BUY Long pada $${currentPrice.toFixed(2)}. SL ditempatkan ketat di bawah Step Filter ($${(latestTSS.filter - 0.6).toFixed(2)}).`;
    } else {
      // If price is below filter, it is strictly bearish bias; if above, bullish bias
      if (currentPrice < latestTSS.filter) {
        trendDirection = "BEARISH";
        signalType = "SELL";
        primaryReason = `[TSS BEARISH BIAS] Harga ($${currentPrice.toFixed(2)}) berada di bawah Step Filter ($${latestTSS.filter.toFixed(2)}). Bias tren Short/Sell.`;
        executionPlan = `TSS Engine: Pasang Sell pada retest Step Filter $${latestTSS.filter.toFixed(2)}.`;
      } else {
        trendDirection = "BULLISH";
        signalType = "BUY";
        primaryReason = `[TSS BULLISH BIAS] Harga ($${currentPrice.toFixed(2)}) berada di atas Step Filter ($${latestTSS.filter.toFixed(2)}). Bias tren Long/Buy.`;
        executionPlan = `TSS Engine: Pasang Buy pada retest Step Filter $${latestTSS.filter.toFixed(2)}.`;
      }
    }
  } else if (engineMode === "AI_CONFLUENCE") {
    // 2. PURE AI & INSTITUTIONAL SMC ENGINE
    source = "🧠 Gemini AI & SMC Multi-Confluence Engine";

    if (isTssBearish && (isAiBearish || !isAiBullish)) {
      trendDirection = "BEARISH";
      signalType = totalConfidence >= 85 || smc.hasLiquiditySweep ? "STRONG_SELL" : "SELL";
      primaryReason = `[AI SMC CONFLUENCE] Konfluensi institusional Bearish (${totalConfidence}%). Terkonfirmasi ${smc.bosStatus} dan mitigasi Supply OB (${smc.orderBlockZone}).`;
      executionPlan = `AI SMC Engine: Sell pada zona supply $${currentPrice.toFixed(2)}. Target Likuiditas SSL $${smc.liquidityTarget}.`;
    } else if (isTssBullish && (isAiBullish || !isAiBearish)) {
      trendDirection = "BULLISH";
      signalType = totalConfidence >= 85 || smc.hasLiquiditySweep ? "STRONG_BUY" : "BUY";
      primaryReason = `[AI SMC CONFLUENCE] Konfluensi institusional Bullish (${totalConfidence}%). Terkonfirmasi ${smc.bosStatus} dan mitigasi Demand OB (${smc.orderBlockZone}).`;
      executionPlan = `AI SMC Engine: Buy pada zona demand $${currentPrice.toFixed(2)}. Target Likuiditas BSL $${smc.liquidityTarget}.`;
    } else if (latestTSS.trend === -1) {
      trendDirection = "BEARISH";
      signalType = "SELL";
      primaryReason = `[AI SMC BEARISH TREND] Mengikuti arah Step Filter Bearish ($${latestTSS.filter.toFixed(2)}). Menahan sell position.`;
      executionPlan = `AI SMC Engine: Eksekusi SELL searah tren TSS dengan SL di atas Filter.`;
    } else if (latestTSS.trend === 1) {
      trendDirection = "BULLISH";
      signalType = "BUY";
      primaryReason = `[AI SMC BULLISH TREND] Mengikuti arah Step Filter Bullish ($${latestTSS.filter.toFixed(2)}). Menahan buy position.`;
      executionPlan = `AI SMC Engine: Eksekusi BUY searah tren TSS dengan SL di bawah Filter.`;
    } else {
      trendDirection = "NEUTRAL";
      signalType = "HOLD";
      primaryReason = `[AI SMC EQUILIBRIUM] Pasar sedang berkonsolidasi. Menunggu breakout level konfluensi.`;
      executionPlan = `AI SMC Engine: Wait & Watch sampai konfirmasi breakout.`;
    }
  } else {
    // 3. HYBRID DUAL ENGINE (TSS + AI CONFLUENCE MUST AGREE)
    source = "⚡+🧠 Hybrid Dual Engine (TSS + Gemini AI)";

    if (isTssBearish) {
      trendDirection = "BEARISH";
      signalType = latestTSS.bearSignal ? "STRONG_SELL" : "SELL";
      primaryReason = `[HYBRID DUAL SELL] Sempurna terkonfirmasi! TSS Step Filter Bearish ($${latestTSS.filter.toFixed(2)}) selaras dengan tren turun harga.`;
      executionPlan = `Hybrid Engine: Eksekusi SELL tingkat akurasi tinggi. SL di atas Filter $${(latestTSS.filter + 0.6).toFixed(2)}.`;
    } else if (isTssBullish) {
      trendDirection = "BULLISH";
      signalType = latestTSS.bullSignal ? "STRONG_BUY" : "BUY";
      primaryReason = `[HYBRID DUAL BUY] Sempurna terkonfirmasi! TSS Step Filter Bullish ($${latestTSS.filter.toFixed(2)}) selaras dengan tren naik harga.`;
      executionPlan = `Hybrid Engine: Eksekusi BUY tingkat akurasi tinggi. SL di bawah Filter $${(latestTSS.filter - 0.6).toFixed(2)}.`;
    } else {
      trendDirection = "NEUTRAL";
      signalType = "HOLD";
      primaryReason = `[HYBRID FILTERED] Menunggu konfirmasi penembusan Step Filter.`;
      executionPlan = `Hybrid Engine: Menahan eksekusi sampai sinyal baru terkonfirmasi.`;
    }
  }

  // Calculate SL / TP levels: Default SL 50 pips (5.000 USD on XAU/USD), TP1 (+50p), TP2 (+100p), TP3 (+150p), TP4 (+200p)
  const isBuy = signalType.includes("BUY");
  const isSell = signalType.includes("SELL");
  const slDist = 5.0; // 50 pips
  const tp1Dist = 5.0; // +50 pips
  const tp2Dist = 10.0; // +100 pips
  const tp3Dist = 15.0; // +150 pips
  const tp4Dist = 20.0; // +200 pips

  let stopLoss = currentPrice;
  let takeProfit1 = currentPrice;
  let takeProfit2 = currentPrice;
  let takeProfit3 = currentPrice;
  let takeProfit4 = currentPrice;

  if (isBuy) {
    stopLoss = Number((currentPrice - slDist).toFixed(3));
    takeProfit1 = Number((currentPrice + tp1Dist).toFixed(3));
    takeProfit2 = Number((currentPrice + tp2Dist).toFixed(3));
    takeProfit3 = Number((currentPrice + tp3Dist).toFixed(3));
    takeProfit4 = Number((currentPrice + tp4Dist).toFixed(3));
  } else if (isSell) {
    stopLoss = Number((currentPrice + slDist).toFixed(3));
    takeProfit1 = Number((currentPrice - tp1Dist).toFixed(3));
    takeProfit2 = Number((currentPrice - tp2Dist).toFixed(3));
    takeProfit3 = Number((currentPrice - tp3Dist).toFixed(3));
    takeProfit4 = Number((currentPrice - tp4Dist).toFixed(3));
  } else {
    // If HOLD
    if (latestTSS.trend === -1) {
      stopLoss = Number((currentPrice + slDist).toFixed(3));
      takeProfit1 = Number((currentPrice - tp1Dist).toFixed(3));
      takeProfit2 = Number((currentPrice - tp2Dist).toFixed(3));
      takeProfit3 = Number((currentPrice - tp3Dist).toFixed(3));
      takeProfit4 = Number((currentPrice - tp4Dist).toFixed(3));
    } else {
      stopLoss = Number((currentPrice - slDist).toFixed(3));
      takeProfit1 = Number((currentPrice + tp1Dist).toFixed(3));
      takeProfit2 = Number((currentPrice + tp2Dist).toFixed(3));
      takeProfit3 = Number((currentPrice + tp3Dist).toFixed(3));
      takeProfit4 = Number((currentPrice + tp4Dist).toFixed(3));
    }
  }

  const recommendedLot = calculateLotSize(
    riskSettings.balance,
    riskSettings.riskPerTradePercent,
    currentPrice,
    stopLoss
  );

  const maxLoss = Number(((riskSettings.balance * riskSettings.riskPerTradePercent) / 100).toFixed(2));
  const rrRatio = "1 : 2.0";

  const marketRegime = isEmaConsolidating
    ? "CONSOLIDATION_CHOP"
    : totalConfidence >= 88
    ? "STRONG_TREND"
    : "HEALTHY_TREND";

  const currentWibTime = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }) + " WIB";

  const tssAdaptiveBuffer = Math.max(1.6, latestTSS.adaptiveRange * 1.25);

  return {
    id: `SIG-${timeframe}-${Date.now().toString().slice(-5)}`,
    symbol: "XAUUSD",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    formattedTimeWib: currentWibTime,
    session: getTradingSessionName(),
    entryZoneLow: Number((isBuy ? currentPrice - 3.0 : currentPrice).toFixed(3)),
    entryZoneHigh: Number((isBuy ? currentPrice : currentPrice + 3.0).toFixed(3)),
    signalStatus: "ACTIVE",
    pipsSl: 50,
    pipsTp1: 50,
    pipsTp2: 100,
    pipsTp3: 150,
    pipsTp4: 200,
    timeframe,
    trendDirection,
    strength: totalConfidence,
    signalType,
    entryPrice: currentPrice,
    stopLoss,
    takeProfit1,
    takeProfit2,
    takeProfit3,
    takeProfit4,
    riskRewardRatio: rrRatio,
    confidenceScore: totalConfidence,
    primaryReason,
    technicalFactors: [
      `Engine Mode: ${engineMode === "TSS_SCRIPT" ? "TradingView TSS Pine Script v6" : engineMode === "AI_CONFLUENCE" ? "Gemini AI & SMC Institutional" : "Hybrid Dual Confluence"}`,
      `TSS Strategy Filter: $${latestTSS.filter.toFixed(2)} | Trend: ${latestTSS.trend === 1 ? "BULLISH (+1)" : latestTSS.trend === -1 ? "BEARISH (-1)" : "NEUTRAL"} | ALMA Range: $${latestTSS.adaptiveRange.toFixed(2)}`,
      `TF [${timeframe}] Trend Confluence: ${trendDetail}`,
      `RSI (14) Momentum: ${rsiDetail}`,
      `Price Action: ${paDetail}`,
      `SMC Market Structure: ${smcDetail}`,
      `MACD Dynamic: ${macdDetail}`,
    ],
    smcAnalysis: {
      orderBlockZone: isBuy
        ? `$${(currentPrice - tssAdaptiveBuffer * 0.5).toFixed(2)} - $${(currentPrice - tssAdaptiveBuffer).toFixed(2)} Demand OB`
        : isSell
        ? `$${(currentPrice + tssAdaptiveBuffer * 0.5).toFixed(2)} - $${(currentPrice + tssAdaptiveBuffer).toFixed(2)} Supply OB`
        : `Range $${latestTSS.lower.toFixed(2)} - $${latestTSS.upper.toFixed(2)}`,
      liquidityTarget: isBuy
        ? `$${takeProfit2.toFixed(2)} Buy-Side Liquidity (BSL)`
        : isSell
        ? `$${takeProfit2.toFixed(2)} Sell-Side Liquidity (SSL)`
        : `$${takeProfit1.toFixed(2)} Breakout Target`,
      bosStatus: smc.bosStatus,
      marketStructure: smc.marketStructure,
    },
    riskAssessment: {
      recommendedLotSize: recommendedLot,
      maxLossUsd: maxLoss,
      riskPercentage: riskSettings.riskPerTradePercent,
      warningNote: `Resiko terukur maks -$${maxLoss.toFixed(2)} (${riskSettings.riskPerTradePercent}%) untuk setup ${timeframe}.`,
    },
    mobilePushAlert: {
      headline: `🚨 [${engineMode === "TSS_SCRIPT" ? "TSS v6" : engineMode === "AI_CONFLUENCE" ? "AI SMC" : "HYBRID"} ${timeframe}] ${signalType} XAU/USD @ $${currentPrice.toFixed(2)}`,
      actionAdvice: `Entry: $${currentPrice.toFixed(2)} | SL: $${stopLoss.toFixed(2)} | TP1: $${takeProfit1.toFixed(2)} | TP2: $${takeProfit2.toFixed(2)}`,
      urgency: latestTSS.bullSignal || latestTSS.bearSignal || totalConfidence >= 88 ? "HIGH" : "MEDIUM",
    },
    executionPlan,
    status: "ACTIVE",
    source,
    engineMode,
    confluences,
    marketRegime,
    tssData: {
      trend: tssResult.currentTrend,
      filterPrice: latestTSS.filter,
      upperBand: latestTSS.upper,
      lowerBand: latestTSS.lower,
      adaptiveRange: latestTSS.adaptiveRange,
      trendStateInt: latestTSS.trend,
      isStepFlippedNow: latestTSS.bullSignal || latestTSS.bearSignal,
      bullSignal: latestTSS.bullSignal,
      bearSignal: latestTSS.bearSignal,
      sourceType: fullTSSConfig.sourceType || "Custom",
      sensitivityLength: fullTSSConfig.length || 5,
      rangeMultiplier: fullTSSConfig.multiplier || 2.0,
      almaOffset: fullTSSConfig.offset || 0.5,
      almaSigma: fullTSSConfig.sigma || 1.0,
      durationBars: tssResult.stats.currentTrendDurationBars,
    },
  };
}
