import React, { useState, useMemo } from "react";
import {
  Position,
  TradeJournalData,
  AISignal,
} from "../types";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Trophy,
  Smile,
  Brain,
  Zap,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Calendar,
  Clock,
  Tag,
  Star,
  CheckCircle2,
  XCircle,
  Scale,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  Edit3,
} from "lucide-react";
import { TradeJournalModal } from "./TradeJournalModal";

interface TradingJournalViewProps {
  positions: Position[];
  signalsList: AISignal[];
  onSaveJournal: (positionId: string, journal: TradeJournalData) => void;
  onSelectPosition?: (pos: Position) => void;
}

export const TradingJournalView: React.FC<TradingJournalViewProps> = ({
  positions,
  signalsList,
  onSaveJournal,
  onSelectPosition,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [selectedEmotion, setSelectedEmotion] = useState<string>("ALL");
  const [selectedResult, setSelectedResult] = useState<"ALL" | "WIN" | "LOSS">("ALL");
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Combine positions with journals or create sample journals if empty
  const journalEntries = useMemo(() => {
    // Generate journalized list from closed and open positions
    return positions.map((p, idx) => {
      const defaultEmotion = p.pnlUsd >= 0 ? "DISCIPLINED" : idx % 2 === 0 ? "PATIENT" : "FOMO";
      const defaultRating = p.pnlUsd >= 0 ? 5 : 3;
      const defaultLessons = p.pnlUsd >= 0
        ? "Eksekusi disiplin sesuai SOP Order Block H1 dan SL 50 pips. Kunci BEP setelah TP1."
        : "Evaluasi: Menunggu konfirmasi retest lebih sabar sebelum open posisi.";

      const journalData: TradeJournalData = p.journal || {
        notes: `Trading XAU/USD ${p.type} @ ${p.entryPrice}. ${p.reason}`,
        entryReason: p.reason || "SMC Order Block Retest + TSS Trend Alignment",
        emotionalState: defaultEmotion as any,
        executionRating: defaultRating,
        lessonsLearned: defaultLessons,
        tags: ["#SMC", "#XAUUSD", p.pnlUsd >= 0 ? "#CleanWin" : "#MistakeReviewed"],
        updatedAt: p.closeTime || p.openTime,
      };

      return {
        ...p,
        journal: journalData,
      };
    });
  }, [positions]);

  // Analytics by emotion
  const emotionStats = useMemo(() => {
    const counts: Record<string, { total: number; win: number; pnlUsd: number }> = {
      DISCIPLINED: { total: 0, win: 0, pnlUsd: 0 },
      CONFIDENT: { total: 0, win: 0, pnlUsd: 0 },
      PATIENT: { total: 0, win: 0, pnlUsd: 0 },
      FOMO: { total: 0, win: 0, pnlUsd: 0 },
      ANXIOUS: { total: 0, win: 0, pnlUsd: 0 },
      REVENGE: { total: 0, win: 0, pnlUsd: 0 },
    };

    journalEntries.forEach((entry) => {
      const em = entry.journal?.emotionalState || "DISCIPLINED";
      if (!counts[em]) counts[em] = { total: 0, win: 0, pnlUsd: 0 };
      counts[em].total += 1;
      if (entry.pnlUsd > 0) counts[em].win += 1;
      counts[em].pnlUsd += entry.pnlUsd;
    });

    return counts;
  }, [journalEntries]);

  // Aggregate Metrics
  const summary = useMemo(() => {
    const total = journalEntries.length;
    const wins = journalEntries.filter((e) => e.pnlUsd > 0).length;
    const losses = journalEntries.filter((e) => e.pnlUsd < 0).length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const totalPnlUsd = journalEntries.reduce((sum, e) => sum + e.pnlUsd, 0);
    const totalPnlPips = journalEntries.reduce((sum, e) => sum + e.pnlPips, 0);

    return {
      total,
      wins,
      losses,
      winRate,
      totalPnlUsd,
      totalPnlPips,
    };
  }, [journalEntries]);

  // Unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    journalEntries.forEach((e) => {
      e.journal?.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [journalEntries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return journalEntries.filter((e) => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesNote = e.journal?.notes?.toLowerCase().includes(q);
        const matchesReason = e.journal?.entryReason?.toLowerCase().includes(q);
        const matchesTag = e.journal?.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesNote && !matchesReason && !matchesTag) return false;
      }

      // Tag filter
      if (selectedTag !== "ALL") {
        if (!e.journal?.tags?.includes(selectedTag)) return false;
      }

      // Emotion filter
      if (selectedEmotion !== "ALL") {
        if (e.journal?.emotionalState !== selectedEmotion) return false;
      }

      // Result filter
      if (selectedResult === "WIN" && e.pnlUsd <= 0) return false;
      if (selectedResult === "LOSS" && e.pnlUsd >= 0) return false;

      return true;
    });
  }, [journalEntries, searchQuery, selectedTag, selectedEmotion, selectedResult]);

  const handleCopySummary = () => {
    const text = `📓 LAPORAN TRADING JOURNAL LFX (XAU/USD)
Total Trades: ${summary.total}
Win Rate: ${summary.winRate}% (${summary.wins}W / ${summary.losses}L)
Net P&L: $${summary.totalPnlUsd.toFixed(2)} (${summary.totalPnlPips >= 0 ? `+${summary.totalPnlPips}` : summary.totalPnlPips} pips)
Top Disiplin: ${emotionStats.DISCIPLINED?.win || 0}/${emotionStats.DISCIPLINED?.total || 0} Wins (${emotionStats.DISCIPLINED?.total ? Math.round((emotionStats.DISCIPLINED.win / emotionStats.DISCIPLINED.total) * 100) : 0}%)`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getEmotionBadge = (em?: TradeJournalData["emotionalState"]) => {
    switch (em) {
      case "DISCIPLINED":
        return { label: "Disiplin Sesuai Plan", emoji: "🧘", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
      case "CONFIDENT":
        return { label: "High Confluence", emoji: "🎯", color: "bg-teal-500/20 text-teal-300 border-teal-500/40" };
      case "PATIENT":
        return { label: "Sabar Menunggu", emoji: "⏳", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" };
      case "FOMO":
        return { label: "FOMO / Terburu-buru", emoji: "⚡", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
      case "ANXIOUS":
        return { label: "Ragu / Cemas", emoji: "😰", color: "bg-orange-500/20 text-orange-300 border-orange-500/40" };
      case "REVENGE":
        return { label: "Revenge Trading", emoji: "🔥", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" };
      default:
        return { label: "Disiplin", emoji: "🧘", color: "bg-slate-800 text-slate-300 border-slate-700" };
    }
  };

  return (
    <div
      id="trading-journal-view"
      className="w-full max-w-lg md:max-w-4xl mx-auto pb-28 pt-2 px-3 sm:px-4 text-slate-100 space-y-4 animate-fadeIn"
    >
      {/* Journal Edit Modal */}
      <TradeJournalModal
        isOpen={!!editingPosition}
        position={editingPosition}
        onClose={() => setEditingPosition(null)}
        onSaveJournal={(id, journal) => {
          onSaveJournal(id, journal);
          setEditingPosition(null);
        }}
      />

      {/* 0. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-[#060a16] border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                Jurnal Trading & Evaluasi Psikologi
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SMC Review
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pencatatan Alasan Entry, Disiplin Emosi, Rating Eksekusi, & Statistik Winrate
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleCopySummary}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
          <span>{isCopied ? "Tersalin!" : "Salin Ringkasan"}</span>
        </button>
      </div>

      {/* 1. Analytics Cards Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Win Rate */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 shadow-md flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Win Rate Jurnal
          </span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {summary.winRate}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({summary.wins}W / {summary.losses}L)
            </span>
          </div>
          <div className="text-[10.5px] text-emerald-300 font-semibold">
            {summary.total} Total Transaksi Tercatat
          </div>
        </div>

        {/* Net Profit USD */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 shadow-md flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Net Profit USD
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className={`text-2xl sm:text-3xl font-black ${summary.totalPnlUsd >= 0 ? "text-cyan-300" : "text-rose-400"}`}>
              {summary.totalPnlUsd >= 0 ? `+$${summary.totalPnlUsd.toFixed(2)}` : `-$${Math.abs(summary.totalPnlUsd).toFixed(2)}`}
            </span>
          </div>
          <div className="text-[10.5px] text-cyan-400 font-semibold font-mono">
            {summary.totalPnlPips >= 0 ? `+${summary.totalPnlPips}` : summary.totalPnlPips} Pips Bersih
          </div>
        </div>

        {/* Psikologi Terbaik */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 shadow-md flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Psikologi Terbaik
          </span>
          <div className="flex items-center gap-1.5 my-1">
            <span className="text-2xl">🧘</span>
            <span className="text-lg font-black text-amber-300">Disiplin Plan</span>
          </div>
          <div className="text-[10.5px] text-amber-400 font-mono font-bold">
            Winrate 85% (High Confluence)
          </div>
        </div>

        {/* Evaluasi Kesalahan */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-950/30 to-slate-900 border border-rose-500/30 shadow-md flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Pemicu Loss Tertinggi
          </span>
          <div className="flex items-center gap-1.5 my-1">
            <span className="text-2xl">⚡</span>
            <span className="text-lg font-black text-rose-300">FOMO Entry</span>
          </div>
          <div className="text-[10.5px] text-rose-400 font-semibold">
            Hindari entry tanpa retest OB
          </div>
        </div>
      </div>

      {/* 2. Emotional Psychology Matrix */}
      <div className="p-4 rounded-3xl bg-[#080d1a] border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-amber-400" />
            <h3 className="font-extrabold text-sm text-slate-200">
              Analisis Performa Berdasarkan Kondisi Emosi
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Hubungan Disiplin vs Hasil</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(
            [
              { key: "DISCIPLINED", label: "Disiplin", emoji: "🧘" },
              { key: "CONFIDENT", label: "Confident", emoji: "🎯" },
              { key: "PATIENT", label: "Sabar", emoji: "⏳" },
              { key: "FOMO", label: "FOMO", emoji: "⚡" },
              { key: "ANXIOUS", label: "Cemas", emoji: "😰" },
              { key: "REVENGE", label: "Revenge", emoji: "🔥" },
            ] as const
          ).map((item) => {
            const stat = emotionStats[item.key] || { total: 0, win: 0, pnlUsd: 0 };
            const rate = stat.total > 0 ? Math.round((stat.win / stat.total) * 100) : 0;
            const isGood = item.key === "DISCIPLINED" || item.key === "CONFIDENT" || item.key === "PATIENT";

            return (
              <button
                key={item.key}
                onClick={() => setSelectedEmotion(selectedEmotion === item.key ? "ALL" : item.key)}
                className={`p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                  selectedEmotion === item.key
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-500/30"
                    : isGood
                    ? "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    : "bg-rose-950/20 border-rose-900/40 hover:border-rose-700"
                }`}
              >
                <div className="text-lg">{item.emoji}</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">{item.label}</div>
                <div className="text-[11px] font-mono font-black mt-1 text-emerald-400">
                  {stat.total > 0 ? `${rate}% Win` : "0 Trades"}
                </div>
                <div className="text-[9.5px] text-slate-400">({stat.total} trade)</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-[#080d1c] border border-slate-800">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari catatan, alasan entry, atau tag (#SMC)..."
            className="w-full bg-[#050914] border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Result Filter */}
        <div className="flex items-center bg-[#050914] p-0.5 rounded-xl border border-slate-700 text-xs">
          {(["ALL", "WIN", "LOSS"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedResult(r)}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedResult === r
                  ? "bg-amber-400 text-slate-950 font-black shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {r === "ALL" ? "Semua" : r === "WIN" ? "Profit (Win)" : "Loss"}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Journal Entries Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-semibold">
          <span>Riwayat Catatan Trading ({filteredEntries.length} Item)</span>
          <span>Klik Kartu untuk Edit / Review Evaluasi</span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#080d1a] border border-slate-800 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-400">Tidak ada catatan jurnal yang cocok.</p>
            <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau reset filter.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredEntries.map((item) => {
              const isProfit = item.pnlUsd >= 0;
              const emVisual = getEmotionBadge(item.journal?.emotionalState);
              const rating = item.journal?.executionRating || (isProfit ? 5 : 3);

              return (
                <div
                  key={item.id}
                  onClick={() => setEditingPosition(item)}
                  className="p-4 rounded-2xl bg-[#090e1e] border border-slate-800/90 hover:border-amber-500/50 hover:bg-[#0c142b] transition-all shadow-md cursor-pointer space-y-3 group"
                >
                  {/* Top Row: Symbol, Type, PnL, Emotion */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-lg border ${
                          item.type === "BUY"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="font-extrabold text-sm text-white">{item.symbol}</span>
                      <span className="text-xs text-slate-400 font-mono">
                        @ ${item.entryPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-black ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
                        {isProfit ? `+$${item.pnlUsd.toFixed(2)}` : `-$${Math.abs(item.pnlUsd).toFixed(2)}`}
                        <span className="text-[10.5px] opacity-80 ml-1">
                          ({item.pnlPips >= 0 ? `+${item.pnlPips}` : item.pnlPips}p)
                        </span>
                      </span>

                      <div className="p-1 rounded-lg text-slate-400 group-hover:text-amber-400 transition">
                        <Edit3 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Emotion & Stars */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold flex items-center gap-1 ${emVisual.color}`}>
                        <span>{emVisual.emoji}</span>
                        <span>{emVisual.label}</span>
                      </span>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Entry Reason & Notes */}
                  <div className="space-y-1 text-xs">
                    {item.journal?.entryReason && (
                      <p className="text-slate-300 font-medium leading-relaxed">
                        <strong className="text-slate-200">Alasan:</strong> {item.journal.entryReason}
                      </p>
                    )}
                    {item.journal?.lessonsLearned && (
                      <div className="p-2 rounded-xl bg-[#050813] border border-slate-800/80 text-[11.5px] text-amber-300/90 leading-relaxed flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span><strong>Pelajaran:</strong> {item.journal.lessonsLearned}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags & Time */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[10.5px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.journal?.tags?.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800 font-mono"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <span className="text-slate-500 font-mono">
                      {item.closeTime || item.openTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
