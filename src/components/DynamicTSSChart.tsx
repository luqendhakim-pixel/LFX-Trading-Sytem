import React, { useState, useEffect, useRef, useMemo } from "react";
import { Candle, Timeframe } from "../types";
import {
  TrendStateConfig,
  defaultTSSConfig,
  calculateTrendStateStrategy,
  TrendStateStrategyResult,
  getPineScriptCode,
} from "../utils/trendStateStrategy";
import {
  Sliders,
  Sparkles,
  Code2,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Activity,
  Zap,
} from "lucide-react";

interface DynamicTSSChartProps {
  candles: Candle[];
  timeframe: Timeframe;
  currentBid: number;
  currentAsk: number;
  spread: number;
  activeSignalPrice?: {
    entry?: number;
    sl?: number;
    tp1?: number;
    tp2?: number;
    type?: "BUY" | "SELL";
  };
  onConfigChange?: (config: TrendStateConfig) => void;
}

export const DynamicTSSChart: React.FC<DynamicTSSChartProps> = ({
  candles,
  timeframe,
  currentBid,
  currentAsk,
  spread,
  activeSignalPrice,
  onConfigChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Strategy Configuration State
  const [config, setConfig] = useState<TrendStateConfig>(() => {
    const saved = localStorage.getItem("tss_chart_config");
    if (saved) {
      try {
        return { ...defaultTSSConfig, ...JSON.parse(saved) };
      } catch (e) {
        return defaultTSSConfig;
      }
    }
    return defaultTSSConfig;
  });

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPineModal, setShowPineModal] = useState(false);
  const [copiedPine, setCopiedPine] = useState(false);

  // Viewport Zoom & Pan State
  const [visibleCount, setVisibleCount] = useState<number>(45);
  const [panOffset, setPanOffset] = useState<number>(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartPanRef = useRef(0);
  const touchDistanceRef = useRef<number | null>(null);

  // Calculate Strategy Results across all candles
  const tssResult: TrendStateStrategyResult = useMemo(() => {
    return calculateTrendStateStrategy(candles, config);
  }, [candles, config]);

  const handleUpdateConfig = (updates: Partial<TrendStateConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("tss_chart_config", JSON.stringify(next));
      onConfigChange?.(next);
      return next;
    });
  };

  const handleCopyPineScript = () => {
    const code = getPineScriptCode(config);
    navigator.clipboard.writeText(code);
    setCopiedPine(true);
    setTimeout(() => setCopiedPine(false), 2500);
  };

  // Redraw Canvas whenever candles, config, zoom, pan, or hover changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const totalBars = tssResult.bars.length;
    if (totalBars === 0) return;

    // Viewport slices
    const count = Math.min(totalBars, Math.max(12, visibleCount));
    const maxPan = Math.max(0, totalBars - count);
    const clampedPan = Math.max(0, Math.min(maxPan, panOffset));
    const startIndex = Math.max(0, totalBars - count - clampedPan);
    const endIndex = Math.min(totalBars, startIndex + count);
    const visibleBars = tssResult.bars.slice(startIndex, endIndex);

    if (visibleBars.length === 0) return;

    const isMobile = width < 640;
    const paddingRight = isMobile ? 56 : 68; // Space for price scale
    const paddingBottom = isMobile ? 22 : 26; // Space for time scale
    const paddingTop = isMobile ? 48 : 42; // Extra top space for mobile header
    const paddingLeft = isMobile ? 6 : 10;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Find Min and Max Price for Y-axis scale
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    visibleBars.forEach((bar) => {
      minPrice = Math.min(minPrice, bar.low, bar.lower, bar.filter);
      maxPrice = Math.max(maxPrice, bar.high, bar.upper, bar.filter);
      if (bar.bullSignal) minPrice = Math.min(minPrice, bar.bullPos);
      if (bar.bearSignal) maxPrice = Math.max(maxPrice, bar.bearPos);
    });

    if (activeSignalPrice?.sl) minPrice = Math.min(minPrice, activeSignalPrice.sl);
    if (activeSignalPrice?.tp1) maxPrice = Math.max(maxPrice, activeSignalPrice.tp1);
    if (activeSignalPrice?.tp2) maxPrice = Math.max(maxPrice, activeSignalPrice.tp2);

    const priceMargin = Math.max(0.6, (maxPrice - minPrice) * 0.08);
    minPrice -= priceMargin;
    maxPrice += priceMargin;
    const priceRange = maxPrice - minPrice || 1;

    const getY = (price: number) => {
      return paddingTop + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    };

    const barWidth = chartWidth / visibleBars.length;
    const candleWidth = Math.max(2.5, Math.min(18, barWidth * 0.72));

    // 1. Subtle Background Grid Lines
    ctx.strokeStyle = "#111a2e";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);

    const numPriceLines = isMobile ? 4 : 6;
    for (let i = 0; i <= numPriceLines; i++) {
      const priceVal = minPrice + (priceRange / numPriceLines) * i;
      const y = getY(priceVal);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(paddingLeft + chartWidth, y);
      ctx.stroke();

      // Price text labels on right
      ctx.setLineDash([]);
      ctx.fillStyle = "#64748b";
      ctx.font = `${isMobile ? "9px" : "10px"} ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas`;
      ctx.textAlign = "left";
      ctx.fillText(`$${priceVal.toFixed(2)}`, paddingLeft + chartWidth + (isMobile ? 3 : 6), y + 3);
      ctx.setLineDash([2, 3]);
    }

    ctx.setLineDash([]);

    // 2. Draw Trend State Ribbon (if enabled)
    if (config.showRibbon) {
      for (let i = 0; i < visibleBars.length - 1; i++) {
        const b1 = visibleBars[i];
        const b2 = visibleBars[i + 1];

        const x1 = paddingLeft + i * barWidth + barWidth / 2;
        const x2 = paddingLeft + (i + 1) * barWidth + barWidth / 2;

        const yUpper1 = getY(b1.upper);
        const yUpper2 = getY(b2.upper);
        const yLower1 = getY(b1.lower);
        const yLower2 = getY(b2.lower);

        ctx.beginPath();
        ctx.moveTo(x1, yUpper1);
        ctx.lineTo(x2, yUpper2);
        ctx.lineTo(x2, yLower2);
        ctx.lineTo(x1, yLower1);
        ctx.closePath();

        const isBullRibbon = b2.trend === 1;
        ctx.fillStyle = isBullRibbon ? "rgba(0, 255, 170, 0.05)" : "rgba(255, 59, 48, 0.05)";
        ctx.fill();
      }
    }

    // 3. Draw Upper and Lower ALMA Bands
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    // Upper Band (Red resistance zone)
    ctx.strokeStyle = "rgba(244, 63, 94, 0.45)";
    ctx.beginPath();
    visibleBars.forEach((bar, i) => {
      const x = paddingLeft + i * barWidth + barWidth / 2;
      const y = getY(bar.upper);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Lower Band (Green support zone)
    ctx.strokeStyle = "rgba(16, 185, 129, 0.45)";
    ctx.beginPath();
    visibleBars.forEach((bar, i) => {
      const x = paddingLeft + i * barWidth + barWidth / 2;
      const y = getY(bar.lower);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.setLineDash([]);

    // 4. Draw Candlesticks
    visibleBars.forEach((bar, i) => {
      const x = paddingLeft + i * barWidth + barWidth / 2;
      const yOpen = getY(bar.open);
      const yClose = getY(bar.close);
      const yHigh = getY(bar.high);
      const yLow = getY(bar.low);

      const isUp = bar.close >= bar.open;
      let candleColor = isUp ? "#10b981" : "#ef4444";

      if (config.paintCandles) {
        candleColor = bar.candleColor;
      }

      // Wick line
      ctx.strokeStyle = candleColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Candle Body
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));

      ctx.fillStyle = candleColor;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // 5. Draw Trend State Step Filter Line (The Core Algorithm)
    if (config.showGlow) {
      // Outer subtle glow
      ctx.lineWidth = isMobile ? 3.5 : 5;
      for (let i = 0; i < visibleBars.length - 1; i++) {
        const b1 = visibleBars[i];
        const b2 = visibleBars[i + 1];
        const x1 = paddingLeft + i * barWidth + barWidth / 2;
        const x2 = paddingLeft + (i + 1) * barWidth + barWidth / 2;
        const y1 = getY(b1.filter);
        const y2 = getY(b2.filter);

        ctx.strokeStyle = b2.trend === 1 ? "rgba(0, 255, 170, 0.2)" : "rgba(255, 59, 48, 0.2)";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // Main Crisp Solid Step Filter Line
    ctx.lineWidth = isMobile ? 2.0 : 2.5;
    for (let i = 0; i < visibleBars.length - 1; i++) {
      const b1 = visibleBars[i];
      const b2 = visibleBars[i + 1];
      const x1 = paddingLeft + i * barWidth + barWidth / 2;
      const x2 = paddingLeft + (i + 1) * barWidth + barWidth / 2;
      const y1 = getY(b1.filter);
      const y2 = getY(b2.filter);

      ctx.strokeStyle = b2.trend === 1 ? "#00FFAA" : "#FF3B30";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 6. Draw Signal Arrows and Badges
    visibleBars.forEach((bar, i) => {
      const x = paddingLeft + i * barWidth + barWidth / 2;

      if (bar.bullSignal) {
        const y = getY(bar.bullPos) + (isMobile ? 12 : 16);

        // Green Buy Badge
        ctx.fillStyle = "#00FFAA";
        ctx.shadowColor = "#00FFAA";
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.moveTo(x, y - (isMobile ? 8 : 10));
        ctx.lineTo(x - (isMobile ? 5 : 7), y + (isMobile ? 3 : 4));
        ctx.lineTo(x + (isMobile ? 5 : 7), y + (isMobile ? 3 : 4));
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;

        // Label pill
        const pillW = isMobile ? 32 : 40;
        const pillH = isMobile ? 12 : 14;
        ctx.fillStyle = "#00FFAA";
        ctx.fillRect(x - pillW / 2, y + (isMobile ? 4 : 6), pillW, pillH);

        ctx.fillStyle = "#09101d";
        ctx.font = `bold ${isMobile ? "8px" : "9px"} sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("BUY ▲", x, y + (isMobile ? 13 : 17));
      }

      if (bar.bearSignal) {
        const y = getY(bar.bearPos) - (isMobile ? 12 : 16);

        // Red Sell Badge
        ctx.fillStyle = "#FF3B30";
        ctx.shadowColor = "#FF3B30";
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.moveTo(x, y + (isMobile ? 8 : 10));
        ctx.lineTo(x - (isMobile ? 5 : 7), y - (isMobile ? 3 : 4));
        ctx.lineTo(x + (isMobile ? 5 : 7), y - (isMobile ? 3 : 4));
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;

        // Label pill
        const pillW = isMobile ? 32 : 40;
        const pillH = isMobile ? 12 : 14;
        ctx.fillStyle = "#FF3B30";
        ctx.fillRect(x - pillW / 2, y - (isMobile ? 16 : 20), pillW, pillH);

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${isMobile ? "8px" : "9px"} sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("SELL ▼", x, y - (isMobile ? 7 : 9));
      }
    });

    // 7. Active Signal SL / TP Target Lines (if available)
    if (activeSignalPrice?.entry) {
      const yEntry = getY(activeSignalPrice.entry);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.8)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, yEntry);
      ctx.lineTo(paddingLeft + chartWidth, yEntry);
      ctx.stroke();

      // Entry Pill
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(paddingLeft + chartWidth + 2, yEntry - 7, isMobile ? 52 : 62, 14);
      ctx.fillStyle = "#000000";
      ctx.font = `bold ${isMobile ? "8px" : "9px"} ui-monospace`;
      ctx.textAlign = "left";
      ctx.fillText(`ENT $${activeSignalPrice.entry.toFixed(1)}`, paddingLeft + chartWidth + 4, yEntry + 3);
    }

    if (activeSignalPrice?.sl) {
      const ySl = getY(activeSignalPrice.sl);
      ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, ySl);
      ctx.lineTo(paddingLeft + chartWidth, ySl);
      ctx.stroke();

      // SL Pill
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(paddingLeft + chartWidth + 2, ySl - 7, isMobile ? 52 : 62, 14);
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${isMobile ? "8px" : "9px"} ui-monospace`;
      ctx.textAlign = "left";
      ctx.fillText(`SL $${activeSignalPrice.sl.toFixed(1)}`, paddingLeft + chartWidth + 4, ySl + 3);
    }

    if (activeSignalPrice?.tp1) {
      const yTp1 = getY(activeSignalPrice.tp1);
      ctx.strokeStyle = "rgba(16, 185, 129, 0.85)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, yTp1);
      ctx.lineTo(paddingLeft + chartWidth, yTp1);
      ctx.stroke();

      // TP1 Pill
      ctx.fillStyle = "#10b981";
      ctx.fillRect(paddingLeft + chartWidth + 2, yTp1 - 7, isMobile ? 52 : 62, 14);
      ctx.fillStyle = "#000000";
      ctx.font = `bold ${isMobile ? "8px" : "9px"} ui-monospace`;
      ctx.textAlign = "left";
      ctx.fillText(`TP1 $${activeSignalPrice.tp1.toFixed(1)}`, paddingLeft + chartWidth + 4, yTp1 + 3);
    }

    ctx.setLineDash([]);

    // 8. Real-Time Price Line & Pulse Badge
    if (currentBid > 0) {
      const yBid = getY(currentBid);
      ctx.strokeStyle = "rgba(0, 255, 170, 0.75)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, yBid);
      ctx.lineTo(paddingLeft + chartWidth, yBid);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pulsing Current Price Badge on Right Axis
      const latestBar = visibleBars[visibleBars.length - 1];
      const isBull = latestBar.trend === 1;

      ctx.fillStyle = isBull ? "#00FFAA" : "#FF3B30";
      ctx.fillRect(paddingLeft + chartWidth + 2, yBid - 8, isMobile ? 52 : 62, 16);

      ctx.fillStyle = isBull ? "#040b12" : "#ffffff";
      ctx.font = `bold ${isMobile ? "9px" : "10px"} ui-monospace, SFMono-Regular`;
      ctx.textAlign = "left";
      ctx.fillText(`$${currentBid.toFixed(2)}`, paddingLeft + chartWidth + (isMobile ? 3 : 5), yBid + 4);
    }

    // 9. Interactive Touch / Mouse Crosshair
    if (mousePos && mousePos.x >= paddingLeft && mousePos.x <= paddingLeft + chartWidth) {
      ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, paddingTop);
      ctx.lineTo(mousePos.x, paddingTop + chartHeight);
      ctx.stroke();

      // Horizontal line
      if (mousePos.y >= paddingTop && mousePos.y <= paddingTop + chartHeight) {
        ctx.beginPath();
        ctx.moveTo(paddingLeft, mousePos.y);
        ctx.lineTo(paddingLeft + chartWidth, mousePos.y);
        ctx.stroke();

        // Price at crosshair
        const hoverPrice = maxPrice - ((mousePos.y - paddingTop) / chartHeight) * priceRange;
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(paddingLeft + chartWidth + 2, mousePos.y - 7, isMobile ? 52 : 62, 14);

        ctx.fillStyle = "#f8fafc";
        ctx.font = `${isMobile ? "8px" : "9px"} ui-monospace, SFMono-Regular`;
        ctx.textAlign = "left";
        ctx.fillText(`$${hoverPrice.toFixed(2)}`, paddingLeft + chartWidth + 4, mousePos.y + 3);
      }

      ctx.setLineDash([]);
    }

    // 10. Time Scale Labels on Bottom
    ctx.fillStyle = "#64748b";
    ctx.font = `${isMobile ? "8px" : "9px"} ui-monospace, SFMono-Regular`;
    ctx.textAlign = "center";

    const timeStep = Math.max(1, Math.floor(visibleBars.length / (isMobile ? 3 : 5)));
    for (let i = 0; i < visibleBars.length; i += timeStep) {
      const bar = visibleBars[i];
      const x = paddingLeft + i * barWidth + barWidth / 2;
      const d = new Date(bar.time);
      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      ctx.fillText(timeStr, x, paddingTop + chartHeight + (isMobile ? 14 : 16));
    }
  }, [
    tssResult,
    config,
    visibleCount,
    panOffset,
    currentBid,
    currentAsk,
    activeSignalPrice,
    mousePos,
  ]);

  // Desktop Mouse Handlers
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setVisibleCount((prev) => Math.max(12, prev - 4));
    } else {
      setVisibleCount((prev) => Math.min(tssResult.bars.length, prev + 4));
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartPanRef.current = panOffset;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartXRef.current;
    const barPx = (rect?.width || 400) / visibleCount;
    const barDelta = Math.round(deltaX / barPx);
    setPanOffset(Math.max(0, dragStartPanRef.current + barDelta));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    setMousePos(null);
  };

  // Mobile Touch Handlers (Smooth Pan & Pinch Zoom)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartXRef.current = e.touches[0].clientX;
      dragStartPanRef.current = panOffset;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setMousePos({
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        });
      }
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const deltaX = e.touches[0].clientX - dragStartXRef.current;
      const rect = canvasRef.current?.getBoundingClientRect();
      const barPx = (rect?.width || 360) / visibleCount;
      const barDelta = Math.round(deltaX / barPx);
      setPanOffset(Math.max(0, dragStartPanRef.current + barDelta));

      if (rect) {
        setMousePos({
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        });
      }
    } else if (e.touches.length === 2 && touchDistanceRef.current) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = newDist - touchDistanceRef.current;
      if (Math.abs(diff) > 15) {
        if (diff > 0) {
          // Pinch Out -> Zoom In
          setVisibleCount((prev) => Math.max(12, prev - 2));
        } else {
          // Pinch In -> Zoom Out
          setVisibleCount((prev) => Math.min(tssResult.bars.length, prev + 2));
        }
        touchDistanceRef.current = newDist;
      }
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    touchDistanceRef.current = null;
  };

  const latestBar = tssResult.latestBar;
  const isBullState = tssResult.currentTrend === "BULLISH";

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full flex flex-col bg-gradient-to-b from-[#080d1a] to-[#04070e] select-none cursor-crosshair overflow-hidden touch-none"
    >
      {/* Top Sleek Mobile-First TSS Floating Toolbar */}
      <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none gap-1.5">
        {/* Left: Pine Script Status Pill */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-[#0b1220]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/80 shadow-md">
          <div className="flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                isBullState
                  ? "bg-[#00FFAA] shadow-[0_0_8px_#00FFAA] animate-pulse"
                  : "bg-[#FF3B30] shadow-[0_0_8px_#FF3B30] animate-pulse"
              }`}
            ></span>
            <span className="text-[11px] font-black tracking-wide text-slate-100 font-mono">
              TSS v6
            </span>
          </div>

          <div className="h-3 w-px bg-slate-700"></div>

          {/* Current Trend State Badge */}
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider ${
              isBullState
                ? "bg-[#00FFAA]/15 text-[#00FFAA]"
                : "bg-[#FF3B30]/15 text-[#FF3B30]"
            }`}
          >
            {isBullState ? "BULL (+1)" : "BEAR (-1)"}
          </span>

          {/* Step Filter Price */}
          <div className="flex items-center gap-1 text-[10px] font-mono">
            <span className="text-slate-400 hidden xs:inline">Filter:</span>
            <span
              className={`font-black ${
                isBullState ? "text-[#00FFAA]" : "text-[#FF3B30]"
              }`}
            >
              ${latestBar.filter.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Right: Quick Action Icon Buttons */}
        <div className="flex items-center gap-1 pointer-events-auto bg-[#0b1220]/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-md">
          {/* Zoom In */}
          <button
            onClick={() => setVisibleCount((p) => Math.max(12, p - 6))}
            title="Zoom In"
            className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition active:scale-90 cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => setVisibleCount((p) => Math.min(tssResult.bars.length, p + 6))}
            title="Zoom Out"
            className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition active:scale-90 cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Reset Pan */}
          <button
            onClick={() => setPanOffset(0)}
            title="Reset Pan"
            className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition active:scale-90 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-slate-700"></div>

          {/* Pine Script View / Copy */}
          <button
            onClick={() => setShowPineModal(true)}
            title="Lihat Kode Pine Script v6"
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-amber-400 hover:bg-amber-500/20 rounded-lg border border-amber-500/30 transition cursor-pointer"
          >
            <Code2 className="w-3 h-3" />
            <span className="hidden sm:inline">Pine</span>
          </button>

          {/* Settings Modal Toggle */}
          <button
            onClick={() => setShowSettingsModal(true)}
            title="TSS Strategy Parameters"
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-lg transition active:scale-95 cursor-pointer"
          >
            <Sliders className="w-3 h-3" />
            <span>Config</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Canvas */}
      <canvas ref={canvasRef} className="w-full h-full flex-1 block" />

      {/* Floating Bottom Signal Reversal Indicator if New Flip */}
      {(latestBar.bullSignal || latestBar.bearSignal) && (
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#09101d]/95 border border-amber-500/50 shadow-xl backdrop-blur-md animate-bounce max-w-[90%]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
          <span className="text-[11px] font-black font-mono text-white truncate">
            {latestBar.bullSignal ? "FRESH TSS BUY FLIP" : "FRESH TSS SELL FLIP"}
          </span>
          <span
            className={`px-1.5 py-0.2 rounded text-[9px] font-black font-mono ${
              latestBar.bullSignal ? "bg-[#00FFAA] text-slate-950" : "bg-[#FF3B30] text-white"
            }`}
          >
            ${latestBar.filter.toFixed(1)}
          </span>
        </div>
      )}

      {/* TSS Parameters Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1220] border border-slate-700/90 rounded-2xl p-4 sm:p-5 w-full max-w-md shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-slate-100 text-xs sm:text-sm font-mono">
                  Pengaturan Trend State Strategy (Pine v6)
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white text-base font-bold px-1.5"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              {/* Source Type */}
              <div className="flex items-center justify-between">
                <label className="text-slate-300">Source Type</label>
                <select
                  value={config.sourceType}
                  onChange={(e) => handleUpdateConfig({ sourceType: e.target.value as any })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-amber-400 font-bold outline-none text-xs"
                >
                  <option value="Custom">Custom (Open+2H+2L+2C)/7</option>
                  <option value="Close">Close</option>
                  <option value="HL2">HL2 (High+Low)/2</option>
                  <option value="HLC3">HLC3 (H+L+C)/3</option>
                  <option value="OHLC4">OHLC4 (O+H+L+C)/4</option>
                  <option value="OCC3">OCC3 (O+2C)/3</option>
                  <option value="HLCC4">HLCC4 (H+L+2C)/4</option>
                </select>
              </div>

              {/* Sensitivity Length */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Sensitivity (ALMA Length):</span>
                  <span className="font-bold text-amber-400">{config.length}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={25}
                  step={1}
                  value={config.length}
                  onChange={(e) => handleUpdateConfig({ length: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Range Multiplier */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Range Multiplier:</span>
                  <span className="font-bold text-amber-400">{config.multiplier.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={5.0}
                  step={0.05}
                  value={config.multiplier}
                  onChange={(e) => handleUpdateConfig({ multiplier: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* ALMA Offset */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>ALMA Offset:</span>
                  <span className="font-bold text-amber-400">{config.offset.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.025}
                  value={config.offset}
                  onChange={(e) => handleUpdateConfig({ offset: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* ALMA Sigma */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>ALMA Sigma:</span>
                  <span className="font-bold text-amber-400">{config.sigma.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={6.0}
                  step={0.1}
                  value={config.sigma}
                  onChange={(e) => handleUpdateConfig({ sigma: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.confirmClose}
                    onChange={(e) => handleUpdateConfig({ confirmClose: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                  <span>Confirm Bar Close</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.showGlow}
                    onChange={(e) => handleUpdateConfig({ showGlow: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                  <span>Line Glow</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.showRibbon}
                    onChange={(e) => handleUpdateConfig({ showRibbon: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                  <span>Gradient Ribbon</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.paintCandles}
                    onChange={(e) => handleUpdateConfig({ paintCandles: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                  <span>Paint Candles</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-800">
              <button
                onClick={() => setConfig(defaultTSSConfig)}
                className="text-xs text-slate-400 hover:text-amber-400 font-mono"
              >
                Reset Default
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-3.5 py-1.5 bg-amber-500 text-slate-950 font-bold font-mono text-xs rounded-xl hover:bg-amber-400 transition"
              >
                Simpan & Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pine Script Code Modal */}
      {showPineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0c1424] border border-slate-700/90 rounded-2xl p-4 sm:p-5 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-slate-100 text-xs sm:text-sm font-mono">
                  TradingView Pine Script v6 (TSS_Strat)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPineScript}
                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-slate-950 font-bold font-mono text-xs rounded-lg hover:bg-amber-400 transition"
                >
                  {copiedPine ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPine ? "Tersalin!" : "Salin Pine Script"}</span>
                </button>
                <button
                  onClick={() => setShowPineModal(false)}
                  className="text-slate-400 hover:text-white text-base font-bold px-1.5"
                >
                  ✕
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-mono">
              Script ini dapat langsung ditempelkan pada Pine Editor di TradingView untuk backtesting atau live alert webhook.
            </p>

            <pre className="flex-1 bg-[#060a12] p-2.5 rounded-xl border border-slate-800 text-[10px] sm:text-[11px] font-mono text-emerald-400 overflow-y-auto select-all leading-relaxed">
              {getPineScriptCode(config)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
