import { AISignal, MobileNotification } from "../types";

const READ_NOTIFS_STORAGE_KEY = "lfx_read_notification_ids_v1";

/**
 * Reads the set of notification IDs that have been marked as read from localStorage
 */
export function getStoredReadNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_NOTIFS_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

/**
 * Saves read notification IDs to localStorage
 */
export function saveReadNotificationIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    const arr = Array.from(ids).slice(-500); // keep max 500
    localStorage.setItem(READ_NOTIFS_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn("Failed to persist read notification IDs:", e);
  }
}

/**
 * Formats time relative to now (Indonesian)
 */
export function formatRelativeTime(ms: number): string {
  if (!ms || isNaN(ms)) return "Baru saja";
  const now = Date.now();
  const diffSec = Math.floor((now - ms) / 1000);

  if (diffSec < 45) return "Baru saja";
  if (diffSec < 3600) {
    const mins = Math.max(1, Math.floor(diffSec / 60));
    return `${mins} mnt lalu`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours} jam lalu`;
  }
  const days = Math.floor(diffSec / 86400);
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari lalu`;
  return new Date(ms).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Formats timestamp to WIB (UTC+7) string
 */
export function formatWibTime(ms: number): string {
  try {
    return (
      new Date(ms).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    );
  } catch {
    return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
}

/**
 * Generates an accurate, chronological list of notifications matching every
 * historical and active signal event in signalsList.
 */
export function buildNotificationsFromSignals(
  signalsList: AISignal[],
  readIds: Set<string>
): MobileNotification[] {
  const notifs: MobileNotification[] = [];

  for (const sig of signalsList) {
    const isBuy = sig.signalType.includes("BUY");
    const sym = sig.symbol || "XAUUSD";
    const sigType = isBuy ? "BUY" : "SELL";
    const entryPrice = sig.entryPrice;
    const stopLoss = sig.stopLoss;
    const tp1 = sig.takeProfit1;
    const tp2 = sig.takeProfit2;

    const createdAtMs =
      typeof sig.createdAt === "number" && sig.createdAt > 0
        ? sig.createdAt
        : Date.now() - 3600000;

    const closedAtMs =
      typeof sig.closedAt === "number" && sig.closedAt > 0
        ? sig.closedAt
        : createdAtMs + 1800000;

    const isLive = sig.status === "ACTIVE";

    // 1. If signal reached a finalized target (TP, SL, BE), create the TARGET HIT event notification
    if (!isLive) {
      const isTp =
        sig.signalStatus?.includes("TP") ||
        sig.closeResult === "WIN" ||
        (sig.realizedPips !== undefined && sig.realizedPips > 0);

      const isSl =
        sig.signalStatus === "SL HIT" ||
        sig.signalStatus === "SL_HIT" ||
        sig.closeResult === "LOSS" ||
        (sig.realizedPips !== undefined && sig.realizedPips < 0);

      const isBe =
        sig.signalStatus === "BREAK EVEN" ||
        sig.signalStatus === "HIT_BE" ||
        sig.closeResult === "BE" ||
        sig.realizedPips === 0;

      if (isTp) {
        const tpLabel = sig.signalStatus || (sig.closeResult ? `${sig.closeResult} HIT` : "TP1 HIT");
        const pips = sig.realizedPips && sig.realizedPips > 0 ? sig.realizedPips : 50;
        const id = `notif-hit-tp-${sig.id}`;
        notifs.push({
          id,
          title: `🎯 ${tpLabel} (+${pips} PIPS)`,
          body: `${sigType} ${sym} sukses mencapai target profit di $${
            sig.closePrice?.toFixed(2) || tp1.toFixed(2)
          }. Profit diamankan +${pips} pips.`,
          time: sig.closedAt ? formatWibTime(sig.closedAt) : (sig.formattedTimeWib || sig.timestamp),
          type: "TP_HIT",
          params: {
            action: sigType,
            entry: entryPrice,
            sl: stopLoss,
            tp: tp1,
            lot: 0.1,
            pnl: pips * 10,
          },
          read: readIds.has(id),
          signalId: sig.id,
          pips,
          timestampMs: closedAtMs,
        });
      } else if (isSl) {
        const pips = sig.realizedPips && sig.realizedPips < 0 ? sig.realizedPips : -50;
        const id = `notif-hit-sl-${sig.id}`;
        notifs.push({
          id,
          title: `🛑 STOP LOSS HIT (${pips} PIPS)`,
          body: `${sigType} ${sym} menyentuh batas risiko di $${
            sig.closePrice?.toFixed(2) || stopLoss.toFixed(2)
          }. Posisi ditutup disiplin sesuai risk management.`,
          time: sig.closedAt ? formatWibTime(sig.closedAt) : (sig.formattedTimeWib || sig.timestamp),
          type: "SL_HIT",
          params: {
            action: sigType,
            entry: entryPrice,
            sl: stopLoss,
            tp: tp1,
            lot: 0.1,
            pnl: pips * 10,
          },
          read: readIds.has(id),
          signalId: sig.id,
          pips,
          timestampMs: closedAtMs,
        });
      } else if (isBe) {
        const id = `notif-hit-be-${sig.id}`;
        notifs.push({
          id,
          title: `⚖️ BREAK EVEN (BE) HIT (0 PIPS)`,
          body: `${sigType} ${sym} kembali ke titik Entry $${entryPrice.toFixed(
            2
          )}. Posisi ditutup impas tanpa risiko kerugian.`,
          time: sig.closedAt ? formatWibTime(sig.closedAt) : (sig.formattedTimeWib || sig.timestamp),
          type: "BREAKEVEN",
          params: {
            action: sigType,
            entry: entryPrice,
            sl: stopLoss,
            tp: tp1,
            lot: 0.1,
            pnl: 0,
          },
          read: readIds.has(id),
          signalId: sig.id,
          pips: 0,
          timestampMs: closedAtMs,
        });
      }
    }

    // 2. Create the ENTRY SIGNAL notification (Active or Historical Entry)
    const entryNotifId = `notif-entry-${sig.id}`;
    const isCurrentActive = isLive;

    notifs.push({
      id: entryNotifId,
      title: isCurrentActive
        ? `🚨 SINYAL AKTIF LIVE: ${sigType} ${sym}`
        : `⚡ SINYAL TERKONFIRMASI: ${sigType} ${sym}`,
      body: `Entry di $${entryPrice.toFixed(2)} | SL: $${stopLoss.toFixed(2)} (50p) | TP1: $${tp1.toFixed(
        2
      )} (+50p) | TP2: $${tp2.toFixed(2)} (+100p)`,
      time: sig.formattedTimeWib || sig.timestamp || formatWibTime(createdAtMs),
      type: "SIGNAL",
      params: {
        action: sigType,
        entry: entryPrice,
        sl: stopLoss,
        tp: tp1,
        lot: 0.1,
      },
      read: readIds.has(entryNotifId),
      signalId: sig.id,
      timestampMs: createdAtMs,
    });
  }

  // Sort descending by timestampMs so the freshest notifications are at the top
  notifs.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));

  return notifs;
}
