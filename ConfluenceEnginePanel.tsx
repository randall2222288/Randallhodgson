import React from 'react';
import { Check, CheckCircle2, Cpu, HelpCircle, ListFilter, X, XCircle } from 'lucide-react';
import { ConfluenceItem, ConfluenceVerdict } from './types';

interface Props {
  items: ConfluenceItem[];
  verdict: ConfluenceVerdict;
  bullishCount: number;
  bearishCount: number;
}

export const ConfluenceEnginePanel: React.FC<Props> = ({
  items,
  verdict,
  bullishCount,
  bearishCount,
}) => {
  const getVerdictDisplay = () => {
    switch (verdict) {
      case 'HIGH_BULLISH':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>HIGH BULLISH CONFLUENCE ({bullishCount}/{items.length})</span>
          </div>
        );
      case 'HIGH_BEARISH':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>HIGH BEARISH CONFLUENCE ({bearishCount}/{items.length})</span>
          </div>
        );
      case 'INSUFFICIENT_DATA':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>INSUFFICIENT DATA</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#1f242c] border border-[#30363d] text-slate-300 font-semibold text-xs">
            <ListFilter className="w-4 h-4 text-slate-400" />
            <span>MIXED MARKET CONDITIONS</span>
          </div>
        );
    }
  };

  return (
    <div className="w-full bg-[#11161d] border border-[#21262d] rounded-lg p-3.5 flex flex-col gap-3 font-mono text-xs select-none shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wider text-xs">
            Order Flow Confluence Matrix
          </span>
        </div>
        {getVerdictDisplay()}
      </div>

      {/* Checklist items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-2 rounded border flex items-center justify-between transition-colors ${
              item.isBullish
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : item.isBearish
                ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                : 'bg-[#161b22] border-[#21262d] text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  item.isBullish
                    ? 'bg-emerald-500/30 text-emerald-400'
                    : item.isBearish
                    ? 'bg-rose-500/30 text-rose-400'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {item.isBullish ? '✓' : item.isBearish ? '✗' : '•'}
              </div>
              <span className="font-semibold truncate">{item.label}</span>
            </div>

            <span className="text-[10px] text-slate-400 shrink-0 ml-2 font-mono">
              {item.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
