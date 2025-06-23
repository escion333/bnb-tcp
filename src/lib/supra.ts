// Supra Oracle REST API Integration
// Using real Supra price feeds for BNB_USDT

interface SupraLatestResponse {
  currentPage: number
  totalPages: number
  totalRecords: number
  pageSize: number
  instruments: Array<{
    time: string
    timestamp: string
    currentPrice: string
    "24h_high": string
    "24h_low": string
    "24h_change": string
    tradingPair: string
  }>
}

interface PriceData {
  price: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  lastUpdate: Date
  source: 'supra'
  rawData?: {
    tradingPair: string
    timestamp: string
    time: string
  }
}

class SupraOracleClient {
  private readonly REST_ENDPOINT = 'https://prod-kline-rest.supra.com'
  private readonly TRADING_PAIR = 'bnb_usdt'
  private readonly UPDATE_INTERVAL = 5000 // 5 seconds
  
  private lastPrice: number | null = null
  private priceHistory: Array<{ price: number; timestamp: number }> = []

  /**
   * Get API key from environment variables
   */
  private getApiKey(): string {
    const apiKey = import.meta.env.VITE_SUPRA_API_KEY
    if (!apiKey) {
      throw new Error('VITE_SUPRA_API_KEY not found in environment variables')
    }
    return apiKey
  }

  /**
   * Fetch latest price data from Supra REST API
   */
  async fetchLatestPrice(): Promise<SupraLatestResponse> {
    const apiKey = this.getApiKey()
    const url = `${this.REST_ENDPOINT}/latest?trading_pair=${this.TRADING_PAIR}`
    
    console.log('🔮 Supra Oracle: Fetching latest price for', this.TRADING_PAIR)
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      })

      if (!response.ok) {
        throw new Error(`Supra API error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.instruments || data.instruments.length === 0) {
        throw new Error('No price data available from Supra API')
      }

      console.log('✅ Supra Oracle: Price data received successfully')
      return data as SupraLatestResponse
    } catch (error) {
      console.error('❌ Supra Oracle fetch error:', error)
      throw new Error(`Failed to fetch from Supra Oracle: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Calculate 24h change from Supra data
   */
  private calculate24hChange(currentPrice: number, changePercent: number): { change24h: number; changePercent24h: number } {
    const change24h = (currentPrice * changePercent) / 100
    
    return {
      change24h: change24h,
      changePercent24h: changePercent
    }
  }

  /**
   * Get current BNB_USDT price from Supra Oracle
   */
  async getCurrentPrice(): Promise<PriceData> {
    try {
      // Fetch latest price from Supra
      const supraData = await this.fetchLatestPrice()
      
      // Extract first instrument (should be BNB_USDT)
      const instrument = supraData.instruments[0]
      
      if (instrument.tradingPair !== this.TRADING_PAIR) {
        throw new Error(`Expected ${this.TRADING_PAIR} but got ${instrument.tradingPair}`)
      }

      const currentPrice = parseFloat(instrument.currentPrice)
      const high24h = parseFloat(instrument["24h_high"])
      const low24h = parseFloat(instrument["24h_low"])
      const changePercent24h = parseFloat(instrument["24h_change"])
      
      // Calculate 24h change amount
      const { change24h } = this.calculate24hChange(currentPrice, changePercent24h)
      
      // Parse timestamp
      const lastUpdate = new Date(parseInt(instrument.time))

      this.lastPrice = currentPrice

      return {
        price: currentPrice,
        change24h: change24h,
        changePercent24h: changePercent24h,
        high24h: high24h,
        low24h: low24h,
        lastUpdate: lastUpdate,
        source: 'supra',
        rawData: {
          tradingPair: instrument.tradingPair,
          timestamp: instrument.timestamp,
          time: instrument.time
        }
      }
    } catch (error) {
      console.error('Supra Oracle getCurrentPrice error:', error)
      throw error
    }
  }

  /**
   * Verify that Supra Oracle is accessible
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'error'; message: string }> {
    try {
      await this.fetchLatestPrice()
      return { status: 'healthy', message: 'Supra Oracle REST API is accessible' }
    } catch (error) {
      return { 
        status: 'error', 
        message: `Supra Oracle health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }
}

// Export singleton instance
export const supraOracle = new SupraOracleClient()

// Export types for external use
export type { PriceData, SupraLatestResponse } 