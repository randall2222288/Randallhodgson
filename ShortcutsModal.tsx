import React from 'react';
import { Command, Keyboard, X } from 'lucide-react';
import { useTerminal } from '../../hooks/useTerminal';
import { terminalStore } from '../../store/terminalStore';

export const ShortcutsModal: React.FC = () => {
  const { isShortcutsOpen } = useTerminal();

  if (!isShortcutsOpen) return null;

  const shortcuts = [
    { key: 'F11', desc: 'Toggle Fullscreen Mode' },
    { key: 'O', desc: 'Switch to Order Flow Intelligence' },
    { key: 'M', desc: 'Switch to AI Market Brain' },
    { key: 'K', desc: 'Switch to Candle Intelligence' },
    { key: 'A', desc: 'Toggle AI Signal Alerts Drawer' },
    { key: 'F', desc: 'Switch to Footprint DOM' },
    { key: 'B', desc: 'Switch to Footprint Bars' },
    { key: 'C', desc: 'Switch to CVD Stream' },
    { key: 'V', desc: 'Switch to Volume Profile' },
    { key: 'R', desc: 'Reset Cumulative Volume Delta (CVD)' },
    { key: 'Space', desc: 'Center View on Current Active Price' },
    { key: 'T', desc: 'Toggle Full Terminal Mode' },
    { key: 'S', desc: 'Open Terminal Settings' },
    { key: '?', desc: 'Toggle Shortcuts Help Sheet' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#11161d] border border-[#30363d] rounded-lg shadow-2xl overflow-hidden font-mono text-xs text-slate-200">
        {/* Modal Header */}
        <div className="h-11 bg-[#161b22] px-4 border-b border-[#21262d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-100 uppercase tracking-wider text-xs">
              Keyboard Shortcuts
            </span>
          </div>
          <button
            onClick={() => terminalStore.toggleShortcuts()}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-[#21262d] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 divide-y divide-[#21262d] max-h-[60vh] overflow-y-auto">
          {shortcuts.map((s) => (
            <div key={s.key} className="py-2 flex items-center justify-between">
              <span className="text-slate-300 font-sans text-xs">{s.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-[#1f242c] border border-[#30363d] text-cyan-300 font-mono font-bold text-[11px] shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#161b22] border-t border-[#21262d] text-center text-[10px] text-slate-400">
          Press any shortcut key on your keyboard to trigger instant actions.
        </div>
      </div>
    </div>
  );
};
