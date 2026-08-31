import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Candle, Timeframe } from "../types";
import {
  TrendStateConfig,
  defaultTSSConfig,
  calculateTrendStateStrategy,
  TrendStateStrategyResult,
  TSSBarResult,
} from "../utils/trendStateStrategy";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  Target,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";

export interface TSSChartRendererProps {
  candles: Candle[];
  timeframe?: Timeframe;
  config?: Partial<TrendStateConfig>;
  currentBid?: number;
  currentAsk?: number;
  spread?: number;
  activeSignalPrice?: {
    entry?: number;
    sl?: number;
    tp1?: number;
    tp2?: number;
    tp3?: number;
    type?: "BUY" | "SELL";
  };
  height?: number | string;
  className?: string;
  showToolbar?: boolean;
  onConfigChange?: (config: TrendStateConfig) => void;
}

export const TSSChartRenderer: React.FC<TSSChartRendererProps> = ({
  candles,
  timeframe = "M5",
  config: customConfig,
  currentBid = 0,
  currentAsk = 0,
  spread = 0,
  activeSignalPrice,
  height = "100%",
  className = "",
  showToolbar = true,
  onConfigChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Strategy Configuration State
  const [config, setConfig] = useState<TrendStateConfig>(() => {
    const saved = localStorage.getItem("tss_renderer_config");
    if (saved) {
      try {
        return { ...defaultTSSConfig, ...JSON.parse(saved), ...customConfig };
      } catch (e) {
        return { ...defaultTSSConfig, ...customConfig };
      }
    }
    return { ...defaultTSSConfig, ...customConfig };
  });

  // Keep internal config updated if customConfig changes
  useEffect(() => {
    if (customConfig) {
      setConfig((prev) => ({ ...prev, ...customConfig }));
    }
  }, [customConfig]);

  // Viewport Zoom & Pan: Focused view (32-40 bars default for crisp candle proportions)
  const [visibleCount, setVisibleCount] = useState<number>(35);
  const [panOffset, setPanOffset] = useState<number>(0);
  const [hoverBar, setHoverBar] = useState<TSSBarResult | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTargetZones, setShowTargetZones] = useState(true);

  // Dragging & Pinching Touch References
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartPanRef = useRef(0);
  const touchDistanceRef = useRef<number | null>(null);

  // Calculate Trend State Strategy Output matching Pine Script v6
  const tssResult: TrendStateStrategyResult = useMemo(() => {
    return calculateTrendStateStrategy(candles, config);
  }, [candles, config]);

  const updateConfig = (updates: Partial<TrendStateConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("tss_renderer_config", JSON.stringify(next));
      onConfigChange?.(next);
      return next;
    });
  };

  // High-Performance High-DPI Canvas Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const heightPx = rect.height;

    if (width === 0 || heightPx === 0) return;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(heightPx * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${heightPx}px`;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 0. Modern TradingView Dark Canvas Background
    ctx.fillStyle = "#0c1017";
    ctx.fillRect(0, 0, width, heightPx);

    const totalBars = tssResult.bars.length;
    if (totalBars === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.fillText("Memuat data candlestick pasar realtime...", width / 2, heightPx / 2);
      ctx.restore();
      return;
    }

    // Viewport calculation
    const count = Math.min(totalBars, Math.max(12, visibleCount));
    const maxPan = Math.max(0, totalBars - count);
    const clampedPan = Math.max(0, Math.min(maxPan, panOffset));
    const startIndex = Math.max(0, totalBars - count - clampedPan);
    const endIndex = Math.min(totalBars, startIndex + count);
    const visibleBars = tssResult.bars.slice(startIndex, endIndex);

    if (visibleBars.length === 0) {
      ctx.restore();
      return;
    }

    const isMobile = width < 640;
    const paddingRight = isMobile ? 66 : 78; // Space for right Y price scale
    const paddingBottom = isMobile ? 22 : 24; // Space for bottom X time scale
    const paddingTop = isMobile ? 38 : 36; // Space for top HUD
    const paddingLeft = isMobile ? 6 : 10;

    const chartWidth = Math.max(10, width - paddingLeft - paddingRight);
    const chartHeight = Math.max(10, heightPx - paddingTop - paddingBottom);

    const latestBar = tssResult.latestBar;
    const isBull = tssResult.currentTrend === "BULLISH";
    const currentPriceVal = currentBid > 0 ? currentBid : latestBar.close;

    let effectiveEntry = activeSignalPrice?.entry || currentPriceVal;
    let effectiveSL = activeSignalPrice?.sl;
    let effectiveTP1 = activeSignalPrice?.tp1;
    let effectiveTP2 = activeSignalPrice?.tp2;

    const adBuffer = Math.max(1.5, latestBar.adaptiveRange * 1.25);

    if (!effectiveSL) {
      effectiveSL = isBull
        ? Number((Math.min(latestBar.filter - 0.6, effectiveEntry - adBuffer)).toFixed(2))
        : Number((Math.max(latestBar.filter + 0.6, effectiveEntry + adBuffer)).toFixed(2));
    }

    const riskDist = Math.max(1.5, Math.abs(effectiveEntry - effectiveSL));

    if (!effectiveTP1) {
      effectiveTP1 = isBull
        ? Number((effectiveEntry + riskDist * 1.5).toFixed(2))
        : Number((effectiveEntry - riskDist * 1.5).toFixed(2));
    }
    if (!effectiveTP2) {
      effectiveTP2 = isBull
        ? Number((effectiveEntry + riskDist * 2.5).toFixed(2))
        : Number((effectiveEntry - riskDist * 2.5).toFixed(2));
    }

    // Dynamic Min & Max Price Calculation for Responsive Auto-Scaling
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    visibleBars.forEach((bar) => {
      minPrice = Math.min(minPrice, bar.low, bar.filter);
      maxPrice = Math.max(maxPrice, bar.high, bar.filter);
    });

    if (showTargetZones) {
      if (effectiveSL) {
        minPrice = Math.min(minPrice, effectiveSL);
        maxPrice = Math.max(maxPrice, effectiveSL);
      }
      if (effectiveTP1) {
        minPrice = Math.min(minPrice, effectiveTP1);
        maxPrice = Math.max(maxPrice, effectiveTP1);
      }
      if (effectiveTP2) {
        minPrice = Math.min(minPrice, effectiveTP2);
        maxPrice = Math.max(maxPrice, effectiveTP2);
      }
    }

    // Ensure balanced top and bottom padding (14%) so candles are well-proportioned
    const rawSpan = maxPrice - minPrice || 1.0;
    const priceMargin = Math.max(0.8, rawSpan * 0.14);
    minPrice -= priceMargin;
    maxPrice += priceMargin;
    const priceRange = maxPrice - minPrice || 1;

    const getY = (price: number) => {
      return paddingTop + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    };

    const barWidth = chartWidth / visibleBars.length;
    // Balanced TradingView candle body width (around 62-65% of bar interval)
    const candleWidth = Math.max(3.2, Math.min(14, barWidth * 0.64));

    // 1. Watermark in Center Background (TradingView style)
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    ctx.font = `bold ${isMobile ? "32px" : "48px"} ui-sans-serif, system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("XAUUSD • Gold", paddingLeft + chartWidth / 2, paddingTop + chartHeight / 2);

    // 2. Clean, High-Contrast Minimalist Dotted Grid Lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    const numPriceLines = isMobile ? 5 : 6;
    for (let i = 0; i <= numPriceLines; i++) {
      const priceVal = minPrice + (priceRange / numPriceLines) * i;
      const y = getY(priceVal);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(paddingLeft + chartWidth, y);
      ctx.stroke();

      // Right-side Price Scale labels
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
      ctx.font = `${isMobile ? "9px" : "10px"} ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`$${priceVal.toFixed(2)}`, paddingLeft + chartWidth + (isMobile ? 5 : 7), y);
      ctx.setLineDash([2, 4]);
    }
    ctx.setLineDash([]);

    // 3. Shaded TP & SL Visual Target Zones (Optional Area Boxes with Clean Dashed Borders)
    if (showTargetZones && effectiveEntry && effectiveSL && effectiveTP1) {
      const yEntry = getY(effectiveEntry);
      const ySL = getY(effectiveSL);
      const yTP1 = getY(effectiveTP1);
      const yTP2 = effectiveTP2 ? getY(effectiveTP2) : yTP1;

      // Risk Zone Box (Soft Crimson Shading)
      const slTop = Math.min(yEntry, ySL);
      const slHeight = Math.abs(yEntry - ySL);
      ctx.fillStyle = "rgba(242, 54, 69, 0.05)";
      ctx.fillRect(paddingLeft, slTop, chartWidth, slHeight);

      // Profit Zone Box (Soft Emerald Shading)
      const tpTop = Math.min(yEntry, yTP2);
      const tpHeight = Math.abs(yEntry - yTP2);
      ctx.fillStyle = "rgba(8, 153, 129, 0.05)";
      ctx.fillRect(paddingLeft, tpTop, chartWidth, tpHeight);

      // Entry Horizontal Golden Line
      ctx.strokeStyle = "rgba(245, 158, 11, 0.85)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, yEntry);
      ctx.lineTo(paddingLeft + chartWidth, yEntry);
      ctx.stroke();

      // Entry Price Pill Tag on Right Scale
      ctx.setLineDash([]);
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(paddingLeft + chartWidth + 2, yEntry - 7, isMobile ? 60 : 72, 14);
      ctx.fillStyle = "#020617";
      ctx.font = `bold ${isMobile ? "8px" : "9px"} ui-monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`⚡ ENT $${effectiveEntry.toFixed(1)}`, paddingLeft + chartWidth + 4, yEntry);

      // Stop Loss Red Line & Tag
      ctx.strokeStyle = "rgba(242, 54, 69, 0.85)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, ySL);
      ctx.lineTo(paddingLeft + chartWidth, ySL);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = "#F23645";
      ctx.fillRect(paddingLeft + chartWidth + 2, ySL - 7, isMobile ? 60 : 72, 14);
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${isMobile ? "8px" : "9px"} ui-monospace`;
      ctx.fillText(`🛑 SL $${effectiveSL.toFixed(1)}`, paddingLeft + chartWidth + 4, ySL);

      // Take Profit 1 Green Line & Tag
      ctx.strokeStyle = "rgba(8, 153, 129, 0.85)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, yTP1);
      ctx.lineTo(paddingLeft + chartWidth, yTP1);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = "#089981";
      ctx.fillRect(paddingLeft + chartWidth + 2, yTP1 - 7, isMobile ? 60 : 72, 14);
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${isMobile ? "8px" : "9px"} ui-monospace`;
      ctx.fillText(`🎯 TP1 $${effectiveTP1.toFixed(1)}`, paddingLeft + chartWidth + 4, yTP1);

      // Take Profit 2 Line & Tag (if exists)
      if (effectiveTP2) {
        ctx.strokeStyle = "rgba(16, 185, 129, 0.7)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, yTP2);
        ctx.lineTo(paddingLeft + chartWidth, yTP2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = "#10b981";
        ctx.fillRect(paddingLeft + chartWidth + 2, yTP2 - 7, isMobile ? 60 : 72, 14);
        ctx.fillStyle = "#020617";
        ctx.font = `bold ${isMobile ? "8px" : "9px"} ui-monospace`;
        ctx.fillText(`🎯 TP2 $${effectiveTP2.toFixed(1)}`, paddingLeft + chartWidth + 4, yTP2);
      }
    }

    // 4. Ribbon / Cloud Band (TSS upper & lower zones)
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

        const barIsBull = b2.trend === 1;
        ctx.fillStyle = barIsBull
          ? "rgba(0, 245, 160, 0.03)"
          : "rgba(255, 51, 75, 0.03)";
        ctx.fill();
      }
    }

    // 5. Authentic Japanese Candlesticks (TradingView Standard Anatomy)
    visibleBars.forEach((bar, i) => {
      const x = Math.round(paddingLeft + i * barWidth + barWidth / 2);
      const yOpen = getY(bar.open);
      const yClose = getY(bar.close);
      const yHigh = getY(bar.high);
      const yLow = getY(bar.low);

      const isUp = bar.close >= bar.open;

      // Authentic TradingView Colors: Emerald Green (#089981) for Bullish, Crimson Red (#F23645) for Bearish
      let bodyFill = isUp ? "#089981" : "#F23645";
      let borderStroke = isUp ? "#089981" : "#F23645";
      let wickStroke = isUp ? "#089981" : "#F23645";

      if (config.paintCandles) {
        // If trend painting is enabled, apply vibrant trend tones
        if (bar.trend === 1) {
          bodyFill = isUp ? "#00F5A0" : "#059669";
          borderStroke = "#00F5A0";
          wickStroke = "#00F5A0";
        } else if (bar.trend === -1) {
          bodyFill = isUp ? "#dc2626" : "#FF334B";
          borderStroke = "#FF334B";
          wickStroke = "#FF334B";
        }
      }

      // Upper & Lower Wick Line (Crisp Subpixel 1.2px)
      ctx.strokeStyle = wickStroke;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, yHigh);
      ctx.lineTo(x + 0.5, yLow);
      ctx.stroke();

      // Real Body (Open to Close)
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.abs(yClose - yOpen);
      const halfW = Math.round(candleWidth / 2);

      if (bodyHeight < 1.5) {
        // Doji / Flat bar: draw clean crossbar
        ctx.fillStyle = borderStroke;
        ctx.fillRect(x - halfW, bodyTop - 0.75, halfW * 2, 1.5);
      } else {
        // Body fill
        ctx.fillStyle = bodyFill;
        ctx.fillRect(x - halfW, bodyTop, halfW * 2, bodyHeight);

        // Body crisp 1px border
        ctx.strokeStyle = borderStroke;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - halfW, bodyTop, halfW * 2, bodyHeight);
      }
    });

    // 6. TSS Step Line (True TradingView Pine Script `plot.style_stepline`)
    // Step 6a: Soft Background Glow Layer underneath the step line
    if (config.showGlow) {
      ctx.lineWidth = isMobile ? 4.5 : 5.5;
      for (let i = 0; i < visibleBars.length - 1; i++) {
        const b1 = visibleBars[i];
        const b2 = visibleBars[i + 1];

        const x1 = paddingLeft + i * barWidth + barWidth / 2;
        const x2 = paddingLeft + (i + 1) * barWidth + barWidth / 2;
        const y1 = getY(b1.filter);
        const y2 = getY(b2.filter);

        ctx.strokeStyle = b2.trend === 1 ? "rgba(0, 245, 160, 0.25)" : "rgba(255, 51, 75, 0.25)";
        ctx.beginPath();
        // Step line: Horizontal across bar interval, then vertical step
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // Step 6b: Crisp Vibrant Solid Step Line OVERLAYING the Candles
    ctx.lineWidth = isMobile ? 2.2 : 2.6;
    for (let i = 0; i < visibleBars.length - 1; i++) {
      const b1 = visibleBars[i];
      const b2 = visibleBars[i + 1];

      const x1 = paddingLeft + i * barWidth + barWidth / 2;
      const x2 = paddingLeft + (i + 1) * barWidth + barWidth / 2;
      const y1 = getY(b1.filter);
      const y2 = getY(b2.filter);

      ctx.strokeStyle = b2.trend === 1 ? "#00F5A0" : "#FF334B";
      ctx.beginPath();
      // True Stepline: Horizontal shelf then vertical step
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 7. TradingView Strategy Buy & Sell Signal Badges
    if (config.showLabels) {
      visibleBars.forEach((bar, i) => {
        const x = paddingLeft + i * barWidth + barWidth / 2;

        if (bar.bullSignal) {
          const y = getY(bar.low) + (isMobile ? 12 : 15);

          // Arrow Up
          ctx.fillStyle = "#00F5A0";
          ctx.beginPath();
          ctx.moveTo(x, y - (isMobile ? 8 : 10));
          ctx.lineTo(x - (isMobile ? 5 : 6), y + (isMobile ? 1 : 2));
          ctx.lineTo(x + (isMobile ? 5 : 6), y + (isMobile ? 1 : 2));
          ctx.closePath();
          ctx.fill();

          // Pill Badge
          const pillW = isMobile ? 44 : 52;
          const pillH = isMobile ? 14 : 16;
          ctx.fillStyle = "#00F5A0";
          ctx.fillRect(x - pillW / 2, y + (isMobile ? 3 : 4), pillW, pillH);

          ctx.fillStyle = "#020617";
          ctx.font = `bold ${isMobile ? "8px" : "9px"} ui-sans-serif, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("BUY Long", x, y + (isMobile ? 10 : 12));
        }

        if (bar.bearSignal) {
          const y = getY(bar.high) - (isMobile ? 12 : 15);

          // Arrow Down
          ctx.fillStyle = "#FF334B";
          ctx.beginPath();
          ctx.moveTo(x, y + (isMobile ? 8 : 10));
          ctx.lineTo(x - (isMobile ? 5 : 6), y - (isMobile ? 1 : 2));
          ctx.lineTo(x + (isMobile ? 5 : 6), y - (isMobile ? 1 : 2));
          ctx.closePath();
          ctx.fill();

          // Pill Badge
          const pillW = isMobile ? 44 : 52;
          const pillH = isMobile ? 14 : 16;
          ctx.fillStyle = "#FF334B";
          ctx.fillRect(x - pillW / 2, y - (isMobile ? 17 : 20), pillW, pillH);

          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${isMobile ? "8px" : "9px"} ui-sans-serif, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("SELL Short", x, y - (isMobile ? 10 : 12));
        }
      });
    }

    // 8. Real-Time Price Line & Pulsing Live Price Badge on Right Scale
    if (currentPriceVal > 0) {
      const yPrice = getY(currentPriceVal);
      const isLatestUp = latestBar.close >= latestBar.open;
      const liveColor = isLatestUp ? "#089981" : "#F23645";

      ctx.strokeStyle = isLatestUp ? "rgba(8, 153, 129, 0.7)" : "rgba(242, 54, 69, 0.7)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, yPrice);
      ctx.lineTo(paddingLeft + chartWidth, yPrice);
      ctx.stroke();
      ctx.setLineDash([]);

      // Live Pulsing Price Pill Tag on Right Scale
      ctx.fillStyle = liveColor;
      ctx.fillRect(paddingLeft + chartWidth + 2, yPrice - 8, isMobile ? 60 : 72, 16);

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${isMobile ? "9px" : "10px"} ui-monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`● $${currentPriceVal.toFixed(2)}`, paddingLeft + chartWidth + 4, yPrice);
    }

    // 9. Interactive Touch / Cursor Crosshair
    if (mousePos && mousePos.x >= paddingLeft && mousePos.x <= paddingLeft + chartWidth) {
      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
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

        const hoverPrice = maxPrice - ((mousePos.y - paddingTop) / chartHeight) * priceRange;
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(paddingLeft + chartWidth + 2, mousePos.y - 7, isMobile ? 60 : 72, 14);

        ctx.fillStyle = "#f8fafc";
        ctx.font = `${isMobile ? "8px" : "9px"} ui-monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`$${hoverPrice.toFixed(2)}`, paddingLeft + chartWidth + 4, mousePos.y);
      }
      ctx.setLineDash([]);
    }

    // 10. Time Scale (Bottom axis)
    ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
    ctx.font = `${isMobile ? "8px" : "9px"} ui-monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const timeStep = Math.max(1, Math.floor(visibleBars.length / (isMobile ? 3 : 5)));
    for (let i = 0; i < visibleBars.length; i += timeStep) {
      const bar = visibleBars[i];
      const x = paddingLeft + i * barWidth + barWidth / 2;
      const d = new Date(bar.time);
      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      ctx.fillText(timeStr, x, paddingTop + chartHeight + (isMobile ? 12 : 14));
    }

    ctx.restore();
  }, [
    tssResult,
    config,
    visibleCount,
    panOffset,
    currentBid,
    currentAsk,
    activeSignalPrice,
    mousePos,
    showTargetZones,
  ]);

  // Pointer & Touch Handlers
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setVisibleCount((prev) => Math.max(12, prev - 3));
    } else {
      setVisibleCount((prev) => Math.min(tssResult.bars.length, prev + 3));
    }
  };

  const updateHoverBar = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setMousePos({ x, y });

    const totalBars = tssResult.bars.length;
    if (totalBars === 0) return;

    const isMobile = rect.width < 640;
    const paddingLeft = isMobile ? 6 : 10;
    const paddingRight = isMobile ? 66 : 78;
    const chartWidth = rect.width - paddingLeft - paddingRight;

    const count = Math.min(totalBars, Math.max(12, visibleCount));
    const maxPan = Math.max(0, totalBars - count);
    const clampedPan = Math.max(0, Math.min(maxPan, panOffset));
    const startIndex = Math.max(0, totalBars - count - clampedPan);
    const endIndex = Math.min(totalBars, startIndex + count);
    const visibleBars = tssResult.bars.slice(startIndex, endIndex);

    if (x >= paddingLeft && x <= paddingLeft + chartWidth && visibleBars.length > 0) {
      const barWidth = chartWidth / visibleBars.length;
      const indexInView = Math.floor((x - paddingLeft) / barWidth);
      if (indexInView >= 0 && indexInView < visibleBars.length) {
        setHoverBar(visibleBars[indexInView]);
        return;
      }
    }
    setHoverBar(null);
  }, [tssResult.bars, visibleCount, panOffset]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartPanRef.current = panOffset;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updateHoverBar(e.clientX, e.clientY);
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartXRef.current;
    const barPx = (containerRef.current?.clientWidth || 400) / visibleCount;
    const barDelta = Math.round(deltaX / barPx);
    setPanOffset(Math.max(0, dragStartPanRef.current + barDelta));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    setMousePos(null);
    setHoverBar(null);
  };

  // Touch Support (Single finger drag pan, Two fingers pinch zoom)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartXRef.current = e.touches[0].clientX;
      dragStartPanRef.current = panOffset;
      updateHoverBar(e.touches[0].clientX, e.touches[0].clientY);
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
      const barPx = (containerRef.current?.clientWidth || 360) / visibleCount;
      const barDelta = Math.round(deltaX / barPx);
      setPanOffset(Math.max(0, dragStartPanRef.current + barDelta));
      updateHoverBar(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2 && touchDistanceRef.current) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = newDist - touchDistanceRef.current;
      if (Math.abs(diff) > 10) {
        if (diff > 0) {
          setVisibleCount((prev) => Math.max(12, prev - 2));
        } else {
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

  const activeBar = hoverBar || tssResult.latestBar;
  const isBull = tssResult.currentTrend === "BULLISH";
  const barChange = activeBar.close - activeBar.open;
  const barChangePercent = activeBar.open > 0 ? (barChange / activeBar.open) * 100 : 0;
  const isBarUp = activeBar.close >= activeBar.open;

  return (
    <div
      ref={containerRef}
      style={{ height }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full flex flex-col bg-[#0c1017] select-none overflow-hidden touch-none ${className}`}
    >
      {/* 1. Modern TradingView Mini HUD Header */}
      {showToolbar && (
        <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none gap-2 flex-wrap">
          {/* Left: Interactive Real-time OHLC Legend */}
          <div className="flex items-center gap-2 pointer-events-auto bg-[#131722] px-2.5 py-1 rounded-xl border border-slate-800 shadow-md font-mono text-[11px]">
            {/* TSS Indicator Status */}
            <div className="flex items-center gap-1.5 border-r border-slate-800 pr-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isBull
                    ? "bg-[#00F5A0] shadow-[0_0_8px_#00F5A0] animate-pulse"
                    : "bg-[#FF334B] shadow-[0_0_8px_#FF334B] animate-pulse"
                }`}
              ></span>
              <span className="text-slate-300 font-bold">TSS_Strat:</span>
              <strong className={isBull ? "text-[#00F5A0]" : "text-[#FF334B]"}>
                ${activeBar.filter.toFixed(2)}
              </strong>
              <span
                className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                  isBull
                    ? "bg-[#00F5A0]/15 text-[#00F5A0] border border-[#00F5A0]/30"
                    : "bg-[#FF334B]/15 text-[#FF334B] border border-[#FF334B]/30"
                }`}
              >
                {isBull ? "BULL (+1)" : "BEAR (-1)"}
              </span>
            </div>

            {/* OHLC Bar Numbers */}
            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[10px]">
              <span>O: <strong className="text-slate-200">${activeBar.open.toFixed(2)}</strong></span>
              <span>H: <strong className="text-emerald-400">${activeBar.high.toFixed(2)}</strong></span>
              <span>L: <strong className="text-rose-400">${activeBar.low.toFixed(2)}</strong></span>
              <span>C: <strong className="text-slate-200">${activeBar.close.toFixed(2)}</strong></span>
              <span className={isBarUp ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {barChange >= 0 ? `+${barChange.toFixed(2)}` : barChange.toFixed(2)} ({barChangePercent >= 0 ? `+${barChangePercent.toFixed(2)}%` : `${barChangePercent.toFixed(2)}%`})
              </span>
            </div>
          </div>

          {/* Right: Modern Chart Quick Action Toolbar */}
          <div className="flex items-center gap-1 pointer-events-auto bg-[#131722] p-1 rounded-xl border border-slate-800 shadow-md">
            {/* Toggle Area TP / SL */}
            <button
              onClick={() => setShowTargetZones(!showTargetZones)}
              title={showTargetZones ? "Sembunyikan Area TP/SL" : "Tampilkan Area TP/SL"}
              className={`flex items-center gap-1 px-2 py-0.8 rounded-lg text-[10px] font-mono font-bold transition active:scale-90 cursor-pointer ${
                showTargetZones
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Area TP/SL</span>
            </button>

            {/* Zoom In */}
            <button
              onClick={() => setVisibleCount((p) => Math.max(12, p - 4))}
              title="Zoom In"
              className="p-1 text-slate-400 hover:text-amber-400 rounded-lg transition active:scale-90 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {/* Zoom Out */}
            <button
              onClick={() => setVisibleCount((p) => Math.min(tssResult.bars.length, p + 4))}
              title="Zoom Out"
              className="p-1 text-slate-400 hover:text-amber-400 rounded-lg transition active:scale-90 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Reset Focus */}
            <button
              onClick={() => {
                setPanOffset(0);
                setVisibleCount(35);
              }}
              title="Reset View"
              className="p-1 text-slate-400 hover:text-amber-400 rounded-lg transition active:scale-90 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowConfigModal(true)}
              title="Pengaturan TSS"
              className="p-1 text-slate-400 hover:text-amber-400 rounded-lg transition active:scale-90 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Fast Responsive Canvas */}
      <canvas ref={canvasRef} className="w-full h-full flex-1 block cursor-crosshair" />

      {/* 3. Minimalist Mobile TSS Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 animate-fadeIn">
          <div className="bg-[#0b1220] border border-slate-700/90 rounded-2xl p-4 w-full max-w-sm shadow-2xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Sliders className="w-4 h-4" />
                <span>Pengaturan TSS Pine Script v6</span>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold px-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Sensitivity */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Sensitivity (ALMA Length):</span>
                  <span className="font-bold text-amber-400">{config.length}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={config.length}
                  onChange={(e) => updateConfig({ length: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Multiplier */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Range Multiplier:</span>
                  <span className="font-bold text-amber-400">{config.multiplier.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={4.0}
                  step={0.1}
                  value={config.multiplier}
                  onChange={(e) => updateConfig({ multiplier: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.paintCandles}
                    onChange={(e) => updateConfig({ paintCandles: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                  <span>Warna Tren Lilin</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.showGlow}
                    onChange={(e) => updateConfig({ showGlow: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                  <span>Neon Glow Filter</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.showLabels}
                    onChange={(e) => updateConfig({ showLabels: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                  <span>Label Sinyal Buy/Sell</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.showRibbon}
                    onChange={(e) => updateConfig({ showRibbon: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                  <span>Ribbon Zone</span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition cursor-pointer"
              >
                Terapkan Pengaturan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
