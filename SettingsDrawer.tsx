import React from 'react';
import { Bot, CheckSquare, Cpu, Sliders, Sparkles, Square, Volume2, VolumeX, X, Zap } from 'lucide-react';
import { useTerminal } from '../../hooks/useTerminal';
import { terminalStore } from '../../store/terminalStore';

export const SettingsDrawer: React.FC = () => {
  const { isSettingsOpen, config, isRealData, aiState } = useTerminal();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs select-none">
      <div className="w-80 md:w-96 h-full bg-[#11161d] border-l border-[#21262d] shadow-2xl flex flex-col text-slate-200 font-sans animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="h-12 border-b border-[#21262d] px-4 flex items-center justify-between bg-[#161b22]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase font-mono tracking-wider">
              Terminal Settings
            </h2>
          </div>
          <button
            onClick={() => terminalStore.toggleSettings()}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-[#21262d] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 font-mono text-xs no-scrollbar">
          {/* Section: AI Market Brain Engine */}
          <div className="space-y-2.5 p-3 rounded-lg bg-[#161b22] border border-cyan-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-100 text-xs">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>AI Market Brain Engine</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                {aiState.provider === 'openai' ? 'OpenAI Market Brain' : aiState.provider === 'gemini' ? 'Gemini AI' : 'Rule Engine'}
              </span>
            </div>

            <div className="space-y-2 pt-1 text-[11px] font-sans">
              <div className="flex justify-between items-center text-slate-300">
                <span>Signal Min Confidence:</span>
                <span className="font-mono text-cyan-400 font-bold">{aiState.alertConfig.minConfidence}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={aiState.alertConfig.minConfidence}
                onChange={e => terminalStore.setAlertConfig({ minConfidence: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Section: Data Source Selection */}
          <div className="space-y-2">
            <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Market Data Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-provider-mock"
                onClick={() => terminalStore.updateConfig({ providerType: 'mock' })}
                className={`flex flex-col items-start p-2.5 rounded border transition-colors cursor-pointer ${
                  config.providerType === 'mock'
                    ? 'bg-purple-950/40 border-purple-500/60 text-purple-300'
                    : 'bg-[#161b22] border-[#30363d] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>Simulator</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">High-Fidelity Mock</span>
              </button>

              <button
                id="btn-provider-real"
                onClick={() => terminalStore.updateConfig({ providerType: 'real' })}
                className={`flex flex-col items-start p-2.5 rounded border transition-colors cursor-pointer ${
                  config.providerType === 'real'
                    ? 'bg-blue-950/40 border-blue-500/60 text-blue-300'
                    : 'bg-[#161b22] border-[#30363d] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>Real WS Feed</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Binance Live Stream</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              {isRealData
                ? 'Currently receiving live websocket trade ticks with aggressor buy/sell flags.'
                : 'Simulating order flow with realistic micro-bursts, imbalances, and absorption.'}
            </p>
          </div>

          {/* Section: Order Flow Visual Layers */}
          <div className="space-y-2.5">
            <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Order Flow Layers
            </label>
            <div className="space-y-2 bg-[#161b22] p-3 rounded border border-[#21262d]">
              {[
                { key: 'footprintVisible', label: 'Footprint Grid' },
                { key: 'deltaVisible', label: 'Delta Metrics' },
                { key: 'cvdVisible', label: 'CVD (Cumulative Volume Delta)' },
                { key: 'pocVisible', label: 'POC (Point of Control)' },
                { key: 'volumeProfileVisible', label: 'Volume Profile' },
                { key: 'imbalanceVisible', label: 'Diagonal Imbalance Signals' },
                { key: 'absorptionVisible', label: 'Absorption Inferences' },
              ].map((item) => {
                const isChecked = (config as any)[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() =>
                      terminalStore.updateConfig({
                        [item.key]: !isChecked,
                      } as any)
                    }
                    className="w-full flex items-center justify-between text-left text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
                  >
                    <span className="text-xs">{item.label}</span>
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Imbalance Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Imbalance Threshold
              </label>
              <span className="text-cyan-400 font-bold">{config.imbalanceThreshold}%</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[250, 300, 400, 500].map((th) => (
                <button
                  key={th}
                  onClick={() => terminalStore.updateConfig({ imbalanceThreshold: th })}
                  className={`py-1 rounded border text-xs text-center transition-colors cursor-pointer ${
                    config.imbalanceThreshold === th
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                      : 'bg-[#161b22] border-[#30363d] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {th}%
                </button>
              ))}
            </div>
          </div>

          {/* Section: Price Aggregation / Tick Size */}
          <div className="space-y-2">
            <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Price Level Aggregation (Tick Size)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {['auto', 0.5, 1.0, 5.0].map((t) => (
                <button
                  key={String(t)}
                  onClick={() => terminalStore.updateConfig({ tickSize: t as any })}
                  className={`py-1 rounded border text-xs text-center uppercase transition-colors cursor-pointer ${
                    config.tickSize === t
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                      : 'bg-[#161b22] border-[#30363d] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {String(t)}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Max Rows */}
          <div className="space-y-2">
            <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Max Rows Rendered
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[25, 50, 100, 200].map((r) => (
                <button
                  key={r}
                  onClick={() => terminalStore.updateConfig({ maxRows: r })}
                  className={`py-1 rounded border text-xs text-center transition-colors cursor-pointer ${
                    config.maxRows === r
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                      : 'bg-[#161b22] border-[#30363d] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Audio Alerts */}
          <div className="space-y-2 pt-2 border-t border-[#21262d]">
            <button
              onClick={() => terminalStore.updateConfig({ soundAlerts: !config.soundAlerts })}
              className="w-full flex items-center justify-between p-2.5 rounded bg-[#161b22] border border-[#21262d] text-slate-300 hover:text-slate-100 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {config.soundAlerts ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                <span className="text-xs">Sound Alerts on Absorption</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.soundAlerts ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                {config.soundAlerts ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#21262d] bg-[#161b22] flex justify-end">
          <button
            onClick={() => terminalStore.toggleSettings()}
            className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold shadow transition-colors cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
