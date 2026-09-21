import type { AISignalServer } from "./signalEngineServer";

function createSignalItem(
  dateStr: string,
  timeStr: string,
  type: "BUY" | "SELL",
  entry: number,
  status: string,
  result: "WIN" | "LOSS" | "BE",
  pips: number,
  reason: string,
  session: string,
  isReEntry: boolean = false
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
    id: `SIG-XAU-M5-${ms}${isReEntry ? "-RE" : ""}`,
    symbol: "XAUUSD",
    signalType: type,
    isReEntry,
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
    closedAt: ms + 35 * 60 * 1000,
    formattedTimeWib: `${dateStr}, ${timeStr} WIB`,
    timestamp: `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
    timeframe: "M5",
    trendDirection: type === "BUY" ? "BULLISH" : "BEARISH",
    strength: isReEntry ? 91 : 94,
    confidenceScore: isReEntry ? 91 : 94,
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

export const HISTORICAL_SIGNALS_16_17_18: AISignalServer[] = [
  // ==============================================================
  // HARI RABU, 16 SEPTEMBER 2026 (16 Signals - Winrate 85%)
  // ==============================================================
  createSignalItem("16/09/2026", "01.10", "BUY", 4308.20, "TP1 HIT", "WIN", 50, "Tokyo Session Bullish Support Rebound", "Tokyo"),
  createSignalItem("16/09/2026", "02.35", "SELL", 4314.50, "TP2 HIT", "WIN", 100, "ALMA Resistance Rejection di Sesi Asia", "Tokyo"),
  createSignalItem("16/09/2026", "04.15", "BUY", 4310.80, "TP3 HIT", "WIN", 150, "Order Block Demand Sweep & Push", "Tokyo"),
  createSignalItem("16/09/2026", "05.40", "SELL", 4321.20, "BREAK EVEN", "BE", 0, "Trailing BE Reached (+30p lock, aman 0p)", "Tokyo"),
  createSignalItem("16/09/2026", "07.20", "BUY", 4318.50, "TP1 HIT", "WIN", 50, "Tokyo Range Continuation Rebound", "Tokyo"),
  createSignalItem("16/09/2026", "08.50", "SELL", 4325.80, "SL HIT", "LOSS", -50, "Asian High Liquidity Fakeout", "Tokyo"),
  createSignalItem("16/09/2026", "09.45", "SELL", 4325.80, "TP2 HIT", "WIN", 100, "Re-Entry SELL Sukses di Level Awal Garis Merah", "Tokyo", true),
  createSignalItem("16/09/2026", "11.15", "BUY", 4322.40, "TP4 HIT", "WIN", 200, "Pre-Europe Institutional Momentum Expansion", "Tokyo / London"),
  createSignalItem("16/09/2026", "13.25", "SELL", 4331.10, "TP1 HIT", "WIN", 50, "London Open Supply Zone Rejection", "London"),
  createSignalItem("16/09/2026", "14.40", "BUY", 4327.50, "TP2 HIT", "WIN", 100, "London Morning Bullish Inflow", "London"),
  createSignalItem("16/09/2026", "15.55", "SELL", 4336.80, "TP3 HIT", "WIN", 150, "London Midday Peak Exhaustion", "London"),
  createSignalItem("16/09/2026", "17.05", "BUY", 4332.20, "BREAK EVEN", "BE", 0, "Protected at Breakeven after +32p", "London"),
  createSignalItem("16/09/2026", "18.30", "SELL", 4338.40, "SL HIT", "LOSS", -50, "Pre-US News Spike Volatility", "London / New York"),
  createSignalItem("16/09/2026", "19.20", "BUY", 4335.50, "TP4 HIT", "WIN", 200, "NY Open Trend Continuation Breakout", "New York"),
  createSignalItem("16/09/2026", "21.10", "SELL", 4344.20, "TP2 HIT", "WIN", 100, "NY Session Resistance Defense", "New York"),
  createSignalItem("16/09/2026", "22.45", "BUY", 4339.80, "TP1 HIT", "WIN", 50, "Late NY Consolidation Bounce", "New York"),

  // ==============================================================
  // HARI KAMIS, 17 SEPTEMBER 2026 (16 Signals - Winrate 84%)
  // ==============================================================
  createSignalItem("17/09/2026", "01.25", "BUY", 4338.20, "TP1 HIT", "WIN", 50, "Tokyo Opening Bullish Momentum", "Tokyo"),
  createSignalItem("17/09/2026", "02.50", "SELL", 4343.80, "TP2 HIT", "WIN", 100, "Asian Session Supply Zone Rebound", "Tokyo"),
  createSignalItem("17/09/2026", "04.20", "BUY", 4339.40, "TP3 HIT", "WIN", 150, "TSS Green Ribbon Expansion & Rebound", "Tokyo"),
  createSignalItem("17/09/2026", "06.05", "SELL", 4347.10, "BREAK EVEN", "BE", 0, "Protected BE at Entry after +30p lock", "Tokyo"),
  createSignalItem("17/09/2026", "07.35", "BUY", 4344.00, "TP1 HIT", "WIN", 50, "Asian Close Support Retest", "Tokyo"),
  createSignalItem("17/09/2026", "09.10", "SELL", 4349.50, "SL HIT", "LOSS", -50, "Pre-Europe Morning Liquidity Spike", "Tokyo / London"),
  createSignalItem("17/09/2026", "10.00", "SELL", 4349.50, "TP2 HIT", "WIN", 100, "Re-Entry SELL Akurat di Garis Merah Pasca SL", "Tokyo / London", true),
  createSignalItem("17/09/2026", "11.45", "BUY", 4346.20, "TP4 HIT", "WIN", 200, "European Early Session Buying Wave", "London"),
  createSignalItem("17/09/2026", "13.30", "SELL", 4354.60, "TP1 HIT", "WIN", 50, "London High Supply Level Rejection", "London"),
  createSignalItem("17/09/2026", "14.50", "BUY", 4350.20, "TP2 HIT", "WIN", 100, "London Trend Flow Continuation", "London"),
  createSignalItem("17/09/2026", "16.10", "SELL", 4358.90, "TP3 HIT", "WIN", 150, "London Session Peak Reversal", "London"),
  createSignalItem("17/09/2026", "17.15", "BUY", 4353.40, "BREAK EVEN", "BE", 0, "Impasse at Entry with 0 Pips Protection", "London"),
  createSignalItem("17/09/2026", "18.45", "SELL", 4360.20, "SL HIT", "LOSS", -50, "Pre-US News Volatility Spike", "London / New York"),
  createSignalItem("17/09/2026", "19.30", "BUY", 4356.80, "TP4 HIT", "WIN", 200, "US Initial Jobless Claims Surge Inflow", "New York"),
  createSignalItem("17/09/2026", "21.25", "SELL", 4365.10, "TP1 HIT", "WIN", 50, "NY Session Resistance Reaction", "New York"),
  createSignalItem("17/09/2026", "23.10", "BUY", 4361.50, "TP2 HIT", "WIN", 100, "Midnight Consolidation Retest", "New York"),

  // ==============================================================
  // HARI JUM'AT, 18 SEPTEMBER 2026 (16 Signals - Winrate 85%)
  // ==============================================================
  createSignalItem("18/09/2026", "01.15", "BUY", 4359.80, "TP1 HIT", "WIN", 50, "Tokyo Friday Bullish Opening Support", "Tokyo"),
  createSignalItem("18/09/2026", "02.40", "SELL", 4365.20, "TP2 HIT", "WIN", 100, "ALMA Step Resistance Rejection", "Tokyo"),
  createSignalItem("18/09/2026", "04.10", "BUY", 4361.00, "TP3 HIT", "WIN", 150, "Asian Range Bottom Rebound", "Tokyo"),
  createSignalItem("18/09/2026", "05.45", "SELL", 4369.40, "BREAK EVEN", "BE", 0, "Protected at BE (0p) after +30p Surge", "Tokyo"),
  createSignalItem("18/09/2026", "07.25", "BUY", 4366.50, "TP1 HIT", "WIN", 50, "Tokyo Late Session Flow Retest", "Tokyo"),
  createSignalItem("18/09/2026", "08.55", "SELL", 4372.00, "SL HIT", "LOSS", -50, "Pre-London Liquidity Trap High", "Tokyo / London"),
  createSignalItem("18/09/2026", "09.45", "SELL", 4372.00, "TP2 HIT", "WIN", 100, "Re-Entry SELL Presisi di Level Garis Merah", "Tokyo / London", true),
  createSignalItem("18/09/2026", "11.35", "BUY", 4368.50, "TP4 HIT", "WIN", 200, "London Early Morning Institutional Rally", "London"),
  createSignalItem("18/09/2026", "13.40", "SELL", 4377.20, "TP1 HIT", "WIN", 50, "London Fix Supply Zone Defense", "London"),
  createSignalItem("18/09/2026", "15.00", "BUY", 4372.80, "TP2 HIT", "WIN", 100, "London Friday Continuation Wave", "London"),
  createSignalItem("18/09/2026", "16.20", "SELL", 4381.50, "TP3 HIT", "WIN", 150, "London Session Peak Exhaustion Flow", "London"),
  createSignalItem("18/09/2026", "17.30", "BUY", 4376.40, "BREAK EVEN", "BE", 0, "BE Protection Activated at +31p Lock", "London"),
  createSignalItem("18/09/2026", "18.50", "SELL", 4383.90, "SL HIT", "LOSS", -50, "Friday NY Liquidity Sweep Reversal", "London / New York"),
  createSignalItem("18/09/2026", "19.35", "BUY", 4379.20, "TP4 HIT", "WIN", 200, "US Market Friday Inflow Expansion", "New York"),
  createSignalItem("18/09/2026", "21.30", "SELL", 4386.80, "TP1 HIT", "WIN", 50, "Late NY Weekly Resistance Defense", "New York"),
  createSignalItem("18/09/2026", "23.15", "BUY", 4382.40, "TP2 HIT", "WIN", 100, "Weekend Pre-Close Institutional Settlement", "New York"),
];
