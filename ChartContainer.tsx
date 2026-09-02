import React from 'react';
import { Bot, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useTerminal } from '../../hooks/useTerminal';
import { terminalStore } from '../../store/terminalStore';
import { TimeframeBar } from '../common/TimeframeBar';
import { LightweightCanvasChart } from './LightweightCanvasChart';
import { TradingViewChart } from './TradingViewChart';

export const ChartContainer: React.FC = () => {
  const { config, aiState, timeframe, symbol } = useTerminal();
  const latestSignal = aiState?.latestSignal;
  const currentAnalysis = aiState?.currentAnalysis;
  const structure = aiState?.marketStructure;

  const signalColor =
    latestSignal?.signal === 'BUY'
      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
      : latestSignal?.signal === 'SELL'
      ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
      : 'bg-amber-500/15 border-amber-500/30 text-amber-400';

  return (
    <div className="w-full h-full relative bg-[#0b0e14] flex flex-col overflow-hidden">
      {/* Chart Top Control Bar */}
      <div className="h-8 bg-[#0d1117] border-b border-[#21262d] px-2 flex items-center justify-between z-10 shrink-0 select-none">
        {/* Left: Timeframe Toolbar with all requested timeframes */}
        <div className="flex items-center gap-2">
          <TimeframeBar compact />
        </div>

        {/* Right: AI Market Brain Overlays */}
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          {/* AI Signal Badge */}
          {latestSignal && (
            <button
              onClick={() => terminalStore.setOrderFlowTab('market_brain')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-all hover:brightness-110 cursor-pointer ${signalColor}`}
              title={`AI Signal: ${latestSignal.signal} (${latestSignal.confidenceScore}% confidence). Click to open AI Brain.`}
            >
              <Bot className="w-3 h-3" />
              <span className="font-bold">{latestSignal.signal}</span>
              <span className="text-[9px] opacity-80">{latestSignal.confidenceScore}%</span>
            </button>
          )}

          {/* Candle Strength Pill */}
          {currentAnalysis && (
            <button
              onClick={() => terminalStore.setOrderFlowTab('candle_intel')}
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-cyan-400 cursor-pointer"
              title={`Candle Strength: ${currentAnalysis.candleStrengthScore}/100. Click for Candle Intelligence.`}
            >
              <Zap className="w-2.5 h-2.5 text-cyan-400" />
              <span className="text-slate-400">CS:</span>
              <span className="font-bold text-slate-200">{currentAnalysis.candleStrengthScore}</span>
            </button>
          )}

          {/* Market Structure Pill */}
          {structure && (
            <button
              onClick={() => terminalStore.setOrderFlowTab('structure_liquidity')}
              className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-cyan-400 cursor-pointer"
              title={`Market Structure: ${structure.structureSequence} (${structure.phase})`}
            >
              <TrendingUp className="w-2.5 h-2.5 text-cyan-400" />
              <span className="text-cyan-300 font-semibold">{structure.trend}</span>
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas / TradingView Area */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        {config.chartType === 'tradingview' ? (
          <TradingViewChart />
        ) : (
          <LightweightCanvasChart />
        )}
      </div>
    </div>
  );
};
