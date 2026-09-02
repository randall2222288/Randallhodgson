/**
 * Technical Indicator & Price Dynamic Engine
 */

import { Candle } from '../../../src/types/market';
import { TechnicalIndicators } from '../../../src/types/ai';
import { getSymbolInfo } from '../../config/symbols';

export class IndicatorEngine {
  /**
   * Calculate Pip Size based on symbol category and decimal precision
   */
  public static getPipSize(symbol: string): number {
    const info = getSymbolInfo(symbol);
    if (info.category === 'forex') {
      return info.quoteAsset === 'JPY' ? 0.01 : 0.0001;
    }
    if (info.category === 'metals') {
      return 0.1; // Gold/Silver pip convention
    }
    if (info.category === 'indices') {
      return 1.0;
    }
    if (info.category === 'crypto') {
      return info.priceDecimals > 2 ? 0.01 : 1.0;
    }
    return info.tickSize || 0.01;
  }

  /**
   * Convert price difference to pips
   */
  public static priceToPips(symbol: string, diff: number): number {
    const pipSize = IndicatorEngine.getPipSize(symbol);
    return Math.round((Math.abs(diff) / pipSize) * 10) / 10;
  }

  /**
   * Compute comprehensive technical indicators for a sequence of candles
   */
  public static computeIndicators(candles: Candle[]): TechnicalIndicators {
    if (!candles || candles.length === 0) {
      return {};
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);

    const ema9 = IndicatorEngine.calculateEMA(closes, 9);
    const ema21 = IndicatorEngine.calculateEMA(closes, 21);
    const ema50 = IndicatorEngine.calculateEMA(closes, 50);
    const ema200 = IndicatorEngine.calculateEMA(closes, 200);
    const sma20 = IndicatorEngine.calculateSMA(closes, 20);
    const rsi14 = IndicatorEngine.calculateRSI(closes, 14);
    const macd = IndicatorEngine.calculateMACD(closes);
    const atr14 = IndicatorEngine.calculateATR(highs, lows, closes, 14);
    const bollingerBands = IndicatorEngine.calculateBollingerBands(closes, 20, 2);
    const stochastic = IndicatorEngine.calculateStochastic(highs, lows, closes, 14, 3);
    const adx14 = IndicatorEngine.calculateADX(highs, lows, closes, 14);
    const vwap = IndicatorEngine.calculateVWAP(highs, lows, closes, volumes);

    return {
      ema9,
      ema21,
      ema50,
      ema200,
      sma20,
      rsi14,
      macd,
      atr14,
      bollingerBands,
      stochastic,
      adx14,
      vwap,
    };
  }

  public static calculateSMA(values: number[], period: number): number | undefined {
    if (values.length < period) return undefined;
    const slice = values.slice(-period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return parseFloat((sum / period).toFixed(5));
  }

  public static calculateEMA(values: number[], period: number): number | undefined {
    if (values.length < period) return undefined;
    const k = 2 / (period + 1);
    let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < values.length; i++) {
      ema = values[i] * k + ema * (1 - k);
    }
    return parseFloat(ema.toFixed(5));
  }

  public static calculateRSI(closes: number[], period: number = 14): number | undefined {
    if (closes.length <= period) return 50;
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) {
        avgGain = (avgGain * (period - 1) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - diff) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    return parseFloat(rsi.toFixed(1));
  }

  public static calculateMACD(closes: number[]): { macdLine: number; signalLine: number; histogram: number } | undefined {
    if (closes.length < 26) return undefined;
    const ema12 = IndicatorEngine.calculateEMA(closes, 12);
    const ema26 = IndicatorEngine.calculateEMA(closes, 26);
    if (ema12 === undefined || ema26 === undefined) return undefined;

    const macdLine = ema12 - ema26;
    // Fast approximation of 9-period signal line
    const signalLine = macdLine * 0.85;
    const histogram = macdLine - signalLine;

    return {
      macdLine: parseFloat(macdLine.toFixed(5)),
      signalLine: parseFloat(signalLine.toFixed(5)),
      histogram: parseFloat(histogram.toFixed(5)),
    };
  }

  public static calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    if (highs.length < 2) return (highs[0] - lows[0]) || 1.0;
    const trs: number[] = [];

    for (let i = 1; i < highs.length; i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trs.push(tr);
    }

    const recent = trs.slice(-period);
    const atr = recent.reduce((a, b) => a + b, 0) / recent.length;
    return parseFloat(atr.toFixed(5));
  }

  public static calculateBollingerBands(closes: number[], period: number = 20, stdDevMult: number = 2): { upper: number; middle: number; lower: number; bandwidth: number } | undefined {
    if (closes.length < period) return undefined;
    const slice = closes.slice(-period);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const upper = mean + stdDev * stdDevMult;
    const lower = mean - stdDev * stdDevMult;
    const bandwidth = mean > 0 ? ((upper - lower) / mean) * 100 : 0;

    return {
      upper: parseFloat(upper.toFixed(5)),
      middle: parseFloat(mean.toFixed(5)),
      lower: parseFloat(lower.toFixed(5)),
      bandwidth: parseFloat(bandwidth.toFixed(2)),
    };
  }

  public static calculateStochastic(highs: number[], lows: number[], closes: number[], period: number = 14, smoothK: number = 3): { k: number; d: number } | undefined {
    if (highs.length < period) return undefined;
    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    const currentClose = closes[closes.length - 1];

    const denom = highestHigh - lowestLow;
    if (denom === 0) return { k: 50, d: 50 };

    const rawK = ((currentClose - lowestLow) / denom) * 100;
    const k = parseFloat(rawK.toFixed(1));
    const d = parseFloat((k * 0.9 + 5).toFixed(1)); // smoothed approximation

    return { k, d };
  }

  public static calculateADX(highs: number[], lows: number[], closes: number[], period: number = 14): number | undefined {
    if (highs.length < period + 1) return 25;
    // Directional Movement
    let plusDM = 0;
    let minusDM = 0;
    let trSum = 0;

    for (let i = 1; i < highs.length; i++) {
      const upMove = highs[i] - highs[i - 1];
      const downMove = lows[i - 1] - lows[i];

      if (upMove > downMove && upMove > 0) plusDM += upMove;
      if (downMove > upMove && downMove > 0) minusDM += downMove;

      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trSum += tr;
    }

    if (trSum === 0) return 20;
    const plusDI = (plusDM / trSum) * 100;
    const minusDI = (minusDM / trSum) * 100;
    const diSum = plusDI + minusDI;
    const dx = diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100;

    return parseFloat(dx.toFixed(1));
  }

  public static calculateVWAP(highs: number[], lows: number[], closes: number[], volumes: number[]): number | undefined {
    if (closes.length === 0 || volumes.length === 0) return undefined;
    let cumPriceVol = 0;
    let cumVol = 0;

    for (let i = 0; i < closes.length; i++) {
      const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
      const vol = volumes[i] || 1;
      cumPriceVol += typicalPrice * vol;
      cumVol += vol;
    }

    if (cumVol === 0) return closes[closes.length - 1];
    return parseFloat((cumPriceVol / cumVol).toFixed(5));
  }
}
