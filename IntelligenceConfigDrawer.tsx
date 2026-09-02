import React from 'react';
import { Sliders, X } from 'lucide-react';
import { CumulativeDeltaPeriod, IntelligenceConfig } from './types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: IntelligenceConfig;
  onChange: (cfg: Partial<IntelligenceConfig>) => void;
}

export const IntelligenceConfigDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#11161d] border border-[#30363d] rounded-lg shadow-2xl overflow-hidden font-mono text-xs text-slate-200">
        {/* Header */}
        <div className="h-11 bg-[#161b22] px-4 border-b border-[#21262d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-100 uppercase tracking-wider text-xs">
              Order Flow Intelligence Settings
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-[#21262d] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {/* Imbalance Threshold */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span>Diagonal Imbalance Ratio:</span>
              <strong className="text-cyan-300 font-bold">{config.imbalanceThreshold}%</strong>
            </div>
            <input
              type="range"
              min="150"
              max="600"
              step="25"
              value={config.imbalanceThreshold}
              onChange={(e) => onChange({ imbalanceThreshold: Number(e.target.value) })}
              className="w-full accent-cyan-400"
            />
            <span className="text-[10px] text-slate-500">
              Minimum diagonal volume ratio required to classify buying or selling imbalance.
            </span>
          </div>

          {/* Absorption Threshold Volume */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span>Absorption Threshold Volume:</span>
              <strong className="text-cyan-300 font-bold">{config.absorptionThresholdVolume} Vol</strong>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              step="1"
              value={config.absorptionThresholdVolume}
              onChange={(e) => onChange({ absorptionThresholdVolume: Number(e.target.value) })}
              className="w-full accent-cyan-400"
            />
            <span className="text-[10px] text-slate-500">
              Aggressive volume threshold at extreme levels to trigger passive absorption detection.
            </span>
          </div>

          {/* Min Signal Confidence */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span>Minimum Signal Confidence:</span>
              <strong className="text-emerald-300 font-bold">{config.minSignalConfidence}%</strong>
            </div>
            <input
              type="range"
              min="50"
              max="90"
              step="5"
              value={config.minSignalConfidence}
              onChange={(e) => onChange({ minSignalConfidence: Number(e.target.value) })}
              className="w-full accent-emerald-400"
            />
            <span className="text-[10px] text-slate-500">
              AI signals below this threshold will default to WAIT / NO SIGNAL status to prevent false entries.
            </span>
          </div>

          {/* Ladder Display Count */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span>Ladder Visible Levels Count:</span>
              <strong className="text-cyan-300 font-bold">{config.ladderLevelsCount} Levels</strong>
            </div>
            <input
              type="range"
              min="8"
              max="32"
              step="2"
              value={config.ladderLevelsCount}
              onChange={(e) => onChange({ ladderLevelsCount: Number(e.target.value) })}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* CVD Period Default */}
          <div className="flex flex-col gap-1.5">
            <span className="text-slate-300">Default CVD Histogram Period:</span>
            <div className="grid grid-cols-3 gap-2">
              {(['candle', 'visible', 'session'] as CumulativeDeltaPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => onChange({ cumulativeDeltaPeriod: p })}
                  className={`py-1.5 rounded border text-[11px] font-semibold uppercase cursor-pointer transition-colors ${
                    config.cumulativeDeltaPeriod === p
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-[#161b22] text-slate-400 border-[#21262d] hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#161b22] border-t border-[#21262d] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
