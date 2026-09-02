/**
 * Ultra-Fast High-Frequency Rule Engine Provider
 * Provides instant real-time computation without external network latency
 */

import { AIProvider } from './AIProvider';
import { StructuredAIResponse, StructuredMarketContext } from '../../../src/types/ai';

export class RuleEngineProvider implements AIProvider {
  public name = 'Quantitative Rule Engine';

  public isAvailable(): boolean {
    return true;
  }

  public async analyzeMarket(context: StructuredMarketContext): Promise<StructuredAIResponse> {
    const { marketStructure, currentCandle, orderFlow, multiTimeframe, volatility } = context;

    let buyScore = 0;
    let sellScore = 0;
    const reasons: string[] = [];

    // 1. Structure
    if (marketStructure.trend === 'BULLISH') {
      buyScore += 30;
      reasons.push('Market structure is bullish with intact higher highs & higher lows');
    } else if (marketStructure.trend === 'BEARISH') {
      sellScore += 30;
      reasons.push('Market structure is bearish with intact lower highs & lower lows');
    }

    if (marketStructure.breakOfStructure.detected) {
      if (marketStructure.breakOfStructure.type === 'BULLISH') {
        buyScore += 25;
        reasons.push(`Bullish BOS breakout above ${marketStructure.breakOfStructure.level.toFixed(5)}`);
      } else if (marketStructure.breakOfStructure.type === 'BEARISH') {
        sellScore += 25;
        reasons.push(`Bearish BOS breakdown below ${marketStructure.breakOfStructure.level.toFixed(5)}`);
      }
    }

    // 2. MTF Alignment
    if (multiTimeframe.alignmentStatus === 'STRONG_ALIGNMENT') {
      if (multiTimeframe.macroTrend === 'BULLISH') {
        buyScore += 25;
        reasons.push(`Strong MTF confluence across 1m, 5m, 15m, 1H (${multiTimeframe.alignmentScore}%)`);
      } else if (multiTimeframe.macroTrend === 'BEARISH') {
        sellScore += 25;
        reasons.push(`Strong MTF confluence across 1m, 5m, 15m, 1H (${multiTimeframe.alignmentScore}%)`);
      }
    } else if (multiTimeframe.hasConflict) {
      reasons.push('Conflicted timeframes detected; risk is elevated');
    }

    // 3. Order Flow Delta
    if (orderFlow.delta > 0) {
      buyScore += 15;
      reasons.push(`Positive order flow delta (+${orderFlow.delta.toLocaleString()})`);
    } else if (orderFlow.delta < 0) {
      sellScore += 15;
      reasons.push(`Negative order flow delta (${orderFlow.delta.toLocaleString()})`);
    }

    // 4. Decision
    let signal: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
    let confidence = 50;

    if (buyScore >= 65 && buyScore > sellScore + 25 && !multiTimeframe.hasConflict) {
      signal = 'BUY';
      confidence = Math.min(95, buyScore);
    } else if (sellScore >= 65 && sellScore > buyScore + 25 && !multiTimeframe.hasConflict) {
      signal = 'SELL';
      confidence = Math.min(95, sellScore);
    } else {
      signal = 'WAIT';
      confidence = Math.max(buyScore, sellScore);
      if (reasons.length === 0) {
        reasons.push('Market in consolidation; waiting for structural confirmation');
      }
    }

    const close = currentCandle ? currentCandle.close : 1000;
    const atr = volatility.atr || (close * 0.005);

    const stopLoss = signal === 'BUY' ? close - atr * 1.5 : signal === 'SELL' ? close + atr * 1.5 : close - atr;
    const risk = Math.abs(close - stopLoss);
    const takeProfit = signal === 'BUY'
      ? [close + risk * 1.5, close + risk * 2.5, close + risk * 4.0]
      : signal === 'SELL'
      ? [close - risk * 1.5, close - risk * 2.5, close - risk * 4.0]
      : [close + atr * 1.5, close + atr * 3.0, close + atr * 4.5];

    let bullishProb = 33;
    let bearishProb = 33;
    let neutralProb = 34;

    if (signal === 'BUY') {
      bullishProb = 64;
      bearishProb = 22;
      neutralProb = 14;
    } else if (signal === 'SELL') {
      bearishProb = 64;
      bullishProb = 22;
      neutralProb = 14;
    }

    const marketScore = Math.round((buyScore + (100 - sellScore)) / 2);

    return {
      signal,
      confidence,
      bullishProbability: bullishProb,
      bearishProbability: bearishProb,
      neutralProbability: neutralProb,
      continuationProbability: confidence >= 75 ? 70 : 45,
      reversalProbability: confidence >= 75 ? 18 : 35,
      marketState: marketStructure.trend,
      candleStrength: Math.min(98, Math.max(20, confidence)),
      riskLevel: multiTimeframe.hasConflict ? 'HIGH' : confidence > 80 ? 'LOW' : 'MEDIUM',
      signalQuality: confidence >= 80 ? 'HIGH' : confidence >= 65 ? 'MEDIUM' : 'LOW',
      reasoning: reasons,
      entryZone: {
        min: parseFloat((close - atr * 0.15).toFixed(5)),
        max: parseFloat((close + atr * 0.15).toFixed(5)),
      },
      stopLoss: parseFloat(stopLoss.toFixed(5)),
      takeProfit: takeProfit.map(tp => parseFloat(tp.toFixed(5))),
      invalidationLevel: parseFloat(stopLoss.toFixed(5)),
      marketScore,
      aiInterpretation: `Analytical evaluation indicates ${signal} bias (${confidence}% confidence) based on ${marketStructure.trend} structure and ${multiTimeframe.alignmentStatus}.`,
    };
  }
}
