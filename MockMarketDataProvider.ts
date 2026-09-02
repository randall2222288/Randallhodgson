import { ConnectionState, DataMode, TradeTick } from '../../src/types/market';
import { getSymbolInfo } from '../config/symbols';
import { MarketDataProvider } from './MarketDataProvider';

export class MockMarketDataProvider implements MarketDataProvider {
  readonly id = 'mock';
  readonly name = 'Mock Market Data Simulator (High-Fidelity Order Flow)';
  readonly isRealData = false;
  readonly dataMode: DataMode = 'mock';

  private status: ConnectionState = 'OFFLINE';
  private currentSymbol: string = 'BTCUSD';
  private tradeHandlers: ((trade: TradeTick) => void)[] = [];
  private statusHandlers: ((status: ConnectionState) => void)[] = [];
  private timer: NodeJS.Timeout | null = null;
  private currentPrice: number = 104250.0;
  private tickStep: number = 1.0;
  private priceDecimals: number = 2;
  private trendBias: number = 0; // -1 to +1
  private trendDuration: number = 0;
  private absorptionLevel: number | null = null;
  private absorptionCounter: number = 0;

  constructor() {
    this.initSymbol(this.currentSymbol);
  }

  private initSymbol(symbol: string) {
    const symbolInfo = getSymbolInfo(symbol);
    this.currentSymbol = symbolInfo.id;
    this.currentPrice = symbolInfo.defaultPrice;
    this.tickStep = symbolInfo.tickSize;
    this.priceDecimals = symbolInfo.priceDecimals;
    this.absorptionLevel = null;
    this.absorptionCounter = 0;
  }

  async connect(symbol: string): Promise<void> {
    this.initSymbol(symbol);
    this.setStatus('CONNECTING');

    // Simulate realistic connection handshake delay
    await new Promise(r => setTimeout(r, 350));
    this.setStatus('LIVE');
    this.startSimulation();
  }

  disconnect(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.setStatus('OFFLINE');
  }

  async changeSymbol(symbol: string): Promise<void> {
    if (this.currentSymbol === symbol && this.status === 'LIVE') return;
    this.disconnect();
    await this.connect(symbol);
  }

  getCurrentSymbol(): string {
    return this.currentSymbol;
  }

  getStatus(): ConnectionState {
    return this.status;
  }

  onTrade(handler: (trade: TradeTick) => void): void {
    this.tradeHandlers.push(handler);
  }

  onStatusChange(handler: (status: ConnectionState) => void): void {
    this.statusHandlers.push(handler);
  }

  private setStatus(newStatus: ConnectionState) {
    this.status = newStatus;
    for (const h of this.statusHandlers) {
      try {
        h(newStatus);
      } catch (e) {
        console.error('Error in status handler', e);
      }
    }
  }

  private startSimulation() {
    if (this.timer) clearInterval(this.timer);

    const symbolInfo = getSymbolInfo(this.currentSymbol);
    const tickStep = symbolInfo.tickSize || 1.0;
    const decimals = symbolInfo.priceDecimals;

    // Run high-frequency Poisson trade stream (emits 1-4 trades every 35-65ms => ~25-50 trades/sec)
    this.timer = setInterval(() => {
      if (this.status !== 'LIVE') return;

      // Update trend micro-cycles
      if (this.trendDuration <= 0) {
        this.trendBias = (Math.random() - 0.49) * 1.6; // slight directional micro-bias
        this.trendDuration = Math.floor(Math.random() * 40) + 15; // 15 to 55 ticks

        // Setup occasional absorption order wall
        if (Math.random() < 0.22) {
          const mult = Math.random() > 0.5 ? 1 : -1;
          const offset = (Math.random() * 6 + 2) * tickStep;
          this.absorptionLevel = parseFloat((Math.round((this.currentPrice + mult * offset) / tickStep) * tickStep).toFixed(decimals));
          this.absorptionCounter = 0;
        } else {
          this.absorptionLevel = null;
        }
      }
      this.trendDuration--;

      // Number of trades in this micro-batch
      const batchCount = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < batchCount; i++) {
        let side: 'buy' | 'sell';
        const isBuyerDominant = Math.random() < (0.5 + this.trendBias * 0.25);
        side = isBuyerDominant ? 'buy' : 'sell';

        // Size scaling based on asset category
        let baseMultiplier = 1.0;
        if (symbolInfo.category === 'forex') baseMultiplier = 10.0; // standard lots / volume units
        else if (symbolInfo.category === 'indices') baseMultiplier = 2.0;
        else if (symbolInfo.category === 'metals') baseMultiplier = 4.0;
        else if (symbolInfo.category === 'stocks') baseMultiplier = 50.0;

        let tradeSize = 0;
        // Check if hitting absorption wall
        if (this.absorptionLevel !== null && Math.abs(this.currentPrice - this.absorptionLevel) <= tickStep * 1.5) {
          // Large aggressive volume hitting the wall, absorbed by passive liquidity
          this.absorptionCounter++;
          tradeSize = parseFloat(((Math.random() * 8.5 + 4.0) * baseMultiplier).toFixed(2));
          this.currentPrice = this.absorptionLevel;
          if (this.absorptionCounter > 10) {
            this.absorptionLevel = null; // wall absorbs completely and clears
          }
        } else {
          // Poisson distributed trade sizes with occasional large institutional sweeps
          const isWhale = Math.random() < 0.05;
          const isMedium = Math.random() < 0.2;
          if (isWhale) {
            tradeSize = parseFloat(((Math.random() * 12.0 + 4.0) * baseMultiplier).toFixed(2));
          } else if (isMedium) {
            tradeSize = parseFloat(((Math.random() * 2.5 + 0.6) * baseMultiplier).toFixed(2));
          } else {
            tradeSize = parseFloat(((Math.random() * 0.4 + 0.02) * baseMultiplier).toFixed(3));
          }

          // Price step delta
          const priceChangeProb = Math.random();
          if (priceChangeProb > 0.45) {
            const direction = side === 'buy' ? 1 : -1;
            const deltaTicks = Math.random() > 0.85 ? 2 : 1;
            this.currentPrice += direction * deltaTicks * tickStep;
          }
        }

        // Clamp to precision
        this.currentPrice = parseFloat((Math.round(this.currentPrice / tickStep) * tickStep).toFixed(decimals));

        const trade: TradeTick = {
          id: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          price: this.currentPrice,
          size: tradeSize,
          side: side,
          isBuyerMaker: side === 'sell',
          isDerived: symbolInfo.isDecentralizedOrQuoteOnly,
        };

        for (const handler of this.tradeHandlers) {
          try {
            handler(trade);
          } catch (err) {
            console.error('Error emitting trade', err);
          }
        }
      }
    }, 45);
  }
}
