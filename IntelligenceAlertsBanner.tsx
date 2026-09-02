import React from 'react';
import { AlertCircle, Bell, CheckCircle2, ShieldAlert, Sparkles, X, Zap } from 'lucide-react';
import { IntelligenceAlert } from './types';

interface Props {
  alerts: IntelligenceAlert[];
  onDismiss?: (id: string) => void;
}

export const IntelligenceAlertsBanner: React.FC<Props> = ({ alerts, onDismiss }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-1.5 select-none font-mono text-xs">
      {alerts.slice(0, 3).map((alert) => {
        const isBull = alert.severity === 'bullish';
        const isBear = alert.severity === 'bearish';

        return (
          <div
            key={alert.id}
            className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 animate-in slide-in-from-top duration-200 shadow-sm ${
              isBull
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                : isBear
                ? 'bg-rose-950/70 border-rose-500/50 text-rose-200'
                : 'bg-amber-950/70 border-amber-500/50 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  isBull
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isBear
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {isBull ? (
                  <Zap className="w-3.5 h-3.5" />
                ) : isBear ? (
                  <ShieldAlert className="w-3.5 h-3.5" />
                ) : (
                  <Bell className="w-3.5 h-3.5" />
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider">
                    {alert.title}
                  </span>
                  <span className="text-[10px] opacity-75">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <span className="text-[11px] opacity-90">{alert.message}</span>
              </div>
            </div>

            {onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
