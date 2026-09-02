/**
 * Multi-Timeframe Intelligence Engine
 * Aggregates and analyzes market structure across 1m, 3m, 5m, 15m, 30m, 1H, 2H, 4H, 1D, 1W.
 */

import { FootprintBar, TradeTick } from '../../../src/types/market';
import { MultiTimeframeAnalysis, TimeframeAnalysisItem, TrendDirection } from '../../../src/types/ai';

export const TIMEFRAME_MINUTES_MAP: Record<string, number> = {
  '1m': 1,
  '3m': 3,
  '5m': 5,
  '15m': 15,
  '30m': 30,
  '1H': 60,
  '2H': 120,
  '4H': 240,
  '1D': 1440,
  '1W': 10080,
};

export class MultiTimeframeEngine {
  private symbol: string = 'BTCUSD';
  // Cached bars per timeframe
  private timeframeBars: Map<string, FootprintBar[]> = new Map();

  constructor(symbol: string = 'BTCUSD') {
    this.symbol = symbol;
    this.initTimeframes();
  }

  public updateSymbol(symbol: string) {
    this.symbol = symbol;
    this.initTimeframes();
  }

  private initTimeframes() {
    this.timeframeBars.clear();
    for (const tf of Object.keys(TIMEFRAME_MINUTES_MAP)) {
      this.timeframeBars.set(tf, []);
    }
  }

  /**
   * Ingest tick to update all multi-timeframe candles
   */
  public processTick(trade: TradeTick) {
    const now = trade.timestamp;

    for (const [tf, minutes] of Object.entries(TIMEFRAME_MINUTES_MAP)) {
      const tfMs = minutes * 60 * 1000;
      const barStartTime = Math.floor(now / tfMs) * tfMs;
      let bars = this.timeframeBars.get(tf) || [];

      let activeBar = bars.length > 0 ? bars[bars.length - 1] : null;

      if (!activeBar || activeBar.time !== barStartTime) {
        // Create new bar
        const newBar: FootprintBar = {
          time: barStartTime,
          open: trade.price,
          high: trade.price,
          low: trade.price,
          close: trade.price,
          volume: trade.size,
          tradesCount: 1,
          delta: trade.side === 'buy' ? trade.size : -trade.size,
          cvd: 0,
          buyVolume: trade.side === 'buy' ? trade.size : 0,
          sellVolume: trade.side === 'buy' ? 0 : trade.size,
          pocPrice: trade.price,
          vahPrice: trade.price,
          valPrice: trade.price,
          minDelta: 0,
          maxDelta: 0,
          levels: [],
          imbalanceCount: 0,
        };
        bars.push(newBar);
        if (bars.length > 50) bars.shift();
      } else {
        // Update existing bar
        activeBar.high = Math.max(activeBar.high, trade.price);
        activeBar.low = Math.min(activeBar.low, trade.price);
        activeBar.close = trade.price;
        activeBar.volume = parseFloat((activeBar.volume + trade.size).toFixed(3));
        activeBar.tradesCount += 1;
        const d = trade.side === 'buy' ? trade.size : -trade.size;
        activeBar.delta = parseFloat((activeBar.delta + d).toFixed(3));
      }

      this.timeframeBars.set(tf, bars);
    }
  }

  /**
   * Seed historical bars for a given timeframe
   */
  public seedBars(timeframe: string, bars: FootprintBar[]) {
    this.timeframeBars.set(timeframe, [...bars]);
  }

  /**
   * Get bars for specific timeframe
   */
  public getBars(timeframe: string): FootprintBar[] {
    return this.timeframeBars.get(timeframe) || [];
  }

