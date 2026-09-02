import React from 'react';
import { CandlestickChart, Compass, Gauge, TrendingDown, TrendingUp } from 'lucide-react';
import { CandleDirection, CandleStrengthLevel } from './types';

interface Props {
  open: number;
  high: number;
  low: number;
  close: number;
  range: number;
  bodySize: number;
  upperWick: number;
  lowerWick: number;
  volume: number;
  delta: number;
  cumulativeDelta: number;
  direction: CandleDirection;
  strengthScore: number;
  strengthLevel: CandleStrengthLevel;
  decimals: number;
}

export const CurrentCandleAnalysisCard: React.FC<Props> = ({
  open,
  high,
  low,
  close,
  range,
  bodySize,
  upperWick,
  lowerWick,
  volume,
  delta,
  cumulativeDelta,
  direction,
  strengthScore,
  strengthLevel,
  decimals,
}) => {
  const formatPrice = (p: number) => {
    return p.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatNum = (n: number) => {
    return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  const getStrengthBadge = () => {
    switch (strengthLevel) {
      case 'VERY_STRONG':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            VERY STRONG ({strengthScore}%)
          </span>
        );
      case 'STRONG':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            STRONG ({strengthScore}%)
          </span>
        );
      case 'MODERATE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            MODERATE ({strengthScore}%)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/40 text-slate-300 border border-slate-600">
            WEAK ({strengthScore}%)
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-[#11161d] border border-[#21262d] rounded-lg p-3.5 flex flex-col gap-3 font-mono text-xs select-none shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CandlestickChart className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wider text-xs">
            Live Candle Geometry & Dynamics
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              direction === 'BULLISH'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : direction === 'BEARISH'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-[#1f242c] text-slate-400 border-[#30363d]'
            }`}
          >
            {direction}
          </span>
          {getStrengthBadge()}
        </div>
      </div>

      {/* Grid of OHLC & Geometric Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="p-2 rounded bg-[#161b22] border border-[#21262d] flex flex-col">
          <span className="text-slate-400 text-[10px]">OPEN:</span>
          <span className="font-bold text-slate-100">{formatPrice(open)}</span>
        </div>
        <div className="p-2 rounded bg-[#161b22] border border-[#21262d] flex flex-col">
          <span className="text-slate-400 text-[10px]">HIGH:</span>
          <span className="font-bold text-emerald-400">{formatPrice(high)}</span>
        </div>
        <div className="p-2 rounded bg-[#161b22] border border-[#21262d] flex flex-col">
          <span className="text-slate-400 text-[10px]">LOW:</span>
          <span className="font-bold text-rose-400">{formatPrice(low)}</span>
        </div>
        <div className="p-2 rounded bg-[#161b22] border border-[#21262d] flex flex-col">
          <span className="text-slate-400 text-[10px]">CURRENT:</span>
          <span className="font-bold text-cyan-300">{formatPrice(close)}</span>
        </div>
      </div>

      {/* Geometry & Dynamics Row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[11px]">
        <div className="p-2 rounded bg-[#161b22] border border-[#21262d] flex flex-col">
          <span className="text-slate-400 text-[10px]">TOTAL RANGE:</span>
          <span className="font-bold text-slate-200">{formatPrice(range)}</span>
        </div>
        <div className="p-2 rounded bg-[#161b22] border border-[#21262d] flex flex-col">
          <span className="text-slate-400 text-[10px]">BODY SIZE:</span>
          <span className="font-bold text-slate-200">{formatPrice(bodySize)}</span>
        </div>
        <div className="p-2 rounded bg-[#161b22] border border-[#21262d] flex flex-col">
          <span className="text-slate-400 text-[10px]">UPPER WICK:</span>
          <span className="font-bold text-slate-300">{formatPrice(upperWick)}</span>
        </div>
        <div className="p-2 rounded bg-[#161b22] border border-[#21262d] flex flex-col">
          <span className="text-slate-400 text-[10px]">LOWER WICK:</span>
          <span className="font-bold text-slate-300">{formatPrice(lowerWick)}</span>
        </div>
        <div className="p-2 rounded bg-[#161b22] border border-[#21262d] flex flex-col">
          <span className="text-slate-400 text-[10px]">DELTA:</span>
          <span className={`font-bold ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {delta > 0 ? '+' : ''}{formatNum(delta)}
          </span>
        </div>
        <div className="p-2 rounded bg-[#161b22] border border-[#21262d] flex flex-col">
          <span className="text-slate-400 text-[10px]">VOLUME:</span>
          <span className="font-bold text-slate-200">{formatNum(volume)}</span>
        </div>
      </div>
    </div>
  );
};
