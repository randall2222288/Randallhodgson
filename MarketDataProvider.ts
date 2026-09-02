import { ConnectionState, DataMode, TradeTick } from '../../src/types/market';

export interface MarketDataProvider {
  readonly id: string;
  readonly name: string;
  readonly isRealData: boolean;
  readonly dataMode: DataMode;

  connect(symbol: string): Promise<void>;
  disconnect(): void;
  onTrade(handler: (trade: TradeTick) => void): void;
  onStatusChange(handler: (status: ConnectionState) => void): void;
  getStatus(): ConnectionState;
  getCurrentSymbol(): string;
  changeSymbol(symbol: string): Promise<void>;
}
