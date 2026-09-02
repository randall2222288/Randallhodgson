import React from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Check,
  CheckCheck,
  Sliders,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { useTerminal } from '../../hooks/useTerminal';
import { terminalStore } from '../../store/terminalStore';

export const AiAlertsDrawer: React.FC = () => {
  const { isAlertsOpen, aiState } = useTerminal();
  const { alerts, alertConfig } = aiState;

  if (!isAlertsOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-[#0d1117] border-l border-[#30363d] shadow-2xl z-50 flex flex-col font-sans">
      {/* Drawer Header */}
      <div className="p-3 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-sm font-bold text-slate-100">AI SIGNAL ALERTS</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
            {alerts.filter(a => !a.read).length} new
          </span>
        </div>

        <button
          onClick={() => terminalStore.toggleAlerts()}
          className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-[#21262d] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Alert Configuration Bar */}
      <div className="p-3 bg-[#11161d] border-b border-[#21262d] flex flex-col gap-2 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Min Confidence Threshold:
          </span>
          <span className="font-bold text-cyan-300">{alertConfig.minConfidence}%</span>
        </div>

        <input
          type="range"
          min="50"
          max="95"
          step="5"
          value={alertConfig.minConfidence}
          onChange={e => terminalStore.setAlertConfig({ minConfidence: Number(e.target.value) })}
          className="w-full accent-cyan-400 cursor-pointer"
        />

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Sound Notifications:</span>
          <button
            onClick={() => terminalStore.setAlertConfig({ soundEnabled: !alertConfig.soundEnabled })}
            className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer ${
              alertConfig.soundEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-[#161b22] text-slate-400 border border-[#30363d]'
            }`}
          >
            {alertConfig.soundEnabled ? <Volume2 className="w-3 h-3 text-cyan-400" /> : <VolumeX className="w-3 h-3 text-slate-500" />}
            <span>{alertConfig.soundEnabled ? 'Enabled' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {alerts.length > 0 ? (
          alerts.map(alert => {
            const isBuy = alert.signal === 'BUY';
            const isSell = alert.signal === 'SELL';
            const timeStr = new Date(alert.timestamp).toLocaleTimeString();

            return (
              <div
                key={alert.id}
                onClick={() => terminalStore.markAlertRead(alert.id)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  alert.read
                    ? 'bg-[#161b22]/50 border-[#21262d] opacity-75'
                    : 'bg-[#161b22] border-cyan-500/40 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <div className="flex items-center gap-1.5">
                    {isBuy ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isSell ? (
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span
                      className={`font-bold ${
                        isBuy ? 'text-emerald-400' : isSell ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {alert.signal} ({alert.confidence}%)
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500">{timeStr}</span>
                </div>

                <p className="text-[11px] text-slate-300 font-sans leading-snug">{alert.reason}</p>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1.5 pt-1 border-t border-[#21262d]">
                  <span>Zone: {alert.entryZone}</span>
                  <span>SL: {alert.stopLoss.toFixed(4)}</span>
                  {!alert.read && <span className="text-cyan-400 font-bold">NEW</span>}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs italic">
            No alerts yet. High confidence setups (&ge;{alertConfig.minConfidence}%) will trigger alert cards and audio notifications here.
          </div>
        )}
      </div>
    </div>
  );
};
