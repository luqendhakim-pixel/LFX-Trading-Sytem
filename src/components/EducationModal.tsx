import React, { useState } from "react";
import { X, BookOpen, ChevronRight, CheckCircle2, Award, Zap, ShieldCheck } from "lucide-react";

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EducationModal: React.FC<EducationModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  if (!isOpen) return null;

  const lessons = [
    {
      title: "1. Strategi Entry TSS TradingView & SMC",
      summary: "Memahami konfirmasi sinyal Trend State Strategy & Break of Structure.",
      content:
        "Trend State Strategy (TSS) menggunakan ALMA filter adaptif untuk mendeteksi awal perpindahan momentum trend. Ketika candle close menembus filter band dan didukung Order Block demand/supply, sinyal BUY atau SELL valid dieksekusi.",
    },
    {
      title: "2. Manajemen Risiko SL 50 Pips & TP 1-4",
      summary: "Mengapa Stop Loss 50 pips ($5.00) ideal untuk volatilitas Gold XAU/USD.",
      content:
        "Pada pair XAU/USD, jarak 50 pips ($5.00) memberikan ruang nafas yang cukup dari noise pasar London/New York. Selalu gunakan risiko maksimal 1-2% dari modal. Setelah harga mencapai TP1 (+50 pips), pindahkan Stop Loss ke level Entry (Break Even).",
    },
    {
      title: "3. Karakteristik Sesi Tokyo, London & New York",
      summary: "Waktu terbaik untuk eksekusi sinyal XAU/USD dengan spread terendah.",
      content:
        "Sesi Tokyo (07:00 - 14:00 WIB) cenderung sideways dan ideal untuk akumulasi. Sesi London (14:00 - 21:00 WIB) & New York (19:00 - 03:00 WIB) memiliki likuiditas tertinggi dan pergerakan impulsif terkuat.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
      <div
        id="education-modal"
        className="w-full max-w-lg bg-[#0a0f1d] border border-slate-700/70 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 relative overflow-hidden max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Materi & Edukasi VIP</h3>
              <p className="text-xs text-slate-400">Panduan SOP Trading XAU/USD</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {lessons.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                activeTab === idx
                  ? "bg-[#0f172f] border-indigo-500/50 shadow-md"
                  : "bg-[#070b16] border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{item.title}</span>
                </h4>
                <ChevronRight
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    activeTab === idx ? "rotate-90 text-indigo-400" : ""
                  }`}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 pl-5">{item.summary}</p>
              {activeTab === idx && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300 leading-relaxed pl-5 font-sans">
                  {item.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl transition cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            Tutup Materi
          </button>
        </div>
      </div>
    </div>
  );
};
