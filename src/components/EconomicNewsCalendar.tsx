import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  Radio,
} from "lucide-react";
import {
  EconomicEvent,
  fetchLiveEconomicCalendar,
  getEconomicCalendarEvents,
  evaluateMarketNewsSafety,
  VolatilityStatus,
} from "../utils/economicNewsData";

interface EconomicNewsCalendarProps {
  onClose?: () => void;
  compact?: boolean;
}

export const EconomicNewsCalendar: React.FC<EconomicNewsCalendarProps> = ({
  onClose,
  compact = false,
}) => {
  const [events, setEvents] = useState<EconomicEvent[]>(() => getEconomicCalendarEvents());
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [impactFilter, setImpactFilter] = useState<"ALL" | "HIGH" | "MEDIUM">("ALL");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Baru saja");
  const [feedSource, setFeedSource] = useState<string>("ForexFactory Live Feed");

  // Load real-time economic calendar
  const loadCalendarData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true);
    try {
      const res = await fetchLiveEconomicCalendar();
      if (res.events && res.events.length > 0) {
        setEvents(res.events);
        setFeedSource(res.source || "ForexFactory Live Feed");
        const d = new Date();
        setLastSyncTime(
          `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")} WIB`
        );
      }
    } catch (e) {
      // Fallback already handled
    } finally {
      if (showLoading) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCalendarData(false);
  }, [loadCalendarData]);

  // Real-time polling: Refresh calendar every 45s, update clock every 5s for smooth countdown
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setNowMs(Date.now());
    }, 5000);

    const syncTimer = setInterval(() => {
      loadCalendarData(false);
    }, 45000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(syncTimer);
    };
  }, [loadCalendarData]);

  const newsSafety = useMemo(() => {
    return evaluateMarketNewsSafety(events, nowMs);
  }, [events, nowMs]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (impactFilter === "HIGH") return e.impact === "HIGH";
      if (impactFilter === "MEDIUM") return e.impact === "HIGH" || e.impact === "MEDIUM";
      return true;
    });
  }, [events, impactFilter]);

  const formatCountdown = (targetMs: number) => {
    const diffSec = Math.floor((targetMs - nowMs) / 1000);
    if (diffSec < 0 && diffSec > -1800) {
      return `🔴 Sedang Rilis (${Math.abs(Math.floor(diffSec / 60))}m lalu)`;
    }
    if (diffSec <= -1800) {
      return "✓ Selesai";
    }
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    if (h > 24) {
      const days = Math.floor(h / 24);
      return `${days} hari lagi`;
    }
    if (h > 0) {
      return `${h}j ${m}m lagi`;
    }
    return `${m} menit lagi`;
  };

  const getStatusVisuals = (status: VolatilityStatus) => {
    switch (status) {
      case "NO_TRADE_WINDOW":
        return {
          bg: "bg-rose-950/70 border-rose-500/70 text-rose-200",
          icon: ShieldAlert,
          iconColor: "text-rose-400 animate-bounce",
          badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          title: "ZONA MERAH: NO-TRADE WINDOW (HIGH VOLATILITY)",
        };
      case "CAUTION":
        return {
          bg: "bg-amber-950/70 border-amber-500/70 text-amber-200",
          icon: AlertTriangle,
          iconColor: "text-amber-400 animate-pulse",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          title: "WASPADA: MENDEKATI BERITA HIGH-IMPACT",
        };
      case "SAFE":
      default:
        return {
          bg: "bg-emerald-950/40 border-emerald-500/40 text-emerald-300",
          icon: ShieldCheck,
          iconColor: "text-emerald-400",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          title: "SAFE TO TRADE: KONDISI MAKRO AMAN",
        };
    }
  };

  const statusVisual = getStatusVisuals(newsSafety.status);
  const StatusIcon = statusVisual.icon;

  if (compact) {
    return (
      <div
        id="compact-economic-news-bar"
        className={`rounded-2xl border p-3.5 shadow-lg backdrop-blur-md transition-all ${statusVisual.bg}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <StatusIcon className={`w-5 h-5 shrink-0 ${statusVisual.iconColor}`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider">
                  {statusVisual.title}
                </span>
                {newsSafety.nearestEvent && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700">
                    ⏱️ {formatCountdown(newsSafety.nearestEvent.scheduledTimestamp)}
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-90 line-clamp-1 mt-0.5 font-medium">
                {newsSafety.message}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Feed
            </span>
            <span className="text-[10px] px-2 py-1 rounded-lg bg-black/40 border border-white/10 font-mono font-bold">
              XAU/USD
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="economic-news-calendar-panel"
      className="bg-[#0b101d] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl text-slate-100 space-y-4 animate-fadeIn"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-base tracking-tight">
                Kalender Berita Ekonomi (Red Folder News)
              </h3>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>REAL-TIME LIVE</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Sumber: {feedSource}</span>
              <span>•</span>
              <span className="text-slate-400">Sinkron: {lastSyncTime}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={() => loadCalendarData(true)}
            disabled={isRefreshing}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Perbarui Data Berita Terkini"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Filter Pills */}
          <div className="flex items-center bg-[#060a14] p-1 rounded-xl border border-slate-800 gap-1 text-xs">
            {(["ALL", "HIGH", "MEDIUM"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setImpactFilter(filter)}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  impactFilter === filter
                    ? "bg-amber-400 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {filter === "ALL" ? "Semua" : filter === "HIGH" ? "🔴 High Impact" : "🟡 Medium+"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Real-Time Volatility Safety Banner */}
      <div className={`p-4 rounded-2xl border transition shadow-lg ${statusVisual.bg}`}>
        <div className="flex items-start gap-3">
          <StatusIcon className={`w-6 h-6 shrink-0 mt-0.5 ${statusVisual.iconColor}`} />
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-black text-sm tracking-wide">{statusVisual.title}</h4>
              {newsSafety.nearestEvent && (
                <span className="px-2.5 py-0.5 rounded-full bg-black/50 border border-white/20 text-xs font-mono font-black">
                  ⏱️ {formatCountdown(newsSafety.nearestEvent.scheduledTimestamp)}
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed opacity-95 font-medium">{newsSafety.message}</p>
            <div className="text-[11.5px] font-semibold pt-1 border-t border-white/10 flex items-center gap-1.5">
              <span className="text-amber-300">💡 SOP Eksekusi:</span>
              <span>{newsSafety.recommendation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Events List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-semibold">
          <span>Jadwal Peristiwa Fundamental Terdekat</span>
          <span className="hidden sm:inline">Dampak Pada Harga Emas (XAU/USD)</span>
        </div>

        <div className="space-y-2">
          {filteredEvents.map((evt) => {
            const isExpanded = expandedEventId === evt.id;
            const isHigh = evt.impact === "HIGH";
            const diffMs = evt.scheduledTimestamp - nowMs;
            const isNear = Math.abs(diffMs) < 3600 * 1000 * 4;
            const isLiveNow = Math.abs(diffMs) <= 15 * 60 * 1000;
            const isPassed = diffMs < -15 * 60 * 1000;

            return (
              <div
                key={evt.id}
                className={`rounded-2xl border transition-all duration-200 ${
                  isLiveNow
                    ? "bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-500/10"
                    : isNear
                    ? "bg-[#0f172e] border-amber-500/40 shadow-md shadow-amber-500/5"
                    : "bg-[#080d1a] border-slate-800/80 hover:border-slate-700"
                }`}
              >
                {/* Event Summary Bar */}
                <div
                  onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                  className="p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    {/* Impact Flag */}
                    <div
                      className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-mono text-xs font-black shrink-0 ${
                        isHigh
                          ? "bg-rose-500/20 border border-rose-500/40 text-rose-400"
                          : "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                      }`}
                    >
                      <span className="text-[11px] leading-none">{evt.country}</span>
                      <span className="text-[8px] opacity-75">{evt.currency}</span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-100">
                          {evt.title}
                        </span>
                        <span
                          className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            isHigh
                              ? "bg-rose-950/80 text-rose-300 border-rose-600/40"
                              : "bg-amber-950/80 text-amber-300 border-amber-600/40"
                          }`}
                        >
                          {isHigh ? "HIGH IMPACT" : "MEDIUM"}
                        </span>
                        {isLiveNow && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                            SEDANG RILIS
                          </span>
                        )}
                        {isPassed && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            SELESAI
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                        <span className="flex items-center gap-1 text-slate-300 font-semibold">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {evt.dateStr}, {evt.timeStrWib}
                        </span>
                        <span>•</span>
                        <span
                          className={`font-bold ${
                            isLiveNow
                              ? "text-rose-400 animate-pulse"
                              : isPassed
                              ? "text-slate-500"
                              : "text-cyan-400"
                          }`}
                        >
                          {formatCountdown(evt.scheduledTimestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Numbers & Expand Arrow */}
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
                      {evt.actual && (
                        <div className="text-right p-1 px-2 rounded-lg bg-slate-900 border border-slate-700">
                          <span className="text-[9px] text-emerald-400 block uppercase font-bold">Aktual</span>
                          <span className="font-black text-white">{evt.actual}</span>
                        </div>
                      )}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block uppercase">Forecast</span>
                        <span className="font-bold text-slate-200">{evt.forecast}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block uppercase">Prev</span>
                        <span className="text-slate-400">{evt.previous}</span>
                      </div>
                    </div>

                    <button
                      className="p-1 rounded-lg text-slate-400 hover:text-white"
                      aria-label="Rincian"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 space-y-3 bg-[#060a14]/60 rounded-b-2xl text-xs">
                    <p className="text-slate-300 leading-relaxed">{evt.description}</p>

                    {/* Gold Impact Analysis */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Korelasi Terhadap Harga Emas (XAU/USD):</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed font-sans font-medium">
                        {evt.goldImpactEffect}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Kategori</span>
                        <span className="text-slate-200 font-bold">{evt.category}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Mata Uang</span>
                        <span className="text-emerald-400 font-bold">{evt.currency}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Forecast</span>
                        <span className="text-cyan-400 font-bold">{evt.forecast}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Sebelumnya</span>
                        <span className="text-slate-300 font-bold">{evt.previous}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
