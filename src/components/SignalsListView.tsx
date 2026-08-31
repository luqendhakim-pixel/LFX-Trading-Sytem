import React, { useState } from "react";
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
} from "lucide-react";
import { AISignal } from "../types";
import { getTradingSessionName } from "../utils/sessionHelper";

interface SignalsListViewProps {
  signalsList: AISignal[];
  onSelectSignal: (signal: AISignal) => void;
  onRefreshScan?: () => void;
  isScanning?: boolean;
  isSubscriptionActive?: boolean;
  onOpenPaywall?: () => void;
}

export const SignalsListView: React.FC<SignalsListViewProps> = ({
  signalsList,
  onSelectSignal,
  isSubscriptionActive = true,
  onOpenPaywall,
}) => {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

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
      if (status === "BE SET (+30p)") {
        return {
          label: "🛡️ BE AKTIF (+30p)",
          className: "bg-cyan-500/25 text-cyan-300 border-cyan-400/60 animate-pulse font-black",
        };
      }
      if (status === "TP1 HIT") {
        return {
          label: "🎯 TP1 HIT · RUNNING",
          className: "bg-emerald-500/25 text-emerald-300 border-emerald-500/60 font-black",
        };
      }
      if (status === "TP2 HIT") {
        return {
          label: "🎯 TP2 HIT · RUNNING",
          className: "bg-teal-500/25 text-teal-300 border-teal-500/60 font-black",
        };
      }
      if (status === "TP3 HIT") {
        return {
          label: "🎯 TP3 HIT · RUNNING",
          className: "bg-cyan-500/25 text-cyan-300 border-cyan-500/60 font-black",
        };
      }
      return {
        label: "⚡ LIVE RUNNING",
        className: "bg-emerald-500/25 text-emerald-400 border-emerald-500/50 animate-pulse font-black",
      };
    }

    // Completed / History Signals (Clear unambiguous final outcome)
    switch (status) {
      case "TP1 HIT":
        return {
          label: "TP1 WIN (+50p)",
          className: "bg-emerald-950/80 text-emerald-400 border-emerald-600/40 font-bold",
        };
      case "TP2 HIT":
        return {
          label: "TP2 WIN (+100p)",
          className: "bg-teal-950/80 text-teal-300 border-teal-600/40 font-bold",
        };
      case "TP3 HIT":
        return {
          label: "TP3 WIN (+150p)",
          className: "bg-cyan-950/80 text-cyan-300 border-cyan-500/40 font-bold",
        };
      case "TP4 HIT":
        return {
          label: "TP4 MAX WIN (+200p)",
          className: "bg-emerald-900/90 text-emerald-300 border-emerald-400/60 font-black",
        };
      case "BREAK EVEN":
        return {
          label: "HIT BE (0p)",
          className: "bg-blue-950/80 text-blue-300 border-blue-500/40 font-bold",
        };
      case "SL HIT":
        return {
          label: "SL HIT (-50p)",
          className: "bg-rose-950/80 text-rose-400 border-rose-600/50 font-bold",
        };
      case "CLOSED":
      default:
        return {
          label: "CLOSED (SINYAL BARU)",
          className: "bg-slate-800/80 text-slate-400 border-slate-700/60 font-medium",
        };
    }
  };

  // Find the single current active signal (if any)
  const activeSignal = signalsList.find((s) => s.status === "ACTIVE");

  const filteredSignals = signalsList.filter((sig) => {
    const isLive = sig.status === "ACTIVE";
    const status = sig.signalStatus || (isLive ? "ACTIVE" : "CLOSED");

    if (filterType === "ACTIVE" && !isLive) return false;
    if (filterType === "TP_WIN" && !status.includes("TP")) return false;
    if (filterType === "SL_HIT" && status !== "SL HIT") return false;
    if (filterType === "HIT_BE" && status !== "BREAK EVEN") return false;

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>Signal Real-time XAU/USD</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Hanya 1 posisi aktif berjalan. Sinyal lama otomatis masuk riwayat (Closed).
          </p>
        </div>

        {/* Real-time Radar Status Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Radar Live Aktif</span>
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
      {activeSignal && filterType !== "TP_WIN" && filterType !== "HIT_BE" && filterType !== "SL_HIT" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>Sinyal Live Saat Ini (Sedang Berjalan)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
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
            className="p-4 rounded-2xl bg-gradient-to-br from-[#0c152e] via-[#091024] to-[#0a1226] border-2 border-emerald-500/40 shadow-xl shadow-emerald-950/20 hover:border-emerald-400/70 transition cursor-pointer relative overflow-hidden group"
          >
            {/* Ambient Background Accent */}

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                    activeSignal.signalType.includes("BUY")
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                      : "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  }`}
                >
                  {activeSignal.signalType.includes("BUY") ? "BUY" : "SELL"}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white tracking-tight">
                      {activeSignal.symbol || "XAUUSD"}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      @ {!isSubscriptionActive ? "••••••" : activeSignal.entryPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{activeSignal.timeframe || "H1"}</span>
                    <span>•</span>
                    <span className="text-cyan-300 font-semibold">
                      Sesi {getTradingSessionName()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase border whitespace-nowrap ${
                    getStatusBadge(activeSignal).className
                  }`}
                >
                  {getStatusBadge(activeSignal).label}
                </span>
              </div>
            </div>

            {/* Price Targets Grid */}
            <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center font-mono">
              <div className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-rose-400 font-bold">SL (50p)</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">
                  {!isSubscriptionActive ? "••••" : (activeSignal.isBreakevenSet ? `BE (${activeSignal.entryPrice.toFixed(1)})` : activeSignal.stopLoss.toFixed(2))}
                </div>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-emerald-400 font-bold">TP1 (+50p)</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">
                  {!isSubscriptionActive ? "••••" : activeSignal.takeProfit1.toFixed(2)}
                </div>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-teal-400 font-bold">TP2 (+100p)</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">
                  {!isSubscriptionActive ? "••••" : activeSignal.takeProfit2.toFixed(2)}
                </div>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-cyan-400 font-bold">TP3 (+150p)</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">
                  {!isSubscriptionActive ? "••••" : activeSignal.takeProfit3.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-cyan-300 font-bold pt-1">
              <span>Buka Visual Chart & Trajectory Sinyal →</span>
              <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: SEARCH & FILTER TABS */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Daftar Sinyal & Riwayat Selesai</span>
          </div>
        </div>

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
      </div>

      {/* Signals List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
        {filteredSignals.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-[#0b1021] border border-slate-800 rounded-3xl text-slate-400 text-xs">
            Tidak ada sinyal dengan filter ini.
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
                <div className="flex items-center gap-2">
                  {typeof sig.realizedPips === "number" && !isLive && (
                    <span
                      className={`text-xs font-mono font-black ${
                        sig.realizedPips > 0
                          ? "text-emerald-400"
                          : sig.realizedPips < 0
                          ? "text-rose-400"
                          : "text-slate-400"
                      }`}
                    >
                      {sig.realizedPips > 0 ? `+${sig.realizedPips}` : sig.realizedPips} p
                    </span>
                  )}
                  <span className="font-mono font-bold text-sm text-slate-200">
                    {isLocked ? "••••••" : price}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border whitespace-nowrap ${badge.className}`}
                  >
                    {badge.label}
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
