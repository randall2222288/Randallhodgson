import React, { useEffect, useRef } from 'react';
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
} from 'lightweight-charts';
import { useTerminal } from '../../hooks/useTerminal';

export const LightweightCanvasChart: React.FC = () => {
  const { activeBar, historicalBars, stats, symbol, timeframe } = useTerminal();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b0e14' },
        textColor: '#8b949e',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#161b22' },
        horzLines: { color: '#161b22' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#38bdf8',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0284c7',
        },
        horzLine: {
          color: '#38bdf8',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0284c7',
        },
      },
      rightPriceScale: {
        borderColor: '#21262d',
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      timeScale: {
        borderColor: '#21262d',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // overlay
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Update historical bars when loaded or changed
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    const allBars = [...historicalBars];
    if (activeBar) {
      allBars.push(activeBar);
    }

    if (allBars.length === 0) {
      // Seed default bar if empty
      const nowSec = Math.floor(Date.now() / 1000);
      candleSeriesRef.current.setData([
        {
          time: nowSec as any,
          open: stats.price - 10,
          high: stats.price + 15,
          low: stats.price - 20,
          close: stats.price,
        },
      ]);
      return;
    }

    const candleData = allBars.map((b) => ({
      time: Math.floor(b.time / 1000) as any,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));

    const volumeData = allBars.map((b) => ({
      time: Math.floor(b.time / 1000) as any,
      value: b.volume,
      color: b.close >= b.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
    }));

    // Deduplicate by timestamp and sort ascending
    const uniqueCandles = Array.from(new Map(candleData.map(item => [item.time, item])).values())
      .sort((a, b) => (a.time as number) - (b.time as number));

    const uniqueVolumes = Array.from(new Map(volumeData.map(item => [item.time, item])).values())
      .sort((a, b) => (a.time as number) - (b.time as number));

    candleSeriesRef.current.setData(uniqueCandles);
    volumeSeriesRef.current.setData(uniqueVolumes);
  }, [historicalBars, symbol, timeframe]);

  // Live tick updates for active candle
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !activeBar) return;

    const timeSec = Math.floor(activeBar.time / 1000) as any;
    candleSeriesRef.current.update({
      time: timeSec,
      open: activeBar.open,
      high: activeBar.high,
      low: activeBar.low,
      close: activeBar.close,
    });

    volumeSeriesRef.current.update({
      time: timeSec,
      value: activeBar.volume,
      color: activeBar.close >= activeBar.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
    });
  }, [activeBar]);

  return (
    <div className="relative w-full h-full bg-[#0b0e14] overflow-hidden">
      {/* Chart Overlay Badges */}
      <div className="absolute top-2 left-3 z-10 flex items-center gap-3 bg-[#161b22]/80 backdrop-blur border border-[#30363d]/60 px-2.5 py-1 rounded text-xs font-mono">
        <span className="text-cyan-400 font-bold">{symbol}</span>
        <span className="text-slate-400">{timeframe}</span>
        <span className="text-slate-500">|</span>
        <span className="text-amber-400">POC: {stats.pocPrice.toLocaleString()}</span>
        <span className="text-cyan-300">VAH: {stats.vahPrice.toLocaleString()}</span>
        <span className="text-cyan-300">VAL: {stats.valPrice.toLocaleString()}</span>
      </div>

      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};
