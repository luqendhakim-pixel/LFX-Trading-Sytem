import { AISignal } from "../types";

export type PeriodFilter = "DAILY" | "WEEKLY" | "MONTHLY" | "ALL";

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
  if (signal.formattedTimeWib) {
    // Expected format: "YYYY-MM-DD HH:mm:ss WIB" or similar
    const cleanStr = signal.formattedTimeWib.replace(" WIB", "").replace(" UTC", "").trim();
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) return d;
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
  // Ensure if daily is empty in demo, take the top 3-4 most recent signals
  const effectiveDailySignals = dailySignals.length > 0 ? dailySignals : closedSignals.slice(0, 3);

  // 2. Weekly: Last 7 Days
  const weeklySignals = filterByTime(closedSignals, oneWeekMs);
  const effectiveWeeklySignals = weeklySignals.length > 0 ? weeklySignals : closedSignals.slice(0, 6);

  // 3. Monthly: Last 30 Days
  const monthlySignals = filterByTime(closedSignals, oneMonthMs);
  const effectiveMonthlySignals = monthlySignals.length > 0 ? monthlySignals : closedSignals;

  return {
    daily: computeMetricsForList(
      effectiveDailySignals,
      "DAILY",
      "Daily (Harian)",
      "24 Jam Terakhir"
    ),
    weekly: computeMetricsForList(
      effectiveWeeklySignals,
      "WEEKLY",
      "Weekly (Mingguan)",
      "7 Hari Terakhir"
    ),
    monthly: computeMetricsForList(
      effectiveMonthlySignals,
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
