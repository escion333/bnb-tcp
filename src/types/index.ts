// Trade related types
export interface TradeIdea {
  id: string;
  entry: number;
  takeProfit: number;
  stopLoss: number;
  reasoning: string;
  confidence: number;
  timestamp: Date;
  status: 'pending' | 'monitoring' | 'active' | 'closed' | 'ignored';
}

export interface Trade {
  id: string;
  userId: string;
  tradeIdeaId?: string;
  type: 'buy' | 'sell';
  tokenPair: string;
  entryPrice: number;
  amount: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
  currentPrice?: number;
  pnl?: number;
  status: 'open' | 'closed' | 'pending';
  transactionHash?: string;
  createdAt: Date;
  closedAt?: Date;
}

// User types
export interface UserSettings {
  id: string;
  userId: string;
  idleFundStrategy: 'bnb' | 'usdt' | 'disabled';
  slippageTolerance: number;
  maxPositionSize: number;
  notificationsEnabled: boolean;
  autoExecuteEnabled: boolean;
}

// Price and market data types
export interface PriceData {
  symbol: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  timestamp: Date;
}

// Venus Protocol types
export interface VenusBalance {
  supplied: number;
  supplyApy: number;
  collateralFactor: number;
} 