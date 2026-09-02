import React from 'react';
import { CheckCircle2, Clock, History, TrendingDown, TrendingUp, XCircle } from 'lucide-react';
import { AISignal } from '../../../types/ai';

interface Props {
  signalHistory: AISignal[];
  decimals: number;
}

export const SignalHistoryTable: React.FC<Props> = ({ signalHistory, decimals }) => {
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString();
  };

  const getResultBadge = (sig: AISignal) => {
    if (!sig.result || sig.result.status === 'PENDING') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          PENDING
        </span>
      );
    }
    if (sig.result.status === 'HIT_TP1' || sig.result.status === 'HIT_TP2') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5 justify-center">
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span>WIN {sig.result.pnlPips ? `(+${sig.result.pnlPips}p)` : ''}</span>
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-0.5 justify-center">
        <XCircle className="w-2.5 h-2.5" />
        <span>LOSS {sig.result.pnlPips ? `(${sig.result.pnlPips}p)` : ''}</span>
      </span>
    );
  };

  return (
    <div className="w-full bg-[#11161d] border border-[#21262d] rounded-lg overflow-hidden flex flex-col font-mono text-xs select-none shadow-md">
      {/* Header */}
      <div className="h-9 bg-[#161b22] px-3 border-b border-[#21262d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 text-xs uppercase tracking-wider">
            Order Flow Signals History Log
          </span>
        </div>
        <span className="text-[10px] text-slate-400">
          Logged Signals: <strong className="text-cyan-300">{signalHistory.length}</strong>
        </span>
      </div>

      {/* Table Head */}
      <div className="grid grid-cols-7 bg-[#0c1017] px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#21262d]">
        <div>Time</div>
        <div>Symbol</div>
        <div>TF</div>
        <div>Bias</div>
        <div className="text-center">Confidence</div>
        <div className="text-right">Entry Price</div>
        <div className="text-center">Result</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-[#1e232d] max-h-48 overflow-y-auto">
        {signalHistory.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            No historical signals recorded in this session.
          </div>
        ) : (
          signalHistory.map((sig) => {
            const isBuy = sig.signal === 'BUY';
            const isSell = sig.signal === 'SELL';

            return (
              <div
                key={sig.id}
                className="grid grid-cols-7 px-3 py-1.5 items-center hover:bg-[#161b22] transition-colors text-xs"
              >
                <div className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{formatTime(sig.timestamp)}</span>
                </div>

                <div className="font-bold text-slate-200">{sig.symbol}</div>

                <div className="text-cyan-400 font-semibold">{sig.timeframe}</div>

                <div>
                  {isBuy ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      BUY
                    </span>
                  ) : isSell ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      SELL
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400">
                      WAIT
                    </span>
                  )}
                </div>

                <div className="text-center font-bold text-slate-100">
                  {sig.confidenceScore}%
                </div>

                <div className="text-right text-slate-200 font-mono">
                  {sig.entryPrice.toLocaleString(undefined, {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                  })}
                </div>

                <div className="text-center">{getResultBadge(sig)}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
