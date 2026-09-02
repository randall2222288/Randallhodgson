import {
  ConnectionState,
  CvdPoint,
  FootprintBar,
  SymbolInfo,
  TerminalConfig,
  TerminalStats,
  TradeTick,
  VolumeProfileData,
  WSMessage,
} from '../types/market';
import {
  AIMarketBrainState,
  CandleAnalysis,
} from '../types/ai';
import { wsClient } from '../services/websocket';
import { getClientSymbolInfo, SUPPORTED_SYMBOLS } from '../config/symbols';

export type OrderFlowTabType =
  | 'order_flow_intelligence'
  | 'ladder'
  | 'footprint_bars'
  | 'cvd'
  | 'volume_profile'
  | 'market_brain'
  | 'candle_intel'
  | 'mtf_matrix'
  | 'signals'
  | 'structure_liquidity'
  | 'validation';

export interface TerminalState {
  symbol: string;
  timeframe: string;
  status: ConnectionState;
  isRealData: boolean;
  providerName: string;
  providerId: string;
  activeBar: FootprintBar | null;
  historicalBars: FootprintBar[];
  stats: TerminalStats;
  volumeProfile: VolumeProfileData | null;
  cvdHistory: CvdPoint[];
  recentTrades: TradeTick[];
  config: TerminalConfig;
  availableSymbols: SymbolInfo[];
  isSettingsOpen: boolean;
  isShortcutsOpen: boolean;
  isAlertsOpen: boolean;
  activeOrderFlowTab: OrderFlowTabType;
  selectedPriceLevel: number | null;
  aiState: AIMarketBrainState;
  selectedCandleAnalysis: CandleAnalysis | null;
  isAiAnalyzing: boolean;
}

type Listener = (state: TerminalState) => void;

const DEFAULT_CONFIG: TerminalConfig = {
  footprintVisible: true,
  deltaVisible: true,
  cvdVisible: true,
  pocVisible: true,
  volumeProfileVisible: true,
  imbalanceVisible: true,
  absorptionVisible: true,
  imbalanceThreshold: 300, // 300%
  tickSize: 'auto',
  maxRows: 50,
  sessionMode: 'session',
  providerType: 'mock',
  chartType: 'tradingview',
  soundAlerts: false,
  splitRatio: 52, // 52% chart / 48% orderflow
  fullTerminalMode: false,
  timeframe: '1m',
  symbol: 'BTCUSD',
  dataSourceNote: 'Mock Simulation Data',
};

const DEFAULT_STATS: TerminalStats = {
  price: 104250.0,
  priceChange24h: 1.28,
  high24h: 105200,
  low24h: 102400,
  delta: 1284,
  cvd: 8521,
  volume: 24851,
  pocPrice: 104248,
  vahPrice: 104275,
  valPrice: 104210,
  minDelta: -340,
  maxDelta: 1650,
  imbalancesCount: 6,
  isAbsorptionDetected: false,
  tradesPerSec: 24.5,
  dataMode: 'mock',
};

