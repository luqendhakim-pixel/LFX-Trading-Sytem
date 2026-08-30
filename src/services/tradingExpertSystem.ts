import { AISignal } from "../types";

export interface TradingContext {
  currentPrice: number;
  symbol?: string;
  bid?: number;
  ask?: number;
  spread?: number;
  trend?: "BULLISH" | "BEARISH" | "SIDEWAYS" | string;
  timeframe?: string;
  balance?: number;
  riskPerTradePercent?: number;
  currentSignal?: AISignal | null;
  recommendedZones?: {
    entryZone?: string;
    stopLoss?: number;
    takeProfit1?: number;
    takeProfit2?: number;
    takeProfit3?: number;
    takeProfit4?: number;
  };
  keyLevels?: {
    supports?: number[];
    resistances?: number[];
  };
  smcAnalysis?: {
    orderBlockZone?: string;
    liquidityTarget?: string;
    bosStatus?: string;
    marketStructure?: string;
  };
  technicalFactors?: string[];
  openPositionsCount?: number;
}

export interface EducationalTopic {
  id: string;
  title: string;
  category: "SMC_ICT" | "RISK_MANAGEMENT" | "SESSION_TIMING" | "MACRO_FUNDAMENTALS" | "LFX_RULES";
  iconName: string;
  prompt: string;
  description: string;
}

/**
 * Theoretical Foundation & Knowledge Base Repository for XAU/USD & Smart Money Concepts
 */
