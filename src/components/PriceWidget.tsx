import { usePriceData } from '../hooks/usePriceData'
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from './ui'
import { useEffect } from 'react'

export function PriceWidget() {
  const { priceData, isLoading, error, refetch } = usePriceData()

  // Debug logging
  useEffect(() => {
    console.log('🔍 PriceWidget Debug:', {
      priceData,
      isLoading,
      error,
      hasData: !!priceData,
      price: priceData?.price,
      source: priceData?.source
    })
  }, [priceData, isLoading, error])

  const formatPrice = (price: number) => {
    return price.toFixed(2)
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}`
  }

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : ''
    return `${sign}${percent.toFixed(2)}%`
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-500'
    if (change < 0) return 'text-red-500'
    return 'text-muted-foreground'
  }

  const getTrendBg = (change: number) => {
    if (change > 0) return 'bg-green-500/10 border-green-500/20'
    if (change < 0) return 'bg-red-500/10 border-red-500/20'
    return 'bg-muted/5 border-muted/20'
  }

  const getSourceInfo = (source: string) => {
    switch (source) {
      case 'coingecko': return { label: 'CoinGecko', color: 'text-green-500' }
      default: return { label: 'Unknown', color: 'text-gray-500' }
    }
  }

  if (error && !priceData) {
    return (
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-red-500">Price Feed Error</h3>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
        <Button onClick={refetch} size="sm" variant="outline">
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    )
  }

  if (isLoading || !priceData) {
    return (
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
          <div>
            <h3 className="font-semibold">Loading Price...</h3>
            <p className="text-xs text-muted-foreground">WBNB/USDT</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-muted-foreground">$---.--</div>
          <div className="text-xs text-muted-foreground">---%</div>
        </div>
      </div>
    )
  }

  const sourceInfo = getSourceInfo(priceData.source)
  const isPositive = priceData.changePercent24h >= 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTrendBg(priceData.changePercent24h)}`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm">WBNB/USDT</h3>
            <p className={`text-xs ${sourceInfo.color}`}>{sourceInfo.label}</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {priceData.lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Price & Change */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">${formatPrice(priceData.price)}</div>
          <div className={`text-sm font-medium ${getTrendColor(priceData.changePercent24h)}`}>
            {formatChange(priceData.change24h)} USDT ({formatPercent(priceData.changePercent24h)})
          </div>
        </div>
      </div>

      {/* 24h Stats */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t">
        <div>
          <div className="text-xs text-muted-foreground">24h High</div>
          <div className="font-semibold text-green-500">${formatPrice(priceData.high24h)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">24h Low</div>
          <div className="font-semibold text-red-500">${formatPrice(priceData.low24h)}</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-xs text-orange-500 bg-orange-500/10 p-2 rounded border border-orange-500/20">
          ⚠️ {error}
        </div>
      )}
    </div>
  )
} 