const DEFAULT_AI_STATE: AIMarketBrainState = {
  currentAnalysis: null,
  selectedCandleAnalysis: null,
  marketStructure: {
    trend: 'BULLISH',
    structureSequence: 'HH → HL → HH',
    swings: [],
    breakOfStructure: { detected: false, type: 'NONE', level: 0, timestamp: 0, confirmed: false },
    changeOfCharacter: { detected: false, type: 'NONE', level: 0, timestamp: 0, confirmed: false },
    phase: 'EXPANSION',
    expansionRatio: 1.15,
    keySupport: 104100,
    keyResistance: 104500,
  },
  liquidityZones: [],
  multiTimeframe: {
    timeframes: {},
    alignmentScore: 80,
    hasConflict: false,
    alignmentStatus: 'STRONG_ALIGNMENT',
    macroTrend: 'BULLISH',
    mainTrend: 'BULLISH',
    structureTrend: 'BULLISH',
    setupTrend: 'BULLISH',
    entryTrend: 'BULLISH',
    recommendation: 'CONFLUENCE_ALIGNED',
    summary: 'Strong multi-timeframe alignment',
  },
  latestSignal: null,
  marketScore: {
    totalScore: 78,
    bias: 'BULLISH',
    components: {
      trend: 80,
      structure: 85,
      momentum: 75,
      candleStrength: 82,
      volume: 70,
      orderFlow: 75,
      liquidity: 80,
      mtfAlignment: 85,
      volatility: 65,
    },
    weights: {
      trend: 20,
      structure: 15,
      momentum: 10,
      candleStrength: 15,
      volume: 10,
      orderFlow: 10,
      liquidity: 10,
      mtfAlignment: 10,
      volatility: 5,
    },
  },
  signalHistory: [],
  validationStats: {
    totalSignals: 0,
    buyCount: 0,
    sellCount: 0,
    waitCount: 0,
    hitTpCount: 0,
    hitSlCount: 0,
    predictionAccuracy: 78.4,
    continuationAccuracy: 81.2,
    reversalAccuracy: 74.6,
    buyWinRate: 79.1,
    sellWinRate: 77.8,
    waitAccuracy: 86.5,
  },
  alerts: [],
  alertConfig: {
    enabled: true,
    soundEnabled: false,
    minConfidence: 75,
  },
  engineStatus: 'READY',
  provider: 'gemini',
  isLiveAnalyzing: false,
  activeAiTab: 'market_brain',
};

class TerminalStore {
  private state: TerminalState = {
    symbol: 'BTCUSD',
    timeframe: '1m',
    status: 'OFFLINE',
    isRealData: false,
    providerName: 'Mock Market Data Simulator',
    providerId: 'mock',
    activeBar: null,
    historicalBars: [],
    stats: DEFAULT_STATS,
    volumeProfile: null,
    cvdHistory: [],
    recentTrades: [],
    config: DEFAULT_CONFIG,
    availableSymbols: SUPPORTED_SYMBOLS,
    isSettingsOpen: false,
    isShortcutsOpen: false,
    isAlertsOpen: false,
    activeOrderFlowTab: 'ladder',
    selectedPriceLevel: null,
    aiState: DEFAULT_AI_STATE,
    selectedCandleAnalysis: null,
    isAiAnalyzing: false,
  };

  private listeners: Set<Listener> = new Set();

  constructor() {
    // Listen to WebSocket messages
    wsClient.onMessage((msg: WSMessage) => this.handleWSMessage(msg));
    wsClient.onStatusChange((status: ConnectionState) => {
      this.updateState({ status });
    });
  }

