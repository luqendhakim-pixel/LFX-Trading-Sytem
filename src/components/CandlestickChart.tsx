import React, { memo } from "react";
import { Candle, Timeframe } from "../types";
import { TradingViewWidget } from "./TradingViewWidget";
import {
  Clock,
  Sparkles,
} from "lucide-react";

interface CandlestickChartProps {
  candles: Candle[];
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  currentBid: number;
  currentAsk: number;
  spread: number;
  selectedSymbol?: string;
  onSymbolChange?: (sym: string) => void;
  activeSignalPrice?: {
    entry?: number;
    sl?: number;
    tp1?: number;
    tp2?: number;
    tp3?: number;
    type?: "BUY" | "SELL";
  };
}

export const CandlestickChart: React.FC<CandlestickChartProps> = memo(({
  candles,
  timeframe,
  onTimeframeChange,
  currentBid,
  currentAsk,
  spread,
  selectedSymbol = "OANDA:XAUUSD",
  onSymbolChange,
  activeSignalPrice,
}) => {
  const timeframes: Timeframe[] = ["M1", "M5", "M15", "H1", "H4", "D1"];

  return (
    <div
      id="xau-candlestick-chart-container"
      className="flex flex-col h-full bg-[#05070c] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl relative select-none"
    >
      {/* High-Performance Minimalist Dark Top Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#080c15] border-b border-slate-800/70 gap-2">
        {/* Left: Asset Identity & Realtime TradingView Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#0e1422] px-2.5 py-1 rounded-xl border border-slate-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-black text-slate-100 text-xs tracking-wider font-mono">
              XAU/USD
            </span>
            <span className="text-[10px] uppercase font-bold bg-amber-500/15 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/30">
              Gold Spot
            </span>
          </div>

          <div className="flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.8 rounded-xl text-[11px] font-mono text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-bold">TradingView Real-time</span>
          </div>
        </div>

        {/* Center/Right: Timeframe Selector (M1, M5, M15, H1, H4, D1) */}
        <div className="flex items-center gap-1 bg-[#0e1422] p-1 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1 px-1.5 text-slate-400 text-xs font-medium hidden sm:flex">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px]">TF:</span>
          </div>
          {timeframes.map((tf) => (
            <button
              key={tf}
              id={`chart-tf-btn-${tf}`}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                timeframe === tf
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black scale-105"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Live BID, ASK, Spread Indicator */}
        <div className="hidden lg:flex items-center gap-3 bg-[#0e1422] px-3 py-1 rounded-xl border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">BID:</span>
            <span className="font-bold text-emerald-400">${currentBid > 0 ? currentBid.toFixed(2) : "4604.74"}</span>
          </div>
          <div className="h-3 w-px bg-slate-800"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">ASK:</span>
            <span className="font-bold text-rose-400">${currentAsk > 0 ? currentAsk.toFixed(2) : "4604.90"}</span>
          </div>
          <div className="h-3 w-px bg-slate-800"></div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">SPD:</span>
            <span className="font-bold text-amber-400">{spread > 0 ? spread.toFixed(1) : "1.6"}p</span>
          </div>
        </div>
      </div>

      {/* Target Summary Strip with Glow Accent if Active Signal exists */}
      {activeSignalPrice && activeSignalPrice.entry && (
        <div className="bg-[#070b14] px-3 py-1.5 border-b border-slate-800/70 flex flex-wrap items-center justify-between text-xs font-mono gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                activeSignalPrice.type === "BUY"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(0,245,160,0.15)]"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_8px_rgba(255,51,75,0.15)]"
              }`}
            >
              TARGET {activeSignalPrice.type === "BUY" ? "BUY LONG 🔺" : "SELL SHORT 🔻"}
            </span>
            <span className="text-slate-300 text-[11px]">
              Entry: <strong className="text-white font-bold">${activeSignalPrice.entry.toFixed(2)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-[11px]">
            {activeSignalPrice.sl && (
              <span className="text-rose-400">
                SL: <strong>${activeSignalPrice.sl.toFixed(2)}</strong>
              </span>
            )}
            {activeSignalPrice.tp1 && (
              <span className="text-emerald-400">
                TP1: <strong>${activeSignalPrice.tp1.toFixed(2)}</strong>
              </span>
            )}
            {activeSignalPrice.tp2 && (
              <span className="text-emerald-300">
                TP2: <strong>${activeSignalPrice.tp2.toFixed(2)}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Direct TradingView Pro Chart Canvas */}
      <div className="relative flex-1 w-full min-h-[520px] bg-[#05070c]">
        <TradingViewWidget
          symbol={selectedSymbol}
          theme="dark"
          timeframe={timeframe}
        />
      </div>
    </div>
  );
});

CandlestickChart.displayName = "CandlestickChart";

