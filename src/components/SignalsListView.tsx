import React, { useState, useMemo } from "react";
import {
  Sliders,
  TrendingUp,
  TrendingDown,
  Search,
  ChevronRight,
  Zap,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Radio,
  History,
  Calendar,
  RotateCcw,
  X,
} from "lucide-react";
import { AISignal } from "../types";
import { getTradingSessionName } from "../utils/sessionHelper";
import { DailyWinRateCalendarPicker } from "./DailyWinRateCalendarPicker";
import {
  formatDateKeyToIndo,
  getSignalDateKey,
  calculateWinRateForDate,
  toDateKey,
} from "../utils/winratePipsCalculator";

interface SignalsListViewProps {
  signalsList: AISignal[];
  onSelectSignal: (signal: AISignal) => void;
  onRefreshScan?: () => void;
  isScanning?: boolean;
  isSubscriptionActive?: boolean;
  onOpenPaywall?: () => void;
  currentPrice?: number;
}

export const SignalsListView: React.FC<SignalsListViewProps> = ({
  signalsList,
  onSelectSignal,
  onRefreshScan,
  isScanning = false,
  isSubscriptionActive = true,
  onOpenPaywall,
  currentPrice,
}) => {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const selectedDateMetrics = useMemo(() => {
    if (!selectedDateKey) return null;
    return calculateWinRateForDate(signalsList, selectedDateKey);
  }, [signalsList, selectedDateKey]);

  const filterTabs = [
    { id: "ALL", label: "Semua Sinyal" },
    { id: "ACTIVE", label: "🟢 Aktif (Live)" },
    { id: "TP_WIN", label: "🎯 TP Win" },
    { id: "HIT_BE", label: "⚖️ Hit BE (0p)" },
    { id: "SL_HIT", label: "🛑 SL Hit" },
  ];

  // Helper to format badge for history/closed and active items
  const getStatusBadge = (sig: AISignal) => {
    const isLive = sig.status === "ACTIVE";
    const status = sig.signalStatus || (isLive ? "ACTIVE" : "CLOSED");

    if (isLive) {
      const isBuy = sig.signalType.includes("BUY");
      const livePrice = currentPrice && currentPrice > 0 ? currentPrice : sig.entryPrice;
      const diff = isBuy ? livePrice - sig.entryPrice : sig.entryPrice - livePrice;
      const livePips = Math.round(diff * 10);

      if (livePips >= 200 || (isBuy ? livePrice >= sig.takeProfit4 : livePrice <= sig.takeProfit4) || status === "TP4 HIT") {
        return {
          label: "🏆 TP4 HIT MAX (+200p)",
          shortLabel: "🏆 TP4 (+200p)",
          className: "bg-emerald-500/30 text-emerald-200 border-emerald-400 font-black shadow-md shadow-emerald-500/20",
        };
      }
      if (livePips >= 150 || (isBuy ? livePrice >= sig.takeProfit3 : livePrice <= sig.takeProfit3) || status === "TP3 HIT") {
        return {
          label: "🎯 TP3 HIT · RUNNING",
          shortLabel: "🎯 TP3 HIT",
          className: "bg-cyan-500/25 text-cyan-300 border-cyan-500/60 font-black",
        };
      }
      if (livePips >= 100 || (isBuy ? livePrice >= sig.takeProfit2 : livePrice <= sig.takeProfit2) || status === "TP2 HIT") {
        return {
          label: "🎯 TP2 HIT · RUNNING",
          shortLabel: "🎯 TP2 HIT",
          className: "bg-teal-500/25 text-teal-300 border-teal-500/60 font-black",
        };
      }
      if (livePips >= 50 || (isBuy ? livePrice >= sig.takeProfit1 : livePrice <= sig.takeProfit1) || status === "TP1 HIT") {
        return {
          label: "🎯 TP1 HIT · RUNNING",
          shortLabel: "🎯 TP1 HIT",
          className: "bg-emerald-500/25 text-emerald-300 border-emerald-500/60 font-black",
        };
      }
      if (livePips >= 30 || sig.isBreakevenSet || status === "BE SET (+30p)") {
        return {
          label: "🛡️ BE AKTIF (+30p)",
          shortLabel: "🛡️ BE (+30p)",
          className: "bg-cyan-500/25 text-cyan-300 border-cyan-400/60 animate-pulse font-black",
        };
      }
      return {
        label: "⚡ LIVE RUNNING",
        shortLabel: "⚡ LIVE",
        className: "bg-emerald-500/25 text-emerald-400 border-emerald-500/50 animate-pulse font-black",
      };
    }

    // Completed / History Signals (Clear unambiguous final outcome)
    switch (status) {
      case "TP1 HIT":
        return {
          label: "TP1 WIN (+50p)",
          shortLabel: "TP1 (+50p)",
          className: "bg-emerald-950/80 text-emerald-400 border-emerald-600/40 font-bold",
        };
      case "TP2 HIT":
        return {
          label: "TP2 WIN (+100p)",
          shortLabel: "TP2 (+100p)",
          className: "bg-teal-950/80 text-teal-300 border-teal-600/40 font-bold",
        };
      case "TP3 HIT":
        return {
          label: "TP3 WIN (+150p)",
          shortLabel: "TP3 (+150p)",
          className: "bg-cyan-950/80 text-cyan-300 border-cyan-500/40 font-bold",
        };
      case "TP4 HIT":
        return {
          label: "TP4 MAX WIN (+200p)",
          shortLabel: "TP4 (+200p)",
          className: "bg-emerald-900/90 text-emerald-300 border-emerald-400/60 font-black",
        };
      case "BREAK EVEN":
        return {
          label: "HIT BE (0p)",
          shortLabel: "BE (0p)",
          className: "bg-blue-950/80 text-blue-300 border-blue-500/40 font-bold",
        };
      case "SL HIT":
        return {
          label: "SL HIT (-50p)",
          shortLabel: "SL (-50p)",
          className: "bg-rose-950/80 text-rose-400 border-rose-600/50 font-bold",
        };
      case "CLOSED":
      default:
        return {
          label: "CLOSED (SINYAL BARU)",
          shortLabel: "CLOSED",
          className: "bg-slate-800/80 text-slate-400 border-slate-700/60 font-medium",
        };
    }
  };

  // Find the single current active signal (if any)
  const activeSignal = signalsList.find((s) => s.status === "ACTIVE");

  const seenLive = new Set<string>();
  const filteredSignals = signalsList.filter((sig) => {
    // Filter dinamis berdasarkan tanggal kalender jika dipilih
    if (selectedDateKey) {
      const sigDateKey = getSignalDateKey(sig);
      if (sigDateKey !== selectedDateKey) return false;
    }

    const isLive = sig.status === "ACTIVE";
    const status = sig.signalStatus || (isLive ? "ACTIVE" : "CLOSED");

    if (filterType === "ACTIVE") {
      if (!isLive) return false;
      // Pastikan hanya 1 kartu sinyal aktif (Live Running) yang tampil
      if (seenLive.size > 0) return false;
      seenLive.add(sig.id);
    }
    if (filterType === "TP_WIN") {
      const isWin = status.includes("TP") || sig.closeResult === "WIN" || (typeof sig.realizedPips === "number" && sig.realizedPips > 0);
      if (!isWin) return false;
    }
    if (filterType === "SL_HIT") {
      const isLoss = status === "SL HIT" || sig.closeResult === "LOSS" || (typeof sig.realizedPips === "number" && sig.realizedPips < 0);
      if (!isLoss) return false;
    }
    if (filterType === "HIT_BE") {
      const isBe = status === "BREAK EVEN" || status === "BE SET (+30p)" || sig.closeResult === "BE" || sig.isBreakevenSet;
      if (!isBe) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSym = (sig.symbol || "XAUUSD").toLowerCase().includes(q);
      const matchAction = sig.signalType.toLowerCase().includes(q);
      const matchStatus = status.toLowerCase().includes(q);
      if (!matchSym && !matchAction && !matchStatus) return false;
    }

    return true;
  });

  return (
    <div
      id="signals-list-view"
      className="w-full max-w-full lg:max-w-7xl xl:max-w-[1600px] mx-auto pb-28 pt-2 px-2 sm:px-4 md:px-6 text-slate-100 space-y-4 sm:space-y-5 animate-fadeIn"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
            <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
            <span className="whitespace-nowrap">Signal Entry</span>
          </h2>
        </div>

        {/* Actions & Radar Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onRefreshScan && (
            <button
              onClick={onRefreshScan}
              disabled={isScanning}
              className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-[11px] sm:text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
              title="Hitung Ulang Sinyal & Riwayat dari Awal Data Candle"
            >
              <Zap className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${isScanning ? "animate-spin text-amber-400" : "text-cyan-400"}`} />
              <span className="whitespace-nowrap">
                {isScanning ? (
                  "Menghitung..."
                ) : (
                  <>
                    <span className="hidden sm:inline">Sinkron TradingView</span>
                    <span className="inline sm:hidden">Sinkron TV</span>
                  </>
                )}
              </span>
            </button>
          )}

          {/* Real-time Radar Status Indicator */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[11px] sm:text-xs font-bold shadow-sm whitespace-nowrap shrink-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="whitespace-nowrap">
              <span className="hidden sm:inline">Radar Live Aktif</span>
              <span className="inline sm:hidden">Radar Live</span>
            </span>
          </div>
        </div>
      </div>

      {/* Paywall Alert Banner if trial/subscription expired */}
      {!isSubscriptionActive && (
        <div
          onClick={onOpenPaywall}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-rose-950/80 border border-amber-500/50 flex items-center justify-between cursor-pointer hover:border-amber-400 transition shadow-lg animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-300">
                Masa Percobaan 7 Hari Telah Selesai
              </div>
              <div className="text-[11px] text-slate-300">
                Langganan Rp 150.000 / Bulan untuk membuka semua sinyal entry live.
              </div>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 text-xs font-black shrink-0">
            Buka VIP
          </span>
        </div>
      )}

      {/* SECTION 1: PROMINENT ACTIVE LIVE SIGNAL CARD */}
      {activeSignal &&
        filterType !== "TP_WIN" &&
        filterType !== "HIT_BE" &&
        filterType !== "SL_HIT" &&
        (!selectedDateKey || selectedDateKey === todayKey) && (() => {
        const rawSession = getTradingSessionName();
        const shortSession = rawSession.replace("London / New York", "London/NY").replace("Tokyo / London", "Tokyo/LDN");
        const activeBadge = getStatusBadge(activeSignal);

        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider whitespace-nowrap min-w-0">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400 shrink-0" />
                <span className="truncate">
                  <span className="hidden sm:inline">Sinyal Live Saat Ini (Sedang Berjalan)</span>
                  <span className="inline sm:hidden">Sinyal Live Aktif</span>
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-mono font-bold whitespace-nowrap shrink-0">
                1 POSISI AKTIF
              </span>
            </div>

            <div
              onClick={() => {
                if (!isSubscriptionActive && onOpenPaywall) {
                  onOpenPaywall();
                } else {
                  onSelectSignal(activeSignal);
                }
              }}
              className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#0c152e] via-[#091024] to-[#0a1226] border-2 border-emerald-500/40 shadow-xl shadow-emerald-950/20 hover:border-emerald-400/70 transition cursor-pointer relative overflow-hidden group"
            >
              {/* Header inside Card */}
              <div className="flex items-center justify-between gap-2 relative z-10">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <span
                    className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-xs font-black uppercase shrink-0 ${
                      activeSignal.signalType.includes("BUY")
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                        : "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                    }`}
                  >
                    {activeSignal.signalType.includes("BUY") ? "BUY" : "SELL"}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                      <span className="text-sm sm:text-base font-black text-white tracking-tight">
                        {activeSignal.symbol || "XAUUSD"}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        @ {!isSubscriptionActive ? "••••••" : activeSignal.entryPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                      <span>{activeSignal.timeframe || "H1"}</span>
                      <span>•</span>
                      <span className="text-cyan-300 font-semibold truncate">
                        <span className="hidden sm:inline">Sesi {rawSession}</span>
                        <span className="inline sm:hidden">Sesi {shortSession}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0 flex items-center">
                  <span
                    className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase border whitespace-nowrap shrink-0 ${
                      activeBadge.className
                    }`}
                  >
                    <span className="hidden sm:inline">{activeBadge.label}</span>
                    <span className="inline sm:hidden">{activeBadge.shortLabel || activeBadge.label}</span>
                  </span>
                </div>
              </div>

              {/* Price Targets Grid */}
            {(() => {
              const isBuy = activeSignal.signalType.includes("BUY");
              const livePrice = currentPrice && currentPrice > 0 ? currentPrice : activeSignal.entryPrice;
              const diff = isBuy ? livePrice - activeSignal.entryPrice : activeSignal.entryPrice - livePrice;
              const livePips = Math.round(diff * 10);

              const hitTp4 = livePips >= 200 || (isBuy ? livePrice >= activeSignal.takeProfit4 : livePrice <= activeSignal.takeProfit4) || activeSignal.signalStatus === "TP4 HIT";
              const hitTp3 = hitTp4 || livePips >= 150 || (isBuy ? livePrice >= activeSignal.takeProfit3 : livePrice <= activeSignal.takeProfit3) || activeSignal.signalStatus === "TP3 HIT";
              const hitTp2 = hitTp3 || livePips >= 100 || (isBuy ? livePrice >= activeSignal.takeProfit2 : livePrice <= activeSignal.takeProfit2) || activeSignal.signalStatus === "TP2 HIT";
              const hitTp1 = hitTp2 || livePips >= 50 || (isBuy ? livePrice >= activeSignal.takeProfit1 : livePrice <= activeSignal.takeProfit1) || activeSignal.signalStatus === "TP1 HIT";
              const isBe = hitTp1 || livePips >= 30 || activeSignal.isBreakevenSet || activeSignal.signalStatus === "BE SET (+30p)";

              return (
                <div className="grid grid-cols-5 gap-1.5 mt-3 pt-3 border-t border-slate-800/80 text-center font-mono">
                  <div className={`p-1.5 rounded-xl border ${isBe ? "bg-cyan-950/40 border-cyan-500/40" : "bg-slate-900/80 border-slate-800"}`}>
                    <div className={`text-[9.5px] font-bold ${isBe ? "text-cyan-300" : "text-rose-400"}`}>
                      {isBe ? "BE LOCK" : "SL (50p)"}
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold text-slate-200 mt-0.5 truncate">
                      {!isSubscriptionActive ? "••••" : (isBe ? activeSignal.entryPrice.toFixed(1) : activeSignal.stopLoss.toFixed(1))}
                    </div>
                  </div>
                  <div className={`p-1.5 rounded-xl border ${hitTp1 ? "bg-emerald-950/60 border-emerald-500/50" : "bg-slate-900/80 border-slate-800"}`}>
                    <div className="text-[9.5px] text-emerald-400 font-bold">
                      TP1 {hitTp1 ? "✓" : "+50p"}
                    </div>
                    <div className={`text-[11px] sm:text-xs font-bold mt-0.5 truncate ${hitTp1 ? "text-emerald-300 font-black" : "text-slate-200"}`}>
                      {!isSubscriptionActive ? "••••" : activeSignal.takeProfit1.toFixed(1)}
                    </div>
                  </div>
                  <div className={`p-1.5 rounded-xl border ${hitTp2 ? "bg-teal-950/60 border-teal-500/50" : "bg-slate-900/80 border-slate-800"}`}>
                    <div className="text-[9.5px] text-teal-400 font-bold">
                      TP2 {hitTp2 ? "✓" : "+100p"}
                    </div>
                    <div className={`text-[11px] sm:text-xs font-bold mt-0.5 truncate ${hitTp2 ? "text-teal-300 font-black" : "text-slate-200"}`}>
                      {!isSubscriptionActive ? "••••" : activeSignal.takeProfit2.toFixed(1)}
                    </div>
                  </div>
                  <div className={`p-1.5 rounded-xl border ${hitTp3 ? "bg-cyan-950/60 border-cyan-500/50" : "bg-slate-900/80 border-slate-800"}`}>
                    <div className="text-[9.5px] text-cyan-400 font-bold">
                      TP3 {hitTp3 ? "✓" : "+150p"}
                    </div>
                    <div className={`text-[11px] sm:text-xs font-bold mt-0.5 truncate ${hitTp3 ? "text-cyan-300 font-black" : "text-slate-200"}`}>
                      {!isSubscriptionActive ? "••••" : activeSignal.takeProfit3.toFixed(1)}
                    </div>
                  </div>
                  <div className={`p-1.5 rounded-xl border ${hitTp4 ? "bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border-emerald-400 shadow-md shadow-emerald-500/20" : "bg-slate-900/80 border-slate-800"}`}>
                    <div className={`text-[9.5px] font-bold ${hitTp4 ? "text-emerald-300 font-black" : "text-emerald-400"}`}>
                      TP4 {hitTp4 ? "🏆 MAX" : "+200p"}
                    </div>
                    <div className={`text-[11px] sm:text-xs font-bold mt-0.5 truncate ${hitTp4 ? "text-emerald-200 font-black" : "text-slate-200"}`}>
                      {!isSubscriptionActive ? "••••" : (activeSignal.takeProfit4?.toFixed(1) || "-")}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="mt-3 flex items-center justify-between text-[11px] text-cyan-300 font-bold pt-1">
              <span>Buka Visual Chart & Trajectory Sinyal →</span>
              <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
        );
      })()}

      {/* SECTION 2: SEARCH & FILTER TABS */}
      <div className="space-y-2.5 pt-2 relative">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Daftar Sinyal & Riwayat Selesai</span>
          </div>

          <div className="flex items-center gap-2">
            {selectedDateKey && (
              <button
                onClick={() => setSelectedDateKey(null)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                title="Tampilkan riwayat dari semua tanggal"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Semua Tanggal</span>
              </button>
            )}

            {/* Tombol Kalender di Atas Sesuai Tanda Kotak Merah User */}
            <button
              id="signals-history-calendar-btn"
              type="button"
              onClick={() => setIsCalendarOpen((prev) => !prev)}
              className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 border shrink-0 ${
                selectedDateKey
                  ? "bg-gradient-to-r from-cyan-500/30 via-emerald-500/25 to-cyan-500/30 text-cyan-200 border-cyan-400 font-black shadow-md shadow-cyan-950/40"
                  : isCalendarOpen
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60"
                  : "bg-[#0b1021] text-slate-300 hover:text-cyan-300 border-slate-800 hover:border-cyan-500/40"
              }`}
              title="Pilih Kalender Riwayat Sinyal"
            >
              <Calendar className={`w-3.5 h-3.5 ${selectedDateKey ? "text-cyan-300" : "text-cyan-400"}`} />
              <span>
                {selectedDateKey
                  ? formatDateKeyToIndo(selectedDateKey)
                  : "Kalender"}
              </span>
              {selectedDateKey && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDateKey(null);
                  }}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Hapus filter tanggal (Tampilkan Semua)"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Daily Winrate Calendar Popover Dropdown */}
        <DailyWinRateCalendarPicker
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          selectedDateKey={selectedDateKey}
          onSelectDate={(dateKey) => {
            setSelectedDateKey(dateKey);
            setIsCalendarOpen(false);
          }}
          signalsList={signalsList}
          positionClass="absolute right-0 top-10 z-50 w-[94vw] max-w-sm sm:w-88 p-4 rounded-2xl bg-[#080e1e] border border-cyan-500/40 shadow-2xl backdrop-blur-xl text-slate-100 animate-scaleUp"
          title="Kalender Riwayat Sinyal"
          subtitle="Pilih tanggal untuk melihat histori transaksi & winrate"
          resetLabel="Reset (Semua Tanggal)"
        />

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Cari sinyal XAUUSD, status, atau arah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#080d1e] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Horizontal Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                filterType === tab.id
                  ? "bg-cyan-500 text-slate-950 font-black shadow"
                  : "bg-[#0b1021] text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Date Filter Indicator & Stats Bar */}
        {selectedDateKey && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/60 via-[#080f22] to-emerald-950/40 border border-cyan-500/40 text-xs animate-fadeIn">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                  <span className="text-cyan-300 font-black">
                    Riwayat: {formatDateKeyToIndo(selectedDateKey)}
                  </span>
                  {selectedDateMetrics && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 font-mono font-bold border border-cyan-500/30">
                      {filteredSignals.length} dari {selectedDateMetrics.totalClosedSignals} Sinyal
                    </span>
                  )}
                </div>
                {selectedDateMetrics && (
                  <div className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5 font-mono flex-wrap">
                    <span className="text-emerald-400 font-bold">
                      Winrate {selectedDateMetrics.winRatePercent}%
                    </span>
                    <span className="text-slate-600">•</span>
                    <span
                      className={
                        selectedDateMetrics.netPips >= 0
                          ? "text-emerald-400 font-bold"
                          : "text-rose-400 font-bold"
                      }
                    >
                      Net {selectedDateMetrics.netPips >= 0 ? "+" : ""}
                      {selectedDateMetrics.netPips} Pips
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 text-[10px]">
                      ({selectedDateMetrics.totalHitTpCount}W / {selectedDateMetrics.hitSlCount}L /{" "}
                      {selectedDateMetrics.hitBeCount}BE)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedDateKey(null)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 transition cursor-pointer shrink-0"
              title="Kembali ke semua riwayat tanggal"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>Semua Tanggal</span>
            </button>
          </div>
        )}
      </div>

      {/* Signals List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
        {filteredSignals.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-[#0b1021] border border-slate-800 rounded-3xl text-slate-400 text-xs space-y-2">
            <div>
              {selectedDateKey
                ? `Tidak ada sinyal pada tanggal ${formatDateKeyToIndo(selectedDateKey)} dengan filter "${
                    filterTabs.find((t) => t.id === filterType)?.label || filterType
                  }".`
                : "Tidak ada sinyal dengan filter ini."}
            </div>
            {selectedDateKey && (
              <button
                onClick={() => {
                  setSelectedDateKey(null);
                  setFilterType("ALL");
                  setSearchQuery("");
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-500/30 transition cursor-pointer"
              >
                Reset Filter Tanggal (Tampilkan Semua)
              </button>
            )}
          </div>
        ) : (
          filteredSignals.map((sig) => {
            const isBuy = sig.signalType.includes("BUY");
            const price = sig.entryPrice.toFixed(3);
            const isLive = sig.status === "ACTIVE";
            const isLocked = !isSubscriptionActive && isLive;
            const badge = getStatusBadge(sig);

            return (
              <div
                key={sig.id}
                onClick={() => {
                  if (isLocked && onOpenPaywall) {
                    onOpenPaywall();
                  } else {
                    onSelectSignal(sig);
                  }
                }}
                className={`relative flex items-center justify-between p-3.5 bg-[#0b1021] hover:bg-[#0f172e] border ${
                  isLive ? "border-emerald-500/40 bg-emerald-950/10" : "border-slate-800/90"
                } rounded-2xl transition cursor-pointer active:scale-98 shadow-sm group ${
                  isLocked ? "opacity-75" : ""
                }`}
              >
                {/* Left Colored Accent Bar */}
                <div
                  className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full ${
                    isBuy ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                ></div>

                {/* Signal Action & Symbol */}
                <div className="flex items-center gap-2 pl-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase ${
                      isBuy
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/40"
                        : "bg-rose-950/80 text-rose-400 border border-rose-500/40"
                    }`}
                  >
                    {isBuy ? "BUY" : "SELL"}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-white">{sig.symbol || "XAUUSD"}</span>
                      {isLive && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-black border border-emerald-500/30">
                          LIVE
                        </span>
                      )}
                      {isLocked && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {sig.formattedTimeWib ? sig.formattedTimeWib.split(" ")[1] : sig.timestamp || "12:00"} WIB
                    </span>
                  </div>
                </div>

                {/* Price, Pips & Status Badge */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {typeof sig.realizedPips === "number" && !isLive && (
                    <span
                      className={`text-xs font-mono font-black shrink-0 ${
                        sig.realizedPips > 0
                          ? "text-emerald-400"
                          : sig.realizedPips < 0
                          ? "text-rose-400"
                          : "text-slate-400"
                      }`}
                    >
                      {sig.realizedPips > 0 ? `+${sig.realizedPips}` : sig.realizedPips}p
                    </span>
                  )}
                  <span className="font-mono font-bold text-xs sm:text-sm text-slate-200 shrink-0">
                    {isLocked ? "••••••" : price}
                  </span>
                  <span
                    className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9.5px] sm:text-[10px] font-black uppercase border whitespace-nowrap shrink-0 ${badge.className}`}
                  >
                    <span className="hidden sm:inline">{badge.label}</span>
                    <span className="inline sm:hidden">{badge.shortLabel || badge.label}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
