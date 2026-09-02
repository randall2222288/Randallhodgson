/**
 * Custom Calculation Engine for Order Flow Intelligence
 * Computes live Aggression, Absorption, Pressure, Confluences, Probabilities, and Explanations
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { useTerminal } from '../../../hooks/useTerminal';
import { getClientSymbolInfo } from '../../../config/symbols';
import {
  AggressionLevel,
  AbsorptionStatus,
  MarketPressureState,
  CandleDirection,
  CandleStrengthLevel,
  ConfluenceVerdict,
  ConfluenceItem,
  DataQualityRating,
  IntelligenceAlert,
  IntelligenceConfig,
} from './types';

export function useOrderFlowCalculations(config: IntelligenceConfig) {
  const terminal = useTerminal();
  const {
    symbol,
    timeframe,
    status,
    isRealData,
    activeBar,
    historicalBars,
    stats,
    aiState,
    recentTrades,
    isAiAnalyzing,
  } = terminal;

  const symbolInfo = useMemo(() => getClientSymbolInfo(symbol), [symbol]);
  const isDecentralized = symbolInfo.isDecentralizedOrQuoteOnly;

  // Track live update timer / tick latency
  const [lastUpdateAgo, setLastUpdateAgo] = useState<string>('00:00:00');
  const lastTickTimeRef = useRef<number>(Date.now());
  const prevDeltaRef = useRef<number>(stats.delta);
  const prevPressureStateRef = useRef<MarketPressureState>('NEUTRAL');
  const [alerts, setAlerts] = useState<IntelligenceAlert[]>([]);

  // Update tick timer
  useEffect(() => {
    lastTickTimeRef.current = Date.now();
  }, [stats.price, stats.delta, activeBar?.volume]);

  useEffect(() => {
    const interval = setInterval(() => {
      const diffSec = Math.floor((Date.now() - lastTickTimeRef.current) / 1000);
      const mm = String(Math.floor(diffSec / 60)).padStart(2, '0');
      const ss = String(diffSec % 60).padStart(2, '0');
      setLastUpdateAgo(`00:${mm}:${ss}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 1. Data Quality
  const dataQuality: DataQualityRating = useMemo(() => {
    if (status !== 'LIVE') return 'LOW';
    if (!activeBar || historicalBars.length < 5) return 'LOW';
    if (isDecentralized) return 'MEDIUM';
    if (isRealData && activeBar.levels.length > 0) return 'HIGH';
    return 'MEDIUM';
  }, [status, activeBar, historicalBars.length, isDecentralized, isRealData]);

  // 2. Buy vs Sell Volume & Delta
  const buyVolume = activeBar ? activeBar.buyVolume : 0;
  const sellVolume = activeBar ? activeBar.sellVolume : 0;
  const totalVolume = activeBar ? activeBar.volume : 0;
  const currentDelta = activeBar ? activeBar.delta : stats.delta;

  // 3. Cumulative Delta by Period
  const cumulativeDelta = useMemo(() => {
    if (config.cumulativeDeltaPeriod === 'candle') {
      return currentDelta;
    }
    if (config.cumulativeDeltaPeriod === 'visible') {
      const recentSlice = historicalBars.slice(-15);
      const histSum = recentSlice.reduce((acc, b) => acc + (b.delta || 0), 0);
      return histSum + currentDelta;
    }
    // Default session CVD
    return stats.cvd || 0;
  }, [config.cumulativeDeltaPeriod, currentDelta, historicalBars, stats.cvd]);

  // 4. Buying Pressure vs Selling Pressure (%)
  const { buyingPressure, sellingPressure } = useMemo(() => {
    if (aiState.currentAnalysis) {
      const bp = aiState.currentAnalysis.buyingPressure;
      const sp = aiState.currentAnalysis.sellingPressure;
      return { buyingPressure: bp, sellingPressure: sp };
    }
    const sum = buyVolume + sellVolume;
    if (sum > 0) {
      const bp = Math.round((buyVolume / sum) * 100);
      return { buyingPressure: bp, sellingPressure: 100 - bp };
    }
    return { buyingPressure: 50, sellingPressure: 50 };
  }, [aiState.currentAnalysis, buyVolume, sellVolume]);

  // 5. Buying Aggression & Selling Aggression
  const { buyingAggression, sellingAggression, buyingAggressionLevel, sellingAggressionLevel } = useMemo(() => {
    // Factors: ask vs bid volume ratio, recent trade delta concentration, imbalance count
    let bAgg = 50;
    let sAgg = 50;

    const totalV = buyVolume + sellVolume;
    if (totalV > 0) {
      const volRatio = buyVolume / totalV;
      bAgg = Math.round(volRatio * 100);
      sAgg = 100 - bAgg;

      // Imbalances boost aggression
      const buyImbalances = activeBar?.levels.filter(l => l.isImbalanceBuy).length || 0;
      const sellImbalances = activeBar?.levels.filter(l => l.isImbalanceSell).length || 0;

      if (buyImbalances > sellImbalances) {
        bAgg = Math.min(96, bAgg + buyImbalances * 4);
        sAgg = Math.max(4, 100 - bAgg);
      } else if (sellImbalances > buyImbalances) {
        sAgg = Math.min(96, sAgg + sellImbalances * 4);
        bAgg = Math.max(4, 100 - sAgg);
      }
    }

    const getLevel = (val: number): AggressionLevel => {
      if (val >= 80) return 'EXTREME';
      if (val >= 65) return 'HIGH';
      if (val >= 40) return 'MODERATE';
      return 'LOW';
    };

    return {
      buyingAggression: bAgg,
      sellingAggression: sAgg,
      buyingAggressionLevel: getLevel(bAgg),
      sellingAggressionLevel: getLevel(sAgg),
    };
  }, [buyVolume, sellVolume, activeBar?.levels]);

  // 6. Absorption Detector
  const {
    buyAbsorptionStrength,
    sellAbsorptionStrength,
    buyAbsorptionDetected,
    sellAbsorptionDetected,
    absorptionExplanation,
  } = useMemo(() => {
    let buyAbs = false;
    let sellAbs = false;
    let buyStrength = 0;
    let sellStrength = 0;
    let explanation = 'No significant aggressive absorption observed.';

    if (activeBar && activeBar.levels.length >= 3) {
      const levels = activeBar.levels;
      const lowest = levels[levels.length - 1];
      const highest = levels[0];

      // Buy absorption: Heavy selling at low of bar, yet price is closing above it
      if (lowest && lowest.bidVolume >= config.absorptionThresholdVolume && activeBar.close > lowest.price) {
        buyAbs = true;
        buyStrength = Math.min(95, Math.round(50 + (lowest.bidVolume / (config.absorptionThresholdVolume || 1)) * 15));
        explanation = 'Venta agresiva absorbida por compradores pasivos (Limit Bids).';
      }

      // Sell absorption: Heavy buying at high of bar, yet price is closing below it
      if (highest && highest.askVolume >= config.absorptionThresholdVolume && activeBar.close < highest.price) {
        sellAbs = true;
        sellStrength = Math.min(95, Math.round(50 + (highest.askVolume / (config.absorptionThresholdVolume || 1)) * 15));
        explanation = 'Compra agresiva absorbida por vendedores pasivos (Limit Asks).';
      }
    }

    // Blend with server stats if available
    if (stats.isAbsorptionDetected && stats.absorptionDescription) {
      if (stats.absorptionDescription.includes('buyer')) {
        buyAbs = true;
        buyStrength = Math.max(buyStrength, 76);
        explanation = 'Venta agresiva absorbida por compradores en el soporte.';
      } else if (stats.absorptionDescription.includes('seller')) {
        sellAbs = true;
        sellStrength = Math.max(sellStrength, 74);
        explanation = 'Compra agresiva absorbida por vendedores en la resistencia.';
      }
    }

    return {
      buyAbsorptionStrength: buyStrength,
      sellAbsorptionStrength: sellStrength,
      buyAbsorptionDetected: buyAbs,
      sellAbsorptionDetected: sellAbs,
      absorptionExplanation: explanation,
    };
  }, [activeBar, config.absorptionThresholdVolume, stats.isAbsorptionDetected, stats.absorptionDescription]);

  // 7. Imbalance Detector
  const { buyImbalancesCount, sellImbalancesCount, imbalanceDominance } = useMemo(() => {
    const levels = activeBar?.levels || [];
    const buyImbs = levels.filter(l => l.isImbalanceBuy).length;
    const sellImbs = levels.filter(l => l.isImbalanceSell).length;

    let dominance: 'BUY_IMBALANCE' | 'SELL_IMBALANCE' | 'BALANCED' = 'BALANCED';
    if (buyImbs > sellImbs + 1) dominance = 'BUY_IMBALANCE';
    else if (sellImbs > buyImbs + 1) dominance = 'SELL_IMBALANCE';

    return {
      buyImbalancesCount: buyImbs,
      sellImbalancesCount: sellImbs,
      imbalanceDominance: dominance,
    };
  }, [activeBar?.levels]);

  // 8. Market Pressure Gauge & State
  const { marketPressureScore, marketPressureState, dominantPressureSide } = useMemo(() => {
    // -100 (Full Sellers) to +100 (Full Buyers)
    const deltaRatio = totalVolume > 0 ? (currentDelta / totalVolume) : 0;
    const boundedDeltaScore = Math.max(-1, Math.min(1, deltaRatio * 2.5));
    const pressureBalance = (buyingPressure - sellingPressure) / 50; // -1 to +1

    const rawScore = Math.round(((boundedDeltaScore * 0.5) + (pressureBalance * 0.5)) * 100);
    const score = Math.max(-100, Math.min(100, rawScore));

    let state: MarketPressureState = 'NEUTRAL';
    if (score >= 60) state = 'STRONG_BUY';
    else if (score >= 20) state = 'BUY';
    else if (score <= -60) state = 'STRONG_SELL';
    else if (score <= -20) state = 'SELL';

    const dominant = score >= 0 ? `BUYERS ${buyingPressure}%` : `SELLERS ${sellingPressure}%`;

    return {
      marketPressureScore: score,
      marketPressureState: state,
      dominantPressureSide: dominant,
    };
  }, [totalVolume, currentDelta, buyingPressure, sellingPressure]);

  // 9. Current Candle Geometry & Strength
  const candleAnalysis = useMemo(() => {
    if (!activeBar) {
      return {
        open: stats.price,
        high: stats.price,
        low: stats.price,
        close: stats.price,
        range: 0,
        bodySize: 0,
        upperWick: 0,
        lowerWick: 0,
        direction: 'NEUTRAL' as CandleDirection,
        strengthScore: 50,
        strengthLevel: 'MODERATE' as CandleStrengthLevel,
      };
    }

    const { open, high, low, close } = activeBar;
    const range = Math.max(high - low, 0.00001);
    const bodySize = Math.abs(close - open);
    const upperWick = high - Math.max(open, close);
    const lowerWick = Math.min(open, close) - low;

    const direction: CandleDirection =
      close > open + 0.000001 ? 'BULLISH' : close < open - 0.000001 ? 'BEARISH' : 'NEUTRAL';

    // Calculate Candle Strength Score (0-100)
    const bodyRatio = bodySize / range;
    let strength = Math.round(bodyRatio * 60);

    // Delta alignment boost
    if ((direction === 'BULLISH' && currentDelta > 0) || (direction === 'BEARISH' && currentDelta < 0)) {
      strength += 25;
    }

    // Volume activity boost
    if (activeBar.volume > 0) {
      strength += 15;
    }

    const boundedStrength = Math.max(15, Math.min(98, strength));

    let strengthLevel: CandleStrengthLevel = 'MODERATE';
    if (boundedStrength >= 80) strengthLevel = 'VERY_STRONG';
    else if (boundedStrength >= 65) strengthLevel = 'STRONG';
    else if (boundedStrength <= 35) strengthLevel = 'WEAK';

    return {
      open,
      high,
      low,
      close,
      range,
      bodySize,
      upperWick,
      lowerWick,
      direction,
      strengthScore: boundedStrength,
      strengthLevel,
    };
  }, [activeBar, stats.price, currentDelta]);

  // 10. Next Candle Probabilities
  const probabilities = useMemo(() => {
    if (aiState.currentAnalysis) {
      return {
        greenProbability: aiState.currentAnalysis.bullishProbability,
        redProbability: aiState.currentAnalysis.bearishProbability,
        neutralProbability: aiState.currentAnalysis.neutralProbability,
        confidenceLevel:
          aiState.currentAnalysis.candleStrengthScore >= 75
            ? 'HIGH CONFIDENCE'
            : aiState.currentAnalysis.candleStrengthScore >= 50
            ? 'NORMAL CONFIDENCE'
            : 'LOW CONFIDENCE',
      };
    }

    // Derive mathematically from Order Flow & Confluence
    let green = 33;
    let red = 33;
    let neutral = 34;

    if (candleAnalysis.direction === 'BULLISH' && currentDelta > 0) {
      green = Math.min(84, Math.round(50 + (buyingPressure - 50) * 0.6));
      red = Math.round((100 - green) * 0.65);
      neutral = 100 - green - red;
    } else if (candleAnalysis.direction === 'BEARISH' && currentDelta < 0) {
      red = Math.min(84, Math.round(50 + (sellingPressure - 50) * 0.6));
      green = Math.round((100 - red) * 0.65);
      neutral = 100 - green - red;
    } else if (buyAbsorptionDetected) {
      green = 68;
      red = 22;
      neutral = 10;
    } else if (sellAbsorptionDetected) {
      red = 68;
      green = 22;
      neutral = 10;
    }

    const conf =
      Math.max(green, red) >= 75
        ? 'HIGH CONFIDENCE'
        : Math.max(green, red) >= 60
        ? 'NORMAL CONFIDENCE'
        : 'LOW CONFIDENCE';

    return {
      greenProbability: green,
      redProbability: red,
      neutralProbability: neutral,
      confidenceLevel: conf,
    };
  }, [
    aiState.currentAnalysis,
    candleAnalysis.direction,
    currentDelta,
    buyingPressure,
    sellingPressure,
    buyAbsorptionDetected,
    sellAbsorptionDetected,
  ]);

  // 11. Confluence Engine
  const confluence = useMemo(() => {
    const isDeltaPos = currentDelta > 0;
    const isDeltaNeg = currentDelta < 0;
    const isBuyAggHigh = buyingAggressionLevel === 'HIGH' || buyingAggressionLevel === 'EXTREME';
    const isSellAggHigh = sellingAggressionLevel === 'HIGH' || sellingAggressionLevel === 'EXTREME';
    const isBullCandle = candleAnalysis.direction === 'BULLISH';
    const isBearCandle = candleAnalysis.direction === 'BEARISH';
    const hasBuyAbs = buyAbsorptionDetected;
    const hasSellAbs = sellAbsorptionDetected;

    const items: ConfluenceItem[] = [
      {
        id: 'delta',
        label: isDeltaPos ? 'Positive Delta (+)' : isDeltaNeg ? 'Negative Delta (-)' : 'Neutral Delta (0)',
        isBullish: isDeltaPos,
        isBearish: isDeltaNeg,
        active: isDeltaPos || isDeltaNeg,
        detail: `Delta ${currentDelta > 0 ? '+' : ''}${currentDelta.toLocaleString()}`,
      },
      {
        id: 'aggression',
        label: isBuyAggHigh ? 'High Buying Aggression' : isSellAggHigh ? 'High Selling Aggression' : 'Balanced Aggression Flow',
        isBullish: isBuyAggHigh,
        isBearish: isSellAggHigh,
        active: isBuyAggHigh || isSellAggHigh,
        detail: `Buy: ${buyingAggression}% | Sell: ${sellingAggression}%`,
      },
      {
        id: 'absorption',
        label: hasBuyAbs ? 'Sell Absorption (Passive Buyers)' : hasSellAbs ? 'Buy Absorption (Passive Sellers)' : 'No Absorption Wall',
        isBullish: hasBuyAbs,
        isBearish: hasSellAbs,
        active: hasBuyAbs || hasSellAbs,
        detail: hasBuyAbs ? `Buy Abs Strength ${buyAbsorptionStrength}%` : hasSellAbs ? `Sell Abs Strength ${sellAbsorptionStrength}%` : 'Clean Flow',
      },
      {
        id: 'candle_dir',
        label: isBullCandle ? 'Bullish Active Candle' : isBearCandle ? 'Bearish Active Candle' : 'Doji / Neutral Candle',
        isBullish: isBullCandle,
        isBearish: isBearCandle,
        active: isBullCandle || isBearCandle,
        detail: `Body Size: ${(candleAnalysis.bodySize).toFixed(symbolInfo.priceDecimals || 2)} (${candleAnalysis.strengthLevel})`,
      },
      {
        id: 'imbalance',
        label: imbalanceDominance === 'BUY_IMBALANCE' ? 'Buy Imbalances Dominance' : imbalanceDominance === 'SELL_IMBALANCE' ? 'Sell Imbalances Dominance' : 'Symmetric Price Levels',
        isBullish: imbalanceDominance === 'BUY_IMBALANCE',
        isBearish: imbalanceDominance === 'SELL_IMBALANCE',
        active: imbalanceDominance !== 'BALANCED',
        detail: `${buyImbalancesCount} Buy Imbs vs ${sellImbalancesCount} Sell Imbs`,
      },
    ];

    const bullishCount = items.filter(i => i.isBullish).length;
    const bearishCount = items.filter(i => i.isBearish).length;

    let verdict: ConfluenceVerdict = 'MIXED_CONDITIONS';
    if (dataQuality === 'LOW') {
      verdict = 'INSUFFICIENT_DATA';
    } else if (bullishCount >= 3 && bearishCount <= 1) {
      verdict = 'HIGH_BULLISH';
    } else if (bearishCount >= 3 && bullishCount <= 1) {
      verdict = 'HIGH_BEARISH';
    }

    return {
      items,
      verdict,
      bullishCount,
      bearishCount,
    };
  }, [
    currentDelta,
    buyingAggressionLevel,
    sellingAggressionLevel,
    buyingAggression,
    sellingAggression,
    candleAnalysis,
    buyAbsorptionDetected,
    sellAbsorptionDetected,
    buyAbsorptionStrength,
    sellAbsorptionStrength,
    imbalanceDominance,
    buyImbalancesCount,
    sellImbalancesCount,
    dataQuality,
    symbolInfo.priceDecimals,
  ]);

  // 12. Dynamic Human Explanations ("WHY?" & "CONCLUSION")
  const explanation = useMemo(() => {
    const reasons: string[] = [];
    if (currentDelta > 0) reasons.push('Delta positivo con compradores absorbiendo la oferta.');
    else if (currentDelta < 0) reasons.push('Delta negativo con vendedores presionando la demanda.');

    if (buyingAggressionLevel === 'HIGH' || buyingAggressionLevel === 'EXTREME') {
      reasons.push(`Agresión compradora elevada (${buyingAggression}%).`);
    } else if (sellingAggressionLevel === 'HIGH' || sellingAggressionLevel === 'EXTREME') {
      reasons.push(`Agresión vendedora elevada (${sellingAggression}%).`);
    }

    if (buyAbsorptionDetected) reasons.push('Presión vendedora absorbida por compradores en niveles clave.');
    if (sellAbsorptionDetected) reasons.push('Presión compradora absorbida por vendedores en niveles clave.');

    if (candleAnalysis.direction === 'BULLISH') reasons.push('Vela activa con cuerpo alcista y buen momentum.');
    else if (candleAnalysis.direction === 'BEARISH') reasons.push('Vela activa con cuerpo bajista y buen momentum.');

    if (reasons.length === 0) {
      reasons.push('Mercado en balance sin desequilibrios agresivos marcados.');
    }

    let conclusion = 'Condiciones de mercado equilibradas; se recomienda esperar confluencia.';
    let bias: 'GREEN' | 'RED' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 50;

    if (confluence.verdict === 'HIGH_BULLISH') {
      conclusion = 'Mayor presión compradora y absorción favorable para continuación alcista.';
      bias = 'GREEN';
      confidence = Math.max(72, probabilities.greenProbability);
    } else if (confluence.verdict === 'HIGH_BEARISH') {
      conclusion = 'Mayor presión vendedora y flujo agresivo bajista predominante.';
      bias = 'RED';
      confidence = Math.max(72, probabilities.redProbability);
    }

    return {
      reasons,
      conclusion,
      nextCandleBias: bias,
      confidence,
    };
  }, [
    currentDelta,
    buyingAggressionLevel,
    sellingAggressionLevel,
    buyingAggression,
    sellingAggression,
    buyAbsorptionDetected,
    sellAbsorptionDetected,
    candleAnalysis.direction,
    confluence.verdict,
    probabilities.greenProbability,
    probabilities.redProbability,
  ]);

  // 13. AI Order Flow Signal & MIN_SIGNAL_CONFIDENCE Gate
  const aiSignalResult = useMemo(() => {
    const minConfidence = config.minSignalConfidence || 70;
    const latest = aiState.latestSignal;

    if (latest) {
      const isValid = latest.confidenceScore >= minConfidence && latest.signal !== 'WAIT';
      return {
        signal: latest.signal,
        isValidSignal: isValid,
        confidence: latest.confidenceScore,
        signalQuality: latest.signalQuality,
        riskLevel: latest.riskLevel,
        reasoning: latest.reasoning || [],
        biasText: latest.signal === 'BUY' ? 'BUY BIAS' : latest.signal === 'SELL' ? 'SELL BIAS' : 'NEUTRAL / WAIT',
        colorBadge: latest.signal === 'BUY' ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' : latest.signal === 'SELL' ? 'text-rose-400 border-rose-500/40 bg-rose-500/10' : 'text-amber-400 border-amber-500/40 bg-amber-500/10',
        thresholdMet: latest.confidenceScore >= minConfidence,
        minConfidence,
      };
    }

    // Fallback derived signal
    const conf = explanation.confidence;
    const isValid = conf >= minConfidence && confluence.verdict !== 'MIXED_CONDITIONS';
    const signal = confluence.verdict === 'HIGH_BULLISH' ? 'BUY' : confluence.verdict === 'HIGH_BEARISH' ? 'SELL' : 'WAIT';

    return {
      signal,
      isValidSignal: isValid,
      confidence: conf,
      signalQuality: conf >= 80 ? ('VERY_HIGH' as const) : conf >= 70 ? ('HIGH' as const) : ('MEDIUM' as const),
      riskLevel: conf >= 75 ? ('LOW' as const) : ('MEDIUM' as const),
      reasoning: explanation.reasons,
      biasText: signal === 'BUY' ? 'BUY BIAS' : signal === 'SELL' ? 'SELL BIAS' : 'NEUTRAL / WAIT',
      colorBadge: signal === 'BUY' ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' : signal === 'SELL' ? 'text-rose-400 border-rose-500/40 bg-rose-500/10' : 'text-amber-400 border-amber-500/40 bg-amber-500/10',
      thresholdMet: conf >= minConfidence,
      minConfidence,
    };
  }, [aiState.latestSignal, config.minSignalConfidence, explanation.confidence, explanation.reasons, confluence.verdict]);

  // 14. Real-Time Visual Alerts Detector
  useEffect(() => {
    // Check Delta Reversal
    if (prevDeltaRef.current < 0 && stats.delta > 50) {
      setAlerts(prev => [
        {
          id: String(Date.now()),
          timestamp: Date.now(),
          type: 'DELTA_REVERSAL',
          title: 'DELTA REVERSAL DETECTED',
          message: 'El flujo agresivo cambió de dirección a COMPRADOR (+).',
          severity: 'bullish',
        },
        ...prev.slice(0, 4),
      ]);
    } else if (prevDeltaRef.current > 0 && stats.delta < -50) {
      setAlerts(prev => [
        {
          id: String(Date.now()),
          timestamp: Date.now(),
          type: 'DELTA_REVERSAL',
          title: 'DELTA REVERSAL DETECTED',
          message: 'El flujo agresivo cambió de dirección a VENDEDOR (-).',
          severity: 'bearish',
        },
        ...prev.slice(0, 4),
      ]);
    }
    prevDeltaRef.current = stats.delta;

    // Check Pressure Reversal
    if (prevPressureStateRef.current.includes('SELL') && marketPressureState.includes('BUY')) {
      setAlerts(prev => [
        {
          id: String(Date.now()),
          timestamp: Date.now(),
          type: 'PRESSURE_REVERSAL',
          title: 'PRESSURE REVERSAL',
          message: 'Dominio de vendedores superado por compradores agresivos.',
          severity: 'bullish',
        },
        ...prev.slice(0, 4),
      ]);
    } else if (prevPressureStateRef.current.includes('BUY') && marketPressureState.includes('SELL')) {
      setAlerts(prev => [
        {
          id: String(Date.now()),
          timestamp: Date.now(),
          type: 'PRESSURE_REVERSAL',
          title: 'PRESSURE REVERSAL',
          message: 'Dominio de compradores superado por vendedores agresivos.',
          severity: 'bearish',
        },
        ...prev.slice(0, 4),
      ]);
    }
    prevPressureStateRef.current = marketPressureState;
  }, [stats.delta, marketPressureState]);

  return {
    symbol,
    timeframe,
    symbolInfo,
    status,
    isRealData,
    isDecentralized,
    lastUpdateAgo,
    dataQuality,
    buyVolume,
    sellVolume,
    totalVolume,
    currentDelta,
    cumulativeDelta,
    buyingPressure,
    sellingPressure,
    buyingAggression,
    sellingAggression,
    buyingAggressionLevel,
    sellingAggressionLevel,
    buyAbsorptionStrength,
    sellAbsorptionStrength,
    buyAbsorptionDetected,
    sellAbsorptionDetected,
    absorptionExplanation,
    buyImbalancesCount,
    sellImbalancesCount,
    imbalanceDominance,
    marketPressureScore,
    marketPressureState,
    dominantPressureSide,
    candleAnalysis,
    probabilities,
    confluence,
    explanation,
    aiSignalResult,
    alerts,
    isAiAnalyzing,
    stats,
    activeBar,
    historicalBars,
    aiState,
    recentTrades,
  };
}
