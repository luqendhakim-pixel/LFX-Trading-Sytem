import React from "react";
import { ExnessAccountConfig, RiskSettings, Tick } from "../types";
import { StreamStats } from "../services/realtimeMarket";
import { ComprehensiveWinRateMetrics } from "../utils/winRateAnalytics";
import { getTradingSessionInfo } from "../utils/sessionHelper";
import {
  Server,
  Zap,
  ShieldCheck,
  Smartphone,
  Volume2,
  VolumeX,
  Settings,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Lock,
  Radio,
  Trophy,
  Wifi,
} from "lucide-react";

interface TerminalHeaderProps {
  currentTick: Tick;
  streamStats?: StreamStats;
  accountConfig: ExnessAccountConfig;
  onOpenExnessModal: () => void;
  riskSettings: RiskSettings;
  soundEnabled: boolean;
  onToggleSound: () => void;
  winRateMetrics?: ComprehensiveWinRateMetrics;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  currentTick,
  streamStats,
  accountConfig,
  onOpenExnessModal,
  riskSettings,
  soundEnabled,
  onToggleSound,
  winRateMetrics,
}) => {
  const isPositive = currentTick.change >= 0;
  const sessionInfo = getTradingSessionInfo();

  return (
    <header
      id="terminal-header-topbar"
      className="sticky top-1 sm:top-1.5 z-40 px-2 sm:px-3.5 py-1.5 mx-auto w-full max-w-[1780px]"
    >
      <div className="bg-[#0b0f19] border border-slate-700/60 shadow-2xl shadow-black/70 rounded-2xl px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2 text-slate-200 select-none transition-all">
        {/* Left Section: Brand / Asset & Live Price Stream */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Compact Asset Logo & Title */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 shrink-0">
              AU
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-sm tracking-wide text-slate-100 whitespace-nowrap">
                  XAU/USD
                </span>
                <span className="text-[9px] font-bold bg-amber-500/15 text-amber-300 px-1 py-0.2 rounded border border-amber-500/30 hidden xs:inline-block">
                  AI PRO
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono hidden md:block">
                Autonomous Trade Engine
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800/80 hidden sm:block shrink-0"></div>

          {/* Real-time Bid / Ask & Spread Glass Pill */}
          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 px-2 sm:px-2.5 py-1 rounded-xl font-mono text-[11px] sm:text-xs shrink-0">
            {/* Live Pulsing Dot */}
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>

            {/* Price values */}
            <div className="flex items-center gap-1 font-bold">
              <span className="text-emerald-400">${currentTick.bid.toFixed(2)}</span>
              <span className="text-slate-600 hidden xs:inline">/</span>
              <span className="text-rose-400 hidden xs:inline">${currentTick.ask.toFixed(2)}</span>
            </div>

            {/* 24h Change & Spread */}
            <div className="hidden md:flex items-center gap-1.5 pl-1.5 border-l border-slate-800 text-[10px]">
              <span
                className={`flex items-center font-bold ${
                  isPositive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                )}
                {isPositive ? "+" : ""}
                {currentTick.changePercent.toFixed(2)}%
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-bold" title="Spread Pasar">
                {currentTick.spread.toFixed(1)}p
              </span>
            </div>
          </div>

          {/* Connection Stream Ping Status (Desktop) */}
          <div className="hidden 2xl:flex items-center gap-1.5 bg-emerald-950/30 border border-emerald-500/20 px-2 py-1 rounded-xl text-[10px] font-mono text-emerald-400 shrink-0">
            <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>
              {streamStats?.mode === "WEBSOCKET_DIRECT"
                ? "Direct WS"
                : streamStats?.mode === "SSE_STREAM"
                ? "MT5 SSE"
                : "Live 0s"}
            </span>
            <span className="text-slate-400 font-normal">({streamStats?.pingMs || 12}ms)</span>
          </div>
        </div>

        {/* Right Section: Exness Account, WinRate, Demo Balance & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Exness Account Connection Pill */}
          <button
            id="btn-open-exness-settings"
            onClick={onOpenExnessModal}
            className={`px-2 sm:px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 text-xs cursor-pointer ${
              accountConfig.isConnected
                ? "bg-slate-950/70 border-emerald-500/30 text-slate-200 hover:border-emerald-500/60 hover:bg-slate-900/80"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
            }`}
            title="Konfigurasi Akun Exness Login ID & Server"
          >
            <div className="relative shrink-0">
              <Server
                className={`w-3.5 h-3.5 ${
                  accountConfig.isConnected ? "text-emerald-400" : "text-amber-400 animate-pulse"
                }`}
              />
              {accountConfig.isConnected && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              )}
            </div>

            <div className="text-left font-mono leading-none">
              <span className="text-[9px] text-emerald-400 font-semibold block truncate max-w-[80px] sm:max-w-[110px]">
                {accountConfig.server}
              </span>
              <span className="font-bold text-[10px] sm:text-[11px] text-slate-200">
                {accountConfig.loginId}
              </span>
            </div>

            {accountConfig.isConnected && (
              <span className="hidden sm:inline-block text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-mono font-bold border border-emerald-500/30">
                {accountConfig.pingMs}ms
              </span>
            )}
          </button>

          {/* Dynamic World Market Session Pill */}
          <div
            id="header-market-session-pill"
            className="hidden md:flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/80 px-2 sm:px-2.5 py-1 rounded-xl text-xs select-none"
            title={`Sesi Dunia: ${sessionInfo.fullName} • ${sessionInfo.description}`}
          >
            <span className={`w-2 h-2 rounded-full ${sessionInfo.dotColor} animate-pulse shrink-0`}></span>
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <span className="text-slate-400 font-sans text-[10px]">Sesi:</span>
              <span className="font-bold text-slate-100">{sessionInfo.name}</span>
            </div>
          </div>

          {/* Win Rate Stats Pill */}
          {winRateMetrics && (
            <div
              id="header-winrate-pill"
              className="hidden lg:flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/80 px-2.5 py-1 rounded-xl text-xs font-mono select-none"
              title="Win Rate: Total, Daily (24h), Weekly (7h)"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-emerald-400 font-bold" title="All-Time Win Rate">
                  WR: {winRateMetrics.allTime.winRate}%
                </span>
                <span className="text-slate-700 hidden xl:inline">•</span>
                <span className="text-amber-300 font-bold hidden xl:inline" title="Daily (24 Jam) Win Rate">
                  24h: {winRateMetrics.daily.winRate}%
                </span>
              </div>
            </div>
          )}

          {/* Account Balance Pill */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-950/60 border border-slate-800/80 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-mono">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="leading-tight">
              <span className="text-[8px] sm:text-[9px] text-slate-400 block hidden xs:block">
                SALDO
              </span>
              <span className="font-extrabold text-emerald-400 text-[11px] sm:text-xs">
                ${riskSettings.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Sound Toggle Button */}
          <button
            id="header-toggle-sound"
            onClick={onToggleSound}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
              soundEnabled
                ? "bg-slate-950/80 border-slate-700 text-amber-400 hover:bg-slate-900 shadow-sm"
                : "bg-slate-950/50 border-slate-800/80 text-slate-500 hover:text-slate-300"
            }`}
            title={soundEnabled ? "Suara Aktif" : "Suara Senyap"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

