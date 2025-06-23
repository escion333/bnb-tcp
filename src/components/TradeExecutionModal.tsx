import { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { LoadingSpinner } from './ui/LoadingSpinner'
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
  type SwapQuote 
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
  const tokenIn = TOKENS.USDT // Assume we're buying WBNB with USDT
  const tokenOut = TOKENS.WBNB // Use WBNB to access main liquidity pool

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
    if (!tradeIdea || !address) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const amountIn = '100' // Default $100 USDT trade size

      const swapParams: SwapParams = {
        tokenIn,
        tokenOut,
        amountIn,
        slippageTolerance: 0.5, // 0.5% slippage
        recipient: address,
        useNativeBNB: false // Use WBNB to access main liquidity pool
      }

      // Get quote
      const quote = await getSwapQuote(swapParams)

      // Check if approval is needed
      const approval = await checkTokenApproval(tokenIn, address, amountIn)

      setState(prev => ({
        ...prev,
        quote,
        needsApproval: approval.needsApproval,
        isLoading: false
      }))
    } catch (error) {
      console.error('Error loading quote:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to load trade quote',
        isLoading: false
      }))
    }
  }

  const handleApproval = async () => {
    if (!tradeIdea || !address) return

    setState(prev => ({ ...prev, step: 'approval', isLoading: true, error: null }))

    try {
      const amountIn = '100'

      const txHash = await approveToken(tokenIn, amountIn)
      
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
      const swapParams: SwapParams = {
        tokenIn,
        tokenOut,
        amountIn: '100',
        slippageTolerance: 0.5,
        recipient: address,
        useNativeBNB: false
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

  const registerTradeAutomation = async (txHash: string) => {
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
        slippageTolerance: 0.5 // 0.5% slippage tolerance
      }

      const automationTaskIds = await supraAutomation.registerTradeAutomation(automationParams)

      console.log('🎉 Supra Automation registered successfully!')
      console.log(`   Take Profit Task: ${automationTaskIds.takeProfitTaskId}`)
      console.log(`   Stop Loss Task: ${automationTaskIds.stopLossTaskId}`)

      setState(prev => ({
        ...prev,
        step: 'success',
        isLoading: false,
        automationTaskIds
      }))

    } catch (error) {
      console.error('❌ Failed to register automation:', error)
      
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

            {/* Swap Details */}
            {state.quote && (
              <div className="bg-gray-900 rounded-lg p-4 border border-blue-600">
                <h3 className="font-semibold text-white mb-3">Swap Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">You Pay:</span>
                    <span className="font-medium text-white">100 USDT</span>
                  </div>
                  <div className="flex justify-center py-2">
                    <ArrowRight className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">You Receive:</span>
                    <span className="font-medium text-white">{parseFloat(state.quote.amountOut).toFixed(4)} {getTokenDisplayName(tokenOut)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Minimum Received:</span>
                    <span className="text-gray-300">{parseFloat(state.quote.amountOutMin).toFixed(4)} {getTokenDisplayName(tokenOut)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Slippage Tolerance:</span>
                    <span className="text-gray-300">0.5%</span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Reasoning */}
            <div className="bg-gray-900 rounded-lg p-4 border border-purple-600">
              <h3 className="font-semibold text-white mb-2">AI Analysis</h3>
              <p className="text-sm text-gray-300">{tradeIdea.reasoning}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              {state.needsApproval ? (
                <Button 
                  onClick={handleApproval}
                  disabled={state.isLoading}
                  variant="warning"
                  className="flex-1"
                >
                  {state.isLoading ? <LoadingSpinner size="sm" /> : 'Approve USDT'}
                </Button>
              ) : (
                <Button 
                  onClick={handleExecuteSwap}
                  disabled={state.isLoading || !state.quote}
                  variant="success"
                  className="flex-1"
                >
                  {state.isLoading ? <LoadingSpinner size="sm" /> : 'Execute Trade'}
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
            <Button onClick={handleClose} variant="primary" className="w-full">
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
              <Button onClick={loadQuoteAndApproval} variant="primary" className="flex-1">
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