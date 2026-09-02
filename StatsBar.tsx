import React, { useMemo } from 'react';
import { Activity, Bot, Sparkles, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { getClientSymbolInfo } from '../../config/symbols';
import { useTerminal } from '../../hooks/useTerminal';
import { terminalStore } from '../../store/terminalStore';

export const StatsBar: React.FC = () => {
  const { stats, config, symbol, aiState } = useTerminal();
  const latestSignal = aiState?.latestSignal;
  const marketScore = aiState?.marketScore;

  const symbolInfo = useMemo(() => getClientSymbolInfo(symbol), [symbol]);
  const decimals = symbolInfo.priceDecimals ?? 2;

  const isDeltaPositive = stats.delta >= 0;
  const isCvdPositive = stats.cvd >= 0;

  const formatPrice = (p: number) => {
    return p.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatNum = (n: number) => {
    return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  return (
    <footer className="h-9 bg-[#0b0e14] border-t border-[#21262d] px-3 flex items-center justify-between font-mono text-xs select-none shrink-0 z-20">
      {/* Metrics Ticker */}
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar whitespace-nowrap">
        {/* AI Quick Indicator */}
        {marketScore && (
          <button
            onClick={() => terminalStore.setOrderFlowTab('market_brain')}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/60 cursor-pointer"
            title="AI Market Brain: Click to open full dashboard"
          >
            <Bot className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-bold">AI SCORE:</span>
            <span className="font-bold text-slate-100">{marketScore.totalScore}</span>
            <span className="text-[9px] text-slate-400">({marketScore.bias})</span>
          </button>
        )}

        <span className="text-[#30363d]">|</span>

        {/* DELTA */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold text-[10px] uppercase">DELTA:</span>
          <span
            className={`font-bold flex items-center gap-0.5 ${
              isDeltaPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isDeltaPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {stats.delta > 0 ? '+' : ''}
            {formatNum(stats.delta)}
          </span>
        </div>

        <span className="text-[#30363d]">|</span>

        {/* CVD */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold text-[10px] uppercase">CVD:</span>
          <span
            className={`font-bold ${
              isCvdPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stats.cvd > 0 ? '+' : ''}
            {formatNum(stats.cvd)}
          </span>
        </div>

        <span className="text-[#30363d]">|</span>

        {/* VOLUME */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold text-[10px] uppercase">VOLUME:</span>
          <span className="text-slate-200 font-semibold">
            {formatNum(stats.volume)}
          </span>
        </div>

        <span className="text-[#30363d]">|</span>

        {/* POC */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold text-[10px] uppercase">POC:</span>
          <span className="text-amber-400 font-bold">
            {formatPrice(stats.pocPrice)}
          </span>
        </div>

        <span className="text-[#30363d]">|</span>

        {/* VAH */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold text-[10px] uppercase">VAH:</span>
          <span className="text-cyan-300 font-medium">
            {formatPrice(stats.vahPrice)}
          </span>
        </div>

        <span className="text-[#30363d]">|</span>

        {/* VAL */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold text-[10px] uppercase">VAL:</span>
          <span className="text-cyan-300 font-medium">
            {formatPrice(stats.valPrice)}
          </span>
        </div>

        <span className="text-[#30363d]">|</span>

        {/* MIN / MAX DELTA */}
        <div className="hidden lg:flex items-center gap-1.5 text-slate-400 text-[11px]">
          <span className="text-[10px] uppercase">MIN/MAX Δ:</span>
          <span className="text-rose-400">{formatNum(stats.minDelta)}</span>
          <span>/</span>
          <span className="text-emerald-400">+{formatNum(stats.maxDelta)}</span>
        </div>
      </div>

      {/* Right Notifications / Absorption status */}
      <div className="hidden md:flex items-center gap-3">
        {stats.isAbsorptionDetected && config.absorptionVisible && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-purple-300 bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded animate-pulse">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>{stats.absorptionDescription || 'Possible absorption detected'}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span>{stats.tradesPerSec} trades/s</span>
        </div>
      </div>
    </footer>
  );
};
