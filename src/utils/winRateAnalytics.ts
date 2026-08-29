import { Position } from "../types";

export interface PeriodStats {
  period: "ALL" | "DAILY" | "WEEKLY" | "MONTHLY";
  label: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number;
  totalProfitUsd: number;
  totalLossUsd: number;
  netProfitUsd: number;
  profitFactor: number;
  averageProfitUsd: number;
  averageLossUsd: number;
  riskRewardRatio: number;
  bestTradeUsd: number;
  worstTradeUsd: number;
  buyTrades: number;
  buyWinRate: number;
  sellTrades: number;
  sellWinRate: number;
}

export interface ComprehensiveWinRateMetrics {
  allTime: PeriodStats;
  daily: PeriodStats;
  weekly: PeriodStats;
  monthly: PeriodStats;
}

/**
 * Calculates accurate win rate and PnL performance stats for a given subset of closed positions.
 */
export function calculatePeriodStats(
  trades: Position[],
  period: PeriodStats["period"],
  label: string
): PeriodStats {
  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return {
      period,
      label,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: 0,
      totalProfitUsd: 0,
      totalLossUsd: 0,
      netProfitUsd: 0,
      profitFactor: 0,
      averageProfitUsd: 0,
      averageLossUsd: 0,
      riskRewardRatio: 0,
      bestTradeUsd: 0,
      worstTradeUsd: 0,
      buyTrades: 0,
      buyWinRate: 0,
      sellTrades: 0,
      sellWinRate: 0,
    };
  }

  let winningTrades = 0;
  let losingTrades = 0;
  let breakEvenTrades = 0;
  let totalProfitUsd = 0;
  let totalLossUsd = 0;
  let bestTradeUsd = -Infinity;
  let worstTradeUsd = Infinity;

  let buyTrades = 0;
  let buyWins = 0;
  let sellTrades = 0;
  let sellWins = 0;

  for (const t of trades) {
    const pnl = t.pnlUsd;
    if (pnl > 0.001) {
      winningTrades++;
      totalProfitUsd += pnl;
      if (t.type === "BUY") buyWins++;
      else sellWins++;
    } else if (pnl < -0.001) {
      losingTrades++;
      totalLossUsd += Math.abs(pnl);
    } else {
      breakEvenTrades++;
    }

    if (pnl > bestTradeUsd) bestTradeUsd = pnl;
    if (pnl < worstTradeUsd) worstTradeUsd = pnl;

    if (t.type === "BUY") buyTrades++;
    else sellTrades++;
  }

  if (bestTradeUsd === -Infinity) bestTradeUsd = 0;
  if (worstTradeUsd === Infinity) worstTradeUsd = 0;

  const netProfitUsd = Number((totalProfitUsd - totalLossUsd).toFixed(2));
  // Win rate excludes pure zero breakevens from numerator, but includes in total denominator
  const winRate = Number(((winningTrades / totalTrades) * 100).toFixed(1));
  const profitFactor = totalLossUsd > 0 ? Number((totalProfitUsd / totalLossUsd).toFixed(2)) : totalProfitUsd > 0 ? 99.9 : 0;

  const avgProfit = winningTrades > 0 ? Number((totalProfitUsd / winningTrades).toFixed(2)) : 0;
  const avgLoss = losingTrades > 0 ? Number((totalLossUsd / losingTrades).toFixed(2)) : 0;
  const riskReward = avgLoss > 0 ? Number((avgProfit / avgLoss).toFixed(2)) : avgProfit > 0 ? 2.5 : 0;

  const buyWinRate = buyTrades > 0 ? Number(((buyWins / buyTrades) * 100).toFixed(1)) : 0;
  const sellWinRate = sellTrades > 0 ? Number(((sellWins / sellTrades) * 100).toFixed(1)) : 0;

  return {
    period,
    label,
    totalTrades,
    winningTrades,
    losingTrades,
    breakEvenTrades,
    winRate,
    totalProfitUsd: Number(totalProfitUsd.toFixed(2)),
    totalLossUsd: Number(totalLossUsd.toFixed(2)),
    netProfitUsd,
    profitFactor,
    averageProfitUsd: avgProfit,
    averageLossUsd: avgLoss,
    riskRewardRatio: riskReward,
    bestTradeUsd: Number(bestTradeUsd.toFixed(2)),
    worstTradeUsd: Number(worstTradeUsd.toFixed(2)),
    buyTrades,
    buyWinRate,
    sellTrades,
    sellWinRate,
  };
}

/**
 * Filter positions according to actual timestamps (Today, This Week, This Month, All)
 */
export function calculateAllWinRateMetrics(closedPositions: Position[]): ComprehensiveWinRateMetrics {
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const ONE_WEEK_MS = 7 * ONE_DAY_MS;
  const ONE_MONTH_MS = 30 * ONE_DAY_MS;

  const dailyTrades = closedPositions.filter((p) => {
    const tradeTime = p.closedTimestamp || p.openedTimestamp || now;
    return now - tradeTime <= ONE_DAY_MS;
  });

  const weeklyTrades = closedPositions.filter((p) => {
    const tradeTime = p.closedTimestamp || p.openedTimestamp || now;
    return now - tradeTime <= ONE_WEEK_MS;
  });

  const monthlyTrades = closedPositions.filter((p) => {
    const tradeTime = p.closedTimestamp || p.openedTimestamp || now;
    return now - tradeTime <= ONE_MONTH_MS;
  });

  return {
    allTime: calculatePeriodStats(closedPositions, "ALL", "Semua Transaksi (All-Time)"),
    daily: calculatePeriodStats(dailyTrades, "DAILY", "Harian (24 Jam Terakhir)"),
    weekly: calculatePeriodStats(weeklyTrades, "WEEKLY", "Mingguan (7 Hari Terakhir)"),
    monthly: calculatePeriodStats(monthlyTrades, "MONTHLY", "Bulanan (30 Hari Terakhir)"),
  };
}