  public getState(): TerminalState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public updateState(partial: Partial<TerminalState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  public updateConfig(partialConfig: Partial<TerminalConfig>) {
    const newConfig = { ...this.state.config, ...partialConfig };
    this.state.config = newConfig;

    // Send configuration update to backend
    wsClient.send({
      type: 'set_config',
      timeframe: newConfig.timeframe,
      imbalanceThreshold: newConfig.imbalanceThreshold,
      tickSize: newConfig.tickSize,
      providerType: newConfig.providerType,
    });

    this.notify();
  }

  public setSymbol(symbol: string) {
    if (this.state.symbol === symbol) return;
    this.updateState({
      symbol,
      cvdHistory: [],
      recentTrades: [],
      selectedCandleAnalysis: null,
      config: { ...this.state.config, symbol },
    });

    wsClient.send({
      type: 'subscribe',
      symbol,
      timeframe: this.state.timeframe,
    });
  }

  public setTimeframe(timeframe: string) {
    if (this.state.timeframe === timeframe) return;
    this.updateConfig({ timeframe });
    this.updateState({ timeframe, selectedCandleAnalysis: null });

    wsClient.send({
      type: 'set_config',
      timeframe,
    });
  }

  public resetCvd() {
    wsClient.send({ type: 'reset_cvd' });
    this.updateState({
      cvdHistory: [],
      stats: { ...this.state.stats, cvd: 0 },
    });
  }

  public setOrderFlowTab(tab: OrderFlowTabType) {
    this.updateState({ activeOrderFlowTab: tab });
  }

  public toggleSettings() {
    this.updateState({ isSettingsOpen: !this.state.isSettingsOpen });
  }

  public toggleShortcuts() {
    this.updateState({ isShortcutsOpen: !this.state.isShortcutsOpen });
  }

  public toggleAlerts() {
    this.updateState({ isAlertsOpen: !this.state.isAlertsOpen });
  }

  public toggleFullTerminal() {
    this.updateConfig({ fullTerminalMode: !this.state.config.fullTerminalMode });
  }

  public setSplitRatio(ratio: number) {
    const bounded = Math.max(20, Math.min(80, ratio));
    this.updateConfig({ splitRatio: bounded });
  }

  public requestAiAnalysis() {
    this.updateState({ isAiAnalyzing: true });
    wsClient.send({ type: 'request_ai_analysis' });
  }

  public inspectCandle(timestamp: number) {
    wsClient.send({ type: 'inspect_candle', timestamp });
  }

  public setSelectedCandleAnalysis(analysis: CandleAnalysis | null) {
    this.updateState({ selectedCandleAnalysis: analysis });
  }

  public markAlertRead(alertId: string) {
    const alerts = this.state.aiState.alerts.map(a =>
      a.id === alertId ? { ...a, read: true } : a
    );
    this.updateState({
      aiState: { ...this.state.aiState, alerts },
    });
  }

  public setAlertConfig(alertConfig: any) {
    this.updateState({
      aiState: { ...this.state.aiState, alertConfig: { ...this.state.aiState.alertConfig, ...alertConfig } },
    });
  }

  private handleWSMessage(msg: WSMessage) {
    if (msg.type === 'init') {
      const p = msg.payload;
      const isReal = Boolean(p.isRealData);
      this.updateState({
        symbol: p.symbol || this.state.symbol,
        timeframe: p.timeframe || this.state.timeframe,
        activeBar: p.activeBar,
        historicalBars: p.historicalBars || [],
        volumeProfile: p.volumeProfile,
        stats: p.stats || this.state.stats,
        isRealData: isReal,
        providerName: p.providerName || this.state.providerName,
        providerId: p.providerId || this.state.providerId,
        aiState: p.aiState || this.state.aiState,
        config: {
          ...this.state.config,
          dataSourceNote: isReal ? 'Real Trade Data' : 'Estimated / Derived Data',
          providerType: p.providerId === 'real' ? 'real' : 'mock',
        },
      });
    } else if (msg.type === 'tick') {
      const p = msg.payload;
      const recent = [...this.state.recentTrades];
      if (p.lastTrade) {
        recent.unshift(p.lastTrade);
        if (recent.length > 25) recent.pop();
      }

      // Append to CVD stream
      const cvdHistory = [...this.state.cvdHistory];
      if (p.stats && p.stats.cvd !== undefined) {
        const point: CvdPoint = {
          timestamp: Date.now(),
          cvd: p.stats.cvd,
          delta: p.stats.delta,
          price: p.stats.price,
        };
        cvdHistory.push(point);
        if (cvdHistory.length > 150) {
          cvdHistory.shift();
        }
      }

      this.updateState({
        activeBar: p.activeBar,
        stats: p.stats,
        volumeProfile: p.volumeProfile || this.state.volumeProfile,
        recentTrades: recent,
        cvdHistory,
      });
    } else if (msg.type === 'ai_state') {
      this.updateState({
        aiState: msg.payload,
        isAiAnalyzing: false,
      });
    } else if (msg.type === 'selected_candle_analysis') {
      this.updateState({
        selectedCandleAnalysis: msg.payload,
      });
    } else if (msg.type === 'provider_status') {
      const p = msg.payload;
      this.updateState({
        status: p.status,
        isRealData: Boolean(p.isRealData),
        providerName: p.providerName,
        providerId: p.providerId,
        config: {
          ...this.state.config,
          dataSourceNote: p.isRealData ? 'Real Trade Data' : 'Estimated / Derived Data',
        },
      });
    }
  }
}

export const terminalStore = new TerminalStore();
