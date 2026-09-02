/**
 * Liquidity Engine
 * Identifies Equal Highs/Lows, Swing Liquidity Pools, Order Blocks, and Rejection Levels
 */

import { FootprintBar } from '../../../src/types/market';
import { LiquidityZone } from '../../../src/types/ai';

export class LiquidityEngine {
  public static detectZones(candles: FootprintBar[], tickSize: number = 0.0001): LiquidityZone[] {
    const zones: LiquidityZone[] = [];
    if (!candles || candles.length < 10) return zones;

    const currentBar = candles[candles.length - 1];
    const threshold = tickSize * 3;

    // 1. Detect Equal Highs (EQH) - Buy-Side Liquidity
    for (let i = 2; i < candles.length - 2; i++) {
      for (let j = i + 2; j < candles.length; j++) {
        const diff = Math.abs(candles[i].high - candles[j].high);
        if (diff <= threshold) {
          const highPrice = Math.max(candles[i].high, candles[j].high);
          const swept = currentBar.high > highPrice + tickSize;
          zones.push({
            id: `eqh_${candles[i].time}_${candles[j].time}`,
            type: 'EQUAL_HIGHS',
            priceHigh: parseFloat((highPrice + tickSize * 2).toFixed(5)),
            priceLow: parseFloat((highPrice - tickSize * 2).toFixed(5)),
            midPrice: highPrice,
            touches: 2,
            status: swept ? 'SWEPT' : currentBar.close > highPrice ? 'TESTED' : 'FRESH',
            strength: 86,
            label: `Equal Highs (Buy-Side Liq @ ${highPrice.toFixed(5)})`,
            timestamp: candles[j].time,
          });
          break; // Avoid duplicate combinations
        }
      }
    }

    // 2. Detect Equal Lows (EQL) - Sell-Side Liquidity
    for (let i = 2; i < candles.length - 2; i++) {
      for (let j = i + 2; j < candles.length; j++) {
        const diff = Math.abs(candles[i].low - candles[j].low);
        if (diff <= threshold) {
          const lowPrice = Math.min(candles[i].low, candles[j].low);
          const swept = currentBar.low < lowPrice - tickSize;
          zones.push({
            id: `eql_${candles[i].time}_${candles[j].time}`,
            type: 'EQUAL_LOWS',
            priceHigh: parseFloat((lowPrice + tickSize * 2).toFixed(5)),
            priceLow: parseFloat((lowPrice - tickSize * 2).toFixed(5)),
            midPrice: lowPrice,
            touches: 2,
            status: swept ? 'SWEPT' : currentBar.close < lowPrice ? 'TESTED' : 'FRESH',
            strength: 86,
            label: `Equal Lows (Sell-Side Liq @ ${lowPrice.toFixed(5)})`,
            timestamp: candles[j].time,
          });
          break;
        }
      }
    }

    // 3. Detect Institutional Order Blocks (OB)
    // Bullish OB: Last down candle before sharp expansion up
    for (let i = 3; i < candles.length - 2; i++) {
      const c = candles[i];
      const next1 = candles[i + 1];
      const next2 = candles[i + 2];

      const isDownCandle = c.close < c.open;
      const sharpUpExpansion = next1.close > c.high && next2.close > next1.close;

      if (isDownCandle && sharpUpExpansion) {
        const tested = currentBar.low <= c.high && currentBar.low >= c.low;
        const mitigated = currentBar.close < c.low;
        zones.push({
          id: `bull_ob_${c.time}`,
          type: 'ORDER_BLOCK_BULL',
          priceHigh: c.high,
          priceLow: c.low,
          midPrice: parseFloat(((c.high + c.low) / 2).toFixed(5)),
          touches: tested ? 2 : 1,
          status: mitigated ? 'SWEPT' : tested ? 'TESTED' : 'FRESH',
          strength: 90,
          label: `Bullish Demand OB (${c.low.toFixed(5)} - ${c.high.toFixed(5)})`,
          timestamp: c.time,
        });
      }

      // Bearish OB: Last up candle before sharp expansion down
      const isUpCandle = c.close > c.open;
      const sharpDownExpansion = next1.close < c.low && next2.close < next1.close;

      if (isUpCandle && sharpDownExpansion) {
        const tested = currentBar.high >= c.low && currentBar.high <= c.high;
        const mitigated = currentBar.close > c.high;
        zones.push({
          id: `bear_ob_${c.time}`,
          type: 'ORDER_BLOCK_BEAR',
          priceHigh: c.high,
          priceLow: c.low,
          midPrice: parseFloat(((c.high + c.low) / 2).toFixed(5)),
          touches: tested ? 2 : 1,
          status: mitigated ? 'SWEPT' : tested ? 'TESTED' : 'FRESH',
          strength: 90,
          label: `Bearish Supply OB (${c.low.toFixed(5)} - ${c.high.toFixed(5)})`,
          timestamp: c.time,
        });
      }
    }

    // Sort by recent timestamp and take top 8 most relevant zones
    return zones
      .filter(z => z.status !== 'SWEPT')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8);
  }
}