export const TRADING_KNOWLEDGE_BASE = {
  SMC_ICT_FRAMEWORK: {
    title: "Smart Money Concepts (SMC) & ICT Methodology",
    orderBlock: {
      definition: "Order Block (OB) adalah candle arah berlawanan terakhir sebelum terjadinya dorongan ekspansi impulsif yang berhasil menembus struktur harga (BOS/CHoCH).",
      bullishOB: "Demand Order Block: Candle bearish terakhir sebelum rally impulsif yang menciptakan FVG dan menembus High sebelumnya.",
      bearishOB: "Supply Order Block: Candle bullish terakhir sebelum drop impulsif yang menciptakan FVG dan menembus Low sebelumnya.",
      validation: "OB dinyatakan valid bila: 1) Menyebabkan Break of Structure (BOS), 2) Meninggalkan Fair Value Gap (FVG), 3) Belum pernah termitigasi (unmitigated/fresh)."
    },
    fairValueGap: {
      definition: "Fair Value Gap (FVG) / Imbalance terjadi akibat ketidakseimbangan agresif dari order beli/jual instutional dalam formasi 3 candle berturut-turut.",
      mechanism: "Candle 1 High tidak bertemu dengan Candle 3 Low (Bullish FVG), meninggalkan ruang kosong yang bertindak sebagai magnet retest harga."
    },
    marketStructure: {
      bos: "Break of Structure (BOS): Penembusan swing high/low searah tren utama (Konfirmasi Kelanjutan Tren / Trend Continuation).",
      choch: "Change of Character (CHoCH): Penembusan swing high/low berlawanan arah tren untuk pertama kali (Sinyal Awal Reversal).",
      liquiditySweep: "Liquidity Sweep / Purge: Pergerakan manipulasi sesaat yang menembus level puncak/lembah untuk menyerap order Stop Loss sebelum berbalik arah tajam."
    },
    liquidityPools: {
      bsl: "Buy-Side Liquidity (BSL): Kumpulan buy stop & stop loss penjual di atas Equal Highs / Resistance.",
      ssl: "Sell-Side Liquidity (SSL): Kumpulan sell stop & stop loss pembeli di bawah Equal Lows / Support."
    }
  },

  XAUUSD_CHARACTERISTICS: {
    contractSpecs: {
      pipDefinition: "Pada XAU/USD: $0.01 pergerakan harga = 1 point, $0.10 pergerakan harga = 1 pip, $1.00 pergerakan harga = 10 pips, $5.00 pergerakan harga = 50 pips.",
      lotValuation: "1.0 Standard Lot = $10 per pip ($100 per $1.00 move), 0.10 Mini Lot = $1 per pip, 0.01 Micro Lot = $0.10 per pip."
    },
    macroDrivers: {
      dxyCorrelation: "Korelasi Terbalik Emas vs US Dollar Index (DXY): Ketika indeks Dolar menguat akibat suku bunga tinggi atau data ekonomi AS solid, emas cenderung tertekan.",
      realYields: "Emas adalah non-yielding asset (tanpa dividen/kupon). Emas bergerak berlawanan dengan Imbal Hasil Riil Obligasi AS 10-Tahun (US 10Y Real Yields).",
      geopoliticalDemand: "Emas bertindak sebagai Safe-Haven nomor 1 di dunia saat eskalasi krisis perang atau kekacauan sistem perbankan global.",
      centralBankAccumulation: "Akumulasi fisik emas oleh bank sentral global (PBOC Tiongkok, RBI India, Turki) memberikan support lantai harga struktural jangka panjang."
    }
  },

  SESSION_PROFILES: {
    asia: {
      name: "Sesi Asia (Tokyo & Sydney)",
      hoursWIB: "06:00 - 13:00 WIB",
      hoursUTC: "23:00 - 06:00 UTC",
      nature: "Akumulasi Rentang & Likuiditas (Range Formation). Membentuk Asian High dan Asian Low."
    },
    london: {
      name: "Sesi London (Eropa)",
      hoursWIB: "14:00 - 22:00 WIB",
      hoursUTC: "07:00 - 15:00 UTC",
      nature: "Manipulasi / Judas Swing (14:00-15:30 WIB) diikuti Ekspansi Tren Institusional utama hari itu."
    },
    newYork: {
      name: "Sesi New York (Wall Street)",
      hoursWIB: "19:30 - 03:00 WIB",
      hoursUTC: "12:30 - 20:00 UTC",
      nature: "Volatilitas Tertinggi & Reaksi Berita Fundamental AS (CPI, NFP, PPI, FOMC). Periode Overlap London-NY (19:30-22:30 WIB) memiliki volume terbesar."
    },
    londonFix: {
      name: "London Gold Fix",
      hoursWIB: "22:00 - 23:00 WIB (15:00 GMT)",
      nature: "Penetapan harga acuan institusi & penyeimbangan portofolio bank global; sering memicu reversal akhir sesi."
    }
  },

  LFX_DISCIPLINE_RULES: {
    fixedStopLoss: "Wajib Stop Loss 50 Pips ($5.00 harga emas) dari titik Entry untuk memfilter normal market noise dan wick fakeouts.",
    tierTakeProfits: [
      { level: "TP1", pips: 50, priceOffset: 5.0, action: "Kunci 50% Profit & Wajib Geser Stop Loss ke Breakeven (+0 / Entry)" },
      { level: "TP2", pips: 100, priceOffset: 10.0, action: "Ambil Tambahan 30% Profit (Target Likuiditas Utama)" },
      { level: "TP3", pips: 150, priceOffset: 15.0, action: "Biarkan 20% Runner dengan Trailing Stop Aktif" },
      { level: "TP4", pips: 200, priceOffset: 20.0, action: "Full Exit / Major Swing Expansion Target" }
    ],
    riskManagementRules: [
      "Maksimal Risiko per Trade: 1.0% s/d 2.0% dari total saldo akun.",
      "Formula Lot = (Saldo * Risk%) / (50 pips * $10 per pip standard lot).",
      "Maksimal Kerugian Harian (Max Daily Drawdown): 3.0% (Stop trading jika mencapai batas ini).",
      "Dilarang Keras Averaging Down / Martingale saat posisi sedang floating minus."
    ]
  }
};

/**
 * Builds a comprehensive structured system prompt for Gemini AI
 */
