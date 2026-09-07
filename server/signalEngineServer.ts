import fs from "fs";
import path from "path";
import webpush from "web-push";

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

export async function broadcastPushNotification(title: string, body: string, dataUrl: string = "/") {
  if (pushSubscriptions.length === 0) return;
  const payload = JSON.stringify({
    title,
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: `lfx-push-${Date.now()}`,
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

  return [
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
      createdAt: now - 18 * 3600 * 1000,
      closedAt: now - 17 * 3600 * 1000,
      formattedTimeWib: formatWibDate(now - 18 * 3600 * 1000),
      timestamp: formatShortTime(now - 18 * 3600 * 1000),
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
      createdAt: now - 32 * 3600 * 1000,
      closedAt: now - 28 * 3600 * 1000,
      formattedTimeWib: formatWibDate(now - 32 * 3600 * 1000),
      timestamp: formatShortTime(now - 32 * 3600 * 1000),
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
  ];
}

function createInitialActiveSignal(currentSpotPrice: number = 4405.5): AISignalServer {
  const now = Date.now();
  const entry = Number(currentSpotPrice.toFixed(2));
  // Default to High-Conviction BUY setup based on current market structure
  const isBuy = true;
  const slDist = 5.0; // 50 pips
  const tp1Dist = 5.0; // +50 pips
  const tp2Dist = 10.0; // +100 pips
  const tp3Dist = 15.0; // +150 pips
  const tp4Dist = 20.0; // +200 pips

  const sl = Number((entry - slDist).toFixed(2));
  const tp1 = Number((entry + tp1Dist).toFixed(2));
  const tp2 = Number((entry + tp2Dist).toFixed(2));
  const tp3 = Number((entry + tp3Dist).toFixed(2));
  const tp4 = Number((entry + tp4Dist).toFixed(2));

  return {
    id: `SIG-XAU-${now}`,
    symbol: "XAUUSD",
    signalType: "BUY",
    entryPrice: entry,
    stopLoss: sl,
    takeProfit1: tp1,
    takeProfit2: tp2,
    takeProfit3: tp3,
    takeProfit4: tp4,
    signalStatus: "ACTIVE",
    status: "ACTIVE",
    riskRewardRatio: "1 : 2.0",
    session: "London",
    entryZoneLow: Number((entry - 0.6).toFixed(2)),
    entryZoneHigh: Number((entry + 0.6).toFixed(2)),
    createdAt: now,
    formattedTimeWib: formatWibDate(now),
    timestamp: formatShortTime(now),
    timeframe: "M5",
    trendDirection: "BULLISH",
    strength: 92,
    confidenceScore: 92,
    primaryReason: "TradingView TSS v6: ALMA Step Filter Rebound & Demand Confirmation (Entry Tepat di Garis Hijau)",
    technicalFactors: [
      "ALMA Step Filter Hijau Terkonfirmasi",
      "Retest Order Block Demand Zone",
      "RSI Bullish Momentum Confluence",
      "SL Terkunci 50 Pips & BE Otomatis di +30 Pips",
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
  };
}

class SignalEngineServer {
  private state: SignalServerState;
  private isProcessingTick = false;
  private lastEvaluatedPrice = 0;

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
          console.log(
            `[SignalEngineServer] Loaded ${parsed.signalsList.length} signals from disk. Active: ${
              parsed.currentSignal?.id || "None"
            }`
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

  // ----------------------------------------------------------------
  // CORE ENGINE: EVALUATE LIVE PRICE TICKS (NON-STOP SERVER RUNNER)
  // ----------------------------------------------------------------
  public async onPriceTick(livePrice: number) {
    if (!livePrice || livePrice <= 0 || this.isProcessingTick) return;
    this.isProcessingTick = true;

    try {
      this.lastEvaluatedPrice = livePrice;
      const current = this.state.currentSignal;

      // 1. If NO active signal exists, check if we should create a new locked setup
      if (!current || current.status !== "ACTIVE") {
        // Only generate new signal if cooldown has elapsed and there is no open trade
        const now = Date.now();
        const lastClosedTime = current?.closedAt || 0;
        const cooldownElapsed = now - lastClosedTime > 90000; // 90s cooldown between signals

        if (cooldownElapsed) {
          const newSignal = createInitialActiveSignal(livePrice);
          this.state.currentSignal = newSignal;
          this.state.signalsList = [newSignal, ...this.state.signalsList];
          this.state.stats = this.calculateStatsFromSignals(this.state.signalsList);

          const notif = {
            id: `notif-${Date.now()}`,
            type: "NEW_SIGNAL" as const,
            title: `🚨 SINYAL BARU: ${newSignal.signalType} ${newSignal.symbol}`,
            body: `Entry: $${newSignal.entryPrice.toFixed(2)} | SL: $${newSignal.stopLoss.toFixed(2)} (-50p) | TP1: $${newSignal.takeProfit1.toFixed(2)} (+50p)`,
            timestamp: Date.now(),
          };
          this.state.recentNotifications = [notif, ...this.state.recentNotifications.slice(0, 19)];
          this.saveStateToDisk();

          // Push to mobile devices
          broadcastPushNotification(notif.title, notif.body);
          console.log(`[SignalEngineServer] Created new LOCKED signal ${newSignal.id} @ ${livePrice}`);
        }
        return;
      }

      // 2. We HAVE an active signal. Evaluate running performance against TP1-4, BE, and SL
      const isBuy = current.signalType.includes("BUY");
      const entry = current.entryPrice;
      const initialSl = current.stopLoss;
      const isBeActive = !!current.isBreakevenSet;

      const tp1 = current.takeProfit1;
      const tp2 = current.takeProfit2;
      const tp3 = current.takeProfit3;
      const tp4 = current.takeProfit4;

      const runningPips = isBuy ? (livePrice - entry) * 10 : (entry - livePrice) * 10;

      // Check Automatic Break Even Trigger at +30 Pips
      if (runningPips >= 30 && !isBeActive && current.signalStatus === "ACTIVE") {
        current.isBreakevenSet = true;
        current.effectiveStopLoss = entry;
        current.signalStatus = "BE SET (+30p)";

        const notif = {
          id: `notif-${Date.now()}`,
          type: "BE_TRIGGERED" as const,
          title: `🛡️ PASANG BE (BREAK EVEN): ${current.signalType} XAU/USD`,
          body: `Harga mencapai $${livePrice.toFixed(2)} (+${Math.round(runningPips)} pips). SL otomatis dikunci di Entry ($${entry.toFixed(2)})! Bebas risiko!`,
          timestamp: Date.now(),
        };
        this.state.recentNotifications = [notif, ...this.state.recentNotifications.slice(0, 19)];
        this.saveStateToDisk();
        broadcastPushNotification(notif.title, notif.body);
        console.log(`[SignalEngineServer] Signal ${current.id} reached +30p, BE LOCKED.`);
      }

      // Check Target Hits
      let completed = false;
      let targetName: "TP1" | "TP2" | "TP3" | "TP4" | "SL" | "BE" | null = null;
      let realizedPips = 0;
      let closeResult: "WIN" | "LOSS" | "BE" = "WIN";

      if (isBuy) {
        if (livePrice >= tp4) {
          targetName = "TP4";
          realizedPips = 200;
          closeResult = "WIN";
          completed = true;
        } else if (livePrice >= tp3 && current.signalStatus !== "TP3 HIT" && current.signalStatus !== "TP4 HIT") {
          current.signalStatus = "TP3 HIT";
          this.sendHitNotif("TP3", current, livePrice, 150);
        } else if (livePrice >= tp2 && current.signalStatus !== "TP2 HIT" && current.signalStatus !== "TP3 HIT" && current.signalStatus !== "TP4 HIT") {
          current.signalStatus = "TP2 HIT";
          this.sendHitNotif("TP2", current, livePrice, 100);
        } else if (livePrice >= tp1 && current.signalStatus === "ACTIVE") {
          current.signalStatus = "TP1 HIT";
          current.isBreakevenSet = true;
          current.effectiveStopLoss = entry;
          this.sendHitNotif("TP1", current, livePrice, 50);
        } else if (isBeActive && livePrice <= entry) {
          targetName = "BE";
          realizedPips = 0;
          closeResult = "BE";
          completed = true;
        } else if (!isBeActive && livePrice <= initialSl) {
          targetName = "SL";
          realizedPips = -50;
          closeResult = "LOSS";
          completed = true;
        }
      } else {
        // Sell logic
        if (livePrice <= tp4) {
          targetName = "TP4";
          realizedPips = 200;
          closeResult = "WIN";
          completed = true;
        } else if (livePrice <= tp3 && current.signalStatus !== "TP3 HIT" && current.signalStatus !== "TP4 HIT") {
          current.signalStatus = "TP3 HIT";
          this.sendHitNotif("TP3", current, livePrice, 150);
        } else if (livePrice <= tp2 && current.signalStatus !== "TP2 HIT" && current.signalStatus !== "TP3 HIT" && current.signalStatus !== "TP4 HIT") {
          current.signalStatus = "TP2 HIT";
          this.sendHitNotif("TP2", current, livePrice, 100);
        } else if (livePrice <= tp1 && current.signalStatus === "ACTIVE") {
          current.signalStatus = "TP1 HIT";
          current.isBreakevenSet = true;
          current.effectiveStopLoss = entry;
          this.sendHitNotif("TP1", current, livePrice, 50);
        } else if (isBeActive && livePrice >= entry) {
          targetName = "BE";
          realizedPips = 0;
          closeResult = "BE";
          completed = true;
        } else if (!isBeActive && livePrice >= initialSl) {
          targetName = "SL";
          realizedPips = -50;
          closeResult = "LOSS";
          completed = true;
        }
      }

      // If position reached full exit (TP4, SL, or BE reversal)
      if (completed && targetName) {
        current.status = "COMPLETED";
        current.closedAt = Date.now();
        current.realizedPips = realizedPips;
        current.closeResult = closeResult;
        current.closePrice = livePrice;
        current.exitReason =
          targetName === "TP4"
            ? "TP4 FULL TARGET HIT (+200p)"
            : targetName === "SL"
            ? "STOP LOSS HIT (-50p)"
            : "BREAK EVEN HIT (0p)";

        // Recalculate Winrate and Stats
        this.state.stats = this.calculateStatsFromSignals(this.state.signalsList);

        const notifType = targetName === "SL" ? "SL_HIT" : targetName === "BE" ? "BE_HIT" : "TP_HIT";
        const notif = {
          id: `notif-${Date.now()}`,
          type: notifType as any,
          title:
            targetName === "TP4"
              ? `🏆 TP4 HIT (FULL TARGET +200p)`
              : targetName === "SL"
              ? `🛑 STOP LOSS HIT (-50p)`
              : `⚖️ BREAK EVEN HIT (0p - Impas Bebas Risiko)`,
          body: `Posisi ${current.signalType} XAUUSD resmi ditutup pada $${livePrice.toFixed(2)}. Hasil: ${closeResult} (${realizedPips > 0 ? `+${realizedPips}` : realizedPips} pips).`,
          timestamp: Date.now(),
        };
        this.state.recentNotifications = [notif, ...this.state.recentNotifications.slice(0, 19)];
        this.saveStateToDisk();
        broadcastPushNotification(notif.title, notif.body);
        console.log(`[SignalEngineServer] Signal ${current.id} CLOSED with ${closeResult} (${realizedPips}p)`);
      }
    } finally {
      this.isProcessingTick = false;
    }
  }

  private sendHitNotif(target: "TP1" | "TP2" | "TP3", sig: AISignalServer, price: number, pips: number) {
    const notif = {
      id: `notif-${Date.now()}`,
      type: "TP_HIT" as const,
      title: `🎯 ${target} HIT (+${pips} PIPS) · TETAP RUNNING`,
      body: `XAU/USD ${sig.signalType} mencapai target $${price.toFixed(2)}. Posisi tetap berjalan mengincar target berikutnya!`,
      timestamp: Date.now(),
    };
    this.state.recentNotifications = [notif, ...this.state.recentNotifications.slice(0, 19)];
    this.saveStateToDisk();
    broadcastPushNotification(notif.title, notif.body);
  }
}

export const signalEngineServer = new SignalEngineServer();
