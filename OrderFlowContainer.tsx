import React from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Bot,
  CandlestickChart,
  Compass,
  Layers,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useTerminal } from '../../hooks/useTerminal';
import { terminalStore } from '../../store/terminalStore';
import { CvdChart } from './CvdChart';
import { FootprintCandlesView } from './FootprintCandlesView';
import { FootprintLadder } from './FootprintLadder';
import { VolumeProfileView } from './VolumeProfileView';
import { OrderFlowIntelligenceView } from './intelligence/OrderFlowIntelligenceView';
import { AiMarketBrainView } from '../ai/AiMarketBrainView';
import { CandleIntelligenceView } from '../ai/CandleIntelligenceView';
import { MultiTimeframeView } from '../ai/MultiTimeframeView';
import { AiSignalsHistoryView } from '../ai/AiSignalsHistoryView';
import { StructureLiquidityView } from '../ai/StructureLiquidityView';

export const OrderFlowContainer: React.FC = () => {
  const { activeOrderFlowTab, config, stats, aiState } = useTerminal();
  const latestSignal = aiState?.latestSignal;

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1117] overflow-hidden">
      {/* Sub-Header Tabs */}
      <div className="h-9 bg-[#11161d] border-b border-[#21262d] px-2 flex items-center justify-between shrink-0 select-none overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1">
          {/* Order Flow Intelligence Premier Tab */}
          <button
            id="tab-order-flow-intelligence"
            onClick={() => terminalStore.setOrderFlowTab('order_flow_intelligence')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
              activeOrderFlowTab === 'order_flow_intelligence'
                ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm font-bold'
                : 'text-cyan-400 hover:text-cyan-200 hover:bg-[#161b22]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Order Flow Intelligence</span>
          </button>

          <div className="h-4 w-px bg-[#30363d] mx-1 shrink-0" />

          {/* Traditional Order Flow Tabs */}
          <button
            id="tab-footprint-ladder"
            onClick={() => terminalStore.setOrderFlowTab('ladder')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeOrderFlowTab === 'ladder'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#161b22]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Footprint DOM</span>
          </button>

          <button
            id="tab-footprint-bars"
            onClick={() => terminalStore.setOrderFlowTab('footprint_bars')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeOrderFlowTab === 'footprint_bars'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#161b22]'
            }`}
          >
            <CandlestickChart className="w-3.5 h-3.5" />
            <span>Footprint Bars</span>
          </button>

          {config.cvdVisible && (
            <button
              id="tab-cvd-chart"
              onClick={() => terminalStore.setOrderFlowTab('cvd')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeOrderFlowTab === 'cvd'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#161b22]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>CVD Stream</span>
            </button>
          )}

          {config.volumeProfileVisible && (
            <button
              id="tab-volume-profile"
              onClick={() => terminalStore.setOrderFlowTab('volume_profile')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeOrderFlowTab === 'volume_profile'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#161b22]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Volume Profile</span>
            </button>
          )}

          {/* AI Intelligence Divider */}
          <div className="h-4 w-px bg-[#30363d] mx-1 shrink-0" />

          {/* AI Intelligence Tabs */}
          <button
            id="tab-ai-market-brain"
            onClick={() => terminalStore.setOrderFlowTab('market_brain')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeOrderFlowTab === 'market_brain'
                ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-sm font-bold'
                : 'text-purple-400 hover:text-purple-200 hover:bg-[#161b22]'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Market Brain</span>
          </button>

          <button
            id="tab-ai-candle-intel"
            onClick={() => terminalStore.setOrderFlowTab('candle_intel')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeOrderFlowTab === 'candle_intel'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#161b22]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Candle Intel</span>
          </button>

          <button
            id="tab-ai-mtf-matrix"
            onClick={() => terminalStore.setOrderFlowTab('mtf_matrix')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeOrderFlowTab === 'mtf_matrix'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#161b22]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>MTF Matrix</span>
          </button>

          <button
            id="tab-ai-signals"
            onClick={() => terminalStore.setOrderFlowTab('signals')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeOrderFlowTab === 'signals'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#161b22]'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Signals</span>
          </button>

          <button
            id="tab-ai-structure"
            onClick={() => terminalStore.setOrderFlowTab('structure_liquidity')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeOrderFlowTab === 'structure_liquidity'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#161b22]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Structure & Liq</span>
          </button>
        </div>

        {/* Quick telemetry badge */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] shrink-0 pl-2">
          {latestSignal && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
              AI: {latestSignal.signal} ({latestSignal.confidenceScore}%)
            </span>
          )}

          <span className="text-slate-400">Delta:</span>
          <span
            className={`font-semibold ${
              stats.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stats.delta > 0 ? '+' : ''}
            {stats.delta.toLocaleString()}
          </span>

          <span className="text-slate-600">|</span>

          <span className="text-slate-400">CVD:</span>
          <span
            className={`font-semibold ${
              stats.cvd >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stats.cvd > 0 ? '+' : ''}
            {stats.cvd.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Order Flow / AI Active View */}
      <div className="flex-1 w-full h-full overflow-hidden">
        {activeOrderFlowTab === 'order_flow_intelligence' && <OrderFlowIntelligenceView />}
        {activeOrderFlowTab === 'ladder' && <FootprintLadder />}
        {activeOrderFlowTab === 'footprint_bars' && <FootprintCandlesView />}
        {activeOrderFlowTab === 'cvd' && <CvdChart />}
        {activeOrderFlowTab === 'volume_profile' && <VolumeProfileView />}
        {activeOrderFlowTab === 'market_brain' && <AiMarketBrainView />}
        {activeOrderFlowTab === 'candle_intel' && <CandleIntelligenceView />}
        {activeOrderFlowTab === 'mtf_matrix' && <MultiTimeframeView />}
        {activeOrderFlowTab === 'signals' && <AiSignalsHistoryView />}
        {activeOrderFlowTab === 'structure_liquidity' && <StructureLiquidityView />}
      </div>
    </div>
  );
};

