/**
 * Candlestick Pattern Detector with Market Contextual Weighting
 */

import { FootprintBar } from '../../../src/types/market';
import { CandlePattern } from '../../../src/types/ai';

export class CandlePatternDetector {
  /**
   * Detect patterns in current and previous candles
   */
  public static detectPatterns(
    current: FootprintBar,
    previous: FootprintBar[],
    nearSupport: boolean = false,
    nearResistance: boolean = false
  ): CandlePattern[] {
    const patterns: CandlePattern[] = [];
    if (!current) return patterns;

    const range = current.high - current.low;
    if (range <= 0) return patterns;

    const body = Math.abs(current.close - current.open);
    const bodyRatio = body / range;
    const upperWick = current.high - Math.max(current.open, current.close);
    const lowerWick = Math.min(current.open, current.close) - current.low;
    const isBullish = current.close >= current.open;

    const prev1 = previous.length > 0 ? previous[previous.length - 1] : null;
    const prev2 = previous.length > 1 ? previous[previous.length - 2] : null;

    // 1. DOJI
    if (bodyRatio < 0.1) {
      if (lowerWick > range * 0.65) {
        patterns.push({
          name: 'Dragonfly Doji',
          type: 'BULLISH',
          reliability: nearSupport ? 88 : 70,
          description: 'Strong lower rejection at key level indicating buyer defense',
          contextualSignificance: nearSupport ? 'HIGH' : 'MEDIUM',
        });
      } else if (upperWick > range * 0.65) {
        patterns.push({
          name: 'Gravestone Doji',
          type: 'BEARISH',
          reliability: nearResistance ? 88 : 70,
          description: 'Strong upper rejection at key level indicating seller resistance',
          contextualSignificance: nearResistance ? 'HIGH' : 'MEDIUM',
        });
      } else {
        patterns.push({
          name: 'Doji (Indecision)',
          type: 'NEUTRAL',
          reliability: 60,
          description: 'Equilibrium between buyers and sellers; watch next breakout',
          contextualSignificance: 'MEDIUM',
        });
      }
    }

    // 2. HAMMER & INVERTED HAMMER
    if (bodyRatio >= 0.15 && bodyRatio <= 0.4) {
      if (lowerWick >= body * 2 && upperWick <= body * 0.4) {
        patterns.push({
          name: 'Hammer',
          type: 'BULLISH',
          reliability: nearSupport ? 85 : 68,
          description: 'Long lower shadow with small upper body; aggressive buyers absorbed drop',
          contextualSignificance: nearSupport ? 'HIGH' : 'MEDIUM',
        });
      } else if (upperWick >= body * 2 && lowerWick <= body * 0.4) {
        patterns.push({
          name: 'Shooting Star',
          type: 'BEARISH',
          reliability: nearResistance ? 85 : 68,
          description: 'Long upper shadow with rejection at highs; aggressive sellers overwhelmed buyers',
          contextualSignificance: nearResistance ? 'HIGH' : 'MEDIUM',
        });
      }
    }

    // 3. PIN BAR / REJECTION CANDLE
    if (lowerWick >= range * 0.6) {
      patterns.push({
        name: 'Bullish Rejection Pin Bar',
        type: 'BULLISH',
        reliability: nearSupport ? 90 : 75,
        description: 'Significant liquidity sweep and wick rejection below value area',
        contextualSignificance: nearSupport ? 'HIGH' : 'MEDIUM',
      });
    } else if (upperWick >= range * 0.6) {
      patterns.push({
        name: 'Bearish Rejection Pin Bar',
        type: 'BEARISH',
        reliability: nearResistance ? 90 : 75,
        description: 'Significant liquidity sweep and wick rejection above value area',
        contextualSignificance: nearResistance ? 'HIGH' : 'MEDIUM',
      });
    }

    // 4. MARUBOZU (MOMENTUM EXPANSION)
    if (bodyRatio > 0.85) {
      patterns.push({
        name: isBullish ? 'Bullish Marubozu' : 'Bearish Marubozu',
        type: isBullish ? 'BULLISH' : 'BEARISH',
        reliability: 82,
        description: `${isBullish ? 'Dominant buying' : 'Dominant selling'} expansion with zero or minimal wicks`,
        contextualSignificance: 'HIGH',
      });
    }

    // 5. MULTI-CANDLE PATTERNS (Engulfing, Inside Bar, Morning/Evening Star)
    if (prev1) {
      const prevRange = prev1.high - prev1.low;
      const prevBody = Math.abs(prev1.close - prev1.open);
      const prevBullish = prev1.close >= prev1.open;

      // Bullish Engulfing
      if (!prevBullish && isBullish && current.close > prev1.open && current.open <= prev1.close) {
        patterns.push({
          name: 'Bullish Engulfing',
          type: 'BULLISH',
          reliability: nearSupport ? 89 : 76,
          description: 'Bullish candle body completely overtakes preceding bearish body',
          contextualSignificance: nearSupport ? 'HIGH' : 'MEDIUM',
        });
      }

      // Bearish Engulfing
      if (prevBullish && !isBullish && current.close < prev1.open && current.open >= prev1.close) {
        patterns.push({
          name: 'Bearish Engulfing',
          type: 'BEARISH',
          reliability: nearResistance ? 89 : 76,
          description: 'Bearish candle body completely engulfs preceding bullish momentum',
          contextualSignificance: nearResistance ? 'HIGH' : 'MEDIUM',
        });
      }

      // Inside Bar
      if (current.high < prev1.high && current.low > prev1.low) {
        patterns.push({
          name: 'Inside Bar (Compression)',
          type: 'NEUTRAL',
          reliability: 65,
          description: 'Volatility contraction inside mother bar range; preparation for expansion',
          contextualSignificance: 'MEDIUM',
        });
      }

      // Outside Bar
      if (current.high > prev1.high && current.low < prev1.low) {
        patterns.push({
          name: isBullish ? 'Bullish Outside Bar' : 'Bearish Outside Bar',
          type: isBullish ? 'BULLISH' : 'BEARISH',
          reliability: 78,
          description: 'Range expansion that sweeps both sides of previous bar before directional close',
          contextualSignificance: 'HIGH',
        });
      }

      // Morning Star (3-bar)
      if (prev2) {
        const prev2Bearish = prev2.close < prev2.open;
        const prev1DojiOrSmall = prevBody < (prev2.high - prev2.low) * 0.35;
        if (prev2Bearish && prev1DojiOrSmall && isBullish && current.close > (prev2.open + prev2.close) / 2) {
          patterns.push({
            name: 'Morning Star',
            type: 'BULLISH',
            reliability: nearSupport ? 92 : 80,
            description: 'Three-bar bottom reversal confirming bullish momentum shift',
            contextualSignificance: 'HIGH',
          });
        }

        // Evening Star (3-bar)
        const prev2Bullish = prev2.close > prev2.open;
        if (prev2Bullish && prev1DojiOrSmall && !isBullish && current.close < (prev2.open + prev2.close) / 2) {
          patterns.push({
            name: 'Evening Star',
            type: 'BEARISH',
            reliability: nearResistance ? 92 : 80,
            description: 'Three-bar top reversal confirming exhaustion of bullish advance',
            contextualSignificance: 'HIGH',
          });
        }
      }
    }

    return patterns;
  }
}
