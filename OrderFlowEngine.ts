import {
  FootprintBar,
  PriceLevel,
  TerminalStats,
  TradeTick,
  VolumeProfileData,
  VolumeProfileLevel,
} from '../../src/types/market';
import { getSymbolInfo } from '../config/symbols';

export class OrderFlowEngine {
  private symbol: string = 'BTCUSDT';
  private timeframe: string = '1m';
  private timeframeMs: number = 60 * 1000;
  private tickSize: number = 1.0;
  private imbalanceThresholdRatio: number = 3.0; // 300%

  // Current session & active bar state
  private cvdAccumulator: number = 0;
  private activeBar: FootprintBar | null = null;
  private historicalBars: FootprintBar[] = [];
  private maxHistoricalBars: number = 60;

  // Session profile aggregation
  private sessionPriceLevels: Map<number, { buyVol: number; sellVol: number; totalVol: number }> = new Map();
  private sessionTotalVolume: number = 0;
  private sessionTotalDelta: number = 0;

  // Real-time rolling stats
  private lastTrade: TradeTick | null = null;
  private recentTrades: TradeTick[] = [];
  private stats24h = {
    priceChange24h: 1.42,
    high24h: 105100,
    low24h: 102800,
  };

  constructor(symbol: string = 'BTCUSDT', timeframe: string = '1m') {
    this.updateSymbol(symbol);
    this.setTimeframe(timeframe);
  }

  public updateSymbol(symbol: string) {
    this.symbol = symbol;
    const info = getSymbolInfo(symbol);
    this.tickSize = info.tickSize || 1.0;
    this.resetSession();
  }

  public setTimeframe(tf: string) {
    this.timeframe = tf;
    switch (tf) {
      case '1m': this.timeframeMs = 60 * 1000; break;
      case '5m': this.timeframeMs = 5 * 60 * 1000; break;
      case '15m': this.timeframeMs = 15 * 60 * 1000; break;
      case '1H': this.timeframeMs = 60 * 60 * 1000; break;
      case '4H': this.timeframeMs = 4 * 60 * 60 * 1000; break;
      case '1D': this.timeframeMs = 24 * 60 * 60 * 1000; break;
      default: this.timeframeMs = 60 * 1000;
    }
  }

  public setImbalanceThreshold(percent: number) {
    this.imbalanceThresholdRatio = percent / 100;
    if (this.activeBar) {
      this.recalculateImbalancesAndPOC(this.activeBar);
    }
  }

  public setTickSize(tick: number | 'auto') {
    if (tick === 'auto') {
      const info = getSymbolInfo(this.symbol);
      this.tickSize = info.tickSize || 1.0;
    } else {
      this.tickSize = tick;
    }
  }

  public resetCvd() {
    this.cvdAccumulator = 0;
    if (this.activeBar) {
      this.activeBar.cvd = 0;
    }
  }

  public resetSession() {
    this.cvdAccumulator = 0;
    this.activeBar = null;
    this.historicalBars = [];
    this.sessionPriceLevels.clear();
    this.sessionTotalVolume = 0;
    this.sessionTotalDelta = 0;
    this.recentTrades = [];
  }

  private normalizePrice(price: number): number {
    return Math.round(price / this.tickSize) * this.tickSize;
  }

