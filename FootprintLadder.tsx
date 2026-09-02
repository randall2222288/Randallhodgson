import React, { useEffect, useMemo, useRef } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, Crosshair, Sparkles } from 'lucide-react';
import { getClientSymbolInfo } from '../../config/symbols';
import { useTerminal } from '../../hooks/useTerminal';
import { PriceLevel } from '../../types/market';

export const FootprintLadder: React.FC = () => {
  const { activeBar, stats, config, symbol } = useTerminal();
  const containerRef = useRef<HTMLDivElement>(null);
  const activePriceRef = useRef<HTMLDivElement>(null);

  const symbolInfo = useMemo(() => getClientSymbolInfo(symbol), [symbol]);
  const decimals = symbolInfo.priceDecimals ?? 2;

  const levels: PriceLevel[] = activeBar?.levels || [];
  const maxVol = Math.max(...levels.map(l => l.totalVolume), 1);
  const maxBid = Math.max(...levels.map(l => l.bidVolume), 1);
  const maxAsk = Math.max(...levels.map(l => l.askVolume), 1);

  // Auto-scroll center helper
  const scrollToCurrentPrice = () => {
    if (activePriceRef.current && containerRef.current) {
      activePriceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  useEffect(() => {
    // Initial center on mount
    const timer = setTimeout(scrollToCurrentPrice, 500);
    return () => clearTimeout(timer);
  }, []);

  const formatNum = (n: number) => {
    if (Math.abs(n) >= 1000) {
      return (n / 1000).toFixed(1) + 'k';
    }
    return n.toFixed(1);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1117] text-slate-200 font-mono text-xs select-none relative">
      {/* Control bar */}
      <div className="h-8 bg-[#161b22] border-b border-[#21262d] px-3 flex items-center justify-between shrink-0 text-[11px]">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            Active Candle Footprint DOM
          </span>
          <span className="text-cyan-400">
            Levels: {levels.length}
          </span>
          <span className="text-amber-400">
            POC: {stats.pocPrice.toLocaleString()}
          </span>
          {config.imbalanceVisible && (
            <span className="text-emerald-400">
              Imbalances: {stats.imbalancesCount} ({config.imbalanceThreshold}%)
            </span>
          )}
        </div>

        <button
          onClick={scrollToCurrentPrice}
          title="Center view on current price"
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-cyan-300 transition-colors text-[10px]"
        >
          <Crosshair className="w-2.5 h-2.5" />
          <span>Center</span>
        </button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-1 bg-[#0b0e14] py-1.5 px-3 border-b border-[#21262d] text-[10px] text-slate-400 uppercase tracking-wider font-semibold shrink-0">
        <div className="col-span-2 text-left">Price</div>
        <div className="col-span-4 text-center">Bid × Ask (Aggressor Flow)</div>
        <div className="col-span-2 text-right">Delta</div>
        <div className="col-span-2 text-right">Volume</div>
        <div className="col-span-2 text-right">Signals</div>
      </div>

      {/* Ladder Body */}
      <div ref={containerRef} className="flex-1 overflow-y-auto divide-y divide-[#161b22]/50 custom-scrollbar">
        {levels.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Awaiting order flow ticks...
          </div>
        ) : (
          levels.map((level) => {
            const isCurrentPrice = Math.abs(level.price - stats.price) < 0.00001;
            const isPoc = level.isPoc && config.pocVisible;
            const isVah = level.isVah;
            const isVal = level.isVal;

            const bidPercent = Math.min(100, (level.bidVolume / maxBid) * 100);
            const askPercent = Math.min(100, (level.askVolume / maxAsk) * 100);
            const totalPercent = Math.min(100, (level.totalVolume / maxVol) * 100);

            const isDeltaPositive = level.delta > 0;
            const isDeltaNegative = level.delta < 0;

            return (
              <div
                key={level.price}
                ref={isCurrentPrice ? activePriceRef : null}
                className={`grid grid-cols-12 gap-1 px-3 py-1 items-center transition-colors relative ${
                  isCurrentPrice
                    ? 'bg-cyan-950/40 border-y border-cyan-500/40 font-bold'
                    : isPoc
                    ? 'bg-amber-950/20 border-y border-amber-500/30'
                    : 'hover:bg-[#161b22]'
                }`}
              >
                {/* Price Column */}
                <div className="col-span-2 flex items-center gap-1">
                  <span
                    className={`font-semibold ${
                      isCurrentPrice
                        ? 'text-cyan-300'
                        : isPoc
                        ? 'text-amber-400 font-bold'
                        : 'text-slate-300'
                    }`}
                  >
                    {level.price.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
                  </span>
                  {isPoc && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                      POC
                    </span>
                  )}
                  {isVah && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                      VAH
                    </span>
                  )}
                  {isVal && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                      VAL
                    </span>
                  )}
                </div>

                {/* Bid x Ask Aggressor Flow (Split Heatmap) */}
                <div className="col-span-4 grid grid-cols-2 gap-1 items-center relative">
                  {/* Bid side (Sellers hitting bid) */}
                  <div className="relative h-5 rounded overflow-hidden flex items-center justify-end px-1.5 bg-[#161b22]">
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-rose-500/20 transition-all"
                      style={{ width: `${bidPercent}%` }}
                    />
                    <span
                      className={`relative z-10 text-[11px] ${
                        level.isImbalanceSell && config.imbalanceVisible
                          ? 'text-rose-400 font-bold underline decoration-rose-500 decoration-2'
                          : 'text-slate-300'
                      }`}
                    >
                      {formatNum(level.bidVolume)}
                    </span>
                  </div>

                  {/* Ask side (Buyers lifting offer) */}
                  <div className="relative h-5 rounded overflow-hidden flex items-center justify-start px-1.5 bg-[#161b22]">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-emerald-500/20 transition-all"
                      style={{ width: `${askPercent}%` }}
                    />
                    <span
                      className={`relative z-10 text-[11px] ${
                        level.isImbalanceBuy && config.imbalanceVisible
                          ? 'text-emerald-400 font-bold underline decoration-emerald-500 decoration-2'
                          : 'text-slate-300'
                      }`}
                    >
                      {formatNum(level.askVolume)}
                    </span>
                  </div>
                </div>

                {/* Delta Column */}
                <div className="col-span-2 text-right">
                  {config.deltaVisible && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        isDeltaPositive
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : isDeltaNegative
                          ? 'text-rose-400 bg-rose-500/10'
                          : 'text-slate-400'
                      }`}
                    >
                      {level.delta > 0 ? '+' : ''}
                      {formatNum(level.delta)}
                    </span>
                  )}
                </div>

                {/* Total Volume with volume intensity bar */}
                <div className="col-span-2 text-right relative">
                  <div className="relative h-5 rounded overflow-hidden flex items-center justify-end px-1.5 bg-[#161b22]/70">
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-slate-500/25 transition-all"
                      style={{ width: `${totalPercent}%` }}
                    />
                    <span className="relative z-10 text-slate-200 font-medium">
                      {formatNum(level.totalVolume)}
                    </span>
                  </div>
                </div>

                {/* Signals Column (Imbalances & Possible Absorption) */}
                <div className="col-span-2 flex items-center justify-end gap-1">
                  {level.isImbalanceBuy && config.imbalanceVisible && (
                    <span className="flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                      <ArrowUp className="w-2.5 h-2.5" />
                      <span>IMB</span>
                    </span>
                  )}
                  {level.isImbalanceSell && config.imbalanceVisible && (
                    <span className="flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold">
                      <ArrowDown className="w-2.5 h-2.5" />
                      <span>IMB</span>
                    </span>
                  )}
                  {level.isAbsorption && config.absorptionVisible && (
                    <span
                      title="Possible absorption inferred from high aggressive volume with no price extension"
                      className="flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                      <span>ABSORPTION</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
