import React, { useState, useEffect, useCallback } from "react";
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Newspaper,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  X,
  Activity,
  Globe,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from "lucide-react";
import { FearAndGreedData, MarketHeadline, MarketSentimentResponse } from "../types";

interface MarketSentimentTickerProps {
  onSelectHeadline?: (headline: MarketHeadline) => void;
}

export const MarketSentimentTicker: React.FC<MarketSentimentTickerProps> = ({
  onSelectHeadline,
}) => {
  const [sentimentData, setSentimentData] = useState<MarketSentimentResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedHeadline, setSelectedHeadline] = useState<MarketHeadline | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSentimentDetailOpen, setIsSentimentDetailOpen] = useState<boolean>(false);

  const fetchSentimentAndNews = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/market/sentiment-news");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSentimentData(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch sentiment ticker data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSentimentAndNews();
    const interval = setInterval(fetchSentimentAndNews, 45000); // 45s refresh
    return () => clearInterval(interval);
  }, [fetchSentimentAndNews]);

  const fg = sentimentData?.fearAndGreed;
  const headlines = sentimentData?.headlines || [];

  // Determine Fear & Greed styles
  const getRatingColor = (score: number) => {
    if (score >= 75) return { text: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/40", bar: "bg-emerald-400" };
    if (score >= 55) return { text: "text-teal-300", bg: "bg-teal-500/15", border: "border-teal-500/40", bar: "bg-teal-400" };
    if (score >= 45) return { text: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/40", bar: "bg-amber-400" };
    if (score >= 25) return { text: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/40", bar: "bg-orange-400" };
    return { text: "text-rose-400", bg: "bg-rose-500/15", border: "border-rose-500/40", bar: "bg-rose-500" };
  };

  const getImpactBadge = (impact: MarketHeadline["impact"]) => {
    switch (impact) {
      case "BULLISH GOLD":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "BEARISH GOLD":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "HIGH IMPACT":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "MEDIUM IMPACT":
        return "bg-sky-500/20 text-sky-300 border-sky-500/40";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const currentScore = fg?.score || 68;
  const ratingStyles = getRatingColor(currentScore);

  const handleOpenHeadline = (h: MarketHeadline) => {
    setSelectedHeadline(h);
    setIsModalOpen(true);
    if (onSelectHeadline) onSelectHeadline(h);
  };

  return (
    <>
      {/* Top Scrolling Ticker Bar */}
      <section
        id="market-sentiment-ticker-bar"
        aria-label="Live Market Fear & Greed and News Ticker"
        className="w-full bg-[#080c16] border-b border-slate-800/90 text-slate-200 text-xs flex items-center justify-between overflow-hidden select-none relative z-30"
      >
        {/* Left Fixed Badge: Fear & Greed Index */}
        <div className="flex items-center shrink-0 pl-3 pr-3 py-1.5 bg-[#0b101e] border-r border-slate-800 z-10 space-x-2.5">
          <button
            id="btn-open-sentiment-details"
            onClick={() => setIsSentimentDetailOpen(true)}
            className="flex items-center space-x-2 group hover:opacity-90 transition cursor-pointer text-left"
            title="Klik untuk melihat detail Fear & Greed Index dan Makro Drivers Emas"
          >
            <div className="flex items-center space-x-1.5">
              <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Flame className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 hidden sm:inline">
                GOLD FEAR & GREED:
              </span>
            </div>

            {/* Score & Pill */}
            <div
              className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-md border font-mono font-bold text-xs ${ratingStyles.bg} ${ratingStyles.text} ${ratingStyles.border}`}
            >
              <span>{currentScore}</span>
              <span className="text-[10px] font-sans font-semibold text-slate-300 hidden md:inline">
                / 100 • {fg?.rating?.replace("_", " ") || "GREED"}
              </span>
            </div>
          </button>

          {/* Quick Macro Drivers */}
          {fg && (
            <div className="hidden lg:flex items-center space-x-2 text-[10.5px] font-mono text-slate-400 border-l border-slate-800 pl-2">
              <span title="US Dollar Index">
                DXY: <strong className="text-slate-200">{fg.dxyIndex}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span title="US 10-Year Treasury Yield">
                10Y: <strong className="text-slate-200">{fg.us10yYield}%</strong>
              </span>
            </div>
          )}
        </div>

        {/* Center: Infinite Marquee Scrolling Market News Headlines */}
        <div className="flex-1 overflow-hidden relative flex items-center py-1.5 mask-marquee">
          {headlines.length > 0 ? (
            <div className="animate-marquee flex items-center space-x-6 cursor-pointer">
              {/* Duplicate array for seamless infinite marquee loop */}
              {[...headlines, ...headlines].map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  onClick={() => handleOpenHeadline(item)}
                  className="flex items-center space-x-2 shrink-0 group transition hover:text-amber-300"
                >
                  <span
                    className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border uppercase ${getImpactBadge(
                      item.impact
                    )}`}
                  >
                    {item.impact}
                  </span>
                  <span className="text-[10px] font-bold text-amber-400/90 font-mono">
                    [{item.category}]
                  </span>
                  <span className="text-xs text-slate-200 group-hover:text-amber-300 transition-colors font-medium">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({item.source} • {item.timeAgo})
                  </span>
                  <span className="text-slate-700 text-xs select-none">✦</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic px-4 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Memuat headline sentimen pasar & makro ekonomi XAU/USD...</span>
            </div>
          )}
        </div>

        {/* Right Action: News Feed Drawer & Refresh Button */}
        <div className="flex items-center shrink-0 pr-3 pl-2 py-1.5 bg-[#080c16] border-l border-slate-800 space-x-1.5 z-10">
          <button
            id="btn-open-all-news-modal"
            onClick={() => {
              if (headlines.length > 0) setSelectedHeadline(headlines[0]);
              setIsModalOpen(true);
            }}
            className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
            title="Lihat semua berita makro & analisa fundamental emas"
          >
            <Newspaper className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Semua Berita</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded font-mono">
              {headlines.length}
            </span>
          </button>

          <button
            id="btn-refresh-sentiment"
            onClick={fetchSentimentAndNews}
            disabled={isLoading}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition cursor-pointer disabled:opacity-50"
            title="Muat ulang sentimen & berita"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </section>

      {/* Modal 1: Fear & Greed In-Depth Breakdown Modal */}
      {isSentimentDetailOpen && fg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 animate-in fade-in duration-200">
          <div
            id="fear-greed-detail-modal"
            className="bg-[#0f1420] border border-slate-800 w-full max-w-lg rounded-2xl p-5 shadow-2xl space-y-4 text-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    Gold Fear & Greed Index
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                      Live Macro
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Indikator psikologi pasar dan arus likuiditas institusional XAU/USD
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSentimentDetailOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Big Gauge Display */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-2.5">
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-black font-mono tracking-tight text-slate-100">
                  {fg.score}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
              </div>

              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold font-mono uppercase border border-amber-500/30 bg-amber-500/10 text-amber-300">
                {fg.ratingLabel}
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${ratingStyles.bar}`}
                  style={{ width: `${fg.score}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1 pt-1">
                <span>0 (Extreme Fear)</span>
                <span>50 (Neutral)</span>
                <span>100 (Extreme Greed)</span>
              </div>
            </div>

            {/* Historical Sentiments & Macro Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block">Kemarin</span>
                <span className="text-xs font-bold font-mono text-slate-200">{fg.previousClose}</span>
              </div>
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block">1 Minggu Lalu</span>
                <span className="text-xs font-bold font-mono text-slate-200">{fg.oneWeekAgo}</span>
              </div>
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block">US Dollar (DXY)</span>
                <span className="text-xs font-bold font-mono text-emerald-400">{fg.dxyIndex}</span>
              </div>
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block">US 10Y Yield</span>
                <span className="text-xs font-bold font-mono text-amber-400">{fg.us10yYield}%</span>
              </div>
            </div>

            {/* AI Summary & Confluence */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Makro Confluence Note:</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11.5px]">{fg.summary}</p>
              <div className="pt-1.5 border-t border-amber-500/20 text-[11px] text-amber-300 font-semibold">
                Bias Sentimen: {fg.goldBiasLabel}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setIsSentimentDetailOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: All Market News & Selected Headline Detailed Modal */}
      {isModalOpen && selectedHeadline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 animate-in fade-in duration-200">
          <div
            id="market-news-modal"
            className="bg-[#0f1420] border border-slate-800 w-full max-w-2xl rounded-2xl p-5 shadow-2xl space-y-4 text-slate-200 max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Newspaper className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    Warta Pasar & Makro Emas (XAU/USD)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Kompilasi berita fundamental & order flow yang mempengaruhi sinyal AI
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Active Selected Article Details */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getImpactBadge(
                    selectedHeadline.impact
                  )}`}
                >
                  {selectedHeadline.impact}
                </span>
                <span className="text-[10.5px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {selectedHeadline.category}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedHeadline.source} • {selectedHeadline.timeAgo}
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-100 leading-snug">
                {selectedHeadline.title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedHeadline.summary}
              </p>
            </div>

            {/* List of Other Headlines */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Headline Terkini Lainnya:
              </h5>
              {headlines.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedHeadline(item)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                    selectedHeadline.id === item.id
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-200"
                      : "bg-slate-900/50 hover:bg-slate-900 border-slate-800/80 text-slate-300"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getImpactBadge(
                          item.impact
                        )}`}
                      >
                        {item.impact}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-mono">
                        [{item.category}]
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-tight line-clamp-1">{item.title}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap shrink-0">
                    {item.timeAgo}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
              <span className="text-[10px] text-slate-500">
                Terhubung otomatis dengan feed makro ekonomi live
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
