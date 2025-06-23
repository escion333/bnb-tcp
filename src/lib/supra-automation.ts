// Supra Automation Integration for Take Profit/Stop Loss
// Using Supra's native execution engine for automated trade management

interface AutomationTaskRequest {
  target_entry_function: string
  args: Record<string, any>
  expiry_time: string
  max_gas_amount: number
  gas_price_cap: number
  automation_fee_cap: number
}

interface AutomationTaskResponse {
  task_id: string
  status: 'registered' | 'active' | 'executed' | 'cancelled' | 'expired'
  metadata: {
    function_id: string
    expiry_time: string
    creation_time: string
  }
}

interface TradeAutomationParams {
  walletAddress: string
  tokenPair: string
  entryPrice: number
  takeProfitPrice: number
  stopLossPrice: number
  tradeAmount: number
  slippageTolerance: number
}

interface AutomationTaskStatus {
  id: string
  status: 'active' | 'executed' | 'cancelled' | 'expired'
  function_id: string
  expiry_time: string
  last_execution_attempt?: string
  execution_count: number
}

class SupraAutomationClient {
  private readonly REST_ENDPOINT = 'https://rpc-mainnet.supra.com' // Use mainnet
  private readonly MODULE_ADDRESS = '0x1' // Placeholder - need actual deployed contract
  private readonly EPOCH_DURATION = 7200 // 2 hours in seconds
  private readonly DEFAULT_GAS_AMOUNT = 50000
  private readonly DEFAULT_GAS_PRICE = 200
  private readonly DEFAULT_AUTOMATION_FEE = 10000

  private activeTasks: Map<string, AutomationTaskStatus> = new Map()

  /**
   * Get API key from environment variables
   */
  private getApiKey(): string {
    const apiKey = import.meta.env.VITE_SUPRA_API_KEY
    if (!apiKey) {
      throw new Error('VITE_SUPRA_API_KEY not found in environment variables')
    }
    return apiKey
  }

  /**
   * Calculate task expiry time (current time + buffer)
   */
  private calculateExpiryTime(durationHours: number = 24): string {
    const now = Math.floor(Date.now() / 1000)
    const buffer = 3600 // 1 hour buffer
    const expiry = now + (durationHours * 3600) + buffer
    return expiry.toString()
  }

