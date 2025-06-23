import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { History, TrendingUp, Brain, Clock, Target, Eye, X } from 'lucide-react'
import { Card, Button, LoadingSpinner } from './ui'
import { type SavedTrade } from '../lib/trades'

export function TradeHistory() {
  const { address, isConnected } = useAccount()
  const [trades, setTrades] = useState<SavedTrade[]>([])
  const [stats, setStats] = useState<{
    total: number
    executed: number
    monitoring: number
    ignored: number
    avgConfidence: number
    totalPnl: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isConnected && address) {
      loadTrades()
      loadStats()
    }
  }, [isConnected, address])

  const loadTrades = async () => {
    if (!address) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // TEMPORARILY DISABLED - Database schema mismatch
      console.log('📊 Trade history temporarily disabled due to database schema issues')
      setTrades([]) // Empty array instead of fetching from database
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trades')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    if (!address) return
    
    try {
      // TEMPORARILY DISABLED - Database schema mismatch  
      console.log('📈 Trade stats temporarily disabled due to database schema issues')
      setStats({
        total: 0,
        executed: 0,
        monitoring: 0,
        ignored: 0,
        avgConfidence: 7.5,
        totalPnl: 0
      })
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const formatPrice = (price: number) => `$${price.toFixed(2)}`
  const formatPercent = (current: number, target: number) => {
    const change = ((target - current) / current) * 100
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  const getStatusColor = (status: SavedTrade['status']) => {
    switch (status) {
      case 'generated': return 'bg-blue-600 text-blue-100'
      case 'monitoring': return 'bg-yellow-600 text-yellow-100'
      case 'executed': return 'bg-green-600 text-green-100'
      case 'closed': return 'bg-purple-600 text-purple-100'
      case 'ignored': return 'bg-gray-600 text-gray-100'
      default: return 'bg-gray-600 text-gray-100'
    }
  }

  const getStatusIcon = (status: SavedTrade['status']) => {
    switch (status) {
      case 'generated': return <Brain size={14} />
      case 'monitoring': return <Eye size={14} />
      case 'executed': return <TrendingUp size={14} />
      case 'closed': return <Target size={14} />
      case 'ignored': return <X size={14} />
      default: return <Clock size={14} />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    return 'Just now'
  }

  if (!isConnected) {
    return (
      <Card title="📊 Trade History" subtitle="Your AI trading recommendations">
        <div className="text-center py-8">
          <History className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-400">Connect your wallet to view trade history</p>
        </div>
      </Card>
    )
  }

  return (
    <Card title="📊 Trade History" subtitle="Your AI trading recommendations">
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-white">{stats.total}</div>
            <div className="text-xs text-gray-400">Total Ideas</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-green-400">{stats.executed}</div>
            <div className="text-xs text-gray-400">Executed</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-yellow-400">{stats.monitoring}</div>
            <div className="text-xs text-gray-400">Monitoring</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-purple-400">{stats.avgConfidence}/10</div>
            <div className="text-xs text-gray-400">Avg Confidence</div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && trades.length === 0 && (
        <div className="text-center py-8">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-400">Loading trade history...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">❌ {error}</div>
          <Button onClick={loadTrades} variant="primary" size="sm">
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && trades.length === 0 && (
        <div className="text-center py-8">
          <Brain className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-400 mb-2">No trade ideas yet</p>
          <p className="text-sm text-gray-500">Generate your first AI trade recommendation!</p>
        </div>
      )}

      {/* Trade List */}
      {trades.length > 0 && (
        <div className="space-y-3">
          {trades.map((trade) => (
            <div key={trade.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-white font-semibold">{trade.symbol}</div>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                    {getStatusIcon(trade.status)}
                    {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {formatTimeAgo(trade.createdAt)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div className="text-sm">
                  <span className="text-gray-400">Current:</span>
                  <div className="text-white font-medium">{formatPrice(trade.currentPrice)}</div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Entry:</span>
                  <div className="text-blue-400 font-medium">{formatPrice(trade.entryPrice)}</div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Take Profit:</span>
                  <div className="text-green-400 font-medium">
                    {formatPrice(trade.takeProfitPrice)}
                    <span className="text-xs ml-1">
                      ({formatPercent(trade.entryPrice, trade.takeProfitPrice)})
                    </span>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Stop Loss:</span>
                  <div className="text-red-400 font-medium">
                    {formatPrice(trade.stopLossPrice)}
                    <span className="text-xs ml-1">
                      ({formatPercent(trade.entryPrice, trade.stopLossPrice)})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-400">
                    <Brain size={14} className="inline mr-1" />
                    Confidence: <span className="text-white">{trade.confidence}/10</span>
                  </span>
                  <span className="text-gray-400">
                    <Clock size={14} className="inline mr-1" />
                    {trade.timeframe}
                  </span>
                </div>
                <div className="text-gray-400">
                  R/R: <span className="text-white">{trade.riskReward}:1</span>
                </div>
              </div>

              {trade.reasoning && (
                <div className="mt-3 p-3 bg-gray-800 rounded text-sm text-gray-300">
                  <div className="text-purple-400 font-medium mb-1">AI Analysis:</div>
                  {trade.reasoning}
                </div>
              )}
            </div>
          ))}

          {trades.length >= 10 && (
            <div className="text-center pt-4">
              <Button onClick={loadTrades} variant="secondary" size="sm">
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
} 