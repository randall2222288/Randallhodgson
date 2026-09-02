import dotenv from 'dotenv';
dotenv.config();

export const SERVER_CONFIG = {
  port: 3000,
  host: '0.0.0.0',
  defaultProviderType: (process.env.DATA_PROVIDER_TYPE as 'mock' | 'real') || 'mock',
  marketDataApiKey: process.env.MARKET_DATA_API_KEY || '',
  marketDataWsUrl: process.env.MARKET_DATA_WS_URL || '',
  marketDataRestUrl: process.env.MARKET_DATA_REST_URL || '',
  tradingViewConfig: process.env.TRADINGVIEW_CONFIG || '',
  isProduction: process.env.NODE_ENV === 'production',
};
