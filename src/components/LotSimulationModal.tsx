import React, { useState } from "react";
import { X, Calculator, ShieldAlert, ArrowRight, DollarSign, TrendingUp, Sparkles } from "lucide-react";
import { AISignal } from "../types";

interface LotSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: AISignal | null;
  currentBalance?: number;
  onExecuteTrade?: (lot: number) => void;
}

export const LotSimulationModal: React.FC<LotSimulationModalProps> = ({
  isOpen,
  onClose,
  signal,
  currentBalance = 10000,
  onExecuteTrade,
}) => {
  const [balance, setBalance] = useState<number>(currentBalance);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [leverage, setLeverage] = useState<number>(500);
  const [usdToIdrRate] = useState<number>(16250);

  if (!isOpen || !signal) return null;

  const entry = signal.entryPrice;
  const sl = signal.stopLoss;
  const tp1 = signal.takeProfit1;
  const tp2 = signal.takeProfit2;
  const tp3 = signal.takeProfit3;
  const tp4 = signal.takeProfit4 || (signal.signalType.includes("BUY") ? entry + 20.0 : entry - 20.0);

  const slPips = Math.abs(entry - sl) * 10; // e.g. 5.00 diff = 50 pips
  const maxRiskAmountUsd = (balance * riskPercent) / 100;
  // In Gold 1 lot = 100 oz. 1 pip movement (0.10) per 1 lot = $10 USD.
  // 50 pips SL on 1 lot = $500 loss.
  // So recommended lot = maxRiskAmountUsd / (slPips * 10)
  const pipValuePerLot = 10; // $10 per pip on 1 standard lot of XAU/USD
  const recommendedLot = Math.max(0.01, Number((maxRiskAmountUsd / (Math.max(1, slPips) * pipValuePerLot)).toFixed(2)));

  const totalRiskUsd = Number((recommendedLot * slPips * pipValuePerLot).toFixed(2));
  const totalRiskIdr = totalRiskUsd * usdToIdrRate;

  const tp1Pips = Math.abs(tp1 - entry) * 10;
  const tp2Pips = Math.abs(tp2 - entry) * 10;
  const tp3Pips = Math.abs(tp3 - entry) * 10;
  const tp4Pips = Math.abs(tp4 - entry) * 10;

  const tp1ProfitUsd = Number((recommendedLot * tp1Pips * pipValuePerLot).toFixed(2));
  const tp2ProfitUsd = Number((recommendedLot * tp2Pips * pipValuePerLot).toFixed(2));
  const tp3ProfitUsd = Number((recommendedLot * tp3Pips * pipValuePerLot).toFixed(2));
  const tp4ProfitUsd = Number((recommendedLot * tp4Pips * pipValuePerLot).toFixed(2));

  // Margin required = (Lot * 100 * Entry) / Leverage
  const marginRequired = Number(((recommendedLot * 100 * entry) / leverage).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
      <div
        id="lot-simulation-modal"
        className="w-full max-w-lg bg-[#0a0f1d] border border-slate-700/70 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 relative overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Top Accent Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                Simulasi Lot & Risk Equity
              </h3>
              <p className="text-xs text-slate-400">Kalkulasi presisi modal, SL 50 pips & target TP 1-4</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Signal Snapshot */}
        <div className="mt-4 p-3 bg-[#0d1426] border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded font-black text-[11px] ${
                signal.signalType.includes("BUY")
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
              }`}
            >
              {signal.signalType.includes("BUY") ? "BUY" : "SELL"}
            </span>
            <span className="font-bold text-white text-sm">{signal.symbol || "XAUUSD"}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400">Entry: </span>
            <span className="text-cyan-400 font-bold">${entry.toFixed(3)}</span>
            <span className="mx-1 text-slate-600">|</span>
            <span className="text-slate-400">SL: </span>
            <span className="text-rose-400 font-bold">${sl.toFixed(3)} (50p)</span>
          </div>
        </div>

        {/* Form Controls */}
        <div className="mt-4 space-y-3.5">
          {/* Account Balance */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Saldo Akun (Balance USD)</span>
              <span className="text-[11px] text-slate-400">
                ≈ Rp {(balance * usdToIdrRate).toLocaleString("id-ID")}
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(Math.max(10, Number(e.target.value)))}
                className="w-full bg-[#070b16] border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          {/* Risk Percentage selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Toleransi Risiko Per Transaksi (%)</span>
              <span className="text-xs font-bold text-amber-400">${maxRiskAmountUsd.toFixed(2)}</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 5].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setRiskPercent(pct)}
                  className={`py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                    riskPercent === pct
                      ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20"
                      : "bg-[#070b16] text-slate-300 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {pct}% Risk
                </button>
              ))}
            </div>
          </div>

          {/* Leverage Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Leverage Broker (Exness)
            </label>
            <select
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="w-full bg-[#070b16] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
            >
              <option value={100}>1:100 Standard</option>
              <option value={500}>1:500 Rekomendasi (Aman)</option>
              <option value={1000}>1:1000 Pro</option>
              <option value={2000}>1:2000 High Margin Free</option>
            </select>
          </div>
        </div>

        {/* Calculation Result Cards */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-[#0c142b] to-[#080d1e] border border-cyan-900/40 space-y-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs text-slate-300">Rekomendasi Lot Size:</span>
            <span className="text-lg font-black text-cyan-300 tracking-tight">{recommendedLot} Lot</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#060914] border border-rose-900/30">
              <div className="flex items-center gap-1 text-rose-400 font-bold mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Maksimal Loss (SL 50p)</span>
              </div>
              <div className="text-sm font-extrabold text-rose-400">-${totalRiskUsd}</div>
              <div className="text-[10px] text-slate-400">≈ Rp {totalRiskIdr.toLocaleString("id-ID")}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#060914] border border-cyan-900/30">
              <div className="flex items-center gap-1 text-cyan-400 font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Margin Terpakai</span>
              </div>
              <div className="text-sm font-extrabold text-cyan-300">${marginRequired}</div>
              <div className="text-[10px] text-slate-400">Lev 1:{leverage}</div>
            </div>
          </div>

          {/* TP Breakdown Targets */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
            <div className="text-[11px] text-slate-400 font-sans font-semibold mb-1 flex items-center justify-between">
              <span>Proyeksi Profit per Target TP:</span>
              <span className="text-emerald-400 font-bold">Risk-Reward Optimal</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#060914]/80">
              <span className="text-emerald-400 font-bold">TP1 (+50 pips @ ${tp1.toFixed(3)})</span>
              <span className="text-emerald-300 font-extrabold">+${tp1ProfitUsd} (Rp {((tp1ProfitUsd * usdToIdrRate)).toLocaleString("id-ID")})</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#060914]/80">
              <span className="text-cyan-400 font-bold">TP2 (+100 pips @ ${tp2.toFixed(3)})</span>
              <span className="text-cyan-300 font-extrabold">+${tp2ProfitUsd} (Rp {((tp2ProfitUsd * usdToIdrRate)).toLocaleString("id-ID")})</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#060914]/80">
              <span className="text-sky-400 font-bold">TP3 (+150 pips @ ${tp3.toFixed(3)})</span>
              <span className="text-sky-300 font-extrabold">+${tp3ProfitUsd} (Rp {((tp3ProfitUsd * usdToIdrRate)).toLocaleString("id-ID")})</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#060914]/80">
              <span className="text-amber-400 font-bold">TP4 (+200 pips @ ${tp4.toFixed(3)})</span>
              <span className="text-amber-300 font-extrabold">+${tp4ProfitUsd} (Rp {((tp4ProfitUsd * usdToIdrRate)).toLocaleString("id-ID")})</span>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
          {onExecuteTrade && (
            <button
              onClick={() => {
                onExecuteTrade(recommendedLot);
                onClose();
              }}
              className="flex-1 py-3 bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 rounded-2xl font-black text-xs transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Eksekusi {recommendedLot} Lot</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
