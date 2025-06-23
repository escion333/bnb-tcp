const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

export interface TradeIdea {
  symbol: string
  currentPrice: number
  entryPrice: number
  takeProfitPrice: number
  stopLossPrice: number
  reasoning: string
  confidence: number // 1-10 scale
  timeframe: string
  riskReward: number
  timestamp: string
}

export async function generateTradeIdea(
  symbol: string = 'WBNB/USDT',
  currentPrice: number = 635.50
): Promise<TradeIdea> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const prompt = `You are a professional DeFi trader analyzing ${symbol} at current price $${currentPrice}.

Generate a trade recommendation with the following requirements:
- Provide specific entry price (can be current price or better entry point)
- Set realistic take profit target (3-15% move)
- Set reasonable stop loss (2-8% risk)
- Give clear reasoning based on technical analysis
- Rate confidence 1-10 (be honest, not always 9-10)
- Suggest timeframe (minutes to hours for swing trades)

Market Context:
- This is BSC/PancakeSwap trading
- High volatility crypto market
- Consider current BNB ecosystem trends
- Factor in typical crypto support/resistance levels

Respond ONLY with valid JSON in this exact format:
{
  "entryPrice": 635.50,
  "takeProfitPrice": 665.20,
  "stopLossPrice": 615.80,
  "reasoning": "BNB showing bullish divergence on 4H chart with strong support at $630. Target resistance at $665 based on previous highs. Stop loss below key support level.",
  "confidence": 7,
  "timeframe": "4-6 hours",
  "riskReward": 1.5
}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional crypto trader. Respond only with valid JSON. No explanations outside the JSON structure.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    const tradeData = JSON.parse(content.trim())

    // Construct full trade idea
    const tradeIdea: TradeIdea = {
      symbol,
      currentPrice,
      entryPrice: tradeData.entryPrice,
      takeProfitPrice: tradeData.takeProfitPrice,
      stopLossPrice: tradeData.stopLossPrice,
      reasoning: tradeData.reasoning,
      confidence: tradeData.confidence,
      timeframe: tradeData.timeframe,
      riskReward: tradeData.riskReward,
      timestamp: new Date().toISOString()
    }

    return tradeIdea

  } catch (error) {
    console.error('Error generating trade idea:', error)
    
    // Fallback mock data for development
    return {
      symbol,
      currentPrice,
      entryPrice: currentPrice * 0.998, // Slight dip entry
      takeProfitPrice: currentPrice * 1.08, // 8% profit
      stopLossPrice: currentPrice * 0.95, // 5% stop loss
      reasoning: "Mock trade idea - OpenAI API temporarily unavailable. This would normally contain AI analysis of market conditions, technical indicators, and strategic reasoning.",
      confidence: 6,
      timeframe: "2-4 hours",
      riskReward: 1.6,
      timestamp: new Date().toISOString()
    }
  }
} 