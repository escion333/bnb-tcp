import { useState } from 'react'
import { useAccount } from 'wagmi'
import { testDatabaseConnection, testDatabaseSchema } from './utils/test-db'
import { WalletConnect } from './components/WalletConnect'
import { PriceWidget } from './components/PriceWidget'
import { TradeIdeaCard } from './components/TradeIdeaCard'
import { TradeHistory } from './components/TradeHistory'
// import { TestSupraAutomation } from './components/TestSupraAutomation'
import { ToastContainer } from './components/ui'
import { useTradeIdeas } from './hooks/useTradeIdeas'
import { useToast } from './components/ui/Toast'
import { usePriceData } from './hooks/usePriceData'
import './App.css'

// Make test functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testDB = {
    connection: testDatabaseConnection,
    schema: testDatabaseSchema,
  };
}

function App() {
  const [dbStatus, setDbStatus] = useState<string>('Not tested')
  const { address, isConnected } = useAccount()
  const { toasts, dismissToast } = useToast()
  const { priceData } = usePriceData()
  const tradeIdeas = useTradeIdeas(address)

  const handleTestDB = async () => {
    setDbStatus('Testing...')
    const connectionResult = await testDatabaseConnection()
    const schemaResult = await testDatabaseSchema()
    
    if (connectionResult && schemaResult.length > 0) {
      setDbStatus('✅ Database connected and ready!')
    } else {
      setDbStatus('❌ Database connection failed')
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-400">
            🚀 DeFi Trading Co-Pilot
          </h1>
          <div className="flex items-center space-x-4 text-sm">
            <div className="text-gray-400">
              BSC Network • Phase 1.2 In Progress
            </div>
            {isConnected && (
              <div className="bg-green-600 px-3 py-1 rounded-full text-xs font-medium">
                🔗 {formatAddress(address || '')}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Database Status Card */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">
              📊 Database Status
            </h3>
            <p className="text-gray-300 mb-4">
              Status: <span className="font-mono">{dbStatus}</span>
            </p>
            <button 
              onClick={handleTestDB}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white transition-colors"
            >
              Test Database
            </button>
            <div className="mt-4 text-sm text-gray-400">
              <p>Console commands:</p>
              <code className="block mt-1 text-xs bg-gray-900 p-2 rounded">
                testDB.connection()<br/>
                testDB.schema()
              </code>
            </div>
          </div>

          {/* Wallet Connection - Now Active */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <WalletConnect />
          </div>

          {/* Price Feed - Now Active */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <PriceWidget />
          </div>



          {/* AI Trade Ideas - Now Active! */}
          <div className="lg:col-span-2">
            <TradeIdeaCard
              tradeIdea={tradeIdeas.currentIdea}
              isLoading={tradeIdeas.isLoading}
              onGenerate={() => {
                const currentPrice = priceData?.price || 623.20
                console.log('🤖 Generating trade idea with Supra Oracle price:', currentPrice)
                tradeIdeas.generateNewIdea('WBNB/USDT', currentPrice)
              }}
              onAction={tradeIdeas.handleTradeAction}
            />
          </div>

          {/* Settings (Coming Soon) */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 opacity-50">
            <h3 className="text-lg font-semibold mb-4 text-gray-400">
              ⚙️ Settings
            </h3>
            <p className="text-gray-400 mb-4">
              Configuration panel coming soon...
            </p>
          </div>

        </div>

        {/* Trade History - Full Width */}
        <div className="mt-6">
          <TradeHistory />
        </div>

        <div className="mt-8 text-center text-gray-400">
          <p className="mb-2">🤖 <strong>Phase 3 Active!</strong> AI Trade Copilot is live.</p>
          <p className="text-sm">Generate intelligent trade recommendations powered by OpenAI</p>
        </div>
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

export default App
