import { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Button, LoadingSpinner } from './ui'
import { useAccount } from 'wagmi'
import type { TradeIdea } from '../lib/openai'
import { 
  checkTokenApproval, 
  approveToken, 
  executeSwap, 
  getSwapQuote,
  TOKENS,
  getTokenDisplayName,
  type SwapParams,
  type SwapQuote,
  getTokenBalance
} from '../lib/pancakeswap'
import { supraAutomation, type TradeAutomationParams } from '../lib/supra-automation'
import { AlertCircle, ArrowRight, CheckCircle, ExternalLink, Bot } from 'lucide-react'

interface TradeExecutionModalProps {
  isOpen: boolean
  onClose: () => void
  tradeIdea: TradeIdea | null
  onTradeExecuted: (txHash: string) => void
}

type ExecutionStep = 'preview' | 'approval' | 'swap' | 'automation' | 'success' | 'error'

interface ExecutionState {
  step: ExecutionStep
  isLoading: boolean
  error: string | null
  txHash: string | null
  quote: SwapQuote | null
  needsApproval: boolean
  automationTaskIds?: {
    takeProfitTaskId: string
    stopLossTaskId: string
  }
  simulationResult?: {
    takeProfitSimulation: {
      success: boolean
      estimatedGas: number
      estimatedFee: number
      errors?: string[]
    }
    stopLossSimulation: {
      success: boolean
      estimatedGas: number
      estimatedFee: number
      errors?: string[]
    }
    totalEstimatedGas: number
    totalEstimatedFee: number
  }
}

// Add this interface for local trade storage
interface LocalTrade {
  id: string
  txHash: string
  symbol: string
  status: 'active' | 'monitoring'
  entryPrice: number
  currentPrice: number
  takeProfitPrice: number
  stopLossPrice: number
  confidence: number
  reasoning: string
  createdAt: string
  amountIn: string
  amountOut: string
  tradeValue: number
  automationTaskIds?: {
    takeProfitTaskId: string
    stopLossTaskId: string
  }
}

