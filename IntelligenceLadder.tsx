import React, { useMemo } from 'react';
import { FootprintBar, PriceLevel } from '../../../types/market';
import { ChevronRight, Layers, Target } from 'lucide-react';

interface Props {
  activeBar: FootprintBar | null;
  currentPrice: number;
  decimals: number;
  levelsCount: number;
}

export const IntelligenceLadder: React.FC<Props> = ({
  activeBar,
  currentPrice,
  decimals,
  levelsCount,
}) => {
  const levels = useMemo(() => {
    if (!activeBar || !activeBar.levels || activeBar.levels.length === 0) {
      return [];
    }

    // Sort descending by price
    const sorted = [...activeBar.levels].sort((a, b) => b.price - a.price);

    // Find closest index to currentPrice
    const closestIdx = sorted.findIndex(
      l => Math.abs(l.price - currentPrice) < 0.0001
    );

    if (closestIdx === -1) {
      return sorted.slice(0, levelsCount);
    }

    const half = Math.floor(levelsCount / 2);
    const start = Math.max(0, closestIdx - half);
    const end = Math.min(sorted.length, start + levelsCount);
    return sorted.slice(start, end);
  }, [activeBar, currentPrice, levelsCount]);

  const formatPrice = (p: number) => {
    return p.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatVol = (v: number) => {
    return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  return (
    <div className="w-full bg-[#11161d] border border-[#21262d] rounded-lg overflow-hidden flex flex-col font-mono text-xs select-none shadow-md">
      {/* Header bar */}
      <div className="h-9 bg-[#161b22] px-3 border-b border-[#21262d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 text-xs uppercase tracking-wider">
            Order Flow Ladder & Imbalance Matrix
          </span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center gap-2">
          <span>Active Bar Levels: <strong className="text-cyan-300">{activeBar?.levels.length || 0}</strong></span>
        </div>
      </div>

      {/* Table Head */}
      <div className="grid grid-cols-6 bg-[#0c1017] px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#21262d]">
        <div className="text-left">Price</div>
        <div className="text-right text-rose-400">Bid (Sell)</div>
        <div className="text-right text-emerald-400">Ask (Buy)</div>
        <div className="text-right">Delta</div>
        <div className="text-center">Imbalance</div>
        <div className="text-right text-slate-300">Volume</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-[#1e232d] max-h-60 overflow-y-auto font-mono">
        {levels.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Waiting for live footprint ticks and depth aggregation...
          </div>
        ) : (
          levels.map((lvl) => {
            const isCurrent = Math.abs(lvl.price - currentPrice) < 0.0001;
            const isPoc = !!lvl.isPoc;
            const isVah = !!lvl.isVah;
            const isVal = !!lvl.isVal;

            return (
              <div
                key={lvl.price}
                className={`grid grid-cols-6 px-3 py-1.5 items-center transition-colors text-xs ${
                  isCurrent
                    ? 'bg-cyan-950/60 font-bold border-y border-cyan-500/50'
                    : isPoc
                    ? 'bg-amber-950/30'
                    : 'hover:bg-[#161b22]'
                }`}
              >
                {/* Price Column with Badges */}
                <div className="flex items-center gap-1.5 font-bold">
                  {isCurrent && <Target className="w-3 h-3 text-cyan-400 animate-pulse shrink-0" />}
                  <span className={isCurrent ? 'text-cyan-300' : isPoc ? 'text-amber-400' : 'text-slate-200'}>
                    {formatPrice(lvl.price)}
                  </span>
                  {isPoc && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      POC
                    </span>
                  )}
                  {isVah && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      VAH
                    </span>
                  )}
                  {isVal && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      VAL
                    </span>
                  )}
                </div>

                {/* Bid Column */}
                <div className={`text-right ${lvl.bidVolume > 0 ? 'text-rose-400' : 'text-slate-600'}`}>
                  {formatVol(lvl.bidVolume)}
                </div>

                {/* Ask Column */}
                <div className={`text-right ${lvl.askVolume > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {formatVol(lvl.askVolume)}
                </div>

                {/* Delta Column */}
                <div
                  className={`text-right font-semibold ${
                    lvl.delta > 0
                      ? 'text-emerald-400'
                      : lvl.delta < 0
                      ? 'text-rose-400'
                      : 'text-slate-500'
                  }`}
                >
                  {lvl.delta > 0 ? `+${formatVol(lvl.delta)}` : formatVol(lvl.delta)}
                </div>

                {/* Imbalance Column */}
                <div className="text-center">
                  {lvl.isImbalanceBuy ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      BUY IMB
                    </span>
                  ) : lvl.isImbalanceSell ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      SELL IMB
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-600">BALANCED</span>
                  )}
                </div>

                {/* Volume Column */}
                <div className="text-right text-slate-300 font-semibold">
                  {formatVol(lvl.totalVolume)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
