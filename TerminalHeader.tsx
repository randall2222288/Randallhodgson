import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart2,
  Bell,
  Bot,
  Cpu,
  HelpCircle,
  Info,
  Maximize,
  Minimize,
  RefreshCw,
  RotateCcw,
  Settings,
  Zap,
} from 'lucide-react';
import { getClientSymbolInfo } from '../../config/symbols';
import { useTerminal } from '../../hooks/useTerminal';
import { terminalStore } from '../../store/terminalStore';
import { TimeframeBar } from '../common/TimeframeBar';
import { SymbolSelector } from './SymbolSelector';

export const TerminalHeader: React.FC = () => {
  const terminal = useTerminal();
  const { stats, symbol, timeframe, status, isRealData, config, availableSymbols, aiState } = terminal;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [showDataSourceTooltip, setShowDataSourceTooltip] = useState(false);
  const prevPriceRef = useRef(stats.price);

  const unreadAlerts = aiState.alerts.filter(a => !a.read).length;

  const currentSymbolInfo = useMemo(() => {
    return getClientSymbolInfo(symbol);
  }, [symbol]);

  useEffect(() => {
    if (stats.price > prevPriceRef.current) {
      setPriceFlash('up');
      const timer = setTimeout(() => setPriceFlash(null), 300);
      return () => clearTimeout(timer);
    } else if (stats.price < prevPriceRef.current) {
      setPriceFlash('down');
      const timer = setTimeout(() => setPriceFlash(null), 300);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = stats.price;
  }, [stats.price]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'LIVE':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>LIVE</span>
          </div>
        );
      case 'CONNECTING':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-medium">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            <span>CONNECTING</span>
          </div>
        );
      case 'RECONNECTING':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            <span>RECONNECTING</span>
          </div>
        );
      case 'OFFLINE':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-medium">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            <span>OFFLINE</span>
          </div>
        );
    }
  };

  const formatPrice = (val: number) => {
    const decimals = currentSymbolInfo.priceDecimals || 2;
    return val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const isPositiveChange = stats.priceChange24h >= 0;

  // Determine honesty data note and styling
  const isDerived = currentSymbolInfo.isDecentralizedOrQuoteOnly;
  const isMock = config.providerType === 'mock' || !isRealData;

  const dataQualityTag = isMock
    ? { text: 'MOCK DATA', bg: 'bg-purple-500/10 border-purple-500/20 text-purple-300' }
    : isDerived
    ? { text: 'ESTIMATED / DERIVED', bg: 'bg-amber-500/10 border-amber-500/25 text-amber-300' }
    : { text: 'REAL TRADE DATA', bg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' };

  return (
    <header className="h-12 bg-[#0d1117] border-b border-[#21262d] flex items-center justify-between px-3 text-xs select-none z-30 shrink-0">
      {/* Left: Terminal Logo & Symbol Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-[#21262d]">
          <div className="w-6 h-6 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-wider text-slate-100 font-sans text-xs flex items-center gap-1">
              ORDER FLOW <span className="text-cyan-400 font-normal text-[10px] px-1 py-0.2 bg-cyan-950/60 border border-cyan-800/40 rounded">TERMINAL</span>
            </span>
          </div>
        </div>

        {/* Multi-market Symbol Selector */}
        <SymbolSelector
          currentSymbol={symbol}
          availableSymbols={availableSymbols}
          isRealData={isRealData}
        />

        {/* Real-time Price Display */}
        <div className="flex items-center gap-2 font-mono">
          <div
            className={`text-sm font-bold tracking-tight px-1.5 py-0.5 rounded transition-colors ${
              priceFlash === 'up'
                ? 'bg-emerald-500/20 text-emerald-300'
                : priceFlash === 'down'
                ? 'bg-rose-500/20 text-rose-300'
                : 'text-slate-100'
            }`}
          >
            {formatPrice(stats.price)}
          </div>
          <div
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              isPositiveChange
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {isPositiveChange ? '+' : ''}
            {stats.priceChange24h.toFixed(2)}%
          </div>
        </div>

        {/* Dynamic Timeframe Bar with all requested intervals */}
        <div className="hidden lg:flex items-center">
          <TimeframeBar />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Data Honesty Badge & Info Tooltip */}
        <div className="relative">
          <div
            onClick={() => setShowDataSourceTooltip(!showDataSourceTooltip)}
            title="Click for Data Transparency & Source Information"
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono border cursor-pointer hover:brightness-110 transition-all ${dataQualityTag.bg}`}
          >
            {isMock ? <Cpu className="w-3 h-3" /> : isDerived ? <Info className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
            <span className="font-semibold">{dataQualityTag.text}</span>
          </div>

          {showDataSourceTooltip && (
            <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-[#161b22] border border-[#30363d] rounded shadow-2xl text-[11px] text-slate-300 font-sans z-50">
              <div className="font-bold text-slate-100 font-mono text-xs mb-1">
                Data Transparency Disclosure
              </div>
              {isMock ? (
                <p className="text-slate-400 leading-relaxed">
                  Running built-in high-frequency Poisson trade engine with synthetic order book walls and micro-absorption cycles.
                </p>
              ) : isDerived ? (
                <p className="text-slate-400 leading-relaxed">
                  Decentralized OTC instrument ({currentSymbolInfo.category.toUpperCase()}). Order flow volume & aggressors are estimated via the standard Uptick-Downtick rule (Lee-Ready algorithm) on live quote ticks.
                </p>
              ) : (
                <p className="text-slate-400 leading-relaxed">
                  Connected directly to centralized exchange WebSocket feed (Binance Aggregated Trade stream) with true buyer/seller maker aggressor flags.
                </p>
              )}
              <div className="mt-2 pt-2 border-t border-[#21262d] text-[10px] text-cyan-400 font-mono flex justify-between">
                <span>Symbol: {currentSymbolInfo.displaySymbol}</span>
                <span>Tick: {currentSymbolInfo.tickSize}</span>
              </div>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        {getStatusBadge()}

        {/* AI Alerts Button with Badge */}
        <button
          id="btn-ai-alerts"
          onClick={() => terminalStore.toggleAlerts()}
          title="AI Signals & Market Alerts"
          className="relative flex items-center gap-1 px-2 py-1 rounded bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
        >
          <Bell className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline text-[11px] font-mono">Alerts</span>
          {unreadAlerts > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-black text-[9px] font-bold flex items-center justify-center font-mono animate-bounce">
              {unreadAlerts}
            </span>
          )}
        </button>

        {/* Reset CVD Button */}
        <button
          id="btn-reset-cvd-header"
          onClick={() => terminalStore.resetCvd()}
          title="Reset Cumulative Volume Delta (CVD) [Key: R]"
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden lg:inline text-[11px] font-mono">Reset CVD</span>
        </button>

        {/* Chart Engine Switcher */}
        <button
          id="btn-chart-toggle"
          onClick={() =>
            terminalStore.updateConfig({
              chartType: config.chartType === 'tradingview' ? 'lightweight' : 'tradingview',
            })
          }
          title="Switch between TradingView Advanced Widget & Canvas Chart"
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-slate-300 transition-colors text-[11px] font-mono cursor-pointer"
        >
          <BarChart2 className="w-3 h-3 text-cyan-400" />
          <span className="hidden xl:inline">{config.chartType === 'tradingview' ? 'TradingView Widget' : 'Canvas Chart'}</span>
        </button>

        {/* Full Terminal Mode toggle */}
        <button
          id="btn-full-terminal"
          onClick={() => terminalStore.toggleFullTerminal()}
          title="Toggle Full Terminal Mode [Hide non-essential UI for wide monitors]"
          className={`px-2 py-1 rounded border text-[11px] font-mono transition-colors cursor-pointer ${
            config.fullTerminalMode
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
              : 'bg-[#161b22] border-[#30363d] text-slate-400 hover:text-slate-200'
          }`}
        >
          FULL TERMINAL
        </button>

        {/* Keyboard shortcuts modal button */}
        <button
          id="btn-shortcuts-help"
          onClick={() => terminalStore.toggleShortcuts()}
          title="Keyboard Shortcuts [Key: ?]"
          className="p-1.5 rounded bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen F11 button */}
        <button
          id="btn-fullscreen"
          onClick={toggleFullscreen}
          title="Fullscreen [Key: F11]"
          className="p-1.5 rounded bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
        </button>

        {/* Settings Drawer button */}
        <button
          id="btn-open-settings"
          onClick={() => terminalStore.toggleSettings()}
          title="Terminal & Order Flow Settings"
          className="p-1.5 rounded bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
