import React, { useState } from "react";
import { AISignal, RiskSettings, SignalEngineMode, Tick, Timeframe } from "../types";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  Zap,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Sparkles,
  Sliders,
  Layers,
  Code2,
} from "lucide-react";

interface EntrySignalMenuProps {
  currentSignal: AISignal | null;
  currentTick: Tick;
  isScanning: boolean;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  onTriggerScan: () => void;
  riskSettings: RiskSettings;
  onToggleAutoExecute: () => void;
  onExecuteSignal: (signal: AISignal) => void;
  onSendToMobile: (signal: AISignal) => void;
  onEngineModeChange?: (mode: SignalEngineMode) => void;
}

const timeframes: Timeframe[] = ["M1", "M5", "M15", "H1", "H4", "D1"];

export const EntrySignalMenu: React.FC<EntrySignalMenuProps> = ({
  currentSignal,
  currentTick,
  isScanning,
  timeframe,
  onTimeframeChange,
  onTriggerScan,
  riskSettings,
  onToggleAutoExecute,
  onExecuteSignal,
  onSendToMobile,
  onEngineModeChange,
}) => {
  const [copied, setCopied] = useState(false);

  const activeEngineMode: SignalEngineMode = riskSettings.signalEngineMode || "TSS_SCRIPT";

  const isBuy = currentSignal?.signalType.includes("BUY");
  const isSell = currentSignal?.signalType.includes("SELL");
  const isHold = !isBuy && !isSell;

  // Calculate Entry Zone (with buffer depending on timeframe)
  const zoneBuffer = timeframe === "M1" ? 0.8 : timeframe === "M5" ? 1.5 : 2.5;
  const entryLower = currentSignal ? Number((currentSignal.entryPrice - zoneBuffer).toFixed(2)) : currentTick.price;
  const entryUpper = currentSignal ? Number((currentSignal.entryPrice + zoneBuffer).toFixed(2)) : currentTick.price;

  // Calculate Pips & USD estimates
  const slDist = currentSignal ? Math.abs(currentSignal.entryPrice - currentSignal.stopLoss) : 3.0;
  const tp1Dist = currentSignal ? Math.abs(currentSignal.takeProfit1 - currentSignal.entryPrice) : 4.5;
  const tp2Dist = currentSignal ? Math.abs(currentSignal.takeProfit2 - currentSignal.entryPrice) : 7.5;
  const tp3Dist = currentSignal ? Math.abs(currentSignal.takeProfit3 - currentSignal.entryPrice) : 12.0;

  const lot = currentSignal?.riskAssessment.recommendedLotSize || 0.1;
  const slUsdEst = Number((slDist * 100 * lot).toFixed(2));
  const tp1UsdEst = Number((tp1Dist * 100 * lot).toFixed(2));
  const tp2UsdEst = Number((tp2Dist * 100 * lot).toFixed(2));
  const tp3UsdEst = Number((tp3Dist * 100 * lot).toFixed(2));

  const handleCopyParams = () => {
    if (!currentSignal) return;
    const engineLabel =
      activeEngineMode === "TSS_SCRIPT"
        ? "TradingView Trend State Strategy (Pine v6)"
        : activeEngineMode === "AI_CONFLUENCE"
        ? "Gemini AI Institutional SMC Engine"
        : "Hybrid Dual Engine (TSS + AI Confluence)";

    const text = `🎯 *SINYAL TRADING XAU/USD (GOLD)* 🎯
━━━━━━━━━━━━━━━━━━━
⚙️ *Engine*: ${engineLabel}
⚡ *Timeframe*: ${timeframe}
📌 *Aksi*: ${currentSignal.signalType}
📊 *Zona Entry*: $${entryLower.toFixed(2)} - $${entryUpper.toFixed(2)}
🛑 *Stop Loss (SL)*: $${currentSignal.stopLoss.toFixed(2)} (-${(slDist * 10).toFixed(0)} pips)
🎯 *Take Profit 1*: $${currentSignal.takeProfit1.toFixed(2)} (+${(tp1Dist * 10).toFixed(0)} pips)
🎯 *Take Profit 2*: $${currentSignal.takeProfit2.toFixed(2)} (+${(tp2Dist * 10).toFixed(0)} pips)
🎯 *Take Profit 3*: $${currentSignal.takeProfit3.toFixed(2)} (+${(tp3Dist * 10).toFixed(0)} pips)
💰 *Rekomendasi Lot*: ${lot} Lot
⚖️ *Risk : Reward*: ${currentSignal.riskRewardRatio}
━━━━━━━━━━━━━━━━━━━
🔍 *Rencana Eksekusi*: ${currentSignal.executionPlan || currentSignal.primaryReason}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="w-full space-y-4 max-w-5xl mx-auto">
      {/* 1. Custom Engine Mode Selector Bar (Mencegah Tabrakan Sinyal) */}
      <div className="bg-[#0b1220] border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-xl space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold font-mono text-slate-200">
              Pilih Sumber Engine Sinyal:
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Bebas beralih kapan saja (tidak saling menimpa)
          </span>
        </div>

        {/* 3 Engine Mode Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Option 1: TradingView TSS Pine Script v6 */}
          <button
            onClick={() => onEngineModeChange?.("TSS_SCRIPT")}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activeEngineMode === "TSS_SCRIPT"
                ? "bg-[#00FFAA]/10 border-[#00FFAA] text-white shadow-lg shadow-[#00FFAA]/10 ring-1 ring-[#00FFAA]"
                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black font-mono flex items-center gap-1.5 text-[#00FFAA]">
                <Code2 className="w-4 h-4" />
                ⚡ TradingView TSS (Pine v6)
              </span>
              {activeEngineMode === "TSS_SCRIPT" && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#00FFAA] text-slate-950 font-mono">
                  AKTIF
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              Murni mengikuti Step Filter Breakout & ALMA Ribbon dari script TradingView.
            </p>
          </button>

          {/* Option 2: AI Gemini & SMC Confluence */}
          <button
            onClick={() => onEngineModeChange?.("AI_CONFLUENCE")}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activeEngineMode === "AI_CONFLUENCE"
                ? "bg-indigo-500/15 border-indigo-400 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-400"
                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black font-mono flex items-center gap-1.5 text-indigo-400">
                <Brain className="w-4 h-4" />
                🧠 Gemini AI & SMC Engine
              </span>
              {activeEngineMode === "AI_CONFLUENCE" && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500 text-white font-mono">
                  AKTIF
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              Menganalisis Order Block, Liquidity Sweeps, RSI, EMA, & Institutional Score.
            </p>
          </button>

          {/* Option 3: Hybrid Dual Confluence */}
          <button
            onClick={() => onEngineModeChange?.("HYBRID_DUAL")}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activeEngineMode === "HYBRID_DUAL"
                ? "bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-400"
                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black font-mono flex items-center gap-1.5 text-amber-400">
                <Layers className="w-4 h-4" />
                🛡️ Hybrid Dual (TSS + AI)
              </span>
              {activeEngineMode === "HYBRID_DUAL" && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-mono">
                  AKTIF
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              Filter ketat: hanya eksekusi jika TSS Script & AI SMC keduanya 100% sepakat.
            </p>
          </button>
        </div>
      </div>

      {/* 2. Header Toolbar: Timeframe Selector & Live Price */}
      <div className="bg-[#0e1322] border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Left: Timeframe Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold px-1">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Pilih Timeframe:</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {timeframes.map((tf) => (
              <button
                key={tf}
                id={`signal-menu-tf-${tf}`}
                onClick={() => onTimeframeChange(tf)}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black scale-105"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Scan AI Button & Auto Execute Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-scan-ai-menu"
            onClick={onTriggerScan}
            disabled={isScanning}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? `Menganalisa (${timeframe})...` : "⚡ Scan Sinyal Sekarang"}</span>
          </button>

          <button
            id="btn-toggle-auto-execute-menu"
            onClick={onToggleAutoExecute}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
              riskSettings.autoExecuteAI
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${riskSettings.autoExecuteAI ? "text-emerald-400 fill-emerald-400" : ""}`} />
            <span>Auto-Eksekusi: {riskSettings.autoExecuteAI ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* 3. Main High-Contrast Sinyal Entry Card */}
      {currentSignal && (
        <div
          id="main-entry-signal-card"
          className={`rounded-3xl border p-4 sm:p-6 shadow-2xl relative overflow-hidden transition-all ${
            isBuy
              ? "bg-gradient-to-b from-[#091f16] to-[#07130e] border-emerald-500/50 shadow-emerald-950/40"
              : isSell
              ? "bg-gradient-to-b from-[#240c11] to-[#140609] border-rose-500/50 shadow-rose-950/40"
              : "bg-gradient-to-b from-[#14151f] to-[#0a0c13] border-slate-700 shadow-slate-950/40"
          }`}
        >
          {/* Active Engine Badge Banner */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Sumber Engine:</span>
              <span
                className={`px-2.5 py-0.5 rounded-lg text-xs font-black font-mono tracking-wide ${
                  activeEngineMode === "TSS_SCRIPT"
                    ? "bg-[#00FFAA]/20 text-[#00FFAA] border border-[#00FFAA]/40"
                    : activeEngineMode === "AI_CONFLUENCE"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}
              >
                {activeEngineMode === "TSS_SCRIPT"
                  ? "⚡ TRADINGVIEW TSS STRAT (PINE SCRIPT v6)"
                  : activeEngineMode === "AI_CONFLUENCE"
                  ? "🧠 GEMINI AI & SMC INSTITUTIONAL"
                  : "🛡️ HYBRID DUAL (TSS + AI CONFLUENCE)"}
              </span>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              ID: <strong className="text-slate-200">{currentSignal.id}</strong> • {currentSignal.timestamp}
            </span>
          </div>

          {/* Top Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-lg ${
                  isBuy
                    ? "bg-emerald-500 text-slate-950 shadow-emerald-500/30"
                    : isSell
                    ? "bg-rose-500 text-white shadow-rose-500/30"
                    : "bg-amber-500 text-slate-950 shadow-amber-500/30"
                }`}
              >
                {isBuy ? (
                  <TrendingUp className="w-7 h-7 stroke-[2.5]" />
                ) : isSell ? (
                  <TrendingDown className="w-7 h-7 stroke-[2.5]" />
                ) : (
                  <Shield className="w-7 h-7 stroke-[2.5]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xl sm:text-2xl font-black tracking-wider uppercase ${
                      isBuy ? "text-emerald-400" : isSell ? "text-rose-400" : "text-amber-400"
                    }`}
                  >
                    {isBuy ? "ZONA BUY (LONG)" : isSell ? "ZONA SELL (SHORT)" : "ZONA WAIT / HOLD"}
                  </span>
                  <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-amber-500 text-slate-950">
                    {timeframe}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                  <span>Aset: <strong className="text-amber-400 font-mono">XAU/USD (Gold)</strong></span>
                  <span>•</span>
                  <span>Harga Saat Ini: <strong className="text-white font-mono">${currentTick.price.toFixed(2)}</strong></span>
                </p>
              </div>
            </div>

            {/* Confidence & WinRate Score */}
            <div className="flex items-center gap-2">
              {currentSignal.tssData && (
                <div className="text-right bg-slate-950/80 px-3 py-2 rounded-2xl border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 block font-medium">TSS Step Filter</span>
                  <div className="flex items-center justify-end gap-1.5 font-mono">
                    <span
                      className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                        currentSignal.tssData.trend === "BULLISH"
                          ? "bg-[#00FFAA]/20 text-[#00FFAA] border border-[#00FFAA]/40"
                          : "bg-[#FF0000]/20 text-[#FF0000] border border-[#FF0000]/40"
                      }`}
                    >
                      {currentSignal.tssData.trend}
                    </span>
                  </div>
                  <span className="text-[9px] text-amber-400 font-mono block mt-0.5">
                    Filter: ${currentSignal.tssData.filterPrice.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="text-right bg-black/40 px-3.5 py-2 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-400 block font-medium">Akurasi & Konfluensi</span>
                <div className="flex items-center justify-end gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span
                    className={`text-xl font-black font-mono ${
                      currentSignal.confidenceScore >= 85
                        ? "text-emerald-400"
                        : currentSignal.confidenceScore >= 75
                        ? "text-amber-400"
                        : "text-slate-300"
                    }`}
                  >
                    {currentSignal.confidenceScore}%
                  </span>
                </div>
                <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block">
                  {currentSignal.confidenceScore >= 85 ? "★ A+ High Probability" : "Standar Setup"}
                </span>
              </div>
            </div>
          </div>

          {/* 4. The 4 Big Core Trading Parameter Zones (Clean, Modern & High-Contrast) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-5">
            {/* Box 1: ZONA ENTRY */}
            <div className="bg-slate-900/90 rounded-2xl p-4 border-2 border-slate-700/80 shadow-lg relative flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  {isHold ? "ZONA ACUAN ENTRY" : "ZONA ENTRY (BUY/SELL)"}
                </span>
                <span className="text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
                  Ideal
                </span>
              </div>
              <div className="my-1">
                <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                  ${currentSignal.entryPrice.toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Area: ${entryLower.toFixed(2)} - ${entryUpper.toFixed(2)}
                </div>
              </div>
              <div className="text-[10px] text-cyan-300/80 bg-cyan-950/40 p-1.5 rounded-lg mt-2 border border-cyan-900/40 font-medium">
                Toleransi eksekusi aman spread Exness
              </div>
            </div>

            {/* Box 2: STOP LOSS (SL) */}
            <div className="bg-rose-950/30 rounded-2xl p-4 border-2 border-rose-500/60 shadow-lg relative flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  STOP LOSS (SL)
                </span>
                <span className="text-[9px] font-mono font-bold bg-rose-900/80 text-rose-200 px-1.5 py-0.5 rounded border border-rose-700">
                  Proteksi
                </span>
              </div>
              <div className="my-1">
                <div className="text-xl sm:text-2xl font-black font-mono text-rose-300 tracking-tight">
                  ${currentSignal.stopLoss.toFixed(2)}
                </div>
                <div className="text-[11px] text-rose-300/90 font-mono mt-0.5 flex items-center gap-2">
                  <span>-{(slDist * 10).toFixed(0)} Pips</span>
                  <span>•</span>
                  <span>Maks: -${slUsdEst} ({riskSettings.riskPerTradePercent}%)</span>
                </div>
              </div>
              <div className="text-[10px] text-rose-300/80 bg-rose-950/60 p-1.5 rounded-lg mt-2 border border-rose-900/60 font-medium">
                {activeEngineMode === "TSS_SCRIPT" ? "Level Step Filter Invalidation" : "Invalidasi struktur market / OB"}
              </div>
            </div>

            {/* Box 3: TAKE PROFIT 1 (TP1) */}
            <div className="bg-emerald-950/30 rounded-2xl p-4 border-2 border-emerald-500/60 shadow-lg relative flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  TAKE PROFIT 1 (TP1)
                </span>
                <span className="text-[9px] font-mono font-bold bg-emerald-900/80 text-emerald-200 px-1.5 py-0.5 rounded border border-emerald-700">
                  Scalp Safe
                </span>
              </div>
              <div className="my-1">
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300 tracking-tight">
                  ${currentSignal.takeProfit1.toFixed(2)}
                </div>
                <div className="text-[11px] text-emerald-300/90 font-mono mt-0.5 flex items-center gap-2">
                  <span>+{(tp1Dist * 10).toFixed(0)} Pips</span>
                  <span>•</span>
                  <span>Target: +${tp1UsdEst}</span>
                </div>
              </div>
              <div className="text-[10px] text-emerald-300/80 bg-emerald-950/60 p-1.5 rounded-lg mt-2 border border-emerald-900/60 font-medium">
                Kunci 50% profit & geser SL ke Breakeven (+0)
              </div>
            </div>

            {/* Box 4: TAKE PROFIT 2 (TP2 - RUNNER) */}
            <div className="bg-emerald-950/40 rounded-2xl p-4 border-2 border-emerald-400/80 shadow-lg relative flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  TAKE PROFIT 2 (TP2)
                </span>
                <span className="text-[9px] font-mono font-bold bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded">
                  R:R {currentSignal.riskRewardRatio}
                </span>
              </div>
              <div className="my-1">
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-200 tracking-tight">
                  ${currentSignal.takeProfit2.toFixed(2)}
                </div>
                <div className="text-[11px] text-emerald-300/90 font-mono mt-0.5 flex items-center gap-2">
                  <span>+{(tp2Dist * 10).toFixed(0)} Pips</span>
                  <span>•</span>
                  <span>Target: +${tp2UsdEst}</span>
                </div>
              </div>
              <div className="text-[10px] text-emerald-300/80 bg-emerald-950/60 p-1.5 rounded-lg mt-2 border border-emerald-900/60 font-medium">
                Target ekspansi likuiditas ALMA band utama
              </div>
            </div>
          </div>

          {/* 5. TP3 & Lot Recommendations Row */}
          <div className="bg-black/30 rounded-2xl p-3 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono mb-5">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">🎯 TP3 Extended:</span>
              <span className="text-white font-bold text-sm">${currentSignal.takeProfit3.toFixed(2)}</span>
              <span className="text-emerald-400 text-[11px]">(+{(tp3Dist * 10).toFixed(0)} pips / +${tp3UsdEst})</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Rekomendasi Lot Aman:</span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-lg font-black text-xs">
                {lot} LOT
              </span>
              <span className="text-slate-400 text-[11px]">(Saldo ${riskSettings.balance.toFixed(0)})</span>
            </div>
          </div>

          {/* 6. Quick One-Tap Action Buttons (Execute, Copy to MT5, Send to Phone) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Action 1: Execute Order Directly */}
            <button
              id="btn-execute-signal-now"
              onClick={() => onExecuteSignal(currentSignal)}
              disabled={isHold}
              className={`py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 cursor-pointer ${
                isBuy
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30"
                  : isSell
                  ? "bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30"
                  : "bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>
                {isBuy
                  ? `⚡ EKSEKUSI BUY SEKARANG (${lot} Lot)`
                  : isSell
                  ? `⚡ EKSEKUSI SELL SEKARANG (${lot} Lot)`
                  : "⏸️ HOLD (MENUNGGU KONFIRMASI)"}
              </span>
            </button>

            {/* Action 2: Copy Parameters for MT5 Mobile */}
            <button
              id="btn-copy-mt5-params"
              onClick={handleCopyParams}
              className="py-3.5 px-4 rounded-2xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>📋 Salin Parameter ke MT5 HP</span>
                </>
              )}
            </button>

            {/* Action 3: Push Notification to Mobile Phone */}
            <button
              id="btn-push-to-mobile"
              onClick={() => onSendToMobile(currentSignal)}
              className="py-3.5 px-4 rounded-2xl font-bold text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>📱 Kirim Sinyal ke Notifikasi HP</span>
            </button>
          </div>

          {/* 7. Analysis Rationale & Validation Checklist */}
          <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
            <div className="bg-black/40 rounded-2xl p-3.5 border border-white/10">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
                <Brain className="w-4 h-4" />
                <span>Analisa Arah & Rationale ({timeframe}):</span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed">
                {currentSignal.primaryReason}
              </p>
              {currentSignal.executionPlan && (
                <p className="text-amber-300/90 text-[11px] font-mono mt-1.5 pt-1.5 border-t border-white/5">
                  📌 Rencana Eksekusi: {currentSignal.executionPlan}
                </p>
              )}
            </div>

            {/* 6-Pillar Confluences Checklist */}
            {currentSignal.confluences && currentSignal.confluences.length > 0 && (
              <div className="bg-black/30 rounded-2xl p-3.5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    Pilar Validasi Konfluensi:
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {currentSignal.confluences.filter((c) => c.passed).length}/{currentSignal.confluences.length} Lolos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {currentSignal.confluences.map((c) => (
                    <div
                      key={c.id}
                      className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                        c.passed
                          ? "bg-emerald-950/20 border-emerald-500/30 text-slate-200"
                          : "bg-slate-900/50 border-slate-800 text-slate-400"
                      }`}
                    >
                      <span className="mt-0.5 shrink-0">
                        {c.passed ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        )}
                      </span>
                      <div className="overflow-hidden">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-200 truncate">{c.name}</span>
                          <span className="font-mono text-[10px] text-amber-400 font-bold shrink-0">
                            +{c.score}pt
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          {c.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
