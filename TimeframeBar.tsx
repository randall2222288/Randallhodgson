import React from 'react';
import { Clock } from 'lucide-react';
import { useTerminal } from '../../hooks/useTerminal';
import { terminalStore } from '../../store/terminalStore';

export const TIMEFRAMES = [
  { id: '1m', label: '1m', type: 'minute' },
  { id: '3m', label: '3m', type: 'minute' },
  { id: '5m', label: '5m', type: 'minute' },
  { id: '15m', label: '15m', type: 'minute' },
  { id: '30m', label: '30m', type: 'minute' },
  { id: '1H', label: '1H', type: 'hour' },
  { id: '2H', label: '2H', type: 'hour' },
  { id: '4H', label: '4H', type: 'hour' },
  { id: '1D', label: '1D', type: 'day' },
  { id: '1W', label: '1W', type: 'week' },
];

interface TimeframeBarProps {
  compact?: boolean;
  className?: string;
}

export const TimeframeBar: React.FC<TimeframeBarProps> = ({ compact = false, className = '' }) => {
  const { timeframe } = useTerminal();

  return (
    <div className={`flex items-center gap-1 bg-[#11161d] p-0.5 rounded border border-[#21262d] select-none ${className}`}>
      {!compact && (
        <div className="flex items-center gap-1 px-1.5 text-slate-500 text-[10px] font-mono border-r border-[#21262d]">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span className="hidden md:inline">TF</span>
        </div>
      )}
      <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar font-mono">
        {TIMEFRAMES.map(tf => {
          const isActive = timeframe === tf.id;
          return (
            <button
              key={tf.id}
              id={`tf-btn-${tf.id}`}
              onClick={() => terminalStore.setTimeframe(tf.id)}
              title={`Switch to ${tf.label} timeframe (recalculates candles & AI)`}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[#161b22]'
              }`}
            >
              {tf.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
