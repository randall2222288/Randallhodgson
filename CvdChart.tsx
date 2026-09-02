import React, { useEffect, useRef } from 'react';
import { RotateCcw, TrendingDown, TrendingUp } from 'lucide-react';
import { useTerminal } from '../../hooks/useTerminal';
import { terminalStore } from '../../store/terminalStore';

export const CvdChart: React.FC = () => {
  const { cvdHistory, stats } = useTerminal();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, width, height);

    if (cvdHistory.length < 2) {
      ctx.fillStyle = '#6e7681';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Accumulating Cumulative Volume Delta (CVD)...', width / 2, height / 2);
      return;
    }

    const cvdValues = cvdHistory.map(p => p.cvd);
    let minCvd = Math.min(...cvdValues);
    let maxCvd = Math.max(...cvdValues);

    // Expand bounds to always include 0 for visual reference
    minCvd = Math.min(minCvd, 0);
    maxCvd = Math.max(maxCvd, 0);

    const range = Math.max(maxCvd - minCvd, 10);
    const paddingY = 20;
    const chartHeight = height - paddingY * 2;

    const getY = (val: number) => {
      const normalized = (val - minCvd) / range;
      return height - paddingY - normalized * chartHeight;
    };

    const getX = (idx: number) => {
      return (idx / (cvdHistory.length - 1)) * (width - 60);
    };

    // Draw grid lines
    ctx.strokeStyle = '#21262d';
    ctx.lineWidth = 1;

    // Zero line
    const zeroY = getY(0);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width - 60, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Zero label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('0', width - 50, zeroY + 3);

    // Draw CVD area & curve
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(cvdValues[0]));
    for (let i = 1; i < cvdHistory.length; i++) {
      ctx.lineTo(getX(i), getY(cvdValues[i]));
    }

    const isCurrentPositive = stats.cvd >= 0;
    ctx.strokeStyle = isCurrentPositive ? '#10b981' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Area fill
    ctx.lineTo(getX(cvdHistory.length - 1), zeroY);
    ctx.lineTo(getX(0), zeroY);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (isCurrentPositive) {
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    } else {
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.0)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.25)');
    }
    ctx.fillStyle = gradient;
    ctx.fill();

    // Current value bubble
    const lastX = getX(cvdHistory.length - 1);
    const lastY = getY(stats.cvd);

    ctx.fillStyle = isCurrentPositive ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Max & Min labels
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText(`+${Math.round(maxCvd)}`, width - 50, getY(maxCvd) + 3);
    ctx.fillText(`${Math.round(minCvd)}`, width - 50, getY(minCvd) + 3);
  }, [cvdHistory, stats.cvd]);

  const isPositive = stats.cvd >= 0;

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1117] text-slate-200 font-mono text-xs select-none">
      {/* CVD Control Bar */}
      <div className="h-8 bg-[#161b22] border-b border-[#21262d] px-3 flex items-center justify-between shrink-0 text-[11px]">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            Cumulative Volume Delta (CVD)
          </span>
          <div className="flex items-center gap-1 font-bold">
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
              {stats.cvd > 0 ? '+' : ''}
              {stats.cvd.toLocaleString()}
            </span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">
            Ticks: {cvdHistory.length}
          </span>
        </div>

        <button
          onClick={() => terminalStore.resetCvd()}
          title="Reset CVD baseline"
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-cyan-400 transition-colors text-[10px]"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>Reset CVD</span>
        </button>
      </div>

      {/* CVD Canvas */}
      <div className="flex-1 w-full h-full relative p-2">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
};
