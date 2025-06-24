import { useState } from 'react'
import { TrendingUp, TrendingDown, Brain, Clock, Target, Shield, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, LoadingSpinner, useToast } from './ui'
import { TradeExecutionModal } from './TradeExecutionModal'
import type { TradeIdea } from '../lib/openai'

interface TradeIdeaCardProps {
  tradeIdea: TradeIdea | null
  isLoading: boolean
  onGenerate: () => void
  onAction: (action: 'ignore' | 'monitor' | 'execute', tradeIdea: TradeIdea) => void
}

export function TradeIdeaCard({ tradeIdea, isLoading, onGenerate, onAction }: TradeIdeaCardProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showExecutionModal, setShowExecutionModal] = useState(false)
  const { addToast } = useToast()

  const handleAction = async (action: 'ignore' | 'monitor' | 'execute') => {
    console.log('🔍 Button clicked:', action, 'Trade ID:', tradeIdea?.symbol)
    
    if (!tradeIdea) {
      console.log('❌ No trade idea available')
      return
    }
    
    // For execute action, show the modal instead of calling onAction directly
    if (action === 'execute') {
      setShowExecutionModal(true)
      return
    }
    
    setActionLoading(action)
    
    try {
      console.log('🔄 Calling onAction...')
      await onAction(action, tradeIdea)
      console.log('✅ onAction completed successfully')
      
      const messages = {
        ignore: 'Trade idea dismissed',
        monitor: 'Added to watchlist for paper trading'
      }
      
      console.log('🔔 Adding toast:', messages[action])
      addToast({
        type: 'info',
        message: messages[action]
      })
    } catch (error) {
      console.error('❌ Error in handleAction:', error)
      addToast({
        type: 'error',
        message: `Failed to ${action} trade`
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleTradeExecuted = async (txHash: string) => {
    if (!tradeIdea) return
    
    try {
      // Call the original onAction callback for logging/database updates
      await onAction('execute', tradeIdea)
      
      addToast({
        type: 'success',
        message: 'Trade executed successfully on PancakeSwap!'
      })
    } catch (error) {
      console.error('Error updating trade status:', error)
      // Still show success since the actual trade succeeded
      addToast({
        type: 'warning',
        message: 'Trade executed but status update failed'
      })
    }
  }

  const formatPrice = (price: number) => `$${price.toFixed(2)}`
  const formatPercent = (current: number, target: number) => {
    const change = ((target - current) / current) * 100
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 8) return 'text-green-400'
    if (confidence >= 6) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 8) return 'bg-green-600'
    if (confidence >= 6) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🤖 AI Trade Copilot</CardTitle>
        <CardDescription>AI-powered trade recommendations</CardDescription>
      </CardHeader>
      <CardContent>
      {!tradeIdea && !isLoading && (
        <div className="text-center py-8">
          <Brain className="mx-auto mb-4 text-purple-400" size={48} />
          <p className="text-gray-400 mb-6">
            Get AI-powered trade recommendations based on current market conditions
          </p>
          <Button onClick={onGenerate} variant="default" size="lg">
            <Brain className="mr-2" size={20} />
            Generate Trade Idea
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-400">AI analyzing market conditions...</p>
        </div>
      )}

      {tradeIdea && !isLoading && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="text-blue-400" size={20} />
                {tradeIdea.symbol}
              </h3>
              <p className="text-sm text-gray-400">
                Current: {formatPrice(tradeIdea.currentPrice)}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getConfidenceBg(tradeIdea.confidence)}`}>
                <Brain size={12} />
                {tradeIdea.confidence}/10 Confidence
              </div>
              <p className="text-xs text-gray-400 mt-1">
                <Clock size={12} className="inline mr-1" />
                {tradeIdea.timeframe}
              </p>
            </div>
          </div>

          {/* Trade Levels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="text-blue-400" size={16} />
                <span className="text-sm font-medium text-blue-400">Entry</span>
              </div>
              <p className="text-white font-semibold">{formatPrice(tradeIdea.entryPrice)}</p>
              <p className="text-xs text-gray-400">
                {formatPercent(tradeIdea.currentPrice, tradeIdea.entryPrice)}
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-green-400" size={16} />
                <span className="text-sm font-medium text-green-400">Take Profit</span>
              </div>
              <p className="text-white font-semibold">{formatPrice(tradeIdea.takeProfitPrice)}</p>
              <p className="text-xs text-green-400">
                {formatPercent(tradeIdea.entryPrice, tradeIdea.takeProfitPrice)}
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="text-red-400" size={16} />
                <span className="text-sm font-medium text-red-400">Stop Loss</span>
              </div>
              <p className="text-white font-semibold">{formatPrice(tradeIdea.stopLossPrice)}</p>
              <p className="text-xs text-red-400">
                {formatPercent(tradeIdea.entryPrice, tradeIdea.stopLossPrice)}
              </p>
            </div>
          </div>

          {/* Risk/Reward */}
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">Risk/Reward Ratio</span>
              <span className="text-white font-semibold">{tradeIdea.riskReward}:1</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${Math.min(tradeIdea.riskReward * 20, 100)}%` }}
              />
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
              <Brain size={16} />
              AI Analysis
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              {tradeIdea.reasoning}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => handleAction('ignore')}
              variant="secondary"
              size="sm"
              disabled={!!actionLoading}
              className="flex-1"
            >
              {actionLoading === 'ignore' ? <LoadingSpinner size="sm" /> : 'Ignore'}
            </Button>
            <Button
              onClick={() => handleAction('monitor')}
              variant="outline"
              size="sm"
              disabled={!!actionLoading}
              className="flex-1"
            >
              {actionLoading === 'monitor' ? <LoadingSpinner size="sm" /> : 'Monitor'}
            </Button>
            <Button
              onClick={() => handleAction('execute')}
              variant="default"
              size="sm"
              disabled={!!actionLoading}
              className="flex-1"
              data-execute-btn
            >
              {actionLoading === 'execute' ? <LoadingSpinner size="sm" /> : 'Execute Trade'}
            </Button>
          </div>

          {/* Generate New Idea */}
          <div className="text-center pt-4 border-t border-gray-700">
            <Button
              onClick={onGenerate}
              variant="default"
              size="sm"
              disabled={isLoading}
            >
              <Brain className="mr-2" size={16} />
              Generate New Idea
            </Button>
          </div>
        </div>
      )}
      
      <TradeExecutionModal
        isOpen={showExecutionModal}
        onClose={() => setShowExecutionModal(false)}
        tradeIdea={tradeIdea}
        onTradeExecuted={handleTradeExecuted}
      />
      </CardContent>
    </Card>
  )
} 