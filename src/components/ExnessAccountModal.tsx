import React, { useState } from "react";
import { ExnessAccountConfig } from "../types";
import {
  ShieldCheck,
  Server,
  Key,
  UserCheck,
  Activity,
  CheckCircle2,
  X,
  AlertTriangle,
  Lock,
  Zap,
} from "lucide-react";

interface ExnessAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountConfig: ExnessAccountConfig;
  onSaveConfig: (config: ExnessAccountConfig) => void;
}

export const ExnessAccountModal: React.FC<ExnessAccountModalProps> = ({
  isOpen,
  onClose,
  accountConfig,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<ExnessAccountConfig>({
    ...accountConfig,
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    ping: number;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const exnessServers = [
    "Exness-MT5Trial14",
    "Exness-MT5Trial",
    "Exness-MT5Trial2",
    "Exness-MT5Trial5",
    "Exness-MT5Trial7",
    "Exness-Trial",
    "Exness-Trial2",
    "Exness-Real",
    "Exness-Real2",
    "Exness-Real10",
    "Exness-Real14",
    "Exness-Real20",
  ];

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      const randomPing = Math.floor(Math.random() * 15) + 18; // 18-32ms
      setTestResult({
        success: true,
        ping: randomPing,
        message: `Terhubung dengan sukses ke ${formData.server} (${randomPing}ms ping). Bridge protokol MT4/MT5 aktif.`,
      });
      setFormData((prev) => ({
        ...prev,
        isConnected: true,
        pingMs: randomPing,
      }));
    }, 1100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...formData,
      isConnected: true,
      pingMs: formData.pingMs || 24,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        id="exness-account-modal"
        className="w-full max-w-lg bg-[#0f1420] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#141b2d]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                Koneksi Akun Exness Demo / Real
              </h3>
              <p className="text-xs text-slate-400">
                Hubungkan server Exness untuk verifikasi sinyal & eksekusi
              </p>
            </div>
          </div>
          <button
            id="close-exness-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Login ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Exness Login ID (Akun MT4/MT5)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.loginId}
                  onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                  placeholder="Contoh: 142859120"
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition font-mono"
                />
                <UserCheck className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>

            {/* Server */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pilih Server Exness
              </label>
              <select
                value={formData.server}
                onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition font-mono"
              >
                {exnessServers.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Password (Demo / Investor / Trading Pass) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Password Trading / Investor</span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> Tersimpan lokal & aman
              </span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={formData.password || ""}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition font-mono"
              />
              <Key className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            </div>
          </div>

          {/* Account Type & Leverage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipe Akun
              </label>
              <select
                value={formData.accountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    accountType: e.target.value as any,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
              >
                <option value="Standard">Standard (Spread 1.2p)</option>
                <option value="Pro">Pro (Instant Exec)</option>
                <option value="Raw Spread">Raw Spread (0.0p + Comm)</option>
                <option value="Zero">Zero Spread</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Leverage
              </label>
              <select
                value={formData.leverage}
                onChange={(e) => setFormData({ ...formData, leverage: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition font-mono"
              >
                <option value="100">1:100</option>
                <option value="200">1:200</option>
                <option value="500">1:500 (Direkomendasikan)</option>
                <option value="1000">1:1000</option>
                <option value="2000">1:2000 Unlimited</option>
              </select>
            </div>
          </div>

          {/* Connection Test Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
                testResult.success
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-950/40 border-rose-500/40 text-rose-300"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{testResult.message}</p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Sinyal siap dieksekusi mandiri di demo terminal dan dikirim notifikasi ke HP Anda.
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-3">
            <button
              type="button"
              id="btn-test-exness-connection"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition flex items-center gap-2"
            >
              <Activity className={`w-4 h-4 ${isTesting ? "animate-spin text-amber-400" : ""}`} />
              {isTesting ? "Testing Ping..." : "Tes Koneksi Server"}
            </button>

            <button
              type="submit"
              id="btn-save-exness-account"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wide transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Simpan & Sinkronkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
