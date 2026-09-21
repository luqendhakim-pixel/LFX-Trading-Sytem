import React, { useState, useMemo, useId } from "react";
import { AISignal } from "../types";
import {
  extractSignalPips,
  getSignalDate,
  formatDateKeyToIndo,
} from "../utils/winratePipsCalculator";

export interface CumulativePipsPoint {
  index: number;
  id: string;
  timeStr: string;
  dateStr: string;
  pipsDelta: number;
  cumulativePips: number;
  x: number;
  y: number;
}

interface DynamicPerformanceSparklineProps {
  signals: AISignal[];
  periodLabel?: string;
  selectedDateKey?: string | null;
  height?: number;
  className?: string;
  interactive?: boolean;
}

/**
 * Generate a smooth cubic Bezier curve through given (x, y) coordinates
 */
function generateSmoothBezierPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  if (pts.length === 2) {
    return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;
  }

  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 5.5;
    const cp1y = p1.y + (p2.y - p0.y) / 5.5;

    const cp2x = p2.x - (p3.x - p1.x) / 5.5;
    const cp2y = p2.y - (p3.y - p1.y) / 5.5;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export const DynamicPerformanceSparkline: React.FC<DynamicPerformanceSparklineProps> = ({
  signals,
  periodLabel = "Harian",
  selectedDateKey,
  height = 56,
  className = "",
  interactive = true,
}) => {
  const gradId = useId().replace(/:/g, "_");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG coordinate dimensions
  const svgWidth = 500;
  const svgHeight = height;
  const padX = 0; // Edge-to-edge flush curve
  const padYTop = 6;
  const padYBottom = 6;
  const usableHeight = svgHeight - padYTop - padYBottom;
  const usableWidth = svgWidth - padX * 2;

  // 1. Sort signals chronologically (oldest -> newest)
  const sortedSignals = useMemo(() => {
    return [...signals].sort((a, b) => {
      const ta = getSignalDate(a).getTime();
      const tb = getSignalDate(b).getTime();
      return ta - tb;
    });
  }, [signals]);

  // 2. Accumulate closed pips sequentially (no TP/SL distinction)
  const { points, minPips, maxPips, finalPips, linePath, areaPath } = useMemo(() => {
    if (sortedSignals.length === 0) {
      const midY = svgHeight / 2;
      return {
        points: [] as CumulativePipsPoint[],
        minPips: 0,
        maxPips: 0,
        finalPips: 0,
        linePath: `M 0 ${midY} L ${svgWidth} ${midY}`,
        areaPath: "",
      };
    }

    // Baseline point starting at 0 pips at start of session
    let runningPips = 0;
    let minVal = 0;
    let maxVal = 0;

    interface IntermediatePoint {
      id: string;
      timeStr: string;
      dateStr: string;
      pipsDelta: number;
      cumulativePips: number;
    }

    const firstDate = getSignalDate(sortedSignals[0]);
    const firstTimeStr = firstDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const rawList: IntermediatePoint[] = [
      {
        id: "start",
        timeStr: `${firstTimeStr} WIB`,
        dateStr: selectedDateKey ? formatDateKeyToIndo(selectedDateKey) : "Mulai",
        pipsDelta: 0,
        cumulativePips: 0,
      },
    ];

    sortedSignals.forEach((sig, idx) => {
      const { pips } = extractSignalPips(sig);
      runningPips += pips;
      if (runningPips < minVal) minVal = runningPips;
      if (runningPips > maxVal) maxVal = runningPips;

      const sigDate = getSignalDate(sig);
      const timeStr = sigDate.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const dateStr = sigDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });

      rawList.push({
        id: sig.id || `sig-${idx}`,
        timeStr: `${timeStr} WIB`,
        dateStr,
        pipsDelta: pips,
        cumulativePips: runningPips,
      });
    });

    // Determine scale bounds
    const pipsRange = Math.max(maxVal - minVal, 30);
    const effectiveMin = minVal - pipsRange * 0.12;
    const effectiveMax = maxVal + pipsRange * 0.12;
    const effectiveRange = effectiveMax - effectiveMin;

    const calcY = (val: number) => {
      const normalized = (val - effectiveMin) / effectiveRange;
      return padYTop + (1 - normalized) * usableHeight;
    };

    const calculatedPoints: CumulativePipsPoint[] = rawList.map((item, i) => {
      const x = padX + (i / (rawList.length - 1)) * usableWidth;
      const y = calcY(item.cumulativePips);
      return {
        ...item,
        index: i,
        x,
        y,
      };
    });

    const lPath = generateSmoothBezierPath(calculatedPoints);
    const lastPt = calculatedPoints[calculatedPoints.length - 1];
    const firstPt = calculatedPoints[0];
    const aPath = `${lPath} L ${lastPt.x.toFixed(1)} ${svgHeight} L ${firstPt.x.toFixed(1)} ${svgHeight} Z`;

    return {
      points: calculatedPoints,
      minPips: minVal,
      maxPips: maxVal,
      finalPips: runningPips,
      linePath: lPath,
      areaPath: aPath,
    };
  }, [sortedSignals, svgHeight, usableHeight, usableWidth, padX, padYTop, selectedDateKey]);

  const isPositive = finalPips >= 0;
  const strokeColor = isPositive ? "#10b981" : "#f43f5e";
  const glowColor = isPositive ? "rgba(16, 185, 129, 0.45)" : "rgba(244, 63, 94, 0.45)";

  const hoveredPoint =
    hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  // If no signals in selected period
  if (sortedSignals.length === 0) {
    return (
      <div className={`relative w-full overflow-hidden ${className}`}>
        <svg viewBox={`0 0 ${svgWidth} 36`} className="w-full h-9" preserveAspectRatio="none">
          <line
            x1="0"
            y1="18"
            x2={svgWidth}
            y2="18"
            stroke="#1e293b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden select-none ${className}`}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {/* Floating Hover Tooltip: Akumulasi Pips Saja */}
      {interactive && hoveredPoint && hoveredPoint.index > 0 && (
        <div
          className="absolute z-20 pointer-events-none transition-all duration-75 transform -translate-x-1/2 -translate-y-full mb-2 px-2.5 py-1 rounded-xl bg-[#060b18]/95 border border-slate-700 shadow-xl backdrop-blur-md text-[10px] whitespace-nowrap"
          style={{
            left: `${(hoveredPoint.x / svgWidth) * 100}%`,
            top: `${Math.max(10, (hoveredPoint.y / svgHeight) * 100)}%`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[9px]">{hoveredPoint.timeStr}</span>
            <span
              className={`font-mono font-bold ${
                hoveredPoint.pipsDelta >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {hoveredPoint.pipsDelta >= 0
                ? `+${hoveredPoint.pipsDelta}p`
                : `${hoveredPoint.pipsDelta}p`}
            </span>
            <span className="text-slate-500">→</span>
            <span
              className={`font-mono font-black ${
                hoveredPoint.cumulativePips >= 0 ? "text-cyan-300" : "text-rose-300"
              }`}
            >
              Akumulasi: {hoveredPoint.cumulativePips >= 0 ? `+${hoveredPoint.cumulativePips}p` : `${hoveredPoint.cumulativePips}p`}
            </span>
          </div>
        </div>
      )}

      {/* SVG Canvas for Cumulative Curve */}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full overflow-visible"
        style={{ height: `${height}px` }}
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gradient area fill under curve */}
          <linearGradient id={`sparkArea_${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={isPositive ? "#10b981" : "#f43f5e"}
              stopOpacity="0.35"
            />
            <stop
              offset="60%"
              stopColor={isPositive ? "#06b6d4" : "#e11d48"}
              stopOpacity="0.10"
            />
            <stop
              offset="100%"
              stopColor={isPositive ? "#06b6d4" : "#e11d48"}
              stopOpacity="0.0"
            />
          </linearGradient>

          {/* Glowing stroke */}
          <filter id={`sparkGlow_${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor={glowColor} floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Dynamic Area Fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill={`url(#sparkArea_${gradId})`}
            className="transition-all duration-300"
          />
        )}

        {/* Dynamic Cumulative Curve Stroke */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#sparkGlow_${gradId})`}
            className="transition-all duration-300"
          />
        )}

        {/* Vertical crosshair tracking line on hover */}
        {hoveredPoint && (
          <>
            <line
              x1={hoveredPoint.x}
              y1={0}
              x2={hoveredPoint.x}
              y2={svgHeight}
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.6"
            />
            {/* Tracking dot on curve */}
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="4.5"
              fill={strokeColor}
              stroke="#ffffff"
              strokeWidth="1.5"
              className="transition-all duration-75 shadow-md"
            />
          </>
        )}

        {/* Invisible touch/mouse event bands for smooth scrubbing */}
        {interactive &&
          points.map((pt, i) => {
            const prevX = i === 0 ? 0 : (points[i - 1].x + pt.x) / 2;
            const nextX = i === points.length - 1 ? svgWidth : (pt.x + points[i + 1].x) / 2;
            const bandWidth = Math.max(1, nextX - prevX);

            return (
              <rect
                key={pt.id}
                x={prevX}
                y={0}
                width={bandWidth}
                height={svgHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredIndex(i)}
                onTouchStart={() => setHoveredIndex(i)}
              />
            );
          })}
      </svg>
    </div>
  );
};
