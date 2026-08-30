import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  TrendingUp,
  Shield,
  Clock,
  DollarSign,
  Layers,
  HelpCircle,
} from "lucide-react";
import Markdown from "react-markdown";
import { AISignal } from "../types";

interface AIChatViewProps {
  currentSignal: AISignal | null;
  currentPrice?: number;
  onSelectSignal?: (signal: AISignal) => void;
}

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  time: string;
}

export const AIChatView: React.FC<AIChatViewProps> = ({ currentSignal, currentPrice = 4500.0, onSelectSignal }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: `Halo! Saya **AI Copilot Spesialis XAU/USD (Spot Gold)**.

Saya menguasai metodologi **Smart Money Concepts (ICT/SMC)**, sistem trading institusional, aturan baku **SL 50 Pips & BEP di TP1**, manajemen risiko kuantitatif, analisis fundamental makro (DXY, CPI, NFP, The Fed), hingga karakteristik sesi London & New York.

Silakan pilih topik cepat di bawah atau ajukan pertanyaan spesifik Anda:`,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: "ai",
        text: "Percakapan telah direset. Silakan tanyakan hal baru seputar strategi emas, order block, atau perhitungan lot akun Anda.",
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
      },
    ]);
  };

  const executeSend = async (queryText: string) => {
    if (!queryText.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: queryText,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      // Build conversation history payload
      const historyPayload = messages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          chatHistory: historyPayload,
          marketContext: {
            currentPrice: currentPrice || 4500.0,
            symbol: "XAUUSD",
            trend: currentSignal?.trendDirection || "BULLISH",
            timeframe: currentSignal?.timeframe || "M15",
            currentSignal: currentSignal,
            recommendedZones: currentSignal
              ? {
                  entryZone: `${currentSignal.entryPrice.toFixed(2)}`,
                  stopLoss: currentSignal.stopLoss,
                  takeProfit1: currentSignal.takeProfit1,
                  takeProfit2: currentSignal.takeProfit2,
                  takeProfit3: currentSignal.takeProfit3,
                  takeProfit4: currentSignal.takeProfit4,
                }
              : undefined,
          },
        }),
      });

      const data = await response.json();
      const aiReply = data?.reply || data?.response;

      if (aiReply) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "ai",
            text: aiReply,
            time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
          },
        ]);
      } else {
        throw new Error("No response from server");
      }
    } catch {
      // Fallback message with comprehensive context
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: `## 📊 Analisis Cepat XAU/USD (Spot Gold)
Harga emas saat ini berada di **$${(currentPrice || 4500).toFixed(2)}**.
- **Aturan Baku SL**: Stop Loss terkunci wajib **50 pips ($5.00)** dari titik entry.
- **SOP Breakeven**: Pindahkan SL ke titik entry (+0) begitu harga menyentuh **TP1 (+50 pips)**.
- **Manajemen Modal**: Batasi risiko maksimal 1% per trade dan jangan gunakan martingale.`,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickQuestions = [
    { label: "🎯 Analisa Setup Emas Terkini", icon: TrendingUp },
    { label: "🛡️ Aturan Wajib SL 50 Pips", icon: Shield },
    { label: "🔒 Kapan Waktu Geser ke Breakeven (BEP)?", icon: Shield },
    { label: "🧱 Penjelasan Order Block & FVG (SMC)", icon: Layers },
    { label: "⏰ Karakter Sesi London & New York", icon: Clock },
    { label: "⚖️ Cara Hitung Lot Size Sesuai Saldo", icon: DollarSign },
    { label: "📰 Pengaruh Berita NFP & CPI Terhadap Emas", icon: Sparkles },
    { label: "📉 Hubungan Indeks DXY vs XAU/USD", icon: HelpCircle },
  ];

  return (
    <div
      id="ai-chat-view"
      className="w-full max-w-lg md:max-w-3xl mx-auto pb-24 pt-2 px-3 sm:px-4 text-slate-100 flex flex-col h-[82vh] animate-fadeIn"
    >
      {/* Header with Live Context */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-950 to-indigo-950 border border-sky-500/40 text-sky-400 shadow-sm shadow-sky-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-white">AI Copilot XAU/USD</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-900/60 border border-sky-500/30 text-sky-300 font-bold">
                PRO SMC ENGINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Harga Live: <span className="font-mono text-amber-400 font-bold">${currentPrice.toFixed(2)}</span> | Stop Loss 50 Pips Standard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            title="Reset Percakapan"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px]">Reset</span>
          </button>
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                m.sender === "user"
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                  : "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              }`}
            >
              {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-3.5 text-xs leading-relaxed group relative ${
                m.sender === "user"
                  ? "bg-sky-600 text-white rounded-tr-none font-medium shadow-sm"
                  : "bg-[#0b1021] border border-slate-800 text-slate-200 rounded-tl-none shadow-md shadow-black/40"
              }`}
            >
              {m.sender === "ai" ? (
                <div className="prose prose-invert max-w-none text-xs text-slate-200 space-y-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-amber-400 [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-sky-300 [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_li]:text-slate-300 [&_strong]:text-white [&_code]:bg-slate-800/80 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-amber-300 [&_hr]:border-slate-800 [&_hr]:my-2">
                  <Markdown>{m.text}</Markdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{m.text}</div>
              )}

              <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                <div
                  className={`text-[9px] font-mono ${
                    m.sender === "user" ? "text-sky-200" : "text-slate-500"
                  }`}
                >
                  {m.time}
                </div>

                {m.sender === "ai" && (
                  <button
                    onClick={() => handleCopy(m.text, m.id)}
                    className="text-slate-400 hover:text-sky-300 transition p-0.5 rounded cursor-pointer opacity-80 hover:opacity-100 flex items-center gap-1 text-[10px]"
                    title="Salin jawaban"
                  >
                    {copiedId === m.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 text-[9px]">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="text-[9px]">Salin</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2.5 text-xs text-sky-400 pl-9 font-mono py-1">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
            <span className="animate-pulse">AI Copilot sedang menganalisis data SMC & pasar...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Interactive Questions */}
      <div className="shrink-0 py-2 border-t border-slate-800/60">
        <div className="text-[10px] text-slate-400 font-semibold mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Topik Konsultasi Populer:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {quickQuestions.map((q, idx) => {
            const Icon = q.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  setInputText(q.label);
                  executeSend(q.label);
                }}
                disabled={isTyping}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0b1021] hover:bg-[#111936] hover:border-sky-500/50 border border-slate-800 text-slate-300 hover:text-white whitespace-nowrap text-[11px] transition cursor-pointer shrink-0 disabled:opacity-50 active:scale-95"
              >
                <Icon className="w-3 h-3 text-sky-400 shrink-0" />
                <span>{q.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Input */}
      <div className="pt-2 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeSend(inputText);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Tanyakan analisis emas, order block, lot size, atau berita..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
            className="flex-1 bg-[#090e1e] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="p-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl transition cursor-pointer shadow-md shadow-sky-600/20 shrink-0 active:scale-95 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
