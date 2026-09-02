import React from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Layers,
  Percent,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useTerminal } from '../../hooks/useTerminal';
import { terminalStore } from '../../store/terminalStore';

export const MultiTimeframeView: React.FC = () => {
  const { aiState, timeframe, symbol } = useTerminal();
  const { multiTimeframe } = aiState;

  const tfList = [
    { key: '1m', name: '1 Minute (Entry)' },
    { key: '3m', name: '3 Minutes' },
    { key: '5m', name: '5 Minutes (Setup)' },
    { key: '15m', name: '15 Minutes (Structure)' },
    { key: '30m', name: '30 Minutes' },
    { key: '1H', name: '1 Hour (Main Trend)' },
    { key: '2H', name: '2 Hours' },
    { key: '4H', name: '4 Hours (Macro Trend)' },
    { key: '1D', name: '1 Day (Daily Bias)' },
    { key: '1W', name: '1 Week' },
  ];

  return (
    <div className="w-full h-full bg-[#0d1117] text-slate-200 p-3 overflow-y-auto font-sans flex flex-col gap-3">
      {/* Top Banner: Alignment Score & Conflict Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-[#161b22] border border-[#30363d]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 font-mono text-sm">MULTI-TIMEFRAME INTELLIGENCE MATRIX</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  multiTimeframe.alignmentStatus === 'STRONG_ALIGNMENT'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : multiTimeframe.alignmentStatus === 'CONFLICT'
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                }`}
              >
                {multiTimeframe.alignmentStatus} ({multiTimeframe.alignmentScore}%)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-sans">
              Macro Trend: <span className="font-mono text-slate-200 font-bold">{multiTimeframe.macroTrend}</span> | Main: <span className="font-mono text-cyan-400 font-bold">{multiTimeframe.mainTrend}</span> | Entry: <span className="font-mono text-slate-200">{multiTimeframe.entryTrend}</span>
            </div>
          </div>
        </div>

        <div className="font-mono text-xs text-right">
          <span className="text-slate-400 block text-[10px]">RECOMMENDATION:</span>
          <span
            className={`font-bold ${
              multiTimeframe.recommendation === 'CONFLUENCE_ALIGNED'
                ? 'text-emerald-400'
                : multiTimeframe.recommendation === 'WAIT_DUE_TO_CONFLICT'
                ? 'text-rose-400'
                : 'text-amber-400'
            }`}
          >
            {multiTimeframe.recommendation}
          </span>
        </div>
      </div>

      {/* Conflict Warning Banner if present */}
      {multiTimeframe.hasConflict && (
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>MTF Conflict Warning: Higher timeframe trend contradicts short-term momentum. Execution risk elevated; wait for alignment.</span>
        </div>
      )}

      {/* Multi-Timeframe Matrix Grid */}
      <div className="p-3 rounded-lg bg-[#11161d] border border-[#21262d] flex flex-col gap-2">
        <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          CROSS-TIMEFRAME ALIGNMENT TABLE
        </span>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#21262d] text-slate-400 text-[11px]">
                <th className="py-2 px-2">TIMEFRAME</th>
                <th className="py-2 px-2">TREND BIAS</th>
                <th className="py-2 px-2">STRENGTH SCORE</th>
                <th className="py-2 px-2">MOMENTUM</th>
                <th className="py-2 px-2">CLOSE POSITION</th>
                <th className="py-2 px-2">STRUCTURE</th>
                <th className="py-2 px-2 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d]">
              {tfList.map(item => {
                const data = multiTimeframe.timeframes[item.key] || {
                  timeframe: item.key,
                  trend: multiTimeframe.macroTrend || 'BULLISH',
                  strengthScore: 75,
                  momentum: 'STRONG',
                  structure: 'HH → HL',
                  closePosition: 'UPPER',
                  bias: 'BULLISH',
                };

                const isCurrent = timeframe === item.key;

                return (
                  <tr
                    key={item.key}
                    className={`hover:bg-[#161b22] transition-colors ${isCurrent ? 'bg-cyan-950/20' : ''}`}
                  >
                    <td className="py-2.5 px-2 font-bold flex items-center gap-2">
                      <span className={isCurrent ? 'text-cyan-400' : 'text-slate-200'}>{item.key}</span>
                      {isCurrent && <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300">ACTIVE</span>}
                    </td>

                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1">
                        {data.trend === 'BULLISH' ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                        ) : data.trend === 'BEARISH' ? (
                          <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <span className="w-3.5 h-0.5 bg-amber-400 inline-block" />
                        )}
                        <span
                          className={`font-semibold ${
                            data.trend === 'BULLISH'
                              ? 'text-emerald-400'
                              : data.trend === 'BEARISH'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {data.trend}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${data.strengthScore >= 70 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                            style={{ width: `${data.strengthScore}%` }}
                          />
                        </div>
                        <span className="font-bold">{data.strengthScore}/100</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-2">
                      <span className="text-slate-300">{data.momentum}</span>
                    </td>

                    <td className="py-2.5 px-2">
                      <span className="text-slate-300">{data.closePosition} 1/3</span>
                    </td>

                    <td className="py-2.5 px-2 text-slate-300">
                      <span>{data.structure}</span>
                    </td>

                    <td className="py-2.5 px-2 text-right">
                      <button
                        onClick={() => terminalStore.setTimeframe(item.key)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-[#161b22] hover:bg-[#21262d] text-slate-400 hover:text-slate-200 border border-[#30363d]'
                        }`}
                      >
                        {isCurrent ? 'Viewing' : 'Switch TF'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
