import React, { useEffect, useRef, useState } from 'react';
import { getClientSymbolInfo } from '../../config/symbols';
import { useTerminal } from '../../hooks/useTerminal';
import { TradingViewAdapter } from './TradingViewAdapter';

declare global {
  interface Window {
    TradingView?: any;
  }
}

export const TradingViewChart: React.FC = () => {
  const { symbol, timeframe, availableSymbols } = useTerminal();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const containerId = useRef(`tradingview_${Math.random().toString(36).substring(2, 9)}`);

  // Find symbol tradingViewSymbol
  const symbolInfo = getClientSymbolInfo(symbol);
  const tvSymbol = symbolInfo ? symbolInfo.tradingViewSymbol : `BINANCE:${symbol}`;

  // Load official TradingView tv.js script once
  useEffect(() => {
    if (window.TradingView) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'tradingview-widget-script';
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.warn('TradingView script failed to load from CDN, fallback enabled.');
    };
    document.head.appendChild(script);

    return () => {
      // keep script cached
    };
  }, []);

  // Initialize widget when script ready or symbol/timeframe changes
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current) return;

    // Clear previous widget content
    containerRef.current.innerHTML = '';
    const widgetDiv = document.createElement('div');
    widgetDiv.id = containerId.current;
    widgetDiv.className = 'w-full h-full';
    containerRef.current.appendChild(widgetDiv);

    try {
      const adapter = TradingViewAdapter.getInstance();
      const interval = adapter.getInterval(timeframe);
      const widgetConfig = adapter.getWidgetConfig(containerId.current, tvSymbol, interval);

      new window.TradingView.widget(widgetConfig);
    } catch (e) {
      console.error('TradingView Widget init error', e);
    }
  }, [scriptLoaded, tvSymbol, timeframe]);

  return (
    <div className="relative w-full h-full bg-[#0b0e14] overflow-hidden flex flex-col">
      <div ref={containerRef} className="w-full h-full flex-1" />
      {!scriptLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0b0e14] text-slate-400 font-mono text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading TradingView Engine...</span>
          </div>
        </div>
      )}
    </div>
  );
};