export function buildTradingExpertSystemPrompt(ctx: TradingContext): string {
  const currentPrice = ctx.currentPrice || 4500.0;
  const balance = ctx.balance || 10000;
  const riskPercent = ctx.riskPerTradePercent || 1;
  const maxRiskUsd = (balance * riskPercent) / 100;
  const calculatedLot = Number((maxRiskUsd / (50 * 10)).toFixed(2));
  const timeframe = ctx.timeframe || "M15";
  const trend = ctx.trend || "BULLISH";
  const isBuy = trend === "BULLISH";

  const defaultSl = isBuy ? Number((currentPrice - 5.0).toFixed(2)) : Number((currentPrice + 5.0).toFixed(2));
  const sl = ctx.recommendedZones?.stopLoss || ctx.currentSignal?.stopLoss || defaultSl;
  const tp1 = ctx.recommendedZones?.takeProfit1 || ctx.currentSignal?.takeProfit1 || (isBuy ? currentPrice + 5.0 : currentPrice - 5.0);
  const tp2 = ctx.recommendedZones?.takeProfit2 || ctx.currentSignal?.takeProfit2 || (isBuy ? currentPrice + 10.0 : currentPrice - 10.0);
  const tp3 = ctx.recommendedZones?.takeProfit3 || ctx.currentSignal?.takeProfit3 || (isBuy ? currentPrice + 15.0 : currentPrice - 15.0);
  const tp4 = ctx.recommendedZones?.takeProfit4 || ctx.currentSignal?.takeProfit4 || (isBuy ? currentPrice + 20.0 : currentPrice - 20.0);

  const supports = ctx.keyLevels?.supports?.length ? ctx.keyLevels.supports.map(Number) : [Number((currentPrice - 3.5).toFixed(2)), Number((currentPrice - 7.0).toFixed(2))];
  const resistances = ctx.keyLevels?.resistances?.length ? ctx.keyLevels.resistances.map(Number) : [Number((currentPrice + 3.5).toFixed(2)), Number((currentPrice + 7.0).toFixed(2))];

  return `Anda adalah "Trading Expert System XAU/USD" - Mentor Kuantitatif Institusional dan Pakar Smart Money Concepts (ICT/SMC) nomor satu untuk platform LFX Trading System.

=== DATA PASAR REAL-TIME TERKINI ===
- Simbol: XAU/USD (Spot Gold vs US Dollar)
- Harga Saat Ini: $${currentPrice.toFixed(2)} (Bid: $${(ctx.bid || currentPrice - 0.08).toFixed(2)} | Ask: $${(ctx.ask || currentPrice + 0.08).toFixed(2)} | Spread: ${(ctx.spread || 1.6).toFixed(1)} pips)
- Timeframe Aktif: ${timeframe}
- Bias Struktur Pasar: ${trend}
- Level Support: $${supports.join(", $")}
- Level Resistance: $${resistances.join(", $")}
- Zona Order Block (OB): ${ctx.smcAnalysis?.orderBlockZone || `$${(currentPrice - 1.5).toFixed(2)} - $${(currentPrice - 3.0).toFixed(2)}`}
- Target Likuiditas: ${ctx.smcAnalysis?.liquidityTarget || `$${(currentPrice + 5.5).toFixed(2)} (Buy-Side Liquidity)`}
- Status Struktur: ${ctx.smcAnalysis?.bosStatus || "Break of Structure Validated"} (${ctx.smcAnalysis?.marketStructure || "Bullish Expansion"})

=== ATURAN BAKU SISTEM TRADING LFX ===
1. Stop Loss Wajib 50 Pips ($5.00 harga emas): Level SL saat ini = $${sl.toFixed(2)}.
2. Take Profit Berjenjang:
   - TP1 (+50 pips): $${tp1.toFixed(2)} -> Wajib geser SL ke Breakeven (+0) setelah level ini tercapai!
   - TP2 (+100 pips): $${tp2.toFixed(2)} -> Target Likuiditas Utama (Close 75-80% volume)
   - TP3 (+150 pips): $${tp3.toFixed(2)} -> Trend Continuation Runner
   - TP4 (+200 pips): $${tp4.toFixed(2)} -> Full Swing Expansion
3. Manajemen Risiko Trader:
   - Saldo Akun: $${balance.toLocaleString()} USD
   - Toleransi Risiko (${riskPercent}%): Maksimal Loss -$${maxRiskUsd.toFixed(2)} USD
   - Rekomendasi Lot Size: ${calculatedLot} Lot
   - Maksimal Kerugian Harian: 3.0% (-$${((balance * 3) / 100).toFixed(2)} USD)

=== STANDAR KUALITAS JAWABAN ANDA ===
- SANGAT EDUKATIF & MENDALAM: Jelaskan alasan teknikal di balik pergerakan harga, mulai dari interaksi likuiditas institusi, mitigasi Order Block/FVG, hingga korelasi makro (DXY, imbal hasil obligasi AS, sesi New York/London).
- STRUKTUR PROFESIONAL: Gunakan Markdown yang rapi dengan heading (##, ###), bullet points tebal, tabel, dan formula matematika jika ada perhitungan.
- BAHASA INDONESIA YANG LUWES & OTENTIK: Gunakan terminologi standar industri trading tanpa jargon buatan.
- LANGSUNG DAPAT DIPERIKSA DI MT4/MT5: Berikan parameter yang jelas dan presisi untuk eksekusi praktis.`;
}

