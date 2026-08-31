import { AISignal } from "../types";

export type PeriodFilter = "DAILY" | "WEEKLY" | "MONTHLY" | "ALL" | "CUSTOM_DATE";

export interface PeriodPipsMetrics {
  period: PeriodFilter;
  label: string;
  subLabel: string;
  totalClosedSignals: number;
  totalHitTpCount: number;
  hitTp1Count: number;
  hitTp2Count: number;
  hitTp3Count: number;
  hitTp4Count: number;
  hitSlCount: number;
  hitBeCount: number;
  profitPips: number;
  lossPips: number;
  netPips: number;
  winRatePercent: number;
  signals: AISignal[];
  customDateKey?: string;
}

export interface DynamicHistoryWinRate {
  daily: PeriodPipsMetrics;
  weekly: PeriodPipsMetrics;
  monthly: PeriodPipsMetrics;
  allTime: PeriodPipsMetrics;
}

/**
 * Parses timestamp or formattedTimeWib from an AISignal into a JavaScript Date object
 */
export function getSignalDate(signal: AISignal): Date {
  if (typeof signal.closedAt === "number" && !isNaN(signal.closedAt) && signal.closedAt > 0) {
    return new Date(signal.closedAt);
  }
  if (typeof signal.createdAt === "number" && !isNaN(signal.createdAt) && signal.createdAt > 0) {
    return new Date(signal.createdAt);
  }

  if (signal.formattedTimeWib) {
    // Expected format: "YYYY-MM-DD HH:mm:ss WIB" or similar
    const cleanStr = signal.formattedTimeWib.replace(" WIB", "").replace(" UTC", "").trim();
    // Handle space to ISO format
    const isoStr = cleanStr.includes("T") ? cleanStr : cleanStr.replace(" ", "T");
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) return d;
    const directD = new Date(cleanStr);
    if (!isNaN(directD.getTime())) return directD;
  }

  // Fallback to timestamp if it looks like ISO or parseable
  if (signal.timestamp) {
    const d = new Date(signal.timestamp);
    if (!isNaN(d.getTime())) return d;
  }

  // Default to today
  return new Date();
}

/**
 * Calculates pips for a signal based on realizedPips or its status
 */
export function extractSignalPips(sig: AISignal): {
  pips: number;
  isWin: boolean;
  isLoss: boolean;
  isBe: boolean;
  tpLevel?: 1 | 2 | 3 | 4;
} {
  const status = sig.signalStatus || "";
  const result = sig.closeResult;

  if (typeof sig.realizedPips === "number") {
    const pips = sig.realizedPips;
    if (status.includes("TP4") || pips >= (sig.pipsTp4 || 200)) {
      return { pips, isWin: true, isLoss: false, isBe: false, tpLevel: 4 };
    }
    if (status.includes("TP3") || pips >= (sig.pipsTp3 || 150)) {
      return { pips, isWin: true, isLoss: false, isBe: false, tpLevel: 3 };
    }
    if (status.includes("TP2") || pips >= (sig.pipsTp2 || 100)) {
      return { pips, isWin: true, isLoss: false, isBe: false, tpLevel: 2 };
    }
    if (status.includes("TP1") || pips > 0) {
      return { pips, isWin: true, isLoss: false, isBe: false, tpLevel: 1 };
    }
    if (status === "SL HIT" || pips < 0 || result === "LOSS") {
      return { pips: pips < 0 ? pips : -(sig.pipsSl || 50), isWin: false, isLoss: true, isBe: false };
    }
    return { pips: 0, isWin: false, isLoss: false, isBe: true };
  }

  // Fallback from status
  switch (status) {
    case "TP4 HIT":
      return { pips: sig.pipsTp4 || 200, isWin: true, isLoss: false, isBe: false, tpLevel: 4 };
    case "TP3 HIT":
      return { pips: sig.pipsTp3 || 150, isWin: true, isLoss: false, isBe: false, tpLevel: 3 };
    case "TP2 HIT":
      return { pips: sig.pipsTp2 || 100, isWin: true, isLoss: false, isBe: false, tpLevel: 2 };
    case "TP1 HIT":
      return { pips: sig.pipsTp1 || 50, isWin: true, isLoss: false, isBe: false, tpLevel: 1 };
    case "SL HIT":
      return { pips: -(sig.pipsSl || 50), isWin: false, isLoss: true, isBe: false };
    case "BREAK EVEN":
    case "BE SET (+30p)":
      return { pips: 0, isWin: false, isLoss: false, isBe: true };
    default:
      if (result === "WIN") {
        return { pips: sig.pipsTp1 || 50, isWin: true, isLoss: false, isBe: false, tpLevel: 1 };
      }
      if (result === "LOSS") {
        return { pips: -(sig.pipsSl || 50), isWin: false, isLoss: true, isBe: false };
      }
      return { pips: 0, isWin: false, isLoss: false, isBe: true };
  }
}

