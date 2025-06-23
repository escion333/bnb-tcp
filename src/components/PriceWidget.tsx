import { usePriceData } from '../hooks/usePriceData'

export function PriceWidget() {
  const { priceData, isLoading, error, refetch } = usePriceData()

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
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  const getTrendBg = (change: number) => {
    if (change > 0) return 'bg-green-900/20 border-green-500/30'
    if (change < 0) return 'bg-red-900/20 border-red-500/30'
    return 'bg-gray-900/20 border-gray-500/30'
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'supra': return 'text-purple-400'
      case 'coingecko': return 'text-blue-400'
      case 'mock': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'supra': return '🔮 Supra Oracle'
      case 'coingecko': return '🦄 CoinGecko (Fallback)'
      case 'mock': return '🎭 Mock Data (Dev Mode)'
      default: return '❓ Unknown Source'
    }
  }

  if (error && !priceData) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold mb-2 text-red-400">
          📈 Price Feed Error
        </h3>
        <p className="text-gray-400 text-sm text-center mb-4">
          {error}
        </p>
        <button
          onClick={refetch}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (isLoading || !priceData) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold mb-2 text-green-400">
          📈 Price Feed
        </h3>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
          <span className="text-gray-400">Loading price...</span>
        </div>
        <div className="text-gray-500">
                          WBNB/USDT: $---.--
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <h3 className="text-lg font-semibold mb-2 text-green-400">
        📈 Live Price Feed
      </h3>
      
      <div className={`border rounded-lg p-4 w-full ${getTrendBg(priceData.changePercent24h)}`}>
        <div className="text-center space-y-3">
          <div className="text-sm text-gray-400 font-medium">
                            WBNB/USDT
          </div>
          
          <div className="text-2xl font-bold text-white">
            ${formatPrice(priceData.price)}
          </div>
          
          <div className={`text-sm font-medium ${getTrendColor(priceData.changePercent24h)}`}>
            <div>{formatChange(priceData.change24h)} USDT</div>
            <div>{formatPercent(priceData.changePercent24h)}</div>
          </div>

          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>24h High:</span>
              <span className="text-green-400">${formatPrice(priceData.high24h)}</span>
            </div>
            <div className="flex justify-between">
              <span>24h Low:</span>
              <span className="text-red-400">${formatPrice(priceData.low24h)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 text-center space-y-1">
        <div className={getSourceColor(priceData.source)}>
          {getSourceLabel(priceData.source)}
        </div>
        <div>Updates every 5 seconds</div>
        <div>Last: {priceData.lastUpdate.toLocaleTimeString()}</div>
        {error && (
          <div className="text-orange-400 mt-2">
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  )
} 