import React, { useState, useEffect } from "react";
import {
  User,
  ShieldCheck,
  Bell,
  Volume2,
  Code,
  Copy,
  Check,
  Smartphone,
  Key,
  ExternalLink,
  Award,
  LogOut,
  Sparkles,
  Lock,
  Zap,
  CreditCard,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { getPineScriptCode } from "../utils/trendStateStrategy";
import { notificationService } from "../utils/notificationService";
import { authService } from "../services/authService";
import { UserProfile } from "../types";
import { LfxLogo } from "./LfxLogo";

interface AccountProfileViewProps {
  pushNotificationEnabled: boolean;
  onRequestPushNotification: () => void;
  onOpenPaywall?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenAuthModal?: () => void;
}

export const AccountProfileView: React.FC<AccountProfileViewProps> = ({
  pushNotificationEnabled,
  onRequestPushNotification,
  onOpenPaywall,
  onOpenAdminPanel,
  onOpenAuthModal,
}) => {
  const [user, setUser] = useState<UserProfile | null>(() => authService.getUser());
  const [copiedScript, setCopiedScript] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const unsub = authService.subscribe((u) => {
      setUser(u);
    });
    return unsub;
  }, []);

  const pineScriptCode = getPineScriptCode();

  const handleCopyPineScript = () => {
    navigator.clipboard.writeText(pineScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleTestNotification = () => {
    notificationService.sendMobilePush("🚨 TEST NOTIFIKASI HANDPHONE 🚨", {
      body: "Sinyal Realtime XAU/USD Aktif | SL: 50 Pips | TP1/TP2/TP3/TP4 Otomatis. Notifikasi berhasil aktif di perangkat Anda!",
    });
  };

  const handleLogout = () => {
    authService.logout();
    if (onOpenAuthModal) {
      onOpenAuthModal();
    }
  };

  const isAdmin = user?.role === "ADMIN" || user?.identifier === "luqendhakim@gmail.com";

  return (
    <div
      id="account-profile-view"
      className="w-full max-w-lg md:max-w-3xl mx-auto pb-28 pt-2 px-3 sm:px-4 text-slate-100 space-y-4 animate-fadeIn"
    >
      {/* Brand Header Banner */}
      <div className="flex items-center justify-between py-2 px-3 sm:px-4 rounded-2xl bg-[#060a15]/90 border border-slate-800/80 backdrop-blur-md">
        <LfxLogo variant="full" className="h-8 sm:h-9" />
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md">
          v6.2 PRO
        </span>
      </div>

      {/* User Profile Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#0e162c] via-[#091022] to-[#070b18] border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-500 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#070b18] rounded-full flex items-center justify-center text-cyan-400 font-black text-base">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "LH"}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  {user?.name || "LuqendIbnuHakim"}
                </h2>
                {isAdmin ? (
                  <span className="bg-purple-950 border border-purple-500/40 text-purple-300 text-[10px] font-extrabold px-2 py-0.2 rounded-md">
                    ADMIN OWNER
                  </span>
                ) : user?.status === "SUBSCRIBED" ? (
                  <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold px-2 py-0.2 rounded-md">
                    VIP MEMBER
                  </span>
                ) : user?.status === "TRIAL_ACTIVE" ? (
                  <span className="bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-extrabold px-2 py-0.2 rounded-md">
                    FREE TRIAL (7 HARI)
                  </span>
                ) : (
                  <span className="bg-rose-950 border border-rose-500/40 text-rose-300 text-[10px] font-extrabold px-2 py-0.2 rounded-md">
                    TRIAL EXPIRED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {user?.identifier || "luqendhakim@gmail.com"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/80 hover:text-rose-300 text-slate-400 transition"
            title="Keluar / Ganti Akun"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Subscription / Trial Status Banner */}
        <div className="p-3 rounded-2xl bg-[#060a14] border border-slate-800/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-200">
                {isAdmin
                  ? "Akses Penuh Sistem Sebagai Admin"
                  : user?.status === "SUBSCRIBED"
                  ? `Paket VIP Aktif: Sisa ${user?.daysRemaining || 30} Hari`
                  : user?.status === "TRIAL_ACTIVE"
                  ? `Masa Percobaan: Sisa ${user?.daysRemaining || 7} Hari`
                  : "Masa Percobaan Habis (Sinyal Terkunci)"}
              </div>
              <div className="text-[11px] text-slate-400">
                {isAdmin
                  ? "Dapat memvalidasi pembayaran dan generate kode VIP"
                  : user?.isSubscriptionActive
                  ? "Semua sinyal live, TP 1-4 & SL 50 pips aktif normal"
                  : "Silakan bayar Rp 150.000 / Bulan untuk membuka kembali sinyal"}
              </div>
            </div>
          </div>

          {!isAdmin && (
            <button
              onClick={onOpenPaywall}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs shrink-0 shadow-md transition active:scale-95 cursor-pointer"
            >
              {user?.status === "SUBSCRIBED" ? "Perpanjang VIP" : "Langganan VIP"}
            </button>
          )}
        </div>
      </div>

      {/* ADMIN CONTROLS (If logged in as Admin) */}
      {isAdmin && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/60 via-[#0a0f24] to-cyan-950/60 border border-purple-500/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Panel Kontrol Admin (Luqend Ibnu Hakim)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded-full border border-purple-500/30">
              Akses Khusus
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Kelola member terdaftar, generate Kode OTP Aktivasi Rp 150.000 / Bulan, dan kirim langsung ke WhatsApp member.
          </p>
          <button
            onClick={onOpenAdminPanel}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 transition active:scale-98 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Buka Admin Licensing & Member Center</span>
          </button>
        </div>
      )}

      {/* Mobile Push Notification Controls */}
      <div className="p-4 rounded-3xl bg-[#090e1e] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Notifikasi Sinyal Real-time
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">Mobile & Browser</span>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-400" />
              <span>Izin Notifikasi Handphone</span>
            </div>
            <button
              onClick={onRequestPushNotification}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                pushNotificationEnabled
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-amber-500 text-slate-950 font-black"
              }`}
            >
              {pushNotificationEnabled ? "Aktif ✓" : "Aktifkan Izin"}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <span>Suara Alert Chime</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                soundEnabled
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {soundEnabled ? "Aktif" : "Mati"}
            </button>
          </div>

          {/* Test Notification Button */}
          <button
            id="btn-test-notification"
            onClick={handleTestNotification}
            className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-sky-600/20 active:scale-98"
          >
            <Bell className="w-4 h-4" />
            <span>Kirim Notifikasi Uji Coba ke Handphone</span>
          </button>
        </div>
      </div>

      {/* TradingView Pine Script TSS Source Reference - EXCLUSIVE TO ADMIN ONLY */}
      {isAdmin && (
        <div className="p-4 rounded-3xl bg-[#090e1e] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Script TradingView (TSS Strategy)
              </h3>
              <span className="text-[9px] font-extrabold text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/40">
                KHUSUS ADMIN
              </span>
            </div>
            <button
              onClick={handleCopyPineScript}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
            >
              {copiedScript ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Script</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Script Pine Script v5 resmi dengan Stop Loss 50 pips dan target TP1, TP2, TP3, TP4 untuk TradingView editor.
          </p>

          <pre className="p-3 bg-[#050813] border border-slate-800/80 rounded-xl text-[10px] text-slate-300 font-mono overflow-x-auto max-h-36">
            {pineScriptCode}
          </pre>
        </div>
      )}
    </div>
  );
};
