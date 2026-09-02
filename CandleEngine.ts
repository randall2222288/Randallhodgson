/**
 * Advanced Candle Intelligence Engine
 * Comprehensive multi-factor candle strength scoring, directional probabilities,
 * pressure metrics, and individual bar analytics.
 */

import { FootprintBar } from '../../../src/types/market';
import { CandleAnalysis, CandlePattern, MarketStructure, MomentumState, MultiTimeframeAnalysis, VolatilityLevel } from '../../../src/types/ai';
import { IndicatorEngine } from '../indicators/IndicatorEngine';
import { CandlePatternDetector } from '../patterns/CandlePatternDetector';

export class CandleEngine {
  /**
   * Analyze a single candle with surrounding market context
   */
  public static analyzeCandle(
    current: FootprintBar,
    historical: FootprintBar[],
    symbol: string,
    timeframe: string,
    marketStructure?: MarketStructure,
    mtf?: MultiTimeframeAnalysis,
    isLive: boolean = false
  ): CandleAnalysis {
    const open = current.open;
    const high = current.high;
    const low = current.low;
    const close = current.close;
    const volume = current.volume;

    const totalRange = Math.max(0.00001, high - low);
    const bodySize = Math.abs(close - open);
    const bodyRangeRatio = parseFloat((bodySize / totalRange).toFixed(3));

    const upperWick = high - Math.max(open, close);
    const lowerWick = Math.min(open, close) - low;

    const bodySizePips = IndicatorEngine.priceToPips(symbol, bodySize);
    const upperWickPips = IndicatorEngine.priceToPips(symbol, upperWick);
    const lowerWickPips = IndicatorEngine.priceToPips(symbol, lowerWick);
    const totalRangePips = IndicatorEngine.priceToPips(symbol, totalRange);

    const isBullish = close > open;
    const isBearish = close < open;
    const direction = isBullish ? 'BULLISH' : isBearish ? 'BEARISH' : 'NEUTRAL';

    // 1. Close Position Relative to Range (0.0 = at Low, 1.0 = at High)
    const closePosition = (close - low) / totalRange;

    // 2. Relative Volume vs 20-period Moving Average
    const prevVolumes = historical.slice(-20).map(b => b.volume);
    const avgVolume = prevVolumes.length > 0 ? prevVolumes.reduce((a, b) => a + b, 0) / prevVolumes.length : volume || 1;
    const relativeVolume = volume / (avgVolume || 1);

    // 3. Pressure Calculations (0-100)
    let buyingPressure = Math.round(closePosition * 70 + (isBullish ? 25 : 5));
    if (current.delta > 0) buyingPressure += 5;
    if (lowerWick > upperWick * 1.5) buyingPressure += 5;
    buyingPressure = Math.min(99, Math.max(1, buyingPressure));
    const sellingPressure = 100 - buyingPressure;

    // 4. Momentum & Volatility
    let momentum: MomentumState = 'MODERATE';
    if (bodyRangeRatio > 0.75 && relativeVolume > 1.2) momentum = 'STRONG';
    else if (bodyRangeRatio < 0.25) momentum = 'WEAK';
    else if (upperWick > bodySize && lowerWick > bodySize) momentum = 'DECELERATING';

    const prevRanges = historical.slice(-14).map(b => b.high - b.low);
    const avgRange = prevRanges.length > 0 ? prevRanges.reduce((a, b) => a + b, 0) / prevRanges.length : totalRange;
    const rangeRatio = totalRange / (avgRange || 1);

    let volatility: VolatilityLevel = 'NORMAL';
    if (rangeRatio > 2.2) volatility = 'EXTREME';
    else if (rangeRatio > 1.4) volatility = 'HIGH';
    else if (rangeRatio < 0.6) volatility = 'LOW';

    // 5. Detect Patterns
    const nearSupport = marketStructure ? Math.abs(low - marketStructure.keySupport) < totalRange * 1.5 : false;
    const nearResistance = marketStructure ? Math.abs(high - marketStructure.keyResistance) < totalRange * 1.5 : false;
    const patterns = CandlePatternDetector.detectPatterns(current, historical, nearSupport, nearResistance);

    // 6. Comprehensive Multi-Factor Candle Strength Score (0-100)
    // Combines: Body ratio (25%), Close positioning (25%), Relative Volume (15%), Wick dynamics (15%), Delta/Order flow (10%), Structure alignment (10%)
    let rawScore = 50;

    if (direction === 'BULLISH') {
      rawScore =
        bodyRangeRatio * 35 +
        closePosition * 35 +
        Math.min(1.5, relativeVolume) * 10 +
        (lowerWick > upperWick ? 10 : 0) +
        (current.delta > 0 ? 10 : 0);
    } else if (direction === 'BEARISH') {
      rawScore =
        bodyRangeRatio * 35 +
        (1 - closePosition) * 35 +
        Math.min(1.5, relativeVolume) * 10 +
        (upperWick > lowerWick ? 10 : 0) +
        (current.delta < 0 ? 10 : 0);
    }

    const candleStrengthScore = Math.min(99, Math.max(10, Math.round(rawScore)));
    const bullishScore = direction === 'BULLISH' ? candleStrengthScore : 100 - candleStrengthScore;
    const bearishScore = direction === 'BEARISH' ? candleStrengthScore : 100 - candleStrengthScore;

    // 7. Next Candle Directional Estimated Probabilities (Sum = 100%)
    let nextBullish = 33;
    let nextBearish = 33;
    let nextNeutral = 34;

    const trendBias = marketStructure?.trend || 'RANGE';
    const mtfScore = mtf?.alignmentScore || 50;

    if (direction === 'BULLISH') {
      if (candleStrengthScore > 75 && trendBias === 'BULLISH') {
        nextBullish = 68;
        nextBearish = 21;
        nextNeutral = 11;
      } else if (candleStrengthScore > 60) {
        nextBullish = 58;
        nextBearish = 27;
        nextNeutral = 15;
      } else {
        nextBullish = 45;
        nextBearish = 35;
        nextNeutral = 20;
      }
    } else if (direction === 'BEARISH') {
      if (candleStrengthScore > 75 && trendBias === 'BEARISH') {
        nextBearish = 68;
        nextBullish = 21;
        nextNeutral = 11;
      } else if (candleStrengthScore > 60) {
        nextBearish = 58;
        nextBullish = 27;
        nextNeutral = 15;
      } else {
        nextBearish = 45;
        nextBullish = 35;
        nextNeutral = 20;
      }
    } else {
      nextNeutral = 52;
      nextBullish = 24;
      nextBearish = 24;
    }

    // Ensure sum equals exactly 100
    const probSum = nextBullish + nextBearish + nextNeutral;
    if (probSum !== 100) {
      nextNeutral = 100 - (nextBullish + nextBearish);
    }

    // 8. Continuation vs Reversal Probabilities (Sum = 100%)
    let continuationProbability = 50;
    let reversalProbability = 30;
    let rangeProbability = 20;

    if (candleStrengthScore >= 75 && (momentum === 'STRONG' || relativeVolume > 1.2)) {
      continuationProbability = 72;
      reversalProbability = 18;
      rangeProbability = 10;
    } else if (patterns.some(p => p.type !== direction && p.contextualSignificance === 'HIGH')) {
      // Reversal candle pattern detected at S/R
      reversalProbability = 65;
      continuationProbability = 22;
      rangeProbability = 13;
    } else if (bodyRangeRatio < 0.3) {
      rangeProbability = 54;
      continuationProbability = 24;
      reversalProbability = 22;
    }

    // 9. Contextual Descriptions
    const marketContext = `${trendBias} Trend (${marketStructure?.phase || 'Active'})`;
    const trendContext = marketStructure ? `Structure: ${marketStructure.structureSequence}` : 'Trend in formation';
    const structureContext = marketStructure?.breakOfStructure.detected
      ? `BOS ${marketStructure.breakOfStructure.type} Confirmed`
      : marketStructure?.changeOfCharacter.detected
      ? `CHoCH ${marketStructure.changeOfCharacter.type} Detected`
      : 'Structure Intact';
    const volumeContext = `Relative Vol: ${relativeVolume.toFixed(2)}x (${relativeVolume > 1.2 ? 'Elevated' : 'Normal'})`;
    const orderFlowContext = `Delta: ${current.delta > 0 ? '+' : ''}${current.delta.toLocaleString()} | Imbalances: ${current.imbalanceCount || 0}`;

    // 10. AI Interpretation Synthesis
    let aiInterpretation = '';
    if (direction === 'BULLISH' && candleStrengthScore >= 75) {
      aiInterpretation = `Strong bullish expansion bar closing near the high (${(closePosition * 100).toFixed(0)}% range). Aggressive buyer momentum with limited upper wick rejection.`;
    } else if (direction === 'BEARISH' && candleStrengthScore >= 75) {
      aiInterpretation = `Strong bearish impulse bar closing near the low (${((1 - closePosition) * 100).toFixed(0)}% range). Dominant aggressive sellers driving price discovery down.`;
    } else if (lowerWick > bodySize * 1.5) {
      aiInterpretation = `Bullish liquidity sweep and wick rejection below session low. Buyers stepped in aggressively to absorb selling pressure.`;
    } else if (upperWick > bodySize * 1.5) {
      aiInterpretation = `Bearish exhaustion and upper wick rejection near resistance. Passive sellers absorbed late buyers at the highs.`;
    } else {
      aiInterpretation = `Balanced rotation bar displaying two-way auction liquidity. Awaiting directional break of high (${high.toFixed(5)}) or low (${low.toFixed(5)}).`;
    }

    return {
      symbol,
      timeframe,
      timestamp: current.time,
      open,
      high,
      low,
      close,
      volume,
      tradesCount: current.tradesCount,
      bodySize,
      bodySizePips,
      upperWick,
      upperWickPips,
      lowerWick,
      lowerWickPips,
      totalRange,
      totalRangePips,
      bodyRangeRatio,
      direction,
      momentum,
      volatility,
      buyingPressure,
      sellingPressure,
      candleStrengthScore,
      bullishScore,
      bearishScore,
      bullishProbability: nextBullish,
      bearishProbability: nextBearish,
      neutralProbability: nextNeutral,
      continuationProbability,
      reversalProbability,
      rangeProbability,
      patterns,
      marketContext,
      trendContext,
      structureContext,
      volumeContext,
      orderFlowContext,
      aiInterpretation,
      isLive,
    };
  }
}
