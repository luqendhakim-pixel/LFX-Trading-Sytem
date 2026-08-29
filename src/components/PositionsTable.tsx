import React, { useState } from "react";
import { Position, TradeJournalData } from "../types";
import { calculateAllWinRateMetrics } from "../utils/winRateAnalytics";
import { TradeJournalModal } from "./TradeJournalModal";
import {
  TrendingUp,
  TrendingDown,
  Lock,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  Smartphone,
  Calendar,
  Trophy,
  Filter,
  BookOpen,
  Edit3,
  Star,
  Tag,
  Smile,
  FileText,
} from "lucide-react";

interface PositionsTableProps {
  openPositions: Position[];
  closedPositions: Position[];
  onClosePosition: (id: string) => void;
  onMoveToBreakeven: (id: string) => void;
  onCloseAll?: () => void;
  onClearHistory?: () => void;
  onUpdateJournal?: (positionId: string, journal: TradeJournalData) => void;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
  openPositions,
  closedPositions,
  onClosePosition,
  onMoveToBreakeven,
  onCloseAll,
  onClearHistory,
  onUpdateJournal,
}) => {
  const [activeTab, setActiveTab] = useState<"OPEN" | "HISTORY">("OPEN");
  const [historyFilter, setHistoryFilter] = useState<"ALL" | "DAILY" | "WEEKLY" | "MONTHLY">("ALL");
  const [selectedJournalPosition, setSelectedJournalPosition] = useState<Position | null>(null);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState<boolean>(false);

  const totalOpenPnL = openPositions.reduce((acc, p) => acc + p.pnlUsd, 0);
  const totalClosedPnL = closedPositions.reduce((acc, p) => acc + p.pnlUsd, 0);

  const allMetrics = calculateAllWinRateMetrics(closedPositions);
  const activeMetrics =
    historyFilter === "ALL"
      ? allMetrics.allTime
      : historyFilter === "DAILY"
      ? allMetrics.daily
      : historyFilter === "WEEKLY"
      ? allMetrics.weekly
      : allMetrics.monthly;

  // Filter positions displayed according to history filter
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const ONE_WEEK_MS = 7 * ONE_DAY_MS;
  const ONE_MONTH_MS = 30 * ONE_DAY_MS;

  const filteredClosedPositions = closedPositions.filter((p) => {
    if (historyFilter === "ALL") return true;
    const t = p.closedTimestamp || p.openedTimestamp || now;
    if (historyFilter === "DAILY") return now - t <= ONE_DAY_MS;
    if (historyFilter === "WEEKLY") return now - t <= ONE_WEEK_MS;
    if (historyFilter === "MONTHLY") return now - t <= ONE_MONTH_MS;
    return true;
  });

  const journaledTradesCount = closedPositions.filter(
    (p) => p.journal && (p.journal.notes || p.journal.entryReason || p.journal.lessonsLearned)
  ).length;

  const handleOpenJournal = (pos: Position) => {
    setSelectedJournalPosition(pos);
    setIsJournalModalOpen(true);
  };

  const handleSaveJournal = (positionId: string, journal: TradeJournalData) => {
    if (onUpdateJournal) {
      onUpdateJournal(positionId, journal);
    }
    // Also update selected position in modal
    setSelectedJournalPosition((prev) => (prev && prev.id === positionId ? { ...prev, journal } : prev));
  };

  return (
    <div
      id="positions-orders-table-container"
      className="bg-[#0f1420] border border-slate-800 rounded-xl overflow-hidden shadow-xl text-slate-100 flex flex-col"
    >
      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#121826] border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <button
            id="tab-open-positions"
            onClick={() => setActiveTab("OPEN")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === "OPEN"
                ? "bg-slate-800 text-amber-400 border border-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Posisi Terbuka</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                openPositions.length > 0
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {openPositions.length}
            </span>
          </button>

          <button
            id="tab-closed-history"
            onClick={() => setActiveTab("HISTORY")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === "HISTORY"
                ? "bg-slate-800 text-amber-400 border border-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Riwayat Transaksi Aktual</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
              {closedPositions.length}
            </span>
          </button>
        </div>

        {/* Floating PnL Summary & Actions */}
        <div className="flex flex-wrap items-center space-x-3 text-xs font-mono">
          {activeTab === "OPEN" ? (
            <div className="flex items-center space-x-3">
              <div>
                <span className="text-slate-400 text-[11px] mr-1.5">Floating P&L:</span>
                <span
                  className={`font-bold text-sm ${
                    totalOpenPnL >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {totalOpenPnL >= 0 ? "+" : ""}${totalOpenPnL.toFixed(2)}
                </span>
              </div>
              {openPositions.length > 0 && onCloseAll && (
                <button
                  id="btn-close-all-pos-table"
                  onClick={onCloseAll}
                  className="px-2 py-1 bg-rose-950/70 hover:bg-rose-900 border border-rose-600/40 text-rose-300 text-[11px] font-sans font-semibold rounded-md transition"
                >
                  Tutup Semua
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {/* Multi-tier Win Rate Header stats */}
              <div className="flex items-center gap-2 bg-[#0a0e1a] px-2.5 py-1 rounded-lg border border-slate-800">
                <div title="Total All-time Win Rate">
                  <span className="text-slate-400 text-[10px] mr-1">Total:</span>
                  <span className="font-bold text-amber-400 text-xs">{allMetrics.allTime.winRate}%</span>
                </div>
                <span className="text-slate-700">|</span>
                <div title="Daily (24 Jam) Win Rate">
                  <span className="text-slate-400 text-[10px] mr-1">Daily:</span>
                  <span className="font-bold text-emerald-400 text-xs">{allMetrics.daily.winRate}%</span>
                </div>
                <span className="text-slate-700">|</span>
                <div title="Weekly (7 Hari) Win Rate">
                  <span className="text-slate-400 text-[10px] mr-1">Weekly:</span>
                  <span className="font-bold text-teal-300 text-xs">{allMetrics.weekly.winRate}%</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] mr-1.5">Net Realized:</span>
                <span
                  className={`font-bold text-sm ${
                    totalClosedPnL >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {totalClosedPnL >= 0 ? "+" : ""}${totalClosedPnL.toFixed(2)}
                </span>
              </div>

              {closedPositions.length > 0 && onClearHistory && (
                <button
                  id="btn-clear-history-pos-table"
                  onClick={onClearHistory}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans font-semibold rounded-md transition"
                >
                  Bersihkan
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter subbar for Riwayat */}
      {activeTab === "HISTORY" && (
        <div className="px-4 py-2 bg-[#0d121e] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber-400" /> Filter Periode:
            </span>
            {(
              [
                { id: "ALL", label: "Semua", rate: allMetrics.allTime.winRate, count: allMetrics.allTime.totalTrades },
                { id: "DAILY", label: "Daily (24 Jam)", rate: allMetrics.daily.winRate, count: allMetrics.daily.totalTrades },
                { id: "WEEKLY", label: "Weekly (7 Hari)", rate: allMetrics.weekly.winRate, count: allMetrics.weekly.totalTrades },
                { id: "MONTHLY", label: "Monthly (30 Hari)", rate: allMetrics.monthly.winRate, count: allMetrics.monthly.totalTrades },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setHistoryFilter(f.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  historyFilter === f.id
                    ? "bg-amber-500 text-slate-950 font-bold shadow"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`text-[9px] font-mono px-1 rounded ${
                    historyFilter === f.id
                      ? "bg-slate-950/20 text-slate-950 font-bold"
                      : "bg-slate-800 text-emerald-400"
                  }`}
                >
                  {f.rate}% ({f.count})
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-1 bg-[#090d16] px-2 py-0.5 rounded border border-slate-800 text-slate-300">
              <BookOpen className="w-3 h-3 text-amber-400" />
              <span>Jurnal:</span>
              <strong className="text-amber-300 font-bold">{journaledTradesCount}/{closedPositions.length}</strong>
            </div>
            <span>•</span>
            <span>
              Win/Loss: <strong className="text-emerald-400">{activeMetrics.winningTrades}W</strong> -{" "}
              <strong className="text-rose-400">{activeMetrics.losingTrades}L</strong>
            </span>
            <span>•</span>
            <span>
              Profit Factor: <strong className="text-amber-400">{activeMetrics.profitFactor}x</strong>
            </span>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto max-h-72 overflow-y-auto">
        {activeTab === "OPEN" ? (
          openPositions.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              <Clock className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p>Tidak ada posisi aktif saat ini.</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                AI akan mengeksekusi otomatis di demo atau Anda dapat menekan BUY / SELL manual.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0f19] text-slate-400 font-semibold text-[11px] uppercase tracking-wider sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Tipe & Simbol</th>
                  <th className="py-2.5 px-3">Lot</th>
                  <th className="py-2.5 px-3">Entry</th>
                  <th className="py-2.5 px-3">Current</th>
                  <th className="py-2.5 px-3">SL / TP</th>
                  <th className="py-2.5 px-3">Profit & Loss</th>
                  <th className="py-2.5 px-3">Eksekusi</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {openPositions.map((pos) => {
                  const isBuy = pos.type === "BUY";
                  const isProfit = pos.pnlUsd >= 0;

                  return (
                    <tr key={pos.id} className="hover:bg-slate-900/60 transition text-slate-200">
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">#{pos.id.slice(-6)}</td>
                      <td className="py-2.5 px-3 font-bold flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isBuy ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        ></span>
                        <span className={isBuy ? "text-emerald-400" : "text-rose-400"}>
                          {pos.type}
                        </span>
                        <span className="text-slate-400 text-[11px] font-sans">XAU/USD</span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{pos.lotSize.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-slate-300">${pos.entryPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-bold">${pos.currentPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-[11px]">
                        <span className="text-rose-400">${pos.stopLoss.toFixed(2)}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-emerald-400">${pos.takeProfit.toFixed(2)}</span>
                        {pos.movedToBreakeven && (
                          <span className="ml-1.5 text-[9px] bg-amber-500/15 text-amber-400 px-1 rounded border border-amber-500/30">
                            BE Lock
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-black text-xs ${
                              isProfit ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {isProfit ? "+" : ""}${pos.pnlUsd.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({isProfit ? "+" : ""}
                            {pos.pnlPips}p)
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-[10px] font-sans">
                        {pos.isAutoExecuted ? (
                          <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 w-fit">
                            <Zap className="w-2.5 h-2.5" /> AI Demo
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded w-fit">
                            Manual
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {!pos.movedToBreakeven && (
                            <button
                              id={`btn-be-${pos.id}`}
                              onClick={() => onMoveToBreakeven(pos.id)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-300 font-sans font-semibold rounded transition"
                              title="Pindahkan Stop Loss ke Harga Entry (Breakeven)"
                            >
                              Lock BE
                            </button>
                          )}
                          <button
                            id={`btn-close-${pos.id}`}
                            onClick={() => onClosePosition(pos.id)}
                            className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 text-[10px] text-rose-300 font-sans font-semibold rounded border border-rose-500/40 transition"
                            title="Tutup Posisi Sekarang"
                          >
                            Close
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : (
          /* Closed History Table with Trade Journal */
          filteredClosedPositions.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p>
                {closedPositions.length === 0
                  ? "Belum ada riwayat transaksi yang ditutup."
                  : `Tidak ada transaksi untuk filter periode ${historyFilter}.`}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0f19] text-slate-400 font-semibold text-[11px] uppercase tracking-wider sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Order ID & Setup</th>
                  <th className="py-2.5 px-3">Tipe</th>
                  <th className="py-2.5 px-3">Lot</th>
                  <th className="py-2.5 px-3">Entry & Waktu</th>
                  <th className="py-2.5 px-3">Close Price</th>
                  <th className="py-2.5 px-3">Alasan Selesai</th>
                  <th className="py-2.5 px-3">Jurnal & Self-Review</th>
                  <th className="py-2.5 px-3 text-right">Profit / Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredClosedPositions.map((pos) => {
                  const isProfit = pos.pnlUsd >= 0;
                  const hasJournal = !!(pos.journal && (pos.journal.notes || pos.journal.entryReason || pos.journal.lessonsLearned));
                  const journal = pos.journal;

                  return (
                    <tr
                      key={pos.id}
                      onClick={() => handleOpenJournal(pos)}
                      className="hover:bg-slate-900/80 transition text-slate-200 cursor-pointer group"
                    >
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">
                        <div className="font-bold text-slate-300">#{pos.id.slice(-6)}</div>
                        <span className="text-[9.5px] text-slate-500 font-sans block truncate max-w-[130px]">
                          {pos.strategy}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        <span className={pos.type === "BUY" ? "text-emerald-400" : "text-rose-400"}>
                          {pos.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{pos.lotSize.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        <div>${pos.entryPrice.toFixed(2)}</div>
                        <span className="text-[9.5px] text-slate-500 font-sans block">
                          {pos.openTime} → {pos.closeTime || "Selesai"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">${pos.closePrice?.toFixed(2) || "-"}</td>
                      <td className="py-2.5 px-3 text-[11px] font-sans">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1 ${
                            pos.closeReason === "TP" || pos.closeReason === "TP2"
                              ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                              : pos.closeReason === "SL"
                              ? "bg-rose-950/60 text-rose-300 border border-rose-500/30"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {pos.closeReason === "TP"
                            ? "🎯 Take Profit Hit"
                            : pos.closeReason === "SL"
                            ? "🛑 Stop Loss Hit"
                            : pos.closeReason === "TRAILING_SL"
                            ? "🔒 Trailing BE Hit"
                            : "Manual Close"}
                        </span>
                      </td>

                      {/* Trade Journal Column */}
                      <td
                        className="py-2.5 px-3 text-[11px] font-sans"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenJournal(pos);
                        }}
                      >
                        {hasJournal && journal ? (
                          <div className="flex flex-col gap-1 max-w-[220px]">
                            <div className="flex items-center gap-1.5">
                              {journal.executionRating && (
                                <span className="text-amber-400 text-[10px] font-bold flex items-center">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 mr-0.5" />
                                  {journal.executionRating}/5
                                </span>
                              )}
                              {journal.emotionalState && (
                                <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {journal.emotionalState === "DISCIPLINED"
                                    ? "🧘 Disiplin"
                                    : journal.emotionalState === "CONFIDENT"
                                    ? "🎯 Confluence"
                                    : journal.emotionalState === "FOMO"
                                    ? "⚡ FOMO"
                                    : journal.emotionalState === "PATIENT"
                                    ? "⏳ Sabar"
                                    : journal.emotionalState === "REVENGE"
                                    ? "🔥 Revenge"
                                    : "😰 Ragu"}
                                </span>
                              )}
                              <span className="text-[9px] text-emerald-400 group-hover:underline flex items-center gap-0.5 ml-auto">
                                <Edit3 className="w-2.5 h-2.5" /> Edit
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-300 truncate" title={journal.entryReason || journal.notes}>
                              {journal.entryReason || journal.notes || journal.lessonsLearned}
                            </p>
                          </div>
                        ) : (
                          <button
                            id={`btn-open-journal-${pos.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenJournal(pos);
                            }}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 text-[10.5px] font-medium flex items-center gap-1 transition cursor-pointer"
                          >
                            <BookOpen className="w-3 h-3 text-amber-400" />
                            <span>+ Tulis Jurnal</span>
                          </button>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div
                          className={`font-black text-xs ${
                            isProfit ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isProfit ? "+" : ""}${pos.pnlUsd.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({isProfit ? "+" : ""}
                          {pos.pnlPips}p)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Interactive Trade Journal & Self-Review Modal */}
      <TradeJournalModal
        position={selectedJournalPosition}
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        onSaveJournal={handleSaveJournal}
      />
    </div>
  );
};
