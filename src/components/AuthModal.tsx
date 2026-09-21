import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
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

type AuthTab = "REGISTER" | "LOGIN";
type LoginMode = "PASSWORD" | "OTP_WHATSAPP" | "OTP_EMAIL";

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [authTab, setAuthTab] = useState<AuthTab>("REGISTER");
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

  // 7-Day Trial Lockout State
  const [lockedTrialNotice, setLockedTrialNotice] = useState<{
    identifier: string;
    name?: string;
    expiredAt?: number;
  } | null>(() => authService.getTrialLockedNotice());
  const [licenseCode, setLicenseCode] = useState("");
  const [isActivatingLicense, setIsActivatingLicense] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLockedTrialNotice(authService.getTrialLockedNotice());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Handle Registration (New User)
  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const identifier = waNumber.trim() || email.trim();
    if (!fullName.trim()) {
      setErrorMessage("Silakan masukkan Nama Lengkap / Panggilan Anda");
      return;
    }
    if (!identifier) {
      setErrorMessage("Silakan masukkan Nomor WhatsApp atau Email");
      return;
    }
    if (!password.trim() || password.length < 4) {
      setErrorMessage("Password minimal 4 karakter");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await authService.loginWithPassword(
        identifier,
        password.trim(),
        fullName.trim(),
        true
      );

      if (res.trialExpired) {
        setLockedTrialNotice({
          identifier,
          name: fullName.trim(),
          expiredAt: res.expiredAt,
        });
        return;
      }

      if (res.success && res.user) {
        setSuccessMessage("Pendaftaran Berhasil! Selamat datang di LFX Trading System.");
        setTimeout(() => {
          onSuccess(res.user!);
        }, 500);
      } else {
        setErrorMessage(res.message || "Gagal mendaftar. Silakan coba lagi.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan pendaftaran.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Email & Password Login
  const handlePasswordLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Silakan masukkan alamat Email atau Nomor WhatsApp");
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
        fullName.trim(),
        false
      );

      if (res.trialExpired) {
        setLockedTrialNotice({
          identifier: email.trim(),
          name: fullName.trim(),
          expiredAt: res.expiredAt,
        });
        return;
      }

      if (res.success && res.user) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          onSuccess(res.user!);
        }, 500);
      } else {
        setErrorMessage(res.message || "Gagal masuk. Periksa data login Anda.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat masuk. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Request OTP (WhatsApp / Email)
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
      if (res.trialExpired) {
        setLockedTrialNotice({
          identifier,
          name: fullName.trim(),
          expiredAt: res.expiredAt,
        });
        return;
      }

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

  // 4. Handle Verify OTP
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

      if (res.trialExpired) {
        setLockedTrialNotice({
          identifier,
          name: fullName.trim(),
          expiredAt: res.expiredAt,
        });
        return;
      }

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

  // 5. Handle License Activation when Trial Expired
  const handleActivateLicenseFromLockout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!licenseCode.trim()) {
      setErrorMessage("Silakan masukkan Kode Lisensi VIP Anda");
      return;
    }
    setIsActivatingLicense(true);
    setErrorMessage("");
    try {
      const res = await authService.activateLicense(licenseCode.trim());
      if (res.success) {
        setSuccessMessage(res.message);
        authService.clearTrialLockedNotice();
        setLockedTrialNotice(null);
        setTimeout(() => {
          const u = authService.getUser();
          if (u) onSuccess(u);
        }, 800);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Gagal mengaktifkan lisensi. Periksa kembali kodenya.");
    } finally {
      setIsActivatingLicense(false);
    }
  };

  // RENDER TRIAL EXPIRED LOCKOUT VIEW
  if (lockedTrialNotice) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full max-w-md bg-[#090f1d] border border-rose-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 overflow-hidden">
          {/* Top Red Alert Glow */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-red-500 to-amber-500" />

          {/* Header Shield & Lock */}
          <div className="flex flex-col items-center text-center space-y-3 mb-5 mt-1">
            <div className="relative w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
              <ShieldAlert className="w-9 h-9 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 p-1 bg-red-600 rounded-lg text-white shadow">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-2">
                Akses Terkunci • Trial 7 Hari Habis
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                Masa Coba 7 Hari Selesai
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Akun Anda telah otomatis keluar (log out) dan tidak dapat mengakses kembali aplikasi ini menggunakan status Free Trial.
              </p>
            </div>
          </div>

          {/* Account Detail Box */}
          <div className="p-3.5 rounded-2xl bg-[#060a15] border border-slate-800 space-y-2 mb-5 text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Akun Terdaftar:</span>
              <span className="font-mono font-bold text-amber-300">{lockedTrialNotice.identifier}</span>
            </div>
            {lockedTrialNotice.name && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Nama Pengguna:</span>
                <span className="font-semibold text-slate-200">{lockedTrialNotice.name}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Status Akses:</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800/60">
                LOCKED (KADALUARSA)
              </span>
            </div>
          </div>

          {/* Activation Form */}
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                <span>Punya Kode Lisensi VIP?</span>
                <span className="text-[10px] text-cyan-400 font-normal">Akses Sinyal 30 Hari</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={licenseCode}
                  onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: LFX150VIP"
                  className="flex-1 bg-[#070c1a] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 uppercase transition"
                />
                <button
                  type="button"
                  onClick={handleActivateLicenseFromLockout}
                  disabled={isActivatingLicense || !licenseCode.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition disabled:opacity-40 cursor-pointer shrink-0"
                >
                  {isActivatingLicense ? "Memproses..." : "Aktifkan"}
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

            {/* Direct WhatsApp VIP Upgrade Button */}
            <a
              href={`https://wa.me/628123456789?text=Halo%20Admin%20LFX,%20masa%20free%20trial%207%20hari%20akun%20saya%20(${encodeURIComponent(lockedTrialNotice.identifier)})%20telah%20berakhir.%20Saya%20ingin%20mengaktifkan%20langganan%20VIP%20Pro%20Sinyal.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              <span>Hubungi Admin WhatsApp (+62 812-3456-789)</span>
            </a>

            {/* Switch Account */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  authService.clearTrialLockedNotice();
                  setLockedTrialNotice(null);
                  setAuthTab("LOGIN");
                  setErrorMessage("");
                }}
                className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Masuk dengan Akun Lain / Akun Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#090f1d] border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100">
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
        <div className="flex flex-col items-center text-center space-y-2.5 mb-6">
          <div className="p-2 rounded-2xl bg-[#060b17]/80 border border-slate-800 shadow-inner flex items-center justify-center">
            <LfxLogo variant="full" className="h-14 sm:h-16" />
          </div>
          <p className="text-xs text-slate-300 font-medium max-w-xs">
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

        {/* Mode Selector Tabs: DAFTAR vs MASUK */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#060a15] rounded-2xl border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => {
              setAuthTab("REGISTER");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              authTab === "REGISTER"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/60"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Daftar (Trial 7 Hari)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthTab("LOGIN");
              setErrorMessage("");
              setSuccessMessage("");
              setStep("INPUT");
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              authTab === "LOGIN"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/60"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Masuk / Login</span>
          </button>
        </div>

        {/* 1. REGISTRATION TAB (For New Users) */}
        {authTab === "REGISTER" && (
          <form onSubmit={handleRegister} className="space-y-3.5 animate-fadeIn">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Lengkap / Panggilan <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Budi Santoso / Trader Gold"
                  required
                  className="w-full bg-[#070c1a] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
                <User className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>

            {/* Email / WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nomor WhatsApp atau Alamat Email <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="08123456789 atau trader@gmail.com"
                  required
                  className="w-full bg-[#070c1a] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
                <Mail className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Buat Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Buat Password Akun <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  required
                  className="w-full bg-[#070c1a] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
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
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mendaftarkan Akun...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Daftar & Aktifkan Free Trial 7 Hari</span>
                </>
              )}
            </button>

            <div className="text-center pt-1 text-xs text-slate-400">
              Sudah punya akun?{" "}
              <button
                type="button"
                onClick={() => setAuthTab("LOGIN")}
                className="text-cyan-400 font-bold hover:underline cursor-pointer"
              >
                Masuk di sini
              </button>
            </div>
          </form>
        )}

        {/* 2. LOGIN TAB */}
        {authTab === "LOGIN" && (
          <div className="space-y-4">
            {/* Sub-mode selector in Login */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoginMode("PASSWORD");
                  setErrorMessage("");
                }}
                className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  loginMode === "PASSWORD"
                    ? "bg-slate-800 text-white border border-slate-600"
                    : "bg-[#060a15] text-slate-400 border border-slate-800"
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Password</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode("OTP_WHATSAPP");
                  setErrorMessage("");
                  setStep("INPUT");
                }}
                className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  loginMode !== "PASSWORD"
                    ? "bg-slate-800 text-white border border-slate-600"
                    : "bg-[#060a15] text-slate-400 border border-slate-800"
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>OTP WhatsApp</span>
              </button>
            </div>

            {/* Email & Password Login */}
            {loginMode === "PASSWORD" && (
              <form onSubmit={handlePasswordLogin} className="space-y-3.5 animate-fadeIn">
                {/* Email or WA */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email atau Nomor WhatsApp
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email / WhatsApp terdaftar"
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
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-98 transition disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Memproses Masuk...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Masuk ke Akun Trading</span>
                    </>
                  )}
                </button>

                {/* Register/Login link */}
                <div className="pt-2 border-t border-slate-800/80 text-center">
                  <button
                    type="button"
                    onClick={() => setAuthTab("REGISTER")}
                    className="text-xs text-slate-400 hover:text-cyan-400 underline cursor-pointer"
                  >
                    Belum punya akun? Daftar Akun Baru (Free Trial 7 Hari)
                  </button>
                </div>
              </form>
            )}

            {/* OTP Login */}
            {loginMode !== "PASSWORD" && step === "INPUT" && (
              <form onSubmit={handleRequestOTP} className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nomor WhatsApp Terdaftar
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={waNumber}
                      onChange={(e) => setWaNumber(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      required
                      className="w-full bg-[#070c1a] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                    <div className="absolute right-3 top-2.5 text-slate-400">
                      <MessageCircle className="w-5 h-5 text-emerald-400" />
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
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition disabled:opacity-50 cursor-pointer"
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

            {/* OTP Verification Step */}
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
                      {waNumber || email}
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
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition disabled:opacity-50 cursor-pointer"
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
                    ← Ganti Nomor
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
        )}
      </div>
    </div>
  );
};
