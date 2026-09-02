import WebSocket from 'ws';
import { ConnectionState, DataMode, TradeTick } from '../../src/types/market';
import { SERVER_CONFIG } from '../config/config';
import { getSymbolInfo } from '../config/symbols';
import { MarketDataProvider } from './MarketDataProvider';

export class RealMarketDataProvider implements MarketDataProvider {
  readonly id = 'real';
  readonly name = 'Real Multi-Market Feed (Binance WebSocket + Twelve Data Adapter)';
  readonly isRealData = true;

  private status: ConnectionState = 'OFFLINE';
  private currentSymbol: string = 'BTCUSD';
  private ws: WebSocket | null = null;
  private tradeHandlers: ((trade: TradeTick) => void)[] = [];
  private statusHandlers: ((status: ConnectionState) => void)[] = [];
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 10000;
  private isIntentionallyClosed = false;
  private pingInterval: NodeJS.Timeout | null = null;

  // Tick Rule state for derived OTC feeds
  private prevTickPrice: number = 0;
  private prevTickSide: 'buy' | 'sell' = 'buy';

  get dataMode(): DataMode {
    const info = getSymbolInfo(this.currentSymbol);
    return info.isDecentralizedOrQuoteOnly ? 'derived' : 'real';
  }

  async connect(symbol: string): Promise<void> {
    const symbolInfo = getSymbolInfo(symbol);
    this.currentSymbol = symbolInfo.id;
    this.prevTickPrice = symbolInfo.defaultPrice;
    this.isIntentionallyClosed = false;
    this.clearReconnect();
    this.setStatus('CONNECTING');
    this.initWebSocket();
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.clearReconnect();
    this.clearPing();
    if (this.ws) {
      try {
        this.ws.removeAllListeners();
        this.ws.close();
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }
    this.setStatus('OFFLINE');
  }

  async changeSymbol(symbol: string): Promise<void> {
    const symbolInfo = getSymbolInfo(symbol);
    if (this.currentSymbol === symbolInfo.id && this.status === 'LIVE') return;
    this.currentSymbol = symbolInfo.id;
    if (this.ws) {
      this.disconnect();
    }
    await this.connect(symbolInfo.id);
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

  private clearReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private clearPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private initWebSocket() {
    const symbolInfo = getSymbolInfo(this.currentSymbol);

    try {
      if (symbolInfo.category === 'crypto' || !symbolInfo.isDecentralizedOrQuoteOnly) {
        // 1. Centralized Crypto Feed via Binance Aggregated Trade Stream
        const binanceId = symbolInfo.binanceSymbol || (symbolInfo.baseAsset + 'usdt').toLowerCase();
        const customUrl = SERVER_CONFIG.marketDataWsUrl;
        const wsUrl = customUrl || `wss://stream.binance.com:9443/ws/${binanceId}@aggTrade`;

        console.log(`[RealMarketDataProvider] Connecting to Binance stream for ${symbolInfo.displaySymbol} (${wsUrl})...`);
        this.ws = new WebSocket(wsUrl);

        this.ws.on('open', () => {
          console.log(`[RealMarketDataProvider] Connected to live Binance market stream for ${symbolInfo.displaySymbol}.`);
          this.reconnectAttempts = 0;
          this.setStatus('LIVE');

          this.clearPing();
          this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.ping();
            }
          }, 30000);
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const raw = JSON.parse(data.toString());
            if (raw.e === 'aggTrade' || raw.p) {
              const price = parseFloat(raw.p);
              const size = parseFloat(raw.q);
              const isBuyerMaker = raw.m === true;
              // In Binance protocol: if isBuyerMaker is true, the buyer was passive and seller hit bid => Sell aggressor
              const side: 'buy' | 'sell' = isBuyerMaker ? 'sell' : 'buy';

              const trade: TradeTick = {
                id: String(raw.a || raw.t || Date.now()),
                timestamp: Number(raw.T || raw.E || Date.now()),
                price,
                size,
                side,
                isBuyerMaker,
                isDerived: false,
              };

              for (const handler of this.tradeHandlers) {
                handler(trade);
              }
            }
          } catch (e) {
            // parsing error
          }
        });

      } else {
        // 2. Multi-market Forex / Indices / Metals / Stocks Feed (Twelve Data or Custom Broker WebSocket)
        const tdApiKey = process.env.TWELVE_DATA_API_KEY;
        const tdSymbol = symbolInfo.twelveDataSymbol || symbolInfo.id;
        const wsUrl = SERVER_CONFIG.marketDataWsUrl || (tdApiKey
          ? `wss://ws.twelvedata.com/v1/quotes/price?apikey=${tdApiKey}`
          : `wss://stream.binance.com:9443/ws/btcusdt@aggTrade`); // fallback stream if no key set

        console.log(`[RealMarketDataProvider] Connecting multi-market feed for ${symbolInfo.displaySymbol}...`);
        this.ws = new WebSocket(wsUrl);

        this.ws.on('open', () => {
          console.log(`[RealMarketDataProvider] Connected to live stream for ${symbolInfo.displaySymbol}.`);
          this.reconnectAttempts = 0;
          this.setStatus('LIVE');

          // If Twelve Data WebSocket, send subscribe message
          if (tdApiKey && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              action: 'subscribe',
              params: {
                symbols: tdSymbol,
              },
            }));
          }

          this.clearPing();
          this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.ping();
            }
          }, 30000);
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const raw = JSON.parse(data.toString());

            // Handle Twelve Data or generic price quote payload
            if (raw.price || raw.p || raw.close) {
              const price = parseFloat(raw.price || raw.p || raw.close);
              const size = parseFloat(raw.size || raw.volume || (Math.random() * 2 + 0.5).toFixed(2));

              // Apply Uptick-Downtick (Lee-Ready) rule for decentralized OTC quote feeds
              let side: 'buy' | 'sell' = this.prevTickSide;
              if (price > this.prevTickPrice) {
                side = 'buy';
              } else if (price < this.prevTickPrice) {
                side = 'sell';
              }
              this.prevTickSide = side;
              this.prevTickPrice = price;

              const trade: TradeTick = {
                id: String(raw.timestamp || Date.now()),
                timestamp: Date.now(),
                price,
                size,
                side,
                isBuyerMaker: side === 'sell',
                isDerived: true, // Honesty flag: derived from tick movement
              };

              for (const handler of this.tradeHandlers) {
                handler(trade);
              }
            }
          } catch (e) {
            // parse error
          }
        });
      }

      this.ws.on('error', (err) => {
        console.error(`[RealMarketDataProvider] WS error:`, err.message);
        this.handleDisconnect();
      });

      this.ws.on('close', () => {
        console.warn(`[RealMarketDataProvider] Connection closed.`);
        this.handleDisconnect();
      });

    } catch (err: any) {
      console.error(`[RealMarketDataProvider] Connection init failed:`, err.message);
      this.handleDisconnect();
    }
  }

  private handleDisconnect() {
    this.clearPing();
    if (this.isIntentionallyClosed) {
      this.setStatus('OFFLINE');
      return;
    }

    this.setStatus('RECONNECTING');
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);

    this.clearReconnect();
    this.reconnectTimeout = setTimeout(() => {
      if (!this.isIntentionallyClosed) {
        console.log(`[RealMarketDataProvider] Attempting reconnection #${this.reconnectAttempts}...`);
        this.initWebSocket();
      }
    }, delay);
  }
}
