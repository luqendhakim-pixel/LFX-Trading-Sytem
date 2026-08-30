export type Timeframe = "M1" | "M5" | "M15" | "H1" | "H4" | "D1";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Tick {
  price: number;
  bid: number;
  ask: number;
  spread: number;
  time: number;
  volume: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
}

export interface TradeJournalData {
  notes?: string;
  entryReason?: string;
  emotionalState?: "DISCIPLINED" | "CONFIDENT" | "FOMO" | "REVENGE" | "ANXIOUS" | "PATIENT";
  executionRating?: number; // 1 to 5
  lessonsLearned?: string;
  tags?: string[];
  updatedAt?: string;
}

export interface Position {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  currentPrice: number;
  lotSize: number;
  stopLoss: number;
  takeProfit: number;
  takeProfit2?: number;
  takeProfit3?: number;
  pnlUsd: number;
  pnlPips: number;
  openTime: string;
  openedTimestamp?: number;
  status: "OPEN" | "CLOSED";
  closePrice?: number;
  closeTime?: string;
  closedTimestamp?: number;
  closeReason?: "TP" | "TP2" | "TP3" | "SL" | "MANUAL" | "TRAILING_SL" | "AI_EXIT";
  strategy: string;
  reason: string;
  isAutoExecuted?: boolean;
  movedToBreakeven?: boolean;
  journal?: TradeJournalData;
}

export interface SMCAnalysis {
  orderBlockZone: string;
  liquidityTarget: string;
  bosStatus: string;
  marketStructure: string;
}

export interface RiskAssessment {
  recommendedLotSize: number;
  maxLossUsd: number;
  riskPercentage: number;
  estimatedProfitTp1?: number;
  estimatedProfitTp2?: number;
  estimatedProfitTp3?: number;
  estimatedProfitTp4?: number;
  warningNote?: string;
}

export interface MobilePushAlert {
  headline: string;
  actionAdvice: string;
  urgency: string;
}

export interface ConfluenceCheckItem {
  id: string;
  name: string;
  category: "TREND" | "STRUCTURE" | "MOMENTUM" | "SMC" | "VOLATILITY";
  passed: boolean;
  score: number; // 0 to 20
  detail: string;
}

export type SignalEngineMode = "TSS_SCRIPT" | "AI_CONFLUENCE" | "HYBRID_DUAL";

export interface TSSAnalysisSummary {
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  filterPrice: number;
  upperBand: number;
  lowerBand: number;
  adaptiveRange: number;
  trendStateInt: number; // 1, -1, 0
  isStepFlippedNow: boolean;
  bullSignal: boolean;
  bearSignal: boolean;
  sourceType: string;
  sensitivityLength: number;
  rangeMultiplier: number;
  almaOffset: number;
  almaSigma: number;
  durationBars: number;
}

export interface AISignal {
  id: string;
  timestamp: string;
  formattedTimeWib?: string;
  session?: string;
  symbol?: string; // e.g. "XAUUSD"
  timeframe: Timeframe;
  trendDirection: "BULLISH" | "BEARISH" | "NEUTRAL";
  strength: number;
  signalType: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  takeProfit4?: number;
  pipsSl?: number; // default 50
  pipsTp1?: number; // default +50
  pipsTp2?: number; // default +100
  pipsTp3?: number; // default +150
  pipsTp4?: number; // default +200
  entryZoneLow?: number;
  entryZoneHigh?: number;
  riskRewardRatio: string;
  confidenceScore: number;
  primaryReason: string;
  technicalFactors: string[];
  smcAnalysis?: SMCAnalysis;
  riskAssessment?: RiskAssessment;
  mobilePushAlert?: MobilePushAlert;
  executionPlan?: string;
  status?: "ACTIVE" | "TRIGGERED" | "EXPIRED" | "COMPLETED";
  signalStatus?: "ACTIVE" | "BE SET (+30p)" | "TP1 HIT" | "TP2 HIT" | "TP3 HIT" | "TP4 HIT" | "SL HIT" | "BREAK EVEN" | "CLOSED";
  isBreakevenSet?: boolean;
  effectiveStopLoss?: number;
  beTriggeredPrice?: number;
  realizedPips?: number;
  closeResult?: "WIN" | "LOSS" | "BE";
  source?: string;
  engineMode?: SignalEngineMode;
  confluences?: ConfluenceCheckItem[];
  marketRegime?: "STRONG_TREND" | "HEALTHY_TREND" | "CONSOLIDATION_CHOP" | "LIQUIDITY_HUNT";
  tssData?: TSSAnalysisSummary;
}

