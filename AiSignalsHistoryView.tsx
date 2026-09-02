import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  CheckCircle2,
  Clock,
  Filter,
  Shield,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useTerminal } from '../../hooks/useTerminal';
import { AISignal } from '../../types/ai';

export const AiSignalsHistoryView: React.FC = () => {
  const { aiState } = useTerminal();
  const { signalHistory, validationStats, latestSignal } = aiState;
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'WAIT'>('ALL');

  const filteredSignals = signalHistory.filter(sig => {
    if (filter === 'ALL') return true;
    return sig.signal === filter;
  });

  return (
    <div className="w-full h-full bg-[#0d1117] text-slate-200 p-3 overflow-y-auto font-sans flex flex-col gap-3">
      {/* Top Stat Cards: Model Validation & Backtest Win Rate */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-lg bg-[#11161d] border border-[#21262d] font-mono">
          <span className="text-[10px] text-slate-400 block font-sans flex items-center gap-1">
            <Award className="w-3 h-3 text-cyan-400" />
            PREDICTION ACCURACY
          </span>
          <span className="text-xl font-bold text-cyan-300">{validationStats.predictionAccuracy}%</span>
          <span className="text-[10px] text-slate-500 block">Directional confluence</span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#11161d] border border-[#21262d] font-mono">
          <span className="text-[10px] text-emerald-400 block font-sans flex items-center gap-1">
            <Target className="w-3 h-3 text-emerald-400" />
            BUY WIN RATE
          </span>
          <span className="text-xl font-bold text-emerald-400">{validationStats.buyWinRate}%</span>
          <span className="text-[10px] text-slate-500 block">Hit TP1 / TP2</span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#11161d] border border-[#21262d] font-mono">
          <span className="text-[10px] text-rose-400 block font-sans flex items-center gap-1">
            <Shield className="w-3 h-3 text-rose-400" />
            SELL WIN RATE
          </span>
          <span className="text-xl font-bold text-rose-400">{validationStats.sellWinRate}%</span>
          <span className="text-[10px] text-slate-500 block">Hit TP1 / TP2</span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#11161d] border border-[#21262d] font-mono">
          <span className="text-[10px] text-amber-400 block font-sans flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-amber-400" />
            WAIT ACCURACY
          </span>
          <span className="text-xl font-bold text-amber-300">{validationStats.waitAccuracy}%</span>
          <span className="text-[10px] text-slate-500 block">Avoided chop</span>
        </div>
      </div>

      {/* Signal History Table Header & Filters */}
      <div className="p-3 rounded-lg bg-[#11161d] border border-[#21262d] flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            AI SIGNAL HISTORY & BACKTEST TRACKER
          </span>

          <div className="flex items-center gap-1 font-mono text-[10px]">
            <Filter className="w-3 h-3 text-slate-400 mr-1" />
            {(['ALL', 'BUY', 'SELL', 'WAIT'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                    : 'bg-[#161b22] text-slate-400 border-[#21262d] hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Signals List */}
        <div className="space-y-2">
          {filteredSignals.length > 0 ? (
            filteredSignals.map(sig => {
              const isBuy = sig.signal === 'BUY';
              const isSell = sig.signal === 'SELL';
              const dateStr = new Date(sig.timestamp).toLocaleTimeString();

              return (
                <div
                  key={sig.id}
                  className="p-3 rounded-lg bg-[#161b22] border border-[#21262d] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono"
                >
                  {/* Left: Signal Badge & Symbol */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg border ${
                        isBuy
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : isSell
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      }`}
                    >
                      {isBuy ? <ArrowUpRight className="w-4 h-4" /> : isSell ? <ArrowDownRight className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{sig.signal}</span>
                        <span className="text-[10px] text-cyan-400 font-bold">({sig.confidenceScore}% Conf)</span>
                        <span className="text-[10px] text-slate-400">{sig.symbol} - {sig.timeframe}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans">
                        {dateStr} | Quality: <span className="text-slate-300 font-bold">{sig.signalQuality}</span> | Risk: <span className="text-slate-300 font-bold">{sig.riskLevel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Entry, SL, TP */}
                  <div className="grid grid-cols-3 gap-3 text-[11px] bg-[#11161d] px-3 py-1.5 rounded border border-[#21262d]">
                    <div>
                      <span className="text-[9px] text-slate-500 block">ENTRY</span>
                      <span className="text-slate-200 font-bold">{sig.entryPrice.toFixed(5)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-rose-400 block">SL</span>
                      <span className="text-rose-300 font-bold">{sig.stopLoss.toFixed(5)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-emerald-400 block">TP1</span>
                      <span className="text-emerald-300 font-bold">{sig.takeProfit[0]?.toFixed(5)}</span>
                    </div>
                  </div>

                  {/* Right: Outcome Status */}
                  <div className="text-right shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        sig.result?.status === 'HIT_TP1' || sig.result?.status === 'HIT_TP2'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : sig.result?.status === 'HIT_SL'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      }`}
                    >
                      {sig.result?.status || 'PENDING'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">R:R {sig.riskRewardRatio}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs italic bg-[#161b22] rounded border border-[#21262d]">
              No past signals logged yet. When real market conditions trigger high-confluence setups (&gt;70% confidence), they will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