  public processTrade(trade: TradeTick): {
    barUpdated: boolean;
    barClosed: boolean;
    closedBar?: FootprintBar;
    activeBar: FootprintBar;
  } {
    this.lastTrade = trade;
    const now = trade.timestamp;
    this.recentTrades.push(trade);

    // Keep only last 5 seconds of trades for trades/sec metric
    const cutoff = now - 5000;
    while (this.recentTrades.length > 0 && this.recentTrades[0].timestamp < cutoff) {
      this.recentTrades.shift();
    }

    const candleStartTime = Math.floor(now / this.timeframeMs) * this.timeframeMs;
    let barClosed = false;
    let closedBar: FootprintBar | undefined;

    // Check if new candle has started
    if (!this.activeBar || this.activeBar.time !== candleStartTime) {
      if (this.activeBar) {
        barClosed = true;
        closedBar = { ...this.activeBar };
        this.historicalBars.push(closedBar);
        if (this.historicalBars.length > this.maxHistoricalBars) {
          this.historicalBars.shift();
        }
      }

      // Initialize new active bar
      this.activeBar = {
        time: candleStartTime,
        open: trade.price,
        high: trade.price,
        low: trade.price,
        close: trade.price,
        volume: 0,
        tradesCount: 0,
        delta: 0,
        cvd: this.cvdAccumulator,
        buyVolume: 0,
        sellVolume: 0,
        pocPrice: this.normalizePrice(trade.price),
        vahPrice: trade.price,
        valPrice: trade.price,
        minDelta: 0,
        maxDelta: 0,
        levels: [],
        imbalanceCount: 0,
      };
    }

    // Update candle OHLCV
    this.activeBar.high = Math.max(this.activeBar.high, trade.price);
    this.activeBar.low = Math.min(this.activeBar.low, trade.price);
    this.activeBar.close = trade.price;
    this.activeBar.volume = parseFloat((this.activeBar.volume + trade.size).toFixed(3));
    this.activeBar.tradesCount += 1;

    // Delta calculations
    const isBuy = trade.side === 'buy';
    const buySize = isBuy ? trade.size : 0;
    const sellSize = isBuy ? 0 : trade.size;
    const deltaChange = buySize - sellSize;

    this.activeBar.buyVolume = parseFloat((this.activeBar.buyVolume + buySize).toFixed(3));
    this.activeBar.sellVolume = parseFloat((this.activeBar.sellVolume + sellSize).toFixed(3));
    this.activeBar.delta = parseFloat((this.activeBar.delta + deltaChange).toFixed(3));
    this.cvdAccumulator = parseFloat((this.cvdAccumulator + deltaChange).toFixed(3));
    this.activeBar.cvd = this.cvdAccumulator;
    this.activeBar.minDelta = Math.min(this.activeBar.minDelta, this.activeBar.delta);
    this.activeBar.maxDelta = Math.max(this.activeBar.maxDelta, this.activeBar.delta);

    // Update Footprint price level
    const normPrice = this.normalizePrice(trade.price);
    let level = this.activeBar.levels.find(l => Math.abs(l.price - normPrice) < 0.00001);

    if (!level) {
      level = {
        price: normPrice,
        bidVolume: 0,
        askVolume: 0,
        totalVolume: 0,
        delta: 0,
        isImbalanceBuy: false,
        isImbalanceSell: false,
        isPoc: false,
        isAbsorption: false,
      };
      this.activeBar.levels.push(level);
      // Keep sorted by price descending
      this.activeBar.levels.sort((a, b) => b.price - a.price);
    }

    if (isBuy) {
      level.askVolume = parseFloat((level.askVolume + trade.size).toFixed(3));
    } else {
      level.bidVolume = parseFloat((level.bidVolume + trade.size).toFixed(3));
    }
    level.totalVolume = parseFloat((level.bidVolume + level.askVolume).toFixed(3));
    level.delta = parseFloat((level.askVolume - level.bidVolume).toFixed(3));

    // Update Session Profile
    const sessionLevel = this.sessionPriceLevels.get(normPrice) || { buyVol: 0, sellVol: 0, totalVol: 0 };
    if (isBuy) sessionLevel.buyVol += trade.size;
    else sessionLevel.sellVol += trade.size;
    sessionLevel.totalVol += trade.size;
    this.sessionPriceLevels.set(normPrice, sessionLevel);
    this.sessionTotalVolume += trade.size;
    this.sessionTotalDelta += deltaChange;

    // Recalculate POC, Value Area (70%), Imbalances & Absorption
    this.recalculateImbalancesAndPOC(this.activeBar);

    return {
      barUpdated: true,
      barClosed,
      closedBar,
      activeBar: this.activeBar,
    };
  }

