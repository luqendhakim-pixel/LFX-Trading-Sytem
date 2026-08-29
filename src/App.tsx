import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { MobileNotificationHub } from "./components/MobileNotificationHub";
import { SignalAlertToast, SignalToastItem } from "./components/SignalAlertToast";
import { AuthModal } from "./components/AuthModal";
import { SubscriptionPaywallModal } from "./components/SubscriptionPaywallModal";
import { AdminPanelModal } from "./components/AdminPanelModal";
import { authService } from "./services/authService";
import { UserProfile } from "./types";
import { getTradingSessionName } from "./utils/sessionHelper";

// Realistic historical signals with diverse market zones and accurate outcomes
const INITIAL_SIGNALS: AISignal[] = [
  {
    id: "SIG-XAU-01",
    symbol: "XAUUSD",
    signalType: "BUY",
    entryPrice: 4500.50,
    stopLoss: 4495.50,
    takeProfit1: 4505.50,
    takeProfit2: 4510.50,
    takeProfit3: 4515.50,
    takeProfit4: 4520.50,
    signalStatus: "ACTIVE",
    status: "ACTIVE",
    riskRewardRatio: "1 : 2.0",
    session: getTradingSessionName(),
    entryZoneLow: 4499.50,
    entryZoneHigh: 4501.50,
    formattedTimeWib: "2026-08-28 14:10:15 WIB",
    timestamp: "14:10",
    timeframe: "H1",
    trendDirection: "BULLISH",
    strength: 92,
    confidenceScore: 92,
    primaryReason: "TradingView TSS v6: ALMA Step Filter Bullish Breakout & Demand Order Block",
    technicalFactors: ["ALMA Step Filter Support", "RSI 58 Golden Zone", "EMA 20/50 Bullish Cross"],
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
    formattedTimeWib: "2026-08-28 12:30:00 WIB",
    timestamp: "12:30",
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
    formattedTimeWib: "2026-08-28 10:15:20 WIB",
    timestamp: "10:15",
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
    formattedTimeWib: "2026-08-28 05:20:00 WIB",
    timestamp: "05:20",
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
      estimatedProfitTp1: 50.0,
      estimatedProfitTp2: 100.0,
      estimatedProfitTp3: 150.0,
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
    signalStatus: "TP1 HIT",
    status: "COMPLETED",
    realizedPips: 50,
    closeResult: "WIN",
    riskRewardRatio: "1 : 1.0",
    session: "Sydney",
    entryZoneLow: 4464.00,
    entryZoneHigh: 4466.50,
    formattedTimeWib: "2026-08-28 02:40:00 WIB",
    timestamp: "02:40",
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
      estimatedProfitTp1: 50.0,
      estimatedProfitTp2: 100.0,
      estimatedProfitTp3: 150.0,
    },
  },
];

