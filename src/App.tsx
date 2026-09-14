import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import confetti from "canvas-confetti";
import {
  Candle,
  Tick,
  Position,
  TradeJournalData,
  AISignal,
  Timeframe,
  ExnessAccountConfig,
  RiskSettings,
  MobileNotification,
  SignalEngineMode,
} from "./types";
import {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateATR,
  detectKeyLevels,
  calculateGoldPnL,
  calculateLotSize,
} from "./utils/indicators";
import { generateInstantSignal } from "./utils/instantSignal";
import { generateHistoricalSignalsFromCandles } from "./utils/historicalSignalEngine";
import { soundManager } from "./utils/audio";
import { realtimeMarketManager, StreamStats } from "./services/realtimeMarket";
import { notificationService } from "./utils/notificationService";

// View & Layout Components
import { MobileAppNav, NavTab } from "./components/MobileAppNav";
import { HomeDashboardView } from "./components/HomeDashboardView";
import { SignalsListView } from "./components/SignalsListView";
import { SignalDetailView } from "./components/SignalDetailView";
import { TradingViewIndicatorsView } from "./components/TradingViewIndicatorsView";
import { AIChatView } from "./components/AIChatView";
import { AccountProfileView } from "./components/AccountProfileView";

// Modals
import { LotSimulationModal } from "./components/LotSimulationModal";
import { ShareSignalModal } from "./components/ShareSignalModal";
import { EducationModal } from "./components/EducationModal";
import { ContestModal } from "./components/ContestModal";
import { ExnessAccountModal } from "./components/ExnessAccountModal";
import { SignalNotificationModal } from "./components/SignalNotificationModal";
import {
  buildNotificationsFromSignals,
  getStoredReadNotificationIds,
  saveReadNotificationIds,
  formatWibTime,
} from "./utils/notificationHelper";
import { SignalAlertToast, SignalToastItem } from "./components/SignalAlertToast";
import { AuthModal } from "./components/AuthModal";
import { SubscriptionPaywallModal } from "./components/SubscriptionPaywallModal";
import { AdminPanelModal } from "./components/AdminPanelModal";
import { authService } from "./services/authService";
import { UserProfile } from "./types";
import { getTradingSessionName } from "./utils/sessionHelper";

// Generate initial realistic OHLC gold candles
export function generateInitialGoldCandles(count: number = 80, basePrice: number = 4405.5): Candle[] {
  const candles: Candle[] = [];
  let currentPrice = basePrice;
  const now = Date.now();
  const stepMs = 5 * 60 * 1000;

  for (let i = count; i >= 0; i--) {
    const time = now - i * stepMs;
    const volatility = 1.2 + Math.random() * 1.8;
    const delta = (Math.random() - 0.49) * volatility;
    const open = currentPrice;
    const close = open + delta;
    const high = Math.max(open, close) + Math.random() * volatility * 0.8;
    const low = Math.min(open, close) - Math.random() * volatility * 0.8;
    const volume = Math.floor(100 + Math.random() * 400);

    currentPrice = close;
    candles.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
  }
  return candles;
}

const SIGNALS_STORAGE_KEY = "lfx_tss_historical_signals_v5";

export function generateInitialSignals(): AISignal[] {
  const initialCandles = generateInitialGoldCandles(80, 4405.5);
  const { signalsList } = generateHistoricalSignalsFromCandles(initialCandles, "M5", 4405.5);
  return signalsList;
}

