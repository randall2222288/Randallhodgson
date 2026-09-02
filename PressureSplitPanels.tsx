import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { AggressionLevel } from './types';

interface Props {
  buyingPressure: number;
  sellingPressure: number;
  buyingAggression: number;
  sellingAggression: number;
  buyingAggressionLevel: AggressionLevel;
  sellingAggressionLevel: AggressionLevel;
  buyAbsorptionStrength: number;
  sellAbsorptionStrength: number;
  buyAbsorptionDetected: boolean;
  sellAbsorptionDetected: boolean;
  buyVolume: number;
  sellVolume: number;
  currentDelta: number;
  cumulativeDelta: number;
}

export const PressureSplitPanels: React.FC<Props> = ({
  buyingPressure,
  sellingPressure,
  buyingAggression,
  sellingAggression,
  buyingAggressionLevel,
  sellingAggressionLevel,
  buyAbsorptionStrength,
  sellAbsorptionStrength,
  buyAbsorptionDetected,
  sellAbsorptionDetected,
  buyVolume,
  sellVolume,
  currentDelta,
  cumulativeDelta,
}) => {
  const getAggressionBadge = (level: AggressionLevel, isBuy: boolean) => {
    const baseColor = isBuy
      ? level === 'EXTREME' || level === 'HIGH'
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
      : level === 'EXTREME' || level === 'HIGH'
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
      : 'bg-rose-950/40 text-rose-400 border-rose-800/40';

    return (
      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${baseColor}`}>
        {level}
      </span>
    );
  };

  const formatNum = (n: number) => {
    if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* 🟢 BUYING PRESSURE PANEL (LEFT) */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#0c1e19] via-[#0d161d] to-[#11161d] border border-emerald-500/30 p-3.5 flex flex-col justify-between gap-3 shadow-lg">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Title & Main Large Percentage */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-emerald-300 tracking-wider block">
                BUYING PRESSURE
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Bulls / Ask Aggressors</span>
            </div>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl lg:text-4xl font-black font-mono text-emerald-400 tracking-tight">
              {buyingPressure}%
            </span>
          </div>
        </div>

        {/* Pressure Progress Bar */}
        <div className="w-full h-2 rounded-full bg-[#161b22] overflow-hidden border border-[#21262d] z-10">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
            style={{ width: `${buyingPressure}%` }}
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono z-10 pt-1 border-t border-emerald-900/30">
          {/* Buying Aggression */}
          <div className="p-2 rounded bg-[#161b22]/70 border border-[#21262d] flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                Aggression:
              </span>
              {getAggressionBadge(buyingAggressionLevel, true)}
            </div>
            <div className="text-base font-bold text-emerald-300">
              {buyingAggression}%
            </div>
          </div>

          {/* Buy Absorption */}
          <div className="p-2 rounded bg-[#161b22]/70 border border-[#21262d] flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-cyan-400" />
                Absorption:
              </span>
              {buyAbsorptionDetected ? (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                  ACTIVE
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono text-slate-500 bg-[#1f242c]">
                  NONE
                </span>
              )}
            </div>
            <div className="text-base font-bold text-cyan-300">
              {buyAbsorptionStrength > 0 ? `${buyAbsorptionStrength}%` : '0%'}
            </div>
          </div>

          {/* Buy Volume */}
          <div className="p-2 rounded bg-[#161b22]/70 border border-[#21262d] flex flex-col gap-1">
            <span className="text-slate-400 text-[11px]">Buy Volume:</span>
            <div className="text-sm font-bold text-slate-100">
              {formatNum(buyVolume)}
            </div>
          </div>

          {/* Delta & Cumulative Delta */}
          <div className="p-2 rounded bg-[#161b22]/70 border border-[#21262d] flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>Delta:</span>
              <span className={`font-bold ${currentDelta >= 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {currentDelta > 0 ? '+' : ''}{formatNum(currentDelta)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>CVD:</span>
              <span className={`font-bold ${cumulativeDelta >= 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {cumulativeDelta > 0 ? '+' : ''}{formatNum(cumulativeDelta)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔴 SELLING PRESSURE PANEL (RIGHT) */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#200e12] via-[#140d11] to-[#11161d] border border-rose-500/30 p-3.5 flex flex-col justify-between gap-3 shadow-lg">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Title & Main Large Percentage */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-rose-300 tracking-wider block">
                SELLING PRESSURE
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Bears / Bid Aggressors</span>
            </div>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl lg:text-4xl font-black font-mono text-rose-400 tracking-tight">
              {sellingPressure}%
            </span>
          </div>
        </div>

        {/* Pressure Progress Bar */}
        <div className="w-full h-2 rounded-full bg-[#161b22] overflow-hidden border border-[#21262d] z-10">
          <div
            className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300"
            style={{ width: `${sellingPressure}%` }}
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono z-10 pt-1 border-t border-rose-900/30">
          {/* Selling Aggression */}
          <div className="p-2 rounded bg-[#161b22]/70 border border-[#21262d] flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-rose-400" />
                Aggression:
              </span>
              {getAggressionBadge(sellingAggressionLevel, false)}
            </div>
            <div className="text-base font-bold text-rose-300">
              {sellingAggression}%
            </div>
          </div>

          {/* Sell Absorption */}
          <div className="p-2 rounded bg-[#161b22]/70 border border-[#21262d] flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-amber-400" />
                Absorption:
              </span>
              {sellAbsorptionDetected ? (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  ACTIVE
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono text-slate-500 bg-[#1f242c]">
                  NONE
                </span>
              )}
            </div>
            <div className="text-base font-bold text-amber-300">
              {sellAbsorptionStrength > 0 ? `${sellAbsorptionStrength}%` : '0%'}
            </div>
          </div>

          {/* Sell Volume */}
          <div className="p-2 rounded bg-[#161b22]/70 border border-[#21262d] flex flex-col gap-1">
            <span className="text-slate-400 text-[11px]">Sell Volume:</span>
            <div className="text-sm font-bold text-slate-100">
              {formatNum(sellVolume)}
            </div>
          </div>

          {/* Delta & Cumulative Delta */}
          <div className="p-2 rounded bg-[#161b22]/70 border border-[#21262d] flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>Delta:</span>
              <span className={`font-bold ${currentDelta < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {currentDelta < 0 ? '' : '+'}{formatNum(currentDelta)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>CVD:</span>
              <span className={`font-bold ${cumulativeDelta < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {cumulativeDelta < 0 ? '' : '+'}{formatNum(cumulativeDelta)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
