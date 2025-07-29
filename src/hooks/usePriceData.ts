import { useState, useEffect, useRef } from 'react'

export interface PriceData {
  price: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
  marketCap: number
  lastUpdate: Date
  source: 'coingecko'
}

export interface UsePriceDataReturn {
  priceData: PriceData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function usePriceData(): UsePriceDataReturn {
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchFromCoinGecko = async (): Promise<PriceData> => {
    try {
      console.log('🦎 Fetching BNB price data from CoinGecko...')
      
      // Add a small delay to help with rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd&include_24hr_vol=true&include_market_cap=true&include_24hr_change=true', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DeFi Trading Copilot/1.0'
        }
      })
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('CoinGecko API rate limit exceeded. Please wait a moment and try again.')
        }
        throw new Error(`CoinGecko API error: ${response.status} - ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.binancecoin) {
        throw new Error('No BNB data available from CoinGecko')
      }
      
      const coinData = data.binancecoin
      const currentPrice = coinData.usd
      const changePercent24h = coinData.usd_24h_change || 0
      const change24h = (currentPrice * changePercent24h) / 100
      const volume24h = coinData.usd_24h_vol || 0
      const marketCap = coinData.usd_market_cap || 0
      
      // Calculate approximate high/low based on current price and change
      const high24h = currentPrice + Math.abs(change24h)
      const low24h = currentPrice - Math.abs(change24h)
      
      console.log('✅ CoinGecko price data received successfully:', {
        price: currentPrice,
        change24h: changePercent24h.toFixed(2) + '%',
        volume: (volume24h / 1e9).toFixed(2) + 'B'
      })
      
      return {
        price: currentPrice,
        change24h: change24h,
        changePercent24h: changePercent24h,
        high24h: high24h,
        low24h: low24h,
        volume24h: volume24h,
        marketCap: marketCap,
        lastUpdate: new Date(),
        source: 'coingecko'
      }
    } catch (error) {
      console.error('❌ CoinGecko API error:', error)
      throw new Error(`Failed to fetch from CoinGecko: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const fetchPrice = async () => {
    try {
      setError(null)
      
      const coinGeckoData = await fetchFromCoinGecko()
      setPriceData(coinGeckoData)
      setIsLoading(false)
      console.log('✅ Using CoinGecko price data')
      
    } catch (error) {
      console.error('❌ All price sources failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch price data')
      setIsLoading(false)
      setPriceData(null)
    }
  }

  const refetch = async () => {
    setIsLoading(true)
    setError(null)
    await fetchPrice()
  }

  useEffect(() => {
    fetchPrice()

    // Set up polling interval (60 seconds to respect rate limits)
    intervalRef.current = setInterval(() => {
      fetchPrice()
    }, 60000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  return {
    priceData,
    isLoading,
    error,
    refetch
  }
} 