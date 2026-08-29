import React from "react";
import { X, Trophy, Award, Flame, Users, ArrowUpRight } from "lucide-react";

interface ContestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContestModal: React.FC<ContestModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const leaders = [
    { rank: 1, name: "Budi_TraderGold", profit: "+$4,820.50", returnPct: "+48.2%", badge: "🥇" },
    { rank: 2, name: "Alex_Scalper", profit: "+$3,410.00", returnPct: "+34.1%", badge: "🥈" },
    { rank: 3, name: "LuqendIbnuHakim (Anda)", profit: "+$2,140.20", returnPct: "+21.4%", badge: "🥉" },
    { rank: 4, name: "Siti_GoldHunter", profit: "+$1,980.00", returnPct: "+19.8%", badge: "4th" },
    { rank: 5, name: "Fajar_PriceAction", profit: "+$1,450.30", returnPct: "+14.5%", badge: "5th" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="contest-modal"
        className="w-full max-w-lg bg-[#0a0f1d] border border-slate-700/70 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 relative overflow-hidden max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-950/80 border border-blue-500/30 text-blue-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Kontes Demo Bulanan</h3>
                <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  NEW
                </span>
              </div>
              <p className="text-xs text-slate-400">Total Hadiah Rp 25.000.000 (Saldo Real Exness)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contest Info Banner */}
        <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-blue-300 font-bold uppercase">Periode Aktif</span>
            <div className="text-xs font-black text-white">1 - 31 Agustus 2026</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Sisa Waktu: 3 Hari 14 Jam</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-amber-300 font-bold uppercase">Posisi Anda</span>
            <div className="text-sm font-black text-amber-400">Peringkat #3 🥉</div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="mt-4 space-y-2">
          <div className="text-xs font-bold text-slate-300 px-1">Klasemen Sementara</div>
          <div className="space-y-1.5">
            {leaders.map((user) => (
              <div
                key={user.rank}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono transition ${
                  user.name.includes("Anda")
                    ? "bg-sky-950/60 border-sky-500/40 font-bold"
                    : "bg-[#070b16] border-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{user.badge}</span>
                  <span className={user.name.includes("Anda") ? "text-sky-300 font-bold" : "text-slate-300"}>
                    {user.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold">{user.profit}</div>
                  <div className="text-[10px] text-slate-400">{user.returnPct}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl transition cursor-pointer shadow-lg shadow-blue-600/20"
          >
            Tutup Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};
