import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { useTerminal } from '../../hooks/useTerminal';
import { terminalStore } from '../../store/terminalStore';

export const VolumeProfileView: React.FC = () => {
  const { volumeProfile, stats, config } = useTerminal();
  const [profileMode, setProfileMode] = useState<'session' | 'candle' | 'day' | 'visible'>('session');

  const levels = volumeProfile?.levels || [];
  const maxVol = Math.max(...levels.map(l => l.volume), 1);

  const formatNum = (n: number) => {
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toFixed(1);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1117] text-slate-200 font-mono text-xs select-none">
      {/* Volume Profile Control Bar */}
      <div className="h-8 bg-[#161b22] border-b border-[#21262d] px-3 flex items-center justify-between shrink-0 text-[11px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>Volume Profile & Value Area (70%)</span>
          </div>
          <span className="text-amber-400 font-bold">
            POC: {volumeProfile?.pocPrice.toLocaleString() || stats.pocPrice.toLocaleString()}
          </span>
          <span className="text-cyan-300">
            VAH: {volumeProfile?.vahPrice.toLocaleString() || stats.vahPrice.toLocaleString()}
          </span>
          <span className="text-cyan-300">
            VAL: {volumeProfile?.valPrice.toLocaleString() || stats.valPrice.toLocaleString()}
          </span>
        </div>

        {/* Profile Mode selector */}
        <div className="flex items-center bg-[#0b0e14] p-0.5 rounded border border-[#30363d] text-[10px]">
          {(['session', 'candle', 'day', 'visible'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setProfileMode(m);
                terminalStore.updateConfig({ sessionMode: m });
              }}
              className={`px-2 py-0.5 rounded uppercase transition-colors ${
                profileMode === m
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Table Column Headers */}
      <div className="grid grid-cols-12 gap-1 bg-[#0b0e14] py-1 px-3 border-b border-[#21262d] text-[10px] text-slate-400 uppercase tracking-wider font-semibold shrink-0">
        <div className="col-span-2 text-left">Price</div>
        <div className="col-span-6 text-left">Volume Distribution (Buy / Sell)</div>
        <div className="col-span-2 text-right">Volume</div>
        <div className="col-span-2 text-right">Node</div>
      </div>

      {/* Profile Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#161b22]/50 custom-scrollbar">
        {levels.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500">
            Calculating Volume Profile distribution...
          </div>
        ) : (
          levels.map((lvl) => {
            const isPoc = lvl.isPoc && config.pocVisible;
            const isVah = lvl.isVah;
            const isVal = lvl.isVal;

            const totalPercent = Math.min(100, (lvl.volume / maxVol) * 100);
            const buyRatio = lvl.volume > 0 ? lvl.buyVolume / lvl.volume : 0.5;
            const buyPercent = totalPercent * buyRatio;
            const sellPercent = totalPercent * (1 - buyRatio);

            return (
              <div
                key={lvl.price}
                className={`grid grid-cols-12 gap-1 px-3 py-1 items-center hover:bg-[#161b22] transition-colors ${
                  isPoc
                    ? 'bg-amber-950/25 border-y border-amber-500/40'
                    : isVah || isVal
                    ? 'bg-cyan-950/15'
                    : ''
                }`}
              >
                {/* Price */}
                <div className="col-span-2 flex items-center gap-1.5 font-semibold">
                  <span className={isPoc ? 'text-amber-400 font-bold' : isVah || isVal ? 'text-cyan-300' : 'text-slate-300'}>
                    {lvl.price.toFixed(2)}
                  </span>
                  {isPoc && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
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

                {/* Histogram bar (Split Buy / Sell) */}
                <div className="col-span-6 flex items-center h-4.5 bg-[#161b22] rounded overflow-hidden">
                  {/* Buy Volume part (Green) */}
                  <div
                    className="h-full bg-emerald-500/40 transition-all"
                    style={{ width: `${buyPercent}%` }}
                    title={`Buy Aggression: ${lvl.buyVolume.toFixed(1)}`}
                  />
                  {/* Sell Volume part (Red) */}
                  <div
                    className="h-full bg-rose-500/40 transition-all"
                    style={{ width: `${sellPercent}%` }}
                    title={`Sell Aggression: ${lvl.sellVolume.toFixed(1)}`}
                  />
                </div>

                {/* Total Volume */}
                <div className="col-span-2 text-right text-slate-200 font-medium">
                  {formatNum(lvl.volume)}
                </div>

                {/* High / Low Volume Node badge */}
                <div className="col-span-2 text-right">
                  {lvl.isHvn && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold">
                      HVN
                    </span>
                  )}
                  {lvl.isLvn && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/30 text-slate-400">
                      LVN
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
