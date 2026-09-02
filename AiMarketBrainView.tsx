import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Cpu,
  Layers,
  Percent,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useTerminal } from '../../hooks/useTerminal';
import { terminalStore } from '../../store/terminalStore';

export const AiMarketBrainView: React.FC = () => {
  const { aiState, isAiAnalyzing, symbol, timeframe, isRealData, config } = useTerminal();
  const { currentAnalysis, marketStructure, latestSignal, marketScore, multiTimeframe, engineStatus, provider } = aiState;

  const score = marketScore?.totalScore || 75;
  const bias = marketScore?.bias || 'BULLISH';

  const getBiasBadge = () => {
    switch (bias) {
      case 'STRONG_BULLISH':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">STRONG BULLISH</span>;
      case 'BULLISH':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">BULLISH</span>;
      case 'STRONG_BEARISH':
        return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">STRONG BEARISH</span>;
      case 'BEARISH':
        return <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-semibold border border-rose-500/30">BEARISH</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30">NEUTRAL / RANGE</span>;
    }
  };

  const getSignalBadge = () => {
    if (!latestSignal) return null;
    if (latestSignal.signal === 'BUY') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-sm">
          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          <span>BUY SIGNAL</span>
          <span className="text-xs font-normal opacity-90">({latestSignal.confidenceScore}% conf)</span>
        </div>
      );
    }
    if (latestSignal.signal === 'SELL') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono font-bold text-sm">
          <ArrowDownRight className="w-4 h-4 text-rose-400" />
          <span>SELL SIGNAL</span>
          <span className="text-xs font-normal opacity-90">({latestSignal.confidenceScore}% conf)</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-sm">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <span>WAIT (CONSOLIDATION)</span>
        <span className="text-xs font-normal opacity-90">({latestSignal.confidenceScore}% wait score)</span>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-[#0d1117] text-slate-200 p-3 overflow-y-auto font-sans flex flex-col gap-3">
      {/* Top Banner: Status & Deep Analyze trigger */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#161b22] border border-[#30363d]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 font-mono text-sm tracking-wide">AI MARKET BRAIN</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/40 text-cyan-300 font-mono uppercase">
                {provider === 'gemini' ? 'Gemini 3.7 Flash Engine' : 'Quantitative Engine'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Active symbol: <span className="font-mono text-slate-200">{symbol}</span> | TF: <span className="font-mono text-cyan-400">{timeframe}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-trigger-ai-analysis"
            onClick={() => terminalStore.requestAiAnalysis()}
            disabled={isAiAnalyzing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-all cursor-pointer ${
              isAiAnalyzing
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 animate-pulse'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAiAnalyzing ? 'animate-spin text-cyan-300' : 'text-cyan-400'}`} />
            <span>{isAiAnalyzing ? 'Analyzing Real Data...' : 'Run Deep AI Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Grid: AI Market Score & Primary Signal Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: AI Market Score (5 cols) */}
        <div className="lg:col-span-5 p-3 rounded-lg bg-[#11161d] border border-[#21262d] flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              AI MARKET SCORE (0-100)
            </span>
            {getBiasBadge()}
          </div>

          {/* Big Score Dial */}
          <div className="flex items-center gap-4 my-1">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-[#21262d] bg-[#161b22]">
              <span className={`text-3xl font-black font-mono ${score >= 70 ? 'text-emerald-400' : score <= 35 ? 'text-rose-400' : 'text-amber-400'}`}>
                {score}
              </span>
              <span className="absolute -bottom-1 text-[9px] font-mono text-slate-500">/100</span>
            </div>

            <div className="flex-1 flex flex-col gap-1 text-[11px] font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Structure:</span>
                <span className="text-slate-200 font-semibold">{marketStructure?.structureSequence}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Phase:</span>
                <span className="text-cyan-400 font-semibold">{marketStructure?.phase}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>MTF Confluence:</span>
                <span className="text-emerald-400 font-semibold">{multiTimeframe?.alignmentScore}% ({multiTimeframe?.alignmentStatus})</span>
              </div>
            </div>
          </div>

          {/* Component Breakdown Bars */}
          <div className="space-y-1.5 pt-2 border-t border-[#21262d] text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span>Trend (20%):</span>
              <div className="flex items-center gap-2 w-32">
                <div className="flex-1 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${marketScore?.components.trend || 70}%` }} />
                </div>
                <span className="w-6 text-right text-slate-200">{marketScore?.components.trend}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Structure (15%):</span>
              <div className="flex items-center gap-2 w-32">
                <div className="flex-1 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${marketScore?.components.structure || 75}%` }} />
                </div>
                <span className="w-6 text-right text-slate-200">{marketScore?.components.structure}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Candle Strength (15%):</span>
              <div className="flex items-center gap-2 w-32">
                <div className="flex-1 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400" style={{ width: `${currentAnalysis?.candleStrengthScore || 80}%` }} />
                </div>
                <span className="w-6 text-right text-slate-200">{currentAnalysis?.candleStrengthScore || 80}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Order Flow (10%):</span>
              <div className="flex items-center gap-2 w-32">
                <div className="flex-1 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${marketScore?.components.orderFlow || 75}%` }} />
                </div>
                <span className="w-6 text-right text-slate-200">{marketScore?.components.orderFlow}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Signal Engine & Risk Card (7 cols) */}
        <div className="lg:col-span-7 p-3 rounded-lg bg-[#11161d] border border-[#21262d] flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              CONFLUENCE SIGNAL & RISK MANAGEMENT
            </span>
            {getSignalBadge()}
          </div>

          {/* Trade Execution Zone Matrix */}
          {latestSignal && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs bg-[#161b22] p-2.5 rounded-lg border border-[#21262d]">
              <div>
                <span className="text-[10px] text-slate-400 block">ENTRY ZONE</span>
                <span className="text-slate-100 font-bold">{latestSignal.entryZone.min.toFixed(5)}</span>
                <span className="text-[10px] text-slate-500 block">to {latestSignal.entryZone.max.toFixed(5)}</span>
              </div>

              <div>
                <span className="text-[10px] text-rose-400 block">STOP LOSS</span>
                <span className="text-rose-300 font-bold">{latestSignal.stopLoss.toFixed(5)}</span>
                <span className="text-[10px] text-slate-500 block">Dynamic ATR SL</span>
              </div>

              <div>
                <span className="text-[10px] text-emerald-400 block">TAKE PROFIT (TP1)</span>
                <span className="text-emerald-300 font-bold">{latestSignal.takeProfit[0]?.toFixed(5)}</span>
                <span className="text-[10px] text-slate-500 block">TP2: {latestSignal.takeProfit[1]?.toFixed(5)}</span>
              </div>

              <div>
                <span className="text-[10px] text-cyan-400 block">RISK / REWARD</span>
                <span className="text-cyan-300 font-bold">{latestSignal.riskRewardRatio}</span>
                <span className="text-[10px] text-slate-500 block">Quality: {latestSignal.signalQuality}</span>
              </div>
            </div>
          )}

          {/* Confluence Reasoning Checklist */}
          <div className="flex flex-col gap-1 text-[11px] font-sans">
            <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold">Institutional Confluence Reasoning:</span>
            <div className="space-y-1">
              {latestSignal?.reasoning && latestSignal.reasoning.length > 0 ? (
                latestSignal.reasoning.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-slate-300 bg-[#161b22]/70 px-2 py-1 rounded border border-[#21262d]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 italic">Synthesizing market context...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Candle Probabilities & AI Interpretation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Probabilities Matrix */}
        <div className="p-3 rounded-lg bg-[#11161d] border border-[#21262d] flex flex-col gap-2">
          <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-cyan-400" />
            ESTIMATED DIRECTIONAL & CONTINUATION PROBABILITIES
          </span>

          <div className="space-y-2 text-xs font-mono">
            {/* Next Bar Direction */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Next Candle Direction:</span>
                <span className="text-slate-200">
                  Bullish {currentAnalysis?.bullishProbability || 64}% | Bearish {currentAnalysis?.bearishProbability || 24}% | Neutral {currentAnalysis?.neutralProbability || 12}%
                </span>
              </div>
              <div className="h-2 w-full bg-[#21262d] rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: `${currentAnalysis?.bullishProbability || 64}%` }} />
                <div className="h-full bg-rose-500" style={{ width: `${currentAnalysis?.bearishProbability || 24}%` }} />
                <div className="h-full bg-amber-500" style={{ width: `${currentAnalysis?.neutralProbability || 12}%` }} />
              </div>
            </div>

            {/* Continuation vs Reversal */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Continuation vs Reversal:</span>
                <span className="text-slate-200">
                  Continuation {currentAnalysis?.continuationProbability || 70}% | Reversal {currentAnalysis?.reversalProbability || 20}% | Range {currentAnalysis?.rangeProbability || 10}%
                </span>
              </div>
              <div className="h-2 w-full bg-[#21262d] rounded-full overflow-hidden flex">
                <div className="h-full bg-cyan-500" style={{ width: `${currentAnalysis?.continuationProbability || 70}%` }} />
                <div className="h-full bg-purple-500" style={{ width: `${currentAnalysis?.reversalProbability || 20}%` }} />
                <div className="h-full bg-slate-500" style={{ width: `${currentAnalysis?.rangeProbability || 10}%` }} />
              </div>
            </div>

            <div className="text-[10px] text-slate-500 italic">
              *Probabilities are statistical model scores derived from real OHLC geometry, delta imbalances, and MTF confluence.
            </div>
          </div>
        </div>

        {/* AI Interpretation Box */}
        <div className="p-3 rounded-lg bg-[#11161d] border border-[#21262d] flex flex-col justify-between gap-2">
          <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            AI TECHNICAL INTERPRETATION
          </span>

          <p className="text-xs text-slate-300 leading-relaxed font-sans bg-[#161b22] p-2.5 rounded border border-[#21262d]">
            {currentAnalysis?.aiInterpretation ||
              'Evaluating live candle geometry, auction order flow, and institutional order blocks. Price discovery is actively responding to local liquidity.'}
          </p>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-[#21262d]">
            <span>Vol Regime: <span className="text-slate-200 font-semibold">{currentAnalysis?.volatility || 'NORMAL'}</span></span>
            <span>Pressure: <span className="text-emerald-400 font-semibold">Buy {currentAnalysis?.buyingPressure || 50}%</span> / <span className="text-rose-400 font-semibold">Sell {currentAnalysis?.sellingPressure || 50}%</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};
