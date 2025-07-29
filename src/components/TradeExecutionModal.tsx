import { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Button, LoadingSpinner } from './ui'
import { Input } from './ui/input'
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
import { AlertCircle, ArrowRight, CheckCircle, ExternalLink, Bot, TrendingUp, TrendingDown } from 'lucide-react'

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
  status: 'active' | 'monitoring' | 'closed' // 'active' = live trade, 'monitoring' = paper/watch-only, 'closed' = completed
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

  // Editable TP/SL state
  const [editableTakeProfit, setEditableTakeProfit] = useState<string>('')
  const [editableStopLoss, setEditableStopLoss] = useState<string>('')
  const [tradeAmount, setTradeAmount] = useState<string>('0') // Default 0 USDT
  const [walletBalance, setWalletBalance] = useState<string>('0')

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
      // Initialize editable values with trade idea values
      setEditableTakeProfit(tradeIdea.takeProfitPrice?.toString() || '')
      setEditableStopLoss(tradeIdea.stopLossPrice?.toString() || '')
      setTradeAmount('0') // Reset trade amount to 0 when modal opens
      loadQuoteAndApproval()
    }
  }, [isOpen, tradeIdea])

  // Update quote when trade amount changes (with debouncing)
  useEffect(() => {
    if (isOpen && tradeIdea && address && tradeAmount) {
      const timeoutId = setTimeout(() => {
        loadQuoteAndApproval()
      }, 500)
      
      return () => clearTimeout(timeoutId)
    }
  }, [tradeAmount, isOpen, tradeIdea, address])

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
      
      // Store balance for display and validation
      setWalletBalance(usdtBalance)
      
      // For USDT trades, we need BNB for gas fees
      const bnbBalance = await getTokenBalance(TOKENS.NATIVE_BNB, address)
      const bnbBalanceNumber = parseFloat(bnbBalance)
      
      // Use the amount specified by user (don't limit by balance for quote calculation)
      const desiredAmount = parseFloat(tradeAmount) || 0
      const amountIn = desiredAmount.toString()
      
      // Skip quote loading if amount is 0
      if (desiredAmount === 0) {
        setState(prev => ({
          ...prev,
          quote: null,
          needsApproval: false,
          isLoading: false
        }))
        return
      }
      
      console.log('📊 Trade calculation:', {
        usdtBalance: balanceNumber,
        bnbBalance: bnbBalanceNumber,
        desiredAmount,
        amountIn
      })

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
      // Use the exact amount the user wants to trade
      const desiredAmount = parseFloat(tradeAmount) || 1.0
      const amountIn = desiredAmount.toString()

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
      // Use the exact amount the user specified
      const desiredAmount = parseFloat(tradeAmount) || 1.0
      const amountIn = desiredAmount.toString()
      
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
        takeProfitPrice: parseFloat(editableTakeProfit) || tradeIdea.takeProfitPrice,
        stopLossPrice: parseFloat(editableStopLoss) || tradeIdea.stopLossPrice,
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
      status: 'active', // Live trades with real transaction hashes are always 'active'
      entryPrice: tradeIdea.entryPrice,
      currentPrice: tradeIdea.entryPrice,
      takeProfitPrice: parseFloat(editableTakeProfit) || tradeIdea.takeProfitPrice,
      stopLossPrice: parseFloat(editableStopLoss) || tradeIdea.stopLossPrice,
      confidence: tradeIdea.confidence,
      reasoning: tradeIdea.reasoning,
      createdAt: new Date().toISOString(),
      amountIn: tradeAmount, // Amount of USDT spent
      amountOut: state.quote.amountOut, // Amount of WBNB received
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

  // Handle trade amount changes and update quote
  const handleTradeAmountChange = (value: string) => {
    setTradeAmount(value)
    
    // Clear current quote to show loading state immediately
    if (state.quote && parseFloat(value) > 0) {
      setState(prev => ({ ...prev, quote: null }))
    }
  }

  // Validation helpers
  const isValidTakeProfit = () => {
    const tp = parseFloat(editableTakeProfit)
    const entry = tradeIdea?.entryPrice || 0
    return tp > entry
  }

  const isValidStopLoss = () => {
    const sl = parseFloat(editableStopLoss)
    const entry = tradeIdea?.entryPrice || 0
    return sl < entry && sl > 0
  }

  // Balance validation for execution
  const hasEnoughBalance = () => {
    const balance = parseFloat(walletBalance)
    const amount = parseFloat(tradeAmount) || 0
    return balance >= amount && amount > 0 // Must be greater than 0
  }

  const getBalanceError = () => {
    const balance = parseFloat(walletBalance)
    const amount = parseFloat(tradeAmount) || 0
    
    if (balance < amount) return `Insufficient balance. You have ${balance.toFixed(2)} USDT`
    return null
  }



  if (!tradeIdea) return null

  const renderStepContent = () => {
    // Calculate values for display
    const expectedWbnbAmount = state.quote ? parseFloat(state.quote.amountOut) : 0
    const tradeValueUsd = expectedWbnbAmount * (tradeIdea?.entryPrice || 0)
    const takeProfitValue = parseFloat(editableTakeProfit) || tradeIdea?.takeProfitPrice || 0
    const stopLossValue = parseFloat(editableStopLoss) || tradeIdea?.stopLossPrice || 0
    const profitPotential = (takeProfitValue - (tradeIdea?.entryPrice || 0)) * expectedWbnbAmount
    const lossRisk = ((tradeIdea?.entryPrice || 0) - stopLossValue) * expectedWbnbAmount

    switch (state.step) {
      case 'preview':
        return (
          <div className="space-y-4">
                        {/* Trade Interface */}
            <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-600/30">              
              {/* Main Trade Row */}
              <div className="flex items-center justify-between mb-2">
                {/* USDT Input Side */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tradeAmount}
                    onChange={(e) => {
                      let value = e.target.value
                      // Only allow numbers and one decimal point
                      if (!/^\d*\.?\d*$/.test(value)) {
                        return
                      }
                      // Limit to 4 decimal places
                      if (value.includes('.')) {
                        const parts = value.split('.')
                        if (parts[1] && parts[1].length > 4) {
                          value = parts[0] + '.' + parts[1].substring(0, 4)
                        }
                      }
                      handleTradeAmountChange(value)
                    }}
                    className={`bg-transparent border-0 !text-xl !font-bold text-white placeholder:text-slate-500 p-0 h-auto focus-visible:ring-0 min-w-0 ${
                      (!hasEnoughBalance() && parseFloat(tradeAmount) > 0) ? 'text-red-400' : ''
                    }`}
                    placeholder="0"
                    style={{ width: `${Math.max(6, (tradeAmount.length || 1) + 2)}ch` }}
                  />
                  <span className="text-lg font-medium text-slate-400">USDT</span>
                </div>
                
                {/* Arrow */}
                <ArrowRight className="h-5 w-5 text-slate-500" />
                
                {/* WBNB Output Side */}
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-white">
                    {state.quote ? expectedWbnbAmount.toFixed(4) : '0.00'}
                  </span>
                  <span className="text-lg font-medium text-slate-400">WBNB</span>
                </div>
              </div>

              {/* USD Values Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-slate-500 text-base">
                  ${parseFloat(tradeAmount || '0').toFixed(2)}
                </div>
                <div className="text-slate-500 text-base">
                  {state.quote ? `$${tradeValueUsd.toFixed(2)}` : '$0.00'}
                </div>
              </div>

              {/* Balance and Max Button */}
              <div className="flex items-center space-x-2">
                <span className="text-blue-400 text-sm">Balance: {parseFloat(walletBalance).toFixed(2)}</span>
                <button
                  onClick={() => {
                    let maxAmount = walletBalance
                    // Limit to 4 decimal places when using Max
                    if (maxAmount.includes('.')) {
                      const parts = maxAmount.split('.')
                      if (parts[1] && parts[1].length > 4) {
                        maxAmount = parts[0] + '.' + parts[1].substring(0, 4)
                      }
                    }
                    setTradeAmount(maxAmount)
                  }}
                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
                >
                  Max
                </button>
              </div>

              {/* Balance validation message */}
              {getBalanceError() && (
                <div className="mt-3 text-sm text-red-400">
                  {getBalanceError()}
                </div>
              )}
            </div>

            {/* Compact Trade Parameters */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-600/30">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Entry Price</div>
                  <div className="text-lg font-bold text-white">${tradeIdea?.entryPrice?.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">AI Confidence</div>
                  <div className={`text-lg font-bold ${
                    (tradeIdea?.confidence ?? 0) >= 8 ? 'text-emerald-400' :
                    (tradeIdea?.confidence ?? 0) >= 6 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {tradeIdea?.confidence}/10
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Take Profit */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-emerald-400 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Take Profit
                    </label>
                    {state.quote && profitPotential > 0 && (
                      <span className="text-xs font-semibold text-emerald-400">
                        +${profitPotential.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <Input
                    type="number"
                    value={editableTakeProfit}
                    onChange={(e) => setEditableTakeProfit(e.target.value)}
                    className={`h-9 text-sm bg-slate-700/60 border-slate-600/50 rounded-lg ${
                      isValidTakeProfit() 
                        ? 'focus-visible:ring-emerald-500/50' 
                        : 'focus-visible:ring-red-500/50'
                    }`}
                    placeholder="TP Price"
                  />
                </div>

                {/* Stop Loss */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-red-400 flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Stop Loss
                    </label>
                    {state.quote && lossRisk > 0 && (
                      <span className="text-xs font-semibold text-red-400">
                        -${lossRisk.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <Input
                    type="number"
                    value={editableStopLoss}
                    onChange={(e) => setEditableStopLoss(e.target.value)}
                    className={`h-9 text-sm bg-slate-700/60 border-slate-600/50 rounded-lg ${
                      isValidStopLoss() 
                        ? 'focus-visible:ring-amber-500/50' 
                        : 'focus-visible:ring-red-500/50'
                    }`}
                    placeholder="SL Price"
                  />
                </div>
              </div>
            </div>

            {/* Compact AI Analysis */}
            <div className="bg-purple-900/20 rounded-xl p-3 border border-purple-500/30">
              <div className="flex items-center mb-2">
                <Bot className="h-4 w-4 text-purple-400 mr-2" />
                <span className="text-sm font-semibold text-purple-400">AI Analysis</span>
              </div>
              <div className="max-h-20 overflow-y-auto">
                <p className="text-sm text-slate-300 leading-relaxed pr-2">{tradeIdea?.reasoning}</p>
              </div>
            </div>

            {/* Error Display */}
            {state.error && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-3">
                <div className="flex items-center text-red-400 mb-2">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm font-semibold">Error</span>
                </div>
                <p className="text-sm text-red-300 mb-3">{state.error}</p>
                <Button 
                  onClick={loadQuoteAndApproval} 
                  variant="outline" 
                  size="sm" 
                  className="border-red-500/50 text-red-400 hover:bg-red-900/30 rounded-lg text-sm font-medium"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Compact Action Buttons */}
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleClose} 
                className="flex-1 h-10 rounded-lg border-slate-600/50 text-slate-300 hover:bg-slate-800/50 text-sm font-semibold"
              >
                Cancel
              </Button>
              {state.needsApproval ? (
                <Button 
                  onClick={handleApproval}
                  disabled={state.isLoading || !hasEnoughBalance()}
                  className="flex-1 h-10 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 text-black text-sm font-semibold"
                  title={!hasEnoughBalance() ? (getBalanceError() || 'Insufficient balance') : undefined}
                >
                  {state.isLoading ? <LoadingSpinner size="sm" /> : 'Approve USDT'}
                </Button>
              ) : (
                <Button 
                  onClick={handleExecuteSwap}
                  disabled={state.isLoading || !state.quote || !isValidTakeProfit() || !isValidStopLoss() || !hasEnoughBalance()}
                  className="flex-1 h-10 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-black text-sm font-semibold"
                  title={
                    !state.quote ? 'Loading trade quote...' : 
                    !isValidTakeProfit() ? 'Take profit must be above entry price' :
                    !isValidStopLoss() ? 'Stop loss must be below entry price' : 
                    !hasEnoughBalance() ? (getBalanceError() || 'Insufficient balance') :
                    undefined
                  }
                >
                  {state.isLoading ? <LoadingSpinner size="sm" /> : !state.quote ? 'Loading...' : 'Execute Trade'}
                </Button>
              )}
            </div>
          </div>
        )

      case 'approval':
        return (
          <div className="text-center space-y-4 py-6">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Approving Token</h3>
              <p className="text-sm text-slate-400">Please confirm the approval in your wallet</p>
            </div>
          </div>
        )

      case 'swap':
        return (
          <div className="text-center space-y-4 py-6">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Executing Trade</h3>
              <p className="text-sm text-slate-400">Please confirm the transaction in your wallet</p>
            </div>
          </div>
        )

      case 'automation':
        return (
          <div className="text-center space-y-4 py-6">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Setting Up Automation</h3>
              <p className="text-sm text-slate-400 mb-3">Registering Take Profit & Stop Loss...</p>
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-600/30">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Take Profit:</span>
                    <span className="text-emerald-400 font-semibold">${(parseFloat(editableTakeProfit) || tradeIdea?.takeProfitPrice)?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Stop Loss:</span>
                    <span className="text-red-400 font-semibold">${(parseFloat(editableStopLoss) || tradeIdea?.stopLossPrice)?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="text-center space-y-4 py-6">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Trade Executed!</h3>
              <p className="text-sm text-slate-400 mb-3">Your trade has been successfully executed</p>
              
              {/* Automation Status */}
              {state.automationTaskIds ? (
                <div className="bg-purple-900/20 border border-purple-500/50 rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-center mb-2">
                    <Bot className="h-4 w-4 text-purple-400 mr-2" />
                    <span className="text-sm font-semibold text-purple-400">Automation Active</span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Take Profit:</span>
                      <span className="text-emerald-400">Task {state.automationTaskIds?.takeProfitTaskId.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stop Loss:</span>
                      <span className="text-red-400">Task {state.automationTaskIds?.stopLossTaskId.slice(0, 8)}...</span>
                    </div>
                  </div>
                </div>
              ) : state.error?.includes('automation') ? (
                <div className="bg-orange-900/20 border border-orange-500/50 rounded-xl p-3 mb-3">
                  <div className="text-sm text-orange-300 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Automation setup failed
                  </div>
                </div>
              ) : null}

              {state.txHash && (
                <a
                  href={`https://bscscan.com/tx/${state.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors mb-3"
                >
                  View on BscScan
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
            </div>
            <Button 
              onClick={handleClose} 
              className="w-full h-10 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-semibold"
            >
              Close
            </Button>
          </div>
        )

      case 'error':
        return (
          <div className="text-center space-y-4 py-6">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Trade Failed</h3>
              <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-3 mb-3">
                <p className="text-sm text-red-300">{state.error}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleClose} 
                className="flex-1 h-10 rounded-lg border-slate-600/50 text-slate-300 hover:bg-slate-800/50 text-sm font-semibold"
              >
                Close
              </Button>
              <Button 
                onClick={loadQuoteAndApproval} 
                className="flex-1 h-10 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-semibold"
              >
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
      className="max-w-lg"
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