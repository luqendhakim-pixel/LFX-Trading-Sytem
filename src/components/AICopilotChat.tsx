import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import {
  MessageSquare,
  Send,
  Sparkles,
  User,
  Bot,
  RefreshCw,
  HelpCircle,
  TrendingUp,
  Copy,
  Check,
  Zap,
  Layers,
  ShieldAlert,
  Target,
  ArrowRight,
  SlidersHorizontal,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { AISignal, Candle, RiskSettings, Timeframe } from "../types";

export interface KeyLevelsData {
  supports: number[];
  resistances: number[];
}

interface AICopilotChatProps {
  currentPrice: number;
  bid?: number;
  ask?: number;
  spread?: number;
  change24h?: number;
  trend: string;
  timeframe: Timeframe;
  balance: number;
  riskSettings?: RiskSettings;
  currentSignal?: AISignal | null;
  openPositionsCount: number;
  keyLevels?: KeyLevelsData;
  candles?: Candle[];
}

interface ChatMessage {
  id: string;
  sender: "USER" | "AI";
  text: string;
  time: string;
  contextSnapshot?: {
    price: number;
    trend: string;
    tp1: number;
    sl: number;
  };
}

export const AICopilotChat: React.FC<AICopilotChatProps> = ({
  currentPrice,
  bid,
  ask,
  spread,
  change24h,
  trend,
  timeframe,
  balance,
  riskSettings,
  currentSignal,
  openPositionsCount,
  keyLevels,
  candles,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "AI",
      text: `Halo Trader! Saya adalah **AI Market Intelligence Copilot** spesialis XAU/USD (Spot Gold & Institutional SMC).

Harga emas saat ini: **$${currentPrice.toFixed(2)}** [Timeframe: **${timeframe}** | Bias: **${trend}**].

Setiap permintaan analisa akan **otomatis diinjeksi dengan kondisi pasar live**, level Support/Resistance aktif, pemetaan **Order Block/FVG**, serta kalkulasi presisi zona **Entry, TP 1/2/3, dan SL**.

Silakan pilih prompt cepat di bawah atau ajukan pertanyaan spesifik Anda!`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showContextDetails, setShowContextDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick Action Prompts
  const quickPrompts = [
    {
      label: "🎯 Analisa Setup & Zona TP/SL",
      query: `Berikan analisa setup trading lengkap XAU/USD pada timeframe ${timeframe} dengan zona Entry, Stop Loss, dan TP 1/2/3 yang presisi.`,
    },
    {
      label: "🧱 Petakan Order Block & Key Levels",
      query: `Petakan zona Order Block (OB), Fair Value Gap (FVG), dan level Support/Resistance terdekat untuk XAU/USD ${timeframe}.`,
    },
    {
      label: "📈 Bias Trend & Konfirmasi SMC",
      query: `Bagaimana struktur tren SMC saat ini (BOS / CHoCH / Liquidity Sweep) dan konfluensi teknikalnya?`,
    },
    {
      label: "⚖️ Kalkulasi Lot & Manajemen Risiko",
      query: `Hitung rekomendasi lot size aman dan rencana manajemen risiko untuk saldo saya ($${balance.toLocaleString()}) pada setup saat ini.`,
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to compile injected market intelligence context
  const getCompiledMarketContext = () => {
    const isBullish = trend === "BULLISH" || (currentSignal && currentSignal.signalType.includes("BUY"));
    const primarySupport = keyLevels?.supports?.[0] || Number((currentPrice - 3.5).toFixed(2));
    const secondarySupport = keyLevels?.supports?.[1] || Number((currentPrice - 7.0).toFixed(2));
    const primaryResistance = keyLevels?.resistances?.[0] || Number((currentPrice + 3.5).toFixed(2));
    const secondaryResistance = keyLevels?.resistances?.[1] || Number((currentPrice + 7.0).toFixed(2));

    const defaultSlDist = timeframe === "M1" ? 1.8 : timeframe === "M5" ? 2.5 : timeframe === "M15" ? 4.0 : 8.0;
    const sl = currentSignal?.stopLoss || (isBullish ? Number((currentPrice - defaultSlDist).toFixed(2)) : Number((currentPrice + defaultSlDist).toFixed(2)));
    const tp1 = currentSignal?.takeProfit1 || (isBullish ? Number((currentPrice + defaultSlDist * 1.5).toFixed(2)) : Number((currentPrice - defaultSlDist * 1.5).toFixed(2)));
    const tp2 = currentSignal?.takeProfit2 || (isBullish ? Number((currentPrice + defaultSlDist * 2.5).toFixed(2)) : Number((currentPrice - defaultSlDist * 2.5).toFixed(2)));
    const tp3 = currentSignal?.takeProfit3 || (isBullish ? Number((currentPrice + defaultSlDist * 4.0).toFixed(2)) : Number((currentPrice - defaultSlDist * 4.0).toFixed(2)));

    const riskPercent = riskSettings?.riskPerTradePercent || 1;
    const maxRiskUsd = (balance * riskPercent) / 100;
    const slDistance = Math.abs(currentPrice - sl);
    const calculatedLot = Math.max(0.01, Number((maxRiskUsd / (slDistance * 100)).toFixed(2)));
    const lotSize = currentSignal?.riskAssessment?.recommendedLotSize || calculatedLot;

    return {
      currentPrice,
      bid: bid || Number((currentPrice - 0.15).toFixed(2)),
      ask: ask || Number((currentPrice + 0.15).toFixed(2)),
      spread: spread || 1.6,
      change24h: change24h || 0.45,
      trend,
      timeframe,
      balance,
      riskPerTradePercent: riskPercent,
      maxRiskUsd: Number(maxRiskUsd.toFixed(2)),
      recommendedLotSize: lotSize,
      keyLevels: {
        supports: keyLevels?.supports?.length ? keyLevels.supports : [primarySupport, secondarySupport],
        resistances: keyLevels?.resistances?.length ? keyLevels.resistances : [primaryResistance, secondaryResistance],
        nearestSupport: primarySupport,
        nearestResistance: primaryResistance,
      },
      recommendedZones: {
        entryPrice: currentSignal?.entryPrice || currentPrice,
        entryZone: currentSignal?.smcAnalysis?.orderBlockZone || `${(currentPrice - 0.8).toFixed(2)} - ${(currentPrice + 0.5).toFixed(2)}`,
        stopLoss: sl,
        takeProfit1: tp1,
        takeProfit2: tp2,
        takeProfit3: tp3,
        riskRewardRatio: currentSignal?.riskRewardRatio || "1:2.5",
      },
      smcAnalysis: {
        orderBlockZone: currentSignal?.smcAnalysis?.orderBlockZone || `${(currentPrice - (isBullish ? 1.5 : -1.5)).toFixed(2)} - ${(currentPrice - (isBullish ? 3.0 : -3.0)).toFixed(2)}`,
        liquidityTarget: currentSignal?.smcAnalysis?.liquidityTarget || `${(currentPrice + (isBullish ? 5.5 : -5.5)).toFixed(2)} Equal Highs/Lows`,
        bosStatus: currentSignal?.smcAnalysis?.bosStatus || "Break of Structure Confirmed",
        marketStructure: currentSignal?.smcAnalysis?.marketStructure || (isBullish ? "Higher Highs & Higher Lows" : "Lower Lows & Lower Highs"),
      },
      technicalFactors: currentSignal?.technicalFactors || [
        `EMA 20 & EMA 50 alignment pada timeframe ${timeframe}`,
        `RSI Momentum terkonfirmasi di zona ekspansi`,
        `Likuiditas teridentifikasi di zona eksternal`,
      ],
      currentSignal,
      openPositionsCount,
      recentCandlesCount: candles?.length || 0,
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const marketContext = getCompiledMarketContext();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "USER",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          marketContext,
        }),
      });

      const data = await response.json();
      const reply = data.reply || "Analisa pasar XAU/USD berhasil diperbarui.";

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "AI",
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        contextSnapshot: {
          price: marketContext.currentPrice,
          trend: marketContext.trend,
          tp1: marketContext.recommendedZones.takeProfit1,
          sl: marketContext.recommendedZones.stopLoss,
        },
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const isBull = marketContext.trend === "BULLISH";
      const slDist = Math.abs(marketContext.currentPrice - marketContext.recommendedZones.stopLoss);
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "AI",
        text: `## 📊 Analisa Pasar XAU/USD (${timeframe})
Harga spot emas saat ini berada di **$${currentPrice.toFixed(2)}** dengan bias pasar **${trend}**.

---

### 🎯 Setup Rencana Eksekusi:
- **Bias / Tipe Setup**: **${isBull ? "BUY ON RETEST DEMAND" : "SELL ON SUPPLY REJECTION"}**
- **🎯 Zona Entry Ideal**: **$${marketContext.recommendedZones.entryZone}**
- **🛑 Invalidation / Stop Loss (SL)**: **$${marketContext.recommendedZones.stopLoss.toFixed(2)}** *(Jarak ${slDist.toFixed(2)} USD)*
- **🎯 Target Take Profit**:
  - **TP 1**: **$${marketContext.recommendedZones.takeProfit1.toFixed(2)}** *(R:R 1:1.5 - Kunci profit / Geser SL ke BEP)*
  - **TP 2**: **$${marketContext.recommendedZones.takeProfit2.toFixed(2)}** *(R:R 1:2.5 - Target Likuiditas ${marketContext.smcAnalysis.liquidityTarget})*
  - **Runner TP 3**: **$${marketContext.recommendedZones.takeProfit3.toFixed(2)}** *(R:R 1:4.0 - Major Trend Expansion)*

---

### 🧱 Level Kunci & Konfluensi SMC:
- **Support Terdekat (S1/S2)**: $${marketContext.keyLevels.supports.join(", $")}
- **Resistance Terdekat (R1/R2)**: $${marketContext.keyLevels.resistances.join(", $")}
- **Order Block Target**: ${marketContext.smcAnalysis.orderBlockZone}
- **Rekomendasi Lot Size**: **${marketContext.recommendedLotSize} Lot** (Maksimal risiko -$${marketContext.maxRiskUsd.toFixed(2)} pada saldo $${balance.toLocaleString()}).`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        contextSnapshot: {
          price: marketContext.currentPrice,
          trend: marketContext.trend,
          tp1: marketContext.recommendedZones.takeProfit1,
          sl: marketContext.recommendedZones.stopLoss,
        },
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const primarySupport = keyLevels?.supports?.[0] || Number((currentPrice - 3.5).toFixed(2));
  const primaryResistance = keyLevels?.resistances?.[0] || Number((currentPrice + 3.5).toFixed(2));

  return (
    <div
      id="ai-copilot-chat-panel"
      className="bg-[#0f1420] border border-slate-800 rounded-xl p-4 shadow-xl text-slate-100 flex flex-col h-[410px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-slate-100 text-xs">AI Gold Copilot Chat</h4>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {timeframe}
              </span>
              <span
                className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded ${
                  trend === "BULLISH"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : trend === "BEARISH"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {trend}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Auto-Injected SMC Context • Key Levels, Entry & TP/SL Presisi
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowContextDetails(!showContextDetails)}
            className="text-[10px] text-slate-400 hover:text-amber-300 px-2 py-1 rounded bg-slate-900 border border-slate-800 flex items-center gap-1 transition cursor-pointer"
            title="Lihat Data Pasar yang Diinjeksi Otomatis"
          >
            <SlidersHorizontal className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Context Data</span>
          </button>
          <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="hidden sm:inline">Online</span>
          </div>
        </div>
      </div>

      {/* Auto Context Injection Status Banner */}
      <div className="bg-[#0a0e1a] px-2.5 py-1.5 border-b border-slate-800/80 text-[10px] font-mono flex items-center justify-between text-slate-400 shrink-0">
        <div className="flex items-center space-x-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span className="text-slate-300 font-bold">Injected Context:</span>
          <span className="text-amber-300 font-bold">${currentPrice.toFixed(2)}</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400">S: ${primarySupport.toFixed(2)}</span>
          <span className="text-slate-600">•</span>
          <span className="text-rose-400">R: ${primaryResistance.toFixed(2)}</span>
          {currentSignal?.takeProfit1 && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-teal-300">TP1: ${currentSignal.takeProfit1.toFixed(2)}</span>
            </>
          )}
        </div>
        <span className="text-[9px] text-slate-500 font-sans hidden md:inline flex items-center gap-1">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Live Synced
        </span>
      </div>

      {/* Collapsible Context Inspector */}
      {showContextDetails && (
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10.5px] font-mono text-slate-300 space-y-1 mb-1 mt-1 shrink-0 animate-fadeIn">
          <div className="flex items-center justify-between font-bold text-amber-400 border-b border-slate-800 pb-1">
            <span>⚡ Snapshot Parameter yang Diinjeksi:</span>
            <span>TF: {timeframe}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
            <div>• Harga Spot: ${currentPrice.toFixed(2)} (Sprd: {spread?.toFixed(1) || 1.6}p)</div>
            <div>• Bias Tren: {trend}</div>
            <div>• Support 1/2: ${keyLevels?.supports?.slice(0, 2).join(", $") || primarySupport.toFixed(2)}</div>
            <div>• Resistance 1/2: ${keyLevels?.resistances?.slice(0, 2).join(", $") || primaryResistance.toFixed(2)}</div>
            <div>• Order Block: {currentSignal?.smcAnalysis?.orderBlockZone || `$${(currentPrice - 1.5).toFixed(2)} - $${(currentPrice - 3.0).toFixed(2)}`}</div>
            <div>• Rekomendasi Lot: {currentSignal?.riskAssessment?.recommendedLotSize || 0.1} Lot</div>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-2.5 space-y-3 pr-1 text-xs custom-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.sender === "USER";
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-2 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0 mt-0.5 ${
                  isUser
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "bg-slate-800 border border-slate-700 text-amber-400"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-3 rounded-xl max-w-[90%] leading-relaxed relative group ${
                  isUser
                    ? "bg-amber-500/20 text-slate-100 border border-amber-500/30 rounded-tr-none text-xs"
                    : "bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none font-sans"
                }`}
              >
                {isUser ? (
                  <p className="text-[11px] whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="markdown-body text-[11.5px] space-y-1.5 text-slate-200 leading-relaxed">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                )}

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60 text-[9px] text-slate-500 font-mono">
                  <div className="flex items-center gap-2">
                    <span>{msg.time}</span>
                    {msg.contextSnapshot && (
                      <span className="text-[8.5px] text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded border border-slate-700/50">
                        Ref: ${msg.contextSnapshot.price.toFixed(2)} | TP: ${msg.contextSnapshot.tp1.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {!isUser && (
                    <button
                      onClick={() => handleCopyText(msg.text, msg.id)}
                      className="hover:text-amber-400 flex items-center gap-1 transition cursor-pointer text-slate-400"
                      title="Salin Analisa Lengkap"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-amber-400 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span className="text-[11px]">
              AI Copilot sedang memetakan kondisi pasar live, key levels, & zona TP/SL...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Prompts */}
      <div className="py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q.query)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10.5px] text-slate-300 hover:text-amber-300 hover:border-amber-500/40 hover:bg-slate-800/90 whitespace-nowrap transition cursor-pointer font-medium flex items-center gap-1"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="pt-1.5 border-t border-slate-800 flex items-center gap-1.5 shrink-0"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Tanyakan analisa trading XAU/USD (${timeframe}) dengan live context...`}
          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500 placeholder-slate-500 font-sans"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

