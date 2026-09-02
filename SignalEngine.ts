/**
 * AI Signal & Risk Management Engine
 * Generates High-Confluence BUY, SELL, or WAIT Signals with Dynamic SL/TP and Reasoning
 */

import { FootprintBar } from '../../../src/types/market';
import {
  AISignal,
  CandleAnalysis,
  LiquidityZone,
  MarketStructure,
  MultiTimeframeAnalysis,
  RiskLevel,
  SignalQuality,
  SignalType,
  TechnicalIndicators,
} from '../../../src/types/ai';

export class SignalEngine {
  public static generateSignal(
    candleAnalysis: CandleAnalysis,
    structure: MarketStructure,
    mtf: MultiTimeframeAnalysis,
    liquidityZones: LiquidityZone[],
    indicators: TechnicalIndicators,
    currentBar: FootprintBar
  ): AISignal {
    const symbol = candleAnalysis.symbol;
    const timeframe = candleAnalysis.timeframe;
    const close = candleAnalysis.close;
    const atr = indicators.atr14 || (candleAnalysis.totalRange || 1.0);

    const reasons: string[] = [];
    let buyPoints = 0;
    let sellPoints = 0;

    // 1. Evaluate Multi-Timeframe Alignment
    if (mtf.alignmentStatus === 'STRONG_ALIGNMENT') {
      if (mtf.macroTrend === 'BULLISH') {
        buyPoints += 25;
        reasons.push(`✓ Multi-Timeframe strong bullish confluence (${mtf.alignmentScore}%)`);
      } else if (mtf.macroTrend === 'BEARISH') {
        sellPoints += 25;
        reasons.push(`✓ Multi-Timeframe strong bearish confluence (${mtf.alignmentScore}%)`);
      }
    } else if (mtf.hasConflict) {
      reasons.push(`⚠ MTF conflict detected (${mtf.macroTrend} macro vs ${mtf.entryTrend} entry)`);
    }

    // 2. Evaluate Market Structure & BOS
    if (structure.breakOfStructure.detected) {
      if (structure.breakOfStructure.type === 'BULLISH') {
        buyPoints += 25;
        reasons.push(`✓ Bullish Break of Structure (BOS) confirmed above ${structure.breakOfStructure.level.toFixed(5)}`);
      } else if (structure.breakOfStructure.type === 'BEARISH') {
        sellPoints += 25;
        reasons.push(`✓ Bearish Break of Structure (BOS) confirmed below ${structure.breakOfStructure.level.toFixed(5)}`);
      }
    } else if (structure.changeOfCharacter.detected) {
      if (structure.changeOfCharacter.type === 'BULLISH') {
        buyPoints += 20;
        reasons.push(`✓ Bullish Change of Character (CHoCH) structural reversal`);
      } else if (structure.changeOfCharacter.type === 'BEARISH') {
        sellPoints += 20;
        reasons.push(`✓ Bearish Change of Character (CHoCH) structural reversal`);
      }
    }

    // 3. Evaluate Candle Strength & Price Action
    if (candleAnalysis.candleStrengthScore >= 75) {
      if (candleAnalysis.direction === 'BULLISH') {
        buyPoints += 20;
        reasons.push(`✓ Candle Strength ${candleAnalysis.candleStrengthScore}/100 with ${candleAnalysis.buyingPressure}% buying pressure`);
      } else if (candleAnalysis.direction === 'BEARISH') {
        sellPoints += 20;
        reasons.push(`✓ Candle Strength ${candleAnalysis.candleStrengthScore}/100 with ${candleAnalysis.sellingPressure}% selling pressure`);
      }
    }

    // 4. Evaluate Order Flow & Delta
    if (currentBar.delta > 0 && currentBar.imbalanceCount > 0) {
      buyPoints += 15;
      reasons.push(`✓ Order flow positive delta (+${currentBar.delta}) with ${currentBar.imbalanceCount} buy imbalances`);
    } else if (currentBar.delta < 0 && currentBar.imbalanceCount > 0) {
      sellPoints += 15;
      reasons.push(`✓ Order flow negative delta (${currentBar.delta}) with ${currentBar.imbalanceCount} sell imbalances`);
    }

    // 5. Evaluate Liquidity Zones & Order Blocks
    const bullOB = liquidityZones.find(z => z.type === 'ORDER_BLOCK_BULL' && z.status === 'FRESH');
    const bearOB = liquidityZones.find(z => z.type === 'ORDER_BLOCK_BEAR' && z.status === 'FRESH');

    if (bullOB && Math.abs(close - bullOB.midPrice) < atr * 1.5) {
      buyPoints += 15;
      reasons.push(`✓ Institutional Demand Order Block support near ${bullOB.midPrice.toFixed(5)}`);
    }
    if (bearOB && Math.abs(close - bearOB.midPrice) < atr * 1.5) {
      sellPoints += 15;
      reasons.push(`✓ Institutional Supply Order Block resistance near ${bearOB.midPrice.toFixed(5)}`);
    }

    // 6. Decide Signal (BUY, SELL, or WAIT)
    let signal: SignalType = 'WAIT';
    let confidenceScore = 50;

    if (buyPoints >= 65 && buyPoints > sellPoints + 30 && !mtf.hasConflict) {
      signal = 'BUY';
      confidenceScore = Math.min(96, Math.max(65, buyPoints));
    } else if (sellPoints >= 65 && sellPoints > buyPoints + 30 && !mtf.hasConflict) {
      signal = 'SELL';
      confidenceScore = Math.min(96, Math.max(65, sellPoints));
    } else {
      signal = 'WAIT';
      confidenceScore = Math.max(buyPoints, sellPoints);
      if (reasons.length === 0) {
        reasons.push('Market in consolidation; waiting for higher-timeframe breakout or order flow imbalance');
      }
    }

    // 7. Calculate Dynamic Stop Loss & Take Profits
    let stopLoss = close;
    let takeProfit: number[] = [];
    let riskRewardRatio = '1:2.0';
    let invalidationLevel = close;

    const buffer = atr * 0.4;
    const entryMin = parseFloat((close - atr * 0.15).toFixed(5));
    const entryMax = parseFloat((close + atr * 0.15).toFixed(5));

    if (signal === 'BUY') {
      stopLoss = parseFloat((Math.min(currentBar.low, structure.keySupport) - buffer).toFixed(5));
      const risk = Math.max(atr * 0.5, close - stopLoss);
      takeProfit = [
        parseFloat((close + risk * 1.5).toFixed(5)),
        parseFloat((close + risk * 2.5).toFixed(5)),
        parseFloat((close + risk * 4.0).toFixed(5)),
      ];
      riskRewardRatio = `1:${(2.5).toFixed(1)}`;
      invalidationLevel = stopLoss;
    } else if (signal === 'SELL') {
      stopLoss = parseFloat((Math.max(currentBar.high, structure.keyResistance) + buffer).toFixed(5));
      const risk = Math.max(atr * 0.5, stopLoss - close);
      takeProfit = [
        parseFloat((close - risk * 1.5).toFixed(5)),
        parseFloat((close - risk * 2.5).toFixed(5)),
        parseFloat((close - risk * 4.0).toFixed(5)),
      ];
      riskRewardRatio = `1:${(2.5).toFixed(1)}`;
      invalidationLevel = stopLoss;
    } else {
      // WAIT defaults
      stopLoss = parseFloat((close - atr * 1.5).toFixed(5));
      takeProfit = [
        parseFloat((close + atr * 2.0).toFixed(5)),
        parseFloat((close + atr * 3.5).toFixed(5)),
      ];
      invalidationLevel = structure.keySupport;
    }

    // 8. Quality & Risk Classification
    let riskLevel: RiskLevel = 'MEDIUM';
    if (confidenceScore >= 85 && mtf.alignmentStatus === 'STRONG_ALIGNMENT') riskLevel = 'LOW';
    else if (mtf.hasConflict || confidenceScore < 60) riskLevel = 'HIGH';

    let signalQuality: SignalQuality = 'MEDIUM';
    if (confidenceScore >= 80 && reasons.length >= 3) signalQuality = 'HIGH';
    else if (confidenceScore < 65) signalQuality = 'LOW';

    return {
      id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      symbol,
      timeframe,
      signal,
      entryPrice: close,
      entryZone: {
        min: entryMin,
        max: entryMax,
      },
      stopLoss,
      takeProfit,
      riskRewardRatio,
      confidenceScore,
      bullishProbability: candleAnalysis.bullishProbability,
      bearishProbability: candleAnalysis.bearishProbability,
      neutralProbability: candleAnalysis.neutralProbability,
      candleStrength: candleAnalysis.candleStrengthScore,
      trend: structure.trend,
      momentum: candleAnalysis.momentum,
      structure: structure.structureSequence,
      mtfAlignment: mtf.alignmentStatus,
      riskLevel,
      signalQuality,
      reasoning: reasons,
      invalidationLevel,
      result: {
        status: 'PENDING',
      },
    };
  }
}
