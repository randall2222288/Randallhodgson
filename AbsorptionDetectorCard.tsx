import React from 'react';
import { AlertCircle, CheckCircle2, Shield, ShieldAlert, Sparkles } from 'lucide-react';

interface Props {
  buyAbsorptionStrength: number;
  sellAbsorptionStrength: number;
  buyAbsorptionDetected: boolean;
  sellAbsorptionDetected: boolean;
  absorptionExplanation: string;
}

export const AbsorptionDetectorCard: React.FC<Props> = ({
  buyAbsorptionStrength,
  sellAbsorptionStrength,
  buyAbsorptionDetected,
  sellAbsorptionDetected,
  absorptionExplanation,
}) => {
  return (
    <div className="w-full bg-[#11161d] border border-[#21262d] rounded-lg p-3.5 flex flex-col gap-3 font-mono text-xs select-none shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wider text-xs">
            Institutional Absorption Detector
          </span>
        </div>

        <span className="text-[10px] text-slate-400">Limit Orders vs Market Flow</span>
      </div>

      {/* Two Status Boxes: Buy Absorption & Sell Absorption */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Buy Absorption Box */}
        <div
          className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${
            buyAbsorptionDetected
              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-xs'
              : 'bg-[#161b22] border-[#21262d]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              BUY ABSORPTION
            </span>
            {buyAbsorptionDetected ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                DETECTED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1f242c] text-slate-500">
                NOT DETECTED
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between pt-1 border-t border-[#21262d]">
            <span className="text-[11px] text-slate-400">Passive Buyer Wall:</span>
            <span className="text-sm font-bold text-emerald-300">
              {buyAbsorptionStrength > 0 ? `${buyAbsorptionStrength}% Strength` : '0%'}
            </span>
          </div>
        </div>

        {/* Sell Absorption Box */}
        <div
          className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${
            sellAbsorptionDetected
              ? 'bg-rose-950/40 border-rose-500/50 shadow-xs'
              : 'bg-[#161b22] border-[#21262d]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-400 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              SELL ABSORPTION
            </span>
            {sellAbsorptionDetected ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                DETECTED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1f242c] text-slate-500">
                NOT DETECTED
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between pt-1 border-t border-[#21262d]">
            <span className="text-[11px] text-slate-400">Passive Seller Wall:</span>
            <span className="text-sm font-bold text-rose-300">
              {sellAbsorptionStrength > 0 ? `${sellAbsorptionStrength}% Strength` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Institutional Rational Explanation */}
      <div className="p-2.5 rounded bg-[#161b22] border border-[#21262d] flex items-start gap-2 text-slate-300">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <strong className="text-slate-100">Mechanism: </strong>
          <span>{absorptionExplanation}</span>
        </div>
      </div>
    </div>
  );
};
