/**
 * OpenAI / Compatible AI Provider for AI Market Brain
 * Fully server-side implementation utilizing AI_API_KEY, AI_MODEL, and AI_BASE_URL.
 * The API key is strictly maintained on the backend and never sent to browser clients.
 */

import { AIProvider } from './AIProvider';
import { StructuredAIResponse, StructuredMarketContext } from '../../../src/types/ai';

export class OpenAIProvider implements AIProvider {
  public name = 'OpenAI Market Brain';
  private modelName: string;
  private baseUrl: string;
  private minConfidence: number;

  constructor() {
    this.modelName = process.env.AI_MODEL || 'gpt-4o-mini';
    this.baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.minConfidence = process.env.MIN_SIGNAL_CONFIDENCE ? Number(process.env.MIN_SIGNAL_CONFIDENCE) : 70;
  }

  private getApiKey(): string {
    const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('AI_API_KEY or OPENAI_API_KEY is not configured in the server environment');
    }
    return key.trim();
  }

  public isAvailable(): boolean {
    const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    return Boolean(key && key.length > 8 && !key.includes('MY_API_KEY'));
  }

  public async analyzeMarket(context: StructuredMarketContext): Promise<StructuredAIResponse> {
    const apiKey = this.getApiKey();

    const systemPrompt = `You are the institutional analytical engine "AI Market Brain" for a real-time trading terminal.
Your task is to analyze the provided structured real-time market data and return ONLY a valid JSON object.

RULES & TRADING CRITERIA:
1. Base your evaluation strictly on the real market context provided (OHLC, technical indicators, order flow, structure, multi-timeframe).
2. ORDER FLOW RULE: If order_flow.available is false, do NOT guess or fabricate order flow metrics. Base your analysis solely on price action, structure, volume, and momentum.
3. CONFLICT & RISK FILTER: If multi-timeframe alignment shows conflict, or if break of structure is unconfirmed, set signal to "WAIT". Do NOT generate risky or premature entries.
4. PROBABILITIES: Ensure bullishProbability, bearishProbability, and neutralProbability are valid numbers that sum to exactly 100.
5. CALCULATIONS: Formulate realistic entryZone ({min, max}), stopLoss, takeProfit array ([TP1, TP2, TP3]), invalidationLevel, and marketScore (0-100).
6. REASONING: Provide concise, professional, bullet-pointed justifications for your decision.

RESPONSE SCHEMA (JSON ONLY):
{
  "signal": "BUY" | "SELL" | "WAIT",
  "confidence": number, // 0 to 100
  "bullishProbability": number,
  "bearishProbability": number,
  "neutralProbability": number,
  "continuationProbability": number,
  "reversalProbability": number,
  "marketState": "BULLISH" | "BEARISH" | "RANGE" | "CONSOLIDATION" | "NEUTRAL",
  "candleStrength": number, // 0 to 100
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "signalQuality": "HIGH" | "MEDIUM" | "LOW",
  "reasoning": string[],
  "entryZone": { "min": number, "max": number },
  "stopLoss": number,
  "takeProfit": [number, number, number],
  "invalidationLevel": number,
  "marketScore": number, // 0 to 100
  "aiInterpretation": string
}`;

    // Circuit breaker timeout of 4500ms prevents chart lag or connection blocking
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(context) },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`OpenAI API error (${response.status} ${response.statusText}): ${errorBody}`);
      }

      const jsonResult = await response.json();
      const content = jsonResult.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI returned an empty response content');
      }

      const parsed: StructuredAIResponse = JSON.parse(content);

      // Validate and sanitize response
      return this.validateAndSanitize(parsed, context);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('AI Market Brain OpenAI request timed out (>4500ms)');
      }
      throw err;
    }
  }

  private validateAndSanitize(data: any, context: StructuredMarketContext): StructuredAIResponse {
    let rawSignal = (data.signal || 'WAIT').toUpperCase();
    if (rawSignal.includes('BUY')) rawSignal = 'BUY';
    else if (rawSignal.includes('SELL')) rawSignal = 'SELL';
    else rawSignal = 'WAIT';

    let confidence = typeof data.confidence === 'number' ? Math.min(100, Math.max(0, Math.round(data.confidence))) : 50;
    const reasoning: string[] = Array.isArray(data.reasoning) && data.reasoning.length > 0
      ? data.reasoning.map((r: any) => String(r))
      : ['Market structure and order flow consolidated.'];

    // Enforce Minimum Signal Confidence Threshold
    if (confidence < this.minConfidence && rawSignal !== 'WAIT') {
      reasoning.unshift(`Confidence (${confidence}%) is below configured threshold (${this.minConfidence}%). Transitioning signal to WAIT.`);
      rawSignal = 'WAIT';
    }

    // Enforce Multi-Timeframe Conflict Shield
    if (context.multiTimeframe?.hasConflict && rawSignal !== 'WAIT') {
      reasoning.unshift('Multi-Timeframe divergence detected across higher timeframes. Signal held at WAIT for risk management.');
      rawSignal = 'WAIT';
    }

    let bullProb = typeof data.bullishProbability === 'number' ? Math.round(data.bullishProbability) : 33;
    let bearProb = typeof data.bearishProbability === 'number' ? Math.round(data.bearishProbability) : 33;
    let neutProb = typeof data.neutralProbability === 'number' ? Math.round(data.neutralProbability) : 34;

    const probSum = bullProb + bearProb + neutProb;
    if (probSum !== 100) {
      neutProb = 100 - (bullProb + bearProb);
      if (neutProb < 0) {
        bullProb = 40;
        bearProb = 40;
        neutProb = 20;
      }
    }

    const currentClose = context.currentCandle?.close || 1000;
    const atr = context.volatility?.atr || (currentClose * 0.005);

    const entryZone = (data.entryZone && typeof data.entryZone.min === 'number' && typeof data.entryZone.max === 'number')
      ? { min: Number(data.entryZone.min), max: Number(data.entryZone.max) }
      : { min: parseFloat((currentClose - atr * 0.15).toFixed(5)), max: parseFloat((currentClose + atr * 0.15).toFixed(5)) };

    const stopLoss = typeof data.stopLoss === 'number'
      ? Number(data.stopLoss)
      : rawSignal === 'BUY' ? currentClose - atr * 1.5 : currentClose + atr * 1.5;

    const takeProfit: number[] = Array.isArray(data.takeProfit) && data.takeProfit.length >= 2
      ? data.takeProfit.map((tp: any) => Number(tp))
      : rawSignal === 'BUY'
        ? [currentClose + atr * 1.5, currentClose + atr * 2.5, currentClose + atr * 4.0]
        : [currentClose - atr * 1.5, currentClose - atr * 2.5, currentClose - atr * 4.0];

    const invalidationLevel = typeof data.invalidationLevel === 'number' ? Number(data.invalidationLevel) : stopLoss;

    return {
      signal: rawSignal as 'BUY' | 'SELL' | 'WAIT',
      confidence,
      bullishProbability: bullProb,
      bearishProbability: bearProb,
      neutralProbability: neutProb,
      continuationProbability: typeof data.continuationProbability === 'number' ? data.continuationProbability : 50,
      reversalProbability: typeof data.reversalProbability === 'number' ? data.reversalProbability : 30,
      marketState: data.marketState || context.marketStructure?.trend || 'NEUTRAL',
      candleStrength: typeof data.candleStrength === 'number' ? data.candleStrength : 60,
      riskLevel: data.riskLevel || (confidence >= 80 ? 'LOW' : confidence >= 60 ? 'MEDIUM' : 'HIGH'),
      signalQuality: data.signalQuality || (confidence >= 80 ? 'HIGH' : confidence >= 65 ? 'MEDIUM' : 'LOW'),
      reasoning,
      entryZone,
      stopLoss: parseFloat(stopLoss.toFixed(5)),
      takeProfit: takeProfit.map(tp => parseFloat(tp.toFixed(5))),
      invalidationLevel: parseFloat(invalidationLevel.toFixed(5)),
      marketScore: typeof data.marketScore === 'number' ? data.marketScore : confidence,
      aiInterpretation: data.aiInterpretation || `AI Market Brain evaluation complete (${rawSignal} with ${confidence}% confidence).`,
    };
  }
}
