import React, { useState } from "react";
import { RiskSettings } from "../types";
import {
  ShieldAlert,
  Sliders,
  DollarSign,
  Percent,
  Lock,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Flame,
  Scale,
} from "lucide-react";

interface RiskManagementPanelProps {
  riskSettings: RiskSettings;
  onUpdateRiskSettings: (settings: Partial<RiskSettings>) => void;
  onResetBalance: (newBalance: number) => void;
}

export const RiskManagementPanel: React.FC<RiskManagementPanelProps> = ({
  riskSettings,
  onUpdateRiskSettings,
  onResetBalance,
}) => {
  const [customBalanceInput, setCustomBalanceInput] = useState<string>(
    riskSettings.balance.toString()
  );
  const [isEditingBalance, setIsEditingBalance] = useState(false);

  const presetBalances = [1000, 5000, 10000, 50000, 100000];

  const handleApplyCustomBalance = () => {
    const val = parseFloat(customBalanceInput);
    if (!isNaN(val) && val > 0) {
      onResetBalance(val);
      setIsEditingBalance(false);
    }
  };

  return (
    <div
      id="risk-management-panel"
      className="bg-[#0f1420] border border-slate-800 rounded-xl p-4 shadow-xl text-slate-100 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">
              Manajemen Risiko Otomatis
            </h3>
            <p className="text-[11px] text-slate-400">
              Pelindung Win Rate & Modal Dummy / Real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/30 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Proteksi Aktif</span>
        </div>
      </div>

      {/* Balance & Equity Bar with Quick Setter */}
      <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              Saldo Terminal (Demo / Dummy)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black font-mono text-emerald-400">
                ${riskSettings.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <button
                id="btn-edit-balance"
                onClick={() => setIsEditingBalance(!isEditingBalance)}
                className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold"
              >
                {isEditingBalance ? "Tutup" : "Ubah Saldo"}
              </button>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              Equity & Margin Level
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                riskSettings.equity >= riskSettings.balance ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              ${riskSettings.equity.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
              <span className="text-xs text-slate-400">
                ({riskSettings.marginLevelPercent > 1000 ? ">1000%" : `${riskSettings.marginLevelPercent}%`})
              </span>
            </span>
          </div>
        </div>

        {/* Edit Balance Form / Preset Buttons */}
        {isEditingBalance && (
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {presetBalances.map((bal) => (
                <button
                  key={bal}
                  onClick={() => {
                    setCustomBalanceInput(bal.toString());
                    onResetBalance(bal);
                    setIsEditingBalance(false);
                  }}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg border transition ${
                    riskSettings.balance === bal
                      ? "bg-amber-500 text-slate-950 border-amber-500"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  ${bal.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-slate-400 text-xs">$</span>
                <input
                  type="number"
                  value={customBalanceInput}
                  onChange={(e) => setCustomBalanceInput(e.target.value)}
                  placeholder="Atur saldo kustom..."
                  className="w-full pl-7 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                onClick={handleApplyCustomBalance}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition"
              >
                Terapkan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Risk Parameters Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Risk Per Trade */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <label className="text-[11px] font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
            <span>Resiko Per Entry (%)</span>
            <span className="text-amber-400 font-mono font-bold">
              {riskSettings.riskPerTradePercent}% (
              ${((riskSettings.balance * riskSettings.riskPerTradePercent) / 100).toFixed(0)})
            </span>
          </label>
          <div className="flex items-center space-x-1">
            {[0.5, 1, 2, 3].map((r) => (
              <button
                key={r}
                onClick={() => onUpdateRiskSettings({ riskPerTradePercent: r })}
                className={`flex-1 py-1 text-xs font-bold rounded border transition ${
                  riskSettings.riskPerTradePercent === r
                    ? "bg-amber-500 text-slate-950 border-amber-500"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                }`}
              >
                {r}%
              </button>
            ))}
          </div>
        </div>

        {/* Max Daily Drawdown Safeguard */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <label className="text-[11px] font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
            <span>Batas Max Rugi Harian</span>
            <span className="text-rose-400 font-mono font-bold">
              {riskSettings.maxDailyLossPercent}% (
              ${((riskSettings.startingBalance * riskSettings.maxDailyLossPercent) / 100).toFixed(0)})
            </span>
          </label>
          <div className="flex items-center space-x-1">
            {[3, 5, 8, 10].map((d) => (
              <button
                key={d}
                onClick={() => onUpdateRiskSettings({ maxDailyLossPercent: d })}
                className={`flex-1 py-1 text-xs font-bold rounded border transition ${
                  riskSettings.maxDailyLossPercent === d
                    ? "bg-rose-500 text-white border-rose-500"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                }`}
              >
                {d}%
              </button>
            ))}
          </div>
        </div>

        {/* Max Open Trades */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <label className="text-[11px] font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
            <span>Maksimal Posisi Terbuka</span>
            <span className="text-cyan-400 font-mono font-bold">
              {riskSettings.maxOpenTrades} Posisi
            </span>
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 5].map((m) => (
              <button
                key={m}
                onClick={() => onUpdateRiskSettings({ maxOpenTrades: m })}
                className={`flex-1 py-1 text-xs font-bold rounded border transition ${
                  riskSettings.maxOpenTrades === m
                    ? "bg-cyan-500 text-slate-950 border-cyan-500"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy Preset */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
            Model Strategi AI
          </label>
          <select
            value={riskSettings.selectedStrategy}
            onChange={(e) =>
              onUpdateRiskSettings({
                selectedStrategy: e.target.value as any,
              })
            }
            className="w-full py-1 px-2 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="Scalping Gold M5">Scalping Gold M5 (High Win Rate)</option>
            <option value="Intraday Trend Rider M15/H1">Intraday Trend Rider M15/H1</option>
            <option value="SMC & Liquidity Sweep H1">SMC & Liquidity Sweep H1</option>
            <option value="AI Adaptive Multi-Confluence">AI Adaptive Multi-Confluence</option>
          </select>
        </div>
      </div>

      {/* Safeguard Toggles */}
      <div className="space-y-2 pt-1 border-t border-slate-800 text-xs">
        {/* Signal Quality Filter Threshold */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-200 block text-xs">
                Ambang Batas Akurasi Sinyal (Konfluensi)
              </span>
              <span className="text-[10px] text-slate-400">
                Hanya kirim notifikasi & auto-eksekusi jika skor konfluensi mencapai target
              </span>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              ≥ {riskSettings.minSignalConfidence || 80}% (A+ Setup)
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {[75, 80, 85, 90].map((thr) => (
              <button
                key={thr}
                onClick={() => onUpdateRiskSettings({ minSignalConfidence: thr })}
                className={`flex-1 py-1 text-xs font-bold rounded border transition ${
                  (riskSettings.minSignalConfidence || 80) === thr
                    ? "bg-amber-500 text-slate-950 border-amber-500"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                }`}
              >
                {thr === 80 ? "80% (Standar A+)" : `${thr}%`}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/80 cursor-pointer transition">
          <div>
            <span className="font-semibold text-slate-200 block">
              Auto-Lock Breakeven saat TP1 Tercapai
            </span>
            <span className="text-[11px] text-slate-400">
              Otomatis geser Stop Loss ke harga entry (+0 pip) untuk mengamankan modal (bebas resiko)
            </span>
          </div>
          <input
            type="checkbox"
            checked={riskSettings.autoBreakevenAtTp1}
            onChange={(e) =>
              onUpdateRiskSettings({ autoBreakevenAtTp1: e.target.checked })
            }
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/80 cursor-pointer transition">
          <div>
            <span className="font-semibold text-slate-200 block">
              Filter Spread Maksimal (Gold Volatility)
            </span>
            <span className="text-[11px] text-slate-400">
              Tolak eksekusi otomatis jika spread melebihi 2.5 pips saat berita tinggi (NFP/CPI)
            </span>
          </div>
          <input
            type="checkbox"
            checked={riskSettings.enforceMaxSpread > 0}
            onChange={(e) =>
              onUpdateRiskSettings({
                enforceMaxSpread: e.target.checked ? 2.5 : 99,
              })
            }
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
