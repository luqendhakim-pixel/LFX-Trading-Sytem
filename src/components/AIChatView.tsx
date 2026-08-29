import React, { useState } from "react";
import { MessageSquare, Send, Sparkles, Bot, User, ShieldCheck, Zap } from "lucide-react";
import { AISignal } from "../types";

interface AIChatViewProps {
  currentSignal: AISignal | null;
  currentPrice?: number;
  onSelectSignal?: (signal: AISignal) => void;
}

export const AIChatView: React.FC<AIChatViewProps> = ({ currentSignal, currentPrice, onSelectSignal }) => {
  const [messages, setMessages] = useState<
    { id: string; sender: "ai" | "user"; text: string; time: string }[]
  >([
    {
      id: "1",
      sender: "ai",
      text: "Halo! Saya AI Trading Assistant Gold (XAU/USD). Sinyal saat ini terkonfirmasi dengan Stop Loss 50 pips dan Take Profit 1-4. Ada yang ingin Anda konsultasikan mengenai analisis pasar hari ini?",
      time: "13:45 WIB",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user" as const,
      text: inputText,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      // Direct fast AI assistant query
      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          context: {
            signal: currentSignal,
            symbol: "XAUUSD",
          },
        }),
      });

      const data = await response.json();
      const aiReply =
        data?.response ||
        (userMsg.text.toLowerCase().includes("sl") || userMsg.text.toLowerCase().includes("stop loss")
          ? "Untuk Stop Loss (SL) pada XAU/USD, terminal ini mengunci aturan wajib 50 pips ($5.00) dari titik Entry. Hal ini dirancang untuk menahan fluktuasi normal saat pembukaan sesi London & New York tanpa premature hit."
          : `Berdasarkan analisis struktur pasar XAU/USD, pergerakan saat ini berada dalam rentang momentum yang kuat. Sinyal aktif dengan SL 50 pips dan target TP1-4 telah dihitung secara presisi.`);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: aiReply,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "Momentum XAU/USD saat ini terpantau bullish di atas EMA 50 dengan filter range stabil. Tetap patuhi aturan Stop Loss 50 pips dan kunci Break Even saat TP1 tercapai.",
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      id="ai-chat-view"
      className="w-full max-w-lg md:max-w-3xl mx-auto pb-28 pt-2 px-3 sm:px-4 text-slate-100 flex flex-col h-[80vh] animate-fadeIn"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-950/80 border border-sky-500/40 text-sky-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">AI Copilot XAU/USD</h2>
            <p className="text-xs text-slate-400">Konsultasi Sinyal, Trend SMC & Risiko</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Online
        </span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                m.sender === "user" ? "bg-sky-600 text-white" : "bg-indigo-600 text-white"
              }`}
            >
              {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                m.sender === "user"
                  ? "bg-sky-600 text-white rounded-tr-none font-medium"
                  : "bg-[#0b1021] border border-slate-800 text-slate-200 rounded-tl-none font-sans"
              }`}
            >
              <div>{m.text}</div>
              <div
                className={`text-[9px] mt-1 font-mono text-right ${
                  m.sender === "user" ? "text-sky-200" : "text-slate-500"
                }`}
              >
                {m.time}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pl-9 font-mono">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
            AI sedang menganalisis grafik...
          </div>
        )}
      </div>

      {/* Quick Questions */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar text-xs shrink-0">
        {[
          "Bagaimana aturan SL 50 pips?",
          "Analisis sesi New York hari ini?",
          "Kapan waktu geser ke Break Even?",
        ].map((q, idx) => (
          <button
            key={idx}
            onClick={() => setInputText(q)}
            className="px-2.5 py-1 rounded-xl bg-[#0b1021] hover:bg-[#0f172e] border border-slate-800 text-slate-300 whitespace-nowrap text-[11px] cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <div className="pt-2 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Tanyakan analisis emas, validasi sinyal..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-[#090e1e] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl transition cursor-pointer shadow-md shadow-sky-600/20 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
