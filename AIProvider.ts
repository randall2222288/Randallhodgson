/**
 * AI Provider Interface & Contract
 */

import { StructuredAIResponse, StructuredMarketContext } from '../../../src/types/ai';

export interface AIProvider {
  name: string;
  isAvailable(): boolean;
  analyzeMarket(context: StructuredMarketContext): Promise<StructuredAIResponse>;
}
