// Test script for Supra Automation integration
import { supraAutomation } from '../src/lib/supra-automation'

async function testSupraAutomation() {
  console.log('🤖 Testing Supra Automation Integration...')
  console.log('=====================================')
  
  try {
    // Test health check first
    console.log('1. Health Check...')
    const health = await supraAutomation.healthCheck()
    console.log(`   Status: ${health.status}`)
    console.log(`   Message: ${health.message}`)
    
    if (health.status === 'error') {
      console.error('❌ Health check failed. Stopping test.')
      return
    }
    
    console.log('✅ Health check passed!')
    console.log('')
    
    // Test automation simulation
    console.log('2. Testing Trade Automation Simulation...')
    const mockParams = {
      walletAddress: '0x1234567890123456789012345678901234567890',
      tokenPair: 'WBNB/USDT',
      entryPrice: 635.50,
      takeProfitPrice: 665.20,
      stopLossPrice: 615.80,
      tradeAmount: 1.0,
      slippageTolerance: 2.0
    }
    
    const simulation = await supraAutomation.simulateTradeAutomation(mockParams)
    
    console.log('✅ Automation simulation completed!')
    console.log(`   Take Profit: ${simulation.takeProfitSimulation.success ? '✅' : '❌'} ${simulation.takeProfitSimulation.estimatedGas} gas`)
    console.log(`   Stop Loss: ${simulation.stopLossSimulation.success ? '✅' : '❌'} ${simulation.stopLossSimulation.estimatedGas} gas`)
    console.log(`   Total Gas: ${simulation.totalEstimatedGas}`)
    console.log(`   Total Fee: ${simulation.totalEstimatedFee}`)
    
    console.log('')
    console.log('🎉 Supra Automation integration test successful!')
    console.log('Ready for production use!')
    
  } catch (error) {
    console.error('❌ Supra Automation test failed:')
    console.error(error)
    console.error('')
    console.error('Troubleshooting:')
    console.error('1. Check network connection')
    console.error('2. Verify Supra API key is configured')
    console.error('3. Ensure automation endpoints are accessible')
  }
}

// For use in browser console
if (typeof window !== 'undefined') {
  (window as any).testSupraAutomation = testSupraAutomation
}

export { testSupraAutomation } 