  private recalculateImbalancesAndPOC(bar: FootprintBar) {
    if (!bar.levels || bar.levels.length === 0) return;

    let maxVol = -1;
    let pocPrice = bar.close;
    let imbalanceCount = 0;

    // Sort levels descending
    bar.levels.sort((a, b) => b.price - a.price);

    // Find POC & evaluate diagonal imbalances
    for (let i = 0; i < bar.levels.length; i++) {
      const current = bar.levels[i];
      if (current.totalVolume > maxVol) {
        maxVol = current.totalVolume;
        pocPrice = current.price;
      }

      // Diagonal Imbalance:
      // Ask volume at price P vs Bid volume at price P - 1 (next lower level)
      // Bid volume at price P vs Ask volume at price P + 1 (next higher level)
      current.isImbalanceBuy = false;
      current.isImbalanceSell = false;

      const lowerLevel = bar.levels[i + 1];
      const higherLevel = bar.levels[i - 1];

      if (lowerLevel && lowerLevel.bidVolume > 0) {
        if (current.askVolume / lowerLevel.bidVolume >= this.imbalanceThresholdRatio && current.askVolume >= 2.0) {
          current.isImbalanceBuy = true;
          imbalanceCount++;
        }
      } else if (current.askVolume >= 5.0 && (!lowerLevel || lowerLevel.bidVolume === 0)) {
        current.isImbalanceBuy = true;
        imbalanceCount++;
      }

      if (higherLevel && higherLevel.askVolume > 0) {
        if (current.bidVolume / higherLevel.askVolume >= this.imbalanceThresholdRatio && current.bidVolume >= 2.0) {
          current.isImbalanceSell = true;
          imbalanceCount++;
        }
      } else if (current.bidVolume >= 5.0 && (!higherLevel || higherLevel.askVolume === 0)) {
        current.isImbalanceSell = true;
        imbalanceCount++;
      }
    }

    bar.pocPrice = pocPrice;
    bar.imbalanceCount = imbalanceCount;

    // Mark POC on levels
    for (const lvl of bar.levels) {
      lvl.isPoc = Math.abs(lvl.price - pocPrice) < 0.00001;
    }

    // Value Area Calculation (70% of candle volume)
    const targetVolume = bar.volume * 0.7;
    let accumulated = maxVol;
    const includedPrices = new Set<number>([pocPrice]);

    let upperIdx = bar.levels.findIndex(l => Math.abs(l.price - pocPrice) < 0.00001) - 1;
    let lowerIdx = bar.levels.findIndex(l => Math.abs(l.price - pocPrice) < 0.00001) + 1;

    while (accumulated < targetVolume && (upperIdx >= 0 || lowerIdx < bar.levels.length)) {
      const upperVol = upperIdx >= 0 ? bar.levels[upperIdx].totalVolume : -1;
      const lowerVol = lowerIdx < bar.levels.length ? bar.levels[lowerIdx].totalVolume : -1;

      if (upperVol >= lowerVol && upperIdx >= 0) {
        accumulated += upperVol;
        includedPrices.add(bar.levels[upperIdx].price);
        upperIdx--;
      } else if (lowerIdx < bar.levels.length) {
        accumulated += lowerVol;
        includedPrices.add(bar.levels[lowerIdx].price);
        lowerIdx++;
      } else {
        break;
      }
    }

    const priceList = Array.from(includedPrices);
    if (priceList.length > 0) {
      bar.vahPrice = Math.max(...priceList);
      bar.valPrice = Math.min(...priceList);
    } else {
      bar.vahPrice = pocPrice;
      bar.valPrice = pocPrice;
    }

    for (const lvl of bar.levels) {
      lvl.isVah = Math.abs(lvl.price - bar.vahPrice) < 0.00001;
      lvl.isVal = Math.abs(lvl.price - bar.valPrice) < 0.00001;
    }

    // Absorption Detection:
    // Large aggressive seller volume at low of bar, but bar closed higher (passive buyer absorption)
    // Large aggressive buyer volume at high of bar, but bar closed lower (passive seller absorption)
    bar.possibleAbsorption = undefined;
    const lowestLevel = bar.levels[bar.levels.length - 1];
    const highestLevel = bar.levels[0];

    if (lowestLevel && lowestLevel.bidVolume > 8.0 && bar.close > lowestLevel.price + this.tickSize * 2) {
      lowestLevel.isAbsorption = true;
      lowestLevel.absorptionType = 'bid_absorption';
      bar.possibleAbsorption = {
        type: 'bid_absorption',
        price: lowestLevel.price,
        volume: lowestLevel.bidVolume,
      };
    } else if (highestLevel && highestLevel.askVolume > 8.0 && bar.close < highestLevel.price - this.tickSize * 2) {
      highestLevel.isAbsorption = true;
      highestLevel.absorptionType = 'ask_absorption';
      bar.possibleAbsorption = {
        type: 'ask_absorption',
        price: highestLevel.price,
        volume: highestLevel.askVolume,
      };
    }
  }

