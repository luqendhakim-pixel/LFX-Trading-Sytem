import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Users,
  KeyRound,
  Send,
  CheckCircle2,
  Copy,
  Plus,
  RefreshCw,
  Clock,
  Search,
  Zap,
  X,
  Sparkles,
} from "lucide-react";
import { authService } from "../services/authService";
import { UserProfile, LicenseActivationCode } from "../types";
import { LfxLogo } from "./LfxLogo";

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [generatedKeys, setGeneratedKeys] = useState<LicenseActivationCode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const list = await authService.getMembersList();
      setMembers(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerateCode = async () => {
    setIsLoading(true);
    try {
      const newLicense = await authService.generateActivationKey(30);
      setGeneratedKeys((prev) => [newLicense, ...prev]);
      setStatusMessage(`Kode VIP Baru dibuat: ${newLicense.code} (Rp 150.000 / 30 Hari)`);
      setTimeout(() => setStatusMessage(null), 3500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSendWaCode = (member: UserProfile, code: string) => {
    const waNumber = member.identifier.replace(/\D/g, "");
    const formattedPhone = waNumber.startsWith("0") ? `62${waNumber.slice(1)}` : waNumber;
    const text = encodeURIComponent(
      `Halo ${member.name},\nTerima kasih! Pembayaran langganan LFX Trading System Rp 150.000 telah diterima.\n\nBerikut Kode OTP / Aktivasi VIP Anda:\n👉 *${code}*\n(Masa aktif: 30 Hari).\n\nSilakan masukkan kode ini di aplikasi untuk membuka kembali seluruh sinyal live XAU/USD. Selamat trading!`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, "_blank");
  };

  const handleQuickExtend = async (member: UserProfile) => {
    setIsLoading(true);
    await authService.quickActivateMember(member.identifier, 30);
    setStatusMessage(`Langganan ${member.name} (${member.identifier}) berhasil diperpanjang 30 Hari!`);
    await fetchAdminData();
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.identifier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl lg:max-w-4xl bg-gradient-to-b from-[#0c1324] via-[#080d19] to-[#04060c] border border-cyan-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 my-8">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-700 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Admin Licensing & User Center
                </h2>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[10px] font-mono font-bold border border-cyan-500/30">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kelola member, generate OTP / Kode Aktivasi Rp 150.000 / Bulan, dan kirim via WhatsApp
              </p>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* 1. Generator Kode Aktivasi 30 Hari */}
        <div className="mb-6 p-4 rounded-2xl bg-[#070c18] border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Generator Kode OTP / Aktivasi VIP (Rp 150.000 / 30 Hari)
              </span>
            </div>
            <button
              onClick={handleGenerateCode}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Kode Baru</span>
            </button>
          </div>

          {generatedKeys.length > 0 ? (
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {generatedKeys.map((k, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#0e162b] border border-cyan-500/30 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-white text-sm tracking-wider">
                      {k.code}
                    </span>
                    <span className="text-[10px] text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded">
                      30 Hari • Rp 150.000
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(k.code)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                    >
                      {copiedCode === k.code ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedCode === k.code ? "Disalin" : "Salin"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-slate-500">
              Belum ada kode baru dibuat. Klik "Buat Kode Baru" setelah menerima transfer Rp 150.000 dari member.
            </div>
          )}
        </div>

        {/* 2. Daftar Member & Status Langganan */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Daftar Member Terdaftar ({members.length})
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari user / nomor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-3 py-1 text-xs bg-[#070c18] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="p-3 rounded-2xl bg-[#080e1c] border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{member.name}</span>
                    {member.role === "ADMIN" ? (
                      <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                        ADMIN
                      </span>
                    ) : member.status === "SUBSCRIBED" ? (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        VIP ({member.daysRemaining} Hari)
                      </span>
                    ) : member.status === "TRIAL_ACTIVE" ? (
                      <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                        Trial ({member.daysRemaining} Hari)
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                        Expired (Kunci Sinyal)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {member.identifier} ({member.authMethod})
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Quick Extend 30 Days */}
                  <button
                    onClick={() => handleQuickExtend(member)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900 text-[11px] font-bold transition flex items-center gap-1"
                    title="Perpanjang 30 Hari Langsung"
                  >
                    <Zap className="w-3 h-3" />
                    <span>+30 Hari</span>
                  </button>

                  {/* Send WA Code */}
                  {generatedKeys.length > 0 && (
                    <button
                      onClick={() => handleSendWaCode(member, generatedKeys[0].code)}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900 text-[11px] font-bold transition flex items-center gap-1"
                      title="Kirim Kode Aktivasi ke WA Member"
                    >
                      <Send className="w-3 h-3" />
                      <span>Kirim WA</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Simulator & Testing Tools */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-slate-400 font-semibold">🧪 Simulasi Testing Admin:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                authService.simulateTrialReset(7);
                setStatusMessage("Akun diubah: Free Trial 7 Hari Aktif");
                setTimeout(() => setStatusMessage(null), 2500);
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px]"
            >
              Set 7-Hari Trial
            </button>
            <button
              onClick={() => {
                authService.simulateTrialExpired();
                setStatusMessage("Akun diubah: Trial Expired (Sinyal Terkunci)");
                setTimeout(() => setStatusMessage(null), 2500);
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px]"
            >
              Set Trial Habis
            </button>
            <button
              onClick={() => {
                authService.simulateVipSubscribed(30);
                setStatusMessage("Akun diubah: VIP Aktif 30 Hari");
                setTimeout(() => setStatusMessage(null), 2500);
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px]"
            >
              Set VIP 30 Hari
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
