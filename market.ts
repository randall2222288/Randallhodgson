/**
 * Market Data & Order Flow Type Definitions
 */

export type ConnectionState = 'LIVE' | 'CONNECTING' | 'RECONNECTING' | 'OFFLINE';

export type DataMode = 'real' | 'derived' | 'mock';

export type AssetCategory = 'forex' | 'metals' | 'indices' | 'crypto' | 'stocks';

export type TradeSide = 'buy' | 'sell';

export interface TradeTick {
  id: string;
  timestamp: number;
  price: number;
  size: number;
  side: TradeSide;
  isBuyerMaker?: boolean;
  isDerived?: boolean;
}

export interface PriceLevel {
  price: number;
  bidVolume: number;
  askVolume: number;
  totalVolume: number;
  delta: number;
  isImbalanceBuy: boolean;
  isImbalanceSell: boolean;
  isPoc: boolean;
  isVah?: boolean;
  isVal?: boolean;
  isAbsorption: boolean;
  absorptionType?: 'bid_absorption' | 'ask_absorption';
}

export interface Candle {
  time: number; // Unix timestamp in seconds or ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradesCount: number;
  delta: number;
  cvd: number;
  buyVolume: number;
  sellVolume: number;
  pocPrice: number;
  minDelta: number;
  maxDelta: number;
}

export interface FootprintBar extends Candle {
  vahPrice: number;
  valPrice: number;
  levels: PriceLevel[];
  imbalanceCount: number;
  possibleAbsorption?: {
    type: 'bid_absorption' | 'ask_absorption';
    price: number;
    volume: number;
  };
}

export interface VolumeProfileLevel {
  price: number;
  volume: number;
  buyVolume: number;
  sellVolume: number;
  delta: number;
  isPoc: boolean;
  isVah: boolean;
  isVal: boolean;
  isHvn: boolean;
  isLvn: boolean;
}

export interface VolumeProfileData {
  levels: VolumeProfileLevel[];
  pocPrice: number;
  vahPrice: number;
  valPrice: number;
  totalVolume: number;
  totalDelta: number;
  session: string;
}

export interface CvdPoint {
  timestamp: number;
  cvd: number;
  delta: number;
  price: number;
}

export interface TerminalStats {
  price: number;
  priceChange24h: number;
  high24h: number;
  low24h: number;
  delta: number;
  cvd: number;
  volume: number;
  pocPrice: number;
  vahPrice: number;
  valPrice: number;
  minDelta: number;
  maxDelta: number;
  imbalancesCount: number;
  isAbsorptionDetected: boolean;
  absorptionDescription?: string;
  lastTradeSide?: TradeSide;
  lastTradeSize?: number;
  tradesPerSec: number;
  dataMode?: DataMode;
  providerName?: string;
  isDecentralized?: boolean;
}

export interface TerminalConfig {
  footprintVisible: boolean;
  deltaVisible: boolean;
  cvdVisible: boolean;
  pocVisible: boolean;
  volumeProfileVisible: boolean;
  imbalanceVisible: boolean;
  absorptionVisible: boolean;
  imbalanceThreshold: number; // 300 = 300%
  tickSize: number | 'auto';
  maxRows: number;
  sessionMode: 'candle' | 'session' | 'day' | 'visible';
  providerType: 'mock' | 'real';
  chartType: 'tradingview' | 'lightweight';
  soundAlerts: boolean;
  splitRatio: number; // percentage of height for chart (e.g. 55)
  fullTerminalMode: boolean;
  timeframe: string; // '1m' | '5m' | '15m' | '1H' | '4H' | '1D'
  symbol: string; // e.g. 'EUR/USD' | 'BTC/USD' | 'XAU/USD'
  dataSourceNote: 'Real Trade Data' | 'Estimated / Derived Data' | 'Mock Simulation Data';
}

export interface SymbolInfo {
  id: string; // Internal standard ID e.g. 'EURUSD', 'BTCUSD'
  displaySymbol: string; // Formatted UI display e.g. 'EUR/USD', 'BTC/USD'
  name: string; // Full descriptive name e.g. 'Euro / US Dollar'
  baseAsset: string;
  quoteAsset: string;
  priceDecimals: number;
  tickSize: number;
  defaultPrice: number;
  category: AssetCategory;
  tradingViewSymbol: string;
  twelveDataSymbol?: string;
  binanceSymbol?: string;
  isDecentralizedOrQuoteOnly: boolean;
}

// WebSocket Message protocols
export type WSMessageType =
  | 'init'
  | 'tick'
  | 'candle_update'
  | 'candle_close'
  | 'footprint_update'
  | 'stats_update'
  | 'volume_profile'
  | 'cvd_update'
  | 'subscribe'
  | 'reset_cvd'
  | 'set_config'
  | 'ping'
  | 'pong'
  | 'provider_status'
  | 'ai_state'
  | 'ai_signal'
  | 'request_ai_analysis'
  | 'inspect_candle'
  | 'selected_candle_analysis';

export interface WSMessage<T = any> {
  type: WSMessageType;
  payload?: T;
  timestamp: number;
}
