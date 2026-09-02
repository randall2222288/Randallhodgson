import React, { useState } from 'react';
import { IntelligenceConfig } from './types';
import { useOrderFlowCalculations } from './useOrderFlowCalculations';
import { IntelligenceHeader } from './IntelligenceHeader';
import { IntelligenceAlertsBanner } from './IntelligenceAlertsBanner';
import { PressureSplitPanels } from './PressureSplitPanels';
import { MarketPressureGauge } from './MarketPressureGauge';
import { IntelligenceLadder } from './IntelligenceLadder';
import { CumulativeDeltaHistogram } from './CumulativeDeltaHistogram';
import { AbsorptionDetectorCard } from './AbsorptionDetectorCard';
import { CurrentCandleAnalysisCard } from './CurrentCandleAnalysisCard';
import { NextCandleProbabilityCard } from './NextCandleProbabilityCard';
import { ConfluenceEnginePanel } from './ConfluenceEnginePanel';
import { AutomaticExplanationPanel } from './AutomaticExplanationPanel';
import { AiOrderFlowSignalCard } from './AiOrderFlowSignalCard';
import { SignalHistoryTable } from './SignalHistoryTable';
import { IntelligenceConfigDrawer } from './IntelligenceConfigDrawer';
import { IntelligenceDebugModal } from './IntelligenceDebugModal';

