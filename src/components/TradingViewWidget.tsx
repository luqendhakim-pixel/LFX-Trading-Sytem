import React, { useEffect, useRef, memo } from "react";
import { Timeframe } from "../types";

interface TradingViewWidgetProps {
  timeframe: Timeframe;
  onTimeframeChange?: (tf: Timeframe) => void;
  symbol?: string;
  theme?: "dark" | "light";
}

// Convert our timeframe format to TradingView interval format
const mapTimeframeToTVInterval = (tf: Timeframe): string => {
  switch (tf) {
    case "M1":
      return "1";
    case "M5":
      return "5";
    case "M15":
      return "15";
    case "H1":
      return "60";
    case "H4":
      return "240";
    case "D1":
      return "D";
    default:
      return "5";
  }
};

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = memo(
  ({ timeframe, symbol = "OANDA:XAUUSD", theme = "dark" }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const containerIdRef = useRef<string>(`tv_chart_container_${Math.random().toString(36).substring(7)}`);

    useEffect(() => {
      const currentContainerId = containerIdRef.current;
      let scriptElement: HTMLScriptElement | null = null;

      const initWidget = () => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = "";

        const widgetContainer = document.createElement("div");
        widgetContainer.id = currentContainerId;
        widgetContainer.style.width = "100%";
        widgetContainer.style.height = "100%";
        containerRef.current.appendChild(widgetContainer);

        const interval = mapTimeframeToTVInterval(timeframe);

        if ((window as any).TradingView) {
          try {
            new (window as any).TradingView.widget({
              autosize: true,
              symbol: symbol,
              interval: interval,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta",
              theme: theme,
              style: "1", // 1 = Candles
              locale: "id",
              toolbar_bg: "#0b0f17",
              enable_publishing: false,
              hide_side_toolbar: false,
              allow_symbol_change: true,
              save_image: true,
              container_id: currentContainerId,
              studies: [
                "STD;EMA",
                "STD;Bollinger_Bands",
                "STD;RSI",
              ],
              show_popup_button: true,
              popup_width: "1000",
              popup_height: "650",
              support_host: "https://www.tradingview.com",
              overrides: {
                "mainSeriesProperties.candleStyle.upColor": "#10b981",
                "mainSeriesProperties.candleStyle.downColor": "#ef4444",
                "mainSeriesProperties.candleStyle.wickUpColor": "#10b981",
                "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
                "mainSeriesProperties.candleStyle.borderUpColor": "#10b981",
                "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
                "paneProperties.background": "#0b0f17",
                "paneProperties.vertGridProperties.color": "#161f2e",
                "paneProperties.horzGridProperties.color": "#161f2e",
              },
            });
          } catch (e) {
            console.error("TradingView widget init error:", e);
          }
        }
      };

      if ((window as any).TradingView) {
        initWidget();
      } else {
        scriptElement = document.createElement("script");
        scriptElement.id = "tradingview-widget-script";
        scriptElement.src = "https://s3.tradingview.com/tv.js";
        scriptElement.async = true;
        scriptElement.onload = () => {
          initWidget();
        };
        document.head.appendChild(scriptElement);
      }

      return () => {
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }
      };
    }, [timeframe, symbol, theme]);

    return (
      <div className="relative w-full h-full min-h-[480px] bg-[#0b0f17] flex flex-col">
        <div ref={containerRef} className="w-full flex-1" style={{ minHeight: "480px" }} />
      </div>
    );
  }
);