function _unusedLegacySignals(): AISignal[] {
  const now = Date.now();
  const formatWib = (ms: number) => {
    return (
      new Date(ms).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " WIB"
    );
  };

  const formatShortTime = (ms: number) => {
    return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return [
    {
      id: "SIG-XAU-01",
      symbol: "XAUUSD",
      signalType: "SELL",
      entryPrice: 4454.20,
      stopLoss: 4459.20,
      takeProfit1: 4449.20,
      takeProfit2: 4444.20,
      takeProfit3: 4439.20,
      takeProfit4: 4434.20,
      signalStatus: "TP1 HIT",
      status: "COMPLETED",
      realizedPips: 50,
      closeResult: "WIN",
      riskRewardRatio: "1 : 2.0",
      session: getTradingSessionName(),
      entryZoneLow: 4453.00,
      entryZoneHigh: 4455.50,
      createdAt: now - 35 * 60 * 1000,
      closedAt: now - 15 * 60 * 1000,
      formattedTimeWib: formatWib(now - 35 * 60 * 1000),
      timestamp: formatShortTime(now - 35 * 60 * 1000),
      timeframe: "M3",
      trendDirection: "BEARISH",
      strength: 92,
      confidenceScore: 92,
      primaryReason: "TradingView TSS v6: ALMA Step Filter Breakdown & Supply Retest",
      technicalFactors: ["ALMA Step Filter Red", "RSI 44 Pullback", "Step Filter Resistance"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
      riskAssessment: {
        recommendedLotSize: 0.1,
        maxLossUsd: 50.0,
        riskPercentage: 1,
        estimatedProfitTp1: 50.0,
        estimatedProfitTp2: 100.0,
        estimatedProfitTp3: 150.0,
      },
    },
    {
      id: "SIG-XAU-02",
      symbol: "XAUUSD",
      signalType: "BUY",
      entryPrice: 4484.50,
      stopLoss: 4479.50,
      takeProfit1: 4489.50,
      takeProfit2: 4494.50,
      takeProfit3: 4499.50,
      takeProfit4: 4504.50,
      signalStatus: "TP3 HIT",
      status: "COMPLETED",
      realizedPips: 150,
      closeResult: "WIN",
      riskRewardRatio: "1 : 3.0",
      session: "London",
      entryZoneLow: 4483.50,
      entryZoneHigh: 4485.50,
      createdAt: now - 4 * 3600 * 1000,
      closedAt: now - 3 * 3600 * 1000,
      formattedTimeWib: formatWib(now - 4 * 3600 * 1000),
      timestamp: formatShortTime(now - 4 * 3600 * 1000),
      timeframe: "H1",
      trendDirection: "BULLISH",
      strength: 90,
      confidenceScore: 90,
      primaryReason: "London Breakout Impulsive Leg & TSS Bullish Momentum",
      technicalFactors: ["SMC Liquidity Grab", "RSI 65", "ALMA Upward Shift"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
      riskAssessment: {
        recommendedLotSize: 0.1,
        maxLossUsd: 50.0,
        riskPercentage: 1,
        estimatedProfitTp1: 50.0,
        estimatedProfitTp2: 100.0,
        estimatedProfitTp3: 150.0,
      },
    },
    {
      id: "SIG-XAU-03",
      symbol: "XAUUSD",
      signalType: "SELL",
      entryPrice: 4498.80,
      stopLoss: 4503.80,
      takeProfit1: 4493.80,
      takeProfit2: 4488.80,
      takeProfit3: 4483.80,
      takeProfit4: 4478.80,
      signalStatus: "TP2 HIT",
      status: "COMPLETED",
      realizedPips: 100,
      closeResult: "WIN",
      riskRewardRatio: "1 : 2.0",
      session: "Tokyo",
      entryZoneLow: 4497.50,
      entryZoneHigh: 4499.50,
      createdAt: now - 8 * 3600 * 1000,
      closedAt: now - 6 * 3600 * 1000,
      formattedTimeWib: formatWib(now - 8 * 3600 * 1000),
      timestamp: formatShortTime(now - 8 * 3600 * 1000),
      timeframe: "H1",
      trendDirection: "BEARISH",
      strength: 86,
      confidenceScore: 86,
      primaryReason: "Supply Zone Rejection Tokyo High & TSS Step Filter Breakdown",
      technicalFactors: ["Bearish Order Block", "RSI Bearish Div", "Step Filter Red"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
      riskAssessment: {
        recommendedLotSize: 0.1,
        maxLossUsd: 50.0,
        riskPercentage: 1,
        estimatedProfitTp1: 50.0,
        estimatedProfitTp2: 100.0,
        estimatedProfitTp3: 150.0,
      },
    },
    {
      id: "SIG-XAU-04",
      symbol: "XAUUSD",
      signalType: "BUY",
      entryPrice: 4472.10,
      stopLoss: 4467.10,
      takeProfit1: 4477.10,
      takeProfit2: 4482.10,
      takeProfit3: 4487.10,
      takeProfit4: 4492.10,
      signalStatus: "TP1 HIT",
      status: "COMPLETED",
      realizedPips: 50,
      closeResult: "WIN",
      riskRewardRatio: "1 : 1.0",
      session: "Sydney",
      entryZoneLow: 4470.00,
      entryZoneHigh: 4473.00,
      createdAt: now - 28 * 3600 * 1000,
      closedAt: now - 26 * 3600 * 1000,
      formattedTimeWib: formatWib(now - 28 * 3600 * 1000),
      timestamp: formatShortTime(now - 28 * 3600 * 1000),
      timeframe: "H1",
      trendDirection: "BULLISH",
      strength: 88,
      confidenceScore: 88,
      primaryReason: "Weekly Support Rebound & RSI Oversold Reversal",
      technicalFactors: ["Support Retest", "RSI 34 Bounce", "EMA 50 Support"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
      riskAssessment: {
        recommendedLotSize: 0.1,
        maxLossUsd: 50.0,
        riskPercentage: 1,
      },
    },
    {
      id: "SIG-XAU-05",
      symbol: "XAUUSD",
      signalType: "SELL",
      entryPrice: 4465.30,
      stopLoss: 4470.30,
      takeProfit1: 4460.30,
      takeProfit2: 4455.30,
      takeProfit3: 4450.30,
      takeProfit4: 4445.30,
      signalStatus: "SL HIT",
      status: "COMPLETED",
      realizedPips: -50,
      closeResult: "LOSS",
      riskRewardRatio: "1 : 1.0",
      session: "Sydney",
      entryZoneLow: 4464.00,
      entryZoneHigh: 4466.50,
      createdAt: now - 52 * 3600 * 1000,
      closedAt: now - 50 * 3600 * 1000,
      formattedTimeWib: formatWib(now - 52 * 3600 * 1000),
      timestamp: formatShortTime(now - 52 * 3600 * 1000),
      timeframe: "H1",
      trendDirection: "BEARISH",
      strength: 85,
      confidenceScore: 85,
      primaryReason: "Breakdown Asian Low & Bearish Fair Value Gap",
      technicalFactors: ["FVG Fill", "MACD Histogram Negative", "TSS Step Red"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
      riskAssessment: {
        recommendedLotSize: 0.1,
        maxLossUsd: 50.0,
        riskPercentage: 1,
      },
    },
    {
      id: "SIG-XAU-06",
      symbol: "XAUUSD",
      signalType: "BUY",
      entryPrice: 4450.00,
      stopLoss: 4445.00,
      takeProfit1: 4455.00,
      takeProfit2: 4460.00,
      takeProfit3: 4465.00,
      takeProfit4: 4470.00,
      signalStatus: "TP4 HIT",
      status: "COMPLETED",
      realizedPips: 200,
      closeResult: "WIN",
      riskRewardRatio: "1 : 4.0",
      session: "New York",
      entryZoneLow: 4449.00,
      entryZoneHigh: 4451.00,
      createdAt: now - 96 * 3600 * 1000,
      closedAt: now - 90 * 3600 * 1000,
      formattedTimeWib: formatWib(now - 96 * 3600 * 1000),
      timestamp: formatShortTime(now - 96 * 3600 * 1000),
      timeframe: "H1",
      trendDirection: "BULLISH",
      strength: 95,
      confidenceScore: 95,
      primaryReason: "Strong Institutional Bullish Order Block Full Target Run",
      technicalFactors: ["Major Support", "ALMA Golden Slope", "High Volume Breakout"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
      riskAssessment: {
        recommendedLotSize: 0.1,
        maxLossUsd: 50.0,
        riskPercentage: 1,
      },
    },
    {
      id: "SIG-XAU-07",
      symbol: "XAUUSD",
      signalType: "SELL",
      entryPrice: 4488.20,
      stopLoss: 4493.20,
      takeProfit1: 4483.20,
      takeProfit2: 4478.20,
      takeProfit3: 4473.20,
      takeProfit4: 4468.20,
      signalStatus: "BREAK EVEN",
      status: "COMPLETED",
      realizedPips: 0,
      closeResult: "BE",
      riskRewardRatio: "1 : 2.0",
      session: "London",
      entryZoneLow: 4487.00,
      entryZoneHigh: 4489.00,
      createdAt: now - 10 * 24 * 3600 * 1000,
      closedAt: now - 10 * 24 * 3600 * 1000,
      formattedTimeWib: formatWib(now - 10 * 24 * 3600 * 1000),
      timestamp: formatShortTime(now - 10 * 24 * 3600 * 1000),
      timeframe: "H1",
      trendDirection: "BEARISH",
      strength: 84,
      confidenceScore: 84,
      primaryReason: "Price reached +30 pips then reversed to Entry (BE Protected)",
      technicalFactors: ["BE Lock at +30p", "Session Close Reversal"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
      riskAssessment: {
        recommendedLotSize: 0.1,
        maxLossUsd: 50.0,
        riskPercentage: 1,
      },
    },
    {
      id: "SIG-XAU-08",
      symbol: "XAUUSD",
      signalType: "BUY",
      entryPrice: 4435.50,
      stopLoss: 4430.50,
      takeProfit1: 4440.50,
      takeProfit2: 4445.50,
      takeProfit3: 4450.50,
      takeProfit4: 4455.50,
      signalStatus: "TP3 HIT",
      status: "COMPLETED",
      realizedPips: 150,
      closeResult: "WIN",
      riskRewardRatio: "1 : 3.0",
      session: "Tokyo",
      entryZoneLow: 4434.50,
      entryZoneHigh: 4436.50,
      createdAt: now - 18 * 24 * 3600 * 1000,
      closedAt: now - 18 * 24 * 3600 * 1000,
      formattedTimeWib: formatWib(now - 18 * 24 * 3600 * 1000),
      timestamp: formatShortTime(now - 18 * 24 * 3600 * 1000),
      timeframe: "H1",
      trendDirection: "BULLISH",
      strength: 92,
      confidenceScore: 92,
      primaryReason: "Monthly Demand Reversal & TSS Trend Continuation",
      technicalFactors: ["Demand Zone", "ALMA Upward Shift"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
      riskAssessment: {
        recommendedLotSize: 0.1,
        maxLossUsd: 50.0,
        riskPercentage: 1,
      },
    },
  ];
}

const loadStoredSignals = (): AISignal[] => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(SIGNALS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out dummy artifacts
          const valid = parsed.filter(
            (s: AISignal) => s.id !== "SIG-XAU-TV-1788794615693" && s.entryPrice !== 4500
          );
          // Sort descending by createdAt (newest first)
          valid.sort((a: AISignal, b: AISignal) => b.createdAt - a.createdAt);

          // HANYA sinyal pertama (paling baru / index 0) yang boleh aktif
          // Semua sinyal sebelumnya (index >= 1) WAJIB berstatus COMPLETED
          const clean: AISignal[] = valid.map((s: AISignal, index: number) => {
            if (index === 0) {
              return s;
            }
            if (s.status === "ACTIVE") {
              return {
                ...s,
                status: "COMPLETED",
                signalStatus:
                  s.signalStatus === "ACTIVE"
                    ? s.realizedPips && s.realizedPips > 0
                      ? "TP1 HIT"
                      : "BREAK EVEN"
                    : s.signalStatus,
                closeResult:
                  s.closeResult || (s.realizedPips && s.realizedPips > 0 ? "WIN" : "BE"),
              };
            }
            return s;
          });
          return clean.length > 0 ? clean : valid;
        }
      }
    } catch (e) {
      console.warn("Failed to load stored signals:", e);
    }
  }
  const initial = generateInitialSignals();
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SIGNALS_STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {}
  }
  return initial;
};

const INITIAL_POSITIONS: Position[] = [
  {
    id: "POS-XAU-01",
    symbol: "XAU/USD",
    type: "BUY",
    lotSize: 0.1,
    entryPrice: 4410.50,
    currentPrice: 4430.50,
    stopLoss: 4405.50,
    takeProfit: 4415.50,
    takeProfit2: 4420.50,
    takeProfit3: 4425.50,
    status: "CLOSED",
    pnlUsd: 200.0,
    pnlPips: 200,
    openTime: "2026-08-28 14:00 WIB",
    closeTime: "2026-08-28 16:30 WIB",
    strategy: "SMC Gold Strategy",
    reason: "SMC Bullish Order Block + ALMA Golden Slope",
    journal: {
      notes: "Perfect entry saat retest demand zone London session.",
      entryReason: "SMC Order Block + TSS Trend Filter Green",
      emotionalState: "DISCIPLINED",
      executionRating: 5,
      lessonsLearned: "Sabar menunggu pullback ke OB memberikan R:R maksimal 1:4.",
      tags: ["#SMC", "#OrderBlock", "#LondonSession", "#CleanWin"],
      updatedAt: "2026-08-28 16:30 WIB",
    },
  },
  {
    id: "POS-XAU-02",
    symbol: "XAU/USD",
    type: "BUY",
    lotSize: 0.1,
    entryPrice: 4484.50,
    currentPrice: 4499.50,
    stopLoss: 4479.50,
    takeProfit: 4489.50,
    takeProfit2: 4494.50,
    takeProfit3: 4499.50,
    status: "CLOSED",
    pnlUsd: 150.0,
    pnlPips: 150,
    openTime: "2026-08-28 12:30 WIB",
    closeTime: "2026-08-28 14:15 WIB",
    strategy: "SMC Gold Strategy",
    reason: "London Breakout Impulsive Leg & TSS Bullish Momentum",
    journal: {
      notes: "Sinyal breakout terkonfirmasi kuat di M15 dan H1.",
      entryReason: "Liquidity Grab Low Asia + Break of Structure",
      emotionalState: "CONFIDENT",
      executionRating: 5,
      lessonsLearned: "Eksekusi disiplin dengan SL ketat 50 pips terbayar lunas.",
      tags: ["#Breakout", "#LondonOpen", "#SMC"],
      updatedAt: "2026-08-28 14:15 WIB",
    },
  },
  {
    id: "POS-XAU-03",
    symbol: "XAU/USD",
    type: "SELL",
    lotSize: 0.1,
    entryPrice: 4498.80,
    currentPrice: 4488.80,
    stopLoss: 4503.80,
    takeProfit: 4493.80,
    takeProfit2: 4488.80,
    takeProfit3: 4483.80,
    status: "CLOSED",
    pnlUsd: 100.0,
    pnlPips: 100,
    openTime: "2026-08-28 10:15 WIB",
    closeTime: "2026-08-28 11:45 WIB",
    strategy: "SMC Gold Strategy",
    reason: "Supply Zone Rejection Tokyo High & TSS Step Filter Breakdown",
    journal: {
      notes: "Rejection di high sesi Tokyo dengan konfirmasi divergensi RSI.",
      entryReason: "Bearish Order Block & RSI Divergence",
      emotionalState: "PATIENT",
      executionRating: 4,
      lessonsLearned: "Take Profit parsial di TP2 mengamankan +100 pips sebelum London open.",
      tags: ["#SupplyZone", "#TokyoHigh", "#RSI"],
      updatedAt: "2026-08-28 11:45 WIB",
    },
  },
  {
    id: "POS-XAU-04",
    symbol: "XAU/USD",
    type: "BUY",
    lotSize: 0.1,
    entryPrice: 4450.00,
    currentPrice: 4445.00,
    stopLoss: 4445.00,
    takeProfit: 4455.00,
    takeProfit2: 4460.00,
    takeProfit3: 4465.00,
    status: "CLOSED",
    pnlUsd: -50.0,
    pnlPips: -50,
    openTime: "2026-08-27 20:15 WIB",
    closeTime: "2026-08-27 20:22 WIB",
    strategy: "SMC Gold Strategy",
    reason: "High Impact News Volatility Spike Triggered SL",
    journal: {
      notes: "Entry terlalu dekat dengan rilis berita high-impact US Initial Jobless Claims.",
      entryReason: "Mencoba entry sebelum news rilis (FOMO)",
      emotionalState: "FOMO",
      executionRating: 2,
      lessonsLearned: "Wajib patuhi SOP: Berhenti trading 30 menit sebelum dan sesudah Red Folder News!",
      tags: ["#RedFolderNews", "#SLHit", "#DisciplineReview"],
      updatedAt: "2026-08-27 20:25 WIB",
    },
  },
  {
    id: "POS-XAU-05",
    symbol: "XAU/USD",
    type: "SELL",
    lotSize: 0.1,
    entryPrice: 4488.20,
    currentPrice: 4488.20,
    stopLoss: 4493.20,
    takeProfit: 4483.20,
    takeProfit2: 4478.20,
    takeProfit3: 4473.20,
    status: "CLOSED",
    pnlUsd: 0.0,
    pnlPips: 0,
    openTime: "2026-08-26 15:45 WIB",
    closeTime: "2026-08-26 16:30 WIB",
    strategy: "SMC Gold Strategy",
    reason: "Price reached +30 pips then reversed to Entry (BE Protected)",
    journal: {
      notes: "Harga running +30 pips lalu fitur Auto Break Even menggeser SL ke Entry.",
      entryReason: "Break Even Lock at +30 Pips",
      emotionalState: "DISCIPLINED",
      executionRating: 5,
      lessonsLearned: "Fitur BEP menyelamatkan akun dari potensi floating loss.",
      tags: ["#BreakEven", "#ZeroRisk", "#Discipline"],
      updatedAt: "2026-08-26 16:30 WIB",
    },
  },
];

function getInitialNotifiedEventKeys(): Set<string> {
  const set = new Set<string>();
  try {
    const raw = sessionStorage.getItem("lfx_notified_event_keys");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((k) => set.add(k));
      }
    }
  } catch {}
  return set;
}

function persistNotifiedEventKey(key: string, set: Set<string>) {
  set.add(key);
  try {
    const arr = Array.from(set).slice(-300);
    sessionStorage.setItem("lfx_notified_event_keys", JSON.stringify(arr));
  } catch {}
}

export default function App() {
  const isInitialLoadRef = useRef<boolean>(true);
  const notifiedEventKeysRef = useRef<Set<string>>(getInitialNotifiedEventKeys());

  // 1. Navigation & View State
  const [activeNavTab, setActiveNavTab] = useState<NavTab>("BERANDA");
  const [selectedSignal, setSelectedSignal] = useState<AISignal | null>(null);

  // User Auth & Subscription State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPaywallModalOpen, setIsPaywallModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = authService.subscribe((user) => {
      setCurrentUser(user);
    });
    return unsubscribeAuth;
  }, []);

  // 2. Modals State
  const [isLotSimModalOpen, setIsLotSimModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeSignalForModal, setActiveSignalForModal] = useState<AISignal | null>(null);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [isContestModalOpen, setIsContestModalOpen] = useState(false);
  const [isExnessModalOpen, setIsExnessModalOpen] = useState(false);
  const [isNotifHubOpen, setIsNotifHubOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() =>
    getStoredReadNotificationIds()
  );
  const [liveEventNotifications, setLiveEventNotifications] = useState<MobileNotification[]>([]);
  const [signalToasts, setSignalToasts] = useState<SignalToastItem[]>([]);
  const [pushNotificationEnabled, setPushNotificationEnabled] = useState(
    () => typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted"
  );

  // Floating Toast manager: strictly ensures no duplicates and at most 1 active toast on screen
  const pushToastAlert = useCallback((newToast: SignalToastItem) => {
    setSignalToasts((prev) => {
      const hasDuplicate = prev.some(
        (t) =>
          t.alertType === newToast.alertType &&
          (t.signal.id === newToast.signal.id ||
            (t.signal.signalType === newToast.signal.signalType &&
              Math.abs(t.signal.entryPrice - newToast.signal.entryPrice) < 0.2))
      );
      if (hasDuplicate) return prev;
      return [newToast];
    });
  }, []);

  // Centralized new signal notification emitter with strict deduplication
  const notifyNewSignalIfEligible = useCallback(
    (signal: AISignal, activeTf: string) => {
      if (isInitialLoadRef.current) return;
      if (!signal || !signal.signalType) return;
      if (!signal.signalType.includes("BUY") && !signal.signalType.includes("SELL")) return;

      // Do NOT notify as "new signal" if the trade is ALREADY running (BE set, TP1 hit, TP2 hit, etc.)
      if (signal.isBreakevenSet) return;
      if (signal.signalStatus && signal.signalStatus !== "ACTIVE") return;
      if (signal.status && signal.status !== "ACTIVE") return;

      const idKey = `SIG_ENTRY_${signal.id}`;
      const coreKey = `SIG_CORE_${signal.signalType}_${Math.round(signal.entryPrice * 10)}`;

      if (
        notifiedEventKeysRef.current.has(idKey) ||
        notifiedEventKeysRef.current.has(coreKey)
      ) {
        return;
      }

      // Only notify fresh signals created within last 15 minutes
      const ageMs = Date.now() - (signal.createdAt || Date.now());
      if (ageMs > 15 * 60 * 1000) {
        persistNotifiedEventKey(idKey, notifiedEventKeysRef.current);
        persistNotifiedEventKey(coreKey, notifiedEventKeysRef.current);
        return;
      }

      persistNotifiedEventKey(idKey, notifiedEventKeysRef.current);
      persistNotifiedEventKey(coreKey, notifiedEventKeysRef.current);

      notificationService.playSignalSound();
      notificationService.sendSignalNotification(signal);

      // Append to live real-time notification feed
      const entryNotifId = `notif-live-entry-${signal.id}-${Date.now()}`;
      const entryNotif: MobileNotification = {
        id: entryNotifId,
        title: `🚨 SINYAL BARU: ${signal.signalType} ${signal.symbol || "XAUUSD"} [${activeTf || signal.timeframe || "M5"}]`,
        body: `Entry di $${signal.entryPrice.toFixed(2)} • SL $${signal.stopLoss.toFixed(2)} (${signal.pipsSl || 50}p) • TP1 $${signal.takeProfit1.toFixed(2)} (+${signal.pipsTp1 || 50}p)`,
        time: formatWibTime(Date.now()),
        timestampMs: Date.now(),
        type: "SIGNAL",
        params: {
          action: signal.signalType.includes("BUY") ? "BUY" : "SELL",
          entry: signal.entryPrice,
          sl: signal.stopLoss,
          tp: signal.takeProfit1,
          lot: 0.1,
        },
        read: false,
        signalId: signal.id,
      };
      setLiveEventNotifications((prev) => [entryNotif, ...prev]);

      const newToast: SignalToastItem = {
        id: `toast-${Date.now()}`,
        signal,
        timeframe: (activeTf || signal.timeframe || "M5") as Timeframe,
        createdAt: Date.now(),
        durationMs: 8000,
        alertType: "NEW_SIGNAL",
        customTitle: `🚨 SINYAL BARU: ${signal.signalType} ${signal.symbol || "XAUUSD"} [${activeTf || signal.timeframe || "M5"}]`,
        customBody: `Sinyal Entry TradingView Live di $${signal.entryPrice.toFixed(2)} • SL ${signal.pipsSl || 50}p • TP1 +${signal.pipsTp1 || 50}p`,
      };
      pushToastAlert(newToast);
    },
    [pushToastAlert]
  );

  // 3. Signals & Market Data
  const [signalsList, setSignalsList] = useState<AISignal[]>(loadStoredSignals);
  const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);
  const [currentSignal, setCurrentSignal] = useState<AISignal | null>(() => {
    const list = loadStoredSignals();
    // Prioritaskan selalu sinyal teratas (paling baru) dari histori lilin
    return list.length > 0 ? list[0] : null;
  });

  // Synchronized notifications: combines true history of signalsList + real-time live events
  const notifications = useMemo(() => {
    const historyNotifs = buildNotificationsFromSignals(signalsList, readNotificationIds);
    const map = new Map<string, MobileNotification>();
    for (const n of liveEventNotifications) {
      map.set(n.id, {
        ...n,
        read: readNotificationIds.has(n.id),
      });
    }
    for (const n of historyNotifs) {
      if (!map.has(n.id)) {
        map.set(n.id, n);
      }
    }
    const combined = Array.from(map.values());
    combined.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
    return combined;
  }, [signalsList, liveEventNotifications, readNotificationIds]);

  const unreadNotifCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const handleMarkAllNotificationsAsRead = useCallback(() => {
    setReadNotificationIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      saveReadNotificationIds(next);
      return next;
    });
  }, [notifications]);

  const handleClearNotifications = useCallback(() => {
    setReadNotificationIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      saveReadNotificationIds(next);
      return next;
    });
    setLiveEventNotifications([]);
  }, [notifications]);

  // Automatically persist signalsList to localStorage whenever updated
  useEffect(() => {
    if (signalsList && signalsList.length > 0) {
      try {
        localStorage.setItem(SIGNALS_STORAGE_KEY, JSON.stringify(signalsList));
      } catch (e) {
        console.warn("Failed to persist signals:", e);
      }
    }
  }, [signalsList]);

  // Pre-seed already existing signals and milestones so they are never alerted on page load or refresh
  useEffect(() => {
    if (currentSignal) {
      persistNotifiedEventKey(`SIG_ENTRY_${currentSignal.id}`, notifiedEventKeysRef.current);
      persistNotifiedEventKey(`SIG_CORE_${currentSignal.signalType}_${Math.round(currentSignal.entryPrice * 10)}`, notifiedEventKeysRef.current);
      if (currentSignal.isBreakevenSet) {
        persistNotifiedEventKey(`${currentSignal.id}_BE_TRIGGERED`, notifiedEventKeysRef.current);
      }
      if (currentSignal.signalStatus?.includes("TP1")) {
        persistNotifiedEventKey(`${currentSignal.id}_TP1`, notifiedEventKeysRef.current);
      }
      if (currentSignal.signalStatus?.includes("TP2")) {
        persistNotifiedEventKey(`${currentSignal.id}_TP1`, notifiedEventKeysRef.current);
        persistNotifiedEventKey(`${currentSignal.id}_TP2`, notifiedEventKeysRef.current);
      }
      if (currentSignal.signalStatus?.includes("TP3")) {
        persistNotifiedEventKey(`${currentSignal.id}_TP1`, notifiedEventKeysRef.current);
        persistNotifiedEventKey(`${currentSignal.id}_TP2`, notifiedEventKeysRef.current);
        persistNotifiedEventKey(`${currentSignal.id}_TP3`, notifiedEventKeysRef.current);
      }
      if (currentSignal.signalStatus?.includes("TP4")) {
        persistNotifiedEventKey(`${currentSignal.id}_TP1`, notifiedEventKeysRef.current);
        persistNotifiedEventKey(`${currentSignal.id}_TP2`, notifiedEventKeysRef.current);
        persistNotifiedEventKey(`${currentSignal.id}_TP3`, notifiedEventKeysRef.current);
        persistNotifiedEventKey(`${currentSignal.id}_TP4`, notifiedEventKeysRef.current);
      }
    }
    for (const s of signalsList) {
      persistNotifiedEventKey(`SIG_ENTRY_${s.id}`, notifiedEventKeysRef.current);
      persistNotifiedEventKey(`SIG_CORE_${s.signalType}_${Math.round(s.entryPrice * 10)}`, notifiedEventKeysRef.current);
    }
  }, []);

  const handleSaveJournal = (positionId: string, journal: TradeJournalData) => {
    setPositions((prev) =>
      prev.map((p) => (p.id === positionId ? { ...p, journal } : p))
    );
  };
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [candles, setCandles] = useState<Candle[]>(() =>
    generateInitialGoldCandles(80, realtimeMarketManager.getLatestTick().price || 4414.0)
  );
  const [timeframe, setTimeframe] = useState<Timeframe>("M5");
  const [streamStats, setStreamStats] = useState<StreamStats>(() => realtimeMarketManager.getStats());
  const [currentTick, setCurrentTick] = useState<Tick>(() => realtimeMarketManager.getLatestTick());

  // Dynamic candle fetcher from live server market feed
  const fetchRealCandles = useCallback(async (tf: Timeframe) => {
    try {
      const res = await fetch(`/api/market/gold/candles?timeframe=${tf}&count=250`);
      if (res.ok) {
        const json = await res.json();
        if (json.candles && Array.isArray(json.candles) && json.candles.length > 0) {
          setCandles(json.candles);
          return json.candles as Candle[];
        }
      }
    } catch (e) {
      console.warn("Failed to fetch server candles, keeping local state", e);
    }
    return null;
  }, []);

  // 4. Exness Account Config
  const [accountConfig, setAccountConfig] = useState<ExnessAccountConfig>(() => {
    const saved = localStorage.getItem("exness_account_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      loginId: "416259484",
      server: "Exness-MT5Trial14",
      accountType: "TRIAL",
      currency: "USD",
      leverage: "1:2000",
      isConnected: true,
      balance: 10100.0,
      equity: 10132.5,
      floatingPnL: 32.5,
      lastSyncTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  });

  // 5. Risk Settings
  const [riskSettings, setRiskSettings] = useState<RiskSettings>({
    balance: 10100,
    equity: 10132.5,
    marginUsed: 58.56,
    freeMargin: 10073.94,
    marginLevelPercent: 17300,
    riskPerTradePercent: 1,
    maxDailyLossPercent: 5,
    maxOpenTrades: 3,
    autoBreakevenAtTp1: true,
    trailingStopPips: 20,
    enforceMaxSpread: 2.5,
    dailyDrawdownReached: false,
    autoExecuteAI: true,
    soundAlerts: true,
    mobileNotifications: true,
    selectedStrategy: "Scalping Gold M5",
    signalEngineMode: "TSS_SCRIPT",
    minSignalConfidence: 80,
    filterConsolidation: true,
  });

  // Refs to avoid unstable dependencies and infinite re-render loops
  const candlesRef = useRef<Candle[]>(candles);
  candlesRef.current = candles;
  const currentTickRef = useRef<Tick>(currentTick);
  currentTickRef.current = currentTick;
  const timeframeRef = useRef<Timeframe>(timeframe);
  timeframeRef.current = timeframe;
  const riskSettingsRef = useRef<RiskSettings>(riskSettings);
  riskSettingsRef.current = riskSettings;
  const currentSignalRef = useRef<AISignal | null>(currentSignal);
  currentSignalRef.current = currentSignal;
  const signalsListRef = useRef<AISignal[]>(signalsList);
  signalsListRef.current = signalsList;

  // 6. Push Notification Permission Request
  const handleRequestPushNotification = async () => {
    const granted = await notificationService.requestPermission();
    setPushNotificationEnabled(granted);
    if (granted) {
      notificationService.sendMobilePush("🔔 Notifikasi HP Aktif!", {
        body: "Anda akan menerima notifikasi sinyal XAU/USD real-time dengan SL 50 pips dan TP 1/2/3/4 otomatis.",
      });
      notificationService.playSignalSound();
    }
  };

  // Synchronize state with background Node.js Server Signal Engine
  // Ensures signals & winrate calculations persist 24/7 even when phone is locked or app refreshed!
  const syncWithServerState = useCallback(async () => {
    try {
      const res = await fetch("/api/signals/state");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const { currentSignal: serverActive, signalsList: serverList } = json.data;

          if (Array.isArray(serverList) && serverList.length > 0) {
            // Urutkan sinyal server berdasarkan waktu terbaru lebih dulu
            const sortedServerList = [...serverList]
              .filter((s) => s.id !== "SIG-XAU-TV-1788794615693" && s.entryPrice !== 4500)
              .sort((a, b) => b.createdAt - a.createdAt);

            const cleanList: AISignal[] = sortedServerList.map((s, idx) => {
              if (idx === 0) {
                return s as AISignal;
              }
              if (s.status === "ACTIVE") {
                return {
                  ...(s as AISignal),
                  status: "COMPLETED",
                  signalStatus:
                    s.signalStatus === "ACTIVE"
                      ? s.realizedPips && s.realizedPips > 0
                        ? "TP1 HIT"
                        : "BREAK EVEN"
                      : s.signalStatus,
                  closeResult:
                    s.closeResult || (s.realizedPips && s.realizedPips > 0 ? "WIN" : "BE"),
                };
              }
              return s as AISignal;
            });

            setSignalsList((prev) => {
              if (prev.length !== cleanList.length) return cleanList;
              const hasDiff = prev.some((p, i) => {
                const c = cleanList[i];
                return (
                  !c ||
                  p.id !== c.id ||
                  p.signalStatus !== c.signalStatus ||
                  p.status !== c.status ||
                  p.realizedPips !== c.realizedPips ||
                  p.closeResult !== c.closeResult
                );
              });
              return hasDiff ? cleanList : prev;
            });

            const activeSignalToApply =
              cleanList.length > 0
                ? cleanList[0]
                : serverActive && serverActive.entryPrice !== 4500
                ? (serverActive as AISignal)
                : null;

            if (activeSignalToApply) {
              setCurrentSignal((prev) => {
                if (
                  !prev ||
                  prev.id !== activeSignalToApply.id ||
                  prev.signalType !== activeSignalToApply.signalType ||
                  prev.entryPrice !== activeSignalToApply.entryPrice ||
                  prev.signalStatus !== activeSignalToApply.signalStatus ||
                  prev.status !== activeSignalToApply.status ||
                  prev.isBreakevenSet !== activeSignalToApply.isBreakevenSet
                ) {
                  const updatedActive = activeSignalToApply;
                  setSelectedSignal((prevSel) =>
                    prevSel && prevSel.id === updatedActive.id ? updatedActive : prevSel
                  );

                  // Only notify if genuinely a brand new fresh signal and not already running
                  notifyNewSignalIfEligible(updatedActive, updatedActive.timeframe || "M5");

                  return updatedActive;
                }
                return prev;
              });
            }
          }
        }
      }
    } catch (e) {
      // Soft fail, offline resilience fallback
    }
  }, []);

  // 7. Trigger AI & TradingView Strategy Scan (Evaluates Complete Candle History)
  const triggerAiScan = useCallback(
    async (targetTimeframe?: Timeframe, targetCandles?: Candle[], forceNotify: boolean = false) => {
      setIsAiScanning(true);
      const activeTf = targetTimeframe || timeframeRef.current;
      const activeCandles = targetCandles || candlesRef.current;

      // Mencegah perhitungan dummy jika data candle riil belum masuk dari server
      if (!activeCandles || activeCandles.length < 15) {
        syncWithServerState();
        setIsAiScanning(false);
        return;
      }

      const tick = currentTickRef.current;
      const livePrice = tick.price || (activeCandles.length > 0 ? activeCandles[activeCandles.length - 1].close : 4400.0);
      const activeExisting = currentSignalRef.current;

      try {
        const { signalsList: calculatedSignals, currentSignal: calculatedActiveSignal } =
          generateHistoricalSignalsFromCandles(activeCandles, activeTf, livePrice);

        if (calculatedSignals && calculatedSignals.length > 0) {
          setSignalsList(calculatedSignals);
        }

        if (calculatedActiveSignal) {
          // Jangan terima sinyal dengan harga fallback dummy 4500 atau outlier jauh dari harga live
          if (calculatedActiveSignal.entryPrice === 4500 || Math.abs(calculatedActiveSignal.entryPrice - livePrice) > 35.0) {
            console.warn(`[Guard] Mengabaikan sinyal entry outlier $${calculatedActiveSignal.entryPrice} vs live $${livePrice}`);
            setIsAiScanning(false);
            return;
          }

          // Pertahankan progres live trade jika masih sinyal aktif yang sama
          if (
            activeExisting &&
            activeExisting.status === "ACTIVE" &&
            Math.abs(activeExisting.entryPrice - calculatedActiveSignal.entryPrice) < 0.25 &&
            activeExisting.signalType === calculatedActiveSignal.signalType
          ) {
            calculatedActiveSignal.signalStatus = activeExisting.signalStatus || calculatedActiveSignal.signalStatus;
            calculatedActiveSignal.isBreakevenSet = activeExisting.isBreakevenSet || calculatedActiveSignal.isBreakevenSet;
            calculatedActiveSignal.effectiveStopLoss = activeExisting.effectiveStopLoss || calculatedActiveSignal.effectiveStopLoss;
            calculatedActiveSignal.realizedPips = activeExisting.realizedPips ?? calculatedActiveSignal.realizedPips;
            calculatedActiveSignal.closeResult = activeExisting.closeResult ?? calculatedActiveSignal.closeResult;
          }

          setCurrentSignal(calculatedActiveSignal);

          // Synchronize authoritative TradingView signal with background server engine
          fetch("/api/signals/sync-tradingview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              currentSignal: calculatedActiveSignal,
              signalsList: calculatedSignals,
            }),
          }).catch(() => {});

          // Only notify if genuinely fresh, eligible, and not yet alerted
          notifyNewSignalIfEligible(calculatedActiveSignal, activeTf);
        }
      } catch (err) {
        console.error("AI scan error:", err);
      } finally {
        setIsAiScanning(false);
      }
    },
    [syncWithServerState]
  );

  // Timeframe switch handler: fetches candles from server, recalculates history from beginning, updates state
  const handleTimeframeChange = useCallback(
    async (newTf: Timeframe) => {
      setTimeframe(newTf);
      setIsAiScanning(true);
      try {
        const loadedCandles = await fetchRealCandles(newTf);
        const candleSet = loadedCandles && loadedCandles.length > 0 ? loadedCandles : candlesRef.current;
        if (candleSet && candleSet.length > 0) {
          setCandles(candleSet);
          const livePrice = currentTickRef.current.price || candleSet[candleSet.length - 1].close;
          const { signalsList: calculatedSignals, currentSignal: calculatedActiveSignal } =
            generateHistoricalSignalsFromCandles(candleSet, newTf, livePrice);
          if (calculatedSignals && calculatedSignals.length > 0) {
            setSignalsList(calculatedSignals);
          }
          if (calculatedActiveSignal) {
            setCurrentSignal(calculatedActiveSignal);
          }
        }
      } catch (err) {
        console.error("Failed to switch timeframe:", err);
      } finally {
        setIsAiScanning(false);
      }
    },
    [fetchRealCandles]
  );

  // Real-time Target (TP1/TP2/TP3/TP4), Stop Loss & Break Even Engine (+30 Pips automated protection)
  const checkSignalHitsAgainstLivePrice = useCallback((liveTick: Tick) => {
    const livePrice = liveTick.price;
    if (!livePrice || livePrice <= 0) return;

    // GUARD 1: Abaikan tick unverified sebelum stream live riil dari server/pasar tersambung (mencegah ghost hit saat reload/refresh pertama kali)
    if (!liveTick.isVerifiedLive) return;

    const currentSig = currentSignalRef.current;
    if (!currentSig) return;
    if (currentSig.status === "COMPLETED") return;

    const isBuy = currentSig.signalType.includes("BUY");
    const isSell = currentSig.signalType.includes("SELL");
    if (!isBuy && !isSell) return;

    const entry = currentSig.entryPrice;
    const initialSl = currentSig.stopLoss;

    // GUARD 2: Tolak anomali lonjakan ekstrim (misal harga dummy usang 4500 saat entry 4413 = selisih $87 / 870 pips)
    if (Math.abs(livePrice - entry) > 35.0) {
      console.warn(`[Guard] Mengabaikan tick outlier $${livePrice} vs entry $${entry}`);
      return;
    }

    const isBeActive = !!currentSig.isBreakevenSet;
    const effectiveSl = isBeActive ? entry : initialSl;

    const tp1 = currentSig.takeProfit1;
    const tp2 = currentSig.takeProfit2;
    const tp3 = currentSig.takeProfit3;
    const tp4 = currentSig.takeProfit4 || (isBuy ? entry + 20.0 : entry - 20.0);

    // Calculate current running pips
    const runningPips = isBuy ? (livePrice - entry) * 10 : (entry - livePrice) * 10;

    // 1. Check Automatic Break Even Trigger at +30 Pips
    if (runningPips >= 30 && !isBeActive && currentSig.signalStatus === "ACTIVE") {
      const beKey = `${currentSig.id}_BE_TRIGGERED`;
      if (!notifiedEventKeysRef.current.has(beKey)) {
        persistNotifiedEventKey(beKey, notifiedEventKeysRef.current);

        const updatedWithBe: AISignal = {
          ...currentSig,
          isBreakevenSet: true,
          effectiveStopLoss: entry,
          signalStatus: "BE SET (+30p)",
          status: "ACTIVE",
        };

        setCurrentSignal(updatedWithBe);

        // Sound & Notifications
        notificationService.sendBeTriggeredNotification(currentSig, livePrice, Math.round(runningPips));

        const beNotifId = `notif-live-be-trig-${currentSig.id}-${Date.now()}`;
        const beNotif: MobileNotification = {
          id: beNotifId,
          title: `🛡️ KUNCI BE AKTIF: ${currentSig.signalType} XAUUSD (+${Math.round(runningPips)} Pips)`,
          body: `Harga running mencapai $${livePrice.toFixed(2)}. Stop Loss otomatis digeser ke Entry ($${entry.toFixed(2)}) untuk mengunci posisi bebas risiko 0!`,
          time: formatWibTime(Date.now()),
          timestampMs: Date.now(),
          type: "BREAKEVEN",
          params: {
            action: currentSig.signalType.includes("BUY") ? "BUY" : "SELL",
            entry,
            sl: entry,
            tp: currentSig.takeProfit1,
            lot: 0.1,
          },
          read: false,
          signalId: currentSig.id,
          pips: Math.round(runningPips),
        };
        setLiveEventNotifications((prev) => [beNotif, ...prev]);

        const beToast: SignalToastItem = {
          id: `toast-be-trig-${Date.now()}`,
          signal: updatedWithBe,
          timeframe: currentSig.timeframe || "H1",
          createdAt: Date.now(),
          durationMs: 8000,
          alertType: "BE_TRIGGERED",
          customTitle: `🛡️ PASANG BE (BREAK EVEN) +30 PIPS`,
          customBody: `XAU/USD sudah running +${Math.round(runningPips)} pips di $${livePrice.toFixed(2)}. SL otomatis dipindah ke Entry ($${entry.toFixed(2)})!`,
          pips: Math.round(runningPips),
        };
        pushToastAlert(beToast);

        setSignalsList((prevList) =>
          prevList.map((s) => (s.id === currentSig.id ? updatedWithBe : s))
        );
        setSelectedSignal((prevSel) =>
          prevSel && prevSel.id === currentSig.id ? updatedWithBe : prevSel
        );

        // Immediate background sync to server
        fetch("/api/signals/update-signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signal: updatedWithBe }),
        }).catch(() => {});
        return;
      }
    }

    // 2. Target Check: TP1, TP2, TP3, TP4, SL, or BE Hit
    let targetHit: "TP1" | "TP2" | "TP3" | "TP4" | "SL" | "BE" | null = null;
    let pips = 0;
    let closeResult: "WIN" | "LOSS" | "BE" = "WIN";

    if (isBuy) {
      if ((livePrice >= tp4 || runningPips >= 200) && currentSig.signalStatus !== "TP4 HIT") {
        targetHit = "TP4";
        pips = currentSig.pipsTp4 || 200;
        closeResult = "WIN";
      } else if ((livePrice >= tp3 || runningPips >= 150) && currentSig.signalStatus !== "TP3 HIT" && currentSig.signalStatus !== "TP4 HIT") {
        targetHit = "TP3";
        pips = currentSig.pipsTp3 || 150;
        closeResult = "WIN";
      } else if ((livePrice >= tp2 || runningPips >= 100) && currentSig.signalStatus !== "TP2 HIT" && currentSig.signalStatus !== "TP3 HIT" && currentSig.signalStatus !== "TP4 HIT") {
        targetHit = "TP2";
        pips = currentSig.pipsTp2 || 100;
        closeResult = "WIN";
      } else if ((livePrice >= tp1 || runningPips >= 50) && (currentSig.signalStatus === "ACTIVE" || currentSig.signalStatus === "BE SET (+30p)")) {
        targetHit = "TP1";
        pips = currentSig.pipsTp1 || 50;
        closeResult = "WIN";
      } else if (isBeActive && livePrice <= entry) {
        // Price reversed back to Entry after BE was set
        targetHit = "BE";
        pips = 0;
        closeResult = "BE";
      } else if (!isBeActive && livePrice <= initialSl) {
        targetHit = "SL";
        pips = -(currentSig.pipsSl || 50);
        closeResult = "LOSS";
      }
    } else if (isSell) {
      if ((livePrice <= tp4 || runningPips >= 200) && currentSig.signalStatus !== "TP4 HIT") {
        targetHit = "TP4";
        pips = currentSig.pipsTp4 || 200;
        closeResult = "WIN";
      } else if ((livePrice <= tp3 || runningPips >= 150) && currentSig.signalStatus !== "TP3 HIT" && currentSig.signalStatus !== "TP4 HIT") {
        targetHit = "TP3";
        pips = currentSig.pipsTp3 || 150;
        closeResult = "WIN";
      } else if ((livePrice <= tp2 || runningPips >= 100) && currentSig.signalStatus !== "TP2 HIT" && currentSig.signalStatus !== "TP3 HIT" && currentSig.signalStatus !== "TP4 HIT") {
        targetHit = "TP2";
        pips = currentSig.pipsTp2 || 100;
        closeResult = "WIN";
      } else if ((livePrice <= tp1 || runningPips >= 50) && (currentSig.signalStatus === "ACTIVE" || currentSig.signalStatus === "BE SET (+30p)")) {
        targetHit = "TP1";
        pips = currentSig.pipsTp1 || 50;
        closeResult = "WIN";
      } else if (isBeActive && livePrice >= entry) {
        // Price reversed back to Entry after BE was set
        targetHit = "BE";
        pips = 0;
        closeResult = "BE";
      } else if (!isBeActive && livePrice >= initialSl) {
        targetHit = "SL";
        pips = -(currentSig.pipsSl || 50);
        closeResult = "LOSS";
      }
    }

    if (targetHit) {
      const hitKey = `${currentSig.id}_${targetHit}`;
      if (!notifiedEventKeysRef.current.has(hitKey)) {
        persistNotifiedEventKey(hitKey, notifiedEventKeysRef.current);

        const newSignalStatus: AISignal["signalStatus"] =
          targetHit === "TP1"
            ? "TP1 HIT"
            : targetHit === "TP2"
            ? "TP2 HIT"
            : targetHit === "TP3"
            ? "TP3 HIT"
            : targetHit === "TP4"
            ? "TP4 HIT"
            : targetHit === "SL"
            ? "SL HIT"
            : "BREAK EVEN";

        // Status CLOSED is ONLY triggered when SL is hit or BE is hit
        // TP1, TP2, TP3, and TP4 remain running in live position with full profit lock
        const isCompleted = targetHit === "SL" || targetHit === "BE";
        const updatedSignal: AISignal = {
          ...currentSig,
          signalStatus: newSignalStatus,
          status: isCompleted ? "COMPLETED" : "ACTIVE",
          isBreakevenSet: true, // After any TP hit or BE trigger, SL is locked at BE
          effectiveStopLoss: entry,
          realizedPips: pips,
          closeResult,
          closedAt: isCompleted ? Date.now() : currentSig.closedAt,
        };

        setCurrentSignal(updatedSignal);

        // Trigger Push & Audio Sound Chime
        notificationService.sendTargetHitNotification(
          targetHit,
          currentSig,
          livePrice,
          Math.abs(pips)
        );

        // Append to real-time notification hub feed
        const hitNotifId = `notif-live-hit-${currentSig.id}-${targetHit}-${Date.now()}`;
        const hitNotif: MobileNotification = {
          id: hitNotifId,
          title:
            targetHit === "TP1"
              ? `🎯 TP1 HIT (+${pips} PIPS) · TETAP RUNNING`
              : targetHit === "TP2" || targetHit === "TP3"
              ? `🎯 ${targetHit} HIT (+${pips} PIPS) · RUNNING`
              : targetHit === "TP4"
              ? `🏆 TP4 HIT (+${pips} PIPS) · FULL TARGET CLOSED`
              : targetHit === "SL"
              ? `🛑 STOP LOSS HIT (${pips} PIPS)`
              : `⚖️ BREAK EVEN HIT (0 PIPS - BEBAS RISIKO)`,
          body:
            targetHit === "SL"
              ? `XAU/USD ${currentSig.signalType} menyentuh batas SL di $${livePrice.toFixed(2)}. Risiko dibatasi.`
              : targetHit === "BE"
              ? `XAU/USD ${currentSig.signalType} kembali ke harga Entry $${livePrice.toFixed(2)}. Posisi impas aman.`
              : `XAU/USD ${currentSig.signalType} sukses menyentuh $${livePrice.toFixed(2)}. Profit diamankan +${pips} pips.`,
          time: formatWibTime(Date.now()),
          timestampMs: Date.now(),
          type: targetHit === "SL" ? "SL_HIT" : targetHit === "BE" ? "BREAKEVEN" : "TP_HIT",
          params: {
            action: currentSig.signalType.includes("BUY") ? "BUY" : "SELL",
            entry: currentSig.entryPrice,
            sl: currentSig.stopLoss,
            tp: livePrice,
            lot: 0.1,
            pnl: pips * 10,
          },
          read: false,
          signalId: currentSig.id,
          pips,
        };
        setLiveEventNotifications((prev) => [hitNotif, ...prev]);

        // Trigger In-App Floating Toast Alert
        const hitToast: SignalToastItem = {
          id: `toast-hit-${Date.now()}`,
          signal: updatedSignal,
          timeframe: currentSig.timeframe || "H1",
          createdAt: Date.now(),
          durationMs: 8000,
          alertType:
            targetHit === "SL"
              ? "SL_HIT"
              : targetHit === "BE"
              ? "BE_HIT"
              : "TP_HIT",
          customTitle: targetHit === "TP1"
            ? `🎯 TP1 HIT (+${pips} PIPS) · TETAP RUNNING`
            : targetHit === "TP2" || targetHit === "TP3"
            ? `🎯 ${targetHit} HIT (+${pips} PIPS) · RUNNING`
            : targetHit === "TP4"
            ? `🏆 TP4 HIT (+${pips} PIPS) · FULL TARGET CLOSED`
            : targetHit === "SL"
            ? `🛑 STOP LOSS HIT (${pips} PIPS)`
            : `⚖️ BREAK EVEN HIT (0 PIPS - BEBAS RISIKO)`,
          customBody: targetHit === "TP1"
            ? `Amankan profit 50% lot. SL sudah di Entry (BE). Sisa lot tetap jalan menuju TP2/3/4!`
            : `XAU/USD ${currentSig.signalType} mencapai target di $${livePrice.toFixed(2)}`,
          pips,
        };
        pushToastAlert(hitToast);

        // Update signalsList for the active item
        setSignalsList((prevList) =>
          prevList.map((s) => (s.id === currentSig.id ? updatedSignal : s))
        );

        // Update selectedSignal if open in details
        setSelectedSignal((prevSel) =>
          prevSel && prevSel.id === currentSig.id ? updatedSignal : prevSel
        );

        // Immediate background sync to server
        fetch("/api/signals/update-signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signal: updatedSignal }),
        }).catch(() => {});
      }
    }
  }, []);

  // Initial Load & Live Market Tick Stream Synchronizer
  useEffect(() => {
    realtimeMarketManager.start();

    // 1. Immediately synchronize with server background engine on load or phone browser refresh
    syncWithServerState();

    // Release initial load lock after initial sync & market tick initialization
    const initialLoadTimer = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 4000);

    // 2. Auto-register Web Push background notifications if user already granted permission
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      notificationService.registerWebPushSubscription().catch(() => {});
    }

    // Fetch initial candles from server
    fetchRealCandles(timeframe).then((loadedCandles) => {
      if (loadedCandles && loadedCandles.length > 0) {
        triggerAiScan(timeframe, loadedCandles);
      }
    });

    const unsubscribe = realtimeMarketManager.subscribe((liveTick, stats) => {
      setStreamStats(stats);
      setCurrentTick(liveTick);

      // Keep current forming candle dynamically synced with live price
      setCandles((prev) => {
        if (!prev || prev.length === 0) return prev;
        const lastIndex = prev.length - 1;
        const last = prev[lastIndex];
        const updatedLast: Candle = {
          ...last,
          close: liveTick.price,
          high: Math.max(last.high, liveTick.price),
          low: Math.min(last.low, liveTick.price),
        };
        const next = [...prev];
        next[lastIndex] = updatedLast;
        return next;
      });

      checkSignalHitsAgainstLivePrice(liveTick);
    });

    // Frequent light sync with server engine (keeps phone in 100% lock-step with 24/7 background calculations)
    const serverSyncInterval = setInterval(() => {
      syncWithServerState();
    }, 2500);

    const interval = setInterval(() => {
      triggerAiScan();
    }, 60000);

    return () => {
      unsubscribe();
      clearTimeout(initialLoadTimer);
      clearInterval(serverSyncInterval);
      clearInterval(interval);
    };
  }, [timeframe, fetchRealCandles, triggerAiScan, checkSignalHitsAgainstLivePrice, syncWithServerState]);

  // Handlers for Modals
  const handleOpenLotSimulation = (sig?: AISignal) => {
    setActiveSignalForModal(sig || selectedSignal || currentSignal || signalsList[0]);
    setIsLotSimModalOpen(true);
  };

  const handleOpenShareSignal = (sig?: AISignal) => {
    setActiveSignalForModal(sig || selectedSignal || currentSignal || signalsList[0]);
    setIsShareModalOpen(true);
  };

  const handleSelectSignalForDetail = (signal: AISignal) => {
    setSelectedSignal(signal);
    setActiveNavTab("SIGNAL");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div id="trading-app-root" className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950 pb-20 lg:pb-6">
      {/* Floating Toast Notification on Signal Arrival */}
      <SignalAlertToast
        toasts={signalToasts}
        onDismiss={(id) => setSignalToasts((prev) => prev.filter((t) => t.id !== id))}
        onSelectSignal={(sig) => {
          handleSelectSignalForDetail(sig);
        }}
      />

      {/* Main Responsive Views */}
      <main className="flex-1 w-full max-w-full md:max-w-5xl lg:max-w-7xl xl:max-w-[1600px] mx-auto px-2 sm:px-4 md:px-6 lg:px-8 transition-all">
        {/* VIEW 1: BERANDA (Home Dashboard matching screenshot 4) */}
        {activeNavTab === "BERANDA" && (
          <HomeDashboardView
            onOpenNotifications={() => setIsNotifHubOpen(true)}
            onOpenSettings={() => setIsExnessModalOpen(true)}
            unreadNotifCount={unreadNotifCount}
            onNavigateToTab={(tab) => {
              setSelectedSignal(null);
              setActiveNavTab(tab);
            }}
            onSelectSignal={handleSelectSignalForDetail}
            signalsList={signalsList}
            currentSignal={currentSignal}
            currentPrice={currentTick.price}
            candles={candles}
            selectedTimeframe={timeframe}
            onSelectTimeframe={handleTimeframeChange}
            onOpenEducationModal={() => setIsEducationModalOpen(true)}
            onOpenContestModal={() => setIsContestModalOpen(true)}
            onRequestPushNotification={handleRequestPushNotification}
            pushNotificationEnabled={pushNotificationEnabled}
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* VIEW 2: SIGNAL (Signal Detail or List matching screenshots 1, 2, 3, 5) */}
        {activeNavTab === "SIGNAL" && (
          <div>
            {selectedSignal ? (
              <SignalDetailView
                signal={selectedSignal}
                livePrice={currentTick.price}
                onBack={() => setSelectedSignal(null)}
                onOpenLotSimulation={() => handleOpenLotSimulation(selectedSignal)}
                onOpenShareSignal={() => handleOpenShareSignal(selectedSignal)}
                onExecuteTrade={(sig) => {
                  confetti({ particleCount: 50, spread: 60 });
                  notificationService.sendMobilePush("🚀 Order Eksekusi Berhasil", {
                    body: `${sig.signalType} ${sig.symbol} @ ${sig.entryPrice} | SL: 50p | TP: 50p/100p/150p/200p`,
                  });
                }}
              />
            ) : (
              <SignalsListView
                signalsList={signalsList}
                currentPrice={currentTick.price}
                onSelectSignal={handleSelectSignalForDetail}
                onRefreshScan={() => triggerAiScan(timeframe, candles, true)}
                isScanning={isAiScanning}
                isSubscriptionActive={currentUser?.isSubscriptionActive ?? true}
                onOpenPaywall={() => setIsPaywallModalOpen(true)}
              />
            )}
          </div>
        )}

        {/* VIEW 3: CHAT (AI Copilot Chat Assistant) */}
        {activeNavTab === "CHAT" && (
          <AIChatView
            currentPrice={currentTick.price}
            currentSignal={currentSignal}
            onSelectSignal={(sig) => handleSelectSignalForDetail(sig)}
          />
        )}

        {/* VIEW 4: INDIKATOR (TradingView Chart + TSS Pine Script v6 Engine + Gauge + S/R Levels) */}
        {activeNavTab === "INDIKATOR" && (
          <TradingViewIndicatorsView
            timeframe={timeframe}
            onTimeframeChange={handleTimeframeChange}
            candles={candles}
            currentPrice={currentTick.price}
            currentSignal={currentSignal}
            onOpenLotSimulation={() => handleOpenLotSimulation(currentSignal || undefined)}
          />
        )}

        {/* VIEW 5: AKUN (Profile, Settings, Web Push & Audio Test) */}
        {activeNavTab === "AKUN" && (
          <AccountProfileView
            pushNotificationEnabled={pushNotificationEnabled}
            onRequestPushNotification={handleRequestPushNotification}
            onOpenPaywall={() => setIsPaywallModalOpen(true)}
            onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Floating Bottom Navigation Bar */}
      <MobileAppNav
        activeTab={activeNavTab}
        activeSignalsCount={signalsList.filter((s) => s.signalStatus === "ACTIVE").length}
        onTabChange={(tab) => {
          setSelectedSignal(null);
          setActiveNavTab(tab);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* AUTH MODAL: Email & Password / OTP */}
      <AuthModal
        isOpen={isAuthModalOpen || !currentUser}
        onClose={currentUser ? () => setIsAuthModalOpen(false) : undefined}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
        }}
      />

      {/* SUBSCRIPTION PAYWALL MODAL: Rp 150.000 / Bulan */}
      <SubscriptionPaywallModal
        isOpen={isPaywallModalOpen}
        onClose={() => setIsPaywallModalOpen(false)}
        user={currentUser}
        onSuccess={(updatedUser) => {
          setCurrentUser(updatedUser);
          setIsPaywallModalOpen(false);
          confetti({ particleCount: 80, spread: 70 });
        }}
      />

      {/* ADMIN PANEL MODAL: Code Generator & Member Management */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
      />

      {/* MODAL 1: Simulasi Lot & Equity */}
      <LotSimulationModal
        isOpen={isLotSimModalOpen}
        onClose={() => setIsLotSimModalOpen(false)}
        signal={activeSignalForModal || currentSignal || signalsList[0]}
      />

      {/* MODAL 2: Bagikan Sinyal */}
      <ShareSignalModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        signal={activeSignalForModal || currentSignal || signalsList[0]}
      />

      {/* MODAL 3: Materi Edukasi */}
      <EducationModal
        isOpen={isEducationModalOpen}
        onClose={() => setIsEducationModalOpen(false)}
      />

      {/* MODAL 4: Kontes Demo */}
      <ContestModal
        isOpen={isContestModalOpen}
        onClose={() => setIsContestModalOpen(false)}
      />

      {/* MODAL 5: Exness MT5 Account Config */}
      <ExnessAccountModal
        isOpen={isExnessModalOpen}
        onClose={() => setIsExnessModalOpen(false)}
        accountConfig={accountConfig}
        onSaveConfig={(cfg) => {
          setAccountConfig(cfg);
          localStorage.setItem("exness_account_config", JSON.stringify(cfg));
        }}
      />

      {/* Signal Notification & History Alert Modal */}
      <SignalNotificationModal
        isOpen={isNotifHubOpen}
        onClose={() => setIsNotifHubOpen(false)}
        notifications={notifications}
        signalsList={signalsList}
        onSelectSignal={handleSelectSignalForDetail}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onClearNotifications={handleClearNotifications}
        pushNotificationEnabled={pushNotificationEnabled}
        onRequestPushNotification={handleRequestPushNotification}
      />
    </div>
  );
}
