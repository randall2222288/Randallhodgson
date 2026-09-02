import React from 'react';
import { ChevronDown, Gauge, ShieldAlert } from 'lucide-react';
import { MarketPressureState } from './types';

interface Props {
  marketPressureScore: number; // -100 to +100
  marketPressureState: MarketPressureState;
  dominantPressureSide: string;
  buyingPressure: number;
  sellingPressure: number;
}

export const MarketPressureGauge: React.FC<Props> = ({
  marketPressureScore,
  marketPressureState,
  dominantPressureSide,
  buyingPressure,
  sellingPressure,
}) => {
  // Convert -100..+100 score to 0..100% position on the track
  const markerPercent = Math.max(2, Math.min(98, ((marketPressureScore + 100) / 200) * 100));

  const getStateBadge = () => {
    switch (marketPressureState) {
      case 'STRONG_BUY':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
            STRONG BUY
          </span>
        );
      case 'BUY':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            BUY BIAS
          </span>
        );
      case 'STRONG_SELL':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs">
            STRONG SELL
          </span>
        );
      case 'SELL':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-rose-950/80 text-rose-400 border border-rose-800/60">
            SELL BIAS
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-[#1f242c] text-slate-300 border border-[#30363d]">
            NEUTRAL FLOW
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-[#11161d] border border-[#21262d] rounded-lg p-3.5 flex flex-col gap-2.5 select-none shadow-md">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold text-slate-200 uppercase tracking-wider">
            Market Pressure Equilibrium
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">
            Dominance: <span className="font-bold text-slate-100">{dominantPressureSide}</span>
          </span>
          {getStateBadge()}
        </div>
      </div>

      {/* Main Gauge Graphic */}
      <div className="relative pt-2 pb-1">
        {/* Track */}
        <div className="h-3 w-full rounded-full bg-gradient-to-r from-rose-600 via-slate-700 to-emerald-600 p-[1px] shadow-inner relative overflow-hidden">
          {/* Subtle center tick mark */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-200 z-10 opacity-70" />
        </div>

        {/* Dynamic Needle / Marker Pin */}
        <div
          className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300 z-20"
          style={{ left: `${markerPercent}%` }}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-slate-100 border-2 border-cyan-400 shadow-md flex items-center justify-center animate-pulse">
            <div className="w-1 h-1 rounded-full bg-cyan-600" />
          </div>
          <ChevronDown className="w-3 h-3 text-cyan-300 -mt-1" />
        </div>
      </div>

      {/* Labels Bottom Row */}
      <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 px-1">
        <div className="flex items-center gap-1.5 text-rose-400 font-bold">
          <span>◄ SELLERS</span>
          <span className="text-rose-300">({sellingPressure}%)</span>
        </div>

        <div className="text-[10px] text-slate-500 font-semibold uppercase">
          Score: <span className="font-bold text-slate-300">{marketPressureScore > 0 ? `+${marketPressureScore}` : marketPressureScore}</span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <span className="text-emerald-300">({buyingPressure}%)</span>
          <span>BUYERS ►</span>
        </div>
      </div>
    </div>
  );
};
