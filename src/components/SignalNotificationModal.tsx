import React, { useState } from "react";
import {
  Bell,
  X,
  CheckCheck,
  Check,
  Copy,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Scale,
  Sparkles,
  ExternalLink,
  Volume2,
  Radio,
} from "lucide-react";
import { MobileNotification, AISignal } from "../types";
import { formatRelativeTime } from "../utils/notificationHelper";
import { notificationService } from "../utils/notificationService";

interface SignalNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: MobileNotification[];
  signalsList: AISignal[];
  onSelectSignal: (signal: AISignal) => void;
  onMarkAllAsRead: () => void;
  onClearNotifications?: () => void;
  pushNotificationEnabled: boolean;
  onRequestPushNotification: () => void;
}

export const SignalNotificationModal: React.FC<SignalNotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  signalsList,
  onSelectSignal,
  onMarkAllAsRead,
  onClearNotifications,
  pushNotificationEnabled,
  onRequestPushNotification,
}) => {
  const [filterType, setFilterType] = useState<"ALL" | "TP" | "ENTRY" | "SL_BE">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter logic
  const filteredNotifications = notifications.filter((notif) => {
    if (filterType === "TP") return notif.type === "TP_HIT";
    if (filterType === "ENTRY") return notif.type === "SIGNAL" || notif.type === "ORDER_FILLED";
    if (filterType === "SL_BE") return notif.type === "SL_HIT" || notif.type === "BREAKEVEN";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const tpCount = notifications.filter((n) => n.type === "TP_HIT").length;
  const entryCount = notifications.filter(
    (n) => n.type === "SIGNAL" || n.type === "ORDER_FILLED"
  ).length;
  const slBeCount = notifications.filter(
    (n) => n.type === "SL_HIT" || n.type === "BREAKEVEN"
  ).length;

  const handleCopyText = (notif: MobileNotification) => {
    const text = `${notif.title}\n${notif.body}\nWaktu: ${notif.time}`;
    navigator.clipboard.writeText(text);
    setCopiedId(notif.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCardClick = (notif: MobileNotification) => {
    if (notif.signalId) {
      const found = signalsList.find((s) => s.id === notif.signalId);
      if (found) {
        onSelectSignal(found);
        onClose();
        return;
      }
    }
    // Fallback: search by price or type
    if (notif.params) {
      const match = signalsList.find(
        (s) =>
          Math.abs(s.entryPrice - notif.params!.entry) < 0.2 ||
          s.signalType === notif.params!.action
      );
      if (match) {
        onSelectSignal(match);
        onClose();
      }
    }
  };

  const handleTestAlert = () => {
    notificationService.sendMobilePush("🚨 TEST NOTIFIKASI REALTIME 🚨", {
      body: "Sinyal XAU/USD Real-time Aktif! Notifikasi berhasil terhubung dengan perangkat Anda.",
    });
    notificationService.playSignalSound();
  };

  return (
    <div
      id="signal-notification-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="signal-notification-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0b1021] border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 animate-scaleUp"
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-[#0c1228] via-[#0b1021] to-[#0c1228] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-md shadow-cyan-950/40">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-white text-base tracking-tight">
                  Notifikasi & Riwayat Alert
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE FEED AKTIF
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sinkronisasi riwayat sinyal XAU/USD, TP Win, SL, dan Break Even
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
            title="Tutup Notifikasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOP STATUS BAR: PUSH STATUS & QUICK ACTIONS */}
        <div className="px-4 sm:px-5 py-2.5 bg-[#080d1c] border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            {!pushNotificationEnabled ? (
              <button
                onClick={onRequestPushNotification}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-[11px] transition cursor-pointer"
                title="Aktifkan izin notifikasi push browser / HP"
              >
                <Radio className="w-3 h-3 animate-pulse text-amber-400" />
                <span>Aktifkan Push HP</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Push HP Terhubung
              </span>
            )}

            <button
              onClick={handleTestAlert}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 transition cursor-pointer"
              title="Tes audio & push notifikasi"
            >
              <Volume2 className="w-3 h-3 text-cyan-400" />
              <span>Tes Suara</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                title="Tandai semua pesan sudah dibaca"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai Dibaca ({unreadCount})</span>
              </button>
            )}

            {onClearNotifications && notifications.length > 0 && (
              <button
                onClick={onClearNotifications}
                className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                title="Bersihkan riwayat notifikasi"
              >
                Bersihkan
              </button>
            )}
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="p-3 sm:px-5 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs border-b border-slate-800/60 shrink-0">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              filterType === "ALL"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <span>Semua Alert</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
              {notifications.length}
            </span>
          </button>

          <button
            onClick={() => setFilterType("TP")}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              filterType === "TP"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <span>🎯 TP Win</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-mono">
              {tpCount}
            </span>
          </button>

          <button
            onClick={() => setFilterType("ENTRY")}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              filterType === "ENTRY"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <span>🚨 Sinyal Baru</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-950/60 text-sky-300 border border-sky-500/30 font-mono">
              {entryCount}
            </span>
          </button>

          <button
            onClick={() => setFilterType("SL_BE")}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              filterType === "SL_BE"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <span>🛑 SL & BE</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-950/60 text-rose-300 border border-rose-500/30 font-mono">
              {slBeCount}
            </span>
          </button>
        </div>

        {/* NOTIFICATIONS SCROLLABLE LIST */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                Tidak ada notifikasi pada kategori ini.
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Notifikasi akan otomatis masuk dan diperbarui saat ada sinyal baru atau TP/SL tercapai.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isTp = notif.type === "TP_HIT";
              const isSl = notif.type === "SL_HIT";
              const isBe = notif.type === "BREAKEVEN";
              const isSignal = notif.type === "SIGNAL" || notif.type === "ORDER_FILLED";
              const isUnread = !notif.read;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleCardClick(notif)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer group relative ${
                    isTp
                      ? "bg-gradient-to-br from-[#071714] via-[#091f1b] to-[#071714] border-emerald-500/40 hover:border-emerald-400/70 shadow-sm"
                      : isSl
                      ? "bg-gradient-to-br from-[#1a0c10] via-[#220d14] to-[#1a0c10] border-rose-500/40 hover:border-rose-400/70 shadow-sm"
                      : isBe
                      ? "bg-gradient-to-br from-[#121626] via-[#101930] to-[#121626] border-amber-500/40 hover:border-amber-400/70 shadow-sm"
                      : "bg-gradient-to-br from-[#09152b] via-[#0d1d3a] to-[#09152b] border-cyan-500/40 hover:border-cyan-400/70 shadow-sm"
                  } ${isUnread ? "ring-1 ring-cyan-500/30" : "opacity-90"}`}
                >
                  {/* Unread indicator dot */}
                  {isUnread && (
                    <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {/* Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                          isTp
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : isSl
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                            : isBe
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                        }`}
                      >
                        {isTp ? (
                          <Target className="w-5 h-5" />
                        ) : isSl ? (
                          <ShieldAlert className="w-5 h-5" />
                        ) : isBe ? (
                          <Scale className="w-5 h-5" />
                        ) : notif.params?.action === "BUY" ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-xs sm:text-sm font-black tracking-tight ${
                              isTp
                                ? "text-emerald-300"
                                : isSl
                                ? "text-rose-300"
                                : isBe
                                ? "text-amber-300"
                                : "text-cyan-200"
                            }`}
                          >
                            {notif.title}
                          </h4>

                          {/* Pips Badge */}
                          {notif.pips !== undefined && (
                            <span
                              className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border ${
                                notif.pips > 0
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : notif.pips < 0
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                  : "bg-slate-800 text-slate-300 border-slate-700"
                              }`}
                            >
                              {notif.pips > 0 ? `+${notif.pips}p` : `${notif.pips}p`}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {notif.body}
                        </p>

                        {/* Timing and Actions */}
                        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-400">
                              {notif.timestampMs
                                ? formatRelativeTime(notif.timestampMs)
                                : notif.time}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {notif.time}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyText(notif);
                              }}
                              className="text-[10px] text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                              title="Salin isi notifikasi"
                            >
                              {copiedId === notif.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Salin</span>
                                </>
                              )}
                            </button>

                            <span className="text-cyan-400 font-bold group-hover:underline flex items-center gap-0.5 text-[11px]">
                              <span>Detail Sinyal</span>
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="p-3 sm:px-5 border-t border-slate-800/80 bg-[#080d1a] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="text-[11px]">
            Total {notifications.length} notifikasi tersinkronisasi
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
