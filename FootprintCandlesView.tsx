import React, { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { useTerminal } from '../../hooks/useTerminal';
import { FootprintBar } from '../../types/market';

export const FootprintCandlesView: React.FC = () => {
  const { activeBar, historicalBars, config } = useTerminal();
  const scrollRef = useRef<HTMLDivElement>(null);

  const allBars: FootprintBar[] = [...historicalBars];
  if (activeBar) {
    allBars.push(activeBar);
  }

  // Scroll to active bar automatically
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [allBars.length]);

  const formatTime = (timeMs: number) => {
    const d = new Date(timeMs);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatNum = (n: number) => {
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toFixed(1);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1117] text-slate-200 font-mono text-xs select-none">
      {/* Top indicator bar */}
      <div className="h-8 bg-[#161b22] border-b border-[#21262d] px-3 flex items-center justify-between shrink-0 text-[11px]">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            Multi-Candle Footprint Profile
          </span>
          <span className="text-cyan-400">
            Bars Visible: {allBars.length}
          </span>
          <span className="text-slate-400">
            Bid × Ask Diagonal Matrix
          </span>
        </div>
      </div>

      {/* Horizontal Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-auto p-3 flex gap-3 custom-scrollbar items-start"
      >
        {allBars.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            Awaiting candles...
          </div>
        ) : (
          allBars.map((bar, idx) => {
            const isActive = idx === allBars.length - 1;
            const isBullish = bar.close >= bar.open;
            const isPositiveDelta = bar.delta >= 0;

            const sortedLevels = [...bar.levels].sort((a, b) => b.price - a.price);

            return (
              <div
                key={bar.time}
                className={`min-w-[170px] max-w-[200px] flex flex-col rounded border bg-[#0b0e14] shrink-0 transition-colors ${
                  isActive
                    ? 'border-cyan-500/60 shadow-lg shadow-cyan-950/20'
                    : 'border-[#21262d] hover:border-[#30363d]'
                }`}
              >
                {/* Candle Header */}
                <div
                  className={`px-2 py-1.5 border-b border-[#21262d] flex flex-col gap-0.5 ${
                    isBullish ? 'bg-emerald-950/20' : 'bg-rose-950/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-300">{formatTime(bar.time)}</span>
                    <span className={isBullish ? 'text-emerald-400' : 'text-rose-400'}>
                      {bar.close.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Vol: {formatNum(bar.volume)}</span>
                    <span
                      className={`font-semibold ${
                        isPositiveDelta ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      Δ {bar.delta > 0 ? '+' : ''}
                      {formatNum(bar.delta)}
                    </span>
                  </div>

                  {bar.possibleAbsorption && (
                    <div className="mt-0.5 flex items-center gap-1 text-[9px] text-purple-300 bg-purple-950/40 px-1 py-0.5 rounded border border-purple-800/40">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Possible absorption</span>
                    </div>
                  )}
                </div>

                {/* Footprint Rows */}
                <div className="flex-1 divide-y divide-[#161b22] overflow-y-auto max-h-[300px]">
                  {sortedLevels.map((lvl) => {
                    const isPoc = lvl.isPoc && config.pocVisible;
                    return (
                      <div
                        key={lvl.price}
                        className={`grid grid-cols-3 text-[10px] py-0.5 px-1.5 items-center ${
                          isPoc ? 'bg-amber-950/30 font-bold' : ''
                        }`}
                      >
                        {/* Bid */}
                        <div
                          className={`text-right pr-1 ${
                            lvl.isImbalanceSell && config.imbalanceVisible
                              ? 'text-rose-400 font-bold bg-rose-500/10 rounded'
                              : 'text-slate-400'
                          }`}
                        >
                          {formatNum(lvl.bidVolume)}
                        </div>

                        {/* Price */}
                        <div
                          className={`text-center font-mono ${
                            isPoc ? 'text-amber-400' : 'text-slate-300'
                          }`}
                        >
                          {lvl.price.toFixed(0)}
                        </div>

                        {/* Ask */}
                        <div
                          className={`text-left pl-1 ${
                            lvl.isImbalanceBuy && config.imbalanceVisible
                              ? 'text-emerald-400 font-bold bg-emerald-500/10 rounded'
                              : 'text-slate-400'
                          }`}
                        >
                          {formatNum(lvl.askVolume)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Candle Footer */}
                <div className="p-1.5 bg-[#161b22] border-t border-[#21262d] text-[10px] flex items-center justify-between text-slate-400">
                  <span>POC: {bar.pocPrice.toFixed(0)}</span>
                  <span>CVD: {formatNum(bar.cvd)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
