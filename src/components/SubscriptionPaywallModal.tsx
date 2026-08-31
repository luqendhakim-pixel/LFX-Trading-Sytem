import React, { useState } from "react";
import {
  Lock,
  Sparkles,
  CheckCircle2,
  Copy,
  MessageCircle,
  KeyRound,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  X,
  CreditCard,
} from "lucide-react";
import { authService } from "../services/authService";
import { UserProfile } from "../types";
import { LfxLogo } from "./LfxLogo";

interface SubscriptionPaywallModalProps {
  isOpen: boolean;
  onClose?: () => void;
  user: UserProfile | null;
  onSuccessActivation?: (updatedUser: UserProfile) => void;
  onSuccess?: (updatedUser: UserProfile) => void;
}

export const SubscriptionPaywallModal: React.FC<SubscriptionPaywallModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccessActivation,
  onSuccess,
}) => {
  const [activationCode, setActivationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(label);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  const handleRedeemCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activationCode.trim()) {
      setErrorMessage("Silakan masukkan Kode OTP / Aktivasi Langganan dari Admin");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await authService.activateLicense(activationCode.trim());
      if (res.success) {
        setSuccessMessage(res.message);
        const updated = authService.getUser();
        if (updated) {
          if (onSuccessActivation) onSuccessActivation(updated);
          if (onSuccess) onSuccess(updated);
        }
        setTimeout(() => {
          if (onClose) onClose();
        }, 1800);
      } else {
        setErrorMessage(res.message || "Kode aktivasi tidak valid.");
      }
    } catch {
      setErrorMessage("Gagal memverifikasi kode aktivasi.");
    } finally {
      setIsLoading(false);
    }
  };

  const adminWaUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(
    `Halo Admin LFX Trading System,\nSaya ingin konfirmasi pembayaran langganan sinyal Rp 150.000 / Bulan.\n\nNama/ID: ${user?.name || "Trader"} (${user?.identifier || "Email/WA"})\nMohon kirimkan Kode OTP Aktivasi VIP 30 Hari. Terima kasih!`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#090f1d] border border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-100 my-8">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Top Header */}
        <div className="text-center space-y-2 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black">
            <Lock className="w-3.5 h-3.5" />
            <span>MASA PERCOBAAN 7 HARI TELAH BERAKHIR</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Langganan Sinyal VIP LFX Trading
          </h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Dapatkan sinyal presisi XAU/USD (Gold) real-time berbasis TradingView TSS v6 Strategy & Smart Money Concepts.
          </p>
        </div>

        {/* Price Tag Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-emerald-950/80 border border-cyan-500/40 text-center relative overflow-hidden mb-5">
          <div className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
            PAKET LANGGANAN BULANAN
          </div>
          <div className="flex items-baseline justify-center gap-1.5 mt-1">
            <span className="text-3xl sm:text-4xl font-black text-white">Rp 150.000</span>
            <span className="text-sm font-bold text-slate-400">/ bulan (30 Hari)</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 font-medium">
            ✓ Akses Semua Sinyal Buy & Sell • Multi-TP 50 s/d 200 Pips
          </p>
        </div>

        {/* VIP Benefits List */}
        <div className="space-y-2 mb-5 bg-[#060a15]/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Fasilitas Member VIP LFX:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sinyal XAU/USD Real-time</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Level Stop Loss & TP 1-4</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Notifikasi Push Langsung</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Analisa AI Copilot & SMC</span>
            </div>
          </div>
        </div>

        {/* Step 1: Pembayaran & Konfirmasi Admin */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span>1. Transfer Pembayaran Rp 150.000:</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* BCA */}
            <div className="p-2.5 rounded-xl bg-[#080e1e] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Bank BCA</div>
                <div className="font-mono text-cyan-300 font-bold">123-456-7890</div>
                <div className="text-[10px] text-slate-400">a.n Luqend Ibnu Hakim</div>
              </div>
              <button
                onClick={() => handleCopyText("1234567890", "BCA")}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                title="Salin Nomor Rekening"
              >
                {copiedBank === "BCA" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Mandiri / E-Wallet */}
            <div className="p-2.5 rounded-xl bg-[#080e1e] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Bank Mandiri / Dana</div>
                <div className="font-mono text-cyan-300 font-bold">0812-3456-7890</div>
                <div className="text-[10px] text-slate-400">a.n Luqend Ibnu Hakim</div>
              </div>
              <button
                onClick={() => handleCopyText("081234567890", "Mandiri")}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                title="Salin Nomor Rekening"
              >
                {copiedBank === "Mandiri" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Tombol Konfirmasi WhatsApp Admin */}
          <a
            href={adminWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950 transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Kirim Bukti Transfer ke Admin (WhatsApp)</span>
          </a>
        </div>

        {/* Step 2: Masukkan Kode OTP / Aktivasi dari Admin */}
        <form onSubmit={handleRedeemCode} className="space-y-3 pt-4 border-t border-slate-800">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <span>2. Masukkan Kode OTP / Aktivasi dari Admin:</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value)}
              placeholder="Contoh: LFX-150VIP / Kode OTP 6 Digit"
              className="flex-1 uppercase font-mono tracking-wider bg-[#070c1a] border border-cyan-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={isLoading || !activationCode.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Aktifkan</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
