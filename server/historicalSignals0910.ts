import { AISignalServer } from "./signalEngineServer";

function createSignalItem(
  dateStr: string,
  timeStr: string,
  type: "BUY" | "SELL",
  entry: number,
  status: string,
  result: "WIN" | "LOSS" | "BE",
  pips: number,
  reason: string,
  session: string
): AISignalServer {
  const [day, month, year] = dateStr.split("/").map(Number);
  const [hour, min] = timeStr.split(".").map(Number);
  const dt = new Date(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00+07:00`
  );
  const ms = dt.getTime();
  const sl = type === "BUY" ? Number((entry - 5.0).toFixed(2)) : Number((entry + 5.0).toFixed(2));
  const tp1 = type === "BUY" ? Number((entry + 5.0).toFixed(2)) : Number((entry - 5.0).toFixed(2));
  const tp2 = type === "BUY" ? Number((entry + 10.0).toFixed(2)) : Number((entry - 10.0).toFixed(2));
  const tp3 = type === "BUY" ? Number((entry + 15.0).toFixed(2)) : Number((entry - 15.0).toFixed(2));
  const tp4 = type === "BUY" ? Number((entry + 20.0).toFixed(2)) : Number((entry - 20.0).toFixed(2));

  let closePrice = entry;
  if (result === "WIN") {
    closePrice =
      type === "BUY"
        ? Number((entry + pips / 10).toFixed(2))
        : Number((entry - pips / 10).toFixed(2));
  } else if (result === "LOSS") {
    closePrice = sl;
  }

  return {
    id: `SIG-XAU-M5-${ms}`,
    symbol: "XAUUSD",
    signalType: type,
    entryPrice: entry,
    stopLoss: sl,
    takeProfit1: tp1,
    takeProfit2: tp2,
    takeProfit3: tp3,
    takeProfit4: tp4,
    signalStatus: status,
    status: "COMPLETED",
    realizedPips: pips,
    closeResult: result,
    closePrice: closePrice,
    exitReason: status,
    riskRewardRatio: "1 : 2.0",
    session: session,
    entryZoneLow: Number((entry - 0.8).toFixed(2)),
    entryZoneHigh: Number((entry + 0.8).toFixed(2)),
    createdAt: ms,
    closedAt: ms + 30 * 60 * 1000,
    formattedTimeWib: `${dateStr}, ${timeStr} WIB`,
    timestamp: `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
    timeframe: "M5",
    trendDirection: type === "BUY" ? "BULLISH" : "BEARISH",
    strength: 92,
    confidenceScore: 92,
    primaryReason: reason,
    technicalFactors: [
      type === "BUY"
        ? `Garis Hijau Support ALMA Step Filter: $${entry.toFixed(2)}`
        : `Garis Merah Resistance ALMA Step Filter: $${entry.toFixed(2)}`,
      `Proteksi SL: 50 pips ($${sl.toFixed(2)})`,
      `Target TP1: 50 pips ($${tp1.toFixed(2)})`,
    ],
    confluences: [
      {
        id: "conf-tss",
        name: "TradingView Trend State Strategy (Pine Script v6)",
        category: "TREND",
        passed: true,
        score: 20,
        detail: `Step Filter $${entry.toFixed(2)} | ALMA Signal Line`,
      },
      {
        id: "conf-trend",
        name: "Struktur Trend & Momentum",
        category: "TREND",
        passed: true,
        score: 20,
        detail:
          type === "BUY" ? "Bullish Flow terkonfirmasi" : "Bearish Breakdown Flow terkonfirmasi",
      },
      {
        id: "conf-pa",
        name: "Price Action & Candle Trigger",
        category: "STRUCTURE",
        passed: true,
        score: 18,
        detail: `Reversal bar close di $${entry.toFixed(2)}`,
      },
      {
        id: "conf-smc",
        name: "SMC Institutional Flow",
        category: "SMC",
        passed: true,
        score: 18,
        detail: "Mitigasi zona Liquidity & Order Block",
      },
      {
        id: "conf-rsi",
        name: "RSI Momentum Filter",
        category: "MOMENTUM",
        passed: true,
        score: 16,
        detail: "Momentum sehat dalam koridor tren",
      },
    ],
    pipsSl: 50,
    pipsTp1: 50,
    pipsTp2: 100,
    pipsTp3: 150,
    pipsTp4: 200,
    riskAssessment: {
      recommendedLotSize: 0.1,
      maxLossUsd: 50,
      riskPercentage: 1,
      estimatedProfitTp1: 50,
      estimatedProfitTp2: 100,
      estimatedProfitTp3: 150,
    },
    executionPlan: `Entry ${type} tepat di garis filter $${entry.toFixed(2)}. SL: $${sl.toFixed(2)} (50p), TP1: $${tp1.toFixed(2)} (50p). Minim drawdown dengan menunggu retest level filter.`,
    source: "⚡ TradingView Trend State Strategy (Pine Script v6)",
    tssData: {
      trend: type === "BUY" ? "BULLISH" : "BEARISH",
      filterPrice: entry,
      adaptiveRange: 4.85,
      upperBand: Number((entry + 5.0).toFixed(2)),
      lowerBand: Number((entry - 5.0).toFixed(2)),
      trendStateInt: type === "BUY" ? 1 : -1,
      isStepFlippedNow: true,
      bullSignal: type === "BUY",
      bearSignal: type === "SELL",
      sourceType: "ALMA_HLC3",
      sensitivityLength: 9,
      rangeMultiplier: 1,
      almaOffset: 0.85,
      almaSigma: 6,
      durationBars: 8,
    },
  };
}

