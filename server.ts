import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { SERVER_CONFIG } from './server/config/config';
import { SUPPORTED_SYMBOLS } from './server/config/symbols';
import { WebSocketManager } from './server/websocket/WebSocketManager';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = SERVER_CONFIG.port || 3000;

  app.use(express.json());

  // Attach WebSocket Manager to HTTP Server
  const wsManager = new WebSocketManager(server);

  // REST API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'OrderFlow-Terminal-Engine',
      timestamp: Date.now(),
      provider: wsManager.getProvider().name,
      isRealData: wsManager.getProvider().isRealData,
      aiEngine: wsManager.getBrain().getState().provider,
    });
  });

  // AI Market Brain REST endpoints
  app.get('/api/ai/state', (req, res) => {
    res.json(wsManager.getBrain().getState());
  });

  app.post('/api/ai/analyze', async (req, res) => {
    try {
      const snap = wsManager.getEngine().getSnapshot();
      const aiState = await wsManager.getBrain().runDeepAnalysis(snap.activeBar, snap.historicalBars);
      res.json({ success: true, aiState });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/ai/signals', (req, res) => {
    const state = wsManager.getBrain().getState();
    res.json({
      latestSignal: state.latestSignal,
      history: state.signalHistory,
      validation: state.validationStats,
    });
  });

  app.get('/api/symbols', (req, res) => {
    res.json(SUPPORTED_SYMBOLS);
  });

  app.get('/api/config', (req, res) => {
    res.json({
      defaultProvider: SERVER_CONFIG.defaultProviderType,
      symbols: SUPPORTED_SYMBOLS,
      hasRealWsConfigured: Boolean(SERVER_CONFIG.marketDataWsUrl),
    });
  });

  app.get('/api/stats', (req, res) => {
    res.json(wsManager.getEngine().getTerminalStats());
  });

  app.post('/api/reset-cvd', (req, res) => {
    wsManager.getEngine().resetCvd();
    res.json({ success: true, message: 'CVD accumulator reset to 0' });
  });

  app.post('/api/provider', async (req, res) => {
    const { type } = req.body;
    if (type === 'mock' || type === 'real') {
      await wsManager.switchProvider(type);
      res.json({ success: true, activeProvider: type });
    } else {
      res.status(400).json({ error: 'Invalid provider type. Use "mock" or "real".' });
    }
  });

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[OrderFlow Terminal] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Server Error]', err);
  process.exit(1);
});
