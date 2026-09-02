/**
 * TradingView Integration Adapter
 *
 * This adapter manages the official TradingView widget loading, interval translation,
 * symbol mapping across asset classes, and optional TRADINGVIEW_CONFIG overrides.
 */

export interface TradingViewCustomConfig {
  theme?: 'dark' | 'light';
  timezone?: string;
  locale?: string;
  studies?: string[];
  disabled_features?: string[];
  enabled_features?: string[];
  overrides?: Record<string, any>;
  library_path?: string;
  custom_css_url?: string;
}

export class TradingViewAdapter {
  private static instance: TradingViewAdapter;
  private customConfig: TradingViewCustomConfig = {};

  private constructor() {
    this.loadCustomConfig();
  }

  public static getInstance(): TradingViewAdapter {
    if (!TradingViewAdapter.instance) {
      TradingViewAdapter.instance = new TradingViewAdapter();
    }
    return TradingViewAdapter.instance;
  }

  private loadCustomConfig() {
    try {
      // In Vite/React client environment, check import.meta.env.VITE_TRADINGVIEW_CONFIG
      const rawEnv = (import.meta as any).env?.VITE_TRADINGVIEW_CONFIG;
      if (rawEnv) {
        this.customConfig = typeof rawEnv === 'string' ? JSON.parse(rawEnv) : rawEnv;
      }
    } catch (e) {
      console.warn('[TradingViewAdapter] Could not parse VITE_TRADINGVIEW_CONFIG JSON string, using defaults.');
    }
  }

  public getInterval(timeframe: string): string {
    switch (timeframe) {
      case '1m': return '1';
      case '3m': return '3';
      case '5m': return '5';
      case '15m': return '15';
      case '30m': return '30';
      case '1H': return '60';
      case '2H': return '120';
      case '4H': return '240';
      case '1D': return 'D';
      case '1W': return 'W';
      default: return '1';
    }
  }

  public getWidgetConfig(containerId: string, symbol: string, interval: string) {
    const baseStudies = [
      'Volume@tv-basicstudies',
      'MASimple@tv-basicstudies',
    ];

    return {
      autosize: true,
      symbol,
      interval,
      timezone: this.customConfig.timezone || 'Etc/UTC',
      theme: this.customConfig.theme || 'dark',
      style: '1', // Japanese Candlesticks
      locale: this.customConfig.locale || 'en',
      toolbar_bg: '#0d1117',
      enable_publishing: false,
      allow_symbol_change: false,
      container_id: containerId,
      hide_side_toolbar: false,
      studies: this.customConfig.studies || baseStudies,
      disabled_features: this.customConfig.disabled_features || [
        'use_localstorage_for_settings',
        'header_symbol_search',
      ],
      enabled_features: this.customConfig.enabled_features || [
        'study_templates',
        'side_toolbar_in_fullscreen_mode',
      ],
      overrides: {
        'paneProperties.background': '#0b0e14',
        'paneProperties.vertGridProperties.color': '#161b22',
        'paneProperties.horzGridProperties.color': '#161b22',
        'scalesProperties.textColor': '#8b949e',
        'mainSeriesProperties.candleStyle.upColor': '#10b981',
        'mainSeriesProperties.candleStyle.downColor': '#ef4444',
        'mainSeriesProperties.candleStyle.drawWick': true,
        'mainSeriesProperties.candleStyle.drawBorder': true,
        'mainSeriesProperties.candleStyle.borderColor': '#374151',
        'mainSeriesProperties.candleStyle.borderUpColor': '#10b981',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
        'mainSeriesProperties.candleStyle.wickUpColor': '#10b981',
        'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
        ...(this.customConfig.overrides || {}),
      },
    };
  }
}
