import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Cpu,
  HelpCircle,
  RefreshCw,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import { DataQualityRating } from './types';
import { SymbolInfo } from '../../../types/market';
import { terminalStore } from '../../../store/terminalStore';

interface Props {
  symbol: string;
  timeframe: string;
  symbolInfo: SymbolInfo;
  currentPrice: number;
  marketStatus: string;
  dataStatus: 'LIVE' | 'CONNECTING' | 'RECONNECTING' | 'OFFLINE';
  lastUpdateAgo: string;
  dataQuality: DataQualityRating;
  isRealData: boolean;
  isDecentralized: boolean;
  isAiAnalyzing: boolean;
  onOpenConfig: () => void;
  onOpenDebug: () => void;
}

export const IntelligenceHeader: React.FC<Props> = ({
  symbol,
  timeframe,
  symbolInfo,
  currentPrice,
  marketStatus,
  dataStatus,
  lastUpdateAgo,
  dataQuality,
  isRealData,
  isDecentralized,
  isAiAnalyzing,
  onOpenConfig,
  onOpenDebug,
}) => {
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef<number>(currentPrice);

  useEffect(() => {
    if (currentPrice > prevPriceRef.current) {
      setPriceFlash('up');
      const t = setTimeout(() => setPriceFlash(null), 300);
      return () => clearTimeout(t);
    } else if (currentPrice < prevPriceRef.current) {
      setPriceFlash('down');
      const t = setTimeout(() => setPriceFlash(null), 300);
      return () => clearTimeout(t);
    }
    prevPriceRef.current = currentPrice;
  }, [currentPrice]);

  const decimals = symbolInfo.priceDecimals || 2;
  const formattedPrice = currentPrice.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const getStatusBadge = () => {
    switch (dataStatus) {
      case 'LIVE':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>LIVE DATA</span>
          </div>
        );
      case 'CONNECTING':
      case 'RECONNECTING':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[11px]">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>CONNECTING</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>NO DATA</span>
          </div>
        );
    }
  };

  const getQualityBadge = () => {
    if (dataQuality === 'HIGH') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>QUALITY: HIGH</span>
        </span>
      );
    }
    if (dataQuality === 'MEDIUM') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>QUALITY: {isDecentralized ? 'ESTIMATED' : 'MEDIUM'}</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 text-rose-400" />
        <span>QUALITY: LOW</span>
      </span>
    );
  };

  return (
    <div className="w-full bg-[#11161d] border-b border-[#21262d] px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Left: Branding & Core Symbols */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-slate-100 tracking-wider">
                ORDER FLOW INTELLIGENCE
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono font-semibold uppercase">
                Institutional Core
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
              <span className="text-slate-200 font-bold">{symbolInfo.displaySymbol || symbol}</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400 font-semibold">{timeframe.toUpperCase()}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400">{marketStatus}</span>
            </div>
          </div>
        </div>

        {/* Live Price Flash Display */}
        <div className="flex items-center gap-2 pl-3 border-l border-[#21262d]">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Price:</span>
          <div
            className={`px-2 py-0.5 rounded font-mono font-bold text-sm tracking-tight transition-colors ${
              priceFlash === 'up'
                ? 'bg-emerald-500/20 text-emerald-300 shadow-xs'
                : priceFlash === 'down'
                ? 'bg-rose-500/20 text-rose-300 shadow-xs'
                : 'bg-[#161b22] text-slate-100 border border-[#30363d]'
            }`}
          >
            {formattedPrice}
          </div>
        </div>
      </div>

      {/* Right: Telemetry, Quality & Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Update Timer */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#161b22] border border-[#21262d] text-slate-400 font-mono text-[10px]">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Last tick: <span className="text-slate-200">{lastUpdateAgo}</span></span>
        </div>

        {/* Data Status Badge */}
        {getStatusBadge()}

        {/* Quality Badge */}
        {getQualityBadge()}

        {/* Trigger Deep AI Analysis */}
        <button
          id="btn-intel-run-ai"
          onClick={() => terminalStore.requestAiAnalysis()}
          disabled={isAiAnalyzing}
          title="Run AI Market Brain Analysis on Current Market State"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
            isAiAnalyzing
              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 animate-pulse'
              : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAiAnalyzing ? 'animate-spin text-cyan-300' : 'text-cyan-400'}`} />
          <span className="hidden md:inline">{isAiAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
        </button>

        {/* Settings Toggle */}
        <button
          id="btn-intel-config"
          onClick={onOpenConfig}
          title="Configure Order Flow Intelligence Parameters"
          className="p-1.5 rounded bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Debug Modal Toggle */}
        <button
          id="btn-intel-debug"
          onClick={onOpenDebug}
          title="Open Order Flow Developer Debugger"
          className="p-1.5 rounded bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
        >
          <Cpu className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
