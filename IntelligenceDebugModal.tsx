import React, { useState } from 'react';
import { Check, Copy, Cpu, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  debugData: Record<string, any>;
}

export const IntelligenceDebugModal: React.FC<Props> = ({
  isOpen,
  onClose,
  debugData,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(debugData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#11161d] border border-[#30363d] rounded-lg shadow-2xl overflow-hidden font-mono text-xs text-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="h-11 bg-[#161b22] px-4 border-b border-[#21262d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-100 uppercase tracking-wider text-xs">
              Order Flow Intelligence Debug Payload
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-200 text-xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-[#21262d] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* JSON Code Viewer */}
        <div className="p-4 overflow-y-auto flex-1 bg-[#0b0e14]">
          <pre className="text-[11px] leading-relaxed font-mono text-slate-300 select-text whitespace-pre-wrap">
            {jsonString}
          </pre>
        </div>
      </div>
    </div>
  );
};
