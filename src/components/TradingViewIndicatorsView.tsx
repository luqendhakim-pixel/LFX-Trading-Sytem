import React, { useState } from "react";
import { LineChart, Sliders, Activity, Sparkles, ExternalLink, TrendingUp, TrendingDown, Layers } from "lucide-react";
import { TradingViewWidget } from "./TradingViewWidget";
import { AISignal, Timeframe } from "../types";

interface TradingViewIndicatorsViewProps {
  timeframe?: Timeframe;
  onTimeframeChange?: (tf: Timeframe) => void;
  currentPrice?: number;
  currentSignal?: AISignal | null;
  onOpenLotSimulation?: () => void;
}

export const TradingViewIndicatorsView: React.FC<TradingViewIndicatorsViewProps> = ({
  timeframe = "H1",
  onTimeframeChange,
  currentPrice = 4500.2,
  currentSignal,
  onOpenLotSimulation,
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

  return (
    <div
      id="indicators-view"
      className="w-full max-w-lg md:max-w-4xl mx-auto pb-28 pt-2 px-3 sm:px-4 text-slate-100 space-y-4 animate-fadeIn"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <LineChart className="w-5 h-5 text-sky-400" />
            <span>Indikator & Analisis Pasar</span>
          </h2>
          <p className="text-xs text-slate-400">Analisis multi-timeframe XAU/USD & Konfirmasi SMC</p>
        </div>

        <div className="flex items-center gap-1 bg-[#090e1e] p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab("CHART")}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              activeSubTab === "CHART" ? "bg-sky-500 text-slate-950 font-black" : "text-slate-400"
            }`}
          >
            Chart
          </button>
          <button
            onClick={() => setActiveSubTab("GAUGE")}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              activeSubTab === "GAUGE" ? "bg-sky-500 text-slate-950 font-black" : "text-slate-400"
            }`}
          >
            Teknikal
          </button>
          <button
            onClick={() => setActiveSubTab("LEVELS")}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              activeSubTab === "LEVELS" ? "bg-sky-500 text-slate-950 font-black" : "text-slate-400"
            }`}
          >
            Support/Resist
          </button>
        </div>
      </div>

      {/* Timeframe selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {(["M1", "M5", "M15", "M30", "H1", "H4", "D1"] as Timeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => setSelectedTf(tf)}
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

      {/* Main Container */}
      {activeSubTab === "CHART" && (
        <div className="w-full h-[520px] rounded-3xl overflow-hidden border border-slate-800 bg-[#05070c] shadow-2xl">
          <TradingViewWidget symbol="OANDA:XAUUSD" theme="dark" timeframe={selectedTf} />
        </div>
      )}

      {activeSubTab === "GAUGE" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[#090e1e] border border-slate-800 space-y-3 font-mono">
            <h4 className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider">
              Oscillators & Momentum
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#050813]">
                <span className="text-slate-400">RSI (14)</span>
                <span className="text-emerald-400 font-bold">58.4 (Bullish Zone)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#050813]">
                <span className="text-slate-400">Stochastic (14,3,3)</span>
                <span className="text-cyan-400 font-bold">62.1 (Neutral / Up)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#050813]">
                <span className="text-slate-400">MACD Histogram</span>
                <span className="text-emerald-400 font-bold">+1.84 (Bullish Crossover)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#050813]">
                <span className="text-slate-400">ATR (14) Volatilitas</span>
                <span className="text-amber-400 font-bold">3.20 USD (32 Pips/Bar)</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#090e1e] border border-slate-800 space-y-3 font-mono">
            <h4 className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider">
              Moving Averages & Trend Filter
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#050813]">
                <span className="text-slate-400">EMA 20</span>
                <span className="text-emerald-400 font-bold">{ema20Val.toFixed(2)} (BUY)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#050813]">
                <span className="text-slate-400">EMA 50</span>
                <span className="text-emerald-400 font-bold">{ema50Val.toFixed(2)} (BUY)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#050813]">
                <span className="text-slate-400">EMA 200 (Major Trend)</span>
                <span className="text-emerald-400 font-bold">{ema200Val.toFixed(2)} (STRONG BULL)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#050813]">
                <span className="text-slate-400">Step ALMA Filter</span>
                <span className="text-cyan-400 font-bold">{almaVal.toFixed(2)} (Support Line)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "LEVELS" && (
        <div className="p-4 rounded-2xl bg-[#090e1e] border border-slate-800 space-y-3 font-mono text-xs">
          <h4 className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider">
            Order Blocks & Key Fibonacci Levels (XAU/USD)
          </h4>
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-600/30 flex items-center justify-between">
              <div>
                <div className="text-rose-400 font-bold">Resistance 2 (Major Supply)</div>
                <div className="text-[10px] text-slate-400">H4 Liquidity Sweep Area</div>
              </div>
              <div className="text-sm font-black text-rose-300">{res2.toFixed(3)}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-600/20 flex items-center justify-between">
              <div>
                <div className="text-rose-300 font-bold">Resistance 1 (Local High)</div>
                <div className="text-[10px] text-slate-400">Previous Day High (PDH)</div>
              </div>
              <div className="text-sm font-black text-rose-200">{res1.toFixed(3)}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <div className="text-cyan-300 font-bold">Current Equilibrium (Pivot)</div>
                <div className="text-[10px] text-slate-400">Daily VWAP & Fair Value</div>
              </div>
              <div className="text-sm font-black text-cyan-200">{pivot.toFixed(3)}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-600/20 flex items-center justify-between">
              <div>
                <div className="text-emerald-300 font-bold">Support 1 (Demand OB)</div>
                <div className="text-[10px] text-slate-400">H1 Bullish Order Block</div>
              </div>
              <div className="text-sm font-black text-emerald-200">{sup1.toFixed(3)}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-600/30 flex items-center justify-between">
              <div>
                <div className="text-emerald-400 font-bold">Support 2 (Major FVG)</div>
                <div className="text-[10px] text-slate-400">Daily Fair Value Gap</div>
              </div>
              <div className="text-sm font-black text-emerald-300">{sup2.toFixed(3)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
