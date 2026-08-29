import React from "react";
import { Home, Sliders, MessageSquare, LineChart, User } from "lucide-react";

export type NavTab = "BERANDA" | "SIGNAL" | "CHAT" | "INDIKATOR" | "AKUN";

interface MobileAppNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeSignalsCount?: number;
  unreadNotifsCount?: number;
}

export const MobileAppNav: React.FC<MobileAppNavProps> = ({
  activeTab,
  onTabChange,
  activeSignalsCount = 0,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number; locked?: boolean }[] = [
    { id: "BERANDA", label: "Beranda", icon: Home },
    { id: "SIGNAL", label: "Signal", icon: Sliders, badge: activeSignalsCount },
    { id: "CHAT", label: "Chat", icon: MessageSquare },
    { id: "INDIKATOR", label: "Indikator", icon: LineChart },
    { id: "AKUN", label: "Akun", icon: User },
  ];

  return (
    <nav
      id="mobile-bottom-navbar"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#070b18]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 sm:py-2 select-none shadow-2xl shadow-black/80"
    >
      <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id.toLowerCase()}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "text-sky-400 font-bold scale-105"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "stroke-[2.5px] text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" : "text-slate-400"
                  }`}
                />
                {/* Badge */}
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-emerald-500 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#070b18]">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isActive ? "text-sky-400 font-semibold" : "text-slate-400"
                }`}
              >
                {tab.label}
              </span>

              {/* Active Indicator Underline */}
              {isActive && (
                <span className="absolute -bottom-1 w-5 h-0.5 bg-sky-400 rounded-full shadow-[0_0_8px_#38bdf8]"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
