import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { History, TrendingUp, Brain, Clock, Target, Eye, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, LoadingSpinner } from './ui'
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
      // Load trades from localStorage instead of disabled database
      console.log('📊 Loading trades from localStorage...')
      console.log('📊 Current address:', address)
      const rawData = localStorage.getItem('localTrades')
      console.log('📊 Raw localStorage data:', rawData)
      const localTrades = JSON.parse(rawData || '[]')
      console.log('📊 Parsed trades:', localTrades)
      console.log('📊 Total trades in storage:', localTrades.length)
      
      // Convert to SavedTrade format and filter by current wallet
      console.log('📊 Filtering trades for address:', address)
      const userTrades = localTrades
        .filter((trade: any) => {
          const matches = trade.id.startsWith(address)
          console.log(`📊 Trade ${trade.id} matches ${address}:`, matches)
          return matches
        })
        .map((trade: any): SavedTrade => ({
          id: trade.id,
          userId: address,
          walletAddress: address,
          symbol: trade.symbol,
          status: trade.status,
          entryPrice: trade.entryPrice,
          currentPrice: trade.currentPrice,
          takeProfitPrice: trade.takeProfitPrice,
          stopLossPrice: trade.stopLossPrice,
          confidence: trade.confidence,
          reasoning: trade.reasoning,
          timeframe: '2-4 hours', // Default timeframe
          riskReward: ((trade.takeProfitPrice - trade.entryPrice) / (trade.entryPrice - trade.stopLossPrice)) || 1.5,
          timestamp: trade.createdAt,
          createdAt: trade.createdAt,
          updatedAt: trade.createdAt,
          entryTxHash: trade.txHash
        }))
      
      console.log('📊 Final filtered trades:', userTrades)
      setTrades(userTrades)
      console.log(`📊 Loaded ${userTrades.length} trades from localStorage`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trades')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    if (!address) return
    
    try {
      // Calculate stats from localStorage trades
      const localTrades = JSON.parse(localStorage.getItem('localTrades') || '[]')
      const userTrades = localTrades.filter((trade: any) => trade.id.startsWith(address))
      
      const stats = {
        total: userTrades.length,
        executed: userTrades.filter((t: any) => t.status === 'executed').length,
        monitoring: userTrades.filter((t: any) => t.status === 'monitoring').length,
        ignored: userTrades.filter((t: any) => t.status === 'ignored').length,
        avgConfidence: userTrades.length > 0 
          ? userTrades.reduce((sum: number, t: any) => sum + t.confidence, 0) / userTrades.length 
          : 0,
        totalPnl: 0 // Will be calculated when trades close
      }
      
      setStats(stats)
      console.log('📈 Calculated stats from localStorage:', stats)
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
      <Card>
        <CardHeader>
          <CardTitle>📊 Trade History</CardTitle>
          <CardDescription>Your AI trading recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <History className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-400">Connect your wallet to view trade history</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Trade History</CardTitle>
        <CardDescription>Your AI trading recommendations</CardDescription>
      </CardHeader>
      <CardContent>
      {/* Stats Summary */}
      {stats && (
        <div className="mb-6">
          {/* Real vs Mock Trade Breakdown */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-950 border border-green-500 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-300">
                {trades.filter(t => t.entryTxHash && !t.entryTxHash.includes('mock') && t.entryTxHash.length > 20).length}
              </div>
              <div className="text-xs text-green-200">🔥 Live Trades</div>
            </div>
            <div className="bg-blue-950 border border-blue-500 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-300">
                {trades.filter(t => t.id.includes('mock') || (t.entryTxHash && t.entryTxHash.includes('mock'))).length}
              </div>
              <div className="text-xs text-blue-200">📝 Paper Trades</div>
            </div>
          </div>

          {/* Traditional Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div>
      )}

      {/* Debug Controls */}
      <div className="mb-4 flex gap-2">
        <Button onClick={() => { loadTrades(); loadStats(); }} variant="secondary" size="sm">
          🔄 Refresh Data
        </Button>
        <Button 
          onClick={() => {
            console.log('🔍 localStorage data:', localStorage.getItem('localTrades'))
            console.log('🔍 Current address:', address)
            console.log('🔍 All localStorage keys:', Object.keys(localStorage))
          }} 
          variant="secondary" 
          size="sm"
        >
          🔍 Debug Storage
        </Button>
      </div>

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
          <Button onClick={loadTrades} variant="default" size="sm">
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
          {trades.map((trade) => {
            // Determine if this is a real trade (has real tx hash) or mock trade
            const isRealTrade = trade.entryTxHash && !trade.entryTxHash.includes('mock') && trade.entryTxHash.length > 20
            const isMockTrade = trade.id.includes('mock') || (trade.entryTxHash && trade.entryTxHash.includes('mock'))
            
            return (
              <div key={trade.id} className={`rounded-lg p-4 border ${
                isRealTrade 
                  ? 'bg-green-950 border-green-500 shadow-green-500/20 shadow-lg' 
                  : isMockTrade 
                    ? 'bg-gray-900 border-gray-700 opacity-75' 
                    : 'bg-gray-900 border-gray-700'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Real Trade Indicator */}
                    {isRealTrade && (
                      <div className="bg-green-600 text-green-100 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        🔥 LIVE TRADE
                      </div>
                    )}
                    
                    {/* Mock Trade Indicator */}
                    {isMockTrade && (
                      <div className="bg-blue-600 text-blue-100 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        📝 PAPER TRADE
                      </div>
                    )}
                    
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

                {/* Real Trade Details */}
                {isRealTrade && (
                  <div className="mb-3 p-3 bg-green-900/30 rounded-lg border border-green-500/30">
                    <div className="text-xs text-green-300 font-medium mb-1">🚀 ACTIVE BLOCKCHAIN TRADE</div>
                    <div className="text-xs text-green-200">
                      TX: {trade.entryTxHash ? `${trade.entryTxHash.slice(0, 10)}...${trade.entryTxHash.slice(-8)}` : 'Pending'}
                    </div>
                    <div className="text-xs text-green-200 mt-1">
                      Supra Automation monitoring for take profit/stop loss
                    </div>
                  </div>
                )}

                {/* Mock Trade Notice */}
                {isMockTrade && (
                  <div className="mb-3 p-2 bg-blue-900/20 rounded border border-blue-500/30">
                    <div className="text-xs text-blue-300">📋 Paper trade - No real money involved</div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-400">Entry Price</div>
                    <div className="text-white font-semibold">{formatPrice(trade.entryPrice)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Take Profit</div>
                    <div className="text-green-400 font-semibold">
                      {formatPrice(trade.takeProfitPrice)}
                      <span className="text-xs ml-1">
                        ({formatPercent(trade.entryPrice, trade.takeProfitPrice)})
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Stop Loss</div>
                    <div className="text-red-400 font-semibold">
                      {formatPrice(trade.stopLossPrice)}
                      <span className="text-xs ml-1">
                        ({formatPercent(trade.entryPrice, trade.stopLossPrice)})
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Confidence</div>
                    <div className="text-purple-400 font-semibold">{trade.confidence}/10</div>
                  </div>
                </div>

                <div className="text-sm text-gray-300 mb-3">
                  {trade.reasoning}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="text-gray-400">
                    Risk/Reward: {trade.riskReward?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-gray-400">
                    Timeframe: {trade.timeframe || 'N/A'}
                  </div>
                </div>
              </div>
            )
          })}

          {trades.length >= 10 && (
            <div className="text-center pt-4">
              <Button onClick={loadTrades} variant="secondary" size="sm">
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
      </CardContent>
    </Card>
  )
} 