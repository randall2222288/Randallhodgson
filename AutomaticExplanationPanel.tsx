import React from 'react';
import { ArrowRight, Bot, Lightbulb, MessageSquareQuote, Sparkles } from 'lucide-react';

interface Props {
  reasons: string[];
  conclusion: string;
  nextCandleBias: 'GREEN' | 'RED' | 'NEUTRAL';
  confidence: number;
}

export const AutomaticExplanationPanel: React.FC<Props> = ({
  reasons,
  conclusion,
  nextCandleBias,
  confidence,
}) => {
  return (
    <div className="w-full bg-[#11161d] border border-[#21262d] rounded-lg p-3.5 flex flex-col gap-3 font-mono text-xs select-none shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wider text-xs">
            Institutional Market Interpretation
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real-Time Synthesizer</span>
        </div>
      </div>

      {/* WHY Section (Bullet Points) */}
      <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[#161b22] border border-[#21262d]">
        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5" />
          <span>¿POR QUÉ OCURRE ESTO? (FACTORES CLAVE)</span>
        </div>

        <ul className="flex flex-col gap-1 text-[11px] text-slate-300">
          {reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold shrink-0">•</span>
              <span className="leading-relaxed">{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CONCLUSION Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-gradient-to-r from-[#161b22] to-[#121924] border border-cyan-500/30">
        <div className="flex flex-col gap-0.5 max-w-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            CONCLUSIÓN Y EXPECTATIVA:
          </span>
          <p className="text-xs font-medium text-slate-100 leading-relaxed">
            {conclusion}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 uppercase">Sesgo Siguiente Vela</span>
            <span
              className={`text-sm font-black ${
                nextCandleBias === 'GREEN'
                  ? 'text-emerald-400'
                  : nextCandleBias === 'RED'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {nextCandleBias === 'GREEN' ? '🟢 ALCISTA (VERDE)' : nextCandleBias === 'RED' ? '🔴 BAJISTA (ROJA)' : '🟡 NEUTRAL / ESPERA'}
            </span>
          </div>

          <div className="pl-3 border-l border-[#30363d] flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase">Confianza</span>
            <span className="text-base font-black text-cyan-300">
              {confidence}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