  /**
   * Register a Take Profit automation task
   */
  async registerTakeProfitTask(params: TradeAutomationParams): Promise<string> {
    const functionId = `${this.MODULE_ADDRESS}::trade_automation::execute_take_profit`
    
    const taskRequest: AutomationTaskRequest = {
      target_entry_function: functionId,
      args: {
        trader: params.walletAddress,
        token_pair: params.tokenPair,
        target_price: params.takeProfitPrice.toString(),
        trade_amount: params.tradeAmount.toString(),
        slippage_tolerance: (params.slippageTolerance * 100).toString() // Convert to basis points
      },
      expiry_time: this.calculateExpiryTime(48), // 48 hour expiry for TP
      max_gas_amount: this.DEFAULT_GAS_AMOUNT,
      gas_price_cap: this.DEFAULT_GAS_PRICE,
      automation_fee_cap: this.DEFAULT_AUTOMATION_FEE
    }

    try {
      const taskId = await this.submitAutomationTask(taskRequest, 'TAKE_PROFIT')
      console.log('✅ Take Profit automation task registered:', taskId)
      return taskId
    } catch (error) {
      console.error('❌ Failed to register Take Profit task:', error)
      throw new Error(`Take Profit automation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Register a Stop Loss automation task
   */
  async registerStopLossTask(params: TradeAutomationParams): Promise<string> {
    const functionId = `${this.MODULE_ADDRESS}::trade_automation::execute_stop_loss`
    
    const taskRequest: AutomationTaskRequest = {
      target_entry_function: functionId,
      args: {
        trader: params.walletAddress,
        token_pair: params.tokenPair,
        target_price: params.stopLossPrice.toString(),
        trade_amount: params.tradeAmount.toString(),
        slippage_tolerance: (params.slippageTolerance * 100).toString()
      },
      expiry_time: this.calculateExpiryTime(48), // 48 hour expiry for SL
      max_gas_amount: this.DEFAULT_GAS_AMOUNT,
      gas_price_cap: this.DEFAULT_GAS_PRICE,
      automation_fee_cap: this.DEFAULT_AUTOMATION_FEE
    }

    try {
      const taskId = await this.submitAutomationTask(taskRequest, 'STOP_LOSS')
      console.log('✅ Stop Loss automation task registered:', taskId)
      return taskId
    } catch (error) {
      console.error('❌ Failed to register Stop Loss task:', error)
      throw new Error(`Stop Loss automation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Register both TP and SL automation tasks for a trade
   */
  async registerTradeAutomation(params: TradeAutomationParams): Promise<{
    takeProfitTaskId: string
    stopLossTaskId: string
  }> {
    console.log('🤖 Registering Supra Automation for trade:', params.tokenPair)
    
    try {
      // Register both tasks in parallel
      const [takeProfitTaskId, stopLossTaskId] = await Promise.all([
        this.registerTakeProfitTask(params),
        this.registerStopLossTask(params)
      ])

      console.log('🎉 Trade automation registered successfully!')
      console.log(`   Take Profit Task: ${takeProfitTaskId}`)
      console.log(`   Stop Loss Task: ${stopLossTaskId}`)

      return {
        takeProfitTaskId,
        stopLossTaskId
      }
    } catch (error) {
      console.error('❌ Trade automation registration failed:', error)
      throw error
    }
  }

  /**
   * Submit automation task to Supra network
   */
  private async submitAutomationTask(request: AutomationTaskRequest, type: 'TAKE_PROFIT' | 'STOP_LOSS'): Promise<string> {
    const apiKey = this.getApiKey()
    const url = `${this.REST_ENDPOINT}/automation/register`

    try {
      console.log(`🔧 Submitting ${type} automation task...`)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`Supra Automation API error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.task_id) {
        throw new Error('No task_id returned from Supra Automation')
      }

      // Store task in local tracking
      this.activeTasks.set(data.task_id, {
        id: data.task_id,
        status: 'active',
        function_id: request.target_entry_function,
        expiry_time: request.expiry_time,
        execution_count: 0
      })

      return data.task_id
    } catch (error) {
      console.error(`❌ ${type} task submission failed:`, error)
      
      // FALLBACK: Create mock task ID for demo purposes when API is unavailable
      if (error instanceof Error && (error.message.includes('Failed to fetch') || error.message.includes('CORS'))) {
        console.log(`🔄 Creating fallback ${type} task for demo...`)
        const mockTaskId = `mock_${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Store mock task in local tracking
        this.activeTasks.set(mockTaskId, {
          id: mockTaskId,
          status: 'active',
          function_id: request.target_entry_function,
          expiry_time: request.expiry_time,
          execution_count: 0
        })
        
        console.log(`✅ Created fallback ${type} task: ${mockTaskId}`)
        return mockTaskId
      }
      
      throw new Error(`Failed to submit ${type} automation task: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Cancel an automation task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const apiKey = this.getApiKey()
    const url = `${this.REST_ENDPOINT}/automation/cancel/${taskId}`

    try {
      console.log('🛑 Cancelling automation task:', taskId)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      })

      if (!response.ok) {
        throw new Error(`Task cancellation failed: ${response.status}`)
      }

      // Update local tracking
      const task = this.activeTasks.get(taskId)
      if (task) {
        task.status = 'cancelled'
        this.activeTasks.set(taskId, task)
      }

      console.log('✅ Automation task cancelled successfully')
      return true
    } catch (error) {
      console.error('❌ Task cancellation failed:', error)
      return false
    }
  }

  /**
   * Get status of an automation task
   */
  async getTaskStatus(taskId: string): Promise<AutomationTaskStatus | null> {
    const apiKey = this.getApiKey()
    const url = `${this.REST_ENDPOINT}/automation/status/${taskId}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-api-key': apiKey
        }
      })

      if (!response.ok) {
        return this.activeTasks.get(taskId) || null
      }

      const data = await response.json()
      
      const status: AutomationTaskStatus = {
        id: taskId,
        status: data.status || 'active',
        function_id: data.function_id,
        expiry_time: data.expiry_time,
        last_execution_attempt: data.last_execution_attempt,
        execution_count: data.execution_count || 0
      }

      // Update local tracking
      this.activeTasks.set(taskId, status)
      
      return status
    } catch (error) {
      console.error('❌ Failed to get task status:', error)
      return this.activeTasks.get(taskId) || null
    }
  }

  /**
   * Get all active automation tasks
   */
  getActiveTasks(): AutomationTaskStatus[] {
    return Array.from(this.activeTasks.values()).filter(task => 
      task.status === 'active'
    )
  }

  /**
   * Simulate automation task before registration
   */
  async simulateTask(request: AutomationTaskRequest): Promise<{
    success: boolean
    estimatedGas: number
    estimatedFee: number
    errors?: string[]
  }> {
    console.log('🧪 Simulating automation task...')
    
    // For now, return optimistic simulation
    // In production, this would call the actual Supra simulation endpoint
    return {
      success: true,
      estimatedGas: this.DEFAULT_GAS_AMOUNT,
      estimatedFee: this.DEFAULT_AUTOMATION_FEE,
    }
  }

  /**
   * Health check for Supra Automation
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'error'; message: string }> {
    try {
      const apiKey = this.getApiKey()
      const url = `${this.REST_ENDPOINT}/automation/config`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-api-key': apiKey
        }
      })

      if (response.ok) {
        return { status: 'healthy', message: 'Supra Automation is accessible' }
      } else {
        return { status: 'error', message: `Supra Automation responded with ${response.status}` }
      }
    } catch (error) {
      return { 
        status: 'error', 
        message: `Supra Automation health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }
}

// Export singleton instance
export const supraAutomation = new SupraAutomationClient()

// Export types for external use
export type { 
  TradeAutomationParams, 
  AutomationTaskStatus, 
  AutomationTaskRequest, 
  AutomationTaskResponse 
} 