export const OrderFlowIntelligenceView: React.FC = () => {
  const [config, setConfig] = useState<IntelligenceConfig>({
    imbalanceThreshold: 300,
    absorptionThresholdVolume: 8.0,
    minSignalConfidence: 70,
    cumulativeDeltaPeriod: 'session',
    ladderLevelsCount: 16,
    showDebug: false,
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  const calcs = useOrderFlowCalculations(config);

  const handleConfigChange = (newCfg: Partial<IntelligenceConfig>) => {
    setConfig((prev) => ({ ...prev, ...newCfg }));
  };

  const decimals = calcs.symbolInfo.priceDecimals || 2;

  // Prepare debug payload
  const debugPayload = {
    symbol: calcs.symbol,
    timeframe: calcs.timeframe,
    dataStatus: calcs.status,
    isRealData: calcs.isRealData,
    dataQuality: calcs.dataQuality,
    buyingPressure: calcs.buyingPressure,
    sellingPressure: calcs.sellingPressure,
    buyingAggression: calcs.buyingAggression,
    sellingAggression: calcs.sellingAggression,
    currentDelta: calcs.currentDelta,
    cumulativeDelta: calcs.cumulativeDelta,
    absorption: {
      buyAbsorptionDetected: calcs.buyAbsorptionDetected,
      buyStrength: calcs.buyAbsorptionStrength,
      sellAbsorptionDetected: calcs.sellAbsorptionDetected,
      sellStrength: calcs.sellAbsorptionStrength,
    },
    imbalances: {
      buyCount: calcs.buyImbalancesCount,
      sellCount: calcs.sellImbalancesCount,
      dominance: calcs.imbalanceDominance,
    },
    marketPressure: {
      score: calcs.marketPressureScore,
      state: calcs.marketPressureState,
    },
    probabilities: calcs.probabilities,
    confluence: {
      verdict: calcs.confluence.verdict,
      bullishCount: calcs.confluence.bullishCount,
      bearishCount: calcs.confluence.bearishCount,
    },
    aiSignal: calcs.aiSignalResult,
  };

  return (
    <div className="w-full h-full bg-[#0b0e14] overflow-y-auto flex flex-col font-mono text-xs select-none">
      {/* 1. Header Bar */}
      <IntelligenceHeader
        symbol={calcs.symbol}
        timeframe={calcs.timeframe}
        symbolInfo={calcs.symbolInfo}
        currentPrice={calcs.stats.price}
        marketStatus={calcs.status === 'LIVE' ? 'Market Active' : 'Connecting'}
        dataStatus={calcs.status}
        lastUpdateAgo={calcs.lastUpdateAgo}
        dataQuality={calcs.dataQuality}
        isRealData={calcs.isRealData}
        isDecentralized={calcs.isDecentralized}
        isAiAnalyzing={calcs.isAiAnalyzing}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenDebug={() => setIsDebugOpen(true)}
      />

      {/* Main Content Area with clean padding & grid */}
      <div className="p-3.5 flex flex-col gap-3.5 max-w-7xl mx-auto w-full">
        {/* 2. Visual Alerts Banner */}
        <IntelligenceAlertsBanner alerts={calcs.alerts} />

        {/* 3. Buying vs Selling Pressure Split Panels */}
        <PressureSplitPanels
          buyingPressure={calcs.buyingPressure}
          sellingPressure={calcs.sellingPressure}
          buyingAggression={calcs.buyingAggression}
          sellingAggression={calcs.sellingAggression}
          buyingAggressionLevel={calcs.buyingAggressionLevel}
          sellingAggressionLevel={calcs.sellingAggressionLevel}
          buyAbsorptionStrength={calcs.buyAbsorptionStrength}
          sellAbsorptionStrength={calcs.sellAbsorptionStrength}
          buyAbsorptionDetected={calcs.buyAbsorptionDetected}
          sellAbsorptionDetected={calcs.sellAbsorptionDetected}
          buyVolume={calcs.buyVolume}
          sellVolume={calcs.sellVolume}
          currentDelta={calcs.currentDelta}
          cumulativeDelta={calcs.cumulativeDelta}
        />

        {/* 4. Market Pressure Equilibrium Gauge */}
        <MarketPressureGauge
          marketPressureScore={calcs.marketPressureScore}
          marketPressureState={calcs.marketPressureState}
          dominantPressureSide={calcs.dominantPressureSide}
          buyingPressure={calcs.buyingPressure}
          sellingPressure={calcs.sellingPressure}
        />

        {/* 5. Two Columns: Order Flow Ladder & Cumulative Delta Histogram */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <IntelligenceLadder
            activeBar={calcs.activeBar}
            currentPrice={calcs.stats.price}
            decimals={decimals}
            levelsCount={config.ladderLevelsCount}
          />
          <CumulativeDeltaHistogram
            cumulativeDelta={calcs.cumulativeDelta}
            period={config.cumulativeDeltaPeriod}
            onPeriodChange={(p) => handleConfigChange({ cumulativeDeltaPeriod: p })}
            historicalBars={calcs.historicalBars}
            activeBar={calcs.activeBar}
          />
        </div>

        {/* 6. Absorption Detector & Current Candle Geometry */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <AbsorptionDetectorCard
            buyAbsorptionStrength={calcs.buyAbsorptionStrength}
            sellAbsorptionStrength={calcs.sellAbsorptionStrength}
            buyAbsorptionDetected={calcs.buyAbsorptionDetected}
            sellAbsorptionDetected={calcs.sellAbsorptionDetected}
            absorptionExplanation={calcs.absorptionExplanation}
          />
          <NextCandleProbabilityCard
            greenProbability={calcs.probabilities.greenProbability}
            redProbability={calcs.probabilities.redProbability}
            neutralProbability={calcs.probabilities.neutralProbability}
            confidenceLevel={calcs.probabilities.confidenceLevel}
          />
        </div>

        {/* 7. Current Candle In-Depth Geometry & Metrics */}
        <CurrentCandleAnalysisCard
          open={calcs.candleAnalysis.open}
          high={calcs.candleAnalysis.high}
          low={calcs.candleAnalysis.low}
          close={calcs.candleAnalysis.close}
          range={calcs.candleAnalysis.range}
          bodySize={calcs.candleAnalysis.bodySize}
          upperWick={calcs.candleAnalysis.upperWick}
          lowerWick={calcs.candleAnalysis.lowerWick}
          volume={calcs.totalVolume}
          delta={calcs.currentDelta}
          cumulativeDelta={calcs.cumulativeDelta}
          direction={calcs.candleAnalysis.direction}
          strengthScore={calcs.candleAnalysis.strengthScore}
          strengthLevel={calcs.candleAnalysis.strengthLevel}
          decimals={decimals}
        />

        {/* 8. Confluence Engine & Automatic Explanation */}
        <ConfluenceEnginePanel
          items={calcs.confluence.items}
          verdict={calcs.confluence.verdict}
          bullishCount={calcs.confluence.bullishCount}
          bearishCount={calcs.confluence.bearishCount}
        />

        <AutomaticExplanationPanel
          reasons={calcs.explanation.reasons}
          conclusion={calcs.explanation.conclusion}
          nextCandleBias={calcs.explanation.nextCandleBias}
          confidence={calcs.explanation.confidence}
        />

        {/* 9. AI Order Flow Signal Card */}
        <AiOrderFlowSignalCard
          signal={calcs.aiSignalResult.signal}
          isValidSignal={calcs.aiSignalResult.isValidSignal}
          confidence={calcs.aiSignalResult.confidence}
          signalQuality={calcs.aiSignalResult.signalQuality}
          riskLevel={calcs.aiSignalResult.riskLevel}
          reasoning={calcs.aiSignalResult.reasoning}
          biasText={calcs.aiSignalResult.biasText}
          colorBadge={calcs.aiSignalResult.colorBadge}
          thresholdMet={calcs.aiSignalResult.thresholdMet}
          minConfidence={calcs.aiSignalResult.minConfidence}
          entryZone={calcs.aiState.latestSignal?.entryZone}
          stopLoss={calcs.aiState.latestSignal?.stopLoss}
          takeProfit={calcs.aiState.latestSignal?.takeProfit}
          decimals={decimals}
        />

        {/* 10. Historical Signals Log */}
        <SignalHistoryTable
          signalHistory={calcs.aiState.signalHistory}
          decimals={decimals}
        />
      </div>

      {/* Settings Modal */}
      <IntelligenceConfigDrawer
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onChange={handleConfigChange}
      />

      {/* Debug Modal */}
      <IntelligenceDebugModal
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
        debugData={debugPayload}
      />
    </div>
  );
};
