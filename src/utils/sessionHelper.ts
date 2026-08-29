/**
 * World Trading Session Helper for Gold (XAU/USD) & Forex
 * Accurately tracks global market sessions based on real-time UTC / WIB (UTC+7)
 *
 * Major Global Forex / Gold Market Trading Hours (WIB / UTC+7):
 * - Sydney (Pacific): 04:00 - 13:00 WIB (21:00 - 06:00 UTC)
 * - Tokyo (Asia):     07:00 - 16:00 WIB (00:00 - 09:00 UTC)
 * - London (Europe):   14:00 - 23:00 WIB (07:00 - 16:00 UTC)
 * - New York (USA):   19:00 - 04:00 WIB (12:00 - 21:00 UTC)
 *
 * High-Impact Overlap Windows:
 * - Tokyo / London Overlap: 14:00 - 16:00 WIB (07:00 - 09:00 UTC)
 * - London / New York Overlap (Golden Hours / Peak Volatility): 19:00 - 23:00 WIB (12:00 - 16:00 UTC)
 */

export interface MarketSessionInfo {
  name: string; // Short clean name (e.g. "London / New York", "Tokyo", "London", "New York", "Sydney")
  fullName: string; // Full descriptive name with region
  activeHubs: string[]; // e.g. ["London", "New York"]
  liquidityLevel: "PEAK" | "HIGH" | "MODERATE" | "LOW";
  badgeClass: string;
  dotColor: string;
  description: string;
  wibTime: string;
  utcTime: string;
  isWeekendClosed: boolean;
  currentHourWib: number;
  currentMinuteWib: number;
}

export function parseDateInput(dateInput?: Date | string | number): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;

  if (typeof dateInput === "number") return new Date(dateInput);

  // If string contains format like "2026-08-28 13:45:37 WIB" or ISO
  if (typeof dateInput === "string") {
    // Check if it's formatted WIB string
    if (dateInput.includes("WIB")) {
      const cleanStr = dateInput.replace(" WIB", "").trim().replace(/\./g, ":");
      const d = new Date(cleanStr.replace(" ", "T") + "+07:00");
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) return d;
  }

  return new Date();
}

/**
 * Returns dynamic, accurate World Market Session information for any given timestamp or current live time
 */