export function TradeExecutionModal({ 
  isOpen, 
  onClose, 
  tradeIdea, 
  onTradeExecuted 
}: TradeExecutionModalProps) {
  const { address } = useAccount()
  const [state, setState] = useState<ExecutionState>({
    step: 'preview',
    isLoading: false,
    error: null,
    txHash: null,
    quote: null,
    needsApproval: false
  })

  // Define the tokens we're trading (consistent across the component)
  const tokenIn = TOKENS.USDT // Use USDT to buy WBNB (LONG position)
  const tokenOut = TOKENS.WBNB // Get WBNB output (we're going LONG on WBNB)

  // Reset state when modal opens/closes or trade idea changes
  useEffect(() => {
    if (isOpen && tradeIdea) {
      setState({
        step: 'preview',
        isLoading: false,
        error: null,
        txHash: null,
        quote: null,
        needsApproval: false
      })
      loadQuoteAndApproval()
    }
  }, [isOpen, tradeIdea])

  const loadQuoteAndApproval = async () => {
    if (!tradeIdea || !address) {
      console.log('❌ loadQuoteAndApproval: Missing tradeIdea or address', { tradeIdea: !!tradeIdea, address: !!address })
      return
    }

    console.log('🔄 Loading quote and approval check...')
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Get user's current USDT balance (for LONG position - selling USDT to buy WBNB)
      console.log('📊 Getting USDT balance for address:', address)
      const usdtBalance = await getTokenBalance(TOKENS.USDT, address)
      const balanceNumber = parseFloat(usdtBalance)
      console.log('💰 Current USDT balance:', balanceNumber)
      
      // For USDT trades, we need BNB for gas fees
      const bnbBalance = await getTokenBalance(TOKENS.NATIVE_BNB, address)
      const bnbBalanceNumber = parseFloat(bnbBalance)
      
      // Check if user has enough BNB for gas (need at least 0.002 BNB for gas)
      if (bnbBalanceNumber < 0.002) {
        const errorMsg = `Insufficient BNB for gas fees. You have ${bnbBalanceNumber.toFixed(4)} BNB but need at least 0.002 BNB for transaction fees`
        console.log('❌ Insufficient BNB for gas:', errorMsg)
        setState(prev => ({
          ...prev,
          error: errorMsg,
          isLoading: false
        }))
        return
      }
      
      // Use reasonable amount of USDT: 1 USDT or available amount
      const desiredAmount = 1.0 // 1 USDT for testing
      const amountIn = Math.min(desiredAmount, balanceNumber).toString()
      
      console.log('📊 Trade calculation:', {
        usdtBalance: balanceNumber,
        bnbBalance: bnbBalanceNumber,
        desiredAmount,
        amountIn
      })
      
      // Check if user has enough USDT for trade (minimum 0.1 USDT)
      if (balanceNumber < 0.1) {
        const errorMsg = `Insufficient USDT balance. You have ${balanceNumber.toFixed(2)} USDT but need at least 0.1 USDT for trading (plus 0.002 BNB for gas)`
        console.log('❌ Insufficient USDT balance:', errorMsg)
        setState(prev => ({
          ...prev,
          error: errorMsg,
          isLoading: false
        }))
        return
      }

      const swapParams: SwapParams = {
        tokenIn,
        tokenOut,
        amountIn,
        slippageTolerance: 2.0, // 2.0% slippage for mainnet reliability
        recipient: address,
        useNativeBNB: false // We're doing USDT -> WBNB trade
      }

      console.log('📡 Getting swap quote with params:', swapParams)
      // Get quote
      const quote = await getSwapQuote(swapParams)
      console.log('✅ Quote received:', quote)

      // Check if approval is needed
      console.log('🔍 Checking token approval...')
      const approval = await checkTokenApproval(tokenIn, address, amountIn)
      console.log('✅ Approval check complete:', approval)

      setState(prev => ({
        ...prev,
        quote,
        needsApproval: approval.needsApproval,
        isLoading: false
      }))
      console.log('✅ Quote and approval check completed successfully')
    } catch (error) {
      console.error('❌ Error loading quote:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({
        ...prev,
        error: `Failed to load trade quote: ${errorMessage}`,
        isLoading: false
      }))
    }
  }

  const handleApproval = async () => {
    if (!tradeIdea || !address) return

    setState(prev => ({ ...prev, step: 'approval', isLoading: true, error: null }))

    try {
      // Use dynamic amount based on calculated trade size
      const usdtBalance = await getTokenBalance(TOKENS.USDT, address)
      const balanceNumber = parseFloat(usdtBalance)
      const desiredAmount = 1.0 // 1 USDT for testing
      const amountIn = Math.min(desiredAmount, balanceNumber).toString()

      await approveToken(tokenIn, amountIn)
      
      // Wait a moment for the approval to propagate
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          needsApproval: false,
          step: 'preview',
          isLoading: false
        }))
      }, 3000)

    } catch (error) {
      console.error('Error approving token:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to approve token',
        isLoading: false,
        step: 'error'
      }))
    }
  }

  const handleExecuteSwap = async () => {
    console.log('🚀 Execute button clicked!')
    console.log('📊 Address:', address)
    console.log('📊 Trade Idea:', tradeIdea)
    console.log('📊 Quote:', state.quote)
    
    if (!tradeIdea || !address || !state.quote) {
      console.log('❌ Missing requirements:', { tradeIdea: !!tradeIdea, address: !!address, quote: !!state.quote })
      return
    }

    console.log('📝 Setting loading state...')
    setState(prev => ({ ...prev, step: 'swap', isLoading: true, error: null }))

    try {
      // Calculate safe amount based on current USDT balance  
      const usdtBalance = await getTokenBalance(TOKENS.USDT, address)
      const balanceNumber = parseFloat(usdtBalance)
      const desiredAmount = 1.0 // 1 USDT for testing
      const amountIn = Math.min(desiredAmount, balanceNumber).toString()
      
      const swapParams: SwapParams = {
        tokenIn,
        tokenOut,
        amountIn,
        slippageTolerance: 2.0,
        recipient: address,
        useNativeBNB: false // USDT -> WBNB trade
      }

      console.log('📡 Calling executeSwap with params:', swapParams)
      const txHash = await executeSwap(swapParams)
      console.log('✅ Transaction hash received:', txHash)

      // Move to automation step after successful swap
      setState(prev => ({
        ...prev,
        step: 'automation',
        txHash,
        isLoading: true // Keep loading while registering automation
      }))

      // Register Supra Automation for TP/SL
      await registerTradeAutomation(txHash)

      onTradeExecuted(txHash)
    } catch (error) {
      console.error('❌ Error executing swap:', error)
      console.error('❌ Error details:', error instanceof Error ? error.message : String(error))
      setState(prev => ({
        ...prev,
        error: `Failed to execute swap: ${error instanceof Error ? error.message : String(error)}`,
        isLoading: false,
        step: 'error'
      }))
    }
  }

  const registerTradeAutomation = async (_txHash: string) => {
    if (!tradeIdea || !address || !state.quote) {
      console.log('⚠️ Skipping automation registration - missing data')
      setState(prev => ({ ...prev, step: 'success', isLoading: false }))
      return
    }

    try {
      console.log('🤖 Registering Supra Automation for TP/SL...')

      const automationParams: TradeAutomationParams = {
        walletAddress: address,
        tokenPair: 'WBNB/USDT',
        entryPrice: tradeIdea.entryPrice,
        takeProfitPrice: tradeIdea.takeProfitPrice,
        stopLossPrice: tradeIdea.stopLossPrice,
        tradeAmount: parseFloat(state.quote.amountOut), // Amount of WBNB received
        slippageTolerance: 2.0 // 2.0% slippage tolerance for mainnet
      }

      const automationTaskIds = await supraAutomation.registerTradeAutomation(automationParams)

      console.log('🎉 Supra Automation registered successfully!')
      console.log(`   Take Profit Task: ${automationTaskIds.takeProfitTaskId}`)
      console.log(`   Stop Loss Task: ${automationTaskIds.stopLossTaskId}`)

      // Save trade to localStorage for dashboard display
      saveTradeToLocalStorage(_txHash, automationTaskIds)

      setState(prev => ({
        ...prev,
        step: 'success',
        isLoading: false,
        automationTaskIds
      }))

    } catch (error) {
      console.error('❌ Failed to register automation:', error)
      
      // Save trade to localStorage even if automation fails
      saveTradeToLocalStorage(_txHash)

      // Don't fail the entire trade if automation fails
      setState(prev => ({
        ...prev,
        step: 'success',
        isLoading: false,
        error: `Trade successful but automation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }))
    }
  }

  const handleClose = () => {
    setState({
      step: 'preview',
      isLoading: false,
      error: null,
      txHash: null,
      quote: null,
      needsApproval: false
    })
    onClose()
  }

  // Add function to save trade to localStorage
  const saveTradeToLocalStorage = (txHash: string, automationTaskIds?: { takeProfitTaskId: string; stopLossTaskId: string }) => {
    console.log('💾 Starting saveTradeToLocalStorage...')
    console.log('💾 Inputs:', { txHash, automationTaskIds, tradeIdea: !!tradeIdea, address, quote: !!state.quote })
    
    if (!tradeIdea || !address || !state.quote) {
      console.error('💾 Cannot save - missing required data:', { 
        tradeIdea: !!tradeIdea, 
        address: !!address, 
        quote: !!state.quote 
      })
      return
    }

    // Calculate trade value in USD based on WBNB amount received
    const tradeValue = parseFloat(state.quote.amountOut) * tradeIdea.entryPrice

    const trade: LocalTrade = {
      id: `${address}_${Date.now()}`,
      txHash,
      symbol: 'WBNB/USDT',
      status: automationTaskIds ? 'monitoring' : 'active',
      entryPrice: tradeIdea.entryPrice,
      currentPrice: tradeIdea.entryPrice,
      takeProfitPrice: tradeIdea.takeProfitPrice,
      stopLossPrice: tradeIdea.stopLossPrice,
      confidence: tradeIdea.confidence,
      reasoning: tradeIdea.reasoning,
      createdAt: new Date().toISOString(),
      amountIn: state.quote.amountOut, // Dynamic amount based on actual trade
      amountOut: state.quote.amountOut,
      tradeValue: tradeValue,
      automationTaskIds
    }

    console.log('💾 Trade object created:', trade)

    try {
      // Get existing trades
      const existingTrades = JSON.parse(localStorage.getItem('localTrades') || '[]')
      console.log('💾 Existing trades count:', existingTrades.length)
      
      existingTrades.unshift(trade) // Add to beginning
      
      // Keep only last 50 trades
      if (existingTrades.length > 50) {
        existingTrades.splice(50)
      }
      
      localStorage.setItem('localTrades', JSON.stringify(existingTrades))
      console.log('✅ Trade saved to localStorage successfully!')
      console.log('💾 New trades count:', existingTrades.length)
      console.log('💾 Saved trade ID:', trade.id)
      
      // Verify the save worked
      const verification = JSON.parse(localStorage.getItem('localTrades') || '[]')
      console.log('💾 Verification - total trades now:', verification.length)
      console.log('💾 First trade in array:', verification[0]?.id)
      
    } catch (error) {
      console.error('❌ Failed to save trade to localStorage:', error)
    }
  }

  // DEBUG: Add test function to create sample trade
  const createTestTrade = () => {
    if (!address) return
    
    console.log('🧪 Creating test trade for debugging...')
    const testTrade: LocalTrade = {
      id: `${address}_${Date.now()}`,
      txHash: '0x1234567890abcdef',
      symbol: 'WBNB/USDT',
      status: 'monitoring',
      entryPrice: 635.50,
      currentPrice: 635.50,
      takeProfitPrice: 685.20,
      stopLossPrice: 590.00,
      confidence: 8,
      reasoning: 'Test trade for debugging dashboard display',
      createdAt: new Date().toISOString(),
      amountIn: '0.01',
      amountOut: '6.18',
      tradeValue: 6.35,
      automationTaskIds: {
        takeProfitTaskId: 'mock_take_profit_test123',
        stopLossTaskId: 'mock_stop_loss_test456'
      }
    }
    
    const existingTrades = JSON.parse(localStorage.getItem('localTrades') || '[]')
    existingTrades.unshift(testTrade)
    localStorage.setItem('localTrades', JSON.stringify(existingTrades))
    console.log('🧪 Test trade created:', testTrade.id)
    
    // Trigger a page refresh to see if Trade History loads it
    window.location.reload()
  }

  // Add to window for debugging (remove in production)
  if (typeof window !== 'undefined') {
    (window as any).createTestTrade = createTestTrade
  }



  if (!tradeIdea) return null

  const renderStepContent = () => {
    switch (state.step) {
      case 'preview':
        return (
          <div className="space-y-6">
            {/* Trade Details */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <h3 className="font-semibold text-white mb-3">Trade Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Pair:</span>
                  <span className="font-medium text-white">WBNB/USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Entry Price:</span>
                  <span className="font-medium text-white">${tradeIdea.entryPrice?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Take Profit:</span>
                  <span className="font-medium text-green-400">${tradeIdea.takeProfitPrice?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stop Loss:</span>
                  <span className="font-medium text-red-400">${tradeIdea.stopLossPrice?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Confidence:</span>
                  <span className={`font-medium ${
                    tradeIdea.confidence >= 8 ? 'text-green-400' :
                    tradeIdea.confidence >= 6 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {tradeIdea.confidence}/10
                  </span>
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-gray-900 rounded-lg p-4 border border-purple-600">
              <h3 className="font-semibold text-white mb-2">AI Analysis</h3>
              <p className="text-sm text-gray-300">{tradeIdea.reasoning}</p>
            </div>

            {/* Error Display */}
            {state.error && (
              <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
                <div className="flex items-center text-red-400 mb-2">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-300 text-sm">{state.error}</p>
                <Button 
                  onClick={loadQuoteAndApproval} 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 border-red-600 text-red-400 hover:bg-red-900/30"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              {state.needsApproval ? (
                <Button 
                  onClick={handleApproval}
                  disabled={state.isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  {state.isLoading ? <LoadingSpinner size="sm" /> : 'Approve USDT'}
                </Button>
              ) : (
                <Button 
                  onClick={handleExecuteSwap}
                  disabled={state.isLoading || !state.quote}
                  variant="default"
                  className="flex-1"
                  title={!state.quote ? 'Loading trade quote...' : undefined}
                >
                  {state.isLoading ? <LoadingSpinner size="sm" /> : !state.quote ? 'Loading...' : 'Execute Trade'}
                </Button>
              )}
            </div>
          </div>
        )

      case 'approval':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Approving Token</h3>
              <p className="text-gray-300 mt-1">Please confirm the approval in your wallet</p>
            </div>
          </div>
        )

      case 'swap':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Executing Trade</h3>
              <p className="text-gray-300 mt-1">Please confirm the transaction in your wallet</p>
            </div>
          </div>
        )

      case 'automation':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <Bot className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Setting Up Automation</h3>
              <p className="text-gray-300 mt-1">Registering Take Profit & Stop Loss with Supra Automation...</p>
              <div className="mt-3 text-sm text-purple-400">
                <div>🎯 Configuring Take Profit at ${tradeIdea.takeProfitPrice?.toFixed(2)}</div>
                <div>🛡️ Setting Stop Loss at ${tradeIdea.stopLossPrice?.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Trade Executed!</h3>
              <p className="text-gray-300 mt-1">Your trade has been successfully executed</p>
              
              {/* Automation Status */}
              {state.automationTaskIds ? (
                <div className="mt-4 p-3 bg-purple-900/20 border border-purple-600 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Bot className="h-4 w-4 text-purple-400 mr-2" />
                    <span className="text-sm font-medium text-purple-400">Supra Automation Active</span>
                  </div>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>🎯 Take Profit: Task {state.automationTaskIds.takeProfitTaskId.slice(0, 8)}...</div>
                    <div>🛡️ Stop Loss: Task {state.automationTaskIds.stopLossTaskId.slice(0, 8)}...</div>
                    <div className="text-purple-300 mt-2">Your positions will be automatically managed!</div>
                  </div>
                </div>
              ) : state.error?.includes('automation') ? (
                <div className="mt-4 p-3 bg-orange-900/20 border border-orange-600 rounded-lg">
                  <div className="text-xs text-orange-300">
                    ⚠️ Trade successful but automation setup failed
                  </div>
                </div>
              ) : null}

              {state.txHash && (
                <a
                  href={`https://bscscan.com/tx/${state.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-400 hover:text-blue-300 mt-2"
                >
                  View on BscScan
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              )}
            </div>
            <Button onClick={handleClose} variant="default" className="w-full">
              Close
            </Button>
          </div>
        )

      case 'error':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Trade Failed</h3>
              <p className="text-red-400 mt-1">{state.error}</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={handleClose} className="flex-1">
                Close
              </Button>
              <Button onClick={loadQuoteAndApproval} variant="default" className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Execute Trade"
      className="max-w-md"
    >
      {state.isLoading && state.step === 'preview' ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        renderStepContent()
      )}
    </Modal>
  )
} 