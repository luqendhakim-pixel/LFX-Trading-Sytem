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
    // 1. Check for Indonesian DD/MM/YYYY format (e.g. "07/09/2026, 20.55.05 WIB")
    const dmyMatch = signal.formattedTimeWib.match(/(\d{2})\/(\d{2})\/(\d{4})(?:,\s*(\d{2})[.:](\d{2})(?:[.:](\d{2}))?)?/);
    if (dmyMatch) {
      const [, day, month, year, hour = "00", min = "00", sec = "00"] = dmyMatch;
      // Note: WIB is UTC+7
      const isoCandidate = `${year}-${month}-${day}T${hour}:${min}:${sec}+07:00`;
      const d = new Date(isoCandidate);
      if (!isNaN(d.getTime())) return d;
    }

    // 2. Check for YYYY-MM-DD format (e.g. "2026-09-07 20:55:05 WIB")
    const ymdMatch = signal.formattedTimeWib.match(/(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2})[.:](\d{2})(?:[.:](\d{2}))?)?/);
    if (ymdMatch) {
      const [, year, month, day, hour = "00", min = "00", sec = "00"] = ymdMatch;
      const isoCandidate = `${year}-${month}-${day}T${hour}:${min}:${sec}+07:00`;
      const d = new Date(isoCandidate);
      if (!isNaN(d.getTime())) return d;
    }

    const cleanStr = signal.formattedTimeWib.replace(" WIB", "").replace(" UTC", "").trim();
    const isoStr = cleanStr.includes("T") ? cleanStr : cleanStr.replace(" ", "T");
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback to timestamp if parseable
  if (signal.timestamp) {
    const d = new Date(signal.timestamp);
    if (!isNaN(d.getTime())) return d;
  }

  // Default to now
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
  const status = (sig.signalStatus || "").toUpperCase();
  const result = (sig.closeResult || "").toUpperCase();
  const realized = typeof sig.realizedPips === "number" ? sig.realizedPips : undefined;

  // 1. Explicit TP4 Win
  if (status.includes("TP4") || (realized !== undefined && realized >= (sig.pipsTp4 || 200))) {
    const p = realized !== undefined && realized > 0 ? realized : sig.pipsTp4 || 200;
    return { pips: p, isWin: true, isLoss: false, isBe: false, tpLevel: 4 };
  }

  // 2. Explicit TP3 Win
  if (status.includes("TP3") || (realized !== undefined && realized >= (sig.pipsTp3 || 150))) {
    const p = realized !== undefined && realized > 0 ? realized : sig.pipsTp3 || 150;
    return { pips: p, isWin: true, isLoss: false, isBe: false, tpLevel: 3 };
  }

  // 3. Explicit TP2 Win
  if (status.includes("TP2") || (realized !== undefined && realized >= (sig.pipsTp2 || 100))) {
    const p = realized !== undefined && realized > 0 ? realized : sig.pipsTp2 || 100;
    return { pips: p, isWin: true, isLoss: false, isBe: false, tpLevel: 2 };
  }

  // 4. Explicit TP1 Win or Positive Realized Pips or closeResult === WIN
  if (
    status.includes("TP1") ||
    result === "WIN" ||
    (realized !== undefined && realized > 0)
  ) {
    const p = realized !== undefined && realized > 0 ? realized : sig.pipsTp1 || 50;
    return { pips: p, isWin: true, isLoss: false, isBe: false, tpLevel: 1 };
  }

  // 5. Explicit Stop Loss
  if (
    status.includes("SL") ||
    result === "LOSS" ||
    (realized !== undefined && realized < 0)
  ) {
    const p = realized !== undefined && realized < 0 ? realized : -(sig.pipsSl || 50);
    return { pips: p, isWin: false, isLoss: true, isBe: false };
  }

  // 6. Break Even targets
  if (
    status.includes("BREAK EVEN") ||
    status.includes("BE HIT") ||
    result === "BE" ||
    (realized !== undefined && realized === 0 && (sig.isBreakevenSet || status.includes("BE")))
  ) {
    return { pips: 0, isWin: false, isLoss: false, isBe: true };
  }

  // 7. General fallback by realizedPips
  if (realized !== undefined) {
    if (realized > 0) return { pips: realized, isWin: true, isLoss: false, isBe: false, tpLevel: 1 };
    if (realized < 0) return { pips: realized, isWin: false, isLoss: true, isBe: false };
    return { pips: 0, isWin: false, isLoss: false, isBe: true };
  }

  // 8. Fallback by closeResult
  if (result === "WIN") {
    return { pips: sig.pipsTp1 || 50, isWin: true, isLoss: false, isBe: false, tpLevel: 1 };
  }

  return { pips: 0, isWin: false, isLoss: false, isBe: true };
}

