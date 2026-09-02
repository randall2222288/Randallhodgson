import React from 'react';
import { Compass, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';

interface Props {
  greenProbability: number;
  redProbability: number;
  neutralProbability: number;
  confidenceLevel: string;
}

export const NextCandleProbabilityCard: React.FC<Props> = ({
  greenProbability,
  redProbability,
  neutralProbability,
  confidenceLevel,
}) => {
  return (
    <div className="w-full bg-[#11161d] border border-[#21262d] rounded-lg p-3.5 flex flex-col gap-3 font-mono text-xs select-none shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wider text-xs">
            Next Candle Direction Probabilities
          </span>
        </div>

        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            confidenceLevel.includes('HIGH')
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : confidenceLevel.includes('NORMAL')
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          {confidenceLevel}
        </span>
      </div>

      {/* Probabilities 3-column breakdown */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Green Probability */}
        <div className="p-3 rounded-lg bg-gradient-to-b from-emerald-950/40 to-[#161b22] border border-emerald-500/30 flex flex-col items-center justify-center gap-1 text-center">
          <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Green Candle
          </span>
          <span className="text-2xl font-black text-emerald-400">
            {greenProbability}%
          </span>
          <span className="text-[9px] text-slate-400">Bullish Momentum</span>
        </div>

        {/* Red Probability */}
        <div className="p-3 rounded-lg bg-gradient-to-b from-rose-950/40 to-[#161b22] border border-rose-500/30 flex flex-col items-center justify-center gap-1 text-center">
          <span className="text-[10px] text-rose-400 font-bold uppercase flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            Red Candle
          </span>
          <span className="text-2xl font-black text-rose-400">
            {redProbability}%
          </span>
          <span className="text-[9px] text-slate-400">Bearish Pressure</span>
        </div>

        {/* Neutral / Uncertain Probability */}
        <div className="p-3 rounded-lg bg-gradient-to-b from-slate-900/60 to-[#161b22] border border-slate-700 flex flex-col items-center justify-center gap-1 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            Neutral / Doji
          </span>
          <span className="text-2xl font-black text-slate-300">
            {neutralProbability}%
          </span>
          <span className="text-[9px] text-slate-500">Equilibrium Range</span>
        </div>
      </div>

      {/* Multi-Segment Probability Bar */}
      <div className="w-full h-2.5 rounded-full bg-[#161b22] border border-[#21262d] overflow-hidden flex">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${greenProbability}%` }}
          title={`Green Candle: ${greenProbability}%`}
        />
        <div
          className="h-full bg-slate-600 transition-all duration-300"
          style={{ width: `${neutralProbability}%` }}
          title={`Neutral: ${neutralProbability}%`}
        />
        <div
          className="h-full bg-rose-500 transition-all duration-300"
          style={{ width: `${redProbability}%` }}
          title={`Red Candle: ${redProbability}%`}
        />
      </div>
    </div>
  );
};
