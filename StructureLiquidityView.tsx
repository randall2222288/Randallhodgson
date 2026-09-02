import React from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Compass,
  Layers,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useTerminal } from '../../hooks/useTerminal';

export const StructureLiquidityView: React.FC = () => {
  const { aiState, symbol, timeframe } = useTerminal();
  const { marketStructure, liquidityZones } = aiState;

  return (
    <div className="w-full h-full bg-[#0d1117] text-slate-200 p-3 overflow-y-auto font-sans flex flex-col gap-3">
      {/* Top Banner: Market Structure Overview */}
      <div className="p-3 rounded-lg bg-[#161b22] border border-[#30363d] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 font-mono text-sm">MARKET STRUCTURE & INSTITUTIONAL LIQUIDITY</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs">
                {marketStructure.trend}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-sans">
              Sequence: <span className="font-mono text-slate-200 font-bold">{marketStructure.structureSequence}</span> | Phase: <span className="font-mono text-amber-300">{marketStructure.phase}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-[#11161d] px-3 py-1.5 rounded border border-[#21262d]">
            <span className="text-[10px] text-emerald-400 block font-sans">KEY SUPPORT</span>
            <span className="font-bold text-emerald-300">{marketStructure.keySupport.toFixed(5)}</span>
          </div>
          <div className="bg-[#11161d] px-3 py-1.5 rounded border border-[#21262d]">
            <span className="text-[10px] text-rose-400 block font-sans">KEY RESISTANCE</span>
            <span className="font-bold text-rose-300">{marketStructure.keyResistance.toFixed(5)}</span>
          </div>
        </div>
      </div>

      {/* Grid: BOS / CHoCH Breakout Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
        {/* Break of Structure (BOS) Card */}
        <div className="p-3 rounded-lg bg-[#11161d] border border-[#21262d] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              BREAK OF STRUCTURE (BOS)
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                marketStructure.breakOfStructure.detected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-[#161b22] text-slate-500 border border-[#21262d]'
              }`}
            >
              {marketStructure.breakOfStructure.detected ? 'CONFIRMED' : 'NONE DETECTED'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-sans">
            {marketStructure.breakOfStructure.detected ? (
              <p>
                {marketStructure.breakOfStructure.type} BOS established at level{' '}
                <span className="font-mono text-cyan-300 font-bold">{marketStructure.breakOfStructure.level.toFixed(5)}</span>, confirming institutional trend continuation.
              </p>
            ) : (
              <p>Price action remains within previous swing boundaries; structure is intact without breakout.</p>
            )}
          </div>
        </div>

        {/* Change of Character (CHoCH) Card */}
        <div className="p-3 rounded-lg bg-[#11161d] border border-[#21262d] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              CHANGE OF CHARACTER (CHoCH)
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                marketStructure.changeOfCharacter.detected
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-[#161b22] text-slate-500 border border-[#21262d]'
              }`}
            >
              {marketStructure.changeOfCharacter.detected ? 'DETECTED' : 'NONE DETECTED'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-sans">
            {marketStructure.changeOfCharacter.detected ? (
              <p>
                {marketStructure.changeOfCharacter.type} CHoCH reversal triggered at level{' '}
                <span className="font-mono text-purple-300 font-bold">{marketStructure.changeOfCharacter.level.toFixed(5)}</span>, signalling early trend exhaustion.
              </p>
            ) : (
              <p>No early reversal structural break detected. Primary trend direction remains intact.</p>
            )}
          </div>
        </div>
      </div>

      {/* Liquidity Pools & Order Blocks List */}
      <div className="p-3 rounded-lg bg-[#11161d] border border-[#21262d] flex flex-col gap-2.5">
        <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          INSTITUTIONAL LIQUIDITY POOLS & ORDER BLOCKS
        </span>

        <div className="space-y-2">
          {liquidityZones.length > 0 ? (
            liquidityZones.map(zone => {
              const isBull = zone.type.includes('BULL') || zone.type.includes('LOWS');
              return (
                <div
                  key={zone.id}
                  className="p-2.5 rounded-lg bg-[#161b22] border border-[#21262d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isBull ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    <div>
                      <span className="font-bold text-slate-200">{zone.label}</span>
                      <div className="text-[10px] text-slate-400 font-sans">
                        Range: {zone.priceLow.toFixed(5)} - {zone.priceHigh.toFixed(5)} | Touches: {zone.touches}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        zone.status === 'FRESH'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : zone.status === 'TESTED'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-slate-700 text-slate-400 border-slate-600'
                      }`}
                    >
                      {zone.status}
                    </span>
                    <span className="text-cyan-400 font-bold text-[11px]">{zone.strength}% str</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-slate-500 text-xs italic bg-[#161b22] rounded border border-[#21262d]">
              Mapping institutional resting liquidity and order blocks...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