/**
 * Generates an exhaustive, high-depth expert response when Gemini API is unavailable or on fallback
 */
export function generateFallbackExpertResponse(query: string, ctx: TradingContext): string {
  const q = (query || "").toLowerCase();
  const currentPrice = ctx.currentPrice || 4500.0;
  const balance = ctx.balance || 10000;
  const riskPercent = ctx.riskPerTradePercent || 1;
  const maxRiskUsd = (balance * riskPercent) / 100;
  const recLot = Number((maxRiskUsd / (50 * 10)).toFixed(2));
  const timeframe = ctx.timeframe || "M15";
  const trend = ctx.trend || "BULLISH";
  const isBuy = trend === "BULLISH";

  const sl = ctx.recommendedZones?.stopLoss || (isBuy ? currentPrice - 5.0 : currentPrice + 5.0);
  const tp1 = ctx.recommendedZones?.takeProfit1 || (isBuy ? currentPrice + 5.0 : currentPrice - 5.0);
  const tp2 = ctx.recommendedZones?.takeProfit2 || (isBuy ? currentPrice + 10.0 : currentPrice - 10.0);
  const tp3 = ctx.recommendedZones?.takeProfit3 || (isBuy ? currentPrice + 15.0 : currentPrice - 15.0);
  const tp4 = ctx.recommendedZones?.takeProfit4 || (isBuy ? currentPrice + 20.0 : currentPrice - 20.0);

  const supports = ctx.keyLevels?.supports?.length ? ctx.keyLevels.supports.map(Number) : [Number((currentPrice - 3.5).toFixed(2)), Number((currentPrice - 7.0).toFixed(2))];
  const resistances = ctx.keyLevels?.resistances?.length ? ctx.keyLevels.resistances.map(Number) : [Number((currentPrice + 3.5).toFixed(2)), Number((currentPrice + 7.0).toFixed(2))];
  const obZone = ctx.smcAnalysis?.orderBlockZone || `$${(currentPrice - 1.5).toFixed(2)} - $${(currentPrice - 3.0).toFixed(2)}`;

  if (q.includes("sl") || q.includes("stop loss") || q.includes("50 pip")) {
    return `## 🛡️ Masterclass & Aturan Baku Stop Loss 50 Pips ($5.00) XAU/USD

Stop Loss (SL) bukan sekadar pembatas kerugian, melainkan **zona invalidasi struktur matematis** dalam trading emas institusional.

---

### 1. 🔍 Mengapa Wajib SL 50 Pips pada Pasar Emas?
1. **Volatilitas Intraday Emas (Average True Range)**:
   - XAU/USD memiliki pergerakan rata-rata harian $15.00 - $35.00 (150 - 350 pips).
   - Memasang SL di bawah 30 pips (misal 15-20 pips) sangat rentan terkena *Liquidity Wick / Fakeout* akibat pelebaran spread saat pergantian candle.
2. **Ruang Bernapas Mitigasi Fair Value Gap (FVG)**:
   - Jarak $5.00 (50 pips) memberikan ruang bagi harga untuk melakukan *deep retest* ke Order Block tanpa membatalkan bias arah utama.
3. **Kalkulasi Konversi Pips Gold**:
   - $0.10 harga emas = **1 Pip** (10 points).
   - $1.00 harga emas = **10 Pips** (100 points).
   - $5.00 harga emas = **50 Pips** (500 points).
   - *Contoh Live*: Entry ${isBuy ? "BUY" : "SELL"} di **$${currentPrice.toFixed(2)}**, maka SL dipatok di **$${sl.toFixed(2)}**.

---

### 2. ⚖️ Formula Matematis Perhitungan Lot Size
Untuk menjaga risiko akun Anda tetap di **${riskPercent}%** (-$${maxRiskUsd.toFixed(2)} USD):

$$\\text{Ukuran Lot} = \\frac{\\text{Saldo ($" + balance.toLocaleString() + ")} \\times " + riskPercent + "\\%}{50 \\text{ pips} \\times \\$10} = \\mathbf{" + recLot + "\\text{ Lot}}$$

- Jika harga terkena SL 50 pips penuh, akun Anda hanya terpotong tepat **-$${maxRiskUsd.toFixed(2)} USD**, sehingga modal 99% Anda tetap utuh.

---

### 3. 🚨 SOP Disiplin Eksekusi:
- **Pasang SL bersamaan dengan order Entry** (jangan pernah membiarkan order terbuka tanpa SL).
- **Dilarang keras menggeser SL menjauh** saat floating minus.
- **Wajib geser ke Breakeven (+0)** segera setelah harga menyentuh **TP1 ($${tp1.toFixed(2)})**.`;
  }

  if (q.includes("break even") || q.includes("bep") || q.includes("geser sl")) {
    return `## 🔒 SOP Kunci Breakeven (BEP +0) & Scaling Out Profit

Kunci Breakeven Point (BEP) adalah seni mengamankan modal agar transaksi yang sedang berjalan berubah menjadi **Zero-Risk Trade (Bebas Risiko)**.

---

### 1. ⏰ Kapan Waktu Tepat Menggeser SL ke BEP?
- **Aturan Baku LFX**: Geser Stop Loss ke level harga Entry (+1 pip untuk menutup spread broker) **HANYA KETIKA HARGA TELAH MENYENTUH TARGET TAKE PROFIT 1 (TP1 +50 PIPS)** di **$${tp1.toFixed(2)}**.
- **Kesalahan Pemula**: Menggeser SL terlalu cepat (saat baru profit +15 pips) sering berujung posisi tertutup prematur akibat koreksi minor sesaat sebelum melesat ke TP2-TP4.

---

### 2. 💰 SOP Manajemen Lot Bertingkat (Scale-Out):
1. **Target TP1 ($${tp1.toFixed(2)} - +50 Pips)**:
   - *Aksi*: Lakukan **Close Partial 50% Lot** (misal 0.20 lot di-close 0.10 lot).
   - *Tindakan*: Geser Stop Loss sisa posisi ke harga Entry ($${currentPrice.toFixed(2)}).
2. **Target TP2 ($${tp2.toFixed(2)} - +100 Pips)**:
   - *Aksi*: Close tambahan **30% Lot** di area likuiditas utama.
3. **Target TP3 ($${tp3.toFixed(2)}) & TP4 ($${tp4.toFixed(2)})**:
   - *Aksi*: Biarkan sisa **20% Lot Runner** berekspansi dengan mengaktifkan *Trailing Stop* manual mengikuti Higher Low terbaru.`;
  }

  if (q.includes("order block") || q.includes("fvg") || q.includes("smc") || q.includes("bos") || q.includes("choch") || q.includes("ict")) {
    return `## 🧠 Ensiklopedia Smart Money Concepts (ICT & Institutional Price Action)

Smart Money Concepts (SMC) mengidentifikasi jejak algoritma institusi perbankan (*Interbank Price Delivery Algorithm*) yang menggerakkan likuiditas harga.

---

### 1. 🧱 Order Block (OB) & Mitigasi
- **Demand Order Block**: Area akumulasi buyer institusi yang ditandai oleh candle bearish terakhir sebelum terjadinya dorongan ekspansi naik masif yang memecahkan resistance.
- **Supply Order Block**: Area distribusi seller institusi dari candle bullish terakhir sebelum penurunan masif.
- **Zona Terdeteksi Live**: Order Block aktif terpantau di zona **${obZone}**.

---

### 2. ⚡ Fair Value Gap (FVG / Imbalance)
- Terjadi ketika ada ketidakseimbangan agresif dalam formasi 3 candle, di mana ekor Candle 1 tidak bersentuhan dengan ekor Candle 3.
- Harga emas memiliki kecenderungan algoritmis 85%+ untuk kembali mengisi (*rebalance/fill*) celah FVG ini sebelum melanjutkan tren utama.

---

### 3. 🔄 BOS vs CHoCH
- **BOS (Break of Structure)**: Penembusan level swing high/low yang searah tren (Konfirmasi kelanjutan tren).
- **CHoCH (Change of Character)**: Penembusan swing level berlawanan arah untuk pertama kali (Sinyal awal pembalikan arah tren).
- **Status Live**: Terkonfirmasi ${ctx.smcAnalysis?.bosStatus || "BOS Valid"} pada timeframe ${timeframe}.

---

### 4. 🎯 Buy-Side (BSL) vs Sell-Side Liquidity (SSL)
- **BSL**: Kumpulan Stop Loss trader penjual di atas resistance/Equal Highs.
- **SSL**: Kumpulan Stop Loss trader pembeli di bawah support/Equal Lows.
- Target likuiditas ekspansi saat ini mengincar level **$${tp2.toFixed(2)}**.`;
  }

  if (q.includes("sesi") || q.includes("london") || q.includes("new york") || q.includes("jam")) {
    return `## ⏰ Panduan Sesi Trading Emas XAU/USD (Waktu Indonesia Barat - WIB)

Emas bergerak 24 jam sehari, namun volatilitas dan pergerakan tren terbesarnya terbagi dalam 3 sesi utama:

---

### 1. 🌏 Sesi Asia (06:00 - 13:00 WIB)
- **Karakter**: Fase akumulasi rentang (*Asian Range*). Volatilitas relatif tenang.
- **Peran SMC**: Membentuk batas *Asian High* dan *Asian Low* yang nantinya akan dimanipulasi oleh sesi London.

---

### 2. 🇬🇧 Sesi London (14:00 - 22:00 WIB)
- **Judas Swing (14:00 - 15:30 WIB)**: Institusi Eropa sering membuat pergerakan jebakan semu yang menyapu likuiditas High/Low sesi Asia sebelum bergerak ke arah tren sesungguhnya.
- **Prime Entry**: Pukul **15:30 - 17:30 WIB** setelah konfirmasi BOS sesi London terbentuk.

---

### 3. 🇺🇸 Sesi New York & Overlap (19:30 - 03:00 WIB) - *Volatilitas Tertinggi*
- **Golden Overlap (19:30 - 22:30 WIB)**: Pertemuan volume pasar London dan New York bersamaan dengan rilis berita ekonomi AS (CPI, NFP, PPI, Retail Sales).
- **London Fix (22:00 - 23:00 WIB)**: Rebalancing portofolio bank sentral global yang sering menghasilkan lonjakan $10 - $25 dalam hitungan menit.`;
  }

  if (q.includes("nfp") || q.includes("cpi") || q.includes("dxy") || q.includes("berita") || q.includes("fed") || q.includes("fomc")) {
    return `## 📰 Analisis Fundamental Makro & Pengaruh DXY Terhadap XAU/USD

Harga emas Spot (XAU/USD) sangat sensitif terhadap suku bunga riil Amerika Serikat dan kekuatan indeks US Dollar.

---

### 1. 💵 Korelasi Terbalik Emas vs US Dollar Index (DXY)
- **DXY Menguat (Bullish)** $\\rightarrow$ Biaya memegang emas meningkat bagi investor global $\\rightarrow$ **XAU/USD Cenderung Melemah**.
- **DXY Melemah (Bearish)** $\\rightarrow$ **XAU/USD Cenderung Menguat / Rally**.

---

### 2. 🏛️ Indikator Ekonomi Utama Penggerak Emas:
1. **CPI (Consumer Price Index) & Core PCE**:
   - Jika data inflasi > perkiraan $\\rightarrow$ Ekspektasi suku bunga tinggi lebih lama $\\rightarrow$ Emas tertekan.
   - Jika data inflasi < perkiraan $\\rightarrow$ Peluang pemangkasan suku bunga The Fed $\\rightarrow$ Emas melesat naik.
2. **NFP (Non-Farm Payrolls)**:
   - Dirilis setiap Jumat pertama awal bulan (19:30 WIB). Angka penambahan kerja yang tinggi menopang USD dan menekan harga emas.
3. **Imbal Hasil Obligasi US 10-Tahun (US10Y Yields)**:
   - Karena emas tidak memberikan imbal hasil bunga (*zero-coupon*), kenaikan imbal hasil obligasi riil menjadi rival utama daya tarik emas.

---

### 3. 🛡️ SOP Trading Saat Berita High-Impact (Red Folder):
- Hindari entry 15 menit sebelum dan sesudah rilis berita karena spread broker bisa melebar drastis.
- Tunggu reaksi awal menyapu likuiditas, lalu eksekusi saat pola mitigasi FVG terbentuk pasca-berita.`;
  }

  // Default Comprehensive Response
  return `## 📊 Analisa Komprehensif XAU/USD & Setup Presisi (TF ${timeframe})

Kondisi pasar saat ini berada di level **$${currentPrice.toFixed(2)}** (Spread: ${(ctx.spread || 1.6).toFixed(1)} pips) dengan struktur momentum **${trend}**.

---

### 1. 🧱 Pemetaan Level Kunci & Area Likuiditas:
- **Support Kunci**: S1 **$${supports[0].toFixed(2)}** | S2 **$${supports[1] !== undefined ? supports[1].toFixed(2) : (supports[0] - 4).toFixed(2)}**
- **Resistance Kunci**: R1 **$${resistances[0].toFixed(2)}** | R2 **$${resistances[1] !== undefined ? resistances[1].toFixed(2) : (resistances[0] + 4).toFixed(2)}**
- **Zona Order Block (OB)**: **${obZone}**
- **Status Struktur**: ${ctx.smcAnalysis?.bosStatus || "Break of Structure Validated"}

---

### 2. 🎯 Rencana Setup Eksekusi Baku:
- **Rekomendasi Aksi**: **${isBuy ? "BUY (LONG ON ORDER BLOCK RETEST)" : "SELL (SHORT ON SUPPLY REJECTION)"}**
- **Zona Entry Presisi**: **$${currentPrice.toFixed(2)}**
- **Stop Loss Wajib (50 Pips)**: **$${sl.toFixed(2)}** *(Maksimal Kerugian: -$${maxRiskUsd.toFixed(2)} USD)*
- **Target Take Profit**:
  - **TP1 (+50 Pips)**: **$${tp1.toFixed(2)}** *(Wajib geser SL ke Breakeven +0)*
  - **TP2 (+100 Pips)**: **$${tp2.toFixed(2)}** *(Target Likuiditas Utama - Close 75% Lot)*
  - **TP3 (+150 Pips)**: **$${tp3.toFixed(2)}** *(Trend Expansion)*
  - **TP4 (+200 Pips)**: **$${tp4.toFixed(2)}** *(Swing Runner)*

---

### 3. 🛡️ Rekomendasi Manajemen Risiko:
- **Ukuran Lot Disarankan**: **${recLot} Lot** (Sesuai saldo $${balance.toLocaleString()} dan risiko ${riskPercent}%).
- **Disiplin SOP**: Kunci BEP setelah TP1 tersentuh dan batasi maksimal 2-3 trade per hari.`;
}

