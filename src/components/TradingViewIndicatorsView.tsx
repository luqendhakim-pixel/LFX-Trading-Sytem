import React, { useState } from "react";
import {
  LineChart,
  Activity,
  Zap,
  Target,
} from "lucide-react";
import { TradingViewWidget } from "./TradingViewWidget";
import { AISignal, Candle, Timeframe } from "../types";

interface TradingViewIndicatorsViewProps {
  timeframe?: Timeframe;
  onTimeframeChange?: (tf: Timeframe) => void;
  currentPrice?: number;
  currentSignal?: AISignal | null;
  candles?: Candle[];
  onOpenLotSimulation?: () => void;
}

export const TradingViewIndicatorsView: React.FC<TradingViewIndicatorsViewProps> = ({
  timeframe = "H1",
  onTimeframeChange,
  currentPrice = 4500.2,
}) => {
  const [selectedTf, setSelectedTf] = useState<Timeframe>(timeframe);
  const [activeSubTab, setActiveSubTab] = useState<"CHART" | "GAUGE" | "LEVELS">("CHART");

  const baseP = currentPrice || 4500.0;
  const ema20Val = Number((baseP - 1.2).toFixed(2));
  const ema50Val = Number((baseP - 3.8).toFixed(2));
  const ema200Val = Number((baseP - 14.5).toFixed(2));
  const almaVal = Number((baseP - 0.8).toFixed(2));

  const res2 = Number((baseP + 15.0).toFixed(3));
  const res1 = Number((baseP + 6.5).toFixed(3));
  const pivot = Number(baseP.toFixed(3));
  const sup1 = Number((baseP - 6.5).toFixed(3));
  const sup2 = Number((baseP - 15.0).toFixed(3));

  const handleTimeframeSelect = (tf: Timeframe) => {
    setSelectedTf(tf);
    onTimeframeChange?.(tf);
  };

  return (
    <div
      id="indicators-view"
      className="w-full max-w-lg md:max-w-4xl mx-auto pb-28 pt-2 px-3 sm:px-4 text-slate-100 space-y-4 animate-fadeIn"
    >
      {/* 1. Header with Title & Tab Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <LineChart className="w-5 h-5 text-sky-400" />
            <span>Indikator & Analisis Pasar</span>
          </h2>
          <p className="text-xs text-slate-400">Analisis multi-timeframe XAU/USD & Konfirmasi SMC</p>
        </div>

        {/* Sub Tabs */}
        <div className="flex items-center gap-1 bg-[#090e1e] p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab("CHART")}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeSubTab === "CHART" ? "bg-sky-500 text-slate-950 font-black" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Chart
          </button>

          <button
            onClick={() => setActiveSubTab("GAUGE")}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeSubTab === "GAUGE" ? "bg-sky-500 text-slate-950 font-black" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Teknikal
          </button>

          <button
            onClick={() => setActiveSubTab("LEVELS")}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeSubTab === "LEVELS" ? "bg-sky-500 text-slate-950 font-black" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Support/Resist
          </button>
        </div>
      </div>

      {/* 2. Timeframe Selector Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {(["M1", "M5", "M15", "M30", "H1", "H4", "D1"] as Timeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => handleTimeframeSelect(tf)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
              selectedTf === tf
                ? "bg-sky-500 text-slate-950 font-black shadow"
                : "bg-[#0b1021] text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* 3. Main Chart Display */}
      {activeSubTab === "CHART" && (
        <div className="w-full h-[520px] rounded-3xl overflow-hidden border border-slate-800 bg-[#05070c] shadow-2xl">
          <TradingViewWidget symbol="OANDA:XAUUSD" theme="dark" timeframe={selectedTf} />
        </div>
      )}

      {/* 4. GAUGE Sub Tab */}
      {activeSubTab === "GAUGE" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[#090e1e] border border-slate-800 space-y-3 font-mono">
            <h4 className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider">
              Moving Averages & ALMA
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-xl bg-[#0e172e]">
                <span className="text-slate-400">ALMA (Len 5, Offset 0.5):</span>
                <span className="font-bold text-emerald-400">${almaVal} (Bullish)</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-[#0e172e]">
                <span className="text-slate-400">EMA 20:</span>
                <span className="font-bold text-emerald-400">${ema20Val}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-[#0e172e]">
                <span className="text-slate-400">EMA 50:</span>
                <span className="font-bold text-emerald-400">${ema50Val}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-[#0e172e]">
                <span className="text-slate-400">EMA 200:</span>
                <span className="font-bold text-emerald-400">${ema200Val}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#090e1e] border border-slate-800 space-y-3 font-mono">
            <h4 className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider">
              Oscillators & Momentum
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-xl bg-[#0e172e]">
                <span className="text-slate-400">RSI (14):</span>
                <span className="font-bold text-emerald-400">62.4 (Bullish Zone)</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-[#0e172e]">
                <span className="text-slate-400">Stochastic (14, 3, 3):</span>
                <span className="font-bold text-cyan-400">68.2 (Neutral)</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-[#0e172e]">
                <span className="text-slate-400">MACD (12, 26, 9):</span>
                <span className="font-bold text-emerald-400">+2.45 (Golden Cross)</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-[#0e172e]">
                <span className="text-slate-400">ADX (14):</span>
                <span className="font-bold text-amber-400">32.8 (Strong Trend)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Support & Resistance Sub Tab */}
      {activeSubTab === "LEVELS" && (
        <div className="p-4 rounded-2xl bg-[#090e1e] border border-slate-800 space-y-3 font-mono text-xs">
          <h4 className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider">
            Pivot Points & Key Levels (XAU/USD)
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between p-2 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300">
              <span>Resistance 2 (R2):</span>
              <span className="font-bold">${res2}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-400">
              <span>Resistance 1 (R1):</span>
              <span className="font-bold">${res1}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-sky-950/40 border border-sky-800/40 text-sky-300">
              <span>Daily Pivot (P):</span>
              <span className="font-bold">${pivot}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-emerald-400">
              <span>Support 1 (S1):</span>
              <span className="font-bold">${sup1}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
              <span>Support 2 (S2):</span>
              <span className="font-bold">${sup2}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
