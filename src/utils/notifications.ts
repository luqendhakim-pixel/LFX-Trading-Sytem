import { AISignal, MobileNotification, Timeframe } from "../types";
import { soundManager } from "./audio";

// Request native browser Web Notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.warn("Notification permission request error:", e);
    return "denied";
  }
}

// Check current notification permission
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

// Trigger native OS/Browser notification if permitted
export function sendBrowserPushNotification(
  title: string,
  body: string,
  tag?: string
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      const notif = new Notification(title, {
        body,
        icon: "/vite.svg",
        tag: tag || `gold-signal-${Date.now()}`,
        requireInteraction: false,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.warn("Browser push notification error:", e);
    }
  }
}

// Build standard MobileNotification object from AISignal with TSS strategy branding
export function createSignalNotification(
  signal: AISignal,
  timeframe: Timeframe,
  isManualTrigger: boolean = false
): MobileNotification {
  const isBuy = signal.signalType.includes("BUY");
  const action = isBuy ? "BUY" : "SELL";
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const isTssFlip = signal.tssData?.isStepFlippedNow;
  const tssFilter = signal.tssData?.filterPrice ? `$${signal.tssData.filterPrice.toFixed(2)}` : "";

  const title = isTssFlip
    ? `⚡ [TSS STRATEGY] ${action} XAU/USD (${timeframe}) - Flip @ ${tssFilter}`
    : `🚨 [${timeframe}] ${signal.signalType.replace("_", " ")} XAU/USD`;

  const body = `Entry: $${signal.entryPrice.toFixed(2)} | SL: $${signal.stopLoss.toFixed(2)} | TP1: $${signal.takeProfit1.toFixed(2)} | TP2: $${signal.takeProfit2.toFixed(2)}. ${signal.primaryReason}`;

  return {
    id: `sig-${timeframe}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    body,
    time: timeStr,
    type: "SIGNAL",
    params: {
      action,
      entry: signal.entryPrice,
      sl: signal.stopLoss,
      tp: signal.takeProfit1,
      lot: signal.riskAssessment.recommendedLotSize,
    },
  };
}
