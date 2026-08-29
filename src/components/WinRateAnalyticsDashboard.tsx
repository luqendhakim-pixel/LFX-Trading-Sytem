import React, { useState } from "react";
import { Position } from "../types";
import {
  calculateAllWinRateMetrics,
  PeriodStats,
} from "../utils/winRateAnalytics";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Percent,
  DollarSign,
  Scale,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  ChevronDown,
  Sparkles,
} from "lucide-react";

interface WinRateAnalyticsDashboardProps {
  closedPositions: Position[];
}

export const WinRateAnalyticsDashboard: React.FC<WinRateAnalyticsDashboardProps> = ({
  closedPositions,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<"ALL" | "DAILY" | "WEEKLY" | "MONTHLY">("ALL");
  const metrics = calculateAllWinRateMetrics(closedPositions);
  const currentStat: PeriodStats =
    selectedPeriod === "ALL"
      ? metrics.allTime
      : selectedPeriod === "DAILY"
      ? metrics.daily
      : selectedPeriod === "WEEKLY"
      ? metrics.weekly
      : metrics.monthly;

  const periods: { id: "ALL" | "DAILY" | "WEEKLY" | "MONTHLY"; label: string; sub: string }[] = [
    { id: "ALL", label: "Semua Transaksi", sub: "Total Actual History" },
    { id: "DAILY", label: "Daily (Harian)", sub: "24 Jam Terakhir" },
    { id: "WEEKLY", label: "Weekly (Mingguan)", sub: "7 Hari Terakhir" },
    { id: "MONTHLY", label: "Monthly (Bulanan)", sub: "30 Hari Terakhir" },
  ];

  // Helper for win rate color badge
  const getWinRateColor = (rate: number) => {
    if (rate >= 70) return { text: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/40", bar: "bg-emerald-400" };
    if (rate >= 50) return { text: "text-teal-300", bg: "bg-teal-500/15", border: "border-teal-500/40", bar: "bg-teal-400" };
    if (rate >= 40) return { text: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/40", bar: "bg-amber-400" };
    return { text: "text-rose-400", bg: "bg-rose-500/15", border: "border-rose-500/40", bar: "bg-rose-500" };
  };

  const winRateColors = getWinRateColor(currentStat.winRate);

  return (
    <div
      id="win-rate-analytics-dashboard"
      className="bg-[#0f1420] border border-slate-800 rounded-xl p-4 shadow-xl text-slate-100 space-y-4"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm">
                Statistik Win Rate & Performa Transaksi Aktual
              </h3>
              <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                Live Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Analisis akurasi transaksi riil terminal (All-Time, Daily, Weekly, Monthly)
            </p>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center bg-[#0a0e1a] p-1 rounded-xl border border-slate-800/90 gap-1 text-xs">
          {periods.map((p) => {
            const isSelected = selectedPeriod === p.id;
            const periodStat =
              p.id === "ALL"
                ? metrics.allTime
                : p.id === "DAILY"
                ? metrics.daily
                : p.id === "WEEKLY"
                ? metrics.weekly
                : metrics.monthly;

            return (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex flex-col items-center sm:items-start ${
                  isSelected
                    ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
                title={p.sub}
              >
                <div className="flex items-center gap-1">
                  <span>{p.label}</span>
                  <span
                    className={`text-[9.5px] font-mono px-1 rounded ${
                      isSelected
                        ? "bg-slate-950/20 text-slate-950 font-bold"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {periodStat.winRate}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {/* Card 1: Win Rate Display */}
        <div
          className={`p-3 rounded-xl border col-span-2 sm:col-span-2 ${winRateColors.bg} ${winRateColors.border} flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider">
              Win Rate {currentStat.period === "ALL" ? "Total" : currentStat.period}
            </span>
            <Award className={`w-4 h-4 ${winRateColors.text}`} />
          </div>

          <div className="my-1.5 flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${winRateColors.text}`}>
              {currentStat.winRate}%
            </span>
            <span className="text-xs font-mono text-slate-400">
              ({currentStat.winningTrades} Win / {currentStat.totalTrades} Total)
            </span>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${winRateColors.bar}`}
              style={{ width: `${Math.max(4, currentStat.winRate)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Net Realized Profit */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
            Net Realized PnL
          </span>
          <div className="my-1">
            <span
              className={`text-lg font-black font-mono ${
                currentStat.netProfitUsd >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {currentStat.netProfitUsd >= 0 ? "+" : ""}${currentStat.netProfitUsd.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="text-emerald-400/90">+${currentStat.totalProfitUsd.toFixed(0)}</span>
            <span className="text-slate-600">/</span>
            <span className="text-rose-400/90">-${currentStat.totalLossUsd.toFixed(0)}</span>
          </div>
        </div>

        {/* Card 3: Profit Factor */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
            Profit Factor
          </span>
          <div className="my-1">
            <span className="text-lg font-black font-mono text-amber-400">
              {currentStat.profitFactor > 0 ? `${currentStat.profitFactor}x` : "N/A"}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {currentStat.profitFactor >= 2.0
              ? "Sangat Bagus (High Edge)"
              : currentStat.profitFactor >= 1.2
              ? "Menguntungkan"
              : "Dalam Evaluasi"}
          </span>
        </div>

        {/* Card 4: Win vs Loss Ratio */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
            Rasio Win / Loss
          </span>
          <div className="my-1 flex items-center gap-1.5 font-mono text-sm font-bold">
            <span className="text-emerald-400">{currentStat.winningTrades} W</span>
            <span className="text-slate-600">•</span>
            <span className="text-rose-400">{currentStat.losingTrades} L</span>
            {currentStat.breakEvenTrades > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400">{currentStat.breakEvenTrades} BE</span>
              </>
            )}
          </div>
          <span className="text-[10px] text-slate-400">
            Avg R:R ≈ 1:{currentStat.riskRewardRatio.toFixed(1)}
          </span>
        </div>

        {/* Card 5: Best & Worst Trade */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
            Best / Worst Trade
          </span>
          <div className="my-1 text-xs font-mono font-bold space-y-0.5">
            <div className="text-emerald-400 flex items-center justify-between">
              <span>Best:</span>
              <span>+${currentStat.bestTradeUsd.toFixed(2)}</span>
            </div>
            <div className="text-rose-400 flex items-center justify-between">
              <span>Worst:</span>
              <span>${currentStat.worstTradeUsd.toFixed(2)}</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Avg +${currentStat.averageProfitUsd.toFixed(0)} / -${currentStat.averageLossUsd.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Comparison Across All Horizons (Daily vs Weekly vs Monthly vs All-Time) */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            Perbandingan Win Rate Lintas Periode (Actual Trades):
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Dihitung otomatis saat transaksi ditutup (TP / SL / Manual)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Daily Card */}
          <div
            onClick={() => setSelectedPeriod("DAILY")}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              selectedPeriod === "DAILY"
                ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                : "bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-300"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Daily (24 Jam)</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">{metrics.daily.winRate}%</span>
            </div>
            <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400">
              <span>{metrics.daily.totalTrades} Trade ({metrics.daily.winningTrades}W - {metrics.daily.losingTrades}L)</span>
              <span className={metrics.daily.netProfitUsd >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {metrics.daily.netProfitUsd >= 0 ? "+" : ""}${metrics.daily.netProfitUsd.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Weekly Card */}
          <div
            onClick={() => setSelectedPeriod("WEEKLY")}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              selectedPeriod === "WEEKLY"
                ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                : "bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-300"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-sky-400" />
                <span>Weekly (7 Hari)</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">{metrics.weekly.winRate}%</span>
            </div>
            <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400">
              <span>{metrics.weekly.totalTrades} Trade ({metrics.weekly.winningTrades}W - {metrics.weekly.losingTrades}L)</span>
              <span className={metrics.weekly.netProfitUsd >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {metrics.weekly.netProfitUsd >= 0 ? "+" : ""}${metrics.weekly.netProfitUsd.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Monthly Card */}
          <div
            onClick={() => setSelectedPeriod("MONTHLY")}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              selectedPeriod === "MONTHLY"
                ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                : "bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-300"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-purple-400" />
                <span>Monthly (30 Hari)</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">{metrics.monthly.winRate}%</span>
            </div>
            <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400">
              <span>{metrics.monthly.totalTrades} Trade ({metrics.monthly.winningTrades}W - {metrics.monthly.losingTrades}L)</span>
              <span className={metrics.monthly.netProfitUsd >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {metrics.monthly.netProfitUsd >= 0 ? "+" : ""}${metrics.monthly.netProfitUsd.toFixed(2)}
              </span>
            </div>
          </div>

          {/* All-Time Card */}
          <div
            onClick={() => setSelectedPeriod("ALL")}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              selectedPeriod === "ALL"
                ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                : "bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-300"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>All-Time Total</span>
              </span>
              <span className="font-mono font-bold text-amber-400">{metrics.allTime.winRate}%</span>
            </div>
            <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400">
              <span>{metrics.allTime.totalTrades} Trade ({metrics.allTime.winningTrades}W - {metrics.allTime.losingTrades}L)</span>
              <span className={metrics.allTime.netProfitUsd >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {metrics.allTime.netProfitUsd >= 0 ? "+" : ""}${metrics.allTime.netProfitUsd.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
