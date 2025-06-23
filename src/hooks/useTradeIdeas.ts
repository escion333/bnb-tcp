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

      // TEMPORARILY DISABLED - Database schema mismatch
      if (walletAddress) {
        console.log('💾 Database saving temporarily disabled due to schema mismatch')
        // Create a mock saved trade for testing
        const mockSavedTrade: any = {
          id: 'mock-' + Date.now(),
          ...idea,
          userId: walletAddress,
          walletAddress: walletAddress,
          status: 'generated',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setCurrentSavedTrade(mockSavedTrade)
        console.log('✅ Mock trade created for testing:', mockSavedTrade.id)
      } else {
        console.log('⚠️ No wallet address - cannot save to database')
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
      throw new Error('Trade not saved to database')
    }

    try {
      // TEMPORARILY DISABLED - Mock database updates for testing
      console.log(`🎭 Mock ${action} action on trade:`, savedTrade.id)
      
      const updatedTrade = {
        ...savedTrade,
        status: action === 'ignore' ? 'ignored' as const : action === 'monitor' ? 'monitoring' as const : 'executed' as const,
        updatedAt: new Date().toISOString()
      }

      setCurrentSavedTrade(updatedTrade)
      
      if (action === 'ignore') {
        setCurrentIdea(null) // Clear the idea
        setCurrentSavedTrade(null)
      }

      console.log(`✅ Mock trade ${action} action completed:`, updatedTrade.id)
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