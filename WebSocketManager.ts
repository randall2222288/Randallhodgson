import { Server as HttpServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { ConnectionState, FootprintBar, TradeTick, WSMessage } from '../../src/types/market';
import { SERVER_CONFIG } from '../config/config';
import { MarketDataProvider } from '../market-data/MarketDataProvider';
import { MockMarketDataProvider } from '../market-data/MockMarketDataProvider';
import { RealMarketDataProvider } from '../market-data/RealMarketDataProvider';
import { OrderFlowEngine } from '../orderflow/OrderFlowEngine';
import { AIMarketBrain } from '../ai/brain/AIMarketBrain';
import { CandleEngine } from '../ai/candle/CandleEngine';

export class WebSocketManager {
  private wss: WebSocketServer;
  private provider: MarketDataProvider;
  private mockProvider: MockMarketDataProvider;
  private realProvider: RealMarketDataProvider;
  private engine: OrderFlowEngine;
  private brain: AIMarketBrain;
  private clients: Set<WebSocket> = new Set();
  private broadcastTimer: NodeJS.Timeout | null = null;
  private aiLoopTimer: NodeJS.Timeout | null = null;
  private isDirty: boolean = false;
  private lastTradeTick: TradeTick | null = null;

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.engine = new OrderFlowEngine('BTCUSD', '1m');
    this.brain = AIMarketBrain.getInstance();
    this.brain.setSymbolAndTimeframe('BTCUSD', '1m');

    this.mockProvider = new MockMarketDataProvider();
    this.realProvider = new RealMarketDataProvider();

    // Default provider based on configuration
    this.provider = SERVER_CONFIG.defaultProviderType === 'real' ? this.realProvider : this.mockProvider;

    this.setupProvider(this.provider);
    this.setupWSS();
    this.startBroadcastLoop();
    this.startAILoop();
  }

  private setupProvider(provider: MarketDataProvider) {
    provider.onTrade((trade: TradeTick) => {
      this.lastTradeTick = trade;
      this.engine.processTrade(trade);
      this.brain.ingestTick(trade);
      this.isDirty = true;
    });

    provider.onStatusChange((status: ConnectionState) => {
      this.broadcast({
        type: 'provider_status',
        payload: {
          status,
          providerId: provider.id,
          providerName: provider.name,
          isRealData: provider.isRealData,
          dataMode: provider.dataMode,
        },
        timestamp: Date.now(),
      });
    });

    provider.connect('BTCUSD').catch(err => {
      console.error('[WebSocketManager] Provider connection failed:', err);
    });
  }

  public async switchProvider(type: 'mock' | 'real'): Promise<void> {
    if ((type === 'mock' && this.provider === this.mockProvider) ||
        (type === 'real' && this.provider === this.realProvider)) {
      return;
    }

    const currentSymbol = this.provider.getCurrentSymbol();
    this.provider.disconnect();

    this.provider = type === 'real' ? this.realProvider : this.mockProvider;
    this.setupProvider(this.provider);
    await this.provider.connect(currentSymbol);

    this.broadcast({
      type: 'provider_status',
      payload: {
        status: this.provider.getStatus(),
        providerId: this.provider.id,
        providerName: this.provider.name,
        isRealData: this.provider.isRealData,
        dataMode: this.provider.dataMode,
      },
      timestamp: Date.now(),
    });
  }

  private setupWSS() {
    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      // Send initial state snapshot immediately
      const snapshot = this.engine.getSnapshot();
      const aiState = this.brain.updateMarketState(snapshot.activeBar, snapshot.historicalBars);

      const initMsg: WSMessage = {
        type: 'init',
        payload: {
          ...snapshot,
          providerStatus: this.provider.getStatus(),
          providerId: this.provider.id,
          providerName: this.provider.name,
          isRealData: this.provider.isRealData,
          dataMode: this.provider.dataMode,
          aiState,
        },
        timestamp: Date.now(),
      };
      ws.send(JSON.stringify(initMsg));

      ws.on('message', async (data: WebSocket.Data) => {
        try {
          const msg = JSON.parse(data.toString());
          await this.handleClientMessage(ws, msg);
        } catch (e) {
          // ignore malformed msg
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });
  }

  private async handleClientMessage(ws: WebSocket, msg: any) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      case 'subscribe':
        if (msg.symbol) {
          const symbol = msg.symbol.toUpperCase();
          const timeframe = msg.timeframe || this.engine.getSnapshot().timeframe || '1m';
          this.engine.updateSymbol(symbol);
          this.brain.setSymbolAndTimeframe(symbol, timeframe);
          await this.provider.changeSymbol(symbol);

          // Broadcast refreshed snapshot to all subscribed
          const snap = this.engine.getSnapshot();
          const aiState = this.brain.updateMarketState(snap.activeBar, snap.historicalBars);

          this.broadcast({
            type: 'init',
            payload: {
              ...snap,
              providerStatus: this.provider.getStatus(),
              providerId: this.provider.id,
              providerName: this.provider.name,
              isRealData: this.provider.isRealData,
              aiState,
            },
            timestamp: Date.now(),
          });
        }
        break;

      case 'set_config':
        if (msg.timeframe) {
          this.engine.setTimeframe(msg.timeframe);
          this.brain.setSymbolAndTimeframe(this.engine.getSnapshot().symbol, msg.timeframe);
        }
        if (msg.imbalanceThreshold) {
          this.engine.setImbalanceThreshold(msg.imbalanceThreshold);
        }
        if (msg.tickSize !== undefined) {
          this.engine.setTickSize(msg.tickSize);
        }
        if (msg.providerType) {
          await this.switchProvider(msg.providerType);
        }
        this.isDirty = true;
        break;

      case 'reset_cvd':
        this.engine.resetCvd();
        this.isDirty = true;
        break;

      case 'request_ai_analysis': {
        const snap = this.engine.getSnapshot();
        const aiState = await this.brain.runDeepAnalysis(snap.activeBar, snap.historicalBars);
        this.broadcast({
          type: 'ai_state',
          payload: aiState,
          timestamp: Date.now(),
        });
        break;
      }

      case 'inspect_candle': {
        if (msg.timestamp) {
          const snap = this.engine.getSnapshot();
          const target = snap.historicalBars.find(b => Math.abs(b.time - msg.timestamp) < 60000) ||
            (snap.activeBar && Math.abs(snap.activeBar.time - msg.timestamp) < 60000 ? snap.activeBar : null);

          if (target) {
            const analysis = CandleEngine.analyzeCandle(
              target,
              snap.historicalBars,
              snap.symbol,
              snap.timeframe,
              this.brain.getState().marketStructure,
              this.brain.getState().multiTimeframe,
              target === snap.activeBar
            );
            ws.send(
              JSON.stringify({
                type: 'selected_candle_analysis',
                payload: analysis,
                timestamp: Date.now(),
              })
            );
          }
        }
        break;
      }
    }
  }

  private startBroadcastLoop() {
    // 50ms batching loop (~20 fps) delivers buttery smooth real-time updates with zero client thread freeze
    this.broadcastTimer = setInterval(() => {
      if (!this.isDirty || this.clients.size === 0) return;
      this.isDirty = false;

      const snap = this.engine.getSnapshot();
      const activeBar = snap.activeBar;
      const stats = this.engine.getTerminalStats();
      const volumeProfile = this.engine.getVolumeProfile('session');

      const msg: WSMessage = {
        type: 'tick',
        payload: {
          lastTrade: this.lastTradeTick,
          activeBar,
          stats,
          volumeProfile,
        },
        timestamp: Date.now(),
      };

      this.broadcast(msg);
    }, 50);
  }

  private startAILoop() {
    // Throttled AI state calculation loop (every 300ms) to maintain fresh real-time scores
    this.aiLoopTimer = setInterval(() => {
      if (this.clients.size === 0) return;

      const snap = this.engine.getSnapshot();
      const aiState = this.brain.updateMarketState(snap.activeBar, snap.historicalBars);

      this.broadcast({
        type: 'ai_state',
        payload: aiState,
        timestamp: Date.now(),
      });
    }, 300);
  }

  private broadcast(message: WSMessage) {
    const raw = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(raw);
        } catch (e) {
          // ignore
        }
      }
    }
  }

  public getEngine(): OrderFlowEngine {
    return this.engine;
  }

  public getBrain(): AIMarketBrain {
    return this.brain;
  }

  public getProvider(): MarketDataProvider {
    return this.provider;
  }
}
