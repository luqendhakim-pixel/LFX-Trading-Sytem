import React, { useState, useEffect } from "react";
import { MobileNotification, AISignal } from "../types";
import {
  requestNotificationPermission,
  getNotificationPermission,
} from "../utils/notifications";
import {
  Smartphone,
  Bell,
  CheckCheck,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  TrendingUp,
  TrendingDown,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
} from "lucide-react";

interface MobileNotificationHubProps {
  notifications: MobileNotification[];
  onClearNotifications: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeSignal: AISignal | null;
  onSendTestNotification: () => void;
}

export const MobileNotificationHub: React.FC<MobileNotificationHubProps> = ({
  notifications,
  onClearNotifications,
  soundEnabled,
  onToggleSound,
  activeSignal,
  onSendTestNotification,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileFilter, setMobileFilter] = useState<"ALL" | "SIGNALS" | "RESULTS">("ALL");
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    setBrowserPermission(getNotificationPermission());
  }, []);

  const handleRequestBrowserPermission = async () => {
    const perm = await requestNotificationPermission();
    setBrowserPermission(perm);
  };

  const handleCopyNotification = (notif: MobileNotification) => {
    if (!notif.params) return;
    const text = `XAU/USD ${notif.params.action}\nEntry: ${notif.params.entry}\nSL: ${notif.params.sl}\nTP: ${notif.params.tp}\nLot: ${notif.params.lot}`;
    navigator.clipboard.writeText(text);
    setCopiedId(notif.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredNotifs = notifications.filter((n) => {
    if (mobileFilter === "SIGNALS") return n.type === "SIGNAL" || n.type === "ORDER_FILLED";
    if (mobileFilter === "RESULTS") return n.type === "TP_HIT" || n.type === "SL_HIT";
    return true;
  });

  return (
    <div
      id="mobile-notification-hub"
      className="bg-[#0f1420] border border-slate-800 rounded-xl p-4 shadow-xl text-slate-100 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
              Notifikasi HP & Sinyal Entry
            </h3>
            <p className="text-[11px] text-slate-400">
              Sinkronisasi Push Instan HP & Auto-Demo Terminal
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {browserPermission !== "granted" && (
            <button
              id="btn-enable-browser-push"
              onClick={handleRequestBrowserPermission}
              className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
              title="Aktifkan notifikasi browser web agar muncul saat tab tertutup/background"
            >
              <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>Push Web</span>
            </button>
          )}

          <button
            id="toggle-sound-btn"
            onClick={onToggleSound}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              soundEnabled
                ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                : "bg-slate-800 border-slate-700 text-slate-500"
            }`}
            title={soundEnabled ? "Suara Notifikasi Aktif" : "Suara Diheningkan"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            id="btn-test-notification"
            onClick={onSendTestNotification}
            className="px-2.5 py-1 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 rounded-lg text-xs font-semibold transition cursor-pointer"
            title="Kirim simulasi notifikasi push ke HP"
          >
            Tes Push
          </button>
        </div>
      </div>

      {/* Verification Workflow & Mobile Background Push Explanation Card */}
      <div className="p-3.5 bg-gradient-to-br from-slate-900 via-[#0a1020] to-slate-900 rounded-2xl border border-sky-500/30 text-xs text-slate-300 space-y-2 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
            <span>NOTIFIKASI BILAH STATUS HP (WHATSAPP-STYLE):</span>
          </div>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
            browserPermission === "granted"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              : "bg-amber-500/20 text-amber-300 border-amber-500/40"
          }`}>
            {browserPermission === "granted" ? "Status Bar: AKTIF ✓" : "Izin Dibutuhkan"}
          </span>
        </div>

        <p className="text-[11.5px] text-slate-300 leading-relaxed">
          🔔 <strong>Saat aplikasi di-minimize atau layar HP terkunci</strong>, notifikasi sinyal entry & update TP/SL/BE akan otomatis muncul di bilah notifikasi atas handphone Anda layaknya notifikasi chat WhatsApp.
        </p>

        {browserPermission !== "granted" ? (
          <div className="pt-1">
            <button
              onClick={handleRequestBrowserPermission}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Radio className="w-4 h-4 text-slate-950 animate-pulse" />
              <span>Izinkan Notifikasi Muncul di Bilah HP Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-emerald-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Izin Browser & Service Worker Aktif.</span>
            </span>
            <button
              onClick={onSendTestNotification}
              className="text-sky-400 hover:text-sky-300 underline font-bold cursor-pointer"
            >
              Kirim Tes ke Status Bar HP →
            </button>
          </div>
        )}
      </div>

      {/* Simulated Smartphone Lockscreen Feed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Feed Notifikasi Real-time ({filteredNotifs.length})</span>
          </span>

          {notifications.length > 0 && (
            <button
              onClick={onClearNotifications}
              className="text-[10px] text-slate-400 hover:text-slate-200 underline"
            >
              Bersihkan
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 text-[11px]">
          <button
            onClick={() => setMobileFilter("ALL")}
            className={`px-2.5 py-0.5 rounded-full border transition ${
              mobileFilter === "ALL"
                ? "bg-slate-800 text-amber-400 border-amber-500/40 font-bold"
                : "text-slate-400 border-slate-800"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setMobileFilter("SIGNALS")}
            className={`px-2.5 py-0.5 rounded-full border transition ${
              mobileFilter === "SIGNALS"
                ? "bg-slate-800 text-sky-400 border-sky-500/40 font-bold"
                : "text-slate-400 border-slate-800"
            }`}
          >
            Sinyal Entry
          </button>
          <button
            onClick={() => setMobileFilter("RESULTS")}
            className={`px-2.5 py-0.5 rounded-full border transition ${
              mobileFilter === "RESULTS"
                ? "bg-slate-800 text-emerald-400 border-emerald-500/40 font-bold"
                : "text-slate-400 border-slate-800"
            }`}
          >
            Hasil TP / SL
          </button>
        </div>

        {/* Notification Cards List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {filteredNotifs.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs">
              <Bell className="w-5 h-5 mx-auto mb-1.5 opacity-30" />
              <p>Belum ada notifikasi baru.</p>
              <p className="text-[10px] text-slate-600">
                Notifikasi akan muncul otomatis saat ada pergerakan sinyal atau TP/SL hit.
              </p>
            </div>
          ) : (
            filteredNotifs.map((notif) => {
              const isSignal = notif.type === "SIGNAL";
              const isTP = notif.type === "TP_HIT";
              const isSL = notif.type === "SL_HIT";

              return (
                <div
                  key={notif.id}
                  className={`p-3 rounded-xl border text-xs relative transition shadow-sm ${
                    isTP
                      ? "bg-emerald-950/25 border-emerald-500/40 text-emerald-200"
                      : isSL
                      ? "bg-rose-950/25 border-rose-500/40 text-rose-200"
                      : isSignal
                      ? "bg-sky-950/30 border-sky-500/40 text-sky-200"
                      : "bg-slate-900 border-slate-800 text-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isTP
                            ? "bg-emerald-500 text-slate-950"
                            : isSL
                            ? "bg-rose-500 text-white"
                            : "bg-sky-500 text-slate-950"
                        }`}
                      >
                        {isTP ? "TP" : isSL ? "SL" : "AI"}
                      </div>
                      <div>
                        <span className="font-bold text-slate-100 text-xs block">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{notif.time}</span>
                      </div>
                    </div>

                    {notif.params && (
                      <button
                        onClick={() => handleCopyNotification(notif)}
                        className="px-2 py-1 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition"
                        title="Salin parameter untuk entry cepat di MT4/MT5 HP"
                      >
                        {copiedId === notif.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin HP</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-300 mt-2 leading-relaxed font-sans">
                    {notif.body}
                  </p>

                  {notif.params && (
                    <div className="mt-2 pt-2 border-t border-slate-800/70 flex flex-wrap gap-2 text-[10px] font-mono">
                      <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                        Aksi: <strong>{notif.params.action}</strong>
                      </span>
                      <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                        Entry: <strong>${notif.params.entry}</strong>
                      </span>
                      <span className="bg-rose-950/40 text-rose-300 px-2 py-0.5 rounded border border-rose-900/40">
                        SL: <strong>${notif.params.sl}</strong>
                      </span>
                      <span className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-900/40">
                        TP: <strong>${notif.params.tp}</strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
