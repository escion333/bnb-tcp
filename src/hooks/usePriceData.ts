import { useState, useEffect, useRef } from 'react'
import { supraOracle, type PriceData as SupraPriceData } from '../lib/supra'

interface PriceData {
  price: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  lastUpdate: Date
  source: 'supra' | 'coingecko' | 'mock' // Track which API we're using
}

interface UsePriceDataReturn {
  priceData: PriceData | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function usePriceData(): UsePriceDataReturn {
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchFromSupra = async (): Promise<PriceData> => {
    try {
      console.log('🔮 Fetching from Supra DORA V2 Oracle...')
      
      // Use the new Supra Oracle client
      const supraPriceData = await supraOracle.getCurrentPrice()
      
      // Convert SupraPriceData to our PriceData format
      return {
        price: supraPriceData.price,
        change24h: supraPriceData.change24h,
        changePercent24h: supraPriceData.changePercent24h,
        high24h: supraPriceData.high24h,
        low24h: supraPriceData.low24h,
        lastUpdate: supraPriceData.lastUpdate,
        source: 'supra'
      }
    } catch (error) {
      console.error('Supra Oracle error:', error)
      throw new Error(`Supra Oracle failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const fetchFromCoinGecko = async (): Promise<PriceData> => {
    // CoinGecko API - free and globally available
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true')
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.binancecoin) {
      throw new Error('No BNB price data from CoinGecko')
    }
    
    const coinData = data.binancecoin
    const currentPrice = coinData.usd
    const change24hPercent = coinData.usd_24h_change || 0
    const change24h = (currentPrice * change24hPercent) / 100
    
    // CoinGecko doesn't provide high/low in this endpoint, so we estimate
    const high24h = currentPrice + Math.abs(change24h)
    const low24h = currentPrice - Math.abs(change24h)
    
    return {
      price: currentPrice,
      change24h: change24h,
      changePercent24h: change24hPercent,
      high24h: high24h,
      low24h: low24h,
      lastUpdate: new Date(),
      source: 'coingecko'
    }
  }

  const getMockData = (): PriceData => {
    // Mock data for development when no APIs work
    const basePrice = 650.00
    const randomVariation = (Math.random() - 0.5) * 10 // +/- $5 variation
    const currentPrice = basePrice + randomVariation
    const change24hPercent = (Math.random() - 0.5) * 10 // +/- 5% variation
    const change24h = (currentPrice * change24hPercent) / 100
    
    return {
      price: currentPrice,
      change24h: change24h,
      changePercent24h: change24hPercent,
      high24h: currentPrice + 20,
      low24h: currentPrice - 20,
      lastUpdate: new Date(),
      source: 'mock'
    }
  }

  const fetchPrice = async () => {
    try {
      setError(null)
      
      // Try Supra first
      try {
        const supraPriceData = await fetchFromSupra()
        setPriceData(supraPriceData)
        setIsLoading(false)
        return
      } catch (supraError) {
        console.warn('Supra Oracle failed, trying CoinGecko:', supraError)
        
        // Fallback to CoinGecko
        try {
          const coingeckoPriceData = await fetchFromCoinGecko()
          setPriceData(coingeckoPriceData)
          setIsLoading(false)
          setError('Using CoinGecko API fallback. Supra Oracle unavailable.')
          return
        } catch (coingeckoError) {
          console.warn('CoinGecko also failed, using mock data:', coingeckoError)
          
          // Final fallback to mock data
          const mockPriceData = getMockData()
          setPriceData(mockPriceData)
          setIsLoading(false)
          setError('Using mock price data for development. Both Supra and CoinGecko APIs unavailable.')
          return
        }
      }
    } catch (err) {
      console.error('All price sources failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch price data from any source')
      setIsLoading(false)
    }
  }

  const refetch = () => {
    setIsLoading(true)
    fetchPrice()
  }

  useEffect(() => {
    // Initial fetch
    fetchPrice()
    
    // Set up interval for updates every 5 seconds
    intervalRef.current = setInterval(fetchPrice, 5000)
    
    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
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