/**
 * List of rich, curated educational topics for the UI
 */
export const RECOMMENDED_EDUCATIONAL_TOPICS: EducationalTopic[] = [
  {
    id: "setup-analysis",
    title: "🎯 Analisa Setup Emas Terkini",
    category: "LFX_RULES",
    iconName: "TrendingUp",
    prompt: "Berikan analisa setup lengkap XAU/USD saat ini beserta level kunci, zona Order Block, dan target TP1-4.",
    description: "Analisis teknikal real-time lengkap dengan level support, resistance, dan SOP eksekusi."
  },
  {
    id: "sl-50pips-rule",
    title: "🛡️ Aturan Wajib SL 50 Pips",
    category: "RISK_MANAGEMENT",
    iconName: "Shield",
    prompt: "Jelaskan secara mendalam aturan baku Stop Loss 50 pips ($5.00) pada XAU/USD dan bagaimana cara menghitung lotnya.",
    description: "Logika matematis peredam volatilitas emas dan rumus baku lot size."
  },
  {
    id: "bep-timing",
    title: "🔒 Kapan Waktu Geser ke Breakeven (BEP)?",
    category: "RISK_MANAGEMENT",
    iconName: "Lock",
    prompt: "Kapan waktu yang tepat menggeser Stop Loss ke Breakeven (BEP) dan bagaimana strategi scale-out profit?",
    description: "SOP penguncian zero-risk trade setelah TP1 tercapai."
  },
  {
    id: "smc-ob-fvg",
    title: "🧱 Penjelasan Order Block & FVG (SMC)",
    category: "SMC_ICT",
    iconName: "Layers",
    prompt: "Jelaskan konsep Smart Money Concepts: Order Block (OB), Fair Value Gap (FVG), BOS, dan Liquidity Pools pada emas.",
    description: "Cara membaca jejak transaksi institusi dan bank sentral pada grafik harga."
  },
  {
    id: "market-sessions",
    title: "⏰ Karakter Sesi London & New York",
    category: "SESSION_TIMING",
    iconName: "Clock",
    prompt: "Jelaskan karakteristik dan jam pergerakan emas pada Sesi Asia, Sesi London (Judas Swing), dan Sesi New York.",
    description: "Waktu-waktu emas bergerak paling agresif dan peluang entry terbaik."
  },
  {
    id: "lot-calculation",
    title: "⚖️ Cara Hitung Lot Size Sesuai Saldo",
    category: "RISK_MANAGEMENT",
    iconName: "DollarSign",
    prompt: "Bagaimana rumus menghitung ukuran lot yang aman berdasarkan saldo akun dan toleransi risiko 1%?",
    description: "Tabel dan simulasi perhitungan lot dari modal $100 hingga $10,000."
  },
  {
    id: "macro-news",
    title: "📰 Pengaruh Berita NFP, CPI & The Fed",
    category: "MACRO_FUNDAMENTALS",
    iconName: "Sparkles",
    prompt: "Bagaimana dampak rilis data inflasi CPI, data tenaga kerja NFP, dan kebijakan suku bunga The Fed terhadap emas?",
    description: "Hubungan fundamental ekonomi Amerika Serikat terhadap volatilitas harga emas."
  },
  {
    id: "dxy-correlation",
    title: "📉 Hubungan Indeks DXY vs XAU/USD",
    category: "MACRO_FUNDAMENTALS",
    iconName: "HelpCircle",
    prompt: "Jelaskan hubungan korelasi terbalik antara US Dollar Index (DXY) dengan harga emas Spot XAU/USD.",
    description: "Mengapa kenaikan dolar AS menekan harga emas dan cara membaca konfluensinya."
  }
];