/**
 * Calculates dynamic metrics for daily, weekly, monthly and all-time
 */
export function calculateDynamicHistoryWinRate(signalsList: AISignal[]): DynamicHistoryWinRate {
  // Include all historical signals except strictly the currently active open trade without any target hit
  const closedSignals = signalsList.filter((s) => {
    if (
      s.status === "ACTIVE" &&
      s.signalStatus === "ACTIVE" &&
      !s.closeResult &&
      (s.realizedPips === undefined || s.realizedPips === 0)
    ) {
      return false;
    }
    return true;
  });

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneWeekMs = 7 * oneDayMs;
  const oneMonthMs = 30 * oneDayMs;
  const todayKey = toDateKey(new Date(now));

  const filterByTime = (signals: AISignal[], periodType: "DAILY" | "WEEKLY" | "MONTHLY" | "ALL"): AISignal[] => {
    if (periodType === "ALL") return signals;

    return signals.filter((sig) => {
      const sigDate = getSignalDate(sig);
      const age = now - sigDate.getTime();
      const sigKey = getSignalDateKey(sig);

      if (periodType === "DAILY") {
        // Include signals within last 24h OR signals from today in WIB timezone
        return (age >= -300000 && age <= oneDayMs) || sigKey === todayKey;
      }
      if (periodType === "WEEKLY") {
        return (age >= -300000 && age <= oneWeekMs) || sigKey >= toDateKey(new Date(now - oneWeekMs));
      }
      if (periodType === "MONTHLY") {
        return (age >= -300000 && age <= oneMonthMs) || sigKey >= toDateKey(new Date(now - oneMonthMs));
      }
      return true;
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
    const totalDecisive = totalHitTpCount + hitSlCount;
    // Standard Win Rate: Total TP Wins / (Total TP Wins + Total SL Losses) * 100
    const winRatePercent =
      totalDecisive > 0
        ? Math.round((totalHitTpCount / totalDecisive) * 100)
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

  // 1. Daily: Last 24 Hours / Today
  const dailySignals = filterByTime(closedSignals, "DAILY");

  // 2. Weekly: Last 7 Days
  const weeklySignals = filterByTime(closedSignals, "WEEKLY");

  // 3. Monthly: Last 30 Days
  const monthlySignals = filterByTime(closedSignals, "MONTHLY");

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
 * Returns date in YYYY-MM-DD format (Asia/Jakarta WIB)
 */
export function getSignalDateKey(signal: AISignal): string {
  // If formattedTimeWib has DD/MM/YYYY, extract it directly
  if (signal.formattedTimeWib) {
    const match = signal.formattedTimeWib.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month}-${day}`;
    }
  }

  const d = getSignalDate(signal);
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(d);
  } catch (e) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

/**
 * Converts Date object to YYYY-MM-DD string in Asia/Jakarta WIB
 */
export function toDateKey(date: Date): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch (e) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
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
    if (
      s.status === "ACTIVE" &&
      s.signalStatus === "ACTIVE" &&
      !s.closeResult &&
      (s.realizedPips === undefined || s.realizedPips === 0)
    ) {
      return false;
    }
    return true;
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
  const totalDecisive = totalHitTpCount + hitSlCount;
  const winRatePercent =
    totalDecisive > 0
      ? Math.round((totalHitTpCount / totalDecisive) * 100)
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
  const validSignals = signalsList.filter((s) => {
    if (
      s.status === "ACTIVE" &&
      s.signalStatus === "ACTIVE" &&
      !s.closeResult &&
      (s.realizedPips === undefined || s.realizedPips === 0)
    ) {
      return false;
    }
    return true;
  });

  const map = new Map<string, AISignal[]>();

  validSignals.forEach((sig) => {
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

/**
 * Deduplicates an array of AISignals by ID, strictly keeping one unique instance per id
 */
export function deduplicateSignals(signals: AISignal[]): AISignal[] {
  if (!Array.isArray(signals) || signals.length === 0) return [];
  const map = new Map<string, AISignal>();
  for (const s of signals) {
    if (s && s.id && !map.has(s.id)) {
      map.set(s.id, s);
    }
  }
  return Array.from(map.values());
}


