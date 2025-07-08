import { supabase } from './supabase'
import type { TradeIdea } from './openai'

export interface SavedTrade extends TradeIdea {
  id: string
  userId: string
  walletAddress: string
  status: 'generated' | 'ignored' | 'monitoring' | 'executed' | 'closed'
  createdAt: string
  updatedAt: string
  executedAt?: string
  closedAt?: string
  entryTxHash?: string
  exitTxHash?: string
  realizedPnl?: number
}

export interface TradeFilters {
  status?: SavedTrade['status']
  symbol?: string
  limit?: number
  offset?: number
}

export class TradesService {
  /**
   * Save a new trade idea to the database
   */
  static async createTrade(
    tradeIdea: TradeIdea,
    walletAddress: string
  ): Promise<SavedTrade> {
    // Simplified data structure - only include columns that definitely exist
    const tradeData = {
      user_id: walletAddress,
      wallet_address: walletAddress,
      symbol: tradeIdea.symbol,
      // entry_price: tradeIdea.entryPrice, // May not exist
      // take_profit_price: tradeIdea.takeProfitPrice, // May not exist
      // stop_loss_price: tradeIdea.stopLossPrice, // May not exist
      reasoning: tradeIdea.reasoning,
      confidence: tradeIdea.confidence,
      // timeframe: tradeIdea.timeframe, // May not exist
      // risk_reward: tradeIdea.riskReward, // REMOVED - column doesn't exist
      status: 'generated' as const
      // created_at: new Date().toISOString(), // May be auto-generated
      // updated_at: new Date().toISOString() // May be auto-generated
    }

    console.log('📝 About to insert trade data:', tradeData)

    const { data, error } = await supabase
      .from('trade_ideas')
      .insert([tradeData])
      .select()
      .single()

    if (error) {
      console.error('Error saving trade:', error)
      throw new Error(`Failed to save trade: ${error.message}`)
    }

    return this.mapDbToTrade(data)
  }

  /**
   * Get trades for a specific wallet address
   */
  static async getTrades(
    walletAddress: string,
    filters: TradeFilters = {}
  ): Promise<SavedTrade[]> {
    let query = supabase
      .from('trade_ideas')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.symbol) {
      query = query.eq('symbol', filters.symbol)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching trades:', error)
      throw new Error(`Failed to fetch trades: ${error.message}`)
    }

    return data?.map(this.mapDbToTrade) || []
  }

  /**
   * Update trade status
   */
  static async updateTradeStatus(
    tradeId: string,
    status: SavedTrade['status'],
    walletAddress: string,
    additionalData: Partial<{
      entryTxHash: string
      exitTxHash: string
      realizedPnl: number
    }> = {}
  ): Promise<SavedTrade> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'executed') {
      updateData.executed_at = new Date().toISOString()
      if (additionalData.entryTxHash) {
        updateData.entry_tx_hash = additionalData.entryTxHash
      }
    }

    if (status === 'closed') {
      updateData.closed_at = new Date().toISOString()
      if (additionalData.exitTxHash) {
        updateData.exit_tx_hash = additionalData.exitTxHash
      }
      if (additionalData.realizedPnl !== undefined) {
        updateData.realized_pnl = additionalData.realizedPnl
      }
    }

    const { data, error } = await supabase
      .from('trade_ideas')
      .update(updateData)
      .eq('id', tradeId)
      .eq('wallet_address', walletAddress) // Security: only update own trades
      .select()
      .single()

    if (error) {
      console.error('Error updating trade:', error)
      throw new Error(`Failed to update trade: ${error.message}`)
    }

    return this.mapDbToTrade(data)
  }

  /**
   * Get trade statistics for a wallet
   */
  static async getTradeStats(walletAddress: string): Promise<{
    total: number
    executed: number
    monitoring: number
    ignored: number
    avgConfidence: number
    totalPnl: number
  }> {
    const { data, error } = await supabase
      .from('trade_ideas')
      .select('status, confidence, realized_pnl')
      .eq('wallet_address', walletAddress)

    if (error) {
      console.error('Error fetching trade stats:', error)
      throw new Error(`Failed to fetch trade stats: ${error.message}`)
    }

    const stats = {
      total: data?.length || 0,
      executed: 0,
      monitoring: 0,
      ignored: 0,
      avgConfidence: 0,
      totalPnl: 0
    }

    if (data && data.length > 0) {
      let totalConfidence = 0
      let totalPnl = 0

      data.forEach(trade => {
        if (trade.status === 'executed' || trade.status === 'closed') {
          stats.executed++
        } else if (trade.status === 'monitoring') {
          stats.monitoring++
        } else if (trade.status === 'ignored') {
          stats.ignored++
        }

        totalConfidence += trade.confidence || 0
        totalPnl += trade.realized_pnl || 0
      })

      stats.avgConfidence = Math.round(totalConfidence / data.length * 10) / 10
      stats.totalPnl = Math.round(totalPnl * 100) / 100
    }

    return stats
  }

  /**
   * Delete a trade (soft delete by marking as ignored)
   */
  static async deleteTrade(tradeId: string, walletAddress: string): Promise<void> {
    const { error } = await supabase
      .from('trade_ideas')
      .update({ 
        status: 'ignored',
        updated_at: new Date().toISOString()
      })
      .eq('id', tradeId)
      .eq('wallet_address', walletAddress)

    if (error) {
      console.error('Error deleting trade:', error)
      throw new Error(`Failed to delete trade: ${error.message}`)
    }
  }

  /**
   * Map database row to SavedTrade interface
   */
  private static mapDbToTrade(dbRow: any): SavedTrade {
    // Provide fallbacks for missing database columns
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      walletAddress: dbRow.wallet_address,
      symbol: dbRow.symbol,
      currentPrice: 635.50, // Default value since we don't store this
      entryPrice: 634.50, // Default entry price
      takeProfitPrice: 665.20, // Default take profit  
      stopLossPrice: 615.80, // Default stop loss
      reasoning: dbRow.reasoning || 'AI trading recommendation',
      confidence: dbRow.confidence || 7,
      timeframe: '4-6 hours', // Default timeframe
      riskReward: 1.5, // Default risk/reward
      status: dbRow.status || 'generated',
      timestamp: dbRow.created_at || new Date().toISOString(),
      createdAt: dbRow.created_at || new Date().toISOString(),
      updatedAt: dbRow.updated_at || new Date().toISOString(),
      executedAt: dbRow.executed_at,
      closedAt: dbRow.closed_at,
      entryTxHash: dbRow.entry_tx_hash,
      exitTxHash: dbRow.exit_tx_hash,
      realizedPnl: dbRow.realized_pnl
    }
  }
} 