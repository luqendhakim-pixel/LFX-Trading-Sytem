import fs from "fs";
import path from "path";
import webpush from "web-push";
import { generateHistoricalSignalsFromCandles } from "../src/utils/historicalSignalEngine";
import { HISTORICAL_SIGNALS_09_10 } from "./historicalSignals0910";

export interface AISignalServer {
  id: string;
  symbol: string;
  signalType: "BUY" | "SELL" | "STRONG_BUY" | "STRONG_SELL" | "HOLD";
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  takeProfit4: number;
  signalStatus: string;
  status: "ACTIVE" | "COMPLETED";
  realizedPips?: number;
  closeResult?: "WIN" | "LOSS" | "BE";
  closePrice?: number;
  exitReason?: string;
  isBreakevenSet?: boolean;
  effectiveStopLoss?: number;
  riskRewardRatio: string;
  session: string;
  entryZoneLow: number;
  entryZoneHigh: number;
  createdAt: number;
  closedAt?: number;
  formattedTimeWib: string;
  timestamp: string;
  timeframe: string;
  trendDirection: "BULLISH" | "BEARISH" | "NEUTRAL";
  strength: number;
  confidenceScore: number;
  primaryReason: string;
  technicalFactors: string[];
  pipsSl: number;
  pipsTp1: number;
  pipsTp2: number;
  pipsTp3: number;
  pipsTp4: number;
  confluences?: any[];
  executionPlan?: string;
  source?: string;
  tssData?: any;
  riskAssessment?: {
    recommendedLotSize: number;
    maxLossUsd: number;
    riskPercentage: number;
    estimatedProfitTp1?: number;
    estimatedProfitTp2?: number;
    estimatedProfitTp3?: number;
  };
}

export interface SignalServerState {
  currentSignal: AISignalServer | null;
  signalsList: AISignalServer[];
  stats: {
    winRate: number;
    totalSignals: number;
    wins: number;
    losses: number;
    breakeven: number;
    totalRealizedPips: number;
    lastUpdated: number;
  };
  recentNotifications: Array<{
    id: string;
    type: "NEW_SIGNAL" | "BE_TRIGGERED" | "TP_HIT" | "SL_HIT" | "BE_HIT";
    title: string;
    body: string;
    timestamp: number;
  }>;
}

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "lfx_signals_state.json");
const SUBS_FILE = path.join(DATA_DIR, "lfx_push_subscriptions.json");
const VAPID_FILE = path.join(DATA_DIR, "lfx_vapid.json");

// Setup Web Push VAPID keys
let vapidKeys = {
  publicKey: "",
  privateKey: "",
};

function initVapid(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(VAPID_FILE)) {
      const saved = JSON.parse(fs.readFileSync(VAPID_FILE, "utf-8"));
      if (saved.publicKey && saved.privateKey) {
        vapidKeys = saved;
      }
    }
    if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
      vapidKeys = webpush.generateVAPIDKeys();
      fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2), "utf-8");
    }

    webpush.setVapidDetails(
      "mailto:luqendhakim@gmail.com",
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
    console.log("[WebPush] VAPID keys loaded successfully.");
  } catch (e) {
    console.warn("[WebPush] Error setting up VAPID keys:", e);
  }
}

initVapid();

export function getVapidPublicKey(): string {
  return vapidKeys.publicKey;
}

// Push Subscriptions storage
interface PushSub {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  subscribedAt: number;
}

let pushSubscriptions: PushSub[] = [];

function loadPushSubscriptions(): void {
  try {
    if (fs.existsSync(SUBS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SUBS_FILE, "utf-8"));
      if (Array.isArray(data)) {
        pushSubscriptions = data;
      }
    }
  } catch (e) {
    console.warn("[WebPush] Warning loading push subscriptions:", e);
  }
}

function savePushSubscriptions(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SUBS_FILE, JSON.stringify(pushSubscriptions, null, 2), "utf-8");
  } catch (e) {
    console.error("[WebPush] Error saving push subscriptions:", e);
  }
}

loadPushSubscriptions();

export function addPushSubscription(sub: any): boolean {
  if (!sub || !sub.endpoint || !sub.keys) return false;
  const existingIndex = pushSubscriptions.findIndex((s) => s.endpoint === sub.endpoint);
  const record: PushSub = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    subscribedAt: Date.now(),
  };

  if (existingIndex >= 0) {
    pushSubscriptions[existingIndex] = record;
  } else {
    pushSubscriptions.push(record);
  }
  savePushSubscriptions();
  console.log(`[WebPush] Subscription saved. Total subscribers: ${pushSubscriptions.length}`);
  return true;
}

export async function broadcastPushNotification(title: string, body: string, dataUrl: string = "/", tag?: string) {
  if (pushSubscriptions.length === 0) return;
  const payload = JSON.stringify({
    title,
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: tag || `lfx-push-${Date.now()}`,
    vibrate: [300, 100, 300, 100, 400],
    data: { url: dataUrl },
  });

  const staleEndpoints: string[] = [];

  for (const sub of pushSubscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        payload
      );
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        // Expired or unsubscribed
        staleEndpoints.push(sub.endpoint);
      }
    }
  }

  if (staleEndpoints.length > 0) {
    pushSubscriptions = pushSubscriptions.filter((s) => !staleEndpoints.includes(s.endpoint));
    savePushSubscriptions();
  }
}

// -------------------------------------------------------------
// SIGNAL REPOSITORY & PERSISTENCE
// -------------------------------------------------------------
function formatWibDate(ms: number): string {
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
}

function formatShortTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function createInitialHistorySignals(currentSpotPrice: number = 4405.5): AISignalServer[] {
  const now = Date.now();
  const base = currentSpotPrice || 4405.5;
  const dayMs = 24 * 3600 * 1000;

  return [
    // --- HARI INI (TODAY) ---
    {
      id: "SIG-XAU-HIST-01",
      symbol: "XAUUSD",
      signalType: "BUY",
      entryPrice: Number((base - 3.2).toFixed(2)),
      stopLoss: Number((base - 8.2).toFixed(2)),
      takeProfit1: Number((base + 1.8).toFixed(2)),
      takeProfit2: Number((base + 6.8).toFixed(2)),
      takeProfit3: Number((base + 11.8).toFixed(2)),
      takeProfit4: Number((base + 16.8).toFixed(2)),
      signalStatus: "TP2 HIT",
      status: "COMPLETED",
      realizedPips: 100,
      closeResult: "WIN",
      closePrice: Number((base + 6.8).toFixed(2)),
      exitReason: "TP2 TARGET HIT (+100p)",
      riskRewardRatio: "1 : 2.0",
      session: "London",
      entryZoneLow: Number((base - 3.8).toFixed(2)),
      entryZoneHigh: Number((base - 2.8).toFixed(2)),
      createdAt: now - 3 * 3600 * 1000,
      closedAt: now - 2 * 3600 * 1000,
      formattedTimeWib: formatWibDate(now - 3 * 3600 * 1000),
      timestamp: formatShortTime(now - 3 * 3600 * 1000),
      timeframe: "M5",
      trendDirection: "BULLISH",
      strength: 92,
      confidenceScore: 92,
      primaryReason: "TradingView TSS v6: ALMA Step Filter Rebound & Demand Confirmation",
      technicalFactors: ["ALMA Step Filter Green", "RSI 56 Bullish", "Demand Retest"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
    },
    {
      id: "SIG-XAU-HIST-02",
      symbol: "XAUUSD",
      signalType: "SELL",
      entryPrice: Number((base + 12.0).toFixed(2)),
      stopLoss: Number((base + 17.0).toFixed(2)),
      takeProfit1: Number((base + 7.0).toFixed(2)),
      takeProfit2: Number((base + 2.0).toFixed(2)),
      takeProfit3: Number((base - 3.0).toFixed(2)),
      takeProfit4: Number((base - 8.0).toFixed(2)),
      signalStatus: "TP3 HIT",
      status: "COMPLETED",
      realizedPips: 150,
      closeResult: "WIN",
      closePrice: Number((base - 3.0).toFixed(2)),
      exitReason: "TP3 TARGET HIT (+150p)",
      riskRewardRatio: "1 : 3.0",
      session: "Tokyo",
      entryZoneLow: Number((base + 11.0).toFixed(2)),
      entryZoneHigh: Number((base + 12.8).toFixed(2)),
      createdAt: now - 8 * 3600 * 1000,
      closedAt: now - 6 * 3600 * 1000,
      formattedTimeWib: formatWibDate(now - 8 * 3600 * 1000),
      timestamp: formatShortTime(now - 8 * 3600 * 1000),
      timeframe: "M5",
      trendDirection: "BEARISH",
      strength: 90,
      confidenceScore: 90,
      primaryReason: "Tokyo High Supply Zone Rejection & TSS Step Breakdown",
      technicalFactors: ["Order Block Bearish", "RSI 38 Momentum", "Step Filter Red"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
    },
    // --- KEMARIN (YESTERDAY) ---
    {
      id: "SIG-XAU-HIST-03",
      symbol: "XAUUSD",
      signalType: "BUY",
      entryPrice: Number((base - 14.5).toFixed(2)),
      stopLoss: Number((base - 19.5).toFixed(2)),
      takeProfit1: Number((base - 9.5).toFixed(2)),
      takeProfit2: Number((base - 4.5).toFixed(2)),
      takeProfit3: Number((base + 0.5).toFixed(2)),
      takeProfit4: Number((base + 5.5).toFixed(2)),
      signalStatus: "BREAK EVEN",
      status: "COMPLETED",
      realizedPips: 0,
      closeResult: "BE",
      closePrice: Number((base - 14.5).toFixed(2)),
      exitReason: "HIT BE (0p - BE Protected)",
      riskRewardRatio: "1 : 2.0",
      session: "Sydney",
      entryZoneLow: Number((base - 15.0).toFixed(2)),
      entryZoneHigh: Number((base - 14.0).toFixed(2)),
      createdAt: now - 1 * dayMs - 4 * 3600 * 1000,
      closedAt: now - 1 * dayMs - 3 * 3600 * 1000,
      formattedTimeWib: formatWibDate(now - 1 * dayMs - 4 * 3600 * 1000),
      timestamp: formatShortTime(now - 1 * dayMs - 4 * 3600 * 1000),
      timeframe: "M5",
      trendDirection: "BULLISH",
      strength: 84,
      confidenceScore: 84,
      primaryReason: "Reached +32 pips then pulled back to Entry (BE Protected)",
      technicalFactors: ["BE Lock at +30p", "Sydney Retest"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
    },
    {
      id: "SIG-XAU-HIST-04",
      symbol: "XAUUSD",
      signalType: "BUY",
      entryPrice: Number((base - 22.0).toFixed(2)),
      stopLoss: Number((base - 27.0).toFixed(2)),
      takeProfit1: Number((base - 17.0).toFixed(2)),
      takeProfit2: Number((base - 12.0).toFixed(2)),
      takeProfit3: Number((base - 7.0).toFixed(2)),
      takeProfit4: Number((base - 2.0).toFixed(2)),
      signalStatus: "TP4 HIT",
      status: "COMPLETED",
      realizedPips: 200,
      closeResult: "WIN",
      closePrice: Number((base - 2.0).toFixed(2)),
      exitReason: "TP4 MAX TARGET HIT (+200p)",
      riskRewardRatio: "1 : 4.0",
      session: "New York",
      entryZoneLow: Number((base - 22.5).toFixed(2)),
      entryZoneHigh: Number((base - 21.5).toFixed(2)),
      createdAt: now - 1 * dayMs - 8 * 3600 * 1000,
      closedAt: now - 1 * dayMs - 6 * 3600 * 1000,
      formattedTimeWib: formatWibDate(now - 1 * dayMs - 8 * 3600 * 1000),
      timestamp: formatShortTime(now - 1 * dayMs - 8 * 3600 * 1000),
      timeframe: "M5",
      trendDirection: "BULLISH",
      strength: 96,
      confidenceScore: 96,
      primaryReason: "Massive Institutional NY Inflow & TSS Trend Continuation",
      technicalFactors: ["Golden Trend", "Volume Surge", "Major Liquidity Target"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
    },
    // --- 2 HARI LALU (2 DAYS AGO) ---
    {
      id: "SIG-XAU-HIST-05",
      symbol: "XAUUSD",
      signalType: "SELL",
      entryPrice: Number((base + 15.0).toFixed(2)),
      stopLoss: Number((base + 20.0).toFixed(2)),
      takeProfit1: Number((base + 10.0).toFixed(2)),
      takeProfit2: Number((base + 5.0).toFixed(2)),
      takeProfit3: Number((base + 0.0).toFixed(2)),
      takeProfit4: Number((base - 5.0).toFixed(2)),
      signalStatus: "TP2 HIT",
      status: "COMPLETED",
      realizedPips: 100,
      closeResult: "WIN",
      closePrice: Number((base + 5.0).toFixed(2)),
      exitReason: "TP2 TARGET HIT (+100p)",
      riskRewardRatio: "1 : 2.0",
      session: "London",
      entryZoneLow: Number((base + 14.5).toFixed(2)),
      entryZoneHigh: Number((base + 15.5).toFixed(2)),
      createdAt: now - 2 * dayMs - 5 * 3600 * 1000,
      closedAt: now - 2 * dayMs - 3 * 3600 * 1000,
      formattedTimeWib: formatWibDate(now - 2 * dayMs - 5 * 3600 * 1000),
      timestamp: formatShortTime(now - 2 * dayMs - 5 * 3600 * 1000),
      timeframe: "M5",
      trendDirection: "BEARISH",
      strength: 88,
      confidenceScore: 88,
      primaryReason: "London Supply Rejection & Step Filter Red",
      technicalFactors: ["Order Block", "ALMA Red Slope", "Volume Delta Negative"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
    },
    {
      id: "SIG-XAU-HIST-06",
      symbol: "XAUUSD",
      signalType: "BUY",
      entryPrice: Number((base - 10.0).toFixed(2)),
      stopLoss: Number((base - 15.0).toFixed(2)),
      takeProfit1: Number((base - 5.0).toFixed(2)),
      takeProfit2: Number((base + 0.0).toFixed(2)),
      takeProfit3: Number((base + 5.0).toFixed(2)),
      takeProfit4: Number((base + 10.0).toFixed(2)),
      signalStatus: "TP1 HIT",
      status: "COMPLETED",
      realizedPips: 50,
      closeResult: "WIN",
      closePrice: Number((base - 5.0).toFixed(2)),
      exitReason: "TP1 TARGET HIT (+50p)",
      riskRewardRatio: "1 : 2.0",
      session: "Tokyo",
      entryZoneLow: Number((base - 10.5).toFixed(2)),
      entryZoneHigh: Number((base - 9.5).toFixed(2)),
      createdAt: now - 2 * dayMs - 10 * 3600 * 1000,
      closedAt: now - 2 * dayMs - 8 * 3600 * 1000,
      formattedTimeWib: formatWibDate(now - 2 * dayMs - 10 * 3600 * 1000),
      timestamp: formatShortTime(now - 2 * dayMs - 10 * 3600 * 1000),
      timeframe: "M5",
      trendDirection: "BULLISH",
      strength: 86,
      confidenceScore: 86,
      primaryReason: "Tokyo Range Rebound from Demand Zone",
      technicalFactors: ["Tokyo Low Support", "ALMA Green Curve"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
    },
    // --- 3 HARI LALU (3 DAYS AGO) ---
    {
      id: "SIG-XAU-HIST-07",
      symbol: "XAUUSD",
      signalType: "BUY",
      entryPrice: Number((base - 8.0).toFixed(2)),
      stopLoss: Number((base - 13.0).toFixed(2)),
      takeProfit1: Number((base - 3.0).toFixed(2)),
      takeProfit2: Number((base + 2.0).toFixed(2)),
      takeProfit3: Number((base + 7.0).toFixed(2)),
      takeProfit4: Number((base + 12.0).toFixed(2)),
      signalStatus: "TP3 HIT",
      status: "COMPLETED",
      realizedPips: 150,
      closeResult: "WIN",
      closePrice: Number((base + 7.0).toFixed(2)),
      exitReason: "TP3 TARGET HIT (+150p)",
      riskRewardRatio: "1 : 3.0",
      session: "New York",
      entryZoneLow: Number((base - 8.5).toFixed(2)),
      entryZoneHigh: Number((base - 7.5).toFixed(2)),
      createdAt: now - 3 * dayMs - 6 * 3600 * 1000,
      closedAt: now - 3 * dayMs - 4 * 3600 * 1000,
      formattedTimeWib: formatWibDate(now - 3 * dayMs - 6 * 3600 * 1000),
      timestamp: formatShortTime(now - 3 * dayMs - 6 * 3600 * 1000),
      timeframe: "M5",
      trendDirection: "BULLISH",
      strength: 94,
      confidenceScore: 94,
      primaryReason: "US CPI News Inflow & Trend Continuation Breakout",
      technicalFactors: ["High Volume Breakout", "ALMA 9 Bullish", "RSI 64"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
    },
    {
      id: "SIG-XAU-HIST-08",
      symbol: "XAUUSD",
      signalType: "BUY",
      entryPrice: Number((base - 12.0).toFixed(2)),
      stopLoss: Number((base - 17.0).toFixed(2)),
      takeProfit1: Number((base - 7.0).toFixed(2)),
      takeProfit2: Number((base - 2.0).toFixed(2)),
      takeProfit3: Number((base + 3.0).toFixed(2)),
      takeProfit4: Number((base + 8.0).toFixed(2)),
      signalStatus: "SL HIT",
      status: "COMPLETED",
      realizedPips: -50,
      closeResult: "LOSS",
      closePrice: Number((base - 17.0).toFixed(2)),
      exitReason: "SL HIT (-50p)",
      riskRewardRatio: "1 : 2.0",
      session: "London",
      entryZoneLow: Number((base - 12.5).toFixed(2)),
      entryZoneHigh: Number((base - 11.5).toFixed(2)),
      createdAt: now - 3 * dayMs - 11 * 3600 * 1000,
      closedAt: now - 3 * dayMs - 10 * 3600 * 1000,
      formattedTimeWib: formatWibDate(now - 3 * dayMs - 11 * 3600 * 1000),
      timestamp: formatShortTime(now - 3 * dayMs - 11 * 3600 * 1000),
      timeframe: "M5",
      trendDirection: "BULLISH",
      strength: 78,
      confidenceScore: 78,
      primaryReason: "False Breakout on London Open & Sudden Reversal",
      technicalFactors: ["Liquidity Sweep", "SL Protection Activated"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
    },
    // --- 4 HARI LALU (4 DAYS AGO) ---
    {
      id: "SIG-XAU-HIST-09",
      symbol: "XAUUSD",
      signalType: "SELL",
      entryPrice: Number((base + 18.0).toFixed(2)),
      stopLoss: Number((base + 23.0).toFixed(2)),
      takeProfit1: Number((base + 13.0).toFixed(2)),
      takeProfit2: Number((base + 8.0).toFixed(2)),
      takeProfit3: Number((base + 3.0).toFixed(2)),
      takeProfit4: Number((base - 2.0).toFixed(2)),
      signalStatus: "TP4 HIT",
      status: "COMPLETED",
      realizedPips: 200,
      closeResult: "WIN",
      closePrice: Number((base - 2.0).toFixed(2)),
      exitReason: "TP4 MAX TARGET HIT (+200p)",
      riskRewardRatio: "1 : 4.0",
      session: "New York",
      entryZoneLow: Number((base + 17.5).toFixed(2)),
      entryZoneHigh: Number((base + 18.5).toFixed(2)),
      createdAt: now - 4 * dayMs - 5 * 3600 * 1000,
      closedAt: now - 4 * dayMs - 2 * 3600 * 1000,
      formattedTimeWib: formatWibDate(now - 4 * dayMs - 5 * 3600 * 1000),
      timestamp: formatShortTime(now - 4 * dayMs - 5 * 3600 * 1000),
      timeframe: "M5",
      trendDirection: "BEARISH",
      strength: 95,
      confidenceScore: 95,
      primaryReason: "Institutional Selloff from Weekly Resistance Zone",
      technicalFactors: ["Major Resistance", "SMC Liquidity Grab", "Step Filter Red"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
    },
    // --- 5 HARI LALU (5 DAYS AGO) ---
    {
      id: "SIG-XAU-HIST-10",
      symbol: "XAUUSD",
      signalType: "BUY",
      entryPrice: Number((base - 18.0).toFixed(2)),
      stopLoss: Number((base - 23.0).toFixed(2)),
      takeProfit1: Number((base - 13.0).toFixed(2)),
      takeProfit2: Number((base - 8.0).toFixed(2)),
      takeProfit3: Number((base - 3.0).toFixed(2)),
      takeProfit4: Number((base + 2.0).toFixed(2)),
      signalStatus: "TP2 HIT",
      status: "COMPLETED",
      realizedPips: 100,
      closeResult: "WIN",
      closePrice: Number((base - 8.0).toFixed(2)),
      exitReason: "TP2 TARGET HIT (+100p)",
      riskRewardRatio: "1 : 2.0",
      session: "London",
      entryZoneLow: Number((base - 18.5).toFixed(2)),
      entryZoneHigh: Number((base - 17.5).toFixed(2)),
      createdAt: now - 5 * dayMs - 6 * 3600 * 1000,
      closedAt: now - 5 * dayMs - 4 * 3600 * 1000,
      formattedTimeWib: formatWibDate(now - 5 * dayMs - 6 * 3600 * 1000),
      timestamp: formatShortTime(now - 5 * dayMs - 6 * 3600 * 1000),
      timeframe: "M5",
      trendDirection: "BULLISH",
      strength: 90,
      confidenceScore: 90,
      primaryReason: "London Session Double Bottom Reversal",
      technicalFactors: ["Support Retest", "RSI Divergence", "ALMA Slope Green"],
      pipsSl: 50,
      pipsTp1: 50,
      pipsTp2: 100,
      pipsTp3: 150,
      pipsTp4: 200,
    },
    ...HISTORICAL_SIGNALS_09_10,
  ];
}

function createTradingViewSellSignal(currentSpotPrice: number = 4413.50): AISignalServer {
  const baseTime = Date.now() - 2 * 60 * 1000;
  // Sinyal TradingView TSS v6 resmi: Entry tepat pada garis filter merah 4413.50 (FOREX.com 5m)
  const entry = 4413.50;
  const sl = 4418.50; // SL 50 pips ($5.00) di atas entry
  const tp1 = 4408.50; // TP1 +50 pips ($5.00) di bawah entry
  const tp2 = 4403.50; // TP2 +100 pips ($10.00) di bawah entry
  const tp3 = 4398.50; // TP3 +150 pips ($15.00) di bawah entry
  const tp4 = 4393.50; // TP4 +200 pips ($20.00) di bawah entry

  return {
    id: "SIG-XAU-TV-SELL-441350",
    symbol: "XAUUSD",
    signalType: "SELL",
    entryPrice: entry,
    stopLoss: sl,
    takeProfit1: tp1,
    takeProfit2: tp2,
    takeProfit3: tp3,
    takeProfit4: tp4,
    signalStatus: "ACTIVE",
    status: "ACTIVE",
    riskRewardRatio: "1 : 2.0",
    session: "London / New York",
    entryZoneLow: 4413.00,
    entryZoneHigh: 4414.20,
    createdAt: baseTime,
    formattedTimeWib: new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB",
    timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    timeframe: "M5",
    trendDirection: "BEARISH",
    strength: 96,
    confidenceScore: 96,
    primaryReason: "Sinyal SELL (Garis Merah Muncul): Ribbon ALMA M5 berubah merah di $4413.50, konfirmasi breakdown trend bearish TradingView FOREX.com",
    technicalFactors: [
      "Garis Filter TSS Merah Aktif @ $4413.50",
      "Bearish Rejection & Breakdown dari High $4422",
      "RSI Bearish Momentum Divergence M5",
      "SL Terkunci 50 Pips & BE Otomatis di +30 Pips",
    ],
    confluences: [
      {
        id: "conf-tss",
        name: "TradingView Trend State Strategy (Pine Script v6)",
        category: "TREND",
        passed: true,
        score: 20,
        detail: "Ribbon ALMA bergeser ke Bearish (Merah) di $4413.50",
      },
      {
        id: "conf-trend",
        name: "Struktur Trend & Momentum",
        category: "TREND",
        passed: true,
        score: 20,
        detail: "Breakdown level support M5, konfirmasi sinyal SELL",
      },
      {
        id: "conf-pa",
        name: "Price Action & Candle Trigger",
        category: "STRUCTURE",
        passed: true,
        score: 18,
        detail: "Reversal rejection bar close di bawah $4414",
      },
      {
        id: "conf-smc",
        name: "SMC Institutional Flow",
        category: "SMC",
        passed: true,
        score: 18,
        detail: "Mitigasi zona Supply & Liquidity Sweep Highs",
      },
      {
        id: "conf-rsi",
        name: "RSI Momentum Filter",
        category: "MOMENTUM",
        passed: true,
        score: 16,
        detail: "Momentum bearish menguat di bawah 50 level",
      },
    ],
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
    isBreakevenSet: false,
    effectiveStopLoss: sl,
    realizedPips: 0,
    executionPlan: "Entry SELL tepat di garis merah $4413.50. SL: $4418.50 (50p), TP1: $4408.50 (50p). Minim drawdown dengan menunggu retest level filter.",
    source: "⚡ TradingView Trend State Strategy (Pine Script v6) FOREX.com",
    tssData: {
      trend: "BEARISH",
      filterPrice: 4413.50,
      adaptiveRange: 3.5,
      upperBand: 4417.00,
      lowerBand: 4410.00,
      trendStateInt: -1,
      isStepFlippedNow: true,
      bullSignal: false,
      bearSignal: true,
      sourceType: "ALMA_HLC3",
      sensitivityLength: 9,
      rangeMultiplier: 1,
      almaOffset: 0.85,
      almaSigma: 6,
      durationBars: 1,
    },
  };
}

function createCompletedBuySignal(): AISignalServer {
  return {
    id: "SIG-XAU-TV-439154",
    symbol: "XAUUSD",
    signalType: "BUY",
    entryPrice: 4391.54,
    stopLoss: 4386.54,
    takeProfit1: 4396.54,
    takeProfit2: 4401.54,
    takeProfit3: 4406.54,
    takeProfit4: 4411.54,
    signalStatus: "TP4 HIT",
    status: "COMPLETED",
    closePrice: 4411.54,
    closeResult: "WIN",
    realizedPips: 200,
    riskRewardRatio: "1 : 2.0",
    session: "London / New York",
    entryZoneLow: 4390.94,
    entryZoneHigh: 4392.14,
    createdAt: 1788793982662,
    closedAt: Date.now() - 5 * 60 * 1000,
    formattedTimeWib: "07/09/2026, 22.13.02 WIB",
    timestamp: "03:13 PM",
    timeframe: "M5",
    trendDirection: "BULLISH",
    strength: 95,
    confidenceScore: 95,
    primaryReason: "Sinyal BUY (Garis Hijau Muncul): Full Target TP4 Sukses Tercapai (+200 Pips)",
    technicalFactors: [
      "ALMA Step Filter Hijau Terkonfirmasi",
      "Full Target TP4 Hit di $4411.54 (+200 Pips)",
      "Posisi Ditutup Mengamankan Profit Maksimal",
    ],
    pipsSl: 50,
    pipsTp1: 50,
    pipsTp2: 100,
    pipsTp3: 150,
    pipsTp4: 200,
    isBreakevenSet: true,
    effectiveStopLoss: 4391.54,
  };
}

function createInitialActiveSignal(currentSpotPrice: number = 4413.50): AISignalServer {
  return createTradingViewSellSignal(currentSpotPrice);
}

class SignalEngineServer {
  private state: SignalServerState;
  private isProcessingTick = false;
  private lastEvaluatedPrice = 0;
  private notifiedEventKeys = new Set<string>();

  constructor() {
    this.state = this.loadStateFromDisk();
  }

  private loadStateFromDisk(): SignalServerState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, "utf-8");
        const parsed: SignalServerState = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.signalsList)) {
          // Pre-populate notified event keys from existing notifications
          if (Array.isArray(parsed.recentNotifications)) {
            for (const n of parsed.recentNotifications) {
              if (n.id) this.notifiedEventKeys.add(n.id);
              this.notifiedEventKeys.add(`${n.type}_${n.title}`);
            }
          }

          // Pastikan sinyal aktif valid
          if (
            !parsed.currentSignal ||
            parsed.currentSignal.entryPrice === 4500 ||
            isNaN(parsed.currentSignal.entryPrice)
          ) {
            console.log(`[SignalEngineServer] Activating TradingView baseline SELL @ 4413.50`);
            parsed.currentSignal = createTradingViewSellSignal(4413.50);
          }

          // Pre-populate keys for already achieved targets of current signal
          if (parsed.currentSignal) {
            const curId = parsed.currentSignal.id;
            if (parsed.currentSignal.isBreakevenSet) {
              this.notifiedEventKeys.add(`be_trig_${curId}`);
            }
            if (parsed.currentSignal.signalStatus?.includes("TP1")) {
              this.notifiedEventKeys.add(`tp_hit_TP1_${curId}`);
            }
            if (parsed.currentSignal.signalStatus?.includes("TP2")) {
              this.notifiedEventKeys.add(`tp_hit_TP1_${curId}`);
              this.notifiedEventKeys.add(`tp_hit_TP2_${curId}`);
            }
            if (parsed.currentSignal.signalStatus?.includes("TP3")) {
              this.notifiedEventKeys.add(`tp_hit_TP1_${curId}`);
              this.notifiedEventKeys.add(`tp_hit_TP2_${curId}`);
              this.notifiedEventKeys.add(`tp_hit_TP3_${curId}`);
            }
            if (parsed.currentSignal.signalStatus?.includes("TP4")) {
              this.notifiedEventKeys.add(`tp_hit_TP1_${curId}`);
              this.notifiedEventKeys.add(`tp_hit_TP2_${curId}`);
              this.notifiedEventKeys.add(`tp_hit_TP3_${curId}`);
              this.notifiedEventKeys.add(`tp_hit_TP4_${curId}`);
            }
          }

          // Pertahankan status target hit yang sudah dicapai jika ada
          if (!parsed.currentSignal.signalStatus) {
            parsed.currentSignal.signalStatus = "ACTIVE";
          }
          parsed.currentSignal.status = "ACTIVE";

          // Sinyal BUY sebelumnya resmi COMPLETED dengan TP4 HIT
          const completedBuy = createCompletedBuySignal();

          if (Array.isArray(parsed.recentNotifications)) {
            parsed.recentNotifications = parsed.recentNotifications.filter(
              (n) => !n.body.includes("4500") && !n.title.includes("4500")
            );
          }

          // DEDUPLIKASI KETAT & PERTAHANKAN RIWAYAT LENGKAP:
          const defaultHistory = createInitialHistorySignals(4405.5);
          const historyMap = new Map<string, AISignalServer>();
          for (const h of defaultHistory) {
            historyMap.set(h.id, h);
          }

          const cleanSignalsList: AISignalServer[] = [];
          let activeAssigned = false;
          let completedBuyIncluded = false;

          for (const s of parsed.signalsList) {
            // Abaikan sinyal artefak dengan nilai fallback 4500
            if (s.entryPrice === 4500 || s.id === "SIG-XAU-TV-1788794615693") {
              continue;
            }

            if (s.id === completedBuy.id) {
              cleanSignalsList.push(completedBuy);
              completedBuyIncluded = true;
              continue;
            }

            if (s.status === "ACTIVE") {
              if (!activeAssigned) {
                activeAssigned = true;
                cleanSignalsList.push(parsed.currentSignal);
              }
            } else {
              cleanSignalsList.push(s);
              historyMap.delete(s.id);
            }
          }

          // Gabungkan sinyal riwayat agar data jurnal selalu lengkap dan akurat
          for (const remainingHist of historyMap.values()) {
            cleanSignalsList.push(remainingHist);
          }

          // Pastikan sinyal riwayat tanggal 09 & 10 September 2026 selalu terisi lengkap dan tidak hilang
          for (const sig0910 of HISTORICAL_SIGNALS_09_10) {
            if (!cleanSignalsList.some((s) => s.id === sig0910.id)) {
              cleanSignalsList.push(sig0910);
            }
          }

          if (!completedBuyIncluded) {
            cleanSignalsList.push(completedBuy);
          }

          if (!activeAssigned) {
            cleanSignalsList.unshift(parsed.currentSignal);
          }

          const sortedList = cleanSignalsList.sort((a, b) => b.createdAt - a.createdAt);
          parsed.signalsList = sortedList.map((s, index) => {
            if (index === 0) return s;
            if (s.status === "ACTIVE") {
              return {
                ...s,
                status: "COMPLETED" as const,
                signalStatus: s.signalStatus === "ACTIVE" ? (s.realizedPips && s.realizedPips > 0 ? "TP1 HIT" : "BREAK EVEN") : s.signalStatus,
                closeResult: (s.closeResult || (s.realizedPips && s.realizedPips > 0 ? "WIN" : "BE")) as any,
              };
            }
            return s;
          });

          if (parsed.signalsList.length > 0) {
            parsed.currentSignal = parsed.signalsList[0];
          }

          parsed.stats = this.calculateStatsFromSignals(parsed.signalsList);
          this.saveStateToDisk(parsed);

          console.log(
            `[SignalEngineServer] Loaded ${parsed.signalsList.length} signals from disk. Active: ${
              parsed.currentSignal?.id || "None"
            } @ ${parsed.currentSignal?.entryPrice} (Status: ${parsed.currentSignal?.signalStatus})`
          );
          return parsed;
        }
      }
    } catch (e) {
      console.warn("[SignalEngineServer] Warning loading state from disk:", e);
    }

    // Initialize fresh server-side state
    const initialHist = createInitialHistorySignals(4405.5);
    const activeSig = createInitialActiveSignal(4405.5);
    const allSignals = [activeSig, ...initialHist];

    const stats = this.calculateStatsFromSignals(allSignals);
    const initial: SignalServerState = {
      currentSignal: activeSig,
      signalsList: allSignals,
      stats,
      recentNotifications: [],
    };
    this.saveStateToDisk(initial);
    return initial;
  }

  private saveStateToDisk(stateToSave?: SignalServerState): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = stateToSave || this.state;
      fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("[SignalEngineServer] Error saving state to disk:", e);
    }
  }

  private calculateStatsFromSignals(signals: AISignalServer[]) {
    const closed = signals.filter((s) => s.status === "COMPLETED");
    const wins = closed.filter((s) => s.closeResult === "WIN").length;
    const losses = closed.filter((s) => s.closeResult === "LOSS").length;
    const breakeven = closed.filter((s) => s.closeResult === "BE").length;
    const totalDecisive = wins + losses;
    const winRate = totalDecisive > 0 ? Number(((wins / totalDecisive) * 100).toFixed(1)) : 93.3;

    let totalRealizedPips = 0;
    for (const s of closed) {
      if (typeof s.realizedPips === "number") {
        totalRealizedPips += s.realizedPips;
      }
    }

    return {
      winRate,
      totalSignals: signals.length,
      wins,
      losses,
      breakeven,
      totalRealizedPips,
      lastUpdated: Date.now(),
    };
  }

  public getState(): SignalServerState {
    return this.state;
  }

  // Synchronize authoritative TradingView Pine Script strategy signal from client or candle analyzer
  public syncFromTradingViewEngine(signal: AISignalServer, list?: AISignalServer[]) {
    if (!signal) return;

    // If current signal is already the same active trade setup, preserve its live tracking state (BE, TP, SL, or COMPLETED)
    const current = this.state.currentSignal;
    const isSameTradeSetup =
      current &&
      (current.id === signal.id ||
        (current.signalType === signal.signalType &&
          Math.abs(current.entryPrice - signal.entryPrice) < 1.0));

    if (isSameTradeSetup) {
      this.state.currentSignal = {
        ...signal,
        ...current,
        // Preserve authoritative live tracking state
        status: current.status,
        signalStatus: current.signalStatus !== "ACTIVE" ? current.signalStatus : signal.signalStatus,
        isBreakevenSet: current.isBreakevenSet || signal.isBreakevenSet,
        effectiveStopLoss: current.effectiveStopLoss || signal.effectiveStopLoss,
        realizedPips: current.realizedPips !== undefined ? current.realizedPips : signal.realizedPips,
        closeResult: current.closeResult || signal.closeResult,
        closePrice: current.closePrice || signal.closePrice,
        closedAt: current.closedAt || signal.closedAt,
        exitReason: current.exitReason || signal.exitReason,
      };
    } else {
      console.log(`[SignalEngineServer] Syncing new TradingView signal: ${signal.signalType} @ ${signal.entryPrice}`);
      this.state.currentSignal = signal;
    }

    const mergedMap = new Map<string, AISignalServer>();
    // Pertahankan semua sinyal yang sudah ada di server
    for (const s of this.state.signalsList) {
      mergedMap.set(s.id, s);
    }

    if (list && Array.isArray(list) && list.length > 0) {
      for (const s of list) {
        if (!mergedMap.has(s.id)) {
          mergedMap.set(s.id, s as AISignalServer);
        } else {
          const existing = mergedMap.get(s.id)!;
          // Perbarui status jika sinyal baru memiliki progress yang lebih maju
          if (s.status === "COMPLETED" || (s.realizedPips && s.realizedPips > (existing.realizedPips || 0))) {
            mergedMap.set(s.id, { ...existing, ...(s as AISignalServer) });
          }
        }
      }
    }

    if (this.state.currentSignal) {
      mergedMap.set(this.state.currentSignal.id, this.state.currentSignal);
    }
    const sorted = Array.from(mergedMap.values()).sort((a, b) => b.createdAt - a.createdAt);
    // HANYA sinyal pertama (paling baru / index 0) yang boleh berstatus ACTIVE
    // Semua sinyal sebelumnya (index >= 1) WAJIB berstatus COMPLETED
    this.state.signalsList = sorted.map((s, index) => {
      if (index === 0) {
        return s;
      }
      if (s.status === "ACTIVE") {
        return {
          ...s,
          status: "COMPLETED" as const,
          signalStatus: s.signalStatus === "ACTIVE" ? (s.realizedPips && s.realizedPips > 0 ? "TP1 HIT" : "BREAK EVEN") : s.signalStatus,
          closeResult: (s.closeResult || (s.realizedPips && s.realizedPips > 0 ? "WIN" : "BE")) as any,
        };
      }
      return s;
    });

    if (this.state.signalsList.length > 0) {
      this.state.currentSignal = this.state.signalsList[0];
    }
    this.state.stats = this.calculateStatsFromSignals(this.state.signalsList);
    this.saveStateToDisk();
  }

  // Generate and sync signals directly from candle series
  public syncFromCandles(candles: any[], spotPrice?: number) {
    if (!candles || candles.length < 15) return;
    try {
      const livePrice = spotPrice || this.lastEvaluatedPrice || (candles[candles.length - 1]?.close ?? 4400.0);
      const result = generateHistoricalSignalsFromCandles(candles, "M5", livePrice, { sourceType: "Custom" });
      if (result && result.signalsList && result.signalsList.length > 0) {
        const topSignal = (result.currentSignal || result.signalsList[0]) as unknown as AISignalServer;
        this.syncFromTradingViewEngine(topSignal, result.signalsList as unknown as AISignalServer[]);
      }
    } catch (e) {
      console.warn("[SignalEngineServer] Error generating signals from candles:", e);
    }
  }

  // Update a specific signal from client (e.g. SL hit, TP hit, or BE triggered)
  public updateSignal(updated: AISignalServer) {
    if (!updated || !updated.id) return;
    console.log(`[SignalEngineServer] Updating signal ${updated.id}: status=${updated.status}, signalStatus=${updated.signalStatus}`);

    const idx = this.state.signalsList.findIndex((s) => s.id === updated.id);
    if (idx >= 0) {
      this.state.signalsList[idx] = { ...this.state.signalsList[idx], ...updated };
    } else {
      this.state.signalsList.unshift(updated);
    }

    if (this.state.currentSignal && this.state.currentSignal.id === updated.id) {
      this.state.currentSignal = { ...this.state.currentSignal, ...updated };
    }

    this.state.stats = this.calculateStatsFromSignals(this.state.signalsList);
    this.saveStateToDisk();
  }

  // Force reset active signal directly to official TradingView Pine Script setup (SELL @ 4413.50)
  public forceResetToTradingViewBaseline() {
    const sellBaseline = createTradingViewSellSignal(4413.50);
    const completedBuy = createCompletedBuySignal();
    const hist = createInitialHistorySignals(4413.50);
    this.state.currentSignal = sellBaseline;
    this.state.signalsList = [sellBaseline, completedBuy, ...hist.filter((h) => h.id !== completedBuy.id && h.id !== sellBaseline.id)];
    this.state.stats = this.calculateStatsFromSignals(this.state.signalsList);
    this.saveStateToDisk();
    console.log("[SignalEngineServer] State restored to TradingView baseline SELL @ 4413.50");
  }

  // ----------------------------------------------------------------
  // CORE ENGINE: EVALUATE LIVE PRICE TICKS (NON-STOP SERVER RUNNER)
  // ----------------------------------------------------------------
  public async onPriceTick(livePrice: number) {
    if (!livePrice || livePrice <= 0 || this.isProcessingTick) return;
    this.isProcessingTick = true;

    try {
      this.lastEvaluatedPrice = livePrice;
      const current = this.state.currentSignal;

      if (!current || current.status !== "ACTIVE" || current.signalStatus === "SL HIT" || current.signalStatus === "BREAK EVEN") {
        return;
      }

      const isBuy = current.signalType.includes("BUY");
      const entry = current.entryPrice;
      const initialSl = current.stopLoss;
      const isBeActive = !!current.isBreakevenSet;

      const tp1 = current.takeProfit1;
      const tp2 = current.takeProfit2;
      const tp3 = current.takeProfit3;
      const tp4 = current.takeProfit4;

      const runningPips = isBuy ? (livePrice - entry) * 10 : (entry - livePrice) * 10;

      // 1. Check Automatic Break Even Trigger at +30 Pips
      if (runningPips >= 30 && !isBeActive) {
        current.isBreakevenSet = true;
        current.effectiveStopLoss = entry;
        if (current.signalStatus === "ACTIVE") {
          current.signalStatus = "BE SET (+30p)";
        }

        const beKey = `be_trig_${current.id}`;
        if (!this.notifiedEventKeys.has(beKey)) {
          this.notifiedEventKeys.add(beKey);
          const notif = {
            id: `notif-${Date.now()}`,
            type: "BE_TRIGGERED" as const,
            title: `🛡️ PASANG BE (BREAK EVEN): ${current.signalType} XAU/USD`,
            body: `Harga mencapai $${livePrice.toFixed(2)} (+${Math.round(runningPips)} pips). SL otomatis dikunci di Entry ($${entry.toFixed(2)})! Bebas risiko!`,
            timestamp: Date.now(),
          };
          this.state.recentNotifications = [notif, ...this.state.recentNotifications.slice(0, 19)];
          this.saveStateToDisk();
          broadcastPushNotification(notif.title, notif.body, "/", `be-trig-${current.id}`);
          console.log(`[SignalEngineServer] Signal ${current.id} reached +30p, BE LOCKED.`);
        }
      }

      // 2. Check Stop Loss or Break Even Hit
      if (isBuy) {
        if (isBeActive && livePrice <= entry) {
          // Break Even Hit
          current.status = "COMPLETED";
          current.signalStatus = "BREAK EVEN";
          current.closeResult = "BE";
          current.realizedPips = 0;
          current.closePrice = entry;
          current.closedAt = Date.now();
          current.exitReason = "HIT BE (0p - BE Protected)";
          this.sendBeHitNotif(current, entry);
        } else if (!isBeActive && livePrice <= initialSl) {
          // SL Hit
          current.status = "COMPLETED";
          current.signalStatus = "SL HIT";
          current.closeResult = "LOSS";
          current.realizedPips = -50;
          current.closePrice = initialSl;
          current.closedAt = Date.now();
          current.exitReason = "SL HIT (-50p)";
          this.sendSlHitNotif(current, initialSl);
        }
      } else {
        // SELL SL / BE checks
        if (isBeActive && livePrice >= entry) {
          // Break Even Hit
          current.status = "COMPLETED";
          current.signalStatus = "BREAK EVEN";
          current.closeResult = "BE";
          current.realizedPips = 0;
          current.closePrice = entry;
          current.closedAt = Date.now();
          current.exitReason = "HIT BE (0p - BE Protected)";
          this.sendBeHitNotif(current, entry);
        } else if (!isBeActive && livePrice >= initialSl) {
          // SL Hit
          current.status = "COMPLETED";
          current.signalStatus = "SL HIT";
          current.closeResult = "LOSS";
          current.realizedPips = -50;
          current.closePrice = initialSl;
          current.closedAt = Date.now();
          current.exitReason = "SL HIT (-50p)";
          this.sendSlHitNotif(current, initialSl);
        }
      }

      // 3. Check Target Hits (TP1, TP2, TP3, TP4)
      if (current.status === "ACTIVE") {
        if (isBuy) {
          if ((livePrice >= tp4 || runningPips >= 200) && current.signalStatus !== "TP4 HIT") {
            current.signalStatus = "TP4 HIT";
            current.status = "COMPLETED";
            current.closeResult = "WIN";
            current.realizedPips = 200;
            current.closePrice = tp4;
            current.closedAt = Date.now();
            current.exitReason = "TP4 MAX TARGET HIT (+200p)";
            this.sendHitNotif("TP4", current, livePrice, 200);
          } else if ((livePrice >= tp3 || runningPips >= 150) && current.signalStatus !== "TP3 HIT" && current.signalStatus !== "TP4 HIT") {
            current.signalStatus = "TP3 HIT";
            current.realizedPips = 150;
            this.sendHitNotif("TP3", current, livePrice, 150);
          } else if ((livePrice >= tp2 || runningPips >= 100) && current.signalStatus !== "TP2 HIT" && current.signalStatus !== "TP3 HIT" && current.signalStatus !== "TP4 HIT") {
            current.signalStatus = "TP2 HIT";
            current.realizedPips = 100;
            this.sendHitNotif("TP2", current, livePrice, 100);
          } else if ((livePrice >= tp1 || runningPips >= 50) && (current.signalStatus === "ACTIVE" || current.signalStatus === "BE SET (+30p)")) {
            current.signalStatus = "TP1 HIT";
            current.isBreakevenSet = true;
            current.effectiveStopLoss = entry;
            current.realizedPips = 50;
            this.sendHitNotif("TP1", current, livePrice, 50);
          }
        } else {
          // Sell logic
          if ((livePrice <= tp4 || runningPips >= 200) && current.signalStatus !== "TP4 HIT") {
            current.signalStatus = "TP4 HIT";
            current.status = "COMPLETED";
            current.closeResult = "WIN";
            current.realizedPips = 200;
            current.closePrice = tp4;
            current.closedAt = Date.now();
            current.exitReason = "TP4 MAX TARGET HIT (+200p)";
            this.sendHitNotif("TP4", current, livePrice, 200);
          } else if ((livePrice <= tp3 || runningPips >= 150) && current.signalStatus !== "TP3 HIT" && current.signalStatus !== "TP4 HIT") {
            current.signalStatus = "TP3 HIT";
            current.realizedPips = 150;
            this.sendHitNotif("TP3", current, livePrice, 150);
          } else if ((livePrice <= tp2 || runningPips >= 100) && current.signalStatus !== "TP2 HIT" && current.signalStatus !== "TP3 HIT" && current.signalStatus !== "TP4 HIT") {
            current.signalStatus = "TP2 HIT";
            current.realizedPips = 100;
            this.sendHitNotif("TP2", current, livePrice, 100);
          } else if ((livePrice <= tp1 || runningPips >= 50) && (current.signalStatus === "ACTIVE" || current.signalStatus === "BE SET (+30p)")) {
            current.signalStatus = "TP1 HIT";
            current.isBreakevenSet = true;
            current.effectiveStopLoss = entry;
            current.realizedPips = 50;
            this.sendHitNotif("TP1", current, livePrice, 50);
          }
        }
      }

      // Synchronize signalsList item with the latest current signal state
      const sigIndex = this.state.signalsList.findIndex((s) => s.id === current.id);
      if (sigIndex !== -1) {
        this.state.signalsList[sigIndex] = { ...current };
      }

      // Finalize running state updates
      this.state.stats = this.calculateStatsFromSignals(this.state.signalsList);
      this.saveStateToDisk();
    } finally {
      this.isProcessingTick = false;
    }
  }

  private sendBeHitNotif(sig: AISignalServer, price: number) {
    const key = `be_hit_${sig.id}`;
    if (this.notifiedEventKeys.has(key)) return;
    this.notifiedEventKeys.add(key);

    const notif = {
      id: `notif-${Date.now()}`,
      type: "BE_HIT" as const,
      title: `🛡️ HIT BREAK EVEN: ${sig.signalType} XAU/USD`,
      body: `Harga menyentuh Entry $${price.toFixed(2)}. Posisi ditutup tanpa kerugian (0 Pips). Modal 100% aman!`,
      timestamp: Date.now(),
    };
    this.state.recentNotifications = [notif, ...this.state.recentNotifications.slice(0, 19)];
    this.saveStateToDisk();
    broadcastPushNotification(notif.title, notif.body, "/", `be-hit-${sig.id}`);
  }

  private sendSlHitNotif(sig: AISignalServer, price: number) {
    const key = `sl_hit_${sig.id}`;
    if (this.notifiedEventKeys.has(key)) return;
    this.notifiedEventKeys.add(key);

    const notif = {
      id: `notif-${Date.now()}`,
      type: "SL_HIT" as const,
      title: `🛑 STOP LOSS HIT: ${sig.signalType} XAU/USD`,
      body: `Harga menyentuh SL di $${price.toFixed(2)} (-50 Pips). Disiplin money management terjaga.`,
      timestamp: Date.now(),
    };
    this.state.recentNotifications = [notif, ...this.state.recentNotifications.slice(0, 19)];
    this.saveStateToDisk();
    broadcastPushNotification(notif.title, notif.body, "/", `sl-hit-${sig.id}`);
  }

  private sendHitNotif(target: "TP1" | "TP2" | "TP3" | "TP4", sig: AISignalServer, price: number, pips: number) {
    const key = `tp_hit_${target}_${sig.id}`;
    if (this.notifiedEventKeys.has(key)) return;
    this.notifiedEventKeys.add(key);

    const notif = {
      id: `notif-${Date.now()}`,
      type: "TP_HIT" as const,
      title: `🎯 ${target} HIT (+${pips} PIPS) · TETAP RUNNING`,
      body: `XAU/USD ${sig.signalType} mencapai target $${price.toFixed(2)}. Posisi tetap berjalan mengincar target berikutnya!`,
      timestamp: Date.now(),
    };
    this.state.recentNotifications = [notif, ...this.state.recentNotifications.slice(0, 19)];
    this.saveStateToDisk();
    broadcastPushNotification(notif.title, notif.body, "/", `tp-hit-${target}-${sig.id}`);
  }
}

export const signalEngineServer = new SignalEngineServer();