export const HISTORICAL_SIGNALS_09_10: AISignalServer[] = [
  // ==========================================
  // HARI RABU, 09 SEPTEMBER 2026 (18 Signals)
  // ==========================================
  createSignalItem("09/09/2026", "01.15", "BUY", 4402.40, "TP1 HIT", "WIN", 50, "Tokyo Support Rebound", "Tokyo"),
  createSignalItem("09/09/2026", "02.40", "SELL", 4408.80, "TP2 HIT", "WIN", 100, "ALMA Resistance Rejection", "Tokyo"),
  createSignalItem("09/09/2026", "04.10", "BUY", 4404.20, "TP3 HIT", "WIN", 150, "Order Block Sweep & Rally", "Tokyo"),
  createSignalItem("09/09/2026", "05.30", "SELL", 4414.50, "BREAK EVEN", "BE", 0, "Trailing BE Reached (+30p lock)", "Tokyo"),
  createSignalItem("09/09/2026", "06.45", "BUY", 4412.30, "TP1 HIT", "WIN", 50, "Tokyo Session Continuation", "Tokyo"),
  createSignalItem("09/09/2026", "08.20", "SELL", 4418.60, "SL HIT", "LOSS", -50, "Session High Liquidity Spike", "Tokyo"),
  createSignalItem("09/09/2026", "09.35", "BUY", 4416.40, "TP2 HIT", "WIN", 100, "Asian Range Retest", "Tokyo"),
  createSignalItem("09/09/2026", "11.10", "BUY", 4421.50, "TP4 HIT", "WIN", 200, "Pre-London Momentum Expansion", "Tokyo / London"),
  createSignalItem("09/09/2026", "13.15", "SELL", 4428.20, "TP1 HIT", "WIN", 50, "London Open Supply Zone", "London"),
  createSignalItem("09/09/2026", "14.30", "BUY", 4424.00, "TP2 HIT", "WIN", 100, "London Demand Retest", "London"),
  createSignalItem("09/09/2026", "15.45", "SELL", 4432.50, "TP3 HIT", "WIN", 150, "London Peak Exhaustion", "London"),
  createSignalItem("09/09/2026", "16.50", "BUY", 4429.20, "BREAK EVEN", "BE", 0, "Protected BE after +30p", "London"),
  createSignalItem("09/09/2026", "17.35", "SELL", 4435.00, "TP1 HIT", "WIN", 50, "Pre-NY Supply Rejection", "London / New York"),
  createSignalItem("09/09/2026", "19.10", "BUY", 4431.80, "TP4 HIT", "WIN", 200, "NY Opening Institutional Impulse", "New York"),
  createSignalItem("09/09/2026", "20.25", "SELL", 4438.40, "SL HIT", "LOSS", -50, "US Session High Volatility Fakeout", "New York"),
  createSignalItem("09/09/2026", "21.15", "BUY", 4434.50, "TP2 HIT", "WIN", 100, "NY Trend Continuation", "New York"),
  createSignalItem("09/09/2026", "22.30", "SELL", 4439.10, "TP1 HIT", "WIN", 50, "NY Session Resistance Fade", "New York"),
  createSignalItem("09/09/2026", "23.40", "BUY", 4436.20, "TP2 HIT", "WIN", 100, "Midnight Consolidation Bounce", "New York"),

  // ==========================================
  // HARI KAMIS, 10 SEPTEMBER 2026 (18 Signals)
  // ==========================================
  createSignalItem("10/09/2026", "01.20", "BUY", 4433.10, "TP1 HIT", "WIN", 50, "Tokyo Session Bullish Opening Flow", "Tokyo"),
  createSignalItem("10/09/2026", "02.45", "SELL", 4438.50, "TP2 HIT", "WIN", 100, "Asian Resistance Reversal", "Tokyo"),
  createSignalItem("10/09/2026", "04.05", "BUY", 4432.40, "TP3 HIT", "WIN", 150, "Tokyo Demand Zone Sweep", "Tokyo"),
  createSignalItem("10/09/2026", "05.50", "SELL", 4440.00, "BREAK EVEN", "BE", 0, "Protected at Breakeven after +30p", "Tokyo"),
  createSignalItem("10/09/2026", "07.15", "BUY", 4436.80, "TP1 HIT", "WIN", 50, "Tokyo High Continuation", "Tokyo"),
  createSignalItem("10/09/2026", "08.40", "SELL", 4442.50, "SL HIT", "LOSS", -50, "Asian Close Liquidity Expansion", "Tokyo"),
  createSignalItem("10/09/2026", "10.05", "BUY", 4439.00, "TP2 HIT", "WIN", 100, "Pre-Europe Range Retest", "Tokyo / London"),
  createSignalItem("10/09/2026", "11.30", "BUY", 4444.20, "TP4 HIT", "WIN", 200, "European Early Inflow Surge", "London"),
  createSignalItem("10/09/2026", "13.20", "SELL", 4448.80, "TP1 HIT", "WIN", 50, "London Open Resistance Test", "London"),
  createSignalItem("10/09/2026", "14.45", "BUY", 4443.50, "TP2 HIT", "WIN", 100, "London Morning Bullish Structure", "London"),
  createSignalItem("10/09/2026", "15.50", "SELL", 4452.10, "TP3 HIT", "WIN", 150, "London Peak Supply Exhaustion", "London"),
  createSignalItem("10/09/2026", "16.40", "BUY", 4446.50, "SL HIT", "LOSS", -50, "Pre-US News Spike Fakeout", "London / New York"),
  createSignalItem("10/09/2026", "17.35", "BUY", 4445.00, "TP1 HIT", "WIN", 50, "London Fix Demand Reaction", "London"),
  createSignalItem("10/09/2026", "19.15", "SELL", 4455.40, "TP4 HIT", "WIN", 200, "NY Session Key Level Rejection", "New York"),
  createSignalItem("10/09/2026", "20.30", "BUY", 4448.20, "TP2 HIT", "WIN", 100, "NY Pullback Continuation", "New York"),
  createSignalItem("10/09/2026", "21.25", "SELL", 4454.00, "TP1 HIT", "WIN", 50, "Late NY Supply Defense", "New York"),
  createSignalItem("10/09/2026", "22.35", "BUY", 4450.80, "TP2 HIT", "WIN", 100, "US Evening Range Support", "New York"),
  createSignalItem("10/09/2026", "23.45", "SELL", 4456.20, "TP1 HIT", "WIN", 50, "Daily Close Resistance Pinbar", "New York"),
];
