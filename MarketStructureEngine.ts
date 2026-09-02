/**
 * Market Structure Engine
 * Detects Swings (HH, HL, LH, LL), Break of Structure (BOS), Change of Character (CHoCH),
 * and Trend Regimes with Precision.
 */

import { FootprintBar } from '../../../src/types/market';
import { MarketStructure, SwingPoint, TrendDirection } from '../../../src/types/ai';

export class MarketStructureEngine {
  /**
   * Analyze market structure over candle history
   */
  public static analyze(candles: FootprintBar[]): MarketStructure {
    if (!candles || candles.length < 5) {
      const lastPrice = candles && candles.length > 0 ? candles[candles.length - 1].close : 1.0;
      return {
        trend: 'RANGE',
        structureSequence: 'Inspecting...',
        swings: [],
        breakOfStructure: { detected: false, type: 'NONE', level: 0, timestamp: 0, confirmed: false },
        changeOfCharacter: { detected: false, type: 'NONE', level: 0, timestamp: 0, confirmed: false },
        phase: 'EQUILIBRIUM',
        expansionRatio: 1.0,
        keySupport: lastPrice * 0.995,
        keyResistance: lastPrice * 1.005,
      };
    }

    // 1. Detect Pivot Highs and Pivot Lows (3-5 bar window)
    const swings: SwingPoint[] = [];
    const windowSize = 2; // Look 2 bars left and 2 bars right

    for (let i = windowSize; i < candles.length - windowSize; i++) {
      const c = candles[i];
      let isHigh = true;
      let isLow = true;

      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j === i) continue;
        if (candles[j].high >= c.high) isHigh = false;
        if (candles[j].low <= c.low) isLow = false;
      }

      if (isHigh) {
        swings.push({
          index: i,
          price: c.high,
          timestamp: c.time,
          type: 'HH', // Placeholder, classified below
          label: 'High',
        });
      } else if (isLow) {
        swings.push({
          index: i,
          price: c.low,
          timestamp: c.time,
          type: 'LL', // Placeholder, classified below
          label: 'Low',
        });
      }
    }

    // 2. Classify Swings as HH, HL, LH, LL
    let lastHigh: SwingPoint | null = null;
    let lastLow: SwingPoint | null = null;

    for (let i = 0; i < swings.length; i++) {
      const s = swings[i];
      if (s.label === 'High') {
        if (!lastHigh) {
          s.type = 'HH';
        } else {
          s.type = s.price > lastHigh.price ? 'HH' : 'LH';
        }
        s.label = s.type;
        lastHigh = s;
      } else {
        if (!lastLow) {
          s.type = 'LL';
        } else {
          s.type = s.price > lastLow.price ? 'HL' : 'LL';
        }
        s.label = s.type;
        lastLow = s;
      }
    }

    // 3. Determine Overall Trend & Structure Sequence
    const recentSwings = swings.slice(-4);
    let structureSequence = recentSwings.map(s => s.type).join(' → ') || 'Establishing Structure';

    let hhCount = 0;
    let hlCount = 0;
    let lhCount = 0;
    let llCount = 0;

    for (const s of recentSwings) {
      if (s.type === 'HH') hhCount++;
      if (s.type === 'HL') hlCount++;
      if (s.type === 'LH') lhCount++;
      if (s.type === 'LL') llCount++;
    }

    let trend: TrendDirection = 'RANGE';
    if (hhCount + hlCount >= 3) {
      trend = 'BULLISH';
    } else if (lhCount + llCount >= 3) {
      trend = 'BEARISH';
    } else if (hhCount >= 1 && hlCount >= 1 && llCount === 0) {
      trend = 'BULLISH';
    } else if (llCount >= 1 && lhCount >= 1 && hhCount === 0) {
      trend = 'BEARISH';
    } else {
      trend = 'RANGE';
    }

    // 4. Detect Break of Structure (BOS) & Change of Character (CHoCH)
    const currentBar = candles[candles.length - 1];
    let bosDetected = false;
    let bosType: 'BULLISH' | 'BEARISH' | 'NONE' = 'NONE';
    let bosLevel = 0;

    let chochDetected = false;
    let chochType: 'BULLISH' | 'BEARISH' | 'NONE' = 'NONE';
    let chochLevel = 0;

    if (lastHigh && currentBar.close > lastHigh.price) {
      if (trend === 'BULLISH') {
        bosDetected = true;
        bosType = 'BULLISH';
        bosLevel = lastHigh.price;
      } else if (trend === 'BEARISH' || trend === 'RANGE') {
        chochDetected = true;
        chochType = 'BULLISH';
        chochLevel = lastHigh.price;
        trend = 'BULLISH';
      }
    } else if (lastLow && currentBar.close < lastLow.price) {
      if (trend === 'BEARISH') {
        bosDetected = true;
        bosType = 'BEARISH';
        bosLevel = lastLow.price;
      } else if (trend === 'BULLISH' || trend === 'RANGE') {
        chochDetected = true;
        chochType = 'BEARISH';
        chochLevel = lastLow.price;
        trend = 'BEARISH';
      }
    }

    // 5. Market Phase & Volatility Expansion
    const recent5 = candles.slice(-5);
    const avgRecentRange = recent5.reduce((sum, c) => sum + (c.high - c.low), 0) / recent5.length;
    const historicalAvg = candles.reduce((sum, c) => sum + (c.high - c.low), 0) / candles.length;
    const expansionRatio = parseFloat((avgRecentRange / (historicalAvg || 1)).toFixed(2));

    let phase: 'EXPANSION' | 'CONTRACTION' | 'ACCUMULATION' | 'DISTRIBUTION' | 'EQUILIBRIUM' = 'EQUILIBRIUM';
    if (expansionRatio > 1.35) {
      phase = 'EXPANSION';
    } else if (expansionRatio < 0.75) {
      phase = 'CONTRACTION';
    } else if (trend === 'BULLISH' && (bosDetected || chochDetected)) {
      phase = 'ACCUMULATION';
    } else if (trend === 'BEARISH' && (bosDetected || chochDetected)) {
      phase = 'DISTRIBUTION';
    }

    // 6. Calculate Key Support & Key Resistance
    const lows = swings.filter(s => s.type === 'HL' || s.type === 'LL').map(s => s.price);
    const highs = swings.filter(s => s.type === 'HH' || s.type === 'LH').map(s => s.price);

    const keySupport = lows.length > 0 ? Math.max(...lows.filter(l => l <= currentBar.close)) || Math.min(...lows) : currentBar.low * 0.998;
    const keyResistance = highs.length > 0 ? Math.min(...highs.filter(h => h >= currentBar.close)) || Math.max(...highs) : currentBar.high * 1.002;

    return {
      trend,
      structureSequence,
      swings,
      breakOfStructure: {
        detected: bosDetected,
        type: bosType,
        level: bosLevel,
        timestamp: currentBar.time,
        confirmed: bosDetected,
      },
      changeOfCharacter: {
        detected: chochDetected,
        type: chochType,
        level: chochLevel,
        timestamp: currentBar.time,
        confirmed: chochDetected,
      },
      phase,
      expansionRatio,
      keySupport: parseFloat(keySupport.toFixed(5)),
      keyResistance: parseFloat(keyResistance.toFixed(5)),
    };
  }
}
