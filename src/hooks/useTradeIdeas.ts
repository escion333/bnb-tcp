import { useState } from 'react'
import { generateTradeIdea, type TradeIdea } from '../lib/openai'
import { TradesService, type SavedTrade } from '../lib/trades'

export function useTradeIdeas(walletAddress?: string) {
  const [currentIdea, setCurrentIdea] = useState<TradeIdea | null>(null)
  const [currentSavedTrade, setCurrentSavedTrade] = useState<SavedTrade | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateNewIdea = async (symbol: string = 'WBNB/USDT', currentPrice: number = 635.50) => {
    setIsLoading(true)
    setError(null)
    setCurrentIdea(null)
    setCurrentSavedTrade(null)
    
    try {
      const idea = await generateTradeIdea(symbol, currentPrice)
      setCurrentIdea(idea)

      // Save to localStorage instead of database for now
      if (walletAddress) {
        console.log('💾 Saving trade to localStorage...')
        
        // Create saved trade object
        const savedTrade: any = {
          id: walletAddress + '-' + Date.now(),
          ...idea,
          userId: walletAddress,
          walletAddress: walletAddress,
          status: 'generated',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        // Get existing trades from localStorage
        const existingTrades = JSON.parse(localStorage.getItem('localTrades') || '[]')
        
        // Add new trade to the beginning
        const updatedTrades = [savedTrade, ...existingTrades]
        
        // Save back to localStorage
        localStorage.setItem('localTrades', JSON.stringify(updatedTrades))
        
        setCurrentSavedTrade(savedTrade)
        console.log('✅ Trade saved to localStorage:', savedTrade.id)
        console.log('📊 Total trades in localStorage:', updatedTrades.length)
      } else {
        console.log('⚠️ No wallet address - cannot save trade')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate trade idea')
      console.error('Error generating trade idea:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTradeAction = async (
    action: 'ignore' | 'monitor' | 'execute',
    tradeIdea: TradeIdea
  ) => {
    if (!walletAddress) {
      throw new Error('Wallet not connected')
    }

    const savedTrade = currentSavedTrade
    if (!savedTrade) {
      throw new Error('Trade not saved')
    }

    try {
      console.log(`🎯 Processing ${action} action on trade:`, savedTrade.id)
      
      // For execute action, don't save to localStorage here - let TradeExecutionModal handle it
      // This prevents duplicate trades in history
      if (action === 'execute') {
        console.log('🚀 Execute action - TradeExecutionModal will handle localStorage save')
        return // Don't save here for execute actions
      }
      
      // Update the trade status for non-execute actions
      const updatedTrade = {
        ...savedTrade,
        status: action === 'ignore' ? 'ignored' as const : 'monitoring' as const,
        updatedAt: new Date().toISOString()
      }

      // Update localStorage
      const existingTrades = JSON.parse(localStorage.getItem('localTrades') || '[]')
      const updatedTrades = existingTrades.map((trade: any) => 
        trade.id === savedTrade.id ? updatedTrade : trade
      )
      localStorage.setItem('localTrades', JSON.stringify(updatedTrades))

      setCurrentSavedTrade(updatedTrade)
      
      if (action === 'ignore') {
        setCurrentIdea(null) // Clear the idea from UI
        setCurrentSavedTrade(null)
      }

      console.log(`✅ Trade ${action} action completed and saved to localStorage:`, updatedTrade.id)
    } catch (err) {
      console.error(`❌ Failed to ${action} trade:`, err)
      throw err
    }
  }

  return {
    currentIdea,
    currentSavedTrade,
    isLoading,
    error,
    generateNewIdea,
    handleTradeAction,
    clearCurrentIdea: () => {
      setCurrentIdea(null)
      setCurrentSavedTrade(null)
    }
  }
} 