/**
 * Calculates dynamic metrics for daily, weekly, monthly and all-time
 */
export function calculateDynamicHistoryWinRate(signalsList: AISignal[]): DynamicHistoryWinRate {
  // Only include closed / completed / target-hit signals
  const closedSignals = signalsList.filter((s) => {
    const isClosed = s.status === "COMPLETED" || s.status === "EXPIRED" || s.status === "TRIGGERED";
    const hasResult =
      s.signalStatus === "TP1 HIT" ||
      s.signalStatus === "TP2 HIT" ||
      s.signalStatus === "TP3 HIT" ||
      s.signalStatus === "TP4 HIT" ||
      s.signalStatus === "SL HIT" ||
      s.signalStatus === "BREAK EVEN" ||
      s.signalStatus === "CLOSED" ||
      s.closeResult !== undefined;
    return isClosed || hasResult;
  });

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneWeekMs = 7 * oneDayMs;
  const oneMonthMs = 30 * oneDayMs;

  const filterByTime = (signals: AISignal[], maxAgeMs: number | null): AISignal[] => {
    if (maxAgeMs === null) return signals;
    return signals.filter((sig) => {
      const sigDate = getSignalDate(sig);
      const age = now - sigDate.getTime();
      return age >= 0 && age <= maxAgeMs;
    });
  };

  const computeMetricsForList = (
    list: AISignal[],
    period: PeriodFilter,
    label: string,
    subLabel: string
  ): PeriodPipsMetrics => {
    let profitPips = 0;
    let lossPips = 0;
    let hitTp1Count = 0;
    let hitTp2Count = 0;
    let hitTp3Count = 0;
    let hitTp4Count = 0;
    let hitSlCount = 0;
    let hitBeCount = 0;

    list.forEach((sig) => {
      const { pips, isWin, isLoss, isBe, tpLevel } = extractSignalPips(sig);

      if (isWin) {
        profitPips += Math.abs(pips);
        if (tpLevel === 4) hitTp4Count++;
        else if (tpLevel === 3) hitTp3Count++;
        else if (tpLevel === 2) hitTp2Count++;
        else hitTp1Count++;
      } else if (isLoss) {
        lossPips += Math.abs(pips);
        hitSlCount++;
      } else if (isBe) {
        hitBeCount++;
      }
    });

    const totalHitTpCount = hitTp1Count + hitTp2Count + hitTp3Count + hitTp4Count;
    const totalClosedSignals = list.length;
    const netPips = profitPips - lossPips;
    const totalEvaluated = totalHitTpCount + hitSlCount + hitBeCount;
    const winRatePercent =
      totalEvaluated > 0
        ? Math.round((totalHitTpCount / totalEvaluated) * 100)
        : totalClosedSignals > 0
        ? Math.round((totalHitTpCount / totalClosedSignals) * 100)
        : 0;

    return {
      period,
      label,
      subLabel,
      totalClosedSignals,
      totalHitTpCount,
      hitTp1Count,
      hitTp2Count,
      hitTp3Count,
      hitTp4Count,
      hitSlCount,
      hitBeCount,
      profitPips,
      lossPips,
      netPips,
      winRatePercent,
      signals: list,
    };
  };

  // 1. Daily: Last 24 Hours
  const dailySignals = filterByTime(closedSignals, oneDayMs);

  // 2. Weekly: Last 7 Days
  const weeklySignals = filterByTime(closedSignals, oneWeekMs);

  // 3. Monthly: Last 30 Days
  const monthlySignals = filterByTime(closedSignals, oneMonthMs);

  return {
    daily: computeMetricsForList(
      dailySignals,
      "DAILY",
      "Daily (Harian)",
      "24 Jam Terakhir"
    ),
    weekly: computeMetricsForList(
      weeklySignals,
      "WEEKLY",
      "Weekly (Mingguan)",
      "7 Hari Terakhir"
    ),
    monthly: computeMetricsForList(
      monthlySignals,
      "MONTHLY",
      "Monthly (Bulanan)",
      "30 Hari Terakhir"
    ),
    allTime: computeMetricsForList(
      closedSignals,
      "ALL",
      "Semua Riwayat",
      "Total Sinyal Terverifikasi"
    ),
  };
}