  /**
   * Compute comprehensive Multi-Timeframe Analysis
   */
  public analyzeMTF(currentBaseBars: FootprintBar[]): MultiTimeframeAnalysis {
    const analysisMap: Record<string, TimeframeAnalysisItem> = {};
    const tfList = ['4H', '1H', '15m', '5m', '1m'];

    let bullishCount = 0;
    let bearishCount = 0;
    let totalScoreSum = 0;

    for (const tf of tfList) {
      const bars = this.getBars(tf).length >= 2 ? this.getBars(tf) : currentBaseBars;
      const tfAnalysis = this.analyzeSingleTimeframe(tf, bars);
      analysisMap[tf] = tfAnalysis;

      if (tfAnalysis.trend === 'BULLISH') bullishCount++;
      if (tfAnalysis.trend === 'BEARISH') bearishCount++;
      totalScoreSum += tfAnalysis.strengthScore;
    }

    const alignmentScore = Math.round(
      (Math.max(bullishCount, bearishCount) / tfList.length) * 100
    );

    const hasConflict = bullishCount >= 2 && bearishCount >= 2;

    const macroTrend = analysisMap['4H']?.trend || 'NEUTRAL';
    const mainTrend = analysisMap['1H']?.trend || 'NEUTRAL';
    const structureTrend = analysisMap['15m']?.trend || 'NEUTRAL';
    const setupTrend = analysisMap['5m']?.trend || 'NEUTRAL';
    const entryTrend = analysisMap['1m']?.trend || 'NEUTRAL';

    let alignmentStatus: 'STRONG_ALIGNMENT' | 'MODERATE_ALIGNMENT' | 'CONFLICT' | 'UNCERTAIN' = 'MODERATE_ALIGNMENT';
    let recommendation: 'CONFLUENCE_ALIGNED' | 'WAIT_DUE_TO_CONFLICT' | 'COUNTER_TREND_CAUTION' = 'CONFLUENCE_ALIGNED';

    if (alignmentScore >= 80 && !hasConflict) {
      alignmentStatus = 'STRONG_ALIGNMENT';
      recommendation = 'CONFLUENCE_ALIGNED';
    } else if (hasConflict) {
      alignmentStatus = 'CONFLICT';
      recommendation = 'WAIT_DUE_TO_CONFLICT';
    } else if (macroTrend !== entryTrend && macroTrend !== 'RANGE') {
      alignmentStatus = 'MODERATE_ALIGNMENT';
      recommendation = 'COUNTER_TREND_CAUTION';
    }

    const summary = hasConflict
      ? `MTF Conflict: Macro (${macroTrend}) contradicts Entry (${entryTrend}). Recommendation: WAIT for alignment.`
      : `MTF Alignment ${alignmentScore}% (${macroTrend}). High confluence across timeframes.`;

    return {
      timeframes: analysisMap,
      alignmentScore,
      hasConflict,
      alignmentStatus,
      macroTrend,
      mainTrend,
      structureTrend,
      setupTrend,
      entryTrend,
      recommendation,
      summary,
    };
  }

  private analyzeSingleTimeframe(tf: string, bars: FootprintBar[]): TimeframeAnalysisItem {
    if (!bars || bars.length === 0) {
      return {
        timeframe: tf,
        trend: 'NEUTRAL',
        strengthScore: 50,
        momentum: 'MODERATE',
        structure: 'Consolidation',
        closePosition: 'MIDDLE',
        bias: 'NEUTRAL',
      };
    }

    const last = bars[bars.length - 1];
    const prev = bars.length > 1 ? bars[bars.length - 2] : last;

    const isUp = last.close >= last.open;
    const higherHigh = last.high > prev.high;
    const higherLow = last.low > prev.low;
    const lowerHigh = last.high < prev.high;
    const lowerLow = last.low < prev.low;

    let trend: TrendDirection = 'RANGE';
    if (higherHigh && higherLow) trend = 'BULLISH';
    else if (lowerHigh && lowerLow) trend = 'BEARISH';
    else if (isUp) trend = 'BULLISH';
    else trend = 'BEARISH';

    const range = last.high - last.low || 0.0001;
    const closeFromLow = (last.close - last.low) / range;
    const closePosition = closeFromLow > 0.66 ? 'UPPER' : closeFromLow < 0.33 ? 'LOWER' : 'MIDDLE';

    let score = 50;
    if (trend === 'BULLISH') {
      score = 65 + (closePosition === 'UPPER' ? 18 : 5) + (isUp ? 8 : 0);
    } else if (trend === 'BEARISH') {
      score = 65 + (closePosition === 'LOWER' ? 18 : 5) + (!isUp ? 8 : 0);
    }

    return {
      timeframe: tf,
      trend,
      strengthScore: Math.min(98, Math.max(20, score)),
      momentum: closePosition === 'UPPER' || closePosition === 'LOWER' ? 'STRONG' : 'MODERATE',
      structure: trend === 'BULLISH' ? 'HH → HL' : trend === 'BEARISH' ? 'LH → LL' : 'Ranging',
      closePosition,
      bias: trend === 'BULLISH' ? 'BULLISH' : trend === 'BEARISH' ? 'BEARISH' : 'NEUTRAL',
    };
  }
}