export function getTradingSessionInfo(dateInput?: Date | string | number): MarketSessionInfo {
  const date = parseDateInput(dateInput);

  // Get UTC day and hours
  const utcDay = date.getUTCDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
  const utcHour = date.getUTCHours();
  const utcMin = date.getUTCMinutes();

  // Convert to WIB (UTC + 7 hours)
  const wibTotalMinutes = (utcHour * 60 + utcMin + 7 * 60) % (24 * 60);
  const wibHour = Math.floor(wibTotalMinutes / 60);
  const wibMinute = wibTotalMinutes % 60;

  // Weekend Market Close Check:
  // Forex/Gold closes Friday 21:00 UTC (Saturday 04:00 WIB) and reopens Sunday 21:00 UTC (Monday 04:00 WIB)
  let isWeekendClosed = false;
  if (
    (utcDay === 5 && utcHour >= 21) || // Friday after 21:00 UTC
    utcDay === 6 || // All Saturday
    (utcDay === 0 && utcHour < 21) // Sunday before 21:00 UTC
  ) {
    isWeekendClosed = true;
  }

  const wibTimeStr = `${String(wibHour).padStart(2, "0")}:${String(wibMinute).padStart(2, "0")} WIB`;
  const utcTimeStr = `${String(utcHour).padStart(2, "0")}:${String(utcMin).padStart(2, "0")} UTC`;

  // Determine market session by WIB hour & minute
  // 19:00 - 23:00 WIB -> London / New York Overlap (Peak Volatility / Golden Hours)
  if (wibHour >= 19 && wibHour < 23) {
    return {
      name: "London / New York",
      fullName: "London / New York Overlap (Golden Hours)",
      activeHubs: ["London", "New York"],
      liquidityLevel: "PEAK",
      badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/50 font-black",
      dotColor: "bg-amber-400",
      description: "Volatilitas & Likuiditas Tertinggi! Pasar London & New York aktif bersamaan.",
      wibTime: wibTimeStr,
      utcTime: utcTimeStr,
      isWeekendClosed,
      currentHourWib: wibHour,
      currentMinuteWib: wibMinute,
    };
  }

  // 23:00 - 04:00 WIB -> New York (US Session)
  if (wibHour >= 23 || wibHour < 4) {
    return {
      name: "New York",
      fullName: "New York / US Session",
      activeHubs: ["New York"],
      liquidityLevel: "HIGH",
      badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold",
      dotColor: "bg-emerald-400",
      description: "Sesi Amerika aktif. Pergerakan kuat dipicu rilis data ekonomi US & Wall Street.",
      wibTime: wibTimeStr,
      utcTime: utcTimeStr,
      isWeekendClosed,
      currentHourWib: wibHour,
      currentMinuteWib: wibMinute,
    };
  }

  // 04:00 - 07:00 WIB -> Sydney (Pacific Session)
  if (wibHour >= 4 && wibHour < 7) {
    return {
      name: "Sydney",
      fullName: "Sydney / Pacific Session",
      activeHubs: ["Sydney"],
      liquidityLevel: "MODERATE",
      badgeClass: "bg-teal-500/20 text-teal-300 border-teal-500/50 font-bold",
      dotColor: "bg-teal-400",
      description: "Pembukaan pasar harian wilayah Pasifik / Australia.",
      wibTime: wibTimeStr,
      utcTime: utcTimeStr,
      isWeekendClosed,
      currentHourWib: wibHour,
      currentMinuteWib: wibMinute,
    };
  }

  // 07:00 - 13:00 WIB -> Tokyo & Sydney Overlap (Asian Session)
  if (wibHour >= 7 && wibHour < 13) {
    return {
      name: "Tokyo",
      fullName: "Tokyo / Asian Session",
      activeHubs: ["Tokyo", "Sydney"],
      liquidityLevel: "MODERATE",
      badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold",
      dotColor: "bg-purple-400",
      description: "Sesi Asia / Tokyo aktif. Range pembentukan likuiditas Asian High & Low.",
      wibTime: wibTimeStr,
      utcTime: utcTimeStr,
      isWeekendClosed,
      currentHourWib: wibHour,
      currentMinuteWib: wibMinute,
    };
  }

  // 13:00 - 14:00 WIB -> Tokyo Late Asian Session
  if (wibHour >= 13 && wibHour < 14) {
    return {
      name: "Tokyo",
      fullName: "Tokyo / Asian Session (Pre-London)",
      activeHubs: ["Tokyo"],
      liquidityLevel: "MODERATE",
      badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold",
      dotColor: "bg-purple-400",
      description: "Penutupan sesi Asia bersiap menyambut pembukaan sesi Eropa (Pre-London).",
      wibTime: wibTimeStr,
      utcTime: utcTimeStr,
      isWeekendClosed,
      currentHourWib: wibHour,
      currentMinuteWib: wibMinute,
    };
  }

  // 14:00 - 16:00 WIB -> Tokyo / London Overlap
  if (wibHour >= 14 && wibHour < 16) {
    return {
      name: "Tokyo / London",
      fullName: "Tokyo / London Overlap",
      activeHubs: ["Tokyo", "London"],
      liquidityLevel: "HIGH",
      badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold",
      dotColor: "bg-cyan-400",
      description: "Transisi sesi Asia ke Eropa. Lonjakan volume London Open Breakout.",
      wibTime: wibTimeStr,
      utcTime: utcTimeStr,
      isWeekendClosed,
      currentHourWib: wibHour,
      currentMinuteWib: wibMinute,
    };
  }

  // 16:00 - 19:00 WIB -> London (European Session)
  return {
    name: "London",
    fullName: "London / European Session",
    activeHubs: ["London"],
    liquidityLevel: "HIGH",
    badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/50 font-bold",
    dotColor: "bg-blue-400",
    description: "Sesi Eropa / London aktif. Tren pergerakan pasar utama terbentuk.",
    wibTime: wibTimeStr,
    utcTime: utcTimeStr,
    isWeekendClosed,
    currentHourWib: wibHour,
    currentMinuteWib: wibMinute,
  };
}

/**
 * Returns dynamic short session name (e.g., "New York", "London / New York", "London", "Tokyo", "Sydney")
 */
export function getTradingSessionName(dateInput?: Date | string | number): string {
  return getTradingSessionInfo(dateInput).name;
}
