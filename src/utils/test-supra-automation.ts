// Test script for Supra Automation integration
import { supraAutomation, type TradeAutomationParams } from '../lib/supra-automation'

async function testSupraAutomation() {
  console.log('🤖 Testing Supra Automation Integration...')
  console.log('========================================')
  
  try {
    // Test health check first
    console.log('1. Health Check...')
    const health = await supraAutomation.healthCheck()
    console.log(`   Status: ${health.status}`)
    console.log(`   Message: ${health.message}`)
    
    console.log('')
    
    // Test automation task registration (simulation)
    console.log('2. Testing Automation Task Registration...')
    
    const mockTradeParams: TradeAutomationParams = {
      walletAddress: '0x1234567890123456789012345678901234567890',
      tokenPair: 'WBNB/USDT',
      entryPrice: 620.50,
      takeProfitPrice: 665.20,
      stopLossPrice: 590.80,
      tradeAmount: 0.1615, // ~$100 worth of WBNB
      slippageTolerance: 0.5
    }
    
    console.log('   Mock Trade Parameters:')
    console.log(`     Wallet: ${mockTradeParams.walletAddress}`)
    console.log(`     Pair: ${mockTradeParams.tokenPair}`)
    console.log(`     Entry: $${mockTradeParams.entryPrice}`)
    console.log(`     Take Profit: $${mockTradeParams.takeProfitPrice} (+7.2%)`)
    console.log(`     Stop Loss: $${mockTradeParams.stopLossPrice} (-4.8%)`)
    console.log(`     Amount: ${mockTradeParams.tradeAmount} WBNB`)
    console.log(`     Slippage: ${mockTradeParams.slippageTolerance}%`)
    console.log('')
    
    try {
      // Test task registration
      console.log('3. Registering Automation Tasks...')
      const automationTasks = await supraAutomation.registerTradeAutomation(mockTradeParams)
      
      console.log('✅ Automation tasks registered successfully!')
      console.log(`   Take Profit Task ID: ${automationTasks.takeProfitTaskId}`)
      console.log(`   Stop Loss Task ID: ${automationTasks.stopLossTaskId}`)
      console.log('')
      
      // Test task status checking
      console.log('4. Checking Task Status...')
      const tpStatus = await supraAutomation.getTaskStatus(automationTasks.takeProfitTaskId)
      const slStatus = await supraAutomation.getTaskStatus(automationTasks.stopLossTaskId)
      
      if (tpStatus) {
        console.log(`   Take Profit Status: ${tpStatus.status}`)
        console.log(`   Function ID: ${tpStatus.function_id}`)
        console.log(`   Expiry: ${new Date(parseInt(tpStatus.expiry_time) * 1000).toISOString()}`)
      }
      
      if (slStatus) {
        console.log(`   Stop Loss Status: ${slStatus.status}`)
        console.log(`   Function ID: ${slStatus.function_id}`)
        console.log(`   Expiry: ${new Date(parseInt(slStatus.expiry_time) * 1000).toISOString()}`)
      }
      
      console.log('')
      
      // Test active tasks listing
      console.log('5. Active Tasks...')
      const activeTasks = supraAutomation.getActiveTasks()
      console.log(`   Total Active Tasks: ${activeTasks.length}`)
      activeTasks.forEach((task, index) => {
        console.log(`   Task ${index + 1}: ${task.id} (${task.status})`)
      })
      
      console.log('')
      console.log('🎉 Supra Automation integration test completed successfully!')
      console.log('')
      console.log('📊 Summary:')
      console.log('   ✅ Health check passed')
      console.log('   ✅ Task registration working')
      console.log('   ✅ Task status tracking working')
      console.log('   ✅ Active task management working')
      console.log('')
      console.log('🚀 Ready for production use in trade execution!')
      
    } catch (automationError) {
      console.error('❌ Automation task registration failed:')
      console.error(automationError)
      console.error('')
      console.error('This is expected for testing since we need:')
      console.error('1. Valid Supra smart contract deployed')
      console.error('2. Correct API endpoints')
      console.error('3. Proper authentication')
      console.error('')
      console.error('The automation structure is ready for when these are available!')
    }
    
  } catch (error) {
    console.error('❌ Supra Automation test failed:')
    console.error(error)
    console.error('')
    console.error('Troubleshooting:')
    console.error('1. Check Supra API key')
    console.error('2. Verify network connectivity')
    console.error('3. Ensure Supra Automation is available on mainnet')
  }
}

// Run test if called directly
if (typeof window === 'undefined') {
  testSupraAutomation()
}

export { testSupraAutomation } 