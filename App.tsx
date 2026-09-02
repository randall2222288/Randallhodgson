/**
 * Order Flow Terminal - Professional Real-Time Trading Platform with AI Market Brain
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GripHorizontal } from 'lucide-react';
import { ChartContainer } from './components/chart/ChartContainer';
import { TerminalHeader } from './components/header/TerminalHeader';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { OrderFlowContainer } from './components/orderflow/OrderFlowContainer';
import { SettingsDrawer } from './components/settings/SettingsDrawer';
import { StatsBar } from './components/stats/StatsBar';
import { AiAlertsDrawer } from './components/ai/AiAlertsDrawer';
import { useTerminal } from './hooks/useTerminal';
import { wsClient } from './services/websocket';
import { terminalStore } from './store/terminalStore';

export default function App() {
  const { config } = useTerminal();
  const [splitPercent, setSplitPercent] = useState<number>(config.splitRatio || 52);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket connection on mount
  useEffect(() => {
    wsClient.connect();
    return () => {
      wsClient.disconnect();
    };
  }, []);

  // Sync split ratio with config
  useEffect(() => {
    if (config.splitRatio) {
      setSplitPercent(config.splitRatio);
    }
  }, [config.splitRatio]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'o') {
        terminalStore.setOrderFlowTab('order_flow_intelligence');
      } else if (key === 'f') {
        terminalStore.setOrderFlowTab('ladder');
      } else if (key === 'b') {
        terminalStore.setOrderFlowTab('footprint_bars');
      } else if (key === 'c') {
        terminalStore.setOrderFlowTab('cvd');
      } else if (key === 'v') {
        terminalStore.setOrderFlowTab('volume_profile');
      } else if (key === 'm') {
        terminalStore.setOrderFlowTab('market_brain');
      } else if (key === 'k') {
        terminalStore.setOrderFlowTab('candle_intel');
      } else if (key === 'a') {
        terminalStore.toggleAlerts();
      } else if (key === 'r') {
        terminalStore.resetCvd();
      } else if (key === 't') {
        terminalStore.toggleFullTerminal();
      } else if (key === 's') {
        terminalStore.toggleSettings();
      } else if (e.key === '?') {
        terminalStore.toggleShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dragging resizer logic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeY = moveEvent.clientY - rect.top;
      const newPercent = Math.max(20, Math.min(80, (relativeY / rect.height) * 100));
      setSplitPercent(newPercent);
      terminalStore.setSplitRatio(newPercent);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleDoubleClickResizer = () => {
    const resetVal = 52;
    setSplitPercent(resetVal);
    terminalStore.setSplitRatio(resetVal);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0b0e14] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header */}
      {!config.fullTerminalMode && <TerminalHeader />}

      {/* Main Trading Terminal Body (Split Area) */}
      <main ref={containerRef} className="flex-1 w-full flex flex-col overflow-hidden relative">
        {/* Top: Chart Area (TradingView Widget / Canvas) */}
        <div
          style={{ height: `${splitPercent}%` }}
          className="w-full relative transition-[height] duration-75 overflow-hidden"
        >
          <ChartContainer />
        </div>

        {/* Resizer Splitter Divider */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClickResizer}
          title="Drag to resize split | Double click to reset to 50/50"
          className="h-2 w-full bg-[#161b22] hover:bg-cyan-600/40 active:bg-cyan-500 cursor-row-resize flex items-center justify-center border-y border-[#21262d] group transition-colors shrink-0 z-20"
        >
          <GripHorizontal className="w-4 h-3 text-slate-500 group-hover:text-cyan-300" />
        </div>

        {/* Bottom: Order Flow Footprint / CVD / AI Brain */}
        <div
          style={{ height: `${100 - splitPercent}%` }}
          className="w-full relative transition-[height] duration-75 overflow-hidden flex-1"
        >
          <OrderFlowContainer />
        </div>
      </main>

      {/* Bottom Telemetry Statistics Bar */}
      <StatsBar />

      {/* Side Settings Drawer */}
      <SettingsDrawer />

      {/* AI Alerts Drawer */}
      <AiAlertsDrawer />

      {/* Keyboard Shortcuts Help Modal */}
      <ShortcutsModal />
    </div>
  );
}
