import React, { useState } from "react";
import {
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  MessageCircle,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { authService } from "../services/authService";
import { AuthMethod, UserProfile } from "../types";
import { LfxLogo } from "./LfxLogo";

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (user: UserProfile) => void;
}

type LoginMode = "PASSWORD" | "OTP_WHATSAPP" | "OTP_EMAIL";

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loginMode, setLoginMode] = useState<LoginMode>("PASSWORD");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [waNumber, setWaNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"INPUT" | "OTP">("INPUT");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Handle Email & Password Login (Primary)
  const handlePasswordLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Silakan masukkan alamat Email Anda");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Silakan masukkan Password Anda");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await authService.loginWithPassword(
        email.trim(),
        password.trim(),
        fullName.trim()
      );
      if (res.success && res.user) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          onSuccess(res.user!);
        }, 500);
      } else {
        setErrorMessage(res.message || "Gagal masuk. Periksa email dan password.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat masuk. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Request OTP (WhatsApp / Email)
  const handleRequestOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const identifier = loginMode === "OTP_WHATSAPP" ? waNumber.trim() : email.trim();
    const authMethod: AuthMethod = loginMode === "OTP_WHATSAPP" ? "WHATSAPP" : "EMAIL";

    if (!identifier) {
      setErrorMessage(
        authMethod === "WHATSAPP"
          ? "Silakan masukkan nomor WhatsApp Anda"
          : "Silakan masukkan alamat Email Anda"
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await authService.requestOTP(identifier, authMethod, fullName.trim());
      if (res.success) {
        setStep("OTP");
        setSuccessMessage(res.message);
        if (res.previewOtp) {
          setPreviewOtp(res.previewOtp);
        }
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Gagal mengirimkan OTP. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Verify OTP
  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpCode.trim()) {
      setErrorMessage("Silakan masukkan 6 digit kode OTP");
      return;
    }

    const identifier = loginMode === "OTP_WHATSAPP" ? waNumber.trim() : email.trim();
    const authMethod: AuthMethod = loginMode === "OTP_WHATSAPP" ? "WHATSAPP" : "EMAIL";

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await authService.verifyOTP(
        identifier,
        otpCode.trim(),
        authMethod,
        fullName.trim()
      );
      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setErrorMessage(res.message || "Kode OTP tidak sesuai");
      }
    } catch {
      setErrorMessage("Verifikasi gagal. Pastikan kode OTP benar.");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Admin Login
  const handleQuickAdminLogin = async () => {
    setEmail("luqendhakim@gmail.com");
    setPassword("admin123");
    setFullName("LuqendIbnuHakim");
    setIsLoading(true);
    const res = await authService.loginWithPassword(
      "luqendhakim@gmail.com",
      "admin123",
      "LuqendIbnuHakim"
    );
    setIsLoading(false);
    if (res.success && res.user) {
      onSuccess(res.user);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#0e1629] via-[#090f1d] to-[#040711] border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button if dismissible */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2 mb-5">
          <LfxLogo variant="full" className="h-10" />
          <p className="text-xs text-slate-400 max-w-xs">
            Sistem Autentikasi & Keamanan Sinyal XAU/USD
          </p>
        </div>

        {/* Trial 7 Days Banner */}
        <div className="mb-4 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-cyan-300">Free Trial 7 Hari Otomatis</div>
            <div className="text-[11px] text-slate-300">
              Pengguna baru otomatis mendapatkan akses sinyal XAU/USD gratis selama 7 hari.
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#060a15] rounded-xl border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => {
              setLoginMode("PASSWORD");
              setErrorMessage("");
              setStep("INPUT");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              loginMode === "PASSWORD"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-900/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Email & Password</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode("OTP_WHATSAPP");
              setErrorMessage("");
              setStep("INPUT");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              loginMode === "OTP_WHATSAPP" || loginMode === "OTP_EMAIL"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Kode OTP Masuk</span>
          </button>
        </div>

        {/* 1. EMAIL & PASSWORD LOGIN FORM */}
        {loginMode === "PASSWORD" && (
          <form onSubmit={handlePasswordLogin} className="space-y-3.5 animate-fadeIn">
            {/* Nama (Opsional untuk user baru) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Lengkap / Panggilan
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Ahmad / Trader Gold"
                  className="w-full bg-[#070c1a] border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
                <User className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@gmail.com"
                  required
                  className="w-full bg-[#070c1a] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
                <Mail className="w-4 h-4 text-cyan-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#070c1a] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Masuk / Mulai Free Trial 7 Hari</span>
                </>
              )}
            </button>

            {/* Quick Admin Access */}
            <div className="pt-2 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
              >
                👑 Masuk sebagai Admin (LuqendIbnuHakim)
              </button>
            </div>
          </form>
        )}

        {/* 2. OTP LOGIN (WhatsApp / Email) */}
        {loginMode !== "PASSWORD" && step === "INPUT" && (
          <form onSubmit={handleRequestOTP} className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLoginMode("OTP_WHATSAPP")}
                className={`py-1.5 rounded-lg text-xs font-bold transition ${
                  loginMode === "OTP_WHATSAPP"
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-800/60 text-slate-400"
                }`}
              >
                OTP WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setLoginMode("OTP_EMAIL")}
                className={`py-1.5 rounded-lg text-xs font-bold transition ${
                  loginMode === "OTP_EMAIL"
                    ? "bg-cyan-700 text-white"
                    : "bg-slate-800/60 text-slate-400"
                }`}
              >
                OTP Email
              </button>
            </div>

            {/* Nama Pengguna */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nama Lengkap / Panggilan
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Luqend / Ahmad"
                className="w-full bg-[#070c1a] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Identifier */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {loginMode === "OTP_WHATSAPP" ? "Nomor WhatsApp" : "Alamat Email"}
              </label>
              <div className="relative">
                <input
                  type={loginMode === "OTP_WHATSAPP" ? "tel" : "email"}
                  value={loginMode === "OTP_WHATSAPP" ? waNumber : email}
                  onChange={(e) =>
                    loginMode === "OTP_WHATSAPP"
                      ? setWaNumber(e.target.value)
                      : setEmail(e.target.value)
                  }
                  placeholder={
                    loginMode === "OTP_WHATSAPP"
                      ? "Contoh: 081234567890"
                      : "Contoh: trader@gmail.com"
                  }
                  required
                  className="w-full bg-[#070c1a] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
                <div className="absolute right-3 top-2.5 text-slate-400">
                  {loginMode === "OTP_WHATSAPP" ? (
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Mail className="w-5 h-5 text-cyan-400" />
                  )}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengirim Kode OTP...</span>
                </>
              ) : (
                <>
                  <span>Kirim Kode OTP Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. STEP OTP VERIFICATION */}
        {loginMode !== "PASSWORD" && step === "OTP" && (
          <form onSubmit={handleVerifyOTP} className="space-y-4 animate-fadeIn">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 mb-1">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Masukkan 6 Digit Kode OTP</h3>
              <p className="text-xs text-slate-400">
                Kode verifikasi telah dikirim ke: <br />
                <span className="font-mono font-bold text-cyan-300">
                  {loginMode === "OTP_WHATSAPP" ? waNumber : email}
                </span>
              </p>
            </div>

            {previewOtp && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Kode OTP: <strong className="font-mono text-sm text-white">{previewOtp}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpCode(previewOtp)}
                  className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 text-[10px] font-bold hover:bg-emerald-500/50"
                >
                  Isi Otomatis
                </button>
              </div>
            )}

            <div>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="• • • • • •"
                autoFocus
                required
                className="w-full text-center tracking-[12px] font-mono text-2xl font-black bg-[#070c1a] border border-cyan-500/60 rounded-2xl py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              />
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || otpCode.length < 6}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verifikasi & Masuk Sekarang</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <button
                type="button"
                onClick={() => setStep("INPUT")}
                className="hover:text-slate-200 underline cursor-pointer"
              >
                ← Ganti Nomor/Email
              </button>

              <button
                type="button"
                onClick={() => handleRequestOTP()}
                disabled={isLoading}
                className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
              >
                Kirim Ulang OTP
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
