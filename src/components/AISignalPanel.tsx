import React, { useState } from "react";
import { AISignal, RiskSettings, Timeframe } from "../types";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  Sparkles,
  Zap,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  AlertCircle,
  BarChart2,
  Lock,
  Clock,
} from "lucide-react";

interface AISignalPanelProps {
  currentSignal: AISignal | null;
  isScanning: boolean;
  timeframe: Timeframe;
  onTimeframeChange?: (tf: Timeframe) => void;
  onTriggerScan: () => void;
  riskSettings: RiskSettings;
  onToggleAutoExecute: () => void;
  onExecuteSignal: (signal: AISignal) => void;
  onSendToMobile: (signal: AISignal) => void;
}

const timeframes: Timeframe[] = ["M1", "M5", "M15", "H1", "H4", "D1"];

export const AISignalPanel: React.FC<AISignalPanelProps> = ({
  currentSignal,
  isScanning,
  timeframe,
  onTimeframeChange,
  onTriggerScan,
  riskSettings,
  onToggleAutoExecute,
  onExecuteSignal,
  onSendToMobile,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyParams = () => {
    if (!currentSignal) return;
    const text = `🚨 XAU/USD SIGNAL [TF: ${timeframe}] 🚨\nAction: ${currentSignal.signalType}\nEntry: $${currentSignal.entryPrice.toFixed(2)}\nSL: $${currentSignal.stopLoss.toFixed(2)}\nTP1: $${currentSignal.takeProfit1.toFixed(2)}\nTP2: $${currentSignal.takeProfit2.toFixed(2)}\nLot: ${currentSignal.riskAssessment.recommendedLotSize}\nRR: ${currentSignal.riskRewardRatio}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBuy = currentSignal?.signalType.includes("BUY");
  const isSell = currentSignal?.signalType.includes("SELL");

  return (
    <div
      id="ai-signal-panel"
      className="bg-[#0f1420] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden h-full"
    >
      {/* Background Accent Glow */}
      <div
        className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isBuy ? "bg-emerald-500" : isSell ? "bg-rose-500" : "bg-amber-500"
        }`}
      ></div>

      <div className="space-y-3.5">
        {/* Header with AI Badge & Scan Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-100 text-sm">Gemini AI Market Intel</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-semibold px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Instant &lt;10ms
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <span className="text-amber-400 font-mono font-medium">⚡ Turbo SMC Engine</span>
                <span>• Live Spot Confluence</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-re-scan-ai"
              onClick={onTriggerScan}
              disabled={isScanning}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 shadow-sm cursor-pointer"
              title="Scan AI instan (respon langsung tanpa jeda)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin text-amber-400" : ""}`} />
              {isScanning ? `Sync AI (${timeframe})...` : "⚡ Scan Instan AI"}
            </button>
          </div>
        </div>

        {/* Dynamic Timeframe Selector Bar for AI Analysis */}
        <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 px-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">Time Frame AI:</span>
          </div>
          <div className="flex items-center gap-1">
            {timeframes.map((tf) => (
              <button
                key={tf}
                id={`ai-tf-btn-${tf}`}
                onClick={() => onTimeframeChange?.(tf)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Current Signal Status */}
        {currentSignal ? (
          <div className="space-y-3.5">
            {/* Top Signal Card: Direction + Confidence */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                isBuy
                  ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                  : isSell
                  ? "bg-rose-950/30 border-rose-500/40 text-rose-300"
                  : "bg-slate-900/50 border-slate-700 text-slate-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md ${
                    isBuy
                      ? "bg-emerald-500 text-slate-950 shadow-emerald-500/20"
                      : isSell
                      ? "bg-rose-500 text-white shadow-rose-500/20"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {isBuy ? (
                    <TrendingUp className="w-6 h-6" />
                  ) : isSell ? (
                    <TrendingDown className="w-6 h-6" />
                  ) : (
                    <BarChart2 className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold tracking-wide uppercase">
                      {currentSignal.signalType.replace("_", " ")}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {timeframe}
                    </span>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700">
                      R:R {currentSignal.riskRewardRatio}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Trend: <strong className="text-slate-200">{currentSignal.trendDirection}</strong>{" "}
                    ({currentSignal.strength}% Strength)
                  </p>
                </div>
              </div>

              {/* Confidence Score Gauge */}
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Skor Konfluensi</span>
                <div className="flex items-center justify-end gap-1">
                  <span
                    className={`text-lg font-black font-mono ${
                      currentSignal.confidenceScore >= 85
                        ? "text-emerald-400"
                        : currentSignal.confidenceScore >= 75
                        ? "text-amber-400"
                        : "text-slate-400"
                    }`}
                  >
                    {currentSignal.confidenceScore}%
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 block font-mono">
                  {currentSignal.confidenceScore >= 85
                    ? "★ A+ Setup"
                    : currentSignal.confidenceScore >= 75
                    ? "Standard Setup"
                    : "⏸️ Waiting Confluence"}
                </span>
              </div>
            </div>

            {/* Price Targets Grid (Entry, SL, TP1, TP2) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">
                  {currentSignal.signalType === "HOLD" ? "ZONE REFERENCE" : "ENTRY PRICE"}
                </span>
                <span className="font-bold text-slate-100 text-sm">
                  ${currentSignal.entryPrice.toFixed(2)}
                </span>
              </div>

              <div className="bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/40">
                <span className="text-[10px] text-rose-400 block font-sans">
                  {currentSignal.signalType === "HOLD" ? "INVALIDATION" : "STOP LOSS (SL)"}
                </span>
                <span className="font-bold text-rose-300 text-sm">
                  ${currentSignal.stopLoss.toFixed(2)}
                </span>
              </div>

              <div className="bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/40">
                <span className="text-[10px] text-emerald-400 block font-sans">
                  {currentSignal.signalType === "HOLD" ? "KEY TARGET 1" : "TAKE PROFIT 1"}
                </span>
                <span className="font-bold text-emerald-300 text-sm">
                  ${currentSignal.takeProfit1.toFixed(2)}
                </span>
              </div>

              <div className="bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/40">
                <span className="text-[10px] text-emerald-400 block font-sans">
                  {currentSignal.signalType === "HOLD" ? "RUNNER TARGET" : "RUNNER TP 2"}
                </span>
                <span className="font-bold text-emerald-300 text-sm">
                  ${currentSignal.takeProfit2.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 5-Pillar Confluence Checklist */}
            {currentSignal.confluences && currentSignal.confluences.length > 0 && (
              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <Shield className="w-3.5 h-3.5" />
                    <span>5 Pilar Konfluensi Pasar ({timeframe}):</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                    {currentSignal.confluences.filter((c) => c.passed).length}/5 Lolos Validasi
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {currentSignal.confluences.map((c) => (
                    <div
                      key={c.id}
                      className={`p-2 rounded-lg border flex items-start gap-2 text-[11px] transition ${
                        c.passed
                          ? "bg-emerald-950/20 border-emerald-500/30 text-slate-200"
                          : "bg-slate-950/40 border-slate-800 text-slate-400"
                      }`}
                    >
                      <span className="mt-0.5 shrink-0">
                        {c.passed ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </span>
                      <div className="overflow-hidden">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-slate-200 truncate">{c.name}</span>
                          <span className="font-mono text-[10px] text-amber-400 font-bold shrink-0">
                            +{c.score}pt
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight line-clamp-2 mt-0.5">
                          {c.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Technical Reasoning Box */}
            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analisa Arah Market ({timeframe}):</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[12px]">
                {currentSignal.primaryReason}
              </p>

              {/* SMC Quick Tags */}
              <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px]">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  OB Zone: {currentSignal.smcAnalysis.orderBlockZone}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-cyan-500/30">
                  Structure: {currentSignal.smcAnalysis.marketStructure}
                </span>
                {currentSignal.marketRegime && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    Regime: {currentSignal.marketRegime.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>

            {/* Auto Risk Management Parameters */}
            <div className="flex items-center justify-between p-2.5 bg-amber-950/15 border border-amber-500/20 rounded-xl text-xs">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="font-semibold text-slate-200 text-xs block">
                    Lot Disarankan: {currentSignal.riskAssessment.recommendedLotSize} Lot ({timeframe})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Maks Resiko: ${currentSignal.riskAssessment.maxLossUsd} (
                    {currentSignal.riskAssessment.riskPercentage}%)
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  Auto-BE @ TP1
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-amber-400" />
            <p>Memuat dan menganalisa pasar XAU/USD ({timeframe}) dengan AI...</p>
          </div>
        )}
      </div>

      {/* Action Footer: Autonomous Execution vs Send to Mobile */}
      {currentSignal && (
        <div className="pt-3.5 mt-3.5 border-t border-slate-800 space-y-2">
          {/* Autonomous Execution Toggle */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 rounded-xl border border-slate-700/80">
            <div className="flex items-center space-x-2">
              <Zap
                className={`w-4 h-4 ${
                  riskSettings.autoExecuteAI ? "text-amber-400 animate-pulse" : "text-slate-500"
                }`}
              />
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Eksekusi Otomatis Sinyal {timeframe}
                </span>
                <span className="text-[10px] text-slate-400">
                  Verifikasi akurasi sinyal di saldo demo sebelum eksekusi riil
                </span>
              </div>
            </div>

            <button
              id="toggle-auto-execute-btn"
              onClick={onToggleAutoExecute}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                riskSettings.autoExecuteAI ? "bg-amber-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  riskSettings.autoExecuteAI ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* Execute Now button */}
            <button
              id="btn-execute-ai-signal"
              onClick={() => onExecuteSignal(currentSignal)}
              className={`col-span-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg cursor-pointer ${
                isBuy
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                  : isSell
                  ? "bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Eksekusi Sinyal
            </button>

            {/* Send to Mobile notification */}
            <button
              id="btn-send-to-mobile"
              onClick={() => onSendToMobile(currentSignal)}
              className="col-span-1 py-2.5 bg-sky-600/90 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-lg shadow-sky-600/20 cursor-pointer"
              title="Kirim notifikasi instan ke simulator HP & Web push"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Kirim ke HP
            </button>

            {/* 1-Click Copy Params for MT4/MT5 */}
            <button
              id="btn-copy-signal-params"
              onClick={handleCopyParams}
              className="col-span-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Salin parameter untuk entry manual di Exness MT4/MT5 HP"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Entry</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

