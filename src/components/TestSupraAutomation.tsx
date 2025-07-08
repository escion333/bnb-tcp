import { useState } from 'react'
import { supraAutomation, type TradeAutomationParams } from '../lib/supra-automation'
import { Button, LoadingSpinner, Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui'
import { Bot, CheckCircle, AlertCircle } from 'lucide-react'

interface TestResult {
  healthCheck?: { status: string; message: string }
  automation?: {
    takeProfitTaskId: string
    stopLossTaskId: string
  }
  error?: string
}

export function TestSupraAutomation() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<TestResult>({})

  const runFullTest = async () => {
    setIsLoading(true)
    setResults({})

    try {
      console.log('🧪 Starting Supra Automation browser test...')

      // Test 1: Health Check
      console.log('1. Testing health check...')
      const health = await supraAutomation.healthCheck()
      console.log(`Health: ${health.status} - ${health.message}`)

      setResults(prev => ({ ...prev, healthCheck: health }))

      // Test 2: Mock Automation Registration  
      console.log('2. Testing automation registration...')
      
      const mockParams: TradeAutomationParams = {
        walletAddress: '0x742d35Cc6634C0532925a3b8D3Ac65e26654E8e2', // Example address
        tokenPair: 'WBNB/USDT',
        entryPrice: 620.50,
        takeProfitPrice: 665.20,
        stopLossPrice: 590.80,
        tradeAmount: 0.1615,
        slippageTolerance: 0.5
      }

      try {
        const automation = await supraAutomation.registerTradeAutomation(mockParams)
        console.log('✅ Automation registered:', automation)
        setResults(prev => ({ ...prev, automation }))
      } catch (automationError) {
        console.log('⚠️ Automation registration failed (expected):', automationError)
        setResults(prev => ({ 
          ...prev, 
          error: `Automation test failed: ${automationError instanceof Error ? automationError.message : 'Unknown error'}`
        }))
      }

    } catch (error) {
      console.error('❌ Test failed:', error)
      setResults(prev => ({ 
        ...prev, 
        error: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const testSimulation = async () => {
    setIsLoading(true)
    setResults({})

    try {
      console.log('🎭 Testing automation simulation...')

      // Test simulation function
      const mockRequest = {
        target_entry_function: '0x1::trade_automation::execute_take_profit',
        args: {
          trader: '0x742d35Cc6634C0532925a3b8D3Ac65e26654E8e2',
          token_pair: 'WBNB/USDT',
          target_price: '665.20',
          trade_amount: '0.1615',
          slippage_tolerance: '50'
        },
        expiry_time: Math.floor(Date.now() / 1000 + 48 * 3600).toString(),
        max_gas_amount: 50000,
        gas_price_cap: 200,
        automation_fee_cap: 10000
      }

      const simulation = await supraAutomation.simulateTask(mockRequest)
      console.log('✅ Simulation result:', simulation)
      
      setResults({
        automation: {
          takeProfitTaskId: 'simulation-tp-task-' + Date.now(),
          stopLossTaskId: 'simulation-sl-task-' + Date.now()
        }
      })

    } catch (error) {
      console.error('❌ Simulation failed:', error)
      setResults({ 
        error: `Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🧪 Supra Automation Test Lab</CardTitle>
        <CardDescription>Test automation integration in browser context</CardDescription>
      </CardHeader>
      <CardContent>
      <div className="space-y-6">
        
        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={runFullTest}
            disabled={isLoading}
                          variant="default"
            className="flex items-center justify-center"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <Bot className="mr-2" size={16} />}
            Test Real API
          </Button>

          <Button
            onClick={testSimulation}
            disabled={isLoading}
            variant="secondary"
            className="flex items-center justify-center"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <Bot className="mr-2" size={16} />}
            Test Simulation
          </Button>
        </div>

        {/* Test Results */}
        {Object.keys(results).length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Test Results</h3>

            {/* Health Check */}
            {results.healthCheck && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  {results.healthCheck.status === 'healthy' ? (
                    <CheckCircle className="text-green-400" size={16} />
                  ) : (
                    <AlertCircle className="text-red-400" size={16} />
                  )}
                  <span className="font-medium text-white">Health Check</span>
                </div>
                <div className="text-sm text-gray-300">
                  <div>Status: <span className={results.healthCheck.status === 'healthy' ? 'text-green-400' : 'text-red-400'}>
                    {results.healthCheck.status}
                  </span></div>
                  <div>Message: {results.healthCheck.message}</div>
                </div>
              </div>
            )}

            {/* Automation Results */}
            {results.automation && (
              <div className="bg-gray-900 rounded-lg p-4 border border-purple-600">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="text-green-400" size={16} />
                  <span className="font-medium text-white">Automation Tasks</span>
                </div>
                <div className="text-sm text-gray-300 space-y-1">
                  <div>🎯 Take Profit: <span className="font-mono text-purple-400">
                    {results.automation.takeProfitTaskId}
                  </span></div>
                  <div>🛡️ Stop Loss: <span className="font-mono text-purple-400">
                    {results.automation.stopLossTaskId}
                  </span></div>
                </div>
              </div>
            )}

            {/* Error */}
            {results.error && (
              <div className="bg-gray-900 rounded-lg p-4 border border-red-600">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="text-red-400" size={16} />
                  <span className="font-medium text-white">Error</span>
                </div>
                <div className="text-sm text-red-400">
                  {results.error}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
          <h4 className="font-medium text-blue-400 mb-2">Testing Instructions</h4>
          <div className="text-sm text-gray-300 space-y-2">
            <div><strong>Real API Test:</strong> Tests actual Supra endpoints (may fail without live contract)</div>
            <div><strong>Simulation Test:</strong> Tests automation structure and logic</div>
            <div><strong>Check Console:</strong> Open browser console for detailed logs</div>
            <div><strong>Next:</strong> Test trade execution with automation in main app</div>
          </div>
        </div>
      </div>
      </CardContent>
    </Card>
  )
} 