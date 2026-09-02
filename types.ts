/**
 * Order Flow Intelligence - Type Definitions
 */

export type AggressionLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
export type AbsorptionStatus = 'DETECTED' | 'NOT_DETECTED';
export type MarketPressureState = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
export type CandleDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type CandleStrengthLevel = 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
export type ConfluenceVerdict = 'HIGH_BULLISH' | 'HIGH_BEARISH' | 'MIXED_CONDITIONS' | 'INSUFFICIENT_DATA';
export type CumulativeDeltaPeriod = 'candle' | 'session' | 'visible';
export type DataQualityRating = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ConfluenceItem {
  id: string;
  label: string;
  isBullish: boolean;
  isBearish: boolean;
  active: boolean;
  detail: string;
}

export interface IntelligenceAlert {
  id: string;
  timestamp: number;
  type: 'BUY_ABSORPTION' | 'SELL_ABSORPTION' | 'STRONG_IMBALANCE' | 'DELTA_REVERSAL' | 'PRESSURE_REVERSAL' | 'MOMENTUM_SHIFT';
  title: string;
  message: string;
  severity: 'bullish' | 'bearish' | 'warning' | 'info';
}

export interface IntelligenceConfig {
  imbalanceThreshold: number; // e.g. 300%
  absorptionThresholdVolume: number; // e.g. 8.0
  minSignalConfidence: number; // e.g. 70%
  cumulativeDeltaPeriod: CumulativeDeltaPeriod;
  ladderLevelsCount: number; // e.g. 16 levels
  showDebug: boolean;
}
