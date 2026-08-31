import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  TrendingDown,
  TrendingUp,
  Calculator,
  Share2,
  Clock,
  ShieldAlert,
  Target,
  Sparkles,
  Activity,
  Layers,
} from "lucide-react";
import { AISignal, Timeframe } from "../types";
import { getTradingSessionInfo } from "../utils/sessionHelper";

interface SignalDetailViewProps {
  signal: AISignal;
  onBack: () => void;
  onOpenLotSimulation: () => void;
  onOpenShareSignal: () => void;
  onExecuteTrade?: (signal: AISignal) => void;
  livePrice?: number;
}

export const SignalDetailView: React.FC<SignalDetailViewProps> = ({
  signal,
  onBack,
  onOpenLotSimulation,
  onOpenShareSignal,
  onExecuteTrade,
  livePrice,
}) => {
  const [selectedTf, setSelectedTf] = useState<Timeframe>(signal.timeframe || "H1");
  const isBuy = signal.signalType.includes("BUY");
  const symbol = signal.symbol || "XAUUSD";

  const entry = signal.entryPrice;
  const sl = signal.stopLoss;
  const tp1 = signal.takeProfit1;
  const tp2 = signal.takeProfit2;
  const tp3 = signal.takeProfit3;
  const tp4 = signal.takeProfit4 || (isBuy ? entry + 20.0 : entry - 20.0);

  const currentLivePrice = livePrice && livePrice > 0 ? livePrice : entry;

  const isLive = signal.status === "ACTIVE";

  // Dynamic World Market Session calculation
  const sessionInfo = useMemo(() => {
    if (isLive) {
      return getTradingSessionInfo();
    }
    return getTradingSessionInfo(signal.formattedTimeWib || signal.timestamp || signal.session);
  }, [isLive, signal.formattedTimeWib, signal.timestamp, signal.session]);

  const session = sessionInfo.name;
  const timeStr = signal.formattedTimeWib || "2026-08-28 13:45:37 WIB";
  const zoneLow = (signal.entryZoneLow || (isBuy ? entry - 3.0 : entry)).toFixed(3);
  const zoneHigh = (signal.entryZoneHigh || (isBuy ? entry : entry + 3.0)).toFixed(3);

  // Real-time floating pips calculation
  const floatingPips = useMemo(() => {
    if (!currentLivePrice || !entry) return 0;
    const diff = isBuy ? currentLivePrice - entry : entry - currentLivePrice;
    return Math.round(diff * 10);
  }, [currentLivePrice, entry, isBuy]);

  // Status mapping
  const currentStatus = signal.signalStatus || (signal.status === "ACTIVE" ? "ACTIVE" : "SL HIT");

  const getStatusBadge = (status: string) => {
    if (isLive) {
      switch (status) {
        case "BE SET (+30p)":
          return "bg-cyan-500/30 text-cyan-300 border-cyan-400/60 animate-pulse font-black";
        case "TP1 HIT":
          return "bg-emerald-500/25 text-emerald-300 border-emerald-500/60 font-black";
        case "TP2 HIT":
          return "bg-teal-500/25 text-teal-300 border-teal-500/60 font-black";
        case "TP3 HIT":
          return "bg-cyan-500/25 text-cyan-300 border-cyan-500/60 font-black";
        case "TP4 HIT":
          return "bg-emerald-500/40 text-emerald-200 border-emerald-400/80 font-black";
        default:
          return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse font-black";
      }
    }

    // Historical Completed Badge
    switch (status) {
      case "TP1 HIT":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-600/50 font-bold";
      case "TP2 HIT":
        return "bg-teal-950/80 text-teal-300 border-teal-600/50 font-bold";
      case "TP3 HIT":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-500/50 font-bold";
      case "TP4 HIT":
        return "bg-emerald-900/90 text-emerald-200 border-emerald-400/80 font-black";
      case "BREAK EVEN":
        return "bg-blue-950/80 text-blue-300 border-blue-500/50 font-bold";
      case "SL HIT":
        return "bg-rose-950/80 text-rose-400 border-rose-600/50 font-bold";
      case "CLOSED":
      default:
        return "bg-slate-800/80 text-slate-300 border-slate-700";
    }
  };

  const getStatusLabel = (status: string) => {
    if (isLive) {
      if (status === "BE SET (+30p)") return "BE AKTIF (+30p)";
      if (status === "TP1 HIT") return "TP1 HIT · RUNNING (BE)";
      if (status === "TP2 HIT") return "TP2 HIT · RUNNING";
      if (status === "TP3 HIT") return "TP3 HIT · RUNNING";
      if (status === "TP4 HIT") return "TP4 HIT · RUNNING";
      return "LIVE RUNNING";
    }

    // Completed
    if (status === "TP1 HIT") return "TP1 WIN (+50p)";
    if (status === "TP2 HIT") return "TP2 WIN (+100p)";
    if (status === "TP3 HIT") return "TP3 WIN (+150p)";
    if (status === "TP4 HIT") return "TP4 WIN (+200p)";
    if (status === "BREAK EVEN") return "HIT BE · CLOSED (0p)";
    if (status === "SL HIT") return "SL HIT · CLOSED";
    return "CLOSED (RIWAYAT)";
  };

  // True mathematical price range bounding
  const allLevels = [sl, entry, tp1, tp2, tp3, tp4, currentLivePrice];
  const minRaw = Math.min(...allLevels);
  const maxRaw = Math.max(...allLevels);
  const padding = Math.max((maxRaw - minRaw) * 0.12, 1.5);
  const chartMin = minRaw - padding;
  const chartMax = maxRaw + padding;
  const chartRange = chartMax - chartMin || 10;

  // getY returns top% in CSS coordinates (0% is highest price at top, 100% is lowest price at bottom)
  const getY = (price: number) => {
    const pct = ((chartMax - price) / chartRange) * 100;
    return Math.max(4, Math.min(96, pct));
  };

  // Mock visual candles generated along the trajectory
  const mockCandleData = useMemo(() => {
    const step = isBuy ? 0.65 : -0.65;
    const base = entry - (isBuy ? 2.5 : -2.5);
    return [
      { open: base, close: base + step * 0.7, high: base + step * 1.1, low: base - 0.4 },
      { open: base + step * 0.7, close: base + step * 1.4, high: base + step * 1.7, low: base + step * 0.4 },
      { open: base + step * 1.4, close: base + step * 2.0, high: base + step * 2.3, low: base + step * 1.0 },
      { open: base + step * 2.0, close: base + step * 1.6, high: base + step * 2.4, low: base + step * 1.2 },
      { open: base + step * 1.6, close: base + step * 2.7, high: base + step * 3.0, low: base + step * 1.4 },
      { open: base + step * 2.7, close: base + step * 3.5, high: base + step * 3.9, low: base + step * 2.3 },
      { open: base + step * 3.5, close: base + step * 3.1, high: base + step * 3.8, low: base + step * 2.7 },
      { open: base + step * 3.1, close: base + step * 4.2, high: base + step * 4.6, low: base + step * 2.9 },
      { open: base + step * 4.2, close: base + step * 3.8, high: base + step * 4.5, low: base + step * 3.5 },
      { open: base + step * 3.8, close: currentLivePrice, high: Math.max(currentLivePrice, base + step * 4.5), low: Math.min(currentLivePrice, base + step * 3.4) },
    ].map((c) => ({
      ...c,
      isGreen: c.close >= c.open,
    }));
  }, [entry, isBuy, currentLivePrice]);

  return (
    <div
      id="signal-detail-view"
      className="w-full max-w-full lg:max-w-5xl xl:max-w-6xl mx-auto pb-28 pt-2 px-2 sm:px-4 md:px-6 text-slate-100 animate-fadeIn"
    >
      {/* Top Back Navigation (Matching screenshot: < Detail Signal) */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white transition font-medium text-sm sm:text-base py-1 px-1 -ml-1 cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-5 h-5 text-slate-300" />
          <span className="font-semibold tracking-tight">Detail Signal</span>
        </button>
      </div>

      {/* Main Signal Card (Matching dark deep blue card in screenshots) */}
      <div className="bg-gradient-to-b from-[#0e162c] to-[#080d1b] border border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
        {/* Signal Header Action Pill & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black tracking-wider uppercase border ${
                isBuy
                  ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
                  : "bg-rose-950/80 text-rose-400 border-rose-500/40"
              }`}
            >
              {isBuy ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isBuy ? "BUY" : "SELL"}
            </span>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">{symbol}</span>
          </div>

          <div className="flex items-center gap-2">
            {floatingPips !== 0 && (
              <span
                className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg border ${
                  floatingPips > 0
                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
                    : "bg-rose-950/80 text-rose-400 border-rose-500/40"
                }`}
              >
                {floatingPips > 0 ? `+${floatingPips}` : floatingPips} pips
              </span>
            )}
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-black tracking-wide border uppercase whitespace-nowrap ${getStatusBadge(
                currentStatus
              )}`}
            >
              {getStatusLabel(currentStatus)}
            </span>
          </div>
        </div>

        {/* Real-time Status & Execution Explanation Notice */}
        {(currentStatus.includes("TP") || currentStatus === "BE SET (+30p)" || signal.isBreakevenSet || currentStatus === "BREAK EVEN" || currentStatus === "SL HIT" || !isLive) && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-emerald-950/60 border border-cyan-500/40 text-xs">
            <div className="flex items-center gap-1.5 text-cyan-300 font-extrabold mb-1">
              <span className={`w-2 h-2 rounded-full ${isLive ? "bg-cyan-400 animate-ping" : "bg-emerald-400"}`} />
              <span>
                {isLive
                  ? currentStatus === "BE SET (+30p)"
                    ? "🛡️ POSISI LIVE: SUDAH PASANG BE (+30 PIPS)"
                    : currentStatus === "TP1 HIT"
                    ? "🎯 POSISI LIVE: TP1 HIT (+50 PIPS) · RUNNING"
                    : currentStatus === "TP2 HIT"
                    ? "🎯 POSISI LIVE: TP2 HIT (+100 PIPS) · RUNNING"
                    : currentStatus === "TP3 HIT"
                    ? "🎯 POSISI LIVE: TP3 HIT (+150 PIPS) · RUNNING"
                    : "⚡ POSISI LIVE SEDANG BERJALAN"
                  : currentStatus === "SL HIT"
                  ? "🛑 RIWAYAT: STOP LOSS HIT (CLOSED)"
                  : currentStatus === "BREAK EVEN"
                  ? "⚖️ RIWAYAT: HIT BREAK EVEN (CLOSED - 0 PIPS)"
                  : currentStatus.includes("TP")
                  ? `🏆 RIWAYAT: WIN ${signal.realizedPips ? `+${signal.realizedPips} PIPS` : "TARGET HIT"} (CLOSED)`
                  : "🔒 RIWAYAT: POSISI SELESAI (CLOSED)"}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isLive
                ? currentStatus === "BE SET (+30p)"
                  ? `Floating profit sudah +30 pips. Stop Loss otomatis dikunci di Entry ($${entry.toFixed(2)}) untuk posisi zero-risk!`
                  : currentStatus === "TP1 HIT"
                  ? `Target 1 tercapai (+50 pips). Amankan profit 50% lot, sisa lot dibiarkan running menuju TP2/3/4 dengan Stop Loss di Entry (BE).`
                  : `Posisi sedang aktif berjalan di pasar live XAU/USD. Terus pantau level Target dan Stop Loss.`
                : currentStatus === "SL HIT"
                ? `Posisi historis telah selesai karena menyentuh level Stop Loss ($${sl.toFixed(2)}).`
                : currentStatus === "BREAK EVEN"
                ? `Posisi historis telah selesai tanpa kerugian (0 pips) saat harga kembali ke titik Entry ($${entry.toFixed(2)}).`
                : currentStatus.includes("TP")
                ? `Sinyal telah sukses mencapai target profit (+${signal.realizedPips || 50} pips) dan telah diarsipkan dalam riwayat trading.`
                : `Sinyal telah selesai dan diarsipkan saat sinyal setup baru dirilis.`}
            </p>
          </div>
        )}

        {/* 4 Metric Grid (ENTRY, STOP LOSS, RISK / REWARD, SESI) */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-2 border-t border-slate-800/60 font-mono">
          <div>
            <div className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
              ENTRY
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-100 tracking-tight">
              {entry.toFixed(3)}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
              STOP LOSS
            </div>
            <div className="text-lg sm:text-xl font-black text-rose-500 tracking-tight">
              {sl.toFixed(3)}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
              RISK / REWARD
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-200">
              {signal.riskRewardRatio || "1 : 2.0"}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>SESI</span>
              {isLive && (
                <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-100 mt-0.5">
              {session}
            </div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5 leading-tight truncate">
              {sessionInfo.description.split(".")[0]}
            </div>
          </div>
        </div>

        {/* Take Profit Targets Breakdown List */}
        <div className="pt-2 border-t border-slate-800/60 space-y-2 font-mono text-xs sm:text-sm">
          {/* TP1 */}
          <div
            className={`flex items-center justify-between py-1 px-2 rounded-lg transition ${
              currentStatus === "TP1 HIT" || currentStatus === "TP2 HIT" || currentStatus === "TP3 HIT" || currentStatus === "TP4 HIT"
                ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300"
                : "text-slate-300"
            }`}
          >
            <span className="font-semibold flex items-center gap-1.5">
              {(currentStatus === "TP1 HIT" || currentStatus === "TP2 HIT" || currentStatus === "TP3 HIT" || currentStatus === "TP4 HIT") && (
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded">
                  HIT ✓
                </span>
              )}
              <span className="text-slate-400">TP1 ·</span>{" "}
              <span className="text-slate-100 font-bold">{tp1.toFixed(3)}</span>
            </span>
            <span className="font-black text-emerald-400">+50 pips</span>
          </div>

          {/* TP2 */}
          <div
            className={`flex items-center justify-between py-1 px-2 rounded-lg transition ${
              currentStatus === "TP2 HIT" || currentStatus === "TP3 HIT" || currentStatus === "TP4 HIT"
                ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300"
                : "text-slate-300"
            }`}
          >
            <span className="font-semibold flex items-center gap-1.5">
              {(currentStatus === "TP2 HIT" || currentStatus === "TP3 HIT" || currentStatus === "TP4 HIT") && (
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded">
                  HIT ✓
                </span>
              )}
              <span className="text-slate-400">TP2 ·</span>{" "}
              <span className="text-slate-100 font-bold">{tp2.toFixed(3)}</span>
            </span>
            <span className="font-black text-emerald-400">+100 pips</span>
          </div>

          {/* TP3 */}
          <div
            className={`flex items-center justify-between py-1 px-2 rounded-lg transition ${
              currentStatus === "TP3 HIT" || currentStatus === "TP4 HIT"
                ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300"
                : "text-slate-300"
            }`}
          >
            <span className="font-semibold flex items-center gap-1.5">
              {(currentStatus === "TP3 HIT" || currentStatus === "TP4 HIT") && (
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded">
                  HIT ✓
                </span>
              )}
              <span className="text-slate-400">TP3 ·</span>{" "}
              <span className="text-slate-100 font-bold">{tp3.toFixed(3)}</span>
            </span>
            <span className="font-black text-emerald-400">+150 pips</span>
          </div>

          {/* TP4 */}
          <div
            className={`flex items-center justify-between py-1 px-2 rounded-lg transition ${
              currentStatus === "TP4 HIT"
                ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300"
                : "text-slate-300"
            }`}
          >
            <span className="font-semibold flex items-center gap-1.5">
              {currentStatus === "TP4 HIT" && (
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded">
                  HIT ✓
                </span>
              )}
              <span className="text-slate-400">TP4 ·</span>{" "}
              <span className="text-slate-100 font-bold">{tp4.toFixed(3)}</span>
            </span>
            <span className="font-black text-emerald-400">+200 pips</span>
          </div>
        </div>

        {/* Mini Dynamic Chart Box matching screenshots */}
        <div className="mt-2 bg-[#050813] border border-slate-800 rounded-2xl p-3 relative overflow-hidden font-mono">
          {/* Chart Header */}
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">
                {symbol} · {selectedTf}
              </span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded border uppercase ${
                  isBuy
                    ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                    : "bg-rose-950/60 text-rose-400 border-rose-500/40"
                }`}
              >
                {signal.signalType}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Entry: {entry.toFixed(3)}</span>
              <span className="text-xs font-extrabold text-white bg-slate-800/80 px-2 py-0.5 rounded">
                ${currentLivePrice.toFixed(3)}
              </span>
            </div>
          </div>

          {/* Chart Visual Simulation with exact mathematical coordinates & zones */}
          <div className="relative h-64 w-full bg-[#03060f] rounded-xl overflow-hidden border border-slate-900">
            {/* Grid Lines in background */}
            <div className="absolute inset-0 grid grid-rows-4 grid-cols-6 pointer-events-none opacity-15">
              <div className="border-b border-r border-slate-700" />
              <div className="border-b border-r border-slate-700" />
              <div className="border-b border-r border-slate-700" />
              <div className="border-b border-r border-slate-700" />
              <div className="border-b border-r border-slate-700" />
              <div className="border-b border-slate-700" />
              <div className="border-b border-r border-slate-700" />
              <div className="border-b border-r border-slate-700" />
              <div className="border-b border-r border-slate-700" />
              <div className="border-b border-r border-slate-700" />
              <div className="border-b border-r border-slate-700" />
              <div className="border-b border-slate-700" />
              <div className="border-b border-r border-slate-700" />
              <div className="border-b border-r border-slate-700" />
              <div className="border-b border-r border-slate-700" />
              <div className="border-b border-r border-slate-700" />
              <div className="border-b border-r border-slate-700" />
              <div className="border-b border-slate-700" />
            </div>

            {/* 1. Take Profit Zone (Green shaded area from Entry to TP4) */}
            <div
              className="absolute left-0 right-0 bg-emerald-500/10 border-l-4 border-emerald-500/50 pointer-events-none transition-all duration-300 z-5"
              style={{
                top: `${Math.min(getY(entry), getY(tp4))}%`,
                height: `${Math.max(2, Math.abs(getY(tp4) - getY(entry)))}%`,
              }}
            >
              <span className="absolute top-1 right-2 text-[8px] sm:text-[9px] font-mono font-bold text-emerald-400/75 uppercase tracking-wider">
                Zona Profit Target (TP1-TP4)
              </span>
            </div>

            {/* 2. Stop Loss Protective Zone (Red shaded area from Entry to SL) */}
            <div
              className="absolute left-0 right-0 bg-rose-500/10 border-l-4 border-rose-500/50 pointer-events-none transition-all duration-300 z-5"
              style={{
                top: `${Math.min(getY(entry), getY(sl))}%`,
                height: `${Math.max(2, Math.abs(getY(sl) - getY(entry)))}%`,
              }}
            >
              <span className="absolute bottom-1 right-2 text-[8px] sm:text-[9px] font-mono font-bold text-rose-400/75 uppercase tracking-wider">
                Zona Proteksi SL
              </span>
            </div>

            {/* 3. Render Candlestick Simulation directly aligned with price scale */}
            <div className="absolute inset-x-6 inset-y-2 flex items-center justify-between z-10 pointer-events-none">
              {mockCandleData.map((c, idx) => {
                const yHigh = getY(c.high);
                const yLow = getY(c.low);
                const yTopBody = Math.min(getY(c.open), getY(c.close));
                const yBottomBody = Math.max(getY(c.open), getY(c.close));
                const bodyHeight = Math.max(3, yBottomBody - yTopBody);
                const wickHeight = Math.max(2, yLow - yHigh);

                return (
                  <div key={idx} className="relative h-full flex flex-col items-center w-3 sm:w-4">
                    {/* Wick */}
                    <div
                      className={`absolute w-0.5 ${c.isGreen ? "bg-emerald-400/80" : "bg-rose-400/80"}`}
                      style={{
                        top: `${yHigh}%`,
                        height: `${wickHeight}%`,
                      }}
                    />
                    {/* Real Body */}
                    <div
                      className={`absolute w-2.5 sm:w-3 rounded-xs shadow-sm ${
                        c.isGreen
                          ? "bg-emerald-500 border border-emerald-300"
                          : "bg-rose-500 border border-rose-300"
                      }`}
                      style={{
                        top: `${yTopBody}%`,
                        height: `${bodyHeight}%`,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* 4. Target & Protective Price Level Lines */}

            {/* Stop Loss Line */}
            <div
              className="absolute left-0 right-0 border-b border-dashed border-rose-500/90 flex items-center justify-between px-1.5 z-20 pointer-events-none"
              style={{ top: `${getY(sl)}%` }}
            >
              <span className="text-[9px] sm:text-[10px] font-mono font-black text-rose-400 bg-[#050813] border border-rose-500/60 px-1.5 py-0.2 rounded shadow -top-2.5 relative">
                🛑 SL {sl.toFixed(3)}
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono font-bold text-rose-400/90 bg-[#050813]/90 px-1 py-0.2 rounded -top-2.5 relative">
                -{signal.pipsSl || 50}p
              </span>
            </div>

            {/* Entry Price Line */}
            <div
              className="absolute left-0 right-0 border-b-2 border-dashed border-cyan-400 flex items-center justify-between px-1.5 z-20 pointer-events-none"
              style={{ top: `${getY(entry)}%` }}
            >
              <span className="text-[9px] sm:text-[10px] font-mono font-black text-cyan-300 bg-[#050813] border border-cyan-400/70 px-1.5 py-0.2 rounded shadow -top-2.5 relative">
                ⚡ ENTRY {entry.toFixed(3)}
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono font-bold text-cyan-300/90 bg-[#050813]/90 px-1 py-0.2 rounded -top-2.5 relative">
                Zona Masuk
              </span>
            </div>

            {/* TP1 Line */}
            <div
              className="absolute left-0 right-0 border-b border-dashed border-emerald-500/70 flex items-center justify-between px-1.5 z-20 pointer-events-none"
              style={{ top: `${getY(tp1)}%` }}
            >
              <span className="text-[9px] sm:text-[10px] font-mono font-black text-emerald-400 bg-[#050813] border border-emerald-500/50 px-1.5 py-0.2 rounded shadow -top-2.5 relative">
                🎯 TP1 {tp1.toFixed(3)}
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono font-bold text-emerald-400/90 bg-[#050813]/90 px-1 py-0.2 rounded -top-2.5 relative">
                +{signal.pipsTp1 || 50}p
              </span>
            </div>

            {/* TP2 Line */}
            <div
              className="absolute left-0 right-0 border-b border-dashed border-emerald-500/70 flex items-center justify-between px-1.5 z-20 pointer-events-none"
              style={{ top: `${getY(tp2)}%` }}
            >
              <span className="text-[9px] sm:text-[10px] font-mono font-black text-emerald-400 bg-[#050813] border border-emerald-500/50 px-1.5 py-0.2 rounded shadow -top-2.5 relative">
                🎯 TP2 {tp2.toFixed(3)}
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono font-bold text-emerald-400/90 bg-[#050813]/90 px-1 py-0.2 rounded -top-2.5 relative">
                +{signal.pipsTp2 || 100}p
              </span>
            </div>

            {/* TP3 Line */}
            <div
              className="absolute left-0 right-0 border-b border-dashed border-emerald-500/70 flex items-center justify-between px-1.5 z-20 pointer-events-none"
              style={{ top: `${getY(tp3)}%` }}
            >
              <span className="text-[9px] sm:text-[10px] font-mono font-black text-emerald-400 bg-[#050813] border border-emerald-500/50 px-1.5 py-0.2 rounded shadow -top-2.5 relative">
                🎯 TP3 {tp3.toFixed(3)}
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono font-bold text-emerald-400/90 bg-[#050813]/90 px-1 py-0.2 rounded -top-2.5 relative">
                +{signal.pipsTp3 || 150}p
              </span>
            </div>

            {/* TP4 Line */}
            <div
              className="absolute left-0 right-0 border-b border-dashed border-emerald-500/70 flex items-center justify-between px-1.5 z-20 pointer-events-none"
              style={{ top: `${getY(tp4)}%` }}
            >
              <span className="text-[9px] sm:text-[10px] font-mono font-black text-emerald-400 bg-[#050813] border border-emerald-500/50 px-1.5 py-0.2 rounded shadow -top-2.5 relative">
                🎯 TP4 {tp4.toFixed(3)}
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono font-bold text-emerald-400/90 bg-[#050813]/90 px-1 py-0.2 rounded -top-2.5 relative">
                +{signal.pipsTp4 || 200}p
              </span>
            </div>

            {/* Live Price Tag Indicator */}
            {Math.abs(currentLivePrice - entry) > 0.02 && (
              <div
                className="absolute left-0 right-0 border-b-2 border-dotted border-amber-400 flex items-center justify-end pr-2 z-25 pointer-events-none"
                style={{ top: `${getY(currentLivePrice)}%` }}
              >
                <span className="text-[8px] sm:text-[9px] font-mono font-black text-amber-300 bg-amber-950/90 border border-amber-500/60 px-1.5 py-0.2 rounded shadow -top-2.5 relative flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  LIVE ${currentLivePrice.toFixed(3)}
                </span>
              </div>
            )}
          </div>

          {/* Timeframe Selector Buttons (M15, H1, H4, D1) */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
            {(["M15", "H1", "H4", "D1"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTf(tf)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedTf === tf
                    ? "bg-sky-500 text-slate-950 shadow font-black"
                    : "bg-[#0c1222] text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Zona Entry & Timestamp */}
        <div className="pt-2 space-y-1 text-xs">
          <div className="text-slate-300 font-medium font-mono">
            Zona entry {zoneLow} - {zoneHigh}
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            {timeStr}
          </div>
        </div>

        {/* Action Buttons: Simulasi Lot & Equity + Bagikan Sinyal */}
        <div className="pt-2 space-y-2.5">
          <button
            id="btn-simulasi-lot-equity"
            onClick={onOpenLotSimulation}
            className="w-full py-3 bg-gradient-to-r from-cyan-400 via-sky-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-98 transition cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-slate-950" />
            <span>Simulasi Lot & Equity</span>
          </button>

          <button
            id="btn-bagikan-sinyal"
            onClick={onOpenShareSignal}
            className="w-full py-3 bg-gradient-to-r from-sky-600/80 to-blue-600/80 hover:from-sky-500 hover:to-blue-500 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-sky-500/40 active:scale-98 transition cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-sky-200" />
            <span>Bagikan Sinyal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
