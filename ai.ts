/**
 * AI Market Brain - Type Definitions & Schemas
 */

import { FootprintBar, PriceLevel, TradeTick } from './market';

export type TrendDirection = 'BULLISH' | 'BEARISH' | 'RANGE' | 'CONSOLIDATION' | 'NEUTRAL';
export type MomentumState = 'STRONG' | 'MODERATE' | 'WEAK' | 'DECELERATING';
export type VolatilityLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME';
export type SignalType = 'BUY' | 'SELL' | 'WAIT';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type SignalQuality = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CandlePattern {
  name: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  reliability: number; // 0-100
  description: string;
  contextualSignificance: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CandleAnalysis {
  symbol: string;
  timeframe: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradesCount?: number;

  // Geometry & Dynamics
  bodySize: number;
  bodySizePips: number;
  upperWick: number;
  upperWickPips: number;
  lowerWick: number;
  lowerWickPips: number;
  totalRange: number;
  totalRangePips: number;
  bodyRangeRatio: number; // 0.0 - 1.0
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';

  // Pressure & Momentum
  momentum: MomentumState;
  volatility: VolatilityLevel;
  buyingPressure: number; // 0-100
  sellingPressure: number; // 0-100

  // Candle Strength Score (0-100)
  candleStrengthScore: number;
  bullishScore: number;
  bearishScore: number;

  // Next Candle Probabilities (Model Scores, sum to 100%)
  bullishProbability: number;
  bearishProbability: number;
  neutralProbability: number;

  // Continuation vs Reversal Probabilities (Sum to 100%)
  continuationProbability: number;
  reversalProbability: number;
  rangeProbability: number;

  // Patterns
  patterns: CandlePattern[];

  // Contexts
  marketContext: string;
  trendContext: string;
  structureContext: string;
  volumeContext: string;
  orderFlowContext: string;

  // AI Interpretation Summary
  aiInterpretation: string;

  isLive: boolean;
}

export interface SwingPoint {
  index: number;
  price: number;
  timestamp: number;
  type: 'HH' | 'HL' | 'LH' | 'LL';
  label: string;
}

export interface MarketStructure {
  trend: TrendDirection;
  structureSequence: string; // e.g., "HH → HL → HH"
  swings: SwingPoint[];
  breakOfStructure: {
    detected: boolean;
    type: 'BULLISH' | 'BEARISH' | 'NONE';
    level: number;
    timestamp: number;
    confirmed: boolean;
  };
  changeOfCharacter: {
    detected: boolean;
    type: 'BULLISH' | 'BEARISH' | 'NONE';
    level: number;
    timestamp: number;
    confirmed: boolean;
  };
  phase: 'EXPANSION' | 'CONTRACTION' | 'ACCUMULATION' | 'DISTRIBUTION' | 'EQUILIBRIUM';
  expansionRatio: number;
  keySupport: number;
  keyResistance: number;
}

export interface LiquidityZone {
  id: string;
  type:
    | 'EQUAL_HIGHS'
    | 'EQUAL_LOWS'
    | 'SWING_HIGH'
    | 'SWING_LOW'
    | 'BUY_SIDE_LIQUIDITY'
    | 'SELL_SIDE_LIQUIDITY'
    | 'ORDER_BLOCK_BULL'
    | 'ORDER_BLOCK_BEAR'
    | 'SUPPORT_ZONE'
    | 'RESISTANCE_ZONE';
  priceHigh: number;
  priceLow: number;
  midPrice: number;
  touches: number;
  status: 'FRESH' | 'TESTED' | 'SWEPT';
  strength: number; // 0-100
  label: string;
  timestamp: number;
}

export interface TimeframeAnalysisItem {
  timeframe: string;
  trend: TrendDirection;
  strengthScore: number; // 0-100
  momentum: MomentumState;
  structure: string;
  closePosition: 'UPPER' | 'MIDDLE' | 'LOWER';
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface MultiTimeframeAnalysis {
  timeframes: Record<string, TimeframeAnalysisItem>;
  alignmentScore: number; // 0-100%
  hasConflict: boolean;
  alignmentStatus: 'STRONG_ALIGNMENT' | 'MODERATE_ALIGNMENT' | 'CONFLICT' | 'UNCERTAIN';
  macroTrend: TrendDirection; // From 4H / 1D
  mainTrend: TrendDirection; // From 1H
  structureTrend: TrendDirection; // From 15M
  setupTrend: TrendDirection; // From 5M
  entryTrend: TrendDirection; // From 1M
  recommendation: 'CONFLUENCE_ALIGNED' | 'WAIT_DUE_TO_CONFLICT' | 'COUNTER_TREND_CAUTION';
  summary: string;
}

export interface AISignal {
  id: string;
  timestamp: number;
  symbol: string;
  timeframe: string;
  signal: SignalType;
  entryPrice: number;
  entryZone: {
    min: number;
    max: number;
  };
  stopLoss: number;
  takeProfit: number[];
  riskRewardRatio: string; // e.g. "1:2.4"
  confidenceScore: number; // 0-100
  bullishProbability: number;
  bearishProbability: number;
  neutralProbability: number;
  candleStrength: number;
  trend: TrendDirection;
  momentum: MomentumState;
  structure: string;
  mtfAlignment: string; // "Strong", "Moderate", "Conflicted"
  riskLevel: RiskLevel;
  signalQuality: SignalQuality;
  reasoning: string[];
  invalidationLevel: number;
  result?: {
    status: 'PENDING' | 'HIT_TP1' | 'HIT_TP2' | 'HIT_SL' | 'EXPIRED';
    pnlPips?: number;
    actualDirection?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    closedAt?: number;
  };
}

export interface AIMarketScore {
  totalScore: number; // 0-100
  bias: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  components: {
    trend: number;
    structure: number;
    momentum: number;
    candleStrength: number;
    volume: number;
    orderFlow: number;
    liquidity: number;
    mtfAlignment: number;
    volatility: number;
  };
  weights: {
    trend: number;
    structure: number;
    momentum: number;
    candleStrength: number;
    volume: number;
    orderFlow: number;
    liquidity: number;
    mtfAlignment: number;
    volatility: number;
  };
}

export interface AIAlert {
  id: string;
  timestamp: number;
  symbol: string;
  timeframe: string;
  signal: SignalType;
  confidence: number;
  entryZone: string;
  stopLoss: number;
  takeProfit: number[];
  reason: string;
  read: boolean;
}

export interface AIValidationStats {
  totalSignals: number;
  buyCount: number;
  sellCount: number;
  waitCount: number;
  hitTpCount: number;
  hitSlCount: number;
  predictionAccuracy: number; // percentage
  continuationAccuracy: number;
  reversalAccuracy: number;
  buyWinRate: number;
  sellWinRate: number;
  waitAccuracy: number;
}

export interface TechnicalIndicators {
  ema9?: number;
  ema21?: number;
  ema50?: number;
  ema200?: number;
  sma20?: number;
  rsi14?: number;
  macd?: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  atr14?: number;
  bollingerBands?: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  };
  stochastic?: {
    k: number;
    d: number;
  };
  adx14?: number;
  vwap?: number;
}

export interface StructuredMarketContext {
  symbol: string;
  timeframe: string;
  timestamp: number;
  currentCandle: FootprintBar | null;
  previousCandles: FootprintBar[];
  indicators: TechnicalIndicators;
  marketStructure: MarketStructure;
  orderFlow: {
    available?: boolean;
    delta: number;
    cvd: number;
    pocPrice: number;
    imbalancesCount: number;
    hasAbsorption: boolean;
    absorptionType?: string;
    buyingPressure: number;
    sellingPressure: number;
  };
  liquidity: {
    zones: LiquidityZone[];
    nearestSupport?: number;
    nearestResistance?: number;
  };
  multiTimeframe: MultiTimeframeAnalysis;
  volatility: {
    atr: number;
    ratio: number;
    level: VolatilityLevel;
  };
}

export interface StructuredAIResponse {
  signal: SignalType;
  confidence: number;
  bullishProbability: number;
  bearishProbability: number;
  neutralProbability: number;
  continuationProbability: number;
  reversalProbability: number;
  marketState: TrendDirection;
  candleStrength: number;
  riskLevel: RiskLevel;
  signalQuality: SignalQuality;
  reasoning: string[];
  entryZone: { min: number; max: number };
  stopLoss: number;
  takeProfit: number[];
  invalidationLevel: number;
  marketScore: number;
  aiInterpretation: string;
}

export interface AIMarketBrainState {
  currentAnalysis: CandleAnalysis | null;
  selectedCandleAnalysis: CandleAnalysis | null;
  marketStructure: MarketStructure;
  liquidityZones: LiquidityZone[];
  multiTimeframe: MultiTimeframeAnalysis;
  latestSignal: AISignal | null;
  marketScore: AIMarketScore;
  signalHistory: AISignal[];
  validationStats: AIValidationStats;
  alerts: AIAlert[];
  alertConfig: {
    enabled: boolean;
    soundEnabled: boolean;
    minConfidence: number;
  };
  engineStatus: 'READY' | 'ANALYZING' | 'FALLBACK_MODE' | 'OFFLINE';
  provider: 'openai' | 'gemini' | 'rule_engine' | 'custom';
  isLiveAnalyzing: boolean;
  activeAiTab: 'market_brain' | 'candle_intel' | 'mtf_matrix' | 'signals' | 'structure_liquidity' | 'validation';
}
