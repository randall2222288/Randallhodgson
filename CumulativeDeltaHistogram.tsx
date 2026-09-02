import React from 'react';
import { BarChart3, LineChart, TrendingDown, TrendingUp } from 'lucide-react';
import { FootprintBar } from '../../../types/market';
import { CumulativeDeltaPeriod } from './types';

interface Props {
  cumulativeDelta: number;
  period: CumulativeDeltaPeriod;
  onPeriodChange: (p: CumulativeDeltaPeriod) => void;
  historicalBars: FootprintBar[];
  activeBar: FootprintBar | null;
}

export const CumulativeDeltaHistogram: React.FC<Props> = ({
  cumulativeDelta,
  period,
  onPeriodChange,
  historicalBars,
  activeBar,
}) => {
  // Aggregate recent bars for visual histogram
  const barsData = React.useMemo(() => {
    const bars = [...historicalBars];
    if (activeBar) bars.push(activeBar);

    const slice = bars.slice(-14);
    let runningCvd = 0;

    return slice.map((b, idx) => {
      runningCvd += b.delta || 0;
      return {
        id: idx,
        delta: b.delta || 0,
        cvd: runningCvd,
        time: b.time,
        isBullish: (b.delta || 0) >= 0,
      };
    });
  }, [historicalBars, activeBar]);

  const maxDelta = Math.max(
    1,
    ...barsData.map(b => Math.abs(b.delta))
  );

  const formatNum = (n: number) => {
    if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  return (
    <div className="w-full bg-[#11161d] border border-[#21262d] rounded-lg p-3.5 flex flex-col gap-3 font-mono text-xs select-none shadow-md">
      {/* Top Controls & Value */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wider text-xs">
            Cumulative Delta Histogram
          </span>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-[#161b22] p-0.5 rounded border border-[#21262d]">
          <button
            onClick={() => onPeriodChange('candle')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors ${
              period === 'candle'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Candle
          </button>
          <button
            onClick={() => onPeriodChange('visible')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors ${
              period === 'visible'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Visible (15B)
          </button>
          <button
            onClick={() => onPeriodChange('session')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors ${
              period === 'session'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Session CVD
          </button>
        </div>
      </div>

      {/* Main Total Value Display */}
      <div className="flex items-center justify-between px-2 py-1.5 rounded bg-[#161b22] border border-[#21262d]">
        <span className="text-[11px] text-slate-400">Total Delta Value ({period}):</span>
        <div className="flex items-center gap-1.5 text-sm font-black">
          {cumulativeDelta >= 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-400" />
          )}
          <span className={cumulativeDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {cumulativeDelta > 0 ? '+' : ''}{formatNum(cumulativeDelta)}
          </span>
        </div>
      </div>

      {/* Histogram Chart Bars */}
      <div className="h-24 w-full flex items-center gap-1.5 pt-2 pb-1 border-t border-[#21262d] relative">
        {/* Zero baseline */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-700 pointer-events-none" />

        {barsData.map((bar, i) => {
          const heightRatio = Math.min(1, Math.abs(bar.delta) / maxDelta);
          const heightPx = Math.max(4, Math.round(heightRatio * 38));

          return (
            <div
              key={i}
              className="flex-1 h-full flex flex-col items-center justify-center relative group cursor-pointer"
            >
              {/* Top half bar (Positive Delta) */}
              <div className="h-1/2 w-full flex items-end justify-center">
                {bar.isBullish && (
                  <div
                    className="w-full max-w-[14px] rounded-t-xs bg-emerald-500 hover:bg-emerald-400 transition-all"
                    style={{ height: `${heightPx}px` }}
                  />
                )}
              </div>

              {/* Bottom half bar (Negative Delta) */}
              <div className="h-1/2 w-full flex items-start justify-center">
                {!bar.isBullish && (
                  <div
                    className="w-full max-w-[14px] rounded-b-xs bg-rose-500 hover:bg-rose-400 transition-all"
                    style={{ height: `${heightPx}px` }}
                  />
                )}
              </div>

              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-1 z-30 bg-[#0b0e14] border border-[#30363d] rounded px-1.5 py-0.5 text-[9px] text-slate-200 pointer-events-none whitespace-nowrap shadow-lg">
                Δ: {bar.delta > 0 ? '+' : ''}{formatNum(bar.delta)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
