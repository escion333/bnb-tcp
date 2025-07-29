import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { X, Brain, TrendingUp, Activity, Wallet, BarChart3, Zap, Target, Shield } from 'lucide-react'
import { usePriceData } from './hooks/usePriceData'
import { useTradeIdeas } from './hooks/useTradeIdeas'
import { Button } from './components/ui'
import { TradeIdeaCard } from './components/TradeIdeaCard'
import { ConfigStatus, ConfigStatusCompact } from './components/ConfigStatus'
import { useUserConfig, useServiceStatus } from './contexts/UserConfigContext'
import './App.css'

function App() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { isSetupComplete, isLoading: configLoading } = useUserConfig()
  const { isOpenAIConfigured } = useServiceStatus()
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
    
    const currentPrice = priceData?.price || 832.21 // Use current BNB price as fallback
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
      if (action === 'monitor') {
        alert('👁️ Trade added to monitoring list!')
      } else if (action === 'ignore') {
        alert('❌ Trade idea ignored and removed.')
      }
      // Note: Execute action success is handled by TradeExecutionModal
      
    } catch (error) {
      console.error(`❌ Error handling trade action ${action}:`, error)
      alert(`Error ${action}ing trade: ${error}`)
    }
  }

  const handleRemoveTrade = (tradeId: string) => {
    if (!address) return
    
    try {
      // Get the trade to check if it's a live trade
      const localTrades = JSON.parse(localStorage.getItem('localTrades') || '[]')
      const trade = localTrades.find((t: any) => t.id === tradeId)
      
      if (!trade) {
        console.log('❌ Trade not found:', tradeId)
        return
      }
      
      // Check if this is a live trade (has real transaction hash)
      const isLiveTrade = trade.txHash && !trade.txHash.includes('mock') && trade.txHash.length > 20
      
      if (isLiveTrade) {
        alert('❌ Cannot clear a live trade. Use the "Close Trade" option to swap back to USDT.')
        return
      }
      
      // Only allow clearing for monitored/paper trades
      const updatedTrades = localTrades.filter((trade: any) => trade.id !== tradeId)
      localStorage.setItem('localTrades', JSON.stringify(updatedTrades))
      
      // Update state
      const userTrades = updatedTrades.filter((trade: any) => trade.id.startsWith(address))
      setTrades(userTrades)
      
      console.log(`✅ Monitored trade ${tradeId} cleared from history`)
    } catch (error) {
      console.error('❌ Error removing trade:', error)
    }
  }

  const handleCloseTrade = async (tradeId: string) => {
    if (!address) return
    
    try {
      // Get the trade details
      const localTrades = JSON.parse(localStorage.getItem('localTrades') || '[]')
      const trade = localTrades.find((t: any) => t.id === tradeId)
      
      if (!trade) {
        console.log('❌ Trade not found:', tradeId)
        return
      }
      
      // Check if this is actually a live trade
      const isLiveTrade = trade.txHash && !trade.txHash.includes('mock') && trade.txHash.length > 20
      
      if (!isLiveTrade) {
        alert('❌ This is not a live trade. Use the "Clear" option to remove it from history.')
        return
      }
      
      if (!confirm('🔄 This will swap your WBNB back to USDT at current market price. Continue?')) {
        return
      }
      
      console.log('🔄 Closing live trade by swapping back to USDT...')
      
      // Import required functions dynamically to avoid circular dependencies
      const { executeSwap, getSwapQuote, getTokenBalance, checkTokenApproval, approveToken } = await import('./lib/pancakeswap')
      const { TOKENS } = await import('./lib/pancakeswap')
      
      // Get current WBNB balance to determine how much to swap
      const wbnbBalance = await getTokenBalance(TOKENS.WBNB, address)
      const wbnbBalanceNumber = parseFloat(wbnbBalance)
      
      if (wbnbBalanceNumber <= 0) {
        alert('❌ No WBNB balance found to swap back to USDT')
        return
      }
      
      // Use the exact amount from the trade if available, otherwise use available balance
      // Parse the amount properly to avoid precision issues
      let amountToSwap: string
      if (trade.amountOut && parseFloat(trade.amountOut) <= wbnbBalanceNumber) {
        amountToSwap = trade.amountOut
      } else {
        // Use 99% of available balance to account for potential precision issues
        amountToSwap = (wbnbBalanceNumber * 0.99).toFixed(6)
      }
      
      console.log(`📊 Swapping ${amountToSwap} WBNB back to USDT`)
      
      const swapParams = {
        tokenIn: TOKENS.WBNB,
        tokenOut: TOKENS.USDT,
        amountIn: amountToSwap,
        slippageTolerance: 2.5, // Slightly higher slippage for market orders
        recipient: address,
        useNativeBNB: false
      }
      
      // Check if WBNB needs approval for spending
      console.log('🔍 Checking WBNB approval for PancakeSwap...')
      const approval = await checkTokenApproval(TOKENS.WBNB, address, amountToSwap)
      
      if (approval.needsApproval) {
        console.log('📝 WBNB approval needed, requesting approval...')
        
        if (!confirm('🔐 Your WBNB needs to be approved for swapping. This will require a separate transaction. Continue?')) {
          return
        }
        
        try {
          const approvalTxHash = await approveToken(TOKENS.WBNB, amountToSwap)
          console.log('✅ WBNB approval transaction submitted:', approvalTxHash)
          
          alert('🔐 Approval transaction submitted. Please wait a moment, then try closing the trade again.')
          return // Exit here, user needs to try again after approval confirms
          
        } catch (approvalError) {
          console.error('❌ Failed to approve WBNB:', approvalError)
          alert(`❌ Failed to approve WBNB: ${approvalError instanceof Error ? approvalError.message : String(approvalError)}`)
          return
        }
      }
      
      console.log('📡 Getting swap quote for close trade:', swapParams)
      const quote = await getSwapQuote(swapParams)
      console.log('💱 Quote received:', quote)
      
      console.log('🚀 Executing close trade swap...')
      const closeTxHash = await executeSwap(swapParams)
      
      // Update trade status to closed
      const updatedTrades = localTrades.map((t: any) => 
        t.id === tradeId 
          ? { 
              ...t, 
              status: 'closed', 
              closedAt: new Date().toISOString(),
              exitTxHash: closeTxHash,
              // Calculate realized PnL: USDT received - USDT spent
              realizedPnl: parseFloat(quote.amountOut) - parseFloat(trade.amountIn || '0')
            }
          : t
      )
      
      localStorage.setItem('localTrades', JSON.stringify(updatedTrades))
      
      // Update state
      const userTrades = updatedTrades.filter((trade: any) => trade.id.startsWith(address))
      setTrades(userTrades)
      
      const pnlText = trade.realizedPnl >= 0 ? `+$${trade.realizedPnl.toFixed(2)}` : `-$${Math.abs(trade.realizedPnl).toFixed(2)}`
      alert(`✅ Trade closed successfully!\n💰 Received: ${parseFloat(quote.amountOut).toFixed(2)} USDT\n📈 P&L: ${pnlText}\n🔗 Tx: ${closeTxHash}`)
      console.log(`✅ Live trade ${tradeId} closed with tx: ${closeTxHash}`)
      
    } catch (error) {
      console.error('❌ Error closing trade:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction'
        } else if (error.message.includes('approval')) {
          errorMessage = 'Token approval failed'
        } else if (error.message.includes('slippage')) {
          errorMessage = 'Price moved too much (slippage exceeded). Try again.'
        } else {
          errorMessage = error.message
        }
      }
      
      alert(`❌ Failed to close trade: ${errorMessage}`)
    }
  }

  const currentPrice = priceData?.price || 832.21 // Use current BNB price as fallback
  const priceChange = priceData?.changePercent24h || 0

  // Calculate portfolio data from trades and wallet balance
  // Only include live trades (active/executed) with real transaction hashes, not paper trades (monitoring)
  const activeTrades = trades.filter(trade => {
    // Check if it's a live trade with real transaction hash
    const isLiveTrade = trade.txHash && !trade.txHash.includes('mock') && trade.txHash.length > 20
    // Only include live trades that are active or executed
    return isLiveTrade && (trade.status === 'active' || trade.status === 'executed')
  })
  const activePositions = activeTrades.length
  
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
    
    if (entryPrice > 0) {
      // For live trades, use actual trade value if available
      let positionSize = 100 // Default fallback
      if (trade.tradeValue && trade.tradeValue > 0) {
        positionSize = trade.tradeValue
      } else if (trade.amountIn && parseFloat(trade.amountIn) > 0) {
        // Use the USDT amount spent on the trade
        positionSize = parseFloat(trade.amountIn)
      }
      
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation Header */}
      <nav className="relative z-10 flex items-center justify-between p-6 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              DeFi Copilot
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Wallet Connection */}
          {!isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Wallet className="w-4 h-4 mr-2" />
              {isPending ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          ) : (
            <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse-glow"></div>
              <span className="text-white/90 mr-3 font-medium">{formatAddress(address || '')}</span>
              <button
                onClick={handleDisconnect}
                className="text-white/60 hover:text-white/90 transition-colors duration-200"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Configuration Status */}
        <div className="mb-8">
          <ConfigStatus />
        </div>
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-8">
            <h2 className="text-7xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent animate-gradient-x">
                ${currentPrice.toFixed(2)}
              </span>
            </h2>
            <div className="flex items-center justify-center space-x-4">
              <span className="text-2xl text-white/80 font-medium">WBNB/USDT</span>
              <div className={`flex items-center px-4 py-2 rounded-full ${
                priceChange >= 0 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                <TrendingUp className={`w-4 h-4 mr-2 ${priceChange < 0 ? 'rotate-180' : ''}`} />
                <span className="font-semibold">
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { 
              label: '24H Range', 
              value: `$${(priceData?.low24h || 100.31).toFixed(2)}—$${(priceData?.high24h || 300.31).toFixed(2)}`,
              icon: BarChart3,
              color: 'from-blue-500 to-cyan-500'
            },
            { 
              label: '24h Volume', 
              value: formatLargeNumber(priceData?.volume24h || 1320000000),
              icon: Activity,
              color: 'from-purple-500 to-pink-500'
            },
            { 
              label: 'Market Cap', 
              value: formatLargeNumber(priceData?.marketCap || 45000000000),
              icon: TrendingUp,
              color: 'from-green-500 to-emerald-500'
            },
            { 
              label: 'Volatility', 
              value: 'Medium',
              icon: Target,
              color: 'from-orange-500 to-red-500'
            }
          ].map((stat, index) => (
            <div key={index}>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-white/60 text-sm mb-2">{stat.label}</p>
                <p className="text-white font-bold text-xl">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Portfolio & AI Assistant Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Portfolio Section */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white flex items-center">
                <Wallet className="w-6 h-6 mr-3 text-purple-400" />
                Portfolio
              </h3>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Total Value</p>
                <p className="text-3xl font-bold text-white">
                  {isConnected ? `$${formatLargeNumber(walletBalanceUSD)}` : '$0'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">PnL Today</p>
                <p className={`text-3xl font-bold ${
                  portfolioStats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {portfolioStats.totalPnl >= 0 ? '+' : ''}${formatLargeNumber(portfolioStats.totalPnl)}
                </p>
                <p className="text-xs text-white/40 mt-1">Live trades only</p>
              </div>
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Active Positions</p>
                <p className="text-3xl font-bold text-white">{activePositions}</p>
              </div>
            </div>
          </div>

          {/* AI Assistant Section */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <Brain className="w-6 h-6 mr-3 text-pink-400" />
                  AI Copilot
                </h3>
              </div>
              
              <Button 
                onClick={handleGenerateTradeIdea}
                disabled={tradeIdeas.isLoading || !isOpenAIConfigured}
                className={`w-full py-4 rounded-xl text-lg font-semibold shadow-lg transition-all duration-300 flex items-center justify-center ${
                  !isOpenAIConfigured 
                    ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:shadow-xl transform hover:scale-105'
                }`}
                title={!isOpenAIConfigured ? 'OpenAI API key required for AI trade ideas' : undefined}
              >
                {tradeIdeas.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-4"></div>
                    Analyzing Markets...
                  </>
                ) : !isOpenAIConfigured ? (
                  'Set up API Keys'
                ) : (
                  'Generate Trade Idea'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Trade Idea Card */}
        {tradeIdeas.currentIdea && (
          <div className="mb-12">
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-2xl font-bold text-white flex items-center">
                    <Shield className="w-6 h-6 mr-3 text-blue-400" />
                    Latest Trade Signal
                  </h4>
                  <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-glow"></div>
                    <span className="text-blue-300 font-medium">Confidence: {tradeIdeas.currentIdea.confidence}/10</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-white/60 text-sm mb-2">Entry Price</p>
                    <p className="text-white font-bold text-xl">${tradeIdeas.currentIdea.entryPrice.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-white/60 text-sm mb-2">Take Profit</p>
                    <p className="text-green-400 font-bold text-xl">${tradeIdeas.currentIdea.takeProfitPrice.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-white/60 text-sm mb-2">Stop Loss</p>
                    <p className="text-red-400 font-bold text-xl">${tradeIdeas.currentIdea.stopLossPrice.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-white/60 text-sm mb-2">Timeframe</p>
                    <p className="text-white font-bold text-xl">{tradeIdeas.currentIdea.timeframe}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-white/60 text-sm mb-2">Risk/Reward</p>
                    <p className="text-purple-400 font-bold text-xl">{tradeIdeas.currentIdea.riskReward.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="mb-6 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-white/80 text-sm"><strong className="text-white">Analysis:</strong> {tradeIdeas.currentIdea.reasoning}</p>
                </div>
                
                {/* Use TradeIdeaCard component for proper execute button logic */}
                <div className="hidden">
                  <TradeIdeaCard
                    tradeIdea={tradeIdeas.currentIdea}
                    isLoading={tradeIdeas.isLoading}
                    onGenerate={handleGenerateTradeIdea}
                    onAction={handleTradeAction}
                  />
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => {
                      // Use the TradeIdeaCard's execute logic
                      const tradeCard = document.querySelector('[data-execute-btn]') as HTMLButtonElement;
                      if (tradeCard) tradeCard.click();
                    }}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    🚀 Execute Trade
                  </Button>
                  <Button
                    onClick={() => handleTradeAction('monitor')}
                    className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    👁️ Monitor
                  </Button>
                  <Button
                    onClick={() => handleTradeAction('ignore')}
                    className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    ❌ Ignore
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {tradeIdeas.error && (
          <div className="mb-12">
            <div className="bg-red-500/20 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30">
              <h4 className="font-bold text-red-300 mb-2 flex items-center">
                <X className="w-5 h-5 mr-2" />
                Error
              </h4>
              <p className="text-red-200">{tradeIdeas.error}</p>
            </div>
          </div>
        )}

        {/* Trade History Section */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-white/10 to-white/5 border-b border-white/20 flex justify-between items-center">
            <h3 className="text-2xl font-bold text-white flex items-center">
              <Activity className="w-6 h-6 mr-3 text-green-400" />
              Trade History
            </h3>
            <p className="text-white/60">Executed trades automatically close when they hit TP/SL</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80 uppercase tracking-wider">Entry</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80 uppercase tracking-wider">Current</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80 uppercase tracking-wider">Take Profit</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80 uppercase tracking-wider">Stop Loss</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80 uppercase tracking-wider">P&L</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {trades.filter(trade => trade.status === 'monitoring' || trade.status === 'executed' || trade.status === 'active').length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
                          <BarChart3 className="w-10 h-10 text-white/40" />
                        </div>
                        <p className="text-white/80 text-xl mb-2">No active trades</p>
                        <p className="text-white/40">Execute or monitor a trade idea to see it here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  trades
                    .filter(trade => trade.status === 'monitoring' || trade.status === 'executed' || trade.status === 'active')
                    .slice(0, 10)
                    .map((trade, index) => {
                      const liveCurrentPrice = currentPrice
                      const entryPrice = trade.entryPrice || 0
                      const takeProfitPrice = trade.takeProfitPrice || 0
                      const stopLossPrice = trade.stopLossPrice || 0
                      
                      const pnl = entryPrice > 0 
                        ? ((liveCurrentPrice - entryPrice) / entryPrice * 100).toFixed(2)
                        : '0.00'
                      
                      return (
                        <tr key={trade.id || index} className="hover:bg-white/5 transition-all duration-200 table-row-hover">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-white font-semibold">{trade.symbol || 'WBNB/USDT'}</div>
                            <div className="text-green-400 text-sm font-medium">LONG</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                            {entryPrice > 0 ? formatPrice(entryPrice) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-white/80">
                            {formatPrice(liveCurrentPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-green-400 font-medium">
                            {takeProfitPrice > 0 ? formatPrice(takeProfitPrice) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-red-400 font-medium">
                            {stopLossPrice > 0 ? formatPrice(stopLossPrice) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`font-bold ${
                              parseFloat(pnl) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {parseFloat(pnl) >= 0 ? '+' : ''}{pnl}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {trade.tradeValue ? formatPrice(trade.tradeValue) : '$1.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              trade.status === 'executed' || trade.status === 'active'
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            }`}>
                              {trade.status === 'executed' || trade.status === 'active' ? '🚀 Active' : '👁️ Monitoring'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-white/60">
                            {trade.createdAt ? formatDate(trade.createdAt) : new Date().toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {(() => {
                              // Determine if this is a live trade (has real transaction hash)
                              const isLiveTrade = trade.txHash && !trade.txHash.includes('mock') && trade.txHash.length > 20
                              
                              if (isLiveTrade) {
                                return (
                                  <button
                                    onClick={() => handleCloseTrade(trade.id)}
                                    className="text-white/40 hover:text-orange-400 transition-colors duration-200 p-2 rounded-full hover:bg-orange-500/20 flex items-center gap-1 text-xs"
                                    title="Close trade (swap back to USDT)"
                                  >
                                    🔄 Close
                                  </button>
                                )
                              } else {
                                return (
                                  <button
                                    onClick={() => handleRemoveTrade(trade.id)}
                                    className="text-white/40 hover:text-red-400 transition-colors duration-200 p-2 rounded-full hover:bg-red-500/20 flex items-center gap-1 text-xs"
                                    title="Clear from history"
                                  >
                                    <X size={14} />
                                    Clear
                                  </button>
                                )
                              }
                            })()}
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
    </div>
  )
}

export default App
