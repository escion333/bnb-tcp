// Supra Oracle REST API Integration
// Using real Supra price feeds for BNB_USDT with market cap from CoinGecko

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
  volume24h: number
  marketCap: number
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
   * Get API key from user configuration
   */
  private getApiKey(): string {
    // Import here to avoid circular dependencies
    const { getUserConfig } = require('./userConfig')
    const config = getUserConfig()
    const apiKey = config.supra.apiKey
    
    if (!apiKey) {
      throw new Error('Supra API key not configured - please set it up in Settings')
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
   * Fetch volume and market cap data from CoinGecko (more accurate than Supra for volume)
   */
  async fetchVolumeAndMarketCapData(): Promise<{ volume24h: number; marketCap: number }> {
    try {
      console.log('📊 Fetching BNB volume and market cap from CoinGecko...')
      
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd&include_24hr_vol=true&include_market_cap=true')
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.binancecoin) {
        throw new Error('No BNB data from CoinGecko')
      }
      
      const volume24h = data.binancecoin.usd_24h_vol || 0
      const marketCap = data.binancecoin.usd_market_cap || 0
      
      console.log('✅ Volume and market cap fetched from CoinGecko:', { volume24h, marketCap })
      return { volume24h, marketCap }
    } catch (error) {
      console.error('❌ Volume and market cap fetch error:', error)
      return { volume24h: 0, marketCap: 0 } // Return 0 on error
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
   * Get current BNB_USDT price from Supra Oracle with volume/market cap from CoinGecko
   */
  async getCurrentPrice(): Promise<PriceData> {
    try {
      // Fetch price from Supra and volume/market cap from CoinGecko in parallel
      const [supraData, { volume24h, marketCap }] = await Promise.all([
        this.fetchLatestPrice(),
        this.fetchVolumeAndMarketCapData()
      ])
      
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
        volume24h: volume24h,
        marketCap: marketCap,
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