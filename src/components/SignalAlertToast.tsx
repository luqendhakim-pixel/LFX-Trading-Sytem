import React, { useState } from "react";
import { AISignal, Timeframe } from "../types";
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Copy,
  Check,
  X,
  Bell,
  Volume2,
  VolumeX,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

export interface SignalToastItem {
  id: string;
  signal: AISignal;
  timeframe: Timeframe;
  createdAt: number;
  durationMs?: number;
  alertType?: "NEW_SIGNAL" | "TP_HIT" | "SL_HIT" | "BE_HIT" | "BE_TRIGGERED";
  customTitle?: string;
  customBody?: string;
  pips?: number;
}

interface SignalAlertToastProps {
  toasts: SignalToastItem[];
  onDismiss: (id: string) => void;
  onExecute?: (signal: AISignal) => void;
  onSelectSignal?: (signal: AISignal) => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const SignalAlertToast: React.FC<SignalAlertToastProps> = ({
  toasts,
  onDismiss,
  onExecute,
  onSelectSignal,
  soundEnabled = true,
  onToggleSound,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (toasts.length === 0) return null;

  return (
    <div
      id="signal-toast-container"
      className="fixed top-18 right-3 sm:right-5 z-50 flex flex-col space-y-3 max-w-md w-[calc(100vw-24px)] pointer-events-auto"
    >
      {toasts.map((item) => {
        const { signal, timeframe, id, alertType = "NEW_SIGNAL", customTitle, customBody, pips } = item;
        const isBuy = signal.signalType.includes("BUY");
        const isSell = signal.signalType.includes("SELL");
        const isTpHit = alertType === "TP_HIT";
        const isSlHit = alertType === "SL_HIT";
        const isBeHit = alertType === "BE_HIT";
        const isBeTriggered = alertType === "BE_TRIGGERED";

        const handleCopy = (e: React.MouseEvent) => {
          e.stopPropagation();
          const text = `🚨 XAU/USD ${signal.signalType} [${timeframe}] 🚨\nEntry: $${signal.entryPrice.toFixed(2)}\nSL: $${signal.stopLoss.toFixed(2)}\nTP1: $${signal.takeProfit1.toFixed(2)}\nTP2: $${signal.takeProfit2.toFixed(2)}\nLot: ${signal.riskAssessment?.recommendedLotSize || 0.1}\nRR: ${signal.riskRewardRatio}`;
          navigator.clipboard.writeText(text);
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        };

        return (
          <div
            key={id}
            id={`signal-toast-${id}`}
            onClick={() => onSelectSignal?.(signal)}
            className={`rounded-2xl border shadow-2xl p-4 transition-all duration-300 transform animate-in slide-in-from-top-4 relative overflow-hidden cursor-pointer ${
              isBeTriggered
                ? "bg-slate-950/95 border-cyan-400 shadow-cyan-950/60 ring-1 ring-cyan-400/50"
                : isTpHit
                ? "bg-slate-950/95 border-emerald-400 shadow-emerald-950/60 ring-1 ring-emerald-500/50"
                : isSlHit
                ? "bg-slate-950/95 border-rose-500 shadow-rose-950/60 ring-1 ring-rose-500/50"
                : isBeHit
                ? "bg-slate-950/95 border-blue-500 shadow-blue-950/60"
                : isBuy
                ? "bg-slate-950/95 border-emerald-500/50 shadow-emerald-950/50"
                : isSell
                ? "bg-slate-950/95 border-rose-500/50 shadow-rose-950/50"
                : "bg-slate-950/95 border-amber-500/50 shadow-amber-950/50"
            }`}
          >
            {/* Top Accent Light Bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${
                isBeTriggered
                  ? "bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-500 animate-pulse"
                  : isTpHit || isBuy
                  ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse"
                  : isSlHit || isSell
                  ? "bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500 animate-pulse"
                  : "bg-gradient-to-r from-blue-500 via-sky-400 to-blue-500"
              }`}
            />

            {/* Header: Badge + Title + Close */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shadow-lg ${
                    isBeTriggered
                      ? "bg-cyan-500 text-slate-950 shadow-cyan-500/30"
                      : isTpHit || (isBuy && !isSlHit)
                      ? "bg-emerald-500 text-slate-950 shadow-emerald-500/30"
                      : isSlHit || (isSell && !isTpHit)
                      ? "bg-rose-500 text-white shadow-rose-500/30"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {isBeTriggered ? (
                    <ShieldCheck className="w-5 h-5 text-slate-950" />
                  ) : isTpHit ? (
                    <Sparkles className="w-5 h-5 text-slate-950" />
                  ) : isSlHit ? (
                    <TrendingDown className="w-5 h-5 text-white" />
                  ) : isBuy ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-sm tracking-wide text-slate-100 uppercase">
                      {customTitle || `${signal.signalType.replace("_", " ")} XAU/USD`}
                    </span>
                    {typeof pips === "number" ? (
                      <span
                        className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded border ${
                          pips > 0
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                            : pips < 0
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/50"
                            : "bg-blue-500/20 text-blue-300 border-blue-500/50"
                        }`}
                      >
                        {pips > 0 ? `+${pips} pips` : `${pips} pips`}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        {timeframe}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>
                      {customBody || `Sinyal AI Live • Akurasi ${signal.confidenceScore}%`}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onToggleSound}
                  className="p-1 text-slate-400 hover:text-slate-200 transition"
                  title={soundEnabled ? "Suara Aktif" : "Suara Senyap"}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-600" />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(id);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-lg transition cursor-pointer"
                  title="Tutup Notifikasi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* If Break Even Triggered Banner */}
            {isBeTriggered && (
              <div className="mt-2.5 p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-200">
                <div className="font-bold flex items-center gap-1 text-cyan-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>SL Dipindah ke Entry (Bebas Risiko)</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Posisi sekarang aman 100%. Biarkan profit terus berjalan menuju target TP1 (+50p), TP2 (+100p), TP3 (+150p), TP4 (+200p)!
                </div>
              </div>
            )}

            {/* Price Targets Grid if new signal */}
            {alertType === "NEW_SIGNAL" && (
              <>
                <div className="grid grid-cols-4 gap-1.5 mt-3 text-xs font-mono">
                  <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 block font-sans">ENTRY</span>
                    <span className="font-bold text-slate-100 text-xs">
                      ${signal.entryPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-rose-950/30 p-1.5 rounded-lg border border-rose-900/40 text-center">
                    <span className="text-[9px] text-rose-400 block font-sans">SL (50p)</span>
                    <span className="font-bold text-rose-300 text-xs">
                      ${signal.stopLoss.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-emerald-950/30 p-1.5 rounded-lg border border-emerald-900/40 text-center">
                    <span className="text-[9px] text-emerald-400 block font-sans">TP1 (+50p)</span>
                    <span className="font-bold text-emerald-300 text-xs">
                      ${signal.takeProfit1.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-emerald-950/30 p-1.5 rounded-lg border border-emerald-900/40 text-center">
                    <span className="text-[9px] text-emerald-400 block font-sans">TP2 (+100p)</span>
                    <span className="font-bold text-emerald-300 text-xs">
                      ${signal.takeProfit2.toFixed(2)}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 mt-2 line-clamp-2 leading-tight">
                  {signal.primaryReason}
                </p>
              </>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800/80" onClick={(e) => e.stopPropagation()}>
              <button
                id={`btn-toast-execute-${id}`}
                onClick={() => {
                  onSelectSignal?.(signal);
                  onDismiss(id);
                }}
                className="py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md cursor-pointer bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Lihat Detail Sinyal
              </button>

              <button
                id={`btn-toast-copy-${id}`}
                onClick={handleCopy}
                className="py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedId === id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Salin Parameter</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
