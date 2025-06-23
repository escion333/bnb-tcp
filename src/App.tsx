import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { X, Brain } from 'lucide-react'
import { usePriceData } from './hooks/usePriceData'
import { useTradeIdeas } from './hooks/useTradeIdeas'
import { Button } from './components/ui'
import './App.css'

function App() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: bnbBalance } = useBalance({
    address: address,
  })
  
  // Get USDT balance (BSC)
  const { data: usdtBalance } = useBalance({
    address: address,
    token: '0x55d398326f99059fF775485246999027B3197955', // USDT on BSC
  })
  
  // Get USDC balance (BSC) 
  const { data: usdcBalance } = useBalance({
    address: address,
    token: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC on BSC
  })
  
  // Get BUSD balance (BSC)
  const { data: busdBalance } = useBalance({
    address: address,
    token: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD on BSC
  })
  
  // Get WBNB balance (BSC)
  const { data: wbnbBalance } = useBalance({
    address: address,
    token: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB on BSC
  })
  const { priceData } = usePriceData()
  const tradeIdeas = useTradeIdeas(address)
  const [trades, setTrades] = useState<any[]>([])

  // Load trades from localStorage
  useEffect(() => {
    if (isConnected && address) {
      const localTrades = JSON.parse(localStorage.getItem('localTrades') || '[]')
      const userTrades = localTrades.filter((trade: any) => trade.id.startsWith(address))
      console.log('📊 Loaded trades from localStorage:', userTrades.length)
      setTrades(userTrades)
    }
  }, [isConnected, address])

  // Refresh trades when a new trade idea is generated
  useEffect(() => {
    if (tradeIdeas.currentSavedTrade && address) {
      console.log('🔄 New trade idea generated, refreshing trades list')
      const localTrades = JSON.parse(localStorage.getItem('localTrades') || '[]')
      const userTrades = localTrades.filter((trade: any) => trade.id.startsWith(address))
      setTrades(userTrades)
    }
  }, [tradeIdeas.currentSavedTrade, address])

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleConnect = () => {
    const metaMaskConnector = connectors.find(connector => connector.name === 'MetaMask')
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector })
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const handleGenerateTradeIdea = async () => {
    console.log('🔘 Generate trade idea button clicked')
    
    if (!isConnected) {
      console.log('⚠️ Wallet not connected, opening connection modal')
      handleConnect()
      return
    }
    
    const currentPrice = priceData?.price || 100.22
    console.log('🤖 Generating trade idea with price:', currentPrice, 'address:', address)
    
    try {
      await tradeIdeas.generateNewIdea('WBNB/USDT', currentPrice)
      console.log('✅ Trade idea generation completed')
    } catch (error) {
      console.error('❌ Error generating trade idea:', error)
      alert(`Error generating trade idea: ${error}`)
    }
  }

  const handleTradeAction = async (action: 'execute' | 'monitor' | 'ignore') => {
    if (!tradeIdeas.currentIdea) {
      console.error('❌ No current trade idea to act on')
      return
    }

    console.log(`🎯 Handling trade action: ${action}`)
    
    try {
      await tradeIdeas.handleTradeAction(action, tradeIdeas.currentIdea)
      
      // Refresh trades list after action
      if (address) {
        const localTrades = JSON.parse(localStorage.getItem('localTrades') || '[]')
        const userTrades = localTrades.filter((trade: any) => trade.id.startsWith(address))
        setTrades(userTrades)
      }
      
      console.log(`✅ Trade action ${action} completed successfully`)
      
      // Show success message
      if (action === 'execute') {
        alert('🚀 Trade executed! (Mock execution - in production this would submit a real transaction)')
      } else if (action === 'monitor') {
        alert('👁️ Trade added to monitoring list!')
      } else if (action === 'ignore') {
        alert('❌ Trade idea ignored and removed.')
      }
      
    } catch (error) {
      console.error(`❌ Error handling trade action ${action}:`, error)
      alert(`Error ${action}ing trade: ${error}`)
    }
  }

  const handleRemoveTrade = (tradeId: string) => {
    if (!address) return
    
    try {
      // Remove trade from localStorage
      const localTrades = JSON.parse(localStorage.getItem('localTrades') || '[]')
      const updatedTrades = localTrades.filter((trade: any) => trade.id !== tradeId)
      localStorage.setItem('localTrades', JSON.stringify(updatedTrades))
      
      // Update state
      const userTrades = updatedTrades.filter((trade: any) => trade.id.startsWith(address))
      setTrades(userTrades)
      
      console.log(`✅ Trade ${tradeId} removed from history`)
    } catch (error) {
      console.error('❌ Error removing trade:', error)
    }
  }

  const currentPrice = priceData?.price || 100.22
  const priceChange = priceData?.changePercent24h || 4.54

  // Calculate portfolio data from trades and wallet balance
  const activeTrades = trades.filter(trade => trade.status === 'monitoring' || trade.status === 'executed')
  const activePositions = trades.filter(trade => trade.status === 'executed').length
  
  // Calculate total wallet value in USD
  const walletBalanceUSD = (() => {
    let totalValue = 0
    
    // BNB value
    if (bnbBalance) {
      totalValue += parseFloat(bnbBalance.formatted) * currentPrice
    }
    
    // USDT value (already in USD)
    if (usdtBalance) {
      totalValue += parseFloat(usdtBalance.formatted)
    }
    
    // USDC value (already in USD)
    if (usdcBalance) {
      totalValue += parseFloat(usdcBalance.formatted)
    }
    
    // BUSD value (already in USD)
    if (busdBalance) {
      totalValue += parseFloat(busdBalance.formatted)
    }
    
    // WBNB value (same price as BNB)
    if (wbnbBalance) {
      totalValue += parseFloat(wbnbBalance.formatted) * currentPrice
    }
    
    return totalValue
  })()
  
  const portfolioStats = activeTrades.reduce((acc, trade) => {
    const entryPrice = trade.entryPrice || 0
    const positionSize = 100 // Mock position size of $100 per trade for P&L calc
    
    if (entryPrice > 0) {
      const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100
      const pnlAmount = (positionSize * pnlPercent) / 100
      acc.totalPnl += pnlAmount
    }
    
    return acc
  }, { totalPnl: 0 })

  const formatPrice = (price: number) => `$${price.toFixed(2)}`
  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(2)}B`
    } else if (num >= 1e6) {
      return `${(num / 1e6).toFixed(2)}M`
    } else if (num >= 1e3) {
      return `${(num / 1e3).toFixed(2)}K`
    }
    return num.toFixed(2)
  }
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated': return 'text-blue-600 bg-blue-100'
      case 'monitoring': return 'text-yellow-600 bg-yellow-100'
      case 'executed': return 'text-green-600 bg-green-100'
      case 'closed': return 'text-purple-600 bg-purple-100'
      case 'ignored': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 py-8">
      {/* Title */}
      <h1 className="text-6xl font-bold text-black mb-16">DeFi Copilot</h1>

      {/* Connect Wallet Button */}
      <div className="mb-16">
        {!isConnected ? (
          <Button
            onClick={handleConnect}
            disabled={isPending}
            className="bg-gray-200 hover:bg-gray-300 text-black px-6 py-2 rounded-md"
          >
            {isPending ? 'Connecting...' : 'Connect wallet'}
          </Button>
        ) : (
          <div className="flex items-center bg-gray-200 px-4 py-2 rounded-md">
            <span className="text-black mr-2">{formatAddress(address || '')}</span>
            <button
              onClick={handleDisconnect}
              className="text-black hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Price Section */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-black mb-2">
          WBNB//USDT ${currentPrice.toFixed(2)} ({priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%)
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-8 mb-12 text-center">
        <div>
          <p className="text-gray-600 text-sm mb-1">24H Range</p>
          <p className="text-black font-medium">${(priceData?.low24h || 100.31).toFixed(2)}—${(priceData?.high24h || 300.31).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm mb-1">24h Volume</p>
          <p className="text-black font-medium">{formatLargeNumber(priceData?.volume24h || 1320000000)}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm mb-1">Marketcap</p>
          <p className="text-black font-medium">{formatLargeNumber(priceData?.marketCap || 45000000000)}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm mb-1">Volatility</p>
          <p className="text-black font-medium">Medium</p>
        </div>
      </div>

      {/* Portfolio Section */}
      <div className="mb-12 text-center">
        <h3 className="text-black font-semibold mb-6">PORTFOLIO</h3>
        <div className="grid grid-cols-3 gap-8">
          <div>
            <p className="text-gray-600 text-sm mb-1">Value</p>
            <p className="text-black font-medium">
              {isConnected ? formatLargeNumber(walletBalanceUSD) : '$0'}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-1">PnL today</p>
            <p className={`font-medium ${portfolioStats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioStats.totalPnl >= 0 ? '+' : ''}{formatLargeNumber(portfolioStats.totalPnl)}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-1">Active positions</p>
            <p className="text-black font-medium">{activePositions}</p>
          </div>
        </div>
      </div>

      {/* Generate Trade Idea Button */}
      <div className="mb-16">
        <Button 
          onClick={handleGenerateTradeIdea}
          disabled={tradeIdeas.isLoading}
          className="bg-gray-200 hover:bg-gray-300 text-black px-8 py-4 rounded-full text-lg flex items-center"
        >
          <div className="w-8 h-8 bg-gray-400 rounded-full mr-3 flex items-center justify-center">
            {tradeIdeas.isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
            ) : (
              <Brain size={16} className="text-gray-600" />
            )}
          </div>
          {tradeIdeas.isLoading ? 'Generating...' : 'Generate trade idea'}
        </Button>
        
        {/* Show Current Trade Idea */}
        {tradeIdeas.currentIdea && (
          <div className="mt-4 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-4">Latest Trade Idea Generated!</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-blue-800">
              <div>
                <p><strong>Entry:</strong> ${tradeIdeas.currentIdea.entryPrice.toFixed(2)}</p>
                <p><strong>Take Profit:</strong> ${tradeIdeas.currentIdea.takeProfitPrice.toFixed(2)}</p>
                <p><strong>Stop Loss:</strong> ${tradeIdeas.currentIdea.stopLossPrice.toFixed(2)}</p>
              </div>
              <div>
                <p><strong>Confidence:</strong> {tradeIdeas.currentIdea.confidence}/10</p>
                <p><strong>Timeframe:</strong> {tradeIdeas.currentIdea.timeframe}</p>
                <p><strong>Risk/Reward:</strong> {tradeIdeas.currentIdea.riskReward.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-blue-100 rounded text-sm text-blue-900">
              <p><strong>Analysis:</strong> {tradeIdeas.currentIdea.reasoning}</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => handleTradeAction('execute')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
              >
                🚀 Execute Trade
              </Button>
              <Button
                onClick={() => handleTradeAction('monitor')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 text-sm"
              >
                👁️ Monitor
              </Button>
              <Button
                onClick={() => handleTradeAction('ignore')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 text-sm"
              >
                ❌ Ignore
              </Button>
            </div>
          </div>
        )}
        
        {/* Show Error */}
        {tradeIdeas.error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-semibold text-red-900 mb-2">Error</h4>
            <p className="text-sm text-red-800">{tradeIdeas.error}</p>
          </div>
        )}
      </div>

      {/* Trade History Section */}
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Trade History</h3>
          <p className="text-sm text-gray-600">Executed trades automatically closes when they hit TP/SL</p>
        </div>
        
        {/* Trade History Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Entry
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Current
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Take Profit
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Stop Loss
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  P&L
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {trades.filter(trade => trade.status === 'monitoring' || trade.status === 'executed').length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl text-gray-400">📊</span>
                      </div>
                      <p className="text-gray-500 text-lg mb-1">No active trades</p>
                      <p className="text-gray-400 text-sm">Execute or monitor a trade idea to see it here</p>
                    </div>
                  </td>
                </tr>
              ) : (
                trades
                  .filter(trade => trade.status === 'monitoring' || trade.status === 'executed')
                  .slice(0, 10)
                  .map((trade, index) => {
                    // Use live current price for accurate P&L calculation
                    const liveCurrentPrice = currentPrice
                    const entryPrice = trade.entryPrice || 0
                    const takeProfitPrice = trade.takeProfitPrice || 0
                    const stopLossPrice = trade.stopLossPrice || 0
                    
                    // Calculate accurate P&L using live price
                    const pnl = entryPrice > 0 
                      ? ((liveCurrentPrice - entryPrice) / entryPrice * 100).toFixed(2)
                      : '0.00'
                    
                    return (
                      <tr key={trade.id || index} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{trade.symbol || 'WBNB/USDT'}</div>
                          <div className="text-xs text-gray-500">LONG</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entryPrice > 0 ? formatPrice(entryPrice) : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatPrice(liveCurrentPrice)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {takeProfitPrice > 0 ? formatPrice(takeProfitPrice) : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          {stopLossPrice > 0 ? formatPrice(stopLossPrice) : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`text-sm font-semibold ${
                            parseFloat(pnl) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {parseFloat(pnl) >= 0 ? '+' : ''}{pnl}%
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            trade.status === 'executed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {trade.status === 'executed' ? '🚀 Executed' : '👁️ Monitoring'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {trade.createdAt ? formatDate(trade.createdAt) : new Date().toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleRemoveTrade(trade.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors duration-150"
                            title="Remove trade"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default App