// Generate initial realistic OHLC gold candles
function generateInitialGoldCandles(count: number = 80, basePrice: number = 4589.5): Candle[] {
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

export default function App() {
  const lastNotifiedSignalKeyRef = useRef<string>("");
  const lastSignalNotifiedTimestampRef = useRef<number>(0);
  const notifiedHitKeysRef = useRef<Set<string>>(new Set());

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
  const [signalToasts, setSignalToasts] = useState<SignalToastItem[]>([]);
  const [pushNotificationEnabled, setPushNotificationEnabled] = useState(
    () => typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted"
  );

  // 3. Signals & Market Data
  const [signalsList, setSignalsList] = useState<AISignal[]>(INITIAL_SIGNALS);
  const [currentSignal, setCurrentSignal] = useState<AISignal | null>(INITIAL_SIGNALS[0]);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [candles, setCandles] = useState<Candle[]>(() => generateInitialGoldCandles(80, 4500.5));
  const [timeframe, setTimeframe] = useState<Timeframe>("H1");
  const [streamStats, setStreamStats] = useState<StreamStats>(() => realtimeMarketManager.getStats());
  const [currentTick, setCurrentTick] = useState<Tick>(() => realtimeMarketManager.getLatestTick());

  // Dynamic candle fetcher from live server market feed
  const fetchRealCandles = useCallback(async (tf: Timeframe) => {
    try {
      const res = await fetch(`/api/market/gold/candles?timeframe=${tf}&count=80`);
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

  // 7. Trigger AI & TradingView Strategy Scan (Preserves Active Signal Real-time Lifecycle)
  const triggerAiScan = useCallback(
    async (targetTimeframe?: Timeframe, targetCandles?: Candle[], forceNotify: boolean = false) => {
      setIsAiScanning(true);
      const activeTf = targetTimeframe || timeframeRef.current;
      const activeCandles = targetCandles || candlesRef.current;
      const tick = currentTickRef.current;
      const settings = riskSettingsRef.current;

      try {
        if (!forceNotify) {
          const existingActiveSignal = signalsListRef.current.find(
            (s) =>
              (s.signalStatus === "ACTIVE" || s.signalStatus === "BE SET (+30p)" || s.signalStatus === "TP1 HIT" || s.signalStatus === "TP2 HIT" || s.signalStatus === "TP3 HIT") &&
              s.status === "ACTIVE"
          );

          if (existingActiveSignal) {
            setCurrentSignal(existingActiveSignal);
            return;
          }
        }

        const instantSignal = generateInstantSignal(activeCandles, tick, activeTf, settings);
        setCurrentSignal(instantSignal);

        const setupZoneBucket = Math.round(instantSignal.entryPrice / 2.5) * 2.5;
        const signalKey = `${instantSignal.signalType}_${activeTf}_${setupZoneBucket.toFixed(1)}_${Math.round(instantSignal.stopLoss)}`;
        const isActionable = instantSignal.signalType.includes("BUY") || instantSignal.signalType.includes("SELL");

        const now = Date.now();
        const cooldownMs = 30000; // 30s responsive cooldown
        const isCooldownElapsed = now - lastSignalNotifiedTimestampRef.current > cooldownMs;
        const isNewSetup = lastNotifiedSignalKeyRef.current !== signalKey;

        if (isActionable && (forceNotify || (isNewSetup && isCooldownElapsed) || signalsListRef.current.length === 0)) {
          lastNotifiedSignalKeyRef.current = signalKey;
          lastSignalNotifiedTimestampRef.current = now;

          notificationService.playSignalSound();
          notificationService.sendSignalNotification(instantSignal);

          const newToast: SignalToastItem = {
            id: `toast-${Date.now()}`,
            signal: instantSignal,
            timeframe: activeTf,
            createdAt: Date.now(),
            durationMs: 14000,
            alertType: "NEW_SIGNAL",
            customTitle: `🚨 ${instantSignal.signalType.replace("_", " ")} ${instantSignal.symbol || "XAUUSD"}`,
            customBody: `Sinyal Entry Live di $${instantSignal.entryPrice.toFixed(2)} • SL ${instantSignal.pipsSl || 50}p • TP1 +${instantSignal.pipsTp1 || 50}p`,
          };
          setSignalToasts((prev) => [newToast, ...prev.slice(0, 1)]);
        }

        // When a new signal arrives, close all previous active signals (replaced by new signal)
        setSignalsList((prevList) => {
          const updatedPrevList = prevList
            .filter((s) => s.id !== instantSignal.id)
            .map((s) => {
              if (s.status === "ACTIVE") {
                return {
                  ...s,
                  status: "COMPLETED" as const,
                  signalStatus: (s.signalStatus && s.signalStatus.includes("TP") ? s.signalStatus : "CLOSED") as any,
                };
              }
              return s;
            });
          return [instantSignal, ...updatedPrevList.slice(0, 24)];
        });
      } catch (err) {
        console.error("AI scan error:", err);
      } finally {
        setIsAiScanning(false);
      }
    },
    []
  );

  // Real-time Target (TP1/TP2/TP3/TP4), Stop Loss & Break Even Engine (+30 Pips automated protection)
  const checkSignalHitsAgainstLivePrice = useCallback((liveTick: Tick) => {
    const livePrice = liveTick.price;
    if (!livePrice || livePrice <= 0) return;

    const currentSig = currentSignalRef.current;
    if (!currentSig) return;
    if (currentSig.status === "COMPLETED") return;

    const isBuy = currentSig.signalType.includes("BUY");
    const isSell = currentSig.signalType.includes("SELL");
    if (!isBuy && !isSell) return;

    const entry = currentSig.entryPrice;
    const initialSl = currentSig.stopLoss;
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
      if (!notifiedHitKeysRef.current.has(beKey)) {
        notifiedHitKeysRef.current.add(beKey);

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

        const beToast: SignalToastItem = {
          id: `toast-be-trig-${Date.now()}`,
          signal: updatedWithBe,
          timeframe: currentSig.timeframe || "H1",
          createdAt: Date.now(),
          durationMs: 14000,
          alertType: "BE_TRIGGERED",
          customTitle: `🛡️ PASANG BE (BREAK EVEN) +30 PIPS`,
          customBody: `XAU/USD sudah running +${Math.round(runningPips)} pips di $${livePrice.toFixed(2)}. SL otomatis dipindah ke Entry ($${entry.toFixed(2)})!`,
          pips: Math.round(runningPips),
        };
        setSignalToasts((prev) => [beToast, ...prev.slice(0, 1)]);

        setSignalsList((prevList) =>
          prevList.map((s) => (s.id === currentSig.id ? updatedWithBe : s))
        );
        setSelectedSignal((prevSel) =>
          prevSel && prevSel.id === currentSig.id ? updatedWithBe : prevSel
        );
        return;
      }
    }

    // 2. Target Check: TP1, TP2, TP3, TP4, SL, or BE Hit
    let targetHit: "TP1" | "TP2" | "TP3" | "TP4" | "SL" | "BE" | null = null;
    let pips = 0;
    let closeResult: "WIN" | "LOSS" | "BE" = "WIN";

    if (isBuy) {
      if (livePrice >= tp4) {
        targetHit = "TP4";
        pips = currentSig.pipsTp4 || 200;
        closeResult = "WIN";
      } else if (livePrice >= tp3 && currentSig.signalStatus !== "TP3 HIT" && currentSig.signalStatus !== "TP4 HIT") {
        targetHit = "TP3";
        pips = currentSig.pipsTp3 || 150;
        closeResult = "WIN";
      } else if (livePrice >= tp2 && currentSig.signalStatus !== "TP2 HIT" && currentSig.signalStatus !== "TP3 HIT" && currentSig.signalStatus !== "TP4 HIT") {
        targetHit = "TP2";
        pips = currentSig.pipsTp2 || 100;
        closeResult = "WIN";
      } else if (livePrice >= tp1 && currentSig.signalStatus === "ACTIVE" || (runningPips >= 50 && currentSig.signalStatus === "BE SET (+30p)")) {
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
      if (livePrice <= tp4) {
        targetHit = "TP4";
        pips = currentSig.pipsTp4 || 200;
        closeResult = "WIN";
      } else if (livePrice <= tp3 && currentSig.signalStatus !== "TP3 HIT" && currentSig.signalStatus !== "TP4 HIT") {
        targetHit = "TP3";
        pips = currentSig.pipsTp3 || 150;
        closeResult = "WIN";
      } else if (livePrice <= tp2 && currentSig.signalStatus !== "TP2 HIT" && currentSig.signalStatus !== "TP3 HIT" && currentSig.signalStatus !== "TP4 HIT") {
        targetHit = "TP2";
        pips = currentSig.pipsTp2 || 100;
        closeResult = "WIN";
      } else if ((livePrice <= tp1 && currentSig.signalStatus === "ACTIVE") || (runningPips >= 50 && currentSig.signalStatus === "BE SET (+30p)")) {
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
      if (!notifiedHitKeysRef.current.has(hitKey)) {
        notifiedHitKeysRef.current.add(hitKey);

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

        // IMPORTANT: Status CLOSED is ONLY triggered when SL is hit, BE is hit, or when a new signal arrives!
        // TP1, TP2, TP3, and TP4 remain RUNNING with Break Even protection.
        const isCompleted = targetHit === "SL" || targetHit === "BE";
        const updatedSignal: AISignal = {
          ...currentSig,
          signalStatus: newSignalStatus,
          status: isCompleted ? "COMPLETED" : "ACTIVE",
          isBreakevenSet: true, // After any TP hit or BE trigger, SL is locked at BE
          effectiveStopLoss: entry,
          realizedPips: pips,
          closeResult,
        };

        setCurrentSignal(updatedSignal);

        // Trigger Push & Audio Sound Chime
        notificationService.sendTargetHitNotification(
          targetHit,
          currentSig,
          livePrice,
          Math.abs(pips)
        );

        // Trigger In-App Floating Toast Alert
        const hitToast: SignalToastItem = {
          id: `toast-hit-${Date.now()}`,
          signal: updatedSignal,
          timeframe: currentSig.timeframe || "H1",
          createdAt: Date.now(),
          durationMs: 14000,
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
        setSignalToasts((prev) => [hitToast, ...prev.slice(0, 1)]);

        // Update signalsList for the active item
        setSignalsList((prevList) =>
          prevList.map((s) => (s.id === currentSig.id ? updatedSignal : s))
        );

        // Update selectedSignal if open in details
        setSelectedSignal((prevSel) =>
          prevSel && prevSel.id === currentSig.id ? updatedSignal : prevSel
        );
      }
    }
  }, []);

  // Initial Load & Live Market Tick Stream Synchronizer
  useEffect(() => {
    realtimeMarketManager.start();

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

    const interval = setInterval(() => {
      triggerAiScan();
    }, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [timeframe, fetchRealCandles, triggerAiScan, checkSignalHitsAgainstLivePrice]);

  // Handlers for Modals
  const handleOpenLotSimulation = (sig?: AISignal) => {
    setActiveSignalForModal(sig || selectedSignal || currentSignal || INITIAL_SIGNALS[0]);
    setIsLotSimModalOpen(true);
  };

  const handleOpenShareSignal = (sig?: AISignal) => {
    setActiveSignalForModal(sig || selectedSignal || currentSignal || INITIAL_SIGNALS[0]);
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
      <main className="flex-1 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        {/* VIEW 1: BERANDA (Home Dashboard matching screenshot 4) */}
        {activeNavTab === "BERANDA" && (
          <HomeDashboardView
            onOpenNotifications={() => setIsNotifHubOpen(true)}
            onOpenSettings={() => setIsExnessModalOpen(true)}
            onNavigateToTab={(tab) => {
              setSelectedSignal(null);
              setActiveNavTab(tab);
            }}
            onSelectSignal={handleSelectSignalForDetail}
            signalsList={signalsList}
            currentSignal={currentSignal}
            onOpenEducationModal={() => setIsEducationModalOpen(true)}
            onOpenContestModal={() => setIsContestModalOpen(true)}
            onRequestPushNotification={handleRequestPushNotification}
            pushNotificationEnabled={pushNotificationEnabled}
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
                onSelectSignal={handleSelectSignalForDetail}
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

        {/* VIEW 4: INDIKATOR (TradingView Chart + Gauge + S/R Levels) */}
        {activeNavTab === "INDIKATOR" && (
          <TradingViewIndicatorsView
            timeframe={timeframe}
            onTimeframeChange={(tf) => {
              setTimeframe(tf);
              triggerAiScan(tf, candles);
            }}
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
        signal={activeSignalForModal || currentSignal || INITIAL_SIGNALS[0]}
      />

      {/* MODAL 2: Bagikan Sinyal */}
      <ShareSignalModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        signal={activeSignalForModal || currentSignal || INITIAL_SIGNALS[0]}
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

      {/* Notification Hub Modal */}
      {isNotifHubOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1322] border border-slate-800 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Notifikasi & Riwayat Alert</h3>
              <button
                onClick={() => setIsNotifHubOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2.5">
              {signalsList.map((sig) => (
                <div
                  key={sig.id}
                  onClick={() => {
                    handleSelectSignalForDetail(sig);
                    setIsNotifHubOpen(false);
                  }}
                  className="p-3 bg-slate-900/80 hover:bg-slate-800/80 rounded-2xl border border-slate-800 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${sig.signalType.includes("BUY") ? "text-emerald-400" : "text-rose-400"}`}>
                        {sig.signalType} {sig.symbol}
                      </span>
                      <span className="text-[10px] text-slate-400">{sig.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Entry @{sig.entryPrice} | SL: {sig.stopLoss} | TP1: {sig.takeProfit1}
                    </p>
                  </div>
                  <span className="text-xs text-amber-400 font-bold">Detail →</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
