import React from 'react';
import { AlertTriangle, Bot, CheckCircle2, ShieldAlert, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { RiskLevel, SignalQuality, SignalType } from '../../../types/ai';

interface Props {
  signal: SignalType;
  isValidSignal: boolean;
  confidence: number;
  signalQuality: SignalQuality;
  riskLevel: RiskLevel;
  reasoning: string[];
  biasText: string;
  colorBadge: string;
  thresholdMet: boolean;
  minConfidence: number;
  entryZone?: { min: number; max: number };
  stopLoss?: number;
  takeProfit?: number[];
  decimals: number;
}

export const AiOrderFlowSignalCard: React.FC<Props> = ({
  signal,
  isValidSignal,
  confidence,
  signalQuality,
  riskLevel,
  reasoning,
  biasText,
  colorBadge,
  thresholdMet,
  minConfidence,
  entryZone,
  stopLoss,
  takeProfit,
  decimals,
}) => {
  const formatPrice = (p?: number) => {
    if (p === undefined) return '--';
    return p.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div className="w-full bg-[#11161d] border border-[#21262d] rounded-lg p-3.5 flex flex-col gap-3 font-mono text-xs select-none shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wider text-xs">
            AI Order Flow Signal Engine
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">
            Min Confidence: <strong className="text-cyan-300">{minConfidence}%</strong>
          </span>
          <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${colorBadge}`}>
            {biasText}
          </span>
        </div>
      </div>

      {/* Main Signal Display Banner */}
      {!thresholdMet || signal === 'WAIT' ? (
        <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-amber-300 text-xs uppercase">
                STATUS: ESPERA / SIN SEÑAL CLARA
              </div>
              <div className="text-[11px] text-amber-400/80">
                La confianza actual ({confidence}%) no supera el umbral mínimo seguro ({minConfidence}%) o el mercado está en equilibrio.
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase block">Confianza</span>
            <span className="text-lg font-bold text-amber-400">{confidence}%</span>
          </div>
        </div>
      ) : (
        <div
          className={`p-3.5 rounded-lg border flex flex-wrap items-center justify-between gap-3 ${
            signal === 'BUY'
              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md'
              : 'bg-rose-950/40 border-rose-500/50 shadow-md'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg ${
                signal === 'BUY'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
              }`}
            >
              {signal === 'BUY' ? '▲' : '▼'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-base font-black tracking-wide ${
                    signal === 'BUY' ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {signal === 'BUY' ? 'ORDEN DE COMPRA CONFIRMADA' : 'ORDEN DE VENTA CONFIRMADA'}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                  {signalQuality} QUALITY
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                Riesgo: <span className="text-slate-100 font-bold">{riskLevel}</span> | Confluencia Order Flow + Indicadores
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {entryZone && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Zona de Entrada</span>
                <span className="font-bold text-slate-100">
                  {formatPrice(entryZone.min)} - {formatPrice(entryZone.max)}
                </span>
              </div>
            )}
            {stopLoss && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Stop Loss</span>
                <span className="font-bold text-rose-400">{formatPrice(stopLoss)}</span>
              </div>
            )}
            {takeProfit && takeProfit.length > 0 && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Take Profit 1</span>
                <span className="font-bold text-emerald-400">{formatPrice(takeProfit[0])}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Signal Rationale */}
      {reasoning.length > 0 && (
        <div className="p-2.5 rounded bg-[#161b22] border border-[#21262d] flex flex-col gap-1 text-[11px]">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Fundamentos de la Señal:</span>
          {reasoning.map((r, i) => (
            <div key={i} className="flex items-start gap-1.5 text-slate-300">
              <span className="text-cyan-400">•</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