export interface ExnessAccountConfig {
  loginId: string;
  server: string;
  password?: string;
  isConnected: boolean;
  leverage?: number | string;
  pingMs?: number;
  accountType?: string;
  currency?: string;
  syncEnabled?: boolean;
  accountName?: string;
  balance?: number;
  equity?: number;
  floatingPnL?: number;
  lastSyncTime?: string;
}

export interface RiskSettings {
  startingBalance?: number;
  balance: number;
  equity: number;
  marginUsed: number;
  freeMargin: number;
  marginLevelPercent: number;
  riskPerTradePercent: number;
  maxDailyLossPercent: number;
  maxOpenTrades: number;
  autoBreakevenAtTp1: boolean;
  trailingStopPips: number;
  enforceMaxSpread: number;
  dailyDrawdownReached: boolean;
  autoExecuteAI: boolean;
  soundAlerts: boolean;
  mobileNotifications: boolean;
  selectedStrategy: "Scalping Gold M5" | "Intraday Trend Rider M15/H1" | "SMC & Liquidity Sweep H1" | "AI Adaptive Multi-Confluence";
  signalEngineMode?: SignalEngineMode; // "TSS_SCRIPT" | "AI_CONFLUENCE" | "HYBRID_DUAL"
  minSignalConfidence?: number; // Minimum confidence to trigger alert/trade (default 80%)
  filterConsolidation?: boolean; // Avoid signals during choppy consolidation
}

export interface MobileNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "SIGNAL" | "TP_HIT" | "SL_HIT" | "ORDER_FILLED" | "RISK_ALERT" | "BREAKEVEN";
  params?: {
    action: "BUY" | "SELL";
    entry: number;
    sl: number;
    tp: number;
    lot: number;
    pnl?: number;
  };
  read?: boolean;
}

export interface VerificationStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfitUsd: number;
  totalLossUsd: number;
  netProfitUsd: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  averageRiskReward: number;
  accuracyScore: number;
}

export type SentimentState = "EXTREME_FEAR" | "FEAR" | "NEUTRAL" | "GREED" | "EXTREME_GREED";

export interface FearAndGreedData {
  score: number;
  rating: SentimentState;
  ratingLabel: string;
  previousClose: number;
  oneWeekAgo: number;
  oneMonthAgo: number;
  goldBias: "STRONGLY_BULLISH" | "BULLISH" | "NEUTRAL" | "BEARISH" | "STRONGLY_BEARISH";
  goldBiasLabel: string;
  dxyIndex: number;
  us10yYield: number;
  vixIndex: number;
  goldEtfFlows: string;
  summary: string;
  lastUpdated: string;
}

export interface MarketHeadline {
  id: string;
  category: "FED & RATES" | "GEOPOLITICS" | "CENTRAL BANKS" | "INFLATION" | "SMC FLOW" | "DXY & FX";
  title: string;
  summary: string;
  impact: "HIGH IMPACT" | "MEDIUM IMPACT" | "BULLISH GOLD" | "BEARISH GOLD" | "NEUTRAL";
  source: string;
  timeAgo: string;
  timestamp: number;
  url?: string;
}

export interface MarketSentimentResponse {
  fearAndGreed: FearAndGreedData;
  headlines: MarketHeadline[];
  aiSentimentNote: string;
}

// User Authentication & Subscription Types
export type AuthMethod = "EMAIL" | "WHATSAPP";
export type UserRole = "ADMIN" | "MEMBER";
export type SubscriptionStatus = "TRIAL_ACTIVE" | "TRIAL_EXPIRED" | "SUBSCRIBED" | "EXPIRED" | "ADMIN";

export interface UserProfile {
  id: string;
  name: string;
  identifier: string; // Email or WhatsApp number
  authMethod: AuthMethod;
  role: UserRole;
  registeredAt: number; // Timestamp ms
  trialEndsAt: number; // Timestamp ms (registeredAt + 7 days)
  subscriptionEndsAt: number | null; // Timestamp ms
  isSubscriptionActive: boolean; // Computed active state
  daysRemaining: number;
  status: SubscriptionStatus;
  notes?: string;
}

export interface OTPRequestPayload {
  identifier: string;
  authMethod: AuthMethod;
  name?: string;
}

export interface OTPVerifyPayload {
  identifier: string;
  otpCode: string;
  authMethod: AuthMethod;
}

export interface ActivationCodePayload {
  identifier: string;
  code: string;
}

export interface LicenseActivationCode {
  code: string;
  createdAt: number;
  durationDays: number; // e.g. 30 days
  priceIdr: number; // 150000
  isUsed: boolean;
  usedBy?: string;
  usedAt?: number;
  createdBy: string;
}