/**
 * Returns date in YYYY-MM-DD format (Asia/Jakarta / Local)
 */
export function getSignalDateKey(signal: AISignal): string {
  const d = getSignalDate(signal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Converts Date object to YYYY-MM-DD string
 */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats YYYY-MM-DD to Indonesian readable date (e.g. "31 Agu 2026")
 */
export function formatDateKeyToIndo(dateKey: string): string {
  try {
    const parts = dateKey.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  } catch (e) {}
  return dateKey;
}

/**
 * Calculates win rate and pips for a specific chosen calendar date (YYYY-MM-DD)
 */
export function calculateWinRateForDate(
  signalsList: AISignal[],
  targetDateKey: string
): PeriodPipsMetrics {
  const closedSignals = signalsList.filter((s) => {
    const isClosed = s.status === "COMPLETED" || s.status === "EXPIRED" || s.status === "TRIGGERED";
    const hasResult =
      s.signalStatus === "TP1 HIT" ||
      s.signalStatus === "TP2 HIT" ||
      s.signalStatus === "TP3 HIT" ||
      s.signalStatus === "TP4 HIT" ||
      s.signalStatus === "SL HIT" ||
      s.signalStatus === "BREAK EVEN" ||
      s.signalStatus === "CLOSED" ||
      s.closeResult !== undefined;
    return isClosed || hasResult;
  });

  const matchingSignals = closedSignals.filter((sig) => {
    return getSignalDateKey(sig) === targetDateKey;
  });

  let profitPips = 0;
  let lossPips = 0;
  let hitTp1Count = 0;
  let hitTp2Count = 0;
  let hitTp3Count = 0;
  let hitTp4Count = 0;
  let hitSlCount = 0;
  let hitBeCount = 0;

  matchingSignals.forEach((sig) => {
    const { pips, isWin, isLoss, isBe, tpLevel } = extractSignalPips(sig);
    if (isWin) {
      profitPips += Math.abs(pips);
      if (tpLevel === 4) hitTp4Count++;
      else if (tpLevel === 3) hitTp3Count++;
      else if (tpLevel === 2) hitTp2Count++;
      else hitTp1Count++;
    } else if (isLoss) {
      lossPips += Math.abs(pips);
      hitSlCount++;
    } else if (isBe) {
      hitBeCount++;
    }
  });

  const totalHitTpCount = hitTp1Count + hitTp2Count + hitTp3Count + hitTp4Count;
  const totalClosedSignals = matchingSignals.length;
  const netPips = profitPips - lossPips;
  const totalEvaluated = totalHitTpCount + hitSlCount + hitBeCount;
  const winRatePercent =
    totalEvaluated > 0
      ? Math.round((totalHitTpCount / totalEvaluated) * 100)
      : totalClosedSignals > 0
      ? Math.round((totalHitTpCount / totalClosedSignals) * 100)
      : 0;

  const readableDate = formatDateKeyToIndo(targetDateKey);

  return {
    period: "CUSTOM_DATE",
    label: `Harian (${readableDate})`,
    subLabel: `Kalender: ${targetDateKey}`,
    totalClosedSignals,
    totalHitTpCount,
    hitTp1Count,
    hitTp2Count,
    hitTp3Count,
    hitTp4Count,
    hitSlCount,
    hitBeCount,
    profitPips,
    lossPips,
    netPips,
    winRatePercent,
    signals: matchingSignals,
    customDateKey: targetDateKey,
  };
}

/**
 * Returns list of distinct date keys present in signals list with summary
 */
export function getAvailableSignalDates(signalsList: AISignal[]): {
  dateKey: string;
  label: string;
  count: number;
  winRate: number;
  netPips: number;
}[] {
  const map = new Map<string, AISignal[]>();

  signalsList.forEach((sig) => {
    const key = getSignalDateKey(sig);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(sig);
  });

  const dates = Array.from(map.keys()).sort().reverse();

  return dates.map((key) => {
    const metrics = calculateWinRateForDate(signalsList, key);
    return {
      dateKey: key,
      label: formatDateKeyToIndo(key),
      count: metrics.totalClosedSignals,
      winRate: metrics.winRatePercent,
      netPips: metrics.netPips,
    };
  });
}

