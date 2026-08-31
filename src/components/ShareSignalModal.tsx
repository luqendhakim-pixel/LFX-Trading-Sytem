import React, { useState } from "react";
import { X, Share2, Copy, Check, Send, MessageCircle } from "lucide-react";
import { AISignal } from "../types";

interface ShareSignalModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: AISignal | null;
}

export const ShareSignalModal: React.FC<ShareSignalModalProps> = ({
  isOpen,
  onClose,
  signal,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !signal) return null;

  const isBuy = signal.signalType.includes("BUY");
  const actionType = isBuy ? "BUY LONG 📈" : "SELL SHORT 📉";
  const entry = signal.entryPrice.toFixed(3);
  const sl = signal.stopLoss.toFixed(3);
  const tp1 = signal.takeProfit1.toFixed(3);
  const tp2 = signal.takeProfit2.toFixed(3);
  const tp3 = signal.takeProfit3.toFixed(3);
  const tp4 = (signal.takeProfit4 || (isBuy ? signal.entryPrice + 20.0 : signal.entryPrice - 20.0)).toFixed(3);
  const session = signal.session || "Tokyo / London";
  const time = signal.formattedTimeWib || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB";
  const zoneLow = (signal.entryZoneLow || (isBuy ? signal.entryPrice - 3.0 : signal.entryPrice)).toFixed(3);
  const zoneHigh = (signal.entryZoneHigh || (isBuy ? signal.entryPrice : signal.entryPrice + 3.0)).toFixed(3);

  const formattedText = `🚨 *XAU/USD GOLD VIP SIGNAL ALERT* 🚨

⚡ *Action:* ${actionType}
🎯 *Pair:* XAUUSD (Gold Spot)
💵 *Entry:* ${entry}
📍 *Zona Entry:* ${zoneLow} - ${zoneHigh}

🛡️ *Stop Loss:* ${sl} (50 Pips)
🎯 *TP1:* ${tp1} (+50 Pips)
🎯 *TP2:* ${tp2} (+100 Pips)
🎯 *TP3:* ${tp3} (+150 Pips)
🎯 *TP4:* ${tp4} (+200 Pips)

⚖️ *Risk / Reward:* ${signal.riskRewardRatio || "1 : 2.0"}
🌐 *Sesi:* ${session}
⏱️ *Waktu:* ${time}

💡 *Note:* Pasang SL wajib 50 pips. Geser SL ke Break Even setelah TP1 tercapai.
_Powered by XAU/USD VIP Trading Terminal_`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(formattedText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  const handleTelegram = () => {
    const encoded = encodeURIComponent(formattedText);
    window.open(`https://t.me/share/url?url=&text=${encoded}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
      <div
        id="share-signal-modal"
        className="w-full max-w-md bg-[#0a0f1d] border border-slate-700/70 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-950/80 border border-sky-500/30 text-sky-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Bagikan Sinyal Trading</h3>
              <p className="text-xs text-slate-400">Format rapi untuk WhatsApp & Telegram VIP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Preview Area */}
        <div className="mt-4">
          <textarea
            readOnly
            value={formattedText}
            rows={9}
            className="w-full bg-[#060914] border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 font-mono focus:outline-none resize-none leading-relaxed select-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          <button
            onClick={handleCopy}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Salin Teks Sinyal</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleWhatsApp}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kirim WhatsApp</span>
            </button>

            <button
              onClick={handleTelegram}
              className="py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-sky-600/20"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Telegram</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
