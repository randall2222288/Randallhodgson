import React, { useState } from 'react';
import {
  Activity,
  Award,
  BarChart2,
  CheckCircle,
  Eye,
  Flame,
  Info,
  Layers,
  Percent,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useTerminal } from '../../hooks/useTerminal';
import { terminalStore } from '../../store/terminalStore';

export const CandleIntelligenceView: React.FC = () => {
  const { aiState, historicalBars, activeBar, symbol, timeframe, selectedCandleAnalysis } = useTerminal();
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(null);

  const displayAnalysis = selectedCandleAnalysis || aiState.currentAnalysis;

  const handleSelectBar = (timestamp: number) => {
    setSelectedTimestamp(timestamp);
    terminalStore.inspectCandle(timestamp);
  };

  const handleResetToActive = () => {
    setSelectedTimestamp(null);
    terminalStore.setSelectedCandleAnalysis(null);
  };

  return (
    <div className="w-full h-full bg-[#0d1117] text-slate-200 p-3 overflow-y-auto font-sans flex flex-col gap-3">
      {/* Top Header: Candle Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#161b22] border border-[#30363d]">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-sm font-bold text-slate-100">CANDLE INTELLIGENCE INSPECTOR</span>
          <span className="text-xs text-slate-400 font-mono">
            ({symbol} - {timeframe})
          </span>
        </div>

        {/* Historical Candle Selector Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full font-mono text-[10px]">
          <button
            onClick={handleResetToActive}
            className={`px-2 py-1 rounded border transition-all cursor-pointer ${
              selectedTimestamp === null
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                : 'bg-[#11161d] text-slate-400 border-[#21262d] hover:text-slate-200'
            }`}
          >
            ● LIVE ACTIVE BAR
          </button>
          {historicalBars.slice(-8).reverse().map((bar, idx) => {
            const isSelected = selectedTimestamp === bar.time;
            const isUp = bar.close >= bar.open;
            return (
              <button
                key={bar.time}
                onClick={() => handleSelectBar(bar.time)}
                className={`px-2 py-1 rounded border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                    : isUp
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/50'
                    : 'bg-rose-950/40 text-rose-300 border-rose-800/40 hover:bg-rose-900/50'
                }`}
              >
                Bar -{idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {displayAnalysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Left Column: Candle Anatomy & Strength Score (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* Candle Strength Score Card */}
            <div className="p-3 rounded-lg bg-[#11161d] border border-[#21262d] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  CANDLE STRENGTH SCORE
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                    displayAnalysis.direction === 'BULLISH'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : displayAnalysis.direction === 'BEARISH'
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                      : 'bg-slate-700/50 border-slate-600 text-slate-300'
                  }`}
                >
                  {displayAnalysis.direction} ({displayAnalysis.momentum} MOMENTUM)
                </span>
              </div>

              {/* Dial & Pressure */}
              <div className="flex items-center gap-4 my-1">
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-[#21262d] bg-[#161b22]">
                  <span
                    className={`text-3xl font-black font-mono ${
                      displayAnalysis.candleStrengthScore >= 75
                        ? 'text-emerald-400'
                        : displayAnalysis.candleStrengthScore <= 40
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {displayAnalysis.candleStrengthScore}
                  </span>
                  <span className="absolute -bottom-1 text-[9px] font-mono text-slate-500">/100</span>
                </div>

                <div className="flex-1 flex flex-col gap-1.5 text-xs font-mono">
                  <div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Buying Pressure:</span>
                      <span className="text-emerald-400 font-bold">{displayAnalysis.buyingPressure}%</span>
                    </div>
                    <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden mt-0.5">
                      <div className="h-full bg-emerald-500" style={{ width: `${displayAnalysis.buyingPressure}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Selling Pressure:</span>
                      <span className="text-rose-400 font-bold">{displayAnalysis.sellingPressure}%</span>
                    </div>
                    <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden mt-0.5">
                      <div className="h-full bg-rose-500" style={{ width: `${displayAnalysis.sellingPressure}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bullish vs Bearish Scores */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#21262d] text-center font-mono text-xs">
                <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-400 block">BULLISH SCORE</span>
                  <span className="font-bold text-emerald-300 text-sm">{displayAnalysis.bullishScore}</span>
                </div>
                <div className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20">
                  <span className="text-[10px] text-rose-400 block">BEARISH SCORE</span>
                  <span className="font-bold text-rose-300 text-sm">{displayAnalysis.bearishScore}</span>
                </div>
              </div>
            </div>

            {/* Candle Metrics Table (Exact Pips & OHLC) */}
            <div className="p-3 rounded-lg bg-[#11161d] border border-[#21262d] flex flex-col gap-2 font-mono text-xs">
              <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                EXACT GEOMETRY & PIPS
              </span>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] bg-[#161b22] p-2.5 rounded border border-[#21262d]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Open:</span>
                  <span className="text-slate-200">{displayAnalysis.open.toFixed(5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Close:</span>
                  <span className="text-slate-200">{displayAnalysis.close.toFixed(5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">High:</span>
                  <span className="text-slate-200">{displayAnalysis.high.toFixed(5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Low:</span>
                  <span className="text-slate-200">{displayAnalysis.low.toFixed(5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Body Size:</span>
                  <span className="text-cyan-300 font-bold">{displayAnalysis.bodySizePips} pips</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Range:</span>
                  <span className="text-cyan-300 font-bold">{displayAnalysis.totalRangePips} pips</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Upper Wick:</span>
                  <span className="text-slate-200">{displayAnalysis.upperWickPips} pips</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lower Wick:</span>
                  <span className="text-slate-200">{displayAnalysis.lowerWickPips} pips</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Body/Range:</span>
                  <span className="text-purple-300 font-bold">{(displayAnalysis.bodyRangeRatio * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Volume:</span>
                  <span className="text-slate-200">{displayAnalysis.volume.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Probabilities, Patterns & AI Narrative (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Directional Probabilities */}
            <div className="p-3 rounded-lg bg-[#11161d] border border-[#21262d] flex flex-col gap-2">
              <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-cyan-400" />
                NEXT BAR DIRECTION & CONTINUATION PROBABILITIES
              </span>

              <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs">
                <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-400 block font-sans">BULLISH PROBABILITY</span>
                  <span className="text-lg font-bold text-emerald-300">{displayAnalysis.bullishProbability}%</span>
                </div>
                <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20">
                  <span className="text-[10px] text-rose-400 block font-sans">BEARISH PROBABILITY</span>
                  <span className="text-lg font-bold text-rose-300">{displayAnalysis.bearishProbability}%</span>
                </div>
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[10px] text-amber-400 block font-sans">NEUTRAL / RANGE</span>
                  <span className="text-lg font-bold text-amber-300">{displayAnalysis.neutralProbability}%</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs mt-1">
                <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
                  <span className="text-[10px] text-cyan-400 block font-sans">CONTINUATION</span>
                  <span className="text-lg font-bold text-cyan-300">{displayAnalysis.continuationProbability}%</span>
                </div>
                <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                  <span className="text-[10px] text-purple-400 block font-sans">REVERSAL</span>
                  <span className="text-lg font-bold text-purple-300">{displayAnalysis.reversalProbability}%</span>
                </div>
                <div className="p-2 rounded bg-slate-500/10 border border-slate-500/20">
                  <span className="text-[10px] text-slate-400 block font-sans">CONSOLIDATION</span>
                  <span className="text-lg font-bold text-slate-300">{displayAnalysis.rangeProbability}%</span>
                </div>
              </div>
            </div>

            {/* Detected Candlestick Patterns */}
            <div className="p-3 rounded-lg bg-[#11161d] border border-[#21262d] flex flex-col gap-2">
              <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                DETECTED PATTERNS & CONTEXTUAL SIGNIFICANCE
              </span>

              <div className="space-y-1.5">
                {displayAnalysis.patterns && displayAnalysis.patterns.length > 0 ? (
                  displayAnalysis.patterns.map((pat, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-[#161b22] border border-[#21262d] flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-100">{pat.name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                              pat.type === 'BULLISH'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : pat.type === 'BEARISH'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {pat.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans">{pat.description}</p>
                      </div>

                      <div className="text-right shrink-0 font-mono text-[11px]">
                        <span className="text-cyan-400 font-bold">{pat.reliability}% rel</span>
                        <span className="text-[10px] text-slate-500 block uppercase">{pat.contextualSignificance} weight</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-slate-500 text-xs italic bg-[#161b22] rounded border border-[#21262d]">
                    No classical single-bar reversal anomalies detected; standard auction continuation bar.
                  </div>
                )}
              </div>
            </div>

            {/* AI Technical Interpretation Narrative */}
            <div className="p-3 rounded-lg bg-[#11161d] border border-[#21262d] flex flex-col gap-2">
              <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                AI TECHNICAL INTERPRETATION
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans bg-[#161b22] p-2.5 rounded border border-[#21262d]">
                {displayAnalysis.aiInterpretation}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
          Loading candle analytics...
        </div>
      )}
    </div>
  );
};
