import React, { useState } from "react";
import {
  X,
  Trophy,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Target,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  XCircle,
  Scale,
} from "lucide-react";
import { AISignal } from "../types";
import {
  calculateDynamicHistoryWinRate,
  PeriodFilter,
  extractSignalPips,
} from "../utils/winratePipsCalculator";

interface SignalWinRateHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  signalsList: AISignal[];
  onSelectSignal?: (signal: AISignal) => void;
}

export const SignalWinRateHistoryModal: React.FC<SignalWinRateHistoryModalProps> = ({
  isOpen,
  onClose,
  signalsList,
  onSelectSignal,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("DAILY");
  const [outcomeFilter, setOutcomeFilter] = useState<"ALL" | "TP" | "SL" | "BE">("ALL");

  if (!isOpen) return null;

  const dynamicHistory = calculateDynamicHistoryWinRate(signalsList);
  const currentMetrics =
    selectedPeriod === "DAILY"
      ? dynamicHistory.daily
      : selectedPeriod === "WEEKLY"
      ? dynamicHistory.weekly
      : selectedPeriod === "MONTHLY"
      ? dynamicHistory.monthly
      : dynamicHistory.allTime;

  // Filter signals inside current period
  const filteredSignals = currentMetrics.signals.filter((sig) => {
    if (outcomeFilter === "ALL") return true;
    const { isWin, isLoss, isBe } = extractSignalPips(sig);
    if (outcomeFilter === "TP") return isWin;
    if (outcomeFilter === "SL") return isLoss;
    if (outcomeFilter === "BE") return isBe;
    return true;
  });

  const periods: { id: PeriodFilter; label: string; sub: string; icon: string }[] = [
    { id: "DAILY", label: "Daily (Harian)", sub: "24 Jam Terakhir", icon: "📅" },
    { id: "WEEKLY", label: "Weekly (Mingguan)", sub: "7 Hari Terakhir", icon: "📆" },
    { id: "MONTHLY", label: "Monthly (Bulanan)", sub: "30 Hari Terakhir", icon: "🗓️" },
    { id: "ALL", label: "All-Time", sub: "Semua Sinyal", icon: "🌐" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="winrate-history-modal"
        className="relative w-full max-w-2xl max-h-[90vh] bg-[#070c18] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-scaleUp"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-[#091022]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-cyan-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                  Riwayat Win Rate & Pips Sinyal
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wide">
                  REALTIME SYNC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Statistik dinamis Profit Pips, Loss Pips, Winrate, Hit TP, Hit SL, & Hit BE
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* 1. Period Selector Tabs (Daily, Weekly, Monthly, All-Time) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#040812] p-1.5 rounded-2xl border border-slate-800/90">
            {periods.map((p) => {
              const isSelected = selectedPeriod === p.id;
              const periodMetrics =
                p.id === "DAILY"
                  ? dynamicHistory.daily
                  : p.id === "WEEKLY"
                  ? dynamicHistory.weekly
                  : p.id === "MONTHLY"
                  ? dynamicHistory.monthly
                  : dynamicHistory.allTime;

              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPeriod(p.id)}
                  className={`flex flex-col items-center py-2.5 px-2 rounded-xl transition cursor-pointer text-center ${
                    isSelected
                      ? "bg-gradient-to-b from-cyan-950/80 to-[#0e1c3a] border border-cyan-500/50 shadow-md text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-bold">
                    <span>{p.icon}</span>
                    <span>{p.label.split(" ")[0]}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{p.sub}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] font-black">
                    <span className={periodMetrics.netPips >= 0 ? "text-emerald-400" : "text-rose-400"}>
                      {periodMetrics.netPips >= 0 ? `+${periodMetrics.netPips}p` : `${periodMetrics.netPips}p`}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-cyan-300">{periodMetrics.winRatePercent}% WR</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 2. Key 4 Pips & Win Rate Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Pips Profit */}
            <div className="rounded-2xl bg-gradient-to-br from-[#061e16] to-[#04100c] border border-emerald-500/30 p-3.5 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pips Profit</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                  +{currentMetrics.profitPips.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-500/80 mt-0.5">
                  Dari {currentMetrics.totalHitTpCount} kali target TP
                </div>
              </div>
            </div>

            {/* Pips Loss */}
            <div className="rounded-2xl bg-gradient-to-br from-[#240a10] to-[#120508] border border-rose-500/30 p-3.5 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-rose-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pips Loss</span>
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight">
                  -{currentMetrics.lossPips.toLocaleString()}
                </div>
                <div className="text-[10px] text-rose-400/80 mt-0.5">
                  Dari {currentMetrics.hitSlCount} kali kena Stop Loss
                </div>
              </div>
            </div>

            {/* Net Pips */}
            <div className="rounded-2xl bg-gradient-to-br from-[#091b2e] to-[#050e18] border border-cyan-500/30 p-3.5 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-cyan-300">
                <span className="text-[11px] font-bold uppercase tracking-wider">Net Pips</span>
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2">
                <div className={`text-xl sm:text-2xl font-black tracking-tight ${
                  currentMetrics.netPips >= 0 ? "text-cyan-300" : "text-rose-400"
                }`}>
                  {currentMetrics.netPips >= 0 ? `+${currentMetrics.netPips.toLocaleString()}` : currentMetrics.netPips.toLocaleString()}
                </div>
                <div className="text-[10px] text-cyan-400/80 mt-0.5">
                  Hasil akumulasi bersih
                </div>
              </div>
            </div>

            {/* Win Rate */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1f1906] to-[#0f0c03] border border-amber-500/30 p-3.5 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-amber-300">
                <span className="text-[11px] font-bold uppercase tracking-wider">Win Rate</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
                  {currentMetrics.winRatePercent}%
                </div>
                <div className="text-[10px] text-amber-400/80 mt-0.5">
                  {currentMetrics.totalHitTpCount} Win / {currentMetrics.totalClosedSignals} Total
                </div>
              </div>
            </div>
          </div>

          {/* 3. Hit Target Counts (Hit TP, Hit SL, Hit BE) Breakdown Card */}
          <div className="rounded-2xl bg-[#0a1020] border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>Rincian Frekuensi Eksekusi Target ({currentMetrics.label})</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Total Selesai: {currentMetrics.totalClosedSignals} sinyal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Hit TP Details */}
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Hit Take Profit</span>
                  </div>
                  <span className="text-sm font-black text-emerald-300 font-mono">
                    {currentMetrics.totalHitTpCount}x
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-emerald-500/20 grid grid-cols-2 gap-1 text-[10px] text-emerald-400/90 font-mono">
                  <div>TP1 (+50p): <b className="text-white">{currentMetrics.hitTp1Count}x</b></div>
                  <div>TP2 (+100p): <b className="text-white">{currentMetrics.hitTp2Count}x</b></div>
                  <div>TP3 (+150p): <b className="text-white">{currentMetrics.hitTp3Count}x</b></div>
                  <div>TP4 (+200p): <b className="text-white">{currentMetrics.hitTp4Count}x</b></div>
                </div>
              </div>

              {/* Hit SL Details */}
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Hit Stop Loss</span>
                    </div>
                    <span className="text-sm font-black text-rose-300 font-mono">
                      {currentMetrics.hitSlCount}x
                    </span>
                  </div>
                  <div className="text-[10px] text-rose-400/80 mt-1">
                    SL Maksimal 50 pips terproteksi
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-rose-500/20 text-[10px] text-rose-300 font-mono">
                  Akumulasi Loss: <b>-{currentMetrics.lossPips} pips</b>
                </div>
              </div>

              {/* Hit BE Details */}
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                      <Scale className="w-3.5 h-3.5" />
                      <span>Hit Break Even (BE)</span>
                    </div>
                    <span className="text-sm font-black text-blue-300 font-mono">
                      {currentMetrics.hitBeCount}x
                    </span>
                  </div>
                  <div className="text-[10px] text-blue-400/80 mt-1">
                    Proteksi BE (+30p) / Balik Entry (0 Loss)
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-500/20 text-[10px] text-blue-300 font-mono">
                  Hasil: <b>0 Pips (Bebas Risiko)</b>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Filter and Signal History Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Daftar Transaksi Selesai</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                  {filteredSignals.length} items
                </span>
              </div>

              {/* Outcome Filter Chips */}
              <div className="flex items-center gap-1 bg-[#040812] p-1 rounded-xl border border-slate-800 text-[11px]">
                <button
                  onClick={() => setOutcomeFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    outcomeFilter === "ALL"
                      ? "bg-slate-700 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Semua ({currentMetrics.totalClosedSignals})
                </button>
                <button
                  onClick={() => setOutcomeFilter("TP")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    outcomeFilter === "TP"
                      ? "bg-emerald-600 text-white"
                      : "text-emerald-400/80 hover:text-emerald-300"
                  }`}
                >
                  TP ({currentMetrics.totalHitTpCount})
                </button>
                <button
                  onClick={() => setOutcomeFilter("SL")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    outcomeFilter === "SL"
                      ? "bg-rose-600 text-white"
                      : "text-rose-400/80 hover:text-rose-300"
                  }`}
                >
                  SL ({currentMetrics.hitSlCount})
                </button>
                <button
                  onClick={() => setOutcomeFilter("BE")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    outcomeFilter === "BE"
                      ? "bg-blue-600 text-white"
                      : "text-blue-400/80 hover:text-blue-300"
                  }`}
                >
                  BE ({currentMetrics.hitBeCount})
                </button>
              </div>
            </div>

            {/* List of Historical Signals */}
            {filteredSignals.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#040812] border border-slate-800/80 text-center text-slate-500 text-xs">
                Belum ada sinyal yang ditutup untuk kategori ini pada periode {currentMetrics.label}.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSignals.map((sig) => {
                  const { pips, isWin, isLoss, isBe } = extractSignalPips(sig);

                  return (
                    <div
                      key={sig.id}
                      onClick={() => {
                        if (onSelectSignal) {
                          onSelectSignal(sig);
                          onClose();
                        }
                      }}
                      className="p-3 rounded-2xl bg-[#091122]/90 hover:bg-[#0e1a34] border border-slate-800/80 hover:border-cyan-500/40 transition flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      {/* Left side: Type & details */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                            sig.signalType.includes("BUY")
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          }`}
                        >
                          {sig.signalType.includes("BUY") ? "BUY" : "SELL"}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white group-hover:text-cyan-300 transition">
                              {sig.symbol || "XAUUSD"} {sig.signalType}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                              {sig.timeframe || "H1"}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Entry: ${sig.entryPrice.toFixed(2)}</span>
                            <span>•</span>
                            <span>{sig.formattedTimeWib || sig.timestamp}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Outcome Badge & Pips */}
                      <div className="text-right">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black font-mono ${
                            isWin
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : isLoss
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                          }`}
                        >
                          {isWin ? `+${pips} pips` : isLoss ? `${pips} pips` : "0 pips (BE)"}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                          {sig.signalStatus || (isWin ? "TP HIT" : isLoss ? "SL HIT" : "BREAK EVEN")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#060a16] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kalkulasi Otomatis & Terverifikasi Trading Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