  public getVolumeProfile(mode: 'candle' | 'session' | 'day' | 'visible' = 'session'): VolumeProfileData {
    const levels: VolumeProfileLevel[] = [];
    let totalVol = 0;
    let totalDelta = 0;
    let maxVol = -1;
    let poc = this.activeBar ? this.activeBar.close : 0;

    if (mode === 'candle' && this.activeBar) {
      for (const lvl of this.activeBar.levels) {
        totalVol += lvl.totalVolume;
        totalDelta += lvl.delta;
        if (lvl.totalVolume > maxVol) {
          maxVol = lvl.totalVolume;
          poc = lvl.price;
        }
        levels.push({
          price: lvl.price,
          volume: lvl.totalVolume,
          buyVolume: lvl.askVolume,
          sellVolume: lvl.bidVolume,
          delta: lvl.delta,
          isPoc: lvl.isPoc,
          isVah: !!lvl.isVah,
          isVal: !!lvl.isVal,
          isHvn: false,
          isLvn: false,
        });
      }
    } else {
      // Session wide profile
      const entries = Array.from(this.sessionPriceLevels.entries()).sort((a, b) => b[0] - a[0]);
      for (const [price, data] of entries) {
        totalVol += data.totalVol;
        const delta = data.buyVol - data.sellVol;
        totalDelta += delta;
        if (data.totalVol > maxVol) {
          maxVol = data.totalVol;
          poc = price;
        }
        levels.push({
          price,
          volume: parseFloat(data.totalVol.toFixed(3)),
          buyVolume: parseFloat(data.buyVol.toFixed(3)),
          sellVolume: parseFloat(data.sellVol.toFixed(3)),
          delta: parseFloat(delta.toFixed(3)),
          isPoc: false,
          isVah: false,
          isVal: false,
          isHvn: false,
          isLvn: false,
        });
      }
    }

    // Calculate VAH / VAL (70% Volume Area)
    let vah = poc;
    let val = poc;

    if (levels.length > 0 && totalVol > 0) {
      const avgVol = totalVol / levels.length;
      for (const l of levels) {
        l.isPoc = Math.abs(l.price - poc) < 0.00001;
        l.isHvn = l.volume > avgVol * 1.6 && !l.isPoc;
        l.isLvn = l.volume < avgVol * 0.35 && l.volume > 0;
      }

      const target = totalVol * 0.7;
      let acc = maxVol;
      const included = new Set<number>([poc]);
      let u = levels.findIndex(l => Math.abs(l.price - poc) < 0.00001) - 1;
      let d = levels.findIndex(l => Math.abs(l.price - poc) < 0.00001) + 1;

      while (acc < target && (u >= 0 || d < levels.length)) {
        const uVol = u >= 0 ? levels[u].volume : -1;
        const dVol = d < levels.length ? levels[d].volume : -1;

        if (uVol >= dVol && u >= 0) {
          acc += uVol;
          included.add(levels[u].price);
          u--;
        } else if (d < levels.length) {
          acc += dVol;
          included.add(levels[d].price);
          d++;
        } else {
          break;
        }
      }

      const pArr = Array.from(included);
      vah = Math.max(...pArr);
      val = Math.min(...pArr);

      for (const l of levels) {
        l.isVah = Math.abs(l.price - vah) < 0.00001;
        l.isVal = Math.abs(l.price - val) < 0.00001;
      }
    }

    return {
      levels,
      pocPrice: poc,
      vahPrice: vah,
      valPrice: val,
      totalVolume: parseFloat(totalVol.toFixed(3)),
      totalDelta: parseFloat(totalDelta.toFixed(3)),
      session: mode,
    };
  }

  public getTerminalStats(): TerminalStats {
    const currentPrice = this.lastTrade ? this.lastTrade.price : (this.activeBar ? this.activeBar.close : 104250);
    const tradesSec = (this.recentTrades.length / 5);

    const hasAbsorption = !!(this.activeBar && this.activeBar.possibleAbsorption);
    let absorptionDesc: string | undefined;

    if (this.activeBar?.possibleAbsorption) {
      const a = this.activeBar.possibleAbsorption;
      absorptionDesc = a.type === 'bid_absorption'
        ? `Possible buyer absorption at ${a.price.toLocaleString()} (${a.volume.toFixed(1)} Vol)`
        : `Possible seller absorption at ${a.price.toLocaleString()} (${a.volume.toFixed(1)} Vol)`;
    }

    return {
      price: currentPrice,
      priceChange24h: this.stats24h.priceChange24h,
      high24h: this.stats24h.high24h,
      low24h: this.stats24h.low24h,
      delta: this.activeBar ? this.activeBar.delta : 0,
      cvd: this.cvdAccumulator,
      volume: this.activeBar ? this.activeBar.volume : 0,
      pocPrice: this.activeBar ? this.activeBar.pocPrice : currentPrice,
      vahPrice: this.activeBar ? this.activeBar.vahPrice : currentPrice,
      valPrice: this.activeBar ? this.activeBar.valPrice : currentPrice,
      minDelta: this.activeBar ? this.activeBar.minDelta : 0,
      maxDelta: this.activeBar ? this.activeBar.maxDelta : 0,
      imbalancesCount: this.activeBar ? this.activeBar.imbalanceCount : 0,
      isAbsorptionDetected: hasAbsorption,
      absorptionDescription: absorptionDesc,
      lastTradeSide: this.lastTrade ? this.lastTrade.side : undefined,
      lastTradeSize: this.lastTrade ? this.lastTrade.size : undefined,
      tradesPerSec: parseFloat(tradesSec.toFixed(1)),
    };
  }

  public getSnapshot() {
    return {
      symbol: this.symbol,
      timeframe: this.timeframe,
      tickSize: this.tickSize,
      activeBar: this.activeBar,
      historicalBars: this.historicalBars,
      volumeProfile: this.getVolumeProfile('session'),
      stats: this.getTerminalStats(),
    };
  }
}
