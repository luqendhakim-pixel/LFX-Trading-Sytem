import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ChevronRight,
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

  // Real-time polling: Refresh calendar every 45s, update clock every 1s for live countdown
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

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
    if (diffSec < 0 && diffSec > -1200) {
      return `🔴 Rilis (${Math.abs(Math.floor(diffSec / 60))}m lalu)`;
    }
    if (diffSec <= -1200) {
      return "✓ Selesai";
    }
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    if (h >= 24) {
      const days = Math.floor(h / 24);
      return `${days} hari lagi`;
    }
    if (h > 0) {
      return `${h}j ${m}m lagi`;
    }
    return `${m}m lagi`;
  };

  const getStatusVisuals = (status: VolatilityStatus) => {
    switch (status) {
      case "NO_TRADE_WINDOW":
        return {
          bg: "bg-rose-950/60 border-rose-500/50 text-rose-200",
          icon: ShieldAlert,
          iconColor: "text-rose-400 animate-pulse",
          badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          tag: "ZONA MERAH (NO-TRADE)",
          title: "ZONA MERAH: NO-TRADE WINDOW (HIGH VOLATILITY)",
        };
      case "CAUTION":
        return {
          bg: "bg-amber-950/60 border-amber-500/50 text-amber-200",
          icon: AlertTriangle,
          iconColor: "text-amber-400 animate-pulse",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          tag: "WASPADA NEWS",
          title: "WASPADA: MENDEKATI BERITA HIGH-IMPACT",
        };
      case "SAFE":
      default:
        return {
          bg: "bg-emerald-950/35 border-emerald-500/40 text-emerald-300",
          icon: ShieldCheck,
          iconColor: "text-emerald-400",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          tag: "SAFE TO TRADE",
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
        className={`rounded-2xl border p-3 sm:p-3.5 shadow-lg transition-all group hover:border-cyan-500/50 ${statusVisual.bg}`}
      >
        <div className="flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Left: Status Icon, Title Tag, Countdown & Context */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 shadow-sm">
              <StatusIcon className={`w-4 h-4 ${statusVisual.iconColor}`} />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              {/* Header Badges Row */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wide text-white whitespace-nowrap">
                  {statusVisual.tag}
                </span>

                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border whitespace-nowrap hidden xs:inline-flex items-center gap-1 bg-slate-900/90 border-slate-700/80 text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Makro Aman</span>
                </span>

                {newsSafety.nearestEvent && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-950/90 border border-slate-700 text-amber-300 whitespace-nowrap shrink-0 flex items-center gap-1 shadow-inner">
                    <span>⏱️</span>
                    <span>{formatCountdown(newsSafety.nearestEvent.scheduledTimestamp)}</span>
                  </span>
                )}
              </div>

              {/* Subtitle Message */}
              <p className="text-[11px] text-slate-300/90 truncate font-medium">
                {newsSafety.message}
              </p>
            </div>
          </div>

          {/* Right: Live Feed & XAU/USD & Click Chevron */}
          <div className="shrink-0 flex items-center gap-1.5">
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-bold whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Feed
            </span>
            <span className="text-[10px] px-2 py-1 rounded-lg bg-black/50 border border-white/10 font-mono font-bold text-slate-200 whitespace-nowrap">
              XAU/USD
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition shrink-0 hidden xs:block" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5 min-w-0 pr-8 sm:pr-0">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight truncate">
                Kalender Berita Ekonomi
              </h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[9.5px] font-mono text-emerald-300 font-bold whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>LIVE FEED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls: Refresh & Filter Buttons (Presisi Sejajar & No-Wrap) */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          {/* Refresh Button */}
          <button
            onClick={() => loadCalendarData(true)}
            disabled={isRefreshing}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 shrink-0"
            title="Perbarui Data Berita Terkini"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>

          {/* Filter Pills Grid: 3 Tombol Sejajar Presisi */}
          <div className="grid grid-cols-3 bg-[#060a14] p-1 rounded-xl border border-slate-800 gap-1 text-[11px] sm:text-xs flex-1 sm:flex-initial sm:flex sm:items-center">
            {(["ALL", "HIGH", "MEDIUM"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setImpactFilter(filter)}
                className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap text-center flex items-center justify-center gap-1 ${
                  impactFilter === filter
                    ? "bg-amber-400 text-slate-950 shadow-md font-extrabold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {filter === "ALL" ? (
                  <span>Semua</span>
                ) : filter === "HIGH" ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0"></span>
                    <span>High Impact</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0"></span>
                    <span>Medium+</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Real-Time Volatility Safety Banner (Presisi & Rapi) */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border transition shadow-xl space-y-2.5 ${statusVisual.bg}`}>
        {/* Top Header Row: Icon, Title, Pill Status, Countdown Sejajar Presisi */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 shadow-sm">
              <StatusIcon className={`w-4 h-4 ${statusVisual.iconColor}`} />
            </div>
            <div className="min-w-0 flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h4 className="font-black text-xs sm:text-sm tracking-wide text-white uppercase">
                {statusVisual.title}
              </h4>
              <span className="text-[9.5px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Kondusif</span>
              </span>
            </div>
          </div>

          {newsSafety.nearestEvent && (
            <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
              <span className="px-2.5 py-1 rounded-xl bg-black/70 border border-white/15 text-[10.5px] sm:text-[11px] font-mono font-bold text-amber-300 whitespace-nowrap flex items-center gap-1 shadow-inner">
                <span>⏱️</span>
                <span>{formatCountdown(newsSafety.nearestEvent.scheduledTimestamp)}</span>
              </span>
            </div>
          )}
        </div>

        {/* Message */}
        <p className="text-xs leading-relaxed opacity-90 font-medium text-slate-200 pl-0.5">
          {newsSafety.message}
        </p>

        {/* SOP Execution Box */}
        <div className="text-[11.5px] p-2.5 rounded-xl bg-black/35 border border-white/10 flex items-start sm:items-center gap-2 shadow-inner">
          <span className="text-amber-300 font-bold shrink-0 flex items-center gap-1 whitespace-nowrap">
            <span>💡</span> SOP Eksekusi:
          </span>
          <span className="text-slate-300 font-medium leading-normal">
            {newsSafety.recommendation}
          </span>
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
                  className="p-3 sm:p-3.5 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none group"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    {/* Impact & Country Badge */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex flex-col items-center justify-center font-mono font-black shrink-0 shadow-inner mt-0.5 sm:mt-0 ${
                        isHigh
                          ? "bg-rose-500/15 border border-rose-500/40 text-rose-400"
                          : "bg-amber-500/15 border border-amber-500/40 text-amber-400"
                      }`}
                    >
                      <span className="text-[11px] leading-tight font-black">{evt.country}</span>
                      <span className="text-[8px] opacity-75 font-semibold leading-tight">{evt.currency}</span>
                    </div>

                    {/* Main Title & Metadata Details */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-100 group-hover:text-cyan-300 transition line-clamp-2 leading-snug">
                          {evt.title}
                        </span>
                        <div className="sm:hidden shrink-0 text-slate-400 group-hover:text-white transition">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {/* Structured Badges: Responsive Flex (Impact, Date & Time, Countdown) */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[9.5px] sm:text-[10.5px] font-mono">
                        {/* 1. Impact Level / Live Status */}
                        <div
                          className={`px-2 py-0.5 rounded-lg border font-bold shrink-0 shadow-sm ${
                            isLiveNow
                              ? "bg-rose-500 text-white font-black animate-pulse border-rose-400"
                              : isHigh
                              ? "bg-rose-950/90 text-rose-300 border-rose-500/40"
                              : "bg-amber-950/90 text-amber-300 border-amber-500/40"
                          }`}
                        >
                          {isLiveNow ? "🔥 LIVE NOW" : isHigh ? "HIGH IMPACT" : "MEDIUM"}
                        </div>

                        {/* 2. Date & Time */}
                        <div className="px-2 py-0.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 font-semibold flex items-center gap-1 shrink-0 shadow-sm">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 shrink-0" />
                          <span>{evt.dateStr}</span>
                          <span className="text-amber-300 font-bold">{evt.timeStrWib}</span>
                        </div>

                        {/* 3. Countdown / Selesai */}
                        <div
                          className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 font-bold shrink-0 shadow-sm ${
                            isPassed
                              ? "bg-slate-900 border-slate-700 text-slate-400"
                              : isLiveNow
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                              : isNear
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                          }`}
                        >
                          <span>{isPassed ? "✓" : "⏱️"}</span>
                          <span>
                            {isPassed ? "Selesai" : formatCountdown(evt.scheduledTimestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Right Side Numbers & Expand Button */}
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2.5 text-xs font-mono">
                      {evt.actual && (
                        <div className="text-right p-1 px-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40">
                          <span className="text-[9px] text-emerald-400 block uppercase font-bold">Aktual</span>
                          <span className="font-black text-white">{evt.actual}</span>
                        </div>
                      )}
                      <div className="text-right p-1 px-2 rounded-lg bg-slate-900/80 border border-slate-800">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">Forecast</span>
                        <span className="font-bold text-cyan-300">{evt.forecast}</span>
                      </div>
                      <div className="text-right p-1 px-2 rounded-lg bg-slate-900/80 border border-slate-800">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">Prev</span>
                        <span className="text-slate-400 font-semibold">{evt.previous}</span>
                      </div>
                    </div>

                    <div className="p-1 rounded-lg text-slate-400 group-hover:text-white transition">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
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
