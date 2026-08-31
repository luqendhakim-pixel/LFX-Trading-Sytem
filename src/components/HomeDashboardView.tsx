import React, { useState, useMemo } from "react";
import {
  Bell,
  Settings,
  Smartphone,
  X,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Trophy,
  Bitcoin,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Sliders,
  DollarSign,
  ShieldCheck,
  Activity,
  Target,
  Scale,
  Calendar,
  BarChart3,
  CheckCircle2,
  XCircle,
  Layers,
} from "lucide-react";
import { AISignal, Timeframe, UserProfile, Candle } from "../types";
import { TradingViewWidget } from "./TradingViewWidget";
import { LfxLogo } from "./LfxLogo";
import { SignalWinRateHistoryModal } from "./SignalWinRateHistoryModal";
import { EconomicNewsCalendar } from "./EconomicNewsCalendar";
import { MultiTimeframeConfluenceGrid } from "./MultiTimeframeConfluenceGrid";
import { DailyWinRateCalendarPicker } from "./DailyWinRateCalendarPicker";
import {
  calculateDynamicHistoryWinRate,
  calculateWinRateForDate,
  formatDateKeyToIndo,
  PeriodFilter,
} from "../utils/winratePipsCalculator";

import { NavTab } from "./MobileAppNav";

interface HomeDashboardViewProps {
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onNavigateToTab: (tab: NavTab) => void;
  onSelectSignal: (signal: AISignal) => void;
  signalsList: AISignal[];
  currentSignal: AISignal | null;
  currentPrice?: number;
  candles?: Candle[];
  onOpenEducationModal: () => void;
  onOpenContestModal: () => void;
  onRequestPushNotification: () => void;
  pushNotificationEnabled: boolean;
  currentUser?: UserProfile | null;
  onOpenAuthModal?: () => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  onOpenNotifications,
  onOpenSettings,
  onNavigateToTab,
  onSelectSignal,
  signalsList,
  currentSignal,
  currentPrice = 4454.50,
  candles,
  onOpenEducationModal,
  onOpenContestModal,
  onRequestPushNotification,
  pushNotificationEnabled,
  currentUser,
  onOpenAuthModal,
}) => {
  const [showAndroidBanner, setShowAndroidBanner] = useState(true);
  const [activeWinRatePeriod, setActiveWinRatePeriod] = useState<PeriodFilter>("DAILY");
  const [selectedCustomDate, setSelectedCustomDate] = useState<string | null>(null);
  const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState(false);
  const [isWinRateModalOpen, setIsWinRateModalOpen] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [selectedTf, setSelectedTf] = useState<Timeframe>("H1");

  const isAdmin =
    currentUser?.role === "ADMIN" ||
    currentUser?.identifier === "luqendhakim@gmail.com" ||
    currentUser?.identifier === "08123456789";

  // Dynamic Winrate, Pips Profit/Loss, Hit TP/SL/BE calculations for all periods & custom date
  const dynamicHistory = useMemo(() => {
    return calculateDynamicHistoryWinRate(signalsList);
  }, [signalsList]);

  const activeMetrics = useMemo(() => {
    if (activeWinRatePeriod === "CUSTOM_DATE" && selectedCustomDate) {
      return calculateWinRateForDate(signalsList, selectedCustomDate);
    }
    switch (activeWinRatePeriod) {
      case "DAILY":
        return dynamicHistory.daily;
      case "WEEKLY":
        return dynamicHistory.weekly;
      case "MONTHLY":
        return dynamicHistory.monthly;
      case "ALL":
      default:
        return dynamicHistory.allTime;
    }
  }, [dynamicHistory, activeWinRatePeriod, selectedCustomDate, signalsList]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      case "TP1 HIT":
      case "TP2 HIT":
      case "TP3 HIT":
      case "TP4 HIT":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case "BREAK EVEN":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "SL HIT":
        return "bg-rose-950/60 text-rose-400 border-rose-600/40";
      case "CLOSED":
      default:
        return "bg-slate-800/80 text-slate-300 border-slate-700";
    }
  };

  return (
    <div
      id="home-dashboard-view"
      className="w-full max-w-full lg:max-w-7xl xl:max-w-[1600px] mx-auto pb-28 pt-2 px-2 sm:px-4 md:px-6 text-slate-100 space-y-4 sm:space-y-5 animate-fadeIn"
    >
      {/* Dynamic Winrate & Pips History Modal */}
      <SignalWinRateHistoryModal
        isOpen={isWinRateModalOpen}
        onClose={() => setIsWinRateModalOpen(false)}
        signalsList={signalsList}
        onSelectSignal={onSelectSignal}
        initialPeriod={activeWinRatePeriod}
        initialDateKey={selectedCustomDate}
      />

      {/* 0. Top Main Brand Header Bar with LFX Logo */}
      <div className="flex items-center justify-between py-2.5 px-3 sm:px-5 rounded-2xl bg-[#060a15] border border-slate-800/80 shadow-lg">
        {/* Left: LFX TRADING SYSTEM Official Logo */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => onNavigateToTab("BERANDA")}>
            <LfxLogo variant="full" className="h-10 sm:h-12 transition-transform group-hover:scale-105" />
          </div>
        </div>

        {/* Right: Live Market & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>XAU/USD LIVE</span>
          </div>

          <button
            id="btn-top-notif"
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-[#0e1529] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
            title="Notifikasi Sinyal"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>

          {/* Settings Button - Only displayed for ADMIN */}
          {isAdmin && (
            <button
              id="btn-top-settings"
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-[#0e1529] border border-amber-500/40 text-amber-300 hover:text-white hover:border-amber-400 transition cursor-pointer"
              title="Pengaturan Akun & Exness (Akses Admin)"
            >
              <Settings className="w-4 h-4 text-amber-400" />
            </button>
          )}
        </div>
      </div>

      {/* 1. User Profile Greeting Bar & Dynamic Winrate History Menu */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-1">
        {/* Left: User Avatar & Name (Conditional Admin / Member / Guest) */}
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-cyan-500 to-emerald-400 p-0.5 shadow-md flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#070c1e] rounded-full flex items-center justify-center text-amber-300 font-black text-sm">
                  LH
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                    Halo, LuqendIbnuHakim
                  </h2>
                  <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider">
                    ADMIN
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">lu••••••••@gmail.com</p>
              </div>
            </>
          ) : currentUser ? (
            <>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#070c1e] rounded-full flex items-center justify-center text-cyan-400 font-black text-sm">
                  {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : "MB"}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                    Halo, {currentUser.name || "Member Trader"}
                  </h2>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    {currentUser.status === "SUBSCRIBED" ? "PRO MEMBER" : "TRIAL MEMBER"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  {currentUser.identifier.includes("@")
                    ? `${currentUser.identifier.slice(0, 2)}••••••••@${currentUser.identifier.split("@")[1]}`
                    : `${currentUser.identifier.slice(0, 4)}••••••${currentUser.identifier.slice(-2)}`}
                </p>
              </div>
            </>
          ) : (
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={onOpenAuthModal}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#070c1e] rounded-full flex items-center justify-center text-cyan-400 font-black text-xs">
                  LFX
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm sm:text-base font-black text-white tracking-tight group-hover:text-cyan-300 transition">
                    LFX Trading System
                  </h2>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-slate-800 text-slate-300 border border-slate-700">
                    MASUK
                  </span>
                </div>
                <p className="text-xs text-slate-400">Signal & AI Technical Gold Analysis</p>
              </div>
            </div>
          )}
        </div>

        {/* Right (Red Box Area): Dynamic Winrate & Pips History Menu + Daily Calendar Picker */}
        <div
          id="winrate-history-menu-bar"
          className="relative flex items-center gap-1.5 bg-[#070e1c] border border-cyan-500/30 hover:border-cyan-500/60 p-1.5 rounded-2xl shadow-xl transition group"
        >
          {/* Quick Period Selector Tabs + Calendar Picker Button */}
          <div className="flex items-center bg-[#040812] rounded-xl p-0.5 border border-slate-800">
            {(["DAILY", "WEEKLY", "MONTHLY"] as PeriodFilter[]).map((periodKey) => {
              const isSelected = activeWinRatePeriod === periodKey && !selectedCustomDate;
              const shortLabel = periodKey === "DAILY" ? "Daily" : periodKey === "WEEKLY" ? "Weekly" : "Monthly";
              return (
                <button
                  key={periodKey}
                  onClick={() => {
                    setActiveWinRatePeriod(periodKey);
                    setSelectedCustomDate(null);
                    setIsCalendarPickerOpen(false);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  {shortLabel}
                </button>
              );
            })}

            {/* Daily Calendar Date Picker Button */}
            <button
              id="btn-calendar-daily-picker"
              onClick={() => setIsCalendarPickerOpen((prev) => !prev)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ml-0.5 border ${
                activeWinRatePeriod === "CUSTOM_DATE" && selectedCustomDate
                  ? "bg-cyan-500 text-black border-cyan-400 font-black shadow-md"
                  : isCalendarPickerOpen
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40 border-transparent"
              }`}
              title="Pilih Kalender Tanggal Harian"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {activeWinRatePeriod === "CUSTOM_DATE" && selectedCustomDate
                  ? formatDateKeyToIndo(selectedCustomDate).split(" ").slice(0, 2).join(" ")
                  : "Kalender"}
              </span>
            </button>
          </div>

          {/* Daily Winrate Calendar Popover */}
          <DailyWinRateCalendarPicker
            isOpen={isCalendarPickerOpen}
            onClose={() => setIsCalendarPickerOpen(false)}
            selectedDateKey={activeWinRatePeriod === "CUSTOM_DATE" ? selectedCustomDate : null}
            onSelectDate={(dateKey) => {
              if (dateKey) {
                setSelectedCustomDate(dateKey);
                setActiveWinRatePeriod("CUSTOM_DATE");
              } else {
                setSelectedCustomDate(null);
                setActiveWinRatePeriod("DAILY");
              }
            }}
            signalsList={signalsList}
          />

          {/* Detailed History Modal Open Button */}
          <button
            onClick={() => setIsWinRateModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/40 hover:border-cyan-400 text-xs font-black text-emerald-400 hover:text-cyan-300 transition shadow cursor-pointer"
            title="Buka Rincian Riwayat Winrate & Pips"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono">
              {activeMetrics.netPips >= 0 ? `+${activeMetrics.netPips}p` : `${activeMetrics.netPips}p`}
            </span>
            <span className="text-[10px] text-cyan-300 font-sans font-bold">
              ({activeMetrics.winRatePercent}%)
            </span>
            <BarChart3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition" />
          </button>
        </div>
      </div>

      {/* Responsive Grid on Laptop/Desktop: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left Column (Performa Sinyal & Live TradingView Chart) */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          {/* 2. Card Banner: PERFORMA SINYAL (Dynamically linked to selected period) */}
          <div
            onClick={() => setIsWinRateModalOpen(true)}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1630] via-[#091124] to-[#060a16] border border-slate-800/90 hover:border-cyan-500/40 p-4 sm:p-5 shadow-2xl transition cursor-pointer group"
          >
            <div className="relative z-10 space-y-3">
              {/* Top Row: Title, Winrate, & Net Pips */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <span className="text-[11px] sm:text-xs font-black tracking-wider text-slate-300 uppercase whitespace-nowrap">
                      PERFORMA SINYAL
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30 whitespace-nowrap">
                      {activeWinRatePeriod === "CUSTOM_DATE" && selectedCustomDate
                        ? `TANGGAL: ${formatDateKeyToIndo(selectedCustomDate).toUpperCase()}`
                        : activeWinRatePeriod === "DAILY"
                        ? "HARIAN (24 JAM)"
                        : activeWinRatePeriod === "WEEKLY"
                        ? "MINGGUAN (7 HARI)"
                        : activeWinRatePeriod === "MONTHLY"
                        ? "BULANAN (30 HARI)"
                        : "SEMUA WAKTU"}
                    </span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-emerald-400 font-mono">{activeMetrics.winRatePercent}% Win Rate</span>
                    <span className="text-slate-600">•</span>
                    <span>{activeMetrics.totalClosedSignals} Sinyal Selesai</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    activeMetrics.netPips >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {activeMetrics.netPips >= 0 ? `+${activeMetrics.netPips.toLocaleString()}` : activeMetrics.netPips.toLocaleString()} pips
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-end gap-1 group-hover:text-cyan-300 transition">
                    <span>Lihat Detail</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Quick Hit Counter Badges: 3 Sejajar Presisi (TP, SL, BE) */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-0.5 text-[9.5px] sm:text-[10.5px] font-mono font-bold">
                <span className="px-2 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center gap-1 whitespace-nowrap shadow-sm">
                  <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-400" />
                  <span>TP: {activeMetrics.totalHitTpCount}x (+{activeMetrics.profitPips}p)</span>
                </span>
                <span className="px-2 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center gap-1 whitespace-nowrap shadow-sm">
                  <XCircle className="w-3 h-3 shrink-0 text-rose-400" />
                  <span>SL: {activeMetrics.hitSlCount}x (-{activeMetrics.lossPips}p)</span>
                </span>
                <span className="px-2 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 flex items-center justify-center gap-1 whitespace-nowrap shadow-sm">
                  <Scale className="w-3 h-3 shrink-0 text-blue-400" />
                  <span>BE: {activeMetrics.hitBeCount}x</span>
                </span>
              </div>
            </div>

            {/* Radiant Neon Green Sparkline Chart across bottom */}
            <div className="mt-3 -mx-4 -mb-4 pt-2">
              <svg viewBox="0 0 300 50" className="w-full h-12 stroke-emerald-400 fill-emerald-500/10">
                <defs>
                  <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,45 Q30,42 60,38 T120,30 T180,32 T240,20 T300,10 L300,50 L0,50 Z"
                  fill="url(#sparklineGrad)"
                />
                <path
                  d="M0,45 Q30,42 60,38 T120,30 T180,32 T240,20 T300,10"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* 4. Live TradingView Chart Preview Section */}
          <div className="bg-[#080c18] border border-slate-800 rounded-3xl p-3 sm:p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white">XAU/USD</span>
              </div>

              <a
                href="https://www.tradingview.com/symbols/XAUUSD/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-mono font-bold"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>live • TradingView</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>

            {/* Timeframe pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["M1", "M5", "M15", "H1", "H4", "D1"] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTf(tf)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedTf === tf
                      ? "bg-sky-500 text-slate-950 shadow font-black"
                      : "bg-[#0d1326] text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {tf === "M1" ? "1m" : tf === "M5" ? "5m" : tf === "M15" ? "15m" : tf === "H1" ? "1H" : tf === "H4" ? "4H" : "D1"}
                </button>
              ))}
            </div>

            {/* Direct TradingView Widget Container */}
            <div className="w-full h-80 lg:h-[420px] rounded-2xl overflow-hidden border border-slate-800/80 bg-[#05070c]">
              <TradingViewWidget symbol="OANDA:XAUUSD" theme="dark" timeframe={selectedTf} />
            </div>
          </div>
        </div>

        {/* Right Column (News, Multi-Timeframe Matrix, & Sinyal Terbaru) */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5">
          {/* Modal: Full Economic News Calendar */}
          {isNewsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 animate-fadeIn">
              <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#080d1a] border border-slate-700 shadow-2xl p-1">
                <button
                  onClick={() => setIsNewsModalOpen(false)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <EconomicNewsCalendar onClose={() => setIsNewsModalOpen(false)} />
              </div>
            </div>
          )}

          {/* 2.6 Red Folder News Live Volatility Status Bar */}
          <div onClick={() => setIsNewsModalOpen(true)} className="cursor-pointer">
            <EconomicNewsCalendar compact={true} />
          </div>

          {/* 3. Android App / Realtime Push Notification Banner */}
          {showAndroidBanner && (
            <div className="relative flex items-center justify-between p-3 sm:p-3.5 bg-[#0f172a]/90 border border-amber-500/30 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    Notifikasi Sinyal Bilah Status HP
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Muncul di lockscreen & bar notifikasi HP saat diminimize
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onRequestPushNotification}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 shadow transition cursor-pointer"
                >
                  {pushNotificationEnabled ? "Aktif ✓" : "Aktifkan"}
                </button>
                <button
                  onClick={() => setShowAndroidBanner(false)}
                  className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 5. Matrix Konfluensi Multi-Timeframe (M1 - D1 Grid) */}
          <MultiTimeframeConfluenceGrid
            currentPrice={currentPrice}
            selectedTimeframe={selectedTf}
            onSelectTimeframe={(tf) => setSelectedTf(tf)}
          />

          {/* 6. Section: Signal Terbaru */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-slate-200">Signal Terbaru</h3>
              <button
                onClick={() => onNavigateToTab("SIGNAL")}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
              >
                Lihat semua
              </button>
            </div>

            {/* Signal Cards */}
            <div className="space-y-2">
              {signalsList.slice(0, 5).map((sig) => {
                const isBuy = sig.signalType.includes("BUY");
                const price = sig.entryPrice.toFixed(3);
                const status = sig.signalStatus || (sig.status === "ACTIVE" ? "ACTIVE" : "CLOSED");

                return (
                  <div
                    key={sig.id}
                    onClick={() => onSelectSignal(sig)}
                    className="relative flex items-center justify-between p-3.5 bg-[#0b1021] hover:bg-[#0f172e] border border-slate-800/90 rounded-2xl transition cursor-pointer active:scale-98 shadow-sm group"
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
                      <span className="font-extrabold text-sm text-white">{sig.symbol || "XAUUSD"}</span>
                    </div>

                    {/* Price, Pips & Status Badge */}
                    <div className="flex items-center gap-2.5">
                      {status !== "ACTIVE" && typeof sig.realizedPips === "number" && (
                        <span
                          className={`text-xs font-mono font-black ${
                            sig.realizedPips > 0
                              ? "text-emerald-400"
                              : sig.realizedPips < 0
                              ? "text-rose-400"
                              : "text-slate-400"
                          }`}
                        >
                          {sig.realizedPips > 0 ? `+${sig.realizedPips}` : sig.realizedPips} pips
                        </span>
                      )}
                      <span className="font-mono font-bold text-sm text-slate-200">{price}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getStatusBadge(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
