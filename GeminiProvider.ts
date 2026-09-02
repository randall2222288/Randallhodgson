/**
 * Google Gemini Provider for AI Market Brain
 * Powered by @google/genai SDK
 */

import { GoogleGenAI } from '@google/genai';
import { AIProvider } from './AIProvider';
import { StructuredAIResponse, StructuredMarketContext } from '../../../src/types/ai';

export class GeminiProvider implements AIProvider {
  public name = 'Google Gemini AI';
  private aiClient: GoogleGenAI | null = null;
  private modelName: string;

  constructor() {
    this.modelName = process.env.AI_MODEL || 'gemini-2.5-flash';
  }

  private getClient(): GoogleGenAI {
    if (!this.aiClient) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY or AI_API_KEY is not configured in server environment');
      }
      this.aiClient = new GoogleGenAI({ apiKey });
    }
    return this.aiClient;
  }

  public isAvailable(): boolean {
    const key = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    return Boolean(key && key !== 'MY_GEMINI_API_KEY');
  }

  public async analyzeMarket(context: StructuredMarketContext): Promise<StructuredAIResponse> {
    const client = this.getClient();

    const prompt = `You are the core analytical engine "AI Market Brain" for a professional institutional trading terminal.
Analyze the provided structured real-time market data and return ONLY a valid JSON object matching the requested schema.

MARKET CONTEXT DATA:
${JSON.stringify(context, null, 2)}

INSTRUCTIONS & RISK RULES:
1. Base your decisions strictly on the real OHLC, delta, order flow, structure, and multi-timeframe metrics provided. Never fabricate numbers.
2. If indicators or timeframes conflict, or if market structure lacks clear edge, set signal to "WAIT". Do NOT force trades.
3. Sum of bullishProbability, bearishProbability, and neutralProbability MUST equal 100.
4. Calculate entryZone, dynamic stopLoss, takeProfit targets [TP1, TP2, TP3], and invalidation level.
5. Provide clear, professional bulleted reasoning.

RETURN FORMAT: Valid JSON matching this TypeScript schema:
{
  "signal": "BUY" | "SELL" | "WAIT",
  "confidence": number (0-100),
  "bullishProbability": number,
  "bearishProbability": number,
  "neutralProbability": number,
  "continuationProbability": number,
  "reversalProbability": number,
  "marketState": "BULLISH" | "BEARISH" | "RANGE" | "CONSOLIDATION" | "NEUTRAL",
  "candleStrength": number (0-100),
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "signalQuality": "HIGH" | "MEDIUM" | "LOW",
  "reasoning": string[],
  "entryZone": { "min": number, "max": number },
  "stopLoss": number,
  "takeProfit": [number, number, number],
  "invalidationLevel": number,
  "marketScore": number (0-100),
  "aiInterpretation": string
}`;

    // Circuit breaker timeout of 4500ms
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI Market Brain analysis timeout')), 4500)
    );

    const callPromise = client.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const response = await Promise.race([callPromise, timeoutPromise]);
    const text = response.text || '{}';

    const parsed: StructuredAIResponse = JSON.parse(text);
    return parsed;
  }
}
