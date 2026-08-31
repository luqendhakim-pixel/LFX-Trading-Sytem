import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  Trophy,
  Sparkles,
  CalendarDays,
  X,
} from "lucide-react";
import { AISignal } from "../types";
import {
  toDateKey,
  formatDateKeyToIndo,
  calculateWinRateForDate,
  getAvailableSignalDates,
  getSignalDateKey,
} from "../utils/winratePipsCalculator";

interface DailyWinRateCalendarPickerProps {
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string | null) => void;
  signalsList: AISignal[];
  isOpen: boolean;
  onClose: () => void;
}

export const DailyWinRateCalendarPicker: React.FC<DailyWinRateCalendarPickerProps> = ({
  selectedDateKey,
  onSelectDate,
  signalsList,
  isOpen,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const todayKey = useMemo(() => toDateKey(new Date()), []);

  // Base state for navigated month in calendar
  const [currentNavDate, setCurrentNavDate] = useState(() => {
    if (selectedDateKey) {
      const [y, m, d] = selectedDateKey.split("-").map(Number);
      return new Date(y, m - 1, d || 1);
    }
    return new Date();
  });

  // Keep navigated month in sync when selected date changes
  useEffect(() => {
    if (selectedDateKey) {
      const [y, m, d] = selectedDateKey.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        setCurrentNavDate(new Date(y, m - 1, d || 1));
      }
    }
  }, [selectedDateKey]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Available trading dates with signals
  const availableSignalDates = useMemo(() => {
    return getAvailableSignalDates(signalsList);
  }, [signalsList]);

  // Map of dateKey -> metrics for fast lookup in calendar
  const dateMetricsMap = useMemo(() => {
    const map = new Map<string, { count: number; netPips: number; winRate: number }>();
    availableSignalDates.forEach((d) => {
      map.set(d.dateKey, { count: d.count, netPips: d.netPips, winRate: d.winRate });
    });
    return map;
  }, [availableSignalDates]);

  if (!isOpen) return null;

  // Calendar calculations for current nav month
  const year = currentNavDate.getFullYear();
  const month = currentNavDate.getMonth(); // 0-indexed

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentNavDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentNavDate(new Date(year, month + 1, 1));
  };

  const handlePickDate = (dateKey: string) => {
    onSelectDate(dateKey);
    onClose();
  };

  const handleResetToRollingDaily = () => {
    onSelectDate(null);
    onClose();
  };

  return (
    <div
      ref={containerRef}
      id="daily-calendar-popover"
      className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-88 p-4 rounded-2xl bg-[#080e1e] border border-cyan-500/40 shadow-2xl backdrop-blur-xl text-slate-100 animate-scaleUp"
      style={{ boxShadow: "0 20px 40px -10px rgba(0,0,0,0.8), 0 0 25px -5px rgba(6,182,212,0.25)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white tracking-wide">Pilih Kalender Harian</h4>
            <p className="text-[10px] text-slate-400">Analisis Winrate & Pips per tanggal spesifik</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Date Presets */}
      <div className="my-3">
        <div className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
          <span>PILIHAN CEPAT (HARI DENGAN SINYAL):</span>
          {selectedDateKey && (
            <button
              onClick={handleResetToRollingDaily}
              className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer font-normal"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset (24 Jam)</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => handlePickDate(todayKey)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition cursor-pointer border ${
              selectedDateKey === todayKey
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                : "bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
          >
            Hari Ini
          </button>

          {availableSignalDates.slice(0, 4).map((item) => {
            const isSelected = selectedDateKey === item.dateKey;
            return (
              <button
                key={item.dateKey}
                onClick={() => handlePickDate(item.dateKey)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition cursor-pointer flex items-center gap-1 border ${
                  isSelected
                    ? "bg-cyan-500/30 text-cyan-200 border-cyan-400 shadow-sm"
                    : "bg-[#050b17] text-slate-300 border-slate-800 hover:border-cyan-500/40"
                }`}
              >
                <span>{item.label.split(" ").slice(0, 2).join(" ")}</span>
                <span
                  className={`text-[9px] font-mono ${
                    item.netPips >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  ({item.winRate}%)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between px-1 py-1.5 bg-[#050914] rounded-xl border border-slate-800 mb-2.5">
        <button
          onClick={handlePrevMonth}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-black text-slate-200">
          {monthNames[month]} {year}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-1">
        <span>Min</span>
        <span>Sen</span>
        <span>Sel</span>
        <span>Rab</span>
        <span>Kam</span>
        <span>Jum</span>
        <span>Sab</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty prefix cells for start of month */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8" />
        ))}

        {/* Days of Month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const isSelected = selectedDateKey === dateStr;
          const isToday = todayKey === dateStr;
          const metrics = dateMetricsMap.get(dateStr);
          const hasSignals = metrics && metrics.count > 0;

          return (
            <button
              key={dateStr}
              onClick={() => handlePickDate(dateStr)}
              className={`h-8 rounded-lg relative flex flex-col items-center justify-center text-xs font-semibold transition cursor-pointer group ${
                isSelected
                  ? "bg-cyan-500 text-black font-black shadow-lg shadow-cyan-500/30 scale-105 z-10"
                  : isToday
                  ? "bg-slate-800/80 text-cyan-400 font-bold border border-cyan-500/40 hover:bg-slate-700"
                  : hasSignals
                  ? "bg-[#0b1428] text-slate-200 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
              title={
                hasSignals
                  ? `${formatDateKeyToIndo(dateStr)}: ${metrics.count} sinyal, Winrate ${metrics.winRate}%, Net ${metrics.netPips >= 0 ? "+" : ""}${metrics.netPips}p`
                  : formatDateKeyToIndo(dateStr)
              }
            >
              <span>{dayNum}</span>

              {/* Signal indicator dot / pip count */}
              {hasSignals && (
                <span
                  className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${
                    isSelected
                      ? "bg-black"
                      : metrics.netPips >= 0
                      ? "bg-emerald-400 shadow-sm shadow-emerald-400"
                      : "bg-rose-400 shadow-sm shadow-rose-400"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Info & Native Input Picker */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Win Day</span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 ml-1"></span>
          <span>Loss Day</span>
        </div>

        <label className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 hover:border-cyan-500/30">
          <CalendarIcon className="w-3 h-3" />
          <span>Lainnya</span>
          <input
            type="date"
            className="sr-only"
            value={selectedDateKey || ""}
            onChange={(e) => {
              if (e.target.value) {
                handlePickDate(e.target.value);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
};
