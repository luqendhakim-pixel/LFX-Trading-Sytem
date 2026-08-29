import React, { useState } from "react";
import { Position } from "../types";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Layers,
  CheckCheck,
  XCircle,
  Lock,
  Zap,
} from "lucide-react";

interface TradingPanelProps {
  currentBid: number;
  currentAsk: number;
  spread: number;
  onOpenPosition: (type: "BUY" | "SELL", lotSize: number, slPips: number, tpPips: number) => void;
  onCloseAll: () => void;
  onCloseProfitOnly: () => void;
  onMoveAllToBreakeven: () => void;
  openPositionsCount: number;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({
  currentBid,
  currentAsk,
  spread,
  onOpenPosition,
  onCloseAll,
  onCloseProfitOnly,
  onMoveAllToBreakeven,
  openPositionsCount,
}) => {
  const [lotSize, setLotSize] = useState<number>(0.1);
  const [slPips, setSlPips] = useState<number>(30); // 30 pips = $3.00 price move on gold
  const [tpPips, setTpPips] = useState<number>(60); // 60 pips = $6.00 price move on gold

  const lotPresets = [0.01, 0.05, 0.1, 0.25, 0.5, 1.0];

  const estimatedLossUsd = (lotSize * (slPips * 0.1) * 100).toFixed(2);
  const estimatedProfitUsd = (lotSize * (tpPips * 0.1) * 100).toFixed(2);

  return (
    <div
      id="trading-execution-panel"
      className="bg-[#0f1420] border border-slate-800 rounded-xl p-4 shadow-xl text-slate-100 space-y-3.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Eksekusi Manual Cepat</h3>
            <p className="text-[11px] text-slate-400">Direct Market Order (XAU/USD)</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-mono">SPREAD</span>
          <span className="text-xs font-bold font-mono text-amber-400">{spread.toFixed(1)} Pips</span>
        </div>
      </div>

      {/* Lot Size Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-semibold">Volume (Lot)</span>
          <span className="text-slate-400 font-mono">1 Lot = 100 oz Gold</span>
        </div>

        <div className="flex items-center space-x-1.5">
          {lotPresets.map((lp) => (
            <button
              key={lp}
              onClick={() => setLotSize(lp)}
              className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg border transition ${
                lotSize === lp
                  ? "bg-amber-500 text-slate-950 border-amber-500"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
              }`}
            >
              {lp}
            </button>
          ))}
        </div>
      </div>

      {/* SL & TP Pips Configuration */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-rose-400 font-semibold">Stop Loss</span>
            <span className="text-slate-400 font-mono">-${estimatedLossUsd}</span>
          </div>
          <div className="flex items-center space-x-1">
            {[20, 30, 50].map((sl) => (
              <button
                key={sl}
                onClick={() => setSlPips(sl)}
                className={`flex-1 py-1 text-[11px] font-mono rounded border transition ${
                  slPips === sl
                    ? "bg-rose-500 text-white border-rose-500 font-bold"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {sl}p
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-emerald-400 font-semibold">Take Profit</span>
            <span className="text-slate-400 font-mono">+${estimatedProfitUsd}</span>
          </div>
          <div className="flex items-center space-x-1">
            {[40, 60, 100].map((tp) => (
              <button
                key={tp}
                onClick={() => setTpPips(tp)}
                className={`flex-1 py-1 text-[11px] font-mono rounded border transition ${
                  tpPips === tp
                    ? "bg-emerald-500 text-slate-950 border-emerald-500 font-bold"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {tp}p
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Big Buy & Sell Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* SELL Button */}
        <button
          id="btn-manual-sell"
          onClick={() => onOpenPosition("SELL", lotSize, slPips, tpPips)}
          className="py-3 px-4 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold rounded-xl transition shadow-lg shadow-rose-600/20 flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-extrabold">
            <TrendingDown className="w-4 h-4" />
            <span>SELL MARKET</span>
          </div>
          <span className="text-base font-black font-mono mt-0.5">${currentBid.toFixed(2)}</span>
        </button>

        {/* BUY Button */}
        <button
          id="btn-manual-buy"
          onClick={() => onOpenPosition("BUY", lotSize, slPips, tpPips)}
          className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-extrabold">
            <TrendingUp className="w-4 h-4" />
            <span>BUY MARKET</span>
          </div>
          <span className="text-base font-black font-mono mt-0.5">${currentAsk.toFixed(2)}</span>
        </button>
      </div>

      {/* Quick Trade Management Buttons */}
      {openPositionsCount > 0 && (
        <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-1.5 text-[11px]">
          <button
            id="btn-move-all-be"
            onClick={onMoveAllToBreakeven}
            className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1 transition"
            title="Pindahkan SL semua posisi ke harga entry"
          >
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Lock BE All</span>
          </button>

          <button
            id="btn-close-profit-only"
            onClick={onCloseProfitOnly}
            className="py-1.5 px-2 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 rounded-lg font-semibold flex items-center justify-center gap-1 transition"
            title="Tutup hanya posisi yang sedang cuan"
          >
            <CheckCheck className="w-3 h-3 text-emerald-400" />
            <span>Close Profit</span>
          </button>

          <button
            id="btn-close-all"
            onClick={onCloseAll}
            className="py-1.5 px-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 rounded-lg font-semibold flex items-center justify-center gap-1 transition"
            title="Tutup semua order aktif seketika"
          >
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>Close All ({openPositionsCount})</span>
          </button>
        </div>
      )}
    </div>
  );
};
