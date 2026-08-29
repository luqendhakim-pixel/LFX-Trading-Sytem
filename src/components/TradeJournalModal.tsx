import React, { useState, useEffect } from "react";
import { Position, TradeJournalData } from "../types";
import {
  X,
  BookOpen,
  Star,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Tag,
  Smile,
  Brain,
  Zap,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Calendar,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface TradeJournalModalProps {
  position: Position | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveJournal: (positionId: string, journal: TradeJournalData) => void;
}

const EMOTIONAL_STATES: {
  key: NonNullable<TradeJournalData["emotionalState"]>;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { key: "DISCIPLINED", label: "Disiplin Sesuai Plan", emoji: "🧘", color: "border-emerald-500/50 bg-emerald-950/40 text-emerald-300" },
  { key: "CONFIDENT", label: "High Confluence", emoji: "🎯", color: "border-teal-500/50 bg-teal-950/40 text-teal-300" },
  { key: "PATIENT", label: "Sabar Menunggu Retest", emoji: "⏳", color: "border-blue-500/50 bg-blue-950/40 text-blue-300" },
  { key: "FOMO", label: "FOMO / Terburu-buru", emoji: "⚡", color: "border-amber-500/50 bg-amber-950/40 text-amber-300" },
  { key: "ANXIOUS", label: "Ragu / Cemas", emoji: "😰", color: "border-orange-500/50 bg-orange-950/40 text-orange-300" },
  { key: "REVENGE", label: "Revenge / Emosional", emoji: "🔥", color: "border-rose-500/50 bg-rose-950/40 text-rose-300" },
];

const PRESET_ENTRY_REASONS = [
  "SMC Liquidity Sweep di Session High/Low",
  "Order Block (OB) Retest M15/H1",
  "Fair Value Gap (FVG) Mitigation",
  "Break of Structure (BOS) Trend Continuation",
  "Dynamic Support/Resistance EMA 20 & 50",
  "High Impact News Spike Reversal",
  "Asia Range Sweep di London Open",
  "RSI Momentum & Divergence Confluence",
];

const PRESET_LESSONS = [
  "Eksekusi sempurna sesuai SOP trading plan",
  "Manajemen SL & Risk per trade terkontrol baik",
  "Hindari geser SL manual terlalu dini",
  "Kunci profit di TP1 dan amankan BEP",
  "Sabar menunggu candle close sebelum eksekusi",
  "Jangan melawan struktur major trend",
  "Disiplin lot size sesuai batas risiko",
];

const PRESET_TAGS = [
  "#SMC",
  "#LondonOpen",
  "#NYSession",
  "#OrderBlock",
  "#FVG",
  "#Scalp",
  "#RiskManaged",
  "#CleanWin",
  "#MistakeReviewed",
];

export const TradeJournalModal: React.FC<TradeJournalModalProps> = ({
  position,
  isOpen,
  onClose,
  onSaveJournal,
}) => {
  if (!isOpen || !position) return null;

  const isProfit = position.pnlUsd >= 0;
  const isBuy = position.type === "BUY";

  // Form State
  const [entryReason, setEntryReason] = useState<string>(
    position.journal?.entryReason || position.reason || ""
  );
  const [notes, setNotes] = useState<string>(
    position.journal?.notes || ""
  );
  const [emotionalState, setEmotionalState] = useState<TradeJournalData["emotionalState"]>(
    position.journal?.emotionalState || (isProfit ? "DISCIPLINED" : "PATIENT")
  );
  const [executionRating, setExecutionRating] = useState<number>(
    position.journal?.executionRating || (isProfit ? 5 : 3)
  );
  const [lessonsLearned, setLessonsLearned] = useState<string>(
    position.journal?.lessonsLearned || ""
  );
  const [tags, setTags] = useState<string[]>(
    position.journal?.tags || ["#SMC", `#${position.symbol.replace("/", "")}`]
  );
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState<boolean>(false);

  // Sync state when position changes
  useEffect(() => {
    if (position) {
      setEntryReason(position.journal?.entryReason || position.reason || "");
      setNotes(position.journal?.notes || "");
      setEmotionalState(position.journal?.emotionalState || (isProfit ? "DISCIPLINED" : "PATIENT"));
      setExecutionRating(position.journal?.executionRating || (isProfit ? 5 : 3));
      setLessonsLearned(position.journal?.lessonsLearned || "");
      setTags(position.journal?.tags || ["#SMC", `#${position.symbol.replace("/", "")}`]);
      setShowSavedFeedback(false);
    }
  }, [position?.id]);

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (e.type === "keydown" && (e as React.KeyboardEvent).key !== "Enter") return;
    const cleanTag = customTagInput.trim().startsWith("#")
      ? customTagInput.trim()
      : `#${customTagInput.trim()}`;
    if (cleanTag.length > 1 && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setCustomTagInput("");
    }
  };

  const handleSave = () => {
    const updatedJournal: TradeJournalData = {
      entryReason,
      notes,
      emotionalState,
      executionRating,
      lessonsLearned,
      tags,
      updatedAt: new Date().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    onSaveJournal(position.id, updatedJournal);
    setShowSavedFeedback(true);
    setTimeout(() => {
      setShowSavedFeedback(false);
    }, 2500);
  };

  const handleCopyMarkdown = () => {
    const md = `## 📝 JURNAL TRADING XAU/USD - #${position.id}
- **Waktu**: ${position.openTime} → ${position.closeTime || "Closed"}
- **Tipe & Lot**: ${position.type} ${position.lotSize} Lot @ $${position.entryPrice.toFixed(2)}
- **Exit Price**: $${position.closePrice?.toFixed(2) || "-"} (${position.closeReason || "MANUAL"})
- **Hasil PnL**: ${isProfit ? "+" : ""}$${position.pnlUsd.toFixed(2)} (${isProfit ? "+" : ""}${position.pnlPips} pips)
- **Strategi**: ${position.strategy}
- **Rating Eksekusi**: ${"⭐".repeat(executionRating)} (${executionRating}/5)
- **Kondisi Psikologi**: ${emotionalState}

### 🎯 Alasan Entry & Setup:
${entryReason || "-"}

### 🔍 Catatan Kualitatif / Observasi Pasar:
${notes || "-"}

### 💡 Evaluasi & Pembelajaran:
${lessonsLearned || "-"}

**Tags**: ${tags.join(" ")}`;

    navigator.clipboard.writeText(md);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 5:
        return "Eksekusi Sempurna sesuai SOP";
      case 4:
        return "Bagus, sedikit deviasi teknikal";
      case 3:
        return "Cukup, ada keraguan saat entry";
      case 2:
        return "Kurang disiplin / Terburu-buru";
      case 1:
        return "Melanggar Trading Plan / Emosional";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        id="trade-journal-modal-card"
        className="bg-[#0f1422] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#141b2d] border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">Jurnal & Evaluasi Transaksi</h3>
                <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                  #{position.id}
                </span>
                {position.journal?.updatedAt && (
                  <span className="text-[9.5px] text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 font-sans">
                    <Check className="w-2.5 h-2.5" /> Tersimpan
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Dokumentasi kualitatif alasan entry, emosi, dan pembelajaran untuk evaluasi mandiri
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
          {/* 1. Automated Trade Facts Snapshot Banner */}
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${
                    isBuy
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {position.type} {position.symbol} ({position.lotSize} Lot)
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Entry: <strong className="text-slate-200">${position.entryPrice.toFixed(2)}</strong> → Exit:{" "}
                  <strong className="text-slate-200">${position.closePrice?.toFixed(2) || "-"}</strong>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg ${
                    isProfit
                      ? "bg-emerald-950/70 text-emerald-300 border border-emerald-500/40"
                      : "bg-rose-950/70 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {isProfit ? "+" : ""}${position.pnlUsd.toFixed(2)} ({isProfit ? "+" : ""}
                  {position.pnlPips}p)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80 text-[10.5px] font-sans text-slate-400">
              <div>
                <span className="text-slate-500 block text-[9.5px]">Waktu Eksekusi</span>
                <span className="font-mono text-slate-300">{position.openTime} → {position.closeTime || "Selesai"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">Hasil / Trigger</span>
                <span className="text-slate-200 font-medium">
                  {position.closeReason === "TP" ? "🎯 Take Profit Hit" : position.closeReason === "SL" ? "🛑 Stop Loss Hit" : "Manual / Exit"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">Stop Loss / Target</span>
                <span className="font-mono text-slate-300">${position.stopLoss.toFixed(2)} / ${position.takeProfit.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px]">Mode Eksekusi</span>
                <span className="text-amber-400 font-medium">{position.isAutoExecuted ? "⚡ AI Auto Demo" : "👤 Manual Trader"}</span>
              </div>
            </div>
          </div>

          {/* 2. Entry Rationale & Setup Thesis */}
          <div className="space-y-2">
            <label className="text-slate-200 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-amber-400" />
                Alasan Masuk Posisi (Entry Rationale & Setup Thesis)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Mengapa Anda mengambil trade ini?</span>
            </label>

            {/* Preset quick chips */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {PRESET_ENTRY_REASONS.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setEntryReason(r)}
                  className={`text-[10.5px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                    entryReason === r
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold"
                      : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              value={entryReason}
              onChange={(e) => setEntryReason(e.target.value)}
              placeholder="Deskripsikan konfluensi teknikal, zona support/resistance, pola candlestick, atau setup SMC yang Anda lihat saat entry..."
              rows={2}
              className="w-full bg-[#0a0e18] border border-slate-700/80 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed font-sans text-xs"
            />
          </div>

          {/* 3. Emotional & Psychological State */}
          <div className="space-y-2">
            <label className="text-slate-200 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-teal-400" />
                Kondisi Psikologi & Emosi Saat Trading
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Jujur pada kondisi mental Anda</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EMOTIONAL_STATES.map((state) => {
                const isSelected = emotionalState === state.key;
                return (
                  <button
                    key={state.key}
                    type="button"
                    onClick={() => setEmotionalState(state.key)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                      isSelected
                        ? `${state.color} ring-1 ring-amber-400/40 font-bold`
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-base">{state.emoji}</span>
                    <span className="text-[11px] truncate">{state.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Execution Discipline Rating (1 to 5 Stars) */}
          <div className="space-y-1.5 bg-[#090d16] p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Rating Disiplin & Kualitas Eksekusi
              </label>
              <span className="text-[11px] font-semibold text-amber-300">
                {getRatingLabel(executionRating)}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setExecutionRating(star)}
                  className="p-1 rounded hover:scale-110 transition cursor-pointer"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= executionRating
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-700 hover:text-slate-500"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 font-mono font-bold text-slate-300 text-xs">
                {executionRating}/5 Bintang
              </span>
            </div>
          </div>

          {/* 5. Qualitative Notes & Lessons Learned */}
          <div className="space-y-2">
            <label className="text-slate-200 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Catatan Evaluasi & Pembelajaran (Lessons Learned)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Apa yang bisa diperbaiki untuk trade berikutnya?</span>
            </label>

            {/* Preset quick lesson chips */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {PRESET_LESSONS.map((l, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    setLessonsLearned((prev) =>
                      prev ? `${prev}. ${l}` : l
                    )
                  }
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40 hover:bg-slate-800 transition cursor-pointer"
                >
                  + {l}
                </button>
              ))}
            </div>

            <textarea
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              placeholder="Contoh: Eksekusi disiplin dengan TP tercapai rapi. Di masa depan pastikan menunggu retest M15 sebelum entry agar draw-down lebih minimal..."
              rows={3}
              className="w-full bg-[#0a0e18] border border-slate-700/80 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed font-sans text-xs"
            />
          </div>

          {/* 6. Tags & Categories */}
          <div className="space-y-2">
            <label className="text-slate-200 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-blue-400" />
                Label & Kategori (Tags)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Klik untuk memilih atau tambahkan label kustom</span>
            </label>

            <div className="flex flex-wrap items-center gap-1.5">
              {PRESET_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`text-[10.5px] font-mono px-2 py-0.5 rounded-md border transition cursor-pointer ${
                      active
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/50 font-bold"
                        : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={handleAddCustomTag}
                placeholder="Tambah tag kustom (cth: #GoldSpike, #NFP)..."
                className="flex-1 bg-[#0a0e18] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#141b2d] border-t border-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              title="Salin catatan jurnal ke clipboard (Format Markdown)"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? "Tersalin!" : "Salin Jurnal"}</span>
            </button>

            {showSavedFeedback && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" /> Catatan Jurnal Berhasil Disimpan!
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              Batal
            </button>

            <button
              id="btn-save-trade-journal"
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Catatan Jurnal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
