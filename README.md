# Order Flow Trading Terminal (TradingView + Real-Time Footprint)

A professional, high-frequency, low-latency web trading terminal combining **TradingView charting** and an **advanced Order Flow engine** (Footprint DOM, Cumulative Volume Delta, Point of Control, Value Area 70%, Diagonal Imbalances, and Absorption inferences).

Designed for desktop, multi-monitor, and ultrawide setups with buttery-smooth real-time WebSocket streaming.

---

## 🚀 Key Features

1. **TradingView Charting Engine**:
   - Advanced TradingView Widget with full indicator suite, drawing tools, multi-timeframe synchronization, and dark mode.
   - Built-in High-Performance Canvas Candlestick & Volume Chart (Lightweight Charts) synced synchronously to tick-by-tick order flow.

2. **Order Flow & Footprint DOM**:
   - **Footprint Ladder**: Price levels displaying Bid × Ask volume matrix, Delta per tick level, and total volume with intensity heatmaps.
   - **Diagonal Imbalances**: Detects aggressive buyer/seller volume imbalances (300%, 400%, 500% customizable thresholds).
   - **POC (Point of Control)**: Real-time calculation of highest traded volume price level per candle and per session.
   - **Value Area (VAH / VAL)**: Mathematical 70% volume area boundaries calculated dynamically.
   - **Possible Absorption Detection**: Real-time identification of massive aggressive flow at extremes without price extension.

3. **Cumulative Volume Delta (CVD)**:
   - Live stream CVD graph with zero-line divergence, trend indicators, and instant baseline reset.

4. **Volume Profile (Session & Visible Range)**:
   - Full volume distribution histogram with High Volume Nodes (HVN), Low Volume Nodes (LVN), POC, and stacked Buy vs Sell aggression bars.

5. **Dual Market Data Architecture**:
   - **Mock Market Data Simulator**: Ultra-realistic Poisson trade arrivals, order book depth liquidity walls, micro-burst trends, and absorption simulations.
   - **Real Market Data Feed**: Built-in production WebSocket integration for live crypto/market feeds with real aggressor side flags.

6. **Professional UX & Ergonomics**:
   - Resizable draggable split layout with memory and double-click reset.
   - Global keyboard shortcuts (`F11`, `F`, `B`, `C`, `V`, `R`, `Space`, `T`, `S`, `?`).
   - "FULL TERMINAL" mode maximizing workspace on 1080p, 1440p, and 4K ultrawide monitors.
   - Real-time connection management with exponential backoff and heartbeat monitoring.

---

## 🛠️ Installation & Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- npm 9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
The server starts on `http://localhost:3000` with unified Express backend, WebSocket server at `ws://localhost:3000/ws`, and Vite frontend.

---

## ⚙️ Environment Variables Configuration

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# Server Port (Default: 3000)
PORT=3000

# Market Data Provider: 'mock' (Simulator) or 'real' (Live WebSocket)
DATA_PROVIDER_TYPE=mock

# Real Market Data Configuration (Optional - Defaults to public Binance WS)
MARKET_DATA_WS_URL=
MARKET_DATA_API_KEY=
MARKET_DATA_REST_URL=

# TradingView Library / Custom Config (Optional)
TRADINGVIEW_CONFIG=
```

---

## 🔄 Switching Between Mock & Real Data

### Option A: From the UI (Instant)
1. Click the **Settings Gear** icon in the top right.
2. Select **Simulator (High-Fidelity Mock)** or **Real WS Feed (Binance Live Stream)**.
3. The server immediately switches streams without reloading the webpage.

### Option B: Via Environment Variable
Set `DATA_PROVIDER_TYPE="real"` in `.env` and start the server.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `F11` | Toggle Fullscreen Mode |
| `F` | Switch to Footprint DOM Ladder |
| `B` | Switch to Footprint Multi-Candle Bars |
| `C` | Switch to CVD Stream Graph |
| `V` | Switch to Volume Profile View |
| `R` | Reset Cumulative Volume Delta (CVD) |
| `Space` | Center Footprint Ladder on current price |
| `T` | Toggle Full Terminal Mode |
| `S` | Open Settings Drawer |
| `?` | Show Shortcuts Cheat Sheet |

---

## 🏗️ Production Build & Deployment

### Build the full-stack bundle:
```bash
npm run build
```
This builds the client SPA into `/dist` and bundles the Node.js TypeScript server into `/dist/server.cjs` via `esbuild`.

### Run production server:
```bash
npm run start
```

---

## 📊 Order Flow Formulas & Methodology

- **Delta**: `Ask Volume (Buyer Aggression) - Bid Volume (Seller Aggression)`
- **Cumulative Volume Delta (CVD)**: `∑ Delta(t)` from session start or manual reset.
- **Diagonal Imbalance**: `Ask(Price P) / Bid(Price P - 1) >= ImbalanceThreshold (default: 3.0 = 300%)`
- **POC**: `Price P with argmax(Volume(P))`
- **Value Area (70%)**: Continuous price range surrounding the POC containing 70% of total volume traded.
- **Absorption**: Triggered when a price extreme exhibits high aggressive volume (bid volume at lows or ask volume at highs) but the bar closes away from the extreme, indicating passive limit order absorption.
